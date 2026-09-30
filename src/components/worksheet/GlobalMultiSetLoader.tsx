import React, { useState, useMemo } from 'react';
import {
  Search,
  CheckSquare,
  Square,
  Layers,
  RefreshCw,
  FolderOpen,
  Sparkles
} from 'lucide-react';
import { WordSet } from '../../types';

export interface GlobalMultiSetLoaderProps {
  librarySets: WordSet[];
  onLoadDecks: (selectedSets: WordSet[], primaryDeckId?: string) => Promise<void> | void;
  isLoading?: boolean;
}

export default function GlobalMultiSetLoader({
  librarySets,
  onLoadDecks,
  isLoading = false
}: GlobalMultiSetLoaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSetIds, setSelectedSetIds] = useState<Set<string>>(new Set());
  const [primaryDeckId, setPrimaryDeckId] = useState<string | null>(null);

  // Filter sets by search term
  const filteredSets = useMemo(() => {
    if (!searchQuery.trim()) return librarySets;
    const q = searchQuery.toLowerCase().trim();
    return librarySets.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [librarySets, searchQuery]);

  const toggleDeck = (id: string) => {
    setSelectedSetIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedSetIds(new Set(filteredSets.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedSetIds(new Set());
    setPrimaryDeckId(null);
  };

  const selectedSets = useMemo(() => {
    return librarySets.filter((s) => selectedSetIds.has(s.id));
  }, [librarySets, selectedSetIds]);

  // Determine effective primary deck ID (defaults to first selected deck if not chosen or unchecked)
  const effectivePrimaryId = useMemo(() => {
    if (primaryDeckId && selectedSetIds.has(primaryDeckId)) {
      return primaryDeckId;
    }
    return selectedSets.length > 0 ? selectedSets[0].id : null;
  }, [primaryDeckId, selectedSetIds, selectedSets]);

  const primarySet = useMemo(() => {
    if (!effectivePrimaryId) return null;
    return selectedSets.find((s) => s.id === effectivePrimaryId) || selectedSets[0] || null;
  }, [selectedSets, effectivePrimaryId]);

  const reviewSets = useMemo(() => {
    if (!primarySet) return [];
    return selectedSets.filter((s) => s.id !== primarySet.id);
  }, [selectedSets, primarySet]);

  const primaryWordsCount = primarySet?.words?.length || 0;
  const reviewWordsCount = reviewSets.reduce((acc, s) => acc + (s.words?.length || 0), 0);
  const totalRawWords = primaryWordsCount + reviewWordsCount;

  const handleLoad = async () => {
    if (selectedSets.length === 0 || isLoading) return;
    await onLoadDecks(selectedSets, effectivePrimaryId || undefined);
  };

  if (librarySets.length === 0) {
    return (
      <div className="p-6 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
        <FolderOpen className="w-8 h-8 text-slate-300 mx-auto" />
        <div className="text-sm font-semibold text-slate-700">
          Chưa có bộ Flashcard nào trong Thư viện
        </div>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Vui lòng tạo bộ thẻ trong Thư viện hoặc nạp từ link YourHomework để sử dụng tính năng nạp nhiều bộ.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80">
      {/* Search and filter toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm bộ thẻ flashcard trong thư viện..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
          />
        </div>

        <div className="flex items-center gap-2 justify-end text-xs">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            Chọn tất cả ({filteredSets.length})
          </button>
          <span className="text-slate-300">|</span>
          <button
            type="button"
            onClick={handleDeselectAll}
            className="text-slate-500 hover:text-slate-700 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Bỏ chọn
          </button>
        </div>
      </div>

      {/* Decks selection list */}
      <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        {filteredSets.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-400 bg-white rounded-xl border border-slate-100">
            Không tìm thấy bộ thẻ nào khớp với từ khóa "{searchQuery}".
          </div>
        ) : (
          filteredSets.map((deck) => {
            const isChecked = selectedSetIds.has(deck.id);
            const isPrimary = isChecked && deck.id === effectivePrimaryId;
            const wordCount = deck.words?.length || 0;
            return (
              <div
                key={deck.id}
                className={`p-3 flex items-center justify-between gap-3 rounded-xl border transition-all ${
                  isChecked
                    ? 'border-indigo-500 bg-indigo-50/50 shadow-2xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                {/* Clickable deck info row */}
                <label className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleDeck(deck.id)}
                    data-testid={`multi-deck-checkbox-${deck.id}`}
                    className="hidden"
                  />
                  {isChecked ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-300 shrink-0" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {deck.title}
                      </span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0">
                        {wordCount} từ
                      </span>
                    </div>
                    {deck.description && (
                      <p className="text-[11px] text-slate-500 truncate mt-0.5">
                        {deck.description}
                      </p>
                    )}
                  </div>
                </label>

                {/* Deck Role Indicator & Action */}
                {isChecked && (
                  <div className="flex items-center gap-2 shrink-0">
                    {isPrimary ? (
                      <span
                        data-testid={`primary-deck-badge-${deck.id}`}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300 px-2.5 py-1 rounded-lg shadow-2xs"
                      >
                        ⭐ Bộ Chính (Unit đang học)
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span
                          data-testid={`review-deck-badge-${deck.id}`}
                          className="flex items-center gap-1 text-[10px] font-semibold text-sky-800 bg-sky-100/90 border border-sky-200 px-2 py-0.5 rounded-md"
                        >
                          🔄 Bộ Ôn Tập
                        </span>
                        <button
                          type="button"
                          data-testid={`set-primary-btn-${deck.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrimaryDeckId(deck.id);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          Đặt làm Bộ Chính
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Footer Summary & Load Action */}
      <div className="pt-2 border-t border-slate-200/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
          <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
          {selectedSets.length === 0 ? (
            <span>Đã chọn: <strong className="text-slate-900 font-bold">0</strong> bộ thẻ</span>
          ) : (
            <span>
              <strong className="text-amber-800 font-bold">⭐ Bộ Chính:</strong> {primarySet?.title} ({primaryWordsCount} từ)
              <span className="mx-1.5 text-slate-300">•</span>
              <strong className="text-sky-800 font-bold">🔄 Ôn tập:</strong> {reviewSets.length} bộ ({reviewWordsCount} từ)
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleLoad}
          disabled={selectedSets.length === 0 || isLoading}
          data-testid="load-multi-decks-btn"
          className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          <span>
            {isLoading
              ? 'Đang nạp...'
              : `Nạp các bộ đã chọn (${totalRawWords} từ)`}
          </span>
        </button>
      </div>
    </div>
  );
}
