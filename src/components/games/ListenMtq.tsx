import React, { useState, useEffect, useRef } from 'react';
import { Word } from '../../types';
import { shuffleArray } from '../../lib/utils';
import { playSound } from '../../utils/audio';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Volume2, 
  RotateCcw, 
  Infinity as InfinityIcon, 
  Sparkles, 
  Heart, 
  Trophy, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Flame, 
  Snail, 
  VolumeX, 
  SlidersHorizontal,
  RefreshCw,
  Award
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

type MascotType = 'pig' | 'tree' | 'cat' | 'dino' | 'panda';

interface MascotState {
  type: MascotType;
  growth: number; // 0 to 100+
  level: number; // 1, 2, 3, 4, 5...
  mood: 'happy' | 'eating' | 'sad' | 'celebrate' | 'idle';
  speech: string;
}

const PIG_CHEER_PHRASES = [
  'Oink! Ngon tuyệt cú mèo! 🍉',
  'Heo mập thêm một ký rồi nè! 🍰',
  'Bạn nghe đỉnh chóp luôn! 💖',
  'Ăn đã quá, câu tiếp theo đi bạn! 🍩',
  'Heo sắp lăn được rồi á haha! 🐷',
  'Tuyệt vời! Tai thính quá! 🍎',
  'Thêm miếng pizza nữa nào! 🍕',
  'Càng mập heo càng đáng yêu! ✨'
];

const PIG_SAD_PHRASES = [
  'Oắt o! Nghe nhầm một xíu rồi! 🥺',
  'Heo bị xẹp bụng mất một chút! 💧',
  'Đừng nản nhé, nghe kỹ lại câu này nè! 💪',
  'Cố lên bạn ơi, heo vẫn tin bạn! 🐷'
];

const TREE_CHEER_PHRASES = [
  'Tưới mát quá, cây lớn vùn vụt! 💧✨',
  'Cây mọc thêm một nhánh lá xanh tươi! 🌿',
  'Rực rỡ quá, sắp kết trái ngọt rồi! 🍎',
  'Đôi tai thính làm khu vườn nở rộ! 🌸',
  'Bạn giỏi quá, đại thụ vươn cao! 🌳✨'
];

const TREE_SAD_PHRASES = [
  'Lá cây hơi rũ một chút rồi! 🍂',
  'Cần thêm một giọt nước đúng ở câu sau nha! 💧',
  'Không sao cả, hãy lắng nghe thật kỹ nào! 🌱'
];

const CAT_CHEER_PHRASES = [
  'Meo meo! Cá hồi thơm phức quá! 🐟✨',
  'Mèo vẫy đuôi khen bạn tai siêu thính! 🐾',
  'Càng nghe đúng mèo càng tròn xoe như quả bóng! 🐱',
  'Meo! Cho thêm miếng cá hồi nữa đi sen ơi! 🍣',
  'Tuyệt cú mèo! Đỉnh của chóp luôn sen ơi! 🌟',
  'Ngon quá đi mất, bụng mèo kêu rừ rừ rồi nè! 🥛'
];

const CAT_SAD_PHRASES = [
  'Meo... hụt mất con cá tươi ngon rồi! 😿',
  'Đừng buồn sen ơi, nghe kỹ lại lần nữa nào! 🐾',
  'Mèo vuốt tai tiếc quá, câu sau gỡ lại nha! 💧'
];

const DINO_CHEER_PHRASES = [
  'Graoo! Thịt nướng thơm lừng giòn rụm! 🍖✨',
  'Khủng long con vươn cao thêm 10cm rồi! 🦖💪',
  'Tiếng gầm chiến thắng! Bạn nghe xuất sắc! 🌟',
  'Nhai rồm rộp, câu tiếp theo nữa nào bạn ơi! 🍗',
  'Khủng long tung tăng vẫy đuôi ăn mừng! 🦕🔥',
  'Tai thính như cú vọ! Thưởng thêm đùi gà nha! 🥩'
];

const DINO_SAD_PHRASES = [
  'Graoo... khủng long bị hụt mất miếng mồi rồi! 🥺',
  'Cố lên bạn ơi, khủng long vẫn tin tưởng bạn! 🦖💪',
  'Nghe thật kỹ lại ở câu sau để nạp năng lượng nhé! 🍖'
];

const PANDA_CHEER_PHRASES = [
  'Măm măm! Cành trúc non giòn ngọt lịm! 🎋✨',
  'Gấu trúc lăn một vòng ăn mừng tai thính! 🐼🤸',
  'Bụng gấu tròn quay như cái bánh bao rồi nè! 🥟',
  'Bạn nghe đỉnh quá, trúc ăn không kịp thở luôn! 🎍',
  'Gấu trúc ôm tim cảm ơn bạn nhiều nha! 💖',
  'Tuyệt đỉnh kungfu! Chuỗi nghe đúng quá đã! 🥋'
];

const PANDA_SAD_PHRASES = [
  'Ái chà! Gấu trúc tuột tay rơi mất cành trúc rồi! 🎋💧',
  'Không sao cả, bình tĩnh lắng nghe lại ở câu sau nha! 🐼',
  'Đừng nản nhé, gấu trúc vẫn luôn cổ vũ bạn! 💪'
];

interface MascotMeta {
  type: MascotType;
  name: string;
  icon: string;
  welcomeSpeech: string;
  metricLabel: string;
  barGradient: string;
  textColor: string;
  activeBtnBg: string;
  treats: string[];
}

const MASCOTS_CONFIG: Record<MascotType, MascotMeta> = {
  pig: {
    type: 'pig',
    name: 'Heo Ú',
    icon: '🐷',
    welcomeSpeech: 'Chào bạn! Mình là Heo Ú nè! Cho mình ăn no nha! 🍉',
    metricLabel: 'Độ No Bụng 🍉',
    barGradient: 'bg-gradient-to-r from-pink-400 via-rose-400 to-pink-500',
    textColor: 'text-pink-600',
    activeBtnBg: 'bg-pink-500 text-white shadow-xs',
    treats: ['🍉', '🍎', '🍰', '🍩', '🍕', '🍓', '🥕', '🍦', '🍔', '🍇'],
  },
  tree: {
    type: 'tree',
    name: 'Cây Thần',
    icon: '🌳',
    welcomeSpeech: 'Chào bạn! Hãy tưới nước cho mầm cây lớn nha! 🌱',
    metricLabel: 'Năng Lượng Cây 💧',
    barGradient: 'bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500',
    textColor: 'text-emerald-600',
    activeBtnBg: 'bg-emerald-600 text-white shadow-xs',
    treats: ['💧', '✨', '🌧️', '☀️', '🌸', '🍃'],
  },
  cat: {
    type: 'cat',
    name: 'Mèo Mập',
    icon: '🐱',
    welcomeSpeech: 'Meo meo! Mèo Mập thèm cá lắm rồi, nghe thật chuẩn nha! 🐟',
    metricLabel: 'Độ Thỏa Mãn Cá 🐟',
    barGradient: 'bg-gradient-to-r from-amber-400 via-orange-400 to-orange-500',
    textColor: 'text-orange-600',
    activeBtnBg: 'bg-orange-500 text-white shadow-xs',
    treats: ['🐟', '🍣', '🥛', '🍤', '🥫', '🐠'],
  },
  dino: {
    type: 'dino',
    name: 'Khủng Long',
    icon: '🦖',
    welcomeSpeech: 'Graoo! Khủng Long Con đã sẵn sàng săn thịt nướng! 🍖',
    metricLabel: 'Sức Mạnh Khủng Long 🍖',
    barGradient: 'bg-gradient-to-r from-lime-400 via-emerald-400 to-teal-500',
    textColor: 'text-emerald-600',
    activeBtnBg: 'bg-teal-600 text-white shadow-xs',
    treats: ['🍖', '🍗', '🥩', '🍪', '🍉', '🦴'],
  },
  panda: {
    type: 'panda',
    name: 'Gấu Trúc',
    icon: '🐼',
    welcomeSpeech: 'Hí hí! Gấu Trúc Tròn đang chờ thưởng cành trúc giòn rụm! 🎋',
    metricLabel: 'Độ No Trúc Bánh 🎋',
    barGradient: 'bg-gradient-to-r from-violet-400 via-purple-400 to-indigo-500',
    textColor: 'text-purple-600',
    activeBtnBg: 'bg-purple-600 text-white shadow-xs',
    treats: ['🎋', '🎍', '🥟', '🍎', '🍙', '🧋'],
  },
};

