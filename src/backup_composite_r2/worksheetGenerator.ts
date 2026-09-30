import { jsPDF } from 'jspdf';
import { getImageFile } from '../lib/storage';
import {
  fontAsapCondensed,
  fontFarsan,
  fontHLHOCTRO,
  fontHP001_4_2,
  fontHP001_b4h,
  fontLinotteRegular,
  fontLinotteSemiBold,
  fontQuestrial
} from './worksheetFontsData';
import { fontKGPrimaryDots } from './worksheetFontKGPrimaryDots';

export interface WorksheetWord {
  id?: string;
  term: string;
  definition?: string;
  phonetic?: string;
  imageUrl?: string;
  exampleSentence?: string;
}

export type WorksheetType = 2 | 3 | 4 | 6 | 7 | 8 | 9 | 10;
export type BlankMode = 'vowels' | 'random1' | 'random2' | 'random3';

export const BLANK_MODE_OPTIONS = [
  { id: 'vowels', name: 'Đục lỗ nguyên âm (a, e, i, o, u)' },
  { id: 'random1', name: 'Ngẫu nhiên 1 lỗ' },
  { id: 'random2', name: 'Ngẫu nhiên 2 lỗ' },
  { id: 'random3', name: 'Ngẫu nhiên 3 lỗ' }
];

export const SPACING_OPTIONS = [
  { value: 0, label: '0 pt (Sát nhau - Siêu gọn)' },
  { value: 2, label: '2 pt (Rất hẹp)' },
  { value: 4, label: '4 pt (Hẹp)' },
  { value: 6, label: '6 pt (Chuẩn Word - Mặc định)' },
  { value: 8, label: '8 pt (Vừa phải)' },
  { value: 10, label: '10 pt (Hơi rộng)' },
  { value: 12, label: '12 pt (1 dòng đầy đủ)' },
  { value: 18, label: '18 pt (1.5 dòng)' },
  { value: 24, label: '24 pt (2 dòng - Rộng)' },
  { value: 36, label: '36 pt (3 dòng - Rộng rãi)' },
  { value: 48, label: '48 pt (4 dòng - Rất rộng)' }
];

export interface WorksheetOptions {
  type: WorksheetType;
  title: string;
  fontSize?: number; // default: 12
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  paperSize?: 'a5' | 'a4'; // default: 'a5'
  blankMode?: BlankMode; // default: 'vowels'
  spacing?: number; // Spacing in pt between parts like Microsoft Word (default: 6 pt)
  background?: string; // 'bg4' ... 'bg12' or ''
  words: WorksheetWord[];
  sourceUrl?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showImageBorder?: boolean;
  showTableGrid?: boolean; // default: false (no table borders/grid)
  imageSize?: number; // in mm, default: 12.7 (0.5 in)
}

export interface CompositeWorksheetSection {
  id: string;
  type: WorksheetType; // 2 | 3 | 4 | 6 | 7 | 8 | 9 | 10
  title: string;
  instruction?: string;
  words: WorksheetWord[];
  blankMode?: BlankMode;
  pageBreakBefore?: boolean;
  spacing?: number;
  fontSize?: number;
}

export interface CompositeWorksheetConfig {
  title: string;
  paperSize?: 'a5' | 'a4';
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  fontSize?: number;
  spacing?: number;
  background?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showImageBorder?: boolean;
  showTableGrid?: boolean;
  sourceUrl?: string;
  sections: CompositeWorksheetSection[];
  allWords?: WorksheetWord[];
}

export interface WorksheetTypeMeta {
  type: WorksheetType;
  name: string;
  description: string;
  thumbnail: string;
}

export const WORKSHEET_TYPES: WorksheetTypeMeta[] = [
  {
    type: 2,
    name: 'Nhìn tranh viết từ (3x4)',
    description: 'Bố cục 12 từ/trang, có tranh minh họa và dòng kẻ để học sinh tự điền từ vựng.',
    thumbnail: '/worksheet/types/loai-pdf-2.PNG'
  },
  {
    type: 3,
    name: 'Nối tranh với từ vựng',
    description: 'Tranh minh họa ở hai bên, các khung từ vựng ở giữa được xáo trộn để nối.',
    thumbnail: '/worksheet/types/loai-pdf-3.PNG'
  },
  {
    type: 4,
    name: 'Điền chữ cái còn thiếu',
    description: 'Dưới mỗi tranh là từ vựng được đục lỗ (nguyên âm hoặc ngẫu nhiên), không gạch chấm.',
    thumbnail: '/worksheet/types/loai-pdf-4.PNG'
  },
  {
    type: 6,
    name: 'Trắc nghiệm chọn từ đúng',
    description: 'Mỗi tranh có 3 lựa chọn không khung viền, khoảng cách 1 dòng 6 pt gọn gàng.',
    thumbnail: '/worksheet/types/loai-pdf-6.PNG'
  },
  {
    type: 7,
    name: 'Sắp xếp chữ cái xáo trộn (Unscramble)',
    description: 'Có hình minh họa, chữ cái giữ nguyên hoa/thường, khoảng cách 1 dòng 6 pt.',
    thumbnail: '/worksheet/types/loai-pdf-7.PNG'
  },
  {
    type: 8,
    name: 'Look and trace (Tập tô từ vựng)',
    description: 'Bảng 4 cột: Tranh minh họa không khung + 3 lần từ vựng nét chấm font KG Primary Dots, viền nét đứt.',
    thumbnail: '/worksheet/types/loai-pdf-8.PNG'
  },
  {
    type: 9,
    name: 'Nhìn câu tô màu Yes/No (Look and color Yes or No)',
    description: 'Mỗi mục gồm 1 tranh và 1 câu chứa từ vựng (phần <#...#> tô đỏ nổi bật), không khung, bên dưới có 2 hình tròn Yes và No để học sinh tô màu.',
    thumbnail: '/worksheet/types/loai-pdf-9.PNG'
  },
  {
    type: 10,
    name: 'Nhìn từ tô màu tranh (Look and color)',
    description: 'Mỗi từ có 2 tranh (1 đúng, 1 gây nhiễu) không khung viền, học sinh nhìn từ và tô màu tranh đúng.',
    thumbnail: '/worksheet/types/loai-pdf-10.PNG'
  }
];

export const BACKGROUND_OPTIONS = [
  { id: '', name: 'Không viền' },
  { id: 'bg4', name: 'Mẫu 1 - Khung viền sắc màu' },
  { id: 'bg5', name: 'Mẫu 2 - Khung hoa lá thiên nhiên' },
  { id: 'bg6', name: 'Mẫu 3 - Khung bút chì & học tập' },
  { id: 'bg7', name: 'Mẫu 4 - Khung rực rỡ vàng cam' },
  { id: 'bg8', name: 'Mẫu 5 - Khung tươi sáng xanh ngọc' },
  { id: 'bg9', name: 'Mẫu 6 - Khung đơn giản hiện đại' },
  { id: 'bg10', name: 'Mẫu 7 - Khung nhẹ nhàng trang nhã' },
  { id: 'bg11', name: 'Mẫu 8 - Khung hoạt họa vui nhộn' },
  { id: 'bg12', name: 'Mẫu 9 - Khung pastel đáng yêu' }
];

export const FONT_OPTIONS = [
  { id: 'r0c0i Linotte', name: 'Font 1 - r0c0i Linotte (Mặc định chuẩn)', file: 'Linotte-Regular-normal.ttf' },
  { id: 'Farsan', name: 'Font 2 - Farsan', file: 'Farsan-Regular-normal.ttf' },
  { id: 'HP001', name: 'Font 3 - HP001 (Ô ly tiểu học)', file: 'fontHP001_b4h+HP001_b4h-normal.ttf' },
  { id: 'HLHOCTRO', name: 'Font 4 - HL Học Trò', file: 'HLHOCTRO-normal.ttf' },
  { id: 'Questrial', name: 'Font 5 - Questrial (Hiện đại)', file: 'Questrial-Regular-normal.ttf' },
  { id: 'KG Primary Dots', name: 'Font 6 - KG Primary Dots (Tập tô nét chấm)', file: 'KGPrimaryDots.ttf' }
];

export const PAPER_SIZE_OPTIONS = [
  { id: 'a5', name: 'Khổ A5 (148 x 210 mm) - Lề hẹp 0.5" (Khuyên dùng)' },
  { id: 'a4', name: 'Khổ A4 (210 x 297 mm) - Tiêu chuẩn' }
];

