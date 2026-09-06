import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray, cn } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { RefreshCw, Trophy, Delete, Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface UnscrambleGameProps {
  words: Word[];
  onExit: () => void;
}

export default function UnscrambleGame({ words, onExit }: UnscrambleGameProps) {
  const [questions, setQuestions] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  
  const [scrambledLetters, setScrambledLetters] = useState<{ id: string; char: string }[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<{ id: string; char: string }[]>([]);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { speakEn, speakVn, reduceMotion } = useSettings();

  useEffect(() => {
    startNewGame();
  }, [words]);

  const startNewGame = () => {
    const newQuestions = shuffleArray(words).slice(0, 10); // Play up to 10 words
    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
    setupWord(newQuestions[0]);
  };

  const setupWord = (word: Word) => {
    const chars = word.term.split('');
    // Create unique IDs for each character to handle duplicate letters
    let scrambled = chars.map((char, index) => ({ id: `${index}-${char}`, char }));
    
    // Keep shuffling until it's actually different from the original word (if length > 1)
    if (chars.length > 1) {
      let isSame = true;
      while (isSame) {
        scrambled = shuffleArray(scrambled);
        if (scrambled.map(s => s.char).join('') !== word.term) {
          isSame = false;
        }
      }
    }
    
    setScrambledLetters(scrambled);
    setSelectedLetters([]);
    setIsCorrect(null);
  };

  const handleSelectLetter = (letter: { id: string; char: string }) => {
    if (isCorrect) return;
    
    setScrambledLetters(prev => prev.filter(l => l.id !== letter.id));
    setSelectedLetters(prev => {
      const newSelected = [...prev, letter];
      checkAnswer(newSelected);
      return newSelected;
    });
  };

  const handleDeselectLetter = (letter: { id: string; char: string }) => {
    if (isCorrect) return;
    
    setSelectedLetters(prev => prev.filter(l => l.id !== letter.id));
    setScrambledLetters(prev => [...prev, letter]);
  };

  const checkAnswer = (currentSelected: { id: string; char: string }[]) => {
    const currentWord = questions[currentIndex];
    const formedWord = currentSelected.map(l => l.char).join('');
    
    if (formedWord === currentWord.term) {
      playSound('correct');
      setIsCorrect(true);
      setScore(s => s + 1);
      speakEn(currentWord.term, currentWord.audioUrl);
      
      fireConfetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e']
      });

      setTimeout(() => {
        if (currentIndex < questions.length - 1) {
          setCurrentIndex(prev => prev + 1);
          setupWord(questions[currentIndex + 1]);
        } else {
          setGameState('finished');
          fireConfetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
          });
        }
      }, reduceMotion ? 600 : 1500);
    } else if (currentSelected.length === currentWord.term.length) {
      playSound('incorrect');
      // Word is full but incorrect
      setIsCorrect(false);
      setTimeout(() => {
        setIsCorrect(null);
      }, 800);
    }
  };

  const handleClear = () => {
    if (isCorrect) return;
    setScrambledLetters(prev => [...prev, ...selectedLetters]);
    setSelectedLetters([]);
  };

  if (questions.length === 0) return <div>Loading...</div>;

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mb-6 text-orange-500"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Unscramble Complete!</h2>
        <p className="text-xl text-slate-600 mb-8">
          You scored <span className="font-bold text-indigo-600">{score}</span> out of <span className="font-bold">{questions.length}</span>
        </p>
        <div className="flex gap-4">
          <button
            onClick={startNewGame}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" /> Play Again
          </button>
          <button
            onClick={onExit}
            className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
          >
            Exit
          </button>
        </div>
      </div>
    );
  }

  const currentWord = questions[currentIndex];

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto p-6 justify-center">
      <div className="mb-8 flex justify-between items-center">
        <div className="text-sm font-medium text-slate-400">
          Word {currentIndex + 1} / {questions.length}
        </div>
        <div className="text-sm font-bold text-indigo-600">
          Score: {score}
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-12 overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 text-center flex flex-col items-center"
      >
        <p className="text-slate-500 font-medium mb-2 uppercase tracking-wider text-sm">Translate this</p>
        <div className="flex items-center gap-4">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900">{currentWord.definition}</h2>
          <button 
            onClick={() => speakVn(currentWord.definition, currentWord.viAudioUrl)}
            className="p-3 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors shadow-sm"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
      </motion.div>

      {/* Answer Area */}
      <div className="mb-8">
        <div 
          className={cn(
            "flex flex-wrap justify-center gap-2 md:gap-3 min-h-[4rem] p-4 rounded-2xl border-2 transition-colors",
            isCorrect === true ? "border-green-500 bg-green-50" : 
            isCorrect === false ? "border-red-500 bg-red-50" : 
            "border-slate-200 bg-slate-50"
          )}
        >
          <AnimatePresence>
            {selectedLetters.map((letter) => (
              <motion.button
                layout
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                key={letter.id}
                onClick={() => handleDeselectLetter(letter)}
                className={cn(
                  "w-12 h-12 md:w-14 md:h-14 rounded-xl font-bold text-xl md:text-2xl flex items-center justify-center shadow-sm transition-transform hover:scale-105",
                  isCorrect === true ? "bg-green-500 text-white" :
                  isCorrect === false ? "bg-red-500 text-white" :
                  "bg-white text-slate-800 border border-slate-200"
                )}
              >
                {letter.char}
              </motion.button>
            ))}
          </AnimatePresence>
          
          {selectedLetters.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
              Tap letters to spell the word
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleClear}
          disabled={selectedLetters.length === 0 || isCorrect === true}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-800 disabled:opacity-50 disabled:hover:text-slate-500 transition-colors font-medium px-4 py-2 rounded-lg hover:bg-slate-100"
        >
          <Delete className="w-5 h-5" /> Clear
        </button>
      </div>

      {/* Letter Bank */}
      <div className="flex flex-wrap justify-center gap-2 md:gap-3">
        <AnimatePresence>
          {scrambledLetters.map((letter) => (
            <motion.button
              layout
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              key={letter.id}
              onClick={() => handleSelectLetter(letter)}
              className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-xl font-bold text-xl md:text-2xl flex items-center justify-center shadow-md hover:bg-indigo-700 transition-transform hover:-translate-y-1"
            >
              {letter.char}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
