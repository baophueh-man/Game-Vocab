import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray, cn } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function MatchUp({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [terms, setTerms] = useState<Word[]>([]);
  const [defs, setDefs] = useState<Word[]>([]);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [selectedDef, setSelectedDef] = useState<string | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<string>>(new Set());
  const { speakEn, speakVn } = useSettings();

  useEffect(() => {
    const gameWords = words.slice(0, 6); // Max 6 pairs for screen space
    setTerms(shuffleArray([...gameWords]));
    setDefs(shuffleArray([...gameWords]));
  }, [words]);

  useEffect(() => {
    if (selectedTerm && selectedDef) {
      if (selectedTerm === selectedDef) {
        playSound('correct');
        setMatchedIds(prev => new Set(prev).add(selectedTerm));
        if (matchedIds.size + 1 === terms.length) {
          fireConfetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
        }
      } else {
        playSound('incorrect');
      }
      setTimeout(() => {
        setSelectedTerm(null);
        setSelectedDef(null);
      }, 500);
    }
  }, [selectedTerm, selectedDef]);

  return (
    <div className="h-full p-6 flex flex-col bg-white/50 backdrop-blur-sm rounded-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Match the terms with definitions</h2>
      </div>
      
      <div className="flex-1 grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto w-full">
        {/* Terms Column */}
        <div className="flex flex-col gap-3">
          {terms.map(t => (
            <div key={`term-${t.id}`} className={cn("flex gap-2", matchedIds.has(t.id) ? "opacity-0 pointer-events-none" : "")}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !matchedIds.has(t.id) && setSelectedTerm(t.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center font-bold text-lg transition-all shadow-sm flex-1 flex items-center justify-center",
                  selectedTerm === t.id ? "border-blue-500 bg-blue-100 text-blue-800" :
                  "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                )}
              >
                {t.term}
              </motion.button>
              <button
                onClick={() => speakEn(t.term, t.audioUrl)}
                className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Definitions Column */}
        <div className="flex flex-col gap-3">
          {defs.map(d => (
            <div key={`def-${d.id}`} className={cn("flex gap-2", matchedIds.has(d.id) ? "opacity-0 pointer-events-none" : "")}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => !matchedIds.has(d.id) && setSelectedDef(d.id)}
                className={cn(
                  "p-4 rounded-xl border-2 text-center font-medium transition-all shadow-sm flex-1 flex items-center justify-center",
                  selectedDef === d.id ? "border-emerald-500 bg-emerald-100 text-emerald-800" :
                  "border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                )}
              >
                {d.definition}
              </motion.button>
              <button
                onClick={() => speakVn(d.definition, d.viAudioUrl)}
                className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
