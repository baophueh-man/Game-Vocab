import React, { useState } from 'react';
import { X, Loader2, Play, Mic, AlertTriangle } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { generateId } from '../lib/utils';
import { saveAudioFile } from '../lib/storage';
import { Word } from '../types';

interface BatchAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: Word[];
  onWordAudioGenerated: (wordId: string, audioUrl: string, lang: 'en' | 'vi') => void;
}

const VOICES = [
  { id: 'Puck', name: 'Puck (Friendly Male)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Kore', name: 'Kore (Calm Female)' },
  { id: 'Fenrir', name: 'Fenrir (Strong Male)' },
  { id: 'Zephyr', name: 'Zephyr (Energetic Female)' },
];

export default function BatchAudioModal({ isOpen, onClose, words, onWordAudioGenerated }: BatchAudioModalProps) {
  const [targetLang, setTargetLang] = useState<'en' | 'vi'>('en');
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [speed, setSpeed] = useState('normal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const wordsToProcess = words.filter(w => 
    (targetLang === 'en' ? (!w.audioUrl && w.term.trim().length > 0) : (!w.viAudioUrl && w.definition.trim().length > 0))
  );

  const fetchAudioWithRetry = async (text: string, voice: string, speedSetting: string, lang: 'en' | 'vi', maxRetries = 3) => {
    let attempt = 0;
    while (attempt <= maxRetries) {
      try {
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            voice,
            speed: speedSetting,
            lang
          })
        });

        if (res.status === 429) {
          attempt++;
          if (attempt > maxRetries) {
            throw new Error('Hạn ngạch API bị vượt quá nhiều lần (429 Rate Limit)');
          }
          const delaySec = Math.pow(2, attempt) + Math.round(Math.random() * 2);
          setLogs(prev => [`⏳ [Hạn ngạch 429] Thử lại "${text}" sau ${delaySec}s (Lần thử ${attempt}/${maxRetries})...`, ...prev]);
          await new Promise(resolve => setTimeout(resolve, delaySec * 1000));
          continue;
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || `HTTP ${res.status}`);
        }

        const data = await res.json();
        if (!data.audioUrl) {
          throw new Error('Không nhận được dữ liệu âm thanh');
        }
        return data.audioUrl;

      } catch (err: any) {
        if (attempt >= maxRetries || !err.message?.includes('429')) {
          throw err;
        }
      }
    }
    throw new Error('Tạo âm thanh thất bại sau nhiều lần thử');
  };

  const handleGenerateAll = async () => {
    if (wordsToProcess.length === 0) return;
    
    setIsGenerating(true);
    setIsDone(false);
    setProgress({ current: 0, total: wordsToProcess.length, failed: 0 });
    setLogs([]);
    
    let currentFailed = 0;

    for (let i = 0; i < wordsToProcess.length; i++) {
      const word = wordsToProcess[i];
      const textToSpeak = targetLang === 'en' ? word.term : word.definition;
      
      try {
        setLogs(prev => [`[${i + 1}/${wordsToProcess.length}] Đang tạo âm thanh cho "${textToSpeak}"...`, ...prev]);
        
        const wavBase64Url = await fetchAudioWithRetry(textToSpeak, selectedVoice, speed, targetLang);

        // Save to Firebase Storage or local Firestore storage
        let finalUrl = '';
        try {
          const base64Data = wavBase64Url.split(',')[1];
          const byteString = atob(base64Data);
          const byteNumbers = new Array(byteString.length);
          for (let j = 0; j < byteString.length; j++) {
            byteNumbers[j] = byteString.charCodeAt(j);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'audio/wav' });
          
          const filename = `audio/${Date.now()}_${generateId()}.wav`;
          const storageRef = ref(storage, filename);
          
          const uploadPromise = uploadBytes(storageRef, blob);
          const timeoutPromise = new Promise((_, reject) => 
             setTimeout(() => reject(new Error('Upload timeout')), 8000)
          );
          
          await Promise.race([uploadPromise, timeoutPromise]);
          finalUrl = await getDownloadURL(storageRef);
        } catch (e) {
          // Fallback to firestore storage
          finalUrl = await saveAudioFile(wavBase64Url);
        }

        onWordAudioGenerated(word.id, finalUrl, targetLang);
        setLogs(prev => [`✓ Hoàn tất: "${textToSpeak}"`, ...prev]);
        
        // Polite delay between successful requests
        if (i < wordsToProcess.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
        
      } catch (error: any) {
        console.error("Error generating audio for", textToSpeak, error);
        currentFailed++;
        const errorMessage = typeof error === 'object' ? (error?.message || JSON.stringify(error)) : String(error);
        setLogs(prev => [`✗ Thất bại: "${textToSpeak}" (${errorMessage})`, ...prev]);
      }
      
      setProgress(prev => ({ ...prev, current: i + 1, failed: currentFailed }));
    }

    setIsGenerating(false);
    setIsDone(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 text-base">
            <Mic className="w-5 h-5 text-indigo-600" />
            Tạo Âm Thanh Hàng Loạt (Batch Audio)
          </h3>
          <button onClick={onClose} disabled={isGenerating} className="text-slate-400 hover:text-slate-600 disabled:opacity-50">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          {!isGenerating && !isDone && (
            <div className="space-y-4">
              <div className="bg-indigo-50 text-indigo-800 p-4 rounded-xl flex gap-3 text-sm border border-indigo-100">
                <AlertTriangle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                <p>Hệ thống sẽ tạo âm thanh AI Gemini server-side cho <strong>{wordsToProcess.length}</strong> từ chưa có phát âm.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ngôn ngữ mục tiêu</label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value as 'en' | 'vi')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="en">Tiếng Anh (Từ vựng / Term)</option>
                  <option value="vi">Tiếng Việt (Định nghĩa / Definition)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Giọng đọc Gemini AI</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  {VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tốc độ đọc</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                >
                  <option value="slow">Chậm (Slow)</option>
                  <option value="normal">Bình thường (Normal)</option>
                  <option value="fast">Nhanh (Fast)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleGenerateAll}
                  disabled={wordsToProcess.length === 0}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-md"
                >
                  Bắt Đầu Tạo Âm Thanh AI
                </button>
              </div>
            </div>
          )}

          {(isGenerating || isDone) && (
            <div className="space-y-4">
              <div className="text-center">
                <h4 className="text-lg font-bold text-slate-900 mb-1">
                  {isGenerating ? 'Đang tạo âm thanh AI...' : 'Hoàn Tất Tạo Âm Thanh'}
                </h4>
                <p className="text-slate-500 text-xs font-medium">
                  Đã xử lý {progress.current} / {progress.total} từ ({progress.failed} thất bại)
                </p>
                
                <div className="w-full bg-slate-100 rounded-full h-2.5 mt-4 mb-6 overflow-hidden">
                  <div 
                    className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-xl p-3 h-48 overflow-y-auto text-xs font-mono text-slate-300 space-y-1">
                {logs.map((log, i) => (
                  <div key={i} className={log.includes('Thất bại') || log.includes('✗') ? 'text-red-400' : log.includes('Hoàn tất') || log.includes('✓') ? 'text-green-400' : 'text-slate-300'}>
                    {log}
                  </div>
                ))}
              </div>

              {isDone && (
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-xl font-bold transition-colors"
                >
                  Đóng
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
