import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  ExternalLink,
  BookOpen,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  Type as TypeIcon,
  Palette,
  Eye,
  Save,
  Check,
  CheckCircle2,
  X,
  AlertCircle,
  Link as LinkIcon,
  ArrowLeft,
  Plus,
  LayoutGrid,
  ListFilter,
  Target,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { getSets, saveSet, getImageFile } from '../lib/storage';
import { WordSet } from '../types';
import { generateId } from '../lib/utils';
import SmartImage from '../components/ui/SmartImage';
import { ALL_ENTRANCE_CHARACTERS } from '../utils/worksheetCharactersData';
import WorksheetModeSwitch from '../components/worksheet/WorksheetModeSwitch';
import CompositeSectionCard, { UICompositeSection } from '../components/worksheet/CompositeSectionCard';
import CompositeSectionTabs from '../components/worksheet/CompositeSectionTabs';
import CompositeQuickNav from '../components/worksheet/CompositeQuickNav';
import { createAllWorksheetSections } from '../utils/worksheetCompositeHelpers';
import GlobalMultiSetLoader from '../components/worksheet/GlobalMultiSetLoader';
import MultiDeckQuickAddModal from '../components/worksheet/MultiDeckQuickAddModal';
import WorksheetTemplateModal from '../components/worksheet/WorksheetTemplateModal';
import {
  saveCustomTemplate,
  WorksheetTemplate,
  WorksheetTemplateSection
} from '../utils/worksheetTemplates';
import {
  loadFromMultipleWordSets,
  deduplicateWords,
  normalizeTerm,
  mergeSectionWords,
  reallocateWordsForSections,
  applyTemplateToSections
} from '../utils/worksheetVocabEngine';
import { DEFAULT_SAMPLE_WORDS } from '../utils/worksheetSampleData';
import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  CompositeWorksheetConfig,
  WORKSHEET_TYPES,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
  BLANK_MODE_OPTIONS,
  TYPE4_LAYOUT_OPTIONS,
  TYPE4_COLUMN_OPTIONS,
  SPACING_OPTIONS,
  IMAGE_SIZE_OPTIONS,
  BlankMode,
  Type4LayoutMode,
  Type4ColumnMode,
  ChoiceLayout,
  WorksheetType,
  WorksheetWord,
  WordsearchDirection,
  WordsearchHintType,
  WordsearchGridBorder,
  WordsearchCase,
  MatchHintMode,
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
} from '../utils/worksheetGenerator';

// Sensible default sections generator for Composite mode
export const createDefaultCompositeSections = (vocabWords: WorksheetWord[]): UICompositeSection[] => {
  const total = vocabWords ? vocabWords.length : 0;
  if (total === 0) {
    return [
      {
        id: generateId(),
        type: 4,
        title: 'Missing letters',
        targetWordCount: 4,
        selectedWordIndices: [],
        blankMode: 'vowels',
        pageBreakBefore: false,
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 0,
        imageSize: 12.7
      },
      {
        id: generateId(),
        type: 6,
        title: 'Multiple choice',
        targetWordCount: 4,
        selectedWordIndices: [],
        blankMode: 'vowels',
        pageBreakBefore: false,
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 0,
        imageSize: 12.7,
        choiceCount: 3,
        choiceLayout: 'vertical'
      }
    ];
  }

  const part1Count = total >= 8 ? 4 : Math.ceil(total / 2);
  const part1Indices = Array.from({ length: part1Count }, (_, i) => i);
  const part2Indices = total >= 8
    ? Array.from({ length: Math.min(total - 4, 4) }, (_, i) => i + 4)
    : (total > part1Count
        ? Array.from({ length: total - part1Count }, (_, i) => i + part1Count)
        : part1Indices);

  return [
    {
      id: generateId(),
      type: 4,
      title: 'Missing letters',
      targetWordCount: part1Indices.length || 4,
      selectedWordIndices: part1Indices,
      blankMode: 'vowels',
      pageBreakBefore: false,
      fontFamily: 'r0c0i Linotte',
      fontSize: 12,
      spacing: 0,
      imageSize: 12.7
    },
    {
      id: generateId(),
      type: 6,
      title: 'Multiple choice',
      targetWordCount: part2Indices.length || 4,
      selectedWordIndices: part2Indices,
      blankMode: 'vowels',
      pageBreakBefore: false,
      fontFamily: 'r0c0i Linotte',
      fontSize: 12,
      spacing: 0,
      imageSize: 12.7,
      choiceCount: 3,
      choiceLayout: 'vertical'
    }
  ];
};

