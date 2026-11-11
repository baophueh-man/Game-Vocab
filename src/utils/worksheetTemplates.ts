/**
 * Worksheet Template Data Models, Presets, and Dual-Storage Engine
 * Part of Game-Vocab Composite Worksheet System
 */

import {
  WorksheetType,
  BlankMode,
  Type4LayoutMode,
  Type4ColumnMode,
  ChoiceLayout,
  MatchHintMode,
  WordsearchDirection,
  WordsearchHintType,
  WordsearchGridBorder,
  WordsearchCase,
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
  Type19MazeMode,
  Type19WallColor,
  Type19EntranceCharacter,
  Type19TargetItem,
  Type19CornerStyle,
  Type19WallThickness,
  Type20HintMode,
  Type20GridBorder,
  Type20LineStyle,
  Type20BorderColor,
  Type20PuzzlesPerPage,
  Type20Casing,
  Type19HintMode,
  Type19GridBorder,
  Type19LineStyle,
  Type19BorderColor,
  Type19PuzzlesPerPage,
  Type19Casing,
  Type20GridMode
} from './worksheetGenerator';
import { generateId } from '../lib/utils';

// Storage key constants
export const WORKSHEET_TEMPLATES_STORAGE_KEY = 'vocagame_worksheet_templates';
export const IDB_DATABASE_NAME = 'VocaGameTemplatesDB';
export const IDB_STORE_NAME = 'templates';
export const IDB_VERSION = 1;

// Allowed section types for composite worksheets (1-20 except 5)
export const VALID_WORKSHEET_SECTION_TYPES: readonly WorksheetType[] = [
  1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
];

export interface WorksheetTemplateSection {
  id?: string;
  type: WorksheetType;
  title: string;
  instruction?: string;
  wordCount: number;
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
  targetLetterMode?: 'auto' | 'manual';
  showWordLabels?: boolean;
  sentenceScramble?: boolean;
  sentenceSeparator?: 'space' | 'slash';
  sentenceHintStyle?: 'underscores' | 'dots' | 'trace';
  sentenceTraceFontSize?: number;
  type15NumberStyle?: 'none' | 'traditional';
  type15Border?: 'full' | 'outerOnly' | 'none';
  type15ChoiceMode?: 'ab' | 'checkbox' | 'none';
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
  type19MazeMode?: Type19MazeMode;
  type19WallColor?: Type19WallColor;
  type19EntranceCharacter?: Type19EntranceCharacter;
  type19TargetItem?: Type19TargetItem;
  type19SentenceStem?: string;
  type19CornerStyle?: Type19CornerStyle;
  type19WallThickness?: Type19WallThickness;
  type19MazeSeed?: number | string;
  type19Seed?: number | string;
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
  type19CellSize?: number;
  answerMode?: 'student' | 'answer' | 'both';
  selectedWordIndices?: number[];
  selectedWordTerms?: string[];
  wordsearchSeed?: number | string;
  type3Seed?: number | string;
  type6Seed?: number | string;
  [key: string]: any;
}

export interface WorksheetTemplate {
  id: string;
  name: string;
  description?: string;
  isBuiltIn?: boolean;
  createdAt: number;
  updatedAt: number;
  paperSize?: 'a5' | 'a4';
  background?: string;
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  fontSize?: number;
  spacing?: number;
  imageSize?: number;
  showHeader?: boolean;
  answerMode?: 'student' | 'answer' | 'both';
  showFooter?: boolean;
  showImageBorder?: boolean;
  showTableGrid?: boolean;
  sections: WorksheetTemplateSection[];
}

export interface WorksheetTemplateExportPayload {
  version: 1;
  app: 'Game-Vocab';
  type: 'worksheet_template' | 'worksheet_templates_bundle';
  exportedAt: number;
  template?: WorksheetTemplate;
  templates?: WorksheetTemplate[];
}

/**
 * 4 Pedagogical Built-in Presets
 * Marked with isBuiltIn: true (immutable, protected from delete/overwrite)
 */
