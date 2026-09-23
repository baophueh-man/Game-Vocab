import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Word } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, VolumeX, ArrowLeft, Play, Square, Eye, EyeOff, Languages } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';
import SmartImage from '../ui/SmartImage';

export type TapAudioMode = 'en-vi' | 'en';

export default function TapToHear({ words, onExit }: { words: Word[]; onExit: () => void }) {
  const { speakEn, speakVn, cancelSpeech } = useSettings();

  // Mode: 'en-vi' (Đọc tiếng Anh rồi đọc tiếng Việt) | 'en' (Chỉ đọc tiếng Anh)
  const [audioMode, setAudioMode] = useState<TapAudioMode>(() => {
    return (localStorage.getItem('vocagame_tap_to_hear_mode') as TapAudioMode) || 'en-vi';
  });

  // Toggle show/hide Vietnamese definition on cards
  const [showDefinition, setShowDefinition] = useState<boolean>(() => {
    return localStorage.getItem('vocagame_tap_to_hear_show_def') !== 'false';
  });

  // Currently playing state
  const [playingWordId, setPlayingWordId] = useState<string | null>(null);
  const [playingLang, setPlayingLang] = useState<'en' | 'vi' | null>(null);
  const [isAutoPlayingAll, setIsAutoPlayingAll] = useState<boolean>(false);

  const sessionRef = useRef<number>(0);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      sessionRef.current++;
      cancelSpeech();
    };
  }, [cancelSpeech]);

  const handleModeChange = (mode: TapAudioMode) => {
    setAudioMode(mode);
    localStorage.setItem('vocagame_tap_to_hear_mode', mode);
  };

  const handleToggleDefinition = () => {
    setShowDefinition((prev) => {
      const next = !prev;
      localStorage.setItem('vocagame_tap_to_hear_show_def', String(next));
      return next;
    });
  };

  const stopPlayback = useCallback(() => {
    sessionRef.current++;
    cancelSpeech();
    setPlayingWordId(null);
    setPlayingLang(null);
    setIsAutoPlayingAll(false);
  }, [cancelSpeech]);

  const playWord = useCallback(
    async (word: Word, modeOverride?: TapAudioMode): Promise<boolean> => {
      const mode = modeOverride || audioMode;
      const sessionId = ++sessionRef.current;
      setPlayingWordId(word.id);
      setPlayingLang('en');
      cancelSpeech();

      try {
        // 1. Phát âm tiếng Anh
        await speakEn(word.term, word.audioUrl);

        if (sessionRef.current !== sessionId) return false;

        // 2. Nếu chế độ là 'en-vi' và có nghĩa tiếng Việt
        if (mode === 'en-vi' && word.definition && word.definition.trim()) {
          setPlayingLang('vi');
          // Nghỉ 320ms giữa tiếng Anh và tiếng Việt cho tự nhiên
          await new Promise((resolve) => setTimeout(resolve, 320));
          if (sessionRef.current !== sessionId) return false;

          await speakVn(word.definition, word.viAudioUrl);
        }

        if (sessionRef.current === sessionId) {
          setPlayingWordId(null);
          setPlayingLang(null);
          return true;
        }
        return false;
      } catch (err) {
        console.error('Lỗi phát âm thẻ:', err);
        if (sessionRef.current === sessionId) {
          setPlayingWordId(null);
          setPlayingLang(null);
        }
        return false;
      }
    },
    [audioMode, cancelSpeech, speakEn, speakVn]
  );

  const handleCardClick = (word: Word) => {
    if (isAutoPlayingAll) {
      setIsAutoPlayingAll(false);
    }
    playWord(word);
  };

  // Play a single language on demand via individual language buttons
  const handlePlaySingle = (e: React.MouseEvent, word: Word, lang: 'en' | 'vi') => {
    e.stopPropagation();
    if (isAutoPlayingAll) {
      setIsAutoPlayingAll(false);
    }
    const sessionId = ++sessionRef.current;
    setPlayingWordId(word.id);
    setPlayingLang(lang);
    cancelSpeech();

    const task =
      lang === 'en'
        ? speakEn(word.term, word.audioUrl)
        : speakVn(word.definition, word.viAudioUrl);

    task.finally(() => {
      if (sessionRef.current === sessionId) {
        setPlayingWordId(null);
        setPlayingLang(null);
      }
    });
  };

  // Auto-play all cards sequentially
  const handleToggleAutoPlayAll = async () => {
    if (isAutoPlayingAll) {
      stopPlayback();
      return;
    }

    if (words.length === 0) return;

    setIsAutoPlayingAll(true);
    const autoSession = ++sessionRef.current;

    for (let i = 0; i < words.length; i++) {
      if (sessionRef.current !== autoSession) break;
      const word = words[i];

      setPlayingWordId(word.id);
      setPlayingLang('en');
      cancelSpeech();

      try {
        await speakEn(word.term, word.audioUrl);
        if (sessionRef.current !== autoSession) break;

        if (audioMode === 'en-vi' && word.definition?.trim()) {
          setPlayingLang('vi');
          await new Promise((r) => setTimeout(r, 320));
          if (sessionRef.current !== autoSession) break;

          await speakVn(word.definition, word.viAudioUrl);
        }

        if (sessionRef.current !== autoSession) break;

        // Nghỉ 600ms trước khi chuyển sang thẻ tiếp theo
        await new Promise((r) => setTimeout(r, 600));
      } catch {
        // Tiếp tục thẻ kế tiếp nếu lỗi
      }
    }

    if (sessionRef.current === autoSession) {
      setPlayingWordId(null);
      setPlayingLang(null);
      setIsAutoPlayingAll(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col p-3 md:p-6 overflow-hidden bg-slate-50/90 backdrop-blur-md rounded-3xl select-none">
      {/* Top Header & Controls */}
      <div className="flex flex-col gap-3 pb-4 border-b border-slate-200/80 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Back button & Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                stopPlayback();
                onExit();
              }}
              title="Quay lại danh sách trò chơi"
              className="p-2 md:px-3.5 md:py-2 rounded-xl bg-white hover:bg-slate-100 text-slate-700 hover:text-indigo-600 shadow-xs border border-slate-200 transition-all flex items-center gap-1.5 font-bold text-xs md:text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Quay lại</span>
            </button>

            <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>Tap to Hear</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 border border-teal-200">
                  {words.length} từ
                </span>
              </h2>
              <p className="text-xs text-slate-500 hidden sm:block">
                Chạm vào bất kỳ thẻ nào để nghe phát âm và nghĩa từ vựng
              </p>
            </div>
          </div>

          {/* Action buttons on the right: Auto play & Definition toggle */}
          <div className="flex items-center gap-2">
            {/* Show / Hide Definition toggle */}
            <button
              onClick={handleToggleDefinition}
              title={showDefinition ? 'Ẩn nghĩa tiếng Việt trên thẻ' : 'Hiện nghĩa tiếng Việt trên thẻ'}
              className={`px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all shadow-xs border ${
                showDefinition
                  ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              {showDefinition ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="hidden md:inline">Hiện nghĩa VI</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden md:inline">Đã ẩn nghĩa VI</span>
                </>
              )}
            </button>

            {/* Auto Play All toggle */}
            <button
              onClick={handleToggleAutoPlayAll}
              title={isAutoPlayingAll ? 'Dừng đọc lần lượt' : 'Tự động đọc lần lượt tất cả các thẻ'}
              className={`px-3 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-extrabold flex items-center gap-1.5 transition-all shadow-xs border ${
                isAutoPlayingAll
                  ? 'bg-rose-500 hover:bg-rose-600 text-white border-rose-600 animate-pulse'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-700'
              }`}
            >
              {isAutoPlayingAll ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-white" />
                  <span>Dừng đọc</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Đọc lần lượt</span>
                </>
              )}
            </button>

            {/* If currently playing and not auto-playing all, offer quick stop button */}
            {playingWordId && !isAutoPlayingAll && (
              <button
                onClick={stopPlayback}
                title="Dừng phát âm"
                className="p-1.5 md:p-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
              >
                <VolumeX className="w-4 h-4 text-slate-700" />
              </button>
            )}
          </div>
        </div>

        {/* Audio Mode Selector: English + Vietnamese vs English Only */}
        <div className="flex items-center justify-between gap-2 flex-wrap bg-white/80 p-2 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 pl-1">
            <Languages className="w-4 h-4 text-indigo-600" />
            <span>Chế độ đọc:</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Option 1: Đọc tiếng Anh rồi đọc tiếng Việt */}
            <button
              onClick={() => handleModeChange('en-vi')}
              title="Đọc tiếng Anh xong đọc nghĩa tiếng Việt"
              className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
                audioMode === 'en-vi'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">🇬🇧 ➔ 🇻🇳</span>
              <span>Anh rồi Việt</span>
            </button>

            {/* Option 2: Chỉ đọc tiếng Anh */}
            <button
              onClick={() => handleModeChange('en')}
              title="Chỉ đọc phát âm tiếng Anh"
              className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-extrabold flex items-center gap-1.5 transition-all ${
                audioMode === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="text-sm">🇬🇧</span>
              <span>Chỉ tiếng Anh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Flashcard Grid */}
      <div className="flex-1 overflow-y-auto py-4 px-1">
        {words.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500">
            <Volume2 className="w-12 h-12 text-slate-300 mb-2" />
            <p className="font-semibold text-base">Bộ từ này chưa có từ vựng nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto w-full pb-16">
            {words.map((word, index) => {
              const isCurrent = playingWordId === word.id;
              const isPlayingEn = isCurrent && playingLang === 'en';
              const isPlayingVi = isCurrent && playingLang === 'vi';

              return (
                <motion.div
                  key={word.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.3) }}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleCardClick(word)}
                  className={`relative bg-white rounded-2xl p-4 md:p-5 flex flex-col items-center justify-between cursor-pointer transition-all border shadow-sm ${
                    isCurrent
                      ? 'ring-3 ring-indigo-500 border-indigo-400 shadow-lg scale-[1.02] bg-indigo-50/30'
                      : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                  }`}
                >
                  {/* Status badge when playing */}
                  <AnimatePresence>
                    {isCurrent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: -6 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[11px] font-black flex items-center gap-1 shadow-sm z-10 ${
                          isPlayingEn
                            ? 'bg-indigo-600 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        <span className="flex items-center gap-0.5">
                          <span className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-3 bg-white rounded-full animate-bounce"></span>
                        </span>
                        <span>{isPlayingEn ? '🇬🇧 Đang đọc EN' : '🇻🇳 Đang đọc VI'}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Card Image Area */}
                  <div className="w-full flex items-center justify-center my-1">
                    {word.imageUrl ? (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden flex items-center justify-center bg-slate-50 border border-slate-100 p-2 group">
                        <SmartImage
                          src={word.imageUrl}
                          alt={word.term}
                          referrerPolicy="no-referrer"
                          className={`max-w-full max-h-full object-contain drop-shadow-sm transition-transform duration-300 ${
                            isCurrent ? 'scale-105' : 'group-hover:scale-105'
                          }`}
                        />
                      </div>
                    ) : (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl bg-indigo-50/70 border border-indigo-100/50 flex items-center justify-center">
                        <Volume2
                          className={`w-12 h-12 transition-all ${
                            isCurrent ? 'text-indigo-600 scale-110 animate-pulse' : 'text-indigo-400'
                          }`}
                        />
                      </div>
                    )}
                  </div>

                  {/* Text Content */}
                  <div className="w-full text-center mt-2 flex flex-col items-center">
                    {/* English Term */}
                    <span
                      className={`text-xl sm:text-2xl font-black break-words transition-colors leading-tight ${
                        isPlayingEn
                          ? 'text-indigo-600 drop-shadow-xs'
                          : 'text-slate-800'
                      }`}
                    >
                      {word.term}
                    </span>

                    {/* Vietnamese Definition */}
                    {showDefinition && word.definition && (
                      <span
                        className={`text-xs sm:text-sm font-semibold break-words mt-1 transition-colors ${
                          isPlayingVi
                            ? 'text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md'
                            : 'text-slate-500'
                        }`}
                      >
                        {word.definition}
                      </span>
                    )}

                    {!showDefinition && word.definition && (
                      <span className="text-[11px] text-slate-300 italic mt-1 font-medium">
                        (chạm để nghe)
                      </span>
                    )}
                  </div>

                  {/* Card Footer: Audio indicator / individual language buttons */}
                  <div className="w-full mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-[11px] text-slate-400 font-medium">
                      #{index + 1}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Discrete English listen button */}
                      <button
                        onClick={(e) => handlePlaySingle(e, word, 'en')}
                        title="Nghe chỉ tiếng Anh"
                        className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors flex items-center gap-0.5 ${
                          isPlayingEn
                            ? 'bg-indigo-100 text-indigo-700 border-indigo-300 font-extrabold'
                            : 'bg-slate-50 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 border-slate-200'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>EN</span>
                      </button>

                      {/* Discrete Vietnamese listen button */}
                      {word.definition && (
                        <button
                          onClick={(e) => handlePlaySingle(e, word, 'vi')}
                          title="Nghe chỉ nghĩa tiếng Việt"
                          className={`px-1.5 py-0.5 rounded-md text-[11px] font-bold border transition-colors flex items-center gap-0.5 ${
                            isPlayingVi
                              ? 'bg-emerald-100 text-emerald-700 border-emerald-300 font-extrabold'
                              : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 border-slate-200'
                          }`}
                        >
                          <Volume2 className="w-3 h-3" />
                          <span>VI</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
