import SmartImage from "../ui/SmartImage";
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { Package, X, Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function OpenBox({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [boxes, setBoxes] = useState(words.map((w, i) => ({ id: i, word: w, isOpen: false, isCompleted: false })));
  const [activeBox, setActiveBox] = useState<number | null>(null);
  const [hideImage, setHideImage] = useState(false);
  const { speakEn, speakVn } = useSettings();

  const handleBoxClick = (index: number) => {
    if (boxes[index].isOpen || boxes[index].isCompleted) return;
    
    const newBoxes = [...boxes];
    newBoxes[index].isOpen = true;
    setBoxes(newBoxes);
    
    setTimeout(() => {
      setActiveBox(index);
      speakEn(boxes[index].word.term, boxes[index].word.audioUrl);
    }, 600);
  };

  const handleCorrect = () => {
    if (activeBox === null) return;
    const newBoxes = [...boxes];
    newBoxes[activeBox].isCompleted = true;
    setBoxes(newBoxes);
    setActiveBox(null);
  };

  const isAllCompleted = boxes.every(b => b.isCompleted);

  if (isAllCompleted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white/80 backdrop-blur rounded-2xl">
        <h2 className="text-4xl font-bold text-slate-900 mb-4">All Boxes Opened!</h2>
        <button onClick={onExit} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">
          Back to Menu
        </button>
      </div>
    );
  }

  return (
    <div className="h-full p-6 flex flex-col bg-slate-50/50 backdrop-blur rounded-2xl relative">
      <div className="absolute top-4 right-4 z-20">
        <label className="flex items-center gap-2 cursor-pointer bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-sm hover:bg-white transition-colors border border-slate-200">
          <input type="checkbox" checked={hideImage} onChange={(e) => setHideImage(e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-slate-300" />
          <span className="font-bold text-slate-700 text-sm">Ẩn hình ảnh</span>
        </label>
      </div>
      <AnimatePresence mode="wait">
        {activeBox !== null ? (
          <motion.div 
            key="quiz"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex-1 flex flex-col bg-white rounded-3xl shadow-xl border-2 border-slate-100 p-8 pt-16"
          >
             <div className="flex justify-end mb-4">
               <button onClick={() => setActiveBox(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X /></button>
             </div>
             <SimpleQuiz word={boxes[activeBox].word} allWords={words} onCorrect={handleCorrect} speakEn={speakEn} speakVn={speakVn} hideImage={hideImage} />
          </motion.div>
        ) : (
          <motion.div 
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 auto-rows-fr max-w-5xl mx-auto w-full content-center"
          >
            {boxes.map((box, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: box.isCompleted ? 1 : 1.05 }}
                whileTap={{ scale: box.isCompleted ? 1 : 0.95 }}
                onClick={() => handleBoxClick(i)}
                className={`relative rounded-2xl border-b-8 flex items-center justify-center text-4xl font-black transition-all duration-300 ${
                  box.isCompleted ? 'bg-slate-200 border-slate-300 text-slate-400 opacity-50 cursor-default' : 
                  box.isOpen ? 'bg-amber-100 border-amber-300 text-amber-500 scale-110 z-10' : 
                  'bg-sky-400 border-sky-600 text-white shadow-lg hover:bg-sky-300'
                }`}
              >
                {box.isCompleted ? '✓' : box.isOpen ? '' : i + 1}
                {!box.isCompleted && !box.isOpen && <Package className="absolute opacity-20 w-16 h-16" />}
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimpleQuiz({ word, allWords, onCorrect, speakEn, speakVn, hideImage }: { word: Word, allWords: Word[], onCorrect: () => void, speakEn: (text: string, audioUrl?: string) => void, speakVn: (text: string, viAudioUrl?: string) => void, hideImage?: boolean }) {
  const [options, setOptions] = useState<string[]>([]);
  const [wrongAnswers, setWrongAnswers] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const distractors = allWords.filter(w => w.id !== word.id).sort(() => Math.random() - 0.5).slice(0, 3).map(w => w.definition);
    setOptions([...distractors, word.definition].sort(() => Math.random() - 0.5));
  }, [word, allWords]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full">
      {!hideImage && word.imageUrl && (
        <div className="mb-6 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
          <SmartImage 
            src={word.imageUrl} 
            alt={word.term} 
            referrerPolicy="no-referrer"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
      <p className="text-slate-500 uppercase tracking-widest font-bold mb-4">What is the meaning of:</p>
      <div className="flex items-center gap-4 mb-12">
        <h2 className="text-5xl font-black text-slate-900 text-center">{word.term}</h2>
        <button 
          onClick={() => speakEn(word.term, word.audioUrl)}
          className="p-3 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors shadow-sm"
        >
          <Volume2 className="w-6 h-6" />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {options.map((opt, i) => (
          <div key={i} className="relative flex">
            <button 
              onClick={() => {
                if (opt === word.definition) {
                  playSound('correct');
                  onCorrect();
                } else {
                  playSound('incorrect');
                  setWrongAnswers(prev => new Set(prev).add(opt));
                }
              }}
              className={`flex-1 p-6 border-4 rounded-2xl text-xl font-bold transition-all text-left pr-16 ${
                wrongAnswers.has(opt) 
                  ? 'bg-red-50 border-red-200 text-red-400 opacity-50 cursor-not-allowed' 
                  : 'bg-white border-slate-200 text-slate-700 hover:border-sky-400 hover:bg-sky-50 shadow-sm hover:shadow-md'
              }`}
              disabled={wrongAnswers.has(opt)}
            >
              {opt}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                speakVn(opt, allWords.find(w => w.definition === opt)?.viAudioUrl);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
              disabled={wrongAnswers.has(opt)}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
