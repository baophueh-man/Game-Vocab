import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';
import { Play, Pause, Repeat1, RotateCcw, Settings, Lightbulb, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

export default function PracticeMode({ words, onExit }: { words: Word[], onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatCount, setRepeatCount] = useState(0);
  const { speakEn, cancelSpeech } = useSettings();
  const isPlayingRef = useRef(isPlaying);
  const isMountedRef = useRef(true);
  
  const MAX_REPEATS = 10;
  const PAUSE_DURATION = 1500; // 1.5 seconds pause between readings

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      cancelSpeech();
    };
  }, [cancelSpeech]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
    if (isPlaying) {
      playSequence();
    } else {
      cancelSpeech();
    }
  }, [isPlaying, currentIndex]);

  const currentWord = words[currentIndex];

  const playSequence = async () => {
    if (!isPlayingRef.current || !isMountedRef.current) return;
    
    let currentRepeat = repeatCount;
    if (currentRepeat >= MAX_REPEATS) {
      currentRepeat = 0;
      setRepeatCount(0);
    }
    
    for (let i = currentRepeat; i < MAX_REPEATS; i++) {
      if (!isPlayingRef.current || !isMountedRef.current) return;
      
      setRepeatCount(i);
      await speakEn(currentWord.term, currentWord.audioUrl);
      
      if (!isPlayingRef.current || !isMountedRef.current) return;
      
      // Wait for pause duration
      await new Promise(resolve => setTimeout(resolve, PAUSE_DURATION));
    }
    
    if (isPlayingRef.current && isMountedRef.current) {
      setRepeatCount(MAX_REPEATS);
      setIsPlaying(false);
      
      // Automatically go to next word after a short delay
      setTimeout(() => {
        if (isMountedRef.current && currentIndex < words.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setRepeatCount(0);
          setIsPlaying(true);
        }
      }, 2000);
    }
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const restart = () => {
    cancelSpeech();
    setRepeatCount(0);
    setIsPlaying(true);
  };

  const nextWord = () => {
    cancelSpeech();
    if (currentIndex < words.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setRepeatCount(0);
      setIsPlaying(true);
    }
  };

  const prevWord = () => {
    cancelSpeech();
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setRepeatCount(0);
      setIsPlaying(true);
    }
  };

  const progressPercentage = (repeatCount / MAX_REPEATS) * 100;

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl shadow-xl overflow-hidden relative">
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
        {/* Top Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-slate-900 mb-2">{currentWord.term}</h1>
          <p className="text-2xl text-slate-600 font-medium">{currentWord.definition}</p>
        </div>

        {/* Center Icon with Navigation */}
        <div className="relative mb-12 flex items-center justify-center w-full max-w-lg">
          <button 
            onClick={prevWord}
            disabled={currentIndex === 0}
            className="absolute left-0 p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
          
          <div className="flex flex-col items-center">
            <div className="w-48 h-48 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Activity className="w-24 h-24 text-slate-300" />
            </div>
            <h2 className="text-4xl font-bold text-slate-900">{currentWord.term}</h2>
          </div>

          <button 
            onClick={nextWord}
            disabled={currentIndex === words.length - 1}
            className="absolute right-0 p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-2xl mt-auto">
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-center text-slate-500 text-sm font-medium">
            {Math.round(progressPercentage)}%
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-slate-50 p-6 border-t border-slate-100 flex items-center justify-center gap-6">
        <button 
          onClick={togglePlay}
          className="w-16 h-16 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        >
          {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
        </button>
        
        <button 
          className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
          title="Loop"
        >
          <Repeat1 className="w-6 h-6" />
        </button>
        
        <button 
          onClick={restart}
          className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
          title="Restart"
        >
          <RotateCcw className="w-6 h-6" />
        </button>
        
        <button 
          className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
          title="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
        
        <button 
          className="w-12 h-12 bg-white hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center shadow-sm border border-slate-200 transition-colors"
          title="Hint"
        >
          <Lightbulb className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
