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
  Trophy,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Flame,
  Snail,
  Award,
  Crown
} from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';
import { fireConfetti } from '../../utils/confetti';

export type WorkshopThemeType = 'boba' | 'dragon' | 'castle' | 'aquarium';

type StageMood = 'idle' | 'success' | 'blooper' | 'levelup';

interface ThemeMeta {
  type: WorkshopThemeType;
  name: string;
  icon: string;
  welcomeSpeech: string;
  metricLabel: string;
  barGradient: string;
  textColor: string;
  activeBtnBg: string;
  stageBg: string;
  goodItems: string[];
  badItems: string[];
  rankNames: string[];
  cheerPhrases: string[];
  blooperPhrases: string[];
}

const THEMES_CONFIG: Record<WorkshopThemeType, ThemeMeta> = {
  boba: {
    type: 'boba',
    name: 'Tiệm Trà Sữa',
    icon: '🧋',
    welcomeSpeech: 'Chào chủ tiệm! Nghe từ chuẩn để pha Trà Sữa Trân Châu thật ngon nha! 🧋✨',
    metricLabel: 'Độ Ngon Trà Sữa 🧋',
    barGradient: 'bg-gradient-to-r from-amber-400 via-orange-400 to-pink-500',
    textColor: 'text-orange-600',
    activeBtnBg: 'bg-orange-500 text-white shadow-xs',
    stageBg: 'from-amber-50 via-orange-50/60 to-rose-50',
    goodItems: ['🧋', '🍓', '🍮', '🧀', '🍑', '🍦', '🍒', '🍯', '🍰', '🍪'],
    badItems: ['🌶️', '🧄', '🧅', '🥦'],
    rankNames: [
      'Xe Đẩy Trà Sữa Nhỏ',
      'Quán Trà Sữa Góc Phố',
      'Tiệm Bánh Kem & Boba Xinh',
      'Nhà Hàng Trà Sữa Hoàng Gia',
      'Đế Chế Trà Sữa Vũ Trụ'
    ],
    cheerPhrases: [
      'Trân châu đường đen dẻo tuyệt cú mèo! 🧋✨',
      'Thêm lớp kem phô mai béo ngậy thơm lừng! 🧀💖',
      'Khách hàng uống một ngụm mê tít mắt luôn! 😍',
      'Đỉnh quá chủ tiệm ơi! Ly trà sữa đẹp xuất sắc! 🍓',
      'Quán đông khách nườm nượp nhờ đôi tai siêu thính! 🌟',
      'Ngọt ngào mát lạnh, thưởng thêm 100 điểm độ ngon! 🍮'
    ],
    blooperPhrases: [
      'Ái chà! Lỡ tay bỏ nhầm trái ớt cay xè vào ly rồi! 🌶️💨',
      'Khách uống trúng vị tỏi nồng quá, nhìn thẻ xanh để nhớ từ nha! 🧄😅',
      'Suýt nữa thì đúng công thức rồi, nghe kỹ câu sau nhé! 💪',
      'Đừng lo, pha lại ly mới siêu ngon ở câu tiếp theo nào! 🧋'
    ]
  },
  dragon: {
    type: 'dragon',
    name: 'Ấp Trứng Rồng',
    icon: '🐲',
    welcomeSpeech: 'Chào nhà huấn luyện! Hãy nghe đúng để truyền phép thuật ấp Trứng Rồng Thần nhé! 🥚🔥',
    metricLabel: 'Phép Thuật Tiến Hóa 🔥',
    barGradient: 'bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-500',
    textColor: 'text-rose-600',
    activeBtnBg: 'bg-rose-600 text-white shadow-xs',
    stageBg: 'from-rose-50 via-amber-50/60 to-orange-50',
    goodItems: ['🔥', '💎', '⚡', '🌟', '🍖', '🍎', '👑', '✨'],
    badItems: ['❄️', '🌧️', '💨', '🪨'],
    rankNames: [
      'Trứng Rồng Cổ Đại',
      'Rồng Con Mới Nở',
      'Rồng Lửa Vẫy Cánh',
      'Chiến Long Giáp Vàng',
      'Thần Long Huyền Thoại'
    ],
    cheerPhrases: [
      'Graoo! Ngọn lửa phép thuật ấm áp làm Rồng lớn nhanh quá! 🔥',
      'Vảy rồng lấp lánh như kim cương rồi kìa! 💎✨',
      'Rồng con vỗ cánh phun pháo hoa khen bạn tai siêu thính! 🐲🌟',
      'Năng lượng phép thuật tăng vọt! Sắp tiến hóa cấp mới rồi! ⚡',
      'Tuyệt đỉnh! Bạn đúng là Bậc Thầy Huấn Luyện Rồng! 👑',
      'Rồng Thần gầm vang đầy tự hào vì câu trả lời chuẩn xác! 🦖💖'
    ],
    blooperPhrases: [
      'Hắt xì! 🤧 Gió lạnh thổi qua làm Rồng con hơi run một xíu! ❄️',
      'Oái! Trứng bị dính chút bùn rồi, nhìn đáp án màu xanh để lau sạch nha! 💧',
      'Không sao cả, truyền lại lửa ấm ở câu tiếp theo nhé! 🔥💪',
      'Rồng con chớp mắt động viên bạn: Câu sau chắc chắn đúng nè! 🐲'
    ]
  },
  castle: {
    type: 'castle',
    name: 'Xây Lâu Đài',
    icon: '🏰',
    welcomeSpeech: 'Chào Kiến Trúc Sư! Mỗi câu nghe đúng sẽ xây thêm 1 tầng Lâu Đài Trên Mây! 🏰☁️',
    metricLabel: 'Độ Cao Công Trình 🏗️',
    barGradient: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-sky-500',
    textColor: 'text-indigo-600',
    activeBtnBg: 'bg-indigo-600 text-white shadow-xs',
    stageBg: 'from-sky-50 via-indigo-50/60 to-purple-50',
    goodItems: ['🏰', '🧱', '🌈', '🎈', '👑', '🎠', '🎡', '✨'],
    badItems: ['🔨', '💫', '🌪️', '🚧'],
    rankNames: [
      'Nhà Gỗ Nhỏ Xinh',
      'Biệt Thự Vườn Hoa',
      'Tháp Phép Thuật Chọc Trời',
      'Lâu Đài Pha Lê Trên Mây',
      'Cung Điện Ngân Hà Vũ Trụ'
    ],
    cheerPhrases: [
      'Cần cẩu thả tầng mới khớp chuẩn từng milimet luôn! 🏗️✨',
      'Tòa lâu đài cao vút chạm tới đám mây cầu vồng rồi! 🌈🏰',
      'Cư dân trong lâu đài reo hò khen đôi tai vàng của bạn! 🎉',
      'Mở khóa thêm tầng Vườn Treo & Đài Quan Sát Sao Băng! 🔭🌟',
      'Kiến trúc sư tài ba quá! Công trình ngày càng tráng lệ! 👑',
      'Vững chắc như bàn thạch! Lên tiếp tầng cao hơn nữa nào! 🚀'
    ],
    blooperPhrases: [
      'Úi chà! Cơn gió làm viên gạch hơi nghiêng một chút rồi! 🧱💫',
      'Đội thợ xây đang chỉnh lại thước đo, bạn xem từ đúng ở ô màu xanh nhé! 👷',
      'Chỉ lệch một tẹo thôi, câu tiếp theo xây tiếp tầng mới nha! 🏗️',
      'Lâu đài vẫn siêu vững chắc, cố lên Kiến Trúc Sư ơi! 💪'
    ]
  },
  aquarium: {
    type: 'aquarium',
    name: 'Thủy Cung',
    icon: '🐠',
    welcomeSpeech: 'Chào Thuyền Trưởng! Nghe chuẩn để câu Cá Quý & Rương Kho Báu về Thủy Cung nha! 🐠💎',
    metricLabel: 'Kho Báu Thủy Cung 💎',
    barGradient: 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-600',
    textColor: 'text-sky-600',
    activeBtnBg: 'bg-sky-600 text-white shadow-xs',
    stageBg: 'from-cyan-50 via-sky-50/70 to-blue-50',
    goodItems: ['🐠', '🐬', '🐙', '💎', '👑', '🐚', '🐢', '🐳', '🦀', '🌟'],
    badItems: ['🥾', '🥫', '🛞', '🌿'],
    rankNames: [
      'Bể Cá Mini Để Bàn',
      'Hồ San Hô Rực Rỡ',
      'Thủy Cung Pha Lê Xanh',
      'Cung Điện Vua Thủy Tề',
      'Đại Dương Kho Báu Huyền Thoại'
    ],
    cheerPhrases: [
      'Kéo cần lên nào! Câu trúng một chú Cá Vàng Hoàng Gia siêu hiếm! 🐠✨',
      'Oa! Vớt được nguyên Rương Kim Cương lấp lánh dưới đáy biển! 💎👑',
      'Viên Ngọc Trai Phát Sáng đã được thả vào Thủy Cung của bạn! 🐚🌟',
      'Chú Cá Heo Hồng nhảy vọt lên mặt nước vỗ tay khen bạn! 🐬💖',
      'Thủy cung ngày càng đông vui và rực rỡ sắc màu! 🌊✨',
      'Thuyền trưởng tai thính số 1 đại dương luôn! ⚓🏆'
    ],
    blooperPhrases: [
      'Ối dồi ôi! Kéo cần lên lại dính chiếc ủng cũ kỹ dưới biển! 🥾💦',
      'Chú cua nhỏ kẹp nhẹ vào dây câu rồi, nhìn ô màu xanh để nhớ từ đúng nha! 🦀',
      'Cá quý vừa bơi lướt qua, thả câu lại ở câu tiếp theo nhé! 🎣💪',
      'Đừng nản lòng Thuyền Trưởng ơi, kho báu lớn đang chờ phía trước! ⚓'
    ]
  }
};