function setDocLineDash(doc: jsPDF, dashArray: number[]) {
  if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern(dashArray, 0);
  } else if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash(dashArray);
  }
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function punchBlanks(term: string, mode: BlankMode = 'vowels'): string {
  if (!term) return '';
  if (mode === 'vowels') {
    return term
      .replace(/([aeiou])/gi, ' __ ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  const targetHoles = mode === 'random1' ? 1 : mode === 'random2' ? 2 : 3;
  const chars = term.split('');
  const letterIndices: number[] = [];
  chars.forEach((c, idx) => {
    if (/[a-zA-Z]/.test(c)) {
      letterIndices.push(idx);
    }
  });

  if (letterIndices.length === 0) return term;

  const holesToPunch = Math.min(targetHoles, Math.max(1, letterIndices.length - 1));
  const shuffledIndices = shuffleArray(letterIndices);
  const chosenIndices = new Set(shuffledIndices.slice(0, holesToPunch));

  const resultChars = chars.map((c, idx) => {
    if (chosenIndices.has(idx)) {
      return ' __ ';
    }
    return c;
  });

  return resultChars
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

function scrambleString(word: string): string {
  const parts = word.split(' ');
  const scrambledParts = parts.map((part) => {
    if (part.length <= 1) return part;
    let chars = part.split('');
    let attempt = 0;
    let scrambled = part;
    while ((scrambled === part || attempt === 0) && attempt < 10) {
      chars = shuffleArray(chars);
      scrambled = chars.join('');
      attempt++;
    }
    return chars.join(' ');
  });
  return scrambledParts.join('   ');
}

export interface HighlightedSpan {
  text: string;
  isHighlighted: boolean;
}

export function parseHighlightedSentence(sentence?: string, fallbackTerm?: string): HighlightedSpan[] {
  const raw = (sentence || '').trim();
  if (!raw) {
    if (fallbackTerm && fallbackTerm.trim()) {
      return [
        { text: 'Is there a ', isHighlighted: false },
        { text: fallbackTerm.trim(), isHighlighted: true },
        { text: '?', isHighlighted: false }
      ];
    }
    return [{ text: '', isHighlighted: false }];
  }

  // Check if sentence contains <#...#>
  if (/<#[\s\S]*?#>/.test(raw)) {
    const spans: HighlightedSpan[] = [];
    const regex = /<#([\s\S]*?)#>/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(raw)) !== null) {
      if (match.index > lastIndex) {
        spans.push({
          text: raw.substring(lastIndex, match.index),
          isHighlighted: false
        });
      }
      spans.push({
        text: match[1],
        isHighlighted: true
      });
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < raw.length) {
      spans.push({
        text: raw.substring(lastIndex),
        isHighlighted: false
      });
    }
    return spans;
  }

  // Fallback: If no <#...#>, try to highlight the target term if present in sentence
  if (fallbackTerm && fallbackTerm.trim().length > 0) {
    const escaped = fallbackTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`\\b(${escaped})\\b`, 'i');
    const m = termRegex.exec(raw);
    if (m && m.index !== undefined) {
      const spans: HighlightedSpan[] = [];
      if (m.index > 0) {
        spans.push({ text: raw.substring(0, m.index), isHighlighted: false });
      }
      spans.push({ text: m[1], isHighlighted: true });
      if (m.index + m[0].length < raw.length) {
        spans.push({ text: raw.substring(m.index + m[0].length), isHighlighted: false });
      }
      return spans;
    }
  }

  return [{ text: raw, isHighlighted: false }];
}

export function layoutTraceText(
  doc: jsPDF,
  term: string,
  initialFontSize: number,
  maxWidth: number
): { lines: string[]; fontSize: number } {
  let currentFontSize = initialFontSize;
  doc.setFont('KGPrimaryDots', 'normal');
  doc.setFontSize(currentFontSize);

  const cleanTerm = (term || '').trim();
  const words = cleanTerm.split(/\s+/);

  // If multi-word (e.g. "computer room", "art room", "music room"), wrap words to multiple lines
  let lines: string[] = [];
  if (words.length > 1) {
    let currentLine = '';
    for (const w of words) {
      const testLine = currentLine ? `${currentLine} ${w}` : w;
      if (doc.getTextWidth(testLine) <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = w;
      }
    }
    if (currentLine) lines.push(currentLine);
  } else {
    lines = [cleanTerm];
  }

  // If any line still exceeds maxWidth, scale down font size until it fits safely
  let maxLineWidth = Math.max(...lines.map((l) => doc.getTextWidth(l)));
  while (maxLineWidth > maxWidth && currentFontSize > 9) {
    currentFontSize -= 0.5;
    doc.setFontSize(currentFontSize);

    if (words.length > 1) {
      lines = [];
      let currentLine = '';
      for (const w of words) {
        const testLine = currentLine ? `${currentLine} ${w}` : w;
        if (doc.getTextWidth(testLine) <= maxWidth) {
          currentLine = testLine;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = w;
        }
      }
      if (currentLine) lines.push(currentLine);
    }
    maxLineWidth = Math.max(...lines.map((l) => doc.getTextWidth(l)));
  }

  return { lines, fontSize: currentFontSize };
}

interface SentenceToken {
  text: string;
  isHighlighted: boolean;
}

function drawHighlightedCenteredSentence(
  doc: jsPDF,
  spans: HighlightedSpan[],
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  fontSizePt: number
) {
  doc.setFontSize(fontSizePt);

  // Flatten into words / tokens while keeping punctuation attached
  const tokens: SentenceToken[] = [];
  for (const span of spans) {
    const parts = span.text.split(/(\s+)/);
    for (const part of parts) {
      if (part.length > 0) {
        tokens.push({ text: part, isHighlighted: span.isHighlighted });
      }
    }
  }

  // Group tokens into lines constrained by boxWidth - 3
  const maxLineWidth = Math.max(10, boxWidth - 3);
  const lines: SentenceToken[][] = [];
  let curLine: SentenceToken[] = [];
  let curLineWidth = 0;

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token.text);
    doc.setFont('fff', token.isHighlighted ? 'bold' : 'normal');
    const tokenW = isSpace ? doc.getTextWidth(' ') : doc.getTextWidth(token.text);

    if (curLine.length === 0) {
      if (!isSpace) {
        curLine.push(token);
        curLineWidth += tokenW;
      }
    } else {
      if (curLineWidth + tokenW <= maxLineWidth || isSpace) {
        curLine.push(token);
        curLineWidth += tokenW;
      } else {
        while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
          curLine.pop();
        }
        lines.push(curLine);
        if (!isSpace) {
          curLine = [token];
          curLineWidth = tokenW;
        } else {
          curLine = [];
          curLineWidth = 0;
        }
      }
    }
  }
  if (curLine.length > 0) {
    while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
      curLine.pop();
    }
    if (curLine.length > 0) {
      lines.push(curLine);
    }
  }

  if (lines.length === 0) return;

  const linePitch = fontSizePt * 0.352778 * 1.25; // Line height in mm
  const totalHeight = lines.length * linePitch;
  const startY = boxY + (boxHeight - totalHeight) / 2 + linePitch * 0.75;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    let lineWidth = 0;
    for (const t of line) {
      const isSpace = /^\s+$/.test(t.text);
      doc.setFont('fff', t.isHighlighted ? 'bold' : 'normal');
      lineWidth += isSpace ? doc.getTextWidth(' ') : doc.getTextWidth(t.text);
    }

    let curX = boxX + (boxWidth - lineWidth) / 2;
    const curY = startY + l * linePitch;

    for (const t of line) {
      const isSpace = /^\s+$/.test(t.text);
      doc.setFont('fff', t.isHighlighted ? 'bold' : 'normal');
      if (isSpace) {
        curX += doc.getTextWidth(' ');
      } else {
        if (t.isHighlighted) {
          doc.setTextColor(220, 38, 38); // Highlight red
        } else {
          doc.setTextColor(30, 41, 59); // Normal dark slate
        }
        doc.text(t.text, curX, curY);
        curX += doc.getTextWidth(t.text);
      }
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setFont('fff', 'normal');
}

// In-memory image cache to avoid re-fetching the same image during PDF generation
const imageBase64Cache = new Map<string, string>();

async function fetchImageAsBase64(url: string): Promise<string | null> {
  if (!url) return null;
  if (imageBase64Cache.has(url)) {
    return imageBase64Cache.get(url)!;
  }

  // Case 1: Already a base64 Data URL
  if (url.startsWith('data:image/')) {
    imageBase64Cache.set(url, url);
    return url;
  }

  // Case 2: Firestore image pointer (stored in IndexedDB / Firestore)
  if (url.startsWith('firestore://')) {
    const id = url.split('/').pop();
    if (id) {
      try {
        const base64 = await getImageFile(id);
        if (base64) {
          imageBase64Cache.set(url, base64);
          return base64;
        }
      } catch (err) {
        console.warn('Failed to load firestore image:', id, err);
      }
    }
    return null;
  }

  // Case 3: HTTP / HTTPS / Relative URL
  try {
    let fetchUrl = url;
    // If it's a remote URL or yourhomework image, proxy it through our server
    if (url.startsWith('http://') || url.startsWith('https://')) {
      fetchUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) {
      console.warn(`Failed to fetch image: ${fetchUrl}, status: ${res.status}`);
      return null;
    }

    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        imageBase64Cache.set(url, base64data);
        resolve(base64data);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`Error loading image ${url}:`, err);
    return null;
  }
}

// Insert decorative background if selected
async function insertBackground(doc: jsPDF, bgId?: string, isA5: boolean = true) {
  if (!bgId) return;
  const bgPath = `/worksheet/backgrounds/${bgId}.jpg`;
  const bgBase64 = await fetchImageAsBase64(bgPath);
  if (!bgBase64) return;

  const w = isA5 ? 148 : 210;
  const h = isA5 ? 210 : 297;

  try {
    doc.addImage(bgBase64, 'JPEG', 0, 0, w, h);
  } catch (e) {
    console.warn('Failed to insert background:', e);
  }
}