export const BUILT_IN_PRESETS: readonly WorksheetTemplate[] = [
  {
    id: 'builtin_preset_1',
    name: 'Mẫu 1: Kiểm Tra 15 Phút Cơ Bản',
    description: 'Điền chữ cái còn thiếu kết hợp Trắc nghiệm lựa chọn đáp án đúng.',
    isBuiltIn: true,
    createdAt: 1727539200000,
    updatedAt: 1727539200000,
    paperSize: 'a4',
    fontFamily: 'r0c0i Linotte',
    fontSize: 12,
    spacing: 2,
    imageSize: 12.7,
    showHeader: true,
    showFooter: true,
    sections: [
      {
        id: 'sec_builtin_1_1',
        type: 4,
        title: 'I. Complete the missing letters',
        wordCount: 6,
        blankMode: 'vowels',
        type4LayoutMode: 'grid',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      },
      {
        id: 'sec_builtin_1_2',
        type: 6,
        title: 'II. Choose the correct answer',
        wordCount: 6,
        choiceCount: 3,
        choiceLayout: 'vertical',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      }
    ]
  },
  {
    id: 'builtin_preset_2',
    name: 'Mẫu 2: Luyện Viết & Tập Tô',
    description: 'Tập tô từ nét chấm đục và Nhìn tranh viết từ vựng hoàn chỉnh.',
    isBuiltIn: true,
    createdAt: 1727539200000,
    updatedAt: 1727539200000,
    paperSize: 'a4',
    fontFamily: 'r0c0i Linotte',
    fontSize: 12,
    spacing: 2,
    imageSize: 12.7,
    showHeader: true,
    showFooter: true,
    sections: [
      {
        id: 'sec_builtin_2_1',
        type: 8,
        title: 'I. Look and trace',
        wordCount: 4,
        fontFamily: 'KG Primary Dots',
        fontSize: 22,
        spacing: 0,
        imageSize: 12.7
      },
      {
        id: 'sec_builtin_2_2',
        type: 2,
        title: 'II. Look and write the words',
        wordCount: 6,
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      }
    ]
  },
  {
    id: 'builtin_preset_3',
    name: 'Mẫu 3: Đề Ôn Tập 4 Kỹ Năng',
    description: 'Nối từ, Điền khuyết, Sắp xếp câu hoàn chỉnh và Ô chữ Word Search.',
    isBuiltIn: true,
    createdAt: 1727539200000,
    updatedAt: 1727539200000,
    paperSize: 'a4',
    fontFamily: 'r0c0i Linotte',
    fontSize: 12,
    spacing: 2,
    imageSize: 12.7,
    showHeader: true,
    showFooter: true,
    sections: [
      {
        id: 'sec_builtin_3_1',
        type: 3,
        title: 'I. Match the picture with the word',
        wordCount: 4,
        matchMode: 'word',
        matchHint: 'none',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      },
      {
        id: 'sec_builtin_3_2',
        type: 4,
        title: 'II. Fill in the missing letters',
        wordCount: 4,
        blankMode: 'vowels',
        type4LayoutMode: 'grid',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      },
      {
        id: 'sec_builtin_3_3',
        type: 1,
        title: 'III. Reorder the words to make correct sentences',
        wordCount: 3,
        sentenceScramble: true,
        sentenceSeparator: 'space',
        sentenceHintStyle: 'underscores',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 4,
        imageSize: 12.7
      },
      {
        id: 'sec_builtin_3_4',
        type: 13,
        title: 'IV. Word Search Puzzle',
        wordCount: 6,
        wordsearchDirections: ['horizontal', 'vertical', 'diagonalDown'],
        wordsearchHintType: 'word',
        wordsearchGridSize: 'auto',
        wordsearchGridBorder: 'none',
        wordsearchCase: 'lower',
        fontFamily: 'r0c0i Linotte',
        fontSize: 12,
        spacing: 2,
        imageSize: 12.7
      }
    ]
  },
  {
    id: 'builtin_preset_4',
    name: 'Mẫu 4: Mầm Non / Tiểu Học Khởi Đầu',
    description: 'Nhìn câu tô màu Yes/No và Khoanh tranh có chứa chữ cái mục tiêu.',
    isBuiltIn: true,
    createdAt: 1727539200000,
    updatedAt: 1727539200000,
    paperSize: 'a4',
    fontFamily: 'r0c0i Linotte',
    fontSize: 14,
    spacing: 2,
    imageSize: 12.7,
    showHeader: true,
    showFooter: true,
    sections: [
      {
        id: 'sec_builtin_4_1',
        type: 9,
        title: 'I. Look and color Yes or No',
        wordCount: 4,
        fontFamily: 'r0c0i Linotte',
        fontSize: 14,
        spacing: 4,
        imageSize: 15
      },
      {
        id: 'sec_builtin_4_2',
        type: 14,
        title: 'II. Circle the pictures that have letter V',
        wordCount: 8,
        targetLetter: 'V',
        showWordLabels: true,
        fontFamily: 'r0c0i Linotte',
        fontSize: 14,
        spacing: 2,
        imageSize: 12.7
      }
    ]
  }
];

// In-memory fallback for environments without localStorage (Node.js/testing/SSR)
let memoryStoreFallback: string | null = null;

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Access denied or private mode
  }
  return null;
}

