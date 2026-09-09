import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';
import { 
  Trophy, 
  Heart, 
  Volume2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Zap, 
  Headphones, 
  Type, 
  Target, 
  ArrowRight, 
  Clock, 
  Award,
  Sparkles,
  AlertTriangle,
  Play
} from 'lucide-react';

interface GauntletReviewGameProps {
  words: Word[];
  onExit: () => void;
}

// Stage Definitions
interface StageInfo {
  number: number;
  name: string;
  subtitle: string;
  icon: React.ElementType;
  badgeColor: string;
  totalQuestions: number;
}

const STAGES: StageInfo[] = [
  {
    number: 1,
    name: 'Khởi Động Phản Xạ',
    subtitle: 'Đúng hay Sai? Phán đoán siêu tốc',
    icon: Zap,
    badgeColor: 'from-amber-500 to-orange-500',
    totalQuestions: 4
  },
  {
    number: 2,
    name: 'Đôi Tai Vàng',
    subtitle: 'Nghe chuẩn âm thanh & chọn đúng tranh',
    icon: Headphones,
    badgeColor: 'from-sky-500 to-blue-600',
    totalQuestions: 4
  },
  {
    number: 3,
    name: 'Vua Chính Tả',
    subtitle: 'Sắp xếp ký tự ghép thành từ đúng',
    icon: Type,
    badgeColor: 'from-violet-500 to-purple-600',
    totalQuestions: 3
  },
  {
    number: 4,
    name: 'Đấu Trường Tốc Độ',
    subtitle: 'Bắn bong bóng từ vựng mục tiêu',
    icon: Target,
    badgeColor: 'from-emerald-500 to-teal-600',
    totalQuestions: 4
  }
];

