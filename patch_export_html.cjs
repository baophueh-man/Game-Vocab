const fs = require('fs');
let code = fs.readFileSync('src/pages/Editor.tsx', 'utf8');

const handleExportHtml = `
  const handleExportHtml = async () => {
    const validWords = words.filter(w => w.term.trim() || w.definition.trim());
    if (validWords.length === 0) {
      alert('Không có từ vựng nào để xuất.');
      return;
    }

    try {
      setIsAutoFilling(true);
      
      let cardsHtml = '';
      
      for (const word of validWords) {
        // Resolve Image
        let imgSrc = '';
        if (word.imageUrl) {
          if (word.imageUrl.startsWith('data:image')) {
            imgSrc = word.imageUrl;
          } else if (word.imageUrl.startsWith('firestore://')) {
            const id = word.imageUrl.split('/').pop();
            if (id) {
              const base64 = await getImageFile(id);
              if (base64) imgSrc = base64;
            }
          } else {
            imgSrc = word.imageUrl;
          }
        }
        
        // Resolve Audio EN
        let audioEnSrc = '';
        if (word.audioUrl) {
          if (word.audioUrl.startsWith('data:audio')) {
            audioEnSrc = word.audioUrl;
          } else if (word.audioUrl.startsWith('firestore://')) {
            const id = word.audioUrl.split('/').pop();
            if (id) {
              const base64 = await getAudioFile(id);
              if (base64) audioEnSrc = base64;
            }
          } else {
            audioEnSrc = word.audioUrl;
          }
        }
        
        // Resolve Audio VI
        let audioViSrc = '';
        if (word.viAudioUrl) {
          if (word.viAudioUrl.startsWith('data:audio')) {
            audioViSrc = word.viAudioUrl;
          } else if (word.viAudioUrl.startsWith('firestore://')) {
            const id = word.viAudioUrl.split('/').pop();
            if (id) {
              const base64 = await getAudioFile(id);
              if (base64) audioViSrc = base64;
            }
          } else {
            audioViSrc = word.viAudioUrl;
          }
        }
        
        cardsHtml += \`
          <div class="card">
            \${imgSrc ? \`<img src="\${imgSrc}" class="card-img" alt="\${word.term}">\` : \`<div class="card-img no-img">No Image</div>\`}
            <div class="card-content">
              <h2 class="term">\${word.term || ''}</h2>
              <p class="definition">\${word.definition || ''}</p>
            </div>
            \${(audioEnSrc || audioViSrc) ? \`
            <div class="audio-controls">
              \${audioEnSrc ? \`
                <button class="audio-btn" onclick="playAudio('audio_en_\${word.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  EN
                </button>
                <audio id="audio_en_\${word.id}" src="\${audioEnSrc}"></audio>
              \` : ''}
              \${audioViSrc ? \`
                <button class="audio-btn" onclick="playAudio('audio_vi_\${word.id}')">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
                  VI
                </button>
                <audio id="audio_vi_\${word.id}" src="\${audioViSrc}"></audio>
              \` : ''}
            </div>
            \` : ''}
          </div>
        \`;
      }
      
      const htmlTemplate = \`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>\${title || 'Flashcards'}</title>
<style>
  body { font-family: system-ui, -apple-system, sans-serif; background-color: #f8fafc; color: #0f172a; padding: 2rem; margin: 0; }
  .container { max-width: 1200px; margin: 0 auto; }
  .header { text-align: center; margin-bottom: 3rem; }
  .header h1 { font-size: 2.5rem; margin: 0 0 0.5rem 0; color: #0f172a; }
  .header p { font-size: 1.125rem; color: #64748b; margin: 0; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem; }
  .card { background: white; border-radius: 1rem; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s; }
  .card:hover { transform: translateY(-4px); }
  .card-img { width: 100%; height: 240px; object-fit: cover; background: #f1f5f9; }
  .card-img.no-img { display: flex; align-items: center; justify-content: center; color: #94a3b8; font-weight: 500; }
  .card-content { padding: 1.5rem; text-align: center; flex-grow: 1; }
  .term { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.5rem 0; color: #1e293b; }
  .definition { font-size: 1.25rem; color: #64748b; margin: 0; }
  .audio-controls { display: flex; justify-content: center; gap: 1rem; padding: 1.25rem; border-top: 1px solid #f1f5f9; background: #f8fafc; }
  .audio-btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 9999px; border: 1px solid #e2e8f0; background: white; color: #475569; cursor: pointer; font-size: 0.875rem; font-weight: 600; transition: all 0.2s; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05); }
  .audio-btn:hover { background: #f1f5f9; color: #0f172a; border-color: #cbd5e1; }
  .audio-btn:active { transform: scale(0.95); }
</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>\${title || 'Flashcards'}</h1>
      \${description ? \`<p>\${description}</p>\` : ''}
    </div>
    <div class="grid">
      \${cardsHtml}
    </div>
  </div>
  
  <script>
    function playAudio(id) {
      const audio = document.getElementById(id);
      if (audio) {
        audio.currentTime = 0;
        audio.play().catch(e => console.error("Audio play failed:", e));
      }
    }
  </script>
</body>
</html>\`;

      const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8' });
      saveAs(blob, title.trim() ? \`\${title.replace(/[^a-z0-9]/gi, '_')}.html\` : 'flashcards.html');
      
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Có lỗi xảy ra khi xuất HTML.');
    } finally {
      setIsAutoFilling(false);
    }
  };
`;

code = code.replace(
  'const handleExportExcel = () => {',
  handleExportHtml + '\n\n  const handleExportExcel = () => {'
);


// add export HTML button

const exportHtmlBtn = `
              <button
                onClick={handleExportHtml}
                disabled={isAutoFilling}
                className="text-xs bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-2.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors"
              >
                <Globe className="w-3.5 h-3.5 text-teal-600" />
                HTML
              </button>
`;

code = code.replace(
  /<button\s+onClick=\{handleExportExcel\}[\s\S]*?<\/button>/,
  match => exportHtmlBtn + '\n' + match
);

fs.writeFileSync('src/pages/Editor.tsx', code);
