import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  Copy,
  FileText,
  Type as TypeIcon
} from 'lucide-react';
import SmartImage from '../ui/SmartImage';
import {
  WORKSHEET_TYPES,
  BLANK_MODE_OPTIONS,
  TYPE4_LAYOUT_OPTIONS,
  TYPE4_COLUMN_OPTIONS,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  SPACING_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  BlankMode,
  Type4LayoutMode,
  Type4ColumnMode,
  WorksheetType,
  WorksheetWord,
  WordsearchDirection,
  WordsearchHintType,
  WordsearchGridBorder,
  WordsearchCase,
  MatchHintMode,
  ChoiceLayout,
  Type15NumberStyle,
  Type15Border,
  Type15ChoiceMode,
  Type16SoundMode,
  Type16ChoiceCount,
  Type16Layout,
  Type16LetterCase,
  Type16Border,
  Type17TaskMode,
  Type17Border,
  Type17CardBorder,
  Type17LetterCase,
  Type17StripLength,
  Type17HighlightTarget,
  Type18Mode,
  Type18Border,
  Type18CircleStyle,
  Type18DistractorCasing,
  Type18HighlightTarget,
  TYPE18_COLOR_MAP
} from '../../utils/worksheetGenerator';
import { pickQuotaAwareRandomWordIndices } from '../../utils/worksheetVocabEngine';

export interface UICompositeSection {
  id: string;
  type: WorksheetType;
  title: string;
  instruction?: string;
  selectedWordIndices: number[];
  targetWordCount?: number;
  primaryWordCount?: number;
  reviewWordCount?: number;
  blankMode?: BlankMode;
  type4LayoutMode?: Type4LayoutMode;
  type4ColumnMode?: Type4ColumnMode;
  type4TraceFontSize?: number;
  type4AlphabetTargetLetter?: string;
  pageBreakBefore?: boolean;
  fontSize?: number;
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  spacing?: number;
  imageSize?: number;
  choiceCount?: 2 | 3;
  choiceLayout?: ChoiceLayout;
  matchMode?: 'word' | 'sentence' | 'look_match_write';
  matchHint?: MatchHintMode;
  lookMatchWriteShuffleSuffix?: boolean;
  lookMatchWriteMode?: 'trace' | 'blank';
  lookMatchWriteShowBaseline?: boolean;
  lookMatchWriteTraceFontSize?: number;
  wordsearchDirections?: WordsearchDirection[];
  wordsearchHintType?: WordsearchHintType;
  wordsearchGridSize?: number | 'auto';
  wordsearchGridBorder?: WordsearchGridBorder;
  wordsearchCase?: WordsearchCase;
  targetLetter?: string;
  showWordLabels?: boolean;
  sentenceScramble?: boolean;
  sentenceSeparator?: 'space' | 'slash';
  sentenceHintStyle?: 'underscores' | 'dots' | 'trace';
  sentenceTraceFontSize?: number;
  type15NumberStyle?: Type15NumberStyle;
  type15Border?: Type15Border;
  type15ChoiceMode?: Type15ChoiceMode;
  type15LetterBandBg?: 'tint' | 'white';
  type16SoundMode?: Type16SoundMode;
  type16ChoiceCount?: Type16ChoiceCount;
  type16Layout?: Type16Layout;
  type16LetterCase?: Type16LetterCase;
  type16Border?: Type16Border;
  type17TaskMode?: Type17TaskMode;
  type17Border?: Type17Border;
  type17CardBorder?: Type17CardBorder;
  type17LetterCase?: Type17LetterCase;
  type17StripLength?: Type17StripLength;
  type17HighlightTarget?: Type17HighlightTarget;
  type17ShowExample?: boolean;
  type18TargetLetter?: string;
  type18Mode?: Type18Mode;
  type18ColorUpper?: string;
  type18ColorLower?: string;
  type18GridRows?: number;
  type18GridCols?: number;
  type18Border?: Type18Border;
  type18CircleStyle?: Type18CircleStyle;
  type18DistractorCasing?: Type18DistractorCasing;
  type18HighlightTarget?: Type18HighlightTarget;
  answerMode?: 'student' | 'answer';
}

