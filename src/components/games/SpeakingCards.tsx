import SmartImage from "../ui/SmartImage";
import React, { useState } from 'react';
import { Word } from '../../types';
import { motion } from 'motion/react';
import { Volume2, ArrowRight, ArrowLeft, Repeat } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';
import { parseHighlightedSentence } from '../../utils/worksheetGenerator';

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
          {/* [FEATURE-MAP: Flashcard Front Face | Nút/UI: Perspective Container | Selector: div.absolute.inset-0.backface-hidden.bg-white] */}
          <div className="absolute inset-0 backface-hidden bg-white rounded-3xl shadow-xl border-2 border-slate-100 flex flex-col items-center justify-center p-6 md:p-10 text-center">
            {currentWord.imageUrl && (
              <div className="mb-4 w-40 h-40 md:w-60 md:h-60 max-h-[35%] rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm flex items-center justify-center bg-slate-50">
                <SmartImage 
                  src={currentWord.imageUrl} 
                  alt={currentWord.term} 
                  referrerPolicy="no-referrer"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            )}
            <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-1">{currentWord.term}</h2>
            {currentWord.phonetic && (
              <p className="text-lg md:text-xl text-slate-400 font-mono mb-3">{currentWord.phonetic}</p>
            )}
            {!currentWord.phonetic && <div className="mb-3" />}
            {/* [FEATURE-MAP: Audio Controls | Nút/UI: Audio Speak Once / 10x | Selector: button[title="Listen once"], button[title="Listen 10 times"]] */}
            <div className="flex items-center justify-center gap-3 md:gap-5">
              <button 
                onClick={(e) => { e.stopPropagation(); speakEn(currentWord.term, currentWord.audioUrl); }}
                className="p-3 md:p-4 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
                title="Listen once"
              >
                <Volume2 className="w-8 h-8 md:w-10 md:h-10" />
              </button>
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  speakEn(currentWord.term, currentWord.audioUrl, 10); 
                }}
                className="p-3 md:p-4 bg-indigo-50 text-indigo-600 rounded-full hover:bg-indigo-100 transition-colors shadow-sm flex items-center gap-2"
                title="Listen 10 times"
              >
                <Repeat className="w-6 h-6 md:w-8 md:h-8" />
                <span className="font-bold text-base md:text-lg">10x</span>
              </button>
            </div>

            {currentWord.exampleSentence && (
              /* [FEATURE-MAP: Example Sentence Box | Nút/UI: Highlighted Word & Translation | Selector: div.bg-slate-50.border.border-slate-200\/80.rounded-2xl] */
              <div className="mt-3 md:mt-4 px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-700 text-base md:text-xl font-medium max-w-2xl text-center shadow-xs">
                {parseHighlightedSentence(currentWord.exampleSentence, currentWord.term).map((span, sIdx) => (
                  <span
                    key={sIdx}
                    className={span.isHighlighted ? "font-bold text-red-600 bg-red-50/80 px-1.5 py-0.5 rounded-md" : ""}
                  >
                    {span.text}
                  </span>
                ))}
                {currentWord.exampleTranslation && (
                  <p className="text-xs md:text-sm text-teal-600 mt-1 italic font-normal">{currentWord.exampleTranslation}</p>
                )}
              </div>
            )}
            {/* [FEATURE-MAP: Flip Indicator Text | Nút/UI: Tap to flip | Selector: p.text-slate-400] */}
            <p className="absolute bottom-2 md:bottom-3 text-slate-400 text-xs md:text-sm font-medium">Tap to flip</p>
          </div>
          
          {/* [FEATURE-MAP: Flashcard Back Face | Nút/UI: Vietnamese Definition | Selector: div.absolute.inset-0.backface-hidden.bg-blue-600.rotate-y-180] */}
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
