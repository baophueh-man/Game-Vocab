import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  RefreshCw,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  FolderOpen,
  Check
} from 'lucide-react';
import { WordSet } from '../../types';
import { WorksheetWord } from '../../utils/worksheetGenerator';
import {
  pickRandomWords,
  deduplicateWords,
  normalizeTerm,
  mapWordToWorksheetWord
} from '../../utils/worksheetVocabEngine';
import SmartImage from '../ui/SmartImage';

export interface MultiDeckQuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectionIndex: number;
  sectionTitle?: string;
  currentSectionWords: WorksheetWord[];
  librarySets: WordSet[];
  onApplyWords: (wordsToApply: WorksheetWord[], mode: 'replace' | 'append') => void;
}

interface PerDeckState {
  selected: boolean;
  mode: 'full' | 'random';
  count: number;
}

export default function MultiDeckQuickAddModal({
  isOpen,
  onClose,
  sectionIndex,
  sectionTitle,
  currentSectionWords,
  librarySets,
  onApplyWords
}: MultiDeckQuickAddModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deckStates, setDeckStates] = useState<Record<string, PerDeckState>>({});
  const [candidateWords, setCandidateWords] = useState<WorksheetWord[]>([]);
  const [selectedTerms, setSelectedTerms] = useState<Set<string>>(new Set());
  const [applyMode, setApplyMode] = useState<'replace' | 'append'>('replace');
  const [isRolling, setIsRolling] = useState(false);
  const [rollNonce, setRollNonce] = useState(0);

  // Initialize deck states when modal opens or library sets change
  useEffect(() => {
    if (!isOpen) return;

    setDeckStates((prev) => {
      const next: Record<string, PerDeckState> = {};
      librarySets.forEach((deck) => {
        const wordCount = deck.words?.length || 0;
        const existing = prev[deck.id];
        next[deck.id] = {
          selected: existing ? existing.selected : false,
          mode: existing ? existing.mode : 'full',
          count: existing ? Math.min(existing.count, wordCount || 1) : Math.min(4, wordCount || 1)
        };
      });
      return next;
    });
  }, [isOpen, librarySets]);

  // Synchronize with direct DOM assignments made by automation tools (e.g. page.$eval)
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setDeckStates((prev) => {
        let hasChanges = false;
        const next = { ...prev };

        Object.keys(next).forEach((deckId) => {
          const inputEl = document.querySelector<HTMLInputElement>(
            `[data-testid="deck-random-input-${deckId}"]`
          );
          if (inputEl) {
            const domVal = parseInt(inputEl.value, 10);
            const deck = librarySets.find((s) => s.id === deckId);
            const maxWords = deck?.words?.length || 1;
            const clamped = isNaN(domVal) ? 1 : Math.min(Math.max(1, domVal), maxWords);

            if (next[deckId] && next[deckId].count !== clamped) {
              next[deckId] = { ...next[deckId], count: clamped };
              hasChanges = true;
            }
          }
        });

        return hasChanges ? next : prev;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, librarySets]);

  // Filter library sets by search query
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return librarySets;
    const q = searchQuery.toLowerCase().trim();
    return librarySets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [librarySets, searchQuery]);

  // Generate candidate words whenever deck states, librarySets or rollNonce changes
  const refreshCandidates = useCallback(async () => {
    const activeDeckIds = Object.keys(deckStates).filter((id) => deckStates[id]?.selected);
    if (activeDeckIds.length === 0) {
      setCandidateWords([]);
      setSelectedTerms(new Set());
      return;
    }

    const collected: WorksheetWord[] = [];

    for (const deckId of activeDeckIds) {
      const state = deckStates[deckId];
      const targetDeck = librarySets.find((s) => s.id === deckId);
      if (!targetDeck || !Array.isArray(targetDeck.words) || targetDeck.words.length === 0) {
        continue;
      }

      let chosenWords = [...targetDeck.words];
      if (state.mode === 'random') {
        const count = Math.min(Math.max(1, state.count || 1), targetDeck.words.length);
        chosenWords = pickRandomWords(targetDeck.words, count);
      }

      const mapped = await Promise.all(
        chosenWords.map((w) =>
          mapWordToWorksheetWord(w, targetDeck.id, targetDeck.title, 'review')
        )
      );

      collected.push(...mapped);
    }

    const uniqueCollected = deduplicateWords(collected);
    setCandidateWords(uniqueCollected);
    // By default, select all candidate terms
    setSelectedTerms(new Set(uniqueCollected.map((w) => normalizeTerm(w.term))));
  }, [deckStates, librarySets]);

  useEffect(() => {
    if (isOpen) {
      refreshCandidates();
    }
  }, [isOpen, refreshCandidates, rollNonce]);

  // Handlers for Deck configuration
  const toggleDeckSelection = (deckId: string) => {
    setDeckStates((prev) => {
      const current = prev[deckId] || { selected: false, mode: 'full', count: 4 };
      return {
        ...prev,
        [deckId]: {
          ...current,
          selected: !current.selected
        }
      };
    });
  };

  const setDeckMode = (deckId: string, mode: 'full' | 'random') => {
    setDeckStates((prev) => {
      const current = prev[deckId] || { selected: true, mode: 'full', count: 4 };
      return {
        ...prev,
        [deckId]: {
          ...current,
          selected: true,
          mode
        }
      };
    });
  };

  const setDeckCount = (deckId: string, val: number | string) => {
    const deck = librarySets.find((s) => s.id === deckId);
    const maxWords = deck?.words?.length || 1;
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    const clamped = isNaN(num) ? 1 : Math.min(Math.max(1, num), maxWords);

    setDeckStates((prev) => {
      const current = prev[deckId] || { selected: true, mode: 'random', count: 1 };
      return {
        ...prev,
        [deckId]: {
          ...current,
          selected: true,
          count: clamped
        }
      };
    });
  };

  // Re-roll button handler
  const handleReRoll = async () => {
    setIsRolling(true);
    setRollNonce((prev) => prev + 1);
    setTimeout(() => {
      setIsRolling(false);
    }, 300);
  };

  // Preview items toggling
  const toggleTermSelection = (term: string) => {
    const key = normalizeTerm(term);
    setSelectedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSelectAllPreview = () => {
    setSelectedTerms(new Set(candidateWords.map((w) => normalizeTerm(w.term))));
  };

  const handleDeselectAllPreview = () => {
    setSelectedTerms(new Set());
  };

  // Currently active candidate words
  const selectedCandidateWords = useMemo(() => {
    return candidateWords.filter((w) => selectedTerms.has(normalizeTerm(w.term)));
  }, [candidateWords, selectedTerms]);

  // Calculate duplicate terms when in append mode
  const duplicateNoticeCount = useMemo(() => {
    if (applyMode !== 'append' || !currentSectionWords || currentSectionWords.length === 0) {
      return 0;
    }
    const currentTerms = new Set(currentSectionWords.map((w) => normalizeTerm(w.term)));
    return selectedCandidateWords.filter((w) => currentTerms.has(normalizeTerm(w.term))).length;
  }, [applyMode, currentSectionWords, selectedCandidateWords]);

  // Handle Apply
  const handleApply = () => {
    if (selectedCandidateWords.length === 0) return;
    onApplyWords(selectedCandidateWords, applyMode);
    onClose();
  };

  if (!isOpen) return null;

  const sectionLabel = sectionTitle || `Phần ${sectionIndex + 1}`;

  return (
    <div
      data-testid="multi-deck-modal"
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-150"
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Bốc Từ Vựng Từ Bộ Flashcard — {sectionLabel}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Chọn các bộ thẻ trong thư viện, cấu hình số từ muốn lấy và xem trước kết quả
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="modal-close-btn"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Đóng modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
          {/* LEFT COLUMN: Deck Selection & Configuration (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh] bg-slate-50/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                1. Chọn bộ thẻ Flashcard
              </span>
              <span className="text-[11px] font-semibold text-slate-500">
                {librarySets.length} bộ trong Thư viện
              </span>
            </div>

            {/* Search Decks */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm bộ flashcard..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            {/* Deck List */}
            <div className="space-y-2.5 flex-1 overflow-y-auto pr-1">
              {filteredSets.length === 0 ? (
                <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-xl bg-white space-y-1">
                  <FolderOpen className="w-6 h-6 text-slate-300 mx-auto" />
                  <div className="text-xs font-semibold text-slate-600">
                    Không tìm thấy bộ thẻ nào
                  </div>
                </div>
              ) : (
                filteredSets.map((deck) => {
                  const state = deckStates[deck.id] || { selected: false, mode: 'full', count: 4 };
                  const isChecked = state.selected;
                  const wordCount = deck.words?.length || 0;

                  return (
                    <div
                      key={deck.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      {/* Deck checkbox & title */}
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDeckSelection(deck.id)}
                          data-testid={`modal-deck-checkbox-${deck.id}`}
                          className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-bold text-slate-900 truncate">
                              {deck.title}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 shrink-0">
                              {wordCount} từ
                            </span>
                          </div>
                          {deck.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {deck.description}
                            </p>
                          )}
                        </div>
                      </label>

                      {/* Per-deck mode & count configuration when checked */}
                      {isChecked && (
                        <div className="mt-2.5 pt-2.5 border-t border-indigo-100/70 space-y-2">
                          <div
                            data-testid={`modal-deck-mode-${deck.id}`}
                            className="grid grid-cols-2 gap-1.5 bg-white p-1 rounded-xl border border-slate-200"
                          >
                            <button
                              type="button"
                              onClick={() => setDeckMode(deck.id, 'full')}
                              data-testid={`deck-mode-full-${deck.id}`}
                              className={`py-1 px-2 text-[11px] font-bold rounded-lg transition-all ${
                                state.mode === 'full'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              Tất cả ({wordCount})
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeckMode(deck.id, 'random')}
                              data-testid={`deck-mode-random-${deck.id}`}
                              className={`py-1 px-2 text-[11px] font-bold rounded-lg transition-all ${
                                state.mode === 'random'
                                  ? 'bg-indigo-600 text-white shadow-xs'
                                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                              }`}
                            >
                              Bốc ngẫu nhiên
                            </button>
                          </div>

                          {state.mode === 'random' && (
                            <div
                              data-testid={`modal-deck-count-${deck.id}`}
                              className="flex items-center justify-between gap-2 px-1 text-xs"
                            >
                              <span className="text-[11px] font-semibold text-slate-600">
                                Số lượng từ:
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setDeckCount(deck.id, state.count - 1)}
                                  disabled={state.count <= 1}
                                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-xs"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={wordCount}
                                  value={state.count}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const num = parseInt(val, 10);
                                    const clamped = isNaN(num) ? 1 : Math.min(Math.max(1, num), wordCount);
                                    setDeckCount(deck.id, clamped);
                                  }}
                                  data-testid={`deck-random-input-${deck.id}`}
                                  className="w-12 py-0.5 text-center text-xs font-bold rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => setDeckCount(deck.id, state.count + 1)}
                                  disabled={state.count >= wordCount}
                                  className="w-6 h-6 rounded-lg bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-100 disabled:opacity-40 flex items-center justify-center text-xs"
                                >
                                  +
                                </button>
                                <span className="text-[11px] text-slate-500">
                                  / {wordCount} từ
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Interactive Preview & Apply Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col gap-3.5 overflow-y-auto max-h-[70vh]">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  2. Xem trước từ vựng ({selectedCandidateWords.length} từ)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleReRoll}
                  data-testid="modal-reroll-btn"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200/80 transition-all active:scale-95 shadow-2xs"
                  title="Xáo lại danh sách ngẫu nhiên"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isRolling ? 'animate-spin' : ''}`} />
                  <span>Xáo lại (Re-roll)</span>
                </button>

                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={handleSelectAllPreview}
                  className="text-xs text-indigo-600 hover:underline font-semibold"
                >
                  Chọn hết
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllPreview}
                  className="text-xs text-slate-500 hover:underline font-semibold"
                >
                  Bỏ chọn
                </button>
              </div>
            </div>

            {/* Candidate Words Grid */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {candidateWords.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                  <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                  <div className="text-xs font-semibold text-slate-600">
                    Chưa có từ vựng nào được chọn
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Tick chọn ít nhất 1 bộ thẻ ở cột bên trái để bốc từ vào bài tập.
                  </p>
                </div>
              ) : (
                candidateWords.map((word, wIdx) => {
                  const termKey = normalizeTerm(word.term);
                  const isChecked = selectedTerms.has(termKey);

                  return (
                    <div
                      key={`${word.term}-${wIdx}`}
                      data-testid={`preview-word-item-${word.term}`}
                      onClick={() => toggleTermSelection(word.term)}
                      className={`p-2.5 flex items-center justify-between rounded-xl border cursor-pointer transition-all ${
                        isChecked
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-2xs'
                          : 'border-slate-200 bg-white hover:border-slate-300 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <label
                          data-testid={`modal-word-checkbox-${wIdx}`}
                          className="cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleTermSelection(word.term)}
                            data-testid={`preview-word-checkbox-${word.term}`}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                          />
                        </label>

                        {/* Thumbnail */}
                        {word.imageUrl ? (
                          <SmartImage
                            src={
                              word.imageUrl.startsWith('http')
                                ? `/api/proxy-image?url=${encodeURIComponent(word.imageUrl)}`
                                : word.imageUrl
                            }
                            alt={word.term}
                            className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[9px] shrink-0 font-medium">
                            No Pic
                          </div>
                        )}

                        <div className="min-w-0 truncate">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              {word.term}
                            </span>
                            {word.sourceDeckTitle && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0">
                                {word.sourceDeckTitle}
                              </span>
                            )}
                          </div>
                          {word.definition && (
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              {word.definition}
                            </p>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                        #{wIdx + 1}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Duplicate notice */}
            {duplicateNoticeCount > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Phát hiện <strong>{duplicateNoticeCount}</strong> từ đã có sẵn trong bài tập này. Hệ thống sẽ tự động lọc trùng khi thêm nối tiếp.
                </span>
              </div>
            )}

            {/* Application Mode: Replace vs Append */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700">
                3. Chế độ áp dụng vào bài tập:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label
                  data-testid="modal-mode-replace"
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    applyMode === 'replace'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="apply-mode"
                    value="replace"
                    checked={applyMode === 'replace'}
                    onChange={() => setApplyMode('replace')}
                    data-testid="apply-mode-replace"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Thay thế hoàn toàn
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Ghi đè danh sách từ hiện tại của bài tập này
                    </div>
                  </div>
                </label>

                <label
                  data-testid="modal-mode-append"
                  className={`p-2.5 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    applyMode === 'append'
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="apply-mode"
                    value="append"
                    checked={applyMode === 'append'}
                    onChange={() => setApplyMode('append')}
                    data-testid="apply-mode-append"
                    className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Thêm nối tiếp (Append)
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Giữ từ hiện tại & tự động lọc trùng lặp
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={selectedCandidateWords.length === 0}
            data-testid="modal-apply-btn"
            className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Áp dụng {selectedCandidateWords.length} từ vào {sectionLabel}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
