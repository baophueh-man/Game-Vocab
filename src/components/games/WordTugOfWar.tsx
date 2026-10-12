import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Users, 
  Bot, 
  Zap, 
  Play, 
  VolumeX, 
  ShieldAlert, 
  ChevronRight, 
  Award,
  Swords,
  Timer,
  Crown
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

interface WordTugOfWarProps {
  words: Word[];
  onExit: () => void;
}

type GameModeType = 'vs-bot' | 'pvp'; // Solo vs Bot or 2 Players Local
type Difficulty = 'easy' | 'normal' | 'hard';
type QuestionType = 'en-to-vi' | 'vi-to-en' | 'listen';

// Sound synthesizer using Web Audio API for realistic whistle, pull, splash and win
class SoundFX {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Referee Whistle
  playWhistle() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2200, now);
      osc.frequency.exponentialRampToValueAtTime(2600, now + 0.08);
      osc.frequency.exponentialRampToValueAtTime(2100, now + 0.15);
      osc.frequency.exponentialRampToValueAtTime(2500, now + 0.25);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain.gain.setValueAtTime(0.25, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  // Heavy Tug Pull strain
  playPull(isSuper: boolean = false) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(isSuper ? 180 : 130, now);
      osc.frequency.exponentialRampToValueAtTime(isSuper ? 360 : 220, now + 0.15);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(isSuper ? 0.25 : 0.15, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isSuper ? 0.35 : 0.2));

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + (isSuper ? 0.35 : 0.2));
    } catch {}
  }

  // Mud / Water Splash
  playSplash() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Noise buffer for splash
      const bufferSize = this.ctx.sampleRate * 0.4;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.1));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(200, now + 0.3);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      noise.start(now);
    } catch {}
  }

  // Win Fanfare chord
  playVictory() {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C E G C
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const now = this.ctx.currentTime + idx * 0.1;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      });
    } catch {}
  }
}

const sfx = new SoundFX();

interface QuestionItem {
  targetWord: Word;
  options: Word[];
  questionPrompt: string;
  type: QuestionType;
}