export default function GauntletReviewGame({ words, onExit }: GauntletReviewGameProps) {
  const { speakEn, speakVn, cancelSpeech } = useSettings();

  // Core Game State
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageQuestionIndex, setStageQuestionIndex] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(0);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(true);
  
  // Game Flow States
  const [gameState, setGameState] = useState<'playing' | 'stageClear' | 'failed' | 'victory'>('playing');
  const [stageTransitionCountdown, setStageTransitionCountdown] = useState<number>(2);
  const [shakeContainer, setShakeContainer] = useState<boolean>(false);

  // Statistics & History
  const [mistakeWords, setMistakeWords] = useState<Word[]>([]);
  const [stageStats, setStageStats] = useState<{ [stage: number]: { correct: number; total: number } }>({
    1: { correct: 0, total: 4 },
    2: { correct: 0, total: 4 },
    3: { correct: 0, total: 3 },
    4: { correct: 0, total: 4 },
  });

  // Stage 1: True / False Question
  interface TrueFalseQ {
    word: Word;
    shownDefinition: string;
    isCorrectPair: boolean;
  }
  const [tfQuestion, setTfQuestion] = useState<TrueFalseQ | null>(null);
  const [tfTimer, setTfTimer] = useState<number>(10);

  // Stage 2: Listening Question
  interface ListenQ {
    targetWord: Word;
    options: Word[];
  }
  const [listenQuestion, setListenQuestion] = useState<ListenQ | null>(null);

  // Stage 3: Unscramble Question
  const [unscrambleTarget, setUnscrambleTarget] = useState<Word | null>(null);
  const [availableLetters, setAvailableLetters] = useState<{ id: string; char: string; used: boolean }[]>([]);
  const [spelledLetters, setSpelledLetters] = useState<{ id: string; char: string }[]>([]);

  // Stage 4: Speed Balloons Question
  interface BalloonItem {
    id: string;
    word: Word;
    x: number;
    y: number;
    color: string;
  }
  const [speedTarget, setSpeedTarget] = useState<Word | null>(null);
  const [balloons, setBalloons] = useState<BalloonItem[]>([]);

  // Refs for timers
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const tfCountdownRef = useRef<NodeJS.Timeout | null>(null);
  const stageClearTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sound pronunciation helper
  const playWordPronunciation = (w: Word) => {
    cancelSpeech();
    speakEn(w.term, w.audioUrl);
  };

  // Safe randomized word picker helper
  const getShuffledWordsPool = useMemo(() => {
    if (!words || words.length === 0) return [];
    return shuffleArray([...words]);
  }, [words]);

  // Overall timer
  useEffect(() => {
    if (isTimerRunning && gameState === 'playing') {
      timerIntervalRef.current = setInterval(() => {
        setTotalTimeSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, gameState]);

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);
      if (stageClearTimeoutRef.current) clearTimeout(stageClearTimeoutRef.current);
    };
  }, [cancelSpeech]);

  // Initialize a Stage
  const loadQuestionForStage = (stageNum: number, qIdx: number) => {
    if (!words || words.length === 0) return;

    if (tfCountdownRef.current) {
      clearInterval(tfCountdownRef.current);
      tfCountdownRef.current = null;
    }

    const currentWord = words[(qIdx + (stageNum - 1) * 3) % words.length];

    if (stageNum === 1) {
      // Stage 1: True or False
      const isCorrectPair = Math.random() > 0.45;
      let shownDefinition = currentWord.definition;
      if (!isCorrectPair && words.length > 1) {
        const otherWords = words.filter(w => w.id !== currentWord.id);
        const randomOther = otherWords[Math.floor(Math.random() * otherWords.length)];
        shownDefinition = randomOther.definition;
      }
      setTfQuestion({
        word: currentWord,
        shownDefinition,
        isCorrectPair
      });
      setTfTimer(10);
      playWordPronunciation(currentWord);

      // Start 10s countdown for True/False
      tfCountdownRef.current = setInterval(() => {
        setTfTimer(prev => {
          if (prev <= 1) {
            if (tfCountdownRef.current) clearInterval(tfCountdownRef.current);
            handleAnswer(false, currentWord); // time out = incorrect
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } 
    else if (stageNum === 2) {
      // Stage 2: Listening Challenge
      const otherWords = shuffleArray(words.filter(w => w.id !== currentWord.id));
      const options = shuffleArray([
        currentWord,
        ...otherWords.slice(0, Math.min(3, otherWords.length))
      ]);
      setListenQuestion({
        targetWord: currentWord,
        options
      });
      playWordPronunciation(currentWord);
    } 
    else if (stageNum === 3) {
      // Stage 3: Unscramble Spelling
      setUnscrambleTarget(currentWord);
      const cleanChars = currentWord.term.trim().split('');
      const scrambled = shuffleArray(cleanChars.map((char, index) => ({
        id: `char-${index}-${char}`,
        char,
        used: false
      })));
      setAvailableLetters(scrambled);
      setSpelledLetters([]);
    } 
    else if (stageNum === 4) {
      // Stage 4: Speed Balloons
      setSpeedTarget(currentWord);
      const colors = ['bg-rose-500', 'bg-sky-500', 'bg-amber-500', 'bg-emerald-500', 'bg-purple-500', 'bg-indigo-500'];
      const otherWords = shuffleArray(words.filter(w => w.id !== currentWord.id));
      const pool = shuffleArray([
        currentWord,
        ...otherWords.slice(0, Math.min(4, otherWords.length))
      ]);
      
      const newBalloons: BalloonItem[] = pool.map((w, index) => ({
        id: `balloon-${index}-${w.id}`,
        word: w,
        x: 10 + (index % 3) * 32,
        y: 15 + Math.floor(index / 3) * 42,
        color: colors[index % colors.length]
      }));
      setBalloons(newBalloons);
      playWordPronunciation(currentWord);
    }
  };

  // First question start
  useEffect(() => {
    if (words.length > 0) {
      loadQuestionForStage(1, 0);
    }
  }, [words]);

  // Record mistake helper
  const addMistake = (word: Word) => {
    setMistakeWords(prev => {
      if (prev.some(w => w.id === word.id)) return prev;
      return [...prev, word];
    });
  };

  // Handle generic answer
  const handleAnswer = (isCorrect: boolean, targetWord: Word) => {
    if (gameState !== 'playing') return;

    if (tfCountdownRef.current) {
      clearInterval(tfCountdownRef.current);
      tfCountdownRef.current = null;
    }

    if (isCorrect) {
      // Correct!
      playSound('correct');
      setScore(s => s + 100);
      setStageStats(prev => ({
        ...prev,
        [currentStage]: {
          ...prev[currentStage],
          correct: prev[currentStage].correct + 1
        }
      }));

      advanceQuestion();
    } else {
      // Incorrect!
      playSound('incorrect');
      addMistake(targetWord);
      setShakeContainer(true);
      setTimeout(() => setShakeContainer(false), 500);

      setLives(l => {
        const next = l - 1;
        if (next <= 0) {
          setGameState('failed');
          setIsTimerRunning(false);
        } else {
          advanceQuestion();
        }
        return next;
      });
    }
  };

  // Advance question or clear stage
  const advanceQuestion = () => {
    const currentStageDef = STAGES.find(s => s.number === currentStage) || STAGES[0];
    const nextQIdx = stageQuestionIndex + 1;

    if (nextQIdx >= currentStageDef.totalQuestions) {
      // Stage Cleared!
      if (currentStage >= STAGES.length) {
        // Overall Victory! Completed all 4 stages!
        setGameState('victory');
        setIsTimerRunning(false);
        fireConfetti();
      } else {
        // Clear this stage, bonus score, +1 Heart
        setGameState('stageClear');
        setScore(s => s + 250);
        setLives(l => Math.min(3, l + 1));
        fireConfetti();

        // 2-second countdown before next stage
        setStageTransitionCountdown(2);
        const countdownInt = setInterval(() => {
          setStageTransitionCountdown(c => {
            if (c <= 1) {
              clearInterval(countdownInt);
              return 0;
            }
            return c - 1;
          });
        }, 1000);

        stageClearTimeoutRef.current = setTimeout(() => {
          proceedToNextStage(currentStage + 1);
        }, 2200);
      }
    } else {
      // Next question in same stage
      setStageQuestionIndex(nextQIdx);
      loadQuestionForStage(currentStage, nextQIdx);
    }
  };

  const proceedToNextStage = (nextStageNumber: number) => {
    if (stageClearTimeoutRef.current) clearTimeout(stageClearTimeoutRef.current);
    setCurrentStage(nextStageNumber);
    setStageQuestionIndex(0);
    setGameState('playing');
    loadQuestionForStage(nextStageNumber, 0);
  };

  // Retry or Restart
  const handleRestartFullGauntlet = () => {
    setCurrentStage(1);
    setStageQuestionIndex(0);
    setScore(0);
    setLives(3);
    setTotalTimeSeconds(0);
    setIsTimerRunning(true);
    setMistakeWords([]);
    setStageStats({
      1: { correct: 0, total: 4 },
      2: { correct: 0, total: 4 },
      3: { correct: 0, total: 3 },
      4: { correct: 0, total: 4 },
    });
    setGameState('playing');
    loadQuestionForStage(1, 0);
  };

  const handleRetryCurrentStage = () => {
    setLives(3);
    setStageQuestionIndex(0);
    setIsTimerRunning(true);
    setGameState('playing');
    loadQuestionForStage(currentStage, 0);
  };

  // Stage 3 Letter click helpers
  const handleLetterClick = (letterObj: { id: string; char: string; used: boolean }) => {
    if (letterObj.used || !unscrambleTarget) return;

    const nextSpelled = [...spelledLetters, { id: letterObj.id, char: letterObj.char }];
    setSpelledLetters(nextSpelled);
    setAvailableLetters(prev => prev.map(item => item.id === letterObj.id ? { ...item, used: true } : item));

    // Check if word completed
    if (nextSpelled.length === unscrambleTarget.term.trim().length) {
      const spelledWord = nextSpelled.map(s => s.char).join('');
      const isMatch = spelledWord.toLowerCase() === unscrambleTarget.term.trim().toLowerCase();
      setTimeout(() => {
        handleAnswer(isMatch, unscrambleTarget);
      }, 250);
    }
  };

  const handleRemoveLetter = (index: number) => {
    const letterToRemove = spelledLetters[index];
    if (!letterToRemove) return;

    setSpelledLetters(prev => prev.filter((_, i) => i !== index));
    setAvailableLetters(prev => prev.map(item => item.id === letterToRemove.id ? { ...item, used: false } : item));
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Grade calculation
  const totalCorrect = Object.values(stageStats).reduce<number>((acc, curr: { correct: number; total: number }) => acc + curr.correct, 0);
  const totalQuestions = Object.values(stageStats).reduce<number>((acc, curr: { correct: number; total: number }) => acc + curr.total, 0);
  const accuracyPercent = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 100;

  let rankGrade = { label: 'Xuất Sắc', tier: 'S', color: 'text-amber-400 bg-amber-500/20 border-amber-500/40' };
  if (accuracyPercent < 60) {
    rankGrade = { label: 'Cần Ôn Lại', tier: 'C', color: 'text-rose-400 bg-rose-500/20 border-rose-500/40' };
  } else if (accuracyPercent < 75) {
    rankGrade = { label: 'Khá', tier: 'B', color: 'text-sky-400 bg-sky-500/20 border-sky-500/40' };
  } else if (accuracyPercent < 90) {
    rankGrade = { label: 'Giỏi', tier: 'A', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/40' };
  }

  // Current active stage definition
  const currentStageDef = STAGES.find(s => s.number === currentStage) || STAGES[0];

  return (
    <div className={`w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-y-auto font-sans relative ${shakeContainer ? 'animate-shake' : ''}`}>
      {/* TOP HEADER: Progress, Stage, Score & Lives */}
      <div className="px-3 sm:px-5 py-2.5 bg-slate-900/95 border-b border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0 z-10">
        {/* Left: Stage Badges Navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-0.5">
          {STAGES.map((s) => {
            const Icon = s.icon;
            const isDone = s.number < currentStage;
            const isCurrent = s.number === currentStage;
            return (
              <div
                key={s.number}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                  isCurrent
                    ? 'bg-gradient-to-r ' + s.badgeColor + ' text-white shadow-md ring-2 ring-white/30 scale-105'
                    : isDone
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-slate-800/60 text-slate-500 border border-slate-800'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
                <span>Ải {s.number}</span>
              </div>
            );
          })}
        </div>

        {/* Right: Score, Timer & Lives */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-black text-xs sm:text-sm">
            <Trophy className="w-3.5 h-3.5" />
            <span>{score}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 font-mono text-xs">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{formatTime(totalTimeSeconds)}</span>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            {[1, 2, 3].map(heartIdx => (
              <Heart
                key={heartIdx}
                className={`w-3.5 sm:w-4 h-3.5 sm:h-4 transition-all ${
                  heartIdx <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-800 fill-slate-800/60 opacity-40'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* SUB-HEADER: Stage Goal & Step Count */}
      <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-200">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ải {currentStage}: {currentStageDef.name}</span>
          <span className="text-slate-500 font-normal hidden sm:inline">— {currentStageDef.subtitle}</span>
        </div>
        <div className="font-semibold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-800/40">
          Câu {stageQuestionIndex + 1} / {currentStageDef.totalQuestions}
        </div>
      </div>

      {/* MAIN PLAYING ARENA */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 max-w-3xl mx-auto w-full">
        {/* ===================== STAGE 1: TRUE OR FALSE ===================== */}
        {currentStage === 1 && tfQuestion && (
          <div className="w-full flex flex-col items-center gap-4 sm:gap-6 animate-fadeIn">
            {/* Countdown timer bar */}
            <div className="w-full max-w-md bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/60">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-1000"
                style={{ width: `${(tfTimer / 10) * 100}%` }}
              />
            </div>

            {/* Flashcard Box */}
            <div className="w-full max-w-md bg-slate-900/90 border-2 border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center relative overflow-hidden">
              <button
                onClick={() => playWordPronunciation(tfQuestion.word)}
                className="absolute top-3 right-3 p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl text-slate-300 transition-all"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5 text-amber-400" />
              </button>

              {tfQuestion.word.imageUrl && (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-black/40 mb-4 border border-slate-700 shadow-inner">
                  <SmartImage src={tfQuestion.word.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}

              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold mb-1">
                Từ Tiếng Anh:
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-3">
                {tfQuestion.word.term}
              </h2>

              <div className="w-full py-3 px-4 bg-slate-800/80 rounded-2xl border border-slate-700">
                <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold mb-0.5">
                  Có nghĩa là:
                </span>
                <p className="text-lg sm:text-xl font-bold text-emerald-300">
                  {tfQuestion.shownDefinition}
                </p>
              </div>

              <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Còn lại: <b className="text-amber-400">{tfTimer}s</b></span>
              </div>
            </div>

            {/* True or False Action Buttons */}
            <div className="w-full max-w-md grid grid-cols-2 gap-3 sm:gap-4">
              <button
                onClick={() => handleAnswer(tfQuestion.isCorrectPair, tfQuestion.word)}
                className="py-4 px-5 bg-gradient-to-br from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-emerald-950 border border-emerald-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-6 h-6" />
                <span>ĐÚNG (TRUE)</span>
              </button>

              <button
                onClick={() => handleAnswer(!tfQuestion.isCorrectPair, tfQuestion.word)}
                className="py-4 px-5 bg-gradient-to-br from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 active:scale-95 text-white font-black text-base sm:text-lg rounded-2xl shadow-xl shadow-rose-950 border border-rose-400/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
                <span>SAI (FALSE)</span>
              </button>
            </div>
          </div>
        )}

        {/* ===================== STAGE 2: LISTENING SPOT ===================== */}
        {currentStage === 2 && listenQuestion && (
          <div className="w-full flex flex-col items-center gap-4 sm:gap-6 animate-fadeIn">
            {/* Big Audio Speaker Box */}
            <div className="flex flex-col items-center text-center">
              <button
                onClick={() => playWordPronunciation(listenQuestion.targetWord)}
                className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 active:scale-95 text-white rounded-full shadow-2xl flex items-center justify-center border-4 border-sky-300/40 ring-4 ring-sky-500/20 transition-all animate-pulse cursor-pointer mb-2"
                title="Bấm để nghe lại phát âm"
              >
                <Volume2 className="w-10 h-10 text-white" />
              </button>
              <span className="text-xs text-sky-300 font-bold uppercase tracking-wider">
                Chạm vào loa để nghe lại
              </span>
            </div>

            {/* 4 Multi-choice Cards */}
            <div className="w-full max-w-md grid grid-cols-2 gap-3 sm:gap-4">
              {listenQuestion.options.map((opt) => {
                const isCorrect = opt.id === listenQuestion.targetWord.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleAnswer(isCorrect, listenQuestion.targetWord)}
                    className="p-3 bg-slate-900 hover:bg-slate-800/90 active:scale-95 border-2 border-slate-700/80 hover:border-sky-400 rounded-2xl flex flex-col items-center justify-center text-center gap-2 shadow-lg transition-all cursor-pointer group"
                  >
                    {opt.imageUrl ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-black/40 border border-slate-700 shrink-0">
                        <SmartImage src={opt.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400 font-black text-xl">
                        🔤
                      </div>
                    )}
                    <span className="font-extrabold text-sm sm:text-base text-slate-100 group-hover:text-sky-300 transition-colors line-clamp-2">
                      {opt.definition}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== STAGE 3: WORD SPELLING ===================== */}
        {currentStage === 3 && unscrambleTarget && (
          <div className="w-full flex flex-col items-center gap-4 sm:gap-6 animate-fadeIn">
            {/* Clue Box */}
            <div className="w-full max-w-md bg-slate-900 border-2 border-slate-700/80 rounded-3xl p-4 sm:p-5 flex items-center gap-4 shadow-xl">
              {unscrambleTarget.imageUrl && (
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-black/40 border border-slate-700 shrink-0">
                  <SmartImage src={unscrambleTarget.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-violet-400 tracking-wider block">
                  Nghĩa Tiếng Việt:
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white truncate">
                  {unscrambleTarget.definition}
                </h3>
                <span className="text-xs text-slate-400 block mt-1">
                  Độ dài: <b className="text-violet-300">{unscrambleTarget.term.trim().length} chữ cái</b>
                </span>
              </div>
              <button
                onClick={() => playWordPronunciation(unscrambleTarget)}
                className="p-2 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl text-slate-300 transition-all"
                title="Nghe phát âm"
              >
                <Volume2 className="w-5 h-5 text-violet-400" />
              </button>
            </div>

            {/* Answer Word Slots */}
            <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 min-h-[52px] p-3 bg-slate-900/60 rounded-2xl border border-dashed border-violet-500/40">
              {unscrambleTarget.term.trim().split('').map((_, i) => {
                const filled = spelledLetters[i];
                return (
                  <button
                    key={i}
                    onClick={() => filled && handleRemoveLetter(i)}
                    className={`w-10 h-11 sm:w-12 sm:h-13 rounded-xl font-black text-lg sm:text-xl flex items-center justify-center border-2 transition-all ${
                      filled
                        ? 'bg-violet-600 text-white border-violet-400 shadow-md scale-105 active:scale-90 cursor-pointer'
                        : 'bg-slate-800/80 text-slate-600 border-slate-700'
                    }`}
                  >
                    {filled ? filled.char : ''}
                  </button>
                );
              })}
            </div>

            {/* Scrambled Character Buttons Keyboard */}
            <div className="w-full max-w-md flex flex-wrap items-center justify-center gap-2">
              {availableLetters.map((item) => (
                <button
                  key={item.id}
                  disabled={item.used}
                  onClick={() => handleLetterClick(item)}
                  className={`w-11 h-12 sm:w-12 sm:h-14 rounded-xl font-black text-lg sm:text-xl transition-all flex items-center justify-center shadow-lg border-2 ${
                    item.used
                      ? 'bg-slate-900 text-slate-700 border-slate-800/40 opacity-30 cursor-not-allowed scale-95'
                      : 'bg-slate-800 hover:bg-violet-900/80 text-white border-slate-600 hover:border-violet-400 active:scale-90 cursor-pointer'
                  }`}
                >
                  {item.char}
                </button>
              ))}
            </div>

            {/* Hint Note */}
            <p className="text-[11px] text-slate-400 text-center">
              Chạm vào chữ cái để điền vào ô trống. Bấm vào ô đã điền để xóa chữ.
            </p>
          </div>
        )}

        {/* ===================== STAGE 4: SPEED BALLOONS ===================== */}
        {currentStage === 4 && speedTarget && (
          <div className="w-full flex flex-col items-center gap-4 animate-fadeIn">
            {/* Target Banner */}
            <div className="w-full max-w-md bg-gradient-to-r from-emerald-600 to-teal-700 px-4 py-2.5 rounded-2xl border border-emerald-400/40 shadow-xl flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">
                  🎯 Bắn nổ bong bóng có nghĩa là:
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  {speedTarget.definition}
                </h3>
              </div>
              <button
                onClick={() => playWordPronunciation(speedTarget)}
                className="p-2 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl text-white transition-all shrink-0"
              >
                <Volume2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Interactive Balloons Floating Arena */}
            <div className="w-full max-w-md grid grid-cols-2 sm:grid-cols-3 gap-3">
              {balloons.map((b) => {
                const isTarget = b.word.id === speedTarget.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => handleAnswer(isTarget, speedTarget)}
                    className={`${b.color} hover:brightness-110 active:scale-90 p-4 rounded-3xl text-white font-black text-sm sm:text-base shadow-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer border-2 border-white/40 ring-2 ring-black/20`}
                  >
                    <span className="text-2xl">🎈</span>
                    <span className="truncate w-full leading-tight">{b.word.term}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===================== STAGE CLEAR POPUP OVERLAY ===================== */}
      {gameState === 'stageClear' && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3 animate-bounce">
              <Sparkles className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              ẢI {currentStage} HOÀN THÀNH! 🎉
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Bạn phản xạ rất chuẩn xác! Nhận thêm <b>+250 điểm</b> và <b>+1 Tim ❤️</b>
            </p>

            <div className="py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold mb-4 flex items-center justify-center gap-1.5 animate-pulse">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Tự động vào Ải {currentStage + 1} sau <b>{stageTransitionCountdown}s</b>...</span>
            </div>

            <button
              onClick={() => proceedToNextStage(currentStage + 1)}
              className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <span>Vào Ải {currentStage + 1} Ngay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ===================== GAME OVER / FAILED MODAL ===================== */}
      {gameState === 'failed' && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-2xl font-black text-white mb-1">
              Hết Tim Rồi! 💔
            </h3>
            <p className="text-slate-400 text-xs mb-4">
              Bạn bị trừ hết tim ở Ải {currentStage} ({currentStageDef.name}). Đừng lo, hãy thử lại ngay nhé!
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleRetryCurrentStage}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Thử Lại Ải Này (Hồi 3 Tim)</span>
              </button>

              <button
                onClick={handleRestartFullGauntlet}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                Làm Lại Toàn Bộ Từ Ải 1
              </button>

              <button
                onClick={onExit}
                className="w-full py-2 text-slate-500 hover:text-slate-400 text-xs font-semibold cursor-pointer"
              >
                Thoát Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================== FINAL VICTORY & COMPREHENSIVE REPORT CARD ===================== */}
      {gameState === 'victory' && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-5 sm:p-7 max-w-md w-full text-center shadow-2xl my-auto animate-fadeIn">
            {/* Header Trophy & Rank */}
            <div className="w-20 h-20 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto mb-2 border-2 border-amber-500/40 shadow-lg">
              <Trophy className="w-10 h-10" />
            </div>

            <span className="text-xs uppercase tracking-widest font-black text-emerald-400 block mb-1">
              Bài Kiểm Tra Hoàn Thành!
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              BẢNG TỔNG KẾT BÀI CŨ
            </h2>

            {/* Rank Grade Badge */}
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl border font-black text-sm mb-4 ${rankGrade.color}`}>
              <Award className="w-4 h-4" />
              <span>Hạng {rankGrade.tier}: {rankGrade.label} ({accuracyPercent}%)</span>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">Tổng Điểm</span>
                <span className="text-base sm:text-lg font-black text-amber-400">{score}</span>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">Thời Gian</span>
                <span className="text-base sm:text-lg font-black text-sky-400">{formatTime(totalTimeSeconds)}</span>
              </div>
              <div className="p-2.5 bg-slate-800/80 rounded-2xl border border-slate-700/60">
                <span className="text-[10px] text-slate-400 block font-bold">Chính Xác</span>
                <span className="text-base sm:text-lg font-black text-emerald-400">{accuracyPercent}%</span>
              </div>
            </div>

            {/* 4-Skill Performance Breakdown */}
            <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/50 mb-4 text-left">
              <span className="text-[11px] font-bold text-slate-300 block mb-2">
                Đánh giá theo từng ải:
              </span>
              <div className="space-y-1.5 text-xs">
                {STAGES.map(s => {
                  const st = stageStats[s.number] || { correct: 0, total: 1 };
                  const pct = Math.round((st.correct / st.total) * 100);
                  const Icon = s.icon;
                  return (
                    <div key={s.number} className="flex items-center justify-between text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ải {s.number}: {s.name}</span>
                      </div>
                      <span className="font-bold text-emerald-400">{st.correct}/{st.total} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mistakes & Review List */}
            {mistakeWords.length > 0 ? (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-3 mb-4 text-left">
                <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold mb-2">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Từ vựng cần ôn lại ({mistakeWords.length} từ):</span>
                </div>
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
                  {mistakeWords.map(w => (
                    <div key={w.id} className="p-2 bg-slate-900/90 rounded-xl border border-rose-900/50 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white block">{w.term}</span>
                        <span className="text-slate-400 text-[11px]">{w.definition}</span>
                      </div>
                      <button
                        onClick={() => playWordPronunciation(w)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg active:scale-95"
                        title="Nghe lại"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl mb-4 text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Hoàn hảo! Bạn không sai bất kỳ từ nào! 🌟</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleRestartFullGauntlet}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Kiểm Tra Lại</span>
              </button>
              <button
                onClick={onExit}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-bold rounded-xl text-sm border border-slate-700 cursor-pointer"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