function readStoredCustomTemplatesRaw(): WorksheetTemplate[] {
  let rawData: string | null = null;
  const storage = getLocalStorage();
  if (storage) {
    try {
      rawData = storage.getItem(WORKSHEET_TEMPLATES_STORAGE_KEY);
    } catch {
      // access denied or quota
    }
  }
  if (!rawData) {
    rawData = memoryStoreFallback;
  }
  if (!rawData) return [];

  try {
    const parsed = JSON.parse(rawData);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is WorksheetTemplate => {
      return (
        item &&
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        Array.isArray(item.sections)
      );
    });
  } catch (err) {
    console.warn('[worksheetTemplates] Failed to parse custom templates:', err);
    return [];
  }
}

function writeStoredCustomTemplatesRaw(templates: WorksheetTemplate[]): void {
  const json = JSON.stringify(templates);
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.setItem(WORKSHEET_TEMPLATES_STORAGE_KEY, json);
    } catch (err) {
      console.warn('[worksheetTemplates] LocalStorage setItem error:', err);
    }
  }
  memoryStoreFallback = json;
}

/**
 * Open IndexedDB for asynchronous template backup
 */
async function getIndexedDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return null;
  }
  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open(IDB_DATABASE_NAME, IDB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        console.warn('[worksheetTemplates] IndexedDB open error:', request.error);
        resolve(null);
      };
    } catch (err) {
      console.warn('[worksheetTemplates] IndexedDB initialization failed:', err);
      resolve(null);
    }
  });
}

/**
 * Asynchronously sync custom templates to IndexedDB
 */
export async function syncTemplatesToIndexedDB(templates: WorksheetTemplate[]): Promise<void> {
  try {
    const db = await getIndexedDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);

      store.clear();
      templates.forEach((tmpl) => store.put(tmpl));

      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        console.warn('[worksheetTemplates] Transaction sync failed:', tx.error);
        resolve();
      };
    });
  } catch (err) {
    console.warn('[worksheetTemplates] Failed to backup to IndexedDB:', err);
  }
}

/**
 * Asynchronously restore custom templates from IndexedDB if LocalStorage was cleared
 */
