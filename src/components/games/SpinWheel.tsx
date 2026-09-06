import SmartImage from "../ui/SmartImage";
import React, { useState } from 'react';
import { Word } from '../../types';
import { motion } from 'motion/react';
import { Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function SpinWheel({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const { speakEn, speakVn } = useSettings();

  const spin = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setSelectedWord(null);
    
    const spins = 5;
    const randomDegree = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (spins * 360) + randomDegree;
    
    setRotation(totalRotation);
    
    setTimeout(() => {
      setIsSpinning(false);
      const normalizedRotation = totalRotation % 360;
      const segmentAngle = 360 / words.length;
      // Pointer is at the top (0 degrees relative to the wheel's unrotated state)
      // Since we rotate the wheel clockwise, the segment at the top moves backwards relative to the wheel's coordinate system.
      const index = Math.floor(((360 - normalizedRotation + segmentAngle/2) % 360) / segmentAngle);
      const word = words[index % words.length];
      setSelectedWord(word);
      speakEn(word.term, word.audioUrl);
    }, 3000);
  };

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#10b981', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 overflow-hidden bg-white/50 backdrop-blur rounded-2xl">
      <div className="relative w-72 h-72 md:w-96 md:h-96 mb-12 mt-8">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-slate-800 drop-shadow-md"></div>
        
        {/* Wheel */}
        <motion.div 
          className="w-full h-full rounded-full border-8 border-slate-800 overflow-hidden relative shadow-2xl"
          animate={{ rotate: rotation }}
          transition={{ duration: 3, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ 
            background: `conic-gradient(${words.map((w, i) => 
              `${colors[i % colors.length]} ${i * (360/words.length)}deg ${(i+1) * (360/words.length)}deg`
            ).join(', ')})`
          }}
        >
          {words.map((w, i) => {
            const angle = (i * (360 / words.length)) + (360 / words.length / 2);
            return (
              <div 
                key={w.id}
                className="absolute top-1/2 left-1/2 w-1/2 h-8 -translate-y-1/2 origin-left text-white font-bold text-sm md:text-base px-6 flex items-center"
                style={{ transform: `rotate(${angle - 90}deg)` }} // -90 to align text with the segment
              >
                <span className="truncate w-full text-right drop-shadow-md">{w.term}</span>
              </div>
            );
          })}
          {/* Center dot */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-slate-800 rounded-full border-4 border-white z-10"></div>
        </motion.div>
      </div>
      
      <button 
        onClick={spin}
        disabled={isSpinning}
        className="px-10 py-4 bg-slate-800 text-white rounded-full font-bold text-2xl hover:bg-slate-700 disabled:opacity-50 shadow-xl transition-transform active:scale-95 uppercase tracking-widest"
      >
        {isSpinning ? 'Spinning...' : 'Spin It!'}
      </button>

      <div className="h-48 mt-8 w-full max-w-md flex items-center justify-center">
        {selectedWord && !isSpinning && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 bg-white border-4 border-slate-800 rounded-2xl shadow-xl text-center w-full flex flex-col items-center"
          >
            {selectedWord.imageUrl && (
              <div className="mb-4 w-24 h-24 rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50">
                <SmartImage 
                  src={selectedWord.imageUrl} 
                  alt={selectedWord.term} 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <div className="flex items-center justify-center gap-3 mb-2">
              <h3 className="text-3xl font-bold text-slate-900">{selectedWord.term}</h3>
              <button 
                onClick={() => speakEn(selectedWord.term, selectedWord.audioUrl)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center gap-3">
              <p className="text-xl text-slate-600 font-medium">{selectedWord.definition}</p>
              <button 
                onClick={() => speakVn(selectedWord.definition, selectedWord.viAudioUrl)}
                className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
