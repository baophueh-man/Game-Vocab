import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { 
  Check, 
  X, 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Flame, 
  Sparkles, 
  Timer, 
  VolumeX, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Clock,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

interface TrueFalseGameProps {
  words: Word[];
  onExit: () => void;
}

interface QuestionItem {
  id: string;
  termWord: Word;
  displayDefinition: string;
  displayImageUrl?: string;
  isMatch: boolean; // True if term and definition match, False otherwise
}

const QUESTION_TIME_LIMIT = 5; // 5 seconds per question if timer enabled

export default function TrueFalseGame({ words, onExit }: TrueFalseGameProps) {
  const { speakEn, speakVn, reduceMotion } = useSettings();

  // Questions and Progress
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'finished'>('playing');
  const [answeredState, setAnsweredState] = useState<'correct' | 'wrong' | null>(null);
  const [lastUserChoice, setLastUserChoice] = useState<boolean | null>(null);

  // Settings
  const [enableTimer, setEnableTimer] = useState<boolean>(true);
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<number>(QUESTION_TIME_LIMIT);

  // Swipe animation values
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const isTransitioningRef = useRef<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate Questions
  const generateQuestions = () => {
    if (!words || words.length === 0) return;

    const shuffled = shuffleArray([...words]);
    const generated: QuestionItem[] = [];

    shuffled.forEach((w, idx) => {
      // 50% chance of True, 50% chance of False (if enough words)
      const shouldMatch = words.length > 1 ? Math.random() < 0.5 : true;

      if (shouldMatch) {
        generated.push({
          id: `${w.id}-${idx}-true`,
          termWord: w,
          displayDefinition: w.definition,
          displayImageUrl: w.imageUrl,
          isMatch: true
        });
      } else {
        // Pick a distractor
        const otherWords = words.filter(item => item.id !== w.id);
        const distractor = otherWords[Math.floor(Math.random() * otherWords.length)] || w;
        
        generated.push({
          id: `${w.id}-${idx}-false`,
          termWord: w,
          displayDefinition: distractor.definition,
          displayImageUrl: distractor.imageUrl || w.imageUrl,
          isMatch: false
        });
      }
    });

    setQuestions(generated);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setGameState('playing');
    setAnsweredState(null);
    setSwipeDirection(null);
    setTimeLeft(QUESTION_TIME_LIMIT);
    isTransitioningRef.current = false;
  };

  useEffect(() => {
    generateQuestions();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [words]);

  const currentQ = questions[currentIndex];

  // Play audio on question change
  useEffect(() => {
    if (gameState !== 'playing' || !currentQ) return;

    if (autoPlayAudio) {
      speakEn(currentQ.termWord.term, currentQ.termWord.audioUrl);
    }

    // Reset timer
    setTimeLeft(QUESTION_TIME_LIMIT);
  }, [currentIndex, gameState, currentQ]);

  // Timer countdown
  useEffect(() => {
    if (gameState !== 'playing' || !enableTimer || answeredState !== null) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current!);
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [currentIndex, gameState, enableTimer, answeredState]);

  // Time Out Handler
  const handleTimeOut = () => {
    if (isTransitioningRef.current || gameState !== 'playing') return;
    isTransitioningRef.current = true;
    playSound('incorrect');
    setAnsweredState('wrong');
    setStreak(0);

    setTimeout(() => {
      advanceToNext();
    }, reduceMotion ? 500 : 1000);
  };

  // User Choice (True = Right, False = Left)
  const handleUserChoice = (userChoiceIsTrue: boolean) => {
    if (isTransitioningRef.current || gameState !== 'playing' || !currentQ) return;
    isTransitioningRef.current = true;

    setLastUserChoice(userChoiceIsTrue);
    setSwipeDirection(userChoiceIsTrue ? 'right' : 'left');

    const isUserCorrect = userChoiceIsTrue === currentQ.isMatch;

    if (isUserCorrect) {
      playSound('correct');
      setAnsweredState('correct');
      const newScore = score + (enableTimer ? Math.max(1, timeLeft) * 10 : 10);
      setScore(newScore);

      const newStreak = streak + 1;
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      if (newStreak % 5 === 0) {
        fireConfetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
      }
    } else {
      playSound('incorrect');
      setAnsweredState('wrong');
      setStreak(0);
    }

    setTimeout(() => {
      advanceToNext();
    }, reduceMotion ? 400 : 900);
  };

  const advanceToNext = () => {
    setAnsweredState(null);
    setSwipeDirection(null);
    setLastUserChoice(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(prev => prev + 1);
      isTransitioningRef.current = false;
    } else {
      setGameState('finished');
      isTransitioningRef.current = false;
      fireConfetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || isTransitioningRef.current) return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleUserChoice(false); // SAI
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleUserChoice(true); // ĐÚNG
      } else if (e.key === ' ' && currentQ) {
        speakEn(currentQ.termWord.term, currentQ.termWord.audioUrl);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, currentQ, currentIndex]);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 font-bold">
        Đang tải dữ liệu trò chơi...
      </div>
    );
  }

  // GAME FINISHED SCREEN
  if (gameState === 'finished') {
    const accuracy = Math.round((score / (questions.length * (enableTimer ? 50 : 10))) * 100) || 0;

    return (
      <div className="flex flex-col items-center justify-center h-full p-4 sm:p-8 text-center bg-white/90 backdrop-blur-md rounded-3xl overflow-y-auto">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-20 h-20 sm:w-24 sm:h-24 bg-amber-100 border-2 border-amber-300 rounded-3xl flex items-center justify-center mb-4 text-amber-600 shadow-lg"
        >
          <Trophy className="w-10 h-10 sm:w-12 sm:h-12" />
        </motion.div>

        <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mb-2">Hoàn Thành Xuất Sắc! 🎉</h2>
        <p className="text-sm sm:text-base text-slate-600 font-medium mb-6">
          Bạn đã hoàn thành thử thách Đúng hay Sai!
        </p>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full max-w-md mb-8">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 sm:p-4 text-center">
            <span className="text-xs font-bold text-emerald-700 block mb-1">Điểm số</span>
            <span className="text-xl sm:text-3xl font-black text-emerald-600">{score}</span>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-3 sm:p-4 text-center">
            <span className="text-xs font-bold text-orange-700 block mb-1">Chuỗi cao nhất</span>
            <span className="text-xl sm:text-3xl font-black text-orange-600">{maxStreak}🔥</span>
          </div>
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 sm:p-4 text-center">
            <span className="text-xs font-bold text-indigo-700 block mb-1">Số câu</span>
            <span className="text-xl sm:text-3xl font-black text-indigo-600">{questions.length}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={generateQuestions}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-md transition-all hover:scale-105"
          >
            <RotateCcw className="w-5 h-5" /> Chơi Lại
          </button>
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm sm:text-base rounded-2xl transition-all"
          >
            Quay Về Menu
          </button>
        </div>
      </div>
    );
  }

  // PLAYING SCREEN
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);

  return (
    <div className="h-full flex flex-col justify-between p-3 sm:p-6 max-w-4xl mx-auto w-full select-none">
      
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between gap-2 bg-white/80 backdrop-blur-sm px-4 py-2.5 rounded-2xl border border-slate-200 shadow-xs mb-2">
        
        {/* Left: Question counter & Streak */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 font-extrabold px-3 py-1 rounded-xl text-xs sm:text-sm">
            Câu {currentIndex + 1}/{questions.length}
          </div>
          {streak > 1 && (
            <div className="flex items-center gap-1 bg-amber-100 border border-amber-200 text-amber-800 font-black px-2.5 py-1 rounded-xl text-xs sm:text-sm animate-bounce">
              <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span>{streak} Streak!</span>
            </div>
          )}
        </div>

        {/* Center: Score */}
        <div className="text-center">
          <span className="text-xs text-slate-400 font-bold uppercase block sm:inline mr-1">Điểm:</span>
          <span className="text-base sm:text-lg font-black text-slate-800">{score}</span>
        </div>

        {/* Right: Quick Toggles (Timer & Audio) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setEnableTimer(!enableTimer)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              enableTimer 
                ? 'bg-amber-50 border-amber-200 text-amber-700' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={enableTimer ? 'Đang bật đếm giờ (Bấm để tắt)' : 'Đang tắt đếm giờ (Bấm để bật)'}
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
              autoPlayAudio 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}
            title={autoPlayAudio ? 'Tự động phát âm (Bật)' : 'Tự động phát âm (Tắt)'}
          >
            {autoPlayAudio ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Timer progress bar (if timer enabled) */}
      {enableTimer && (
        <div className="w-full bg-slate-200/80 rounded-full h-2 mb-3 overflow-hidden">
          <motion.div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 2 ? 'bg-rose-500' : timeLeft <= 3 ? 'bg-amber-500' : 'bg-emerald-500'
            }`}
            style={{ width: `${(timeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
          />
        </div>
      )}

      {/* 2. Main Flashcard Container */}
      <div className="flex-1 flex items-center justify-center relative min-h-[300px] my-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ?.id}
            initial={reduceMotion ? { opacity: 0 } : { scale: 0.9, opacity: 0 }}
            animate={
              swipeDirection === 'left'
                ? { x: -260, rotate: -15, opacity: 0 }
                : swipeDirection === 'right'
                ? { x: 260, rotate: 15, opacity: 0 }
                : { x: 0, rotate: 0, scale: 1, opacity: 1 }
            }
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.25 }}
            className={`w-full max-w-md bg-white rounded-3xl shadow-xl border-4 p-5 sm:p-7 flex flex-col items-center justify-between text-center relative overflow-hidden transition-colors ${
              answeredState === 'correct'
                ? 'border-emerald-400 bg-emerald-50/40 shadow-emerald-200'
                : answeredState === 'wrong'
                ? 'border-rose-400 bg-rose-50/40 shadow-rose-200'
                : 'border-slate-100 shadow-slate-200'
            }`}
          >
            {/* Feedback Watermark Overlay */}
            <AnimatePresence>
              {answeredState === 'correct' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-emerald-500/15 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl border-2 border-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                    <span className="text-xl font-black text-emerald-700">CHÍNH XÁC!</span>
                  </div>
                </motion.div>
              )}
              {answeredState === 'wrong' && (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute inset-0 bg-rose-500/15 backdrop-blur-xs flex items-center justify-center z-20 pointer-events-none"
                >
                  <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-xl border-2 border-rose-500 flex items-center gap-2">
                    <XCircle className="w-8 h-8 text-rose-600" />
                    <span className="text-xl font-black text-rose-700">CHƯA ĐÚNG!</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Prompt Header */}
            <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">
              Từ và nghĩa này có khớp nhau không?
            </div>

            {/* English Term & Audio Button */}
            <div className="flex items-center justify-center gap-3 my-1">
              <h3 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {currentQ?.termWord.term}
              </h3>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakEn(currentQ.termWord.term, currentQ.termWord.audioUrl);
                }}
                className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-transform active:scale-90 shadow-xs"
                title="Nghe phát âm tiếng Anh"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>

            {/* Illustration Image (if exists) */}
            {currentQ?.displayImageUrl && (
              <div className="w-32 h-32 sm:w-40 sm:h-40 my-3 rounded-2xl overflow-hidden border-2 border-slate-100 shadow-inner bg-slate-50 relative flex items-center justify-center">
                <SmartImage
                  src={currentQ.displayImageUrl}
                  alt={currentQ.termWord.term}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}

            {/* Vietnamese Definition / Pairing */}
            <div className="w-full mt-2 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-2">
              <div className="text-left flex-1">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">Nghĩa hiển thị:</span>
                <span className="text-base sm:text-xl font-black text-slate-800">
                  {currentQ?.displayDefinition}
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speakVn(currentQ.displayDefinition);
                }}
                className="p-2 bg-white hover:bg-slate-100 text-emerald-600 rounded-xl border border-slate-200 shadow-2xs"
                title="Nghe tiếng Việt"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* 3. Kid-Friendly Big Action Buttons (SAI & ĐÚNG) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5 mt-4 pt-2">
        {/* Button SAI / FALSE */}
        <button
          onClick={() => handleUserChoice(false)}
          disabled={answeredState !== null}
          className="group relative flex flex-col items-center justify-center p-4 sm:p-5 bg-gradient-to-b from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 active:scale-95 text-white rounded-3xl shadow-lg shadow-rose-200 border-b-4 border-rose-800 transition-all disabled:opacity-50 min-h-[76px]"
        >
          <div className="flex items-center gap-2">
            <X className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
            <span className="text-xl sm:text-2xl font-black tracking-wide">SAI</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-rose-100 mt-0.5 opacity-90">
            Khác nghĩa [ Phím ← ]
          </span>
        </button>

        {/* Button ĐÚNG / TRUE */}
        <button
          onClick={() => handleUserChoice(true)}
          disabled={answeredState !== null}
          className="group relative flex flex-col items-center justify-center p-4 sm:p-5 bg-gradient-to-b from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 active:scale-95 text-white rounded-3xl shadow-lg shadow-emerald-200 border-b-4 border-emerald-800 transition-all disabled:opacity-50 min-h-[76px]"
        >
          <div className="flex items-center gap-2">
            <Check className="w-6 h-6 sm:w-8 sm:h-8 stroke-[3]" />
            <span className="text-xl sm:text-2xl font-black tracking-wide">ĐÚNG</span>
          </div>
          <span className="text-[10px] sm:text-xs font-bold text-emerald-100 mt-0.5 opacity-90">
            Khớp nhau [ Phím → ]
          </span>
        </button>
      </div>

    </div>
  );
}
