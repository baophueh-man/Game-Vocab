import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  Copy,
  FileText
} from 'lucide-react';
import SmartImage from '../ui/SmartImage';
import {
  WORKSHEET_TYPES,
  BLANK_MODE_OPTIONS,
  BlankMode,
  WorksheetType,
  WorksheetWord
} from '../../utils/worksheetGenerator';

export interface UICompositeSection {
  id: string;
  type: WorksheetType;
  title: string;
  instruction?: string;
  selectedWordIndices: number[];
  blankMode?: BlankMode;
  pageBreakBefore?: boolean;
}

interface CompositeSectionCardProps {
  key?: React.Key;
  section: UICompositeSection;
  index: number;
  totalSections: number;
  words: WorksheetWord[];
  onUpdateSection: (index: number, updated: Partial<UICompositeSection>) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate?: (index: number) => void;
}

export default function CompositeSectionCard({
  section,
  index,
  totalSections,
  words,
  onUpdateSection,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate
}: CompositeSectionCardProps) {
  const [isVocabExpanded, setIsVocabExpanded] = useState<boolean>(true);
  const selectedSet = new Set(section.selectedWordIndices);

  const toggleWord = (wordIdx: number) => {
    const next = new Set(selectedSet);
    if (next.has(wordIdx)) {
      next.delete(wordIdx);
    } else {
      next.add(wordIdx);
    }
    onUpdateSection(index, {
      selectedWordIndices: Array.from(next).sort((a, b) => a - b)
    });
  };

  const handleSelectAll = () => {
    onUpdateSection(index, {
      selectedWordIndices: words.map((_, i) => i)
    });
  };

  const handleDeselectAll = () => {
    onUpdateSection(index, {
      selectedWordIndices: []
    });
  };

  return (
    <div
      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 transition-all"
      data-testid={`composite-section-card-${index}`}
    >
      {/* Top Header of Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
            {index + 1}
          </span>
          <span className="text-sm font-bold text-slate-900">
            Phần {index + 1}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
            Loại {section.type}
          </span>
        </div>

        {/* Section Actions: Reorder, Duplicate, Delete */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
            title="Di chuyển lên"
            aria-label="Di chuyển lên"
            data-testid={`move-up-section-${index}`}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveDown(index)}
            disabled={index === totalSections - 1}
            title="Di chuyển xuống"
            aria-label="Di chuyển xuống"
            data-testid={`move-down-section-${index}`}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          {onDuplicate && (
            <button
              type="button"
              onClick={() => onDuplicate(index)}
              title="Nhân bản phần bài tập này"
              aria-label="Nhân bản phần bài tập này"
              data-testid={`duplicate-section-${index}`}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors ml-0.5"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            type="button"
            onClick={() => onDelete(index)}
            title="Xóa phần bài tập"
            aria-label="Xóa phần bài tập"
            data-testid={`delete-section-${index}`}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section Title and Instruction Inputs */}
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Tiêu Đề Phần (Section Title)
          </label>
          <input
            type="text"
            value={section.title}
            onChange={(e) => onUpdateSection(index, { title: e.target.value })}
            placeholder="Ví dụ: Part 1: Missing letters"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Hướng Dẫn Làm Bài (Instruction - tùy chọn)
          </label>
          <input
            type="text"
            value={section.instruction || ''}
            onChange={(e) => onUpdateSection(index, { instruction: e.target.value })}
            placeholder="Ví dụ: Look at the pictures and fill in the missing letters"
            className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs text-slate-600"
          />
        </div>
      </div>

      {/* Exercise Type Selector: All supported types */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
          Loại Bài Tập (Exercise Type)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {WORKSHEET_TYPES.map((t) => {
            const isSelected = section.type === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  const defaultTitles: Record<WorksheetType, { title: string; instruction: string }> = {
                    2: { title: 'Write the words', instruction: 'Look at the pictures and write the correct words' },
                    3: { title: 'Match picture with word', instruction: 'Draw a line to match each picture with its word' },
                    4: { title: 'Missing letters', instruction: 'Look at the pictures and fill in the missing letters' },
                    6: { title: 'Multiple choice', instruction: 'Look at the pictures and choose the correct answer' },
                    7: { title: 'Unscramble letters', instruction: 'Unscramble the letters to write the correct words' },
                    8: { title: 'Look and trace', instruction: 'Look at the pictures and trace the words' },
                    9: { title: 'Look and color Yes or No', instruction: 'Read the sentence and color Yes or No' },
                    10: { title: 'Look and color', instruction: 'Look at the word and color the correct picture' }
                  };
                  const meta = defaultTitles[t.type];
                  onUpdateSection(index, {
                    type: t.type,
                    title: `Part ${index + 1}: ${meta.title}`,
                    instruction: meta.instruction,
                    blankMode: t.type === 4 ? (section.blankMode || 'vowels') : section.blankMode
                  });
                }}
                className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[11px] font-bold text-indigo-600 uppercase">
                    Loại {t.type}
                  </span>
                  {isSelected && <span className="w-2 h-2 rounded-full bg-indigo-600" />}
                </div>
                <div className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {t.name}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* If Type 4: Blank Mode Configurator */}
      {section.type === 4 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Đục Lỗ Chữ Cái (Blank Mode - Loại 4)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Loại 4
            </span>
          </div>
          <select
            value={section.blankMode || 'vowels'}
            onChange={(e) =>
              onUpdateSection(index, { blankMode: e.target.value as BlankMode })
            }
            className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
          >
            {BLANK_MODE_OPTIONS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Page Break Before Option */}
      <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-600 hover:text-slate-900">
        <input
          type="checkbox"
          checked={!!section.pageBreakBefore}
          onChange={(e) =>
            onUpdateSection(index, { pageBreakBefore: e.target.checked })
          }
          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
        />
        <span className="font-medium">
          Bắt buộc ngắt sang trang mới trước phần này
        </span>
      </label>

      {/* Independent Vocabulary Selection */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">
              Từ vựng áp dụng:
            </span>
            <span
              className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100"
              data-testid={`section-word-count-badge-${index}`}
            >
              {section.selectedWordIndices.length}/{words.length} từ
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 hover:underline font-semibold"
            >
              Chọn tất cả
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-slate-500 hover:underline font-semibold"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setIsVocabExpanded(!isVocabExpanded)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium ml-1"
            >
              {isVocabExpanded ? 'Thu gọn' : 'Mở rộng'}
            </button>
          </div>
        </div>

        {/* Word Checklist */}
        {isVocabExpanded && (
          <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-100 rounded-xl bg-slate-50/50">
            {words.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Chưa có từ vựng nào trong danh sách. Vui lòng tải dữ liệu từ Bước 1.
              </div>
            ) : (
              words.map((w, wIdx) => {
                const isChecked = selectedSet.has(wIdx);
                return (
                  <div
                    key={wIdx}
                    onClick={() => toggleWord(wIdx)}
                    className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                      isChecked ? 'bg-indigo-50/50' : 'hover:bg-slate-100/60 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {isChecked ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                      {w.imageUrl ? (
                        <SmartImage
                          src={
                            w.imageUrl.startsWith('http')
                              ? `/api/proxy-image?url=${encodeURIComponent(w.imageUrl)}`
                              : w.imageUrl
                          }
                          alt={w.term}
                          className="w-8 h-8 object-cover rounded-lg border border-slate-200 shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] shrink-0">
                          No Pic
                        </div>
                      )}
                      <div className="truncate">
                        <span className="text-xs font-bold text-slate-900 mr-1.5">
                          {w.term}
                        </span>
                        {w.definition && (
                          <span className="text-[11px] text-slate-500 truncate">
                            - {w.definition}
                          </span>
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
        )}
      </div>
    </div>
  );
}
