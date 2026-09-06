const fs = require('fs');
let code = fs.readFileSync('src/contexts/SettingsContext.tsx', 'utf8');

code = code.replace(
  "if (audioUrl.startsWith('firestore://audioFiles/')) {",
  "if (audioUrl.startsWith('firestore://')) {"
);

code = code.replace(
  "if (viAudioUrl.startsWith('firestore://audioFiles/')) {",
  "if (viAudioUrl.startsWith('firestore://')) {"
);

fs.writeFileSync('src/contexts/SettingsContext.tsx', code);
