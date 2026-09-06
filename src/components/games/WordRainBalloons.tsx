import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Flame, 
  Sparkles, 
  Heart, 
  Pause, 
  Play, 
  Settings2,
  ArrowDown,
  ArrowUp,
  Infinity as InfinityIcon,
  XCircle,
  Zap
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

interface WordRainBalloonsProps {
  words: Word[];
  onExit: () => void;
}

interface ActiveBalloon {
  id: string;
  wordId: string;
  term: string;
  definition: string;
  imageUrl?: string;
  audioUrl?: string;
  xPercent: number; // 10% to 90%
  yPercent: number; // 0% (top) to 100% (bottom)
  speed: number;
  colorIdx: number;
  isPopping?: boolean;
  isCorrectPop?: boolean;
  isWrongShake?: boolean;
  laneIndex: number;
}

const BALLOON_PALETTES = [
  { bg: 'from-rose-400 to-red-500', flatBg: 'bg-rose-500', border: 'border-red-300', text: 'text-white', glow: 'shadow-red-500/40', shine: 'bg-rose-200/50' },
  { bg: 'from-sky-400 to-blue-500', flatBg: 'bg-sky-500', border: 'border-sky-300', text: 'text-white', glow: 'shadow-blue-500/40', shine: 'bg-sky-200/50' },
  { bg: 'from-emerald-400 to-teal-600', flatBg: 'bg-emerald-600', border: 'border-emerald-300', text: 'text-white', glow: 'shadow-emerald-500/40', shine: 'bg-emerald-200/50' },
  { bg: 'from-amber-400 to-orange-500', flatBg: 'bg-amber-500', border: 'border-amber-300', text: 'text-white', glow: 'shadow-orange-500/40', shine: 'bg-amber-200/50' },
  { bg: 'from-purple-400 to-indigo-600', flatBg: 'bg-purple-600', border: 'border-purple-300', text: 'text-white', glow: 'shadow-purple-500/40', shine: 'bg-purple-200/50' },
  { bg: 'from-pink-400 to-fuchsia-600', flatBg: 'bg-pink-500', border: 'border-pink-300', text: 'text-white', glow: 'shadow-fuchsia-500/40', shine: 'bg-pink-200/50' },
  { bg: 'from-lime-400 to-emerald-500', flatBg: 'bg-emerald-500', border: 'border-lime-300', text: 'text-white', glow: 'shadow-lime-500/40', shine: 'bg-lime-200/50' },
];

