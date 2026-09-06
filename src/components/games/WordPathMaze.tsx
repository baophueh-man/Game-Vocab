import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';
import { 
  Volume2, 
  RotateCcw, 
  Trophy, 
  Heart, 
  Compass, 
  Footprints, 
  XCircle,
  Settings2,
  Play,
  CheckCircle2,
  Sparkles,
  PackageCheck
} from 'lucide-react';

interface WordPathMazeProps {
  words: Word[];
  onExit: () => void;
}

const GRID_SIZE = 7;

interface Point {
  r: number;
  c: number;
}

interface ActiveChoice {
  r: number;
  c: number;
  word: Word;
  isCorrect: boolean;
  id: string;
}

interface MazePreset {
  name: string;
  // 7x7 grid: true = wall, false = path
  walls: boolean[][];
  start: Point;
  end: Point;
  // Ordered path from start to end
  solutionPath: Point[];
}

// Helper to build 7x7 walls from ascii strings
function parseMazeWalls(ascii: string[]): boolean[][] {
  return ascii.map(row => row.split('').map(ch => ch === '#'));
}

// 10 Curated Authentic Real Labyrinth Blueprints with True Walls, Corridors, and Dead-end Branches
const MAZE_PRESETS: MazePreset[] = [
  // Preset 0: The Classic S-Corridor with Alcoves
  {
    name: 'Classic Alcoves',
    walls: parseMazeWalls([
      '#######',
      '..#...#',
      '#.#.#.#',
      '#...#.#',
      '###.#.#',
      '#.....#',
      '#######'
    ]),
    start: { r: 1, c: 0 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 0 }, { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 1 },
      { r: 3, c: 2 }, { r: 3, c: 3 }, { r: 4, c: 3 }, { r: 5, c: 3 },
      { r: 5, c: 4 }, { r: 5, c: 5 }
    ]
  },
  // Preset 1: Spiral Dungeon
  {
    name: 'Spiral Dungeon',
    walls: parseMazeWalls([
      '#######',
      '#.....#',
      '#.###.#',
      '#.#...#',
      '#.#.###',
      '#...#.#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 1 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 },
      { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 3, c: 4 }, { r: 3, c: 3 },
      { r: 4, c: 3 }, { r: 5, c: 3 }, { r: 5, c: 2 }, { r: 5, c: 1 }
    ]
  },
  // Preset 2: Twin Chambers
  {
    name: 'Twin Chambers',
    walls: parseMazeWalls([
      '#######',
      '#...#.#',
      '#.#.#.#',
      '#.#...#',
      '#.###.#',
      '#.....#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 1, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 1 }, { r: 4, c: 1 },
      { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 },
      { r: 5, c: 5 }, { r: 4, c: 5 }, { r: 3, c: 5 }, { r: 2, c: 5 }, { r: 1, c: 5 }
    ]
  },
  // Preset 3: The Horseshoe Maze
  {
    name: 'Horseshoe Trail',
    walls: parseMazeWalls([
      '#######',
      '#.....#',
      '###.#.#',
      '#...#.#',
      '#.#.###',
      '#.#...#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
      { r: 3, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 4, c: 1 },
      { r: 5, c: 1 }, { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 5 }
    ]
  },
  // Preset 4: The Serpentine Garden
  {
    name: 'Serpentine Garden',
    walls: parseMazeWalls([
      '#######',
      '#...#.#',
      '#.#...#',
      '#.###.#',
      '#...#.#',
      '###...#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
      { r: 2, c: 4 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 },
      { r: 5, c: 5 }
    ]
  },
  // Preset 5: Central Cross
  {
    name: 'Central Cross',
    walls: parseMazeWalls([
      '#######',
      '#.....#',
      '#.#.#.#',
      '#...#.#',
      '###.#.#',
      '#.....#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 1 }, { r: 3, c: 2 },
      { r: 3, c: 3 }, { r: 2, c: 3 }, { r: 1, c: 3 }, { r: 1, c: 4 },
      { r: 1, c: 5 }, { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 }
    ]
  },
  // Preset 6: Outer Ring
  {
    name: 'Outer Ring',
    walls: parseMazeWalls([
      '#######',
      '#.....#',
      '#.###.#',
      '#.#.#.#',
      '#.###.#',
      '#.....#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 1 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 },
      { r: 2, c: 5 }, { r: 3, c: 5 }, { r: 4, c: 5 }, { r: 5, c: 5 },
      { r: 5, c: 4 }, { r: 5, c: 3 }, { r: 5, c: 2 }, { r: 5, c: 1 }
    ]
  },
  // Preset 7: Zigzag Pillars
  {
    name: 'Zigzag Pillars',
    walls: parseMazeWalls([
      '#######',
      '#...#.#',
      '#.#.#.#',
      '#.#.#.#',
      '#.#.#.#',
      '#.#...#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 1, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 2, c: 1 }, { r: 3, c: 1 }, { r: 4, c: 1 },
      { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 4, c: 3 },
      { r: 3, c: 3 }, { r: 2, c: 3 }, { r: 1, c: 3 }, { r: 1, c: 4 }, { r: 1, c: 5 }
    ]
  },
  // Preset 8: Stone Citadel
  {
    name: 'Stone Citadel',
    walls: parseMazeWalls([
      '#######',
      '#.....#',
      '###.#.#',
      '#...#.#',
      '#.###.#',
      '#.....#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
      { r: 3, c: 3 }, { r: 3, c: 2 }, { r: 3, c: 1 }, { r: 4, c: 1 },
      { r: 5, c: 1 }, { r: 5, c: 2 }, { r: 5, c: 3 }, { r: 5, c: 4 }, { r: 5, c: 5 }
    ]
  },
  // Preset 9: Secret Alcove Run
  {
    name: 'Secret Alcove',
    walls: parseMazeWalls([
      '#######',
      '#...#.#',
      '#.#.#.#',
      '#.....#',
      '###.#.#',
      '#...#.#',
      '#######'
    ]),
    start: { r: 1, c: 1 },
    end: { r: 5, c: 5 },
    solutionPath: [
      { r: 1, c: 1 }, { r: 1, c: 2 }, { r: 1, c: 3 }, { r: 2, c: 3 },
      { r: 3, c: 3 }, { r: 3, c: 4 }, { r: 3, c: 5 }, { r: 4, c: 5 },
      { r: 5, c: 5 }
    ]
  }
];

interface VisitedStep {
  r: number;
  c: number;
  word: Word;
}

export default function WordPathMaze({ words, onExit }: WordPathMazeProps) {
  const { speakEn, speakVn, cancelSpeech } = useSettings();

  // Mode: 'term' (Từ Anh ➜ Bấm ô Nghĩa Việt) hoặc 'definition' (Nghĩa Việt ➜ Bấm ô Từ Anh)
  const [promptMode, setPromptMode] = useState<'term' | 'definition'>('term');
  const [autoSpeech, setAutoSpeech] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Active Maze State
  const [currentPreset, setCurrentPreset] = useState<MazePreset>(MAZE_PRESETS[0]);
  const [playerPos, setPlayerPos] = useState<Point>({ r: 1, c: 0 });
  const [solutionWords, setSolutionWords] = useState<Word[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [activeChoices, setActiveChoices] = useState<ActiveChoice[]>([]);
  const [solvedTrail, setSolvedTrail] = useState<VisitedStep[]>([]);

  // Scores & States
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [mistakes, setMistakes] = useState<number>(0);
  const [round, setRound] = useState<number>(1);
  const [wrongCellShake, setWrongCellShake] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'playing' | 'gameover' | 'victory'>('playing');
  const [autoNextCountdown, setAutoNextCountdown] = useState<number>(5);

  // Timers
  const speechTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoNextTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Current Target Word for the active step
  const currentTargetWord = solutionWords[currentStepIdx] || null;

  // Debounced Pronunciation
  const playTargetAudio = useCallback((w?: Word | null) => {
    const word = w || currentTargetWord;
    if (!word) return;

    if (speechTimerRef.current) {
      clearTimeout(speechTimerRef.current);
      speechTimerRef.current = null;
    }
    cancelSpeech();

    speechTimerRef.current = setTimeout(() => {
      if (promptMode === 'definition') {
        speakVn(word.definition, word.viAudioUrl);
      } else {
        speakEn(word.term, word.audioUrl);
      }
    }, 60);
  }, [currentTargetWord, promptMode, cancelSpeech, speakEn, speakVn]);

  // Clean up timers
  useEffect(() => {
    return () => {
      cancelSpeech();
      if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
      if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [cancelSpeech]);

  // Build the 2 or 3 active choices STRICTLY ADJACENT to player's current position
  const buildActiveChoicesForStep = useCallback((
    stepIdx: number, 
    preset: MazePreset, 
    solWords: Word[], 
    allWords: Word[],
    currentTrail: VisitedStep[]
  ) => {
    if (stepIdx >= solWords.length || stepIdx >= preset.solutionPath.length - 1) {
      setActiveChoices([]);
      return;
    }

    const currentPos = preset.solutionPath[stepIdx];
    const correctPos = preset.solutionPath[stepIdx + 1];
    const correctWord = solWords[stepIdx];

    // Pick distractor words distinct from correctWord
    const otherWords = allWords.filter(w => w.id !== correctWord.id);
    const shuffledOthers = shuffleArray([...otherWords]);
    const distractorWord1 = shuffledOthers[0] || correctWord;
    const distractorWord2 = shuffledOthers[1] || shuffledOthers[0] || correctWord;

    // Previous visited position
    const prevPos = stepIdx > 0 ? preset.solutionPath[stepIdx - 1] : null;

    // Cardinal 4 neighbors directly adjacent to currentPos (Up, Down, Left, Right)
    const cardinalNeighbors: Point[] = [
      { r: currentPos.r - 1, c: currentPos.c },
      { r: currentPos.r + 1, c: currentPos.c },
      { r: currentPos.r, c: currentPos.c - 1 },
      { r: currentPos.r, c: currentPos.c + 1 },
    ];

    // Diagonal 4 neighbors directly adjacent to currentPos
    const diagonalNeighbors: Point[] = [
      { r: currentPos.r - 1, c: currentPos.c - 1 },
      { r: currentPos.r - 1, c: currentPos.c + 1 },
      { r: currentPos.r + 1, c: currentPos.c - 1 },
      { r: currentPos.r + 1, c: currentPos.c + 1 },
    ];

    const isValidNeighbor = (p: Point) => {
      // Must be within grid bounds
      if (p.r < 0 || p.r >= GRID_SIZE || p.c < 0 || p.c >= GRID_SIZE) return false;
      // Must NOT be the current player position
      if (p.r === currentPos.r && p.c === currentPos.c) return false;
      // Must NOT be the correct next position (that's handled separately)
      if (p.r === correctPos.r && p.c === correctPos.c) return false;
      // Must NOT be the immediately previous step we just came from
      if (prevPos && p.r === prevPos.r && p.c === prevPos.c) return false;
      // Must NOT be already in the solved trail
      if (currentTrail.some(s => s.r === p.r && s.c === p.c)) return false;
      return true;
    };

    // Filter valid cardinal neighbors
    const validCardinals = cardinalNeighbors.filter(isValidNeighbor);
    // Prioritize walkable corridor paths over walls
    const openCardinals = validCardinals.filter(p => !preset.walls[p.r]?.[p.c]);
    const wallCardinals = validCardinals.filter(p => preset.walls[p.r]?.[p.c]);

    // Filter valid diagonal neighbors
    const validDiagonals = diagonalNeighbors.filter(isValidNeighbor);
    const openDiagonals = validDiagonals.filter(p => !preset.walls[p.r]?.[p.c]);
    const wallDiagonals = validDiagonals.filter(p => preset.walls[p.r]?.[p.c]);

    // Combine candidate spots prioritizing: Open Cardinals -> Wall Cardinals -> Open Diagonals -> Wall Diagonals
    const candidateSpots: Point[] = [
      ...shuffleArray(openCardinals),
      ...shuffleArray(wallCardinals),
      ...shuffleArray(openDiagonals),
      ...shuffleArray(wallDiagonals)
    ];

    // Pick 1 or 2 distractor spots from the adjacent candidates
    const choices: ActiveChoice[] = [
      {
        r: correctPos.r,
        c: correctPos.c,
        word: correctWord,
        isCorrect: true,
        id: `choice-correct-${stepIdx}`
      }
    ];

    if (candidateSpots[0]) {
      choices.push({
        r: candidateSpots[0].r,
        c: candidateSpots[0].c,
        word: distractorWord1,
        isCorrect: false,
        id: `choice-wrong-1-${stepIdx}`
      });
    }

    if (candidateSpots[1]) {
      choices.push({
        r: candidateSpots[1].r,
        c: candidateSpots[1].c,
        word: distractorWord2,
        isCorrect: false,
        id: `choice-wrong-2-${stepIdx}`
      });
    }

    setActiveChoices(choices);
  }, []);

  // Generate Maze & Setup Round
  const generateMaze = useCallback((isNextRound: boolean = false) => {
    if (words.length === 0) return;

    if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    cancelSpeech();

    // 1. Pick a random authentic maze blueprint
    const randomPresetIdx = Math.floor(Math.random() * MAZE_PRESETS.length);
    const preset = MAZE_PRESETS[randomPresetIdx];
    setCurrentPreset(preset);

    const stepsCount = preset.solutionPath.length - 1;

    // 2. Select words for this round
    const shuffledPool = shuffleArray([...words]);
    const selectedWords: Word[] = [];
    for (let i = 0; i < stepsCount; i++) {
      selectedWords.push(shuffledPool[i % shuffledPool.length]);
    }
    setSolutionWords(selectedWords);

    // 3. Reset player to start
    setPlayerPos(preset.start);
    setCurrentStepIdx(0);
    setSolvedTrail([]);

    // 4. Build initial 2 or 3 adjacent choices for step 0
    buildActiveChoicesForStep(0, preset, selectedWords, words, []);

    if (!isNextRound) {
      setScore(0);
      setLives(3);
      setMistakes(0);
      setRound(1);
    } else {
      setRound(r => r + 1);
    }

    setGameState('playing');
    setAutoNextCountdown(5);

    // Speak initial target
    if (autoSpeech && selectedWords[0]) {
      setTimeout(() => {
        playTargetAudio(selectedWords[0]);
      }, 350);
    }
  }, [words, autoSpeech, cancelSpeech, playTargetAudio, buildActiveChoicesForStep]);

  // Initial load
  useEffect(() => {
    generateMaze(false);
  }, []);

  // Handle clicking on one of the active choices
  const handleChoiceClick = (choice: ActiveChoice) => {
    if (gameState !== 'playing' || !currentTargetWord) return;

    if (choice.isCorrect) {
      // ✅ CORRECT ANSWER!
      playSound('correct');
      playTargetAudio(choice.word);

      const newScore = score + 100;
      setScore(newScore);

      // Save this correct step to solved trail
      const newTrailItem: VisitedStep = {
        r: choice.r,
        c: choice.c,
        word: choice.word
      };
      const updatedTrail = [...solvedTrail, newTrailItem];
      setSolvedTrail(updatedTrail);

      // Move player to the correct cell
      setPlayerPos({ r: choice.r, c: choice.c });

      // Clear the 2 wrong choices immediately
      setActiveChoices([]);

      const nextStep = currentStepIdx + 1;
      if (nextStep >= solutionWords.length || (choice.r === currentPreset.end.r && choice.c === currentPreset.end.c)) {
        // VICTORY! Reached the exit box / chest 🏁📦
        setGameState('victory');
        fireConfetti();
        setAutoNextCountdown(5);

        // 5-second countdown to next round
        countdownIntervalRef.current = setInterval(() => {
          setAutoNextCountdown(prev => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        autoNextTimerRef.current = setTimeout(() => {
          generateMaze(true);
        }, 5000);
      } else {
        // Proceed to next step and spawn new adjacent choices surrounding the new player position
        setCurrentStepIdx(nextStep);
        buildActiveChoicesForStep(nextStep, currentPreset, solutionWords, words, updatedTrail);

        const nextWord = solutionWords[nextStep];
        if (autoSpeech && nextWord) {
          setTimeout(() => {
            playTargetAudio(nextWord);
          }, 350);
        }
      }
    } else {
      // ❌ WRONG ANSWER!
      playSound('incorrect');
      setMistakes(m => m + 1);
      setWrongCellShake(`${choice.r}-${choice.c}`);
      setTimeout(() => setWrongCellShake(null), 500);

      setLives(l => {
        const nextLives = l - 1;
        if (nextLives <= 0) {
          setGameState('gameover');
        }
        return nextLives;
      });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 select-none overflow-y-auto font-sans">
      {/* Top Header / Status Dashboard */}
      <div className="px-3 sm:px-4 py-2.5 bg-slate-900/95 border-b border-slate-800 shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Score & Progress */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 font-bold text-xs sm:text-sm">
            <Trophy className="w-4 h-4" />
            <span>{score} pts</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/30 rounded-xl text-sky-400 font-bold text-xs">
            <Sparkles className="w-3.5 h-3.5 text-sky-300" />
            <span>Vòng {round}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs">
            <Footprints className="w-3.5 h-3.5" />
            <span>Bước {currentStepIdx + 1}/{solutionWords.length || 1}</span>
          </div>
        </div>

        {/* Target Question Banner */}
        {currentTargetWord && gameState === 'playing' && (
          <div className="flex-1 max-w-md mx-1 flex items-center justify-center">
            <div className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 rounded-2xl shadow-md border border-emerald-400/30 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden w-full">
                <button
                  onClick={() => playTargetAudio(currentTargetWord)}
                  className="p-1.5 bg-white/20 hover:bg-white/30 active:scale-95 rounded-xl transition-all shrink-0 shadow-xs"
                  title="Nghe phát âm chuẩn (Phím Space)"
                >
                  <Volume2 className="w-4 h-4 text-white" />
                </button>
                <div className="text-left overflow-hidden flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                    {promptMode === 'term' ? '🔤 Tìm & Đi vào ô Nghĩa Tiếng Việt:' : '🎯 Tìm & Đi vào ô Từ Tiếng Anh:'}
                  </span>
                  <h2 className="text-sm sm:text-base font-black truncate text-white">
                    {promptMode === 'term' ? currentTargetWord.term : currentTargetWord.definition}
                  </h2>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lives & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2.5 py-1 bg-rose-500/10 border border-rose-500/30 rounded-xl">
            {[1, 2, 3].map(heartIdx => (
              <Heart
                key={heartIdx}
                className={`w-3.5 sm:w-4 h-3.5 sm:h-4 ${heartIdx <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700 fill-slate-800 opacity-40'}`}
              />
            ))}
          </div>

          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition-all"
            title="Cài đặt trò chơi"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Maze Labyrinth Board */}
      <div className="flex-1 flex flex-col items-center justify-center p-2 sm:p-4 max-w-3xl mx-auto w-full">
        {/* Instruction Badge */}
        <div className="text-xs text-slate-400 mb-2 text-center flex items-center justify-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-emerald-400" />
          <span>Chọn đúng ô liền kề với nhân vật 🐷 để bước tiếp. 2 đáp án sai sẽ tự biến mất!</span>
        </div>

        {/* 7x7 Real Maze Grid with Solid Labyrinth Walls & Walkable Corridors */}
        <div className="relative w-full aspect-square max-w-[500px] max-h-[500px] bg-slate-900 p-2 sm:p-3 rounded-3xl border-4 border-slate-800 shadow-2xl grid grid-cols-7 grid-rows-7 gap-1 sm:gap-1.5">
          {Array.from({ length: GRID_SIZE }).map((_, r) =>
            Array.from({ length: GRID_SIZE }).map((_, c) => {
              const isWall = currentPreset.walls[r]?.[c];
              const isPlayerHere = playerPos.r === r && playerPos.c === c;
              const isStart = currentPreset.start.r === r && currentPreset.start.c === c;
              const isEnd = currentPreset.end.r === r && currentPreset.end.c === c;

              // Check if cell is in solved trail
              const solvedStep = solvedTrail.find(step => step.r === r && step.c === c);

              // Check if cell has an active choice (one of the 2-3 choices strictly adjacent to the current player)
              const activeChoice = activeChoices.find(ch => ch.r === r && ch.c === c);
              const isShaking = wrongCellShake === `${r}-${c}`;

              // If it's an active choice (or solved step or player position), render it interactively even if originally a wall
              if (!activeChoice && !solvedStep && !isPlayerHere && isWall) {
                return (
                  <div
                    key={`${r}-${c}`}
                    className="relative rounded-xl bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 border border-slate-600/60 shadow-inner flex items-center justify-center overflow-hidden"
                  >
                    {/* 3D Stone Wall Texture Highlights */}
                    <div className="absolute inset-x-1 top-0.5 h-[2px] bg-slate-500/40 rounded-full" />
                    <div className="w-2 h-2 rounded-full bg-slate-700/50" />
                  </div>
                );
              }

              // Corridor Path or Active Adjacent Choice
              let corridorBg = 'bg-slate-800/80 border-slate-700/50 text-slate-400';

              if (solvedStep) {
                // Stamped / Solved Correct Waypoint
                corridorBg = 'bg-emerald-950/80 border-emerald-500/80 text-emerald-200 shadow-inner';
              } else if (activeChoice) {
                // Active Adjacent Choice Spot (Glowing to attract attention)
                corridorBg = 'bg-sky-950/90 border-sky-400 text-white cursor-pointer hover:bg-sky-900 hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/30 ring-2 ring-sky-400/60 animate-pulse';
              } else if (isStart) {
                corridorBg = 'bg-indigo-950/80 border-indigo-500 text-indigo-300';
              } else if (isEnd) {
                corridorBg = 'bg-amber-950/80 border-amber-500 text-amber-300';
              }

              const choiceText = activeChoice
                ? (promptMode === 'term' ? activeChoice.word.definition : activeChoice.word.term)
                : '';
              const solvedText = solvedStep
                ? (promptMode === 'term' ? solvedStep.word.definition : solvedStep.word.term)
                : '';

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => activeChoice && handleChoiceClick(activeChoice)}
                  className={`relative rounded-xl border flex flex-col items-center justify-center p-1 text-center transition-all duration-200 overflow-hidden select-none ${corridorBg} ${
                    isShaking ? 'ring-4 ring-rose-500 bg-rose-900/90 animate-shake z-30' : ''
                  }`}
                >
                  {/* Player Mascot Avatar 🐷 */}
                  {isPlayerHere && (
                    <div className="absolute inset-0 bg-sky-400/20 z-20 flex items-center justify-center pointer-events-none">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 text-amber-950 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-sm sm:text-base animate-bounce">
                        🐷
                      </div>
                    </div>
                  )}

                  {/* START Tag */}
                  {isStart && !isPlayerHere && !solvedStep && (
                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-indigo-300 flex items-center gap-0.5">
                      START
                    </span>
                  )}

                  {/* EXIT / TREASURE BOX 📦 */}
                  {isEnd && !isPlayerHere && (
                    <div className="flex flex-col items-center">
                      <PackageCheck className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-pulse" />
                      <span className="text-[7px] sm:text-[8px] font-black uppercase text-amber-300">
                        ĐÍCH
                      </span>
                    </div>
                  )}

                  {/* SOLVED STEP (Đáp Án Đúng Được Lưu Lại Trên Đường Đi) */}
                  {solvedStep && !isPlayerHere && (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      {solvedStep.word.imageUrl && (
                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md overflow-hidden bg-black/30 mb-0.5 border border-emerald-400/30 shrink-0">
                          <SmartImage src={solvedStep.word.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-300 leading-tight line-clamp-2 px-0.5">
                        {solvedText}
                      </span>
                    </div>
                  )}

                  {/* ACTIVE CHOICES (Chỉ 2 hoặc 3 Lựa Chọn Liền Kề Với Vị Trí Đang Đứng) */}
                  {activeChoice && !isPlayerHere && (
                    <div className="flex flex-col items-center justify-center w-full h-full">
                      {activeChoice.word.imageUrl && (
                        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg overflow-hidden bg-white/10 mb-0.5 border border-sky-300/40 shrink-0">
                          <SmartImage src={activeChoice.word.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <span className="text-[9px] sm:text-[11px] font-black text-sky-100 leading-tight line-clamp-2 px-0.5">
                        {choiceText}
                      </span>
                    </div>
                  )}

                  {/* Empty Corridor Dots */}
                  {!isWall && !isPlayerHere && !isStart && !isEnd && !solvedStep && !activeChoice && (
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-700/60" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* GAME OVER / VICTORY MODAL WITH 5S AUTO NEXT */}
      {(gameState === 'gameover' || gameState === 'victory') && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full text-center border border-slate-800 shadow-2xl">
            {gameState === 'victory' ? (
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-8 h-8" />
              </div>
            ) : (
              <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <XCircle className="w-8 h-8" />
              </div>
            )}

            <h2 className="text-xl sm:text-2xl font-black text-white mb-1">
              {gameState === 'victory' ? `Vượt Mê Cung Vòng ${round}! 🏆` : 'Hết Tim Rồi! 💔'}
            </h2>
            <p className="text-slate-400 text-xs mb-4">
              {gameState === 'victory'
                ? 'Bạn đã tìm được con đường từ vựng chính xác đến rương kho báu!'
                : 'Bạn hãy quan sát kỹ 2-3 đáp án ở các ô liền kề và thử lại nhé.'}
            </p>

            {/* Countdown notice on Victory */}
            {gameState === 'victory' && (
              <div className="mb-4 py-2 px-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 animate-pulse">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Tự động sang màn mới sau <b>{autoNextCountdown}s</b>...</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 mb-5">
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-bold">Tổng Điểm</span>
                <span className="text-lg font-black text-amber-400">{score}</span>
              </div>
              <div className="p-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                <span className="text-[10px] text-slate-400 block font-bold">Lỗi sai</span>
                <span className="text-lg font-black text-rose-400">{mistakes}</span>
              </div>
            </div>

            <div className="flex gap-2">
              {gameState === 'victory' ? (
                <button
                  onClick={() => generateMaze(true)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm shadow-lg shadow-emerald-500/20"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Sang Màn Ngay</span>
                </button>
              ) : (
                <button
                  onClick={() => generateMaze(false)}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Chơi Lại</span>
                </button>
              )}
              <button
                onClick={onExit}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-sm border border-slate-700"
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-3xl p-6 max-w-sm w-full border border-slate-800 shadow-2xl text-left">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-lg text-white">Tùy Chỉnh Mê Cung</h3>
              <button onClick={() => setShowSettingsModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2">Dạng câu hỏi:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPromptMode('term')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      promptMode === 'term'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🔤 Từ Anh ➜ Nghĩa Việt
                  </button>
                  <button
                    onClick={() => setPromptMode('definition')}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      promptMode === 'definition'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-extrabold'
                        : 'border-slate-800 text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    🎯 Nghĩa Việt ➜ Từ Anh
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300">Tự động phát âm khi bước:</span>
                <input
                  type="checkbox"
                  checked={autoSpeech}
                  onChange={(e) => setAutoSpeech(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => {
                  setShowSettingsModal(false);
                  generateMaze(false);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs"
              >
                Áp Dụng & Chơi Lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