export async function restoreTemplatesFromIndexedDB(): Promise<WorksheetTemplate[]> {
  try {
    const db = await getIndexedDB();
    if (!db) return [];

    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const result = req.result as WorksheetTemplate[];
        resolve(Array.isArray(result) ? result : []);
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Initialize storage and auto-recover from IndexedDB if LocalStorage is empty
 */
export async function initTemplateStorage(): Promise<void> {
  if (typeof window === 'undefined') return;
  const current = getCustomTemplates();
  if (current.length === 0) {
    const fromIdb = await restoreTemplatesFromIndexedDB();
    if (fromIdb && fromIdb.length > 0) {
      writeStoredCustomTemplatesRaw(fromIdb);
    }
  }
}

/**
 * Deep clone an object to prevent unintended state mutations
 */
export function deepCloneTemplate<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a given template ID belongs to a built-in preset
 */
export function isBuiltInPresetId(id: string): boolean {
  if (!id) return false;
  return BUILT_IN_PRESETS.some((preset) => preset.id === id) || id.startsWith('builtin_');
}

/**
 * Get all custom (user-created) templates
 */
export function getCustomTemplates(): WorksheetTemplate[] {
  return readStoredCustomTemplatesRaw().map((t) => deepCloneTemplate(t));
}

/**
 * Get all available templates: Built-in Presets + Custom Templates
 */
export function getAllTemplates(): WorksheetTemplate[] {
  const builtIns = BUILT_IN_PRESETS.map((p) => deepCloneTemplate(p));
  const customs = getCustomTemplates();
  return [...builtIns, ...customs];
}

/**
 * Get a specific template by ID (built-in or custom)
 */
export function getTemplateById(id: string): WorksheetTemplate | undefined {
  if (!id) return undefined;
  const all = getAllTemplates();
  const match = all.find((t) => t.id === id);
  return match ? deepCloneTemplate(match) : undefined;
}

/**
 * Save or update a custom template
 * Automatically assigns ID, timestamps, and persists to LocalStorage + IndexedDB
 */
export function saveCustomTemplate(
  templateData: Omit<WorksheetTemplate, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }
): WorksheetTemplate {
  if (templateData.id && isBuiltInPresetId(templateData.id)) {
    throw new Error(`Cannot overwrite built-in preset with ID "${templateData.id}"`);
  }

  const customs = readStoredCustomTemplatesRaw();
  const now = Date.now();

  const sectionsWithIds: WorksheetTemplateSection[] = (templateData.sections || [])
    .filter((sec) => sec && typeof sec.type === 'number' && VALID_WORKSHEET_SECTION_TYPES.includes(sec.type))
    .map((sec) => {
      const pCount = typeof sec.primaryWordCount === 'number' && !isNaN(sec.primaryWordCount)
        ? Math.max(0, Math.round(sec.primaryWordCount))
        : undefined;
      const rCount = typeof sec.reviewWordCount === 'number' && !isNaN(sec.reviewWordCount)
        ? Math.max(0, Math.round(sec.reviewWordCount))
        : undefined;
      const wordCount = (pCount !== undefined && rCount !== undefined)
        ? (pCount + rCount)
        : Math.max(1, Math.round(Number(sec.wordCount) || 4));

      const cloned = deepCloneTemplate(sec);
      delete cloned.primaryWordCount;
      delete cloned.reviewWordCount;

      return {
        ...cloned,
        id: sec.id || `sec_${generateId()}`,
        wordCount,
        ...(pCount !== undefined ? { primaryWordCount: pCount } : {}),
        ...(rCount !== undefined ? { reviewWordCount: rCount } : {})
      };
    });

  let saved: WorksheetTemplate;

  if (templateData.id) {
    const existingIndex = customs.findIndex((c) => c.id === templateData.id);
    if (existingIndex >= 0) {
      const existing = customs[existingIndex];
      saved = {
        ...templateData,
        id: existing.id,
        name: templateData.name.trim() || existing.name,
        isBuiltIn: false,
        createdAt: existing.createdAt || now,
        updatedAt: now,
        sections: sectionsWithIds
      };
      customs[existingIndex] = saved;
    } else {
      saved = {
        ...templateData,
        id: templateData.id,
        name: templateData.name.trim() || 'Mẫu bài tập không tên',
        isBuiltIn: false,
        createdAt: now,
        updatedAt: now,
        sections: sectionsWithIds
      };
      customs.unshift(saved);
    }
  } else {
    saved = {
      ...templateData,
      id: `tmpl_${now}_${generateId()}`,
      name: templateData.name?.trim() || 'Mẫu bài tập mới',
      isBuiltIn: false,
      createdAt: now,
      updatedAt: now,
      sections: sectionsWithIds
    };
    customs.unshift(saved);
  }

  writeStoredCustomTemplatesRaw(customs);
  void syncTemplatesToIndexedDB(customs);

  return deepCloneTemplate(saved);
}

/**
 * Delete a custom template by ID
 * Built-in presets are protected and cannot be deleted
 */
export function deleteCustomTemplate(id: string): boolean {
  if (!id || isBuiltInPresetId(id)) {
    return false;
  }

  const customs = readStoredCustomTemplatesRaw();
  const initialLength = customs.length;
  const filtered = customs.filter((c) => c.id !== id);

  if (filtered.length === initialLength) {
    return false;
  }

  writeStoredCustomTemplatesRaw(filtered);
  void syncTemplatesToIndexedDB(filtered);
  return true;
}

/**
 * Duplicate a template (either built-in or custom)
 * Creates an independent clone with " (Bản sao)" suffix
 */
export function duplicateCustomTemplate(id: string): WorksheetTemplate | null {
  const source = getTemplateById(id);
  if (!source) return null;

  const existingTemplates = getAllTemplates();
  const existingNames = new Set(existingTemplates.map((t) => t.name.toLowerCase()));

  let copyName = `${source.name} (Bản sao)`;
  let counter = 2;
  while (existingNames.has(copyName.toLowerCase())) {
    copyName = `${source.name} (Bản sao ${counter})`;
    counter++;
  }

  const duplicated = saveCustomTemplate({
    ...source,
    id: undefined,
    name: copyName,
    isBuiltIn: false,
    sections: source.sections.map((s) => ({
      ...s,
      id: `sec_${generateId()}`
    }))
  });

  return duplicated;
}

/**
 * Rename a custom template
 * Built-in presets are protected and cannot be renamed
 */
export function renameCustomTemplate(id: string, newName: string): boolean {
  if (!id || isBuiltInPresetId(id)) {
    return false;
  }

  const trimmed = newName.trim();
  if (!trimmed) return false;

  const customs = readStoredCustomTemplatesRaw();
  const target = customs.find((c) => c.id === id);
  if (!target) return false;

  target.name = trimmed;
  target.updatedAt = Date.now();

  writeStoredCustomTemplatesRaw(customs);
  void syncTemplatesToIndexedDB(customs);
  return true;
}

/**
 * Create a safe filename slug from template name
 */
export function slugifyTemplateName(text: string): string {
  if (!text) return 'template';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50) || 'template';
}

/**
 * Prepare a template object for clean JSON export
 */
function sanitizeTemplateForExport(template: WorksheetTemplate): WorksheetTemplate {
  const cloned = deepCloneTemplate(template);
  return {
    ...cloned,
    isBuiltIn: false
  };
}

/**
 * Serialize a single template into formatted JSON string
 */
