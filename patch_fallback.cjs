const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "return url;",
  "return null;"
);

// We need to handle if getFallbackAudioUrl returns null
code = code.replace(
  "audioUrl = await getFallbackAudioUrl(cleanText, lang);",
  "audioUrl = await getFallbackAudioUrl(cleanText, lang);\n        if (!audioUrl) throw new Error('Fallback failed');"
);

code = code.replace(
  "const fallbackUrl = await getFallbackAudioUrl(cleanText, lang);\n        res.json({",
  "const fallbackUrl = await getFallbackAudioUrl(cleanText, lang);\n        if (!fallbackUrl) throw new Error('Complete TTS failure');\n        res.json({"
);

fs.writeFileSync('server.ts', code);
