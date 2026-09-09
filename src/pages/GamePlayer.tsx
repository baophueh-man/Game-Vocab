import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSetById } from '../lib/storage';
import { WordSet, ThemeType } from '../types';
import { useSettings } from '../contexts/SettingsContext';
import { motion, AnimatePresence } from 'motion/react';
import QuizGame from '../components/games/QuizGame';
import MatchGame from '../components/games/MatchGame';
import FlipGame from '../components/games/FlipGame';
import UnscrambleGame from '../components/games/UnscrambleGame';
import MatchUp from '../components/games/MatchUp';
import FindMatch from '../components/games/FindMatch';
import SpeakingCards from '../components/games/SpeakingCards';
import SpinWheel from '../components/games/SpinWheel';
import OpenBox from '../components/games/OpenBox';
import TapToHear from '../components/games/TapToHear';
import ListenMtq from '../components/games/ListenMtq';
import TrueFalseGame from '../components/games/TrueFalseGame';
import WordRainBalloons from '../components/games/WordRainBalloons';
import WordPathMaze from '../components/games/WordPathMaze';
import GauntletReviewGame from '../components/games/GauntletReviewGame';
import VoiceSettings from '../components/ui/VoiceSettings';
import { ArrowLeft, BrainCircuit, Layers, Shuffle, Type, MousePointer2, Target, Volume2, CircleDashed, Package, Palette, Lock, Unlock, Headphones, CheckCheck, CloudRain, Footprints, Swords } from 'lucide-react';

type GameMode = 'menu' | 'quiz' | 'match' | 'flip' | 'unscramble' | 'matchUp' | 'findMatch' | 'speakingCards' | 'spinWheel' | 'openBox' | 'tapToHear' | 'listenMtq' | 'trueFalse' | 'wordRain' | 'wordPathMaze' | 'gauntlet';

