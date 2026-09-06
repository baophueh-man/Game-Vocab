import SmartImage from "../ui/SmartImage";
import React, { useState, useEffect } from 'react';
import { Word } from '../../types';
import { shuffleArray, cn } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { fireConfetti } from '../../utils/confetti';
import { Check, X, RefreshCw, Trophy, Volume2 } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

interface QuizGameProps {
  words: Word[];
  onExit: () => void;
}

export default function QuizGame({ words, onExit }: QuizGameProps) {
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const { speakEn, speakVn, reduceMotion } = useSettings();

  useEffect(() => {
    startNewGame();
  }, [words]);

  const startNewGame = () => {
    // Generate questions
    const newQuestions = shuffleArray(words).map((word) => {
      // Get 3 random distractors
      const distractors = shuffleArray(words.filter((w) => w.id !== word.id))
        .slice(0, 3)
        .map((w) => w.definition);
      
      const options = shuffleArray([word.definition, ...distractors]);
      
      return {
        question: word.term,
        imageUrl: word.imageUrl,
        audioUrl: word.audioUrl,
        correctAnswer: word.definition,
        options,
      };
    });

    setQuestions(newQuestions);
    setCurrentIndex(0);
    setScore(0);
    setGameState('playing');
    setSelectedAnswer(null);
    setIsCorrect(null);
  };

  const handleAnswer = (answer: string) => {
    if (selectedAnswer) return; // Prevent double clicking

    setSelectedAnswer(answer);
    const correct = answer === questions[currentIndex].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      setScore((s) => s + 1);
      fireConfetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
        colors: ['#4ade80', '#22c55e']
      });
    } else {
      playSound('incorrect');
    }

    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
      } else {
        setGameState('finished');
        fireConfetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 }
        });
      }
    }, reduceMotion ? 600 : 1500);
  };

  if (questions.length === 0) return <div>Loading...</div>;

  if (gameState === 'finished') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6 text-yellow-500"
        >
          <Trophy className="w-12 h-12" />
        </motion.div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Quiz Complete!</h2>
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

  const currentQuestion = questions[currentIndex];

  return (
    <div className="h-full flex flex-col max-w-2xl mx-auto p-6 justify-center">
      <div className="mb-8 flex justify-between items-center">
        <div className="text-sm font-medium text-slate-400">
          Question {currentIndex + 1} / {questions.length}
        </div>
        <div className="text-sm font-bold text-indigo-600">
          Score: {score}
        </div>
      </div>

      <div className="w-full bg-slate-100 h-2 rounded-full mb-8 overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="mb-8 text-center flex flex-col items-center"
      >
        {currentQuestion.imageUrl && (
          <div className="mb-6 w-48 h-48 md:w-64 md:h-64 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white flex items-center justify-center">
            <SmartImage 
              src={currentQuestion.imageUrl} 
              alt={currentQuestion.question} 
              referrerPolicy="no-referrer"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}
        <div className="flex items-center gap-4 mb-2">
          <h2 className="text-4xl font-bold text-slate-900">{currentQuestion.question}</h2>
          <button 
            onClick={() => speakEn(currentQuestion.question, currentQuestion.audioUrl)}
            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
          >
            <Volume2 className="w-6 h-6" />
          </button>
        </div>
        <p className="text-slate-400">Select the correct meaning</p>
      </motion.div>

      <div className="grid grid-cols-1 gap-4">
        {currentQuestion.options.map((option: string, idx: number) => {
          let stateStyles = "bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50";
          
          if (selectedAnswer) {
            if (option === currentQuestion.correctAnswer) {
              stateStyles = "bg-green-100 border-green-500 text-green-800";
            } else if (option === selectedAnswer) {
              stateStyles = "bg-red-100 border-red-500 text-red-800";
            } else {
              stateStyles = "bg-slate-50 border-slate-200 opacity-50";
            }
          }

          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex gap-2"
            >
              <button
                onClick={() => handleAnswer(option)}
                disabled={!!selectedAnswer}
                className={cn(
                  "flex-1 p-4 rounded-xl border-2 text-lg font-medium transition-all text-left flex justify-between items-center",
                  stateStyles
                )}
              >
                <span>{option}</span>
                {selectedAnswer && option === currentQuestion.correctAnswer && <Check className="w-5 h-5 text-green-600" />}
                {selectedAnswer && option === selectedAnswer && option !== currentQuestion.correctAnswer && <X className="w-5 h-5 text-red-600" />}
              </button>
              <button
                onClick={() => speakVn(option, words.find(w => w.definition === option)?.viAudioUrl)}
                className="p-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-500 flex items-center justify-center transition-colors"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