export default function WordTugOfWar({ words, onExit }: WordTugOfWarProps) {
  const { speakEn } = useSettings();

  // Settings
  const [gameMode, setGameMode] = useState<GameModeType>('vs-bot');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [questionType, setQuestionType] = useState<QuestionType>('en-to-vi');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Gameplay State
  // ropePosition ranges from -5 (Red Wins) to +5 (Blue Wins), 0 is dead center.
  const [ropePosition, setRopePosition] = useState<number>(0);
  const [maxTugSteps] = useState<number>(5); // winning condition: reaches +5 or -5
  const [gameState, setGameState] = useState<'lobby' | 'playing' | 'round-result' | 'game-over'>('lobby');
  const [winner, setWinner] = useState<'blue' | 'red' | null>(null);

  // Scores & Stats
  const [blueScore, setBlueScore] = useState(0);
  const [redScore, setRedScore] = useState(0);
  const [blueStreak, setBlueStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [answeredWords, setAnsweredWords] = useState<{ word: Word; correct: boolean; pulledBy: 'blue' | 'red' }[]>([]);

  // Current Question
  const [currentQuestion, setCurrentQuestion] = useState<QuestionItem | null>(null);
  const [questionKey, setQuestionKey] = useState<number>(0);
  const [isPulling, setIsPulling] = useState<'blue' | 'red' | null>(null);
  const [isSuperPull, setIsSuperPull] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; side: 'blue' | 'red'; color: string } | null>(null);

  // PVP specific locks
  const [p1Locked, setP1Locked] = useState(false);
  const [p2Locked, setP2Locked] = useState(false);

  // AI Timer in 'vs-bot'
  const aiTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [botCountdown, setBotCountdown] = useState<number>(100); // 0 to 100%

  // Keep track of sound setting in soundFX
  useEffect(() => {
    sfx.enabled = soundEnabled;
  }, [soundEnabled]);

  // Clean timers on unmount
  useEffect(() => {
    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    };
  }, []);

  // Generate question helper
  const generateQuestion = useCallback((): QuestionItem | null => {
    if (!words || words.length === 0) return null;
    
    // Pick random target word
    const targetWord = words[Math.floor(Math.random() * words.length)];
    
    // Pick 3 distractors
    const otherWords = words.filter(w => w.id !== targetWord.id);
    const shuffledOthers = shuffleArray(otherWords).slice(0, 3);
    const options = shuffleArray([targetWord, ...shuffledOthers]);

    // Format prompt based on current question type setting
    let promptText = '';
    if (questionType === 'en-to-vi') {
      promptText = targetWord.term;
    } else if (questionType === 'vi-to-en') {
      promptText = targetWord.definition;
    } else {
      promptText = '🎧 Nghe và chọn từ đúng';
    }

    return {
      targetWord,
      options,
      questionPrompt: promptText,
      type: questionType
    };
  }, [words, questionType]);

  // Start new game match
  const startMatch = () => {
    setRopePosition(0);
    setBlueScore(0);
    setRedScore(0);
    setBlueStreak(0);
    setMaxStreak(0);
    setWinner(null);
    setAnsweredWords([]);
    setIsPulling(null);
    setFeedbackMsg(null);
    setP1Locked(false);
    setP2Locked(false);

    sfx.playWhistle();

    const q = generateQuestion();
    setCurrentQuestion(q);
    setQuestionKey(prev => prev + 1);
    setGameState('playing');

    if (q && autoSpeak) {
      setTimeout(() => {
        speakEn(q.targetWord.term, q.targetWord.audioUrl).catch(() => {});
      }, 200);
    }
  };

  // Bot ticking logic (Only in Solo vs Bot)
  useEffect(() => {
    if (gameState !== 'playing' || gameMode !== 'vs-bot' || !currentQuestion) {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
      return;
    }

    // Determine interval speed based on difficulty
    const botSeconds = difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : 5.5;
    const intervalMs = 100;
    const stepDec = 100 / ((botSeconds * 1000) / intervalMs);

    setBotCountdown(100);

    if (aiTimerRef.current) clearInterval(aiTimerRef.current);

    aiTimerRef.current = setInterval(() => {
      setBotCountdown(prev => {
        if (prev <= stepDec) {
          // Bot pulls!
          handleBotPull();
          return 100;
        }
        return prev - stepDec;
      });
    }, intervalMs);

    return () => {
      if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    };
  }, [gameState, gameMode, difficulty, currentQuestion]);

  // Trigger Bot pull
  const handleBotPull = () => {
    if (gameState !== 'playing' || !currentQuestion) return;

    playSound('incorrect');
    sfx.playPull(false);
    setIsPulling('red');
    setRedScore(s => s + 1);
    setBlueStreak(0);

    setFeedbackMsg({
      text: '🤖 Đội Đỏ kéo mạnh!',
      side: 'red',
      color: 'bg-rose-600 text-white'
    });

    setAnsweredWords(prev => [
      ...prev,
      { word: currentQuestion.targetWord, correct: false, pulledBy: 'red' }
    ]);

    setRopePosition(pos => {
      const nextPos = pos - 1;
      if (nextPos <= -maxTugSteps) {
        // Red Wins
        handleGameOver('red');
        return -maxTugSteps;
      }
      return nextPos;
    });

    // Move to next question after animation
    setTimeout(() => {
      setIsPulling(null);
      setFeedbackMsg(null);
      if (ropePosition - 1 > -maxTugSteps) {
        nextQuestion();
      }
    }, 900);
  };

  // Move to next question
  const nextQuestion = () => {
    const nextQ = generateQuestion();
    setCurrentQuestion(nextQ);
    setQuestionKey(prev => prev + 1);
    setP1Locked(false);
    setP2Locked(false);
    setIsPulling(null);
    setFeedbackMsg(null);

    if (nextQ && autoSpeak) {
      speakEn(nextQ.targetWord.term, nextQ.targetWord.audioUrl).catch(() => {});
    }
  };

  // Player answer handling
  const handleAnswer = (selectedWord: Word, playerSide: 'blue' | 'red') => {
    if (gameState !== 'playing' || !currentQuestion) return;
    if (playerSide === 'blue' && p1Locked) return;
    if (playerSide === 'red' && p2Locked) return;

    const isCorrect = selectedWord.id === currentQuestion.targetWord.id;

    if (isCorrect) {
      playSound('correct');
      
      const newStreak = playerSide === 'blue' ? blueStreak + 1 : 0;
      if (playerSide === 'blue') {
        setBlueStreak(newStreak);
        setMaxStreak(m => Math.max(m, newStreak));
      }

      const superPull = newStreak >= 3;
      setIsSuperPull(superPull);
      sfx.playPull(superPull);

      const pullDistance = superPull ? 1.5 : 1;
      setIsPulling(playerSide);

      if (playerSide === 'blue') {
        setBlueScore(s => s + 1);
      } else {
        setRedScore(s => s + 1);
      }

      setFeedbackMsg({
        text: superPull 
          ? `⚡ SIÊU KÉO 3X COMBO! (+${pullDistance})` 
          : playerSide === 'blue' ? '💪 Đội Xanh dậm chân KÉO!' : '🔥 Đội Đỏ giật mạnh!',
        side: playerSide,
        color: playerSide === 'blue' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'
      });

      setAnsweredWords(prev => [
        ...prev,
        { word: currentQuestion.targetWord, correct: true, pulledBy: playerSide }
      ]);

      setRopePosition(pos => {
        const nextPos = playerSide === 'blue' 
          ? Math.min(maxTugSteps, pos + pullDistance)
          : Math.max(-maxTugSteps, pos - pullDistance);

        if (nextPos >= maxTugSteps) {
          handleGameOver('blue');
        } else if (nextPos <= -maxTugSteps) {
          handleGameOver('red');
        }
        return nextPos;
      });

      // Next question after brief pull pause
      setTimeout(() => {
        setIsPulling(null);
        setIsSuperPull(false);
        setFeedbackMsg(null);
        if (playerSide === 'blue' && ropePosition + pullDistance < maxTugSteps) {
          nextQuestion();
        } else if (playerSide === 'red' && ropePosition - pullDistance > -maxTugSteps) {
          nextQuestion();
        }
      }, 850);

    } else {
      // Wrong answer
      playSound('incorrect');
      if (playerSide === 'blue') {
        setBlueStreak(0);
        // Lock player briefly or give opponent advantage
        if (gameMode === 'vs-bot') {
          // In vs bot, wrong answer gives bot immediate pull step
          sfx.playPull(false);
          setIsPulling('red');
          setRedScore(s => s + 1);
          setFeedbackMsg({
            text: '❌ Trả lời sai! Đội Đỏ kéo về 1 nấc!',
            side: 'red',
            color: 'bg-rose-500 text-white'
          });

          setAnsweredWords(prev => [
            ...prev,
            { word: currentQuestion.targetWord, correct: false, pulledBy: 'red' }
          ]);

          setRopePosition(pos => {
            const nextPos = pos - 1;
            if (nextPos <= -maxTugSteps) {
              handleGameOver('red');
              return -maxTugSteps;
            }
            return nextPos;
          });

          setTimeout(() => {
            setIsPulling(null);
            setFeedbackMsg(null);
            if (ropePosition - 1 > -maxTugSteps) {
              nextQuestion();
            }
          }, 850);
        } else {
          // In 2P mode, wrong answer temporarily locks that player for 1.5s
          setP1Locked(true);
          setFeedbackMsg({
            text: '⚠️ Đội Xanh vấp chân! Tạm khoá 1.5 giây!',
            side: 'blue',
            color: 'bg-amber-600 text-white'
          });
          setTimeout(() => {
            setP1Locked(false);
            setFeedbackMsg(null);
          }, 1500);
        }
      } else {
        // Red answered wrong in PVP
        setP2Locked(true);
        setFeedbackMsg({
          text: '⚠️ Đội Đỏ vấp chân! Tạm khoá 1.5 giây!',
          side: 'red',
          color: 'bg-amber-600 text-white'
        });
        setTimeout(() => {
          setP2Locked(false);
          setFeedbackMsg(null);
        }, 1500);
      }
    }
  };

  // Match Over
  const handleGameOver = (winningSide: 'blue' | 'red') => {
    if (aiTimerRef.current) clearInterval(aiTimerRef.current);
    setWinner(winningSide);
    setGameState('game-over');

    sfx.playSplash();
    setTimeout(() => {
      sfx.playVictory();
      if (winningSide === 'blue') {
        fireConfetti();
      }
    }, 400);
  };

  // Percentage position of rope center flag from left (0% to 100%)
  // Range is -maxTugSteps to +maxTugSteps.
  // When ropePosition = 0 -> 50%
  // When ropePosition = +5 -> 20% (pulled left)
  // When ropePosition = -5 -> 80% (pulled right)
  const ropeShiftPercent = 50 - (ropePosition / maxTugSteps) * 28;

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden relative font-sans">
      
      {/* Top Navigation & Status Bar */}
      <div className="w-full bg-slate-950/80 backdrop-blur border-b border-slate-800 px-3 py-2 sm:px-6 sm:py-3 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20 text-white font-black text-xl">
            🪢
          </div>
          <div>
            <h1 className="font-black text-sm sm:text-base tracking-wide text-white flex items-center gap-2">
              KÉO CO TỪ VỰNG <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">Tug-of-War</span>
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400">
              {gameMode === 'vs-bot' ? `Solo vs Bot (${difficulty.toUpperCase()})` : 'Đấu 2 Người (1 vs 1)'}
            </p>
          </div>
        </div>

        {/* Action Controls & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {gameState === 'playing' && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-bold">
              <span className="text-blue-400">Xanh: {blueScore}</span>
              <span className="text-slate-500">|</span>
              <span className="text-red-400">Đỏ: {redScore}</span>
            </div>
          )}

          {gameState === 'playing' && blueStreak >= 2 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black shadow-md animate-pulse">
              <Flame className="w-3.5 h-3.5" />
              <span>{blueStreak}x COMBO!</span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          <button
            onClick={onExit}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs sm:text-sm font-semibold transition-all border border-slate-700"
          >
            Thoát
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col justify-between overflow-hidden relative">
        
        {/* ========================================================= */}
        {/* LOBBY / SETUP SCREEN */}
        {/* ========================================================= */}
        {gameState === 'lobby' && (
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto z-10">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-xl bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md"
            >
              <div className="text-center mb-6">
                <div className="inline-block p-4 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-red-600 text-4xl shadow-xl mb-3">
                  🪢 ⚡
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white">Đấu Kéo Co Từ Vựng</h2>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Trả lời nhanh và chính xác để dồn lực kéo đối thủ té xuống vũng bùn!
                </p>
              </div>

              {/* Mode Selection */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    1. Chế Độ Chơi
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setGameMode('vs-bot')}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        gameMode === 'vs-bot'
                          ? 'border-blue-500 bg-blue-500/20 text-white shadow-lg shadow-blue-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/40'
                      }`}
                    >
                      <Bot className={`w-6 h-6 ${gameMode === 'vs-bot' ? 'text-blue-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-sm">Đấu với Máy (AI)</div>
                        <div className="text-[11px] opacity-75">Luyện tập 1 người</div>
                      </div>
                    </button>

                    <button
                      onClick={() => setGameMode('pvp')}
                      className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                        gameMode === 'pvp'
                          ? 'border-indigo-500 bg-indigo-500/20 text-white shadow-lg shadow-indigo-500/10'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/40'
                      }`}
                    >
                      <Users className={`w-6 h-6 ${gameMode === 'pvp' ? 'text-indigo-400' : 'text-slate-500'}`} />
                      <div>
                        <div className="font-bold text-sm">2 Người Cùng Máy</div>
                        <div className="text-[11px] opacity-75">1 vs 1 trên cùng thiết bị</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Difficulty for vs-bot */}
                {gameMode === 'vs-bot' && (
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                      2. Độ Khó Của Máy
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['easy', 'normal', 'hard'] as Difficulty[]).map((dif) => (
                        <button
                          key={dif}
                          onClick={() => setDifficulty(dif)}
                          className={`py-2.5 px-3 rounded-xl border text-center font-bold text-xs capitalize transition-all ${
                            difficulty === dif
                              ? dif === 'easy'
                                ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                                : dif === 'normal'
                                ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                                : 'border-rose-500 bg-rose-500/20 text-rose-300'
                              : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:bg-slate-700/40'
                          }`}
                        >
                          {dif === 'easy' ? '🌱 Dễ' : dif === 'normal' ? '🔥 Vừa' : '⚡ Khó (Boss)'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Question Type Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">
                    {gameMode === 'vs-bot' ? '3.' : '2.'} Dạng Câu Hỏi
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setQuestionType('en-to-vi')}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        questionType === 'en-to-vi'
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Anh ➔ Việt
                    </button>
                    <button
                      onClick={() => setQuestionType('vi-to-en')}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        questionType === 'vi-to-en'
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      Việt ➔ Anh
                    </button>
                    <button
                      onClick={() => setQuestionType('listen')}
                      className={`py-2 px-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                        questionType === 'listen'
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-300'
                          : 'border-slate-700 bg-slate-800/60 text-slate-400'
                      }`}
                    >
                      🎧 Nghe phát âm
                    </button>
                  </div>
                </div>

                {/* Auto pronunciation toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
                  <span className="text-xs text-slate-300 font-medium">Tự động đọc từ khi ra câu hỏi</span>
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Start Button */}
              <button
                onClick={startMatch}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-red-600 hover:from-blue-500 hover:to-red-500 text-white font-black text-base shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 transition-transform active:scale-95 cursor-pointer"
              >
                <Play className="w-5 h-5 fill-white" />
                BẮT ĐẦU KÉO CO NGAY!
              </button>
            </motion.div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ARENA FIELD (STADIUM, ROPE, TEAMS & WATER PUDDLE) */}
        {/* ========================================================= */}
        <div className={`relative w-full ${gameState === 'lobby' ? 'h-32 opacity-40 pointer-events-none' : 'flex-1 min-h-[220px] sm:min-h-[280px]'} flex flex-col justify-end overflow-hidden select-none transition-all`}>
          
          {/* Arena Background: Sky & Stadium crowd banners */}
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-950/60 pointer-events-none" />

          {/* Stadium Floodlights & Ambient Glow */}
          <div className="absolute top-0 left-1/4 w-72 h-48 bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute top-0 right-1/4 w-72 h-48 bg-red-500/10 blur-3xl pointer-events-none" />

          {/* Grass Arena Ground */}
          <div className="relative w-full h-32 sm:h-44 bg-gradient-to-t from-emerald-900 to-emerald-700 border-t-4 border-emerald-600/80 shadow-inner flex items-center justify-center">
            
            {/* Field Boundary Lines & Meter markers */}
            <div className="absolute inset-x-0 bottom-4 sm:bottom-6 flex justify-between px-10 sm:px-24 text-[10px] sm:text-xs font-bold text-white/40 tracking-wider">
              <span className="flex items-center gap-1 text-blue-300">⬅ VẠCH THẮNG ĐỘI XANH (+5)</span>
              <span className="text-amber-300">▲ RANH GIỚI TRUNG TÂM (0)</span>
              <span className="flex items-center gap-1 text-red-300">VẠCH THẮNG ĐỘI ĐỎ (-5) ➡</span>
            </div>

            {/* Victory boundary posts */}
            <div className="absolute left-[20%] bottom-6 sm:bottom-10 w-2 h-14 sm:h-20 bg-blue-400/80 rounded-full shadow-lg shadow-blue-500/50 flex flex-col items-center">
              <div className="w-5 h-4 bg-blue-500 rounded-sm -top-2 absolute shadow text-[9px] text-white font-bold flex items-center justify-center">WIN</div>
            </div>
            <div className="absolute right-[20%] bottom-6 sm:bottom-10 w-2 h-14 sm:h-20 bg-red-400/80 rounded-full shadow-lg shadow-red-500/50 flex flex-col items-center">
              <div className="w-5 h-4 bg-red-500 rounded-sm -top-2 absolute shadow text-[9px] text-white font-bold flex items-center justify-center">WIN</div>
            </div>

            {/* Mud / Water Splash Pit in Center */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-6 w-36 sm:w-56 h-8 sm:h-12 bg-amber-950/80 border-2 border-amber-800 rounded-[50%] shadow-inner flex items-center justify-center overflow-hidden">
              <div className="w-full h-full bg-gradient-to-r from-amber-900/60 via-amber-800/80 to-amber-900/60 rounded-[50%] animate-pulse" />
              <span className="absolute text-[9px] sm:text-[10px] font-black text-amber-300/80 tracking-wider">
                🌊 VŨNG BÙN NƯỚC
              </span>
            </div>

            {/* ========================================================= */}
            {/* DYNAMIC TUG ROPE & CENTER RED RIBBON FLAG */}
            {/* ========================================================= */}
            <div 
              className="absolute bottom-16 sm:bottom-24 w-[160%] left-[-30%] h-4 sm:h-5 transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(${(ropePosition / maxTugSteps) * 12}%)`
              }}
            >
              {/* Rope Body with realistic texture */}
              <div className="w-full h-full bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 rounded-full shadow-lg shadow-black/50 border border-amber-800/80 flex items-center overflow-hidden">
                <div 
                  className="w-full h-full opacity-30" 
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #78350f 0, #78350f 8px, #d97706 8px, #d97706 16px)'
                  }} 
                />
              </div>

              {/* Center Ribbon / Flag */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
                <div className="w-5 h-7 sm:w-6 sm:h-9 bg-rose-600 rounded-sm shadow-xl border border-white/60 animate-bounce flex items-center justify-center text-white text-[10px] font-black">
                  🚩
                </div>
                <div className="w-1 h-3 bg-red-800" />
              </div>
            </div>

            {/* ========================================================= */}
            {/* TEAM BLUE CHARACTERS (LEFT SIDE) */}
            {/* ========================================================= */}
            <div 
              className="absolute bottom-12 sm:bottom-20 transition-all duration-500 ease-out flex items-end gap-2 sm:gap-4 z-10"
              style={{
                left: `calc(22% + ${(ropePosition / maxTugSteps) * 15}%)`,
                transform: isPulling === 'blue' 
                  ? 'rotate(-12deg) translateY(-4px)' 
                  : isPulling === 'red' 
                  ? 'rotate(8deg) translateX(8px)' 
                  : 'rotate(-4deg)'
              }}
            >
              {/* Member 1: Captain Bear */}
              <div className="flex flex-col items-center">
                {isPulling === 'blue' && (
                  <span className="text-[10px] font-black text-amber-300 animate-ping -mb-1">💦 KÉO!</span>
                )}
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'blue' ? 'scale-110' : ''}`}>
                  🐻
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-blue-600 text-[9px] font-black text-white shadow">
                  XANH
                </div>
              </div>

              {/* Member 2: Speedy Bunny */}
              <div className="flex flex-col items-center">
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'blue' ? 'scale-110' : ''}`}>
                  🐰
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-blue-500 text-[9px] font-black text-white shadow">
                  P1
                </div>
              </div>

              {/* Member 3: Strong Fox */}
              <div className="flex flex-col items-center">
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'blue' ? 'scale-110' : ''}`}>
                  🦊
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-blue-700 text-[9px] font-black text-white shadow">
                  P1
                </div>
              </div>
            </div>

            {/* ========================================================= */}
            {/* TEAM RED CHARACTERS (RIGHT SIDE) */}
            {/* ========================================================= */}
            <div 
              className="absolute bottom-12 sm:bottom-20 transition-all duration-500 ease-out flex items-end gap-2 sm:gap-4 z-10"
              style={{
                right: `calc(22% - ${(ropePosition / maxTugSteps) * 15}%)`,
                transform: isPulling === 'red' 
                  ? 'rotate(12deg) translateY(-4px)' 
                  : isPulling === 'blue' 
                  ? 'rotate(-8deg) translateX(-8px)' 
                  : 'rotate(4deg)'
              }}
            >
              {/* Member 1: Wolf / Opponent */}
              <div className="flex flex-col items-center">
                {isPulling === 'red' && (
                  <span className="text-[10px] font-black text-red-300 animate-ping -mb-1">🔥 GỒNG!</span>
                )}
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'red' ? 'scale-110' : ''}`}>
                  🦁
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-red-600 text-[9px] font-black text-white shadow">
                  {gameMode === 'vs-bot' ? 'BOT' : 'P2'}
                </div>
              </div>

              {/* Member 2: Robot / Tiger */}
              <div className="flex flex-col items-center">
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'red' ? 'scale-110' : ''}`}>
                  🤖
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-red-500 text-[9px] font-black text-white shadow">
                  {gameMode === 'vs-bot' ? 'AI' : 'P2'}
                </div>
              </div>

              {/* Member 3: Fierce Dragon */}
              <div className="flex flex-col items-center">
                <div className={`text-3xl sm:text-5xl transition-transform ${isPulling === 'red' ? 'scale-110' : ''}`}>
                  🐲
                </div>
                <div className="px-1.5 py-0.5 rounded-full bg-red-700 text-[9px] font-black text-white shadow">
                  {gameMode === 'vs-bot' ? 'AI' : 'ĐỎ'}
                </div>
              </div>
            </div>

            {/* Dynamic Banner Notification in Match */}
            <AnimatePresence>
              {feedbackMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute top-4 px-4 py-2 rounded-2xl shadow-xl font-black text-xs sm:text-sm tracking-wide z-20 ${feedbackMsg.color}`}
                >
                  {feedbackMsg.text}
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* AI Countdown Meter in Solo Mode */}
          {gameState === 'playing' && gameMode === 'vs-bot' && (
            <div className="w-full bg-slate-950/80 px-4 py-1.5 flex items-center justify-between text-[11px] font-bold text-slate-400 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <Bot className="w-3.5 h-3.5 text-rose-400" />
                Thời gian nạp lực của AI:
              </span>
              <div className="w-36 sm:w-56 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className={`h-full transition-all duration-100 ${
                    botCountdown < 30 ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                  style={{ width: `${botCountdown}%` }}
                />
              </div>
              <span className="text-rose-400 font-mono">
                {Math.ceil((botCountdown / 100) * (difficulty === 'easy' ? 12 : difficulty === 'normal' ? 8 : 5.5))}s
              </span>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE QUESTION BOARD & ANSWER CONTROLS */}
        {/* ========================================================= */}
        {gameState === 'playing' && currentQuestion && (
          <div className="w-full bg-slate-950/95 border-t border-slate-800 p-3 sm:p-5 z-20 shrink-0">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
              
              {/* Question Header Card */}
              <div className="w-full flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 mb-3 shadow-lg">
                <div className="flex items-center gap-3">
                  {currentQuestion.targetWord.imageUrl && (
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0">
                      <SmartImage
                        src={currentQuestion.targetWord.imageUrl}
                        alt="Vocabulary"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                      {questionType === 'en-to-vi' ? 'Tiếng Anh ➔ Chọn nghĩa tiếng Việt' : questionType === 'vi-to-en' ? 'Tiếng Việt ➔ Chọn từ tiếng Anh' : 'Nghe phát âm'}
                    </span>
                    <div className="text-lg sm:text-2xl font-black text-white flex items-center gap-2">
                      {questionType === 'listen' ? (
                        <span className="text-slate-300 italic">🎧 Bấm loa để nghe lại nếu cần</span>
                      ) : (
                        currentQuestion.questionPrompt
                      )}
                    </div>
                  </div>
                </div>

                {/* Pronounce Replay Button */}
                <button
                  onClick={() => speakEn(currentQuestion.targetWord.term, currentQuestion.targetWord.audioUrl)}
                  className="p-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 transition-all border border-blue-500/30 flex items-center gap-1.5 text-xs font-bold shrink-0"
                  title="Nghe lại phát âm"
                >
                  <Volume2 className="w-5 h-5" />
                  <span className="hidden sm:inline">Phát âm</span>
                </button>
              </div>

              {/* ========================================================= */}
              {/* MODE 1: SOLO VS BOT ANSWERS (Single 4-button grid) */}
              {/* ========================================================= */}
              {gameMode === 'vs-bot' && (
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  {currentQuestion.options.map((option, idx) => {
                    const label = questionType === 'en-to-vi' ? option.definition : option.term;
                    const subLabel = questionType === 'en-to-vi' ? option.term : option.definition;

                    return (
                      <motion.button
                        key={`${questionKey}-${option.id}-${idx}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={isPulling !== null}
                        onClick={() => handleAnswer(option, 'blue')}
                        className={`w-full p-3 sm:p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isPulling !== null
                            ? 'opacity-60 pointer-events-none border-slate-800 bg-slate-900/60'
                            : 'border-slate-800 bg-slate-900/90 hover:border-blue-500/80 hover:bg-blue-500/10 text-white shadow-md active:bg-blue-600/20'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-xs text-blue-400 border border-slate-700">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <div>
                            <div className="font-bold text-sm sm:text-base text-slate-100">{label}</div>
                            {questionType === 'listen' && (
                              <div className="text-[11px] text-slate-400">{subLabel}</div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ========================================================= */}
              {/* MODE 2: PVP 1 VS 1 ANSWERS (Split 2 sides: Blue vs Red) */}
              {/* ========================================================= */}
              {gameMode === 'pvp' && (
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Side: Player 1 (Blue) */}
                  <div className={`p-3 rounded-2xl border ${p1Locked ? 'border-amber-600/60 bg-amber-950/20 opacity-70' : 'border-blue-600/40 bg-blue-950/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-blue-400 uppercase tracking-wider flex items-center gap-1">
                        🔵 ĐỘI XANH (Người chơi 1)
                      </span>
                      {p1Locked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Đang bị khoá 1.5s
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options.map((option, idx) => {
                        const label = questionType === 'en-to-vi' ? option.definition : option.term;
                        return (
                          <button
                            key={`p1-${option.id}-${idx}`}
                            disabled={p1Locked || isPulling !== null}
                            onClick={() => handleAnswer(option, 'blue')}
                            className="p-2.5 sm:p-3 rounded-xl border border-blue-500/30 bg-blue-900/30 hover:bg-blue-600/40 text-blue-100 font-bold text-xs sm:text-sm text-left truncate transition-colors active:scale-95"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Side: Player 2 (Red) */}
                  <div className={`p-3 rounded-2xl border ${p2Locked ? 'border-amber-600/60 bg-amber-950/20 opacity-70' : 'border-red-600/40 bg-red-950/20'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black text-red-400 uppercase tracking-wider flex items-center gap-1">
                        🔴 ĐỘI ĐỎ (Người chơi 2)
                      </span>
                      {p2Locked && (
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                          Đang bị khoá 1.5s
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {currentQuestion.options.map((option, idx) => {
                        const label = questionType === 'en-to-vi' ? option.definition : option.term;
                        return (
                          <button
                            key={`p2-${option.id}-${idx}`}
                            disabled={p2Locked || isPulling !== null}
                            onClick={() => handleAnswer(option, 'red')}
                            className="p-2.5 sm:p-3 rounded-xl border border-red-500/30 bg-red-900/30 hover:bg-red-600/40 text-red-100 font-bold text-xs sm:text-sm text-left truncate transition-colors active:scale-95"
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* GAME OVER / MATCH VICTORY SUMMARY MODAL */}
        {/* ========================================================= */}
        {gameState === 'game-over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center"
            >
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-4xl shadow-xl shadow-amber-500/20 mb-4 animate-bounce">
                {winner === 'blue' ? '🏆' : '👑'}
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {winner === 'blue' 
                  ? '🎉 ĐỘI XANH CHIẾN THẮNG!' 
                  : gameMode === 'vs-bot' ? '🤖 ĐỘI ĐỎ (AI) ĐÃ THẮNG!' : '🎉 ĐỘI ĐỎ CHIẾN THẮNG!'}
              </h2>
              
              <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-6">
                {winner === 'blue'
                  ? 'Xuất sắc! Bạn đã kéo đối thủ rớt vào vũng bùn nước!'
                  : 'Đội đối thủ đã dồn lực kéo lôi bạn qua vạch ranh giới!'}
              </p>

              {/* Match Statistics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tỉ Số Kéo</span>
                  <span className="text-lg font-black text-white">{blueScore} - {redScore}</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Chuỗi Đúng (Streak)</span>
                  <span className="text-lg font-black text-amber-400">{maxStreak}x</span>
                </div>
                <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Tổng Câu Hỏi</span>
                  <span className="text-lg font-black text-blue-400">{answeredWords.length}</span>
                </div>
              </div>

              {/* Reviewed Words list */}
              {answeredWords.length > 0 && (
                <div className="text-left mb-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Từ Vựng Trong Trận Đấu
                  </h4>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                    {answeredWords.slice(-6).map((item, index) => (
                      <div 
                        key={index}
                        className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => speakEn(item.word.term, item.word.audioUrl)}
                            className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                            title="Nghe phát âm"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-white">{item.word.term}</span>
                          <span className="text-slate-400">- {item.word.definition}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.pulledBy === 'blue' ? 'bg-blue-500/20 text-blue-300' : 'bg-red-500/20 text-red-300'
                        }`}>
                          {item.pulledBy === 'blue' ? 'Đội Xanh kéo' : 'Đội Đỏ kéo'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={startMatch}
                  className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <RotateCcw className="w-4 h-4" />
                  ĐẤU LẠI VÁN MỚI
                </button>
                <button
                  onClick={() => setGameState('lobby')}
                  className="py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm border border-slate-700 transition-colors"
                >
                  Cài Đặt
                </button>
              </div>
            </motion.div>
          </div>
        )}

      </div>
    </div>
  );
}
