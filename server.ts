process.env.NODE_ENV = 'production';
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Modality } from "@google/genai";

process.on('exit', (code) => {
  console.log(`[Process Exit] code=${code}`);
});
process.on('uncaughtException', (err) => {
  console.log('[Uncaught Exception]', err);
});
process.on('unhandledRejection', (reason) => {
  console.log('[Unhandled Rejection]', reason);
});

function pcmBase64ToWavBase64(base64Pcm: string, sampleRate: number = 24000): string | null {
  if (!base64Pcm || typeof base64Pcm !== 'string') return null;
  const pcmData = Buffer.from(base64Pcm, 'base64');
  if (pcmData.length === 0) return null;

  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;

  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + dataSize, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitsPerSample, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(dataSize, 40);

  const wavBuffer = Buffer.concat([wavHeader, pcmData]);
  return `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
}

async function getFallbackAudioUrl(text: string, lang: string = 'vi'): Promise<string | null> {
  const targetLang = lang === 'en' ? 'en' : 'vi';
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${targetLang}&client=tw-ob&q=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > 100 && (contentType.includes('audio') || contentType.includes('octet-stream') || !contentType.includes('text/html'))) {
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return `data:audio/mpeg;base64,${base64}`;
      }
    }
  } catch (err) {
    console.warn('Fallback TTS fetch failed:', err);
  }
  return null;
}

// In-memory cache for generated TTS audio to prevent redundant API calls
const ttsAudioCache = new Map<string, { audioUrl: string; source: string; voice: string }>();
const MAX_CACHE_SIZE = 200;

// Track temporary Gemini rate-limit cooldown to avoid hitting quota repeatedly
let geminiCooldownUntil = 0;

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3005;

  app.use(express.json({ limit: '10mb' }));

  // API Health Endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- Auto-Shutdown on Browser Tab Close ---
  const activeTabs = new Map<string, number>();
  const SERVER_START_TIME = Date.now();
  const INITIAL_GRACE_PERIOD_MS = 25000; // 25s cho phép trình duyệt mở và nạp trang lần đầu
  const TAB_TIMEOUT_MS = 6000; // Tab không gửi ping quá 6s sẽ coi là đã đóng
  let hasConnectedAtLeastOnce = false;
  let lastHeartbeatTime = Date.now();

  app.all("/api/heartbeat", (req, res) => {
    const tabId = req.body?.tabId || req.query?.tabId;
    if (tabId && typeof tabId === "string") {
      activeTabs.set(tabId, Date.now());
      hasConnectedAtLeastOnce = true;
      lastHeartbeatTime = Date.now();
    }
    res.json({ status: "alive", activeTabsCount: activeTabs.size });
  });

  app.all("/api/heartbeat/close", (req, res) => {
    const tabId = req.body?.tabId || req.query?.tabId;
    if (tabId && typeof tabId === "string") {
      activeTabs.delete(tabId);
    }
    res.json({ status: "closed", activeTabsCount: activeTabs.size });
  });

  // Kiểm tra định kỳ mỗi 2 giây để tự động tắt máy chủ khi không còn tab nào mở
  if (process.env.DISABLE_AUTO_SHUTDOWN !== 'true') {
    const shutdownInterval = setInterval(() => {
      const now = Date.now();

      // Dọn dẹp các tab không còn gửi heartbeat quá 6 giây
      for (const [id, lastTime] of activeTabs.entries()) {
        if (now - lastTime > TAB_TIMEOUT_MS) {
          activeTabs.delete(id);
        }
      }

      if (hasConnectedAtLeastOnce) {
        // Đã từng có tab kết nối, nhưng hiện tại tất cả đã đóng và im lặng quá 30s
        if (activeTabs.size === 0 && (now - lastHeartbeatTime > 30000)) {
          console.log("[Auto-Shutdown] Tat ca tab trinh duyet da dong. Tu dong tat may chu de giai phong tai nguyen...");
          clearInterval(shutdownInterval);
          process.exit(0);
        }
      } else {
        // Quá 35 giây mà chưa có bất kỳ trình duyệt nào kết nối
        if (now - SERVER_START_TIME > INITIAL_GRACE_PERIOD_MS + 10000) {
          console.log("[Auto-Shutdown] Khong co trinh duyet nao ket noi sau 35s. Tu dong tat may chu...");
          clearInterval(shutdownInterval);
          process.exit(0);
        }
      }
    }, 2000);
  }

  // Proxy Image Endpoint to bypass CORS
  app.get("/api/proxy-image", async (req, res) => {
    let imageUrl = req.query.url as string;
    if (!imageUrl) {
      res.status(400).json({ error: "Missing url parameter" });
      return;
    }
    
    // Auto prefix relative yourhomework images
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      if (imageUrl.startsWith('/')) {
        imageUrl = `https://yourhomework.net${imageUrl}`;
      } else {
        imageUrl = `https://yourhomework.net/yhw/f/yhw-voca/${imageUrl}`;
      }
    }

    try {
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      
      const buffer = await response.arrayBuffer();
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Content-Type', contentType);
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Image proxy error:', error);
      res.status(500).json({ error: "Failed to fetch image" });
    }
  });

  // Fetch Vocab from YourHomework
  app.all(["/api/fetch-vocab", "/api/yourhomework/vocab/:id?"], async (req, res) => {
    let input = (req.params.id || req.query.url || req.query.id || req.body?.url || req.body?.id || '') as string;
    input = input.trim();

    if (!input) {
      res.status(400).json({ error: "Vui lòng cung cấp link hoặc ID bài học YourHomework." });
      return;
    }

    // Extract ID from link or raw ID
    let vocabId = '';
    const matchId = input.match(/(\d{8,12})/);
    if (matchId) {
      vocabId = matchId[1];
    } else {
      res.status(400).json({ error: "Không tìm thấy ID bài học hợp lệ trong link." });
      return;
    }

    try {
      const targetUrl = `https://yourhomework.net/api/v1/vocab/${vocabId}/activity-data`;
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Không thể nạp dữ liệu từ YourHomework: HTTP ${response.status}`);
      }

      const data = await response.json();
      const items = Array.isArray(data.items) ? data.items : [];

      const words = items.map((item: any, idx: number) => {
        let img = item.imageUrl || '';
        let fullImageUrl = '';
        if (img) {
          if (img.startsWith('http://') || img.startsWith('https://')) {
            fullImageUrl = img;
          } else if (img.startsWith('/')) {
            fullImageUrl = `https://yourhomework.net${img}`;
          } else {
            fullImageUrl = `https://yourhomework.net/yhw/f/yhw-voca/${img}`;
          }
        }

        return {
          id: `w-${idx + 1}-${Date.now()}`,
          term: (item.word || '').trim(),
          definition: (item.meaning || '').trim(),
          phonetic: (item.phonetic || '').trim(),
          imageUrl: fullImageUrl,
          rawImage: img
        };
      });

      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json({
        success: true,
        vocabId: data.vocabId || vocabId,
        publicId: data.publicId || vocabId,
        title: data.vocabTitle || `Bài học ${vocabId}`,
        description: data.vocabDescription || '',
        sourceLang: data.sourceLangValue || 'en',
        count: words.length,
        words
      });
    } catch (error: any) {
      console.error('Fetch vocab error:', error);
      res.status(500).json({ error: error.message || 'Lỗi khi tải dữ liệu bài học.' });
    }
  });

  app.post("/api/generate-definitions", async (req, res) => {
    const { terms } = req.body;
    if (!terms || !Array.isArray(terms)) {
      res.status(400).json({ error: "Missing terms array" });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Translate the following English words into Vietnamese. Return ONLY a valid JSON array of strings containing the translations in the exact same order. No markdown, no code blocks, no explanations, just the raw JSON array.
      
Words: ${JSON.stringify(terms)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      let responseText = response.text || "[]";
      responseText = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      
      const translations = JSON.parse(responseText);
      res.json({ translations });
    } catch (error: any) {
      console.error("Definition generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate definitions" });
    }
  });

  app.post("/api/generate-text", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
      });

      res.json({ text: response.text || "" });
    } catch (error: any) {
      console.error("Text generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate text" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    const { prompt } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("Missing GEMINI_API_KEY");
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let base64Data = '';
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          base64Data = part.inlineData.data;
          break;
        }
      }

      if (base64Data) {
        res.json({ imageBase64: base64Data });
      } else {
        res.status(500).json({ error: "No image data returned from AI" });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || "Failed to generate image" });
    }
  });

  // Server-Side Gemini TTS Endpoint with Caching & Automatic Fallback
  app.post("/api/tts", async (req, res) => {
    const { text, voice = 'Kore', speed = 'normal', lang = 'vi', forceFallback = false } = req.body || {};

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Text is required' });
      return;
    }

    const cleanText = text.trim();
    const validVoices = ['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'];
    const usedVoice = validVoices.includes(voice) ? voice : 'Kore';
    const cacheKey = `${cleanText.toLowerCase()}_${usedVoice}_${speed}_${lang}_${forceFallback}`;

    // Return from cache if available
    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      res.json({
        success: true,
        audioUrl: cached.audioUrl,
        voice: cached.voice,
        source: cached.source,
        text: cleanText,
        cached: true
      });
      return;
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      let audioUrl: string | null = null;
      let source = 'gemini';

      // Only attempt Gemini API if key is present and not currently in rate-limit cooldown
      const now = Date.now();
      if (!forceFallback && apiKey && now >= geminiCooldownUntil) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            headers: {
              'User-Agent': 'aistudio-build',
            }
          }
        });

        let promptText = cleanText;
        if (speed === 'slow') {
          promptText = `Speak slowly and clearly: ${promptText}`;
        } else if (speed === 'fast') {
          promptText = `Speak quickly: ${promptText}`;
        }

        const modelsToTry = ["gemini-3.1-flash-tts-preview", "gemini-2.5-flash-preview-tts"];
        for (const modelName of modelsToTry) {
          try {
            const response = await ai.models.generateContent({
              model: modelName,
              contents: [{ parts: [{ text: promptText }] }],
              config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: usedVoice },
                  },
                },
              },
            });

            const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
              const generatedWav = pcmBase64ToWavBase64(base64Audio, 24000);
              if (generatedWav) {
                audioUrl = generatedWav;
                source = 'gemini';
                break;
              }
            }
          } catch (mErr: any) {
            const errMsg = String(mErr?.message || mErr);
            if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('RESOURCE_EXHAUSTED')) {
              geminiCooldownUntil = Date.now() + 15000;
              console.log(`[TTS] Gemini model ${modelName} hit quota. Cooldown active for 15s. Switching to fallback audio.`);
              break;
            } else {
              console.log(`[TTS] Gemini model ${modelName} error:`, mErr?.message || mErr);
            }
          }
        }
      }

      // If Gemini TTS is on cooldown, at quota limit, or failed, seamlessly fallback
      if (!audioUrl) {
        audioUrl = await getFallbackAudioUrl(cleanText, lang);
        if (!audioUrl) throw new Error('Fallback failed');
        source = 'fallback';
      }

      // Store in memory cache
      if (ttsAudioCache.size >= MAX_CACHE_SIZE) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, { audioUrl, source, voice: usedVoice });

      res.json({
        success: true,
        audioUrl,
        voice: usedVoice,
        source,
        text: cleanText
      });
    } catch (error: any) {
      try {
        const fallbackUrl = await getFallbackAudioUrl(cleanText, lang);
        if (!fallbackUrl) throw new Error('Complete TTS failure');
        res.json({
          success: true,
          audioUrl: fallbackUrl,
          voice: usedVoice,
          source: 'fallback',
          text: cleanText
        });
      } catch (finalErr) {
        res.status(500).json({ error: 'TTS_GENERATION_FAILED', message: 'Failed to generate audio' });
      }
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/.agents/**', '**/.git/**', '**/dist/**', '**/.system_generated/**', '**/*.log']
        }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
