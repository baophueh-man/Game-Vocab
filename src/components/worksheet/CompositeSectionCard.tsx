import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckSquare,
  Square,
  Copy,
  FileText,
  Type as TypeIcon,
  GripVertical,
  Shuffle,
  Pencil,
  Target,
  RefreshCw,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import SmartImage from '../ui/SmartImage';
import { useWorksheetTypes } from '../../utils/worksheetTypeCustomization';
import WorksheetTypeManagerModal from './WorksheetTypeManagerModal';
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
  TYPE18_COLOR_MAP,
  Type19MazeMode,
  Type19WallColor,
  Type19EntranceCharacter,
  Type19TargetItem,
  Type19CornerStyle,
  Type19WallThickness,
  Type19HintMode,
  Type19GridBorder,
  Type19LineStyle,
  Type19BorderColor,
  Type19PuzzlesPerPage,
  Type19Casing,
  Type20HintMode,
  Type20GridBorder,
  Type20LineStyle,
  Type20BorderColor,
  Type20PuzzlesPerPage,
  Type20Casing,
  Type20GridMode
} from '../../utils/worksheetGenerator';
import { ALL_ENTRANCE_CHARACTERS } from '../../utils/worksheetCharactersData';
import {
  pickQuotaAwareRandomWordIndices,
  sortIndicesAlphabetically,
  shuffleWordIndices,
  resetIndicesToOriginal,
  reorderIndices,
  getMostFrequentLetter,
  getLetterFrequencyStats
} from '../../utils/worksheetVocabEngine';
import { estimateSectionDimensions } from '../../utils/worksheetPageOptimizer';

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
  wordsearchSeed?: number | string;
  type9Seed?: number | string;
  type3Seed?: number | string;
  type6Seed?: number | string;
  targetLetter?: string;
  targetLetterMode?: 'auto' | 'manual';
  showWordLabels?: boolean;
  sentenceScramble?: boolean;
  sentenceSeparator?: 'space' | 'slash';
  sentenceHintStyle?: 'underscores' | 'dots' | 'trace';
  sentenceTraceFontSize?: number;
  sentenceWordsFont?: 'inherit' | 'Andika';
  type15NumberStyle?: Type15NumberStyle;
  type15Border?: Type15Border;
  type15ChoiceMode?: Type15ChoiceMode;
  type15LetterBandBg?: 'tint' | 'white';
  type15Seed?: number | string;
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
  type19MazeMode?: Type19MazeMode;
  type19WallColor?: Type19WallColor;
  type19EntranceCharacter?: Type19EntranceCharacter;
  type19TargetItem?: Type19TargetItem;
  type19SentenceStem?: string;
  type19CornerStyle?: Type19CornerStyle;
  type19WallThickness?: Type19WallThickness;
  type19MazeSeed?: number | string;
  type19HintMode?: Type19HintMode;
  type19GridBorder?: Type19GridBorder;
  type19LineStyle?: Type19LineStyle;
  type19BorderColor?: Type19BorderColor;
  type19PuzzlesPerPage?: Type19PuzzlesPerPage;
  type19Casing?: Type19Casing;
  type19ShowClueImage?: boolean;
  type19ShowClueNumber?: boolean;
  type19ShowClueText?: boolean;
  type19ShowTrace?: boolean;
  type20HintMode?: Type20HintMode;
  type20GridBorder?: Type20GridBorder;
  type20LineStyle?: Type20LineStyle;
  type20BorderColor?: Type20BorderColor;
  type20PuzzlesPerPage?: Type20PuzzlesPerPage;
  type20Casing?: Type20Casing;
  type20ShowClueImage?: boolean;
  type20ShowClueNumber?: boolean;
  type20ShowClueText?: boolean;
  type20ShowTrace?: boolean;
  type20GridMode?: Type20GridMode;
  type20HollowArrows?: boolean;
  type20ClueColumns?: number;
  type20Seed?: number;
  type19CellSize?: number;
  answerMode?: 'student' | 'answer' | 'both';
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
  isFocused?: boolean;
  onFocus?: (index: number) => void;
  paperSize?: 'a5' | 'a4';
  onReorderSection?: (fromIndex: number, toIndex: number) => void;
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
  isHighlighted,
  isFocused,
  onFocus,
  paperSize = 'a5',
  onReorderSection
}: CompositeSectionCardProps) {
  const { worksheetTypes } = useWorksheetTypes();
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState<boolean>(false);
  const [isVocabExpanded, setIsVocabExpanded] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const selectedSet = new Set(section.selectedWordIndices);

  const isA5 = paperSize !== 'a4';
  const printableWidth = isA5 ? 148 - 25.4 : 210 - 25.4;
  const sectionDims = estimateSectionDimensions(
    section,
    isA5,
    printableWidth,
    section.spacing ?? 0,
    section.fontSize ?? 12,
    section.imageSize ?? 12.7,
    words
  );

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

  const getAutoLetterUpdatesForIndices = (indices: number[]): Partial<UICompositeSection> => {
    if (section.type !== 14 || section.targetLetterMode === 'manual') return {};
    const secWords = indices.map((i) => words[i]).filter(Boolean);
    const autoLtr = getMostFrequentLetter(secWords.length > 0 ? secWords : words, 'V');
    return {
      targetLetter: autoLtr,
      targetLetterMode: 'auto',
      title: `Circle the pictures that have letter ${autoLtr}`
    };
  };

  const handleAdjustPrimaryCount = (delta: number) => {
    const newPrimary = Math.min(maxStepperLimit, Math.max(1, effectivePrimaryCount + delta));
    const newTotal = newPrimary + effectiveReviewCount;
    const picked = pickQuotaAwareRandomWordIndices(words, newPrimary, effectiveReviewCount);
    onUpdateSection(index, {
      primaryWordCount: newPrimary,
      reviewWordCount: effectiveReviewCount,
      targetWordCount: newTotal,
      selectedWordIndices: picked,
      ...getAutoLetterUpdatesForIndices(picked)
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
      selectedWordIndices: picked,
      ...getAutoLetterUpdatesForIndices(picked)
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
      selectedWordIndices: newIndices,
      ...getAutoLetterUpdatesForIndices(newIndices)
    });
  };

  const handleRandomizeWords = () => {
    if (!words || words.length === 0) return;
    const picked = pickQuotaAwareRandomWordIndices(words, effectivePrimaryCount, effectiveReviewCount);
    const extraUpdates: Partial<UICompositeSection> = {};
    if (section.type === 14 && section.targetLetterMode !== 'manual') {
      const pickedWords = picked.map((i) => words[i]).filter(Boolean);
      const autoLtr = getMostFrequentLetter(pickedWords.length > 0 ? pickedWords : words, 'V');
      extraUpdates.targetLetter = autoLtr;
      extraUpdates.targetLetterMode = 'auto';
      extraUpdates.title = `Circle the pictures that have letter ${autoLtr}`;
    }
    onUpdateSection(index, {
      targetWordCount: effectivePrimaryCount + effectiveReviewCount,
      primaryWordCount: effectivePrimaryCount,
      reviewWordCount: effectiveReviewCount,
      selectedWordIndices: picked,
      ...extraUpdates
    });
  };

  const toggleWord = (wordIdx: number) => {
    let newIndices: number[];
    if (selectedSet.has(wordIdx)) {
      newIndices = section.selectedWordIndices.filter((i) => i !== wordIdx);
    } else {
      newIndices = [...section.selectedWordIndices, wordIdx];
    }
    onUpdateSection(index, {
      selectedWordIndices: newIndices,
      targetWordCount: newIndices.length,
      ...getAutoLetterUpdatesForIndices(newIndices)
    });
  };

  const handleSortAsc = () => {
    const sorted = sortIndicesAlphabetically(section.selectedWordIndices, words, 'asc');
    onUpdateSection(index, { selectedWordIndices: sorted });
  };

  const handleSortDesc = () => {
    const sorted = sortIndicesAlphabetically(section.selectedWordIndices, words, 'desc');
    onUpdateSection(index, { selectedWordIndices: sorted });
  };

  const handleShuffleOrder = () => {
    const shuffled = shuffleWordIndices(section.selectedWordIndices);
    onUpdateSection(index, { selectedWordIndices: shuffled });
  };

  const handleResetOrder = () => {
    const original = resetIndicesToOriginal(section.selectedWordIndices);
    onUpdateSection(index, { selectedWordIndices: original });
  };

  const handleMoveWord = (currentPos: number, direction: 'prev' | 'next') => {
    const targetPos = direction === 'prev' ? currentPos - 1 : currentPos + 1;
    if (targetPos < 0 || targetPos >= section.selectedWordIndices.length) return;
    const reordered = reorderIndices(section.selectedWordIndices, currentPos, targetPos);
    onUpdateSection(index, { selectedWordIndices: reordered });
  };

  const handleSelectAll = () => {
    const allIndices = words.map((_, i) => i);
    onUpdateSection(index, {
      selectedWordIndices: allIndices,
      targetWordCount: words.length,
      ...getAutoLetterUpdatesForIndices(allIndices)
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
        onDragOver={(e) => {
          if (!onReorderSection) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          if (!isDragOver) setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          if (!onReorderSection) return;
          e.preventDefault();
          setIsDragOver(false);
          const fromIndexStr = e.dataTransfer.getData('text/plain');
          if (fromIndexStr !== '') {
            const fromIndex = Number(fromIndexStr);
            if (!isNaN(fromIndex) && fromIndex !== index) {
              onReorderSection(fromIndex, index);
            }
          }
        }}
        className={`bg-white px-4 py-3 rounded-2xl border transition-all cursor-pointer hover:border-indigo-300 hover:shadow-xs flex items-center justify-between gap-3 ${
          isDragging ? 'opacity-40 border-dashed border-indigo-400' : ''
        } ${
          isDragOver ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/40' : ''
        } ${
          isFocused
            ? 'ring-2 ring-indigo-500 border-indigo-400 bg-indigo-50/25 shadow-xs'
            : isHighlighted
            ? 'ring-4 ring-indigo-400 border-indigo-500 shadow-md bg-indigo-50/20'
            : 'border-slate-200'
        }`}
      >
        {/* Left summary */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {onReorderSection && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
                setIsDragging(true);
              }}
              onDragEnd={() => setIsDragging(false)}
              onClick={(e) => e.stopPropagation()}
              className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Kéo thả để sắp xếp thứ tự phần bài tập"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
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
          {isFocused && (
            <span
              data-testid={`focused-section-badge-${index}`}
              className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold shrink-0 shadow-2xs flex items-center gap-1"
            >
              <Target className="w-2.5 h-2.5" />
              <span>Đang xem</span>
            </span>
          )}
          <span className="text-[11px] text-slate-400 hidden md:inline truncate">
            • {section.fontFamily || 'Linotte'} • {section.fontSize || 12}pt
          </span>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          {onFocus && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFocus(index);
              }}
              title="Xem trước riêng phần bài tập này trên khung PDF"
              aria-label="Xem trước riêng phần bài tập này"
              data-testid={`focus-section-btn-${index}`}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                isFocused
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isFocused ? '🎯 Đang xem' : '👁️ Xem riêng'}</span>
            </button>
          )}
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
      onDragOver={(e) => {
        if (!onReorderSection) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!isDragOver) setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        if (!onReorderSection) return;
        e.preventDefault();
        setIsDragOver(false);
        const fromIndexStr = e.dataTransfer.getData('text/plain');
        if (fromIndexStr !== '') {
          const fromIndex = Number(fromIndexStr);
          if (!isNaN(fromIndex) && fromIndex !== index) {
            onReorderSection(fromIndex, index);
          }
        }
      }}
      className={`bg-white p-5 rounded-2xl border shadow-xs space-y-4 transition-all duration-300 ${
        isDragging ? 'opacity-40 border-dashed border-indigo-400' : ''
      } ${
        isDragOver ? 'ring-4 ring-indigo-500 border-indigo-500 bg-indigo-50/40' : ''
      } ${
        isFocused
          ? 'ring-2 ring-indigo-500 border-indigo-400 shadow-sm'
          : isHighlighted
          ? 'ring-4 ring-indigo-400 border-indigo-500 shadow-md scale-[1.005]'
          : 'border-slate-200'
      }`}
    >
      {/* Top Header of Card */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {onReorderSection && (
            <div
              draggable={true}
              onDragStart={(e) => {
                e.stopPropagation();
                e.dataTransfer.setData('text/plain', String(index));
                e.dataTransfer.effectAllowed = 'move';
                setIsDragging(true);
              }}
              onDragEnd={() => setIsDragging(false)}
              className="p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
              title="Kéo thả để sắp xếp thứ tự phần bài tập"
            >
              <GripVertical className="w-4 h-4" />
            </div>
          )}
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
          {isFocused && (
            <span
              data-testid={`focused-section-expanded-badge-${index}`}
              className="px-2 py-0.5 rounded-md bg-amber-500 text-white text-[10px] font-extrabold shrink-0 shadow-2xs flex items-center gap-1"
            >
              <Target className="w-2.5 h-2.5" />
              <span>Đang xem</span>
            </span>
          )}
        </div>

        {/* Section Actions: Reorder, Duplicate, Delete, Collapse */}
        <div className="flex items-center gap-1">
          {onFocus && (
            <button
              type="button"
              onClick={() => onFocus(index)}
              title="Xem trước riêng phần bài tập này trên khung PDF"
              aria-label="Xem trước riêng phần bài tập này"
              data-testid={`focus-section-expanded-btn-${index}`}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all ml-0.5 ${
                isFocused
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>{isFocused ? '🎯 Đang xem' : '👁️ Xem riêng'}</span>
            </button>
          )}
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
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
          <label className="block text-xs font-semibold text-slate-700">
            Loại Bài Tập (Exercise Type)
          </label>
          <button
            type="button"
            onClick={() => setIsTypeManagerOpen(true)}
            data-testid={`composite-open-type-manager-btn-${index}`}
            title="Chỉnh sửa tên và mô tả các loại bài tập theo ý bạn"
            className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-900 hover:underline cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
            <span>Sửa tên & mô tả Loại WS</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {worksheetTypes.map((t) => {
            const isSelected = section.type === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => {
                  const defaultTitles: Partial<Record<WorksheetType, { title: string }>> = {
                    1: { title: 'Reorder the words to make correct sentences' },
                    2: { title: 'Write the words' },
                    3: { title: 'Match picture with word' },
                    4: { title: 'Missing letters' },
                    5: { title: 'Look and read' },
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
                    18: { title: 'Color E green and e red' },
                    19: { title: 'Game: Find and say.' },
                    20: { title: 'Look, read and write' }
                  };
                  const meta = defaultTitles[t.type] || { title: (t as any).title || t.name || 'Worksheet Section' };
                  const isType8 = t.type === 8;
                  const isType11 = t.type === 11;
                  const isType14 = t.type === 14;
                  const isType18 = t.type === 18;
                  const targetLtr = (section.type18TargetLetter || 'E').toUpperCase();
                  const targetLtrLower = (section.type18TargetLetter || 'e').toLowerCase();
                  const title18 = `Color ${targetLtr} ${section.type18ColorUpper || 'green'} and ${targetLtrLower} ${section.type18ColorLower || 'red'}`;

                  const sec14Words = section.selectedWordIndices.map((i) => words[i]).filter(Boolean);
                  const auto14Letter = getMostFrequentLetter(sec14Words.length > 0 ? sec14Words : words, 'V');
                  const isAuto14 = section.targetLetterMode !== 'manual';
                  const activeTarget14 = isAuto14 ? auto14Letter : (section.targetLetter || auto14Letter);
                  const title14 = `Circle the pictures that have letter ${activeTarget14}`;

                  onUpdateSection(index, {
                    type: t.type,
                    title: isType18 ? title18 : (isType14 ? title14 : meta.title),
                    answerMode: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20].includes(t.type) ? (section.answerMode || 'student') : undefined,
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
                    targetLetter: isType14 ? activeTarget14 : section.targetLetter,
                    targetLetterMode: isType14 ? (section.targetLetterMode || 'auto') : section.targetLetterMode,
                    type9Seed: t.type === 9 ? (section.type9Seed || Date.now()) : section.type9Seed,
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
                    type18HighlightTarget: t.type === 18 ? (section.type18HighlightTarget || 'none') : section.type18HighlightTarget,
                    type19MazeMode: t.type === 19 ? (section.type19MazeMode || 'single_goal') : section.type19MazeMode,
                    type19WallColor: t.type === 19 ? (section.type19WallColor || 'black_white') : section.type19WallColor,
                    type19EntranceCharacter: t.type === 19 ? (section.type19EntranceCharacter || 'boy') : section.type19EntranceCharacter,
                    type19TargetItem: t.type === 19 ? (section.type19TargetItem || 'box') : section.type19TargetItem,
                    type19SentenceStem: t.type === 19 ? (section.type19SentenceStem || "There's a _____.") : section.type19SentenceStem,
                    type19CornerStyle: t.type === 19 ? (section.type19CornerStyle || 'rounded') : section.type19CornerStyle,
                    type19WallThickness: t.type === 19 ? (section.type19WallThickness || 'medium') : section.type19WallThickness,
                    type19MazeSeed: t.type === 19 ? (section.type19MazeSeed || Date.now()) : section.type19MazeSeed,
                    type19HintMode: t.type === 19 ? (section.type19HintMode || 'missing_intersect') : section.type19HintMode,
                    type19GridBorder: t.type === 19 ? (section.type19GridBorder || 'full') : section.type19GridBorder,
                    type19LineStyle: t.type === 19 ? (section.type19LineStyle || 'solid') : section.type19LineStyle,
                    type19BorderColor: t.type === 19 ? (section.type19BorderColor || 'orange') : section.type19BorderColor,
                    type19PuzzlesPerPage: t.type === 19 ? (section.type19PuzzlesPerPage || 2) : section.type19PuzzlesPerPage,
                    type19Casing: t.type === 19 ? (section.type19Casing || 'uppercase') : section.type19Casing,
                    type19ShowClueImage: t.type === 19 ? (section.type19ShowClueImage !== false) : section.type19ShowClueImage,
                    type19ShowClueNumber: t.type === 19 ? (section.type19ShowClueNumber !== false) : section.type19ShowClueNumber,
                    type19ShowClueText: t.type === 19 ? (section.type19ShowClueText !== false) : section.type19ShowClueText,
                    type20HintMode: t.type === 20 ? (section.type20HintMode || 'all_blank') : section.type20HintMode,
                    type20GridBorder: t.type === 20 ? (section.type20GridBorder || 'full') : section.type20GridBorder,
                    type20LineStyle: t.type === 20 ? (section.type20LineStyle || 'solid') : section.type20LineStyle,
                    type20BorderColor: t.type === 20 ? (section.type20BorderColor || 'orange') : section.type20BorderColor,
                    type20PuzzlesPerPage: t.type === 20 ? (section.type20PuzzlesPerPage || 2) : section.type20PuzzlesPerPage,
                    type20Casing: t.type === 20 ? (section.type20Casing || 'upper') : section.type20Casing,
                    type20ShowClueImage: t.type === 20 ? (section.type20ShowClueImage !== false) : section.type20ShowClueImage,
                    type20ShowClueNumber: t.type === 20 ? (section.type20ShowClueNumber !== false) : section.type20ShowClueNumber,
                    type20ShowTrace: t.type === 20 ? !!section.type20ShowTrace : section.type20ShowTrace,
                    type20GridMode: t.type === 20 ? (section.type20GridMode || 'connected') : section.type20GridMode,
                    type20HollowArrows: t.type === 20 ? (section.type20HollowArrows !== false) : section.type20HollowArrows,
                    type20Seed: t.type === 20 ? (section.type20Seed || Date.now()) : section.type20Seed
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

          {/* Re-shuffle seed for Type 6 */}
          <div className="pt-2 border-t border-indigo-100/60">
            <button
              type="button"
              onClick={() => onUpdateSection(index, { type6Seed: Date.now() })}
              data-testid={`section-type6-reshuffle-${index}`}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo trộn phương án (Tạo đề mới)</span>
            </button>
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

          {/* Seed Randomizer for Yes/No answer sequence */}
          <div className="flex items-center justify-between p-2 bg-white/80 rounded-lg border border-indigo-100">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 block">Thứ Tự Đáp Án Ngẫu Nhiên</span>
              <span className="text-[10px] text-slate-500 block">Mỗi lần bấm sẽ đảo vị trí Yes/No đồng bộ</span>
            </div>
            <button
              type="button"
              data-testid={`section-type9-randomize-seed-btn-${index}`}
              onClick={() => onUpdateSection(index, { type9Seed: Date.now() })}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              🎲 Đổi bộ đáp án
            </button>
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

          {/* Re-shuffle seed for Type 3 */}
          <div className="pt-2 border-t border-emerald-200/60">
            <button
              type="button"
              onClick={() => onUpdateSection(index, { type3Seed: Date.now() })}
              data-testid={`section-type3-reshuffle-${index}`}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo trộn vị trí nối (Tạo đề mới)</span>
            </button>
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
      {section.type === 14 && (() => {
        const secWords = section.selectedWordIndices.map((i) => words[i]).filter(Boolean);
        const autoLetter = getMostFrequentLetter(secWords.length > 0 ? secWords : words, 'V');
        const stats = getLetterFrequencyStats(secWords.length > 0 ? secWords : words);
        const isAuto = section.targetLetterMode !== 'manual';
        const currentTarget = (isAuto ? autoLetter : (section.targetLetter || autoLetter || 'V')).trim().toUpperCase();
        const topStat = stats.find((s) => s.letter === currentTarget) || (stats.length > 0 ? stats[0] : null);

        return (
          <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
              <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                <span>🔤</span> Tuỳ Chọn Bài Tập Khoanh Tranh (Loại 14)
              </span>
              <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                Lưới 4 cột
              </span>
            </div>

            {/* Target Letter Mode Switcher */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Chế Độ Chọn Chữ Cái Mục Tiêu
                </label>
                <span className="text-[11px] font-bold text-indigo-600">
                  {isAuto ? '⚡ Tự động (Xuất hiện nhiều nhất)' : '✍️ Chọn thủ công'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSection(index, {
                      targetLetterMode: 'auto',
                      targetLetter: autoLetter,
                      title: `Circle the pictures that have letter ${autoLetter}`
                    });
                  }}
                  data-testid={`section-type14-mode-auto-${index}`}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    isAuto
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>⚡ Tự Động (Mặc định)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSection(index, {
                      targetLetterMode: 'manual',
                      targetLetter: currentTarget
                    });
                  }}
                  data-testid={`section-type14-mode-manual-${index}`}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 ${
                    !isAuto
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span>✍️ Chọn Thủ Công</span>
                </button>
              </div>

              {/* Auto stats badge banner */}
              {isAuto && (
                <div
                  data-testid={`section-type14-auto-letter-badge-${index}`}
                  className="p-2.5 rounded-lg bg-indigo-100/70 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-md bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-xs">
                      {autoLetter}
                    </span>
                    <div>
                      <span className="font-bold">Chữ cái tự động: {autoLetter}</span>
                      <span className="text-[11px] text-indigo-700 block">
                        {topStat ? `Xuất hiện trong ${topStat.wordCount}/${secWords.length} từ (${topStat.charCount} lần)` : 'Được chọn từ danh sách từ vựng'}
                      </span>
                    </div>
                  </div>
                  {stats.length > 1 && (
                    <div className="flex gap-1 text-[10px]">
                      {stats.slice(0, 3).map((st) => (
                        <span key={st.letter} className="px-1.5 py-0.5 rounded bg-white text-indigo-700 font-semibold border border-indigo-200">
                          {st.letter}: {st.wordCount}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Target Letter Input + 26 A-Z Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Chữ Cái Mục Tiêu (Target Letter) {isAuto && <span className="text-[11px] text-slate-400 font-normal">(Bấm chữ bất kỳ để chuyển sang Thủ công)</span>}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={currentTarget}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    onUpdateSection(index, {
                      targetLetter: val,
                      targetLetterMode: 'manual',
                      title: `Circle the pictures that have letter ${val}`
                    });
                  }}
                  placeholder="V"
                  data-testid={`section-target-letter-${index}`}
                  className="w-16 px-3 py-1.5 text-center font-bold text-base bg-white border border-slate-300 rounded-lg text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex flex-wrap gap-1 flex-1">
                  {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((lettr) => {
                    const isSelected = currentTarget === lettr || currentTarget.split(/[\s,/\\|_-]+/).includes(lettr);
                    return (
                      <button
                        key={lettr}
                        type="button"
                        onClick={() => {
                          onUpdateSection(index, {
                            targetLetter: lettr,
                            targetLetterMode: 'manual',
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
                {isAuto
                  ? 'Đang ở chế độ Tự Động: Chữ cái mục tiêu tự động đồng bộ theo từ vựng khi đổi từ ngẫu nhiên.'
                  : 'Đang ở chế độ Thủ Công: Chữ cái mục tiêu cố định theo lựa chọn của bạn.'}
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
        );
      })()}

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
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Phông Chữ Từ Gợi Ý
              </label>
              <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                {section.sentenceWordsFont === 'Andika' ? 'Andika chuẩn tiểu học' : 'Theo bài tập'}
              </span>
            </div>
            <select
              value={section.sentenceWordsFont || 'inherit'}
              onChange={(e) => onUpdateSection(index, { sentenceWordsFont: e.target.value as 'inherit' | 'Andika' })}
              data-testid={`section-words-font-${index}`}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
            >
              <option value="inherit">Theo bài tập</option>
              <option value="Andika">Andika chuẩn tiểu học</option>
            </select>
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
              {section.answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
            </span>
          </div>

          {/* Seed Randomizer for A/B & distractor answer sequence */}
          <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg border border-indigo-100">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-slate-800 block">Thứ Tự Đáp Án Ngẫu Nhiên</span>
              <span className="text-[10px] text-slate-500 block">Mỗi lần bấm sẽ đảo vị trí A/B & tranh nhiễu và đồng bộ đáp án</span>
            </div>
            <button
              type="button"
              data-testid={`section-type15-randomize-seed-btn-${index}`}
              onClick={() => onUpdateSection(index, { type15Seed: Date.now() + Math.floor(Math.random() * 10000) })}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RefreshCw className="w-3 h-3" />
              🎲 Đổi bộ đáp án
            </button>
          </div>

          {/* Answer Mode Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Đáp Án
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'student' as const, label: 'Học sinh' },
                { value: 'answer' as const, label: 'Đáp án' }
              ].map((opt) => {
                const isActive = (section.answerMode || 'student') === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onUpdateSection(index, {
                        answerMode: opt.value
                      })
                    }
                    data-testid={`section-type15-answermode-${opt.value}-${index}`}
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

      {/* Type 19: Vocabulary Maze Puzzle (Mê Cung Từ Vựng SGK) */}
      {section.type === 19 && (
        <div data-testid={`section-type19-options-panel-${index}`} className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200/80 space-y-3.5">
          <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <span>🌀</span> Cấu Hình Mê Cung Từ Vựng (Loại 19)
            </span>
            <span className="text-[11px] text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded font-semibold">
              Chuẩn SGK Tiếng Anh
            </span>
          </div>

          {/* 1. Dạng Mê Cung */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Dạng Mê Cung
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { value: 'single_goal', title: '🎯 Dạng 1: Tìm Đến Đích', desc: 'Đi qua từ Bộ chính tới đích, từ Bộ ôn tập ở lối cụt' },
                { value: 'multi_exit', title: '🔀 Dạng 2: Rẽ Nhánh Ra Cửa', desc: 'Có 2-4 lối thoát dẫn tới đồ vật' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type19MazeMode: opt.value as Type19MazeMode })}
                  data-testid={`section-type19-mode-${opt.value}-${index}`}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    (section.type19MazeMode || 'single_goal') === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.title}</div>
                  <div className={`text-[10px] mt-0.5 ${(section.type19MazeMode || 'single_goal') === opt.value ? 'text-emerald-100' : 'text-slate-500'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Nhân Vật & Mục Tiêu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Nhân Vật Lối Vào
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white/50 rounded-lg border border-slate-200">
                {ALL_ENTRANCE_CHARACTERS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type19EntranceCharacter: c.value as Type19EntranceCharacter })}
                    data-testid={`section-type19-entrance-${c.value}-${index}`}
                    title={c.label}
                    className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                      (section.type19EntranceCharacter || 'ben') === c.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {(c as any).avatarUrl ? (
                      <img
                        src={(c as any).avatarUrl}
                        alt={c.label}
                        loading="eager"
                        className="w-6 h-6 object-contain rounded"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-sm">{c.label.split(' ')[0]}</span>
                    )}
                    <span className="truncate w-full text-center text-[10px] leading-tight">
                      {c.label.split(' ').slice(1).join(' ') || c.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {(section.type19MazeMode || 'single_goal') === 'multi_exit' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Bóng Thoại (Gợi Ý Câu)
                </label>
                <input
                  type="text"
                  value={section.type19SentenceStem || "There's a _____."}
                  onChange={(e) => onUpdateSection(index, { type19SentenceStem: e.target.value })}
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                  placeholder="There's a _____."
                />
              </div>
            )}
          </div>

          {/* 3. Màu Sắc & Ngẫu Nhiên */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Màu Tường Mê Cung
              </label>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { value: 'black_white', label: 'Đen-Trắng', color: '#334155' },
                  { value: 'orange', label: 'Cam SGK', color: '#ea580c' },
                  { value: 'blue', label: 'Xanh Lam', color: '#0284c7' },
                  { value: 'purple', label: 'Tím', color: '#9333ea' }
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onClick={() => onUpdateSection(index, { type19WallColor: c.value as Type19WallColor })}
                    data-testid={`section-type19-wall-color-${c.value}-${index}`}
                    className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all text-center ${
                      (section.type19WallColor || 'black_white') === c.value
                        ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 shadow-xs font-bold'
                        : 'bg-white/70 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-[9px] truncate max-w-full">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Độ Dày Tường
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'thin', label: 'Mỏng' },
                  { value: 'medium', label: 'Vừa' },
                  { value: 'thick', label: 'Dày' }
                ].map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type19WallThickness: w.value as Type19WallThickness })}
                    data-testid={`section-type19-thickness-${w.value}-${index}`}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                      (section.type19WallThickness || 'medium') === w.value
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Đổi Hình Mê Cung
              </label>
              <button
                type="button"
                onClick={() => onUpdateSection(index, { type19MazeSeed: Math.floor(Math.random() * 100000) })}
                data-testid={`section-type19-randomize-seed-${index}`}
                className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <span>🎲</span> Đổi Mẫu Mê Cung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Type 20 Criss-Cross Words Options Panel */}
      {section.type === 20 && (
        <div
          data-testid={`section-type20-options-panel-${index}`}
          className="mt-4 pt-4 border-t border-slate-200/80 space-y-3.5 bg-amber-50/50 -mx-4 -mb-4 p-4 rounded-b-xl border-b border-x"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
              <span>🧩</span> Tùy Chọn Ô Chữ Giao Nhau (Loại 20)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const freshSeed = Date.now() + Math.floor(Math.random() * 10000);
                  onUpdateSection(index, { type20Seed: freshSeed });
                }}
                data-testid={`section-type20-randomize-seed-${index}`}
                className="px-2 py-0.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-semibold rounded-lg border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                title="Sinh ngẫu nhiên cách giao nhau mới giữa các từ"
              >
                <span>🎲 Đổi Bố Cục</span>
              </button>
              <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded-full">
                Chuẩn SGK Look, read and write
              </span>
            </div>
          </div>

          {/* 0. Kiểu Bố Cục Ô Chữ */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Kiểu Bố Cục Ô Chữ (Crossword Layout Mode)
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { value: 'connected', label: '🧩 Lưới Liên Hoàn (Đa từ)', desc: 'Ghép nhiều từ như YourHomework.net' },
                { value: 'pairs', label: '🔲 Cặp Từ Mini (2 từ)', desc: 'Khung 2 từ giao nhau' }
              ].map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type20GridMode: m.value as Type20GridMode })}
                  data-testid={`section-type20-grid-mode-${m.value}-${index}`}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    (section.type20GridMode || 'connected') === m.value
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{m.label}</div>
                  <div className={`text-[10px] mt-0.5 ${(section.type20GridMode || 'connected') === m.value ? 'text-amber-100' : 'text-slate-500'}`}>
                    {m.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 1. Hint Mode */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Chế Độ Khuyết Chữ (Hint Mode)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { value: 'all_blank', label: '⭕ Trống toàn bộ (Chuẩn)', desc: '100% ô trống cho HS tự viết' },
                { value: 'intersection_blank', label: '🎯 Khuyết ô giao nhau', desc: 'Có chữ khác, điền ô giao' },
                { value: 'missing_vowels', label: '🔤 Khuyết nguyên âm', desc: 'A, E, I, O, U' },
                { value: 'full_answer', label: '👁️ Đầy đủ chữ', desc: 'Đáp án / Mẫu đọc' }
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdateSection(index, { type20HintMode: opt.value as Type20HintMode })}
                  data-testid={`section-type20-hint-mode-${opt.value}-${index}`}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    (section.type20HintMode || 'all_blank') === opt.value
                      ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className={`text-[10px] mt-0.5 ${(section.type20HintMode || 'all_blank') === opt.value ? 'text-amber-100' : 'text-slate-500'}`}>
                    {opt.desc}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Grid Border & Line Style */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kiểu Viền Ô Chữ
              </label>
              <div className="grid grid-cols-3 gap-1">
                {[
                  { value: 'full', label: '⏹️ Đầy đủ' },
                  { value: 'outerOnly', label: '🔲 Chỉ viền ngoài' },
                  { value: 'none', label: '🚫 Không viền' }
                ].map((b) => (
                  <button
                    key={b.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type20GridBorder: b.value as Type20GridBorder })}
                    data-testid={`section-type20-grid-border-${b.value}-${index}`}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                      (section.type20GridBorder || 'full') === b.value
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kiểu Nét Vẽ (Tham khảo Loại 13)
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: 'solid', label: '━ Nét liền' },
                  { value: 'dotted', label: '⋯ Chấm đứt (Loại 13)' }
                ].map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type20LineStyle: l.value as Type20LineStyle })}
                    data-testid={`section-type20-line-style-${l.value}-${index}`}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                      (section.type20LineStyle || 'solid') === l.value
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Border Color & Casing */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Màu Sắc Viền Ô Chữ
              </label>
              <div className="grid grid-cols-5 gap-1">
                {[
                  { value: 'orange', label: 'Cam', color: 'bg-orange-500' },
                  { value: 'amber', label: 'Hổ phách', color: 'bg-amber-500' },
                  { value: 'slate', label: 'Xám', color: 'bg-slate-600' },
                  { value: 'blue', label: 'Lam', color: 'bg-blue-600' },
                  { value: 'indigo', label: 'Chàm', color: 'bg-indigo-600' },
                  { value: 'green', label: 'Lục', color: 'bg-green-600' },
                  { value: 'emerald', label: 'Ngọc', color: 'bg-emerald-500' },
                  { value: 'purple', label: 'Tím', color: 'bg-purple-600' },
                  { value: 'red', label: 'Đỏ', color: 'bg-red-600' }
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type20BorderColor: c.value as Type20BorderColor })}
                    data-testid={`section-type20-color-${c.value}-${index}`}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
                      (section.type20BorderColor || 'orange') === c.value
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.color} inline-block`} />
                    <span>{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Kiểu Chữ Cái
              </label>
              <div className="grid grid-cols-2 gap-1">
                {[
                  { value: 'upper', label: 'IN HOA (ABC)' },
                  { value: 'lower', label: 'thường (abc)' }
                ].map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => onUpdateSection(index, { type20Casing: c.value as Type20Casing })}
                    data-testid={`section-type20-casing-${c.value}-${index}`}
                    className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                      (section.type20Casing || 'upper') === c.value
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Clue Display Toggles */}
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={section.type20ShowClueImage !== false}
                onChange={(e) => onUpdateSection(index, { type20ShowClueImage: e.target.checked })}
                data-testid={`section-type20-show-clue-image-${index}`}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span>🖼️ Hiện tranh gợi ý</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={section.type20ShowClueNumber !== false}
                onChange={(e) => onUpdateSection(index, { type20ShowClueNumber: e.target.checked })}
                data-testid={`section-type20-show-clue-number-${index}`}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span>🔢 Đánh số thứ tự (Bỏ chọn để Bỏ đánh số)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={section.type20HollowArrows !== false}
                onChange={(e) => onUpdateSection(index, { type20HollowArrows: e.target.checked })}
                data-testid={`section-type20-hollow-arrows-${index}`}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span>🏹 Mũi tên nét rỗng (Tiết kiệm mực in)</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={!!section.type20ShowTrace}
                onChange={(e) => onUpdateSection(index, { type20ShowTrace: e.target.checked })}
                data-testid={`section-type20-show-trace-${index}`}
                className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span>✏️ Chữ mờ cho học sinh tập tô</span>
            </label>
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
            <span
              className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold border border-slate-200"
              title={`Ước tính chiều cao phần bài tập này: ~${sectionDims.totalHeightMm}mm (chiếm ~${(sectionDims.totalHeightMm / (isA5 ? 174 : 261)).toFixed(1)} trang ${paperSize.toUpperCase()})`}
            >
              📏 ~{sectionDims.totalHeightMm}mm
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

        {/* Quick Order Actions Toolbar */}
        {isVocabExpanded && (
          <div className="flex items-center justify-between gap-2 p-2 bg-indigo-50/70 rounded-xl border border-indigo-100 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" /> Thứ tự in:
              </span>
              <button
                type="button"
                onClick={handleSortAsc}
                disabled={section.selectedWordIndices.length <= 1}
                data-testid={`section-sort-asc-btn-${index}`}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Sắp xếp theo bảng chữ cái A-Z"
              >
                A → Z
              </button>
              <button
                type="button"
                onClick={handleSortDesc}
                disabled={section.selectedWordIndices.length <= 1}
                data-testid={`section-sort-desc-btn-${index}`}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-all shadow-2xs cursor-pointer active:scale-95"
                title="Sắp xếp ngược Z-A"
              >
                Z → A
              </button>
              <button
                type="button"
                onClick={handleShuffleOrder}
                disabled={section.selectedWordIndices.length <= 1}
                data-testid={`section-shuffle-order-btn-${index}`}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 disabled:opacity-40 text-indigo-700 text-[11px] font-bold border border-indigo-200 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                title="Xáo trộn ngẫu nhiên thứ tự các từ đã chọn"
              >
                <Shuffle className="w-3 h-3 text-indigo-600" /> Xáo trộn
              </button>
              <button
                type="button"
                onClick={handleResetOrder}
                disabled={section.selectedWordIndices.length <= 1}
                data-testid={`section-reset-order-btn-${index}`}
                className="px-2 py-0.5 rounded-lg bg-white hover:bg-indigo-100 disabled:opacity-40 text-slate-700 text-[11px] font-bold border border-slate-200 transition-all shadow-2xs cursor-pointer active:scale-95 flex items-center gap-1"
                title="Trả về thứ tự gốc ban đầu của bộ từ"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" /> Thứ tự gốc
              </button>
            </div>
            <span className="text-[10px] text-indigo-700 font-medium hidden sm:inline">
              Đã chọn: {section.selectedWordIndices.length} từ
            </span>
          </div>
        )}

        {/* Selected Sequence Preview Chips with Reorder Buttons */}
        {isVocabExpanded && section.selectedWordIndices.length > 0 && (
          <div className="p-2.5 bg-white rounded-xl border border-indigo-100 shadow-2xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1">
                <span>Thứ tự từ sẽ in trên PDF:</span>
              </span>
              <span className="text-[10px] text-slate-400">Bấm ◀ ▶ để đổi chỗ</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap max-h-32 overflow-y-auto pr-1">
              {section.selectedWordIndices.map((wIdx, pos) => {
                const wordItem = words[wIdx];
                if (!wordItem) return null;
                return (
                  <div
                    key={`selected-chip-${wIdx}-${pos}`}
                    className="flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-indigo-50/80 border border-indigo-200 text-xs font-semibold text-indigo-900 shadow-2xs"
                  >
                    <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {pos + 1}
                    </span>
                    <span className="truncate max-w-[110px]" title={wordItem.term}>
                      {wordItem.term}
                    </span>
                    <div className="flex items-center ml-0.5 gap-0.5">
                      <button
                        type="button"
                        onClick={() => handleMoveWord(pos, 'prev')}
                        disabled={pos === 0}
                        data-testid={`section-word-prev-${index}-${pos}`}
                        className="w-4 h-4 flex items-center justify-center rounded bg-white/70 text-slate-500 hover:text-indigo-700 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-[10px]"
                        title="Đưa từ này lên trước"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveWord(pos, 'next')}
                        disabled={pos === section.selectedWordIndices.length - 1}
                        data-testid={`section-word-next-${index}-${pos}`}
                        className="w-4 h-4 flex items-center justify-center rounded bg-white/70 text-slate-500 hover:text-indigo-700 hover:bg-white disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer text-[10px]"
                        title="Đưa từ này về sau"
                      >
                        ▶
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWord(wIdx)}
                        className="w-4 h-4 flex items-center justify-center rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer ml-0.5 text-[10px]"
                        title="Bỏ từ này"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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

      <WorksheetTypeManagerModal
        isOpen={isTypeManagerOpen}
        onClose={() => setIsTypeManagerOpen(false)}
        initialFocusType={section.type}
      />
    </div>
  );
}