const getCheerPhrase = (type: MascotType): string => {
  switch (type) {
    case 'pig': return PIG_CHEER_PHRASES[Math.floor(Math.random() * PIG_CHEER_PHRASES.length)];
    case 'tree': return TREE_CHEER_PHRASES[Math.floor(Math.random() * TREE_CHEER_PHRASES.length)];
    case 'cat': return CAT_CHEER_PHRASES[Math.floor(Math.random() * CAT_CHEER_PHRASES.length)];
    case 'dino': return DINO_CHEER_PHRASES[Math.floor(Math.random() * DINO_CHEER_PHRASES.length)];
    case 'panda': return PANDA_CHEER_PHRASES[Math.floor(Math.random() * PANDA_CHEER_PHRASES.length)];
  }
};

const getSadPhrase = (type: MascotType): string => {
  switch (type) {
    case 'pig': return PIG_SAD_PHRASES[Math.floor(Math.random() * PIG_SAD_PHRASES.length)];
    case 'tree': return TREE_SAD_PHRASES[Math.floor(Math.random() * TREE_SAD_PHRASES.length)];
    case 'cat': return CAT_SAD_PHRASES[Math.floor(Math.random() * CAT_SAD_PHRASES.length)];
    case 'dino': return DINO_SAD_PHRASES[Math.floor(Math.random() * DINO_SAD_PHRASES.length)];
    case 'panda': return PANDA_SAD_PHRASES[Math.floor(Math.random() * PANDA_SAD_PHRASES.length)];
  }
};

