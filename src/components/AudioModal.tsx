import React, { useState, useRef } from 'react';
import { X, Upload, Mic, Loader2, Play, Square } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { generateId } from '../lib/utils';
import { pcmBase64ToWavBase64 } from '../utils/audio';
import { saveAudioFile } from '../lib/storage';

interface AudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (audioUrl: string) => void;
  term: string;
}

const VOICES = [
  { id: 'Puck', name: 'Puck (Friendly Male)' },
  { id: 'Charon', name: 'Charon (Deep Male)' },
  { id: 'Kore', name: 'Kore (Calm Female)' },
  { id: 'Fenrir', name: 'Fenrir (Strong Male)' },
  { id: 'Zephyr', name: 'Zephyr (Energetic Female)' },
];

export default function AudioModal({ isOpen, onClose, onSelect, term }: AudioModalProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'upload'>('generate');
  const [selectedVoice, setSelectedVoice] = useState('Charon');
  const [speed, setSpeed] = useState('normal'); // For prompt instruction
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!term) return;
    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: term,
          voice: selectedVoice,
          speed: speed
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 429 || errData.error === 'RESOURCE_EXHAUSTED') {
          alert('Hạn ngạch API tạm thời vượt quá (429). Vui lòng thử lại sau giây lát.');
        } else {
          alert(errData.message || 'Lỗi khi tạo âm thanh. Vui lòng thử lại.');
        }
        return;
      }

      const data = await res.json();
      if (data.audioUrl) {
        setGeneratedAudio(data.audioUrl);
      } else {
        alert('Tạo âm thanh thất bại. Vui lòng thử lại.');
      }
    } catch (error: any) {
      console.error('Error generating audio:', error);
      alert('Không thể kết nối máy chủ tạo âm thanh. Vui lòng kiểm tra kết nối mạng.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !generatedAudio) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSaveGenerated = async () => {
    if (!generatedAudio) return;
    
    setIsUploading(true);
    try {
      // Safely convert base64 to blob
      const base64Data = generatedAudio.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      
      // Upload to Firebase Storage with timeout
      const filename = `audio/${Date.now()}_${generateId()}.wav`;
      const storageRef = ref(storage, filename);
      
      const uploadPromise = uploadBytes(storageRef, blob);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 8000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadUrl = await getDownloadURL(storageRef);
      
      onSelect(downloadUrl);
    } catch (error) {
      // Storage upload failed or timed out, fallback to Firestore silently
      try {
        const firestoreUrl = await saveAudioFile(generatedAudio);
        onSelect(firestoreUrl);
      } catch (fallbackError) {
        console.error('Fallback to Firestore failed:', fallbackError);
        alert('Failed to save audio. Please ensure Firebase is configured correctly.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const filename = `audio/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, filename);
      
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), 8000)
      );
      
      await Promise.race([uploadPromise, timeoutPromise]);
      const downloadUrl = await getDownloadURL(storageRef);
      
      onSelect(downloadUrl);
    } catch (error) {
      // Storage upload failed or timed out, fallback to Firestore silently
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        const firestoreUrl = await saveAudioFile(base64Data);
        onSelect(firestoreUrl);
      } catch (fallbackError) {
        console.error('Fallback to Firestore failed:', fallbackError);
        alert('Failed to upload audio. Please ensure Firebase is configured correctly.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800">Audio for "{term}"</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex border-b border-slate-200">
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'generate' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('generate')}
          >
            Generate AI Audio
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'upload' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload File
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'generate' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Voice</label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {VOICES.map(v => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Speed</label>
                <select
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="slow">Slow</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast</option>
                </select>
              </div>

              {generatedAudio && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlayPause}
                      className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center hover:bg-indigo-200 transition-colors"
                    >
                      {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
                    </button>
                    <span className="text-sm font-medium text-slate-700">Preview Audio</span>
                  </div>
                  <audio
                    ref={audioRef}
                    src={generatedAudio}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || isUploading}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
                  Generate
                </button>
                
                {generatedAudio && (
                  <button
                    onClick={handleSaveGenerated}
                    disabled={isUploading}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Audio'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:bg-slate-50 hover:border-indigo-300 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
                ) : (
                  <Upload className="w-8 h-8 text-slate-400 mb-2" />
                )}
                <p className="text-sm font-medium text-slate-700 mb-1">
                  {isUploading ? 'Uploading...' : 'Click to upload audio file'}
                </p>
                <p className="text-xs text-slate-500">MP3, WAV, OGG (Max 5MB)</p>
              </div>
              <input
                type="file"
                accept="audio/*"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
