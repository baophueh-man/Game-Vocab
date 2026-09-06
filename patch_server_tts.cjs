const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
  "const { text, voice = 'Kore', speed = 'normal', lang = 'vi' } = req.body || {};",
  "const { text, voice = 'Kore', speed = 'normal', lang = 'vi', forceFallback = false } = req.body || {};"
);

code = code.replace(
  "const cacheKey = \`\${cleanText.toLowerCase()}_\${usedVoice}_\${speed}_\${lang}\`;",
  "const cacheKey = \`\${cleanText.toLowerCase()}_\${usedVoice}_\${speed}_\${lang}_\${forceFallback}\`;"
);

code = code.replace(
  "if (apiKey && now >= geminiCooldownUntil) {",
  "if (!forceFallback && apiKey && now >= geminiCooldownUntil) {"
);

fs.writeFileSync('server.ts', code);
