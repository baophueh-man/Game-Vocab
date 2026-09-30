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
  AlertCircle,
  Link as LinkIcon,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { getSets, saveSet, getImageFile } from '../lib/storage';
import { WordSet } from '../types';
import { generateId } from '../lib/utils';
import SmartImage from '../components/ui/SmartImage';
import WorksheetModeSwitch from '../components/worksheet/WorksheetModeSwitch';
import CompositeSectionCard, { UICompositeSection } from '../components/worksheet/CompositeSectionCard';
import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  CompositeWorksheetConfig,
  WORKSHEET_TYPES,
  BACKGROUND_OPTIONS,
  FONT_OPTIONS,
  BLANK_MODE_OPTIONS,
  SPACING_OPTIONS,
  BlankMode,
  WorksheetType,
  WorksheetWord
} from '../utils/worksheetGenerator';

export default function WorksheetGenerator() {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode: 'link' (YourHomework link) or 'library' (Existing WordSet)
  const [sourceMode, setSourceMode] = useState<'link' | 'library'>('link');
  const [linkInput, setLinkInput] = useState<string>(
    searchParams.get('url') || searchParams.get('vocab') || 'https://yourhomework.net/vocab/589984573'
  );

  // Library sets
  const [librarySets, setLibrarySets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>(id || '');

  // Worksheet Mode: 'single' (Traditional single type) | 'composite' (Multi-section document)
  const [worksheetMode, setWorksheetMode] = useState<'single' | 'composite'>('single');
  const [compositeSections, setCompositeSections] = useState<UICompositeSection[]>([]);

  // Current Vocabulary Data
  const [title, setTitle] = useState<string>('Lớp 3 - Unit 6');
  const [sourceUrl, setSourceUrl] = useState<string>('https://yourhomework.net');
  const [words, setWords] = useState<WorksheetWord[]>([]);
  const [selectedWordIndices, setSelectedWordIndices] = useState<Set<number>>(new Set());

  // Worksheet Configuration
  const [worksheetType, setWorksheetType] = useState<WorksheetType>(4);
  const [paperSize, setPaperSize] = useState<'a5' | 'a4'>('a5');
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontFamily, setFontFamily] = useState<'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial'>('r0c0i Linotte');
  const [blankMode, setBlankMode] = useState<BlankMode>('vowels');
  const [spacing, setSpacing] = useState<number>(6);
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
          title: 'Part 1: Missing letters',
          instruction: 'Look at the pictures and fill in the missing letters',
          selectedWordIndices: [],
          blankMode: 'vowels',
          pageBreakBefore: false
        },
        {
          id: generateId(),
          type: 6,
          title: 'Part 2: Multiple choice',
          instruction: 'Look at the pictures and choose the correct answer',
          selectedWordIndices: [],
          blankMode: 'vowels',
          pageBreakBefore: false
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
        title: 'Part 1: Missing letters',
        instruction: 'Look at the pictures and fill in the missing letters',
        selectedWordIndices: part1Indices,
        blankMode: 'vowels',
        pageBreakBefore: false
      },
      {
        id: generateId(),
        type: 6,
        title: 'Part 2: Multiple choice',
        instruction: 'Look at the pictures and choose the correct answer',
        selectedWordIndices: part2Indices,
        blankMode: 'vowels',
        pageBreakBefore: false
      }
    ];
  };

  // Section Management Handlers
  const handleAddSection = () => {
    const nextNum = compositeSections.length + 1;
    const defaultType: WorksheetType = nextNum % 2 === 1 ? 4 : 6;
    const titles: Record<WorksheetType, { title: string; instruction: string }> = {
      2: { title: 'Write the words', instruction: 'Look at the pictures and write the correct words' },
      3: { title: 'Match picture with word', instruction: 'Draw a line to match each picture with its word' },
      4: { title: 'Missing letters', instruction: 'Look at the pictures and fill in the missing letters' },
      6: { title: 'Multiple choice', instruction: 'Look at the pictures and choose the correct answer' },
      7: { title: 'Unscramble letters', instruction: 'Unscramble the letters to write the correct words' },
      8: { title: 'Look and trace', instruction: 'Look at the pictures and trace the words' },
      9: { title: 'Look and color Yes or No', instruction: 'Look at the picture and sentence, then color Yes or No' },
      10: { title: 'Look and color', instruction: 'Look at the word and color the correct picture' }
    };
    const meta = titles[defaultType];
    const newSec: UICompositeSection = {
      id: generateId(),
      type: defaultType,
      title: `Part ${nextNum}: ${meta.title}`,
      instruction: meta.instruction,
      selectedWordIndices: words.map((_, i) => i),
      blankMode: 'vowels',
      pageBreakBefore: false
    };
    setCompositeSections((prev) => [...prev, newSec]);
  };

  const handleUpdateSection = (index: number, updated: Partial<UICompositeSection>) => {
    setCompositeSections((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...updated };
      return next;
    });
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
  };

  const handleDeleteSection = (index: number) => {
    setCompositeSections((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDuplicateSection = (index: number) => {
    setCompositeSections((prev) => {
      const target = prev[index];
      const copy: UICompositeSection = {
        ...target,
        id: generateId(),
        title: `${target.title} (Bản sao)`
      };
      const next = [...prev];
      next.splice(index + 1, 0, copy);
      return next;
    });
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
          phonetic: (w as any).phonetic || '',
          imageUrl: img,
          exampleSentence: w.exampleSentence
        };
      })
    );

    setWords(mapped);
    setSelectedWordIndices(new Set(mapped.map((_, i) => i)));

    // Initialize composite sections with 2 sensible default sections
    const defaultSecs = createDefaultCompositeSections(mapped);
    setCompositeSections(defaultSecs);

    // Automatically generate preview with the newly loaded set
    setTimeout(() => {
      if (worksheetMode === 'composite') {
        handleGeneratePreview(mapped, set.title, undefined, undefined, defaultSecs, 'composite');
      } else {
        handleGeneratePreview(mapped, set.title);
      }
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

      const fetchedWords: WorksheetWord[] = data.words || [];
      setWords(fetchedWords);
      setSelectedWordIndices(new Set(fetchedWords.map((_, i) => i)));

      // Initialize composite sections with 2 sensible default sections
      const defaultSecs = createDefaultCompositeSections(fetchedWords);
      setCompositeSections(defaultSecs);

      // Automatically generate preview
      setTimeout(() => {
        if (worksheetMode === 'composite') {
          handleGeneratePreview(fetchedWords, data.title || 'Bài học từ vựng', undefined, undefined, defaultSecs, 'composite');
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
            instruction: sec.instruction,
            blankMode: sec.blankMode,
            pageBreakBefore: sec.pageBreakBefore,
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
        background: customOptions?.background !== undefined ? customOptions.background : background,
        words: activeWords,
        sourceUrl,
        showHeader: customOptions?.showHeader !== undefined ? customOptions.showHeader : showHeader,
        showFooter: customOptions?.showFooter !== undefined ? customOptions.showFooter : showFooter,
        showImageBorder: customOptions?.showImageBorder !== undefined ? customOptions.showImageBorder : showImageBorder,
        showTableGrid: customOptions?.showTableGrid !== undefined ? customOptions.showTableGrid : showTableGrid
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
            instruction: sec.instruction,
            blankMode: sec.blankMode,
            pageBreakBefore: sec.pageBreakBefore,
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
        spacing,
        background,
        words: activeWords,
        sourceUrl,
        showHeader,
        showFooter,
        showImageBorder,
        showTableGrid
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
        <div className="flex items-center gap-3">
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
                  Thư Viện Của Tôi
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
            ) : (
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
                        if (t.type === 8) {
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
                        } else {
                          handleGeneratePreview(undefined, undefined, t.type);
                        }
                      }}
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
              <div className="flex items-center justify-between">
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

                <button
                  type="button"
                  onClick={handleAddSection}
                  data-testid="add-section-btn"
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Thêm phần bài tập</span>
                </button>
              </div>

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
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Thêm phần bài tập</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {compositeSections.map((sec, idx) => (
                    <CompositeSectionCard
                      key={sec.id}
                      section={sec}
                      index={idx}
                      totalSections={compositeSections.length}
                      words={words}
                      onUpdateSection={handleUpdateSection}
                      onMoveUp={handleMoveUpSection}
                      onMoveDown={handleMoveDownSection}
                      onDelete={handleDeleteSection}
                      onDuplicate={handleDuplicateSection}
                    />
                  ))}
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

            <div className="space-y-3 text-sm">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {worksheetMode === 'composite'
                    ? 'Tiêu Đề Toàn Bài (Master Title)'
                    : 'Tiêu Đề Bài Tập (Title)'}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Nhập tiêu đề phiếu bài tập..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
              </div>

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

              {/* Blank Mode Option (Only for Type 4 in Single mode) */}
              {worksheetMode === 'single' && worksheetType === 4 && (
                <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 space-y-1.5 transition-all">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-indigo-900">
                      Tuỳ Chọn Đục Lỗ Chữ Cái (Blank Mode)
                    </label>
                    <span className="text-[11px] text-indigo-600 bg-indigo-100/60 px-2 py-0.5 rounded font-semibold">
                      Loại 4
                    </span>
                  </div>
                  <select
                    value={blankMode}
                    onChange={(e) => {
                      const bm = e.target.value as BlankMode;
                      setBlankMode(bm);
                      handleGeneratePreview(undefined, undefined, undefined, { blankMode: bm });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm font-medium text-slate-800 shadow-2xs"
                  >
                    {BLANK_MODE_OPTIONS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
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
                            <div className="text-sm font-bold text-slate-900">{w.term}</div>
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
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
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
            <div className="w-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center min-h-[720px] relative">
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
                Định dạng: {paperSize === 'a5' ? 'Khổ A5 (148mm x 210mm) - Lề hẹp 0.5"' : 'Khổ A4 (210mm x 297mm)'} • {fontFamily} ({fontSize}pt)
                {worksheetMode === 'composite' && ` • Tổng hợp (${compositeSections.length} phần)`}
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
    </div>
  );
}
