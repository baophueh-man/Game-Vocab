import React, { useState, useEffect, useRef } from 'react';
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
  Snail, 
  VolumeX,
  Target,
  Medal,
  Award,
  ChevronRight,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

interface PenaltyShootoutQuizProps {
  words: Word[];
  onExit: () => void;
}

type ShotCorner = 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';

interface ShotResult {
  word: Word;
  userWord: Word;
  isGoal: boolean;
  corner: ShotCorner;
}

const CORNER_NAMES: Record<ShotCorner, { name: string; icon: string; x: number; y: number }> = {
  'top-left': { name: 'Góc cao trái', icon: '↖️', x: 22, y: 28 },
  'bottom-left': { name: 'Góc thấp trái', icon: '↙️', x: 25, y: 70 },
  'top-right': { name: 'Góc cao phải', icon: '↗️', x: 78, y: 28 },
  'bottom-right': { name: 'Góc thấp phải', icon: '↘️', x: 75, y: 70 },
};

export default function PenaltyShootoutQuiz({ words, onExit }: PenaltyShootoutQuizProps) {
  const { speakEn, cancelSpeech } = useSettings();

  // Settings
  const [matchLength, setMatchLength] = useState<5 | 10>(5);
  const [speechRate, setSpeechRate] = useState<1.0 | 0.8>(1.0);
  const [showDefinitionHint, setShowDefinitionHint] = useState<boolean>(true);
  const [showTermHint, setShowTermHint] = useState<boolean>(false);

  // Match State
  const [currentShotIndex, setCurrentShotIndex] = useState(0);
  const [history, setHistory] = useState<ShotResult[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Round State
  const [currentTarget, setCurrentTarget] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Animation State
  // ballState: 'ready' (at penalty spot) | 'shooting' | 'celebrate' | 'stopped'
  const [ballState, setBallState] = useState<'ready' | 'shooting' | 'celebrate' | 'stopped'>('ready');
  const [chosenCorner, setChosenCorner] = useState<ShotCorner>('top-left');
  const [lastShotSuccess, setLastShotSuccess] = useState<boolean | null>(null);
  const [keeperAction, setKeeperAction] = useState<'idle' | 'dive-left' | 'dive-right' | 'dive-center'>('idle');
  const [goalFeedbackText, setGoalFeedbackText] = useState<string>('');

  const shotTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextRoundTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clean audio & timers on unmount
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (shotTimerRef.current) clearTimeout(shotTimerRef.current);
      if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);
    };
  }, []);

  // Initialize match
  useEffect(() => {
    startNewMatch(matchLength);
  }, [matchLength, words]);

  const startNewMatch = (length: 5 | 10) => {
    if (words.length === 0) return;
    cancelSpeech();
    if (shotTimerRef.current) clearTimeout(shotTimerRef.current);
    if (nextRoundTimerRef.current) clearTimeout(nextRoundTimerRef.current);

    setCurrentShotIndex(0);
    setHistory([]);
    setIsGameOver(false);
    setBallState('ready');
    setKeeperAction('idle');
    setLastShotSuccess(null);
    setGoalFeedbackText('');

    setupRound(0);
  };

  const setupRound = (shotIndex: number) => {
    if (words.length === 0) return;

    // Pick target word from pool
    // Prioritize words with images, but guarantee all words can be used
    const shuffled = shuffleArray(words);
    const target = shuffled[shotIndex % shuffled.length];

    // Pick 3 distractors
    const others = words.filter(w => w.id !== target.id);
    const shuffledOthers = shuffleArray(others);
    const distractors = shuffledOthers.slice(0, 3);

    // Combine and shuffle 4 options
    const roundOptions = shuffleArray([target, ...distractors]);

    setCurrentTarget(target);
    setOptions(roundOptions);
    setBallState('ready');
    setKeeperAction('idle');
    setLastShotSuccess(null);
    setGoalFeedbackText('');

    // Play pronunciation automatically
    setTimeout(() => {
      handlePronounce(target.term, target.audioUrl, speechRate);
    }, 250);
  };

  const handlePronounce = async (term: string, audioUrl?: string, rate: number = 1.0) => {
    if (!term) return;
    setIsPlayingAudio(true);
    try {
      await speakEn(term, audioUrl, 1);
    } catch (e) {
      console.warn('Speech failed', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleSelectOption = (chosenWord: Word, optionIndex: number) => {
    if (ballState !== 'ready' || !currentTarget || isGameOver) return;

    const corners: ShotCorner[] = ['top-left', 'bottom-left', 'top-right', 'bottom-right'];
    const corner = corners[optionIndex % corners.length];
    setChosenCorner(corner);

    const isGoal = chosenWord.id === currentTarget.id;
    setLastShotSuccess(isGoal);
    setBallState('shooting');

    // Keeper dive decision:
    // If GOAL: keeper dives in opposite direction or wrong altitude, ball goes in!
    // If MISS / SAVED: keeper dives EXACTLY to the chosen corner and saves/catches the ball!
    if (isGoal) {
      if (corner.includes('left')) {
        setKeeperAction('dive-right'); // keeper goes right, ball goes left -> GOAL
      } else {
        setKeeperAction('dive-left'); // keeper goes left, ball goes right -> GOAL
      }
    } else {
      if (corner.includes('left')) {
        setKeeperAction('dive-left'); // keeper dives left and catches ball -> SAVED
      } else {
        setKeeperAction('dive-right'); // keeper dives right and catches ball -> SAVED
      }
    }

    // Play sound and trigger reaction after ball flight duration (~600ms)
    shotTimerRef.current = setTimeout(() => {
      if (isGoal) {
        setBallState('celebrate');
        setGoalFeedbackText('⚽ VÀO O O! GOAL!!');
        playSound('correct');
        // Play whistle/cheer
        playWhistleSound();
      } else {
        setBallState('stopped');
        setGoalFeedbackText('🧤 BỊ THỦ MÔN BẮT DÍNH! SAVED!!');
        playSound('incorrect');
      }

      const newHistory = [...history, { word: currentTarget, userWord: chosenWord, isGoal, corner }];
      setHistory(newHistory);

      // Advance to next round or finish match
      const nextIndex = currentShotIndex + 1;
      nextRoundTimerRef.current = setTimeout(() => {
        if (nextIndex >= matchLength) {
          setIsGameOver(true);
          const totalGoals = newHistory.filter(h => h.isGoal).length;
          if (totalGoals >= Math.ceil(matchLength * 0.6)) {
            fireConfetti();
          }
        } else {
          setCurrentShotIndex(nextIndex);
          setupRound(nextIndex);
        }
      }, 1800);

    }, 650);
  };

  // Synthesize referee whistle using Web Audio API
  const playWhistleSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(2600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(3200, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(2800, ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(3400, ctx.currentTime + 0.35);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // ignore
    }
  };

  const goalsCount = history.filter(h => h.isGoal).length;

  // Ball coordinate mapping based on chosenCorner & state
  const getBallCoordinates = () => {
    if (ballState === 'ready') {
      // Center penalty spot
      return { x: 50, y: 88, scale: 1.0, rotate: 0 };
    }
    
    // Target coordinate in the goal frame (percentage)
    const target = CORNER_NAMES[chosenCorner];
    if (ballState === 'shooting' || ballState === 'celebrate') {
      return {
        x: target.x,
        y: target.y,
        scale: 0.42, // shrink as it travels into distance
        rotate: 720
      };
    }

    if (ballState === 'stopped') {
      // Stopped in keeper's hands (near the keeper)
      const isLeft = chosenCorner.includes('left');
      return {
        x: isLeft ? 32 : 68,
        y: chosenCorner.includes('top') ? 40 : 55,
        scale: 0.45,
        rotate: 360
      };
    }

    return { x: 50, y: 88, scale: 1.0, rotate: 0 };
  };

  const ballPos = getBallCoordinates();

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 text-white select-none overflow-hidden relative font-sans">
      {/* Top Scoreboard HUD */}
      <div className="z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-3 sm:px-6 py-2.5 flex items-center justify-between shadow-xl shrink-0">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/40 px-3 py-1 rounded-xl text-emerald-400 font-black text-xs sm:text-sm tracking-wider uppercase">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>Penalty Shootout</span>
          </div>

          {/* 5 or 10 Match Selector */}
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700 text-xs font-bold">
            <button
              onClick={() => { if (!isGameOver && history.length === 0) setMatchLength(5); else startNewMatch(5); }}
              className={`px-2.5 py-1 rounded-md transition-all ${matchLength === 5 ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              5 Quả
            </button>
            <button
              onClick={() => { if (!isGameOver && history.length === 0) setMatchLength(10); else startNewMatch(10); }}
              className={`px-2.5 py-1 rounded-md transition-all ${matchLength === 10 ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-400 hover:text-white'}`}
            >
              10 Quả
            </button>
          </div>
        </div>

        {/* Penalty tracker dots & Score */}
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-1 bg-black/50 px-2 sm:px-3 py-1 rounded-xl border border-slate-800">
            {Array.from({ length: matchLength }).map((_, idx) => {
              const res = history[idx];
              return (
                <div 
                  key={idx} 
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border transition-all ${
                    idx === currentShotIndex && !isGameOver 
                      ? 'border-amber-400 bg-amber-400/20 scale-110 shadow-xs shadow-amber-400/50' 
                      : res 
                        ? res.isGoal 
                          ? 'border-emerald-500 bg-emerald-500/30 text-emerald-300' 
                          : 'border-rose-500 bg-rose-500/30 text-rose-300'
                        : 'border-slate-700 bg-slate-800/60 text-slate-500'
                  }`}
                >
                  {res ? (res.isGoal ? '⚽' : '❌') : (idx + 1)}
                </div>
              );
            })}
          </div>

          {/* Current Score badge */}
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tỷ Số Bàn Thắng</div>
            <div className="text-lg sm:text-2xl font-black text-amber-400 tabular-nums">
              {goalsCount} <span className="text-xs text-slate-400">/ {currentShotIndex + (isGameOver ? 0 : 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Stadium & Goal Area */}
      <div className="relative flex-1 w-full overflow-hidden flex flex-col justify-between">
        {/* Stadium Floodlights & Sky Backdrop */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-950 via-slate-900 to-emerald-950 pointer-events-none">
          {/* Stadium Crowd Silhouette */}
          <div className="absolute top-0 left-0 right-0 h-28 opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-slate-700/10 to-transparent flex items-end justify-center overflow-hidden">
            <div className="w-full h-12 flex justify-between px-4 opacity-40">
              {Array.from({ length: 24 }).map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 bg-slate-300 rounded-t-full"
                  style={{ height: `${20 + (i % 5) * 8}px` }} 
                />
              ))}
            </div>
          </div>

          {/* Stadium Lights Flare */}
          <div className="absolute top-2 left-6 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute top-2 right-6 w-24 h-24 bg-amber-200/10 rounded-full blur-2xl pointer-events-none" />
        </div>

        {/* Realistic Green Grass Pitch with Perspective */}
        <div className="absolute inset-x-0 bottom-0 top-16 overflow-hidden pointer-events-none">
          <div className="w-full h-full relative" style={{ perspective: '900px' }}>
            <div 
              className="absolute inset-0 origin-bottom"
              style={{
                transform: 'rotateX(25deg)',
                backgroundImage: 'repeating-linear-gradient(0deg, #15803d 0px, #15803d 40px, #166534 40px, #166534 80px)',
                boxShadow: 'inset 0 100px 100px -50px rgba(0,0,0,0.8)'
              }}
            >
              {/* Penalty Area Lines */}
              <div className="absolute top-1/4 inset-x-12 bottom-0 border-t-4 border-x-4 border-white/60 pointer-events-none" />
              {/* Penalty Arc */}
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-48 h-24 border-t-4 border-white/60 rounded-t-full pointer-events-none" />
              {/* Penalty Spot Dot */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-5 h-5 bg-white rounded-full shadow-lg border-2 border-slate-300 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Stadium Goal Frame & Keeper Canvas */}
        <div className="relative z-10 w-full max-w-2xl mx-auto px-4 pt-2 sm:pt-4 flex-1 flex flex-col items-center justify-center max-h-[380px] sm:max-h-[440px]">
          {/* Goal Post Frame SVG Container */}
          <div className="relative w-full aspect-[16/9] max-w-[540px] flex items-center justify-center">
            {/* White Goal Posts Structure */}
            <div className="absolute inset-x-4 top-4 bottom-2 border-t-[10px] border-x-[10px] border-white rounded-t-lg shadow-2xl overflow-hidden bg-slate-950/40">
              {/* Net Mesh (Crosshatch pattern) */}
              <div 
                className="w-full h-full opacity-35"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, rgba(255,255,255,0.4) 1px, transparent 1px),
                    linear-gradient(-45deg, rgba(255,255,255,0.4) 1px, transparent 1px)
                  `,
                  backgroundSize: '14px 14px'
                }}
              />
              {/* Target Corner Indicators for guidance */}
              <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white/70 border border-white/20">↖️ Góc Cao</div>
              <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white/70 border border-white/20">↙️ Góc Thấp</div>
              <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white/70 border border-white/20">Góc Cao ↗️</div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 rounded text-[10px] font-bold text-white/70 border border-white/20">Góc Thấp ↘️</div>
            </div>

            {/* Goalkeeper (SVG Character) */}
            <motion.div 
              className="absolute z-15 pointer-events-none"
              style={{ bottom: '10%' }}
              animate={
                keeperAction === 'dive-left' ? {
                  x: -120,
                  y: chosenCorner.includes('top') ? -45 : -10,
                  rotate: -45,
                  scale: 1.05
                } : keeperAction === 'dive-right' ? {
                  x: 120,
                  y: chosenCorner.includes('top') ? -45 : -10,
                  rotate: 45,
                  scale: 1.05
                } : {
                  x: 0,
                  y: [0, -6, 0],
                  rotate: 0,
                  scale: 1
                }
              }
              transition={
                keeperAction === 'idle' 
                  ? { repeat: Infinity, duration: 1.6, ease: "easeInOut" }
                  : { type: "spring", stiffness: 220, damping: 18 }
              }
            >
              {/* Goalkeeper Avatar SVG */}
              <div className="relative w-28 h-36 flex flex-col items-center justify-end">
                <svg viewBox="0 0 120 150" className="w-full h-full drop-shadow-xl">
                  {/* Keeper Body Shadow */}
                  <ellipse cx="60" cy="142" rx="28" ry="6" fill="rgba(0,0,0,0.3)" />

                  {/* Left Arm & Glove */}
                  <g className={keeperAction.includes('left') ? 'origin-center -rotate-25' : ''}>
                    <rect x="15" y="60" width="16" height="34" rx="8" fill="#f59e0b" transform="rotate(25 23 77)" />
                    {/* Big Goalkeeper Glove */}
                    <circle cx="16" cy="55" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <rect x="8" y="58" width="16" height="4" rx="2" fill="#ffffff" />
                  </g>

                  {/* Right Arm & Glove */}
                  <g className={keeperAction.includes('right') ? 'origin-center rotate-25' : ''}>
                    <rect x="89" y="60" width="16" height="34" rx="8" fill="#f59e0b" transform="rotate(-25 97 77)" />
                    {/* Big Goalkeeper Glove */}
                    <circle cx="104" cy="55" r="13" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                    <rect x="96" y="58" width="16" height="4" rx="2" fill="#ffffff" />
                  </g>

                  {/* Legs & Cleats */}
                  <rect x="42" y="96" width="14" height="36" rx="6" fill="#1e293b" />
                  <rect x="64" y="96" width="14" height="36" rx="6" fill="#1e293b" />
                  {/* Cleats */}
                  <rect x="38" y="128" width="18" height="10" rx="3" fill="#0f172a" />
                  <rect x="64" y="128" width="18" height="10" rx="3" fill="#0f172a" />

                  {/* Keeper Torso / Jersey */}
                  <path d="M 36 60 Q 60 52 84 60 L 82 100 L 38 100 Z" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
                  <text x="60" y="85" textAnchor="middle" fill="#1e293b" fontSize="16" fontWeight="900">1</text>

                  {/* Keeper Head */}
                  <circle cx="60" cy="38" r="20" fill="#fbcfe8" />
                  {/* Hair / Cap */}
                  <path d="M 40 34 C 40 18 80 18 80 34 C 74 26 46 26 40 34 Z" fill="#3b82f6" />
                  <path d="M 42 28 L 78 28 L 84 32 L 36 32 Z" fill="#2563eb" />

                  {/* Eyes & Expression */}
                  {keeperAction === 'idle' ? (
                    <>
                      <circle cx="53" cy="38" r="3" fill="#0f172a" />
                      <circle cx="67" cy="38" r="3" fill="#0f172a" />
                      <path d="M 55 46 Q 60 50 65 46" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" fill="none" />
                    </>
                  ) : lastShotSuccess ? (
                    /* Shocked / Beaten eyes */
                    <>
                      <circle cx="53" cy="38" r="4" fill="#0f172a" />
                      <circle cx="67" cy="38" r="4" fill="#0f172a" />
                      <circle cx="60" cy="48" r="4" fill="#0f172a" />
                    </>
                  ) : (
                    /* Victorious saved grin */
                    <>
                      <path d="M 50 36 L 56 36" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 64 36 L 70 36" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" />
                      <path d="M 52 44 Q 60 54 68 44 Z" fill="#ef4444" />
                    </>
                  )}
                </svg>
              </div>
            </motion.div>

            {/* Flying 3D Soccer Ball */}
            <motion.div 
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${ballPos.x}%`,
                top: `${ballPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
              animate={{
                left: `${ballPos.x}%`,
                top: `${ballPos.y}%`,
                scale: ballPos.scale,
                rotate: ballPos.rotate,
              }}
              transition={{
                duration: ballState === 'shooting' ? 0.65 : 0.25,
                ease: ballState === 'shooting' ? [0.22, 1, 0.36, 1] : "easeOut"
              }}
            >
              {/* Telstar Classic Soccer Ball Pattern */}
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white shadow-2xl flex items-center justify-center border border-slate-300 overflow-hidden">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="48" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Classic Pentagons */}
                  <polygon points="50,35 64,45 59,62 41,62 36,45" fill="#0f172a" />
                  <polygon points="50,12 40,5 60,5" fill="#0f172a" />
                  <polygon points="18,30 5,25 10,40" fill="#0f172a" />
                  <polygon points="82,30 95,25 90,40" fill="#0f172a" />
                  <polygon points="25,80 15,90 35,92" fill="#0f172a" />
                  <polygon points="75,80 85,90 65,92" fill="#0f172a" />
                  {/* Ball Shine Highlight */}
                  <path d="M 25 20 A 35 35 0 0 1 75 20 A 42 42 0 0 0 25 20 Z" fill="rgba(255,255,255,0.4)" />
                </svg>
              </div>
            </motion.div>

            {/* In-Goal Flash / Result Banner */}
            <AnimatePresence>
              {goalFeedbackText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`absolute z-30 px-6 py-2.5 rounded-2xl shadow-2xl font-black text-xl sm:text-2xl tracking-wide uppercase border-2 flex items-center gap-2 ${
                    lastShotSuccess 
                      ? 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-500/50' 
                      : 'bg-rose-700/95 text-white border-rose-300 shadow-rose-600/50'
                  }`}
                >
                  <span>{goalFeedbackText}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Central Audio Prompter & Helper Strip */}
        <div className="z-20 w-full max-w-2xl mx-auto px-4 py-1 flex items-center justify-between gap-3">
          {/* Main Listen Button */}
          <button
            onClick={() => currentTarget && handlePronounce(currentTarget.term, currentTarget.audioUrl, speechRate)}
            disabled={ballState !== 'ready'}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-600 active:scale-98 transition-all rounded-2xl shadow-lg border border-emerald-400/40 flex items-center justify-center gap-3 group"
          >
            <div className={`p-2 rounded-full bg-white/20 text-white shadow-xs ${isPlayingAudio ? 'animate-pulse scale-110' : 'group-hover:scale-110 transition-transform'}`}>
              <Volume2 className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xs uppercase font-extrabold text-emerald-200 tracking-wider flex items-center gap-2">
                <span>Nghe phát âm để sút phạt</span>
                {isPlayingAudio && <span className="inline-block w-2 h-2 rounded-full bg-amber-400 animate-ping" />}
              </div>
              <div className="text-sm font-black text-white flex items-center gap-2">
                <span>Bấm để nghe lại</span>
                {showTermHint && currentTarget && (
                  <span className="text-xs text-amber-300 font-mono font-bold bg-black/40 px-2 py-0.5 rounded">
                    "{currentTarget.term}"
                  </span>
                )}
              </div>
            </div>
          </button>

          {/* Speed Toggle & Hint Toggles */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setSpeechRate(prev => prev === 1.0 ? 0.8 : 1.0)}
              className={`p-2 rounded-lg text-xs font-bold transition-colors ${speechRate === 0.8 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'text-slate-400 hover:text-white'}`}
              title="Đổi tốc độ đọc (1.0x / 0.8x)"
            >
              {speechRate === 0.8 ? <Snail className="w-4 h-4" /> : <Flame className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowDefinitionHint(prev => !prev)}
              className={`p-2 rounded-lg text-xs font-bold transition-colors ${showDefinitionHint ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'text-slate-400 hover:text-white'}`}
              title={showDefinitionHint ? "Ẩn nghĩa tiếng Việt" : "Hiện nghĩa tiếng Việt"}
            >
              {showDefinitionHint ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4 Picture Option Cards (Shooting Target Corners) */}
        <div className="z-20 w-full max-w-3xl mx-auto p-3 sm:p-4 pb-4">
          <div className="text-center text-xs font-bold text-slate-400 mb-2">
            Chọn 1 hình ảnh tương ứng với từ nghe được để sút vào lưới:
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {options.map((option, idx) => {
              const cornerKey: ShotCorner = (['top-left', 'bottom-left', 'top-right', 'bottom-right'] as ShotCorner[])[idx];
              const cornerMeta = CORNER_NAMES[cornerKey];
              const isSelected = chosenCorner === cornerKey && ballState !== 'ready';
              const isCorrectTarget = currentTarget && option.id === currentTarget.id;

              return (
                <motion.button
                  key={option.id + idx}
                  whileHover={ballState === 'ready' ? { y: -3, scale: 1.02 } : {}}
                  whileTap={ballState === 'ready' ? { scale: 0.97 } : {}}
                  onClick={() => handleSelectOption(option, idx)}
                  disabled={ballState !== 'ready' || isGameOver}
                  className={`relative flex flex-col items-center p-2 sm:p-2.5 rounded-2xl border-2 transition-all duration-300 text-left overflow-hidden ${
                    isSelected 
                      ? isCorrectTarget 
                        ? 'bg-emerald-950/80 border-emerald-400 ring-4 ring-emerald-500/40 shadow-xl' 
                        : 'bg-rose-950/80 border-rose-500 ring-4 ring-rose-500/40 shadow-xl'
                      : ballState !== 'ready' && isCorrectTarget
                        ? 'bg-emerald-950/40 border-emerald-500/60'
                        : 'bg-slate-900/90 border-slate-700/80 hover:border-emerald-500/60 hover:bg-slate-800 shadow-md'
                  }`}
                >
                  {/* Corner Badge */}
                  <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-400 mb-1.5 px-0.5">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <span>{cornerMeta.icon}</span>
                      <span className="hidden xs:inline">{cornerMeta.name}</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">#{idx + 1}</span>
                  </div>

                  {/* Flashcard Image Slot with Resilient Fallback */}
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950/70 border border-slate-800 flex items-center justify-center relative mb-2">
                    {option.imageUrl ? (
                      <SmartImage
                        src={option.imageUrl}
                        alt={option.term}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-slate-900 to-slate-800 text-slate-400">
                        <Target className="w-8 h-8 text-emerald-500/60 mb-1" />
                        <span className="text-xs font-bold text-slate-300 line-clamp-1">{option.term}</span>
                      </div>
                    )}
                  </div>

                  {/* Definition / Meaning text */}
                  <div className="w-full text-center">
                    {showDefinitionHint ? (
                      <div className="text-xs sm:text-sm font-black text-slate-100 line-clamp-1">
                        {option.definition || option.term}
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-slate-400">
                        Hình #{idx + 1}
                      </div>
                    )}
                  </div>

                  {/* Corner Target Reticle overlay */}
                  <div className="absolute inset-0 border border-white/5 rounded-2xl pointer-events-none" />
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Game Over / Victory Modal */}
      <AnimatePresence>
        {isGameOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.85, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.85, y: 20 }}
              className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden"
            >
              {/* Confetti Glow Backdrop */}
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

              {/* Trophy & Badge */}
              <div className="relative z-10 mb-4 inline-flex p-4 rounded-3xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/30 border border-amber-400/40 shadow-inner">
                {goalsCount === matchLength ? (
                  <Trophy className="w-16 h-16 text-yellow-400 animate-bounce" />
                ) : goalsCount >= Math.ceil(matchLength * 0.6) ? (
                  <Medal className="w-16 h-16 text-amber-400" />
                ) : (
                  <Award className="w-16 h-16 text-slate-400" />
                )}
              </div>

              {/* Title & Summary */}
              <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
                {goalsCount === matchLength
                  ? '🏆 ĐẲNG CẤP VUA PHÁ LƯỚI!'
                  : goalsCount >= Math.ceil(matchLength * 0.6)
                    ? '🎉 CHIẾN THẮNG LOẠT SÚT PENALTY!'
                    : '⚽ TIẾP TỤC RÈN LUYỆN NHA!'}
              </h2>

              <p className="text-slate-300 text-sm mb-6">
                Bạn đã sút thành công <span className="text-emerald-400 font-extrabold text-lg">{goalsCount}</span> trên tổng số <span className="font-extrabold text-lg">{matchLength}</span> quả phạt đền ({Math.round((goalsCount / matchLength) * 100)}%).
              </p>

              {/* Score Recap Dots */}
              <div className="flex items-center justify-center gap-1.5 mb-6 bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
                {history.map((h, i) => (
                  <div 
                    key={i} 
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border ${
                      h.isGoal ? 'border-emerald-500 bg-emerald-500/30 text-emerald-300' : 'border-rose-500 bg-rose-500/30 text-rose-300'
                    }`}
                  >
                    {h.isGoal ? '⚽' : '❌'}
                  </div>
                ))}
              </div>

              {/* Words Recap Accordion / List */}
              <div className="mb-6 text-left max-h-40 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Từ vựng trong loạt sút vừa qua:
                </div>
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center gap-2">
                      <span>{h.isGoal ? '⚽' : '🧤'}</span>
                      <span className="font-bold text-white">{h.word.term}</span>
                      <span className="text-slate-400 text-[11px]">({h.word.definition})</span>
                    </div>
                    <button
                      onClick={() => handlePronounce(h.word.term, h.word.audioUrl, 1.0)}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400"
                      title="Nghe lại"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => startNewMatch(matchLength)}
                  className="w-full sm:flex-1 py-3 px-5 rounded-xl font-black text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-lg active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Sút Loạt Mới</span>
                </button>

                <button
                  onClick={onExit}
                  className="w-full sm:w-auto py-3 px-5 rounded-xl font-bold text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 active:scale-98 transition-all"
                >
                  Về Menu Game
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