const THEMES = [
  { id: 'default', name: 'Classic Light', bgImage: '', bgOverlay: 'bg-slate-50' },
  { id: 'summer', name: 'Summer Beach', bgImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1920&q=80', bgOverlay: 'bg-sky-900/20' },
  { id: 'classroom', name: 'Classroom', bgImage: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?auto=format&fit=crop&w=1920&q=80', bgOverlay: 'bg-slate-900/40' },
  { id: 'space', name: 'Deep Space', bgImage: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=1920&q=80', bgOverlay: 'bg-indigo-900/40' },
  { id: 'jungle', name: 'Jungle Safari', bgImage: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1920&q=80', bgOverlay: 'bg-emerald-900/30' },
  { id: 'halloween', name: 'Spooky', bgImage: 'https://images.unsplash.com/photo-1508361001413-7a9dca21d08a?auto=format&fit=crop&w=1920&q=80', bgOverlay: 'bg-orange-900/40' },
];

export default function GamePlayer() {
  const { id } = useParams();
  const [set, setSet] = useState<WordSet | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<GameMode>('menu');
  const [theme, setTheme] = useState<ThemeType>('default');
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { isChildLocked, setIsChildLocked } = useSettings();

  useEffect(() => {
    const loadSet = async () => {
      if (id) {
        const loadedSet = await getSetById(id);
        setSet(loadedSet);
      }
      setLoading(false);
    };
    loadSet();
  }, [id]);

  if (loading) return <div className="text-center py-20">Loading...</div>;
  if (!set) return <div className="text-center py-20">Set not found</div>;

  const currentTheme = THEMES.find(t => t.id === theme) || THEMES[0];

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col transition-colors duration-500"
      onContextMenu={(e) => {
        if (isChildLocked) {
          e.preventDefault();
        }
      }}
      style={currentTheme.bgImage ? {
        backgroundImage: `url(${currentTheme.bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      } : { backgroundColor: '#f8fafc' }}
    >
      {/* Overlay */}
      <div className={`absolute inset-0 ${currentTheme.bgOverlay} pointer-events-none transition-colors duration-500`}></div>
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full overflow-hidden">
        {mode === 'menu' ? (
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="w-full bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-6 md:p-8 border border-white/50">
              <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <Link to="/" className="text-slate-500 hover:text-slate-900 flex items-center gap-1 mb-4 w-fit bg-white/50 px-3 py-1 rounded-full">
                    <ArrowLeft className="w-4 h-4" /> Back to Library
                  </Link>
                  <h1 className="text-4xl font-black text-slate-900 mb-2">{set.title}</h1>
                  <p className="text-slate-600 font-medium">{set.words.length} terms</p>
                </div>
                
                <div className="relative z-20 flex items-center gap-2">
                  <VoiceSettings />
                  <div className="relative">
                    <button 
                      onClick={() => setShowThemeMenu(!showThemeMenu)}
                      className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 font-bold text-slate-700 transition-all hover:scale-105"
                    >
                      <Palette className="w-5 h-5 text-indigo-500" />
                      Theme: {currentTheme.name}
                    </button>
                    
                    <AnimatePresence>
                      {showThemeMenu && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden"
                        >
                          {THEMES.map(t => (
                            <button
                              key={t.id}
                              onClick={() => { setTheme(t.id as ThemeType); setShowThemeMenu(false); }}
                              className={`w-full text-left px-4 py-3 text-sm font-bold hover:bg-slate-50 transition-colors ${theme === t.id ? 'text-indigo-600 bg-indigo-50/50' : 'text-slate-700'}`}
                            >
                              {t.name}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <GameCard title="Kiểm Tra Bài Cũ" description="Chế độ Liên Hoàn 4 Ải (Đúng/Sai ➜ Nghe ➜ Chính tả ➜ Tốc độ). Bảng điểm tổng kết, xếp hạng S/A/B/C & thống kê từ cần ôn!" icon={Swords} color="bg-amber-600" onClick={() => setMode('gauntlet')} />
                <GameCard title="Word Path Maze" description="Mê Cung Từ Vựng siêu nhẹ! Bước từng ô gạch đúng đến đích, không giật lag, cực kỳ dễ chơi." icon={Footprints} color="bg-emerald-600" onClick={() => setMode('wordPathMaze')} />
                <GameCard title="Word Rain / Balloons" description="Mưa từ vựng & Bắn bong bóng cực vui! Luyện phản xạ nhanh, nghe âm thanh hoặc nhìn nghĩa." icon={CloudRain} color="bg-sky-500" onClick={() => setMode('wordRain')} />
                <GameCard title="Listen MTQ" description="Nghe phát âm chọn hình. Nuôi linh vật Heo Ú hoặc Cây Thần mập mạp, chế độ Vô Tận!" icon={Headphones} color="bg-rose-500" onClick={() => setMode('listenMtq')} />
                <GameCard title="True or False" description="Đúng hay Sai? Bấm nút to rõ ràng hoặc quẹt thẻ phản xạ tốc độ cao!" icon={CheckCheck} color="bg-emerald-500" onClick={() => setMode('trueFalse')} />
                <GameCard title="Tap to Hear" description="Picture dictionary. Tap pictures to hear the words." icon={Volume2} color="bg-teal-500" onClick={() => setMode('tapToHear')} />
                <GameCard title="Anagram" description="Spell the word correctly from scrambled letters." icon={Type} color="bg-orange-500" onClick={() => setMode('unscramble')} />
                <GameCard title="Match up" description="Connect terms with their definitions." icon={MousePointer2} color="bg-blue-500" onClick={() => setMode('matchUp')} />
                <GameCard title="Find the match" description="Tap the correct term as they appear." icon={Target} color="bg-rose-500" onClick={() => setMode('findMatch')} />
                <GameCard title="Quiz" description="Multiple choice questions. Race against the clock!" icon={BrainCircuit} color="bg-indigo-500" onClick={() => setMode('quiz')} />
                <GameCard title="Matching pairs" description="Classic memory game. Find the matching pairs." icon={Shuffle} color="bg-violet-500" onClick={() => setMode('flip')} />
                <GameCard title="Speaking cards" description="Flashcards with text-to-speech pronunciation." icon={Volume2} color="bg-sky-500" onClick={() => setMode('speakingCards')} />
                <GameCard title="Spin the wheel" description="Spin the wheel to select a random word." icon={CircleDashed} color="bg-fuchsia-500" onClick={() => setMode('spinWheel')} />
                <GameCard title="Open the box" description="Tap boxes to reveal questions one by one." icon={Package} color="bg-emerald-500" onClick={() => setMode('openBox')} />
              </div>

              <div className="mt-12 bg-white/80 rounded-2xl border border-slate-200 p-6 shadow-sm">
                <h3 className="font-bold text-xl mb-6 text-slate-800">Terms in this set</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {set.words.map((word) => (
                    <div key={word.id} className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm flex justify-between items-center gap-4">
                      <span className="font-bold text-slate-900">{word.term}</span>
                      <span className="text-slate-600 text-right">{word.definition}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 flex items-center justify-between border-b border-white/20 bg-black/30 backdrop-blur-md text-white shadow-sm min-h-[72px]">
              {!isChildLocked ? (
                <button
                  onClick={() => setMode('menu')}
                  className="hover:bg-white/10 px-4 py-2 rounded-full flex items-center gap-2 font-bold transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" /> Exit Game
                </button>
              ) : (
                <div className="px-4 py-2 flex items-center gap-2 font-bold text-white/50 cursor-default select-none">
                  <Lock className="w-5 h-5" /> Screen Locked
                </div>
              )}
              <div className="flex items-center gap-2 md:gap-4">
                <VoiceSettings />
                <ChildLockButton 
                  isLocked={isChildLocked}
                  onLock={() => setIsChildLocked(true)}
                  onUnlock={() => setIsChildLocked(false)}
                />
                <div className="px-3 md:px-5 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider bg-white/20 backdrop-blur-md shadow-inner text-center">
                  {mode.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            </div>

            <div className={`flex-1 overflow-hidden p-2 md:p-4 flex items-center justify-center`}>
              <div className={`w-full h-full rounded-3xl shadow-2xl overflow-hidden relative theme-container theme-${theme}`}>
                {mode === 'quiz' && <QuizGame words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'listenMtq' && <ListenMtq words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'matchUp' && <MatchUp words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'flip' && <FlipGame words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'unscramble' && <UnscrambleGame words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'findMatch' && <FindMatch words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'speakingCards' && <SpeakingCards words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'spinWheel' && <SpinWheel words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'openBox' && <OpenBox words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'tapToHear' && <TapToHear words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'trueFalse' && <TrueFalseGame words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'wordRain' && <WordRainBalloons words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'wordPathMaze' && <WordPathMaze words={set.words} onExit={() => setMode('menu')} />}
                {mode === 'gauntlet' && <GauntletReviewGame words={set.words} onExit={() => setMode('menu')} />}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function GameCard({ title, description, icon: Icon, color, onClick }: any) {
  return (
    <motion.button
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all p-6 text-left group h-full flex flex-col relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${color} opacity-5 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
      <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-6 shadow-md group-hover:scale-110 transition-transform group-hover:rotate-3`}>
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 text-sm leading-relaxed">{description}</p>
    </motion.button>
  );
}

function ChildLockButton({ isLocked, onLock, onUnlock }: { isLocked: boolean, onLock: () => void, onUnlock: () => void }) {
  const [showHint, setShowHint] = useState(false);
  const pressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const hintTimer = React.useRef<NodeJS.Timeout | null>(null);

  const startPress = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isLocked) return;
    pressTimer.current = setTimeout(() => {
      onUnlock();
      setShowHint(false);
    }, 1500);
  };

  const endPress = () => {
    if (!isLocked) return;
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
    if (isLocked) {
      setShowHint(true);
      if (hintTimer.current) clearTimeout(hintTimer.current);
      hintTimer.current = setTimeout(() => setShowHint(false), 2000);
    }
  };

  const handleClick = () => {
    if (!isLocked) {
      onLock();
    }
  };

  return (
    <div className="relative flex items-center">
      <AnimatePresence>
        {showHint && isLocked && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="absolute right-full mr-3 whitespace-nowrap bg-black/80 text-white text-xs md:text-sm px-3 py-1.5 rounded-lg pointer-events-none"
          >
            Hold 1.5s to unlock
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onClick={handleClick}
        className={`p-2 md:p-3 rounded-full transition-colors flex items-center justify-center touch-manipulation ${isLocked ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
        title={isLocked ? "Hold to unlock" : "Lock screen"}
      >
        {isLocked ? <Lock className="w-4 h-4 md:w-5 md:h-5" /> : <Unlock className="w-4 h-4 md:w-5 md:h-5" />}
      </button>
    </div>
  );
}
