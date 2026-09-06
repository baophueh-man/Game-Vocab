const fs = require('fs');
let code = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');

code = code.replace(
  "const getGeminiTTSAudio = async (text: string, voice: string, lang: 'en' | 'vi'): Promise<string | null> => {",
  "const getGeminiTTSAudio = async (text: string, voice: string, lang: 'en' | 'vi', forceFallback: boolean = false): Promise<string | null> => {"
);

code = code.replace(
  "const cacheKey = \`\${text.trim().toLowerCase()}_\${voice}_\${lang}_\${speedLabel}\`;",
  "const cacheKey = \`\${text.trim().toLowerCase()}_\${voice}_\${lang}_\${speedLabel}_\${forceFallback}\`;"
);

code = code.replace(
  "body: JSON.stringify({ text, voice, speed: speedLabel, lang })",
  "body: JSON.stringify({ text, voice, speed: speedLabel, lang, forceFallback })"
);

code = code.replace(
  /const fallbackUrl = \`https:\/\/translate\.google\.com\/translate_tts\?ie=UTF-8&tl=([a-z]+)&client=tw-ob&q=\$\{encodeURIComponent\(text\)\}\`;\s+return playAudioUrl\(fallbackUrl, count\);/g,
  "const fallbackAudio = await getGeminiTTSAudio(text, 'Kore', '$1', true);\n        if (fallbackAudio) return playAudioUrl(fallbackAudio, count);\n        return;"
);

// We should also replace the custom audio priority. Currently it's checking \`if (audioUrl.startsWith('firestore://audioFiles/'))\` but actually it might just be \`firestore://\` or we should just try to get it. Let's see how it's saved.
fs.writeFileSync('src/contexts/SettingsContext.tsx', code);