export default function WorksheetGenerator() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialUrl = searchParams.get('url') || searchParams.get('vocab');
  const paramMode = searchParams.get('mode');
  const paramSource = searchParams.get('source');

  // Mode: 'link' (YourHomework link), 'library' (Existing WordSet), or 'multi' (Multiple sets from library)
  // Mặc định: 'multi' (Nhiều bộ thẻ) khi vào app chọn Worksheet, trừ khi có id/url/source query param cụ thể
  const [sourceMode, setSourceMode] = useState<'link' | 'library' | 'multi'>(() => {
    if (paramSource === 'link' || initialUrl) return 'link';
    if (paramSource === 'library' || id) return 'library';
    if (paramSource === 'multi') return 'multi';
    return 'multi';
  });
  const [lastLoadedMultiCount, setLastLoadedMultiCount] = useState<number | null>(null);
  const [quickAddSectionIndex, setQuickAddSectionIndex] = useState<number | null>(null);
  const [linkInput, setLinkInput] = useState<string>(
    initialUrl || 'https://yourhomework.net/vocab/589984573'
  );

  // Library sets
  const [librarySets, setLibrarySets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>(id || '');

  // Worksheet Mode: 'single' (Traditional single type) | 'composite' (Multi-section document)
  // Mặc định: 'composite' (Worksheet tổng hợp) khi vào app chọn Worksheet, trừ khi có mode param cụ thể
  const [worksheetMode, setWorksheetMode] = useState<'single' | 'composite'>(
    paramMode === 'single' ? 'single' : 'composite'
  );
  const [compositeSections, setCompositeSections] = useState<UICompositeSection[]>(() => createDefaultCompositeSections(DEFAULT_SAMPLE_WORDS));
  const [compositeViewMode, setCompositeViewMode] = useState<'tabs' | 'accordion'>('tabs');
  const [activeSectionTab, setActiveSectionTab] = useState<number>(0);
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(new Set());
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState<number | null>(null);
  const [compositePreviewScope, setCompositePreviewScope] = useState<'focused' | 'all'>('focused');
  const [focusedSectionIndex, setFocusedSectionIndex] = useState<number>(0);

  // Current Vocabulary Data
  const [title, setTitle] = useState<string>('Lớp 3 - Unit 6');
  const [sourceUrl, setSourceUrl] = useState<string>('https://yourhomework.net');
  const [words, setWords] = useState<WorksheetWord[]>(DEFAULT_SAMPLE_WORDS);
  const [selectedWordIndices, setSelectedWordIndices] = useState<Set<number>>(new Set([0, 1, 2, 3, 4, 5]));

  // Worksheet Configuration
  const [worksheetType, setWorksheetType] = useState<WorksheetType>(4);
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots'>('r0c0i Linotte');
  const [blankMode, setBlankMode] = useState<BlankMode>('vowels');
  const [type4LayoutMode, setType4LayoutMode] = useState<Type4LayoutMode>('grid');
  const [type4ColumnMode, setType4ColumnMode] = useState<Type4ColumnMode>('both_trace_first');
  const [type4TraceFontSize, setType4TraceFontSize] = useState<number>(28);
  const [type4AlphabetTargetLetter, setType4AlphabetTargetLetter] = useState<string>('c');
  const [spacing, setSpacing] = useState<number>(0);
  const [imageSize, setImageSize] = useState<number>(12.7);
  const [choiceCount, setChoiceCount] = useState<2 | 3>(3);
  const [choiceLayout, setChoiceLayout] = useState<ChoiceLayout>('vertical');
  const [matchMode, setMatchMode] = useState<'word' | 'sentence' | 'look_match_write'>('word');
  const [matchHint, setMatchHint] = useState<MatchHintMode>('none');
  const [lookMatchWriteShuffleSuffix, setLookMatchWriteShuffleSuffix] = useState<boolean>(false);
  const [lookMatchWriteMode, setLookMatchWriteMode] = useState<'trace' | 'blank'>('trace');
  const [lookMatchWriteShowBaseline, setLookMatchWriteShowBaseline] = useState<boolean>(true);
  const [lookMatchWriteTraceFontSize, setLookMatchWriteTraceFontSize] = useState<number>(28);
  const [wordsearchDirections, setWordsearchDirections] = useState<WordsearchDirection[]>([
    'horizontal',
    'vertical',
    'diagonalDown'
  ]);
  const [wordsearchHintType, setWordsearchHintType] = useState<WordsearchHintType>('word');
  const [wordsearchGridSize, setWordsearchGridSize] = useState<number | 'auto'>('auto');
  const [wordsearchGridBorder, setWordsearchGridBorder] = useState<WordsearchGridBorder>('none');
  const [wordsearchCase, setWordsearchCase] = useState<WordsearchCase>('lower');
  const [wordsearchSeed, setWordsearchSeed] = useState<number>(() => Date.now());
  const [targetLetter, setTargetLetter] = useState<string>('V');
  const [showWordLabels, setShowWordLabels] = useState<boolean>(true);
  const [sentenceScramble, setSentenceScramble] = useState<boolean>(true);
  const [sentenceSeparator, setSentenceSeparator] = useState<'space' | 'slash'>('space');
  const [sentenceHintStyle, setSentenceHintStyle] = useState<'underscores' | 'dots' | 'trace'>('underscores');
  const [sentenceTraceFontSize, setSentenceTraceFontSize] = useState<number>(28);
  const [sentenceWordsFont, setSentenceWordsFont] = useState<'inherit' | 'Andika'>('inherit');
  const [type15NumberStyle, setType15NumberStyle] = useState<'none' | 'traditional'>('none');
  const [type15Border, setType15Border] = useState<'full' | 'outerOnly' | 'none'>('full');
  const [type15ChoiceMode, setType15ChoiceMode] = useState<'ab' | 'checkbox' | 'none'>('ab');
  const [type15LetterBandBg, setType15LetterBandBg] = useState<'tint' | 'white'>('white');
  const [type16SoundMode, setType16SoundMode] = useState<Type16SoundMode>('beginning');
  const [type16ChoiceCount, setType16ChoiceCount] = useState<Type16ChoiceCount>(3);
  const [type16Layout, setType16Layout] = useState<Type16Layout>('lettersLeft');
  const [type16LetterCase, setType16LetterCase] = useState<Type16LetterCase>('lower');
  const [type16Border, setType16Border] = useState<Type16Border>('none');
  const [type17TaskMode, setType17TaskMode] = useState<Type17TaskMode>('color');
  const [type17Border, setType17Border] = useState<Type17Border>('full');
  const [type17CardBorder, setType17CardBorder] = useState<Type17CardBorder>('none');
  const [type17LetterCase, setType17LetterCase] = useState<Type17LetterCase>('lower');
  const [type17StripLength, setType17StripLength] = useState<Type17StripLength>('auto');
  const [type17HighlightTarget, setType17HighlightTarget] = useState<Type17HighlightTarget>('none');
  const [type17ShowExample, setType17ShowExample] = useState<boolean>(true);
  const [type18TargetLetter, setType18TargetLetter] = useState<string>('E');
  const [type18Mode, setType18Mode] = useState<Type18Mode>('both');
  const [type18ColorUpper, setType18ColorUpper] = useState<string>('green');
  const [type18ColorLower, setType18ColorLower] = useState<string>('red');
  const [type18GridRows, setType18GridRows] = useState<number>(4);
  const [type18GridCols, setType18GridCols] = useState<number>(7);
  const [type18Border, setType18Border] = useState<Type18Border>('rounded');
  const [type18CircleStyle, setType18CircleStyle] = useState<Type18CircleStyle>('solid');
  const [type18DistractorCasing, setType18DistractorCasing] = useState<Type18DistractorCasing>('upper');
  const [type18HighlightTarget, setType18HighlightTarget] = useState<Type18HighlightTarget>('none');
  const [type19MazeMode, setType19MazeMode] = useState<Type19MazeMode>('single_goal');
  const [type19WallColor, setType19WallColor] = useState<Type19WallColor>('black_white');
  const [type19EntranceCharacter, setType19EntranceCharacter] = useState<Type19EntranceCharacter>('boy');
  const [type19TargetItem, setType19TargetItem] = useState<Type19TargetItem>('box');
  const [type19SentenceStem, setType19SentenceStem] = useState<string>("There's a _____.");
  const [type19CornerStyle, setType19CornerStyle] = useState<Type19CornerStyle>('rounded');
  const [type19WallThickness, setType19WallThickness] = useState<Type19WallThickness>('medium');
  const [type19MazeSeed, setType19MazeSeed] = useState<number | string>(42);
  const [type19HintMode, setType19HintMode] = useState<Type19HintMode>('intersection_blank');
  const [type19GridBorder, setType19GridBorder] = useState<Type19GridBorder>('full');
  const [type19LineStyle, setType19LineStyle] = useState<Type19LineStyle>('solid');
  const [type19BorderColor, setType19BorderColor] = useState<Type19BorderColor>('orange');
  const [type19PuzzlesPerPage, setType19PuzzlesPerPage] = useState<Type19PuzzlesPerPage>(2);
  const [type19Casing, setType19Casing] = useState<Type19Casing>('upper');
  const [type19ShowClueImage, setType19ShowClueImage] = useState<boolean>(true);
  const [type19ShowClueNumber, setType19ShowClueNumber] = useState<boolean>(true);
  const [type19ShowTrace, setType19ShowTrace] = useState<boolean>(false);
  const [type20HintMode, setType20HintMode] = useState<Type20HintMode>('all_blank');
  const [type20GridBorder, setType20GridBorder] = useState<Type20GridBorder>('full');
  const [type20LineStyle, setType20LineStyle] = useState<Type20LineStyle>('solid');
  const [type20BorderColor, setType20BorderColor] = useState<Type20BorderColor>('orange');
  const [type20PuzzlesPerPage, setType20PuzzlesPerPage] = useState<Type20PuzzlesPerPage>(2);
  const [type20Casing, setType20Casing] = useState<Type20Casing>('upper');
  const [type20ShowClueImage, setType20ShowClueImage] = useState<boolean>(true);
  const [type20ShowClueNumber, setType20ShowClueNumber] = useState<boolean>(true);
  const [type20ShowTrace, setType20ShowTrace] = useState<boolean>(false);
  const [type20GridMode, setType20GridMode] = useState<Type20GridMode>('connected');
  const [type20HollowArrows, setType20HollowArrows] = useState<boolean>(true);
  const [type20Seed, setType20Seed] = useState<number>(() => Date.now());
  const [type9Seed, setType9Seed] = useState<number>(() => Date.now());
  const [type15Seed, setType15Seed] = useState<number>(() => Date.now());
  const [background, setBackground] = useState<string>('');
  const [showHeader, setShowHeader] = useState<boolean>(false);
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [showImageBorder, setShowImageBorder] = useState<boolean>(false);
  const [showTableGrid, setShowTableGrid] = useState<boolean>(false);
  const [answerMode, setAnswerMode] = useState<'student' | 'answer' | 'both'>('student');

  // Generation state
  const [isLoadingVocab, setIsLoadingVocab] = useState<boolean>(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [savedToLibrarySuccess, setSavedToLibrarySuccess] = useState<boolean>(false);

  // Template Modal State (Milestone 3)
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [initialShowSaveFormInModal, setInitialShowSaveFormInModal] = useState<boolean>(false);
  const [templateSuccessToast, setTemplateSuccessToast] = useState<string | null>(null);

  // Revoke previous PDF Object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [pdfBlobUrl]);


  // Section Management Handlers
  const handleAddSection = () => {
    const nextNum = compositeSections.length + 1;
    const defaultType: WorksheetType = nextNum % 2 === 1 ? 4 : 6;
    const titles: Record<WorksheetType, { title: string }> = {
      1: { title: 'Reorder the words to make correct sentences' },
      2: { title: 'Write the words' },
      3: { title: 'Match picture with word' },
      4: { title: 'Missing letters' },
      5: { title: 'Handwriting practice' },
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
    const meta = titles[defaultType] || { title: 'Worksheet Section' };
    const newSec: UICompositeSection = {
      id: generateId(),
      type: defaultType,
      title: meta.title,
      targetWordCount: words.length > 0 ? Math.min(4, words.length) : 4,
      selectedWordIndices: words.map((_, i) => i),
      blankMode: 'vowels',
      pageBreakBefore: false,
      fontFamily: 'r0c0i Linotte',
      fontSize: 12,
      spacing: 0,
      imageSize: 12.7,
      choiceCount: defaultType === 6 ? 3 : undefined,
      choiceLayout: defaultType === 6 ? 'vertical' : undefined
    };
    const nextSections = [...compositeSections, newSec];
    setCompositeSections(nextSections);

    const newIndex = nextSections.length - 1;
    setActiveSectionTab(newIndex);
    setFocusedSectionIndex(newIndex);

    if (focusMode) {
      const allPrev = new Set(compositeSections.map((s) => s.id));
      setCollapsedSectionIds(allPrev);
    } else {
      setCollapsedSectionIds((prev) => {
        const next = new Set(prev);
        next.delete(newSec.id);
        return next;
      });
    }

    setHighlightedSectionIndex(newIndex);
    setTimeout(() => {
      setHighlightedSectionIndex(null);
    }, 1500);

    setTimeout(() => {
      const el = document.getElementById(`composite-section-card-${newIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    setTimeout(() => {
      handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite', compositePreviewScope, newIndex);
    }, 150);
  };

  const handleAddAllSections = () => {
    const newSections = createAllWorksheetSections(WORKSHEET_TYPES, words);
    const isOnlyDefaultEmpty =
      compositeSections.length <= 2 &&
      compositeSections.every((s) => !s.selectedWordIndices || s.selectedWordIndices.length === 0);

    const nextSections = isOnlyDefaultEmpty ? newSections : [...compositeSections, ...newSections];
    setCompositeSections(nextSections);

    const firstNewIndex = isOnlyDefaultEmpty ? 0 : compositeSections.length;
    setActiveSectionTab(firstNewIndex);
    setFocusedSectionIndex(firstNewIndex);

    if (focusMode) {
      const allPrev = new Set(nextSections.map((s) => s.id));
      setCollapsedSectionIds(allPrev);
    } else {
      setCollapsedSectionIds((prev) => {
        const next = new Set(prev);
        newSections.forEach((s) => next.delete(s.id));
        return next;
      });
    }

    setHighlightedSectionIndex(firstNewIndex);
    setTimeout(() => {
      setHighlightedSectionIndex(null);
    }, 1500);

    setTimeout(() => {
      const el = document.getElementById(`composite-section-card-${firstNewIndex}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 80);

    setTimeout(() => {
      handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite', compositePreviewScope, firstNewIndex);
    }, 150);
  };

  const handleUpdateSection = (index: number, updated: Partial<UICompositeSection>) => {
    let nextSections: UICompositeSection[] = [];
    setCompositeSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      nextSections = next;
      return next;
    });
    setFocusedSectionIndex(index);
    if (
      updated.fontFamily !== undefined ||
      updated.fontSize !== undefined ||
      updated.spacing !== undefined ||
      updated.imageSize !== undefined ||
      updated.choiceCount !== undefined ||
      updated.choiceLayout !== undefined ||
      updated.matchMode !== undefined ||
      updated.lookMatchWriteShuffleSuffix !== undefined ||
      updated.lookMatchWriteMode !== undefined ||
      updated.lookMatchWriteShowBaseline !== undefined ||
      updated.lookMatchWriteTraceFontSize !== undefined ||
      updated.type4LayoutMode !== undefined ||
      updated.type4ColumnMode !== undefined ||
      updated.type4TraceFontSize !== undefined ||
      updated.type4AlphabetTargetLetter !== undefined ||
      updated.type !== undefined ||
      updated.blankMode !== undefined ||
      updated.pageBreakBefore !== undefined ||
      updated.selectedWordIndices !== undefined ||
      updated.targetWordCount !== undefined ||
      updated.type19MazeMode !== undefined ||
      updated.type19WallColor !== undefined ||
      updated.type19WallThickness !== undefined ||
      updated.type19CornerStyle !== undefined ||
      updated.type19EntranceCharacter !== undefined ||
      updated.type19TargetItem !== undefined ||
      updated.type19SentenceStem !== undefined ||
      updated.type19MazeSeed !== undefined ||
      updated.type9Seed !== undefined ||
      updated.type15Seed !== undefined ||
      updated.wordsearchSeed !== undefined ||
      updated.type3Seed !== undefined ||
      updated.answerMode !== undefined
    ) {
      setTimeout(() => {
        handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite', compositePreviewScope, index);
      }, 150);
    }
  };

  const handleMoveUpSection = (index: number) => {
    if (index <= 0) return;
    setCompositeSections((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next;
    });
    if (activeSectionTab === index) {
      setActiveSectionTab(index - 1);
    } else if (activeSectionTab === index - 1) {
      setActiveSectionTab(index);
    }
    if (focusedSectionIndex === index) {
      setFocusedSectionIndex(index - 1);
    } else if (focusedSectionIndex === index - 1) {
      setFocusedSectionIndex(index);
    }
  };

  const handleMoveDownSection = (index: number) => {
    if (index >= compositeSections.length - 1) return;
    setCompositeSections((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next;
    });
    if (activeSectionTab === index) {
      setActiveSectionTab(index + 1);
    } else if (activeSectionTab === index + 1) {
      setActiveSectionTab(index);
    }
    if (focusedSectionIndex === index) {
      setFocusedSectionIndex(index + 1);
    } else if (focusedSectionIndex === index + 1) {
      setFocusedSectionIndex(index);
    }
  };

  const handleDeleteSection = (index: number) => {
    if (compositeSections.length <= 1) return;
    const deletedId = compositeSections[index]?.id;
    setCompositeSections((prev) => prev.filter((_, i) => i !== index));
    if (deletedId) {
      setCollapsedSectionIds((prev) => {
        const next = new Set(prev);
        next.delete(deletedId);
        return next;
      });
    }
    const nextIdx = Math.max(0, Math.min(index, compositeSections.length - 2));
    setActiveSectionTab(nextIdx);
    setFocusedSectionIndex(nextIdx);
  };

  const handleDuplicateSection = (index: number) => {
    const copyId = generateId();
    let nextSections: UICompositeSection[] = [];
    setCompositeSections((prev) => {
      const target = prev[index];
      const copy: UICompositeSection = {
        ...target,
        id: copyId,
        title: `${target.title} (Bản sao)`
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      nextSections = next;
      return next;
    });
    const newIdx = index + 1;
    setActiveSectionTab(newIdx);
    setFocusedSectionIndex(newIdx);
    setHighlightedSectionIndex(newIdx);
    setTimeout(() => {
      setHighlightedSectionIndex(null);
    }, 1500);
    setTimeout(() => {
      handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite', compositePreviewScope, newIdx);
    }, 150);
  };

  const handleTogglePreviewScope = (scope: 'focused' | 'all') => {
    setCompositePreviewScope(scope);
    handleGeneratePreview(undefined, undefined, undefined, undefined, compositeSections, 'composite', scope, focusedSectionIndex);
  };

  const handleFocusSection = (index: number) => {
    const safeIdx = Math.max(0, Math.min(index, compositeSections.length - 1));
    setFocusedSectionIndex(safeIdx);
    setActiveSectionTab(safeIdx);
    setHighlightedSectionIndex(safeIdx);
    if (compositePreviewScope === 'focused') {
      handleGeneratePreview(undefined, undefined, undefined, undefined, compositeSections, 'composite', 'focused', safeIdx);
    }
  };

  const handleNavigateFocusedSection = (newIndex: number) => {
    const safeIdx = Math.max(0, Math.min(newIndex, compositeSections.length - 1));
    setFocusedSectionIndex(safeIdx);
    setActiveSectionTab(safeIdx);
    setHighlightedSectionIndex(safeIdx);
    handleGeneratePreview(undefined, undefined, undefined, undefined, compositeSections, 'composite', 'focused', safeIdx);
  };

  const handleToggleCollapse = (index: number) => {
    const sec = compositeSections[index];
    if (!sec) return;
    const isCurrentlyCollapsed = collapsedSectionIds.has(sec.id);

    if (focusMode) {
      if (isCurrentlyCollapsed) {
        const next = new Set<string>();
        compositeSections.forEach((s, idx) => {
          if (idx !== index) next.add(s.id);
        });
        setCollapsedSectionIds(next);
      } else {
        setCollapsedSectionIds((prev) => {
          const next = new Set(prev);
          next.add(sec.id);
          return next;
        });
      }
    } else {
      setCollapsedSectionIds((prev) => {
        const next = new Set(prev);
        if (next.has(sec.id)) {
          next.delete(sec.id);
        } else {
          next.add(sec.id);
        }
        return next;
      });
    }
  };

  const handleCollapseAll = () => {
    const all = new Set(compositeSections.map((s) => s.id));
    setCollapsedSectionIds(all);
  };

  const handleExpandAll = () => {
    setCollapsedSectionIds(new Set());
  };

  const handleToggleFocusMode = () => {
    setFocusMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        const activeId = compositeSections[activeSectionTab]?.id;
        const collapsed = new Set<string>();
        compositeSections.forEach((s) => {
          if (s.id !== activeId) collapsed.add(s.id);
        });
        setCollapsedSectionIds(collapsed);
      }
      return nextMode;
    });
  };

  const getOtherSectionsWordIndices = (targetIndex: number): Set<number> => {
    const otherSet = new Set<number>();
    compositeSections.forEach((s, idx) => {
      if (idx !== targetIndex && s.selectedWordIndices) {
        s.selectedWordIndices.forEach((wIdx) => otherSet.add(wIdx));
      }
    });
    return otherSet;
  };

  const handleJumpToSection = (index: number) => {
    const sec = compositeSections[index];
    if (!sec) return;

    setFocusedSectionIndex(index);
    if (compositeViewMode === 'tabs') {
      setActiveSectionTab(index);
    } else {
      if (focusMode) {
        const next = new Set<string>();
        compositeSections.forEach((s, idx) => {
          if (idx !== index) next.add(s.id);
        });
        setCollapsedSectionIds(next);
      } else {
        setCollapsedSectionIds((prev) => {
          const next = new Set(prev);
          next.delete(sec.id);
          return next;
        });
      }

      setTimeout(() => {
        const el = document.getElementById(`composite-section-card-${index}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 50);
    }

    setHighlightedSectionIndex(index);
    setTimeout(() => {
      setHighlightedSectionIndex(null);
    }, 1500);

    if (compositePreviewScope === 'focused') {
      handleGeneratePreview(undefined, undefined, undefined, undefined, compositeSections, 'composite', 'focused', index);
    }
  };

  const handleModeChange = (nextMode: 'single' | 'composite') => {
    if (nextMode === worksheetMode) return;
    setWorksheetMode(nextMode);
    if (nextMode === 'composite') {
      let currentSections = compositeSections;
      if (currentSections.length === 0) {
        currentSections = createDefaultCompositeSections(words);
        setCompositeSections(currentSections);
      }
      setTimeout(() => {
        handleGeneratePreview(undefined, undefined, undefined, undefined, currentSections, 'composite');
      }, 150);
    } else {
      setTimeout(() => {
        handleGeneratePreview(undefined, undefined, undefined, undefined, undefined, 'single');
      }, 150);
    }
  };

  // Helper to convert current single worksheet options to a UICompositeSection
  const getCurrentSingleAsCompositeSection = (): UICompositeSection => {
    const activeIndices = selectedWordIndices.size > 0 ? Array.from(selectedWordIndices) : words.map((_, i) => i);
    return {
      id: `sec_single_${generateId()}`,
      type: worksheetType,
      title: title || 'English Worksheet',
      instruction: '',
      selectedWordIndices: activeIndices,
      targetWordCount: activeIndices.length || 4,
      fontSize,
      fontFamily,
      spacing,
      imageSize,
      blankMode,
      choiceCount,
      choiceLayout,
      matchMode,
      matchHint,
      lookMatchWriteShuffleSuffix,
      lookMatchWriteMode,
      lookMatchWriteShowBaseline,
      lookMatchWriteTraceFontSize,
      wordsearchDirections,
      wordsearchHintType,
      wordsearchGridSize,
      wordsearchGridBorder,
      wordsearchCase,
      wordsearchSeed,
      type3Seed: Date.now(),
      type6Seed: Date.now(),
      targetLetter,
      showWordLabels,
      sentenceScramble,
      sentenceSeparator,
      sentenceHintStyle,
      sentenceTraceFontSize,
      sentenceWordsFont,
      type4LayoutMode,
      type4ColumnMode,
      type4TraceFontSize,
      type4AlphabetTargetLetter,
      type15NumberStyle,
      type15Border,
      type15ChoiceMode,
      type15LetterBandBg,
      type15Seed,
      type16SoundMode,
      type16ChoiceCount,
      type16Layout,
      type16LetterCase,
      type16Border,
      type17TaskMode,
      type17Border,
      type17CardBorder,
      type17LetterCase,
      type17StripLength,
      type17HighlightTarget,
      type17ShowExample,
      type18TargetLetter,
      type18Mode,
      type18ColorUpper,
      type18ColorLower,
      type18GridRows,
      type18GridCols,
      type18Border,
      type18CircleStyle,
      type18DistractorCasing,
      type18HighlightTarget,
      type19MazeMode,
      type19WallColor,
      type19EntranceCharacter,
      type19TargetItem,
      type19SentenceStem,
      type19CornerStyle,
      type19WallThickness,
      type19MazeSeed,
      type19HintMode,
      type19GridBorder,
      type19LineStyle,
      type19BorderColor,
      type19PuzzlesPerPage,
      type19Casing,
      type19ShowClueImage,
      type19ShowClueNumber,
      type19ShowClueText: false,
      type19ShowTrace,
      type20HintMode,
      type20GridBorder,
      type20LineStyle,
      type20BorderColor,
      type20PuzzlesPerPage,
      type20Casing,
      type20ShowClueImage,
      type20ShowClueNumber,
      type20ShowClueText: true,
      type20ShowTrace,
      type20GridMode,
      type20HollowArrows,
      type20Seed,
      answerMode
    };
  };

  // Milestone 3: Worksheet Template Handlers
  const handleSaveCurrentAsTemplate = (name: string, description?: string): WorksheetTemplate => {
    const sectionsSource = worksheetMode === 'single'
      ? [getCurrentSingleAsCompositeSection()]
      : (compositeSections && compositeSections.length > 0 ? compositeSections : [getCurrentSingleAsCompositeSection()]);

    const templateSections: WorksheetTemplateSection[] = sectionsSource.map((s) => {
      const cloned = JSON.parse(JSON.stringify(s));
      const wordCount = s.targetWordCount || (s.selectedWordIndices ? s.selectedWordIndices.length : 0) || 4;
      const selectedWordTerms = s.selectedWordIndices && s.selectedWordIndices.length > 0 && words.length > 0
        ? s.selectedWordIndices.map((i) => words[i]?.term).filter(Boolean)
        : s.selectedWordTerms;

      return {
        ...cloned,
        id: s.id || `sec_${generateId()}`,
        type: s.type,
        title: s.title,
        instruction: s.instruction,
        wordCount,
        ...(s.primaryWordCount !== undefined ? { primaryWordCount: s.primaryWordCount } : {}),
        ...(s.reviewWordCount !== undefined ? { reviewWordCount: s.reviewWordCount } : {}),
        selectedWordIndices: s.selectedWordIndices,
        selectedWordTerms
      };
    });

    const saved = saveCustomTemplate({
      name: name.trim(),
      description: description?.trim() || undefined,
      paperSize,
      fontFamily,
      fontSize,
      spacing,
      imageSize,
      background,
      showHeader,
      showFooter,
      showImageBorder,
      showTableGrid,
      answerMode,
      sections: templateSections
    });

    setTemplateSuccessToast(`Đã lưu "${saved.name}" thành Mẫu bài tập!`);
    setTimeout(() => setTemplateSuccessToast(null), 4000);
    return saved;
  };

  const handleApplyTemplate = (template: WorksheetTemplate) => {
    // 1. Update global settings from template
    if (template.paperSize) setPaperSize(template.paperSize);
    if (template.fontFamily) setFontFamily(template.fontFamily);
    if (template.fontSize) setFontSize(template.fontSize);
    if (template.spacing !== undefined) setSpacing(template.spacing);
    if (template.imageSize !== undefined) setImageSize(template.imageSize);
    if (template.background !== undefined) setBackground(template.background);
    if (template.showHeader !== undefined) setShowHeader(template.showHeader);
    if (template.showFooter !== undefined) setShowFooter(template.showFooter);
    if (template.showImageBorder !== undefined) setShowImageBorder(template.showImageBorder);
    if (template.showTableGrid !== undefined) setShowTableGrid(template.showTableGrid);
    if (template.answerMode) setAnswerMode(template.answerMode);

    // 2. Convert template sections to UICompositeSection[] using applyTemplateToSections
    const newSections = applyTemplateToSections(template, words);

    // 3. Sync first section into Single Mode state variables so Single & Composite are 100% consistent
    if (newSections && newSections.length > 0) {
      const firstSec = newSections[0];
      setWorksheetType(firstSec.type);
      if (firstSec.title) setTitle(firstSec.title);
      if (firstSec.selectedWordIndices && firstSec.selectedWordIndices.length > 0) {
        setSelectedWordIndices(new Set(firstSec.selectedWordIndices));
      }
      if (firstSec.blankMode) setBlankMode(firstSec.blankMode);
      if (firstSec.choiceCount) setChoiceCount(firstSec.choiceCount);
      if (firstSec.choiceLayout) setChoiceLayout(firstSec.choiceLayout);
      if (firstSec.matchMode) setMatchMode(firstSec.matchMode);
      if (firstSec.matchHint) setMatchHint(firstSec.matchHint);
      if (firstSec.lookMatchWriteShuffleSuffix !== undefined) setLookMatchWriteShuffleSuffix(firstSec.lookMatchWriteShuffleSuffix);
      if (firstSec.lookMatchWriteMode) setLookMatchWriteMode(firstSec.lookMatchWriteMode);
      if (firstSec.lookMatchWriteShowBaseline !== undefined) setLookMatchWriteShowBaseline(firstSec.lookMatchWriteShowBaseline);
      if (firstSec.lookMatchWriteTraceFontSize) setLookMatchWriteTraceFontSize(firstSec.lookMatchWriteTraceFontSize);
      if (firstSec.wordsearchDirections) setWordsearchDirections(firstSec.wordsearchDirections);
      if (firstSec.wordsearchHintType) setWordsearchHintType(firstSec.wordsearchHintType);
      if (firstSec.wordsearchGridSize !== undefined) setWordsearchGridSize(firstSec.wordsearchGridSize);
      if (firstSec.wordsearchGridBorder) setWordsearchGridBorder(firstSec.wordsearchGridBorder);
      if (firstSec.wordsearchCase) setWordsearchCase(firstSec.wordsearchCase);
      if (firstSec.wordsearchSeed !== undefined) setWordsearchSeed(firstSec.wordsearchSeed);
      if (firstSec.targetLetter) setTargetLetter(firstSec.targetLetter);
      if (firstSec.showWordLabels !== undefined) setShowWordLabels(firstSec.showWordLabels);
      if (firstSec.sentenceScramble !== undefined) setSentenceScramble(firstSec.sentenceScramble);
      if (firstSec.sentenceSeparator) setSentenceSeparator(firstSec.sentenceSeparator);
      if (firstSec.sentenceHintStyle) setSentenceHintStyle(firstSec.sentenceHintStyle);
      if (firstSec.sentenceTraceFontSize) setSentenceTraceFontSize(firstSec.sentenceTraceFontSize);
      if (firstSec.sentenceWordsFont) setSentenceWordsFont(firstSec.sentenceWordsFont);
      if (firstSec.type4LayoutMode) setType4LayoutMode(firstSec.type4LayoutMode);
      if (firstSec.type4ColumnMode) setType4ColumnMode(firstSec.type4ColumnMode);
      if (firstSec.type4TraceFontSize) setType4TraceFontSize(firstSec.type4TraceFontSize);
      if (firstSec.type4AlphabetTargetLetter) setType4AlphabetTargetLetter(firstSec.type4AlphabetTargetLetter);
      if (firstSec.type15NumberStyle) setType15NumberStyle(firstSec.type15NumberStyle);
      if (firstSec.type15Border) setType15Border(firstSec.type15Border);
      if (firstSec.type15ChoiceMode) setType15ChoiceMode(firstSec.type15ChoiceMode);
      if (firstSec.type15LetterBandBg) setType15LetterBandBg(firstSec.type15LetterBandBg);
      if (firstSec.type15Seed !== undefined) setType15Seed(Number(firstSec.type15Seed));
      if (firstSec.type16SoundMode) setType16SoundMode(firstSec.type16SoundMode);
      if (firstSec.type16ChoiceCount) setType16ChoiceCount(firstSec.type16ChoiceCount);
      if (firstSec.type16Layout) setType16Layout(firstSec.type16Layout);
      if (firstSec.type16LetterCase) setType16LetterCase(firstSec.type16LetterCase);
      if (firstSec.type16Border) setType16Border(firstSec.type16Border);
      if (firstSec.type17TaskMode) setType17TaskMode(firstSec.type17TaskMode);
      if (firstSec.type17Border) setType17Border(firstSec.type17Border);
      if (firstSec.type17CardBorder) setType17CardBorder(firstSec.type17CardBorder);
      if (firstSec.type17LetterCase) setType17LetterCase(firstSec.type17LetterCase);
      if (firstSec.type17StripLength) setType17StripLength(firstSec.type17StripLength);
      if (firstSec.type17HighlightTarget) setType17HighlightTarget(firstSec.type17HighlightTarget);
      if (firstSec.type17ShowExample !== undefined) setType17ShowExample(firstSec.type17ShowExample);
      if (firstSec.type18TargetLetter) setType18TargetLetter(firstSec.type18TargetLetter);
      if (firstSec.type18Mode) setType18Mode(firstSec.type18Mode);
      if (firstSec.type18ColorUpper) setType18ColorUpper(firstSec.type18ColorUpper);
      if (firstSec.type18ColorLower) setType18ColorLower(firstSec.type18ColorLower);
      if (firstSec.type18GridRows !== undefined) setType18GridRows(firstSec.type18GridRows);
      if (firstSec.type18GridCols !== undefined) setType18GridCols(firstSec.type18GridCols);
      if (firstSec.type18Border) setType18Border(firstSec.type18Border);
      if (firstSec.type18CircleStyle) setType18CircleStyle(firstSec.type18CircleStyle);
      if (firstSec.type18DistractorCasing) setType18DistractorCasing(firstSec.type18DistractorCasing);
      if (firstSec.type18HighlightTarget) setType18HighlightTarget(firstSec.type18HighlightTarget);
      if (firstSec.type19MazeMode) setType19MazeMode(firstSec.type19MazeMode);
      if (firstSec.type19WallColor) setType19WallColor(firstSec.type19WallColor);
      if (firstSec.type19EntranceCharacter) setType19EntranceCharacter(firstSec.type19EntranceCharacter);
      if (firstSec.type19TargetItem) setType19TargetItem(firstSec.type19TargetItem);
      if (firstSec.type19SentenceStem !== undefined) setType19SentenceStem(firstSec.type19SentenceStem);
      if (firstSec.type19CornerStyle) setType19CornerStyle(firstSec.type19CornerStyle);
      if (firstSec.type19WallThickness) setType19WallThickness(firstSec.type19WallThickness);
      if (firstSec.type19MazeSeed !== undefined) setType19MazeSeed(firstSec.type19MazeSeed);
      if (firstSec.type19HintMode) setType19HintMode(firstSec.type19HintMode);
      if (firstSec.type19GridBorder) setType19GridBorder(firstSec.type19GridBorder);
      if (firstSec.type19LineStyle) setType19LineStyle(firstSec.type19LineStyle);
      if (firstSec.type19BorderColor) setType19BorderColor(firstSec.type19BorderColor);
      if (firstSec.type19PuzzlesPerPage !== undefined) setType19PuzzlesPerPage(firstSec.type19PuzzlesPerPage);
      if (firstSec.type19Casing) setType19Casing(firstSec.type19Casing);
      if (firstSec.type19ShowClueImage !== undefined) setType19ShowClueImage(firstSec.type19ShowClueImage);
      if (firstSec.type19ShowClueNumber !== undefined) setType19ShowClueNumber(firstSec.type19ShowClueNumber);
      if (firstSec.type19ShowTrace !== undefined) setType19ShowTrace(firstSec.type19ShowTrace);
      if (firstSec.type20HintMode) setType20HintMode(firstSec.type20HintMode);
      if (firstSec.type20GridBorder) setType20GridBorder(firstSec.type20GridBorder);
      if (firstSec.type20LineStyle) setType20LineStyle(firstSec.type20LineStyle);
      if (firstSec.type20BorderColor) setType20BorderColor(firstSec.type20BorderColor);
      if (firstSec.type20PuzzlesPerPage !== undefined) setType20PuzzlesPerPage(firstSec.type20PuzzlesPerPage);
      if (firstSec.type20Casing) setType20Casing(firstSec.type20Casing);
      if (firstSec.type20ShowClueImage !== undefined) setType20ShowClueImage(firstSec.type20ShowClueImage);
      if (firstSec.type20ShowClueNumber !== undefined) setType20ShowClueNumber(firstSec.type20ShowClueNumber);
      if (firstSec.type20ShowTrace !== undefined) setType20ShowTrace(firstSec.type20ShowTrace);
      if (firstSec.type20GridMode) setType20GridMode(firstSec.type20GridMode);
      if (firstSec.type20HollowArrows !== undefined) setType20HollowArrows(firstSec.type20HollowArrows);
    }

    // 4. Set mode: if applying a single-section template while in single mode, keep single mode; otherwise switch to composite
    const targetMode = (template.sections.length === 1 && worksheetMode === 'single') ? 'single' : 'composite';
    setWorksheetMode(targetMode);

    // 5. Set composite sections
    setCompositeSections(newSections);

    // 6. Set active section tab to 0
    setActiveSectionTab(0);

    // 7. Close the modal
    setIsTemplateModalOpen(false);

    // 8. Trigger immediate debounced PDF re-rendering so live preview updates smoothly
    const activeAnswerMode = template.answerMode || answerMode;
    setTimeout(() => {
      handleGeneratePreview(
        words,
        title,
        targetMode === 'single' ? newSections[0]?.type : undefined,
        {
          paperSize: template.paperSize || paperSize,
          fontFamily: template.fontFamily || fontFamily,
          fontSize: template.fontSize || fontSize,
          spacing: template.spacing !== undefined ? template.spacing : spacing,
          imageSize: template.imageSize !== undefined ? template.imageSize : imageSize,
          background: template.background !== undefined ? template.background : background,
          showHeader: template.showHeader !== undefined ? template.showHeader : showHeader,
          showFooter: template.showFooter !== undefined ? template.showFooter : showFooter,
          showImageBorder: template.showImageBorder !== undefined ? template.showImageBorder : showImageBorder,
          showTableGrid: template.showTableGrid !== undefined ? template.showTableGrid : showTableGrid,
          answerMode: activeAnswerMode
        },
        newSections,
        targetMode
      );
    }, 150);

    // 9. Display friendly feedback toast
    setTemplateSuccessToast(`Đã áp dụng mẫu "${template.name}" (${newSections.length} phần bài tập)!`);
    setTimeout(() => setTemplateSuccessToast(null), 4000);
  };

  // Load Library Sets on mount
  useEffect(() => {
    getSets().then((loaded) => {
      setLibrarySets(loaded);
      if (id) {
        const found = loaded.find((s) => s.id === id);
        if (found) {
          setSourceMode('library');
          setSelectedSetId(found.id);
          loadFromWordSet(found);
          return;
        }
      }
      if (loaded.length > 0) {
        setSourceMode('library');
        setSelectedSetId(loaded[0].id);
        loadFromWordSet(loaded[0]);
      } else {
        // Fallback default sample words so preview generates immediately
        setTimeout(() => {
          if (worksheetMode === 'composite') {
            const finalSecs = createDefaultCompositeSections(DEFAULT_SAMPLE_WORDS);
            handleGeneratePreview(DEFAULT_SAMPLE_WORDS, 'Lớp 3 - Unit 6', undefined, undefined, finalSecs, 'composite');
          } else {
            handleGeneratePreview(DEFAULT_SAMPLE_WORDS, 'Lớp 3 - Unit 6');
          }
        }, 150);
      }
    });
  }, [id]);

  // If initial link has explicit url/vocab param in URL, auto load
  useEffect(() => {
    if (!id && initialUrl && sourceMode === 'link') {
      fetchVocabFromLink(initialUrl);
    }
  }, []);

  const loadFromWordSet = async (set: WordSet) => {
    setTitle(set.title);
    setSourceUrl(window.location.origin + `/play/${set.id}`);
    
    // Asynchronously resolve any firestore:// or local image pointers
    const mapped: WorksheetWord[] = await Promise.all(
      set.words.map(async (w) => {
        let img = w.imageUrl;
        if (img && img.startsWith('firestore://')) {
          const imgId = img.split('/').pop();
          if (imgId) {
            try {
              const cached = await getImageFile(imgId);
              if (cached) img = cached;
            } catch (e) {
              console.warn('Failed to resolve image:', imgId, e);
            }
          }
        }
        return {
          id: w.id,
          term: w.term || (w as any).word || '',
          definition: w.definition || (w as any).meaning || '',
          phonetic: w.phonetic || '',
          imageUrl: img,
          exampleSentence: w.exampleSentence,
          sourceDeckId: set.id,
          sourceDeckTitle: set.title,
          deckRole: 'primary'
        };
      })
    );

    setWords(mapped);
    setSelectedWordIndices(new Set(mapped.map((_, i) => i)));

    // Preserve composite sections and reallocate word slots if composite mode is active
    let finalSecs: UICompositeSection[];
    if (worksheetMode === 'composite' && compositeSections.length > 0) {
      finalSecs = reallocateWordsForSections(compositeSections, mapped);
    } else {
      finalSecs = createDefaultCompositeSections(mapped);
    }
    setCompositeSections(finalSecs);

    // Automatically generate preview with the newly loaded set
    setTimeout(() => {
      if (worksheetMode === 'composite') {
        handleGeneratePreview(mapped, set.title, undefined, undefined, finalSecs, 'composite');
      } else {
        handleGeneratePreview(mapped, set.title);
      }
    }, 200);
  };

  const handleLoadMultipleSets = async (selectedSets: WordSet[], primaryDeckId?: string) => {
    if (selectedSets.length === 0) return;
    setIsLoadingVocab(true);
    setErrorMessage('');
    try {
      const pooledWords = await loadFromMultipleWordSets(selectedSets, primaryDeckId);
      const uniqueWords = deduplicateWords(pooledWords);

      if (uniqueWords.length === 0) {
        setErrorMessage('Các bộ thẻ được chọn không có từ vựng nào.');
        setIsLoadingVocab(false);
        return;
      }

      const compositeTitle = `Tổng Hợp: ${selectedSets.map((s) => s.title).join(', ')}`;
      setTitle(compositeTitle);
      setSourceUrl(window.location.origin + '/worksheet');
      setWords(uniqueWords);
      setSelectedWordIndices(new Set(uniqueWords.map((_, i) => i)));
      setLastLoadedMultiCount(selectedSets.length);

      let finalSecs: UICompositeSection[];
      if (worksheetMode === 'composite' && compositeSections.length > 0) {
        finalSecs = reallocateWordsForSections(compositeSections, uniqueWords);
      } else {
        finalSecs = createDefaultCompositeSections(uniqueWords);
      }
      setCompositeSections(finalSecs);

      setTimeout(() => {
        if (worksheetMode === 'composite') {
          handleGeneratePreview(uniqueWords, compositeTitle, undefined, undefined, finalSecs, 'composite');
        } else {
          handleGeneratePreview(uniqueWords, compositeTitle);
        }
      }, 200);
    } catch (err: any) {
      console.error('Failed to load multiple sets:', err);
      setErrorMessage(err.message || 'Không thể nạp dữ liệu từ các bộ thẻ đã chọn');
    } finally {
      setIsLoadingVocab(false);
    }
  };

  const handleApplyQuickAddWords = (wordsToApply: WorksheetWord[], mode: 'replace' | 'append') => {
    if (quickAddSectionIndex === null || !compositeSections[quickAddSectionIndex]) return;

    const targetSec = compositeSections[quickAddSectionIndex];
    const currentSecWords = targetSec.selectedWordIndices.map((i) => words[i]).filter(Boolean);

    // 1. Merge section words using deduplication logic
    const finalSecWords = mergeSectionWords(currentSecWords, wordsToApply, mode);

    // 2. Ensure all finalSecWords exist in master words pool
    const updatedMasterWords = [...words];
    for (const tw of finalSecWords) {
      const exists = updatedMasterWords.some(
        (mw) => normalizeTerm(mw.term) === normalizeTerm(tw.term)
      );
      if (!exists) {
        updatedMasterWords.push(tw);
      }
    }

    // 3. Map finalSecWords to their indices in updatedMasterWords
    const newIndices: number[] = [];
    for (const tw of finalSecWords) {
      const idx = updatedMasterWords.findIndex(
        (mw) => normalizeTerm(mw.term) === normalizeTerm(tw.term)
      );
      if (idx !== -1 && !newIndices.includes(idx)) {
        newIndices.push(idx);
      }
    }

    // 4. Update the section's selectedWordIndices
    const updatedSections = compositeSections.map((sec, idx) => {
      if (idx === quickAddSectionIndex) {
        return {
          ...sec,
          selectedWordIndices: newIndices
        };
      }
      return sec;
    });

    setWords(updatedMasterWords);
    setCompositeSections(updatedSections);

    // 5. Automatically refresh preview
    setTimeout(() => {
      handleGeneratePreview(
        updatedMasterWords,
        undefined,
        undefined,
        undefined,
        updatedSections,
        'composite'
      );
    }, 200);
  };

  const fetchVocabFromLink = async (urlOrId: string) => {
    if (!urlOrId.trim()) {
      setErrorMessage('Vui lòng nhập link hoặc ID bài học');
      return;
    }

    setIsLoadingVocab(true);
    setErrorMessage('');
    setSavedToLibrarySuccess(false);

    try {
      const response = await fetch('/api/fetch-vocab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlOrId.trim() })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setTitle(data.title || 'Bài học từ vựng');
      setSourceUrl(`https://yourhomework.net/vocab/${data.publicId || data.vocabId}`);

      const fetchedWords: WorksheetWord[] = (data.words || []).map((w: WorksheetWord) => ({
        ...w,
        deckRole: 'primary'
      }));
      setWords(fetchedWords);
      setSelectedWordIndices(new Set(fetchedWords.map((_, i) => i)));

      let finalSecs: UICompositeSection[];
      if (worksheetMode === 'composite' && compositeSections.length > 0) {
        finalSecs = reallocateWordsForSections(compositeSections, fetchedWords);
      } else {
        finalSecs = createDefaultCompositeSections(fetchedWords);
      }
      setCompositeSections(finalSecs);

      // Automatically generate preview
      setTimeout(() => {
        if (worksheetMode === 'composite') {
          handleGeneratePreview(fetchedWords, data.title || 'Bài học từ vựng', undefined, undefined, finalSecs, 'composite');
        } else {
          handleGeneratePreview(fetchedWords, data.title || 'Bài học từ vựng', worksheetType);
        }
      }, 300);
    } catch (err: any) {
      console.error('Fetch vocab error:', err);
      setErrorMessage(err.message || 'Không thể tải dữ liệu từ link YourHomework');
    } finally {
      setIsLoadingVocab(false);
    }
  };

  const handleToggleWord = (idx: number) => {
    const next = new Set(selectedWordIndices);
    if (next.has(idx)) {
      next.delete(idx);
    } else {
      next.add(idx);
    }
    setSelectedWordIndices(next);
  };

  const handleSelectAll = () => {
    setSelectedWordIndices(new Set(words.map((_, i) => i)));
  };

  const handleDeselectAll = () => {
    setSelectedWordIndices(new Set());
  };

  const getActiveWords = (): WorksheetWord[] => {
    return words.filter((_, idx) => selectedWordIndices.has(idx));
  };

  const handleSwitchAnswerMode = (newMode: 'student' | 'answer' | 'both') => {
    setAnswerMode(newMode);
    if (worksheetMode === 'composite') {
      const updated = compositeSections.map((sec) => ({
        ...sec,
        answerMode: newMode,
        ...(sec.type === 17 ? { type17HighlightTarget: newMode === 'answer' ? ('red' as const) : ('none' as const) } : {}),
        ...(sec.type === 18 ? { type18HighlightTarget: newMode === 'answer' ? ('answer_key' as const) : ('none' as const) } : {})
      }));
      setCompositeSections(updated);
      handleGeneratePreview(undefined, undefined, undefined, { answerMode: newMode }, updated, 'composite');
    } else {
      if (worksheetType === 17) {
        setType17HighlightTarget(newMode === 'answer' ? 'red' : 'none');
      }
      if (worksheetType === 18) {
        setType18HighlightTarget(newMode === 'answer' ? 'answer_key' : 'none');
      }
      handleGeneratePreview(undefined, undefined, worksheetType, {
        answerMode: newMode,
        ...(worksheetType === 17 ? { type17HighlightTarget: newMode === 'answer' ? 'red' : 'none' } : {}),
        ...(worksheetType === 18 ? { type18HighlightTarget: newMode === 'answer' ? 'answer_key' : 'none' } : {})
      });
    }
  };

  const handleGeneratePreview = async (
    wordsToUse?: WorksheetWord[],
    titleToUse?: string,
    typeToUse?: WorksheetType,
    customOptions?: {
      showHeader?: boolean;
      showFooter?: boolean;
      showImageBorder?: boolean;
      showTableGrid?: boolean;
      background?: string;
      fontSize?: number;
      fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
      paperSize?: 'a5' | 'a4';
      blankMode?: BlankMode;
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
      targetLetter?: string;
      showWordLabels?: boolean;
      sentenceScramble?: boolean;
      sentenceSeparator?: 'space' | 'slash';
      sentenceHintStyle?: 'underscores' | 'dots' | 'trace';
      sentenceTraceFontSize?: number;
      sentenceWordsFont?: 'inherit' | 'Andika';
      type4LayoutMode?: Type4LayoutMode;
      type4ColumnMode?: Type4ColumnMode;
      type4TraceFontSize?: number;
      type4AlphabetTargetLetter?: string;
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
      type19ShowTrace?: boolean;
      type20HintMode?: Type20HintMode;
      type20GridBorder?: Type20GridBorder;
      type20LineStyle?: Type20LineStyle;
      type20BorderColor?: Type20BorderColor;
      type20PuzzlesPerPage?: Type20PuzzlesPerPage;
      type20Casing?: Type20Casing;
      type20ShowClueImage?: boolean;
      type20ShowClueNumber?: boolean;
      type20ShowTrace?: boolean;
      type20GridMode?: Type20GridMode;
      type20HollowArrows?: boolean;
      type20Seed?: number | string;
      type9Seed?: number | string;
      answerMode?: 'student' | 'answer' | 'both';
    },
    sectionsToUse?: UICompositeSection[],
    modeOverride?: 'single' | 'composite',
    scopeOverride?: 'focused' | 'all',
    focusedIndexOverride?: number
  ) => {
    const currentMode = modeOverride || worksheetMode;
    const allAvailableWords = (wordsToUse && wordsToUse.length > 0) ? wordsToUse : (words.length > 0 ? words : DEFAULT_SAMPLE_WORDS);

    if (currentMode === 'composite') {
      const sections = sectionsToUse || compositeSections;
      if (sections.length === 0) {
        setErrorMessage('Danh sách phần bài tập trống. Vui lòng bấm "+ Thêm phần bài tập" để tạo nội dung.');
        return;
      }

      const effectiveScope = scopeOverride !== undefined ? scopeOverride : compositePreviewScope;
      const effectiveFocusedIdx = focusedIndexOverride !== undefined ? focusedIndexOverride : focusedSectionIndex;
      const safeFocusedIdx = Math.max(0, Math.min(effectiveFocusedIdx, sections.length - 1));

      const activeSectionsForPreview = effectiveScope === 'focused' && sections[safeFocusedIdx]
        ? [sections[safeFocusedIdx]]
        : sections;

      const emptySection = activeSectionsForPreview.find((s) => s.type !== 18 && s.selectedWordIndices.length === 0);
      if (emptySection) {
        setErrorMessage(`Phần "${emptySection.title}" chưa có từ vựng nào được chọn. Vui lòng chọn ít nhất 1 từ.`);
        return;
      }

      setIsGeneratingPDF(true);
      setErrorMessage('');

      try {
        const payload: CompositeWorksheetConfig = {
          title: (titleToUse !== undefined ? titleToUse : title) || 'English Worksheet',
          paperSize: customOptions?.paperSize ?? paperSize,
          fontSize: customOptions?.fontSize ?? fontSize,
          fontFamily: customOptions?.fontFamily ?? fontFamily,
          spacing: customOptions?.spacing !== undefined ? customOptions.spacing : spacing,
          imageSize: customOptions?.imageSize !== undefined ? customOptions.imageSize : imageSize,
          background: customOptions?.background !== undefined ? customOptions.background : background,
          showHeader: customOptions?.showHeader !== undefined ? customOptions.showHeader : showHeader,
          showFooter: customOptions?.showFooter !== undefined ? customOptions.showFooter : showFooter,
          showImageBorder: customOptions?.showImageBorder !== undefined ? customOptions.showImageBorder : showImageBorder,
          showTableGrid: customOptions?.showTableGrid !== undefined ? customOptions.showTableGrid : showTableGrid,
          sourceUrl,
          allWords: allAvailableWords,
          answerMode: customOptions?.answerMode !== undefined ? customOptions.answerMode : answerMode,
          sections: activeSectionsForPreview.map((sec) => ({
            id: sec.id,
            type: sec.type,
            title: sec.title,
            answerMode: sec.answerMode || 'student',
            blankMode: sec.blankMode,
            type4LayoutMode: sec.type4LayoutMode,
            type4ColumnMode: sec.type4ColumnMode,
            type4TraceFontSize: sec.type4TraceFontSize || 28,
            type4AlphabetTargetLetter: sec.type4AlphabetTargetLetter || 'c',
            pageBreakBefore: sec.pageBreakBefore,
            fontFamily: sec.fontFamily,
            fontSize: sec.fontSize,
            spacing: sec.spacing,
            imageSize: sec.imageSize,
            choiceCount: sec.choiceCount || 3,
            choiceLayout: sec.choiceLayout || 'vertical',
            matchMode: sec.matchMode || 'word',
            matchHint: sec.matchHint || 'none',
            lookMatchWriteShuffleSuffix: sec.lookMatchWriteShuffleSuffix,
            lookMatchWriteMode: sec.lookMatchWriteMode,
            lookMatchWriteShowBaseline: sec.lookMatchWriteShowBaseline,
            lookMatchWriteTraceFontSize: sec.lookMatchWriteTraceFontSize,
            wordsearchDirections: sec.wordsearchDirections,
            wordsearchHintType: sec.wordsearchHintType,
            wordsearchGridSize: sec.wordsearchGridSize,
            wordsearchGridBorder: sec.wordsearchGridBorder || 'none',
            wordsearchCase: sec.wordsearchCase || 'lower',
            wordsearchSeed: sec.wordsearchSeed ?? wordsearchSeed,
            type9Seed: sec.type9Seed || type9Seed,
            targetLetter: sec.targetLetter,
            showWordLabels: sec.showWordLabels,
            sentenceScramble: sec.sentenceScramble,
            sentenceSeparator: sec.sentenceSeparator,
            sentenceHintStyle: sec.sentenceHintStyle,
            sentenceTraceFontSize: sec.sentenceTraceFontSize,
            sentenceWordsFont: sec.sentenceWordsFont,
            type15NumberStyle: sec.type15NumberStyle,
            type15Border: sec.type15Border,
            type15ChoiceMode: sec.type15ChoiceMode,
            type15LetterBandBg: sec.type15LetterBandBg,
            type15Seed: sec.type15Seed || type15Seed,
            type16SoundMode: sec.type16SoundMode,
            type16ChoiceCount: sec.type16ChoiceCount,
            type16Layout: sec.type16Layout,
            type16LetterCase: sec.type16LetterCase,
            type16Border: sec.type16Border,
            type17TaskMode: sec.type17TaskMode,
            type17Border: sec.type17Border,
            type17CardBorder: sec.type17CardBorder,
            type17LetterCase: sec.type17LetterCase,
            type17StripLength: sec.type17StripLength,
            type17HighlightTarget: sec.type17HighlightTarget,
            type17ShowExample: sec.type17ShowExample,
            type18TargetLetter: sec.type18TargetLetter,
            type18Mode: sec.type18Mode,
            type18ColorUpper: sec.type18ColorUpper,
            type18ColorLower: sec.type18ColorLower,
            type18GridRows: sec.type18GridRows,
            type18GridCols: sec.type18GridCols,
            type18Border: sec.type18Border,
            type18CircleStyle: sec.type18CircleStyle,
            type18DistractorCasing: sec.type18DistractorCasing,
            type18HighlightTarget: sec.type18HighlightTarget,
            type19MazeMode: sec.type19MazeMode,
            type19WallColor: sec.type19WallColor,
            type19EntranceCharacter: sec.type19EntranceCharacter,
            type19TargetItem: sec.type19TargetItem,
            type19SentenceStem: sec.type19SentenceStem,
            type19CornerStyle: sec.type19CornerStyle,
            type19WallThickness: sec.type19WallThickness,
            type19MazeSeed: sec.type19MazeSeed,
            type20HintMode: sec.type20HintMode || sec.type19HintMode,
            type20GridBorder: sec.type20GridBorder || sec.type19GridBorder,
            type20LineStyle: sec.type20LineStyle || sec.type19LineStyle,
            type20BorderColor: sec.type20BorderColor || sec.type19BorderColor,
            type20PuzzlesPerPage: sec.type20PuzzlesPerPage || sec.type19PuzzlesPerPage,
            type20Casing: sec.type20Casing || sec.type19Casing,
            type20ShowClueImage: sec.type20ShowClueImage !== false && sec.type19ShowClueImage !== false,
            type20ShowClueNumber: sec.type20ShowClueNumber !== false && sec.type19ShowClueNumber !== false,
            type20ShowTrace: !!sec.type20ShowTrace || !!sec.type19ShowTrace,
            type20GridMode: sec.type20GridMode || 'connected',
            type20HollowArrows: sec.type20HollowArrows !== false,
            type20Seed: (sec as any).type20Seed,
            words: sec.selectedWordIndices.map((i) => allAvailableWords[i]).filter(Boolean)
          }))
        };

        const doc = await generateCompositeWorksheetPDF(payload);
        const blob = doc.output('blob');
        if (pdfBlobUrl) {
          URL.revokeObjectURL(pdfBlobUrl);
        }
        const newUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(newUrl);
      } catch (err: any) {
        console.error('Generate Composite PDF error:', err);
        setErrorMessage(err.message || 'Lỗi khi tạo file PDF tổng hợp');
      } finally {
        setIsGeneratingPDF(false);
      }
      return;
    }

    // Single mode
    const effectiveType = typeToUse !== undefined ? typeToUse : worksheetType;
    const activeWords = (wordsToUse && wordsToUse.length > 0) ? wordsToUse : (getActiveWords().length > 0 ? getActiveWords() : DEFAULT_SAMPLE_WORDS);
    if (effectiveType !== 18 && activeWords.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 từ vựng trong danh sách.');
      return;
    }

    setIsGeneratingPDF(true);
    setErrorMessage('');

    try {
      const doc = await generateWorksheetPDF({
        type: typeToUse !== undefined ? typeToUse : worksheetType,
        title: (titleToUse !== undefined ? titleToUse : title) || 'English Worksheet',
        fontSize: customOptions?.fontSize ?? fontSize,
        fontFamily: customOptions?.fontFamily ?? fontFamily,
        paperSize: customOptions?.paperSize ?? paperSize,
        blankMode: customOptions?.blankMode ?? blankMode,
        spacing: customOptions?.spacing !== undefined ? customOptions.spacing : spacing,
        imageSize: customOptions?.imageSize !== undefined ? customOptions.imageSize : imageSize,
        background: customOptions?.background !== undefined ? customOptions.background : background,
        words: activeWords,
        sourceUrl,
        showHeader: customOptions?.showHeader !== undefined ? customOptions.showHeader : showHeader,
        showFooter: customOptions?.showFooter !== undefined ? customOptions.showFooter : showFooter,
        showImageBorder: customOptions?.showImageBorder !== undefined ? customOptions.showImageBorder : showImageBorder,
        showTableGrid: customOptions?.showTableGrid !== undefined ? customOptions.showTableGrid : showTableGrid,
        choiceCount: customOptions?.choiceCount !== undefined ? customOptions.choiceCount : choiceCount,
        choiceLayout: customOptions?.choiceLayout !== undefined ? customOptions.choiceLayout : choiceLayout,
        matchMode: customOptions?.matchMode !== undefined ? customOptions.matchMode : matchMode,
        matchHint: customOptions?.matchHint !== undefined ? customOptions.matchHint : matchHint,
        lookMatchWriteShuffleSuffix: customOptions?.lookMatchWriteShuffleSuffix !== undefined ? customOptions.lookMatchWriteShuffleSuffix : lookMatchWriteShuffleSuffix,
        lookMatchWriteMode: customOptions?.lookMatchWriteMode !== undefined ? customOptions.lookMatchWriteMode : lookMatchWriteMode,
        lookMatchWriteShowBaseline: customOptions?.lookMatchWriteShowBaseline !== undefined ? customOptions.lookMatchWriteShowBaseline : lookMatchWriteShowBaseline,
        lookMatchWriteTraceFontSize: customOptions?.lookMatchWriteTraceFontSize !== undefined ? customOptions.lookMatchWriteTraceFontSize : lookMatchWriteTraceFontSize,
        wordsearchDirections: customOptions?.wordsearchDirections ?? wordsearchDirections,
        wordsearchHintType: customOptions?.wordsearchHintType ?? wordsearchHintType,
        wordsearchGridSize: customOptions?.wordsearchGridSize ?? wordsearchGridSize,
        wordsearchGridBorder: customOptions?.wordsearchGridBorder ?? wordsearchGridBorder,
        wordsearchCase: customOptions?.wordsearchCase ?? wordsearchCase,
        wordsearchSeed: customOptions?.wordsearchSeed ?? wordsearchSeed,
        type9Seed: customOptions?.type9Seed ?? type9Seed,
        targetLetter: customOptions?.targetLetter !== undefined ? customOptions.targetLetter : targetLetter,
        showWordLabels: customOptions?.showWordLabels !== undefined ? customOptions.showWordLabels : showWordLabels,
        sentenceScramble: customOptions?.sentenceScramble !== undefined ? customOptions.sentenceScramble : sentenceScramble,
        sentenceSeparator: customOptions?.sentenceSeparator !== undefined ? customOptions.sentenceSeparator : sentenceSeparator,
        sentenceHintStyle: customOptions?.sentenceHintStyle !== undefined ? customOptions.sentenceHintStyle : sentenceHintStyle,
        sentenceTraceFontSize: customOptions?.sentenceTraceFontSize !== undefined ? customOptions.sentenceTraceFontSize : sentenceTraceFontSize,
        sentenceWordsFont: customOptions?.sentenceWordsFont !== undefined ? customOptions.sentenceWordsFont : sentenceWordsFont,
        type4LayoutMode: customOptions?.type4LayoutMode !== undefined ? customOptions.type4LayoutMode : type4LayoutMode,
        type4ColumnMode: customOptions?.type4ColumnMode !== undefined ? customOptions.type4ColumnMode : type4ColumnMode,
        type4TraceFontSize: customOptions?.type4TraceFontSize !== undefined ? customOptions.type4TraceFontSize : type4TraceFontSize,
        type4AlphabetTargetLetter: customOptions?.type4AlphabetTargetLetter !== undefined ? customOptions.type4AlphabetTargetLetter : type4AlphabetTargetLetter,
        type15NumberStyle: customOptions?.type15NumberStyle !== undefined ? customOptions.type15NumberStyle : type15NumberStyle,
        type15Border: customOptions?.type15Border !== undefined ? customOptions.type15Border : type15Border,
        type15ChoiceMode: customOptions?.type15ChoiceMode !== undefined ? customOptions.type15ChoiceMode : type15ChoiceMode,
        type15LetterBandBg: customOptions?.type15LetterBandBg !== undefined ? customOptions.type15LetterBandBg : type15LetterBandBg,
        type15Seed: customOptions?.type15Seed ?? type15Seed,
        type16SoundMode: customOptions?.type16SoundMode !== undefined ? customOptions.type16SoundMode : type16SoundMode,
        type16ChoiceCount: customOptions?.type16ChoiceCount !== undefined ? customOptions.type16ChoiceCount : type16ChoiceCount,
        type16Layout: customOptions?.type16Layout !== undefined ? customOptions.type16Layout : type16Layout,
        type16LetterCase: customOptions?.type16LetterCase !== undefined ? customOptions.type16LetterCase : type16LetterCase,
        type16Border: customOptions?.type16Border !== undefined ? customOptions.type16Border : type16Border,
        type17TaskMode: customOptions?.type17TaskMode !== undefined ? customOptions.type17TaskMode : type17TaskMode,
        type17Border: customOptions?.type17Border !== undefined ? customOptions.type17Border : type17Border,
        type17CardBorder: customOptions?.type17CardBorder !== undefined ? customOptions.type17CardBorder : type17CardBorder,
        type17LetterCase: customOptions?.type17LetterCase !== undefined ? customOptions.type17LetterCase : type17LetterCase,
        type17StripLength: customOptions?.type17StripLength !== undefined ? customOptions.type17StripLength : type17StripLength,
        type17HighlightTarget: customOptions?.type17HighlightTarget !== undefined ? customOptions.type17HighlightTarget : type17HighlightTarget,
        type17ShowExample: customOptions?.type17ShowExample !== undefined ? customOptions.type17ShowExample : type17ShowExample,
        type18TargetLetter: customOptions?.type18TargetLetter !== undefined ? customOptions.type18TargetLetter : type18TargetLetter,
        type18Mode: customOptions?.type18Mode !== undefined ? customOptions.type18Mode : type18Mode,
        type18ColorUpper: customOptions?.type18ColorUpper !== undefined ? customOptions.type18ColorUpper : type18ColorUpper,
        type18ColorLower: customOptions?.type18ColorLower !== undefined ? customOptions.type18ColorLower : type18ColorLower,
        type18GridRows: customOptions?.type18GridRows !== undefined ? customOptions.type18GridRows : type18GridRows,
        type18GridCols: customOptions?.type18GridCols !== undefined ? customOptions.type18GridCols : type18GridCols,
        type18Border: customOptions?.type18Border !== undefined ? customOptions.type18Border : type18Border,
        type18CircleStyle: customOptions?.type18CircleStyle !== undefined ? customOptions.type18CircleStyle : type18CircleStyle,
        type18DistractorCasing: customOptions?.type18DistractorCasing !== undefined ? customOptions.type18DistractorCasing : type18DistractorCasing,
        type18HighlightTarget: customOptions?.type18HighlightTarget !== undefined ? customOptions.type18HighlightTarget : type18HighlightTarget,
        type19MazeMode: customOptions?.type19MazeMode !== undefined ? customOptions.type19MazeMode : type19MazeMode,
        type19WallColor: customOptions?.type19WallColor !== undefined ? customOptions.type19WallColor : type19WallColor,
        type19EntranceCharacter: customOptions?.type19EntranceCharacter !== undefined ? customOptions.type19EntranceCharacter : type19EntranceCharacter,
        type19TargetItem: customOptions?.type19TargetItem !== undefined ? customOptions.type19TargetItem : type19TargetItem,
        type19SentenceStem: customOptions?.type19SentenceStem !== undefined ? customOptions.type19SentenceStem : type19SentenceStem,
        type19CornerStyle: customOptions?.type19CornerStyle !== undefined ? customOptions.type19CornerStyle : type19CornerStyle,
        type19WallThickness: customOptions?.type19WallThickness !== undefined ? customOptions.type19WallThickness : type19WallThickness,
        type19MazeSeed: customOptions?.type19MazeSeed !== undefined ? customOptions.type19MazeSeed : type19MazeSeed,
        type19HintMode: customOptions?.type19HintMode !== undefined ? customOptions.type19HintMode : type19HintMode,
        type19GridBorder: customOptions?.type19GridBorder !== undefined ? customOptions.type19GridBorder : type19GridBorder,
        type19LineStyle: customOptions?.type19LineStyle !== undefined ? customOptions.type19LineStyle : type19LineStyle,
        type19BorderColor: customOptions?.type19BorderColor !== undefined ? customOptions.type19BorderColor : type19BorderColor,
        type19PuzzlesPerPage: customOptions?.type19PuzzlesPerPage !== undefined ? customOptions.type19PuzzlesPerPage : type19PuzzlesPerPage,
        type19Casing: customOptions?.type19Casing !== undefined ? customOptions.type19Casing : type19Casing,
        type19ShowClueImage: customOptions?.type19ShowClueImage !== undefined ? customOptions.type19ShowClueImage : type19ShowClueImage,
        type19ShowClueNumber: customOptions?.type19ShowClueNumber !== undefined ? customOptions.type19ShowClueNumber : type19ShowClueNumber,
        type19ShowTrace: customOptions?.type19ShowTrace !== undefined ? customOptions.type19ShowTrace : type19ShowTrace,
        type20HintMode: customOptions?.type20HintMode !== undefined ? customOptions.type20HintMode : type20HintMode,
        type20GridBorder: customOptions?.type20GridBorder !== undefined ? customOptions.type20GridBorder : type20GridBorder,
        type20LineStyle: customOptions?.type20LineStyle !== undefined ? customOptions.type20LineStyle : type20LineStyle,
        type20BorderColor: customOptions?.type20BorderColor !== undefined ? customOptions.type20BorderColor : type20BorderColor,
        type20PuzzlesPerPage: customOptions?.type20PuzzlesPerPage !== undefined ? customOptions.type20PuzzlesPerPage : type20PuzzlesPerPage,
        type20Casing: customOptions?.type20Casing !== undefined ? customOptions.type20Casing : type20Casing,
        type20ShowClueImage: customOptions?.type20ShowClueImage !== undefined ? customOptions.type20ShowClueImage : type20ShowClueImage,
        type20ShowClueNumber: customOptions?.type20ShowClueNumber !== undefined ? customOptions.type20ShowClueNumber : type20ShowClueNumber,
        type20ShowTrace: customOptions?.type20ShowTrace !== undefined ? customOptions.type20ShowTrace : type20ShowTrace,
        type20GridMode: customOptions?.type20GridMode !== undefined ? customOptions.type20GridMode : type20GridMode,
        type20HollowArrows: customOptions?.type20HollowArrows !== undefined ? customOptions.type20HollowArrows : type20HollowArrows,
        type20Seed: (customOptions as any)?.type20Seed ?? type20Seed,
        answerMode: customOptions?.answerMode !== undefined ? customOptions.answerMode : answerMode
      });

      const blob = doc.output('blob');
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(newUrl);
    } catch (err: any) {
      console.error('Generate PDF error:', err?.stack || err?.message || err);
      setErrorMessage(err.message || 'Lỗi khi tạo file PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async (specificMode?: 'student' | 'answer' | 'both') => {
    const targetMode = specificMode || answerMode;
    if (worksheetMode === 'composite') {
      if (compositeSections.length === 0) {
        setErrorMessage('Danh sách phần bài tập trống. Vui lòng thêm ít nhất 1 phần bài tập.');
        return;
      }
      const emptySection = compositeSections.find((s) => s.type !== 18 && s.selectedWordIndices.length === 0);
      if (emptySection) {
        setErrorMessage(`Phần "${emptySection.title}" chưa có từ vựng nào được chọn.`);
        return;
      }

      setIsGeneratingPDF(true);
      try {
        const payload: CompositeWorksheetConfig = {
          title: title || 'English Worksheet',
          paperSize,
          fontSize,
          fontFamily,
          spacing,
          imageSize,
          background,
          showHeader,
          showFooter,
          showImageBorder,
          showTableGrid,
          sourceUrl,
          allWords: words,
          answerMode: targetMode,
          sections: compositeSections.map((sec) => ({
            id: sec.id,
            type: sec.type,
            title: sec.title,
            blankMode: sec.blankMode,
            pageBreakBefore: sec.pageBreakBefore,
            fontFamily: sec.fontFamily,
            fontSize: sec.fontSize,
            spacing: sec.spacing,
            imageSize: sec.imageSize,
            choiceCount: sec.choiceCount || 3,
            choiceLayout: sec.choiceLayout || 'vertical',
            matchMode: sec.matchMode || 'word',
            matchHint: sec.matchHint || 'none',
            lookMatchWriteShuffleSuffix: sec.lookMatchWriteShuffleSuffix,
            lookMatchWriteMode: sec.lookMatchWriteMode,
            lookMatchWriteShowBaseline: sec.lookMatchWriteShowBaseline,
            lookMatchWriteTraceFontSize: sec.lookMatchWriteTraceFontSize,
            wordsearchDirections: sec.wordsearchDirections,
            wordsearchHintType: sec.wordsearchHintType,
            wordsearchGridSize: sec.wordsearchGridSize,
            wordsearchGridBorder: sec.wordsearchGridBorder || 'none',
            wordsearchCase: sec.wordsearchCase || 'lower',
            wordsearchSeed: sec.wordsearchSeed ?? wordsearchSeed,
            type9Seed: sec.type9Seed || type9Seed,
            targetLetter: sec.targetLetter,
            showWordLabels: sec.showWordLabels,
            sentenceScramble: sec.sentenceScramble,
            sentenceSeparator: sec.sentenceSeparator,
            sentenceHintStyle: sec.sentenceHintStyle,
            sentenceTraceFontSize: sec.sentenceTraceFontSize || 28,
            sentenceWordsFont: sec.sentenceWordsFont,
            type4LayoutMode: sec.type4LayoutMode,
            type4ColumnMode: sec.type4ColumnMode,
            type4TraceFontSize: sec.type4TraceFontSize || 28,
            type4AlphabetTargetLetter: sec.type4AlphabetTargetLetter || 'c',
            type15NumberStyle: sec.type15NumberStyle,
            type15Border: sec.type15Border,
            type15ChoiceMode: sec.type15ChoiceMode,
            type15LetterBandBg: sec.type15LetterBandBg,
            type15Seed: sec.type15Seed || type15Seed,
            type16SoundMode: sec.type16SoundMode,
            type16ChoiceCount: sec.type16ChoiceCount,
            type16Layout: sec.type16Layout,
            type16LetterCase: sec.type16LetterCase,
            type16Border: sec.type16Border,
            type17TaskMode: sec.type17TaskMode,
            type17Border: sec.type17Border,
            type17CardBorder: sec.type17CardBorder,
            type17LetterCase: sec.type17LetterCase,
            type17StripLength: sec.type17StripLength,
            type17HighlightTarget: targetMode === 'answer' ? 'red' : targetMode === 'student' ? 'none' : sec.type17HighlightTarget,
            type17ShowExample: sec.type17ShowExample,
            type18TargetLetter: sec.type18TargetLetter,
            type18Mode: sec.type18Mode,
            type18ColorUpper: sec.type18ColorUpper,
            type18ColorLower: sec.type18ColorLower,
            type18GridRows: sec.type18GridRows,
            type18GridCols: sec.type18GridCols,
            type18Border: sec.type18Border,
            type18CircleStyle: sec.type18CircleStyle,
            type18DistractorCasing: sec.type18DistractorCasing,
            type18HighlightTarget: sec.type18HighlightTarget,
            type19MazeMode: sec.type19MazeMode,
            type19WallColor: sec.type19WallColor,
            type19EntranceCharacter: sec.type19EntranceCharacter,
            type19TargetItem: sec.type19TargetItem,
            type19SentenceStem: sec.type19SentenceStem,
            type19CornerStyle: sec.type19CornerStyle,
            type19WallThickness: sec.type19WallThickness,
            type19MazeSeed: sec.type19MazeSeed,
            type20HintMode: sec.type20HintMode,
            type20GridBorder: sec.type20GridBorder,
            type20LineStyle: sec.type20LineStyle,
            type20BorderColor: sec.type20BorderColor,
            type20PuzzlesPerPage: sec.type20PuzzlesPerPage,
            type20Casing: sec.type20Casing,
            type20ShowClueImage: sec.type20ShowClueImage,
            type20ShowClueNumber: sec.type20ShowClueNumber,
            type20ShowTrace: sec.type20ShowTrace,
            type20GridMode: sec.type20GridMode,
            type20HollowArrows: sec.type20HollowArrows,
            type20ShowClueText: sec.type20ShowClueText,
            type20ClueColumns: sec.type20ClueColumns,
            type20Seed: (sec as any).type20Seed,
            answerMode: targetMode,
            words: sec.selectedWordIndices.map((i) => words[i]).filter(Boolean)
          }))
        };

        const doc = await generateCompositeWorksheetPDF(payload);
        const cleanTitle = (title || 'Worksheet-Tong-Hop').replace(/[/\\?%*:|"<>]/g, '-');
        const suffix = targetMode === 'both' ? 'Ban Hoc Sinh va Dap An' : targetMode === 'answer' ? 'Ban Dap An' : 'Ban Hoc Sinh';
        doc.save(`Worksheet-Tong-Hop - ${cleanTitle} - ${suffix}.pdf`);
      } catch (err: any) {
        console.error('Download Composite PDF error:', err);
        setErrorMessage(err.message || 'Lỗi khi tải PDF tổng hợp');
      } finally {
        setIsGeneratingPDF(false);
      }
      return;
    }

    const activeWords = getActiveWords();
    if (worksheetType !== 18 && activeWords.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 từ vựng.');
      return;
    }

    setIsGeneratingPDF(true);
    try {
      const doc = await generateWorksheetPDF({
        type: worksheetType,
        title: title || 'English Worksheet',
        fontSize,
        fontFamily,
        paperSize,
        blankMode,
        type4LayoutMode,
        type4ColumnMode,
        type4TraceFontSize,
        type4AlphabetTargetLetter,
        spacing,
        imageSize,
        background,
        words: activeWords,
        sourceUrl,
        showHeader,
        showFooter,
        showImageBorder,
        showTableGrid,
        choiceCount,
        choiceLayout,
        matchMode,
        matchHint,
        lookMatchWriteShuffleSuffix,
        lookMatchWriteMode,
        lookMatchWriteShowBaseline,
        lookMatchWriteTraceFontSize,
        wordsearchDirections,
        wordsearchHintType,
        wordsearchGridSize,
        wordsearchGridBorder,
        wordsearchCase,
        wordsearchSeed,
        type9Seed,
        targetLetter,
        showWordLabels,
        sentenceScramble,
        sentenceSeparator,
        sentenceHintStyle,
        sentenceTraceFontSize,
        sentenceWordsFont,
        type15NumberStyle,
        type15Border,
        type15ChoiceMode,
        type15LetterBandBg,
        type15Seed,
        type16SoundMode,
        type16ChoiceCount,
        type16Layout,
        type16LetterCase,
        type16Border,
        type17TaskMode,
        type17Border,
        type17CardBorder,
        type17LetterCase,
        type17StripLength,
        type17HighlightTarget: targetMode === 'answer' ? 'red' : targetMode === 'student' ? 'none' : type17HighlightTarget,
        type17ShowExample,
        type18TargetLetter,
        type18Mode,
        type18ColorUpper,
        type18ColorLower,
        type18GridRows,
        type18GridCols,
        type18Border,
        type18CircleStyle,
        type18DistractorCasing,
        type18HighlightTarget,
        type19MazeMode,
        type19WallColor,
        type19EntranceCharacter,
        type19TargetItem,
        type19SentenceStem,
        type19CornerStyle,
        type19WallThickness,
        type19MazeSeed,
        type20HintMode,
        type20GridBorder,
        type20LineStyle,
        type20BorderColor,
        type20PuzzlesPerPage,
        type20Casing,
        type20ShowClueImage,
        type20ShowClueNumber,
        type20ShowTrace,
        type20GridMode,
        type20HollowArrows,
        type20Seed,
        answerMode: targetMode
      });
      const cleanTitle = (title || 'Worksheet').replace(/[/\\?%*:|"<>]/g, '-');
      const suffix = targetMode === 'both' ? 'Ban Hoc Sinh va Dap An' : targetMode === 'answer' ? 'Ban Dap An' : 'Ban Hoc Sinh';
      doc.save(`PDF ${worksheetType} - ${cleanTitle} - ${suffix}.pdf`);
    } catch (err: any) {
      console.error('Download PDF error:', err);
      setErrorMessage(err.message || 'Lỗi khi tải PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrintPDF = () => {
    if (!pdfBlobUrl) {
      handleGeneratePreview();
      return;
    }
    const printWindow = window.open(pdfBlobUrl);
    if (printWindow) {
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleSaveToLibrary = async () => {
    if (words.length === 0) return;
    try {
      const newSet: WordSet = {
        id: generateId(),
        title: title || 'Bài học YourHomework',
        description: `Nhập từ link YourHomework: ${sourceUrl}`,
        createdAt: Date.now(),
        userId: 'user',
        words: words.map((w) => ({
          id: w.id || generateId(),
          term: w.term,
          definition: w.definition || '',
          imageUrl: w.imageUrl || ''
        }))
      };
      await saveSet(newSet);
      setSavedToLibrarySuccess(true);
      const updated = await getSets();
      setLibrarySets(updated);
      setTimeout(() => setSavedToLibrarySuccess(false), 4000);
    } catch (err) {
      console.error('Save to library failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Về Trang Chủ"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">Tạo Worksheet Từ Vựng</h1>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                YourHomework Clone
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-0.5">
              Tạo bài tập PDF chuẩn A4 in ấn ngay từ link YourHomework hoặc bộ từ vựng trong thư viện
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setInitialShowSaveFormInModal(false);
              setIsTemplateModalOpen(true);
            }}
            data-testid="open-template-modal-btn"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 transition-colors shadow-2xs cursor-pointer"
            title="Mở thư viện mẫu bài tập tổng hợp"
          >
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>📑 Mẫu bài tập (Templates)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInitialShowSaveFormInModal(true);
              setIsTemplateModalOpen(true);
            }}
            data-testid="save-template-quick-btn"
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            title="Lưu bài tập hiện tại thành Mẫu bài tập mới"
          >
            <Save className="w-4 h-4 text-slate-600" />
            <span>💾 Lưu thành Mẫu</span>
          </button>

          <button
            onClick={() => {
              const freshSeed = Date.now() + Math.floor(Math.random() * 10000);
              setType9Seed(freshSeed);
              setType15Seed(freshSeed);
              setType20Seed(freshSeed);
              if (worksheetMode === 'composite') {
                const nextSecs = compositeSections.map((s) =>
                  s.type === 9
                    ? { ...s, type9Seed: freshSeed }
                    : s.type === 15
                    ? { ...s, type15Seed: freshSeed }
                    : s.type === 20
                    ? { ...s, type20Seed: freshSeed }
                    : s
                );
                setCompositeSections(nextSecs);
                handleGeneratePreview(undefined, undefined, undefined, { type9Seed: freshSeed, type15Seed: freshSeed, type20Seed: freshSeed }, nextSecs, 'composite');
              } else {
                handleGeneratePreview(undefined, undefined, undefined, { type9Seed: freshSeed, type15Seed: freshSeed, type20Seed: freshSeed });
              }
            }}
            disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
            data-testid="generate-worksheet-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
            <span>{isGeneratingPDF ? 'Đang tạo...' : 'Tạo Worksheet'}</span>
          </button>
          {/* Top Download Button Group with 3 states */}
          <div className="flex items-center rounded-xl bg-emerald-600 shadow-xs border border-emerald-700/50 overflow-hidden">
            <button
              type="button"
              onClick={() => handleDownloadPDF(answerMode)}
              disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
              data-testid="top-download-current-btn"
              className="flex items-center gap-1.5 px-3.5 py-2.5 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 cursor-pointer"
              title={`Tải file PDF hiện tại (${answerMode === 'both' ? 'Cả 2 Bản HS + Đáp Án' : answerMode === 'answer' ? 'Bản Đáp Án' : 'Bản Học Sinh'})`}
            >
              <Download className="w-4 h-4" />
              <span>
                Tải {answerMode === 'both' ? 'Cả 2 Bản (HS + ĐA)' : answerMode === 'answer' ? 'Bản Đáp Án' : 'Bản Học Sinh'}
              </span>
            </button>
            <div className="h-6 w-px bg-emerald-700/60" />
            <div className="flex items-center p-0.5 bg-emerald-700/30">
              <button
                type="button"
                onClick={() => handleDownloadPDF('student')}
                disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                data-testid="top-download-student-btn"
                className="px-2 py-1 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                title="Tải riêng Bản Học Sinh (.pdf)"
              >
                📝 HS
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('answer')}
                disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                data-testid="top-download-answer-btn"
                className="px-2 py-1 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                title="Tải riêng Bản Đáp Án (.pdf)"
              >
                🎯 ĐA
              </button>
              <button
                type="button"
                onClick={() => handleDownloadPDF('both')}
                disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                data-testid="top-download-both-btn"
                className="px-2 py-1 hover:bg-emerald-800 text-white text-xs font-bold rounded transition-colors cursor-pointer"
                title="Tải gộp Cả 2 Bản (Học Sinh + Đáp Án) (.pdf)"
              >
                📑 Cả 2
              </button>
            </div>
          </div>
          <button
            onClick={handlePrintPDF}
            disabled={!pdfBlobUrl}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="In Worksheet"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
          <div className="flex-1">{errorMessage}</div>
        </div>
      )}

      {templateSuccessToast && (
        <div
          data-testid="template-success-toast"
          className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between gap-3 text-sm shadow-2xs animate-in fade-in duration-150"
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <span>{templateSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setTemplateSuccessToast(null)}
            className="text-emerald-600 hover:text-emerald-800 p-1 rounded-lg cursor-pointer"
            title="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Controls & Word Selection (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Mode Switcher Tab */}
          <WorksheetModeSwitch
            mode={worksheetMode}
            onChangeMode={handleModeChange}
          />

          {/* Step 1: Data Source Selection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
                  1
                </span>
                Nguồn Dữ Liệu Flashcard
              </h2>

              <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSourceMode('link')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    sourceMode === 'link' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Link YourHomework
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('library')}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    sourceMode === 'library' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  1 Bộ Thẻ
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('multi')}
                  data-testid="source-mode-multi"
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    sourceMode === 'multi' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Nhiều Bộ Thẻ
                </button>
              </div>
            </div>

            {sourceMode === 'link' ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={linkInput}
                      onChange={(e) => setLinkInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && fetchVocabFromLink(linkInput)}
                      placeholder="Dán link YourHomework (ví dụ: https://yourhomework.net/vocab/589984573)"
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => fetchVocabFromLink(linkInput)}
                    disabled={isLoadingVocab}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 shrink-0 flex items-center gap-2"
                  >
                    {isLoadingVocab ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Tải Dữ Liệu'}
                  </button>
                </div>

                {/* Quick chip */}
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>Mẫu thử:</span>
                  <button
                    onClick={() => {
                      setLinkInput('https://yourhomework.net/vocab/589984573');
                      fetchVocabFromLink('https://yourhomework.net/vocab/589984573');
                    }}
                    className="text-indigo-600 font-medium hover:underline bg-indigo-50 px-2 py-1 rounded-md"
                  >
                    Lớp 3 - Unit 6 (589984573)
                  </button>
                </div>
              </div>
            ) : sourceMode === 'library' ? (
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 uppercase">
                  Chọn bộ từ vựng đã lưu:
                </label>
                <select
                  value={selectedSetId}
                  onChange={(e) => {
                    setSelectedSetId(e.target.value);
                    const chosen = librarySets.find((s) => s.id === e.target.value);
                    if (chosen) loadFromWordSet(chosen);
                  }}
                  className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">-- Chọn bộ từ vựng --</option>
                  {librarySets.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.words.length} từ)
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <GlobalMultiSetLoader
                  librarySets={librarySets}
                  onLoadDecks={handleLoadMultipleSets}
                  isLoading={isLoadingVocab}
                />
                {words.length > 0 && lastLoadedMultiCount && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <span data-testid="multi-deck-status" className="font-semibold text-slate-700">
                      Đã nạp {words.length} từ vựng từ {lastLoadedMultiCount} bộ thẻ
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Save to library button if fetched from link */}
            {sourceMode === 'link' && words.length > 0 && (
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Đã nạp {words.length} từ vựng từ YourHomework</span>
                <button
                  type="button"
                  onClick={handleSaveToLibrary}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                    savedToLibrarySuccess
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {savedToLibrarySuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {savedToLibrarySuccess ? 'Đã lưu vào Thư viện!' : 'Lưu vào Thư viện'}
                </button>
              </div>
            )}
          </div>

          {worksheetMode === 'single' ? (
            /* Step 2: Choose Worksheet Type (Single mode) */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
                  2
                </span>
                Chọn Loại Bài Tập (Worksheet Type)
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                {WORKSHEET_TYPES.map((t) => {
                  const isSelected = worksheetType === t.type;
                  return (
                    <div
                      key={t.type}
                      onClick={() => {
                        setWorksheetType(t.type);
                        if (t.type === 1) {
                          const newTitle = 'Reorder the words to make correct sentences';
                          setTitle(newTitle);
                          handleGeneratePreview(undefined, newTitle, 1, {
                            sentenceScramble,
                            sentenceSeparator,
                            sentenceHintStyle,
                            sentenceWordsFont
                          });
                        } else if (t.type === 8) {
                          setTitle('Look and trace');
                          const newSize = fontSize < 16 ? 22 : fontSize;
                          setFontSize(newSize);
                          handleGeneratePreview(undefined, 'Look and trace', 8, { fontSize: newSize });
                        } else if (t.type === 9) {
                          setTitle('Look and color Yes or No');
                          handleGeneratePreview(undefined, 'Look and color Yes or No', 9);
                        } else if (t.type === 10) {
                          setTitle('Look and color');
                          handleGeneratePreview(undefined, 'Look and color', 10);
                        } else if (t.type === 11) {
                          setTitle('Write and circle the correct picture.');
                          const newSize = fontSize < 16 ? 22 : fontSize;
                          setFontSize(newSize);
                          setFontFamily('KG Primary Dots');
                          handleGeneratePreview(undefined, 'Write and circle the correct picture.', 11, { fontSize: newSize, fontFamily: 'KG Primary Dots' });
                        } else if (t.type === 12) {
                          setTitle('Look and write');
                          handleGeneratePreview(undefined, 'Look and write', 12);
                        } else if (t.type === 13) {
                          setTitle('Word Search Puzzle');
                          handleGeneratePreview(undefined, 'Word Search Puzzle', 13);
                        } else if (t.type === 14) {
                          const currentLetter = targetLetter || 'V';
                          const newTitle = `Circle the pictures that have letter ${currentLetter}`;
                          setTitle(newTitle);
                          setShowHeader(true);
                          handleGeneratePreview(undefined, newTitle, 14, {
                            targetLetter: currentLetter,
                            showWordLabels,
                            showHeader: true
                          });
                        } else if (t.type === 15) {
                          const newTitle = 'Read and circle.';
                          setTitle(newTitle);
                          setShowHeader(true);
                          handleGeneratePreview(undefined, newTitle, 15, {
                            type15NumberStyle,
                            type15Border,
                            type15ChoiceMode,
                            type15LetterBandBg,
                            showHeader: true
                          });
                        } else if (t.type === 16) {
                          const newTitle = type16SoundMode === 'ending'
                            ? 'Look and circle the ending sound'
                            : 'Look and circle the beginning sound';
                          setTitle(newTitle);
                          setShowHeader(true);
                          setSpacing(0);
                          handleGeneratePreview(undefined, newTitle, 16, {
                            type16SoundMode,
                            type16ChoiceCount,
                            type16Layout,
                            type16LetterCase,
                            type16Border,
                            showHeader: true,
                            spacing: 0
                          });
                        } else if (t.type === 17) {
                          const newTitle = type17TaskMode === 'cross'
                            ? 'Cross out (/) the extra letters.'
                            : 'Look and color the words';
                          setTitle(newTitle);
                          setShowHeader(true);
                          setSpacing(0);
                          handleGeneratePreview(undefined, newTitle, 17, {
                            type17TaskMode,
                            type17Border,
                            type17CardBorder,
                            type17LetterCase,
                            type17StripLength,
                            type17HighlightTarget,
                            type17ShowExample,
                            showHeader: true,
                            spacing: 0
                          });
                        } else if (t.type === 18) {
                          const target = type18TargetLetter || 'E';
                          const upperChar = target.toUpperCase();
                          const lowerChar = target.toLowerCase();
                          const c1 = type18ColorUpper || 'green';
                          const c2 = type18ColorLower || 'red';
                          const newTitle = type18Mode === 'upper_only'
                            ? `Color ${upperChar} ${c1}`
                            : type18Mode === 'lower_only'
                            ? `Color ${lowerChar} ${c2}`
                            : type18Mode === 'single_color'
                            ? `Color letter ${upperChar} and ${lowerChar} ${c1}`
                            : `Color ${upperChar} ${c1} and ${lowerChar} ${c2}`;
                          setTitle(newTitle);
                          setShowHeader(true);
                          setSpacing(0);
                          handleGeneratePreview(undefined, newTitle, 18, {
                            type18TargetLetter: target,
                            type18Mode,
                            type18ColorUpper: c1,
                            type18ColorLower: c2,
                            type18GridRows,
                            type18GridCols,
                            type18Border,
                            type18CircleStyle,
                            type18DistractorCasing,
                            type18HighlightTarget,
                            showHeader: true,
                            spacing: 0
                          });
                        } else if (t.type === 19) {
                          const primaryWord = (words.find((w) => w.deckRole !== 'review') || words[0])?.term || 'goal';
                          const charLabel = type19EntranceCharacter === 'random' ? 'our friend' : type19EntranceCharacter.charAt(0).toUpperCase() + type19EntranceCharacter.slice(1);
                          const newTitle = type19MazeMode === 'single_goal'
                            ? `Game: Help ${charLabel} find the ${primaryWord}. Draw a line.`
                            : 'Game: Find and say.';
                          setTitle(newTitle);
                          setShowHeader(true);
                          setSpacing(0);
                          handleGeneratePreview(undefined, newTitle, 19, {
                            type19MazeMode,
                            type19WallColor,
                            type19EntranceCharacter,
                            type19SentenceStem,
                            type19CornerStyle,
                            type19WallThickness,
                            type19MazeSeed,
                            showHeader: true,
                            spacing: 0
                          });
                        } else if (t.type === 20) {
                          const newTitle = 'Look, read and write';
                          setTitle(newTitle);
                          setShowHeader(true);
                          setSpacing(0);
                          handleGeneratePreview(undefined, newTitle, 20, {
                            type20HintMode,
                            type20GridBorder,
                            type20LineStyle,
                            type20BorderColor,
                            type20PuzzlesPerPage,
                            type20Casing,
                            type20ShowClueImage,
                            type20ShowClueNumber,
                            type20ShowTrace,
                            type20GridMode,
                            type20HollowArrows,
                            showHeader: true,
                            spacing: 0
                          });
                        } else if (t.type === 3) {
                          const newTitle = matchMode === 'look_match_write'
                            ? 'Look, match and write'
                            : (matchMode === 'sentence' ? 'Match picture with sentence' : 'Match picture with word');
                          setTitle(newTitle);
                          handleGeneratePreview(undefined, newTitle, 3);
                        } else if (t.type === 4) {
                          const newTitle = type4LayoutMode === 'table' ? 'Look and write' : 'Điền chữ cái còn thiếu';
                          setTitle(newTitle);
                          handleGeneratePreview(undefined, newTitle, 4, {
                            type4LayoutMode,
                            type4ColumnMode,
                            blankMode
                          });
                        } else {
                          handleGeneratePreview(undefined, undefined, t.type);
                        }
                      }}
                      data-testid={`single-type-card-${t.type}`}
                      className={`cursor-pointer p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 uppercase">Loại {t.type}</span>
                          {isSelected && (
                            <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                          )}
                        </div>
                        <h4 className="text-sm font-semibold text-slate-900 leading-tight">{t.name}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>
                      </div>

                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-200/60 bg-white">
                        <img
                          src={t.thumbnail}
                          alt={t.name}
                          className="w-full h-20 object-cover object-top hover:scale-105 transition-transform"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Step 2: Composite Section Manager (Composite mode) */
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-bold">
                      2
                    </span>
                    Danh Sách Phần Bài Tập ({compositeSections.length} phần)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Thêm và sắp xếp các phần bài tập con theo thứ tự mong muốn
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Template Action Buttons */}
                  <button
                    type="button"
                    onClick={() => {
                      setInitialShowSaveFormInModal(false);
                      setIsTemplateModalOpen(true);
                    }}
                    data-testid="composite-open-template-modal-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all shrink-0 cursor-pointer shadow-2xs"
                    title="Mở thư viện mẫu bài tập tổng hợp"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Mẫu bài tập</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setInitialShowSaveFormInModal(true);
                      setIsTemplateModalOpen(true);
                    }}
                    data-testid="composite-save-template-btn"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all shrink-0 cursor-pointer shadow-2xs"
                    title="Lưu các phần bài tập hiện tại thành Mẫu"
                  >
                    <Save className="w-3.5 h-3.5 text-slate-600" />
                    <span>Lưu Mẫu</span>
                  </button>

                  {/* View Mode Switcher: Tabs vs Accordion */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCompositeViewMode('tabs')}
                      data-testid="composite-view-tabs-btn"
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        compositeViewMode === 'tabs'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Chế độ Tab: Chỉ hiển thị 1 phần bài tập đang sửa, không cần cuộn trang"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Thẻ Tab (Gọn nhẹ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompositeViewMode('accordion')}
                      data-testid="composite-view-accordion-btn"
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        compositeViewMode === 'accordion'
                          ? 'bg-white text-indigo-700 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                      title="Chế độ Danh sách: Xem toàn bộ các phần với tính năng thu gọn/mở rộng"
                    >
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>Danh Sách</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddSection}
                    data-testid="add-section-btn"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm phần bài tập</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddAllSections}
                    data-testid="add-all-sections-btn"
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    title="Thêm tất cả các loại bài tập có trong hệ thống vào WS Tổng hợp"
                  >
                    <Layers className="w-4 h-4" />
                    <span>+ Thêm tất cả các loại WS</span>
                  </button>

                  {/* Chế Độ Toàn Bộ: Bản Học sinh / Bản Đáp án / Cả 2 Bản */}
                  <div className="flex items-center bg-amber-50 border border-amber-200/80 p-0.5 rounded-xl text-xs font-semibold shadow-2xs">
                    <button
                      type="button"
                      onClick={() => handleSwitchAnswerMode('student')}
                      data-testid="composite-global-answermode-student-btn"
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        answerMode === 'student'
                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                          : 'text-amber-800 hover:bg-amber-100/60'
                      }`}
                      title="Chuyển toàn bộ các phần bài tập sang Bản Học Sinh làm bài"
                    >
                      <span>📝 Bản Học sinh</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchAnswerMode('answer')}
                      data-testid="composite-global-answermode-answer-btn"
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        answerMode === 'answer'
                          ? 'bg-red-600 text-white font-bold shadow-xs'
                          : 'text-red-700 hover:bg-red-100/60'
                      }`}
                      title="Chuyển toàn bộ các phần bài tập sang Bản Đáp Án (Mực đỏ nổi bật)"
                    >
                      <span>🎯 Bản Đáp án</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSwitchAnswerMode('both')}
                      data-testid="composite-global-answermode-both-btn"
                      className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                        answerMode === 'both'
                          ? 'bg-indigo-600 text-white font-bold shadow-xs'
                          : 'text-indigo-700 hover:bg-indigo-100/60'
                      }`}
                      title="Chuyển toàn bộ sang Cả 2 Bản (Gộp Bản Học sinh + Bản Đáp án)"
                    >
                      <span>📑 Cả 2 Bản (HS + ĐA)</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Shortfall Warning Alert Banner */}
              {(() => {
                const totalNeeded = compositeSections.reduce(
                  (acc, s) =>
                    acc + (s.targetWordCount !== undefined ? s.targetWordCount : s.selectedWordIndices.length),
                  0
                );
                if (words.length > 0 && words.length < totalNeeded) {
                  return (
                    <div
                      data-testid="composite-shortfall-alert"
                      className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>
                          ⚠️ Bộ từ vựng có <strong>{words.length}</strong> từ, nhưng các phần bài tập cần tổng cộng{' '}
                          <strong>{totalNeeded}</strong> từ. Hệ thống đã tự động tái sử dụng từ vựng giữa các phần.
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {compositeSections.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl space-y-3 bg-slate-50/50">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
                  <div className="text-sm font-semibold text-slate-700">Chưa có phần bài tập nào</div>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Bấm nút "+ Thêm phần bài tập" để thêm các bài tập con như Viết từ, Nối tranh, Điền chữ thiếu, Trắc nghiệm...
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddSection}
                      data-testid="add-section-btn"
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Thêm phần bài tập</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAllSections}
                      data-testid="add-all-sections-btn-empty"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                      title="Thêm tất cả các loại bài tập có trong hệ thống"
                    >
                      <Layers className="w-4 h-4" />
                      <span>+ Thêm tất cả các loại WS</span>
                    </button>
                  </div>
                </div>
              ) : compositeViewMode === 'tabs' ? (
                /* --- TAB MODE: Compact, Zero Scrolling --- */
                <div className="space-y-4" data-testid="composite-tabs-view">
                  <CompositeSectionTabs
                    sections={compositeSections}
                    activeTabIndex={Math.min(activeSectionTab, compositeSections.length - 1)}
                    isFocusedPreview={compositePreviewScope === 'focused'}
                    onSelectTab={(idx) => {
                      setActiveSectionTab(idx);
                      setFocusedSectionIndex(idx);
                      setHighlightedSectionIndex(idx);
                      if (compositePreviewScope === 'focused') {
                        handleGeneratePreview(undefined, undefined, undefined, undefined, compositeSections, 'composite', 'focused', idx);
                      }
                    }}
                    onAddSection={handleAddSection}
                    onAddAllSections={handleAddAllSections}
                    onMoveUp={handleMoveUpSection}
                    onMoveDown={handleMoveDownSection}
                    onDelete={handleDeleteSection}
                    onDuplicate={handleDuplicateSection}
                  />

                  {/* Render ONLY the currently active section card */}
                  {compositeSections[Math.min(activeSectionTab, compositeSections.length - 1)] && (
                    <CompositeSectionCard
                      key={compositeSections[Math.min(activeSectionTab, compositeSections.length - 1)].id}
                      section={compositeSections[Math.min(activeSectionTab, compositeSections.length - 1)]}
                      index={Math.min(activeSectionTab, compositeSections.length - 1)}
                      totalSections={compositeSections.length}
                      words={words}
                      otherSectionsWordIndices={getOtherSectionsWordIndices(Math.min(activeSectionTab, compositeSections.length - 1))}
                      onUpdateSection={handleUpdateSection}
                      onMoveUp={handleMoveUpSection}
                      onMoveDown={handleMoveDownSection}
                      onDelete={handleDeleteSection}
                      onDuplicate={handleDuplicateSection}
                      onOpenQuickAddModal={(sectionIdx) => setQuickAddSectionIndex(sectionIdx)}
                      isCollapsed={false}
                      isHighlighted={highlightedSectionIndex === Math.min(activeSectionTab, compositeSections.length - 1)}
                      isFocused={focusedSectionIndex === Math.min(activeSectionTab, compositeSections.length - 1)}
                      onFocus={handleFocusSection}
                    />
                  )}
                </div>
              ) : (
                /* --- ACCORDION / LIST MODE: All sections with Sticky Quick-Nav & Collapse --- */
                <div className="space-y-4" data-testid="composite-accordion-view">
                  <CompositeQuickNav
                    sections={compositeSections}
                    activeSectionIndex={highlightedSectionIndex}
                    focusedSectionIndex={focusedSectionIndex}
                    onJumpToSection={handleJumpToSection}
                    onAddSection={handleAddSection}
                    onAddAllSections={handleAddAllSections}
                    onCollapseAll={handleCollapseAll}
                    onExpandAll={handleExpandAll}
                    focusMode={focusMode}
                    onToggleFocusMode={handleToggleFocusMode}
                  />

                  <div className="space-y-3">
                    {compositeSections.map((sec, idx) => (
                      <CompositeSectionCard
                        key={sec.id}
                        section={sec}
                        index={idx}
                        totalSections={compositeSections.length}
                        words={words}
                        otherSectionsWordIndices={getOtherSectionsWordIndices(idx)}
                        onUpdateSection={handleUpdateSection}
                        onMoveUp={handleMoveUpSection}
                        onMoveDown={handleMoveDownSection}
                        onDelete={handleDeleteSection}
                        onDuplicate={handleDuplicateSection}
                        onOpenQuickAddModal={(sectionIdx) => setQuickAddSectionIndex(sectionIdx)}
                        isCollapsed={collapsedSectionIds.has(sec.id)}
                        onToggleCollapse={() => handleToggleCollapse(idx)}
                        isHighlighted={highlightedSectionIndex === idx}
                        isFocused={focusedSectionIndex === idx}
                        onFocus={handleFocusSection}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Typography & Appearance Settings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
                3
              </span>
              {worksheetMode === 'composite'
                ? 'Tuỳ Chọn Trình Bày Chung (Toàn Tài Liệu)'
                : 'Tuỳ Chọn Trình Bày & Khung Viền'}
            </h2>

            {worksheetMode === 'composite' ? (
              /* Composite Mode: General settings ONLY contain Paper Size and Spacing (and Title) */
              <div className="space-y-4 text-sm">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu Đề Toàn Bài (Master Title)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề phiếu bài tập..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>

                {/* Paper Size */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Khổ Giấy (Paper Size)
                    </label>
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                      {paperSize.toUpperCase()}
                    </span>
                  </div>
                  <select
                    data-testid="single-papersize-select"
                    value={paperSize}
                    onChange={(e) => {
                      const ps = e.target.value as 'a5' | 'a4';
                      setPaperSize(ps);
                      handleGeneratePreview(undefined, undefined, undefined, { paperSize: ps });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800"
                  >
                    <option value="a5">Khổ A5 (Mặc định - Lề hẹp 0.5")</option>
                    <option value="a4">Khổ A4 (Chuẩn)</option>
                  </select>
                </div>

                {/* Spacing between parts (Word-style pt options) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Khoảng Cách Giữa Các Phần (Spacing - Chuẩn Word)
                    </label>
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                      {spacing} pt
                    </span>
                  </div>
                  <select
                    data-testid="single-spacing-select"
                    value={spacing}
                    onChange={(e) => {
                      const sp = Number(e.target.value);
                      setSpacing(sp);
                      handleGeneratePreview(undefined, undefined, undefined, { spacing: sp });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800"
                  >
                    {SPACING_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Khoảng cách phân cách giữa các phần bài tập tính theo point (pt) như trong Microsoft Word. Phông chữ và cỡ chữ được chọn nhanh trực tiếp ở từng bài tập phía trên.
                  </p>
                </div>

                {/* Universal Image Size */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      Kích Thước Hình Ảnh Chung (Image Size)
                    </label>
                    <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                      {imageSize} mm ({imageSize === 12.7 ? '0.5 in' : `${(imageSize / 25.4).toFixed(1)} in`})
                    </span>
                  </div>
                  <select
                    data-testid="single-imagesize-select"
                    value={imageSize}
                    onChange={(e) => {
                      const sz = Number(e.target.value);
                      setImageSize(sz);
                      handleGeneratePreview(undefined, undefined, undefined, { imageSize: sz });
                    }}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800"
                  >
                    {IMAGE_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kích thước chuẩn áp dụng cho tất cả hình ảnh trong các phần bài tập. Mặc định là 0.5 x 0.5 inch (12.7 mm).
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {/* Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tiêu Đề Bài Tập (Title)
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Nhập tiêu đề phiếu bài tập..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                  />
                </div>

                {/* Paper Size & Font / Background Options */}
                {worksheetMode === 'composite' ? (
                  /* Composite Mode: Only Paper Size and Background are global options */
                  <div className="grid grid-cols-2 gap-3">
                    {/* Paper Size */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Khổ Giấy (Paper Size)</label>
                      <select
                        value={paperSize}
                        onChange={(e) => {
                          const ps = e.target.value as 'a5' | 'a4';
                          setPaperSize(ps);
                          handleGeneratePreview(undefined, undefined, undefined, { paperSize: ps });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      >
                        <option value="a5">Khổ A5 (Mặc định - Lề hẹp 0.5")</option>
                        <option value="a4">Khổ A4 (Chuẩn)</option>
                      </select>
                    </div>

                    {/* Background Frame */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Khung Viền Trang Trí (Background)
                      </label>
                      <select
                        value={background}
                        onChange={(e) => {
                          const bg = e.target.value;
                          setBackground(bg);
                          handleGeneratePreview(undefined, undefined, undefined, { background: bg });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                      >
                        {BACKGROUND_OPTIONS.map((bg) => (
                          <option key={bg.id} value={bg.id}>
                            {bg.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  /* Single Mode: Full global formatting options */
                  <>
                    {/* Paper Size & Font Size */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Paper Size */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Khổ Giấy (Paper Size)</label>
                        <select
                          value={paperSize}
                          onChange={(e) => {
                            const ps = e.target.value as 'a5' | 'a4';
                            setPaperSize(ps);
                            handleGeneratePreview(undefined, undefined, undefined, { paperSize: ps });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        >
                          <option value="a5">Khổ A5 (Mặc định - Lề hẹp 0.5")</option>
                          <option value="a4">Khổ A4 (Chuẩn)</option>
                        </select>
                      </div>

                      {/* Font Size */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Cỡ Chữ (Font Size)</label>
                        <select
                          value={fontSize}
                          data-testid="single-fontsize-select"
                          onChange={(e) => {
                            const sz = Number(e.target.value);
                            setFontSize(sz);
                            handleGeneratePreview(undefined, undefined, undefined, { fontSize: sz });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        >
                          {[10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                            <option key={sz} value={sz}>
                              {sz} pt {sz === 12 ? '(Mặc định chuẩn)' : sz === 22 ? '(Khuyên dùng cho Look & trace)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Font Family & Background */}
                    <div className="grid grid-cols-2 gap-3">
                      {/* Font Family */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Phông Chữ (Font)</label>
                        <select
                          value={fontFamily}
                          data-testid="single-fontfamily-select"
                          onChange={(e) => {
                            const ff = e.target.value as any;
                            setFontFamily(ff);
                            handleGeneratePreview(undefined, undefined, undefined, { fontFamily: ff });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        >
                          {FONT_OPTIONS.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Background Frame */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Khung Viền Trang Trí (Background)
                        </label>
                        <select
                          value={background}
                          onChange={(e) => {
                            const bg = e.target.value;
                            setBackground(bg);
                            handleGeneratePreview(undefined, undefined, undefined, { background: bg });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
                        >
                          {BACKGROUND_OPTIONS.map((bg) => (
                            <option key={bg.id} value={bg.id}>
                              {bg.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Spacing between parts (Word-style pt options) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Khoảng Cách Giữa Các Phần (Spacing - Chuẩn Word)
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                          {spacing} pt
                        </span>
                      </div>
                      <select
                        value={spacing}
                        data-testid="single-spacing-select"
                        onChange={(e) => {
                          const sp = Number(e.target.value);
                          setSpacing(sp);
                          handleGeneratePreview(undefined, undefined, undefined, { spacing: sp });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800"
                      >
                        {SPACING_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Độ giãn cách giữa hình ảnh, chữ cái và các dòng đáp án tính theo point (pt) như trong Microsoft Word.
                      </p>
                    </div>

                    {/* Universal Image Size */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Kích Thước Hình Ảnh (Image Size)
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                          {imageSize} mm ({imageSize === 12.7 ? '0.5 in' : `${(imageSize / 25.4).toFixed(1)} in`})
                        </span>
                      </div>
                      <select
                        value={imageSize}
                        onChange={(e) => {
                          const sz = Number(e.target.value);
                          setImageSize(sz);
                          handleGeneratePreview(undefined, undefined, undefined, { imageSize: sz });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800"
                      >
                        {IMAGE_SIZE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Kích thước chuẩn của hình ảnh minh hoạ từ vựng. Mặc định là 0.5 x 0.5 inch (12.7 mm).
                      </p>
                    </div>

                    {/* Chế Độ Đáp Án (Answer Mode) for Worksheet Types 1 to 20 */}
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].includes(worksheetType) && (
                      <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                            <span>🎯</span> Chế Độ Đáp Án (Answer Mode)
                          </label>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100/70 text-amber-800">
                            {answerMode === 'both' ? 'Cả 2 bản (HS + Đáp án)' : answerMode === 'answer' ? 'Đáp án hoàn chỉnh' : 'Học sinh làm bài'}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleSwitchAnswerMode('student')}
                            data-testid="answermode-student-btn"
                            className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                              answerMode === 'student'
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            📝 Học sinh
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchAnswerMode('answer')}
                            data-testid="answermode-answer-btn"
                            className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                              answerMode === 'answer'
                                ? 'bg-red-600 text-white border-red-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            🎯 Đáp án
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSwitchAnswerMode('both')}
                            data-testid="answermode-both-btn"
                            className={`py-2 px-2 rounded-lg border text-xs font-bold transition-all text-center cursor-pointer ${
                              answerMode === 'both'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            📑 Cả 2 Bản
                          </button>
                        </div>
                        <p className="text-[11px] text-amber-700">
                          {answerMode === 'both'
                            ? 'Đang ở chế độ gộp cả 2 bản: Trang đầu là bài tập cho học sinh, tiếp theo là trang đáp án hoàn chỉnh cho giáo viên.'
                            : answerMode === 'answer'
                            ? 'Đang bật hiển thị đáp án hoàn chỉnh bằng mực đỏ nổi bật cho giáo viên chấm bài.'
                            : 'Đang ở chế độ phiếu bài tập trống để học sinh tự làm bài.'}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Match Mode Option (Only for Type 3 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 3 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Tuỳ Chọn Nối (Loại 3)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {matchMode === 'look_match_write'
                          ? 'Look, match and write'
                          : (matchMode === 'sentence' ? 'Nối hình với Câu' : 'Nối hình với Từ vựng')}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {[
                        { value: 'word', label: 'Nối Từ vựng' },
                        { value: 'sentence', label: 'Nối Câu' },
                        { value: 'look_match_write', label: 'Look, match & write' }
                      ].map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            const val = opt.value as 'word' | 'sentence' | 'look_match_write';
                            setMatchMode(val);
                            let newTitle = title;
                            if (
                              title === 'Match picture with word' ||
                              title === 'Match picture with sentence' ||
                              title === 'Look, match and write'
                            ) {
                              newTitle = val === 'look_match_write'
                                ? 'Look, match and write'
                                : (val === 'sentence' ? 'Match picture with sentence' : 'Match picture with word');
                              setTitle(newTitle);
                              handleGeneratePreview(undefined, newTitle, 3, { matchMode: val });
                            } else {
                              handleGeneratePreview(undefined, undefined, 3, { matchMode: val });
                            }
                          }}
                          data-testid={`single-match-mode-${opt.value}`}
                          className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all ${
                            matchMode === opt.value
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Sub-options for Look, match and write */}
                    {matchMode === 'look_match_write' && (
                      <div className="pt-2.5 border-t border-indigo-100/80 space-y-2.5">
                        {/* Suffix shuffle option */}
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-indigo-900">Xáo trộn Cột Hậu tố (Cột 2):</span>
                            <span className="text-[10px] text-indigo-600 font-semibold">
                              {lookMatchWriteShuffleSuffix ? 'Xáo trộn độc lập' : 'Cùng hàng như ảnh mẫu'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setLookMatchWriteShuffleSuffix(false);
                                handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteShuffleSuffix: false });
                              }}
                              data-testid="single-look-shuffle-false"
                              className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                                !lookMatchWriteShuffleSuffix
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              Cùng hàng (như mẫu)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLookMatchWriteShuffleSuffix(true);
                                handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteShuffleSuffix: true });
                              }}
                              data-testid="single-look-shuffle-true"
                              className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                                lookMatchWriteShuffleSuffix
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
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
                              {lookMatchWriteMode === 'blank' ? 'Để trống tự viết (__)' : 'Chữ nét đứt để tô (Trace)'}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setLookMatchWriteMode('trace');
                                handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteMode: 'trace' });
                              }}
                              data-testid="single-look-writemode-trace"
                              className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                                lookMatchWriteMode === 'trace'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              Chữ nét đứt (Trace)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setLookMatchWriteMode('blank');
                                handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteMode: 'blank' });
                              }}
                              data-testid="single-look-writemode-blank"
                              className={`py-1.5 px-2 rounded-lg border text-[11px] font-medium transition-all ${
                                lookMatchWriteMode === 'blank'
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              Để trống tự viết (__)
                            </button>
                          </div>
                        </div>

                        {/* Trace Font Size option */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-indigo-900">Cỡ Chữ Cột Viết / Trace:</span>
                            <span className="text-[10px] text-indigo-600 font-semibold">
                              {lookMatchWriteTraceFontSize} pt
                            </span>
                          </div>
                          <select
                            value={lookMatchWriteTraceFontSize}
                            onChange={(e) => {
                              const sz = Number(e.target.value);
                              setLookMatchWriteTraceFontSize(sz);
                              handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteTraceFontSize: sz });
                            }}
                            data-testid="single-look-trace-font-size-select"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-2xs"
                          >
                            {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                              <option key={sz} value={sz}>
                                {sz} pt {sz === 28 ? '(Mặc định - Chuẩn tập viết 28 pt)' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-[10px] text-slate-400">
                            Cột chữ 1 & 2 dùng cỡ chữ chung ({fontSize} pt), cột Trace dùng cỡ to riêng (26-28 pt) để học sinh dễ viết.
                          </p>
                        </div>

                        {/* Baseline toggle */}
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] font-semibold text-indigo-900">Dòng kẻ gạch đứt chân chữ:</span>
                          <button
                            type="button"
                            onClick={() => {
                              const nextVal = !lookMatchWriteShowBaseline;
                              setLookMatchWriteShowBaseline(nextVal);
                              handleGeneratePreview(undefined, undefined, 3, { lookMatchWriteShowBaseline: nextVal });
                            }}
                            data-testid="single-look-baseline-toggle"
                            className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${
                              lookMatchWriteShowBaseline
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-600 border-slate-200'
                            }`}
                          >
                            {lookMatchWriteShowBaseline ? 'Đang bật' : 'Đang tắt'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Match Hint Dots Option (Only for Type 3 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 3 && (
                  <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-1.5 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-emerald-900">
                        Gợi Ý Nối (Đốm Màu)
                      </label>
                      <span className="text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                        {matchHint === 'match'
                          ? 'Màu tương ứng theo cặp'
                          : matchHint === 'side'
                          ? 'Phân biệt 2 bên (Trái/Phải)'
                          : matchHint === 'multi'
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
                          onClick={() => {
                            const val = opt.value as MatchHintMode;
                            setMatchHint(val);
                            handleGeneratePreview(undefined, undefined, 3, { matchHint: val });
                          }}
                          data-testid={`single-match-hint-${opt.value}`}
                          className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                            matchHint === opt.value
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    {/* Chế Độ Đáp Án */}
                    <div className="pt-2 border-t border-emerald-200/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-emerald-900">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 3, { answerMode: opt.value });
                            }}
                            data-testid={`single-type3-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
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

                {/* Layout Mode & Options (Only for Type 4 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 4 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>✍️</span> Tuỳ Chọn Bài Tập Điền Chữ (Loại 4)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Loại 4
                      </span>
                    </div>

                    {/* 1. Chọn Bố Cục */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-indigo-950">
                        Chế Độ Bố Cục
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setType4LayoutMode('grid');
                            handleGeneratePreview(undefined, undefined, 4, { type4LayoutMode: 'grid' });
                          }}
                          data-testid="type4-layout-grid-btn"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                            type4LayoutMode === 'grid'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Lưới 12 tranh
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setType4LayoutMode('table');
                            const newTitle = (!title || title === 'English Worksheet' || title === 'Điền chữ cái còn thiếu')
                              ? 'Look and write'
                              : title;
                            setTitle(newTitle);
                            handleGeneratePreview(undefined, newTitle, 4, {
                              type4LayoutMode: 'table',
                              type4ColumnMode,
                              type4TraceFontSize,
                              type4AlphabetTargetLetter
                            });
                          }}
                          data-testid="type4-layout-table-btn"
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all ${
                            type4LayoutMode === 'table'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          Bảng hàng ngang (Look and write)
                        </button>
                      </div>
                    </div>

                    {/* 2. Cấu hình chi tiết */}
                    {type4LayoutMode === 'table' ? (
                      <div className="space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-indigo-950">
                            Kiểu Cột Gợi Ý (Chữ Cái Đầu & Cuối)
                          </label>
                          <select
                            value={type4ColumnMode}
                            onChange={(e) => {
                              const cm = e.target.value as Type4ColumnMode;
                              setType4ColumnMode(cm);
                              handleGeneratePreview(undefined, undefined, 4, {
                                type4LayoutMode: 'table',
                                type4ColumnMode: cm,
                                type4TraceFontSize,
                                type4AlphabetTargetLetter
                              });
                            }}
                            data-testid="type4-column-mode-select"
                            className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                          >
                            {TYPE4_COLUMN_OPTIONS.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {type4ColumnMode === 'alphabet_order' && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-semibold text-indigo-950">
                              Luyện tới chữ cái theo bảng chữ cái:
                            </label>
                            <select
                              value={type4AlphabetTargetLetter}
                              onChange={(e) => {
                                const letter = e.target.value;
                                setType4AlphabetTargetLetter(letter);
                                handleGeneratePreview(undefined, undefined, 4, {
                                  type4LayoutMode: 'table',
                                  type4ColumnMode,
                                  type4TraceFontSize,
                                  type4AlphabetTargetLetter: letter
                                });
                              }}
                              data-testid="type4-alphabet-target-letter-select"
                              className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                            >
                              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(97 + i)).map((letter) => (
                                <option key={letter} value={letter}>
                                  Chữ {letter.toUpperCase()} (Luyện từ A đến {letter.toUpperCase()})
                                </option>
                              ))}
                            </select>
                            <p className="text-[11px] text-slate-500 italic">
                              Học sinh sẽ đồ và điền tất cả các chữ cái từ A đến chữ được chọn (Ví dụ: chọn C sẽ luyện A, B, C).
                            </p>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-indigo-950">
                            Cỡ Chữ Gợi Ý Cần Đồ (Trace Font Size)
                          </label>
                          <select
                            value={type4TraceFontSize}
                            onChange={(e) => {
                              const sz = Number(e.target.value);
                              setType4TraceFontSize(sz);
                              handleGeneratePreview(undefined, undefined, 4, {
                                type4LayoutMode: 'table',
                                type4ColumnMode,
                                type4TraceFontSize: sz,
                                type4AlphabetTargetLetter
                              });
                            }}
                            data-testid="type4-trace-font-size-select"
                            className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                          >
                            {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                              <option key={sz} value={sz}>
                                {sz} pt {sz === 28 ? '(Mặc định - Chuẩn tập viết 28 pt)' : ''}
                              </option>
                            ))}
                          </select>
                          <p className="text-[11px] text-slate-400">
                            Cỡ chữ của chữ cái nét chấm mờ KG Primary Dots để học sinh tập tô.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-indigo-950">
                          Chế Độ Đục Lỗ Chữ Cái (Blank Mode)
                        </label>
                        <select
                          value={blankMode}
                          onChange={(e) => {
                            const bm = e.target.value as BlankMode;
                            setBlankMode(bm);
                            handleGeneratePreview(undefined, undefined, 4, {
                              type4LayoutMode: 'grid',
                              blankMode: bm
                            });
                          }}
                          data-testid="type4-blank-mode-select"
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

                    {/* Chế Độ Đáp Án */}
                    <div className="pt-2 border-t border-indigo-100/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 4, { answerMode: opt.value });
                            }}
                            data-testid={`single-type4-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Choice Count & Layout Option (Only for Type 6 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 6 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Kiểu Lựa Chọn (Loại 6 - Multiple Choice)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {choiceLayout === 'horizontal' ? '2 lựa chọn ngang' : `${choiceCount} lựa chọn dọc`}
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
                            ? choiceLayout === 'horizontal'
                            : choiceLayout === 'vertical' && choiceCount === opt.count;
                        return (
                          <button
                            key={`${opt.count}-${opt.layout}`}
                            type="button"
                            onClick={() => {
                              const countVal = opt.count as 2 | 3;
                              const layoutVal = opt.layout;
                              setChoiceCount(countVal);
                              setChoiceLayout(layoutVal);
                              handleGeneratePreview(undefined, undefined, undefined, {
                                choiceCount: countVal,
                                choiceLayout: layoutVal
                              });
                            }}
                            data-testid={`single-choice-count-${opt.count}-${opt.layout}`}
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

                    {/* Chế Độ Đáp Án */}
                    <div className="pt-2 border-t border-indigo-100/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 6, { answerMode: opt.value });
                            }}
                            data-testid={`single-type6-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 7 Options: Unscramble */}
                {worksheetMode === 'single' && worksheetType === 7 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Tuỳ Chọn Sắp Xếp Chữ Cái (Loại 7 - Unscramble)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chế Độ Đáp Án
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 7, { answerMode: opt.value });
                            }}
                            data-testid={`single-type7-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 8 Options: Look and trace */}
                {worksheetMode === 'single' && worksheetType === 8 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Tuỳ Chọn Tập Tô Từ Vựng (Loại 8 - Look and trace)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chế Độ Đáp Án
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 8, { answerMode: opt.value });
                            }}
                            data-testid={`single-type8-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 9 Options: Look and color Yes/No */}
                {worksheetMode === 'single' && worksheetType === 9 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Tuỳ Chọn Nhìn Câu Tô Màu Yes/No (Loại 9)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                      </span>
                    </div>

                    {/* Seed Randomizer for Yes/No answer sequence */}
                    <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg border border-indigo-100">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 block">Thứ Tự Đáp Án Ngẫu Nhiên</span>
                        <span className="text-[10px] text-slate-500 block">Mỗi lần bấm sẽ đảo vị trí Yes/No và đồng bộ đáp án</span>
                      </div>
                      <button
                        type="button"
                        data-testid="type9-randomize-seed-btn"
                        onClick={() => {
                          const newSeed = Date.now();
                          setType9Seed(newSeed);
                          handleGeneratePreview(undefined, undefined, 9, { type9Seed: newSeed });
                        }}
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
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 9, { answerMode: opt.value });
                            }}
                            data-testid={`single-type9-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 10 Options: Look and color */}
                {worksheetMode === 'single' && worksheetType === 10 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-indigo-900">
                        Tuỳ Chọn Nhìn Từ Tô Màu Tranh (Loại 10)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chế Độ Đáp Án
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 10, { answerMode: opt.value });
                            }}
                            data-testid={`single-type10-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Wordsearch Puzzle Options (Only for Type 13 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 13 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🧩</span> Cấu Hình Tìm Từ Trong Ô Chữ (Wordsearch Puzzle)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Nét đứt chấm bi
                      </span>
                    </div>

                    {/* Hướng từ vựng */}
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
                          const isChecked = wordsearchDirections.includes(dir.id as WordsearchDirection);
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
                                    next = [...wordsearchDirections, dir.id as WordsearchDirection];
                                  } else {
                                    next = wordsearchDirections.filter((d) => d !== dir.id);
                                    if (next.length === 0) next = ['horizontal'];
                                  }
                                  setWordsearchDirections(next);
                                  handleGeneratePreview(undefined, undefined, 13, { wordsearchDirections: next });
                                }}
                                className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                              />
                              <span>{dir.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Gợi ý */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Hiển Thị Gợi Ý (Hint Mode)
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'word', label: 'Chữ (Từ vựng)' },
                          { value: 'image', label: 'Hình ảnh' },
                          { value: 'both', label: 'Cả hình & chữ' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as WordsearchHintType;
                              setWordsearchHintType(val);
                              handleGeneratePreview(undefined, undefined, 13, { wordsearchHintType: val });
                            }}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              wordsearchHintType === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kích thước lưới */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-semibold text-slate-700">
                          Kích Thước Khung Ô Chữ (Grid Size)
                        </label>
                        <span className="text-[11px] text-slate-500">
                          {wordsearchGridSize === 'auto' ? 'Tự động tính phù hợp' : `${wordsearchGridSize} x ${wordsearchGridSize} ô`}
                        </span>
                      </div>
                      <select
                        value={wordsearchGridSize}
                        onChange={(e) => {
                          const val = e.target.value === 'auto' ? 'auto' : Number(e.target.value);
                          setWordsearchGridSize(val);
                          handleGeneratePreview(undefined, undefined, 13, { wordsearchGridSize: val });
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

                    {/* Đường viền ô chữ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Đường Viền Ô Chữ (Grid Border)
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
                            onClick={() => {
                              const val = opt.value as WordsearchGridBorder;
                              setWordsearchGridBorder(val);
                              handleGeneratePreview(undefined, undefined, 13, { wordsearchGridBorder: val });
                            }}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              wordsearchGridBorder === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Định dạng chữ cái */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Định Dạng Chữ Cái (Letter Casing)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'lower', label: 'Chữ thường (abc - Mặc định)' },
                          { value: 'upper', label: 'Chữ hoa (ABC)' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as WordsearchCase;
                              setWordsearchCase(val);
                              handleGeneratePreview(undefined, undefined, 13, { wordsearchCase: val });
                            }}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              wordsearchCase === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Reshuffle Button: Sinh ô chữ mới đồng bộ cả Đề & Đáp Án */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const newSeed = Date.now();
                          setWordsearchSeed(newSeed);
                          handleGeneratePreview(undefined, undefined, 13, { wordsearchSeed: newSeed });
                        }}
                        className="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        title="Tạo bố cục ô chữ mới ngẫu nhiên (Đề học sinh và Bản đáp án sẽ luôn trùng khớp nhau 100%)"
                      >
                        <span>🎲</span> Đổi bảng ô chữ mới (Xáo trộn lại)
                      </button>
                    </div>
                  </div>
                )}

                {/* Type 14 Options: Target Letter & Show Word Labels */}
                {worksheetMode === 'single' && worksheetType === 14 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🔤</span> Tuỳ Chọn Bài Tập Khoanh Tranh (Loại 14)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Lưới 4x2
                      </span>
                    </div>

                    {/* Target Letter Input + 26 A-Z Buttons */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chữ Cái Mục Tiêu (Target Letter)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={targetLetter}
                          onChange={(e) => {
                            const val = e.target.value;
                            setTargetLetter(val);
                            const newTitle = `Circle the pictures that have letter ${val}`;
                            setTitle(newTitle);
                            handleGeneratePreview(undefined, newTitle, 14, { targetLetter: val });
                          }}
                          placeholder="V"
                          data-testid="target-letter-input"
                          className="w-16 px-3 py-1.5 text-center font-bold text-base bg-white border border-slate-300 rounded-lg text-indigo-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((lettr) => {
                            const currentTarget = (targetLetter || 'V').trim().toUpperCase();
                            const isSelected = currentTarget === lettr || currentTarget.split(/[\s,/\\|_-]+/).includes(lettr);
                            return (
                              <button
                                key={lettr}
                                type="button"
                                onClick={() => {
                                  setTargetLetter(lettr);
                                  const newTitle = `Circle the pictures that have letter ${lettr}`;
                                  setTitle(newTitle);
                                  handleGeneratePreview(undefined, newTitle, 14, { targetLetter: lettr });
                                }}
                                data-testid={`type14-letter-btn-${lettr}`}
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
                        Chữ cái này sẽ được tự động đồng bộ vào tiêu đề và tô đỏ nổi bật trên file PDF.
                      </p>
                    </div>

                    {/* Answer Mode Toggle for Type 14 */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-slate-700">
                          Chế Độ Tạo Bản In (Answer Mode)
                        </label>
                        <span className="text-[11px] font-bold text-indigo-600">
                          {answerMode === 'answer' ? 'Đáp án hoàn chỉnh' : 'Học sinh làm bài'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Bản Học Sinh (Không khoanh)', desc: 'Học sinh tự làm bài' },
                          { value: 'answer' as const, label: 'Bản Đáp Án (Khoanh đỏ)', desc: 'Khoanh tròn tranh đúng' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 14, { answerMode: opt.value });
                            }}
                            data-testid={`single-type14-answermode-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                              answerMode === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-bold">{opt.label}</div>
                            <div className={`text-[10px] ${answerMode === opt.value ? 'text-indigo-100' : 'text-slate-400'}`}>
                              {opt.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Show Word Labels Toggle */}
                    <div>
                      <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white border border-indigo-100 hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={showWordLabels}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setShowWordLabels(val);
                            handleGeneratePreview(undefined, undefined, 14, { showWordLabels: val });
                          }}
                          data-testid="show-word-labels-toggle"
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">Hiển thị từ vựng bên dưới tranh</span>
                          <span className="text-slate-400 block text-[11px]">Bật để học sinh đọc từ, hoặc tắt để học sinh tự nhận diện qua tranh</span>
                        </div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Type 15 Options: Read and circle */}
                {worksheetMode === 'single' && worksheetType === 15 && (
                  <div data-testid="type15-options-panel" className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🔘</span> Tuỳ Chọn Đọc & Khoanh Tranh (Loại 15)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                      </span>
                    </div>

                    {/* Seed Randomizer for A/B & distractor answer sequence (giống Loại 9) */}
                    <div className="flex items-center justify-between p-2.5 bg-white/80 rounded-lg border border-indigo-100">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-slate-800 block">Thứ Tự Đáp Án Ngẫu Nhiên</span>
                        <span className="text-[10px] text-slate-500 block">Mỗi lần bấm sẽ đảo vị trí A/B & tranh nhiễu và đồng bộ đáp án</span>
                      </div>
                      <button
                        type="button"
                        data-testid="type15-randomize-seed-btn"
                        onClick={() => {
                          const newSeed = Date.now() + Math.floor(Math.random() * 10000);
                          setType15Seed(newSeed);
                          handleGeneratePreview(undefined, undefined, 15, { type15Seed: newSeed });
                        }}
                        className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RefreshCw className="w-3 h-3" />
                        🎲 Đổi bộ đáp án
                      </button>
                    </div>

                    {/* Answer Mode Toggle (giống Loại 9) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chế Độ Đáp Án
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 15, { answerMode: opt.value });
                            }}
                            data-testid={`single-type15-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
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
                            onClick={() => {
                              const val = opt.value as 'ab' | 'checkbox' | 'none';
                              setType15ChoiceMode(val);
                              handleGeneratePreview(undefined, undefined, 15, { type15ChoiceMode: val });
                            }}
                            data-testid={`type15-choice-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type15ChoiceMode === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Border Style (tham khảo phong cách loại 13) */}
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
                            onClick={() => {
                              const val = opt.value as 'full' | 'outerOnly' | 'none';
                              setType15Border(val);
                              handleGeneratePreview(undefined, undefined, 15, { type15Border: val });
                            }}
                            data-testid={`type15-border-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type15Border === opt.value
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
                          onClick={() => {
                            setType15NumberStyle('none');
                            handleGeneratePreview(undefined, undefined, 15, { type15NumberStyle: 'none' });
                          }}
                          data-testid="type15-numstyle-none"
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            type15NumberStyle === 'none'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Không (Mặc định)
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setType15NumberStyle('traditional');
                            handleGeneratePreview(undefined, undefined, 15, { type15NumberStyle: 'traditional' });
                          }}
                          data-testid="type15-numstyle-traditional"
                          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all ${
                            type15NumberStyle === 'traditional'
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

                {/* Type 16 Options: Look and circle sound */}
                {worksheetMode === 'single' && worksheetType === 16 && (
                  <div data-testid="type16-options-panel" className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🔤</span> Tuỳ Chọn Nhìn Tranh Khoanh Âm (Loại 16)
                      </label>
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
                            onClick={() => {
                              const val = opt.value as Type16SoundMode;
                              setType16SoundMode(val);
                              setTitle(opt.title);
                              handleGeneratePreview(undefined, opt.title, 16, { type16SoundMode: val });
                            }}
                            data-testid={`type16-sound-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type16SoundMode === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Choice Count */}
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
                            onClick={() => {
                              const val = opt.value as Type16ChoiceCount;
                              setType16ChoiceCount(val);
                              handleGeneratePreview(undefined, undefined, 16, { type16ChoiceCount: val });
                            }}
                            data-testid={`type16-choice-count-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type16ChoiceCount === opt.value
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
                            onClick={() => {
                              const val = opt.value as Type16Layout;
                              setType16Layout(val);
                              handleGeneratePreview(undefined, undefined, 16, { type16Layout: val });
                            }}
                            data-testid={`type16-layout-${opt.value}`}
                            className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                              type16Layout === opt.value
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
                            onClick={() => {
                              const val = opt.value as Type16LetterCase;
                              setType16LetterCase(val);
                              handleGeneratePreview(undefined, undefined, 16, { type16LetterCase: val });
                            }}
                            data-testid={`type16-case-${opt.value}`}
                            className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                              type16LetterCase === opt.value
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
                            onClick={() => {
                              const val = opt.value as Type16Border;
                              setType16Border(val);
                              handleGeneratePreview(undefined, undefined, 16, { type16Border: val });
                            }}
                            data-testid={`type16-border-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type16Border === opt.value
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

                {/* Type 17 Options: Look and Color the Words / Cross out extra letters */}
                {worksheetMode === 'single' && worksheetType === 17 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🎨</span> Tuỳ Chọn Tìm & Tô Chữ / Gạch Chữ Thừa (Loại 17)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        {type17TaskMode === 'cross' ? 'Cross Extra' : 'Color Words'}
                      </span>
                    </div>

                    {/* Task Mode */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Dạng Bài Tập (Task Mode)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'color', label: '🎨 Tô màu chữ đúng (Look & color)' },
                          { value: 'cross', label: '❌ Gạch bỏ chữ dư (Cross out extra)' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type17TaskMode;
                              setType17TaskMode(val);
                              const defaultTitle = val === 'cross'
                                ? 'Cross out (/) the extra letters.'
                                : 'Look and color the words';
                              if (title === 'Look and color the words' || title === 'Cross out (/) the extra letters.') {
                                setTitle(defaultTitle);
                                handleGeneratePreview(undefined, defaultTitle, 17, { type17TaskMode: val });
                              } else {
                                handleGeneratePreview(undefined, undefined, 17, { type17TaskMode: val });
                              }
                            }}
                            data-testid={`type17-task-mode-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type17TaskMode === opt.value
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
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'lower', label: 'Chữ thường (b, a, l, l)' },
                          { value: 'upper', label: 'Chữ hoa (B, A, L, L)' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type17LetterCase;
                              setType17LetterCase(val);
                              handleGeneratePreview(undefined, undefined, 17, { type17LetterCase: val });
                            }}
                            data-testid={`type17-case-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type17LetterCase === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Strip Length */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Độ Dài Băng Ô Chữ (Strip Length)
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { value: 'auto', label: 'Tự động' },
                          { value: 6, label: '6 ô' },
                          { value: 8, label: '8 ô' },
                          { value: 10, label: '10 ô' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type17StripLength;
                              setType17StripLength(val);
                              handleGeneratePreview(undefined, undefined, 17, { type17StripLength: val });
                            }}
                            data-testid={`type17-strip-length-${opt.value}`}
                            className={`py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                              type17StripLength === opt.value
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
                        Đường Viền Ô Chữ (Letter Strip Border)
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
                            onClick={() => {
                              const val = opt.value as Type17Border;
                              setType17Border(val);
                              handleGeneratePreview(undefined, undefined, 17, { type17Border: val });
                            }}
                            data-testid={`type17-border-${opt.value}`}
                            className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                              type17Border === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Card Border & Demonstration Example & Highlight */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Khung Bao Quanh Mục (Card Frame)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'none', label: 'Không đóng khung' },
                            { value: 'rounded', label: 'Khung bo chấm đứt' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const val = opt.value as Type17CardBorder;
                                setType17CardBorder(val);
                                handleGeneratePreview(undefined, undefined, 17, { type17CardBorder: val });
                              }}
                              data-testid={`type17-card-border-${opt.value}`}
                              className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                                type17CardBorder === opt.value
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Chế Độ Hiển Thị Đáp Án (Answer Key)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: 'none', label: 'Học sinh làm' },
                            { value: 'red', label: 'Hiện đáp án đỏ' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const val = opt.value as Type17HighlightTarget;
                                setType17HighlightTarget(val);
                                const newAnsMode = val === 'red' ? 'answer' : 'student';
                                setAnswerMode(newAnsMode);
                                handleGeneratePreview(undefined, undefined, 17, { type17HighlightTarget: val, answerMode: newAnsMode });
                              }}
                              data-testid={`type17-highlight-${opt.value}`}
                              className={`py-2 px-2 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                                type17HighlightTarget === opt.value
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

                    {/* Example demonstration checkbox */}
                    <div className="pt-1">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={type17ShowExample}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setType17ShowExample(val);
                            handleGeneratePreview(undefined, undefined, 17, { type17ShowExample: val });
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {type17TaskMode === 'cross'
                            ? 'Kèm câu đầu làm mẫu gạch chéo chữ dư (/) (Demonstration Example)'
                            : 'Kèm câu đầu làm mẫu tô màu chữ đúng (Demonstration Example)'}
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Type 18 Options: Color the letters */}
                {worksheetMode === 'single' && worksheetType === 18 && (
                  <div data-testid="type18-options-panel" className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🔤</span> Tuỳ Chọn Tô Màu Chữ Cái Mục Tiêu (Loại 18)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        WS 9 Circles • Border Box
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
                          value={type18TargetLetter}
                          onChange={(e) => {
                            const val = (e.target.value || 'E').toUpperCase();
                            setType18TargetLetter(val);
                            const upperChar = val;
                            const lowerChar = val.toLowerCase();
                            const newTitle = type18Mode === 'upper_only'
                              ? `Color ${upperChar} ${type18ColorUpper}`
                              : type18Mode === 'lower_only'
                              ? `Color ${lowerChar} ${type18ColorLower}`
                              : type18Mode === 'single_color'
                              ? `Color letter ${upperChar} and ${lowerChar} ${type18ColorUpper}`
                              : `Color ${upperChar} ${type18ColorUpper} and ${lowerChar} ${type18ColorLower}`;
                            setTitle(newTitle);
                            handleGeneratePreview(undefined, newTitle, 18, { type18TargetLetter: val });
                          }}
                          data-testid="type18-target-letter-input"
                          className="w-14 px-3 py-1.5 text-center font-black text-lg bg-white border border-slate-300 rounded-lg text-indigo-700 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex flex-wrap gap-1 flex-1">
                          {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((lettr) => (
                            <button
                              key={lettr}
                              type="button"
                              onClick={() => {
                                setType18TargetLetter(lettr);
                                const upperChar = lettr;
                                const lowerChar = lettr.toLowerCase();
                                const newTitle = type18Mode === 'upper_only'
                                  ? `Color ${upperChar} ${type18ColorUpper}`
                                  : type18Mode === 'lower_only'
                                  ? `Color ${lowerChar} ${type18ColorLower}`
                                  : type18Mode === 'single_color'
                                  ? `Color letter ${upperChar} and ${lowerChar} ${type18ColorUpper}`
                                  : `Color ${upperChar} ${type18ColorUpper} and ${lowerChar} ${type18ColorLower}`;
                                setTitle(newTitle);
                                handleGeneratePreview(undefined, newTitle, 18, { type18TargetLetter: lettr });
                              }}
                              data-testid={`type18-letter-btn-${lettr}`}
                              className={`w-7 h-7 text-xs font-bold rounded-md border flex items-center justify-center transition-all ${
                                type18TargetLetter.toUpperCase() === lettr
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
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
                        Dạng Bài Tập (Task Mode)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'both', label: 'Cả Hoa & Thường (Color E & e)' },
                          { value: 'upper_only', label: 'Chỉ chữ Hoa (Color E)' },
                          { value: 'lower_only', label: 'Chỉ chữ Thường (Color e)' },
                          { value: 'single_color', label: 'Chung 1 màu (Color E & e)' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type18Mode;
                              setType18Mode(val);
                              const upperChar = type18TargetLetter.toUpperCase();
                              const lowerChar = type18TargetLetter.toLowerCase();
                              const newTitle = val === 'upper_only'
                                ? `Color ${upperChar} ${type18ColorUpper}`
                                : val === 'lower_only'
                                ? `Color ${lowerChar} ${type18ColorLower}`
                                : val === 'single_color'
                                ? `Color letter ${upperChar} and ${lowerChar} ${type18ColorUpper}`
                                : `Color ${upperChar} ${type18ColorUpper} and ${lowerChar} ${type18ColorLower}`;
                              setTitle(newTitle);
                              handleGeneratePreview(undefined, newTitle, 18, { type18Mode: val });
                            }}
                            data-testid={`type18-mode-${opt.value}`}
                            className={`py-2 px-2.5 rounded-lg border text-xs font-semibold transition-all ${
                              type18Mode === opt.value
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colors */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Màu Chữ Hoa (Upper Color)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(TYPE18_COLOR_MAP).slice(0, 4).map(([cKey, cVal]) => (
                            <button
                              key={cKey}
                              type="button"
                              onClick={() => {
                                setType18ColorUpper(cKey);
                                const upperChar = type18TargetLetter.toUpperCase();
                                const lowerChar = type18TargetLetter.toLowerCase();
                                const newTitle = type18Mode === 'upper_only'
                                  ? `Color ${upperChar} ${cKey}`
                                  : type18Mode === 'lower_only'
                                  ? `Color ${lowerChar} ${type18ColorLower}`
                                  : type18Mode === 'single_color'
                                  ? `Color letter ${upperChar} and ${lowerChar} ${cKey}`
                                  : `Color ${upperChar} ${cKey} and ${lowerChar} ${type18ColorLower}`;
                                setTitle(newTitle);
                                handleGeneratePreview(undefined, newTitle, 18, { type18ColorUpper: cKey });
                              }}
                              data-testid={`type18-color-upper-${cKey}`}
                              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                type18ColorUpper === cKey
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cVal.hex }} />
                              {cVal.viName}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Màu Chữ Thường (Lower Color)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {Object.entries(TYPE18_COLOR_MAP).slice(0, 4).map(([cKey, cVal]) => (
                            <button
                              key={cKey}
                              type="button"
                              onClick={() => {
                                setType18ColorLower(cKey);
                                const upperChar = type18TargetLetter.toUpperCase();
                                const lowerChar = type18TargetLetter.toLowerCase();
                                const newTitle = type18Mode === 'upper_only'
                                  ? `Color ${upperChar} ${type18ColorUpper}`
                                  : type18Mode === 'lower_only'
                                  ? `Color ${lowerChar} ${cKey}`
                                  : type18Mode === 'single_color'
                                  ? `Color letter ${upperChar} and ${lowerChar} ${type18ColorUpper}`
                                  : `Color ${upperChar} ${type18ColorUpper} and ${lowerChar} ${cKey}`;
                                setTitle(newTitle);
                                handleGeneratePreview(undefined, newTitle, 18, { type18ColorLower: cKey });
                              }}
                              data-testid={`type18-color-lower-${cKey}`}
                              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                                type18ColorLower === cKey
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cVal.hex }} />
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
                            { r: 4, c: 7, label: '4 x 7 (28 ô)' },
                            { r: 3, c: 6, label: '3 x 6 (18 ô)' },
                            { r: 4, c: 6, label: '4 x 6 (24 ô)' },
                            { r: 5, c: 7, label: '5 x 7 (35 ô)' }
                          ].map((opt) => (
                            <button
                              key={`${opt.r}x${opt.c}`}
                              type="button"
                              onClick={() => {
                                setType18GridRows(opt.r);
                                setType18GridCols(opt.c);
                                handleGeneratePreview(undefined, undefined, 18, {
                                  type18GridRows: opt.r,
                                  type18GridCols: opt.c
                                });
                              }}
                              data-testid={`type18-grid-${opt.r}x${opt.c}`}
                              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all text-center ${
                                type18GridRows === opt.r && type18GridCols === opt.c
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Khung Viền Bao Ngoài (Border)
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
                              onClick={() => {
                                const val = opt.value as Type18Border;
                                setType18Border(val);
                                handleGeneratePreview(undefined, undefined, 18, { type18Border: val });
                              }}
                              data-testid={`type18-border-${opt.value}`}
                              className={`py-1.5 px-1.5 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                                type18Border === opt.value
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

                    {/* Circle Style & Distractor Casing & Answer Key */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Kiểu Hình Tròn (WS 9)
                        </label>
                        <div className="grid grid-cols-3 gap-1">
                          {[
                            { value: 'solid', label: 'Liền' },
                            { value: 'dashed', label: 'Đứt' },
                            { value: 'double', label: 'Đôi' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const val = opt.value as Type18CircleStyle;
                                setType18CircleStyle(val);
                                handleGeneratePreview(undefined, undefined, 18, { type18CircleStyle: val });
                              }}
                              data-testid={`type18-circle-${opt.value}`}
                              className={`py-1 text-[11px] font-semibold rounded border text-center ${
                                type18CircleStyle === opt.value
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
                            { value: 'upper', label: 'Hoa' },
                            { value: 'lower', label: 'Thường' },
                            { value: 'mixed', label: 'Hỗn hợp' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const val = opt.value as Type18DistractorCasing;
                                setType18DistractorCasing(val);
                                handleGeneratePreview(undefined, undefined, 18, { type18DistractorCasing: val });
                              }}
                              data-testid={`type18-casing-${opt.value}`}
                              className={`py-1 text-[11px] font-semibold rounded border text-center ${
                                type18DistractorCasing === opt.value
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
                              onClick={() => {
                                const val = opt.value as Type18HighlightTarget;
                                setType18HighlightTarget(val);
                                handleGeneratePreview(undefined, undefined, 18, { type18HighlightTarget: val });
                              }}
                              data-testid={`type18-key-${opt.value}`}
                              className={`py-1 text-[11px] font-semibold rounded border text-center ${
                                type18HighlightTarget === opt.value
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

                {/* Type 19 Options: Mê Cung Từ Vựng (Textbook Vocabulary Maze Puzzle) */}
                {worksheetMode === 'single' && worksheetType === 19 && (
                  <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-emerald-100/80 pb-2">
                      <label className="block text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                        <span>🌀</span> Cấu Hình Mê Cung Từ Vựng (Loại 19)
                      </label>
                      <span className="text-[11px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-semibold">
                        Chuẩn SGK Tiếng Anh
                      </span>
                    </div>

                    {/* 1. Dạng Mê Cung (Maze Variant) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Dạng Bài Tập Mê Cung (Theo Sách Giáo Khoa)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          {
                            value: 'single_goal',
                            title: '🎯 Dạng 1: Tìm Đến Đích',
                            desc: 'Đi qua từ Bộ chính để tới đích, từ Bộ ôn tập ở lối cụt.'
                          },
                          {
                            value: 'multi_exit',
                            title: '🔀 Dạng 2: Rẽ Nhánh Ra Cửa',
                            desc: 'Find and say. Có 2-4 lối thoát, mỗi lối dẫn đến 1 đồ vật/con vật.'
                          }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type19MazeMode;
                              setType19MazeMode(val);
                              let newChar = type19EntranceCharacter;
                              if (val === 'multi_exit' && type19EntranceCharacter === 'boy') {
                                newChar = 'girl';
                                setType19EntranceCharacter('girl');
                              } else if (val === 'single_goal' && type19EntranceCharacter === 'girl') {
                                newChar = 'boy';
                                setType19EntranceCharacter('boy');
                              }
                              const newWall = val === 'multi_exit' ? 'orange' : type19WallColor;
                              if (val === 'multi_exit' && type19WallColor !== 'orange') {
                                setType19WallColor('orange');
                              }
                              const primaryWord = (words.find((w) => w.deckRole !== 'review') || words[0])?.term || 'goal';
                              const charLabel = newChar === 'random' ? 'our friend' : newChar.charAt(0).toUpperCase() + newChar.slice(1);
                              const newTitle = val === 'single_goal'
                                ? `Game: Help ${charLabel} find the ${primaryWord}. Draw a line.`
                                : 'Game: Find and say.';
                              setTitle(newTitle);
                              handleGeneratePreview(undefined, newTitle, 19, {
                                type19MazeMode: val,
                                type19EntranceCharacter: newChar,
                                type19WallColor: newWall
                              });
                            }}
                            data-testid={`single-type19-mode-${opt.value}`}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              type19MazeMode === opt.value
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-bold">{opt.title}</div>
                            <div className={`text-[10px] mt-0.5 leading-tight ${type19MazeMode === opt.value ? 'text-emerald-100' : 'text-slate-500'}`}>
                              {opt.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Nhân Vật Ở Cổng Vào & Đích Đến */}
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
                              onClick={() => {
                                const val = c.value as Type19EntranceCharacter;
                                setType19EntranceCharacter(val);
                                handleGeneratePreview(undefined, undefined, 19, { type19EntranceCharacter: val });
                              }}
                              data-testid={`single-type19-entrance-${c.value}`}
                              title={c.label}
                              className={`py-1.5 px-1 rounded-lg border text-[11px] font-semibold transition-all flex flex-col items-center gap-1 ${
                                type19EntranceCharacter === c.value
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

                      {type19MazeMode === 'multi_exit' && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Bóng Thoại (Gợi Ý Câu)
                          </label>
                          <input
                            type="text"
                            value={type19SentenceStem}
                            onChange={(e) => {
                              setType19SentenceStem(e.target.value);
                              handleGeneratePreview(undefined, undefined, 19, { type19SentenceStem: e.target.value });
                            }}
                            className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                            placeholder="There's a _____."
                          />
                        </div>
                      )}
                    </div>

                    {/* 3. Màu Sắc & Độ Dày Tường Mê Cung */}
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
                              onClick={() => {
                                const val = c.value as Type19WallColor;
                                setType19WallColor(val);
                                handleGeneratePreview(undefined, undefined, 19, { type19WallColor: val });
                              }}
                              data-testid={`single-type19-wall-color-${c.value}`}
                              className={`flex flex-col items-center gap-1 p-1 rounded-lg border transition-all text-center ${
                                type19WallColor === c.value
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
                            { value: 'medium', label: 'Vừa SGK' },
                            { value: 'thick', label: 'Đậm nét' }
                          ].map((w) => (
                            <button
                              key={w.value}
                              type="button"
                              onClick={() => {
                                const val = w.value as Type19WallThickness;
                                setType19WallThickness(val);
                                handleGeneratePreview(undefined, undefined, 19, { type19WallThickness: val });
                              }}
                              data-testid={`single-type19-thickness-${w.value}`}
                              className={`py-1.5 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                                type19WallThickness === w.value
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
                          Tạo Mẫu Mê Cung Mới
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const newSeed = Math.floor(Math.random() * 100000);
                            setType19MazeSeed(newSeed);
                            handleGeneratePreview(undefined, undefined, 19, { type19MazeSeed: newSeed });
                          }}
                          data-testid="single-type19-randomize-seed"
                          className="w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
                        >
                          <span>🎲</span> Đổi Hình Mê Cung
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                
                {/* Type 20 Options: Ô Chữ Giao Nhau (Textbook Criss-Cross Words) */}
                {worksheetMode === 'single' && worksheetType === 20 && (
                  <div data-testid="single-type20-options-panel" className="p-4 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-4 transition-all">
                    <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                      <label className="block text-xs font-bold text-amber-950 flex items-center gap-1.5">
                        <span>🧩</span> Cấu Hình Ô Chữ Giao Nhau (Loại 20)
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const freshSeed = Date.now() + Math.floor(Math.random() * 10000);
                            setType20Seed(freshSeed);
                            handleGeneratePreview(undefined, undefined, 20, { type20Seed: freshSeed });
                          }}
                          data-testid="single-type20-randomize-seed"
                          className="px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold rounded-lg border border-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
                          title="Sinh ngẫu nhiên cách giao nhau mới giữa các từ"
                        >
                          <span>🎲 Đổi Bố Cục</span>
                        </button>
                        <span className="text-[11px] text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded font-semibold">
                          Chuẩn SGK Look, read and write
                        </span>
                      </div>
                    </div>

                    {/* 0. Kiểu Bố Cục Ô Chữ */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kiểu Bố Cục Ô Chữ (Crossword Layout Mode)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'connected', label: '🧩 Lưới Liên Hoàn (Đa từ)', desc: 'Ghép nhiều từ liên thông như YourHomework.net' },
                          { value: 'pairs', label: '🔲 Cặp Từ Mini (2 từ)', desc: 'Mỗi khung gồm đúng 2 từ cắt nhau' }
                        ].map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => {
                              const val = m.value as Type20GridMode;
                              setType20GridMode(val);
                              handleGeneratePreview(undefined, undefined, 20, { type20GridMode: val });
                            }}
                            data-testid={`single-type20-grid-mode-${m.value}`}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              type20GridMode === m.value
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-bold">{m.label}</div>
                            <div className={`text-[10px] mt-0.5 ${type20GridMode === m.value ? 'text-amber-100' : 'text-slate-500'}`}>
                              {m.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 1. Chế độ khuyết chữ (Hint Mode) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Chế Độ Khuyết Chữ (Hint Mode)
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { value: 'all_blank', label: '⭕ Trống toàn bộ (Chuẩn)', desc: '100% ô trống để học sinh tự viết' },
                          { value: 'intersection_blank', label: '🎯 Khuyết ô giao nhau', desc: 'Có sẵn chữ khác, chỉ điền ô giao' },
                          { value: 'missing_vowels', label: '🔤 Khuyết nguyên âm', desc: 'A, E, I, O, U' },
                          { value: 'full_answer', label: '👁️ Đầy đủ chữ', desc: 'Đáp án / Mẫu đọc' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              const val = opt.value as Type20HintMode;
                              setType20HintMode(val);
                              handleGeneratePreview(undefined, undefined, 20, { type20HintMode: val });
                            }}
                            data-testid={`single-type20-hint-mode-${opt.value}`}
                            className={`p-2.5 rounded-lg border text-left transition-all ${
                              type20HintMode === opt.value
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="text-xs font-bold">{opt.label}</div>
                            <div className={`text-[10px] mt-0.5 ${type20HintMode === opt.value ? 'text-amber-100' : 'text-slate-500'}`}>
                              {opt.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 2. Kiểu viền ô & Kiểu nét vẽ (Tham khảo Loại 13) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Kiểu Viền Ô Chữ (Tham khảo Loại 13)
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {[
                            { value: 'full', label: '⏹️ Đầy đủ (Full)' },
                            { value: 'outerOnly', label: '🔲 Chỉ viền ngoài (Loại 13)' },
                            { value: 'none', label: '🚫 Không viền' }
                          ].map((b) => (
                            <button
                              key={b.value}
                              type="button"
                              onClick={() => {
                                const val = b.value as Type20GridBorder;
                                setType20GridBorder(val);
                                handleGeneratePreview(undefined, undefined, 20, { type20GridBorder: val });
                              }}
                              data-testid={`single-type20-grid-border-${b.value}`}
                              className={`py-2 px-1 rounded-lg border text-[11px] font-semibold transition-all text-center ${
                                type20GridBorder === b.value
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
                          Kiểu Nét Vẽ (Line Style - Tham khảo Loại 13)
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { value: 'solid', label: '➖ Nét liền SGK' },
                            { value: 'dotted', label: '⋯ Nét đứt (Dotted - Loại 13)' }
                          ].map((s) => (
                            <button
                              key={s.value}
                              type="button"
                              onClick={() => {
                                const val = s.value as Type20LineStyle;
                                setType20LineStyle(val);
                                handleGeneratePreview(undefined, undefined, 20, { type20LineStyle: val });
                              }}
                              data-testid={`single-type20-line-style-${s.value}`}
                              className={`py-2 px-2 rounded-lg border text-xs font-semibold transition-all text-center ${
                                type20LineStyle === s.value
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {s.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 3. Màu sắc viền & Số cặp/trang & Kiểu chữ */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Màu Sắc Viền Ô
                        </label>
                        <div className="grid grid-cols-5 gap-1">
                          {[
                            { value: 'orange', label: 'Cam', color: '#f97316' },
                            { value: 'amber', label: 'Hổ phách', color: '#f59e0b' },
                            { value: 'slate', label: 'Xám', color: '#94a3b8' },
                            { value: 'blue', label: 'Lam', color: '#2563eb' },
                            { value: 'indigo', label: 'Chàm', color: '#4f46e5' },
                            { value: 'green', label: 'Lá', color: '#16a34a' },
                            { value: 'emerald', label: 'Ngọc', color: '#10b981' },
                            { value: 'purple', label: 'Tím', color: '#7c3aed' },
                            { value: 'red', label: 'Đỏ', color: '#dc2626' }
                          ].map((c) => (
                            <button
                              key={c.value}
                              type="button"
                              title={c.label}
                              onClick={() => {
                                const val = c.value as Type20BorderColor;
                                setType20BorderColor(val);
                                handleGeneratePreview(undefined, undefined, 20, { type20BorderColor: val });
                              }}
                              data-testid={`single-type20-border-color-${c.value}`}
                              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border transition-all text-center ${
                                type20BorderColor === c.value
                                  ? 'bg-white border-amber-600 ring-2 ring-amber-500/20 shadow-xs font-bold'
                                  : 'bg-white/70 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: c.color }} />
                              <span className="text-[10px] truncate max-w-full">{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {type20GridMode === 'pairs' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Số Cặp Ô Chữ / Trang
                          </label>
                          <div className="grid grid-cols-4 gap-1">
                            {[
                              { value: 'auto', label: 'Tự động' },
                              { value: 2, label: '2 cặp' },
                              { value: 3, label: '3 cặp' },
                              { value: 4, label: '4 cặp' }
                            ].map((opt) => (
                              <button
                                key={String(opt.value)}
                                type="button"
                                onClick={() => {
                                  const val = opt.value as Type20PuzzlesPerPage;
                                  setType20PuzzlesPerPage(val);
                                  handleGeneratePreview(undefined, undefined, 20, { type20PuzzlesPerPage: val });
                                }}
                                data-testid={`single-type20-puzzles-per-page-${opt.value}`}
                                className={`py-2 px-1 rounded-lg border text-xs font-semibold transition-all text-center ${
                                  type20PuzzlesPerPage === opt.value
                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <label className="block text-xs font-semibold text-emerald-800 mb-1.5">
                            Quy Mô Lưới Ô Chữ
                          </label>
                          <div className="py-2 px-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 text-[11px] font-medium flex items-center gap-1.5">
                            <span className="text-sm">🧩</span>
                            <span>Ghép toàn bộ từ vựng vào 1 khung duy nhất</span>
                          </div>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Kiểu Chữ Cái
                        </label>
                        <div className="grid grid-cols-2 gap-1.5">
                          {[
                            { value: 'upper', label: 'IN HOA (ABC)' },
                            { value: 'lower', label: 'in thường (abc)' }
                          ].map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => {
                                const val = opt.value as Type20Casing;
                                setType20Casing(val);
                                handleGeneratePreview(undefined, undefined, 20, { type20Casing: val });
                              }}
                              data-testid={`single-type20-casing-${opt.value}`}
                              className={`py-2 px-1.5 rounded-lg border text-xs font-semibold transition-all text-center ${
                                type20Casing === opt.value
                                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* 4. Toggles hiển thị */}
                    <div className="flex flex-wrap items-center gap-4 pt-1 border-t border-amber-200/50">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={type20ShowClueImage}
                          onChange={(e) => {
                            setType20ShowClueImage(e.target.checked);
                            handleGeneratePreview(undefined, undefined, 20, { type20ShowClueImage: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>🖼️ Hiện tranh minh họa</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={type20ShowClueNumber}
                          onChange={(e) => {
                            setType20ShowClueNumber(e.target.checked);
                            handleGeneratePreview(undefined, undefined, 20, { type20ShowClueNumber: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>🔢 Đánh số thứ tự (Bỏ chọn để Bỏ đánh số)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={type20HollowArrows}
                          onChange={(e) => {
                            setType20HollowArrows(e.target.checked);
                            handleGeneratePreview(undefined, undefined, 20, { type20HollowArrows: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>🏹 Mũi tên nét rỗng (Tiết kiệm mực in)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-700">
                        <input
                          type="checkbox"
                          checked={type20ShowTrace}
                          onChange={(e) => {
                            setType20ShowTrace(e.target.checked);
                            handleGeneratePreview(undefined, undefined, 20, { type20ShowTrace: e.target.checked });
                          }}
                          className="w-3.5 h-3.5 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                        />
                        <span>✏️ Chữ mờ cho học sinh tập tô</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Type 1 Options: Sentence Reorder / Rewrite */}
                {worksheetMode === 'single' && worksheetType === 1 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>✏️</span> Tuỳ Chọn Viết Lại Câu (Loại 1)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Reorder / Rewrite
                      </span>
                    </div>

                    {/* 1. Toggle: Scramble sentence */}
                    <div>
                      <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl bg-white border border-indigo-100 hover:bg-slate-50 transition-colors">
                        <input
                          type="checkbox"
                          checked={sentenceScramble}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setSentenceScramble(val);
                            handleGeneratePreview(undefined, undefined, 1, { sentenceScramble: val });
                          }}
                          data-testid="sentence-scramble-toggle"
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                        />
                        <div className="text-xs">
                          <span className="font-semibold text-slate-800">Xáo trộn các từ trong câu</span>
                          <span className="text-slate-400 block text-[11px]">Bật để học sinh sắp xếp lại từ, tắt để giữ nguyên thứ tự câu</span>
                        </div>
                      </label>
                    </div>

                    {/* 2. Word Separator (when scrambled) */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Phân Cách Từ Xáo Trộn
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSentenceSeparator('space');
                            handleGeneratePreview(undefined, undefined, 1, { sentenceSeparator: 'space' });
                          }}
                          data-testid="separator-space-btn"
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                            sentenceSeparator === 'space'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Cách đều nhau
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSentenceSeparator('slash');
                            handleGeneratePreview(undefined, undefined, 1, { sentenceSeparator: 'slash' });
                          }}
                          data-testid="separator-slash-btn"
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                            sentenceSeparator === 'slash'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Cách nhau bởi ' / '
                        </button>
                      </div>
                    </div>

                    {/* Phông Chữ Từ Gợi Ý */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Phông Chữ Từ Gợi Ý
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-medium">
                          {sentenceWordsFont === 'Andika' ? 'Andika chuẩn tiểu học' : 'Theo bài tập'}
                        </span>
                      </div>
                      <select
                        value={sentenceWordsFont}
                        onChange={(e) => {
                          const val = e.target.value as 'inherit' | 'Andika';
                          setSentenceWordsFont(val);
                          handleGeneratePreview(undefined, undefined, 1, { sentenceWordsFont: val });
                        }}
                        data-testid="type1-words-font-select"
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                      >
                        <option value="inherit">Theo bài tập</option>
                        <option value="Andika">Andika chuẩn tiểu học</option>
                      </select>
                    </div>

                    {/* 3. Hint Style */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kiểu Dòng Gợi Ý Viết
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSentenceHintStyle('underscores');
                            handleGeneratePreview(undefined, undefined, 1, { sentenceHintStyle: 'underscores' });
                          }}
                          data-testid="hint-underscores-btn"
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                            sentenceHintStyle === 'underscores'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          2 gạch '__' cho 1 chữ cái
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSentenceHintStyle('dots');
                            handleGeneratePreview(undefined, undefined, 1, { sentenceHintStyle: 'dots' });
                          }}
                          data-testid="hint-dots-btn"
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                            sentenceHintStyle === 'dots'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Dòng chấm '...'
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSentenceHintStyle('trace');
                            handleGeneratePreview(undefined, undefined, 1, {
                              sentenceHintStyle: 'trace',
                              sentenceTraceFontSize
                            });
                          }}
                          data-testid="hint-trace-btn"
                          className={`px-3 py-2 text-xs font-medium rounded-xl border transition-all ${
                            sentenceHintStyle === 'trace'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Chữ nét đứt (Trace cho lớp 1)
                        </button>
                      </div>
                    </div>

                    {/* Dedicated Trace Font Size for Type 1 */}
                    {sentenceHintStyle === 'trace' && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-semibold text-indigo-950">
                            Cỡ Chữ Gợi Ý Cần Đồ (Trace Font Size)
                          </label>
                          <span className="text-[11px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded font-semibold">
                            {sentenceTraceFontSize} pt
                          </span>
                        </div>
                        <select
                          value={sentenceTraceFontSize}
                          onChange={(e) => {
                            const sz = Number(e.target.value);
                            setSentenceTraceFontSize(sz);
                            handleGeneratePreview(undefined, undefined, 1, {
                              sentenceHintStyle: 'trace',
                              sentenceTraceFontSize: sz
                            });
                          }}
                          data-testid="type1-trace-font-size-select"
                          className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                        >
                          {[16, 18, 20, 22, 24, 26, 28, 30, 32, 36].map((sz) => (
                            <option key={sz} value={sz}>
                              {sz} pt {sz === 28 ? '(Mặc định - Chuẩn tập viết 28 pt)' : sz === 26 ? '(Khuyên dùng A5 - 26 pt)' : ''}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-slate-400">
                          Cỡ chữ đề bài ở trên dùng cỡ chuẩn ({fontSize} pt), dòng chữ Trace nét đứt KG Primary Dots bên dưới dùng cỡ lớn riêng (26-28 pt) để học sinh lớp 1 dễ tập tô.
                        </p>
                      </div>
                    )}

                    {/* Chế Độ Đáp Án */}
                    <div className="pt-2 border-t border-indigo-100/60">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 1, { answerMode: opt.value });
                            }}
                            data-testid={`single-type1-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 2 Options */}
                {worksheetMode === 'single' && worksheetType === 2 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>📝</span> Tuỳ Chọn Nhìn Tranh Viết Từ (Loại 2)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Lưới 3x4
                      </span>
                    </div>
                    {/* Chế Độ Đáp Án */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 2, { answerMode: opt.value });
                            }}
                            data-testid={`single-type2-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Type 5 Options */}
                {worksheetMode === 'single' && worksheetType === 5 && (
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🖋️</span> Tuỳ Chọn Luyện Viết Ô Ly (Loại 5)
                      </label>
                      <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                        Font HP001
                      </span>
                    </div>
                    {/* Chế Độ Đáp Án */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-semibold text-slate-700">
                          Chế Độ Đáp Án
                        </label>
                        <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                          {answerMode === 'answer' ? 'Đáp án' : 'Học sinh'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: 'student' as const, label: 'Học sinh' },
                          { value: 'answer' as const, label: 'Đáp án' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => {
                              setAnswerMode(opt.value);
                              handleGeneratePreview(undefined, undefined, 5, { answerMode: opt.value });
                            }}
                            data-testid={`single-type5-answermode-${opt.value}`}
                            className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition-all ${
                              answerMode === opt.value
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

                {/* Toggles for Header, Footer, Image Borders (Default: Hidden/Removed) */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700">
                      Ẩn / Hiện Chi Tiết (Mặc định đã tắt):
                    </span>
                    <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                      Không viền & Tiêu đề
                    </span>
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <input
                      type="checkbox"
                      checked={showHeader}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowHeader(val);
                        handleGeneratePreview(undefined, undefined, undefined, { showHeader: val });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">Hiện tiêu đề trên đầu trang</span>
                      <span className="text-slate-400 block text-[11px]">Tiêu đề bài học ở dòng đầu tiên của trang</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <input
                      type="checkbox"
                      checked={showFooter}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowFooter(val);
                        handleGeneratePreview(undefined, undefined, undefined, { showFooter: val });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">Hiện chân trang (Footer & Số trang)</span>
                      <span className="text-slate-400 block text-[11px]">Dòng link &quot;Learn:...&quot; và số thứ tự trang</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <input
                      type="checkbox"
                      checked={showImageBorder}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowImageBorder(val);
                        handleGeneratePreview(undefined, undefined, undefined, { showImageBorder: val });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">Hiện khung viền quanh hình ảnh</span>
                      <span className="text-slate-400 block text-[11px]">Đóng khung viền vuông/bo góc bao quanh các tranh</span>
                    </div>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-slate-100">
                    <input
                      type="checkbox"
                      checked={showTableGrid}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setShowTableGrid(val);
                        handleGeneratePreview(undefined, undefined, undefined, { showTableGrid: val });
                      }}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-slate-800">Hiện đường kẻ ô bảng (Table Grid)</span>
                      <span className="text-slate-400 block text-[11px]">Kẻ nét đứt phân chia các ô và cột bài tập (Mặc định: Tắt)</span>
                    </div>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Word Checklist (Single mode only) */}
          {worksheetMode === 'single' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center font-semibold">
                    4
                  </span>
                  Chọn Từ Vựng ({selectedWordIndices.size}/{words.length})
                </h2>

                <div className="flex gap-2">
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
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto border border-slate-100 rounded-xl">
                {words.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    Chưa có từ vựng nào. Vui lòng nạp dữ liệu ở Bước 1.
                  </div>
                ) : (
                  words.map((w, idx) => {
                    const isChecked = selectedWordIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleToggleWord(idx)}
                        className={`p-3 flex items-center justify-between cursor-pointer transition-colors ${
                          isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 shrink-0" />
                          )}
                          {w.imageUrl ? (
                            <SmartImage
                              src={
                                w.imageUrl.startsWith('http')
                                  ? `/api/proxy-image?url=${encodeURIComponent(w.imageUrl)}`
                                  : w.imageUrl
                              }
                              alt={w.term}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0 bg-slate-100"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                              No Pic
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-bold text-slate-900">{w.term}</span>
                              {w.sourceDeckTitle && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200/60 font-medium">
                                  {w.sourceDeckTitle}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {w.definition} {w.phonetic && <span className="text-slate-400">({w.phonetic})</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">#{idx + 1}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Live PDF Preview & Download (7 cols) */}
        <div className="lg:col-span-7 sticky top-24 space-y-4">
          <div data-testid="pdf-preview-card" className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2.5">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Xem Trước File PDF</h3>
              </div>

              {/* 3-Mode Segmented Preview Selector */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold shadow-2xs" data-testid="preview-mode-selector">
                <button
                  type="button"
                  onClick={() => handleSwitchAnswerMode('student')}
                  data-testid="preview-mode-student-btn"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    answerMode === 'student'
                      ? 'bg-amber-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem trước Bản Học Sinh (để trống làm bài)"
                >
                  <span>📝 Bản Học Sinh</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAnswerMode('answer')}
                  data-testid="preview-mode-answer-btn"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    answerMode === 'answer'
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem trước Bản Đáp Án (mực đỏ giáo viên)"
                >
                  <span>🎯 Bản Đáp Án</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchAnswerMode('both')}
                  data-testid="preview-mode-both-btn"
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    answerMode === 'both'
                      ? 'bg-indigo-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="Xem trước Cả 2 Bản (Gộp Bản Học Sinh + Bản Đáp Án)"
                >
                  <span>📑 Cả 2 Bản (HS + Đáp Án)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const freshSeed = Date.now() + Math.floor(Math.random() * 10000);
                    setType9Seed(freshSeed);
                    setType15Seed(freshSeed);
                    setType20Seed(freshSeed);
                    if (worksheetMode === 'composite') {
                      const nextSecs = compositeSections.map((s) =>
                        s.type === 9
                          ? { ...s, type9Seed: freshSeed }
                          : s.type === 15
                          ? { ...s, type15Seed: freshSeed }
                          : s.type === 20
                          ? { ...s, type20Seed: freshSeed }
                          : s
                      );
                      setCompositeSections(nextSecs);
                      handleGeneratePreview(undefined, undefined, undefined, { type9Seed: freshSeed, type15Seed: freshSeed, type20Seed: freshSeed }, nextSecs, 'composite');
                    } else {
                      handleGeneratePreview(undefined, undefined, undefined, { type9Seed: freshSeed, type15Seed: freshSeed, type20Seed: freshSeed });
                    }
                  }}
                  disabled={isGeneratingPDF}
                  data-testid="preview-refresh-btn"
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
                  Làm mới
                </button>
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Mở tab mới
                  </a>
                )}
              </div>
            </div>

            {/* Composite Mode: Dedicated Focused Section Preview Toolbar */}
            {worksheetMode === 'composite' && compositeSections.length > 0 && (
              <div
                data-testid="composite-preview-focus-bar"
                className="flex items-center justify-between flex-wrap gap-2.5 p-3 bg-gradient-to-r from-indigo-50/90 via-sky-50/80 to-purple-50/90 border border-indigo-200/90 rounded-xl text-xs shadow-2xs"
              >
                {/* Active Section Indicator / Title */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Target className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
                    {compositePreviewScope === 'focused' ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-600 font-medium">Đang xem riêng:</span>
                        <span className="px-2 py-0.5 bg-indigo-600 text-white rounded-md font-extrabold shadow-2xs">
                          Bài #{focusedSectionIndex + 1}
                        </span>
                        <span
                          className="text-indigo-950 font-bold max-w-[200px] truncate"
                          title={compositeSections[focusedSectionIndex]?.title}
                        >
                          {compositeSections[focusedSectionIndex]?.title || `Loại ${compositeSections[focusedSectionIndex]?.type}`}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-semibold bg-white/80 px-1.5 py-0.5 rounded border border-indigo-200/60 hidden sm:inline">
                          Loại {compositeSections[focusedSectionIndex]?.type} • {compositeSections[focusedSectionIndex]?.selectedWordIndices?.length || 0} từ
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-slate-600 font-medium">Đang xem:</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-white rounded-md font-bold shadow-2xs">
                          Toàn bộ đề
                        </span>
                        <span className="text-slate-600 font-medium">
                          ({compositeSections.length} phần bài tập)
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Scope Toggle & Prev/Next Navigation */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Scope Selector: Focused vs All */}
                  <div className="flex items-center bg-white/90 p-0.5 rounded-lg border border-indigo-200 shadow-2xs" data-testid="preview-scope-toggle">
                    <button
                      type="button"
                      onClick={() => handleTogglePreviewScope('focused')}
                      data-testid="preview-scope-focused-btn"
                      className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer text-xs ${
                        compositePreviewScope === 'focused'
                          ? 'bg-indigo-600 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-indigo-700 hover:bg-indigo-50'
                      }`}
                      title="Chỉ hiển thị phần bài tập đang sửa để theo dõi nhanh không cần cuộn trang"
                    >
                      <Target className="w-3.5 h-3.5" />
                      <span>🎯 Xem Riêng Bài #{focusedSectionIndex + 1}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTogglePreviewScope('all')}
                      data-testid="preview-scope-all-btn"
                      className={`px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer text-xs ${
                        compositePreviewScope === 'all'
                          ? 'bg-slate-800 text-white shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                      title="Xem toàn bộ đề gồm tất cả các trang bài tập"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>📑 Toàn Bộ Đề</span>
                    </button>
                  </div>

                  {/* Previous / Next Section buttons (in focused mode) */}
                  {compositePreviewScope === 'focused' && compositeSections.length > 1 && (
                    <div className="flex items-center gap-1 bg-white/90 p-0.5 rounded-lg border border-indigo-200 shadow-2xs">
                      <button
                        type="button"
                        disabled={focusedSectionIndex <= 0}
                        onClick={() => handleNavigateFocusedSection(focusedSectionIndex - 1)}
                        data-testid="preview-focus-prev-btn"
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                        title="Xem bài trước đó"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono font-bold text-slate-700 px-1">
                        {focusedSectionIndex + 1}/{compositeSections.length}
                      </span>
                      <button
                        type="button"
                        disabled={focusedSectionIndex >= compositeSections.length - 1}
                        onClick={() => handleNavigateFocusedSection(focusedSectionIndex + 1)}
                        data-testid="preview-focus-next-btn"
                        className="p-1 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors"
                        title="Xem bài kế tiếp"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PDF Viewer Container */}
            <div data-testid="pdf-preview-container" className="w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center min-h-[720px] relative">
              {isGeneratingPDF ? (
                <div className="text-center p-8 space-y-3">
                  <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
                  <p className="text-sm font-medium text-slate-600">Đang khởi tạo bản vẽ PDF chất lượng cao...</p>
                  <p className="text-xs text-slate-400">Đang xử lý hình ảnh và font chữ ô ly</p>
                </div>
              ) : pdfBlobUrl ? (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF Preview"
                  className="w-full h-[760px] rounded-xl border-none shadow-inner"
                />
              ) : (
                <div className="text-center p-8 space-y-3 text-slate-400">
                  <FileText className="w-12 h-12 stroke-1 mx-auto text-slate-300" />
                  <p className="text-sm">Chưa có bản xem trước</p>
                  <button
                    onClick={() => handleGeneratePreview()}
                    disabled={worksheetType !== 18 && words.length === 0}
                    data-testid="generate-worksheet-btn"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Tạo Worksheet
                  </button>
                </div>
              )}
            </div>

            {/* Quick Download Footer inside preview card */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs text-slate-500">
              <span>
                {worksheetMode === 'composite' ? (
                  <>
                    Định dạng: {paperSize === 'a5' ? 'Khổ A5 (148mm x 210mm)' : 'Khổ A4 (210mm x 297mm)'} • Cách phần: {spacing}pt • Cỡ ảnh: {imageSize}mm • Tổng hợp ({compositeSections.length} phần)
                  </>
                ) : (
                  <>
                    Định dạng: {paperSize === 'a5' ? 'Khổ A5 (148mm x 210mm) - Lề hẹp 0.5"' : 'Khổ A4 (210mm x 297mm)'} • {fontFamily} ({fontSize}pt) • Cách: {spacing}pt • Cỡ ảnh: {imageSize}mm
                  </>
                )}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium mr-1">Tải về máy:</span>
                <button
                  onClick={() => handleDownloadPDF('student')}
                  disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                  data-testid="footer-download-student-btn"
                  className="px-2.5 py-1 font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Tải riêng Bản Học Sinh (.pdf)"
                >
                  <Download className="w-3 h-3" />
                  Bản Học Sinh
                </button>
                <button
                  onClick={() => handleDownloadPDF('answer')}
                  disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                  data-testid="footer-download-answer-btn"
                  className="px-2.5 py-1 font-bold text-red-700 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Tải riêng Bản Đáp Án (.pdf)"
                >
                  <Download className="w-3 h-3" />
                  Bản Đáp Án
                </button>
                <button
                  onClick={() => handleDownloadPDF('both')}
                  disabled={isGeneratingPDF || (worksheetType !== 18 && words.length === 0)}
                  data-testid="footer-download-both-btn"
                  className="px-2.5 py-1 font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200/80 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Tải gộp Cả 2 Bản (Học Sinh + Đáp Án) (.pdf)"
                >
                  <Download className="w-3 h-3" />
                  Cả 2 Bản (Gộp)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Per-Section Multi-Deck Quick Add Modal */}
      <MultiDeckQuickAddModal
        isOpen={quickAddSectionIndex !== null}
        onClose={() => setQuickAddSectionIndex(null)}
        sectionIndex={quickAddSectionIndex ?? 0}
        sectionTitle={
          quickAddSectionIndex !== null && compositeSections[quickAddSectionIndex]
            ? compositeSections[quickAddSectionIndex].title
            : ''
        }
        currentSectionWords={
          quickAddSectionIndex !== null && compositeSections[quickAddSectionIndex]
            ? compositeSections[quickAddSectionIndex].selectedWordIndices
                .map((i) => words[i])
                .filter(Boolean)
            : []
        }
        librarySets={librarySets}
        onApplyWords={handleApplyQuickAddWords}
      />

      {/* Worksheet Template Manager Modal (Milestone 3) */}
      <WorksheetTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        onApply={handleApplyTemplate}
        currentCompositeSections={
          worksheetMode === 'single'
            ? [getCurrentSingleAsCompositeSection()]
            : compositeSections
        }
        onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
        initialShowSaveForm={initialShowSaveFormInModal}
      />
    </div>
  );
}