export function serializeTemplateToJSON(template: WorksheetTemplate): string {
  const payload: WorksheetTemplateExportPayload = {
    version: 1,
    app: 'Game-Vocab',
    type: 'worksheet_template',
    exportedAt: Date.now(),
    template: sanitizeTemplateForExport(template)
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Serialize all custom templates into formatted bundle JSON string
 */
export function serializeAllTemplatesToJSON(): string {
  const customs = getCustomTemplates();
  const payload: WorksheetTemplateExportPayload = {
    version: 1,
    app: 'Game-Vocab',
    type: 'worksheet_templates_bundle',
    exportedAt: Date.now(),
    templates: customs.map((t) => sanitizeTemplateForExport(t))
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Trigger file download in browser using Blob and URL.createObjectURL
 */
export function triggerBrowserDownload(fileName: string, jsonContent: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }
  try {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('[worksheetTemplates] Browser download failed:', err);
  }
}

/**
 * Export a single template as downloadable JSON file
 */
export function exportTemplateAsJSON(template: WorksheetTemplate): void {
  const json = serializeTemplateToJSON(template);
  const slug = slugifyTemplateName(template.name);
  const fileName = `${slug}.json`;
  triggerBrowserDownload(fileName, json);
}

/**
 * Export all custom templates as downloadable bundle JSON file
 */
export function exportAllTemplatesAsJSON(): void {
  const json = serializeAllTemplatesToJSON();
  const fileName = `game-vocab-templates-bundle-${Date.now()}.json`;
  triggerBrowserDownload(fileName, json);
}

/**
 * Validates and sanitizes imported raw template sections
 */
function sanitizeImportedSections(rawSections: unknown[]): WorksheetTemplateSection[] {
  if (!Array.isArray(rawSections)) return [];

  const sanitized: WorksheetTemplateSection[] = [];

  for (const raw of rawSections) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Record<string, any>;

    if (typeof item.type !== 'number' || !VALID_WORKSHEET_SECTION_TYPES.includes(item.type as WorksheetType)) {
      continue;
    }
    const pCount = typeof item.primaryWordCount === 'number' && !isNaN(item.primaryWordCount)
      ? Math.max(0, Math.round(item.primaryWordCount))
      : undefined;
    const rCount = typeof item.reviewWordCount === 'number' && !isNaN(item.reviewWordCount)
      ? Math.max(0, Math.round(item.reviewWordCount))
      : undefined;
    const wordCount = (pCount !== undefined && rCount !== undefined)
      ? (pCount + rCount)
      : Math.max(1, Math.round(Number(item.wordCount) || 4));
    const title = typeof item.title === 'string' && item.title.trim() ? item.title.trim() : 'Phần bài tập';

    const typeNum = item.type;
    const sec: WorksheetTemplateSection = {
      id: `sec_${generateId()}`,
      type: typeNum as WorksheetType,
      title,
      wordCount,
      ...(pCount !== undefined ? { primaryWordCount: pCount } : {}),
      ...(rCount !== undefined ? { reviewWordCount: rCount } : {}),
      ...(item.instruction ? { instruction: String(item.instruction).trim() } : {}),
      ...(item.blankMode ? { blankMode: item.blankMode } : {}),
      ...(item.type4LayoutMode ? { type4LayoutMode: item.type4LayoutMode } : {}),
      ...(item.type4ColumnMode ? { type4ColumnMode: item.type4ColumnMode } : {}),
      ...(typeof item.type4TraceFontSize === 'number' ? { type4TraceFontSize: item.type4TraceFontSize } : {}),
      ...(typeof item.type4AlphabetTargetLetter === 'string' ? { type4AlphabetTargetLetter: item.type4AlphabetTargetLetter } : {}),
      ...(typeof item.pageBreakBefore === 'boolean' ? { pageBreakBefore: item.pageBreakBefore } : {}),
      ...(typeof item.fontSize === 'number' ? { fontSize: item.fontSize } : {}),
      ...(item.fontFamily ? { fontFamily: item.fontFamily } : {}),
      ...(typeof item.spacing === 'number' ? { spacing: item.spacing } : {}),
      ...(typeof item.imageSize === 'number' ? { imageSize: item.imageSize } : {}),
      ...(item.choiceCount === 2 || item.choiceCount === 3 ? { choiceCount: item.choiceCount } : {}),
      ...(item.choiceLayout ? { choiceLayout: item.choiceLayout } : {}),
      ...(item.matchMode ? { matchMode: item.matchMode } : {}),
      ...(item.matchHint ? { matchHint: item.matchHint } : {}),
      ...(typeof item.lookMatchWriteShuffleSuffix === 'boolean' ? { lookMatchWriteShuffleSuffix: item.lookMatchWriteShuffleSuffix } : {}),
      ...(item.lookMatchWriteMode ? { lookMatchWriteMode: item.lookMatchWriteMode } : {}),
      ...(typeof item.lookMatchWriteShowBaseline === 'boolean' ? { lookMatchWriteShowBaseline: item.lookMatchWriteShowBaseline } : {}),
      ...(typeof item.lookMatchWriteTraceFontSize === 'number' ? { lookMatchWriteTraceFontSize: item.lookMatchWriteTraceFontSize } : {}),
      ...(Array.isArray(item.wordsearchDirections) ? { wordsearchDirections: item.wordsearchDirections } : {}),
      ...(item.wordsearchHintType ? { wordsearchHintType: item.wordsearchHintType } : {}),
      ...(item.wordsearchGridSize !== undefined ? { wordsearchGridSize: item.wordsearchGridSize } : {}),
      ...(item.wordsearchGridBorder ? { wordsearchGridBorder: item.wordsearchGridBorder } : {}),
      ...(item.wordsearchCase ? { wordsearchCase: item.wordsearchCase } : {}),
      ...(typeof item.targetLetter === 'string' ? { targetLetter: item.targetLetter } : {}),
      ...(item.targetLetterMode === 'auto' || item.targetLetterMode === 'manual' ? { targetLetterMode: item.targetLetterMode } : {}),
      ...(typeof item.showWordLabels === 'boolean' ? { showWordLabels: item.showWordLabels } : {}),
      ...(typeof item.sentenceScramble === 'boolean' ? { sentenceScramble: item.sentenceScramble } : {}),
      ...(item.sentenceSeparator ? { sentenceSeparator: item.sentenceSeparator } : {}),
      ...(item.sentenceHintStyle ? { sentenceHintStyle: item.sentenceHintStyle } : {}),
      ...(item.sentenceTraceFontSize ? { sentenceTraceFontSize: item.sentenceTraceFontSize } : {}),
      ...(item.type15NumberStyle === 'none' || item.type15NumberStyle === 'traditional' ? { type15NumberStyle: item.type15NumberStyle } : {}),
      ...(item.type15Border === 'full' || item.type15Border === 'outerOnly' || item.type15Border === 'none' ? { type15Border: item.type15Border } : {}),
      ...(item.type15ChoiceMode === 'ab' || item.type15ChoiceMode === 'checkbox' || item.type15ChoiceMode === 'none' ? { type15ChoiceMode: item.type15ChoiceMode } : {}),
      ...(item.type15LetterBandBg === 'tint' || item.type15LetterBandBg === 'white' ? { type15LetterBandBg: item.type15LetterBandBg } : {}),
      ...(item.type16SoundMode === 'beginning' || item.type16SoundMode === 'ending' ? { type16SoundMode: item.type16SoundMode } : {}),
      ...(item.type16ChoiceCount === 2 || item.type16ChoiceCount === 3 || item.type16ChoiceCount === 4 ? { type16ChoiceCount: item.type16ChoiceCount } : {}),
      ...(item.type16Layout === 'lettersLeft' || item.type16Layout === 'lettersRight' || item.type16Layout === 'lettersBottom' ? { type16Layout: item.type16Layout } : {}),
      ...(item.type16LetterCase === 'lower' || item.type16LetterCase === 'upper' || item.type16LetterCase === 'both' ? { type16LetterCase: item.type16LetterCase } : {}),
      ...(item.type16Border === 'none' || item.type16Border === 'outerOnly' || item.type16Border === 'full' ? { type16Border: item.type16Border } : {}),
      ...(item.type17TaskMode === 'color' || item.type17TaskMode === 'cross' ? { type17TaskMode: item.type17TaskMode } : {}),
      ...(item.type17Border === 'full' || item.type17Border === 'outerOnly' || item.type17Border === 'none' ? { type17Border: item.type17Border } : {}),
      ...(item.type17CardBorder === 'none' || item.type17CardBorder === 'rounded' ? { type17CardBorder: item.type17CardBorder } : {}),
      ...(item.type17LetterCase === 'lower' || item.type17LetterCase === 'upper' ? { type17LetterCase: item.type17LetterCase } : {}),
      ...(item.type17StripLength !== undefined ? { type17StripLength: item.type17StripLength } : {}),
      ...(item.type17HighlightTarget === 'none' || item.type17HighlightTarget === 'red' ? { type17HighlightTarget: item.type17HighlightTarget } : {}),
      ...(typeof item.type17ShowExample === 'boolean' ? { type17ShowExample: item.type17ShowExample } : {}),
      ...(typeof item.type18TargetLetter === 'string' ? { type18TargetLetter: item.type18TargetLetter } : {}),
      ...(item.type18Mode ? { type18Mode: item.type18Mode } : {}),
      ...(typeof item.type18ColorUpper === 'string' ? { type18ColorUpper: item.type18ColorUpper } : {}),
      ...(typeof item.type18ColorLower === 'string' ? { type18ColorLower: item.type18ColorLower } : {}),
      ...(typeof item.type18GridRows === 'number' ? { type18GridRows: item.type18GridRows } : {}),
      ...(typeof item.type18GridCols === 'number' ? { type18GridCols: item.type18GridCols } : {}),
      ...(item.type18Border ? { type18Border: item.type18Border } : {}),
      ...(item.type18CircleStyle ? { type18CircleStyle: item.type18CircleStyle } : {}),
      ...(item.type18DistractorCasing ? { type18DistractorCasing: item.type18DistractorCasing } : {}),
      ...(item.type18HighlightTarget ? { type18HighlightTarget: item.type18HighlightTarget } : {}),
      ...(item.answerMode ? { answerMode: item.answerMode } : {}),
      ...(Array.isArray(item.selectedWordIndices) ? { selectedWordIndices: item.selectedWordIndices } : {}),
      ...(Array.isArray(item.selectedWordTerms) ? { selectedWordTerms: item.selectedWordTerms } : {}),
      ...(item.wordsearchSeed !== undefined ? { wordsearchSeed: item.wordsearchSeed } : {}),
      ...(item.type3Seed !== undefined ? { type3Seed: item.type3Seed } : {}),
      ...(item.type6Seed !== undefined ? { type6Seed: item.type6Seed } : {}),
      ...(item.type19MazeMode ? { type19MazeMode: item.type19MazeMode } : {}),
      ...(item.type19WallColor ? { type19WallColor: item.type19WallColor } : {}),
      ...(item.type19EntranceCharacter ? { type19EntranceCharacter: item.type19EntranceCharacter } : {}),
      ...(item.type19TargetItem ? { type19TargetItem: item.type19TargetItem } : {}),
      ...(typeof item.type19SentenceStem === 'string' ? { type19SentenceStem: item.type19SentenceStem } : {}),
      ...(item.type19CornerStyle ? { type19CornerStyle: item.type19CornerStyle } : {}),
      ...(item.type19WallThickness ? { type19WallThickness: item.type19WallThickness } : {}),
      ...(item.type19MazeSeed !== undefined ? { type19MazeSeed: item.type19MazeSeed } : {}),
      ...(item.type19Seed !== undefined ? { type19Seed: item.type19Seed } : {}),
      ...(item.type19HintMode ? { type19HintMode: item.type19HintMode } : {}),
      ...(item.type19GridBorder ? { type19GridBorder: item.type19GridBorder } : {}),
      ...(item.type19LineStyle ? { type19LineStyle: item.type19LineStyle } : {}),
      ...(item.type19BorderColor ? { type19BorderColor: item.type19BorderColor } : {}),
      ...(item.type19PuzzlesPerPage !== undefined ? { type19PuzzlesPerPage: item.type19PuzzlesPerPage } : {}),
      ...(item.type19Casing ? { type19Casing: item.type19Casing } : {}),
      ...(typeof item.type19ShowClueImage === 'boolean' ? { type19ShowClueImage: item.type19ShowClueImage } : {}),
      ...(typeof item.type19ShowClueNumber === 'boolean' ? { type19ShowClueNumber: item.type19ShowClueNumber } : {}),
      ...(typeof item.type19ShowClueText === 'boolean' ? { type19ShowClueText: item.type19ShowClueText } : {}),
      ...(typeof item.type19ShowTrace === 'boolean' ? { type19ShowTrace: item.type19ShowTrace } : {}),
      ...(item.type20HintMode ? { type20HintMode: item.type20HintMode } : {}),
      ...(item.type20GridBorder ? { type20GridBorder: item.type20GridBorder } : {}),
      ...(item.type20LineStyle ? { type20LineStyle: item.type20LineStyle } : {}),
      ...(item.type20BorderColor ? { type20BorderColor: item.type20BorderColor } : {}),
      ...(item.type20PuzzlesPerPage !== undefined ? { type20PuzzlesPerPage: item.type20PuzzlesPerPage } : {}),
      ...(item.type20Casing ? { type20Casing: item.type20Casing } : {}),
      ...(typeof item.type20ShowClueImage === 'boolean' ? { type20ShowClueImage: item.type20ShowClueImage } : {}),
      ...(typeof item.type20ShowClueNumber === 'boolean' ? { type20ShowClueNumber: item.type20ShowClueNumber } : {}),
      ...(typeof item.type20ShowClueText === 'boolean' ? { type20ShowClueText: item.type20ShowClueText } : {}),
      ...(typeof item.type20ShowTrace === 'boolean' ? { type20ShowTrace: item.type20ShowTrace } : {}),
      ...(item.type20GridMode ? { type20GridMode: item.type20GridMode } : {}),
      ...(typeof item.type20HollowArrows === 'boolean' ? { type20HollowArrows: item.type20HollowArrows } : {}),
      ...(typeof item.type20ClueColumns === 'number' ? { type20ClueColumns: item.type20ClueColumns } : {}),
      ...(typeof item.type19CellSize === 'number' ? { type19CellSize: item.type19CellSize } : {})
    };

    sanitized.push(sec);
  }

  return sanitized;
}

/**
 * Import template(s) from JSON string with strict validation and sanitization
 * - Validates JSON structure
 * - Filters out invalid section types (e.g. Type 5 or non-numeric)
 * - Ensures positive word count
 * - Forces isBuiltIn: false
 * - Assigns fresh unique IDs
 * - Resolves naming collisions with existing templates
 */
export function importTemplateFromJSON(
  jsonString: string
): { success: boolean; importedCount: number; message: string; templates?: WorksheetTemplate[] } {
  if (!jsonString || typeof jsonString !== 'string') {
    return {
      success: false,
      importedCount: 0,
      message: 'Lỗi: Dữ liệu JSON rỗng hoặc không đúng định dạng chuỗi'
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      success: false,
      importedCount: 0,
      message: 'Lỗi: Tệp JSON không hợp lệ hoặc bị lỗi cú pháp'
    };
  }

  if (!parsed || typeof parsed !== 'object') {
    return {
      success: false,
      importedCount: 0,
      message: 'Lỗi: Định dạng tệp JSON không được hỗ trợ'
    };
  }

  let rawCandidates: any[] = [];

  if (Array.isArray(parsed.templates)) {
    rawCandidates = parsed.templates;
  } else if (parsed.template && typeof parsed.template === 'object') {
    rawCandidates = [parsed.template];
  } else if (Array.isArray(parsed)) {
    rawCandidates = parsed;
  } else if (parsed.name && Array.isArray(parsed.sections)) {
    rawCandidates = [parsed];
  } else {
    return {
      success: false,
      importedCount: 0,
      message: 'Lỗi: Không tìm thấy mẫu bài tập hợp lệ trong tệp tải lên'
    };
  }

  const existingAll = getAllTemplates();
  const usedNames = new Set(existingAll.map((t) => t.name.toLowerCase()));
  const importedList: WorksheetTemplate[] = [];

  for (const candidate of rawCandidates) {
    if (!candidate || typeof candidate !== 'object') continue;

    const rawSections = candidate.sections;
    if (!Array.isArray(rawSections) || rawSections.length === 0) continue;

    const sanitizedSections = sanitizeImportedSections(rawSections);
    if (sanitizedSections.length === 0) continue;

    let baseName = (typeof candidate.name === 'string' && candidate.name.trim()) || 'Mẫu bài tập nhập khẩu';

    // Disambiguate name if collision with existing templates
    let finalName = baseName;
    if (usedNames.has(finalName.toLowerCase())) {
      finalName = `${baseName} (Đã nhập)`;
      let c = 2;
      while (usedNames.has(finalName.toLowerCase())) {
        finalName = `${baseName} (Đã nhập ${c})`;
        c++;
      }
    }
    usedNames.add(finalName.toLowerCase());

    const saved = saveCustomTemplate({
      name: finalName,
      description: typeof candidate.description === 'string' ? candidate.description.trim() : undefined,
      paperSize: candidate.paperSize === 'a5' ? 'a5' : 'a4',
      background: typeof candidate.background === 'string' ? candidate.background : undefined,
      fontFamily: candidate.fontFamily,
      fontSize: typeof candidate.fontSize === 'number' ? candidate.fontSize : undefined,
      spacing: typeof candidate.spacing === 'number' ? candidate.spacing : undefined,
      imageSize: typeof candidate.imageSize === 'number' ? candidate.imageSize : undefined,
      showHeader: typeof candidate.showHeader === 'boolean' ? candidate.showHeader : true,
      showFooter: typeof candidate.showFooter === 'boolean' ? candidate.showFooter : true,
      showImageBorder: typeof candidate.showImageBorder === 'boolean' ? candidate.showImageBorder : false,
      showTableGrid: typeof candidate.showTableGrid === 'boolean' ? candidate.showTableGrid : false,
      ...(candidate.answerMode ? { answerMode: candidate.answerMode } : {}),
      sections: sanitizedSections
    });

    importedList.push(saved);
  }

  if (importedList.length === 0) {
    return {
      success: false,
      importedCount: 0,
      message: 'Lỗi: Không có mẫu bài tập nào hợp lệ để nhập (các phần bài tập bị thiếu hoặc không đúng quy cách)'
    };
  }

  return {
    success: true,
    importedCount: importedList.length,
    message: `Đã nhập thành công ${importedList.length} mẫu bài tập!`,
    templates: importedList
  };
}

/**
 * Reset custom templates storage (for testing purposes)
 */
export function resetCustomTemplatesForTesting(): void {
  const storage = getLocalStorage();
  if (storage) {
    try {
      storage.removeItem(WORKSHEET_TEMPLATES_STORAGE_KEY);
    } catch {
      // ignore
    }
  }
  memoryStoreFallback = null;
}
