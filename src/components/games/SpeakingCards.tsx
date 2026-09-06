import SmartImage from "../ui/SmartImage";
import React, { useState } from 'react';
import { Word } from '../../types';
import { motion } from 'motion/react';
import { Volume2, ArrowRight, ArrowLeft, Repeat } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

export default function SpeakingCards({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const { speakEn, speakVn, cancelSpeech } = useSettings();

  const nextCard = () => {
    cancelSpeech();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % words.length);
    }, 150);
  };

  const prevCard = () => {
    cancelSpeech();
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + words.length) % words.length);
    }, 150);
  };

  const currentWord = words[currentIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 relative">
      <div className="mb-8 text-slate-500 font-medium bg-white/80 px-4 py-1 rounded-full backdrop-blur-sm">
        Card {currentIndex + 1} of {words.length}
      </div>
      
      <div 
        className="relative w-full max-w-4xl aspect-[4/3] perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <motion.div
          className="w-full h-full relative preserve-3d transition-transform duration-500"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
        >
          {/* Front */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border-2 border-slate-100 flex flex-col items-center justify-center p-8 md:p-16 text-center">
            {currentWord.imageUrl && (
              <div className="mb-8 w-56 h-56 md:w-96 md:h-96 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50">
                <SmartImage 
                  src={currentWord.imageUrl} 
                  alt={currentWord.term} 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <h2 className="text-6xl md:text-8xl font-bold text-slate-900 mb-8">{currentWord.term}</h2>
            <div className="flex items-center justify-center gap-4 md:gap-6">
              <button 
                onClick={(e) => { e.stopPropagation(); speakEn(currentWord.term, currentWord.audioUrl); }}
                className="p-5 md:p-8 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                title="Listen once"
              >
                <Volume2 className="w-10 h-10 md:w-12 md:h-12" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  speakEn(currentWord.term, currentWord.audioUrl, 10); 
                }}
                className="p-4 md:p-6 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2"
                title="Listen 10 times"
              >
                <Repeat className="w-8 h-8 md:w-10 md:h-10" />
                <span className="font-bold text-lg md:text-xl">10x</span>
              </button>
            </div>
            <p className="absolute bottom-8 text-slate-400 text-base md:text-lg font-medium">Tap to flip</p>
          </div>
          
          {/* Back */}
          <div 
            className="absolute inset-0 backface-hidden bg-blue-600 rounded-3xl shadow-xl border-2 border-blue-700 flex flex-col items-center justify-center p-8 md:p-16 text-center rotate-y-180"
          >
            <h2 className="text-5xl md:text-7xl font-bold text-white leading-tight">{currentWord.definition}</h2>
            <button 
              onClick={(e) => { e.stopPropagation(); speakVn(currentWord.definition, currentWord.viAudioUrl); }}
              className="mt-12 p-5 md:p-8 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors shadow-sm"
            >
              <Volume2 className="w-10 h-10 md:w-12 md:h-12" />
            </button>
            <p className="absolute bottom-8 text-blue-200 text-base md:text-lg font-medium">Tap to flip</p>
          </div>
        </motion.div>
      </div>

      <div className="flex gap-6 mt-12">
        <button onClick={prevCard} className="p-4 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white hover:scale-105 transition-all text-slate-700">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <button onClick={nextCard} className="p-4 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-white hover:scale-105 transition-all text-slate-700">
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
