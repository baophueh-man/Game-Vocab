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
  ListFilter
} from 'lucide-react';
import { getSets, saveSet, getImageFile } from '../lib/storage';
import { WordSet } from '../types';
import { generateId } from '../lib/utils';
import SmartImage from '../components/ui/SmartImage';
import WorksheetModeSwitch from '../components/worksheet/WorksheetModeSwitch';
import CompositeSectionCard, { UICompositeSection } from '../components/worksheet/CompositeSectionCard';
import CompositeSectionTabs from '../components/worksheet/CompositeSectionTabs';
import CompositeQuickNav from '../components/worksheet/CompositeQuickNav';
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
  Type16Border
} from '../utils/worksheetGenerator';

export default function WorksheetGenerator() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'link' (YourHomework link), 'library' (Existing WordSet), or 'multi' (Multiple sets from library)
  const [sourceMode, setSourceMode] = useState<'link' | 'library' | 'multi'>('link');
  const [lastLoadedMultiCount, setLastLoadedMultiCount] = useState<number | null>(null);
  const [quickAddSectionIndex, setQuickAddSectionIndex] = useState<number | null>(null);
  const [linkInput, setLinkInput] = useState<string>(
    searchParams.get('url') || searchParams.get('vocab') || 'https://yourhomework.net/vocab/589984573'
  );

  // Library sets
  const [librarySets, setLibrarySets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>(id || '');

  // Worksheet Mode: 'single' (Traditional single type) | 'composite' (Multi-section document)
  const [worksheetMode, setWorksheetMode] = useState<'single' | 'composite'>('single');
  const [compositeSections, setCompositeSections] = useState<UICompositeSection[]>([]);
  const [compositeViewMode, setCompositeViewMode] = useState<'tabs' | 'accordion'>('tabs');
  const [activeSectionTab, setActiveSectionTab] = useState<number>(0);
  const [collapsedSectionIds, setCollapsedSectionIds] = useState<Set<string>>(new Set());
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [highlightedSectionIndex, setHighlightedSectionIndex] = useState<number | null>(null);

  // Current Vocabulary Data
  const [title, setTitle] = useState<string>('Lớp 3 - Unit 6');
  const [sourceUrl, setSourceUrl] = useState<string>('https://yourhomework.net');
  const [words, setWords] = useState<WorksheetWord[]>([]);
  const [selectedWordIndices, setSelectedWordIndices] = useState<Set<number>>(new Set());

  // Worksheet Configuration
  const [worksheetType, setWorksheetType] = useState<WorksheetType>(4);
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots'>('r0c0i Linotte');
  const [blankMode, setBlankMode] = useState<BlankMode>('vowels');
  const [type4LayoutMode, setType4LayoutMode] = useState<Type4LayoutMode>('grid');
  const [type4ColumnMode, setType4ColumnMode] = useState<Type4ColumnMode>('both_trace_first');
  const [type4TraceFontSize, setType4TraceFontSize] = useState<number>(28);
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
  const [targetLetter, setTargetLetter] = useState<string>('V v');
  const [showWordLabels, setShowWordLabels] = useState<boolean>(true);
  const [sentenceScramble, setSentenceScramble] = useState<boolean>(true);
  const [sentenceSeparator, setSentenceSeparator] = useState<'space' | 'slash'>('space');
  const [sentenceHintStyle, setSentenceHintStyle] = useState<'underscores' | 'dots'>('underscores');
  const [type15NumberStyle, setType15NumberStyle] = useState<'none' | 'traditional'>('none');
  const [type15Border, setType15Border] = useState<'full' | 'outerOnly' | 'none'>('full');
  const [type15ChoiceMode, setType15ChoiceMode] = useState<'ab' | 'checkbox' | 'none'>('ab');
  const [type15LetterBandBg, setType15LetterBandBg] = useState<'tint' | 'white'>('white');
  const [type16SoundMode, setType16SoundMode] = useState<Type16SoundMode>('beginning');
  const [type16ChoiceCount, setType16ChoiceCount] = useState<Type16ChoiceCount>(3);
  const [type16Layout, setType16Layout] = useState<Type16Layout>('lettersLeft');
  const [type16LetterCase, setType16LetterCase] = useState<Type16LetterCase>('lower');
  const [type16Border, setType16Border] = useState<Type16Border>('none');
  const [background, setBackground] = useState<string>('');
  const [showHeader, setShowHeader] = useState<boolean>(false);
  const [showFooter, setShowFooter] = useState<boolean>(false);
  const [showImageBorder, setShowImageBorder] = useState<boolean>(false);
  const [showTableGrid, setShowTableGrid] = useState<boolean>(false);

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

  // Sensible default sections generator for Composite mode
  const createDefaultCompositeSections = (vocabWords: WorksheetWord[]): UICompositeSection[] => {
    const total = vocabWords.length;
    if (total === 0) {
      return [
        {
          id: generateId(),
          type: 4,
          title: 'Missing letters',
          targetWordCount: 4,
          selectedWordIndices: [],
          blankMode: 'vowels',
          pageBreakBefore: false
        },
        {
          id: generateId(),
          type: 6,
          title: 'Multiple choice',
          targetWordCount: 4,
          selectedWordIndices: [],
          blankMode: 'vowels',
          pageBreakBefore: false,
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

  // Section Management Handlers
  const handleAddSection = () => {
    const nextNum = compositeSections.length + 1;
    const defaultType: WorksheetType = nextNum % 2 === 1 ? 4 : 6;
    const titles: Record<WorksheetType, { title: string }> = {
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
      14: { title: 'Circle the pictures that have letter V v' },
      15: { title: 'Read the sentence and circle the correct picture.' },
      16: { title: 'Look and circle the beginning sound' }
    };
    const meta = titles[defaultType];
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
      handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite');
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
      updated.type !== undefined ||
      updated.blankMode !== undefined ||
      updated.pageBreakBefore !== undefined ||
      updated.selectedWordIndices !== undefined ||
      updated.targetWordCount !== undefined
    ) {
      setTimeout(() => {
        handleGeneratePreview(undefined, undefined, undefined, undefined, nextSections, 'composite');
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
    setActiveSectionTab((prev) => Math.max(0, Math.min(prev, compositeSections.length - 2)));
  };

  const handleDuplicateSection = (index: number) => {
    const copyId = generateId();
    setCompositeSections((prev) => {
      const target = prev[index];
      const copy: UICompositeSection = {
        ...target,
        id: copyId,
        title: `${target.title} (Bản sao)`
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
    const newIdx = index + 1;
    setActiveSectionTab(newIdx);
    setHighlightedSectionIndex(newIdx);
    setTimeout(() => {
      setHighlightedSectionIndex(null);
    }, 1500);
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

  // Milestone 3: Worksheet Template Handlers
  const handleSaveCurrentAsTemplate = (name: string, description?: string): WorksheetTemplate => {
    const templateSections: WorksheetTemplateSection[] = compositeSections.map((s) => ({
      id: s.id,
      type: s.type,
      title: s.title,
      instruction: s.instruction,
      wordCount: s.targetWordCount || (s.selectedWordIndices ? s.selectedWordIndices.length : 0) || 4,
      primaryWordCount: s.primaryWordCount,
      reviewWordCount: s.reviewWordCount,
      blankMode: s.blankMode,
      type4LayoutMode: s.type4LayoutMode,
      type4ColumnMode: s.type4ColumnMode,
      type4TraceFontSize: s.type4TraceFontSize,
      pageBreakBefore: s.pageBreakBefore,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      spacing: s.spacing,
      imageSize: s.imageSize,
      choiceCount: s.choiceCount,
      choiceLayout: s.choiceLayout,
      matchMode: s.matchMode,
      matchHint: s.matchHint,
      lookMatchWriteShuffleSuffix: s.lookMatchWriteShuffleSuffix,
      lookMatchWriteMode: s.lookMatchWriteMode,
      lookMatchWriteShowBaseline: s.lookMatchWriteShowBaseline,
      lookMatchWriteTraceFontSize: s.lookMatchWriteTraceFontSize,
      wordsearchDirections: s.wordsearchDirections,
      wordsearchHintType: s.wordsearchHintType,
      wordsearchGridSize: s.wordsearchGridSize,
      wordsearchGridBorder: s.wordsearchGridBorder,
      wordsearchCase: s.wordsearchCase,
      targetLetter: s.targetLetter,
      showWordLabels: s.showWordLabels,
      sentenceScramble: s.sentenceScramble,
      sentenceSeparator: s.sentenceSeparator,
      sentenceHintStyle: s.sentenceHintStyle,
      type15SentenceTemplate: s.type15SentenceTemplate,
      type15NumberStyle: s.type15NumberStyle,
      type15LetterBandBg: s.type15LetterBandBg
    }));

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

    // 2. Convert template sections to UICompositeSection[] using applyTemplateToSections
    const newSections = applyTemplateToSections(template, words);

    // 3. Set worksheet mode to composite
    setWorksheetMode('composite');

    // 4. Set composite sections
    setCompositeSections(newSections);

    // 5. Set active section tab to 0
    setActiveSectionTab(0);

    // 6. Close the modal
    setIsTemplateModalOpen(false);

    // 7. Trigger immediate debounced PDF re-rendering so live preview updates smoothly
    setTimeout(() => {
      handleGeneratePreview(
        words,
        title,
        undefined,
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
          showTableGrid: template.showTableGrid !== undefined ? template.showTableGrid : showTableGrid
        },
        newSections,
        'composite'
      );
    }, 150);

    // 8. Display friendly feedback toast
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
        }
      }
    });
  }, [id]);

  // If initial link has vocab param or default, auto load
  useEffect(() => {
    if (!id && linkInput && sourceMode === 'link') {
      fetchVocabFromLink(linkInput);
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
          term: w.term,
          definition: w.definition,
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
      targetLetter?: string;
      showWordLabels?: boolean;
      sentenceScramble?: boolean;
      sentenceSeparator?: 'space' | 'slash';
      sentenceHintStyle?: 'underscores' | 'dots';
      type4LayoutMode?: Type4LayoutMode;
      type4ColumnMode?: Type4ColumnMode;
      type4TraceFontSize?: number;
      type15NumberStyle?: Type15NumberStyle;
      type15Border?: Type15Border;
      type15ChoiceMode?: Type15ChoiceMode;
      type15LetterBandBg?: 'tint' | 'white';
      type16SoundMode?: Type16SoundMode;
      type16ChoiceCount?: Type16ChoiceCount;
      type16Layout?: Type16Layout;
      type16LetterCase?: Type16LetterCase;
      type16Border?: Type16Border;
    },
    sectionsToUse?: UICompositeSection[],
    modeOverride?: 'single' | 'composite'
  ) => {
    const currentMode = modeOverride || worksheetMode;
    const allAvailableWords = wordsToUse || words;

    if (currentMode === 'composite') {
      const sections = sectionsToUse || compositeSections;
      if (sections.length === 0) {
        setErrorMessage('Danh sách phần bài tập trống. Vui lòng bấm "+ Thêm phần bài tập" để tạo nội dung.');
        return;
      }
      const emptySection = sections.find((s) => s.selectedWordIndices.length === 0);
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
          sections: sections.map((sec) => ({
            id: sec.id,
            type: sec.type,
            title: sec.title,
            blankMode: sec.blankMode,
            type4LayoutMode: sec.type4LayoutMode,
            type4ColumnMode: sec.type4ColumnMode,
            type4TraceFontSize: sec.type4TraceFontSize || 28,
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
            targetLetter: sec.targetLetter,
            showWordLabels: sec.showWordLabels,
            sentenceScramble: sec.sentenceScramble,
            sentenceSeparator: sec.sentenceSeparator,
            sentenceHintStyle: sec.sentenceHintStyle,
            type15NumberStyle: sec.type15NumberStyle,
            type15Border: sec.type15Border,
            type15ChoiceMode: sec.type15ChoiceMode,
            type15LetterBandBg: sec.type15LetterBandBg,
            type16SoundMode: sec.type16SoundMode,
            type16ChoiceCount: sec.type16ChoiceCount,
            type16Layout: sec.type16Layout,
            type16LetterCase: sec.type16LetterCase,
            type16Border: sec.type16Border,
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
    const activeWords = wordsToUse || getActiveWords();
    if (activeWords.length === 0) {
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
        targetLetter: customOptions?.targetLetter !== undefined ? customOptions.targetLetter : targetLetter,
        showWordLabels: customOptions?.showWordLabels !== undefined ? customOptions.showWordLabels : showWordLabels,
        sentenceScramble: customOptions?.sentenceScramble !== undefined ? customOptions.sentenceScramble : sentenceScramble,
        sentenceSeparator: customOptions?.sentenceSeparator !== undefined ? customOptions.sentenceSeparator : sentenceSeparator,
        sentenceHintStyle: customOptions?.sentenceHintStyle !== undefined ? customOptions.sentenceHintStyle : sentenceHintStyle,
        type4LayoutMode: customOptions?.type4LayoutMode !== undefined ? customOptions.type4LayoutMode : type4LayoutMode,
        type4ColumnMode: customOptions?.type4ColumnMode !== undefined ? customOptions.type4ColumnMode : type4ColumnMode,
        type4TraceFontSize: customOptions?.type4TraceFontSize !== undefined ? customOptions.type4TraceFontSize : type4TraceFontSize,
        type15NumberStyle: customOptions?.type15NumberStyle !== undefined ? customOptions.type15NumberStyle : type15NumberStyle,
        type15Border: customOptions?.type15Border !== undefined ? customOptions.type15Border : type15Border,
        type15ChoiceMode: customOptions?.type15ChoiceMode !== undefined ? customOptions.type15ChoiceMode : type15ChoiceMode,
        type15LetterBandBg: customOptions?.type15LetterBandBg !== undefined ? customOptions.type15LetterBandBg : type15LetterBandBg,
        type16SoundMode: customOptions?.type16SoundMode !== undefined ? customOptions.type16SoundMode : type16SoundMode,
        type16ChoiceCount: customOptions?.type16ChoiceCount !== undefined ? customOptions.type16ChoiceCount : type16ChoiceCount,
        type16Layout: customOptions?.type16Layout !== undefined ? customOptions.type16Layout : type16Layout,
        type16LetterCase: customOptions?.type16LetterCase !== undefined ? customOptions.type16LetterCase : type16LetterCase,
        type16Border: customOptions?.type16Border !== undefined ? customOptions.type16Border : type16Border
      });

      const blob = doc.output('blob');
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
      const newUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(newUrl);
    } catch (err: any) {
      console.error('Generate PDF error:', err);
      setErrorMessage(err.message || 'Lỗi khi tạo file PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (worksheetMode === 'composite') {
      if (compositeSections.length === 0) {
        setErrorMessage('Danh sách phần bài tập trống. Vui lòng thêm ít nhất 1 phần bài tập.');
        return;
      }
      const emptySection = compositeSections.find((s) => s.selectedWordIndices.length === 0);
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
            targetLetter: sec.targetLetter,
            showWordLabels: sec.showWordLabels,
            sentenceScramble: sec.sentenceScramble,
            sentenceSeparator: sec.sentenceSeparator,
            sentenceHintStyle: sec.sentenceHintStyle,
            type4LayoutMode: sec.type4LayoutMode,
            type4ColumnMode: sec.type4ColumnMode,
            type4TraceFontSize: sec.type4TraceFontSize || 28,
            type15NumberStyle: sec.type15NumberStyle,
            type15Border: sec.type15Border,
            type15ChoiceMode: sec.type15ChoiceMode,
            type15LetterBandBg: sec.type15LetterBandBg,
            type16SoundMode: sec.type16SoundMode,
            type16ChoiceCount: sec.type16ChoiceCount,
            type16Layout: sec.type16Layout,
            type16LetterCase: sec.type16LetterCase,
            type16Border: sec.type16Border,
            words: sec.selectedWordIndices.map((i) => words[i]).filter(Boolean)
          }))
        };

        const doc = await generateCompositeWorksheetPDF(payload);
        const cleanTitle = (title || 'Worksheet-Tong-Hop').replace(/[/\\?%*:|"<>]/g, '-');
        doc.save(`Worksheet-Tong-Hop - ${cleanTitle}.pdf`);
      } catch (err: any) {
        console.error('Download Composite PDF error:', err);
        setErrorMessage(err.message || 'Lỗi khi tải PDF tổng hợp');
      } finally {
        setIsGeneratingPDF(false);
      }
      return;
    }

    const activeWords = getActiveWords();
    if (activeWords.length === 0) {
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
        targetLetter,
        showWordLabels,
        sentenceScramble,
        sentenceSeparator,
        sentenceHintStyle,
        type15NumberStyle,
        type15Border,
        type15ChoiceMode,
        type15LetterBandBg,
        type16SoundMode,
        type16ChoiceCount,
        type16Layout,
        type16LetterCase,
        type16Border
      });
      const cleanTitle = (title || 'Worksheet').replace(/[/\\?%*:|"<>]/g, '-');
      doc.save(`PDF ${worksheetType} - ${cleanTitle}.pdf`);
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

          {worksheetMode === 'composite' && (
            <button
              type="button"
              onClick={() => {
                setInitialShowSaveFormInModal(true);
                setIsTemplateModalOpen(true);
              }}
              data-testid="save-template-quick-btn"
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
              title="Lưu các phần bài tập hiện tại thành Mẫu bài tập mới"
            >
              <Save className="w-4 h-4 text-slate-600" />
              <span>💾 Lưu thành Mẫu</span>
            </button>
          )}

          <button
            onClick={() => handleGeneratePreview()}
            disabled={isGeneratingPDF || words.length === 0}
            data-testid="generate-worksheet-btn"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isGeneratingPDF ? 'animate-spin' : ''}`} />
            <span>{isGeneratingPDF ? 'Đang tạo...' : 'Tạo Worksheet'}</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF || words.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Tải File PDF</span>
          </button>
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
                            sentenceHintStyle
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
                          const currentLetter = targetLetter || 'V v';
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
                  <button
                    type="button"
                    onClick={handleAddSection}
                    data-testid="add-section-btn"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm phần bài tập</span>
                  </button>
                </div>
              ) : compositeViewMode === 'tabs' ? (
                /* --- TAB MODE: Compact, Zero Scrolling --- */
                <div className="space-y-4" data-testid="composite-tabs-view">
                  <CompositeSectionTabs
                    sections={compositeSections}
                    activeTabIndex={Math.min(activeSectionTab, compositeSections.length - 1)}
                    onSelectTab={(idx) => setActiveSectionTab(idx)}
                    onAddSection={handleAddSection}
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
                    />
                  )}
                </div>
              ) : (
                /* --- ACCORDION / LIST MODE: All sections with Sticky Quick-Nav & Collapse --- */
                <div className="space-y-4" data-testid="composite-accordion-view">
                  <CompositeQuickNav
                    sections={compositeSections}
                    activeSectionIndex={highlightedSectionIndex}
                    onJumpToSection={handleJumpToSection}
                    onAddSection={handleAddSection}
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
                              type4ColumnMode
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
                                type4TraceFontSize
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
                                type4TraceFontSize: sz
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
                  </div>
                )}

                {/* Choice Count & Layout Option (Only for Type 6 in Single mode) */}
                {worksheetMode === 'single' && worksheetType === 6 && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-1.5 transition-all">
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

                    {/* Target Letter Input */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Chữ Cái Mục Tiêu (Target Letter)
                      </label>
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
                        placeholder="Ví dụ: V v hoặc B b hoặc sh..."
                        data-testid="target-letter-input"
                        className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-xs font-medium text-slate-800 shadow-2xs"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Chữ cái này sẽ được tự động đồng bộ vào tiêu đề và tô đỏ nổi bật trên file PDF.
                      </p>
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
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
                    <div className="flex items-center justify-between border-b border-indigo-100/80 pb-2">
                      <label className="block text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                        <span>🔘</span> Tuỳ Chọn Đọc & Khoanh Tranh (Loại 15)
                      </label>
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
                  <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-3.5 transition-all">
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

                    {/* 3. Hint Style */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Kiểu Dòng Gợi Ý Viết
                      </label>
                      <div className="grid grid-cols-2 gap-2">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Xem Trước File PDF</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleGeneratePreview()}
                  disabled={isGeneratingPDF}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors flex items-center gap-1.5"
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
                    disabled={words.length === 0}
                    data-testid="generate-worksheet-btn"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                  >
                    Tạo Worksheet
                  </button>
                </div>
              )}
            </div>

            {/* Quick Download Footer inside preview card */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
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
              <button
                onClick={handleDownloadPDF}
                disabled={isGeneratingPDF || words.length === 0}
                className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Tải về máy (.pdf)
              </button>
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
        currentCompositeSections={compositeSections}
        onSaveCurrentAsTemplate={handleSaveCurrentAsTemplate}
        initialShowSaveForm={initialShowSaveFormInModal}
      />
    </div>
  );
}