export default function WordRainBalloons({ words, onExit }: WordRainBalloonsProps) {
  const { speakEn, speakVn, cancelSpeech, reduceMotion } = useSettings();

  // Mode & Game configuration - Default to "Từ Tiếng Anh ➜ Bắn nghĩa Tiếng Việt"
  const [promptMode, setPromptMode] = useState<'definition' | 'audio' | 'term'>('term');
  const [direction, setDirection] = useState<'falling' | 'rising'>('falling'); // Falling Rain or Rising Balloons
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 0.7x (Slow), 1x (Normal), 1.4x (Fast)
  const [isEndless, setIsEndless] = useState<boolean>(false);
  const [autoSpeech, setAutoSpeech] = useState<boolean>(true);

  // Low-spec optimization mode (disables heavy blurs, particle loops, expensive shadows)
  const [lowSpecMode, setLowSpecMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('balloon_low_spec_mode');
    if (saved !== null) return saved === 'true';
    return reduceMotion;
  });

  const toggleLowSpecMode = (enabled: boolean) => {
    setLowSpecMode(enabled);
    localStorage.setItem('balloon_low_spec_mode', enabled.toString());
  };

  // Gameplay State
  const [gameState, setGameState] = useState<'playing' | 'paused' | 'gameover' | 'victory'>('playing');
  const [questionList, setQuestionList] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [balloons, setBalloons] = useState<ActiveBalloon[]>([]);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [poppedCount, setPoppedCount] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Mascot emotion: 'happy' | 'cheering' | 'worried' | 'idle'
  const [mascotMood, setMascotMood] = useState<'idle' | 'happy' | 'cheering' | 'worried'>('idle');

  // Animation Frame and timer references
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isSpawningWaveRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);

  // Current Target Word
  const targetWord = questionList[currentIndex] || null;

  // Sound synthesis for Balloon Pop
  const playBalloonPopAudio = useCallback((isCorrect: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (isCorrect) {
        // High energetic POP + bright harmonic chord
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.35, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Dull thud / wobble
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {
      playSound(isCorrect ? 'correct' : 'incorrect');
    }
  }, []);

  // Pronounce the target word accurately according to mode
  const playTargetAudio = useCallback((wordToSpeak?: Word | null, modeOverride?: 'definition' | 'audio' | 'term') => {
    const word = wordToSpeak || targetWord;
    if (!word) return;

    cancelSpeech();

    const currentMode = modeOverride || promptMode;
    if (currentMode === 'definition') {
      speakVn(word.definition, word.viAudioUrl);
    } else {
      // 'term' or 'audio' mode -> read the English word
      speakEn(word.term, word.audioUrl);
    }
  }, [targetWord, promptMode, cancelSpeech, speakEn, speakVn]);

  // Spawn a wave of 3 balloons containing exactly 1 correct answer and 2 distinct distractors
  const spawnWaveForTarget = useCallback((target: Word) => {
    if (!target || words.length === 0) return;

    // Pick 2 distinct distractors from the rest of the set
    const otherWords = words.filter(w => w.id !== target.id);
    const shuffledOthers = shuffleArray([...otherWords]);
    
    let distractors: Word[] = [];
    if (shuffledOthers.length >= 2) {
      distractors = [shuffledOthers[0], shuffledOthers[1]];
    } else if (shuffledOthers.length === 1) {
      distractors = [shuffledOthers[0], shuffledOthers[0]];
    } else {
      distractors = [target, target];
    }

    // Combine 1 correct + 2 distractors and shuffle their order
    const waveWords = shuffleArray([target, distractors[0], distractors[1]]);

    // 3 distinct horizontal lanes across the screen: Left (~20%), Center (~50%), Right (~80%)
    const lanePositions = [20, 50, 80];
    const shuffledLanes = shuffleArray([...lanePositions]);

    const baseSpeed = 14 * speedMultiplier;

    const newBalloons: ActiveBalloon[] = waveWords.map((w, idx) => {
      const laneX = shuffledLanes[idx];
      const xPercent = Math.max(14, Math.min(86, laneX + (Math.random() * 6 - 3)));
      const yOffset = (Math.random() * 4 - 2);
      const startY = direction === 'falling' ? -14 + yOffset : 108 - yOffset;
      const speed = baseSpeed + (Math.random() * 2 - 1);

      return {
        id: Math.random().toString(36).substring(2, 9),
        wordId: w.id,
        term: w.term,
        definition: w.definition,
        imageUrl: w.imageUrl,
        audioUrl: w.audioUrl,
        xPercent,
        yPercent: startY,
        speed,
        colorIdx: (idx * 2 + Math.floor(Math.random() * 3)) % BALLOON_PALETTES.length,
        laneIndex: idx,
      };
    });

    setBalloons(newBalloons);
    isSpawningWaveRef.current = false;
  }, [words, direction, speedMultiplier]);

  // Initialize questions list & start fresh game
  const setupNewGame = useCallback(() => {
    if (words.length === 0) return;
    cancelSpeech();

    if (audioTimerRef.current) {
      clearTimeout(audioTimerRef.current);
      audioTimerRef.current = null;
    }

    const shuffled = shuffleArray([...words]);
    setQuestionList(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setMaxStreak(0);
    setLives(3);
    setPoppedCount(0);
    setTotalAttempts(0);
    setGameState('playing');
    setMascotMood('idle');
    isTransitioningRef.current = false;
    lastTimeRef.current = performance.now();

    const firstWord = shuffled[0];
    if (firstWord) {
      spawnWaveForTarget(firstWord);

      if (autoSpeech) {
        audioTimerRef.current = setTimeout(() => {
          playTargetAudio(firstWord);
        }, 300);
      }
    }
  }, [words, autoSpeech, cancelSpeech, playTargetAudio, spawnWaveForTarget]);

  // Initial load
  useEffect(() => {
    setupNewGame();
    return () => {
      cancelSpeech();
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []); // Run once on mount

  // Switch to next target word
  const goToNextWord = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    cancelSpeech();
    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);

    const nextIdx = currentIndex + 1;
    if (nextIdx >= questionList.length) {
      if (isEndless) {
        const reshuffled = shuffleArray([...words]);
        setQuestionList(reshuffled);
        setCurrentIndex(0);
        const nextWord = reshuffled[0];
        if (nextWord) {
          spawnWaveForTarget(nextWord);
          if (autoSpeech) {
            audioTimerRef.current = setTimeout(() => {
              playTargetAudio(nextWord);
            }, 250);
          }
        }
        isTransitioningRef.current = false;
      } else {
        // Victory!
        setGameState('victory');
        fireConfetti();
        isTransitioningRef.current = false;
      }
    } else {
      setCurrentIndex(nextIdx);
      const nextWord = questionList[nextIdx];
      if (nextWord) {
        spawnWaveForTarget(nextWord);
        if (autoSpeech) {
          audioTimerRef.current = setTimeout(() => {
            playTargetAudio(nextWord);
          }, 250);
        }
      }
      isTransitioningRef.current = false;
    }
  }, [currentIndex, questionList, isEndless, words, autoSpeech, cancelSpeech, playTargetAudio, spawnWaveForTarget]);

  // Main Game Loop (Physics & Movement)
  useEffect(() => {
    if (gameState !== 'playing') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const gameLoop = (currentTime: number) => {
      const deltaSec = Math.min((currentTime - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = currentTime;

      // Update positions
      setBalloons(prevBalloons => {
        if (prevBalloons.length === 0) {
          // If all balloons cleared or escaped and we're playing, respawn wave for current target
          if (targetWord && !isSpawningWaveRef.current && !isTransitioningRef.current) {
            isSpawningWaveRef.current = true;
            setTimeout(() => {
              spawnWaveForTarget(targetWord);
            }, 100);
          }
          return prevBalloons;
        }

        const nextList: ActiveBalloon[] = [];
        let missedTarget = false;

        for (const b of prevBalloons) {
          if (b.isPopping) {
            nextList.push(b);
            continue;
          }

          let newY = b.yPercent;
          if (direction === 'falling') {
            newY += b.speed * deltaSec;
          } else {
            newY -= b.speed * deltaSec;
          }

          // Check if escaped screen
          const hasEscaped = direction === 'falling' ? newY > 108 : newY < -15;

          if (hasEscaped) {
            if (targetWord && b.wordId === targetWord.id) {
              missedTarget = true;
            }
          } else {
            nextList.push({ ...b, yPercent: newY });
          }
        }

        // If target escaped without being popped
        if (missedTarget && !isTransitioningRef.current) {
          if (!isEndless) {
            setLives(l => {
              const nextL = l - 1;
              if (nextL <= 0) {
                setGameState('gameover');
              }
              return nextL;
            });
          }
          setStreak(0);
          setMascotMood('worried');
          playBalloonPopAudio(false);
          setTimeout(() => setMascotMood('idle'), 1500);

          // Clear remaining balloons and respawn fresh wave for same target
          setTimeout(() => {
            if (targetWord && !isTransitioningRef.current) {
              spawnWaveForTarget(targetWord);
            }
          }, 150);
          return [];
        }

        return nextList;
      });

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, direction, targetWord, isEndless, playBalloonPopAudio, spawnWaveForTarget]);

  // Handle User Clicking/Popping a Balloon
  const handleBalloonClick = (balloon: ActiveBalloon) => {
    if (gameState !== 'playing' || !targetWord || balloon.isPopping || isTransitioningRef.current) return;

    setTotalAttempts(a => a + 1);

    const isMatch = balloon.wordId === targetWord.id;

    if (isMatch) {
      // CORRECT POP!
      playBalloonPopAudio(true);

      // Score calculation with streak bonus
      const bonus = Math.min(streak * 20, 100);
      const points = 100 + bonus;
      setScore(s => s + points);

      const newStreak = streak + 1;
      setStreak(newStreak);
      setMaxStreak(m => Math.max(m, newStreak));
      setPoppedCount(p => p + 1);

      // Mascot reaction
      if (newStreak >= 3) {
        setMascotMood('cheering');
      } else {
        setMascotMood('happy');
      }
      setTimeout(() => setMascotMood('idle'), 1200);

      // Pop the correct balloon and fade out others
      setBalloons(prev => prev.map(b => 
        b.id === balloon.id 
          ? { ...b, isPopping: true, isCorrectPop: true } 
          : { ...b, isPopping: true }
      ));

      // Advance to next target word cleanly
      setTimeout(() => {
        goToNextWord();
      }, 350);

    } else {
      // WRONG POP!
      playBalloonPopAudio(false);
      setStreak(0);
      setMascotMood('worried');
      setTimeout(() => setMascotMood('idle'), 1200);

      if (!isEndless) {
        setLives(l => {
          const nextL = l - 1;
          if (nextL <= 0) {
            setGameState('gameover');
          }
          return nextL;
        });
      }

      // Trigger shake animation on wrong balloon
      setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isWrongShake: true } : b));
      setTimeout(() => {
        setBalloons(prev => prev.map(b => b.id === balloon.id ? { ...b, isWrongShake: false } : b));
      }, 500);
    }
  };

  // Keyboard controls: 1, 2, 3 for balloons, Space for audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.code === 'Space') {
        e.preventDefault();
        playTargetAudio();
        return;
      }

      // Keys '1', '2', '3' map to visible balloons sorted from left to right
      const keyNum = parseInt(e.key);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= 3) {
        const sortedBalloons = [...balloons].filter(b => !b.isPopping).sort((a, b) => a.xPercent - b.xPercent);
        const targetB = sortedBalloons[keyNum - 1];
        if (targetB) {
          handleBalloonClick(targetB);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, balloons, playTargetAudio]);

  return (
    <div className={`relative w-full h-full select-none overflow-hidden ${lowSpecMode ? 'bg-sky-200' : 'bg-gradient-to-b from-sky-400 via-sky-300 to-indigo-200'} flex flex-col font-sans`}>
      {/* Dynamic Animated Clouds & Sky Backdrop (Only active when NOT in low-spec mode) */}
      {!lowSpecMode && (
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-10 left-[5%] w-48 h-20 bg-white rounded-full blur-sm animate-pulse" style={{ animationDuration: '8s' }} />
          <div className="absolute top-32 right-[10%] w-64 h-24 bg-white rounded-full blur-sm animate-pulse" style={{ animationDuration: '12s' }} />
          <div className="absolute bottom-24 left-[20%] w-72 h-28 bg-white/70 rounded-full blur-md" />
        </div>
      )}

      {/* Top Header / Status Dashboard */}
      <div className={`relative z-30 px-3 sm:px-4 py-2.5 sm:py-3 ${lowSpecMode ? 'bg-white border-b border-slate-200 shadow-xs' : 'bg-white/80 backdrop-blur-md border-b border-sky-200/60 shadow-xs'} flex flex-wrap items-center justify-between gap-2`}>
        {/* Score & Streak */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-2xl shadow-xs">
            <Trophy className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500 fill-amber-400" />
            <span className="font-extrabold text-slate-800 text-sm sm:text-base md:text-lg">{score}</span>
          </div>

          {streak > 1 && (
            <motion.div 
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-orange-500 text-white font-black text-xs md:text-sm rounded-2xl shadow-md animate-bounce"
            >
              <Flame className="w-3.5 sm:w-4 h-3.5 sm:h-4 fill-white" />
              <span>Combo x{streak}!</span>
            </motion.div>
          )}
        </div>

        {/* Target Prompt Display (Hero Banner in Header) */}
        {targetWord && gameState === 'playing' && (
          <div className="flex-1 max-w-xl mx-1 sm:mx-2 flex items-center justify-center">
            <div className="w-full bg-gradient-to-r from-indigo-600 to-sky-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl shadow-md border border-white/30 flex items-center justify-between gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden w-full">
                <button
                  onClick={() => playTargetAudio(targetWord)}
                  className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl transition-all shadow-xs shrink-0"
                  title="Nghe phát âm chuẩn (Phím Space)"
                >
                  <Volume2 className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </button>
                <div className="text-left overflow-hidden flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200 block">
                    {promptMode === 'audio' ? '🎧 Nghe & Bắn Bóng Đúng:' : promptMode === 'term' ? '🔤 Từ Tiếng Anh ➜ Bắn Nghĩa Việt:' : '🎯 Nghĩa Tiếng Việt ➜ Bắn Từ Anh:'}
                  </span>
                  <h2 className="text-sm sm:text-base md:text-xl font-black truncate">
                    {promptMode === 'audio' ? 'Bấm loa để nghe từ cần bắn' : promptMode === 'term' ? targetWord.term : targetWord.definition}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lives / Mode & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Low-Spec Toggle Button */}
          <button
            onClick={() => toggleLowSpecMode(!lowSpecMode)}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl text-xs font-bold transition-all border ${
              lowSpecMode
                ? 'bg-amber-100 border-amber-300 text-amber-900 shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'
            }`}
            title="Chế độ máy yếu: Tắt hiệu ứng mờ & bóng đổ giúp tối ưu mượt mà"
          >
            <Zap className={`w-3.5 h-3.5 ${lowSpecMode ? 'text-amber-600 fill-amber-500' : 'text-slate-400'}`} />
            <span className="hidden md:inline">{lowSpecMode ? 'Máy Yếu: Bật' : 'Máy Yếu: Tắt'}</span>
          </button>

          {!isEndless ? (
            <div className="flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-rose-50 border border-rose-200 rounded-2xl">
              {[1, 2, 3].map((heartIdx) => (
                <Heart
                  key={heartIdx}
                  className={`w-4 sm:w-5 h-4 sm:h-5 transition-all ${heartIdx <= lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-300 fill-slate-200 scale-90 opacity-40'}`}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl font-bold text-xs">
              <InfinityIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Vô Tận</span>
            </div>
          )}

          <button
            onClick={() => setGameState(g => g === 'playing' ? 'paused' : 'playing')}
            className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title={gameState === 'playing' ? 'Tạm dừng' : 'Tiếp tục'}
          >
            {gameState === 'playing' ? <Pause className="w-4 sm:w-5 h-4 sm:h-5" /> : <Play className="w-4 sm:w-5 h-4 sm:h-5" />}
          </button>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 sm:p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Cài đặt tốc độ & chế độ"
          >
            <Settings2 className="w-4 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>
      </div>

      {/* Main Sky Playfield where Balloons Fall or Rise */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* Floating Balloons (Wave of 3 with exactly 1 correct answer) */}
        {balloons.map((balloon, index) => {
          const palette = BALLOON_PALETTES[balloon.colorIdx % BALLOON_PALETTES.length];
          const displayText = promptMode === 'term' ? balloon.definition : balloon.term;

          return (
            <div
              key={balloon.id}
              onClick={() => handleBalloonClick(balloon)}
              style={{
                left: `${balloon.xPercent}%`,
                top: `${balloon.yPercent}%`,
                transform: 'translate3d(-50%, -50%, 0)',
                willChange: 'top',
              }}
              className={`absolute z-20 cursor-pointer touch-manipulation transition-transform duration-75 ${
                balloon.isPopping ? 'scale-150 opacity-0 transition-all duration-300' : 'hover:scale-105 active:scale-95'
              } ${balloon.isWrongShake ? 'animate-shake' : ''}`}
            >
              {/* Balloon Graphic Structure */}
              <div className="relative flex flex-col items-center">
                {/* Number Key hint for Accessibility & Desktop users */}
                <span className="absolute -top-3 -right-2 z-30 w-5 h-5 bg-white/90 text-slate-700 font-extrabold text-[10px] rounded-full shadow-md flex items-center justify-center border border-slate-200">
                  {index + 1}
                </span>

                {/* Oval Balloon Sphere */}
                <div
                  className={`relative w-32 sm:w-40 min-h-[135px] sm:min-h-[160px] rounded-[50%_50%_50%_50%/55%_55%_45%_45%] ${
                    lowSpecMode 
                      ? `${palette.flatBg} border-2 ${palette.border} shadow-sm` 
                      : `bg-gradient-to-br ${palette.bg} border-2 ${palette.border} shadow-xl ${palette.glow}`
                  } flex flex-col items-center justify-center p-3 text-center transition-shadow`}
                >
                  {/* Top-left Gloss Highlight (Only in High Quality mode) */}
                  {!lowSpecMode && (
                    <div className={`absolute top-3 left-3 w-5 sm:w-7 h-8 sm:h-12 rounded-[50%] ${palette.shine} rotate-[-30deg] blur-[1px] pointer-events-none`} />
                  )}

                  {/* Balloon Image (displayed whenever available) */}
                  {balloon.imageUrl && (
                    <div className="w-12 sm:w-16 h-10 sm:h-12 rounded-xl overflow-hidden bg-white/40 shadow-inner mb-1.5 border border-white/60 shrink-0">
                      <SmartImage src={balloon.imageUrl} alt={displayText} className="w-full h-full object-cover" />
                    </div>
                  )}

                  {/* Word / Definition Text */}
                  <span className={`font-black text-xs sm:text-sm leading-tight ${lowSpecMode ? 'text-white' : 'drop-shadow-md text-white'} px-1 select-none line-clamp-2 max-w-full`}>
                    {displayText}
                  </span>
                </div>

                {/* Balloon Knot */}
                <div className={`w-3 h-2 ${lowSpecMode ? palette.flatBg : `bg-gradient-to-b ${palette.bg}`} rounded-b-md shadow-xs`} />

                {/* Balloon String: Simple straight line in low-spec mode vs SVG curve in normal mode */}
                {lowSpecMode ? (
                  <div className="w-0.5 h-10 bg-white/80 rounded-full" />
                ) : (
                  <svg className="w-4 h-12 stroke-white/70 fill-none" viewBox="0 0 20 50">
                    <path d="M10,0 Q18,15 10,25 T10,50" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}

                {/* Popping particle burst effect */}
                {balloon.isPopping && balloon.isCorrectPop && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-3xl animate-ping">💥</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Mascot Character (Heo Ú) in Bottom-Right Corner */}
        <div className="absolute bottom-2 right-4 z-20 pointer-events-none flex flex-col items-end">
          <AnimatePresence mode="wait">
            {mascotMood === 'cheering' && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="bg-amber-400 text-amber-950 font-black text-xs px-3 py-1.5 rounded-2xl shadow-lg mb-1 border-2 border-white flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 fill-amber-950" />
                <span>Tuyệt đỉnh! +Combo!</span>
              </motion.div>
            )}
            {mascotMood === 'worried' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="bg-rose-500 text-white font-bold text-xs px-3 py-1 rounded-2xl shadow-lg mb-1"
              >
                <span>Cố lên bạn ơi! 🐷</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Cute Pig Mascot Avatar */}
          <div className="relative w-16 sm:w-20 h-16 sm:h-20 bg-pink-100 border-4 border-pink-300 rounded-full shadow-xl flex items-center justify-center overflow-hidden transition-transform duration-300">
            {/* Pig Ears */}
            <div className="absolute -top-1 left-2 w-4 h-5 bg-pink-300 rounded-t-full rotate-[-20deg]" />
            <div className="absolute -top-1 right-2 w-4 h-5 bg-pink-300 rounded-t-full rotate-[20deg]" />

            {/* Pig Face */}
            <div className="relative flex flex-col items-center">
              <div className="flex gap-3 mb-1">
                <div className={`w-2 h-2.5 rounded-full ${mascotMood === 'worried' ? 'bg-slate-700' : 'bg-slate-900'}`} />
                <div className={`w-2 h-2.5 rounded-full ${mascotMood === 'worried' ? 'bg-slate-700' : 'bg-slate-900'}`} />
              </div>
              {/* Pink Snout */}
              <div className="w-7 h-4 bg-pink-400 rounded-full border border-pink-500 flex items-center justify-center gap-1 shadow-inner">
                <div className="w-1 h-1.5 bg-pink-700 rounded-full" />
                <div className="w-1 h-1.5 bg-pink-700 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Grass / Ground Base Line */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-emerald-600 to-emerald-400 border-t border-emerald-300/60 z-10" />
      </div>

      {/* PAUSE OVERLAY */}
      <AnimatePresence>
        {gameState === 'paused' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-slate-200">
              <div className="w-16 h-16 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Pause className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Đang Tạm Dừng</h3>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">Trò chơi đang dừng lại để bạn nghỉ ngơi.</p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setGameState('playing')}
                  className="w-full py-3 bg-sky-500 hover:bg-sky-600 active:scale-98 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Tiếp tục chơi</span>
                </button>
                <button
                  onClick={setupNewGame}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi lại từ đầu</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GAME OVER / VICTORY MODAL */}
      <AnimatePresence>
        {(gameState === 'gameover' || gameState === 'victory') && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl border border-slate-200">
              {gameState === 'victory' ? (
                <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Trophy className="w-10 h-10 fill-amber-400" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="w-10 h-10" />
                </div>
              )}

              <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-1">
                {gameState === 'victory' ? '🎉 Xuất Sắc Hoàn Thành!' : 'Hết Tim Rồi! 💔'}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm mb-6">
                {gameState === 'victory' 
                  ? 'Bạn đã bắn vỡ tất cả bong bóng từ vựng thành công!' 
                  : 'Đừng nản lòng nhé! Luyện tập thêm một chút là sẽ thành thạo ngay.'}
              </p>

              {/* Stats Summary Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Tổng Điểm</span>
                  <span className="text-xl font-extrabold text-indigo-600">{score}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Bong Bóng Đã Bắn</span>
                  <span className="text-xl font-extrabold text-emerald-600">{poppedCount}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Chuỗi Combo Max</span>
                  <span className="text-xl font-extrabold text-orange-500">{maxStreak}x</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-[11px] font-bold text-slate-400 uppercase block">Độ Chính Xác</span>
                  <span className="text-xl font-extrabold text-sky-600">
                    {totalAttempts > 0 ? Math.round((poppedCount / totalAttempts) * 100) : 0}%
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={setupNewGame}
                  className="flex-1 py-3.5 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 active:scale-98 text-white font-extrabold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>Chơi Lại Ngay</span>
                </button>
                <button
                  onClick={onExit}
                  className="py-3.5 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Thoát
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full border border-slate-200"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Settings2 className="w-5 h-5 text-indigo-600" />
                  <span>Tùy Chỉnh Bắn Bong Bóng</span>
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-left">
                {/* Prompt Question Mode */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Dạng Câu Hỏi Hiển Thị:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPromptMode('term')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        promptMode === 'term'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs font-extrabold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🔤 Từ Anh ➜ Nghĩa Việt
                    </button>
                    <button
                      onClick={() => setPromptMode('definition')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        promptMode === 'definition'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs font-extrabold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🎯 Nghĩa Việt ➜ Từ Anh
                    </button>
                    <button
                      onClick={() => setPromptMode('audio')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        promptMode === 'audio'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs font-extrabold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🎧 Nghe Âm Thanh
                    </button>
                  </div>
                </div>

                {/* Speed Multiplier */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Tốc Độ Rơi / Bay:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setSpeedMultiplier(0.7)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        speedMultiplier === 0.7
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🐢 Chậm (Thư Giãn)
                    </button>
                    <button
                      onClick={() => setSpeedMultiplier(1)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        speedMultiplier === 1
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      🚶 Chuẩn (1x)
                    </button>
                    <button
                      onClick={() => setSpeedMultiplier(1.4)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold transition-all ${
                        speedMultiplier === 1.4
                          ? 'bg-orange-50 border-orange-500 text-orange-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      ⚡ Nhanh (Thử Thách)
                    </button>
                  </div>
                </div>

                {/* Direction: Rain (Falling) vs Balloons (Rising) */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Hướng Di Chuyển:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setDirection('falling')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        direction === 'falling'
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowDown className="w-4 h-4" />
                      <span>Mưa Rơi Xuống 🌧️</span>
                    </button>
                    <button
                      onClick={() => setDirection('rising')}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        direction === 'rising'
                          ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <ArrowUp className="w-4 h-4" />
                      <span>Bóng Bay Lên 🎈</span>
                    </button>
                  </div>
                </div>

                {/* Life Mode (3 Hearts vs Endless) */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
                    Chế Độ Sinh Mệnh:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsEndless(false)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        !isEndless
                          ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                      <span>3 Tim (Arcade)</span>
                    </button>
                    <button
                      onClick={() => setIsEndless(true)}
                      className={`p-2.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        isEndless
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <InfinityIcon className="w-4 h-4 text-indigo-600" />
                      <span>Vô Tận (Relax)</span>
                    </button>
                  </div>
                </div>

                {/* Auto Pronounce Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Tự động phát âm khi đổi câu hỏi:</span>
                  <input
                    type="checkbox"
                    checked={autoSpeech}
                    onChange={(e) => setAutoSpeech(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded-md focus:ring-indigo-500"
                  />
                </div>

                {/* Low-Spec Optimization Mode */}
                <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-xl shrink-0 shadow-xs">
                        <Zap className="w-4 h-4 fill-white" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-800">Chế độ tối ưu máy yếu (60 FPS)</h4>
                        <p className="text-[11px] text-slate-500 leading-tight">
                          Tắt mờ nền, giảm đổ bóng & hoạt ảnh nặng giúp mượt mà trên máy cấu hình yếu.
                        </p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={lowSpecMode}
                      onChange={(e) => toggleLowSpecMode(e.target.checked)}
                      className="w-5 h-5 accent-amber-600 cursor-pointer shrink-0 ml-2"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setupNewGame();
                  }}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-2xl shadow-md transition-all"
                >
                  Áp Dụng & Chơi Lại
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