function registerFonts(doc: jsPDF, activeFont: string) {
  // Always register Linotte as default font
  doc.addFileToVFS('Linotte-Regular-normal.ttf', fontLinotteRegular);
  doc.addFont('Linotte-Regular-normal.ttf', 'r0c0i Linotte', 'normal');
  doc.addFont('Linotte-Regular-normal.ttf', 'Linotte', 'normal');

  doc.addFileToVFS('Linotte-SemiBold-normal.ttf', fontLinotteSemiBold);
  doc.addFont('Linotte-SemiBold-normal.ttf', 'r0c0i Linotte', 'bold');
  doc.addFont('Linotte-SemiBold-normal.ttf', 'Linotte', 'bold');

  // Always register KGPrimaryDots font for Look and trace and general use
  doc.addFileToVFS('KGPrimaryDots.ttf', fontKGPrimaryDots);
  doc.addFont('KGPrimaryDots.ttf', 'KGPrimaryDots', 'normal');
  doc.addFont('KGPrimaryDots.ttf', 'KG Primary Dots', 'normal');

  // Register the chosen font
  if (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) {
    doc.addFont('Linotte-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'Farsan') {
    doc.addFileToVFS('Farsan-Regular-normal.ttf', fontFarsan);
    doc.addFont('Farsan-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'HP001') {
    doc.addFileToVFS('HP001_b4h-normal.ttf', fontHP001_b4h);
    doc.addFont('HP001_b4h-normal.ttf', 'fff', 'normal');
    doc.addFont('HP001_b4h-normal.ttf', 'fontHP001_b4h', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');

    doc.addFileToVFS('HP001_4_hang_2_o_ly-normal.ttf', fontHP001_4_2);
    doc.addFont('HP001_4_hang_2_o_ly-normal.ttf', 'fontHP001_4_2', 'normal');
  } else if (activeFont === 'HLHOCTRO') {
    doc.addFileToVFS('HLHOCTRO-normal.ttf', fontHLHOCTRO);
    doc.addFont('HLHOCTRO-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'Questrial') {
    doc.addFileToVFS('Questrial-Regular-normal.ttf', fontQuestrial);
    doc.addFont('Questrial-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'KG Primary Dots' || activeFont === 'KGPrimaryDots') {
    doc.addFont('KGPrimaryDots.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else {
    doc.addFont('Linotte-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  }
}

export async function generateWorksheetPDF(options: WorksheetOptions): Promise<jsPDF> {
  const {
    type,
    title,
    fontSize = 12,
    fontFamily = 'r0c0i Linotte',
    paperSize = 'a5',
    blankMode = 'vowels',
    spacing = 6, // Spacing in pt like Microsoft Word (default: 6 pt)
    background = '',
    words,
    sourceUrl = 'https://yourhomework.net',
    showHeader = false,
    showFooter = false,
    showImageBorder = false,
    showTableGrid = false,
    imageSize = 12.7 // 0.5 inches = 12.7 mm
  } = options;

  const gapMm = (spacing !== undefined ? spacing : 6) * 0.352778; // Convert pt to mm (1 pt = 0.352778 mm)
  const isA5 = paperSize !== 'a4';
  const pageWidth = isA5 ? 148 : 210;
  const pageHeight = isA5 ? 210 : 297;
  const margin = 12.7; // 0.5 in on all sides (from user image)
  const printableWidth = pageWidth - margin * 2; // 122.6 mm for A5
  const printableHeight = pageHeight - margin * 2; // 184.6 mm for A5
  const imgSize = imageSize || 12.7; // 12.7 mm = 0.5 in

  const validWords = words.filter((w) => w && w.term && w.term.trim().length > 0);
  if (validWords.length === 0) {
    throw new Error('Danh sách từ vựng trống. Vui lòng chọn ít nhất 1 từ.');
  }

  // Pre-load all required images in parallel
  const wordImages = await Promise.all(
    validWords.map(async (w) => {
      if (!w.imageUrl) return null;
      return await fetchImageAsBase64(w.imageUrl);
    })
  );

  const doc = new jsPDF({
    unit: 'mm',
    orientation: 'portrait',
    format: isA5 ? 'a5' : 'a4'
  });

  const activeFont = (type as number) === 5 ? 'HP001' : (fontFamily || 'r0c0i Linotte');
  registerFonts(doc, activeFont);

  doc.setProperties({
    title: title || 'English Vocabulary Worksheet',
    subject: 'Learn English Vocabulary',
    author: 'Game-Vocab YourHomework Worksheet',
    keywords: 'vocabulary, worksheet, flashcard, english, learn',
    creator: 'Game-Vocab'
  });

  // Render logic according to type
  if ((type as number) === 1) {
    // -------------------------------------------------------------
    // TYPE 1: Writing Word Worksheet (Standard Text + 3 dotted lines)
    // -------------------------------------------------------------
    const wordsPerPage = isA5 ? 8 : 5;
    const imgTop = (showHeader && title) ? margin + 14 : margin + 4;
    const imgGap = isA5 ? 8.5 : 10;
    const xImg = margin;
    const textX = xImg + imgSize + 5;
    const lineWidth = pageWidth - margin - textX;
    const lineSpacing = isA5 ? 6.5 : 12;

    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      // Settings for content
      doc.setFontSize(fontSize);
      doc.setFont('fff', 'normal');
      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.15);
      setDocLineDash(doc, [0.4, 0.6]);

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      let rowOnPage = 0;
      for (let i = startIdx; i < endIdx; i++) {
        const word = validWords[i];
        const img = wordImages[i];
        const yImg = imgTop + (imgSize + imgGap) * rowOnPage;

        // Image
        if (img) {
          try {
            doc.addImage(img, 'JPEG', xImg, yImg, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(xImg, yImg, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(xImg, yImg, imgSize, imgSize);
        }

        const textY = yImg + (isA5 ? 4.5 : 10);

        // Term
        doc.text(word.term, textX, textY);

        // 3 Writing Lines
        doc.line(textX, textY, textX + lineWidth, textY);
        doc.line(textX, textY + lineSpacing, textX + lineWidth, textY + lineSpacing);
        doc.line(textX, textY + lineSpacing * 2, textX + lineWidth, textY + lineSpacing * 2);

        rowOnPage++;
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if ((type as number) === 5) {
    // -------------------------------------------------------------
    // TYPE 5: Writing Word Worksheet (Handwriting Font HP001 + Ô Ly Grid)
    // -------------------------------------------------------------
    const wordsPerPage = isA5 ? 7 : 5;
    const imgTop = (showHeader && title) ? margin + 14 : margin + 4;
    const imgGap = isA5 ? 9 : 10;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      doc.setFontSize(isA5 ? 15 : 22);
      doc.setFont('fontHP001_b4h', 'normal');
      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.1);
      setDocLineDash(doc, [0.5]);

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      let rowOnPage = 0;
      for (let i = startIdx; i < endIdx; i++) {
        const word = validWords[i];
        const img = wordImages[i];
        const xImg = margin;
        const yImg = imgTop + (imgSize + imgGap) * rowOnPage;

        if (img) {
          try {
            doc.addImage(img, 'JPEG', xImg, yImg, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(xImg, yImg, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(xImg, yImg, imgSize, imgSize);
        }

        const gridX = xImg + imgSize + 5;
        const gridY = yImg + (isA5 ? 5 : 9.5);

        // Font HP001 4 hàng 2 ô ly lines
        doc.setFont('fontHP001_4_2', 'normal');
        const blankLine = isA5 ? '                                ' : '                                          ';
        doc.text(blankLine, gridX, gridY);
        doc.text(blankLine, gridX, gridY + (isA5 ? 7 : 12.5));
        doc.text(blankLine, gridX, gridY + (isA5 ? 14 : 25));

        // Word text
        doc.setFont('fontHP001_b4h', 'normal');
        doc.text(word.term, gridX, gridY);

        // Vertical lines for ô ly
        const colCount = isA5 ? 55 : 88;
        const colSpacing = 1.5;
        for (let c = 0; c < colCount; c++) {
          if (c % 4 === 0) {
            setDocLineDash(doc, []);
            doc.setLineWidth(0.1);
          } else {
            setDocLineDash(doc, [0.1]);
            doc.setLineWidth(0.1);
          }
          doc.line(
            gridX + c * colSpacing,
            yImg + 1,
            gridX + c * colSpacing,
            yImg + (isA5 ? 20 : 39)
          );
        }

        rowOnPage++;
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 2) {
    // -------------------------------------------------------------
    // TYPE 2: Write words based on pictures (3 columns grid on A5)
    // Dynamic spacing between rows (gap between dotted line and next image)
    // -------------------------------------------------------------
    const cols = 3;
    const colWidth = printableWidth / cols; // 40.86 mm on A5
    const topMargin = (showHeader && title) ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - 4;

    // Spacing between rows (from dotted line of row N to image of row N+1)
    const lineOffset = 3.5 + (spacing !== undefined ? spacing : 6) * 0.1;
    const rowGap = 0.8 + (spacing !== undefined ? spacing : 6) * 0.45;
    const rowHeight = imgSize + lineOffset + rowGap;

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const halfLineLen = isA5 ? 16 : 20;

    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.15);
      setDocLineDash(doc, [0.4, 0.6]);

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const colCenter = margin + col * colWidth + colWidth / 2;
        const imgX = colCenter - imgSize / 2;
        const imgY = topMargin + row * rowHeight;

        const img = wordImages[i];
        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // Underline for students to write word
        const lineY = imgY + imgSize + lineOffset;
        doc.line(colCenter - halfLineLen, lineY, colCenter + halfLineLen, lineY);
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 3) {
    // -------------------------------------------------------------
    // TYPE 3: Match picture to word worksheet
    // Dynamic spacing between middle word boxes and side pictures
    // -------------------------------------------------------------
    const boxWidth = isA5 ? 46 : 50;
    const boxHeight = isA5 ? 7.5 : 9.5;
    const topStart = (showHeader && title) ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topStart - margin) - 8;

    // Spacing between middle word boxes (down to 0.8mm at 0pt)
    const boxGap = 0.8 + (spacing !== undefined ? spacing : 6) * 0.352778;
    const maxCount = Math.floor(availHeight / (boxHeight + boxGap));
    const wordsPerPage = isA5 ? Math.min(14, Math.max(6, maxCount)) : Math.min(20, Math.max(8, maxCount));
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      doc.setFontSize(fontSize);
      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.2);

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);
      const pageWords = validWords.slice(startIdx, endIdx);

      const count = pageWords.length;
      const half = Math.ceil(count / 2);

      // Total vertical span of the middle word boxes
      const totalMiddleHeight = count * boxHeight + (count - 1) * boxGap;
      const imgPitch = half > 1 ? Math.max(imgSize + 1, (totalMiddleHeight - imgSize) / (half - 1)) : 0;

      // Draw pictures on left and right sides
      for (let i = 0; i < count; i++) {
        const isRight = i >= half;
        const rowInCol = isRight ? i - half : i;
        const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
        const posY = topStart + (half > 1 ? rowInCol * imgPitch : 0);

        const globalIdx = startIdx + i;
        const img = wordImages[globalIdx];

        if (img) {
          try {
            doc.addImage(img, 'JPEG', posX, posY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(posX, posY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(posX, posY, imgSize, imgSize);
        }
        if (showImageBorder) {
          doc.rect(posX - 1.5, posY - 1.5, imgSize + 3, imgSize + 3);
        }

        // Center word placeholder rounded rectangle
        const centerBoxY = topStart + i * (boxHeight + boxGap);
        doc.roundedRect((pageWidth - boxWidth) / 2, centerBoxY, boxWidth, boxHeight, 2, 2);
      }

      // Shuffled words placed in the center boxes
      const shuffledWords = shuffleArray(pageWords.map((w) => w.term));
      doc.setFont('fff', 'normal');
      for (let i = 0; i < count; i++) {
        const centerBoxY = topStart + i * (boxHeight + boxGap);
        doc.text(shuffledWords[i], pageWidth / 2, centerBoxY + boxHeight / 2 + 1.2, { align: 'center' });
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 4) {
    // -------------------------------------------------------------
    // TYPE 4: Missing Letters Worksheet (Matches media_1790061642463.png)
    // Dynamic spacing between rows (gap between missing word and next image)
    // -------------------------------------------------------------
    const cols = 3;
    const colWidth = printableWidth / cols; // 40.86 mm on A5
    const topMargin = (showHeader && title) ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - 4;

    // Spacing between rows (from bottom of missing word to top of next image)
    const textOffset = 3.5 + (spacing !== undefined ? spacing : 6) * 0.1;
    const rowGap = 0.8 + (spacing !== undefined ? spacing : 6) * 0.45;
    const rowHeight = imgSize + textOffset + 1.2 + rowGap;

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const halfLineLen = isA5 ? 17 : 20;

    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      doc.setDrawColor(80, 80, 80);
      doc.setLineWidth(0.15);
      setDocLineDash(doc, [0.4, 0.6]);
      doc.setFontSize(fontSize);
      doc.setFont('fff', 'normal');

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const colCenter = margin + col * colWidth + colWidth / 2;
        const imgX = colCenter - imgSize / 2;
        const imgY = topMargin + row * rowHeight;

        const img = wordImages[i];
        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // Blank word according to blankMode (vowels, random1, random2, random3), without dotted baseline
        const missingTerm = punchBlanks(validWords[i].term, blankMode);
        const textY = imgY + imgSize + textOffset;
        doc.text(missingTerm, colCenter, textY, { align: 'center' });
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 6) {
    // -------------------------------------------------------------
    // TYPE 6: Tick the correct word for each picture (Multiple Choice)
    // Dynamic spacing between questions/rows and between choices
    // -------------------------------------------------------------
    const cols = 2;
    const allTerms = validWords.map((w) => w.term);
    const colWidth = printableWidth / cols; // ~61.3 mm on A5
    const topStart = showHeader ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topStart - margin) - 4;

    // Line pitch between choices within a question
    const linePitch = 3.2 + (spacing !== undefined ? spacing : 6) * 0.12;
    const contentHeight = Math.max(imgSize, 2 * linePitch + 3.0);
    // Gap between questions (rows)
    const rowGap = 0.8 + (spacing !== undefined ? spacing : 6) * 0.4;
    const rowHeight = contentHeight + rowGap;

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const startX = margin + col * colWidth;
        const startY = topStart + row * rowHeight;

        const currentWord = validWords[i].term;
        const img = wordImages[i];

        // 3 options (1 correct, 2 distractors)
        const distractors = shuffleArray(allTerms.filter((t) => t !== currentWord)).slice(0, 2);
        const optionsList = shuffleArray([currentWord, ...distractors]);

        // Draw picture on left
        const imgX = startX + 1.5;
        const imgY = startY + 1;
        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // 3 options on right of picture, separated by linePitch (Word-style spacing)
        // No frames/boxes around options
        const optStartX = imgX + imgSize + 4;
        doc.setFontSize(isA5 ? 10 : 12);
        doc.setFont('fff', 'normal');
        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.2);

        for (let opt = 0; opt < 3; opt++) {
          const optY = imgY + 1.5 + opt * linePitch;
          // Small radio circle (radius 1.2mm)
          doc.circle(optStartX + 1.5, optY, 1.2, 'S');
          // Option text
          doc.text(optionsList[opt] || '', optStartX + 4.2, optY + 0.9);
        }
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 7) {
    // -------------------------------------------------------------
    // TYPE 7: Word Unscrambler on A5
    // Dynamic spacing between rows and between unscramble parts
    // -------------------------------------------------------------
    const cols = 3;
    const colWidth = printableWidth / cols;
    const topMargin = (showHeader && title) ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - 4;

    // Spacing within item (image to scrambled text, to blanks)
    const textOffset1 = 3.5 + (spacing !== undefined ? spacing : 6) * 0.1;
    const textOffset2 = 3.5 + (spacing !== undefined ? spacing : 6) * 0.1;
    const contentHeight = imgSize + textOffset1 + textOffset2 + 1.2;
    // Spacing between rows (from blanks of row N to image of row N+1)
    const rowGap = 0.8 + (spacing !== undefined ? spacing : 6) * 0.45;
    const rowHeight = contentHeight + rowGap;

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 25);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

      doc.setFontSize(fontSize);
      doc.setFont('fff', 'normal');

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const colCenter = margin + col * colWidth + colWidth / 2;
        const imgX = colCenter - imgSize / 2;
        const imgY = topMargin + row * rowHeight;

        // Image (0.5 in x 0.5 in)
        const img = wordImages[i];
        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // Scramble letters with original casing preserved from flashcard
        const scrambled = scrambleString(validWords[i].term);
        const blanks = validWords[i].term
          .split(' ')
          .map((part) => '__ '.repeat(part.length).trim())
          .join('   ');

        // Spacing between parts
        const textY1 = imgY + imgSize + textOffset1;
        const textY2 = textY1 + textOffset2;

        doc.text(scrambled, colCenter, textY1, { align: 'center' });
        doc.text(blanks, colCenter, textY2, { align: 'center' });
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 8) {
    // -------------------------------------------------------------
    // TYPE 8: Look and trace (4 columns: Image + 3 tracing words with KG Primary Dots)
    // Matches sample image media_1790130646618.png
    // Strictly NO bounding box/frame around images!
    // Automatic word-wrapping ("xuống hàng") for multi-word terms (e.g. computer room)
    // NO table grid borders by default ("bỏ khung đi")
    // -------------------------------------------------------------
    const tableX = margin;
    const tableWidth = printableWidth; // 122.6mm on A5
    const col1Width = isA5 ? 24 : 32;
    const colTraceWidth = (tableWidth - col1Width) / 3;

    // Font size customizable by user, defaulting to 22 pt on A5 (26 pt on A4)
    const traceFontSize = fontSize || (isA5 ? 22 : 26);
    const rowGap = (spacing !== undefined ? spacing : 6) * 0.25;

    const displayTitle = (title && title.trim()) ? title : 'Look and trace';
    const topMargin = margin + 9;
    const tableTopY = topMargin;
    const availHeight = pageHeight - margin - tableTopY - (showFooter ? 8 : 4);

    // Pre-calculate layouts and needed row heights for each word
    const wordLayouts = validWords.map((w) => {
      return layoutTraceText(doc, w.term, traceFontSize, colTraceWidth - 3);
    });

    const wordRowHeights = wordLayouts.map((l) => {
      const neededHeight = Math.max(
        isA5 ? 23 : 27,
        l.lines.length * (l.fontSize * 0.352778 * 1.15) + 6,
        imgSize + 4
      );
      return neededHeight + rowGap;
    });

    // Group words into pages dynamically based on cumulative row heights
    interface PageSlice {
      startIdx: number;
      endIdx: number;
      totalHeight: number;
    }
    const pages: PageSlice[] = [];
    let curStart = 0;
    let curH = 0;

    for (let i = 0; i < validWords.length; i++) {
      const h = wordRowHeights[i];
      if (curH + h > availHeight && i > curStart) {
        pages.push({ startIdx: curStart, endIdx: i, totalHeight: curH });
        curStart = i;
        curH = h;
      } else {
        curH += h;
      }
    }
    if (curStart < validWords.length) {
      pages.push({ startIdx: curStart, endIdx: validWords.length, totalHeight: curH });
    }

    const totalPages = pages.length;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title on top-left (Look and trace)
      doc.setFont('r0c0i Linotte', 'bold');
      doc.setFontSize(isA5 ? 14 : 16);
      doc.setTextColor(20, 20, 20);
      doc.text(displayTitle, tableX, margin + 5);

      const { startIdx, endIdx } = pages[page];
      let currentY = tableTopY;

      // Draw each word row
      for (let i = startIdx; i < endIdx; i++) {
        const word = validWords[i];
        const img = wordImages[i];
        const layout = wordLayouts[i];
        const rowH = wordRowHeights[i];
        const rowCenterY = currentY + rowH / 2;

        // Column 1: Image or Letter Circle Badge (Strictly NO frame/border around image)
        const col1CenterX = tableX + col1Width / 2;
        if (img) {
          const maxDim = Math.min(imgSize, rowH - 4, col1Width - 4);
          try {
            doc.addImage(
              img,
              'JPEG',
              col1CenterX - maxDim / 2,
              rowCenterY - maxDim / 2,
              maxDim,
              maxDim
            );
          } catch {
            // Ignore
          }
          if (showImageBorder) {
            doc.setDrawColor(120, 120, 120);
            doc.setLineWidth(0.18);
            doc.rect(col1CenterX - maxDim / 2, rowCenterY - maxDim / 2, maxDim, maxDim);
          }
        } else {
          // Double circle badge like (Vv) in uploaded sample if word has no image
          const badgeRadius = Math.min(rowH * 0.36, col1Width * 0.36);
          doc.setDrawColor(40, 40, 40);
          doc.setLineWidth(0.4);
          doc.circle(col1CenterX, rowCenterY, badgeRadius);
          doc.setLineWidth(0.18);
          doc.circle(col1CenterX, rowCenterY, badgeRadius - 0.75);

          doc.setFont('r0c0i Linotte', 'bold');
          doc.setFontSize(isA5 ? 13 : 15);
          doc.setTextColor(30, 30, 30);
          const initial = word.term.length > 0 ? (word.term[0].toUpperCase() + word.term[0].toLowerCase()) : '';
          doc.text(initial, col1CenterX, rowCenterY + (isA5 ? 1.4 : 1.7), { align: 'center' });
        }

        // Columns 2, 3, 4: Trace text with font KG Primary Dots with word-wrapping ("xuống hàng")
        doc.setFont('KGPrimaryDots', 'normal');
        doc.setFontSize(layout.fontSize);
        doc.setTextColor(30, 30, 30);

        const lineHeight = layout.fontSize * 0.352778 * 1.15;
        const totalBlockHeight = (layout.lines.length - 1) * lineHeight;
        const topBaseY = rowCenterY - totalBlockHeight / 2 + (layout.fontSize * 0.352778) * 0.32;

        for (let c = 0; c < 3; c++) {
          const cellLeft = tableX + col1Width + c * colTraceWidth;
          const cellCenterX = cellLeft + colTraceWidth / 2;

          layout.lines.forEach((lineText, lineIdx) => {
            doc.text(lineText, cellCenterX, topBaseY + lineIdx * lineHeight, { align: 'center' });
          });
        }

        // Draw grid lines ONLY if explicitly requested by user (default is false: NO FRAMES)
        if (showTableGrid) {
          doc.setDrawColor(140, 140, 140);
          doc.setLineWidth(0.18);
          setDocLineDash(doc, [0.5, 0.7]);
          doc.line(tableX, currentY, tableX + tableWidth, currentY);
          doc.line(tableX, currentY + rowH, tableX + tableWidth, currentY + rowH);
          const vCols = [
            tableX,
            tableX + col1Width,
            tableX + col1Width + colTraceWidth,
            tableX + col1Width + colTraceWidth * 2,
            tableX + tableWidth
          ];
          for (const vx of vCols) {
            doc.line(vx, currentY, vx, currentY + rowH);
          }
          setDocLineDash(doc, []);
        }

        currentY += rowH;
      }

      // Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 9) {
    // -------------------------------------------------------------
    // TYPE 9: Look and color Yes or No (3 columns, no frame, 2 circles)
    // -------------------------------------------------------------
    const cols = 3;
    const colGap = isA5 ? 2.5 : 4.0;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
    const topMargin = (showHeader && title) ? margin + 12 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const imgBoxHeight = isA5 ? 18.0 : 25.0;
    const sentenceBoxHeight = isA5 ? 13.5 : 18.0;
    const yesNoBoxHeight = isA5 ? 8.0 : 10.0;
    const cardHeight = imgBoxHeight + sentenceBoxHeight + yesNoBoxHeight;
    const rowGap = 2.0 + (spacing !== undefined ? spacing : 6) * 0.25;
    const rowHeight = cardHeight + rowGap;
    const maxImgDim = Math.min(cardWidth - 4, imgBoxHeight - 2);

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    const wordsWithImages = validWords
      .map((w, idx) => ({ word: w, img: wordImages[idx] }))
      .filter((item) => item.img !== null);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + 4);
        doc.setTextColor(0, 0, 0);
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const cardX = margin + col * (cardWidth + colGap);
        const cardY = topMargin + row * rowHeight;

        const currentWord = validWords[i];
        const targetImg = wordImages[i];

        // Find distractor image from other words
        const otherImages = wordsWithImages.filter(
          (item) => item.word.term.toLowerCase() !== currentWord.term.toLowerCase()
        );
        let distractorImg: string | null = null;
        if (otherImages.length > 0) {
          const distractorIdx = (i * 7 + 3) % otherImages.length;
          distractorImg = otherImages[distractorIdx].img;
        }

        // Yes / No pattern:
        // i=0: Yes, i=1: No, i=2: Yes, i=3: Yes, i=4: No, i=5: Yes...
        let isYes = (i % 3 !== 1);
        if (!distractorImg && !isYes) {
          isYes = true; // Fallback if no distractor image available
        }
        const displayedImg = isYes ? targetImg : distractorImg;

        // 1. Top Compartment: Centered Image (strictly NO card frame/borders)
        if (displayedImg) {
          const lx = cardX + (cardWidth - maxImgDim) / 2;
          const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
          try {
            doc.addImage(displayedImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          const lx = cardX + (cardWidth - maxImgDim) / 2;
          const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
          doc.rect(lx, ly, maxImgDim, maxImgDim);
        }

        // 2. Middle Compartment: Sentence with highlighted <#...#> in RED
        const spans = parseHighlightedSentence(currentWord.exampleSentence, currentWord.term);
        const sFontSize = fontSize ? (fontSize * 0.9) : (isA5 ? 10.5 : 12.5);
        drawHighlightedCenteredSentence(
          doc,
          spans,
          cardX,
          cardY + imgBoxHeight,
          cardWidth,
          sentenceBoxHeight,
          sFontSize
        );

        // 3. Bottom: 2 circles "Yes" and "No" centered under each sentence (strictly NO frame/dividers)
        const circleRadius = isA5 ? 3.8 : 4.8;
        const circleCenterY = cardY + imgBoxHeight + sentenceBoxHeight + yesNoBoxHeight / 2;
        const cardCenterX = cardX + cardWidth / 2;
        const circleSpacing = isA5 ? 15 : 20;
        const yesCenterX = cardCenterX - circleSpacing / 2;
        const noCenterX = cardCenterX + circleSpacing / 2;

        doc.setDrawColor(70, 70, 70);
        doc.setLineWidth(0.3);
        doc.circle(yesCenterX, circleCenterY, circleRadius, 'S');
        doc.circle(noCenterX, circleCenterY, circleRadius, 'S');

        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8.5 : 10.5);
        doc.setTextColor(30, 41, 59);
        doc.text('Yes', yesCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
        doc.text('No', noCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
        doc.setTextColor(0, 0, 0);
      }

      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 10) {
    // -------------------------------------------------------------
    // TYPE 10: Look and color (2 pictures side-by-side, word centered below)
    // Matches sample image media_1790130850317.png
    // Strictly NO bounding box / frame around cards or images!
    // -------------------------------------------------------------
    const cols = 3;
    const colGap = isA5 ? 3.0 : 4.5;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
    const topMargin = (showHeader && title) ? margin + 12 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const imgBoxHeight = isA5 ? 17.5 : 24;
    const wordBoxHeight = isA5 ? 7.5 : 9.5;
    const cardHeight = imgBoxHeight + wordBoxHeight;
    const rowGap = 2.5 + (spacing !== undefined ? spacing : 6) * 0.25;
    const rowHeight = cardHeight + rowGap;
    const subW = cardWidth / 2;
    const maxImgDim = Math.min(subW - 2, imgBoxHeight - 2);

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    const wordsWithImages = validWords
      .map((w, idx) => ({ word: w, img: wordImages[idx] }))
      .filter((item) => item.img !== null);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + 4);
        doc.setTextColor(0, 0, 0);
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const col = itemIdx % cols;
        const row = Math.floor(itemIdx / cols);

        const cardX = margin + col * (cardWidth + colGap);
        const cardY = topMargin + row * rowHeight;

        const currentWord = validWords[i];
        const targetImg = wordImages[i];

        // Find distractor image from other words
        const otherImages = wordsWithImages.filter(
          (item) => item.word.term.toLowerCase() !== currentWord.term.toLowerCase()
        );
        let distractorImg: string | null = null;
        if (otherImages.length > 0) {
          const distractorIdx = (i * 7 + 3) % otherImages.length;
          distractorImg = otherImages[distractorIdx].img;
        }

        const isCorrectOnLeft = (i + currentWord.term.length) % 2 === 0;
        const leftImg = isCorrectOnLeft ? targetImg : distractorImg;
        const rightImg = isCorrectOnLeft ? distractorImg : targetImg;

        // Strictly NO outer card box / frame (doc.rect is NOT called)

        // Left Image (Centered in left half)
        if (leftImg) {
          const lx = cardX + (subW - maxImgDim) / 2;
          const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
          try {
            doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          const lx = cardX + (subW - maxImgDim) / 2;
          const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
          doc.rect(lx, ly, maxImgDim, maxImgDim);
        }

        // Right Image (Centered in right half)
        if (rightImg) {
          const rx = cardX + subW + (subW - maxImgDim) / 2;
          const ry = cardY + (imgBoxHeight - maxImgDim) / 2;
          try {
            doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          const rx = cardX + subW + (subW - maxImgDim) / 2;
          const ry = cardY + (imgBoxHeight - maxImgDim) / 2;
          doc.rect(rx, ry, maxImgDim, maxImgDim);
        }

        // Word text (Centered under both images)
        doc.setFont('fff', 'normal');
        doc.setFontSize(fontSize || (isA5 ? 12 : 14));
        doc.setTextColor(0, 0, 0);
        const textY = cardY + imgBoxHeight + wordBoxHeight / 2 + (isA5 ? 1.2 : 1.5);
        doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
          align: 'center',
          maxWidth: cardWidth - 2
        });
      }

      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  }

  return doc;
}

export async function generateCompositeWorksheetPDF(config: CompositeWorksheetConfig): Promise<jsPDF> {
  const {
    title,
    paperSize = 'a5',
    fontFamily = 'r0c0i Linotte',
    fontSize: globalFontSize = 12,
    spacing: globalSpacing = 6,
    background = '',
    showHeader = true,
    showFooter = true,
    showImageBorder = false,
    showTableGrid = false,
    sourceUrl = 'https://yourhomework.net',
    sections = [],
    allWords = []
  } = config;

  if (!sections || sections.length === 0) {
    throw new Error('Danh sách phần bài tập trống. Vui lòng thêm ít nhất 1 phần bài tập.');
  }

  const totalWordsCount = sections.reduce(
    (acc, s) => acc + (s.words ? s.words.filter((w) => w && w.term && w.term.trim().length > 0).length : 0),
    0
  );
  if (totalWordsCount === 0) {
    throw new Error('Danh sách từ vựng trống. Vui lòng chọn ít nhất 1 từ cho các phần bài tập.');
  }

  const isA5 = paperSize !== 'a4';
  const pageWidth = isA5 ? 148 : 210;
  const pageHeight = isA5 ? 210 : 297;
  const margin = 12.7; // standard 0.5 in margin
  const printableWidth = pageWidth - margin * 2;
  const printableHeight = pageHeight - margin * 2;
  const imgSize = 12.7; // 0.5 in (12.7 mm)
  const footerHeight = showFooter ? 10 : 4;
  const maxContentY = pageHeight - margin - footerHeight;

  // Pre-load all required images across all sections and master words pool in parallel
  const imageUrlsToPreload = new Set<string>();
  for (const s of sections) {
    for (const w of s.words || []) {
      if (w && w.imageUrl) imageUrlsToPreload.add(w.imageUrl);
    }
  }
  for (const w of allWords) {
    if (w && w.imageUrl) imageUrlsToPreload.add(w.imageUrl);
  }
  await Promise.all(Array.from(imageUrlsToPreload).map((url) => fetchImageAsBase64(url)));

  const doc = new jsPDF({
    unit: 'mm',
    orientation: 'portrait',
    format: isA5 ? 'a5' : 'a4'
  });

  registerFonts(doc, fontFamily);

  doc.setProperties({
    title: title || 'English Vocabulary Worksheet',
    subject: 'Learn English Vocabulary',
    author: 'Game-Vocab YourHomework Worksheet',
    keywords: 'vocabulary, worksheet, composite, english, learn',
    creator: 'Game-Vocab'
  });

  // Master vocabulary terms for distractor generation
  const masterWordPool = allWords.length > 0 ? allWords : sections.flatMap((s) => s.words || []);
  const masterTerms = Array.from(
    new Set(masterWordPool.map((w) => w.term.trim()).filter((t) => t.length > 0))
  );
  const fallbackTerms = [
    'Apple', 'Banana', 'Cat', 'Dog', 'Elephant', 'Flower', 'Guitar', 'House',
    'Ice cream', 'Juice', 'Kite', 'Lion', 'Monkey', 'Nest', 'Orange', 'Pencil',
    'Queen', 'Rabbit', 'Sun', 'Tree', 'Umbrella', 'Violin', 'Water', 'Xylophone', 'Yo-yo', 'Zebra'
  ];

  // Initialize Page 1
  await insertBackground(doc, background, isA5);

  let currentY = margin + 4;
  let isAtTopOfPage = true;

  if (showHeader && title && title.trim().length > 0) {
    doc.setFont('fff', 'bold');
    doc.setFontSize(isA5 ? 16 : 22);
    doc.setTextColor(30, 41, 59);
    doc.text(title.trim(), pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
    doc.setTextColor(0, 0, 0);
    currentY = margin + 14;
  }

  const addNewPage = async () => {
    doc.addPage();
    await insertBackground(doc, background, isA5);
    currentY = margin + 4;
    isAtTopOfPage = true;
  };

  // Render each section sequentially
  for (let secIdx = 0; secIdx < sections.length; secIdx++) {
    const section = sections[secIdx];
    const secWords = (section.words || []).filter((w) => w && w.term && w.term.trim().length > 0);
    if (secWords.length === 0) continue;

    const secSpacing = section.spacing !== undefined ? section.spacing : globalSpacing;
    const secFontSize = section.fontSize || globalFontSize;
    const hasInstruction = Boolean(section.instruction && section.instruction.trim().length > 0);
    const headerH = hasInstruction ? 12 : 7;

    // Line and gap geometry
    const lineOffset = 3.5 + secSpacing * 0.1;
    const textOffset = 3.5 + secSpacing * 0.1;
    const textOffset1 = 3.5 + secSpacing * 0.1;
    const textOffset2 = 3.5 + secSpacing * 0.1;
    const linePitch = 3.2 + secSpacing * 0.12;

    let minUnitH = 20;
    let rowHeight = 22;

    if (section.type === 2) {
      const rowGap = 0.8 + secSpacing * 0.45;
      rowHeight = imgSize + lineOffset + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 4) {
      const rowGap = 0.8 + secSpacing * 0.45;
      rowHeight = imgSize + textOffset + 1.2 + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 6) {
      const contentHeight = Math.max(imgSize, 2 * linePitch + 3.0);
      const rowGap = 0.8 + secSpacing * 0.4;
      rowHeight = contentHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 7) {
      const contentHeight = imgSize + textOffset1 + textOffset2 + 1.2;
      const rowGap = 0.8 + secSpacing * 0.45;
      rowHeight = contentHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 8) {
      const traceFontSize = secFontSize || (isA5 ? 22 : 26);
      const baseRowHeight = Math.max(isA5 ? 23 : 27, traceFontSize * 0.85 + 7);
      const rowGap = secSpacing * 0.25;
      rowHeight = baseRowHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 9) {
      const imgBoxHeight = isA5 ? 18.0 : 25.0;
      const sentenceBoxHeight = isA5 ? 13.5 : 18.0;
      const yesNoBoxHeight = isA5 ? 6.5 : 8.5;
      const cardHeight = imgBoxHeight + sentenceBoxHeight + yesNoBoxHeight;
      const rowGap = 2.0 + secSpacing * 0.25;
      rowHeight = cardHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 10) {
      const imgBoxHeight = isA5 ? 17.5 : 24;
      const wordBoxHeight = isA5 ? 7.5 : 9.5;
      const cardHeight = imgBoxHeight + wordBoxHeight;
      const rowGap = 2.5 + secSpacing * 0.25;
      rowHeight = cardHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 3) {
      const boxWidth = isA5 ? 46 : 50;
      const boxHeight = isA5 ? 7.5 : 9.5;
      const boxGap = 0.8 + secSpacing * 0.352778;
      const maxCount = Math.max(4, Math.floor((maxContentY - margin - 14) / (boxHeight + boxGap)));
      const count = Math.min(secWords.length, maxCount);
      const half = Math.ceil(count / 2);
      const totalMiddleHeight = count * boxHeight + (count - 1) * boxGap;
      minUnitH = Math.max(half * (imgSize + 3), totalMiddleHeight) + 4;
    }

    // Page break evaluation before section starts
    const shouldBreakBefore =
      (secIdx > 0 && section.pageBreakBefore && !isAtTopOfPage) ||
      (currentY + headerH + minUnitH > maxContentY && !isAtTopOfPage);

    if (shouldBreakBefore) {
      await addNewPage();
    }

    // Render Section Header
    if (section.title && section.title.trim().length > 0) {
      doc.setFont('fff', 'bold');
      doc.setFontSize(isA5 ? 11.5 : 13.5);
      doc.setTextColor(15, 23, 42);
      doc.text(section.title.trim(), margin, currentY + 3.5);

      if (hasInstruction) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8.5 : 10);
        doc.setTextColor(80, 80, 80);
        doc.text(section.instruction!.trim(), margin, currentY + 8, { maxWidth: printableWidth });
        currentY += 12;
      } else {
        currentY += 7;
      }
      doc.setTextColor(0, 0, 0);
      isAtTopOfPage = false;
    }

    // Render items according to section.type
    if (section.type === 2) {
      // -------------------------------------------------------------
      // TYPE 2: Write words under pictures (3 columns)
      // -------------------------------------------------------------
      const cols = 3;
      const colWidth = printableWidth / cols;
      const halfLineLen = isA5 ? 16 : 20;
      const totalRows = Math.ceil(secWords.length / cols);

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const word = secWords[idx];
          const colCenter = margin + c * colWidth + colWidth / 2;
          const imgX = colCenter - imgSize / 2;
          const imgY = currentY;

          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (img) {
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, imgSize, imgSize);
          }

          // Dotted baseline
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.15);
          setDocLineDash(doc, [0.4, 0.6]);
          const lineY = imgY + imgSize + lineOffset;
          doc.line(colCenter - halfLineLen, lineY, colCenter + halfLineLen, lineY);
          setDocLineDash(doc, []);
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 4) {
      // -------------------------------------------------------------
      // TYPE 4: Missing letters (3 columns)
      // -------------------------------------------------------------
      const cols = 3;
      const colWidth = printableWidth / cols;
      const totalRows = Math.ceil(secWords.length / cols);

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const word = secWords[idx];
          const colCenter = margin + c * colWidth + colWidth / 2;
          const imgX = colCenter - imgSize / 2;
          const imgY = currentY;

          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (img) {
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, imgSize, imgSize);
          }

          doc.setFontSize(secFontSize);
          doc.setFont('fff', 'normal');
          doc.setTextColor(0, 0, 0);
          const missingTerm = punchBlanks(word.term, section.blankMode || 'vowels');
          const textY = imgY + imgSize + textOffset;
          doc.text(missingTerm, colCenter, textY, { align: 'center' });
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 6) {
      // -------------------------------------------------------------
      // TYPE 6: Multiple choice (2 columns)
      // -------------------------------------------------------------
      const cols = 2;
      const colWidth = printableWidth / cols;
      const totalRows = Math.ceil(secWords.length / cols);
      const secTerms = secWords.map((w) => w.term.trim());

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const word = secWords[idx];
          const currentWord = word.term.trim();
          const startX = margin + c * colWidth;
          const imgX = startX + 1.5;
          const imgY = currentY + 1;

          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (img) {
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, imgSize, imgSize);
          }

          // Distractor generation: section words -> master words -> fallbacks
          const otherSecTerms = secTerms.filter((t) => t.toLowerCase() !== currentWord.toLowerCase());
          let distractors = shuffleArray(otherSecTerms).slice(0, 2);

          if (distractors.length < 2) {
            const extra = masterTerms.filter(
              (t) => t.toLowerCase() !== currentWord.toLowerCase() && !distractors.some((d) => d.toLowerCase() === t.toLowerCase())
            );
            distractors = [...distractors, ...shuffleArray(extra)].slice(0, 2);
          }

          if (distractors.length < 2) {
            const extraFallbacks = fallbackTerms.filter(
              (t) => t.toLowerCase() !== currentWord.toLowerCase() && !distractors.some((d) => d.toLowerCase() === t.toLowerCase())
            );
            distractors = [...distractors, ...shuffleArray(extraFallbacks)].slice(0, 2);
          }

          const optionsList = shuffleArray([currentWord, ...distractors]);
          const optStartX = imgX + imgSize + 4;

          doc.setFontSize(isA5 ? 10 : 12);
          doc.setFont('fff', 'normal');
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.2);

          for (let opt = 0; opt < 3; opt++) {
            const optY = imgY + 1.5 + opt * linePitch;
            doc.circle(optStartX + 1.5, optY, 1.2, 'S');
            doc.text(optionsList[opt] || '', optStartX + 4.2, optY + 0.9);
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 7) {
      // -------------------------------------------------------------
      // TYPE 7: Unscramble letters (3 columns)
      // -------------------------------------------------------------
      const cols = 3;
      const colWidth = printableWidth / cols;
      const totalRows = Math.ceil(secWords.length / cols);

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const word = secWords[idx];
          const colCenter = margin + c * colWidth + colWidth / 2;
          const imgX = colCenter - imgSize / 2;
          const imgY = currentY;

          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (img) {
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, imgSize, imgSize);
          }

          const scrambled = scrambleString(word.term);
          const blanks = word.term
            .split(' ')
            .map((part) => '__ '.repeat(part.length).trim())
            .join('   ');

          const textY1 = imgY + imgSize + textOffset1;
          const textY2 = textY1 + textOffset2;

          doc.setFontSize(secFontSize);
          doc.setFont('fff', 'normal');
          doc.setTextColor(0, 0, 0);
          doc.text(scrambled, colCenter, textY1, { align: 'center' });
          doc.text(blanks, colCenter, textY2, { align: 'center' });
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 3) {
      // -------------------------------------------------------------
      // TYPE 3: Match picture to word (left & right pictures, center words)
      // -------------------------------------------------------------
      const boxWidth = isA5 ? 46 : 50;
      const boxHeight = isA5 ? 7.5 : 9.5;
      const boxGap = 0.8 + secSpacing * 0.352778;
      const maxChunkSize = Math.max(4, Math.floor((maxContentY - margin - 14) / (boxHeight + boxGap)));

      const chunks: WorksheetWord[][] = [];
      for (let i = 0; i < secWords.length; i += maxChunkSize) {
        chunks.push(secWords.slice(i, i + maxChunkSize));
      }

      for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
        const chunk = chunks[chunkIdx];
        const count = chunk.length;
        const half = Math.ceil(count / 2);
        const totalMiddleHeight = count * boxHeight + (count - 1) * boxGap;
        const chunkHeight = Math.max(half * (imgSize + 3), totalMiddleHeight) + 4;

        if (currentY + chunkHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        const imgPitch = half > 1 ? Math.max(imgSize + 1, (totalMiddleHeight - imgSize) / (half - 1)) : 0;

        doc.setFontSize(secFontSize);
        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.2);

        for (let i = 0; i < count; i++) {
          const isRight = i >= half;
          const rowInCol = isRight ? i - half : i;
          const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
          const posY = currentY + (half > 1 ? rowInCol * imgPitch : 0);

          const word = chunk[i];
          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (img) {
            try {
              doc.addImage(img, 'JPEG', posX, posY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(posX, posY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(posX, posY, imgSize, imgSize);
          }
          if (showImageBorder) {
            doc.rect(posX - 1.5, posY - 1.5, imgSize + 3, imgSize + 3);
          }

          // Center word rounded box
          const centerBoxY = currentY + i * (boxHeight + boxGap);
          doc.roundedRect((pageWidth - boxWidth) / 2, centerBoxY, boxWidth, boxHeight, 2, 2);
        }

        // Shuffled words inside center boxes
        const shuffledWords = shuffleArray(chunk.map((w) => w.term));
        doc.setFont('fff', 'normal');
        for (let i = 0; i < count; i++) {
          const centerBoxY = currentY + i * (boxHeight + boxGap);
          doc.text(shuffledWords[i], pageWidth / 2, centerBoxY + boxHeight / 2 + 1.2, { align: 'center' });
        }

        currentY += chunkHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 8) {
      // -------------------------------------------------------------
      // TYPE 8: Look and trace (4 columns: Image + 3 tracing words with KG Primary Dots)
      // Strictly NO bounding box/frame around images!
      // Automatic word-wrapping ("xuống hàng") for multi-word terms (e.g. computer room)
      // NO table grid borders by default ("bỏ khung đi")
      // -------------------------------------------------------------
      const tableX = margin;
      const tableWidth = printableWidth;
      const col1Width = isA5 ? 24 : 32;
      const colTraceWidth = (tableWidth - col1Width) / 3;

      const traceFontSize = secFontSize || (isA5 ? 22 : 26);
      const rowGap = secSpacing * 0.25;

      for (let i = 0; i < secWords.length; i++) {
        const word = secWords[i];
        const layout = layoutTraceText(doc, word.term, traceFontSize, colTraceWidth - 3);
        const neededHeight = Math.max(
          isA5 ? 23 : 27,
          layout.lines.length * (layout.fontSize * 0.352778 * 1.15) + 6,
          imgSize + 4
        );
        const rowHeight = neededHeight + rowGap;

        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
        const rowY = currentY;
        const rowCenterY = rowY + rowHeight / 2;

        // Column 1: Image or Letter Circle Badge (Strictly NO frame/border around image)
        const col1CenterX = tableX + col1Width / 2;
        if (img) {
          const maxDim = Math.min(imgSize, rowHeight - 4, col1Width - 4);
          try {
            doc.addImage(img, 'JPEG', col1CenterX - maxDim / 2, rowCenterY - maxDim / 2, maxDim, maxDim);
          } catch {
            // Ignore
          }
          if (showImageBorder) {
            doc.setDrawColor(120, 120, 120);
            doc.setLineWidth(0.18);
            doc.rect(col1CenterX - maxDim / 2, rowCenterY - maxDim / 2, maxDim, maxDim);
          }
        } else {
          const badgeRadius = Math.min(rowHeight * 0.36, col1Width * 0.36);
          doc.setDrawColor(40, 40, 40);
          doc.setLineWidth(0.4);
          doc.circle(col1CenterX, rowCenterY, badgeRadius);
          doc.setLineWidth(0.18);
          doc.circle(col1CenterX, rowCenterY, badgeRadius - 0.75);

          doc.setFont('r0c0i Linotte', 'bold');
          doc.setFontSize(isA5 ? 13 : 15);
          doc.setTextColor(30, 30, 30);
          const initial = word.term.length > 0 ? (word.term[0].toUpperCase() + word.term[0].toLowerCase()) : '';
          doc.text(initial, col1CenterX, rowCenterY + (isA5 ? 1.4 : 1.7), { align: 'center' });
        }

        // Columns 2, 3, 4: Trace text with font KG Primary Dots with word-wrapping ("xuống hàng")
        doc.setFont('KGPrimaryDots', 'normal');
        doc.setFontSize(layout.fontSize);
        doc.setTextColor(30, 30, 30);

        const lineHeight = layout.fontSize * 0.352778 * 1.15;
        const totalBlockHeight = (layout.lines.length - 1) * lineHeight;
        const topBaseY = rowCenterY - totalBlockHeight / 2 + (layout.fontSize * 0.352778) * 0.32;

        for (let c = 0; c < 3; c++) {
          const cellLeft = tableX + col1Width + c * colTraceWidth;
          const cellCenterX = cellLeft + colTraceWidth / 2;

          layout.lines.forEach((lineText, lineIdx) => {
            doc.text(lineText, cellCenterX, topBaseY + lineIdx * lineHeight, { align: 'center' });
          });
        }

        // Draw row borders (dashed/dotted lines) ONLY if explicitly requested by user (default: NO FRAMES)
        if (showTableGrid) {
          doc.setDrawColor(140, 140, 140);
          doc.setLineWidth(0.18);
          setDocLineDash(doc, [0.5, 0.7]);
          doc.line(tableX, rowY, tableX + tableWidth, rowY);
          doc.line(tableX, rowY + rowHeight, tableX + tableWidth, rowY + rowHeight);
          const vCols = [
            tableX,
            tableX + col1Width,
            tableX + col1Width + colTraceWidth,
            tableX + col1Width + colTraceWidth * 2,
            tableX + tableWidth
          ];
          for (const vx of vCols) {
            doc.line(vx, rowY, vx, rowY + rowHeight);
          }
          setDocLineDash(doc, []);
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 9) {
      // -------------------------------------------------------------
      // TYPE 9: Look and color Yes or No (3 columns, no frame, 2 circles)
      // -------------------------------------------------------------
      const cols = 3;
      const colGap = isA5 ? 2.5 : 4.0;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
      const imgBoxHeight = isA5 ? 18.0 : 25.0;
      const sentenceBoxHeight = isA5 ? 13.5 : 18.0;
      const yesNoBoxHeight = isA5 ? 8.0 : 10.0;
      const cardHeight = imgBoxHeight + sentenceBoxHeight + yesNoBoxHeight;
      const rowGap = 2.0 + (secSpacing !== undefined ? secSpacing : 6) * 0.25;
      const rowHeight = cardHeight + rowGap;
      const maxImgDim = Math.min(cardWidth - 4, imgBoxHeight - 2);
      const totalRows = Math.ceil(secWords.length / cols);

      const poolWithImages = masterWordPool.filter((w) => w.imageUrl && w.imageUrl.trim().length > 0);

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const currentWord = secWords[idx];
          const cardX = margin + c * (cardWidth + colGap);
          const cardY = currentY;

          const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;

          const otherPool = poolWithImages.filter(
            (w) => w.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
          );
          let distractorImg: string | null = null;
          if (otherPool.length > 0) {
            const distractorIdx = (idx * 7 + 3) % otherPool.length;
            distractorImg = await fetchImageAsBase64(otherPool[distractorIdx].imageUrl!);
          }

          // Deterministic Yes/No pattern
          let isYes = (idx % 3 !== 1);
          if (!distractorImg && !isYes) {
            isYes = true;
          }
          const displayedImg = isYes ? targetImg : distractorImg;

          // 1. Top Compartment: Centered Image (strictly NO card frame/borders)
          if (displayedImg) {
            const lx = cardX + (cardWidth - maxImgDim) / 2;
            const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
            try {
              doc.addImage(displayedImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            const lx = cardX + (cardWidth - maxImgDim) / 2;
            const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          // 2. Middle Compartment: Sentence with highlighted <#...#> in RED
          const spans = parseHighlightedSentence(currentWord.exampleSentence, currentWord.term);
          const sFontSize = secFontSize ? (secFontSize * 0.9) : (isA5 ? 10.5 : 12.5);
          drawHighlightedCenteredSentence(
            doc,
            spans,
            cardX,
            cardY + imgBoxHeight,
            cardWidth,
            sentenceBoxHeight,
            sFontSize
          );

          // 3. Bottom: 2 circles "Yes" and "No" centered under each sentence (strictly NO frame/dividers)
          const circleRadius = isA5 ? 3.8 : 4.8;
          const circleCenterY = cardY + imgBoxHeight + sentenceBoxHeight + yesNoBoxHeight / 2;
          const cardCenterX = cardX + cardWidth / 2;
          const circleSpacing = isA5 ? 15 : 20;
          const yesCenterX = cardCenterX - circleSpacing / 2;
          const noCenterX = cardCenterX + circleSpacing / 2;

          doc.setDrawColor(70, 70, 70);
          doc.setLineWidth(0.3);
          doc.circle(yesCenterX, circleCenterY, circleRadius, 'S');
          doc.circle(noCenterX, circleCenterY, circleRadius, 'S');

          doc.setFont('fff', 'normal');
          doc.setFontSize(isA5 ? 8.5 : 10.5);
          doc.setTextColor(30, 41, 59);
          doc.text('Yes', yesCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
          doc.text('No', noCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
          doc.setTextColor(0, 0, 0);
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 10) {
      // -------------------------------------------------------------
      // TYPE 10: Look and color (2 pictures side-by-side, word centered below)
      // Strictly NO bounding box / frame around cards or images!
      // -------------------------------------------------------------
      const cols = 3;
      const colGap = isA5 ? 3.0 : 4.5;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
      const imgBoxHeight = isA5 ? 17.5 : 24;
      const wordBoxHeight = isA5 ? 7.5 : 9.5;
      const cardHeight = imgBoxHeight + wordBoxHeight;
      const subW = cardWidth / 2;
      const maxImgDim = Math.min(subW - 2, imgBoxHeight - 2);
      const totalRows = Math.ceil(secWords.length / cols);

      const poolWithImages = masterWordPool.filter((w) => w.imageUrl && w.imageUrl.trim().length > 0);

      for (let r = 0; r < totalRows; r++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx >= secWords.length) break;

          const currentWord = secWords[idx];
          const cardX = margin + c * (cardWidth + colGap);
          const cardY = currentY;

          const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;

          const otherPool = poolWithImages.filter(
            (w) => w.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
          );
          let distractorImg: string | null = null;
          if (otherPool.length > 0) {
            const distractorIdx = (idx * 7 + 3) % otherPool.length;
            distractorImg = await fetchImageAsBase64(otherPool[distractorIdx].imageUrl!);
          }

          const isCorrectOnLeft = (idx + currentWord.term.length) % 2 === 0;
          const leftImg = isCorrectOnLeft ? targetImg : distractorImg;
          const rightImg = isCorrectOnLeft ? distractorImg : targetImg;

          // Strictly NO outer card box / frame

          if (leftImg) {
            const lx = cardX + (subW - maxImgDim) / 2;
            const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
            try {
              doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            const lx = cardX + (subW - maxImgDim) / 2;
            const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          if (rightImg) {
            const rx = cardX + subW + (subW - maxImgDim) / 2;
            const ry = cardY + (imgBoxHeight - maxImgDim) / 2;
            try {
              doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            const rx = cardX + subW + (subW - maxImgDim) / 2;
            const ry = cardY + (imgBoxHeight - maxImgDim) / 2;
            doc.rect(rx, ry, maxImgDim, maxImgDim);
          }

          doc.setFontSize(secFontSize || (isA5 ? 12 : 14));
          doc.setFont('fff', 'normal');
          doc.setTextColor(0, 0, 0);
          const textY = cardY + imgBoxHeight + wordBoxHeight / 2 + (isA5 ? 1.2 : 1.5);
          doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
            align: 'center',
            maxWidth: cardWidth - 2
          });
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    }

    // Inter-section vertical separation (6 mm)
    currentY += 6;
  }

  // ---------------------------------------------------------------
  // Two-pass post-processing: Draw uniform footer & global page numbers
  // ---------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (showFooter) {
      doc.setFont('fff', 'normal');
      doc.setFontSize(isA5 ? 8 : 10);
      doc.setTextColor(120, 120, 120);

      if (sourceUrl) {
        doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
      }

      const pageNumText = `Trang ${p} / ${totalPages}`;
      doc.text(pageNumText, pageWidth - margin, pageHeight - margin + 3, { align: 'right' });

      doc.setTextColor(0, 0, 0);
    }
  }

  return doc;
}

