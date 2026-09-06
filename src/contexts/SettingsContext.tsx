import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getAudioFile } from '../lib/storage';

export type TTSSourceMode = 'auto' | 'gemini' | 'device';

interface SettingsContextType {
  // TTS Source & Voice settings
  ttsSource: TTSSourceMode;
  setTtsSource: (source: TTSSourceMode) => void;
  enVoice: string;
  setEnVoice: (voice: string) => void;
  vnVoice: string;
  setVnVoice: (voice: string) => void;
  enGeminiVoice: string;
  setEnGeminiVoice: (voice: string) => void;
  viGeminiVoice: string;
  setViGeminiVoice: (voice: string) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  enVoices: SpeechSynthesisVoice[];
  vnVoices: SpeechSynthesisVoice[];
  speakEn: (text: string, audioUrl?: string, count?: number) => Promise<void>;
  speakVn: (text: string, viAudioUrl?: string, count?: number) => Promise<void>;
  cancelSpeech: () => void;
  isChildLocked: boolean;
  setIsChildLocked: (locked: boolean) => void;
  reduceMotion: boolean;
  setReduceMotion: (reduce: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Client-side in-memory cache for generated TTS audio to prevent duplicate network requests
const ttsAudioCache = new Map<string, string>();

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [ttsSource, setTtsSourceState] = useState<TTSSourceMode>(
    (localStorage.getItem('vocagame_tts_source') as TTSSourceMode) || 'auto'
  );
  const [enVoice, setEnVoice] = useState<string>(localStorage.getItem('vocagame_en_voice') || '');
  const [vnVoice, setVnVoice] = useState<string>(localStorage.getItem('vocagame_vn_voice') || '');
  const [enGeminiVoice, setEnGeminiVoiceState] = useState<string>(localStorage.getItem('vocagame_en_gemini_voice') || 'Charon');
  const [viGeminiVoice, setViGeminiVoiceState] = useState<string>(localStorage.getItem('vocagame_vi_gemini_voice') || 'Kore');
  const [speechRate, setSpeechRate] = useState<number>(parseFloat(localStorage.getItem('vocagame_speech_rate') || '1'));
  const [isChildLocked, setIsChildLocked] = useState<boolean>(false);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(() => {
    const saved = localStorage.getItem('vocagame_reduce_motion');
    if (saved !== null) return saved === 'true';
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });
  
  const [enVoices, setEnVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [vnVoices, setVnVoices] = useState<SpeechSynthesisVoice[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const setReduceMotion = (reduce: boolean) => {
    setReduceMotionState(reduce);
    localStorage.setItem('vocagame_reduce_motion', reduce.toString());
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (reduceMotion) {
        document.documentElement.classList.add('reduce-motion');
        document.body.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
        document.body.classList.remove('reduce-motion');
      }
    }
  }, [reduceMotion]);

  const setTtsSource = (source: TTSSourceMode) => {
    setTtsSourceState(source);
    localStorage.setItem('vocagame_tts_source', source);
  };

  const setEnGeminiVoice = (voice: string) => {
    setEnGeminiVoiceState(voice);
    localStorage.setItem('vocagame_en_gemini_voice', voice);
  };

  const setViGeminiVoice = (voice: string) => {
    setViGeminiVoiceState(voice);
    localStorage.setItem('vocagame_vi_gemini_voice', voice);
  };

  useEffect(() => {
    localStorage.setItem('vocagame_en_voice', enVoice);
  }, [enVoice]);

  useEffect(() => {
    localStorage.setItem('vocagame_vn_voice', vnVoice);
  }, [vnVoice]);

  useEffect(() => {
    localStorage.setItem('vocagame_speech_rate', speechRate.toString());
  }, [speechRate]);

  useEffect(() => {
    const loadVoices = () => {
      if (!('speechSynthesis' in window)) return;
      const availableVoices = window.speechSynthesis.getVoices();
      
      const en = availableVoices.filter(v => 
        v.lang === 'en-US' || v.lang === 'en-GB' || 
        v.lang.startsWith('en-US') || v.lang.startsWith('en-GB') ||
        v.lang.toLowerCase().includes('en')
      );
      
      en.sort((a, b) => {
        const aIsUS = a.lang.includes('US');
        const bIsUS = b.lang.includes('US');
        if (aIsUS && !bIsUS) return -1;
        if (!aIsUS && bIsUS) return 1;
        return a.name.localeCompare(b.name);
      });

      const vn = availableVoices.filter(v => 
        v.lang.includes('vi-VN') || v.lang.includes('vi') || v.lang.startsWith('vi')
      );

      setEnVoices(en);
      setVnVoices(vn);

      if (en.length > 0 && !enVoice) {
        setEnVoice(en.find(v => v.lang.includes('en-US'))?.name || en[0].name);
      }
      if (vn.length > 0 && !vnVoice) {
        setVnVoice(vn[0].name);
      }
    };

    loadVoices();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const cancelSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
  };

  // Helper to fetch Gemini TTS with client-side caching
  const getGeminiTTSAudio = async (text: string, voice: string, lang: 'en' | 'vi', forceFallback: boolean = false): Promise<string | null> => {
    const speedLabel = speechRate < 0.85 ? 'slow' : speechRate > 1.25 ? 'fast' : 'normal';
    const cacheKey = `${text.trim().toLowerCase()}_${voice}_${lang}_${speedLabel}_${forceFallback}`;

    if (ttsAudioCache.has(cacheKey)) {
      return ttsAudioCache.get(cacheKey)!;
    }

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice, speed: speedLabel, lang, forceFallback })
      });

      if (!res.ok) {
        return null;
      }

      const data = await res.json();
      if (data.audioUrl && typeof data.audioUrl === 'string' && data.audioUrl.length > 20) {
        ttsAudioCache.set(cacheKey, data.audioUrl);
        return data.audioUrl;
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  // Helper to play an audio URL repeatedly for count times with reliable boolean resolution
  const playAudioUrl = (audioUrl: string, count: number): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!audioUrl || typeof audioUrl !== 'string' || !audioUrl.trim() || audioUrl === 'undefined' || audioUrl === 'null') {
        resolve(false);
        return;
      }

      try {
        const audio = new Audio();
        currentAudioRef.current = audio;
        audio.playbackRate = speechRate;

        let isSettled = false;
        const settle = (success: boolean) => {
          if (!isSettled) {
            isSettled = true;
            resolve(success);
          }
        };

        let played = 1;
        audio.onended = () => {
          if (played < count && currentAudioRef.current === audio) {
            played++;
            audio.currentTime = 0;
            audio.play().catch(() => {
              settle(true); // First iteration succeeded
            });
          } else {
            settle(true);
          }
        };

        audio.onerror = () => {
          settle(false);
        };

        audio.src = audioUrl;
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            settle(false);
          });
        }
      } catch (err) {
        resolve(false);
      }
    });
  };

  // Helper to play via Web Speech API
  const playDeviceSpeech = (text: string, voiceName: string, voicesList: SpeechSynthesisVoice[], count: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        // Resume synthesis if suspended
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (e) {}

      let played = 0;
      const speakNext = () => {
        if (played >= count) {
          resolve();
          return;
        }

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = speechRate;
        
        if (voiceName && voicesList.length > 0) {
          const voice = voicesList.find(v => v.name === voiceName);
          if (voice) utterance.voice = voice;
        }

        utterance.onend = () => {
          played++;
          if (played < count) {
            setTimeout(speakNext, 250);
          } else {
            resolve();
          }
        };
        utterance.onerror = () => resolve();

        try {
          window.speechSynthesis.speak(utterance);
        } catch (e) {
          resolve();
        }
      };

      speakNext();
    });
  };

  const isMobileOrTablet = () => {
    if (typeof window === 'undefined') return false;
    const ua = navigator.userAgent || '';
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    return isMobileUA || (isTouch && window.innerWidth <= 1024);
  };

  const speakEn = async (text: string, audioUrl?: string, count: number = 1): Promise<void> => {
    cancelSpeech();
    if (!text || !text.trim()) return;

    // 1. If custom audio URL is provided and valid
    if (audioUrl && typeof audioUrl === 'string' && audioUrl.trim() && audioUrl !== 'undefined' && audioUrl !== 'null') {
      let finalAudioUrl = audioUrl;
      if (audioUrl.startsWith('firestore://')) {
        const id = audioUrl.split('/').pop();
        if (id) {
          try {
            const base64Data = await getAudioFile(id);
            if (base64Data) {
              finalAudioUrl = base64Data;
            }
          } catch (e) {
            console.warn('Firestore audio fetch failed, falling back:', e);
          }
        }
      }
      
      const success = await playAudioUrl(finalAudioUrl, count);
      if (success) return;
      // If custom audio failed to load or play, fall through to TTS seamlessly
    }

    // 2. Decide speech source
    let mode = ttsSource;
    if (mode === 'auto') {
      if (enVoices.length === 0) {
        mode = 'gemini';
      } else {
        mode = 'device';
      }
    }

    if (mode === 'gemini') {
      const geminiAudio = await getGeminiTTSAudio(text, enGeminiVoice, 'en');
      if (geminiAudio) {
        const success = await playAudioUrl(geminiAudio, count);
        if (success) return;
      }
      return playDeviceSpeech(text, enVoice, enVoices, count);
    } else {
      return playDeviceSpeech(text, enVoice, enVoices, count);
    }
  };

  const speakVn = async (text: string, viAudioUrl?: string, count: number = 1): Promise<void> => {
    cancelSpeech();
    if (!text || !text.trim()) return;

    // 1. If custom audio URL is provided and valid
    if (viAudioUrl && typeof viAudioUrl === 'string' && viAudioUrl.trim() && viAudioUrl !== 'undefined' && viAudioUrl !== 'null') {
      let finalAudioUrl = viAudioUrl;
      if (viAudioUrl.startsWith('firestore://')) {
        const id = viAudioUrl.split('/').pop();
        if (id) {
          try {
            const base64Data = await getAudioFile(id);
            if (base64Data) {
              finalAudioUrl = base64Data;
            }
          } catch (e) {
            console.warn('Firestore audio fetch failed, falling back:', e);
          }
        }
      }
      
      const success = await playAudioUrl(finalAudioUrl, count);
      if (success) return;
      // If custom audio failed to load or play, fall through to TTS seamlessly
    }

    // 2. Decide speech source
    let mode = ttsSource;
    if (mode === 'auto') {
      if (isMobileOrTablet() || vnVoices.length === 0 || !vnVoice) {
        mode = 'gemini';
      } else {
        mode = 'device';
      }
    }

    if (mode === 'gemini') {
      const geminiAudio = await getGeminiTTSAudio(text, viGeminiVoice, 'vi');
      if (geminiAudio) {
        const success = await playAudioUrl(geminiAudio, count);
        if (success) return;
      }
      
      if (vnVoices.length > 0 && vnVoice) {
        return playDeviceSpeech(text, vnVoice, vnVoices, count);
      } else {
        const fallbackAudio = await getGeminiTTSAudio(text, 'Kore', 'vi', true);
        if (fallbackAudio) {
          const success = await playAudioUrl(fallbackAudio, count);
          if (success) return;
        }
        return playDeviceSpeech(text, vnVoice, vnVoices, count);
      }
    } else {
      if (vnVoices.length > 0 && vnVoice) {
        return playDeviceSpeech(text, vnVoice, vnVoices, count);
      } else {
        const geminiAudio = await getGeminiTTSAudio(text, viGeminiVoice, 'vi');
        if (geminiAudio) {
          const success = await playAudioUrl(geminiAudio, count);
          if (success) return;
        }
        return playDeviceSpeech(text, vnVoice, vnVoices, count);
      }
    }
  };

  return (
    <SettingsContext.Provider value={{
      ttsSource, setTtsSource,
      enVoice, setEnVoice,
      vnVoice, setVnVoice,
      enGeminiVoice, setEnGeminiVoice,
      viGeminiVoice, setViGeminiVoice,
      speechRate, setSpeechRate,
      enVoices, vnVoices,
      speakEn, speakVn, cancelSpeech,
      isChildLocked, setIsChildLocked,
      reduceMotion, setReduceMotion
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
