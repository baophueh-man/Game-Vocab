import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function FindMatch({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(1);
  const totalRounds = Math.min(10, words.length);
  const { speakEn, speakVn } = useSettings();

  const nextRound = () => {
    if (round > totalRounds) return;
    
    // Pick a random word that hasn't been used much (simplified: just random)
    const word = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(word);
    
    // Get distractors
    const distractors = words.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 5);
    setOptions(shuffleArray([word, ...distractors]));
  };

  useEffect(() => {
    nextRound();
  }, [words]);

  const handleSelect = (opt: Word) => {
    if (opt.id === currentWord?.id) {
      playSound('correct');
      setScore(s => s + 1);
      fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      
      if (round < totalRounds) {
        setRound(r => r + 1);
        setTimeout(nextRound, 1000);
      } else {
        setRound(r => r + 1); // Trigger end screen
        fireConfetti({ particleCount: 200, spread: 100, origin: { y: 0.5 } });
      }
    } else {
      playSound('incorrect');
      // Wrong answer visual feedback could go here
    }
  };

  if (round > totalRounds) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/80 backdrop-blur rounded-2xl">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">Game Over!</h2>
        <p className="text-2xl text-slate-600 mb-8">Score: {score} / {totalRounds}</p>
        <button onClick={onExit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
          Back to Menu
        </button>
      </div>
    );
  }

  if (!currentWord) return null;

  return (
    <div className="h-full flex flex-col p-6 bg-slate-50/80 backdrop-blur rounded-2xl">
      <div className="flex justify-between items-center mb-8">
        <div className="text-slate-500 font-bold">Round {round}/{totalRounds}</div>
        <div className="text-indigo-600 font-bold text-xl">Score: {score}</div>
      </div>

      <div className="text-center mb-12 flex flex-col items-center">
        <p className="text-slate-500 uppercase tracking-wider font-bold mb-2">Find the match for</p>
        <div className="flex items-center gap-4">
          <motion.div 
            key={currentWord.id}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block px-8 py-6 bg-white shadow-lg text-slate-800 rounded-3xl text-3xl font-bold border-4 border-indigo-100"
          >
            {currentWord.definition}
          </motion.div>
          <button 
            onClick={() => speakVn(currentWord.definition, currentWord.viAudioUrl)}
            className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <AnimatePresence mode="popLayout">
            {options.map((opt, i) => (
              <motion.div
                key={`${round}-${opt.id}`}
                initial={{ scale: 0, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: i * 0.1, type: 'spring' }}
                className="flex flex-col gap-2"
              >
                <button
                  whileHover={{ scale: 1.05, y: -5 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect(opt)}
                  className="bg-white p-6 rounded-2xl shadow-md border-b-4 border-slate-200 hover:border-indigo-500 hover:text-indigo-700 font-bold text-xl flex items-center justify-center text-center text-slate-700 h-full"
                >
                  {opt.term}
                </button>
                <button
                  onClick={() => speakEn(opt.term, opt.audioUrl)}
                  className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors mx-auto w-full"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