export default function MagicWorkshopMtq({ words, onExit }: { words: Word[]; onExit: () => void }) {
  const { speakEn, speakVn, reduceMotion } = useSettings();

  // Game Mode & Progression State
  const [isInfinite, setIsInfinite] = useState<boolean>(true);
  const [targetQuestions, setTargetQuestions] = useState<number>(words.length > 0 ? words.length : 10);
  const [questionIndex, setQuestionIndex] = useState<number>(0);

  // Selected Workshop Theme (switchable anytime without losing progress)
  const [themeType, setThemeType] = useState<WorkshopThemeType>('boba');
  const [progress, setProgress] = useState<number>(20); // 0 to 100%
  const [level, setLevel] = useState<number>(1);
  const [stageMood, setStageMood] = useState<StageMood>('idle');
  const [speechBubble, setSpeechBubble] = useState<string>(THEMES_CONFIG.boba.welcomeSpeech);
  const [floatingEffectItem, setFloatingEffectItem] = useState<string>('🧋');
  const [collectedItems, setCollectedItems] = useState<string[]>(['🧋', '🍓']);

  // Question & Options State
  const [currentWord, setCurrentWord] = useState<Word | null>(null);
  const [options, setOptions] = useState<Word[]>([]);
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);

  // Stats
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [maxStreak, setMaxStreak] = useState<number>(0);
  const [totalAttempts, setTotalAttempts] = useState<number>(0);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);

  // Audio & Hints
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);

  const audioTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentTheme = THEMES_CONFIG[themeType];
  const currentRankName = currentTheme.rankNames[Math.min(level - 1, currentTheme.rankNames.length - 1)];

  // Prepare a fresh question
  const prepareNextQuestion = (forceWord?: Word) => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (words.length === 0) return;

    let target: Word;
    if (forceWord) {
      target = forceWord;
    } else if (words.length === 1) {
      target = words[0];
    } else {
      const candidates = words.filter((w) => !currentWord || w.id !== currentWord.id);
      target = candidates[Math.floor(Math.random() * candidates.length)];
    }

    const distractors = shuffleArray(words.filter((w) => w.id !== target.id)).slice(0, 3);
    const combinedOptions = shuffleArray([target, ...distractors]);

    setCurrentWord(target);
    setOptions(combinedOptions);
    setSelectedWordId(null);
    setIsAnswered(false);
    setIsCorrect(false);
    setShowHint(false);

    if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
    audioTimerRef.current = setTimeout(() => {
      handlePlayAudio(target, 1.0);
    }, 220);
  };

  useEffect(() => {
    prepareNextQuestion();
    return () => {
      if (audioTimerRef.current) clearTimeout(audioTimerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [words]);

  const handlePlayAudio = async (wordToPlay: Word | null, customRate: number = 1.0) => {
    if (!wordToPlay) return;
    setIsPlayingAudio(true);
    try {
      if (customRate !== 1.0 && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(wordToPlay.term);
        u.lang = 'en-US';
        u.rate = customRate;
        u.onend = () => setIsPlayingAudio(false);
        u.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(u);
      } else {
        await speakEn(wordToPlay.term, wordToPlay.audioUrl, 1);
        setIsPlayingAudio(false);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Keyboard shortcuts (1-4 to pick card, Space to replay audio)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isGameOver || !currentWord) return;
      if (e.key >= '1' && e.key <= '4') {
        const idx = parseInt(e.key, 10) - 1;
        if (!isAnswered && options[idx]) {
          handleOptionClick(options[idx]);
        }
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (isAnswered) {
          e.preventDefault();
          handleNextManual();
        } else if (e.key === ' ') {
          e.preventDefault();
          handlePlayAudio(currentWord, 1.0);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isGameOver, currentWord, isAnswered, options]);

  const handleOptionClick = (option: Word) => {
    if (isAnswered || !currentWord) return;

    setSelectedWordId(option.id);
    setIsAnswered(true);
    setTotalAttempts((prev) => prev + 1);

    const correct = option.id === currentWord.id;
    setIsCorrect(correct);

    if (correct) {
      playSound('correct');
      const newScore = score + 1;
      const newStreak = streak + 1;
      setScore(newScore);
      setStreak(newStreak);
      if (newStreak > maxStreak) setMaxStreak(newStreak);

      // Pick a delightful reward item for the active theme
      const goods = currentTheme.goodItems;
      const rewardItem = goods[Math.floor(Math.random() * goods.length)];
      setFloatingEffectItem(rewardItem);
      setCollectedItems((prev) => [...prev.slice(-11), rewardItem]);

      // Calculate growth & Level Up
      const nextProgress = progress + 20;
      if (nextProgress >= 100) {
        const nextLevel = level + 1;
        setProgress(nextProgress - 80);
        setLevel(nextLevel);
        setStageMood('levelup');
        if (!reduceMotion) {
          fireConfetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
        }
      } else {
        setProgress(nextProgress);
        setStageMood('success');
      }

      const cheers = currentTheme.cheerPhrases;
      setSpeechBubble(cheers[Math.floor(Math.random() * cheers.length)]);

      if (newStreak % 5 === 0 && !reduceMotion) {
        fireConfetti({ particleCount: 55, spread: 70, origin: { y: 0.7 } });
      }

      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isInfinite && questionIndex + 1 >= targetQuestions) {
          setIsGameOver(true);
          if (!reduceMotion) fireConfetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
        } else {
          setQuestionIndex((prev) => prev + 1);
          setStageMood('idle');
          prepareNextQuestion();
        }
      }, reduceMotion ? 650 : 1400);
    } else {
      playSound('incorrect');
      setStreak(0);

      // Pick a funny blooper item (e.g. spicy chili, ice cloud, old boot)
      const bads = currentTheme.badItems;
      const badItem = bads[Math.floor(Math.random() * bads.length)];
      setFloatingEffectItem(badItem);

      setProgress((prev) => Math.max(10, prev - 10));
      setStageMood('blooper');

      const bloopers = currentTheme.blooperPhrases;
      setSpeechBubble(bloopers[Math.floor(Math.random() * bloopers.length)]);

      // Replay the correct word pronunciation slightly after so student hears the right answer clearly
      setTimeout(() => {
        if (currentWord) {
          speakEn(currentWord.term, currentWord.audioUrl, 1).catch(() => {});
        }
      }, 350);

      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isInfinite && questionIndex + 1 >= targetQuestions) {
          setIsGameOver(true);
          if (!reduceMotion) fireConfetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
        } else {
          setQuestionIndex((prev) => prev + 1);
          setStageMood('idle');
          prepareNextQuestion();
        }
      }, reduceMotion ? 900 : 1750);
    }
  };

  const handleNextManual = () => {
    if (nextTimerRef.current) {
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
    if (!isInfinite && questionIndex + 1 >= targetQuestions) {
      setIsGameOver(true);
      if (!reduceMotion) fireConfetti({ particleCount: 120, spread: 100, origin: { y: 0.5 } });
    } else {
      setQuestionIndex((prev) => prev + 1);
      setStageMood('idle');
      prepareNextQuestion();
    }
  };

  const restartGame = () => {
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setQuestionIndex(0);
    setTargetQuestions(words.length > 0 ? words.length : 10);
    setProgress(20);
    setLevel(1);
    setIsGameOver(false);
    setStageMood('idle');
    setSpeechBubble(currentTheme.welcomeSpeech);
    prepareNextQuestion();
  };

  // ============================================================================
  // LIGHTWEIGHT STATIC SVG STAGES (60 FPS ON LOW-END DEVICES)
  // ============================================================================

  // 1. BOBA & BAKERY SHOP SVG
  const renderBobaStage = () => {
    const pearlCount = Math.min(18, 4 + level * 2 + Math.floor(progress / 20));
    return (
      <svg viewBox="0 0 180 180" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-md">
        {/* Soft Counter Shadow */}
        <ellipse cx="90" cy="164" rx="62" ry="10" fill="rgba(0,0,0,0.1)" />

        {/* Shop Awning at top if Level >= 2 */}
        {level >= 2 && (
          <g transform="translate(20, 4)">
            <rect x="0" y="0" width="140" height="16" rx="8" fill="#fb7185" />
            <path d="M 10 16 Q 22 26 35 16 Q 48 26 60 16 Q 72 26 85 16 Q 98 26 110 16 Q 122 26 135 16" fill="#fda4af" />
          </g>
        )}

        {/* Giant Cute Straw */}
        <rect
          x="102"
          y="18"
          width="14"
          height="65"
          rx="5"
          transform="rotate(12 102 18)"
          fill={level >= 3 ? '#f43f5e' : '#ec4899'}
          stroke="#be185d"
          strokeWidth="2"
        />

        {/* Whipped Cream / Cheese Foam Top */}
        <path
          d="M 44 66 Q 55 42 75 52 Q 90 36 108 50 Q 126 42 136 66 Z"
          fill={stageMood === 'blooper' ? '#fca5a5' : '#fffbeb'}
          stroke="#f59e0b"
          strokeWidth="2.5"
        />

        {/* Cherry or Crown on Top */}
        {level >= 3 ? (
          <g transform="translate(68, 22)">
            <path d="M 0 20 L 10 2 L 22 15 L 34 2 L 44 20 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
            <circle cx="22" cy="12" r="3" fill="#ef4444" />
          </g>
        ) : (
          <circle cx="75" cy="44" r="8" fill="#ef4444" stroke="#b91c1c" strokeWidth="2" />
        )}

        {/* Cup Body */}
        <path
          d="M 42 64 L 54 152 Q 90 162 126 152 L 138 64 Z"
          fill={stageMood === 'blooper' ? '#fecaca' : '#fde68a'}
          stroke="#d97706"
          strokeWidth="3"
        />

        {/* Milk Tea Liquid Layer */}
        <path
          d="M 46 82 Q 90 88 134 82 L 124 150 Q 90 158 56 150 Z"
          fill={stageMood === 'blooper' ? '#ef4444' : level >= 4 ? '#f472b6' : '#f59e0b'}
          opacity="0.85"
        />

        {/* Kawaii Face on the Boba Cup */}
        {stageMood === 'blooper' ? (
          <>
            {/* X_X spicy eyes */}
            <path d="M 65 98 L 75 108 M 75 98 L 65 108" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
            <path d="M 105 98 L 115 108 M 115 98 L 105 108" stroke="#7f1d1d" strokeWidth="3" strokeLinecap="round" />
            {/* Wavy spicy mouth + tongue */}
            <path d="M 78 116 Q 90 108 102 116" stroke="#7f1d1d" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 85 114 Q 90 126 95 114 Z" fill="#fb7185" />
          </>
        ) : (
          <>
            {/* Sparkling Happy Eyes */}
            <circle cx="70" cy="102" r="5.5" fill="#1e293b" />
            <circle cx="68" cy="100" r="2" fill="#ffffff" />
            <circle cx="110" cy="102" r="5.5" fill="#1e293b" />
            <circle cx="108" cy="100" r="2" fill="#ffffff" />
            {/* Rosy Cheeks */}
            <ellipse cx="58" cy="108" rx="6" ry="3.5" fill="#fb7185" opacity="0.7" />
            <ellipse cx="122" cy="108" rx="6" ry="3.5" fill="#fb7185" opacity="0.7" />
            {/* Happy Smile */}
            {stageMood === 'success' || stageMood === 'levelup' ? (
              <path d="M 80 106 Q 90 120 100 106 Z" fill="#be185d" />
            ) : (
              <path d="M 82 108 Q 90 115 98 108" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
            )}
          </>
        )}

        {/* Boba Pearls at the bottom of the cup */}
        {Array.from({ length: pearlCount }).map((_, idx) => {
          const row = Math.floor(idx / 6);
          const col = idx % 6;
          const cx = 62 + col * 11 + (row % 2 === 1 ? 4 : 0);
          const cy = 144 - row * 9;
          return (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="4.2"
              fill={stageMood === 'blooper' ? '#991b1b' : '#451a03'}
              stroke="#78350f"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    );
  };

  // 2. DRAGON EGG HATCHERY SVG
  const renderDragonStage = () => {
    return (
      <svg viewBox="0 0 180 180" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-md">
        {/* Magical Nest / Pedestal */}
        <ellipse cx="90" cy="158" rx="60" ry="12" fill="#78350f" opacity="0.25" />
        <path d="M 38 145 Q 90 168 142 145 Q 130 162 90 164 Q 50 162 38 145 Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" />

        {/* Dragon Wings when Level >= 2 */}
        {level >= 2 && (
          <g>
            <path d="M 48 95 Q 12 65 20 105 Q 30 115 52 115 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5" />
            <path d="M 132 95 Q 168 65 160 105 Q 150 115 128 115 Z" fill="#fb923c" stroke="#c2410c" strokeWidth="2.5" />
          </g>
        )}

        {/* Main Dragon / Egg Body */}
        {level === 1 ? (
          /* Level 1: Cracking Magical Dragon Egg */
          <g>
            <path
              d="M 90 36 C 55 36, 44 95, 48 132 C 52 152, 128 152, 132 132 C 136 95, 125 36, 90 36 Z"
              fill={stageMood === 'blooper' ? '#bae6fd' : '#fef3c7'}
              stroke={stageMood === 'blooper' ? '#0284c7' : '#d97706'}
              strokeWidth="3.5"
            />
            {/* Magical Dragon Scales on Egg */}
            <circle cx="72" cy="75" r="8" fill="#f43f5e" opacity="0.7" />
            <circle cx="110" cy="82" r="10" fill="#f59e0b" opacity="0.7" />
            <circle cx="85" cy="115" r="9" fill="#10b981" opacity="0.7" />
            {/* Crack line showing baby dragon eyes peeking */}
            <path d="M 55 96 L 72 88 L 88 102 L 105 90 L 125 98" stroke="#78350f" strokeWidth="3" fill="none" />
          </g>
        ) : (
          /* Level 2+: Hatched Cute Baby Dragon! */
          <g>
            {/* Dragon Body */}
            <ellipse
              cx="90"
              cy="108"
              rx="42"
              ry="40"
              fill={stageMood === 'blooper' ? '#93c5fd' : '#10b981'}
              stroke="#047857"
              strokeWidth="3"
            />
            {/* Yellow Belly */}
            <ellipse cx="90" cy="114" rx="28" ry="26" fill="#fef08a" />
            {/* Belly Stripes */}
            <path d="M 68 106 Q 90 112 112 106" stroke="#ca8a04" strokeWidth="2" fill="none" />
            <path d="M 66 118 Q 90 124 114 118" stroke="#ca8a04" strokeWidth="2" fill="none" />
            <path d="M 72 130 Q 90 135 108 130" stroke="#ca8a04" strokeWidth="2" fill="none" />

            {/* Cute Dragon Head */}
            <circle
              cx="90"
              cy="64"
              r="30"
              fill={stageMood === 'blooper' ? '#93c5fd' : '#10b981'}
              stroke="#047857"
              strokeWidth="3"
            />
            {/* Dragon Horns */}
            <path d="M 68 42 L 56 22 L 76 36 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
            <path d="M 112 42 L 124 22 L 104 36 Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />

            {/* Eyes & Expression */}
            {stageMood === 'blooper' ? (
              <>
                <path d="M 72 58 L 82 66 M 82 58 L 72 66" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                <path d="M 98 58 L 108 66 M 108 58 L 98 66" stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
                <circle cx="96" cy="76" r="5" fill="#38bdf8" />
              </>
            ) : (
              <>
                <circle cx="76" cy="58" r="5.5" fill="#1e293b" />
                <circle cx="74" cy="56" r="2" fill="#ffffff" />
                <circle cx="104" cy="58" r="5.5" fill="#1e293b" />
                <circle cx="102" cy="56" r="2" fill="#ffffff" />
                <ellipse cx="65" cy="65" rx="5" ry="3" fill="#fb7185" opacity="0.7" />
                <ellipse cx="115" cy="65" rx="5" ry="3" fill="#fb7185" opacity="0.7" />
                <path d="M 80 72 Q 90 82 100 72" stroke="#064e3b" strokeWidth="3" fill="none" strokeLinecap="round" />
              </>
            )}

            {/* Royal Crown at Level >= 3 */}
            {level >= 3 && (
              <g transform="translate(72, 16)">
                <path d="M 0 18 L 9 2 L 18 13 L 27 2 L 36 18 Z" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
              </g>
            )}
          </g>
        )}
      </svg>
    );
  };

  // 3. SKY CASTLE BUILDER SVG
  const renderCastleStage = () => {
    const floors = Math.min(5, level);
    const floorColors = ['#60a5fa', '#a78bfa', '#f472b6', '#34d399', '#fbbf24'];
    return (
      <svg viewBox="0 0 180 180" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-md">
        {/* Floating Cloud Base */}
        <path
          d="M 25 156 Q 35 138 55 144 Q 72 132 95 142 Q 118 132 135 144 Q 155 138 160 156 Z"
          fill="#ffffff"
          stroke="#cbd5e1"
          strokeWidth="2.5"
        />

        {/* Stacked Castle Floors */}
        {Array.from({ length: floors }).map((_, idx) => {
          const width = 96 - idx * 10;
          const x = 90 - width / 2;
          const y = 128 - idx * 22;
          const color = floorColors[idx % floorColors.length];
          return (
            <g
              key={idx}
              transform={stageMood === 'blooper' && idx === floors - 1 ? 'rotate(5 90 100)' : undefined}
            >
              <rect
                x={x}
                y={y}
                width={width}
                height="22"
                rx="4"
                fill={color}
                stroke="#1e293b"
                strokeWidth="2"
              />
              {/* Windows */}
              <rect x={x + 12} y={y + 5} width="8" height="11" rx="3" fill="#fef08a" />
              <rect x={x + width - 20} y={y + 5} width="8" height="11" rx="3" fill="#fef08a" />
              {width > 64 && <rect x="86" y={y + 5} width="8" height="11" rx="3" fill="#fef08a" />}
            </g>
          );
        })}

        {/* Castle Spire Roof on Top */}
        <g transform={`translate(0, ${128 - floors * 22})`}>
          <path d="M 60 22 L 90 -8 L 120 22 Z" fill="#f43f5e" stroke="#9f1239" strokeWidth="2.5" />
          {/* Victory Flag */}
          <line x1="90" y1="-8" x2="90" y2="-24" stroke="#d97706" strokeWidth="2.5" />
          <path d="M 90 -24 L 112 -18 L 90 -12 Z" fill="#fbbf24" />
        </g>
      </svg>
    );
  };

  // 4. DEEP SEA AQUARIUM SVG
  const renderAquariumStage = () => {
    const fishCount = Math.min(6, 1 + level);
    return (
      <svg viewBox="0 0 180 180" className="w-40 h-40 md:w-48 md:h-48 drop-shadow-md">
        {/* Aquarium Glass Bowl / Tank */}
        <rect
          x="22"
          y="26"
          width="136"
          height="132"
          rx="28"
          fill={stageMood === 'blooper' ? '#cbd5e1' : '#e0f2fe'}
          stroke="#0284c7"
          strokeWidth="4"
        />
        {/* Water Fill */}
        <rect
          x="26"
          y="42"
          width="128"
          height="112"
          rx="24"
          fill={stageMood === 'blooper' ? '#94a3b8' : '#38bdf8'}
          opacity="0.45"
        />

        {/* Golden Sand Bottom */}
        <path d="M 30 136 Q 90 126 150 136 L 146 152 Q 90 156 34 152 Z" fill="#fde047" />

        {/* Seaweed & Coral */}
        <path d="M 45 142 Q 38 118 48 102 Q 55 118 48 142" fill="#10b981" />
        <path d="M 135 142 Q 144 115 132 96 Q 124 115 132 142" fill="#f43f5e" />

        {/* Glowing Treasure Chest if Level >= 2 */}
        {level >= 2 && (
          <g transform="translate(74, 118)">
            <rect x="0" y="8" width="32" height="20" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            <path d="M 0 8 Q 16 -2 32 8 Z" fill="#d97706" stroke="#78350f" strokeWidth="2" />
            <circle cx="16" cy="12" r="4" fill="#fbbf24" />
          </g>
        )}

        {/* Cute Swimming Fish */}
        {stageMood === 'blooper' ? (
          /* Blooper: Old Boot in the tank */
          <g transform="translate(68, 65)">
            <text x="8" y="34" fontSize="38">🥾</text>
          </g>
        ) : (
          Array.from({ length: fishCount }).map((_, idx) => {
            const positions = [
              { x: 52, y: 74, emoji: '🐠' },
              { x: 105, y: 66, emoji: '🐬' },
              { x: 64, y: 102, emoji: '🐙' },
              { x: 112, y: 98, emoji: '🐢' },
              { x: 82, y: 56, emoji: '🐳' },
              { x: 46, y: 112, emoji: '🐚' }
            ];
            const pos = positions[idx % positions.length];
            return (
              <text key={idx} x={pos.x} y={pos.y} fontSize="24">
                {pos.emoji}
              </text>
            );
          })
        )}
      </svg>
    );
  };

  const renderActiveStage = () => {
    const baseScale = 0.92 + Math.min(0.28, (level - 1) * 0.05 + (progress / 100) * 0.08);
    return (
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Floating Reward / Blooper Item Overlay */}
        <AnimatePresence>
          {(stageMood === 'success' || stageMood === 'levelup' || stageMood === 'blooper') && (
            <motion.div
              key={`${questionIndex}-${stageMood}`}
              initial={{ scale: 0.2, y: -28, opacity: 0 }}
              animate={{ scale: [0.2, 1.35, 1], y: [-28, 6, 22], opacity: [0, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75 }}
              className="absolute text-4xl md:text-5xl z-30 pointer-events-none"
            >
              {floatingEffectItem}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Current Rank & Level Badge */}
        <div className="mb-1.5 flex items-center gap-1.5 px-3 py-1 bg-white/90 border border-slate-200 text-slate-800 font-extrabold text-xs rounded-full shadow-xs">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>Cấp {level}: {currentRankName}</span>
        </div>

        {/* Animated Stage Container */}
        <motion.div
          animate={
            reduceMotion
              ? { scale: 1 }
              : stageMood === 'success'
              ? { scale: [baseScale, baseScale * 1.12, baseScale], y: [0, -8, 0] }
              : stageMood === 'levelup'
              ? { scale: [baseScale, baseScale * 1.2, baseScale], rotate: [0, -6, 6, 0], y: [0, -14, 0] }
              : stageMood === 'blooper'
              ? { x: [0, -8, 8, -5, 5, 0], scale: baseScale * 0.96 }
              : { scale: baseScale, y: [0, -3, 0] }
          }
          transition={{
            duration: stageMood === 'idle' ? 3 : 0.55,
            repeat: stageMood === 'idle' && !reduceMotion ? Infinity : 0,
            ease: 'easeInOut'
          }}
          onClick={() => {
            setStageMood('success');
            setSpeechBubble(`Bạn vừa tương tác với ${currentTheme.name}! Nghe câu tiếp theo nào! ✨`);
            setTimeout(() => setStageMood('idle'), 900);
          }}
          className="cursor-pointer"
        >
          {themeType === 'boba' && renderBobaStage()}
          {themeType === 'dragon' && renderDragonStage()}
          {themeType === 'castle' && renderCastleStage()}
          {themeType === 'aquarium' && renderAquariumStage()}
        </motion.div>

        {/* Collected Treats / Items Showcase Strip */}
        <div className="mt-1 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/80 border border-slate-200/80 text-xs shadow-2xs max-w-[230px] overflow-hidden">
          <span className="text-[10px] font-bold text-slate-400 shrink-0">Sưu tầm:</span>
          <div className="flex items-center gap-0.5 truncate">
            {collectedItems.slice(-7).map((item, i) => (
              <span key={i} className="text-sm leading-none">{item}</span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Summary Screen when finishing finite set or clicking Finish in Infinite Mode
  if (isGameOver) {
    const accuracy = totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 100;
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 md:p-8 bg-slate-50/95 backdrop-blur-md rounded-3xl overflow-y-auto">
        <motion.div
          initial={{ scale: 0.88, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8 text-center"
        >
          <div className="w-20 h-20 mx-auto bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
            <Trophy className="w-10 h-10" />
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-1">Tuyệt Đỉnh! 🎉</h2>
          <p className="text-slate-600 font-semibold text-sm mb-4">
            Bạn đã nâng cấp <span className="text-indigo-600 font-extrabold">{currentRankName}</span> lên <span className="text-amber-600 font-extrabold">Cấp {level}</span>!
          </p>

          <div className="mb-5 flex justify-center">
            {renderActiveStage()}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl">
              <span className="text-xs font-bold text-indigo-600 block mb-1">Câu Đúng</span>
              <span className="text-2xl font-black text-indigo-700">{score}</span>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl">
              <span className="text-xs font-bold text-amber-600 block mb-1">Chuỗi Cao</span>
              <span className="text-2xl font-black text-amber-700">{maxStreak} 🔥</span>
            </div>
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <span className="text-xs font-bold text-emerald-600 block mb-1">Chính Xác</span>
              <span className="text-2xl font-black text-emerald-700">{accuracy}%</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={restartGame}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-5 h-5" /> Chơi Tiếp
            </button>
            <button
              onClick={onExit}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
            >
              Về Menu
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 font-bold">Đang chuẩn bị bàn chơi...</p>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col p-3 md:p-6 bg-gradient-to-br ${currentTheme.stageBg} backdrop-blur-md rounded-3xl overflow-hidden select-none`}>
      {/* Top Navigation & Theme Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80">
        {/* Left: Mode Toggle & 4-World Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Finite vs Infinite Toggle */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1">
            <button
              onClick={() => {
                setIsInfinite(false);
                setTargetQuestions(words.length > 0 ? words.length : 10);
                setQuestionIndex(0);
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                !isInfinite ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {words.length > 0 ? `${words.length} Câu` : 'Theo Bộ'}
            </button>
            <button
              onClick={() => setIsInfinite(true)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold flex items-center gap-1 transition-all cursor-pointer ${
                isInfinite ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <InfinityIcon className="w-3.5 h-3.5" /> Vô Tận
            </button>
          </div>

          {/* 4 Interactive World Switcher (Preserves Level & Score!) */}
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-xs flex items-center gap-1 overflow-x-auto max-w-[300px] sm:max-w-none">
            {(Object.keys(THEMES_CONFIG) as WorkshopThemeType[]).map((tKey) => {
              const t = THEMES_CONFIG[tKey];
              const isSelected = themeType === tKey;
              return (
                <button
                  key={tKey}
                  onClick={() => {
                    setThemeType(tKey);
                    setSpeechBubble(t.welcomeSpeech);
                  }}
                  title={`Đổi sang góc chơi ${t.name}`}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                    isSelected ? t.activeBtnBg : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm">{t.icon}</span>
                  <span className="hidden sm:inline">{t.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Streak, Score & Finish Button */}
        <div className="flex items-center gap-2.5">
          {streak >= 2 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              className="px-3 py-1 bg-amber-500 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 fill-white" />
              <span>{streak} COMBO</span>
            </motion.div>
          )}

          <div className="px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl shadow-xs font-extrabold text-slate-800 text-sm">
            Đúng: <span className="text-indigo-600 font-black">{score}</span>
            {!isInfinite && (
              <span className="text-slate-400 font-normal ml-1.5">
                ({questionIndex + 1}/{targetQuestions})
              </span>
            )}
          </div>

          {isInfinite && (
            <button
              onClick={() => setIsGameOver(true)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <Award className="w-3.5 h-3.5 text-amber-600" /> Tổng Kết
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Left Interactive Toy Stage (4 Cols), Right Audio & Picture Grid (8 Cols) */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 my-2 overflow-y-auto items-center">
        {/* Left Column: Toy Stage, Funny Speech Bubble & Level-Up Bar */}
        <div className="lg:col-span-4 bg-white/85 backdrop-blur-md rounded-3xl p-4 border border-slate-200/90 shadow-sm flex flex-col items-center justify-between min-h-[240px] lg:min-h-[420px]">
          {/* Dynamic Speech Bubble */}
          <motion.div
            key={speechBubble}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative mb-2 w-full px-3.5 py-2.5 rounded-2xl text-xs md:text-sm font-bold text-center shadow-md transition-colors ${
              stageMood === 'blooper'
                ? 'bg-rose-600 text-white'
                : stageMood === 'levelup'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-white'
            }`}
          >
            {speechBubble}
            <div
              className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-x-8 border-x-transparent border-t-8 ${
                stageMood === 'blooper'
                  ? 'border-t-rose-600'
                  : stageMood === 'levelup'
                  ? 'border-t-amber-500'
                  : 'border-t-slate-900'
              }`}
            />
          </motion.div>

          {/* Center SVG Stage */}
          <div className="my-auto py-1 flex items-center justify-center">
            {renderActiveStage()}
          </div>

          {/* Level Progress Bar */}
          <div className="w-full mt-2">
            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1 px-1">
              <span>{currentTheme.metricLabel}</span>
              <span className={`${currentTheme.textColor} font-extrabold`}>
                {progress}% (Cấp {level})
              </span>
            </div>
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200 p-0.5">
              <div
                style={{ width: `${progress}%` }}
                className={`h-full rounded-full transition-all duration-300 ${currentTheme.barGradient}`}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Audio Prompt & 4-Option Visual Grid */}
        <div className="lg:col-span-8 flex flex-col justify-between h-full gap-3">
          {/* Audio Player Prompt Box */}
          <div className="bg-white rounded-3xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePlayAudio(currentWord, 1.0)}
                disabled={isPlayingAudio}
                className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-all cursor-pointer ${
                  isPlayingAudio ? 'bg-pink-500 ring-4 ring-pink-200' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
                title="Bấm để nghe phát âm (Phím Space)"
              >
                <Volume2 className={`w-8 h-8 ${isPlayingAudio ? 'animate-bounce' : ''}`} />
              </motion.button>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Nghe phát âm và chọn hình đúng
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-lg md:text-xl font-black text-slate-800">
                    {isAnswered ? currentWord.term : '🔊 Bấm loa để nghe lại'}
                  </span>
                  {isAnswered && (
                    <span className="text-xs md:text-sm font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-lg">
                      {currentWord.definition}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Audio Helper Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePlayAudio(currentWord, 0.75)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Nghe tốc độ chậm"
              >
                <Snail className="w-4 h-4 text-amber-600" /> Nghe chậm
              </button>

              {currentWord.definition && (
                <button
                  onClick={() => speakVn(currentWord.definition, currentWord.viAudioUrl, 1)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Nghe nghĩa tiếng Việt"
                >
                  <Volume2 className="w-4 h-4 text-blue-500" /> Tiếng Việt
                </button>
              )}

              <button
                onClick={() => setShowHint(!showHint)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors border border-amber-200/60 cursor-pointer"
                title="Xem gợi ý chữ tiếng Anh"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {showHint ? currentWord.term : 'Gợi ý từ'}
              </button>
            </div>
          </div>

          {/* 4-Card Picture & Meaning Choice Grid */}
          <div className="grid grid-cols-2 gap-3 md:gap-4 flex-1">
            {options.map((option, idx) => {
              const isSelected = selectedWordId === option.id;
              const isTarget = option.id === currentWord.id;

              let cardStyle = 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-md';
              if (isAnswered) {
                if (isTarget) {
                  cardStyle = 'bg-emerald-50 border-emerald-500 ring-4 ring-emerald-200/90 shadow-md scale-[1.01]';
                } else if (isSelected && !isTarget) {
                  cardStyle = 'bg-rose-50 border-rose-500 ring-4 ring-rose-200/90 shadow-md opacity-80';
                } else {
                  cardStyle = 'bg-white border-slate-200 opacity-40';
                }
              }

              return (
                <motion.button
                  key={`${questionIndex}-${option.id}`}
                  whileHover={!isAnswered && !reduceMotion ? { y: -3, scale: 1.015 } : {}}
                  whileTap={!isAnswered ? { scale: 0.98 } : {}}
                  onClick={() => handleOptionClick(option)}
                  disabled={isAnswered}
                  className={`relative rounded-2xl md:rounded-3xl border-2 p-2.5 md:p-3 flex flex-col items-center justify-between transition-all overflow-hidden cursor-pointer ${cardStyle} min-h-[135px] md:min-h-[165px]`}
                >
                  {/* Shortcut Number Badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-slate-900/10 text-slate-700 text-xs font-black flex items-center justify-center z-10">
                    {idx + 1}
                  </div>

                  {/* Clear Right/Wrong Indicator Badge */}
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

                  {/* Picture Area */}
                  <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 my-1">
                    {option.imageUrl ? (
                      <SmartImage
                        src={option.imageUrl}
                        alt={option.term}
                        className="max-h-24 md:max-h-32 w-full object-contain rounded-lg"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center p-3 text-center">
                        <span className="text-3xl md:text-4xl mb-1">{currentTheme.icon}</span>
                        <span className="text-xs font-bold text-slate-500 line-clamp-2">{option.definition}</span>
                      </div>
                    )}
                  </div>

                  {/* Word / Meaning Label */}
                  <div className="w-full text-center mt-1">
                    <span className="text-xs md:text-sm font-extrabold text-slate-800 line-clamp-1">
                      {isAnswered ? option.term : option.definition || option.term}
                    </span>
                    {isAnswered && (
                      <span className="text-[11px] font-semibold text-slate-500 block truncate">
                        {option.definition}
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Instant Feedback Banner & Manual Next Button */}
          {isAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center justify-between p-3 rounded-2xl border shadow-sm ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <span className="text-emerald-700 font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
                    Chính xác! Thưởng ngay {floatingEffectItem} cho {currentTheme.name}! (+20% Cấp độ)
                  </span>
                ) : (
                  <span className="text-rose-700 font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                    <XCircle className="w-5 h-5 shrink-0 text-rose-600" />
                    Nhầm một xíu rồi ({floatingEffectItem})! Đáp án đúng là:{' '}
                    <span className="underline font-black text-emerald-700">
                      {currentWord.term} ({currentWord.definition})
                    </span>
                  </span>
                )}
              </div>

              <button
                onClick={handleNextManual}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
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