interface CompositeSectionCardProps {
  key?: React.Key;
  section: UICompositeSection;
  index: number;
  totalSections: number;
  words: WorksheetWord[];
  otherSectionsWordIndices?: Set<number>;
  onUpdateSection: (index: number, updated: Partial<UICompositeSection>) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onDelete: (index: number) => void;
  onDuplicate?: (index: number) => void;
  onOpenQuickAddModal?: (index: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (index: number) => void;
  isHighlighted?: boolean;
}

export default function CompositeSectionCard({
  section,
  index,
  totalSections,
  words,
  otherSectionsWordIndices,
  onUpdateSection,
  onMoveUp,
  onMoveDown,
  onDelete,
  onDuplicate,
  onOpenQuickAddModal,
  isCollapsed,
  onToggleCollapse,
  isHighlighted
}: CompositeSectionCardProps) {
  const [isVocabExpanded, setIsVocabExpanded] = useState<boolean>(true);
  const selectedSet = new Set(section.selectedWordIndices);

  const currentTargetCount =
    section.targetWordCount !== undefined
      ? section.targetWordCount
      : (section.selectedWordIndices.length > 0 ? section.selectedWordIndices.length : (words.length > 0 ? Math.min(4, words.length) : 4));

  const hasReviewWords = Boolean(words && words.some((w) => w.deckRole === 'review'));

  const effectivePrimaryCount =
    section.primaryWordCount ??
    (hasReviewWords
      ? Math.min(currentTargetCount, words.filter((w) => w.deckRole === 'primary').length || currentTargetCount)
      : currentTargetCount);

  const effectiveReviewCount =
    section.reviewWordCount ??
    (hasReviewWords ? Math.max(0, currentTargetCount - effectivePrimaryCount) : 0);

  const maxStepperLimit = Math.max(50, words ? words.length : 50);

  const handleAdjustPrimaryCount = (delta: number) => {
    const newPrimary = Math.min(maxStepperLimit, Math.max(1, effectivePrimaryCount + delta));
    const newTotal = newPrimary + effectiveReviewCount;
    const picked = pickQuotaAwareRandomWordIndices(words, newPrimary, effectiveReviewCount);
    onUpdateSection(index, {
      primaryWordCount: newPrimary,
      reviewWordCount: effectiveReviewCount,
      targetWordCount: newTotal,
      selectedWordIndices: picked
    });
  };

  const handleAdjustReviewCount = (delta: number) => {
    const newReview = Math.min(maxStepperLimit, Math.max(0, effectiveReviewCount + delta));
    const newTotal = effectivePrimaryCount + newReview;
    const picked = pickQuotaAwareRandomWordIndices(words, effectivePrimaryCount, newReview);
    onUpdateSection(index, {
      primaryWordCount: effectivePrimaryCount,
      reviewWordCount: newReview,
      targetWordCount: newTotal,
      selectedWordIndices: picked
    });
  };

  const handleAdjustWordCount = (delta: number) => {
    const newTarget = Math.max(1, currentTargetCount + delta);
    let newIndices = [...section.selectedWordIndices];
    if (newIndices.length > newTarget) {
      newIndices = newIndices.slice(0, newTarget);
    } else if (newIndices.length < newTarget && words.length > 0) {
      const needed = newTarget - newIndices.length;
      const unusedIndices = words
        .map((_, i) => i)
        .filter((i) => !newIndices.includes(i));
      const unshared = unusedIndices.filter((i) => !otherSectionsWordIndices?.has(i));
      const candidates = unshared.length > 0
        ? unshared
        : (unusedIndices.length > 0 ? unusedIndices : words.map((_, i) => i));

      for (let k = 0; k < needed; k++) {
        newIndices.push(candidates[k % candidates.length]);
      }
    }
    onUpdateSection(index, {
      targetWordCount: newTarget,
      primaryWordCount: newTarget,
      reviewWordCount: 0,
      selectedWordIndices: newIndices
    });
  };

  const handleRandomizeWords = () => {
    if (!words || words.length === 0) return;
    const picked = pickQuotaAwareRandomWordIndices(words, effectivePrimaryCount, effectiveReviewCount);
    onUpdateSection(index, {
      targetWordCount: effectivePrimaryCount + effectiveReviewCount,
      primaryWordCount: effectivePrimaryCount,
      reviewWordCount: effectiveReviewCount,
      selectedWordIndices: picked
    });
  };

  const toggleWord = (wordIdx: number) => {
    const next = new Set(selectedSet);
    if (next.has(wordIdx)) {
      next.delete(wordIdx);
    } else {
      next.add(wordIdx);
    }
    const newIndices = Array.from(next).sort((a, b) => a - b);
    onUpdateSection(index, {
      selectedWordIndices: newIndices,
      targetWordCount: newIndices.length
    });
  };

  const handleSelectAll = () => {
    onUpdateSection(index, {
      selectedWordIndices: words.map((_, i) => i),
      targetWordCount: words.length
    });
  };

  const handleDeselectAll = () => {
    onUpdateSection(index, {
      selectedWordIndices: [],
      targetWordCount: 0
    });
  };

  // --- COLLAPSED VIEW (Thin bar: ~44px, no scrolling needed) ---
  if (isCollapsed) {
    return (
      <div
        id={`composite-section-card-${index}`}
        data-testid={`composite-section-card-${index}`}
        onClick={() => onToggleCollapse && onToggleCollapse(index)}
        className={`bg-white px-4 py-3 rounded-2xl border transition-all cursor-pointer hover:border-indigo-300 hover:shadow-xs flex items-center justify-between gap-3 ${
          isHighlighted
            ? 'ring-4 ring-indigo-400 border-indigo-500 shadow-md bg-indigo-50/20'
            : 'border-slate-200'
        }`}
      >
        {/* Left summary */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold shrink-0">
            {index + 1}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold shrink-0">
            Loại {section.type}
          </span>
          <span className="text-xs font-bold text-slate-800 truncate max-w-[200px] sm:max-w-xs">
            {section.title || `Phần ${index + 1}`}
          </span>
          <span
            data-testid={`section-word-count-badge-${index}`}
            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold shrink-0 border border-slate-200/60"
          >
            {section.selectedWordIndices.length} từ
          </span>
          <span className="text-[11px] text-slate-400 hidden md:inline truncate">
            • {section.fontFamily || 'Linotte'} • {section.fontSize || 12}pt
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
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
            disabled={totalSections <= 1}
            title={totalSections <= 1 ? "Phải giữ lại ít nhất 1 phần bài tập" : "Xóa phần bài tập"}
            aria-label="Xóa phần bài tập"
            data-testid={`delete-section-${index}`}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onToggleCollapse && onToggleCollapse(index)}
            title="Mở rộng chi tiết"
            data-testid={`toggle-expand-section-${index}`}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors ml-1.5"
          >
            <span>Mở rộng</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // --- EXPANDED VIEW ---
  return (
    <div
      id={`composite-section-card-${index}`}
      data-testid={`composite-section-card-${index}`}
      className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 transition-all duration-300 ${
        isHighlighted
          ? 'ring-4 ring-indigo-400 border-indigo-500 shadow-md scale-[1.005]'
          : 'border-slate-200'
      }`}
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
          <span
            data-testid={`section-word-count-badge-${index}`}
            className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold"
          >
            {section.selectedWordIndices.length} từ
          </span>
        </div>

        {/* Section Actions: Reorder, Duplicate, Delete, Collapse */}
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
            disabled={totalSections <= 1}
            title={totalSections <= 1 ? "Phải giữ lại ít nhất 1 phần bài tập" : "Xóa phần bài tập"}
            aria-label="Xóa phần bài tập"
            data-testid={`delete-section-${index}`}
            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors ml-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onToggleCollapse && (
            <button
              type="button"
              onClick={() => onToggleCollapse(index)}
              title="Thu gọn phần này"
              data-testid={`toggle-collapse-section-${index}`}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors ml-1"
            >
              <span>Thu gọn</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Section Title Input */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Tiêu Đề Phần (Section Title)
        </label>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdateSection(index, { title: e.target.value })}
          placeholder="Ví dụ: Missing letters"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
        />
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
                  const defaultTitles: Record<WorksheetType, { title: string }> = {
                    1: { title: 'Reorder the words to make correct sentences' },
                    2: { title: 'Write the words' },
                    3: { title: 'Match picture with word' },
                    4: { title: 'Missing letters' },
                    6: { title: 'Multiple choice' },
                    7: { title: 'Unscramble letters' },
                    8: { title: 'Look and trace' },
                    9: { title: 'Look and color Yes or No' },
                    10: { title: 'Look and color' },
                    11: { title: 'Write and circle the correct picture.' },
                    12: { title: 'Look and write' },
                    13: { title: 'Word Search Puzzle' },
                    14: { title: 'Circle the pictures that have letter V' },
                    15: { title: 'Read the sentence and circle the correct picture.' },
                    16: { title: 'Look and circle the beginning sound' },
                    17: { title: 'Look and color the words' },
                    18: { title: 'Color E green and e red' }
                  };
                  const meta = defaultTitles[t.type] || { title: (t as any).title || t.name || 'Worksheet Section' };
                  const isType8 = t.type === 8;
                  const isType11 = t.type === 11;
                  const isType18 = t.type === 18;
                  const targetLtr = (section.type18TargetLetter || 'E').toUpperCase();
                  const targetLtrLower = (section.type18TargetLetter || 'e').toLowerCase();
                  const title18 = `Color ${targetLtr} ${section.type18ColorUpper || 'green'} and ${targetLtrLower} ${section.type18ColorLower || 'red'}`;
                  onUpdateSection(index, {
                    type: t.type,
                    title: isType18 ? title18 : meta.title,
                    answerMode: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].includes(t.type) ? (section.answerMode || 'student') : undefined,
                    blankMode: t.type === 4 ? (section.blankMode || 'vowels') : section.blankMode,
                    fontFamily: (isType8 || isType11) ? 'KG Primary Dots' : (section.fontFamily === 'KG Primary Dots' ? 'r0c0i Linotte' : section.fontFamily || 'r0c0i Linotte'),
                    fontSize: (isType8 || isType11) ? 22 : (section.fontSize === 22 ? 12 : section.fontSize || 12),
                    spacing: section.spacing !== undefined ? section.spacing : 0,
                    imageSize: section.imageSize || 12.7,
                    choiceCount: t.type === 6 ? (section.choiceCount || 3) : 3,
                    matchMode: t.type === 3 ? (section.matchMode || 'word') : section.matchMode,
                    matchHint: t.type === 3 ? (section.matchHint || 'none') : section.matchHint,
                    wordsearchDirections: t.type === 13 ? (section.wordsearchDirections || ['horizontal', 'vertical', 'diagonalDown']) : section.wordsearchDirections,
                    wordsearchHintType: t.type === 13 ? (section.wordsearchHintType || 'word') : section.wordsearchHintType,
                    wordsearchGridSize: t.type === 13 ? (section.wordsearchGridSize || 'auto') : section.wordsearchGridSize,
                    wordsearchGridBorder: t.type === 13 ? (section.wordsearchGridBorder || 'none') : section.wordsearchGridBorder,
                    wordsearchCase: t.type === 13 ? (section.wordsearchCase || 'lower') : section.wordsearchCase,
                    targetLetter: t.type === 14 ? (section.targetLetter || 'V') : section.targetLetter,
                    type15NumberStyle: t.type === 15 ? (section.type15NumberStyle || 'none') : section.type15NumberStyle,
                    type15Border: t.type === 15 ? (section.type15Border || 'full') : section.type15Border,
                    type15ChoiceMode: t.type === 15 ? (section.type15ChoiceMode || 'ab') : section.type15ChoiceMode,
                    type15LetterBandBg: t.type === 15 ? 'white' : section.type15LetterBandBg,
                    type16SoundMode: t.type === 16 ? (section.type16SoundMode || 'beginning') : section.type16SoundMode,
                    type16ChoiceCount: t.type === 16 ? (section.type16ChoiceCount || 3) : section.type16ChoiceCount,
                    type16Layout: t.type === 16 ? (section.type16Layout || 'lettersLeft') : section.type16Layout,
                    type16LetterCase: t.type === 16 ? (section.type16LetterCase || 'lower') : section.type16LetterCase,
                    type16Border: t.type === 16 ? (section.type16Border || 'none') : section.type16Border,
                    type17TaskMode: t.type === 17 ? (section.type17TaskMode || 'color') : section.type17TaskMode,
                    type17Border: t.type === 17 ? (section.type17Border || 'full') : section.type17Border,
                    type17CardBorder: t.type === 17 ? (section.type17CardBorder || 'none') : section.type17CardBorder,
                    type17LetterCase: t.type === 17 ? (section.type17LetterCase || 'lower') : section.type17LetterCase,
                    type17StripLength: t.type === 17 ? (section.type17StripLength || 'auto') : section.type17StripLength,
                    type17HighlightTarget: t.type === 17 ? (section.type17HighlightTarget || 'none') : section.type17HighlightTarget,
                    type17ShowExample: t.type === 17 ? (section.type17ShowExample !== false) : section.type17ShowExample,
                    type18TargetLetter: t.type === 18 ? (section.type18TargetLetter || 'E') : section.type18TargetLetter,
                    type18Mode: t.type === 18 ? (section.type18Mode || 'both') : section.type18Mode,
                    type18ColorUpper: t.type === 18 ? (section.type18ColorUpper || 'green') : section.type18ColorUpper,
                    type18ColorLower: t.type === 18 ? (section.type18ColorLower || 'red') : section.type18ColorLower,
                    type18GridRows: t.type === 18 ? (section.type18GridRows || 4) : section.type18GridRows,
                    type18GridCols: t.type === 18 ? (section.type18GridCols || 7) : section.type18GridCols,
                    type18Border: t.type === 18 ? (section.type18Border || 'rounded') : section.type18Border,
                    type18CircleStyle: t.type === 18 ? (section.type18CircleStyle || 'solid') : section.type18CircleStyle,
                    type18DistractorCasing: t.type === 18 ? (section.type18DistractorCasing || 'upper') : section.type18DistractorCasing,
                    type18HighlightTarget: t.type === 18 ? (section.type18HighlightTarget || 'none') : section.type18HighlightTarget
                  });
                }}
                data-testid={`section-type-button-${t.type}-${index}`}
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

      {/* Quick Font, Font Size, Spacing & Image Size Selector per exercise */}
      <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <TypeIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Phông Chữ, Cỡ Chữ, Khoảng Cách & Cỡ Ảnh bài tập</span>
          </label>
          <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-100/80 px-2 py-0.5 rounded font-semibold">
            {section.fontFamily || (section.type === 8 ? 'KG Primary Dots' : 'r0c0i Linotte')} • {section.fontSize || (section.type === 8 ? 22 : 12)} pt • {section.spacing !== undefined ? section.spacing : 0} pt • {section.imageSize || 12.7} mm (0.5 in)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          {/* Font Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Phông Chữ (Font)
            </label>
            <select
              value={section.fontFamily || (section.type === 8 ? 'KG Primary Dots' : 'r0c0i Linotte')}
              onChange={(e) => onUpdateSection(index, { fontFamily: e.target.value as any })}
              data-testid={`section-font-${index}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              {FONT_OPTIONS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cỡ Chữ (Font Size)
            </label>
            <select
              value={section.fontSize || (section.type === 8 ? 22 : 12)}
              onChange={(e) => onUpdateSection(index, { fontSize: Number(e.target.value) })}
              data-testid={`section-fontsize-${index}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              {FONT_SIZE_OPTIONS.map((sz) => (
                <option key={sz.value} value={sz.value}>
                  {sz.label}
                </option>
              ))}
            </select>
          </div>

          {/* Spacing Selector (Word-standard pt) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Khoảng Cách (Spacing)
            </label>
            <select
              value={section.spacing !== undefined ? section.spacing : 0}
              onChange={(e) => onUpdateSection(index, { spacing: Number(e.target.value) })}
              data-testid={`section-spacing-${index}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              {SPACING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Image Size Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Cỡ Ảnh (Image Size)
            </label>
            <select
              value={section.imageSize || 12.7}
              onChange={(e) => onUpdateSection(index, { imageSize: Number(e.target.value) })}
              data-testid={`section-imagesize-${index}`}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              {IMAGE_SIZE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Answer Mode Toggle for Worksheet Types 1 to 17 */}
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].includes(section.type) && (
        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>🎯</span> Chế Độ Đáp Án (Answer Mode)
            </span>
            <p className="text-[11px] text-amber-700">
              {(section.answerMode || 'student') === 'answer'
                ? 'Đang bật hiển thị đáp án hoàn chỉnh bằng mực đỏ nổi bật cho giáo viên chấm bài.'
                : 'Đang ở chế độ phiếu bài tập trống để học sinh tự làm bài.'}
            </p>
          </div>
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-amber-200 shadow-2xs self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onUpdateSection(index, { answerMode: 'student' })}
              data-testid={`section-answermode-student-${index}`}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                (section.answerMode || 'student') === 'student'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Học sinh
            </button>
            <button
              type="button"
              onClick={() => onUpdateSection(index, { answerMode: 'answer' })}
              data-testid={`section-answermode-answer-${index}`}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                section.answerMode === 'answer'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Đáp án
            </button>
          </div>
        </div>
      )}

      {/* If Type 4: Layout Mode & Blank / Column Configurator */}
      {section.type === 4 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>✍️</span> Tuỳ Chọn Bài Tập Điền Chữ (Loại 4)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Loại 4
            </span>
          </div>

          {/* 1. Chọn Bố cục */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold text-indigo-800">
              Chế Độ Bố Cục
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() =>
                  onUpdateSection(index, { type4LayoutMode: 'grid' })
                }
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  (section.type4LayoutMode || 'grid') === 'grid'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-50/50'
                }`}
              >
                Lưới 12 tranh
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateSection(index, {
                    type4LayoutMode: 'table',
                    type4ColumnMode: section.type4ColumnMode || 'both_trace_first',
                    title: section.title === 'Điền chữ cái còn thiếu' ? 'Look and write' : section.title
                  })
                }
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                  section.type4LayoutMode === 'table'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-indigo-200 hover:bg-indigo-50/50'
                }`}
              >
                Bảng hàng ngang (Look and write)
              </button>
            </div>
          </div>

          {/* 2. Cấu hình chi tiết theo bố cục */}
          {section.type4LayoutMode === 'table' ? (
            <div className="space-y-2">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-indigo-800">
                  Kiểu Cột Gợi Ý (Chữ Cái Đầu & Cuối)
                </label>
                <select
                  value={section.type4ColumnMode || 'both_trace_first'}
                  onChange={(e) =>
                    onUpdateSection(index, {
                      type4ColumnMode: e.target.value as Type4ColumnMode
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                >
                  {TYPE4_COLUMN_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {section.type4ColumnMode === 'alphabet_order' && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-indigo-800">
                    Luyện tới chữ cái theo bảng chữ cái:
                  </label>
                  <select
                    value={section.type4AlphabetTargetLetter || 'c'}
                    onChange={(e) =>
                      onUpdateSection(index, {
                        type4AlphabetTargetLetter: e.target.value
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                  >
                    {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map((letter) => (
                      <option key={letter} value={letter}>
                        Chữ {letter.toUpperCase()} (Luyện từ A đến {letter.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-indigo-800">
                  Cỡ Chữ Gợi Ý Cần Đồ (Trace Font Size)
                </label>
                <select
                  value={section.type4TraceFontSize || 28}
                  onChange={(e) =>
                    onUpdateSection(index, {
                      type4TraceFontSize: Number(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                >
                  {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} pt {sz === 28 ? '(Mặc định - Chuẩn tập viết)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-indigo-800">
                Chế Độ Đục Lỗ Chữ Cái (Blank Mode)
              </label>
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
        </div>
      )}

      {/* If Type 6: Choice Count & Layout Configurator */}
      {section.type === 6 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Kiểu Lựa Chọn (Loại 6 - Multiple Choice)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {section.choiceLayout === 'horizontal'
                ? '2 lựa chọn ngang'
                : `${section.choiceCount || 3} lựa chọn dọc`}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[
              { count: 3, layout: 'vertical' as const, label: '3 Lựa Chọn Dọc' },
              { count: 2, layout: 'vertical' as const, label: '2 Lựa Chọn Dọc' },
              { count: 2, layout: 'horizontal' as const, label: '2 Lựa Chọn Ngang' }
            ].map((opt) => {
              const isActive =
                opt.layout === 'horizontal'
                  ? section.choiceLayout === 'horizontal'
                  : (!section.choiceLayout || section.choiceLayout === 'vertical') && (section.choiceCount || 3) === opt.count;
              return (
                <button
                  key={`${opt.count}-${opt.layout}`}
                  type="button"
                  onClick={() =>
                    onUpdateSection(index, {
                      choiceCount: opt.count as 2 | 3,
                      choiceLayout: opt.layout
                    })
                  }
                  data-testid={`section-choice-count-${opt.count}-${opt.layout}-${index}`}
                  className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Answer Mode for Type 6 */}
          <div className="pt-2 border-t border-indigo-100/60">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Chế Độ Đáp Án
              </label>
              <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: 'Học sinh' },
                { value: 'answer', label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value as 'student' | 'answer'
                      })
                    }
                    data-testid={`section-type6-answermode-${opt.value}-${index}`}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 7: Unscramble Configurator */}
      {section.type === 7 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Sắp Xếp Chữ Cái (Loại 7 - Unscramble)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Đáp Án
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: 'Học sinh' },
                { value: 'answer', label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value as 'student' | 'answer'
                      })
                    }
                    data-testid={`section-type7-answermode-${opt.value}-${index}`}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 8: Look and trace Configurator */}
      {section.type === 8 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Tập Tô Từ Vựng (Loại 8 - Look and trace)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Đáp Án
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: 'Học sinh' },
                { value: 'answer', label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value as 'student' | 'answer'
                      })
                    }
                    data-testid={`section-type8-answermode-${opt.value}-${index}`}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 9: Look and color Yes/No Configurator */}
      {section.type === 9 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Nhìn Câu Tô Màu Yes/No (Loại 9)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Đáp Án
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: 'Học sinh' },
                { value: 'answer', label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value as 'student' | 'answer'
                      })
                    }
                    data-testid={`section-type9-answermode-${opt.value}-${index}`}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 10: Look and color Configurator */}
      {section.type === 10 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Nhìn Từ Tô Màu Tranh (Loại 10)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
            </span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Đáp Án
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student', label: 'Học sinh' },
                { value: 'answer', label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value as 'student' | 'answer'
                      })
                    }
                    data-testid={`section-type10-answermode-${opt.value}-${index}`}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 3: Match Mode Configurator (Word vs Sentence vs Look, match and write) */}
      {section.type === 3 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-indigo-900">
              Tuỳ Chọn Nối (Loại 3)
            </label>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              {(section.matchMode || 'word') === 'look_match_write'
                ? 'Look, match and write'
                : (section.matchMode || 'word') === 'sentence'
                ? 'Nối hình với Câu'
                : 'Nối hình với Từ vựng'}
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5 pt-1">
            {[
              { value: 'word', label: 'Nối Từ' },
              { value: 'sentence', label: 'Nối Câu' },
              { value: 'look_match_write', label: 'Look, match & write' }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  const val = opt.value as 'word' | 'sentence' | 'look_match_write';
                  let newTitle = section.title;
                  if (
                    section.title === 'Match picture with word' ||
                    section.title === 'Match picture with sentence' ||
                    section.title === 'Look, match and write'
                  ) {
                    newTitle = val === 'look_match_write'
                      ? 'Look, match and write'
                      : (val === 'sentence' ? 'Match picture with sentence' : 'Match picture with word');
                  }
                  onUpdateSection(index, { matchMode: val, title: newTitle });
                }}
                data-testid={`section-match-mode-${opt.value}-${index}`}
                className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                  (section.matchMode || 'word') === opt.value
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sub-options for Look, match and write */}
          {(section.matchMode || 'word') === 'look_match_write' && (
            <div className="pt-2 border-t border-indigo-100/80 space-y-2">
              {/* Suffix shuffle option */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-indigo-900">Xáo trộn Cột Hậu tố (Cột 2):</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {section.lookMatchWriteShuffleSuffix ? 'Xáo trộn độc lập' : 'Cùng hàng như ảnh mẫu'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSection(index, { lookMatchWriteShuffleSuffix: false })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                      !section.lookMatchWriteShuffleSuffix
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Cùng hàng (như mẫu)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSection(index, { lookMatchWriteShuffleSuffix: true })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                      section.lookMatchWriteShuffleSuffix
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Xáo trộn độc lập
                  </button>
                </div>
              </div>

              {/* Write mode option: Trace vs Blank */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-indigo-900">Kiểu chữ Cột Viết (Cột 4):</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {(section.lookMatchWriteMode || 'trace') === 'blank' ? 'Để trống tự viết (__)' : 'Chữ nét đứt để tô'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => onUpdateSection(index, { lookMatchWriteMode: 'trace' })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                      (section.lookMatchWriteMode || 'trace') === 'trace'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Chữ nét đứt (Trace)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSection(index, { lookMatchWriteMode: 'blank' })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                      (section.lookMatchWriteMode || 'trace') === 'blank'
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    Để trống tự viết (__)
                  </button>
                </div>
              </div>

              {/* Trace Font Size option */}
              <div className="pt-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-indigo-900">Cỡ chữ Cột Viết / Trace:</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    {section.lookMatchWriteTraceFontSize || 28} pt
                  </span>
                </div>
                <select
                  value={section.lookMatchWriteTraceFontSize || 28}
                  onChange={(e) => onUpdateSection(index, { lookMatchWriteTraceFontSize: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} pt {sz === 28 ? '(Chuẩn tập viết 28 pt)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Cột 1 & 2 dùng cỡ chữ chung ({section.fontSize || 12} pt), cột Trace dùng cỡ chữ to riêng để học sinh dễ viết.
                </p>
              </div>

              {/* Baseline toggle */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] font-semibold text-indigo-900">Dòng kẻ gạch đứt chân chữ:</span>
                <button
                  type="button"
                  onClick={() => onUpdateSection(index, { lookMatchWriteShowBaseline: section.lookMatchWriteShowBaseline === false ? true : false })}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                    section.lookMatchWriteShowBaseline !== false
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {section.lookMatchWriteShowBaseline !== false ? 'Đang bật' : 'Đang tắt'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* If Type 3: Match Hint Dots Configurator */}
      {section.type === 3 && (
        <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-emerald-900">
              Gợi Ý Nối (Đốm Màu)
            </label>
            <span className="text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
              {(section.matchHint || 'none') === 'match'
                ? 'Màu tương ứng theo cặp'
                : (section.matchHint || 'none') === 'side'
                ? 'Phân biệt 2 bên (Trái/Phải)'
                : (section.matchHint || 'none') === 'multi'
                ? 'Đa sắc (Mỗi cặp 1 màu)'
                : 'Tắt (Đốm đen tiêu chuẩn)'}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1">
            {[
              { value: 'none', label: 'Tắt (Đốm đen)' },
              { value: 'match', label: 'Màu theo cặp' },
              { value: 'side', label: 'Trái / Phải' },
              { value: 'multi', label: 'Đa sắc' }
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdateSection(index, { matchHint: opt.value as MatchHintMode })}
                data-testid={`section-match-hint-${opt.value}-${index}`}
                className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                  (section.matchHint || 'none') === opt.value
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* If Type 13: Wordsearch Puzzle Options */}
      {section.type === 13 && (
        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🧩</span> Tuỳ Chọn Tìm Từ Trong Ô Chữ (Wordsearch - Loại 13)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Nét đứt chấm bi
            </span>
          </div>

          {/* 1. Hướng từ vựng (Word Directions Checkboxes) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hướng Từ Vựng (Word Directions)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'horizontal', label: 'Ngang (→)' },
                { id: 'vertical', label: 'Dọc (↓)' },
                { id: 'diagonalDown', label: 'Xéo xuống (↘)' },
                { id: 'diagonalUp', label: 'Xéo lên (↗)' }
              ].map((dir) => {
                const currentDirs = section.wordsearchDirections || ['horizontal', 'vertical', 'diagonalDown'];
                const isChecked = currentDirs.includes(dir.id as WordsearchDirection);
                return (
                  <label
                    key={dir.id}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-all ${
                      isChecked
                        ? 'bg-white border-indigo-500 text-indigo-900 shadow-2xs ring-1 ring-indigo-500/20'
                        : 'bg-white/60 border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        let next: WordsearchDirection[];
                        if (e.target.checked) {
                          next = [...currentDirs, dir.id as WordsearchDirection];
                        } else {
                          next = currentDirs.filter((d) => d !== dir.id);
                          if (next.length === 0) next = ['horizontal']; // Fallback at least 1 direction
                        }
                        onUpdateSection(index, { wordsearchDirections: next });
                      }}
                      className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>{dir.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Tuỳ chọn Gợi ý (Hình hoặc chữ) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Hiển Thị Gợi Ý (Hint Mode)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'word', label: 'Chữ (Từ vựng)' },
                { value: 'image', label: 'Hình ảnh' },
                { value: 'both', label: 'Cả hình & chữ' }
              ].map((opt) => {
                const isSelected = (section.wordsearchHintType || 'word') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { wordsearchHintType: opt.value as WordsearchHintType })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Kích thước khung ô chữ (Grid Size) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Kích Thước Khung Ô Chữ (Grid Size)
              </label>
              <span className="text-[11px] text-slate-500">
                {section.wordsearchGridSize === undefined || section.wordsearchGridSize === 'auto'
                  ? 'Tự động tính phù hợp'
                  : `${section.wordsearchGridSize} x ${section.wordsearchGridSize} ô`}
              </span>
            </div>
            <select
              value={section.wordsearchGridSize || 'auto'}
              onChange={(e) => {
                const val = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
                onUpdateSection(index, { wordsearchGridSize: val });
              }}
              className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              <option value="auto">Tự động (Khuyên dùng - tối ưu theo từ & hướng)</option>
              <option value="8">8 x 8 ô (Dành cho 4-6 từ ngắn)</option>
              <option value="10">10 x 10 ô (Tiêu chuẩn tiểu học)</option>
              <option value="12">12 x 12 ô (Rộng rãi)</option>
              <option value="14">14 x 14 ô (Nhiều từ / Từ dài)</option>
            </select>
          </div>

          {/* 4. Đường Viền Ô Chữ (Grid Border) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đường Viền Ô Chữ (Grid Border)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'none', label: 'Không viền' },
                { value: 'outerOnly', label: 'Chỉ viền ngoài' },
                { value: 'full', label: 'Có cả viền trong' }
              ].map((opt) => {
                const isSelected = (section.wordsearchGridBorder || 'none') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { wordsearchGridBorder: opt.value as WordsearchGridBorder })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Định dạng chữ cái (Letter Casing) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Định Dạng Chữ Cái (Letter Casing)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'lower', label: 'Chữ thường (abc - Mặc định)' },
                { value: 'upper', label: 'Chữ hoa (ABC)' }
              ].map((opt) => {
                const isSelected = (section.wordsearchCase || 'lower') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { wordsearchCase: opt.value as WordsearchCase })}
                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* If Type 14: Circle Pictures with Target Letter Options */}
      {section.type === 14 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🔤</span> Tuỳ Chọn Bài Tập Khoanh Tranh (Loại 14)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Lưới 4 cột
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chữ Cái Mục Tiêu (Target Letter)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={section.targetLetter ?? 'V'}
                onChange={(e) => {
                  const val = e.target.value;
                  onUpdateSection(index, {
                    targetLetter: val,
                    title: `Circle the pictures that have letter ${val}`
                  });
                }}
                placeholder="V"
                data-testid={`section-target-letter-${index}`}
                className="w-16 px-3 py-1.5 text-center font-bold text-base bg-white border border-slate-300 rounded-lg text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((lettr) => {
                  const currentTarget = (section.targetLetter || 'V').trim().toUpperCase();
                  const isSelected = currentTarget === lettr || currentTarget.split(/[\s,/\\|_-]+/).includes(lettr);
                  return (
                    <button
                      key={lettr}
                      type="button"
                      onClick={() => {
                        onUpdateSection(index, {
                          targetLetter: lettr,
                          title: `Circle the pictures that have letter ${lettr}`
                        });
                      }}
                      data-testid={`section-type14-letter-btn-${lettr}-${index}`}
                      className={`w-7 h-7 text-xs font-bold rounded-md border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {lettr}
                    </button>
                  );
                })}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Nhập chữ cái tuỳ ý hoặc bấm chọn nhanh A-Z. Tiêu đề mục sẽ tự động cập nhật.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white border border-indigo-100 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={section.showWordLabels ?? true}
                onChange={(e) => onUpdateSection(index, { showWordLabels: e.target.checked })}
                data-testid={`section-show-labels-${index}`}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Hiển thị từ vựng bên dưới tranh</span>
                <span className="text-slate-400 block text-[11px]">Bật nhãn chữ dưới tranh hoặc tắt để học sinh tự nhận diện</span>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Type 1 Options: Sentence Reorder / Rewrite */}
      {section.type === 1 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>✏️</span> Tuỳ Chọn Viết Lại Câu (Loại 1)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Reorder / Rewrite
            </span>
          </div>

          <div>
            <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white border border-indigo-100 hover:bg-slate-50 transition-colors">
              <input
                type="checkbox"
                checked={section.sentenceScramble !== false}
                onChange={(e) => onUpdateSection(index, { sentenceScramble: e.target.checked })}
                data-testid={`section-scramble-toggle-${index}`}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">Xáo trộn các từ trong câu</span>
                <span className="text-slate-400 block text-[11px]">Bật để học sinh sắp xếp lại từ, tắt để giữ nguyên thứ tự câu</span>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Phân Cách Từ Xáo Trộn
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSection(index, { sentenceSeparator: 'space' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  (section.sentenceSeparator || 'space') === 'space'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cách đều nhau
              </button>
              <button
                type="button"
                onClick={() => onUpdateSection(index, { sentenceSeparator: 'slash' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  section.sentenceSeparator === 'slash'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Cách nhau bởi ' / '
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kiểu Dòng Gợi Ý Viết
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSection(index, { sentenceHintStyle: 'underscores' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  (section.sentenceHintStyle || 'underscores') === 'underscores'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                2 gạch '__' cho 1 chữ
              </button>
              <button
                type="button"
                onClick={() => onUpdateSection(index, { sentenceHintStyle: 'dots' })}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  section.sentenceHintStyle === 'dots'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Dòng chấm '...'
              </button>
              <button
                type="button"
                onClick={() => onUpdateSection(index, { sentenceHintStyle: 'trace', sentenceTraceFontSize: section.sentenceTraceFontSize || 28 })}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  section.sentenceHintStyle === 'trace'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Chữ nét đứt (Trace)
              </button>
            </div>
          </div>

          {section.sentenceHintStyle === 'trace' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-indigo-950">
                  Cỡ Chữ Gợi Ý Cần Đồ (Trace Font Size)
                </label>
                <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                  {section.sentenceTraceFontSize || 28} pt
                </span>
              </div>
              <select
                value={section.sentenceTraceFontSize || 28}
                onChange={(e) => onUpdateSection(index, { sentenceTraceFontSize: Number(e.target.value) })}
                className="w-full px-3 py-1.5 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
              >
                {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                  <option key={sz} value={sz}>
                    {sz} pt {sz === 28 ? '(Mặc định - Chuẩn tập viết 28 pt)' : sz === 26 ? '(Khuyên dùng A5 - 26 pt)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">
                Chữ nét chấm mờ KG Primary Dots cho học sinh lớp 1 tập tô.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Type 15 Options: Read and circle */}
      {section.type === 15 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🔘</span> Tuỳ Chọn Đọc & Khoanh Tranh (Loại 15)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Khung 2 cột • Nét đứt chấm bi
            </span>
          </div>

          {/* Choice Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Định Dạng Lựa Chọn (Choice Format)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'ab', label: 'Dạng a b' },
                { value: 'checkbox', label: 'Tick vào ô' },
                { value: 'none', label: 'Không có' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type15ChoiceMode: opt.value as Type15ChoiceMode })}
                  data-testid={`section-type15-choice-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type15ChoiceMode || 'ab') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border Style (tham khảo loại 13) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đường Viền Khung (Border Style)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'full', label: 'Có cả viền trong' },
                { value: 'outerOnly', label: 'Chỉ viền ngoài' },
                { value: 'none', label: 'Không viền' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type15Border: opt.value as Type15Border })}
                  data-testid={`section-type15-border-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type15Border || 'full') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kiểu Đánh Số Thứ Tự
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUpdateSection(index, { type15NumberStyle: 'none' })}
                data-testid={`section-type15-numstyle-none-${index}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  (section.type15NumberStyle || 'none') === 'none'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Không (Mặc định)
              </button>
              <button
                type="button"
                onClick={() => onUpdateSection(index, { type15NumberStyle: 'traditional' })}
                data-testid={`section-type15-numstyle-traditional-${index}`}
                className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all ${
                  section.type15NumberStyle === 'traditional'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Có (Chữ số truyền thống màu đen)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type 16: Look and circle sound */}
      {section.type === 16 && (
        <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🔤</span> Tuỳ Chọn Nhìn Tranh Khoanh Âm (Loại 16)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Lưới 3 cột • Tràn trang tự động
            </span>
          </div>

          {/* Sound Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Âm Thanh Mục Tiêu (Sound Target)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'beginning', label: 'Âm đầu (Beginning sound)', title: 'Look and circle the beginning sound' },
                { value: 'ending', label: 'Âm cuối (Ending sound)', title: 'Look and circle the ending sound' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, {
                    type16SoundMode: opt.value as Type16SoundMode,
                    title: opt.title
                  })}
                  data-testid={`section-type16-sound-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type16SoundMode || 'beginning') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Choices */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Số Lượng Chữ Cái Lựa Chọn (Choices Count)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 2, label: '2 chữ cái' },
                { value: 3, label: '3 chữ cái (Chuẩn)' },
                { value: 4, label: '4 chữ cái' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type16ChoiceCount: opt.value as Type16ChoiceCount })}
                  data-testid={`section-type16-choice-count-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type16ChoiceCount || 3) === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Layout Orientation */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Bố Cục Hiển Thị (Item Layout)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'lettersLeft', label: 'Chữ trái - Tranh phải' },
                { value: 'lettersRight', label: 'Tranh trái - Chữ phải' },
                { value: 'lettersBottom', label: 'Chữ ngang dưới tranh' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type16Layout: opt.value as Type16Layout })}
                  data-testid={`section-type16-layout-${opt.value}-${index}`}
                  className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                    (section.type16Layout || 'lettersLeft') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Case */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Định Dạng Chữ Cái (Letter Case)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'lower', label: 'Chữ thường (b, p, r)' },
                { value: 'upper', label: 'Chữ hoa (B, P, R)' },
                { value: 'both', label: 'Cặp chữ (Bb, Pp, Rr)' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type16LetterCase: opt.value as Type16LetterCase })}
                  data-testid={`section-type16-case-${opt.value}-${index}`}
                  className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                    (section.type16LetterCase || 'lower') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Border Style */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đường Viền Khung (Border Style)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'none', label: 'Không viền' },
                { value: 'outerOnly', label: 'Chỉ viền ngoài' },
                { value: 'full', label: 'Có cả viền trong' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type16Border: opt.value as Type16Border })}
                  data-testid={`section-type16-border-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type16Border || 'none') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Type 17: Look and color the words / Cross out extra letters */}
      {section.type === 17 && (
        <div data-testid={`section-type17-options-panel-${index}`} className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🎨</span> Tuỳ Chọn Nhìn Tranh Tô Màu Từ / Gạch Bỏ Chữ Dư (Loại 17)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              3 cột (A4) • 2 cột (A5)
            </span>
          </div>

          {/* Task Mode: color vs cross */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Bài Tập (Task Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'color', label: 'Tô màu từ đúng (Look & color)', title: 'Look and color the words' },
                { value: 'cross', label: 'Gạch bỏ chữ dư (Cross out extra)', title: 'Cross out (/) the extra letters.' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, {
                    type17TaskMode: opt.value as Type17TaskMode,
                    title: opt.title
                  })}
                  data-testid={`section-type17-task-mode-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type17TaskMode || 'color') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Letter Strip Border */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đường Viền Dải Ô Chữ (Letter Strip Border)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'full', label: 'Có cả viền trong' },
                { value: 'outerOnly', label: 'Chỉ viền ngoài' },
                { value: 'none', label: 'Không viền' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type17Border: opt.value as Type17Border })}
                  data-testid={`section-type17-border-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type17Border || 'full') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card Border */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Đóng Khung Toàn Thẻ (Card Frame)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'none', label: 'Không khung (Mẫu chuẩn)' },
                { value: 'rounded', label: 'Khung viền nét đứt (Loại 15)' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type17CardBorder: opt.value as Type17CardBorder })}
                  data-testid={`section-type17-card-border-${opt.value}-${index}`}
                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type17CardBorder || 'none') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Strip Length & Letter Case */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Độ Dài Dải Ô Chữ (Strip Length)
              </label>
              <select
                value={section.type17StripLength || 'auto'}
                onChange={(e) => onUpdateSection(index, { type17StripLength: e.target.value as Type17StripLength })}
                data-testid={`section-type17-striplength-${index}`}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium bg-white"
              >
                <option value="auto">Tự động (Khuyên dùng)</option>
                <option value="6">6 ô (Siêu gọn)</option>
                <option value="8">8 ô (Chuẩn mẫu)</option>
                <option value="10">10 ô (Từ dài)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Định Dạng Chữ (Letter Case)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'lower', label: 'Thường (abc)' },
                  { value: 'upper', label: 'Hoa (ABC)' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type17LetterCase: opt.value as Type17LetterCase })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      (section.type17LetterCase || 'lower') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Highlight Target & Show Example */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Màu Chữ Mục Tiêu (Highlight / Key)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: 'none', label: 'Chữ đen (HS)' },
                  { value: 'red', label: 'Tô đỏ (Đáp án)' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type17HighlightTarget: opt.value as Type17HighlightTarget })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      (section.type17HighlightTarget || 'none') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Ví Dụ Mẫu Câu Đầu (Show Example)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { value: true, label: 'Có ví dụ mẫu' },
                  { value: false, label: 'Không có mẫu' }
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => onUpdateSection(index, { type17ShowExample: opt.value })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      (section.type17ShowExample !== false) === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Type 18: Color the target letters */}
      {section.type === 18 && (
        <div data-testid={`section-type18-options-panel-${index}`} className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
          <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
              <span>🔤</span> Tuỳ Chọn Tô Màu Chữ Cái Mục Tiêu (Loại 18)
            </span>
            <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
              Hình tròn WS 9 • Khung bo góc
            </span>
          </div>

          {/* Target Letter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chữ Cái Mục Tiêu (Target Letter)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={1}
                value={section.type18TargetLetter || 'E'}
                onChange={(e) => {
                  const val = (e.target.value || 'E').toUpperCase();
                  const mode = section.type18Mode || 'both';
                  const c1 = section.type18ColorUpper || 'green';
                  const c2 = section.type18ColorLower || 'red';
                  const autoTitle = mode === 'upper_only'
                    ? `Color ${val} ${c1}`
                    : mode === 'lower_only'
                    ? `Color ${val.toLowerCase()} ${c2}`
                    : mode === 'single_color'
                    ? `Color letter ${val} and ${val.toLowerCase()} ${c1}`
                    : `Color ${val} ${c1} and ${val.toLowerCase()} ${c2}`;
                  onUpdateSection(index, { type18TargetLetter: val, title: autoTitle });
                }}
                className="w-16 px-3 py-1.5 text-center font-bold text-base bg-white border border-slate-300 rounded-lg text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-wrap gap-1 flex-1">
                {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((lettr) => (
                  <button
                    key={lettr}
                    type="button"
                    onClick={() => {
                      const mode = section.type18Mode || 'both';
                      const c1 = section.type18ColorUpper || 'green';
                      const c2 = section.type18ColorLower || 'red';
                      const autoTitle = mode === 'upper_only'
                        ? `Color ${lettr} ${c1}`
                        : mode === 'lower_only'
                        ? `Color ${lettr.toLowerCase()} ${c2}`
                        : mode === 'single_color'
                        ? `Color letter ${lettr} and ${lettr.toLowerCase()} ${c1}`
                        : `Color ${lettr} ${c1} and ${lettr.toLowerCase()} ${c2}`;
                      onUpdateSection(index, { type18TargetLetter: lettr, title: autoTitle });
                    }}
                    data-testid={`section-type18-letter-btn-${lettr}-${index}`}
                    className={`w-7 h-7 text-xs font-bold rounded-md border flex items-center justify-center transition-all ${
                      (section.type18TargetLetter || 'E').toUpperCase() === lettr
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {lettr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Task Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Bài Tập (Task Mode)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'both', label: 'Cả Hoa & Thường (E xanh, e đỏ)' },
                { value: 'upper_only', label: 'Chỉ chữ Hoa (E green)' },
                { value: 'lower_only', label: 'Chỉ chữ Thường (e red)' },
                { value: 'single_color', label: 'Chung 1 màu (E & e green)' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    const mode = opt.value as Type18Mode;
                    const val = (section.type18TargetLetter || 'E').toUpperCase();
                    const c1 = section.type18ColorUpper || 'green';
                    const c2 = section.type18ColorLower || 'red';
                    const autoTitle = mode === 'upper_only'
                      ? `Color ${val} ${c1}`
                      : mode === 'lower_only'
                      ? `Color ${val.toLowerCase()} ${c2}`
                      : mode === 'single_color'
                      ? `Color letter ${val} and ${val.toLowerCase()} ${c1}`
                      : `Color ${val} ${c1} and ${val.toLowerCase()} ${c2}`;
                    onUpdateSection(index, { type18Mode: mode, title: autoTitle });
                  }}
                  data-testid={`section-type18-mode-${opt.value}-${index}`}
                  className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                    (section.type18Mode || 'both') === opt.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Colors Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Màu Chữ Hoa (Upper Color)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(TYPE18_COLOR_MAP).slice(0, 4).map(([cKey, cVal]) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => {
                      const mode = section.type18Mode || 'both';
                      const val = (section.type18TargetLetter || 'E').toUpperCase();
                      const c2 = section.type18ColorLower || 'red';
                      const autoTitle = mode === 'upper_only'
                        ? `Color ${val} ${cKey}`
                        : mode === 'lower_only'
                        ? `Color ${val.toLowerCase()} ${c2}`
                        : mode === 'single_color'
                        ? `Color letter ${val} and ${val.toLowerCase()} ${cKey}`
                        : `Color ${val} ${cKey} and ${val.toLowerCase()} ${c2}`;
                      onUpdateSection(index, { type18ColorUpper: cKey, title: autoTitle });
                    }}
                    className={`py-1 text-[11px] font-semibold rounded border flex items-center justify-center gap-1 ${
                      (section.type18ColorUpper || 'green') === cKey
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cVal.hex }} />
                    {cVal.viName}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Màu Chữ Thường (Lower Color)
              </label>
              <div className="grid grid-cols-4 gap-1">
                {Object.entries(TYPE18_COLOR_MAP).slice(0, 4).map(([cKey, cVal]) => (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => {
                      const mode = section.type18Mode || 'both';
                      const val = (section.type18TargetLetter || 'E').toUpperCase();
                      const c1 = section.type18ColorUpper || 'green';
                      const autoTitle = mode === 'upper_only'
                        ? `Color ${val} ${c1}`
                        : mode === 'lower_only'
                        ? `Color ${val.toLowerCase()} ${cKey}`
                        : mode === 'single_color'
                        ? `Color letter ${val} and ${val.toLowerCase()} ${c1}`
                        : `Color ${val} ${c1} and ${val.toLowerCase()} ${cKey}`;
                      onUpdateSection(index, { type18ColorLower: cKey, title: autoTitle });
                    }}
                    className={`py-1 text-[11px] font-semibold rounded border flex items-center justify-center gap-1 ${
                      (section.type18ColorLower || 'red') === cKey
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cVal.hex }} />
                    {cVal.viName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Size & Outer Border */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kích Thước Lưới Ô Chữ
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { r: 4, c: 7, label: '4 hàng x 7 cột (28 ô)' },
                  { r: 3, c: 6, label: '3 hàng x 6 cột (18 ô)' },
                  { r: 4, c: 6, label: '4 hàng x 6 cột (24 ô)' },
                  { r: 5, c: 7, label: '5 hàng x 7 cột (35 ô)' }
                ].map((opt) => (
                  <button
                    key={`${opt.r}x${opt.c}`}
                    type="button"
                    onClick={() => onUpdateSection(index, { type18GridRows: opt.r, type18GridCols: opt.c })}
                    className={`py-1.5 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                      (section.type18GridRows || 4) === opt.r && (section.type18GridCols || 7) === opt.c
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Khung Viền Bao Ngoài (Container)
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { value: 'rounded', label: 'Bo góc (Mẫu)' },
                  { value: 'rect', label: 'Vuông' },
                  { value: 'none', label: 'Không viền' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type18Border: opt.value as Type18Border })}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                      (section.type18Border || 'rounded') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Circle Style & Distractor Casing & Answer Key */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kiểu Hình Tròn (WS 9)
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'solid', label: 'Nét liền' },
                  { value: 'dashed', label: 'Nét đứt' },
                  { value: 'double', label: 'Viền đôi' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type18CircleStyle: opt.value as Type18CircleStyle })}
                    className={`py-1 text-[11px] font-semibold rounded border ${
                      (section.type18CircleStyle || 'solid') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chữ Gây Nhiễu
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'upper', label: 'Chữ hoa' },
                  { value: 'lower', label: 'Chữ thường' },
                  { value: 'mixed', label: 'Hỗn hợp' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type18DistractorCasing: opt.value as Type18DistractorCasing })}
                    className={`py-1 text-[11px] font-semibold rounded border ${
                      (section.type18DistractorCasing || 'upper') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chế Độ Đáp Án
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: 'none', label: 'Học sinh' },
                  { value: 'answer_key', label: 'Đáp án' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type18HighlightTarget: opt.value as Type18HighlightTarget })}
                    className={`py-1 text-[11px] font-semibold rounded border ${
                      (section.type18HighlightTarget || 'none') === opt.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
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
        <div className="flex items-center justify-between flex-wrap gap-2">
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

            {/* Target Word Count Stepper */}
            {hasReviewWords ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Stepper 1: Primary Word Count */}
                <div
                  className="flex items-center bg-amber-50 rounded-lg p-0.5 border border-amber-200"
                  data-testid={`section-primary-count-stepper-${index}`}
                  title="Số từ bốc từ Bộ Chính / Unit đang học"
                >
                  <span className="px-1.5 text-xs font-bold text-amber-900 select-none flex items-center gap-0.5">
                    <span>⭐ Chính:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustPrimaryCount(-1)}
                    disabled={effectivePrimaryCount <= 1}
                    data-testid={`section-primary-count-dec-${index}`}
                    className="w-5 h-5 flex items-center justify-center rounded bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Giảm 1 từ chính"
                  >
                    -
                  </button>
                  <span
                    data-testid={`section-primary-count-val-${index}`}
                    className="px-2 text-xs font-bold text-amber-900 select-none min-w-[18px] text-center"
                  >
                    {effectivePrimaryCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustPrimaryCount(1)}
                    disabled={effectivePrimaryCount >= maxStepperLimit}
                    data-testid={`section-primary-count-inc-${index}`}
                    className="w-5 h-5 flex items-center justify-center rounded bg-white text-amber-900 hover:bg-amber-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Tăng 1 từ chính"
                  >
                    +
                  </button>
                </div>

                {/* Stepper 2: Review Word Count */}
                <div
                  className="flex items-center bg-cyan-50 rounded-lg p-0.5 border border-cyan-200"
                  data-testid={`section-review-count-stepper-${index}`}
                  title="Số từ bốc từ các Bộ Ôn Tập"
                >
                  <span className="px-1.5 text-xs font-bold text-cyan-900 select-none flex items-center gap-0.5">
                    <span>🔄 Ôn:</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustReviewCount(-1)}
                    disabled={effectiveReviewCount <= 0}
                    data-testid={`section-review-count-dec-${index}`}
                    className="w-5 h-5 flex items-center justify-center rounded bg-white text-cyan-900 hover:bg-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Giảm 1 từ ôn tập"
                  >
                    -
                  </button>
                  <span
                    data-testid={`section-review-count-val-${index}`}
                    className="px-2 text-xs font-bold text-cyan-900 select-none min-w-[18px] text-center"
                  >
                    {effectiveReviewCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleAdjustReviewCount(1)}
                    disabled={effectiveReviewCount >= maxStepperLimit}
                    data-testid={`section-review-count-inc-${index}`}
                    className="w-5 h-5 flex items-center justify-center rounded bg-white text-cyan-900 hover:bg-cyan-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="Tăng 1 từ ôn tập"
                  >
                    +
                  </button>
                </div>

                {/* Total indicator */}
                <div
                  className="flex items-center bg-slate-100 rounded-lg px-2 py-0.5 border border-slate-200"
                  data-testid={`section-target-count-stepper-${index}`}
                >
                  <span
                    data-testid="target-word-count-badge"
                    data-testid-indexed={`target-word-count-badge-${index}`}
                    className="text-xs font-bold text-slate-700 select-none"
                  >
                    Tổng: {effectivePrimaryCount + effectiveReviewCount} từ
                  </span>
                </div>
              </div>
            ) : (
              <div
                className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200"
                data-testid={`section-target-count-stepper-${index}`}
              >
                <button
                  type="button"
                  onClick={() => handleAdjustWordCount(-1)}
                  disabled={currentTargetCount <= 1}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Giảm 1 từ"
                >
                  -
                </button>
                <span className="px-2 text-xs font-semibold text-slate-700 select-none">
                  Số từ: {currentTargetCount}
                </span>
                <button
                  type="button"
                  onClick={() => handleAdjustWordCount(1)}
                  disabled={words.length > 0 && currentTargetCount >= words.length * 2}
                  className="w-5 h-5 flex items-center justify-center rounded bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  title="Tăng 1 từ"
                >
                  +
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRandomizeWords}
              disabled={words.length === 0}
              data-testid={`randomize-words-btn-${index}`}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/80 transition-all hover:shadow-xs active:scale-95 cursor-pointer"
              title="Đổi từ ngẫu nhiên từ bộ thẻ hiện tại"
            >
              <span>🎲 Đổi từ ngẫu nhiên</span>
            </button>
            {onOpenQuickAddModal && (
              <button
                type="button"
                onClick={() => onOpenQuickAddModal(index)}
                data-testid={`quick-add-decks-btn-${index}`}
                className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:shadow-sm transform active:scale-95 cursor-pointer"
              >
                <span>🎲 Bốc từ bộ Flashcard</span>
              </button>
            )}
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-xs text-indigo-600 hover:underline font-semibold cursor-pointer"
            >
              Chọn tất cả
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-xs text-slate-500 hover:underline font-semibold cursor-pointer"
            >
              Bỏ chọn
            </button>
            <button
              type="button"
              onClick={() => setIsVocabExpanded(!isVocabExpanded)}
              className="text-xs text-slate-500 hover:text-slate-800 font-medium ml-1 cursor-pointer"
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-slate-900">
                            {w.term}
                          </span>
                          {/* Role-based visual badges */}
                          {w.deckRole === 'primary' ? (
                            <span
                              data-testid={`word-deck-role-badge-${wIdx}`}
                              data-deck-role="primary"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 font-semibold"
                              title={w.sourceDeckTitle ? `Bộ Chính: ${w.sourceDeckTitle}` : 'Bộ Chính'}
                            >
                              ⭐ Bộ Chính
                            </span>
                          ) : w.deckRole === 'review' ? (
                            <span
                              data-testid={`word-deck-role-badge-${wIdx}`}
                              data-deck-role="review"
                              className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-50 text-cyan-800 border border-cyan-200/60 shrink-0 font-semibold"
                              title={w.sourceDeckTitle ? `Ôn: ${w.sourceDeckTitle}` : 'Bộ Ôn Tập'}
                            >
                              {w.sourceDeckTitle ? `🔄 Ôn: ${w.sourceDeckTitle}` : '🔄 Ôn Tập'}
                            </span>
                          ) : w.sourceDeckTitle ? (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 shrink-0 font-medium">
                              {w.sourceDeckTitle}
                            </span>
                          ) : null}
                          {otherSectionsWordIndices && otherSectionsWordIndices.has(wIdx) && (
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80 font-medium shrink-0"
                              data-testid={`word-other-section-badge-${wIdx}`}
                            >
                              Đang dùng ở phần khác
                            </span>
                          )}
                        </div>
                        {w.definition && (
                          <span className="text-[11px] text-slate-500 truncate block">
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