export default function ListenMtq({ words, onExit }: { words: Word[]; onExit: () => void }) {
  const { speakEn, speakVn, reduceMotion } = useSettings();
  
  // Game Modes
  const [isInfinite, setIsInfinite] = useState<boolean>(true);
  const [targetQuestions, setTargetQuestions] = useState<number>(words.length > 0 ? words.length : 10);
  const [questionIndex, setQuestionIndex] = useState<number>(0);
  
  // Mascot state
  const [mascotType, setMascotType] = useState<MascotType>('pig');
  const [growth, setGrowth] = useState<number>(20); // starts at 20%
  const [level, setLevel] = useState<number>(1);
  const [mascotMood, setMascotMood] = useState<'happy' | 'eating' | 'sad' | 'celebrate' | 'idle'>('idle');
  const [speechBubble, setSpeechBubble] = useState<string>('Chào bạn! Hãy nghe và chọn hình đúng để nuôi mình nha! 💖');
  const [currentTreat, setCurrentTreat] = useState<string>('🍎');
  
  // Current question data
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  
  // Scoring & Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  
  // Settings & Audio
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  
  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize and get a fresh question
  const prepareNextQuestion = (forceWord?: Word) => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (words.length === 0) return;
    
    // Pick next word
    let word: Word;
    if (forceWord) {
      word = forceWord;
    } else {
      // Pick random word with bias towards ones with images
      const wordsWithImages = words.filter(w => !!w.imageUrl);
      const pool = wordsWithImages.length >= 3 && Math.random() < 0.85 ? wordsWithImages : words;
      word = pool[Math.floor(Math.random() * pool.length)];
    }

    setCurrentWord(word);
    setSelectedWordId(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    // Get 3 distractors
    const otherWords = words.filter(w => w.id !== word.id);
    const shuffledOthers = shuffleArray(otherWords);
    const selectedDistractors = shuffledOthers.slice(0, 3);
    
    // If not enough words in set, duplicate or pad
    const finalOptions = shuffleArray([word, ...selectedDistractors]);
    setOptions(finalOptions);

    // Play pronunciation
    if (autoPlayAudio) {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      audioTimerRef.current = setTimeout(() => {
        handlePlayAudio(word, 1.0);
      }, 300);
    }
  };

  useEffect(() => {
    if (words.length > 0) {
      setTargetQuestions(words.length);
    }
    prepareNextQuestion();
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [words]);

  // Audio trigger
  const handlePlayAudio = async (wordToPlay?: Word | null, rate: number = 1.0) => {
    const target = wordToPlay || currentWord;
    if (!target) return;

    setIsPlayingAudio(true);
    try {
      await speakEn(target.term, target.audioUrl, 1);
    } catch (e) {
      console.warn('Audio play failed', e);
    } finally {
      setIsPlayingAudio(false);
    }
  };

  // Check answer
  const handleOptionClick = (option: Word) => {
    if (isAnswered || !currentWord) return;

    setSelectedWordId(option.id);
    setIsAnswered(true);
    setTotalAttempts(prev => prev + 1);

    const correct = option.id === currentWord.id;
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Random treat for mascot
      const treats = MASCOTS_CONFIG[mascotType].treats;
      const randomTreat = treats[Math.floor(Math.random() * treats.length)];
      setCurrentTreat(randomTreat);

      // Mascot evolution & Growth calculation
      const newGrowth = growth + 18;
      let newLevel = level;
      if (newGrowth >= 100) {
        newLevel = level + 1;
        setGrowth(newGrowth - 80);
        setLevel(newLevel);
        setMascotMood('celebrate');
        fireConfetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      } else {
        setGrowth(newGrowth);
        setMascotMood('eating');
      }

      // Cheer speech
      setSpeechBubble(getCheerPhrase(mascotType));

      // Confetti on milestone streaks
      if (newStreak % 5 === 0) {
        fireConfetti({ particleCount: 60, spread: 70, origin: { y: 0.7 } });
      }

      // Auto advance to next question on correct
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isInfinite && questionIndex + 1 >= targetQuestions) {
          setIsGameOver(true);
          fireConfetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        } else {
          setQuestionIndex(prev => prev + 1);
          setMascotMood('idle');
          prepareNextQuestion();
        }
      }, reduceMotion ? 600 : 1400);

    } else {
      playSound('incorrect');
      setStreak(0);
      
      // Mascot shrinks a bit
      setGrowth(prev => Math.max(10, prev - 12));
      setMascotMood('sad');

      setSpeechBubble(getSadPhrase(mascotType));

      // Auto advance to next question on incorrect after a brief pause so user can see correct answer
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isInfinite && questionIndex + 1 >= targetQuestions) {
          setIsGameOver(true);
          fireConfetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
        } else {
          setQuestionIndex(prev => prev + 1);
          setMascotMood('idle');
          prepareNextQuestion();
        }
      }, reduceMotion ? 750 : 1500);
    }
  };

  const handleNextManual = () => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (!isInfinite && questionIndex + 1 >= targetQuestions) {
      setIsGameOver(true);
      fireConfetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
    } else {
      setQuestionIndex(prev => prev + 1);
      setMascotMood('idle');
      prepareNextQuestion();
    }
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setQuestionIndex(0);
    setTargetQuestions(words.length > 0 ? words.length : 10);
    setGrowth(25);
    setLevel(1);
    setIsGameOver(false);
    setMascotMood('idle');
    setSpeechBubble('Sẵn sàng thử thách mới nào! Cố lên nhé! 🌟');
    prepareNextQuestion();
  };

  // Render Mascot Pig
  const renderPigMascot = () => {
    // Pig size scales from 0.85 (skinny) to 1.45 (super chubby mega pig)
    const baseScale = 0.85 + (level - 1) * 0.15 + (growth / 100) * 0.25;
    const clampedScale = Math.min(1.5, Math.max(0.8, baseScale));

    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Floating food treat animation */}
        <AnimatePresence>
          {mascotMood === 'eating' && (
            <motion.div
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], y: [-20, 10, 30], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-4xl z-30 pointer-events-none"
            >
              {currentTreat}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 bg-pink-100 border border-pink-200 text-pink-700 font-extrabold text-xs rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-pink-500" />
          <span>Heo Ú Cấp {level}</span>
          {level >= 3 && <span>👑</span>}
        </div>

        {/* Vector Cute Pig SVG */}
        <motion.div
          animate={
            mascotMood === 'eating'
              ? { scale: [clampedScale, clampedScale * 1.15, clampedScale], y: [0, -8, 0], rotate: [0, -3, 3, 0] }
              : mascotMood === 'celebrate'
              ? { scale: [clampedScale, clampedScale * 1.25, clampedScale], rotate: [0, -8, 8, -5, 0], y: [0, -15, 0] }
              : mascotMood === 'sad'
              ? { scale: [clampedScale, clampedScale * 0.92, clampedScale * 0.95], y: [0, 6, 4], rotate: [0, -4, 4, 0] }
              : { scale: clampedScale, y: [0, -3, 0] }
          }
          transition={{ duration: mascotMood === 'idle' ? 3 : 0.6, repeat: mascotMood === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
          className="relative origin-bottom cursor-pointer filter drop-shadow-md"
          onClick={() => {
            setMascotMood('eating');
            setSpeechBubble('Ủn ỉn! Bạn vừa cù lét heo đó nha! 🐷💕');
            setTimeout(() => setMascotMood('idle'), 1000);
          }}
        >
          <svg viewBox="0 0 160 160" className="w-36 h-36 md:w-44 md:h-44 transition-all duration-300">
            {/* Soft Shadow */}
            <ellipse cx="80" cy="148" rx="55" ry="10" fill="rgba(0,0,0,0.12)" />

            {/* Curly Tail */}
            <path
              d="M 28 95 C 15 90, 10 105, 18 108 C 22 110, 26 102, 28 100"
              stroke="#f472b6"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
            />

            {/* Left Ear */}
            <motion.path
              animate={mascotMood === 'eating' ? { rotate: [-10, 5, -10] } : { rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              d="M 40 45 C 30 20, 55 20, 60 42 Z"
              fill="#f472b6"
              stroke="#ec4899"
              strokeWidth="3"
            />
            {/* Inner Ear Left */}
            <path d="M 44 42 C 37 28, 50 28, 54 40 Z" fill="#fda4af" />

            {/* Right Ear */}
            <motion.path
              animate={mascotMood === 'eating' ? { rotate: [10, -5, 10] } : { rotate: [5, -5, 5] }}
              transition={{ repeat: Infinity, duration: 2 }}
              d="M 120 45 C 130 20, 105 20, 100 42 Z"
              fill="#f472b6"
              stroke="#ec4899"
              strokeWidth="3"
            />
            {/* Inner Ear Right */}
            <path d="M 116 42 C 123 28, 110 28, 106 40 Z" fill="#fda4af" />

            {/* Back Little Trotters */}
            <rect x="42" y="128" width="18" height="18" rx="9" fill="#db2777" />
            <rect x="100" y="128" width="18" height="18" rx="9" fill="#db2777" />

            {/* Chubby Pig Body */}
            <ellipse cx="80" cy="92" rx={58 + (level - 1) * 4} ry={52 + (level - 1) * 3} fill="#fbcfe8" stroke="#f472b6" strokeWidth="4" />

            {/* Front Little Trotters */}
            <rect x="52" y="132" width="20" height="16" rx="8" fill="#f472b6" stroke="#db2777" strokeWidth="2.5" />
            <rect x="88" y="132" width="20" height="16" rx="8" fill="#f472b6" stroke="#db2777" strokeWidth="2.5" />

            {/* Big Rosy Cheeks */}
            <ellipse cx="46" cy="96" rx="11" ry="7" fill="#fb7185" opacity="0.65" />
            <ellipse cx="114" cy="96" rx="11" ry="7" fill="#fb7185" opacity="0.65" />

            {/* Eyes */}
            {mascotMood === 'eating' || mascotMood === 'celebrate' ? (
              // Happy squinting curve eyes ^ ^
              <>
                <path d="M 52 74 Q 60 64 68 74" stroke="#831843" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 92 74 Q 100 64 108 74" stroke="#831843" strokeWidth="4" strokeLinecap="round" fill="none" />
              </>
            ) : mascotMood === 'sad' ? (
              // Sad / dizzy eyes > <
              <>
                <path d="M 52 70 L 68 78 M 68 70 L 52 78" stroke="#831843" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 92 70 L 108 78 M 108 70 L 92 78" stroke="#831843" strokeWidth="3.5" strokeLinecap="round" />
                {/* Sweat drop */}
                <path d="M 32 75 C 30 65, 38 65, 36 78 C 34 82, 30 80, 32 75" fill="#38bdf8" />
              </>
            ) : (
              // Big curious sparkling eyes
              <>
                <circle cx="60" cy="74" r="7" fill="#831843" />
                <circle cx="58" cy="71" r="2.5" fill="#ffffff" />
                <circle cx="62" cy="76" r="1.2" fill="#ffffff" />

                <circle cx="100" cy="74" r="7" fill="#831843" />
                <circle cx="98" cy="71" r="2.5" fill="#ffffff" />
                <circle cx="102" cy="76" r="1.2" fill="#ffffff" />
              </>
            )}

            {/* Snout */}
            <ellipse cx="80" cy="98" rx="22" ry="16" fill="#f472b6" stroke="#db2777" strokeWidth="3" />
            <ellipse cx="73" cy="98" rx="4.5" ry="6.5" fill="#9d174d" />
            <ellipse cx="87" cy="98" rx="4.5" ry="6.5" fill="#9d174d" />

            {/* Mouth */}
            {mascotMood === 'eating' ? (
              <path d="M 72 118 Q 80 128 88 118 Z" fill="#be185d" />
            ) : mascotMood === 'sad' ? (
              <path d="M 74 120 Q 80 114 86 120" stroke="#831843" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M 74 116 Q 80 124 86 116" stroke="#831843" strokeWidth="3" strokeLinecap="round" fill="none" />
            )}

            {/* Crown if level >= 3 */}
            {level >= 3 && (
              <g transform="translate(56, 18)">
                <path d="M 0 20 L 12 0 L 24 16 L 36 0 L 48 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="12" cy="2" r="3" fill="#ef4444" />
                <circle cx="24" cy="16" r="2.5" fill="#3b82f6" />
                <circle cx="36" cy="2" r="3" fill="#10b981" />
              </g>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  // Render Mascot Tree
  const renderTreeMascot = () => {
    const baseScale = 0.85 + (level - 1) * 0.15 + (growth / 100) * 0.25;
    const clampedScale = Math.min(1.5, Math.max(0.8, baseScale));

    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Water drops animation */}
        <AnimatePresence>
          {mascotMood === 'eating' && (
            <motion.div
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], y: [-20, 10, 30], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-3xl z-30 pointer-events-none"
            >
              💧✨
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold text-xs rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          <span>Cây Thần Cấp {level}</span>
          {level >= 3 && <span>🌟</span>}
        </div>

        {/* Tree SVG */}
        <motion.div
          animate={
            mascotMood === 'eating' || mascotMood === 'celebrate'
              ? { scale: [clampedScale, clampedScale * 1.15, clampedScale], y: [0, -8, 0], rotate: [0, -2, 2, 0] }
              : mascotMood === 'sad'
              ? { scale: [clampedScale, clampedScale * 0.92, clampedScale * 0.95], y: [0, 6, 4] }
              : { scale: clampedScale, y: [0, -3, 0] }
          }
          transition={{ duration: mascotMood === 'idle' ? 3 : 0.6, repeat: mascotMood === 'idle' ? Infinity : 0 }}
          className="relative origin-bottom cursor-pointer filter drop-shadow-md"
          onClick={() => {
            setMascotMood('eating');
            setSpeechBubble('Xào xạc! Cây xanh cảm ơn bạn đã chăm sóc nha! 🌿💕');
            setTimeout(() => setMascotMood('idle'), 1000);
          }}
        >
          <svg viewBox="0 0 160 160" className="w-36 h-36 md:w-44 md:h-44 transition-all duration-300">
            <ellipse cx="80" cy="148" rx="45" ry="8" fill="rgba(0,0,0,0.12)" />

            {/* Cute Plant Pot */}
            <path d="M 50 115 L 110 115 L 102 146 L 58 146 Z" fill="#fb923c" stroke="#ea580c" strokeWidth="3" />
            <rect x="46" y="110" width="68" height="10" rx="4" fill="#fdba74" stroke="#ea580c" strokeWidth="2.5" />
            
            {/* Happy Pot Face */}
            <circle cx="70" cy="130" r="2.5" fill="#7c2d12" />
            <circle cx="90" cy="130" r="2.5" fill="#7c2d12" />
            <path d="M 76 135 Q 80 140 84 135" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" fill="none" />
            <ellipse cx="64" cy="132" rx="3" ry="1.5" fill="#f87171" />
            <ellipse cx="96" cy="132" rx="3" ry="1.5" fill="#f87171" />

            {/* Trunk */}
            <rect x="74" y="80" width="12" height="34" rx="4" fill="#92400e" />

            {/* Leaves Canopy (grows richer with level) */}
            {level === 1 ? (
              // Sprout
              <>
                <path d="M 80 85 C 60 70, 55 45, 80 50 Z" fill="#4ade80" stroke="#16a34a" strokeWidth="2.5" />
                <path d="M 80 85 C 100 70, 105 45, 80 50 Z" fill="#22c55e" stroke="#16a34a" strokeWidth="2.5" />
              </>
            ) : level === 2 ? (
              // Bushy Sapling
              <>
                <circle cx="65" cy="65" r="22" fill="#4ade80" />
                <circle cx="95" cy="65" r="22" fill="#22c55e" />
                <circle cx="80" cy="45" r="26" fill="#86efac" stroke="#16a34a" strokeWidth="3" />
              </>
            ) : (
              // Blooming Tree with Fruits / Flowers
              <>
                <circle cx="58" cy="62" r="26" fill="#4ade80" />
                <circle cx="102" cy="62" r="26" fill="#22c55e" />
                <circle cx="80" cy="40" r="32" fill="#86efac" stroke="#15803d" strokeWidth="3" />
                {/* Apples / Flowers */}
                <circle cx="62" cy="48" r="6" fill="#ef4444" />
                <circle cx="98" cy="52" r="6" fill="#ef4444" />
                <circle cx="80" cy="25" r="7" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                <circle cx="75" cy="68" r="5" fill="#ec4899" />
              </>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  // Render Mascot Cat (Mèo Mập)
  const renderCatMascot = () => {
    const baseScale = 0.85 + (level - 1) * 0.15 + (growth / 100) * 0.25;
    const clampedScale = Math.min(1.5, Math.max(0.8, baseScale));

    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Floating food treat animation */}
        <AnimatePresence>
          {mascotMood === 'eating' && (
            <motion.div
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], y: [-20, 10, 30], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-4xl z-30 pointer-events-none"
            >
              {currentTreat}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 bg-orange-100 border border-orange-200 text-orange-700 font-extrabold text-xs rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-orange-500" />
          <span>Mèo Mập Cấp {level}</span>
          {level >= 3 && <span>👑</span>}
        </div>

        {/* Cute Cat SVG */}
        <motion.div
          animate={
            mascotMood === 'eating'
              ? { scale: [clampedScale, clampedScale * 1.15, clampedScale], y: [0, -8, 0], rotate: [0, -3, 3, 0] }
              : mascotMood === 'celebrate'
              ? { scale: [clampedScale, clampedScale * 1.25, clampedScale], rotate: [0, -8, 8, -5, 0], y: [0, -15, 0] }
              : mascotMood === 'sad'
              ? { scale: [clampedScale, clampedScale * 0.92, clampedScale * 0.95], y: [0, 6, 4], rotate: [0, -4, 4, 0] }
              : { scale: clampedScale, y: [0, -3, 0] }
          }
          transition={{ duration: mascotMood === 'idle' ? 3 : 0.6, repeat: mascotMood === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
          className="relative origin-bottom cursor-pointer filter drop-shadow-md"
          onClick={() => {
            setMascotMood('eating');
            setSpeechBubble('Meo meo! Bạn vừa cù bụng tròn của mèo đó! 🐾💕');
            setTimeout(() => setMascotMood('idle'), 1000);
          }}
        >
          <svg viewBox="0 0 160 160" className="w-36 h-36 md:w-44 md:h-44 transition-all duration-300">
            {/* Soft Shadow */}
            <ellipse cx="80" cy="148" rx="52" ry="9" fill="rgba(0,0,0,0.12)" />

            {/* Waving Tail */}
            <motion.path
              animate={mascotMood === 'eating' || mascotMood === 'celebrate' ? { rotate: [-15, 25, -15] } : { rotate: [-8, 10, -8] }}
              transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
              d="M 36 100 C 18 92, 10 70, 22 58 C 26 54, 34 58, 30 68 C 22 80, 28 92, 40 94 Z"
              fill="#f97316"
              stroke="#ea580c"
              strokeWidth="2.5"
              style={{ transformOrigin: '36px 100px' }}
            />

            {/* Left Ear */}
            <motion.g
              animate={mascotMood === 'eating' ? { rotate: [-8, 6, -8] } : { rotate: [-3, 3, -3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ transformOrigin: '48px 45px' }}
            >
              <polygon points="35,50 30,16 64,36" fill="#f97316" stroke="#ea580c" strokeWidth="3" strokeLinejoin="round" />
              <polygon points="38,45 36,24 58,38" fill="#fda4af" />
            </motion.g>

            {/* Right Ear */}
            <motion.g
              animate={mascotMood === 'eating' ? { rotate: [8, -6, 8] } : { rotate: [3, -3, 3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              style={{ transformOrigin: '112px 45px' }}
            >
              <polygon points="125,50 130,16 96,36" fill="#f97316" stroke="#ea580c" strokeWidth="3" strokeLinejoin="round" />
              <polygon points="122,45 124,24 102,38" fill="#fda4af" />
            </motion.g>

            {/* Chubby Cat Body */}
            <ellipse cx="80" cy="94" rx={56 + (level - 1) * 4} ry={50 + (level - 1) * 3} fill="#fed7aa" stroke="#f97316" strokeWidth="4" />

            {/* Cream Tummy Patch */}
            <ellipse cx="80" cy="106" rx="34" ry="26" fill="#fff7ed" />

            {/* Back Feet */}
            <rect x="42" y="132" width="18" height="15" rx="7.5" fill="#ea580c" />
            <rect x="100" y="132" width="18" height="15" rx="7.5" fill="#ea580c" />

            {/* Front White Socks Paws */}
            <ellipse cx="62" cy="132" rx="11" ry="8" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />
            <ellipse cx="98" cy="132" rx="11" ry="8" fill="#ffffff" stroke="#ea580c" strokeWidth="2.5" />

            {/* Rosy Cheeks */}
            <ellipse cx="46" cy="90" rx="10" ry="6" fill="#fb7185" opacity="0.65" />
            <ellipse cx="114" cy="90" rx="10" ry="6" fill="#fb7185" opacity="0.65" />

            {/* Forehead Stripes */}
            <path d="M 80 42 L 80 52 M 72 45 L 74 53 M 88 45 L 86 53" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />

            {/* Whiskers */}
            <path d="M 40 85 L 18 80 M 38 90 L 16 91 M 40 96 L 20 100" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 120 85 L 142 80 M 122 90 L 144 91 M 120 96 L 140 100" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyes */}
            {mascotMood === 'eating' || mascotMood === 'celebrate' ? (
              <>
                <path d="M 52 74 Q 60 64 68 74" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 92 74 Q 100 64 108 74" stroke="#7c2d12" strokeWidth="4" strokeLinecap="round" fill="none" />
              </>
            ) : mascotMood === 'sad' ? (
              <>
                <path d="M 52 70 L 68 78 M 68 70 L 52 78" stroke="#7c2d12" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 92 70 L 108 78 M 108 70 L 92 78" stroke="#7c2d12" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 32 75 C 30 65, 38 65, 36 78 C 34 82, 30 80, 32 75" fill="#38bdf8" />
              </>
            ) : (
              <>
                <ellipse cx="60" cy="74" rx="7" ry="8" fill="#15803d" />
                <ellipse cx="60" cy="74" rx="3.5" ry="7" fill="#052e16" />
                <circle cx="58" cy="71" r="2.5" fill="#ffffff" />
                <circle cx="62" cy="76" r="1.2" fill="#ffffff" />

                <ellipse cx="100" cy="74" rx="7" ry="8" fill="#15803d" />
                <ellipse cx="100" cy="74" rx="3.5" ry="7" fill="#052e16" />
                <circle cx="98" cy="71" r="2.5" fill="#ffffff" />
                <circle cx="102" cy="76" r="1.2" fill="#ffffff" />
              </>
            )}

            {/* Nose */}
            <polygon points="76,84 84,84 80,89" fill="#f43f5e" />

            {/* Mouth :3 */}
            {mascotMood === 'eating' ? (
              <path d="M 72 96 Q 80 108 88 96 Z" fill="#be185d" />
            ) : mascotMood === 'sad' ? (
              <path d="M 74 97 Q 80 91 86 97" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M 72 92 Q 76 97 80 92 Q 84 97 88 92" stroke="#7c2d12" strokeWidth="2.8" strokeLinecap="round" fill="none" />
            )}

            {/* Collar with Bell if level >= 2 */}
            {level >= 2 && (
              <g>
                <path d="M 52 112 Q 80 124 108 112" stroke="#dc2626" strokeWidth="4.5" strokeLinecap="round" fill="none" />
                <circle cx="80" cy="120" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
                <circle cx="80" cy="121" r="1.5" fill="#92400e" />
              </g>
            )}

            {/* Crown if level >= 3 */}
            {level >= 3 && (
              <g transform="translate(56, 12)">
                <path d="M 0 20 L 12 0 L 24 16 L 36 0 L 48 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="12" cy="2" r="3" fill="#ef4444" />
                <circle cx="24" cy="16" r="2.5" fill="#3b82f6" />
                <circle cx="36" cy="2" r="3" fill="#10b981" />
              </g>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  // Render Mascot Dino (Khủng Long)
  const renderDinoMascot = () => {
    const baseScale = 0.85 + (level - 1) * 0.15 + (growth / 100) * 0.25;
    const clampedScale = Math.min(1.5, Math.max(0.8, baseScale));

    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Floating food treat animation */}
        <AnimatePresence>
          {mascotMood === 'eating' && (
            <motion.div
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], y: [-20, 10, 30], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-4xl z-30 pointer-events-none"
            >
              {currentTreat}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 bg-emerald-100 border border-emerald-200 text-emerald-800 font-extrabold text-xs rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Khủng Long Cấp {level}</span>
          {level >= 3 && <span>🦖👑</span>}
        </div>

        {/* Cute Dino SVG */}
        <motion.div
          animate={
            mascotMood === 'eating'
              ? { scale: [clampedScale, clampedScale * 1.15, clampedScale], y: [0, -8, 0], rotate: [0, -3, 3, 0] }
              : mascotMood === 'celebrate'
              ? { scale: [clampedScale, clampedScale * 1.25, clampedScale], rotate: [0, -8, 8, -5, 0], y: [0, -15, 0] }
              : mascotMood === 'sad'
              ? { scale: [clampedScale, clampedScale * 0.92, clampedScale * 0.95], y: [0, 6, 4], rotate: [0, -4, 4, 0] }
              : { scale: clampedScale, y: [0, -3, 0] }
          }
          transition={{ duration: mascotMood === 'idle' ? 3 : 0.6, repeat: mascotMood === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
          className="relative origin-bottom cursor-pointer filter drop-shadow-md"
          onClick={() => {
            setMascotMood('eating');
            setSpeechBubble('Graoo! Khủng long con thích được xoa đầu lắm nè! 🦖✨');
            setTimeout(() => setMascotMood('idle'), 1000);
          }}
        >
          <svg viewBox="0 0 160 160" className="w-36 h-36 md:w-44 md:h-44 transition-all duration-300">
            {/* Soft Shadow */}
            <ellipse cx="80" cy="148" rx="55" ry="9" fill="rgba(0,0,0,0.12)" />

            {/* Back Spikes */}
            <polygon points="48,46 36,32 54,42" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
            <polygon points="40,64 26,52 44,62" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
            <polygon points="34,84 20,74 38,82" fill="#f97316" stroke="#ea580c" strokeWidth="2" />

            {/* Tail */}
            <path
              d="M 34 104 C 16 112, 10 126, 20 130 C 28 132, 38 122, 44 114 Z"
              fill="#22c55e"
              stroke="#16a34a"
              strokeWidth="3.5"
            />
            <polygon points="12,126 4,120 16,134" fill="#f97316" />

            {/* Feet */}
            <ellipse cx="58" cy="138" rx="14" ry="9" fill="#16a34a" />
            <ellipse cx="102" cy="138" rx="14" ry="9" fill="#16a34a" />
            {/* Toenails */}
            <circle cx="52" cy="141" r="2.5" fill="#fef08a" />
            <circle cx="58" cy="143" r="2.5" fill="#fef08a" />
            <circle cx="64" cy="141" r="2.5" fill="#fef08a" />
            <circle cx="96" cy="141" r="2.5" fill="#fef08a" />
            <circle cx="102" cy="143" r="2.5" fill="#fef08a" />
            <circle cx="108" cy="141" r="2.5" fill="#fef08a" />

            {/* Chubby Dino Body */}
            <ellipse cx="80" cy="94" rx={56 + (level - 1) * 4} ry={52 + (level - 1) * 3} fill="#4ade80" stroke="#16a34a" strokeWidth="4" />

            {/* Pastel Yellow Tummy */}
            <ellipse cx="86" cy="100" rx="34" ry="30" fill="#fef08a" />

            {/* Little T-Rex Arms */}
            <motion.path
              animate={mascotMood === 'eating' ? { rotate: [-15, 15, -15] } : { rotate: [-5, 5, -5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              d="M 64 96 Q 52 100 56 108"
              stroke="#15803d"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              style={{ transformOrigin: '64px 96px' }}
            />
            <motion.path
              animate={mascotMood === 'eating' ? { rotate: [15, -15, 15] } : { rotate: [5, -5, 5] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              d="M 98 96 Q 110 100 106 108"
              stroke="#15803d"
              strokeWidth="5"
              strokeLinecap="round"
              fill="none"
              style={{ transformOrigin: '98px 96px' }}
            />

            {/* Rosy Cheeks */}
            <ellipse cx="48" cy="88" rx="9" ry="6" fill="#f87171" opacity="0.65" />
            <ellipse cx="114" cy="88" rx="9" ry="6" fill="#f87171" opacity="0.65" />

            {/* Nostrils */}
            <circle cx="76" cy="84" r="2.5" fill="#15803d" />
            <circle cx="86" cy="84" r="2.5" fill="#15803d" />

            {/* Eyes */}
            {mascotMood === 'eating' || mascotMood === 'celebrate' ? (
              <>
                <path d="M 52 72 Q 60 62 68 72" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
                <path d="M 92 72 Q 100 62 108 72" stroke="#064e3b" strokeWidth="4" strokeLinecap="round" fill="none" />
              </>
            ) : mascotMood === 'sad' ? (
              <>
                <path d="M 52 68 L 68 76 M 68 68 L 52 76" stroke="#064e3b" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 92 68 L 108 76 M 108 68 L 92 76" stroke="#064e3b" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M 32 73 C 30 63, 38 63, 36 76 C 34 80, 30 78, 32 73" fill="#38bdf8" />
              </>
            ) : (
              <>
                <circle cx="60" cy="70" r="7" fill="#064e3b" />
                <circle cx="58" cy="67" r="2.5" fill="#ffffff" />
                <circle cx="62" cy="72" r="1.2" fill="#ffffff" />

                <circle cx="100" cy="70" r="7" fill="#064e3b" />
                <circle cx="98" cy="67" r="2.5" fill="#ffffff" />
                <circle cx="102" cy="72" r="1.2" fill="#ffffff" />
              </>
            )}

            {/* Mouth with cute baby fang */}
            {mascotMood === 'eating' ? (
              <path d="M 72 96 Q 81 112 90 96 Z" fill="#991b1b" />
            ) : mascotMood === 'sad' ? (
              <path d="M 74 98 Q 81 90 88 98" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <g>
                <path d="M 72 94 Q 81 106 90 94 Z" fill="#991b1b" stroke="#064e3b" strokeWidth="2.5" />
                {/* Cute White Tooth */}
                <polygon points="76,94 79,99 82,94" fill="#ffffff" />
              </g>
            )}

            {/* Crown if level >= 3 */}
            {level >= 3 && (
              <g transform="translate(56, 14)">
                <path d="M 0 20 L 12 0 L 24 16 L 36 0 L 48 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="12" cy="2" r="3" fill="#ef4444" />
                <circle cx="24" cy="16" r="2.5" fill="#3b82f6" />
                <circle cx="36" cy="2" r="3" fill="#10b981" />
              </g>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  // Render Mascot Panda (Gấu Trúc)
  const renderPandaMascot = () => {
    const baseScale = 0.85 + (level - 1) * 0.15 + (growth / 100) * 0.25;
    const clampedScale = Math.min(1.5, Math.max(0.8, baseScale));

    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Floating food treat animation */}
        <AnimatePresence>
          {mascotMood === 'eating' && (
            <motion.div
              initial={{ scale: 0, y: -20, opacity: 0 }}
              animate={{ scale: [0, 1.3, 1], y: [-20, 10, 30], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute text-4xl z-30 pointer-events-none"
            >
              {currentTreat}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Level badge */}
        <div className="mb-1 flex items-center gap-1.5 px-3 py-0.5 bg-slate-100 border border-slate-300 text-slate-800 font-extrabold text-xs rounded-full shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-purple-600" />
          <span>Gấu Trúc Cấp {level}</span>
          {level >= 3 && <span>🐼👑</span>}
        </div>

        {/* Cute Panda SVG */}
        <motion.div
          animate={
            mascotMood === 'eating'
              ? { scale: [clampedScale, clampedScale * 1.15, clampedScale], y: [0, -8, 0], rotate: [0, -3, 3, 0] }
              : mascotMood === 'celebrate'
              ? { scale: [clampedScale, clampedScale * 1.25, clampedScale], rotate: [0, -8, 8, -5, 0], y: [0, -15, 0] }
              : mascotMood === 'sad'
              ? { scale: [clampedScale, clampedScale * 0.92, clampedScale * 0.95], y: [0, 6, 4], rotate: [0, -4, 4, 0] }
              : { scale: clampedScale, y: [0, -3, 0] }
          }
          transition={{ duration: mascotMood === 'idle' ? 3 : 0.6, repeat: mascotMood === 'idle' ? Infinity : 0, ease: 'easeInOut' }}
          className="relative origin-bottom cursor-pointer filter drop-shadow-md"
          onClick={() => {
            setMascotMood('eating');
            setSpeechBubble('Măm măm! Gấu trúc thích nhất là được cù cù nè! 🐼💕');
            setTimeout(() => setMascotMood('idle'), 1000);
          }}
        >
          <svg viewBox="0 0 160 160" className="w-36 h-36 md:w-44 md:h-44 transition-all duration-300">
            {/* Soft Shadow */}
            <ellipse cx="80" cy="148" rx="55" ry="9" fill="rgba(0,0,0,0.12)" />

            {/* Black Ears */}
            <motion.circle
              animate={mascotMood === 'eating' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              cx="44"
              cy="42"
              r="17"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="2"
            />
            <motion.circle
              animate={mascotMood === 'eating' ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
              cx="116"
              cy="42"
              r="17"
              fill="#1e293b"
              stroke="#0f172a"
              strokeWidth="2"
            />

            {/* Back Black Paws */}
            <ellipse cx="50" cy="138" rx="14" ry="9" fill="#1e293b" />
            <ellipse cx="110" cy="138" rx="14" ry="9" fill="#1e293b" />
            {/* Paw Pads */}
            <circle cx="50" cy="139" r="4" fill="#fda4af" />
            <circle cx="44" cy="134" r="1.8" fill="#fda4af" />
            <circle cx="50" cy="132" r="1.8" fill="#fda4af" />
            <circle cx="56" cy="134" r="1.8" fill="#fda4af" />
            <circle cx="110" cy="139" r="4" fill="#fda4af" />
            <circle cx="104" cy="134" r="1.8" fill="#fda4af" />
            <circle cx="110" cy="132" r="1.8" fill="#fda4af" />
            <circle cx="116" cy="134" r="1.8" fill="#fda4af" />

            {/* White Chubby Body */}
            <ellipse cx="80" cy="94" rx={56 + (level - 1) * 4} ry={52 + (level - 1) * 3} fill="#ffffff" stroke="#334155" strokeWidth="4" />

            {/* Black Shoulder Section */}
            <path
              d="M 28 88 C 42 108, 118 108, 132 88 C 136 100, 132 118, 118 126 C 96 114, 64 114, 42 126 C 28 118, 24 100, 28 88 Z"
              fill="#1e293b"
            />

            {/* White Tummy */}
            <ellipse cx="80" cy="116" rx="26" ry="18" fill="#ffffff" />

            {/* Bamboo Stalk held by Panda */}
            <rect x="94" y="80" width="6" height="36" rx="2" fill="#22c55e" stroke="#16a34a" strokeWidth="1" />
            <path d="M 98 84 Q 112 78 114 86 Z" fill="#4ade80" />
            <path d="M 94 96 Q 80 92 84 100 Z" fill="#4ade80" />

            {/* Front Black Paws */}
            <circle cx="56" cy="106" r="11" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />
            <circle cx="104" cy="106" r="11" fill="#1e293b" stroke="#0f172a" strokeWidth="1.5" />

            {/* Rosy Cheeks */}
            <ellipse cx="44" cy="88" rx="9" ry="6" fill="#fda4af" opacity="0.75" />
            <ellipse cx="116" cy="88" rx="9" ry="6" fill="#fda4af" opacity="0.75" />

            {/* Eye Patches (Black tilted ovals) */}
            <ellipse cx="58" cy="74" rx="13" ry="16" transform="rotate(-15 58 74)" fill="#1e293b" />
            <ellipse cx="102" cy="74" rx="13" ry="16" transform="rotate(15 102 74)" fill="#1e293b" />

            {/* Eyes */}
            {mascotMood === 'eating' || mascotMood === 'celebrate' ? (
              <>
                <path d="M 52 74 Q 58 66 64 74" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M 96 74 Q 102 66 108 74" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </>
            ) : mascotMood === 'sad' ? (
              <>
                <path d="M 52 71 L 64 77 M 64 71 L 52 77" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <path d="M 96 71 L 108 77 M 108 71 L 96 77" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
                <path d="M 32 75 C 30 65, 38 65, 36 78 C 34 82, 30 80, 32 75" fill="#38bdf8" />
              </>
            ) : (
              <>
                <circle cx="60" cy="74" r="5" fill="#ffffff" />
                <circle cx="61" cy="74" r="3.5" fill="#0f172a" />
                <circle cx="59" cy="72" r="1.8" fill="#ffffff" />

                <circle cx="100" cy="74" r="5" fill="#ffffff" />
                <circle cx="99" cy="74" r="3.5" fill="#0f172a" />
                <circle cx="97" cy="72" r="1.8" fill="#ffffff" />
              </>
            )}

            {/* Nose */}
            <ellipse cx="80" cy="85" rx="5" ry="3.5" fill="#0f172a" />

            {/* Mouth */}
            {mascotMood === 'eating' ? (
              <path d="M 74 94 Q 80 102 86 94 Z" fill="#be185d" />
            ) : mascotMood === 'sad' ? (
              <path d="M 74 95 Q 80 90 86 95" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            ) : (
              <path d="M 74 90 Q 80 96 86 90" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            )}

            {/* Crown if level >= 3 */}
            {level >= 3 && (
              <g transform="translate(56, 12)">
                <path d="M 0 20 L 12 0 L 24 16 L 36 0 L 48 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2.5" />
                <circle cx="12" cy="2" r="3" fill="#ef4444" />
                <circle cx="24" cy="16" r="2.5" fill="#3b82f6" />
                <circle cx="36" cy="2" r="3" fill="#10b981" />
              </g>
            )}
          </svg>
        </motion.div>
      </div>
    );
  };

  // Dispatcher for current mascot
  const renderCurrentMascot = () => {
    switch (mascotType) {
      case 'pig': return renderPigMascot();
      case 'tree': return renderTreeMascot();
      case 'cat': return renderCatMascot();
      case 'dino': return renderDinoMascot();
      case 'panda': return renderPandaMascot();
    }
  };

  // Game over / Completion screen
  if (isGameOver) {
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 100;
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-slate-50/95 backdrop-blur-md rounded-3xl overflow-y-auto">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-3xl font-black text-slate-900 mb-2">Chúc Mừng Bạn! 🎉</h2>
          <p className="text-slate-600 font-medium mb-6">
            Linh vật {MASCOTS_CONFIG[mascotType].name} đã no nê và đạt cấp {level}!
          </p>

          <div className="mb-6 flex justify-center">
            {renderCurrentMascot()}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 block mb-1">Đúng</span>
              <span className="text-2xl font-black text-indigo-700">{score}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <span className="text-xs font-bold text-amber-600 block mb-1">Chuỗi cao</span>
              <span className="text-2xl font-black text-amber-700">{maxStreak} 🔥</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <span className="text-xs font-bold text-emerald-600 block mb-1">Chính xác</span>
              <span className="text-2xl font-black text-emerald-700">{accuracy}%</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={restartGame}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Lại
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
            >
              Thoát Menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 font-bold">Đang chuẩn bị câu hỏi...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 md:p-6 bg-slate-50/90 backdrop-blur-md rounded-3xl overflow-hidden select-none">
      {/* Top Navigation & Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
        {/* Left: Mode toggle and Mascot Switcher */}
        <div className="flex items-center gap-2">
          {/* Mode Switcher */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
            <button
              onClick={() => {
                setIsInfinite(false);
                setTargetQuestions(words.length > 0 ? words.length : 10);
                setQuestionIndex(0);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                !isInfinite ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {words.length > 0 ? `${words.length} Câu` : 'Theo Bộ'}
            </button>
            <button
              onClick={() => setIsInfinite(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all ${
                isInfinite ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5" /> Vô Tận
            </button>
          </div>

          {/* Mascot Switcher */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto max-w-[280px] sm:max-w-none">
            {(Object.keys(MASCOTS_CONFIG) as MascotType[]).map((mKey) => {
              const m = MASCOTS_CONFIG[mKey];
              const isSelected = mascotType === mKey;
              return (
                <button
                  key={mKey}
                  onClick={() => {
                    setMascotType(mKey);
                    setSpeechBubble(m.welcomeSpeech);
                  }}
                  title={`Đổi sang Linh vật ${m.name}`}
                  className={`px-2 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 ${
                    isSelected ? m.activeBtnBg : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">{m.icon}</span>
                  <span className="hidden sm:inline">{m.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Score, Streak, and Controls */}
        <div className="flex items-center gap-3">
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-xs animate-bounce"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{streak} COMBO</span>
            </motion.div>
          )}

          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs font-extrabold text-slate-800 text-sm">
            Điểm: <span className="text-indigo-600 font-black">{score}</span>
            {!isInfinite && (
              <span className="text-slate-400 font-normal ml-1.5">
                ({questionIndex + 1}/{targetQuestions})
              </span>
            )}
          </div>

          {isInfinite && (
            <button
              onClick={() => setIsGameOver(true)}
              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" /> Kết Thúc
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Left Mascot, Right Question Audio & Picture Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 overflow-y-auto items-center">
        
        {/* Left Col: Mascot & Progress (4 Cols on lg) */}
        <div className="lg:col-span-4 bg-white/80 backdrop-blur-md rounded-3xl p-4 border border-slate-200 shadow-sm flex flex-col items-center justify-between min-h-[220px] lg:min-h-[420px]">
          
          {/* Mascot Speech Bubble */}
          <motion.div
            key={speechBubble}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative mb-2 w-full bg-slate-900 text-white px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-semibold text-center shadow-md"
          >
            {speechBubble}
            {/* Bubble arrow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900"></div>
          </motion.div>

          {/* Interactive Mascot SVG Canvas */}
          <div className="my-auto py-2 flex items-center justify-center">
            {renderCurrentMascot()}
          </div>

          {/* Mascot Growth / Energy Bar */}
          <div className="w-full mt-2">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 px-1">
              <span>{MASCOTS_CONFIG[mascotType].metricLabel}</span>
              <span className={`${MASCOTS_CONFIG[mascotType].textColor} font-extrabold`}>{growth}% (Cấp {level})</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${growth}%` }}
                className={`h-full rounded-full transition-all duration-500 ${MASCOTS_CONFIG[mascotType].barGradient}`}
              />
            </div>
          </div>
        </div>

        {/* Right Col: Audio Player Box & Multiple Choice Images (8 Cols on lg) */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full gap-3">
          
          {/* Question Audio Box */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Audio Replay & Waveform */}
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayAudio(currentWord, 1.0)}
                disabled={isPlayingAudio}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all ${
                  isPlayingAudio ? 'bg-pink-500 ring-4 ring-pink-200' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                title="Bấm để nghe phát âm"
              >
                <Volume2 className={`w-8 h-8 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              </motion.button>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Nghe và chọn hình đúng</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-lg md:text-xl font-black text-slate-800">
                    {isAnswered ? currentWord.term : '🔊 ???'}
                  </span>
                  {isAnswered && (
                    <span className="text-xs md:text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      {currentWord.definition}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Audio Tools */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayAudio(currentWord, 0.75)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                title="Nghe tốc độ chậm"
              >
                <Snail className="w-4 h-4 text-amber-600" /> Nghe chậm
              </button>

              {currentWord.definition && (
                <button
                  onClick={() => speakVn(currentWord.definition, currentWord.viAudioUrl, 1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
                  title="Nghe nghĩa tiếng Việt"
                >
                  <Volume2 className="w-4 h-4 text-blue-500" /> Tiếng Việt
                </button>
              )}

              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors border border-amber-200/60"
                title="Gợi ý nghĩa"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {showHint ? currentWord.definition : 'Gợi ý'}
              </button>
            </div>
          </div>

          {/* Picture Multiple Choice Grid (4 Options) */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            {options.map((option, idx) => {
              const isSelected = selectedWordId === option.id;
              const isTarget = option.id === currentWord.id;

              let cardStyle = 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-md';
              if (isAnswered) {
                if (isTarget) {
                  cardStyle = 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-200/80 shadow-md';
                } else if (isSelected && !isTarget) {
                  cardStyle = 'bg-rose-50 border-rose-500 ring-4 ring-rose-200/80 shadow-md opacity-75';
                } else {
                  cardStyle = 'bg-white border-slate-200 opacity-40';
                }
              }

              return (
                <motion.button
                  key={`${questionIndex}-${option.id}`}
                  whileHover={!isAnswered ? { y: -3, scale: 1.02 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                  className={`relative rounded-2xl md:rounded-3xl border-2 p-2.5 md:p-3 flex flex-col items-center justify-between transition-all overflow-hidden cursor-pointer ${cardStyle} min-h-[130px] md:min-h-[160px]`}
                >
                  {/* Badge Number / Shortcut */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/10 text-slate-700 text-xs font-black flex items-center justify-center z-10">
                    {idx + 1}
                  </div>

                  {/* Feedback icon */}
                  {isAnswered && isTarget && (
                    <div className="absolute top-2 right-2 text-emerald-600 bg-white rounded-full p-0.5 shadow-sm z-10 animate-bounce">
                      <CheckCircle2 className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  )}
                  {isAnswered && isSelected && !isTarget && (
                    <div className="absolute top-2 right-2 text-rose-600 bg-white rounded-full p-0.5 shadow-sm z-10">
                      <XCircle className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                  )}

                  {/* Image container */}
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 my-1">
                    {option.imageUrl ? (
                      <SmartImage
                        src={option.imageUrl}
                        alt={option.term}
                        className="max-h-24 md:max-h-32 w-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <span className="text-3xl md:text-4xl mb-1">🖼️</span>
                        <span className="text-xs font-bold text-slate-400">Không có hình</span>
                      </div>
                    )}
                  </div>

                  {/* Text label underneath (always shows definition/hint on answer) */}
                  <div className="w-full text-center mt-1">
                    <span className="text-xs md:text-sm font-bold text-slate-800 line-clamp-1">
                      {isAnswered ? option.term : option.definition || option.term}
                    </span>
                    {isAnswered && (
                      <span className="text-[11px] font-medium text-slate-500 block truncate">
                        {option.definition}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Bottom Controls / Manual Next Button if wrong or reviewing */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <span className="text-emerald-600 font-extrabold text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5" /> Chính xác! Linh vật đang ăn ngon lành! 💖
                  </span>
                ) : (
                  <span className="text-rose-600 font-extrabold text-sm flex items-center gap-1.5">
                    <XCircle className="w-5 h-5" /> Chưa đúng rồi! Đáp án là: <span className="underline">{currentWord.term}</span>
                  </span>
                )}
              </div>

              <button
                onClick={handleNextManual}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-sm flex items-center gap-1.5"
              >
                Tiếp Theo <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
