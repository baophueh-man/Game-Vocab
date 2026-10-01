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
  sourceDeckId?: string;
  sourceDeckTitle?: string;
  deckRole?: 'primary' | 'review';
}

export type WorksheetType = 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18;
export type BlankMode = 'vowels' | 'random1' | 'random2' | 'random3';
export type Type4LayoutMode = 'grid' | 'table';
export type Type4ColumnMode = 'both_trace_first' | 'both_blank_first' | 'initial_only' | 'final_only' | 'alphabet_order' | 'vowels_only';
export type Type4CellConfig = 
  | { mode: 'initial_trace' }
  | { mode: 'initial_blank' }
  | { mode: 'final_trace' }
  | { mode: 'final_blank' }
  | { mode: 'custom', traceIndices: Set<number>, blankIndices: Set<number> };
export type ChoiceLayout = 'vertical' | 'horizontal';

export type WordsearchDirection = 'horizontal' | 'vertical' | 'diagonalDown' | 'diagonalUp';
export type WordsearchHintType = 'word' | 'image' | 'both';
export type WordsearchGridBorder = 'none' | 'outerOnly' | 'full';
export type WordsearchCase = 'lower' | 'upper';
export type MatchHintMode = 'none' | 'match' | 'side' | 'multi';
export type Type15NumberStyle = 'none' | 'traditional';
export type Type15Border = 'full' | 'outerOnly' | 'none';
export type Type15ChoiceMode = 'ab' | 'checkbox' | 'none';

export type Type16SoundMode = 'beginning' | 'ending';
export type Type16ChoiceCount = 2 | 3 | 4;
export type Type16Layout = 'lettersLeft' | 'lettersRight' | 'lettersBottom';
export type Type16LetterCase = 'lower' | 'upper' | 'both';
export type Type16Border = 'none' | 'outerOnly' | 'full';

export type Type17TaskMode = 'color' | 'cross';
export type Type17Border = 'full' | 'outerOnly' | 'none';
export type Type17CardBorder = 'none' | 'rounded';
export type Type17LetterCase = 'lower' | 'upper';
export type Type17StripLength = 'auto' | 6 | 8 | 10;
export type Type17HighlightTarget = 'none' | 'red';

export type Type18Mode = 'both' | 'upper_only' | 'lower_only' | 'single_color';
export type Type18Border = 'rounded' | 'rect' | 'none';
export type Type18CircleStyle = 'solid' | 'dashed' | 'double';
export type Type18DistractorCasing = 'mixed' | 'upper' | 'lower';
export type Type18HighlightTarget = 'none' | 'answer_key';

export interface Type18Cell {
  char: string;
  isTargetUpper: boolean;
  isTargetLower: boolean;
  row: number;
  col: number;
}

export interface PlacedWordInfo {
  word: WorksheetWord;
  cleanTerm: string;
  startR: number;
  startC: number;
  endR: number;
  endC: number;
  direction: WordsearchDirection;
}

export interface WordsearchPuzzleResult {
  grid: string[][];
  rows: number;
  cols: number;
  placedWords: PlacedWordInfo[];
  unplacedWords: WorksheetWord[];
}

export const BLANK_MODE_OPTIONS = [
  { id: 'vowels', name: 'Đục lỗ nguyên âm (a, e, i, o, u)' },
  { id: 'random1', name: 'Ngẫu nhiên 1 lỗ' },
  { id: 'random2', name: 'Ngẫu nhiên 2 lỗ' },
  { id: 'random3', name: 'Ngẫu nhiên 3 lỗ' }
];

export const TYPE4_LAYOUT_OPTIONS = [
  { id: 'grid', name: 'Lưới 12 tranh (Grid 3x4 - Mặc định)' },
  { id: 'table', name: 'Bảng hàng ngang: Luyện viết có gợi ý tô chữ (Look and write)' }
];

export const TYPE4_COLUMN_OPTIONS = [
  { id: 'both_trace_first', name: 'Cả âm đầu & cuối: Tô trước -> Điền sau (Mẫu 1)' },
  { id: 'both_blank_first', name: 'Cả âm đầu & cuối: Điền trước -> Tô sau (Mẫu 2 & 3)' },
  { id: 'initial_only', name: 'Chỉ luyện âm đầu (Beginning sounds - 2 cột)' },
  { id: 'final_only', name: 'Chỉ luyện âm cuối (Ending sounds - 2 cột)' },
  { id: 'alphabet_order', name: 'Luyện tới chữ cái được chọn theo bảng chữ cái (2 cột)' },
  { id: 'vowels_only', name: 'Chỉ luyện nguyên âm (Vowels: a, e, i, o, u - 2 cột)' }
];

export const IMAGE_SIZE_OPTIONS = [
  { value: 10, label: '0.4 x 0.4 inch (10 x 10 mm - Nhỏ)' },
  { value: 12.7, label: '0.5 x 0.5 inch (12.7 x 12.7 mm - Mặc định)' },
  { value: 15, label: '0.6 x 0.6 inch (15 x 15 mm)' },
  { value: 19.05, label: '0.75 x 0.75 inch (19 x 19 mm)' },
  { value: 20, label: '0.8 x 0.8 inch (20 x 20 mm)' },
  { value: 25.4, label: '1.0 x 1.0 inch (25.4 x 25.4 mm)' },
  { value: 30, label: '1.2 x 1.2 inch (30 x 30 mm)' }
];

export const SPACING_OPTIONS = [
  { value: 0, label: '0 pt (Sát nhau - Siêu gọn - Mặc định)' },
  { value: 2, label: '2 pt (Rất hẹp)' },
  { value: 4, label: '4 pt (Hẹp)' },
  { value: 6, label: '6 pt (Chuẩn Word)' },
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
  spacing?: number; // Spacing in pt between parts like Microsoft Word (default: 0 pt)
  background?: string; // 'bg4' ... 'bg12' or ''
  words?: WorksheetWord[];
  sourceUrl?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  showImageBorder?: boolean;
  showTableGrid?: boolean; // default: false (no table borders/grid)
  imageSize?: number; // in mm, default: 12.7 (0.5 in)
  choiceCount?: 2 | 3; // 2 or 3 choices (MTQ) for Type 6 (default: 3)
  choiceLayout?: ChoiceLayout; // for Type 6: 'vertical' (default) or 'horizontal' (2 horizontal choices)
  matchMode?: 'word' | 'sentence' | 'look_match_write'; // for Type 3: 'word' (default), 'sentence', or 'look_match_write'
  matchHint?: MatchHintMode; // for Type 3: 'none' (default), 'match', 'side', 'multi'
  lookMatchWriteShuffleSuffix?: boolean; // for Type 3 look_match_write: default false (suffix aligned with prefix)
  lookMatchWriteMode?: 'trace' | 'blank'; // for Type 3 look_match_write: 'trace' (default) or 'blank' ('__')
  lookMatchWriteShowBaseline?: boolean; // for Type 3 look_match_write: default true (dashed line underneath write column)
  lookMatchWriteTraceFontSize?: number; // for Type 3 look_match_write: trace font size in pt (default: 28)
  wordsearchDirections?: WordsearchDirection[]; // for Type 13 (default: ['horizontal', 'vertical', 'diagonalDown'])
  wordsearchHintType?: WordsearchHintType; // for Type 13 (default: 'word')
  wordsearchGridSize?: number | 'auto'; // for Type 13 (default: 'auto')
  wordsearchGridBorder?: WordsearchGridBorder; // for Type 13 (default: 'none')
  wordsearchCase?: WordsearchCase; // for Type 13 (default: 'lower')
  targetLetter?: string; // for Type 14 (default: 'V v')
  showWordLabels?: boolean; // for Type 14 (default: true)
  sentenceScramble?: boolean; // for Type 1: scramble words (default: true)
  sentenceSeparator?: 'space' | 'slash'; // for Type 1: separator ('space' | 'slash', default: 'space')
  sentenceHintStyle?: 'underscores' | 'dots' | 'trace'; // for Type 1: hint style ('underscores' | 'dots' | 'trace', default: 'underscores')
  sentenceTraceFontSize?: number; // for Type 1: trace font size in pt for Grade 1 (default: 28 for A4, 26 for A5)
  type4LayoutMode?: Type4LayoutMode; // for Type 4: 'grid' (default) or 'table' (Look and write)
  type4ColumnMode?: Type4ColumnMode; // for Type 4 table mode (default: 'both_trace_first')
  type4TraceFontSize?: number; // for Type 4 table mode: trace font size in pt (default: 28)
  type4AlphabetTargetLetter?: string; // for Type 4 table mode alphabet order (default: 'c')
  type15NumberStyle?: Type15NumberStyle; // for Type 15: 'none' (default) or 'traditional' (Có: traditional black number)
  type15Border?: Type15Border; // for Type 15: 'full' (default), 'outerOnly', 'none'
  type15ChoiceMode?: Type15ChoiceMode; // for Type 15: 'ab' (default), 'checkbox', 'none'
  type15LetterBandBg?: 'tint' | 'white'; // for Type 15: 'tint' (default) or 'white' (when choiceMode is 'ab')
  type16SoundMode?: Type16SoundMode; // for Type 16: 'beginning' (default) or 'ending'
  type16ChoiceCount?: Type16ChoiceCount; // for Type 16: 2, 3 (default), 4
  type16Layout?: Type16Layout; // for Type 16: 'lettersLeft' (default), 'lettersRight', 'lettersBottom'
  type16LetterCase?: Type16LetterCase; // for Type 16: 'lower' (default), 'upper', 'both'
  type16Border?: Type16Border; // for Type 16: 'none' (default), 'outerOnly', 'full'
  type17TaskMode?: Type17TaskMode; // for Type 17: 'color' (default: Look and color the words) | 'cross' (Cross out extra letters)
  type17Border?: Type17Border; // for Type 17: 'full' (default: dividers between letters) | 'outerOnly' | 'none'
  type17CardBorder?: Type17CardBorder; // for Type 17: 'none' (default) | 'rounded'
  type17LetterCase?: Type17LetterCase; // for Type 17: 'lower' (default) | 'upper'
  type17StripLength?: Type17StripLength; // for Type 17: 'auto' (default) | 6 | 8 | 10
  type17HighlightTarget?: Type17HighlightTarget; // for Type 17: 'none' (default: black for student) | 'red' (answer key)
  type17ShowExample?: boolean; // for Type 17: default true (first item has example slash/highlight)
  type18TargetLetter?: string; // for Type 18: target letter, default 'E'
  type18Mode?: Type18Mode; // for Type 18: 'both' (default) | 'upper_only' | 'lower_only' | 'single_color'
  type18ColorUpper?: string; // for Type 18: color for uppercase target, default 'green'
  type18ColorLower?: string; // for Type 18: color for lowercase target, default 'red'
  type18GridRows?: number; // for Type 18: rows in grid, default 4 (3-6)
  type18GridCols?: number; // for Type 18: cols in grid, default 7 (5-8)
  type18Border?: Type18Border; // for Type 18: outer border, 'rounded' (default) | 'rect' | 'none'
  type18CircleStyle?: Type18CircleStyle; // for Type 18: circle border style, 'solid' (default) | 'dashed' | 'double'
  type18DistractorCasing?: Type18DistractorCasing; // for Type 18: 'upper' (default) | 'lower' | 'mixed'
  type18HighlightTarget?: Type18HighlightTarget; // for Type 18: 'none' (default for student) | 'answer_key'
  answerMode?: 'student' | 'answer'; // for Types 1, 2, 3, 4, 5, 6, 7, 8, 9, 10: 'student' (default) or 'answer'
}

export interface CompositeWorksheetSection {
  id: string;
  type: WorksheetType; // 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18
  title: string;
  instruction?: string;
  words: WorksheetWord[];
  blankMode?: BlankMode;
  pageBreakBefore?: boolean;
  spacing?: number;
  imageSize?: number;
  fontSize?: number;
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  choiceCount?: 2 | 3; // 2 or 3 choices (MTQ) for Type 6 (default: 3)
  choiceLayout?: ChoiceLayout; // for Type 6: 'vertical' (default) or 'horizontal'
  matchMode?: 'word' | 'sentence' | 'look_match_write'; // for Type 3: 'word' (default), 'sentence', or 'look_match_write'
  matchHint?: MatchHintMode; // for Type 3: 'none' (default), 'match', 'side', 'multi'
  lookMatchWriteShuffleSuffix?: boolean;
  lookMatchWriteMode?: 'trace' | 'blank';
  lookMatchWriteShowBaseline?: boolean;
  lookMatchWriteTraceFontSize?: number;
  wordsearchDirections?: WordsearchDirection[]; // for Type 13
  wordsearchHintType?: WordsearchHintType; // for Type 13
  wordsearchGridSize?: number | 'auto'; // for Type 13
  wordsearchGridBorder?: WordsearchGridBorder; // for Type 13
  wordsearchCase?: WordsearchCase; // for Type 13
  targetLetter?: string; // for Type 14
  showWordLabels?: boolean; // for Type 14
  sentenceScramble?: boolean; // for Type 1
  sentenceSeparator?: 'space' | 'slash'; // for Type 1
  sentenceHintStyle?: 'underscores' | 'dots' | 'trace'; // for Type 1
  sentenceTraceFontSize?: number; // for Type 1: trace font size in pt (default: 28 for A4, 26 for A5)
  type4LayoutMode?: Type4LayoutMode; // for Type 4: 'grid' or 'table'
  type4ColumnMode?: Type4ColumnMode; // for Type 4 table mode
  type4TraceFontSize?: number; // for Type 4 table mode: trace font size in pt (default: 28)
  type4AlphabetTargetLetter?: string; // for Type 4 table mode alphabet order (default: 'c')
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
  answerMode?: 'student' | 'answer'; // for Types 1, 2, 3, 4, 5, 6, 7, 8, 9, 10: 'student' (default) or 'answer'
}

export interface CompositeWorksheetConfig {
  title: string;
  paperSize?: 'a5' | 'a4';
  fontFamily?: 'r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots';
  fontSize?: number;
  spacing?: number;
  imageSize?: number;
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
  id?: WorksheetType;
  name: string;
  description: string;
  thumbnail: string;
  isNew?: boolean;
}

export const WORKSHEET_TYPES: WorksheetTypeMeta[] = [
  {
    type: 1,
    id: 1,
    name: 'Loại 1: Viết lại câu (Reorder words / Rewrite)',
    description: 'Sắp xếp lại các từ bị xáo trộn để viết thành câu hoàn chỉnh, có gợi ý nét gạch hoặc chấm.',
    thumbnail: '/worksheet/types/loai-pdf-1.PNG',
    isNew: true
  },
  {
    type: 2,
    name: 'Nhìn tranh viết từ (3x4)',
    description: 'Bố cục 12 từ/trang, có tranh minh họa và dòng kẻ để học sinh tự điền từ vựng.',
    thumbnail: '/worksheet/types/loai-pdf-2.PNG'
  },
  {
    type: 3,
    name: 'Nối tranh với từ vựng / câu',
    description: 'Tranh minh họa ở hai bên, từ vựng hoặc câu ở giữa không khung viền được xáo trộn để nối.',
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
    description: 'Mỗi tranh có 2 hoặc 3 lựa chọn không khung viền, không vòng tròn nhỏ, học sinh tự khoanh chữ đúng.',
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
  },
  {
    type: 11,
    name: 'Viết từ và khoanh tranh đúng (Write and circle)',
    description: 'Cột trái là từ vựng nét chấm (font KG Primary Dots) kèm dòng kẻ, bên phải có 3 tranh (1 đúng + 2 gây nhiễu) để học sinh tập viết và khoanh tranh đúng.',
    thumbnail: '/worksheet/types/loai-pdf-11.PNG'
  },
  {
    type: 12,
    name: 'Nhìn tranh hoàn thành câu (Look and write)',
    description: 'Bố cục 2 cột không khung. Mỗi mục gồm tranh và câu chứa từ khuyết chữ cái (mỗi chữ thiếu là 2 dấu gạch __). Nếu chưa có câu thì hiển thị tranh và cụm từ khuyết.',
    thumbnail: '/worksheet/types/loai-pdf-12.PNG'
  },
  {
    type: 13,
    name: 'Tìm từ trong ô chữ (Wordsearch Puzzle)',
    description: 'Lưới tìm từ vựng theo hướng ngang, dọc, xéo với nét đứt chấm bi nhỏ xinh xắn, kèm gợi ý bằng chữ hoặc hình ảnh sinh động.',
    thumbnail: '/worksheet/types/loai-pdf-13.PNG'
  },
  {
    type: 14,
    id: 14,
    name: 'Loại 14: Circle the pictures that have letter [X]',
    description: 'Khoanh tròn các tranh có chứa chữ cái mục tiêu (lưới 4x2)',
    thumbnail: '/worksheet/types/loai-pdf-14.PNG',
    isNew: false
  },
  {
    type: 15,
    id: 15,
    name: 'Loại 15: Đọc câu và khoanh tròn hình đúng (Read and circle)',
    description: 'Mỗi câu có 2 tranh lựa chọn (a và b) được đóng khung chia đôi, học sinh đọc câu và khoanh tròn hình/chữ cái đúng.',
    thumbnail: '/worksheet/types/loai-pdf-15.PNG',
    isNew: false
  },
  {
    type: 16,
    id: 16,
    name: 'Loại 16: Nhìn tranh khoanh âm (Look and circle the sound)',
    description: 'Mỗi tranh có các chữ cái lựa chọn (2, 3 hoặc 4 chữ cái) xếp theo cột hoặc hàng, học sinh nhìn tranh và khoanh tròn âm đầu/cuối đúng.',
    thumbnail: '/worksheet/types/loai-pdf-16.PNG',
    isNew: false
  },
  {
    type: 17,
    id: 17,
    name: 'Loại 17: Nhìn tranh tô màu từ đúng (Look and color the words)',
    description: 'Mỗi tranh có dải các ô chữ cái chứa từ mục tiêu và chữ cái dư. Hỗ trợ 2 chế độ: Tô màu từ đúng (Look and color) hoặc Gạch bỏ chữ dư (Cross out the extra letters).',
    thumbnail: '/worksheet/types/loai-pdf-17.PNG',
    isNew: false
  },
  {
    type: 18,
    id: 18,
    name: 'Loại 18: Tô màu chữ cái mục tiêu (Color the letters)',
    description: 'Tìm và tô màu các chữ cái mục tiêu (chữ hoa/thường) trong khung các hình tròn bao quanh chữ (ví dụ: Color E green and e red).',
    thumbnail: '/worksheet/types/loai-pdf-18.PNG',
    isNew: true
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

export const FONT_SIZE_OPTIONS = [
  { value: 10, label: '10 pt' },
  { value: 11, label: '11 pt' },
  { value: 12, label: '12 pt (Chuẩn Word)' },
  { value: 14, label: '14 pt' },
  { value: 16, label: '16 pt' },
  { value: 18, label: '18 pt' },
  { value: 20, label: '20 pt' },
  { value: 22, label: '22 pt (Tập viết)' },
  { value: 24, label: '24 pt' },
  { value: 26, label: '26 pt' },
  { value: 28, label: '28 pt' },
  { value: 30, label: '30 pt' },
  { value: 32, label: '32 pt' },
  { value: 36, label: '36 pt' }
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

/**
 * Scramble words in a sentence for Worksheet Type 1.
 * Supports separator: 'space' (evenly/widely spaced) or 'slash' (' / ').
 */
export function scrambleSentenceWords(sentence: string, separator: 'space' | 'slash' = 'space'): string {
  const trimmed = sentence.trim();
  if (!trimmed) return '';
  const tokens = trimmed.split(/\s+/).filter(Boolean);
  if (tokens.length <= 1) return trimmed;

  // Shuffle tokens until order differs from original
  let shuffled = [...tokens];
  let attempts = 0;
  while (attempts < 15) {
    shuffled = shuffleArray(tokens);
    if (shuffled.join(' ') !== tokens.join(' ')) break;
    attempts++;
  }

  if (separator === 'slash') {
    return shuffled.join(' / ');
  }
  // Separator 'space': clean spaced words
  return shuffled.join('    ');
}

/**
 * Generate sentence hint row for Worksheet Type 1:
 * - 'underscores': 2 '_' per letter ('__'), letters in same word separated by 1 space,
 *   words separated by 3 spaces, punctuation preserved.
 * - 'dots': each character (letters, spaces, punctuation) is replaced by 1 '...'.
 *   For example, 'a van' (4 letters + 1 space) produces 5 '...'.
 *   Clamped to maxDots if provided (to strictly guarantee at most 1 line).
 * - 'trace': the exact sentence text to be rendered in KG Primary Dots (trace handwriting font).
 */
export function generateSentenceHint(
  sentence: string,
  style: 'underscores' | 'dots' | 'trace' = 'underscores',
  maxDots?: number
): string {
  const trimmed = sentence.trim();
  if (!trimmed) return '';

  if (style === 'trace') {
    return trimmed;
  }

  if (style === 'dots') {
    const normalized = trimmed.replace(/\s+/g, ' ');
    let count = normalized.length;
    if (typeof maxDots === 'number' && maxDots > 0) {
      count = Math.min(count, maxDots);
    }
    return Array(count).fill('...').join('');
  }

  // 'underscores': 2 '_' per letter, keep punctuation
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordHints = words.map((w) => {
    const chars = w.split('');
    const charHints: string[] = [];
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i];
      if (/[\p{L}\p{N}]/u.test(ch)) {
        charHints.push('__');
      } else {
        charHints.push(ch);
      }
    }
    return charHints.join(' ');
  });

  return wordHints.join('   ');
}

/**
 * Extract sentence for Type 1 item:
 * - Uses word.exampleSentence if available (strips <#...#> markup if present).
 * - Fallback: short sentence "[term]." per user requirement.
 */
export function getType1Sentence(word: WorksheetWord): string {
  const raw = (word.exampleSentence || '').trim();
  if (raw) {
    return raw.replace(/<#([\s\S]*?)#>/g, '$1').trim();
  }
  const term = (word.term || '').trim();
  if (!term) return '';
  return `${term}.`;
}

/**
 * Calculate geometry metrics for Type 1 exercise items based on font size, spacing, hint style, and trace font size.
 */
export function calculateType1Metrics(
  fontSizePt: number,
  spacingPt: number,
  imgSize: number = 12.7,
  hintStyle: 'underscores' | 'dots' | 'trace' = 'underscores',
  traceFontSizePt?: number
) {
  const spacingMm = spacingPt * 0.352778;
  const isZero = spacingPt === 0;
  const gapImgToWords = (isZero ? 1.5 : 2.0) + spacingMm * 0.35;
  const gapWordsToHint = (isZero ? 2.0 : 3.0) + spacingMm * 0.45;
  const itemGap = (isZero ? 2.0 : 3.0) + spacingMm * 0.6;
  const wordsH = fontSizePt * 0.352778 * 1.2;
  const effectiveHintFontSize = hintStyle === 'trace' ? (traceFontSizePt || 28) : fontSizePt;
  const hintH = effectiveHintFontSize * 0.352778 * 1.2;
  const itemContentHeight = imgSize + gapImgToWords + wordsH + gapWordsToHint + hintH;
  const itemTotalHeight = itemContentHeight + itemGap;
  return {
    spacingMm,
    isZero,
    gapImgToWords,
    gapWordsToHint,
    itemGap,
    wordsH,
    hintH,
    effectiveHintFontSize,
    itemContentHeight,
    itemTotalHeight
  };
}

/**
 * Calculate geometry metrics for Type 2 exercise items (Look and write - 3x4 grid)
 * based on fontSize, spacing, imageSize, and paper size.
 * Guarantees zero overlap at 0 pt spacing regardless of font size or descenders.
 */
export function calculateType2Metrics(
  fontSizePt: number = 12,
  spacingPt: number = 0,
  imgSize: number = 12.7,
  isA5: boolean = true
) {
  const spacingMm = (spacingPt !== undefined ? spacingPt : 6) * 0.352778;
  const effectiveFontSize = fontSizePt || (isA5 ? 12 : 14);
  const fontHeightMm = effectiveFontSize * 0.352778;
  const lineOffset = Math.max(4.0, fontHeightMm * 0.95 + 1.5) + spacingMm * 0.2;
  const rowGap = Math.max(2.0, fontHeightMm * 0.4) + spacingMm * 0.5;
  const rowHeight = imgSize + lineOffset + rowGap;
  return {
    effectiveFontSize,
    spacingMm,
    fontHeightMm,
    lineOffset,
    rowGap,
    rowHeight
  };
}

/**
 * Calculate geometry metrics for Type 4 Grid exercise items (Missing letters 3x4)
 * based on fontSize, spacing, imageSize, and paper size.
 * Guarantees zero overlap at 0 pt spacing regardless of font size or descenders.
 */
export function calculateType4GridMetrics(
  fontSizePt: number = 12,
  spacingPt: number = 0,
  imgSize: number = 12.7,
  isA5: boolean = true
) {
  const spacingMm = (spacingPt !== undefined ? spacingPt : 6) * 0.352778;
  const effectiveFontSize = fontSizePt || (isA5 ? 12 : 14);
  const fontHeightMm = effectiveFontSize * 0.352778;
  const textOffset = Math.max(3.5, fontHeightMm * 0.85 + 1.2) + spacingMm * 0.15;
  const rowGap = Math.max(1.8, fontHeightMm * 0.35) + spacingMm * 0.45;
  const rowHeight = imgSize + textOffset + 1.0 + rowGap;
  return {
    effectiveFontSize,
    spacingMm,
    fontHeightMm,
    textOffset,
    rowGap,
    rowHeight
  };
}

/**
 * Calculate geometry metrics for Type 9 exercise items (Look and color Yes or No)
 * based on paperSize (A4 vs A5), imageSize, and spacingPt.
 */
export function calculateType9Metrics(
  isA5: boolean,
  imgSize: number = 12.7,
  spacingPt: number = 0,
  fontSizePt?: number,
  cardWidth: number = 38
) {
  const spacingMm = (spacingPt !== undefined ? spacingPt : 0) * 0.352778;
  const isZero = spacingPt === 0;

  const maxImgDim = Math.min(imgSize, Math.max(10, cardWidth - 4));
  const sFontSize = fontSizePt ? (fontSizePt * 0.9) : (isA5 ? 10.5 : 12.5);
  const linePitch = sFontSize * 0.352778 * 1.25;

  // Gaps inside card:
  const gapImgToSentence = isZero
    ? (isA5 ? 1.2 : 1.5)
    : (isA5 ? 1.8 : 2.2) + spacingMm * 0.25;

  const gapSentenceToYesNo = isZero
    ? (isA5 ? 1.5 : 2.0)
    : (isA5 ? 2.2 : 2.8) + spacingMm * 0.25;

  const circleRadius = isA5 ? 3.6 : 4.5;
  const yesNoHeight = circleRadius * 2;

  // Gap between rows:
  const rowGap = isZero
    ? (isA5 ? 2.0 : 2.5)
    : (isA5 ? 3.0 : 4.0) + spacingMm * 0.45;

  // Base card height assuming 1-line sentence:
  const baseCardHeight = maxImgDim + gapImgToSentence + linePitch + gapSentenceToYesNo + yesNoHeight;
  const baseRowHeight = baseCardHeight + rowGap;

  return {
    spacingMm,
    isZero,
    maxImgDim,
    sFontSize,
    linePitch,
    gapImgToSentence,
    gapSentenceToYesNo,
    circleRadius,
    yesNoHeight,
    rowGap,
    baseCardHeight,
    baseRowHeight
  };
}

/**
 * Calculate geometry metrics for Type 7 exercise items (Unscramble letters - 3 columns)
 * based on fontSize, spacing, imageSize, and paper size.
 * Guarantees zero overlap at 0 pt spacing regardless of font size or descenders.
 */
export function calculateType7Metrics(
  fontSizePt: number = 12,
  spacingPt: number = 0,
  imgSize: number = 12.7,
  isA5: boolean = true
) {
  const spacingMm = (spacingPt !== undefined ? spacingPt : 6) * 0.352778;
  const effectiveFontSize = fontSizePt || (isA5 ? 12 : 14);
  const fontHeightMm = effectiveFontSize * 0.352778;
  // Offset from image bottom to baseline of scrambled text
  const textOffset1 = Math.max(3.5, fontHeightMm * 0.85 + 1.2) + spacingMm * 0.15;
  // Distance between scrambled text baseline and blanks/answer baseline
  const textOffset2 = Math.max(3.8, fontHeightMm * 1.15 + 1.0) + spacingMm * 0.2;
  // Row gap between rows ensuring clearance even at 0 pt spacing
  const rowGap = Math.max(1.8, fontHeightMm * 0.35) + spacingMm * 0.45;
  const contentHeight = imgSize + textOffset1 + textOffset2 + 1.0;
  const rowHeight = contentHeight + rowGap;
  return {
    effectiveFontSize,
    spacingMm,
    fontHeightMm,
    textOffset1,
    textOffset2,
    rowGap,
    contentHeight,
    rowHeight
  };
}

/**
 * Calculate geometry metrics for Type 10 exercise items (Look and color - 2 pictures side by side)
 * based on paperSize (A4 vs A5), imageSize, spacingPt, and fontSizePt.
 * Guarantees zero overlap at 0 pt spacing regardless of font size.
 */
export function calculateType10Metrics(
  isA5: boolean,
  imgSize: number = 12.7,
  spacingPt: number = 0,
  fontSizePt?: number,
  cardWidth: number = 38
) {
  const effectiveFontSize = fontSizePt || (isA5 ? 12 : 14);
  const fontHeightMm = effectiveFontSize * 0.352778;
  const subW = cardWidth / 2;
  const imgBoxHeight = Math.max(imgSize + 2.0, isA5 ? 14.0 : 16.0);
  const maxImgDim = Math.min(imgSize, subW - 2, imgBoxHeight - 2);
  const wordBoxHeight = Math.max(isA5 ? 7.5 : 9.5, fontHeightMm * 1.35 + 2.0);
  const cardHeight = imgBoxHeight + wordBoxHeight;
  const spacingMm = (spacingPt !== undefined ? spacingPt : 0) * 0.352778;
  const rowGap = (spacingPt === 0 ? 1.5 : 2.5) + spacingMm * 0.35;
  const rowHeight = cardHeight + rowGap;
  return {
    effectiveFontSize,
    fontHeightMm,
    subW,
    imgBoxHeight,
    maxImgDim,
    wordBoxHeight,
    cardHeight,
    rowGap,
    rowHeight
  };
}



/**
 * Extract sentence for Type 15 item (Read and circle):
 * - Uses word.exampleSentence if available (strips <#...#> markup if present).
 * - Fallback: "Nào không có mẫu câu thì chỉ để chữ" -> returns word term directly.
 */
export function getType15Sentence(word: WorksheetWord): string {
  const raw = (word.exampleSentence || '').trim();
  if (raw) {
    return raw.replace(/<#([\s\S]*?)#>/g, '$1').trim();
  }
  return (word.term || '').trim();
}

/**
 * Extract highlighted spans for Type 15 item:
 * - If exampleSentence provided: parses highlighted vocabulary span (like Type 3).
 * - Fallback: "Nào không có mẫu câu thì chỉ để chữ" -> returns term directly highlighted in red.
 */
export function getType15SentenceSpans(word: WorksheetWord): HighlightedSpan[] {
  const raw = (word.exampleSentence || '').trim();
  if (raw) {
    return parseHighlightedSentence(raw, word.term);
  }
  const cleanTerm = (word.term || '').trim();
  if (cleanTerm) {
    return [{ text: cleanTerm, isHighlighted: true }];
  }
  return [{ text: '', isHighlighted: false }];
}
/**
 * Helper to generate choices for Type 16: Look and circle sound
 * - Extracts target letter:
 *   - beginning: first alphabetic letter of word (e.g. "bell" -> "b", "dog" -> "d")
 *   - ending: last alphabetic letter of word (e.g. "bell" -> "l", "cat" -> "t")
 * - Generates distinct distractors:
 *   - Pulls from other words in the deck if available
 *   - Complements with common phonics distractor letters
 *   - Guarantees target is among choices exactly once, shuffled deterministically
 * - Formats letter case:
 *   - 'lower': 'b'
 *   - 'upper': 'B'
 *   - 'both': 'Bb'
 */
export function generateType16Choices(
  word: string,
  soundMode: Type16SoundMode = 'beginning',
  choiceCount: Type16ChoiceCount = 3,
  letterCase: Type16LetterCase = 'lower',
  allWords?: (WorksheetWord | string)[]
): { choices: string[]; targetLetter: string; targetIndex: number } {
  const clean = (word || '').trim();
  const alphaMatches = clean.match(/[a-zA-Z]/g);
  let target = 'a';
  if (alphaMatches && alphaMatches.length > 0) {
    target = (soundMode === 'ending' ? alphaMatches[alphaMatches.length - 1] : alphaMatches[0]).toLowerCase();
  }

  // Pool of letters
  const phonicsPool = ['b', 'd', 'p', 'q', 'm', 'n', 'c', 'k', 's', 't', 'f', 'v', 'w', 'r', 'l', 'h', 'j', 'g', 'z', 'a', 'e', 'i', 'o', 'u'];
  const otherDeckLetters: string[] = [];
  if (allWords && allWords.length > 0) {
    for (const w of allWords) {
      const t = typeof w === 'string' ? w : w.term;
      const m = (t || '').trim().match(/[a-zA-Z]/g);
      if (m && m.length > 0) {
        const ch = (soundMode === 'ending' ? m[m.length - 1] : m[0]).toLowerCase();
        if (ch !== target && !otherDeckLetters.includes(ch)) {
          otherDeckLetters.push(ch);
        }
      }
    }
  }

  // Combine unique candidates excluding target
  const candidatePool = Array.from(new Set([...otherDeckLetters, ...phonicsPool])).filter((ch) => ch !== target);

  // Deterministic hash based on word, soundMode, choiceCount so preview remains stable
  let hashSeed = 0;
  const hashKey = clean + soundMode + choiceCount;
  for (let i = 0; i < hashKey.length; i++) {
    hashSeed = (hashSeed * 31 + hashKey.charCodeAt(i)) % 10007;
  }

  const shuffledCandidates = [...candidatePool].sort((a, b) => {
    const valA = ((a.charCodeAt(0) * 17) + hashSeed) % 101;
    const valB = ((b.charCodeAt(0) * 17) + hashSeed) % 101;
    return valA - valB;
  });

  const neededDistractors = Math.max(1, choiceCount - 1);
  const distractors = shuffledCandidates.slice(0, neededDistractors);

  // Place target at deterministic index between 0 and choiceCount - 1
  const targetIndex = hashSeed % choiceCount;
  const rawChoices: string[] = [];
  let dIdx = 0;
  for (let i = 0; i < choiceCount; i++) {
    if (i === targetIndex) {
      rawChoices.push(target);
    } else {
      rawChoices.push(distractors[dIdx++] || 'x');
    }
  }

  const formatCase = (ch: string) => {
    const low = ch.toLowerCase();
    if (letterCase === 'upper') return low.toUpperCase();
    if (letterCase === 'both') return low.toUpperCase() + low;
    return low;
  };

  return {
    choices: rawChoices.map(formatCase),
    targetLetter: formatCase(target),
    targetIndex
  };
}

/**
 * Calculate geometry metrics for Type 16 items
 */
export function calculateType16Metrics(
  fontSizePt: number,
  spacingPt: number = 0,
  choiceCount: Type16ChoiceCount = 3,
  layout: Type16Layout = 'lettersLeft',
  borderStyle: Type16Border = 'none',
  imgSize: number = 12.7,
  isA5: boolean = false,
  fontFamily?: string
) {
  const spacingMm = (spacingPt !== undefined ? spacingPt : 0) * 0.352778;
  const isZero = spacingPt === 0;
  const fontHeightMm = fontSizePt * 0.352778;

  let optPitch = 0;
  let choicesBlockH = 0;
  let contentHeight = 0;

  const isCursive = fontFamily === 'HP001' || fontFamily === 'HLHOCTRO';

  if (layout === 'lettersBottom') {
    const gapImgToChoices = (isZero ? 1.5 : 2.5) + (spacingMm * 0.2);
    contentHeight = imgSize + gapImgToChoices + fontHeightMm;
  } else {
    // For vertical letters, give ample space for student to circle each letter.
    // Vietnamese cursive fonts (HP001, HLHOCTRO) have long ascenders and descenders (f, p, j, d).
    const baseOptPitch = isCursive
      ? Math.max(fontHeightMm * 1.65, fontHeightMm + 4.0)
      : Math.max(fontHeightMm * 1.45, fontHeightMm + 2.5);
    optPitch = baseOptPitch + (spacingMm * 0.25);
    choicesBlockH = (choiceCount - 1) * optPitch + fontHeightMm;
    contentHeight = Math.max(imgSize, choicesBlockH);
  }

  const padY = (borderStyle !== 'none') ? 2.5 : 0;
  const cardHeight = contentHeight + padY * 2;

  // At Spacing 0 pt: rowGap is compact (3.0mm A4, 2.0mm A5)
  // At spacing > 0 pt: scales smoothly with spacingMm * 0.7
  const baseRowGap = isZero ? (isA5 ? 2.0 : 3.0) : (isA5 ? 3.5 : 5.0);
  const rowGap = baseRowGap + (spacingMm * 0.7);
  const rowHeight = cardHeight + rowGap;

  return {
    spacingMm,
    isZero,
    fontHeightMm,
    optPitch,
    choicesBlockH,
    contentHeight,
    cardHeight,
    rowGap,
    rowHeight
  };
}

export interface Type17Cell {
  char: string;
  isTarget: boolean;
  indexInWord: number;
}

export function generateType17Letters(
  term: string,
  stripLengthOption: Type17StripLength = 'auto',
  taskMode: Type17TaskMode = 'color',
  letterCase: Type17LetterCase = 'lower',
  seedIndex: number = 0
): { cells: Type17Cell[]; targetIndices: number[]; distractorIndices: number[]; stripLength: number } {
  const cleanWord = term.trim().replace(/[^a-zA-Z]/g, '') || 'word';
  const wordChars = (letterCase === 'upper' ? cleanWord.toUpperCase() : cleanWord.toLowerCase()).split('');

  // Default target length: 8 for color, 6 for cross out
  const defaultLen = taskMode === 'cross' ? 6 : 8;
  const targetLen = stripLengthOption === 'auto' ? defaultLen : Number(stripLengthOption);
  // Strip length must be at least wordChars.length + 1 so there's always at least one distractor
  const finalLen = Math.max(targetLen, wordChars.length + 1);
  const extraCount = finalLen - wordChars.length;

  // Distribute extra letters into prefix and suffix
  let prefixCount = 1;
  if (extraCount <= 1) {
    prefixCount = seedIndex % 2 === 0 ? 1 : 0;
  } else {
    // Varied natural distribution across exercise items
    const distPattern = [1, 2, 1, 2, 1, 3, 2];
    const desired = distPattern[seedIndex % distPattern.length];
    prefixCount = Math.min(extraCount - 1, Math.max(1, desired));
  }
  const suffixCount = extraCount - prefixCount;

  // Distractor pools of natural consecutive & paired letters
  const pairs = [
    ['a', 'b', 'c', 'd'],
    ['x', 'y', 'z', 'w'],
    ['m', 'n', 'o', 'p'],
    ['p', 'q', 'r', 's'],
    ['u', 'v', 'w', 'x'],
    ['b', 'c', 'd', 'e'],
    ['f', 'g', 'h', 'j'],
    ['s', 't', 'u', 'v']
  ];

  const prefixPool = pairs[seedIndex % pairs.length];
  const prefixChars: string[] = [];
  for (let p = 0; p < prefixCount; p++) {
    const ch = prefixPool[p % prefixPool.length];
    prefixChars.push(letterCase === 'upper' ? ch.toUpperCase() : ch.toLowerCase());
  }

  const suffixOffset = (seedIndex * 3 + 2) % pairs.length;
  const suffixPool = pairs[suffixOffset];
  const suffixChars: string[] = [];
  for (let s = 0; s < suffixCount; s++) {
    const ch = suffixPool[s % suffixPool.length];
    suffixChars.push(letterCase === 'upper' ? ch.toUpperCase() : ch.toLowerCase());
  }

  const cells: Type17Cell[] = [];
  const targetIndices: number[] = [];
  const distractorIndices: number[] = [];

  prefixChars.forEach((char) => {
    distractorIndices.push(cells.length);
    cells.push({ char, isTarget: false, indexInWord: -1 });
  });

  wordChars.forEach((char, idx) => {
    targetIndices.push(cells.length);
    cells.push({ char, isTarget: true, indexInWord: idx });
  });

  suffixChars.forEach((char) => {
    distractorIndices.push(cells.length);
    cells.push({ char, isTarget: false, indexInWord: -1 });
  });

  return { cells, targetIndices, distractorIndices, stripLength: finalLen };
}

/**
 * Calculate geometry metrics for Type 17 items (Look and color / Cross out extra letters)
 */
export function calculateType17Metrics(
  fontSizePt: number,
  spacingPt: number = 0,
  stripLength: number = 8,
  cardBorder: Type17CardBorder = 'none',
  imgSizeMm: number = 12.7,
  isA5: boolean = false,
  fontFamily?: string
) {
  const cols = isA5 ? 2 : 3;
  const colGap = isA5 ? 5.0 : 6.0;
  const printableWidth = isA5 ? 132 : 190; // 148-16 on A5, 210-20 on A4
  const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

  const spacingMm = (spacingPt !== undefined ? spacingPt : 0) * 0.352778;
  const isZero = spacingPt === 0;

  // Cell dimensions
  const fontHeightMm = fontSizePt * 0.352778;
  const cellH = Math.max(isA5 ? 6.5 : 7.2, fontHeightMm * 1.35);
  const maxCellW = (cardWidth - 2.0) / stripLength;
  const desiredCellW = Math.max(cellH, isA5 ? 6.5 : 7.2);
  const cellW = Math.min(maxCellW, desiredCellW);
  const stripW = cellW * stripLength;
  const stripH = cellH;

  // Strict font scaling inside cell to prevent any overflow or clipping
  const maxSafeFontByWidth = (cellW * 0.72) / 0.352778;
  const maxSafeFontByHeight = (cellH * 0.72) / 0.352778;
  const effectiveCellFontSize = Math.min(fontSizePt, maxSafeFontByWidth, maxSafeFontByHeight);

  // Effective image dimension: centered above strip
  const maxImgW = cardWidth - (cardBorder === 'rounded' ? 6.0 : 2.0);
  const effectiveImgDim = Math.min(imgSizeMm, maxImgW);

  // Gap between image and letter strip
  // At spacing 0 pt: 1.8mm (tight, compact, professional)
  // At spacing > 0 pt: scales smoothly
  const gapImgToStrip = (isZero ? 1.8 : 2.2) + spacingMm * 0.25;

  const padY = cardBorder === 'rounded' ? (isA5 ? 2.0 : 2.5) : 0;
  const itemContentHeight = effectiveImgDim + gapImgToStrip + stripH;
  const cardHeight = itemContentHeight + 2 * padY;

  // Row gap between items:
  // At spacing 0 pt: 2.0mm on A5, 3.0mm on A4
  // At spacing > 0 pt: scales linearly with points
  const baseRowGap = isZero ? (isA5 ? 2.0 : 3.0) : (isA5 ? 3.5 : 4.5);
  const rowGap = baseRowGap + spacingMm * 0.7;
  const rowHeight = cardHeight + rowGap;

  return {
    cols,
    colGap,
    cardWidth,
    cellW,
    cellH,
    stripW,
    stripH,
    effectiveImgDim,
    gapImgToStrip,
    padY,
    itemContentHeight,
    cardHeight,
    baseRowGap,
    rowGap,
    rowHeight,
    effectiveCellFontSize,
    spacingMm,
    isZero
  };
}

/**
 * Draws a single Type 17 item: image + letter strip with choices, borders, and optional example markings
 */
export function drawType17Item(
  doc: jsPDF,
  cardX: number,
  cardY: number,
  cardWidth: number,
  targetImg: string | null,
  cells: Type17Cell[],
  taskMode: Type17TaskMode,
  borderStyle: Type17Border,
  cardBorderStyle: Type17CardBorder,
  highlightTarget: Type17HighlightTarget,
  showExample: boolean,
  isFirstItem: boolean,
  metrics: ReturnType<typeof calculateType17Metrics>,
  activeFont: string,
  showImageBorder: boolean = false
) {
  const { cellW, cellH, stripW, stripH, effectiveImgDim, gapImgToStrip, padY, cardHeight, effectiveCellFontSize } = metrics;
  const numCells = cells.length;

  // 1. Optional outer card border (matching Type 15/16 rounded card style)
  if (cardBorderStyle === 'rounded') {
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.4);
    setDocLineDash(doc, [0.4, 0.8]);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 2.0, 2.0, 'S');
    setDocLineDash(doc, []);
  }

  // 2. Draw Image (centered horizontally in cardWidth)
  const imgX = cardX + (cardWidth - effectiveImgDim) / 2;
  const imgY = cardY + padY + (cardBorderStyle === 'rounded' ? 1.0 : 0);

  if (targetImg) {
    try {
      doc.addImage(targetImg, 'JPEG', imgX, imgY, effectiveImgDim, effectiveImgDim);
    } catch {
      if (showImageBorder) doc.rect(imgX, imgY, effectiveImgDim, effectiveImgDim);
    }
  } else if (showImageBorder) {
    doc.rect(imgX, imgY, effectiveImgDim, effectiveImgDim);
  }

  // 3. Draw Letter Strip (centered horizontally in cardWidth)
  const stripX = cardX + (cardWidth - stripW) / 2;
  const stripY = imgY + effectiveImgDim + gapImgToStrip;

  // Letter strip border: full | outerOnly | none
  if (borderStyle === 'full' || borderStyle === 'outerOnly') {
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.35);
    setDocLineDash(doc, [0.4, 0.8]);
    doc.roundedRect(stripX, stripY, stripW, stripH, 1.2, 1.2, 'S');

    // Inner dividers if full (nét đứt chia đều từng ô chữ cái)
    if (borderStyle === 'full') {
      doc.setLineWidth(0.28);
      setDocLineDash(doc, [0.3, 0.7]);
      for (let c = 1; c < numCells; c++) {
        const divX = stripX + c * cellW;
        doc.line(divX, stripY, divX, stripY + stripH);
      }
    }
    setDocLineDash(doc, []); // reset dash
  }

  // 4. Draw Characters and Cross-out slashes inside each cell
  for (let c = 0; c < numCells; c++) {
    const cell = cells[c];
    const cellX = stripX + c * cellW;
    const cellY = stripY;
    const cellCenterX = cellX + cellW / 2;
    const cellCenterY = cellY + cellH / 2;

    const isExItem = isFirstItem && showExample;
    const shouldHighlight = cell.isTarget && (highlightTarget === 'red' || (isExItem && taskMode === 'color'));

    // Text color
    if (shouldHighlight) {
      doc.setTextColor(220, 38, 38); // Highlight red #dc2626 exactly as Type 3/15
    } else {
      doc.setTextColor(30, 41, 59); // Slate-800 dark text
    }

    applyFont(doc, activeFont, activeFont === 'KG Primary Dots' ? 'normal' : 'bold');
    doc.setFontSize(effectiveCellFontSize);
    doc.text(cell.char, cellCenterX, cellCenterY, { align: 'center', baseline: 'middle' });

    // In 'cross' mode: if example on 1st item and cell is a distractor, draw diagonal slash '/'
    if (taskMode === 'cross' && isExItem && !cell.isTarget) {
      doc.setDrawColor(71, 85, 105); // slate-600
      doc.setLineWidth(0.35);
      const slashPadW = cellW * 0.18;
      const slashPadH = cellH * 0.18;
      doc.line(cellX + slashPadW, cellY + cellH - slashPadH, cellX + cellW - slashPadW, cellY + slashPadH);
    }
  }

  doc.setTextColor(0, 0, 0);
}

// -------------------------------------------------------------
// TYPE 18: COLOR THE LETTERS (Find and color target letters in circles)
// -------------------------------------------------------------

export const TYPE18_COLOR_MAP: Record<string, { name: string; viName: string; rgb: [number, number, number]; hex: string }> = {
  green: { name: 'green', viName: 'Xanh lá', rgb: [22, 163, 74], hex: '#16a34a' },
  red: { name: 'red', viName: 'Đỏ', rgb: [220, 38, 38], hex: '#dc2626' },
  blue: { name: 'blue', viName: 'Xanh dương', rgb: [37, 99, 235], hex: '#2563eb' },
  yellow: { name: 'yellow', viName: 'Vàng', rgb: [202, 138, 4], hex: '#ca8a04' },
  orange: { name: 'orange', viName: 'Cam', rgb: [234, 88, 12], hex: '#ea580c' },
  purple: { name: 'purple', viName: 'Tím', rgb: [147, 51, 234], hex: '#9333ea' },
  pink: { name: 'pink', viName: 'Hồng', rgb: [219, 39, 119], hex: '#db2777' }
};

export function generateType18Grid(
  targetLetter: string = 'E',
  mode: Type18Mode = 'both',
  rows: number = 4,
  cols: number = 7,
  distractorCasing: Type18DistractorCasing = 'upper',
  seed: number = 0
): { cells: Type18Cell[]; targetUpperCount: number; targetLowerCount: number; distractorCount: number } {
  const cleanLetter = (targetLetter || 'E').trim().charAt(0).toUpperCase() || 'E';
  const upperChar = cleanLetter;
  const lowerChar = cleanLetter.toLowerCase();

  const totalCells = rows * cols;
  let targetUpperCount = 0;
  let targetLowerCount = 0;

  if (mode === 'both') {
    targetUpperCount = Math.max(2, Math.round(totalCells * 0.25)); // 7 for 28
    targetLowerCount = Math.max(2, Math.round(totalCells * 0.21)); // 6 for 28
  } else if (mode === 'upper_only') {
    targetUpperCount = Math.max(4, Math.round(totalCells * 0.40)); // 11 for 28
    targetLowerCount = 0;
  } else if (mode === 'lower_only') {
    targetUpperCount = 0;
    targetLowerCount = Math.max(4, Math.round(totalCells * 0.40)); // 11 for 28
  } else if (mode === 'single_color') {
    targetUpperCount = Math.max(2, Math.round(totalCells * 0.25));
    targetLowerCount = Math.max(2, Math.round(totalCells * 0.25));
  }

  const distractorCount = totalCells - (targetUpperCount + targetLowerCount);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(c => c !== upperChar);
  const prioritizedDistractors = ['A', 'B', 'C', 'D', 'F', 'H', 'P', 'R', 'S', 'T', 'M', 'N', 'O', 'L', 'G']
    .filter(c => c !== upperChar && alphabet.includes(c));
  const candidatePool = prioritizedDistractors.length >= 4 ? prioritizedDistractors : alphabet;

  let s = (seed + 1) * 12345;
  const nextRnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  const cellList: { char: string; isTargetUpper: boolean; isTargetLower: boolean }[] = [];

  for (let i = 0; i < targetUpperCount; i++) {
    cellList.push({ char: upperChar, isTargetUpper: true, isTargetLower: false });
  }
  for (let i = 0; i < targetLowerCount; i++) {
    cellList.push({ char: lowerChar, isTargetUpper: false, isTargetLower: true });
  }

  for (let i = 0; i < distractorCount; i++) {
    const rawDist = candidatePool[Math.floor(nextRnd() * candidatePool.length)];
    let finalDist = rawDist;
    if (distractorCasing === 'upper') {
      finalDist = rawDist.toUpperCase();
    } else if (distractorCasing === 'lower') {
      finalDist = rawDist.toLowerCase();
    } else {
      finalDist = nextRnd() > 0.5 ? rawDist.toUpperCase() : rawDist.toLowerCase();
    }
    cellList.push({ char: finalDist, isTargetUpper: false, isTargetLower: false });
  }

  // Shuffle cells with deterministic seed
  for (let i = cellList.length - 1; i > 0; i--) {
    const j = Math.floor(nextRnd() * (i + 1));
    const temp = cellList[i];
    cellList[i] = cellList[j];
    cellList[j] = temp;
  }

  const gridCells: Type18Cell[] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const item = cellList[idx++];
      gridCells.push({
        char: item.char,
        isTargetUpper: item.isTargetUpper,
        isTargetLower: item.isTargetLower,
        row: r,
        col: c
      });
    }
  }

  return {
    cells: gridCells,
    targetUpperCount,
    targetLowerCount,
    distractorCount
  };
}

export function calculateType18Metrics(
  fontSizePt: number = 20,
  spacingPt: number = 0,
  rows: number = 4,
  cols: number = 7,
  outerBorder: Type18Border = 'rounded',
  isA5: boolean = false,
  containerWidthMm?: number,
  containerMaxHeightMm?: number
) {
  const defaultContainerW = isA5 ? 132 : 184.6;
  const maxContainerW = containerWidthMm || defaultContainerW;

  const effectiveSpacing = spacingPt !== undefined ? spacingPt : 0;
  const spacingMm = effectiveSpacing * 0.352778;
  const isZero = effectiveSpacing === 0;

  // Dynamic moderate circle diameter based on fontSizePt (referencing WS 9 style: moderate padding enclosing letter)
  // Single letter visual height/width is ~fontSizePt * 0.352778 * 0.74 mm.
  // Add moderate padding of ~2.0mm (A4) / ~1.6mm (A5) around letter boundary,
  // ensuring the circle snugly hugs the letter without looking excessively large.
  const paddingMm = isA5 ? 1.6 : 2.0;
  const rawLetterBoundMm = (fontSizePt * 0.352778) * 0.74;
  const dynamicDiameter = rawLetterBoundMm + 2 * paddingMm;

  // Baseline bounds: A4 moderate range 8.0mm - 10.5mm (around 9.2mm at 20pt); A5 6.5mm - 8.5mm (around 7.4mm at 16pt) - matching WS 9 (9.0mm A4, 7.2mm A5)
  const minTargetDiameter = isA5 ? 6.5 : 8.0;
  const maxTargetDiameter = isA5 ? 8.5 : 10.5;
  const baseTargetDiameter = Math.max(minTargetDiameter, Math.min(dynamicDiameter, maxTargetDiameter));

  // Equal horizontal and vertical gaps between circles
  // At spacing 0pt: compact 2.0mm (A5) / 2.5mm (A4)
  // Expands linearly with spacing setting
  const baseGap = isA5 ? 2.0 : 2.5;
  let curGapX = baseGap + spacingMm * 0.25;
  let curGapY = baseGap + spacingMm * 0.25;

  // Container padding: compact at 0pt, scales with spacing
  let padX = outerBorder !== 'none' ? (isA5 ? 3.5 : 4.5) + spacingMm * 0.15 : 0;
  let padY = outerBorder !== 'none' ? (isA5 ? 3.5 : 4.5) + spacingMm * 0.15 : 0;

  // Containment check: ensure grid doesn't exceed printable/container width
  let circleDiameter = baseTargetDiameter;
  const maxAvailW = maxContainerW - 2 * padX;
  const reqGridW = cols * circleDiameter + (cols - 1) * curGapX;
  if (reqGridW > maxAvailW) {
    const scaleFactor = Math.min(1.0, maxAvailW / reqGridW);
    circleDiameter *= scaleFactor;
    curGapX *= scaleFactor;
    curGapY *= scaleFactor;
  }

  // Dimensions
  const gridW = cols * circleDiameter + (cols - 1) * curGapX;
  const gridH = rows * circleDiameter + (rows - 1) * curGapY;
  const cardWidth = outerBorder !== 'none' ? (gridW + 2 * padX) : gridW;
  const cardHeight = outerBorder !== 'none' ? (gridH + 2 * padY) : gridH;
  const circleRadius = circleDiameter / 2;
  const cellW = circleDiameter + curGapX;
  const cellH = circleDiameter + curGapY;

  // Font Scaling Protection:
  // Circle interior safe zone: ensure letter never overflows circle
  const maxSafeFontPt = (circleDiameter * 0.78) / 0.352778;
  const effectiveCellFontSize = Math.min(fontSizePt, maxSafeFontPt);

  return {
    cols,
    rows,
    cardWidth,
    cardHeight,
    padX,
    padY,
    cellW,
    cellH,
    circleDiameter,
    circleRadius,
    gridW,
    gridH,
    gapX: curGapX,
    gapY: curGapY,
    baseGapBetweenCirclesY: curGapY,
    effectiveCellFontSize,
    spacingMm,
    isZero
  };
}

export function drawType18Title(
  doc: jsPDF,
  title: string,
  targetLetter: string = 'E',
  mode: Type18Mode = 'both',
  colorUpper: string = 'green',
  colorLower: string = 'red',
  x: number = 12.7,
  y: number = 18.0,
  fontSizePt: number = 20,
  fontFamily: string = 'r0c0i Linotte'
) {
  doc.setFontSize(fontSizePt);
  applyFont(doc, fontFamily, 'bold');

  const upperInfo = TYPE18_COLOR_MAP[colorUpper.toLowerCase()] || TYPE18_COLOR_MAP.green;
  const lowerInfo = TYPE18_COLOR_MAP[colorLower.toLowerCase()] || TYPE18_COLOR_MAP.red;

  // If title has markup <#color:text#> or <#text#>
  if (/<#[\s\S]*?#>/.test(title)) {
    const regex = /<#([\s\S]*?)#>/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let curX = x;
    while ((match = regex.exec(title)) !== null) {
      if (match.index > lastIdx) {
        const seg = title.substring(lastIdx, match.index);
        doc.setTextColor(30, 41, 59);
        doc.text(seg, curX, y);
        curX += doc.getTextWidth(seg);
      }
      const token = match[1];
      let colorRgb: [number, number, number] = upperInfo.rgb;
      let text = token;
      if (token.includes(':')) {
        const [cName, cText] = token.split(':');
        const cInfo = TYPE18_COLOR_MAP[cName.toLowerCase()];
        if (cInfo) colorRgb = cInfo.rgb;
        text = cText;
      }
      doc.setTextColor(colorRgb[0], colorRgb[1], colorRgb[2]);
      doc.text(text, curX, y);
      curX += doc.getTextWidth(text);
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < title.length) {
      const remaining = title.substring(lastIdx);
      doc.setTextColor(30, 41, 59);
      doc.text(remaining, curX, y);
    }
    doc.setTextColor(0, 0, 0);
    return;
  }

  // Tokenize words and style color words with their matching RGB
  const words = title.split(/(\s+)/);
  let curX = x;

  for (const w of words) {
    const cleanWord = w.toLowerCase().replace(/[.,!?;:]/g, '');
    const matchedColor = TYPE18_COLOR_MAP[cleanWord];

    if (matchedColor) {
      doc.setTextColor(matchedColor.rgb[0], matchedColor.rgb[1], matchedColor.rgb[2]);
      applyFont(doc, fontFamily, 'bold');
      doc.text(w, curX, y);
      curX += doc.getTextWidth(w);
    } else {
      doc.setTextColor(30, 41, 59);
      applyFont(doc, fontFamily, 'bold');
      doc.text(w, curX, y);
      curX += doc.getTextWidth(w);
    }
  }

  doc.setTextColor(0, 0, 0);
}

export function drawType18ContainerAndGrid(
  doc: jsPDF,
  startX: number,
  startY: number,
  cells: Type18Cell[],
  metrics: ReturnType<typeof calculateType18Metrics>,
  options: {
    outerBorder?: Type18Border;
    circleStyle?: Type18CircleStyle;
    highlightTarget?: Type18HighlightTarget;
    colorUpper?: string;
    colorLower?: string;
    fontFamily?: string;
  },
  isA5: boolean = false
) {
  const { cardWidth, cardHeight, padX, padY, cellW, cellH, circleRadius, effectiveCellFontSize } = metrics;
  const outerBorder = options.outerBorder || 'rounded';
  const circleStyle = options.circleStyle || 'solid';
  const highlightTarget = options.highlightTarget || 'none';
  const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;

  const upperInfo = TYPE18_COLOR_MAP[(options.colorUpper || 'green').toLowerCase()] || TYPE18_COLOR_MAP.green;
  const lowerInfo = TYPE18_COLOR_MAP[(options.colorLower || 'red').toLowerCase()] || TYPE18_COLOR_MAP.red;

  // 1. Draw outer container box
  if (outerBorder === 'rounded') {
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(isA5 ? 0.5 : 0.65);
    doc.roundedRect(startX, startY, cardWidth, cardHeight, isA5 ? 5 : 6, isA5 ? 5 : 6, 'S');
  } else if (outerBorder === 'rect') {
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(isA5 ? 0.5 : 0.65);
    doc.rect(startX, startY, cardWidth, cardHeight, 'S');
  }

  // 2. Draw circles & letters (Referencing WS 9 style: crisp 0.3mm stroke, balanced padding)
  for (const cell of cells) {
    const cx = startX + padX + circleRadius + cell.col * cellW;
    const cy = startY + padY + circleRadius + cell.row * cellH;

    if (highlightTarget === 'answer_key') {
      // Teacher Answer Key Mode: Fill circle with respective target color
      if (cell.isTargetUpper) {
        doc.setFillColor(upperInfo.rgb[0], upperInfo.rgb[1], upperInfo.rgb[2]);
        doc.setDrawColor(upperInfo.rgb[0], upperInfo.rgb[1], upperInfo.rgb[2]);
        doc.setLineWidth(isA5 ? 0.25 : 0.3);
        doc.circle(cx, cy, circleRadius, 'FD');

        const cellFontStyle: 'bold' | 'normal' = (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) ? 'bold' : 'normal';
        applyFont(doc, activeFont, cellFontStyle);
        doc.setFontSize(effectiveCellFontSize);
        doc.setTextColor(255, 255, 255);
        doc.text(cell.char, cx, cy, { align: 'center', baseline: 'middle' });
      } else if (cell.isTargetLower) {
        doc.setFillColor(lowerInfo.rgb[0], lowerInfo.rgb[1], lowerInfo.rgb[2]);
        doc.setDrawColor(lowerInfo.rgb[0], lowerInfo.rgb[1], lowerInfo.rgb[2]);
        doc.setLineWidth(isA5 ? 0.25 : 0.3);
        doc.circle(cx, cy, circleRadius, 'FD');

        const cellFontStyle: 'bold' | 'normal' = (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) ? 'bold' : 'normal';
        applyFont(doc, activeFont, cellFontStyle);
        doc.setFontSize(effectiveCellFontSize);
        doc.setTextColor(255, 255, 255);
        doc.text(cell.char, cx, cy, { align: 'center', baseline: 'middle' });
      } else {
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(180, 185, 195);
        doc.setLineWidth(isA5 ? 0.25 : 0.3);
        doc.circle(cx, cy, circleRadius, 'FD');

        const cellFontStyle: 'bold' | 'normal' = (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) ? 'bold' : 'normal';
        applyFont(doc, activeFont, cellFontStyle);
        doc.setFontSize(effectiveCellFontSize);
        doc.setTextColor(100, 116, 139);
        doc.text(cell.char, cx, cy, { align: 'center', baseline: 'middle' });
      }
    } else {
      // Normal Student Worksheet Mode: Crisp outline circle, letter in middle (WS 9 style)
      doc.setDrawColor(70, 70, 70);

      if (circleStyle === 'solid') {
        doc.setLineWidth(isA5 ? 0.25 : 0.3);
        doc.circle(cx, cy, circleRadius, 'S');
      } else if (circleStyle === 'dashed') {
        doc.setLineWidth(isA5 ? 0.25 : 0.3);
        setDocLineDash(doc, [1.5, 1.0]);
        doc.circle(cx, cy, circleRadius, 'S');
        setDocLineDash(doc, []);
      } else if (circleStyle === 'double') {
        doc.setLineWidth(isA5 ? 0.22 : 0.25);
        doc.circle(cx, cy, circleRadius, 'S');
        doc.circle(cx, cy, circleRadius - 0.6, 'S');
      }

      const cellFontStyle: 'bold' | 'normal' = (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) ? 'bold' : 'normal';
      applyFont(doc, activeFont, cellFontStyle);
      doc.setFontSize(effectiveCellFontSize);
      doc.setTextColor(30, 41, 59);
      doc.text(cell.char, cx, cy, { align: 'center', baseline: 'middle' });
    }
  }

  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);
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
    // Flexible boundary matching: handles terms with hyphens (e.g. yo-yo -> yo-yos), plurals and standard suffixes
    const termRegex = new RegExp(`(?<=[^a-zA-Z0-9]|^)(${escaped}(?:s|es|d|ed|ing)?)(?=[^a-zA-Z0-9]|$)`, 'i');
    let m = termRegex.exec(raw);
    if (!m) {
      const standardRegex = new RegExp(`\\b(${escaped})\\b`, 'i');
      m = standardRegex.exec(raw);
    }
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
  maxWidth: number,
  fontFamily?: string
): { lines: string[]; fontSize: number } {
  let currentFontSize = initialFontSize;
  applyFont(doc, fontFamily || 'KG Primary Dots', 'normal');
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
    applyFont(doc, fontFamily || 'KG Primary Dots', 'normal');
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

export function applyFont(doc: jsPDF, fontFamily?: string, style: 'normal' | 'bold' = 'normal') {
  if (style === 'bold') {
    doc.setFont('r0c0i Linotte', 'bold');
    return;
  }
  const f = fontFamily || 'r0c0i Linotte';
  switch (f) {
    case 'Farsan':
      doc.setFont('Farsan', 'normal');
      break;
    case 'HP001':
      doc.setFont('HP001', 'normal');
      break;
    case 'HLHOCTRO':
      doc.setFont('HLHOCTRO', 'normal');
      break;
    case 'Questrial':
      doc.setFont('Questrial', 'normal');
      break;
    case 'KG Primary Dots':
    case 'KGPrimaryDots':
      doc.setFont('KGPrimaryDots', 'normal');
      break;
    case 'r0c0i Linotte':
    case 'Linotte':
    default:
      doc.setFont('r0c0i Linotte', 'normal');
      break;
  }
}

export const TYPE3_HINT_PALETTE: [number, number, number][] = [
  [34, 197, 94],  // Green #22c55e (matching user reference)
  [239, 68, 68],  // Red #ef4444 (matching user reference)
  [59, 130, 246], // Blue #3b82f6 (matching user reference Image 3)
  [249, 115, 22], // Orange #f97316
  [168, 85, 247], // Purple #a855f7
  [236, 72, 153], // Pink #ec4899
  [20, 184, 166], // Teal #14b8a6
  [234, 179, 8],  // Amber #eab308
];

export function getType3DotColor(
  idx: number,
  isRightSide: boolean,
  hintMode?: MatchHintMode
): [number, number, number] {
  if (hintMode === 'match') {
    // Alternating Green and Red per pair (as in reference Image 1 & 4)
    return idx % 2 === 0 ? [34, 197, 94] : [239, 68, 68];
  } else if (hintMode === 'side') {
    // Left side is green, right side is red (as in reference Image 2 & 3)
    return !isRightSide ? [34, 197, 94] : [239, 68, 68];
  } else if (hintMode === 'multi') {
    // Each pair has its own distinct color
    return TYPE3_HINT_PALETTE[idx % TYPE3_HINT_PALETTE.length];
  } else {
    // Neutral clean standard charcoal/black dot
    return [50, 50, 50];
  }
}

/**
 * Split word into prefix and suffix according to user specification:
 * First column takes number of letters * 60% rounded up (Math.ceil(len * 0.6)).
 * Remaining letters go into second column.
 * Guaranteed: prefix >= 1 and suffix >= 1 as long as word length >= 2.
 */
export function splitLookMatchWriteTerm(term: string): { prefix: string; suffix: string } {
  const clean = (term || '').trim();
  const len = clean.length;
  if (len <= 1) {
    return { prefix: clean, suffix: '' };
  }
  // Formula: Math.ceil(len * 0.6)
  // Ensure both prefix and suffix have at least 1 character when len >= 2
  const prefixLen = Math.min(len - 1, Math.max(1, Math.ceil(len * 0.6)));
  const prefix = clean.slice(0, prefixLen);
  const suffix = clean.slice(prefixLen);
  return { prefix, suffix };
}

/**
 * Format term for self-write blank mode:
 * Each letter is represented by 2 underscores '__' separated by spaces.
 * Example: 'duck' (4 letters) -> '__  __  __  __'
 */
export function formatLookMatchWriteBlank(term: string): string {
  const clean = (term || '').trim();
  if (!clean) return '';
  return clean.split('').map(ch => ch === ' ' ? '   ' : '__').join('  ');
}

export interface Type3LookMatchWriteMetrics {
  rowContentHeight: number;
  rowGap: number;
  rowPitch: number;
  traceFontSize: number;
  prefixFontSize: number;
}

export function calculateType3LookMatchWriteMetrics(
  isA5: boolean,
  imgSize: number,
  fontSize: number = 12,
  spacing: number = 0,
  customTraceFontSize?: number
): Type3LookMatchWriteMetrics {
  const prefixFontSize = fontSize || 12;
  const traceFontSize = (customTraceFontSize !== undefined && customTraceFontSize > 0)
    ? customTraceFontSize
    : (isA5 ? 24 : 28);

  const fontHeightMm = prefixFontSize * 0.352778;
  const traceHeightMm = traceFontSize * 0.352778;
  const rowContentHeight = Math.max(imgSize, fontHeightMm, traceHeightMm) + (isA5 ? 2.5 : 3.5);

  const spacingMm = (spacing !== undefined ? spacing : 0) * 0.352778;
  // Spacing 0pt: compact 1.5mm gap (strictly tight and clean)
  // Spacing > 0pt: scales linearly with points
  const rowGap = (spacing === 0 ? 1.5 : 1.5 + spacingMm);
  const rowPitch = rowContentHeight + rowGap;

  return {
    rowContentHeight,
    rowGap,
    rowPitch,
    traceFontSize,
    prefixFontSize
  };
}

export function drawTargetLetterTitle(
  doc: jsPDF,
  title: string,
  targetLetter?: string,
  x: number = 12.7,
  y: number = 16.7,
  fontSizePt: number = 20,
  fontFamily: string = 'r0c0i Linotte'
) {
  doc.setFontSize(fontSizePt);
  applyFont(doc, fontFamily, 'bold');

  // Check if title contains <#...#> markup
  if (/<#[\s\S]*?#>/.test(title)) {
    const regex = /<#([\s\S]*?)#>/g;
    let lastIdx = 0;
    let match: RegExpExecArray | null;
    let curX = x;
    while ((match = regex.exec(title)) !== null) {
      if (match.index > lastIdx) {
        const seg = title.substring(lastIdx, match.index);
        doc.setTextColor(30, 41, 59);
        doc.text(seg, curX, y);
        curX += doc.getTextWidth(seg);
      }
      const redSeg = match[1];
      doc.setTextColor(220, 38, 38);
      doc.text(redSeg, curX, y);
      curX += doc.getTextWidth(redSeg);
      lastIdx = regex.lastIndex;
    }
    if (lastIdx < title.length) {
      const remaining = title.substring(lastIdx);
      doc.setTextColor(30, 41, 59);
      doc.text(remaining, curX, y);
    }
    doc.setTextColor(0, 0, 0);
    return;
  }

  // Otherwise, match targetLetter case-insensitively in title
  const cleanTarget = (targetLetter || 'V v').trim();
  const lowerTitle = title.toLowerCase();
  const lowerTarget = cleanTarget.toLowerCase();

  let matchIdx = -1;
  const letterMarker = 'letter';
  const lIdx = lowerTitle.indexOf(letterMarker);
  if (cleanTarget) {
    if (lIdx !== -1) {
      matchIdx = lowerTitle.indexOf(lowerTarget, lIdx + letterMarker.length);
    }
    if (matchIdx === -1) {
      matchIdx = lowerTitle.lastIndexOf(lowerTarget);
    }
  }

  if (matchIdx !== -1) {
    const before = title.slice(0, matchIdx);
    const matched = title.slice(matchIdx, matchIdx + cleanTarget.length);
    const after = title.slice(matchIdx + cleanTarget.length);

    let curX = x;
    doc.setTextColor(30, 41, 59);
    doc.text(before, curX, y);
    curX += doc.getTextWidth(before);

    doc.setTextColor(220, 38, 38); // Highlight bold red rgb(220, 38, 38)
    doc.text(matched, curX, y);
    curX += doc.getTextWidth(matched);

    doc.setTextColor(30, 41, 59);
    doc.text(after, curX, y);
    doc.setTextColor(0, 0, 0);
  } else {
    doc.setTextColor(30, 41, 59);
    doc.text(title, x, y);
    doc.setTextColor(0, 0, 0);
  }
}

/**
 * Helper to determine target letter indices for Type 4 Look and write
 * Handles 'alphabet_order' (from 'a' up to target letter, e.g. 'c' -> a, b, c)
 * and 'vowels_only' (a, e, i, o, u)
 */
export function getType4TargetLetterIndices(
  term: string,
  colMode: Type4ColumnMode,
  alphabetTargetLetter: string = 'c'
): { traceIndices: Set<number>, blankIndices: Set<number> } {
  const letters = term.trim().toLowerCase();
  const targetSet = new Set<number>();

  if (colMode === 'vowels_only') {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    for (let i = 0; i < letters.length; i++) {
      if (vowels.has(letters[i])) {
        targetSet.add(i);
      }
    }
  } else if (colMode === 'alphabet_order') {
    const targetChar = (alphabetTargetLetter && alphabetTargetLetter.trim().length > 0)
      ? alphabetTargetLetter.trim().toLowerCase()[0]
      : 'c';
    for (let i = 0; i < letters.length; i++) {
      const ch = letters[i];
      if (ch >= 'a' && ch <= targetChar) {
        targetSet.add(i);
      }
    }
  }

  // Fallback: if no character matched in the word, target the first alphabet letter
  if (targetSet.size === 0 && letters.length > 0) {
    for (let i = 0; i < letters.length; i++) {
      if (letters[i] >= 'a' && letters[i] <= 'z') {
        targetSet.add(i);
        break;
      }
    }
    if (targetSet.size === 0) targetSet.add(0);
  }

  return {
    traceIndices: targetSet,
    blankIndices: new Set(targetSet)
  };
}

/**
 * Draw a word cell for Worksheet Type 4 Table Mode (Look and write)
 * Supports initial/final trace and initial/final blank
 */
export function drawType4WordCell(
  doc: jsPDF,
  term: string,
  cellType: 'initial_trace' | 'initial_blank' | 'final_trace' | 'final_blank' | Type4CellConfig,
  startX: number,
  baselineY: number,
  fontSize: number,
  regularFont: string = 'r0c0i Linotte',
  traceFontSize: number = 28,
  isAnswerMode: boolean = false
) {
  const trimmed = term.trim();
  if (!trimmed) return;

  const firstChar = trimmed[0];
  const restAfterFirst = trimmed.slice(1);
  const lastChar = trimmed[trimmed.length - 1];
  const restBeforeLast = trimmed.slice(0, trimmed.length - 1);

  // Underline parameters for traced letter
  const underlineThickness = Math.max(0.38, Math.min(0.55, traceFontSize * 0.016));
  const underlineOffset = Math.max(0.9, traceFontSize * 0.038);
  const lineY = baselineY + underlineOffset;

  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(underlineThickness);

  if (typeof cellType === 'object') {
    if (cellType.mode === 'custom') {
      applyFont(doc, regularFont, 'normal');
      doc.setFontSize(fontSize);
      const spaceW = doc.getTextWidth(' ');
      const blankStr = '__';
      const blankW = doc.getTextWidth(blankStr);

      let curX = startX;
      for (let idx = 0; idx < trimmed.length; idx++) {
        const ch = trimmed[idx];
        if (cellType.traceIndices.has(idx)) {
          doc.setFont('KGPrimaryDots', 'normal');
          doc.setFontSize(traceFontSize);
          doc.setTextColor(30, 41, 59);
          const chW = doc.getTextWidth(ch);
          doc.text(ch, curX, baselineY);
          doc.line(curX, lineY, curX + chW, lineY);
          curX += chW + 0.8;
        } else if (cellType.blankIndices.has(idx)) {
          if (isAnswerMode) {
            applyFont(doc, regularFont, 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(220, 38, 38);
            const chW = doc.getTextWidth(ch);
            doc.text(ch, curX, baselineY);
            doc.line(curX, lineY, curX + chW, lineY);
            curX += chW + 0.6;
          } else {
            applyFont(doc, regularFont, 'normal');
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            if (idx > 0) {
              curX += cellType.blankIndices.has(idx - 1) ? spaceW * 0.55 : spaceW * 0.35;
            }
            doc.text(blankStr, curX, baselineY);
            curX += blankW;
            if (idx < trimmed.length - 1 && !cellType.blankIndices.has(idx + 1)) {
              curX += spaceW * 0.35;
            }
          }
        } else {
          applyFont(doc, regularFont, 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(0, 0, 0);
          doc.text(ch, curX, baselineY);
          curX += doc.getTextWidth(ch);
        }
      }
      return;
    } else {
      cellType = cellType.mode;
    }
  }

  if (cellType === 'initial_trace') {
    // 1. First char in KG Primary Dots (Trace) with traceFontSize (default 28pt)
    doc.setFont('KGPrimaryDots', 'normal');
    doc.setFontSize(traceFontSize);
    doc.setTextColor(30, 41, 59);
    const charW = doc.getTextWidth(firstChar);
    doc.text(firstChar, startX, baselineY);

    // Underline directly under the traced letter
    doc.line(startX, lineY, startX + charW, lineY);

    // 2. Rest in regular font (e.g. Linotte) at fontSize
    if (restAfterFirst) {
      applyFont(doc, regularFont, 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      const gap = 0.8;
      doc.text(restAfterFirst, startX + charW + gap, baselineY);
    }
  } else if (cellType === 'initial_blank') {
    if (isAnswerMode) {
      applyFont(doc, regularFont, 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(220, 38, 38);
      const charW = doc.getTextWidth(firstChar);
      doc.text(firstChar, startX, baselineY);
      doc.line(startX, lineY, startX + charW, lineY);

      if (restAfterFirst) {
        applyFont(doc, regularFont, 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(0, 0, 0);
        doc.text(restAfterFirst, startX + charW + 0.8, baselineY);
      }
    } else {
      // 2 underscore characters '__' for missing letter position
      applyFont(doc, regularFont, 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      const blankStr = '__';
      doc.text(blankStr, startX, baselineY);
      const blankW = doc.getTextWidth(blankStr);

      // Space before remaining letters
      const spaceW = doc.getTextWidth(' ');
      if (restAfterFirst) {
        doc.text(restAfterFirst, startX + blankW + spaceW, baselineY);
      }
    }
  } else if (cellType === 'final_trace') {
    // 1. Rest before last in regular font at fontSize
    applyFont(doc, regularFont, 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    const restW = restBeforeLast ? doc.getTextWidth(restBeforeLast) : 0;
    if (restBeforeLast) {
      doc.text(restBeforeLast, startX, baselineY);
    }

    // Small gap before final traced letter
    const gap = restBeforeLast ? 0.8 : 0;
    const charX = startX + restW + gap;

    // 2. Last char in KG Primary Dots with traceFontSize (default 28pt)
    doc.setFont('KGPrimaryDots', 'normal');
    doc.setFontSize(traceFontSize);
    doc.setTextColor(30, 41, 59);
    const charW = doc.getTextWidth(lastChar);
    doc.text(lastChar, charX, baselineY);

    // Underline under the traced last letter
    doc.line(charX, lineY, charX + charW, lineY);
  } else if (cellType === 'final_blank') {
    // 1. Rest before last in regular font at fontSize
    applyFont(doc, regularFont, 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(0, 0, 0);
    const restW = restBeforeLast ? doc.getTextWidth(restBeforeLast) : 0;
    if (restBeforeLast) {
      doc.text(restBeforeLast, startX, baselineY);
    }

    if (isAnswerMode) {
      const charX = startX + (restBeforeLast ? restW + 0.8 : 0);
      applyFont(doc, regularFont, 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(220, 38, 38);
      const charW = doc.getTextWidth(lastChar);
      doc.text(lastChar, charX, baselineY);
      doc.line(charX, lineY, charX + charW, lineY);
    } else {
      // Space before '__'
      const spaceW = restBeforeLast ? doc.getTextWidth(' ') : 0;
      const blankX = startX + restW + spaceW;

      // 2 underscore characters '__'
      const blankStr = '__';
      doc.text(blankStr, blankX, baselineY);
    }
  }
}

interface SentenceToken {
  text: string;
  isHighlighted: boolean;
}

/**
 * Helper to layout and measure highlighted sentence lines without drawing,
 * returning line tokens, linePitch, and totalHeight.
 * Includes orphan punctuation protection so ., !, ? never wrap alone.
 */
export function measureHighlightedSentenceLines(
  doc: jsPDF,
  spans: HighlightedSpan[],
  boxWidth: number,
  fontSizePt: number,
  fontFamily?: string
) {
  doc.setFontSize(fontSizePt);
  applyFont(doc, fontFamily, 'normal');

  const tokens: SentenceToken[] = [];
  for (const span of spans) {
    const parts = span.text.split(/(\s+)/);
    for (const part of parts) {
      if (part.length > 0) {
        tokens.push({ text: part, isHighlighted: span.isHighlighted });
      }
    }
  }

  const maxLineWidth = Math.max(10, boxWidth - 3);
  const lines: SentenceToken[][] = [];
  let curLine: SentenceToken[] = [];
  let curLineWidth = 0;

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token.text);
    const isPunct = /^[.,!?;:]+$/.test(token.text);
    applyFont(doc, fontFamily, token.isHighlighted ? 'bold' : 'normal');
    const tokenW = isSpace ? doc.getTextWidth(' ') : doc.getTextWidth(token.text);

    if (curLine.length === 0) {
      if (!isSpace) {
        curLine.push(token);
        curLineWidth += tokenW;
      }
    } else {
      if (curLineWidth + tokenW <= maxLineWidth || (isPunct && curLineWidth + tokenW <= maxLineWidth + 2.5) || isSpace) {
        curLine.push(token);
        curLineWidth += tokenW;
      } else {
        while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
          curLine.pop();
        }
        if (isPunct && curLine.length > 0) {
          const lastWord = curLine.pop()!;
          while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
            curLine.pop();
          }
          lines.push(curLine);
          curLine = [lastWord, token];
          applyFont(doc, fontFamily, lastWord.isHighlighted ? 'bold' : 'normal');
          const lastWordW = doc.getTextWidth(lastWord.text);
          curLineWidth = lastWordW + tokenW;
        } else {
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
  }
  if (curLine.length > 0) {
    while (curLine.length > 0 && /^\s+$/.test(curLine[curLine.length - 1].text)) {
      curLine.pop();
    }
    if (curLine.length > 0) {
      lines.push(curLine);
    }
  }

  const linePitch = fontSizePt * 0.352778 * 1.25;
  const totalHeight = Math.max(1, lines.length) * linePitch;
  return { lines, linePitch, totalHeight };
}

function drawHighlightedCenteredSentence(
  doc: jsPDF,
  spans: HighlightedSpan[],
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  fontSizePt: number,
  fontFamily?: string
) {
  const { lines, linePitch, totalHeight } = measureHighlightedSentenceLines(
    doc,
    spans,
    boxWidth,
    fontSizePt,
    fontFamily
  );

  if (lines.length === 0) return { linesCount: 0, totalHeight: 0, linePitch };

  const startY = boxY + (boxHeight > 0 ? Math.max(0, (boxHeight - totalHeight) / 2) : 0) + linePitch * 0.75;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    let lineWidth = 0;
    for (const t of line) {
      const isSpace = /^\s+$/.test(t.text);
      applyFont(doc, fontFamily, t.isHighlighted ? 'bold' : 'normal');
      lineWidth += isSpace ? doc.getTextWidth(' ') : doc.getTextWidth(t.text);
    }

    let curX = boxX + (boxWidth - lineWidth) / 2;
    const curY = startY + l * linePitch;

    for (const t of line) {
      const isSpace = /^\s+$/.test(t.text);
      applyFont(doc, fontFamily, t.isHighlighted ? 'bold' : 'normal');
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
  applyFont(doc, fontFamily, 'normal');
  return { linesCount: lines.length, totalHeight, linePitch };
}

/**
 * Draws Type 15 sentence line above the card:
 * - Number style (optional, e.g. "1. ") in slate-800 bold
 * - Vocabulary highlighted in red (220, 38, 38) bold, exactly like Type 3
 * - Other words in sentence in slate-800 (30, 41, 59) normal
 * - Automatic font scaling so full line fits comfortably within cardWidth
 */
function drawType15SentenceLine(
  doc: jsPDF,
  spans: HighlightedSpan[],
  numText: string | null,
  cardX: number,
  textY: number,
  cardWidth: number,
  baseFontSize: number,
  fontFamily?: string
) {
  // Flatten spans into tokens, separating spaces so we can preserve exact font and spacing
  const tokens: SentenceToken[] = [];
  for (const span of spans) {
    const parts = span.text.split(/(\s+)/);
    for (const part of parts) {
      if (part.length > 0) {
        tokens.push({ text: part, isHighlighted: span.isHighlighted });
      }
    }
  }

  // Calculate required font size so that (numText + sentence) fits within cardWidth
  const maxAllowedWidth = Math.max(10, cardWidth - 1.0);
  let sentFontSize = baseFontSize;

  const measureLineWidth = (size: number) => {
    doc.setFontSize(size);
    let totalW = 0;
    if (numText) {
      applyFont(doc, fontFamily, 'bold');
      totalW += doc.getTextWidth(numText) + 0.8;
    }
    for (const t of tokens) {
      const isSpace = /^\s+$/.test(t.text);
      applyFont(doc, fontFamily, t.isHighlighted ? 'bold' : 'normal');
      totalW += isSpace ? doc.getTextWidth(' ') : doc.getTextWidth(t.text);
    }
    return totalW;
  };

  while (measureLineWidth(sentFontSize) > maxAllowedWidth && sentFontSize > 6.5) {
    sentFontSize -= 0.5;
  }

  doc.setFontSize(sentFontSize);

  let curX = cardX;

  // Draw traditional numbering if enabled (e.g. "1. ")
  if (numText) {
    applyFont(doc, fontFamily, 'bold');
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text(numText, curX, textY);
    curX += doc.getTextWidth(numText) + 0.8;
  }

  // Draw tokens: highlighted vocabulary in red (220, 38, 38), others in slate-800 (30, 41, 59)
  for (const t of tokens) {
    const isSpace = /^\s+$/.test(t.text);
    applyFont(doc, fontFamily, t.isHighlighted ? 'bold' : 'normal');
    if (isSpace) {
      curX += doc.getTextWidth(' ');
    } else {
      if (t.isHighlighted) {
        doc.setTextColor(220, 38, 38); // Highlight red exactly as Type 3
      } else {
        doc.setTextColor(30, 41, 59); // Normal dark slate
      }
      doc.text(t.text, curX, textY);
      curX += doc.getTextWidth(t.text);
    }
  }

  doc.setTextColor(0, 0, 0);
  applyFont(doc, fontFamily, 'normal');
}

const COMMON_COMPOUND_WORDS: Record<string, string[]> = {
  volleyball: ['volley', 'ball'],
  football: ['foot', 'ball'],
  basketball: ['basket', 'ball'],
  baseball: ['base', 'ball'],
  butterfly: ['butter', 'fly'],
  sunflower: ['sun', 'flower'],
  bedroom: ['bed', 'room'],
  classroom: ['class', 'room'],
  bathroom: ['bath', 'room'],
  livingroom: ['living', 'room'],
  playground: ['play', 'ground'],
  skateboard: ['skate', 'board'],
  watermelon: ['water', 'melon'],
  pancake: ['pan', 'cake'],
  rainbow: ['rain', 'bow'],
  seafood: ['sea', 'food'],
  sunshine: ['sun', 'shine'],
  starfish: ['star', 'fish'],
  jellyfish: ['jelly', 'fish'],
  popcorn: ['popcorn'] // Single word unit as shown in textbook reference
};

export function formatSingleSubWord(word: string): string {
  const clean = word.trim();
  if (!clean) return '';
  if (clean.includes('_')) return clean; // Already formatted by teacher

  const chars = clean.split('');
  if (chars.length <= 1) return clean;

  // 1. Check if word ends with silent 'e' and length >= 7 (like 'village')
  // or length >= 8: give first and last letter
  const isEndsWithE = clean.toLowerCase().endsWith('e');
  const showFirstAndLast = (chars.length >= 7 && isEndsWithE) || chars.length >= 8;

  if (showFirstAndLast) {
    const first = chars[0];
    const last = chars[chars.length - 1];
    const middleBlanks = Array(chars.length - 2).fill('__').join(' ');
    return `${first} ${middleBlanks} ${last}`;
  } else {
    // Show first letter, remaining are blanks
    const first = chars[0];
    const remainingBlanks = Array(chars.length - 1).fill('__').join(' ');
    return `${first} ${remainingBlanks}`;
  }
}

export function formatLookAndWriteTerm(term: string): string {
  const clean = (term || '').trim();
  if (!clean) return '';
  if (clean.includes('__')) return clean; // Already custom blanks

  // If term has multiple words separated by space or hyphen (e.g. "ice cream", "yo-yo")
  if (/\s+|-/.test(clean)) {
    const separator = clean.includes('-') ? '-' : ' ';
    const parts = clean.split(separator === '-' ? '-' : /\s+/);
    return parts.map(formatSingleSubWord).join(separator === '-' ? ' - ' : ' ');
  }

  // Check known compound words (like volleyball -> volley + ball)
  const lower = clean.toLowerCase();
  if (COMMON_COMPOUND_WORDS[lower] && COMMON_COMPOUND_WORDS[lower].length > 1) {
    const subWords = COMMON_COMPOUND_WORDS[lower];
    return subWords.map(formatSingleSubWord).join(' ');
  }

  return formatSingleSubWord(clean);
}

export function getLookAndWriteSentence(word: WorksheetWord): { fullSentence: string; isCustom: boolean } | null {
  const term = (word.term || '').trim();
  const blankedTerm = formatLookAndWriteTerm(term);

  const rawSentence = (word.exampleSentence || '').trim();
  if (!rawSentence) {
    return null; // As agreed with user: No fake sentences! Just display image + blanked term below.
  }

  // 1. If sentence contains <#...#>:
  if (/<#[\s\S]*?#>/.test(rawSentence)) {
    const replaced = rawSentence.replace(/<#([\s\S]*?)#>/g, (_match, inner) => {
      const trimmedInner = inner.trim();
      if (trimmedInner.includes('_')) {
        return trimmedInner; // Teacher already provided blank syntax
      }
      return formatLookAndWriteTerm(trimmedInner);
    });
    return { fullSentence: replaced, isCustom: true };
  }

  // 2. If sentence contains the term directly (case-insensitive word boundary)
  if (term.length > 0) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const termRegex = new RegExp(`\\b${escaped}\\b`, 'i');
    if (termRegex.test(rawSentence)) {
      const replaced = rawSentence.replace(termRegex, blankedTerm);
      return { fullSentence: replaced, isCustom: false };
    }
  }

  // 3. If rawSentence doesn't contain term, check if it already has blanks
  if (rawSentence.includes('_')) {
    return { fullSentence: rawSentence, isCustom: true };
  }

  // 4. Otherwise, append blanked term to sentence or return as is
  return { fullSentence: `${rawSentence} ${blankedTerm}`, isCustom: false };
}

export function drawLookAndWriteSentence(
  doc: jsPDF,
  sentence: string,
  boxX: number,
  boxY: number,
  boxWidth: number,
  boxHeight: number,
  fontSizePt: number,
  fontFamily?: string
) {
  doc.setFontSize(fontSizePt);
  applyFont(doc, fontFamily, 'normal');
  doc.setTextColor(30, 41, 59);

  // Split tokens by spaces to wrap lines nicely
  const words = sentence.trim().split(/\s+/);
  const maxLineWidth = Math.max(10, boxWidth - 4);
  const lines: string[] = [];
  let curLine = '';

  for (const w of words) {
    const testLine = curLine ? `${curLine} ${w}` : w;
    if (doc.getTextWidth(testLine) <= maxLineWidth) {
      curLine = testLine;
    } else {
      if (curLine) lines.push(curLine);
      curLine = w;
    }
  }
  if (curLine) lines.push(curLine);
  if (lines.length === 0) return;

  const linePitch = fontSizePt * 0.352778 * 1.3;
  const totalH = lines.length * linePitch;
  const startY = boxY + (boxHeight - totalH) / 2 + linePitch * 0.75;

  lines.forEach((lineText, lIdx) => {
    doc.text(lineText, boxX + boxWidth / 2, startY + lIdx * linePitch, { align: 'center' });
  });

  doc.setTextColor(0, 0, 0);
}

export const WORDSEARCH_DIRECTION_MAP: Record<WordsearchDirection, { dr: number; dc: number; label: string }> = {
  horizontal: { dr: 0, dc: 1, label: 'Ngang (→)' },
  vertical: { dr: 1, dc: 0, label: 'Dọc (↓)' },
  diagonalDown: { dr: 1, dc: 1, label: 'Xéo từ trên xuống (↘)' },
  diagonalUp: { dr: -1, dc: 1, label: 'Xéo từ dưới lên (↗)' }
};

export function generateWordsearchPuzzle(
  words: WorksheetWord[],
  allowedDirections: WordsearchDirection[] = ['horizontal', 'vertical', 'diagonalDown'],
  gridSizeOption: number | 'auto' = 'auto',
  wordsearchCase: WordsearchCase = 'lower'
): WordsearchPuzzleResult {
  const isUpper = wordsearchCase === 'upper';
  const validWords = words
    .map((w) => ({
      word: w,
      cleanTerm: isUpper
        ? (w.term || '').replace(/[^a-zA-Z]/g, '').toUpperCase()
        : (w.term || '').replace(/[^a-zA-Z]/g, '').toLowerCase()
    }))
    .filter((item) => item.cleanTerm.length >= 2);

  if (validWords.length === 0) {
    return {
      grid: [[isUpper ? 'A' : 'a']],
      rows: 1,
      cols: 1,
      placedWords: [],
      unplacedWords: words
    };
  }

  const dirs: WordsearchDirection[] = allowedDirections && allowedDirections.length > 0
    ? allowedDirections
    : ['horizontal', 'vertical'];

  // Sort words by length descending (longest first are hardest to fit)
  const sortedWords = [...validWords].sort((a, b) => b.cleanTerm.length - a.cleanTerm.length);
  const maxWordLength = sortedWords[0].cleanTerm.length;
  const totalLetters = sortedWords.reduce((sum, item) => sum + item.cleanTerm.length, 0);

  let baseSize: number;
  if (typeof gridSizeOption === 'number' && gridSizeOption >= 4) {
    baseSize = Math.max(gridSizeOption, maxWordLength);
  } else {
    const minNeeded = Math.ceil(Math.sqrt(totalLetters * 1.75));
    baseSize = Math.max(maxWordLength, minNeeded, 8);
  }

  let currentSize = baseSize;
  let bestResult: { grid: string[][]; placedWords: PlacedWordInfo[]; unplacedWords: WorksheetWord[] } | null = null;
  const letters = isUpper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : 'abcdefghijklmnopqrstuvwxyz';

  for (let sizeAttempt = 0; sizeAttempt < 8; sizeAttempt++) {
    const R = currentSize;
    const C = currentSize;

    for (let attempt = 0; attempt < 50; attempt++) {
      const grid: (string | null)[][] = Array.from({ length: R }, () => Array(C).fill(null));
      const placed: PlacedWordInfo[] = [];
      const dirCounts: Record<WordsearchDirection, number> = {
        horizontal: 0,
        vertical: 0,
        diagonalDown: 0,
        diagonalUp: 0
      };
      let allPlaced = true;

      for (const item of sortedWords) {
        const term = item.cleanTerm;
        const len = term.length;
        const placementsByDir = new Map<WordsearchDirection, { r: number; c: number; dir: WordsearchDirection }[]>();

        for (const dir of dirs) {
          const { dr, dc } = WORDSEARCH_DIRECTION_MAP[dir];
          const minR = dr === -1 ? len - 1 : 0;
          const maxR = dr === 1 ? R - len : R - 1;
          const minC = dc === -1 ? len - 1 : 0;
          const maxC = dc === 1 ? C - len : C - 1;

          const dirPlacements: { r: number; c: number; dir: WordsearchDirection }[] = [];
          for (let r = minR; r <= maxR; r++) {
            for (let c = minC; c <= maxC; c++) {
              let canPlace = true;
              for (let k = 0; k < len; k++) {
                const cellVal = grid[r + dr * k][c + dc * k];
                if (cellVal !== null && cellVal !== term[k]) {
                  canPlace = false;
                  break;
                }
              }
              if (canPlace) {
                dirPlacements.push({ r, c, dir });
              }
            }
          }
          if (dirPlacements.length > 0) {
            placementsByDir.set(dir, dirPlacements);
          }
        }

        if (placementsByDir.size === 0) {
          allPlaced = false;
          break;
        }

        // Fair Direction Balancing:
        // Prioritize directions that currently have the lowest usage count among available directions.
        // This guarantees that if the user ticks "Xéo lên (↗)", diagonal words are guaranteed to appear
        // rather than being crowded out by horizontal/vertical placements.
        const availableDirs = Array.from(placementsByDir.keys());
        const minUsage = Math.min(...availableDirs.map((d) => dirCounts[d]));
        const candidateDirs = availableDirs.filter((d) => dirCounts[d] === minUsage);

        const chosenDir = candidateDirs[Math.floor(Math.random() * candidateDirs.length)];
        const candidatePlacements = placementsByDir.get(chosenDir)!;
        const pick = candidatePlacements[Math.floor(Math.random() * candidatePlacements.length)];

        const { dr, dc } = WORDSEARCH_DIRECTION_MAP[pick.dir];
        for (let k = 0; k < len; k++) {
          grid[pick.r + dr * k][pick.c + dc * k] = term[k];
        }

        dirCounts[pick.dir]++;
        placed.push({
          word: item.word,
          cleanTerm: term,
          startR: pick.r,
          startC: pick.c,
          endR: pick.r + dr * (len - 1),
          endC: pick.c + dc * (len - 1),
          direction: pick.dir
        });
      }

      if (allPlaced && placed.length === sortedWords.length) {
        const finalGrid: string[][] = grid.map((row) =>
          row.map((cell) => (cell !== null ? cell : letters[Math.floor(Math.random() * letters.length)]))
        );

        return {
          grid: finalGrid,
          rows: R,
          cols: C,
          placedWords: placed,
          unplacedWords: []
        };
      }

      if (!bestResult || placed.length > bestResult.placedWords.length) {
        const finalGrid: string[][] = grid.map((row) =>
          row.map((cell) => (cell !== null ? cell : letters[Math.floor(Math.random() * letters.length)]))
        );
        const placedTerms = new Set(placed.map((p) => p.cleanTerm));
        const unplaced = sortedWords.filter((w) => !placedTerms.has(w.cleanTerm)).map((w) => w.word);
        bestResult = { grid: finalGrid, placedWords: placed, unplacedWords: unplaced };
      }
    }

    currentSize += 1;
  }

  return {
    grid: bestResult ? bestResult.grid : Array.from({ length: baseSize }, () => Array(baseSize).fill(isUpper ? 'A' : 'a')),
    rows: bestResult ? bestResult.grid.length : baseSize,
    cols: bestResult ? bestResult.grid[0].length : baseSize,
    placedWords: bestResult ? bestResult.placedWords : [],
    unplacedWords: bestResult ? bestResult.unplacedWords : words
  };
}

export function drawWordsearchGrid(
  doc: jsPDF,
  grid: string[][],
  startX: number,
  startY: number,
  cellSize: number,
  activeFont: string,
  gridBorder: WordsearchGridBorder = 'none',
  fontSize: number = 12,
  isAnswerMode: boolean = false,
  placedWords?: PlacedWordInfo[]
) {
  const rows = grid.length;
  const cols = grid[0].length;

  const placedCellKeys = new Set<string>();
  if (isAnswerMode && placedWords && placedWords.length > 0) {
    for (const pw of placedWords) {
      const { dr, dc } = WORDSEARCH_DIRECTION_MAP[pw.direction];
      for (let step = 0; step < pw.cleanTerm.length; step++) {
        const r = pw.startR + step * dr;
        const c = pw.startC + step * dc;
        placedCellKeys.add(`${r},${c}`);
      }
    }
  }

  if (gridBorder === 'full') {
    // Both outer border and inner cell borders drawn with small dotted lines
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.25);
    setDocLineDash(doc, [0.3, 0.7]);

    const gridW = cols * cellSize;
    const gridH = rows * cellSize;

    // Horizontal inner cell borders (single-pass dotted line)
    for (let r = 1; r < rows; r++) {
      const y = startY + r * cellSize;
      doc.line(startX, y, startX + gridW, y);
    }

    // Vertical inner cell borders (single-pass dotted line)
    for (let c = 1; c < cols; c++) {
      const x = startX + c * cellSize;
      doc.line(x, startY, x, startY + gridH);
    }

    // Outer border with slightly more visible dotted accent
    doc.setLineWidth(0.4);
    setDocLineDash(doc, [0.4, 0.8]);
    doc.rect(startX, startY, gridW, gridH);
    setDocLineDash(doc, []); // Reset dash pattern
  } else if (gridBorder === 'outerOnly') {
    // Khung viền ngoài không viền trong — dotted outer rectangle border, no interior cell lines
    doc.setDrawColor(148, 163, 184); // slate-400
    doc.setLineWidth(0.4);
    setDocLineDash(doc, [0.4, 0.8]);
    doc.rect(startX, startY, cols * cellSize, rows * cellSize);
    setDocLineDash(doc, []); // Reset dash pattern
  }
  // gridBorder === 'none': only the matrix of letters, no grid lines

  // Draw centered letters in each cell: strictly respect user-selected fontSize
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = startX + c * cellSize;
      const y = startY + r * cellSize;
      const letter = grid[r][c];
      const isPlacedCell = isAnswerMode && placedCellKeys.has(`${r},${c}`);

      if (isPlacedCell) {
        doc.setFillColor(254, 226, 226); // soft red-100
        doc.setDrawColor(239, 68, 68); // red-500
        doc.setLineWidth(0.2);
        setDocLineDash(doc, []);
        doc.roundedRect(x + 0.3, y + 0.3, cellSize - 0.6, cellSize - 0.6, 1.0, 1.0, 'FD');

        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(220, 38, 38);
      } else {
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(fontSize);
        doc.setTextColor(30, 41, 59);
      }
      // True 2D Centering: horizontal center (align: center) and vertical center (baseline: middle)
      doc.text(letter, x + cellSize / 2, y + cellSize / 2, { align: 'center', baseline: 'middle' });
    }
  }

  doc.setTextColor(0, 0, 0);
}

export interface WordsearchHintsMetrics {
  hintsTotalH: number;
  itemPitch: number;
  itemH: number;
  itemGap: number;
  maxPerCol: number;
  hasWrappingWords: boolean;
  hasLongLabels: boolean;
  labelAreaH: number;
  lineAreaH: number;
  boxSize: number;
  maxTextW: number;
}

export function calculateWordsearchHintsMetrics(
  words: { cleanTerm?: string; term?: string }[],
  hintType: WordsearchHintType,
  activeFontSize: number,
  isA5: boolean,
  colW: number,
  totalGridH: number,
  doc?: jsPDF,
  activeFont: string = 'r0c0i Linotte',
  wordsearchCase: WordsearchCase = 'lower',
  imageSize: number = 12.7
): WordsearchHintsMetrics {
  const half = Math.ceil(words.length / 2);
  const maxPerCol = Math.max(half, 1);
  const fontHeightMm = activeFontSize * 0.352778;
  const itemGap = isA5 ? 2.0 : 3.0;
  const imgDim = imageSize || 12.7;
  const gapBelowImg = 1.8;

  let hasWrappingWords = false;
  let hasLongLabels = false;
  let boxSize = 0;
  let maxTextW = 0;
  let lineAreaH = 0;
  let labelAreaH = 0;
  let itemH = 0;
  let itemPitch = 0;
  let hintsTotalH = 0;

  if (hintType === 'word') {
    // Checkbox is completely eliminated
    boxSize = 0;
    maxTextW = Math.max(10, colW - 2.0);

    if (doc) {
      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(activeFontSize);
      hasWrappingWords = words.some((pw) => {
        const rawTerm = pw.cleanTerm || pw.term || '';
        const term = wordsearchCase === 'upper' ? rawTerm.toUpperCase() : rawTerm.toLowerCase();
        // Numbering prefix is completely eliminated
        return doc.getTextWidth(term) > maxTextW;
      });
    }

    const minItemH = hasWrappingWords
      ? Math.max(fontHeightMm * 2 + 2.5, 9.0)
      : Math.max(fontHeightMm + 2.5, 6.0);
    // Natural pitch prevents excessive stretching when word count is small (e.g. 2-4 words)
    const naturalPitch = hasWrappingWords
      ? Math.max(fontHeightMm * 2 + 3.0, 9.5)
      : Math.max(fontHeightMm + 3.0, 7.5);
    const maxPitch = Math.max(naturalPitch, 9.5);
    itemPitch = Math.min(maxPitch, Math.max(naturalPitch, totalGridH / maxPerCol));
    itemH = minItemH;
    hintsTotalH = words.length === 0 ? 0 : maxPerCol * itemPitch;
  } else if (hintType === 'image') {
    // Dotted underline and numbering are completely eliminated
    lineAreaH = 0;
    itemH = imgDim;
    itemPitch = itemH + itemGap;
    hintsTotalH = words.length === 0 ? 0 : maxPerCol * itemPitch - itemGap;
  } else {
    // 'both'
    if (doc) {
      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(activeFontSize);
      hasLongLabels = words.some((pw) => {
        const rawTerm = pw.cleanTerm || pw.term || '';
        const term = wordsearchCase === 'upper' ? rawTerm.toUpperCase() : rawTerm.toLowerCase();
        // Numbering prefix is completely eliminated
        return doc.getTextWidth(term) > colW;
      });
    }

    labelAreaH = hasLongLabels
      ? Math.max(fontHeightMm * 2 + gapBelowImg + 1.5, 8.5)
      : Math.max(fontHeightMm + gapBelowImg + 1.2, 5.5);
    itemH = imgDim + labelAreaH;
    itemPitch = itemH + itemGap;
    hintsTotalH = words.length === 0 ? 0 : maxPerCol * itemPitch - itemGap;
  }

  return {
    hintsTotalH,
    itemPitch,
    itemH,
    itemGap,
    maxPerCol,
    hasWrappingWords,
    hasLongLabels,
    labelAreaH,
    lineAreaH,
    boxSize,
    maxTextW
  };
}

export async function drawWordsearchHints(
  doc: jsPDF,
  placedWords: PlacedWordInfo[],
  hintType: WordsearchHintType,
  startY: number,
  printableWidth: number,
  margin: number,
  isA5: boolean,
  activeFont: string,
  wordImagesMap?: Map<string, string | null>,
  options?: {
    gridStartX?: number;
    totalGridW?: number;
    totalGridH?: number;
    fontSize?: number;
    showImageBorder?: boolean;
    gapX?: number;
    wordsearchCase?: WordsearchCase;
    imageSize?: number;
    isAnswerMode?: boolean;
  }
): Promise<number> {
  const activeFontSize = options?.fontSize ?? (isA5 ? 11 : 12);
  const wordsearchCase: WordsearchCase = options?.wordsearchCase || 'lower';
  const showImageBorder = options?.showImageBorder ?? false;
  const minGap = options?.gapX ?? (isA5 ? 2.5 : 3.0);
  const imgSize = options?.imageSize || 12.7;

  const totalGridW = options?.totalGridW ?? (printableWidth * 0.5);
  const gridStartX = options?.gridStartX ?? (margin + (printableWidth - totalGridW) / 2);
  const gridEndX = gridStartX + totalGridW;
  const totalGridH = options?.totalGridH ?? 60;

  // Space-Evenly 3-part layout:
  // [Left Margin] -gap- [Left Column] -gap- [Puzzle Grid] -gap- [Right Column] -gap- [Right Margin]
  const leftSpace = Math.max(10, gridStartX - margin);
  const rightSpace = Math.max(10, margin + printableWidth - gridEndX);
  const availableSideSpace = Math.min(leftSpace, rightSpace);

  // Measure longest word width
  let maxWordW = 0;
  if (doc && placedWords.length > 0) {
    applyFont(doc, activeFont, 'bold');
    doc.setFontSize(activeFontSize);
    for (const pw of placedWords) {
      const rawTerm = pw.cleanTerm || pw.word?.term || '';
      const term = wordsearchCase === 'upper' ? rawTerm.toUpperCase() : rawTerm.toLowerCase();
      const w = doc.getTextWidth(term);
      if (w > maxWordW) maxWordW = w;
    }
  }

  // Determine flanking column width W_flank
  const maxPossibleFlankW = Math.max(10, availableSideSpace - 2 * minGap);
  let flankW = 14.0;
  if (hintType === 'word') {
    const idealW = Math.max(20.0, maxWordW + 4.0);
    flankW = Math.max(12.0, Math.min(idealW, maxPossibleFlankW));
  } else if (hintType === 'image') {
    flankW = Math.max(13.0, Math.min(14.0, maxPossibleFlankW));
  } else {
    // 'both'
    const idealW = Math.max(14.0, maxWordW + 4.0);
    flankW = Math.max(13.0, Math.min(idealW, maxPossibleFlankW));
  }

  // Calculate 4 equal gaps: gap = (availableSideSpace - flankW) / 2
  const gap = Math.max(minGap, (availableSideSpace - flankW) / 2);

  // Positions of Left Column and Right Column
  const leftColX = margin + gap;
  const leftColW = flankW;
  const rightColX = gridEndX + gap;
  const rightColW = flankW;
  const colW = flankW;

  const metrics = calculateWordsearchHintsMetrics(
    placedWords,
    hintType,
    activeFontSize,
    isA5,
    colW,
    totalGridH,
    doc,
    activeFont,
    wordsearchCase,
    imgSize
  );
  const { itemPitch, itemGap } = metrics;

  const half = Math.ceil(placedWords.length / 2);
  const leftWords = placedWords.slice(0, half);
  const rightWords = placedWords.slice(half);

  // Helper to render one flanking column (left or right)
  const renderColumn = async (
    words: PlacedWordInfo[],
    colX: number,
    colWidth: number,
    side: 'left' | 'right'
  ) => {
    if (words.length === 0) return startY;

    if (hintType === 'word') {
      for (let i = 0; i < words.length; i++) {
        const pw = words[i];
        const itemY = startY + i * itemPitch;
        const itemCenterY = itemY + itemPitch / 2;

        // Word text without numbering and without checkbox
        // Symmetrical alignment: Left column aligns right (towards grid); Right column aligns left (towards grid)
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(activeFontSize);
        if (options?.isAnswerMode) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(30, 41, 59);
        }
        const wordText = wordsearchCase === 'upper' ? pw.cleanTerm.toUpperCase() : pw.cleanTerm.toLowerCase();
        const textMaxW = Math.max(8, colWidth - 2.0);

        if (side === 'left') {
          const textX = colX + colWidth - 1.0;
          doc.text(
            wordText,
            textX,
            itemCenterY,
            { align: 'right', baseline: 'middle', maxWidth: textMaxW }
          );
        } else {
          const textX = colX + 1.0;
          doc.text(
            wordText,
            textX,
            itemCenterY,
            { align: 'left', baseline: 'middle', maxWidth: textMaxW }
          );
        }
      }
      return startY + words.length * itemPitch;
    } else if (hintType === 'image') {
      const imgDim = imgSize;

      for (let i = 0; i < words.length; i++) {
        const pw = words[i];
        const itemY = startY + i * itemPitch;

        // Render standardized image centered in colWidth
        const imgX = colX + (colWidth - imgDim) / 2;
        const imgY = itemY;

        let imgData: string | null = null;
        if (wordImagesMap && pw.word.imageUrl && wordImagesMap.has(pw.word.imageUrl)) {
          imgData = wordImagesMap.get(pw.word.imageUrl) || null;
        } else if (pw.word.imageUrl) {
          imgData = await fetchImageAsBase64(pw.word.imageUrl);
        }

        if (imgData) {
          try {
            doc.addImage(imgData, 'JPEG', imgX, imgY, imgDim, imgDim);
            if (showImageBorder) {
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.2);
              doc.rect(imgX, imgY, imgDim, imgDim);
            }
          } catch {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.rect(imgX, imgY, imgDim, imgDim);
          }
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.rect(imgX, imgY, imgDim, imgDim);
        }
        // Dotted underline line and numbering below image are completely eliminated as required
      }
      return startY + words.length * itemPitch - itemGap;
    } else {
      // hintType === 'both'
      const imgDim = imgSize;
      const gapBelowImg = 1.8;

      for (let i = 0; i < words.length; i++) {
        const pw = words[i];
        const itemY = startY + i * itemPitch;

        // Render standardized image centered in colWidth
        const imgX = colX + (colWidth - imgDim) / 2;
        const imgY = itemY;

        let imgData: string | null = null;
        if (wordImagesMap && pw.word.imageUrl && wordImagesMap.has(pw.word.imageUrl)) {
          imgData = wordImagesMap.get(pw.word.imageUrl) || null;
        } else if (pw.word.imageUrl) {
          imgData = await fetchImageAsBase64(pw.word.imageUrl);
        }

        if (imgData) {
          try {
            doc.addImage(imgData, 'JPEG', imgX, imgY, imgDim, imgDim);
            if (showImageBorder) {
              doc.setDrawColor(203, 213, 225);
              doc.setLineWidth(0.2);
              doc.rect(imgX, imgY, imgDim, imgDim);
            }
          } catch {
            doc.setDrawColor(203, 213, 225);
            doc.setLineWidth(0.2);
            doc.rect(imgX, imgY, imgDim, imgDim);
          }
        } else {
          doc.setDrawColor(203, 213, 225);
          doc.setLineWidth(0.2);
          doc.rect(imgX, imgY, imgDim, imgDim);
        }

        // Under image: word label (NO numbering prefix) with strict font size and baseline: 'top'
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(activeFontSize);
        if (options?.isAnswerMode) {
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setTextColor(30, 41, 59);
        }
        const wordText = wordsearchCase === 'upper' ? pw.cleanTerm.toUpperCase() : pw.cleanTerm.toLowerCase();
        doc.text(
          wordText,
          colX + colWidth / 2,
          imgY + imgDim + gapBelowImg,
          { align: 'center', baseline: 'top', maxWidth: colWidth }
        );
      }
      return startY + words.length * itemPitch - itemGap;
    }
  };

  const leftEndY = await renderColumn(leftWords, leftColX, leftColW, 'left');
  const rightEndY = await renderColumn(rightWords, rightColX, rightColW, 'right');

  doc.setTextColor(0, 0, 0);
  return Math.max(leftEndY, rightEndY);
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

export function registerFonts(doc: jsPDF, activeFont: string = 'r0c0i Linotte') {
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

  // Always register Farsan
  doc.addFileToVFS('Farsan-Regular-normal.ttf', fontFarsan);
  doc.addFont('Farsan-Regular-normal.ttf', 'Farsan', 'normal');

  // Always register HP001
  doc.addFileToVFS('HP001_b4h-normal.ttf', fontHP001_b4h);
  doc.addFont('HP001_b4h-normal.ttf', 'HP001', 'normal');
  doc.addFont('HP001_b4h-normal.ttf', 'fontHP001_b4h', 'normal');
  doc.addFileToVFS('HP001_4_hang_2_o_ly-normal.ttf', fontHP001_4_2);
  doc.addFont('HP001_4_hang_2_o_ly-normal.ttf', 'fontHP001_4_2', 'normal');

  // Always register HLHOCTRO
  doc.addFileToVFS('HLHOCTRO-normal.ttf', fontHLHOCTRO);
  doc.addFont('HLHOCTRO-normal.ttf', 'HLHOCTRO', 'normal');

  // Always register Questrial
  doc.addFileToVFS('Questrial-Regular-normal.ttf', fontQuestrial);
  doc.addFont('Questrial-Regular-normal.ttf', 'Questrial', 'normal');

  // Register 'fff' mapped to the activeFont for backward compatibility
  if (activeFont === 'r0c0i Linotte' || activeFont === 'Linotte' || !activeFont) {
    doc.addFont('Linotte-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'Farsan') {
    doc.addFont('Farsan-Regular-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'HP001') {
    doc.addFont('HP001_b4h-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'HLHOCTRO') {
    doc.addFont('HLHOCTRO-normal.ttf', 'fff', 'normal');
    doc.addFont('Linotte-SemiBold-normal.ttf', 'fff', 'bold');
  } else if (activeFont === 'Questrial') {
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

export async function generateWorksheetPDF(options: WorksheetOptions, secondaryWords?: WorksheetWord[]): Promise<jsPDF> {
  const {
    type,
    title,
    fontSize = 12,
    fontFamily = 'r0c0i Linotte',
    paperSize = 'a5',
    blankMode = 'vowels',
    spacing = 0, // Spacing in pt like Microsoft Word (default: 0 pt)
    background = '',
    words,
    sourceUrl = 'https://yourhomework.net',
    showHeader = false,
    showFooter = false,
    showImageBorder = false,
    showTableGrid = false,
    imageSize = 12.7, // 0.5 inches = 12.7 mm
    matchMode = 'word',
    matchHint = 'none',
    lookMatchWriteShuffleSuffix = false,
    lookMatchWriteMode = 'trace',
    lookMatchWriteShowBaseline = true,
    lookMatchWriteTraceFontSize
  } = options;

  const gapMm = (spacing !== undefined ? spacing : 0) * 0.352778; // Convert pt to mm (1 pt = 0.352778 mm)
  const isA5 = paperSize !== 'a4';
  const pageWidth = isA5 ? 148 : 210;
  const pageHeight = isA5 ? 210 : 297;
  const margin = 12.7; // 0.5 in on all sides (from user image)
  const printableWidth = pageWidth - margin * 2; // 122.6 mm for A5
  const printableHeight = pageHeight - margin * 2; // 184.6 mm for A5
  const imgSize = imageSize || 12.7; // 12.7 mm = 0.5 in

  const rawWords = words || secondaryWords || (options as any).wordsList || [];
  const validWords = rawWords.filter((w: any) => w && w.term && w.term.trim().length > 0);
  if (type !== 18 && validWords.length === 0) {
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
  if (type === 1) {
    // -------------------------------------------------------------
    // TYPE 1: Sentence Reorder / Rewrite (Viết lại câu)
    // Options:
    // - sentenceScramble: boolean (default: true)
    // - sentenceSeparator: 'space' | 'slash' (default: 'space')
    // - sentenceHintStyle: 'underscores' | 'dots' | 'trace' (default: 'underscores')
    // - sentenceTraceFontSize: number (default: 28 on A4, 26 on A5)
    // Layout: Centered Image -> Centered Words -> Centered Hint
    // Pagination: dynamic wordsPerPage (up to 4 on A5, 6 on A4) based on item height
    // -------------------------------------------------------------
    const isScramble = options.sentenceScramble !== false;
    const separator = options.sentenceSeparator || 'space';
    const hintStyle = options.sentenceHintStyle || 'underscores';
    const traceFontSize = options.sentenceTraceFontSize || (isA5 ? 26 : 28);

    const effectiveFontSize = fontSize || (isA5 ? 11.5 : 13.5);
    const effectiveSpacing = spacing !== undefined ? spacing : 6;
    const metrics = calculateType1Metrics(effectiveFontSize, effectiveSpacing, imgSize, hintStyle, traceFontSize);
    const { gapImgToWords, gapWordsToHint, itemGap, itemTotalHeight } = metrics;

    const topMargin = (showHeader && title) ? margin + (isA5 ? 12 : 14) : margin + 4;
    const availableContentH = pageHeight - topMargin - (showFooter ? (isA5 ? 12 : 15) : margin);
    const maxItemsFit = Math.max(1, Math.floor(availableContentH / itemTotalHeight));
    const wordsPerPage = Math.min(isA5 ? 4 : 6, maxItemsFit);
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + (isA5 ? 5.5 : 7));
        doc.setTextColor(0, 0, 0);
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      let currentItemY = topMargin;

      for (let i = startIdx; i < endIdx; i++) {
        const itemY = currentItemY;

        const currentWord = validWords[i];
        const targetImg = wordImages[i];

        // 1. Centered Image (0.5 x 0.5 in = 12.7 x 12.7 mm default)
        const imgX = (pageWidth - imgSize) / 2;
        const imgY = itemY;

        if (targetImg) {
          try {
            doc.addImage(targetImg, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // 2. Sentence preparation
        const targetSentence = getType1Sentence(currentWord);
        const displayedText = isScramble
          ? scrambleSentenceWords(targetSentence, separator)
          : targetSentence;

        // Hint line preparation: strictly max 1 line for 'dots'
        let hintText = generateSentenceHint(targetSentence, hintStyle);
        if (hintStyle === 'dots') {
          const maxHintWidth = printableWidth - 4;
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(effectiveFontSize);
          const normalized = targetSentence.trim().replace(/\s+/g, ' ');
          let dotCount = normalized.length;
          hintText = Array(dotCount).fill('...').join('');
          while (dotCount > 1 && doc.getTextWidth(hintText) > maxHintWidth) {
            dotCount--;
            hintText = Array(dotCount).fill('...').join('');
          }
        }

        // 3. Middle: Words (with multi-line safety)
        applyFont(doc, activeFont, 'normal');
        doc.setFontSize(effectiveFontSize);
        doc.setTextColor(30, 41, 59);

        const wordsLines = doc.splitTextToSize(displayedText, printableWidth - 4);
        const wordsLineCount = Math.max(1, Array.isArray(wordsLines) ? wordsLines.length : 1);
        const wordsLineHeight = effectiveFontSize * 0.352778 * 1.25;

        const wordsY = imgY + imgSize + gapImgToWords + (effectiveFontSize * 0.352778 * 0.85);
        doc.text(displayedText, pageWidth / 2, wordsY, {
          align: 'center',
          maxWidth: printableWidth - 4
        });

        // 4. Bottom: Hint Line (measured from bottom of words)
        const wordsBottom = wordsY + (wordsLineCount - 1) * wordsLineHeight + (effectiveFontSize * 0.352778 * 0.35);
        let actualHintBottom = wordsBottom;

        if (options.answerMode === 'answer') {
          applyFont(doc, activeFont, 'bold');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(220, 38, 38);
          const ansLines = doc.splitTextToSize(targetSentence, printableWidth - 4);
          const ansLineCount = Math.max(1, Array.isArray(ansLines) ? ansLines.length : 1);
          const ansLineHeight = effectiveFontSize * 0.352778 * 1.2;
          const hintY = wordsBottom + gapWordsToHint + (effectiveFontSize * 0.352778 * 0.85);
          doc.text(targetSentence, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: printableWidth - 4
          });
          actualHintBottom = hintY + (ansLineCount - 1) * ansLineHeight + (effectiveFontSize * 0.352778 * 0.35);
        } else if (hintStyle === 'trace') {
          doc.setFont('KGPrimaryDots', 'normal');
          let actualTraceFontSize = traceFontSize;
          doc.setFontSize(actualTraceFontSize);
          doc.setTextColor(30, 41, 59);

          // Auto-fit protection: iteratively decrease font size down to 14pt so it fits on 1 single continuous line for kids
          const maxHintW = printableWidth - 4;
          while (doc.getTextWidth(hintText) > maxHintW && actualTraceFontSize > 14) {
            actualTraceFontSize--;
            doc.setFontSize(actualTraceFontSize);
          }

          const traceLines = doc.splitTextToSize(hintText, maxHintW);
          const traceLineCount = Math.max(1, Array.isArray(traceLines) ? traceLines.length : 1);
          const traceLineHeight = actualTraceFontSize * 0.352778 * 1.2;

          const hintY = wordsBottom + gapWordsToHint + (actualTraceFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: maxHintW
          });
          actualHintBottom = hintY + (traceLineCount - 1) * traceLineHeight + (actualTraceFontSize * 0.352778 * 0.35);
        } else if (hintStyle === 'dots') {
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(51, 65, 85);
          const hintY = wordsBottom + gapWordsToHint + (effectiveFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center'
          });
          actualHintBottom = hintY + (effectiveFontSize * 0.352778 * 0.35);
        } else {
          // underscores
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(51, 65, 85);
          const hintLines = doc.splitTextToSize(hintText, printableWidth - 4);
          const hintLineCount = Math.max(1, Array.isArray(hintLines) ? hintLines.length : 1);
          const hintLineHeight = effectiveFontSize * 0.352778 * 1.2;

          const hintY = wordsBottom + gapWordsToHint + (effectiveFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: printableWidth - 4
          });
          actualHintBottom = hintY + (hintLineCount - 1) * hintLineHeight + (effectiveFontSize * 0.352778 * 0.35);
        }
        doc.setTextColor(0, 0, 0);

        currentItemY = actualHintBottom + itemGap;
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
        if (options.answerMode === 'answer') {
          doc.setTextColor(220, 38, 38);
          const wordWidth = doc.getTextWidth(word.term);
          const repeatCount = isA5 ? 3 : 4;
          const stepX = Math.max(wordWidth + 8, (printableWidth - (gridX - margin)) / repeatCount);
          for (let rep = 0; rep < repeatCount; rep++) {
            const rx = gridX + rep * stepX;
            if (rx + wordWidth <= pageWidth - margin) {
              doc.text(word.term, rx, gridY);
            }
          }
          doc.setTextColor(0, 0, 0);
        } else {
          doc.setTextColor(0, 0, 0);
          doc.text(word.term, gridX, gridY);
        }

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

    // Dynamic spacing & row geometry using calculateType2Metrics
    const effectiveFontSize = fontSize || (isA5 ? 12 : 14);
    const { lineOffset, rowGap, rowHeight } = calculateType2Metrics(effectiveFontSize, spacing !== undefined ? spacing : 6, imgSize, isA5);

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

        if (options.answerMode === 'answer') {
          setDocLineDash(doc, []);
          applyFont(doc, activeFont, 'bold');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(220, 38, 38);
          doc.text(validWords[i].term, colCenter, lineY - 0.8, { align: 'center' });
          doc.setTextColor(0, 0, 0);
          doc.setDrawColor(80, 80, 80);
          doc.setLineWidth(0.15);
          setDocLineDash(doc, [0.4, 0.6]);
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
  } else if (type === 3) {
    // -------------------------------------------------------------
    // TYPE 3: Match picture to word or sentence worksheet / Look, match and write
    // Dynamic spacing between middle items and side pictures. Strictly NO box/frame!
    // -------------------------------------------------------------
    if (matchMode === 'look_match_write') {
      // -------------------------------------------------------------
      // TYPE 3 - Sub-mode: Look, match and write
      // Matches sample image media_1790739595452.png
      // 4 columns: Picture -> Prefix with 2 dots -> Suffix with 1 dot -> Trace/Write with dashed baseline
      // -------------------------------------------------------------
      const topStart = (showHeader && title) ? margin + 14 : margin + 4;
      const bottomLimit = pageHeight - margin - (showFooter ? 8 : 4);
      const availHeight = bottomLimit - topStart;

      const metrics = calculateType3LookMatchWriteMetrics(isA5, imgSize, fontSize, spacing, lookMatchWriteTraceFontSize);
      const { rowContentHeight, rowGap, traceFontSize, prefixFontSize } = metrics;
      const rowPitch = rowContentHeight + rowGap;

      const maxCount = Math.max(3, Math.floor(availHeight / rowPitch));
      const wordsPerPage = Math.min(validWords.length, maxCount);
      const totalPages = Math.ceil(validWords.length / wordsPerPage);

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();
        await insertBackground(doc, background, isA5);

        if (showHeader && title) {
          doc.setFont('fff', 'bold');
          doc.setFontSize(isA5 ? 16 : 25);
          doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
        }

        const startIdx = page * wordsPerPage;
        const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);
        const pageWords = validWords.slice(startIdx, endIdx);
        const count = pageWords.length;

        // Vertical spacing: If spacing === 0, keep compact. If spacing > 0 and count < maxCount, add breathing room
        const totalBlockH = count * rowContentHeight + (count - 1) * rowGap;
        let startY = topStart;
        let effectiveRowGap = rowGap;
        if (spacing !== 0 && totalBlockH < availHeight * 0.8 && count > 1) {
          const extraPerGap = Math.min((availHeight - totalBlockH) / (count + 1), isA5 ? 4.5 : 7.0);
          effectiveRowGap = rowGap + extraPerGap;
          startY = topStart + extraPerGap;
        }

        // Prepare row items
        interface LookMatchWriteRowItem {
          originalIndex: number;
          word: WorksheetWord;
          prefix: string;
          suffix: string;
          color: [number, number, number];
        }

        const rowItems: LookMatchWriteRowItem[] = pageWords.map((w, idx) => {
          const { prefix, suffix } = splitLookMatchWriteTerm(w.term);
          return {
            originalIndex: idx,
            word: w,
            prefix,
            suffix,
            color: getType3DotColor(idx, false, matchHint)
          };
        });

        // Shuffle middle words relative to picture items so row i prefix is shuffled
        let shuffledWordRows = shuffleArray([...rowItems]);
        if (count > 1) {
          let hasCollision = shuffledWordRows.some((item, i) => item.originalIndex === i);
          let attempts = 0;
          while (hasCollision && attempts < 10) {
            shuffledWordRows = shuffleArray([...rowItems]);
            hasCollision = shuffledWordRows.some((item, i) => item.originalIndex === i);
            attempts++;
          }
        }

        // Suffix & Trace column items (Column 2 Suffix and Column 3 Trace/Write ALWAYS belong to the same word!)
        let suffixItems: { suffix: string; word: WorksheetWord; color: [number, number, number] }[];
        if (lookMatchWriteShuffleSuffix) {
          // Shuffle suffixes independently, but keep Suffix & Trace bonded together
          let shuffledSuffixes = shuffleArray(rowItems.map(item => ({ suffix: item.suffix, word: item.word, color: item.color, orig: item.originalIndex })));
          if (count > 1) {
            let collision = shuffledSuffixes.some((s, idx) => s.orig === shuffledWordRows[idx].originalIndex);
            let attempts = 0;
            while (collision && attempts < 15) {
              const res = shuffleArray(rowItems.map(item => ({ suffix: item.suffix, word: item.word, color: item.color, orig: item.originalIndex })));
              if (!res.some((s, idx) => s.orig === shuffledWordRows[idx].originalIndex)) {
                shuffledSuffixes = res;
                break;
              }
              attempts++;
            }
          }
          suffixItems = shuffledSuffixes.map(s => ({ suffix: s.suffix, word: s.word, color: s.color }));
        } else {
          // Keep suffix and trace on the same horizontal row as the prefix (like sample image)
          suffixItems = shuffledWordRows.map(item => ({ suffix: item.suffix, word: item.word, color: item.color }));
        }

        // Text width measurements
        applyFont(doc, fontFamily, 'bold');
        doc.setFontSize(prefixFontSize);
        const maxPrefixW = Math.max(...pageWords.map(w => doc.getTextWidth(splitLookMatchWriteTerm(w.term).prefix)));
        const maxSuffixW = Math.max(...pageWords.map(w => doc.getTextWidth(splitLookMatchWriteTerm(w.term).suffix)));

        const activeWriteFont = (fontFamily === 'HP001' || fontFamily === 'HLHOCTRO') ? fontFamily : 'KG Primary Dots';
        applyFont(doc, activeWriteFont, 'normal');
        doc.setFontSize(traceFontSize);
        const maxTraceW = Math.max(...pageWords.map(w => doc.getTextWidth(w.term)));

        const dotRadius = isA5 ? 0.75 : 0.9;
        const dotImgGap = isA5 ? 3.5 : 4.5;

        // Zone 1: Image
        const imgX = margin + (isA5 ? 1.5 : 3.0);
        const imgDotX = imgX + imgSize + dotImgGap;

        // Column 2 (Prefix) width & clearance
        const prefixColWidth = Math.max(isA5 ? 16 : 22, maxPrefixW + (isA5 ? 8 : 12));
        const suffixColWidth = Math.max(isA5 ? 12 : 16, maxSuffixW + (isA5 ? 6 : 8));
        const writeColWidth = Math.max(isA5 ? 26 : 34, maxTraceW + (isA5 ? 6 : 8));

        const totalNeededW = (imgSize + dotImgGap) + prefixColWidth + suffixColWidth + writeColWidth;
        const remainingW = (pageWidth - margin * 2) - totalNeededW;
        const interColGap = Math.max(isA5 ? 8 : 12, Math.min(isA5 ? 20 : 32, remainingW / 3));

        const prefixLeftDotX = imgDotX + interColGap;
        const prefixRightDotX = prefixLeftDotX + prefixColWidth;
        const prefixCenterX = prefixLeftDotX + prefixColWidth / 2;

        const suffixDotX = prefixRightDotX + interColGap;
        const suffixTextX = suffixDotX + (isA5 ? 3.5 : 4.5);

        const writeStartX = suffixDotX + suffixColWidth + interColGap * 0.4;

        for (let i = 0; i < count; i++) {
          const rowCenterY = startY + i * (rowContentHeight + effectiveRowGap) + rowContentHeight / 2;

          // 1. Draw Image
          const imgPosY = rowCenterY - imgSize / 2;
          const globalIdx = startIdx + i;
          const img = wordImages[globalIdx];
          if (img) {
            try {
              const imgFmt = (img.startsWith('data:image/png') || img.startsWith('iVBORw0KGgo')) ? 'PNG' : 'JPEG';
              doc.addImage(img, imgFmt, imgX, imgPosY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgPosY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgPosY, imgSize, imgSize);
          }
          if (showImageBorder) {
            doc.rect(imgX - 1.5, imgPosY - 1.5, imgSize + 3, imgSize + 3);
          }

          // 2. Draw Image Connector Dot
          const isAnsMode = options.answerMode === 'answer';
          const imgDotColor = isAnsMode ? [220, 38, 38] : rowItems[i].color;
          doc.setFillColor(imgDotColor[0], imgDotColor[1], imgDotColor[2]);
          doc.circle(imgDotX, rowCenterY, dotRadius, 'F');

          // 3. Draw Column 2: Prefix
          const wordItem = shuffledWordRows[i];
          const prefixColor = isAnsMode ? [220, 38, 38] : wordItem.color;

          // Prefix left dot
          doc.setFillColor(prefixColor[0], prefixColor[1], prefixColor[2]);
          doc.circle(prefixLeftDotX, rowCenterY, dotRadius, 'F');

          // Prefix text
          applyFont(doc, fontFamily, 'bold');
          doc.setFontSize(prefixFontSize);
          doc.setTextColor(isAnsMode ? 220 : 30, isAnsMode ? 38 : 41, isAnsMode ? 38 : 59);
          doc.text(wordItem.prefix, prefixCenterX, rowCenterY + (isA5 ? 0.9 : 1.2), { align: 'center' });

          // Prefix right dot
          doc.setFillColor(prefixColor[0], prefixColor[1], prefixColor[2]);
          doc.circle(prefixRightDotX, rowCenterY, dotRadius, 'F');

          // 4. Draw Column 3: Suffix
          const sItem = suffixItems[i];
          const suffixColor = isAnsMode ? [220, 38, 38] : sItem.color;
          doc.setFillColor(suffixColor[0], suffixColor[1], suffixColor[2]);
          doc.circle(suffixDotX, rowCenterY, dotRadius, 'F');

          applyFont(doc, fontFamily, 'bold');
          doc.setFontSize(prefixFontSize);
          doc.setTextColor(isAnsMode ? 220 : 30, isAnsMode ? 38 : 41, isAnsMode ? 38 : 59);
          doc.text(sItem.suffix, suffixTextX, rowCenterY + (isA5 ? 0.9 : 1.2), { align: 'left' });

          // 5. Draw Column 4: Write / Trace Word
          // Column 2 (Suffix) and Column 3 (Trace/Write) ALWAYS belong to the same word!
          const writeWord = sItem.word.term;
          const writeMode = lookMatchWriteMode || 'trace';
          const showBaseline = lookMatchWriteShowBaseline !== false;

          let writeTextToDraw = writeWord;
          let currentWriteFont = activeWriteFont;
          let currentWriteFontSize = traceFontSize;

          if (isAnsMode) {
            currentWriteFont = 'r0c0i Linotte';
            currentWriteFontSize = prefixFontSize;
            writeTextToDraw = writeWord;
          } else if (writeMode === 'blank') {
            writeTextToDraw = formatLookMatchWriteBlank(writeWord);
            currentWriteFont = 'r0c0i Linotte';
            currentWriteFontSize = prefixFontSize;
          }

          applyFont(doc, currentWriteFont, isAnsMode ? 'bold' : 'normal');
          doc.setFontSize(currentWriteFontSize);
          doc.setTextColor(isAnsMode ? 220 : 45, isAnsMode ? 38 : 55, isAnsMode ? 38 : 72);

          const textBaselineY = rowCenterY + (isA5 ? 1.0 : 1.3);
          doc.text(writeTextToDraw, writeStartX, textBaselineY, { align: 'left' });

          // Dashed baseline underneath word
          if (showBaseline) {
            const textW = doc.getTextWidth(writeTextToDraw);
            const baselineW = Math.max(textW + (isA5 ? 4 : 6), isA5 ? 20 : 28);
            const baselineOffset = (writeMode === 'blank' || isAnsMode) ? (isA5 ? 2.8 : 3.4) : (isA5 ? 1.6 : 2.0);
            const baselineY = textBaselineY + baselineOffset;

            doc.setDrawColor(40, 40, 40);
            doc.setLineWidth(0.4);
            setDocLineDash(doc, [0.8, 0.8]);
            doc.line(writeStartX, baselineY, writeStartX + baselineW, baselineY);
            setDocLineDash(doc, []); // reset line dash
          }

          // If Answer Mode: Draw connecting lines between matched items
          if (isAnsMode) {
            // Find prefix row matching item i
            const pRowIdx = shuffledWordRows.findIndex((it) => it.originalIndex === i);
            if (pRowIdx !== -1) {
              const pCenterY = startY + pRowIdx * (rowContentHeight + effectiveRowGap) + rowContentHeight / 2;
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.45);
              doc.line(imgDotX, rowCenterY, prefixLeftDotX, pCenterY);

              // Find suffix row matching item i
              const sRowIdx = suffixItems.findIndex((it) => it.word.term === rowItems[i].word.term);
              if (sRowIdx !== -1) {
                const sCenterY = startY + sRowIdx * (rowContentHeight + effectiveRowGap) + rowContentHeight / 2;
                doc.line(prefixRightDotX, pCenterY, suffixDotX, sCenterY);
              }
            }
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
    } else {
      const isSentence = matchMode === 'sentence';
      const fontHeightMm = (fontSize || 12) * 0.352778;
      const baseBoxHeight = isSentence ? (isA5 ? 10 : 12) : (isA5 ? 7.5 : 9.5);
      const boxHeight = Math.max(baseBoxHeight, fontHeightMm * 1.35);
      const boxWidth = isSentence ? (isA5 ? 76 : 110) : (isA5 ? 46 : 50);
      const topStart = (showHeader && title) ? margin + 14 : margin + 4;
      const availHeight = printableHeight - (topStart - margin) - 8;

      // Spacing between middle word/sentence rows (down to 1.2mm at 0pt)
      const boxGap = (spacing === 0 ? Math.max(1.2, fontHeightMm * 0.2) : 1.2 + (spacing !== undefined ? spacing : 6) * 0.352778);
      const maxCount = Math.floor(availHeight / (boxHeight + boxGap));
      const maxLimit = isSentence ? (isA5 ? 10 : 14) : (isA5 ? 14 : 20);
      const minLimit = isSentence ? (isA5 ? 4 : 6) : (isA5 ? 6 : 8);
      const wordsPerPage = Math.min(maxLimit, Math.max(minLimit, maxCount));
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

        // Total vertical span of the middle items
        const totalMiddleHeight = count * boxHeight + (count - 1) * boxGap;
        const imgPitch = half > 1 ? Math.max(imgSize + 1, (totalMiddleHeight - imgSize) / (half - 1)) : 0;

        // Draw pictures on left and right sides (delicate small dots matching reference)
        const dotRadius = isA5 ? 0.6 : 0.75;
        const dotImgOffset = isA5 ? 2.8 : 3.5;
        const isAnsMode = options.answerMode === 'answer';

        for (let i = 0; i < count; i++) {
          const isRight = i >= half;
          const rowInCol = isRight ? i - half : i;
          const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
          const posY = topStart + (half > 1 ? rowInCol * imgPitch : 0);

          const globalIdx = startIdx + i;
          const img = wordImages[globalIdx];

          if (img) {
            try {
              const imgFmt = (img.startsWith('data:image/png') || img.startsWith('iVBORw0KGgo')) ? 'PNG' : 'JPEG';
              doc.addImage(img, imgFmt, posX, posY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(posX, posY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(posX, posY, imgSize, imgSize);
          }
          if (showImageBorder) {
            doc.rect(posX - 1.5, posY - 1.5, imgSize + 3, imgSize + 3);
          }

          // Draw picture connector dot
          const dotColor = isAnsMode ? [220, 38, 38] : getType3DotColor(i, isRight, matchHint);
          const imgCenterY = posY + imgSize / 2;
          const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);
          doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
          doc.circle(imgDotX, imgCenterY, dotRadius, 'F');
        }

        // Prepare items for middle column keeping track of originalIndex, isRight, and dotColor
        interface Type3MatchItem {
          originalIndex: number;
          isRight: boolean;
          term: string;
          color: [number, number, number];
          sentence?: HighlightedSpan[];
        }

        const matchItems: Type3MatchItem[] = pageWords.map((w, idx) => {
          const isRight = idx >= half;
          return {
            originalIndex: idx,
            isRight,
            term: w.term,
            color: isAnsMode ? [220, 38, 38] : getType3DotColor(idx, isRight, matchHint),
            sentence: isSentence ? parseHighlightedSentence(w.exampleSentence, w.term) : undefined
          };
        });

        const shuffledItems = shuffleArray(matchItems);

        // Shuffled words or sentences placed in the center (without any bounding boxes)
        if (isSentence) {
          const sFontSize = fontSize ? (isA5 ? Math.min(fontSize, 11) : fontSize) : (isA5 ? 10.5 : 12);
          doc.setFontSize(sFontSize);

          // Dynamic sentence width calculation based on font & font size
          let maxHalfSentenceWidth = 14;
          for (const item of shuffledItems) {
            if (item.sentence) {
              let sentenceWidth = 0;
              for (const span of item.sentence) {
                applyFont(doc, fontFamily, span.isHighlighted ? 'bold' : 'normal');
                sentenceWidth += doc.getTextWidth(span.text);
              }
              if (sentenceWidth / 2 > maxHalfSentenceWidth) {
                maxHalfSentenceWidth = sentenceWidth / 2;
              }
            }
          }

          const minHalfCol = isA5 ? 18 : 24;
          const textPadding = isA5 ? 3.0 : 3.8;
          let centerColHalfWidth = Math.max(minHalfCol, maxHalfSentenceWidth + textPadding);

          // Safety clamp against picture dots (guarantee at least 10mm clearance from picture dots)
          const leftPictureDotX = margin + 2 + imgSize + dotImgOffset;
          const rightPictureDotX = (pageWidth - margin - imgSize - 2) - dotImgOffset;
          const maxSafeHalfWidth = Math.min((pageWidth / 2) - (leftPictureDotX + 10), (rightPictureDotX - 10) - (pageWidth / 2));
          centerColHalfWidth = Math.min(centerColHalfWidth, maxSafeHalfWidth);

          const leftSentenceDotX = (pageWidth / 2) - centerColHalfWidth;
          const rightSentenceDotX = (pageWidth / 2) + centerColHalfWidth;
          const activeSentenceBoxWidth = Math.max(20, (centerColHalfWidth - textPadding) * 2);
          const sentenceBoxX = (pageWidth - activeSentenceBoxWidth) / 2;

          for (let i = 0; i < count; i++) {
            const centerBoxY = topStart + i * (boxHeight + boxGap);
            const item = shuffledItems[i];
            if (item.sentence) {
              drawHighlightedCenteredSentence(
                doc,
                item.sentence,
                sentenceBoxX,
                centerBoxY,
                activeSentenceBoxWidth,
                boxHeight,
                sFontSize,
                fontFamily
              );
            }

            // Draw connector dot next to the sentence
            const textDotX = item.isRight ? rightSentenceDotX : leftSentenceDotX;
            const textDotY = centerBoxY + boxHeight / 2;
            doc.setFillColor(item.color[0], item.color[1], item.color[2]);
            doc.circle(textDotX, textDotY, dotRadius, 'F');
          }

          // If Answer Mode: draw connecting lines for sentences
          if (isAnsMode) {
            for (let i = 0; i < count; i++) {
              const isRight = i >= half;
              const rowInCol = isRight ? i - half : i;
              const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
              const posY = topStart + (half > 1 ? rowInCol * imgPitch : 0);
              const imgCenterY = posY + imgSize / 2;
              const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);

              const targetShuffledIdx = shuffledItems.findIndex((it) => it.originalIndex === i);
              if (targetShuffledIdx !== -1) {
                const targetItem = shuffledItems[targetShuffledIdx];
                const targetTextDotX = targetItem.isRight ? rightSentenceDotX : leftSentenceDotX;
                const targetTextDotY = topStart + targetShuffledIdx * (boxHeight + boxGap) + boxHeight / 2;
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.45);
                doc.line(imgDotX, imgCenterY, targetTextDotX, targetTextDotY);
              }
            }
          }
        } else {
          applyFont(doc, fontFamily, 'normal');
          doc.setFontSize(fontSize);

          // Dynamic column width calculation based on font & font size
          const maxHalfWordWidth = Math.max(...pageWords.map((w) => doc.getTextWidth(w.term) / 2));
          const minHalfCol = isA5 ? 20 : 25;
          const textPadding = isA5 ? 3.0 : 3.8;
          let centerColHalfWidth = Math.max(minHalfCol, maxHalfWordWidth + textPadding);

          // Safety clamp against picture dots
          const leftPictureDotX = margin + 2 + imgSize + dotImgOffset;
          const rightPictureDotX = (pageWidth - margin - imgSize - 2) - dotImgOffset;
          const maxSafeHalfWidth = Math.min((pageWidth / 2) - (leftPictureDotX + 6), (rightPictureDotX - 6) - (pageWidth / 2));
          centerColHalfWidth = Math.min(centerColHalfWidth, maxSafeHalfWidth);

          const leftTextDotX = (pageWidth / 2) - centerColHalfWidth;
          const rightTextDotX = (pageWidth / 2) + centerColHalfWidth;

          for (let i = 0; i < count; i++) {
            const centerBoxY = topStart + i * (boxHeight + boxGap);
            const item = shuffledItems[i];

            // Draw centered word
            doc.setTextColor(30, 41, 59);
            doc.text(item.term, pageWidth / 2, centerBoxY + boxHeight / 2 + (isA5 ? 0.9 : 1.2), { align: 'center' });

            // Draw connector dot next to the word
            const textDotX = item.isRight ? rightTextDotX : leftTextDotX;
            const textDotY = centerBoxY + boxHeight / 2;
            doc.setFillColor(item.color[0], item.color[1], item.color[2]);
            doc.circle(textDotX, textDotY, dotRadius, 'F');
          }

          // If Answer Mode: draw connecting lines for words
          if (isAnsMode) {
            for (let i = 0; i < count; i++) {
              const isRight = i >= half;
              const rowInCol = isRight ? i - half : i;
              const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
              const posY = topStart + (half > 1 ? rowInCol * imgPitch : 0);
              const imgCenterY = posY + imgSize / 2;
              const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);

              const targetShuffledIdx = shuffledItems.findIndex((it) => it.originalIndex === i);
              if (targetShuffledIdx !== -1) {
                const targetItem = shuffledItems[targetShuffledIdx];
                const targetTextDotX = targetItem.isRight ? rightTextDotX : leftTextDotX;
                const targetTextDotY = topStart + targetShuffledIdx * (boxHeight + boxGap) + boxHeight / 2;
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.45);
                doc.line(imgDotX, imgCenterY, targetTextDotX, targetTextDotY);
              }
            }
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
    }
  } else if (type === 4) {
    if (options.type4LayoutMode === 'table') {
      // -------------------------------------------------------------
      // TYPE 4 - Mode 'table': Look and write (Phonics Missing Letters with Trace & Write)
      // Matches sample images media_1790571731767.png, media_1790571748343.png, media_1790571767906.png
      // Strictly NO bounding box/frame around images!
      // Dynamically calculates wordsPerPage based on font size & spacing
      // -------------------------------------------------------------
      const colMode = options.type4ColumnMode || 'both_trace_first';
      const numTextCols = (colMode === 'initial_only' || colMode === 'final_only' || colMode === 'alphabet_order' || colMode === 'vowels_only') ? 2 : 4;

      const tableX = margin;
      const tableWidth = printableWidth;
      // Synchronized image dimension: default 0.5 x 0.5 inch (12.7mm x 12.7mm)
      const targetImgBox = imgSize;
      const col1Width = Math.max(18, imgSize + 5); // provides comfortable spacing around image
      const textColsWidth = tableWidth - col1Width;
      const colTextWidth = textColsWidth / numTextCols;

      const displayTitle = (title && title.trim()) ? title : 'Look and write';
      const topMargin = margin + 9;
      const tableTopY = topMargin;
      const bottomLimit = pageHeight - margin - (showFooter ? 8 : 4);
      const availHeight = bottomLimit - tableTopY;

      // Font size: respect user's chosen fontSize
      const chosenFontSize = fontSize || (isA5 ? 12 : 14);
      // Trace font size: default 28pt (cỡ tập viết tiểu học)
      const chosenTraceFontSize = options.type4TraceFontSize || 28;
      const regularFont = (options.fontFamily && options.fontFamily !== 'KG Primary Dots') ? options.fontFamily : 'r0c0i Linotte';

      // Spacing & Row Height calculation:
      const spacingMm = (spacing !== undefined ? spacing : 0) * 0.352778;
      const traceFontHeightMm = chosenTraceFontSize * 0.352778;
      const fontHMm = chosenFontSize * 0.352778;
      const contentH = Math.max(targetImgBox, traceFontHeightMm + 1.5, fontHMm);
      const baseRowGap = 1.0;
      const rowHeight = contentH + spacingMm + baseRowGap;

      // Dynamic wordsPerPage: fits neatly without overflowing
      const wordsPerPage = Math.max(1, Math.floor(availHeight / rowHeight));
      const totalPages = Math.ceil(validWords.length / wordsPerPage);

      // Define static cell types for standard 4-col / 2-col modes
      let cellTypes: Array<'initial_trace' | 'initial_blank' | 'final_trace' | 'final_blank'> = [];
      if (colMode === 'both_trace_first') {
        cellTypes = ['initial_trace', 'initial_blank', 'final_trace', 'final_blank'];
      } else if (colMode === 'both_blank_first') {
        cellTypes = ['initial_trace', 'initial_blank', 'final_blank', 'final_trace'];
      } else if (colMode === 'initial_only') {
        cellTypes = ['initial_trace', 'initial_blank'];
      } else if (colMode === 'final_only') {
        cellTypes = ['final_trace', 'final_blank'];
      }

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) doc.addPage();
        await insertBackground(doc, background, isA5);

        // Header Title at top-left: "Look and write" (bold)
        applyFont(doc, 'r0c0i Linotte', 'bold');
        doc.setFontSize(isA5 ? 14 : 17);
        doc.setTextColor(20, 20, 20);
        doc.text(displayTitle, tableX, margin + 5);

        const startIdx = page * wordsPerPage;
        const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);
        const pageCount = endIdx - startIdx;

        // Distribute rows nicely on the page (avoid over-stretching if user requested 0pt compact spacing)
        const actualRowHeight = (spacing === 0)
          ? rowHeight
          : (pageCount > 1 ? Math.min(rowHeight * 1.25, (availHeight - 2) / pageCount) : rowHeight);

        for (let i = startIdx; i < endIdx; i++) {
          const itemIdx = i - startIdx;
          const rowY = tableTopY + itemIdx * actualRowHeight;
          const rowCenterY = rowY + actualRowHeight / 2;

          // 1. Column 1: Image (0.5 x 0.5 in = 12.7 x 12.7 mm, synchronized standard)
          const img = wordImages[i];
          const imgDim = imgSize;
          if (img) {
            let imgW = imgDim;
            let imgH = imgDim;
            try {
              const props = doc.getImageProperties(img);
              if (props.width && props.height) {
                const aspect = props.width / props.height;
                if (aspect > 1) {
                  imgW = imgDim;
                  imgH = imgDim / aspect;
                } else {
                  imgH = imgDim;
                  imgW = imgDim * aspect;
                }
              }
            } catch {
              // fallback square
            }
            const imgX = tableX + (col1Width - imgW) / 2;
            const imgY = rowCenterY - imgH / 2;
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgW, imgH);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgW, imgH);
            }
            if (showImageBorder) doc.rect(imgX, imgY, imgW, imgH);
          } else if (showImageBorder) {
            doc.rect(tableX + (col1Width - imgDim) / 2, rowCenterY - imgDim / 2, imgDim, imgDim);
          }

          // 2. Text Columns with safe margin & proportional auto-scaling for long words
          const term = validWords[i].term.trim();
          let wordFontSize = chosenFontSize;
          let cellTraceFontSize = chosenTraceFontSize;

          applyFont(doc, regularFont, 'normal');
          doc.setFontSize(wordFontSize);
          const fullW = doc.getTextWidth(term);
          const estCellW = fullW + Math.max(3.0, cellTraceFontSize * 0.18);
          const maxCellW = colTextWidth - (isA5 ? 3.0 : 4.5);
          if (estCellW > maxCellW) {
            const scale = maxCellW / estCellW;
            wordFontSize = Math.max(7.5, Math.floor(chosenFontSize * scale));
            cellTraceFontSize = Math.max(14, Math.floor(chosenTraceFontSize * scale));
          }

          const baselineY = rowCenterY + (cellTraceFontSize * 0.352778) * 0.28;

          const isAnsMode = options.answerMode === 'answer';
          if (colMode === 'alphabet_order' || colMode === 'vowels_only') {
            const { traceIndices, blankIndices } = getType4TargetLetterIndices(
              term,
              colMode,
              options.type4AlphabetTargetLetter || 'c'
            );

            const col1X = tableX + col1Width + (isA5 ? 2.0 : 3.5);
            const col2X = tableX + col1Width + colTextWidth + (isA5 ? 2.0 : 3.5);

            drawType4WordCell(doc, term, { mode: 'custom', traceIndices, blankIndices: new Set<number>() } as Type4CellConfig, col1X, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
            drawType4WordCell(doc, term, { mode: 'custom', traceIndices: new Set<number>(), blankIndices } as Type4CellConfig, col2X, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
          } else {
            for (let c = 0; c < cellTypes.length; c++) {
              const cellType = cellTypes[c];
              const cellX = tableX + col1Width + c * colTextWidth + (isA5 ? 2.0 : 3.5);
              drawType4WordCell(doc, term, cellType, cellX, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
            }
          }
        }

        // Footer
        if (showFooter) {
          doc.setFont('fff', 'normal');
          doc.setFontSize(isA5 ? 8 : 10);
          doc.setTextColor(100, 100, 100);
          if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
          if (totalPages > 1) {
            doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
          }
        }
      }
    } else {
      // -------------------------------------------------------------
      // TYPE 4: Missing Letters Worksheet (Matches media_1790061642463.png)
      // Dynamic spacing between rows (gap between missing word and next image)
      // Guarantees zero collision at 0 pt spacing regardless of font size
      // -------------------------------------------------------------
      const cols = 3;
      const colWidth = printableWidth / cols; // 40.86 mm on A5
      const topMargin = (showHeader && title) ? margin + 14 : margin + 4;
      const availHeight = printableHeight - (topMargin - margin) - 4;

      const effectiveFontSize = fontSize || (isA5 ? 12 : 14);
      const effectiveSpacing = spacing !== undefined ? spacing : 6;
      const gridMetrics = calculateType4GridMetrics(effectiveFontSize, effectiveSpacing, imgSize, isA5);
      const { textOffset, rowHeight } = gridMetrics;

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

        doc.setDrawColor(80, 80, 80);
        doc.setLineWidth(0.15);
        setDocLineDash(doc, [0.4, 0.6]);
        doc.setFontSize(effectiveFontSize);
        applyFont(doc, activeFont, 'normal');

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

          // In Answer mode: render completed word in bold red. In Student mode: punch blanks
          const textY = imgY + imgSize + textOffset;
          if (options.answerMode === 'answer') {
            applyFont(doc, activeFont, 'bold');
            doc.setFontSize(effectiveFontSize);
            doc.setTextColor(220, 38, 38);
            doc.text(validWords[i].term, colCenter, textY, { align: 'center' });
            applyFont(doc, activeFont, 'normal');
            doc.setTextColor(0, 0, 0);
          } else {
            const missingTerm = punchBlanks(validWords[i].term, blankMode);
            doc.text(missingTerm, colCenter, textY, { align: 'center' });
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
    }
  } else if (type === 6) {
    // -------------------------------------------------------------
    // TYPE 6: Tick/circle the correct word for each picture (Multiple Choice)
    // Supports 2 or 3 choices (MTQ), no radio circle (students circle text directly)
    // -------------------------------------------------------------
    const cols = 2;
    const allTerms = validWords.map((w) => w.term);
    const colWidth = printableWidth / cols; // ~61.3 mm on A5
    const topStart = showHeader ? margin + 14 : margin + 4;
    const availHeight = printableHeight - (topStart - margin) - 4;

    const isHorizontal = options.choiceLayout === 'horizontal';
    const numChoices = isHorizontal ? 2 : ((options.choiceCount === 2) ? 2 : 3);
    const numDistractors = numChoices - 1;

    const ptToMm = 0.352778;
    const effectiveFontSize = options.fontSize || (isA5 ? 12 : 14);
    const effectiveSpacing = (spacing !== undefined ? spacing : 6);
    const fontHeightMm = effectiveFontSize * ptToMm;

    let contentHeight = imgSize;
    let rowGap = (effectiveSpacing === 0 ? 1.0 : 2.0) + effectiveSpacing * ptToMm * 0.6;
    let spacingFactor = 1.18;
    let optPitch = 0;
    let optionsBlockHeight = 0;

    if (isHorizontal) {
      contentHeight = Math.max(imgSize, fontHeightMm);
      rowGap = (effectiveSpacing === 0 ? 1.2 : 2.5) + effectiveSpacing * ptToMm * 0.75;
    } else {
      spacingFactor = numChoices === 2 ? 1.40 : 1.36;
      optPitch = fontHeightMm * spacingFactor + (effectiveSpacing * ptToMm * 0.45);
      optionsBlockHeight = (numChoices - 1) * optPitch + fontHeightMm;
      contentHeight = Math.max(imgSize, optionsBlockHeight);
      rowGap = (effectiveSpacing === 0 ? 1.0 : 2.0) + effectiveSpacing * ptToMm * 0.6;
    }

    const rowHeight = contentHeight + rowGap;

    const maxRowsPerPage = Math.max(1, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        applyFont(doc, 'r0c0i Linotte', 'bold');
        doc.setFontSize(isA5 ? 15 : 18);
        doc.setTextColor(20, 20, 20);
        if (isHorizontal) {
          doc.text(title, margin, margin + 5, { maxWidth: printableWidth, align: 'left' });
        } else {
          doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
        }
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

        // 2 or 3 options (1 correct, 1 or 2 distractors)
        const otherTerms = allTerms.filter((t) => t.toLowerCase() !== currentWord.toLowerCase());
        let distractors: string[] = (shuffleArray(otherTerms) as string[]).slice(0, numDistractors);
        if (distractors.length < numDistractors) {
          const fallbacks = ['apple', 'banana', 'cat', 'dog', 'sun', 'star', 'tree', 'book', 'ball', 'fish'];
          const extra = fallbacks.filter(
            (t) => t.toLowerCase() !== currentWord.toLowerCase() && !distractors.some((d) => d.toLowerCase() === t.toLowerCase())
          );
          distractors = [...distractors, ...(shuffleArray(extra) as string[])].slice(0, numDistractors);
        }
        const optionsList: string[] = shuffleArray([currentWord, ...distractors]) as string[];

        // Draw picture on left (vertically centered relative to content)
        const imgX = startX + 1.5;
        const imgY = startY + Math.max(0, (contentHeight - imgSize) / 2);
        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        if (isHorizontal) {
          // Horizontal layout for 2 choices (side-by-side next to image, matching sample Look and Circle)
          const optStartX = imgX + imgSize + (isA5 ? 3.5 : 5.0);
          const availTextWidth = (startX + colWidth) - optStartX - (isA5 ? 1.0 : 2.0);
          const slotWidth = availTextWidth / 2;
          const minWordGap = 2.5;
          const maxSlotWordWidth = Math.max(10, slotWidth - minWordGap);

          // Auto-scale safeguard for both words in horizontal slots
          doc.setFontSize(effectiveFontSize);
          applyFont(doc, fontFamily, 'normal');

          let maxRequiredWidth = 0;
          for (let opt = 0; opt < 2; opt++) {
            const w = doc.getTextWidth(optionsList[opt] || '');
            if (w > maxRequiredWidth) maxRequiredWidth = w;
          }

          let itemFontSize = effectiveFontSize;
          if (maxRequiredWidth > maxSlotWordWidth && maxRequiredWidth > 0) {
            const scale = maxSlotWordWidth / maxRequiredWidth;
            itemFontSize = Math.max(8, Math.floor(effectiveFontSize * scale));
          }

          doc.setFontSize(itemFontSize);
          applyFont(doc, fontFamily, 'normal');

          const itemFontHeightMm = itemFontSize * ptToMm;
          const rowCenterY = startY + contentHeight / 2;
          const baselineY = rowCenterY + (itemFontHeightMm * 0.35);

          for (let opt = 0; opt < 2; opt++) {
            const optText = optionsList[opt] || '';
            const optX = optStartX + opt * slotWidth;
            const isCorrect = optText.trim().toLowerCase() === currentWord.trim().toLowerCase();
            if (options.answerMode === 'answer' && isCorrect) {
              const textW = doc.getTextWidth(optText);
              const pillPadX = 1.8;
              const pillPadY = Math.min(0.7, itemFontHeightMm * 0.12);
              const pillH = itemFontHeightMm * 0.95 + pillPadY * 2;
              const pillY = baselineY - itemFontHeightMm * 0.78 - pillPadY;
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.45);
              doc.roundedRect(optX - pillPadX, pillY, textW + pillPadX * 2, pillH, pillH / 2, pillH / 2, 'S');
              applyFont(doc, fontFamily, 'bold');
              doc.setTextColor(220, 38, 38);
              doc.text(optText, optX, baselineY);
              applyFont(doc, fontFamily, 'normal');
              doc.setTextColor(30, 41, 59);
            } else {
              doc.setTextColor(30, 41, 59);
              doc.text(optText, optX, baselineY);
            }
          }
        } else {
          // Choices vertically stacked on right of picture
          const optStartX = imgX + imgSize + 4;
          doc.setFontSize(effectiveFontSize);
          applyFont(doc, fontFamily, 'normal');

          const maxAllowedWidth = colWidth - (imgSize + 7.5);
          let itemFontSize = effectiveFontSize;
          let maxOptWidth = 0;
          for (const optText of optionsList) {
            const w = doc.getTextWidth(optText || '');
            if (w > maxOptWidth) maxOptWidth = w;
          }

          if (maxOptWidth > maxAllowedWidth && maxOptWidth > 0) {
            const scale = maxAllowedWidth / maxOptWidth;
            itemFontSize = Math.max(9, Math.floor(effectiveFontSize * scale));
          }

          doc.setFontSize(itemFontSize);
          applyFont(doc, fontFamily, 'normal');

          const itemFontHeightMm = itemFontSize * ptToMm;
          const itemOptPitch = itemFontHeightMm * spacingFactor + (effectiveSpacing * ptToMm * 0.45);
          const itemOptionsBlockHeight = (numChoices - 1) * itemOptPitch + itemFontHeightMm;
          const fontAscent = itemFontHeightMm * 0.78;

          const optBlockTop = startY + Math.max(0, (contentHeight - itemOptionsBlockHeight) / 2);
          const firstBaseline = optBlockTop + fontAscent;

          for (let opt = 0; opt < numChoices; opt++) {
            const optText = optionsList[opt] || '';
            const optY = firstBaseline + opt * itemOptPitch;
            const isCorrect = optText.trim().toLowerCase() === currentWord.trim().toLowerCase();
            if (options.answerMode === 'answer' && isCorrect) {
              const textW = doc.getTextWidth(optText);
              const pillPadX = 1.8;
              const pillPadY = Math.min(0.7, itemFontHeightMm * 0.12);
              const pillH = itemFontHeightMm * 0.95 + pillPadY * 2;
              const pillY = optY - itemFontHeightMm * 0.78 - pillPadY;
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.45);
              doc.roundedRect(optStartX - pillPadX, pillY, textW + pillPadX * 2, pillH, pillH / 2, pillH / 2, 'S');
              applyFont(doc, fontFamily, 'bold');
              doc.setTextColor(220, 38, 38);
              doc.text(optText, optStartX, optY);
              applyFont(doc, fontFamily, 'normal');
              doc.setTextColor(30, 41, 59);
            } else {
              doc.setTextColor(30, 41, 59);
              doc.text(optText, optStartX, optY);
            }
          }
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

    const metrics = calculateType7Metrics(fontSize, spacing, imgSize, isA5);
    const { effectiveFontSize, textOffset1, textOffset2, rowHeight } = metrics;

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        applyFont(doc, fontFamily, 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.text(title, pageWidth / 2, margin + 5, { maxWidth: printableWidth, align: 'center' });
      }

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
        const textY1 = imgY + imgSize + textOffset1;
        const textY2 = textY1 + textOffset2;

        doc.setFontSize(effectiveFontSize);
        applyFont(doc, fontFamily, 'normal');
        doc.setTextColor(30, 41, 59);
        doc.text(scrambled, colCenter, textY1, { align: 'center' });

        if (options.answerMode === 'answer') {
          applyFont(doc, fontFamily, 'bold');
          doc.setTextColor(220, 38, 38);
          doc.text(validWords[i].term, colCenter, textY2, { align: 'center' });
          applyFont(doc, fontFamily, 'normal');
          doc.setTextColor(30, 41, 59);
        } else {
          const blanks = validWords[i].term
            .split(' ')
            .map((part) => '__ '.repeat(part.length).trim())
            .join('   ');
          doc.text(blanks, colCenter, textY2, { align: 'center' });
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
    const rowGap = (spacing !== undefined ? spacing : 6) * 0.352778;

    const displayTitle = (title && title.trim()) ? title : 'Look and trace';
    const topMargin = margin + 9;
    const tableTopY = topMargin;
    const availHeight = pageHeight - margin - tableTopY - (showFooter ? 8 : 4);

    const isAnsMode = options.answerMode === 'answer';
    const traceFont = isAnsMode ? (fontFamily && fontFamily !== 'KG Primary Dots' ? fontFamily : 'r0c0i Linotte') : 'KG Primary Dots';

    // Pre-calculate layouts and needed row heights for each word
    const wordLayouts = validWords.map((w) => {
      return layoutTraceText(doc, w.term, traceFontSize, colTraceWidth - 3, traceFont);
    });

    const wordRowHeights = wordLayouts.map((l) => {
      const textBlockH = l.lines.length * (l.fontSize * 0.352778 * 1.15);
      const contentH = Math.max(imgSize, textBlockH);
      const baseRowHeight = contentH + Math.max(2.0, (traceFontSize * 0.352778) * 0.22);
      return baseRowHeight + rowGap;
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
        const baseRowHeight = rowH - rowGap;
        const rowCenterY = currentY + baseRowHeight / 2;

        // Column 1: Image or Letter Circle Badge (Strictly NO frame/border around image)
        const col1CenterX = tableX + col1Width / 2;
        if (img) {
          const maxDim = Math.min(imgSize, baseRowHeight - 1, col1Width - 4);
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
          const badgeRadius = Math.min(baseRowHeight * 0.38, col1Width * 0.36);
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

        // Columns 2, 3, 4: Trace text with font KG Primary Dots (or solid red font in answer mode)
        if (isAnsMode) {
          applyFont(doc, traceFont, 'bold');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(220, 38, 38);
        } else {
          doc.setFont('KGPrimaryDots', 'normal');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(30, 30, 30);
        }

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
          doc.line(tableX, currentY + baseRowHeight, tableX + tableWidth, currentY + baseRowHeight);
          const vCols = [
            tableX,
            tableX + col1Width,
            tableX + col1Width + colTraceWidth,
            tableX + col1Width + colTraceWidth * 2,
            tableX + tableWidth
          ];
          for (const vx of vCols) {
            doc.line(vx, currentY, vx, currentY + baseRowHeight);
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
    // Dynamic compact spacing responsive to user's spacing setting
    // -------------------------------------------------------------
    const cols = 3;
    const colGap = isA5 ? 3.0 : 4.5;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
    const topMargin = (showHeader && title) ? margin + (isA5 ? 12 : 14) : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const metrics = calculateType9Metrics(isA5, imgSize, spacing, fontSize, cardWidth);
    const { maxImgDim, sFontSize, gapImgToSentence, gapSentenceToYesNo, circleRadius, rowGap, baseRowHeight } = metrics;
    const circleSpacing = isA5 ? 15 : 20;

    // Pre-calculate parsed sentence spans and measured heights for each word
    const parsedWords = validWords.map((w) => {
      const spans = parseHighlightedSentence(w.exampleSentence, w.term);
      const layout = measureHighlightedSentenceLines(doc, spans, cardWidth, sFontSize, options.fontFamily);
      return {
        word: w,
        spans,
        sentenceH: layout.totalHeight
      };
    });

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / baseRowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    const wordsWithImages = validWords
      .map((w, idx) => ({ word: w, img: wordImages[idx] }))
      .filter((item) => item.img !== null);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        applyFont(doc, options.fontFamily, 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + (isA5 ? 5.5 : 7));
        doc.setTextColor(0, 0, 0);
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);
      const pageWords = parsedWords.slice(startIdx, endIdx);
      const totalPageRows = Math.ceil(pageWords.length / cols);

      let curY = topMargin;

      for (let r = 0; r < totalPageRows; r++) {
        const rowStartIndex = r * cols;
        const rowEndIndex = Math.min(rowStartIndex + cols, pageWords.length);
        const rowItems = pageWords.slice(rowStartIndex, rowEndIndex);

        const maxSentenceH = Math.max(...rowItems.map((item) => item.sentenceH));
        const cardHeight = maxImgDim + gapImgToSentence + maxSentenceH + gapSentenceToYesNo + circleRadius * 2;
        const rowHeight = cardHeight + rowGap;

        for (let c = 0; c < rowItems.length; c++) {
          const globalIdx = startIdx + rowStartIndex + c;
          const item = rowItems[c];
          const currentWord = item.word;
          const targetImg = wordImages[globalIdx];

          const cardX = margin + c * (cardWidth + colGap);

          // Find distractor image from other words
          const otherImages = wordsWithImages.filter(
            (it) => it.word.term.toLowerCase() !== currentWord.term.toLowerCase()
          );
          let distractorImg: string | null = null;
          if (otherImages.length > 0) {
            const distractorIdx = (globalIdx * 7 + 3) % otherImages.length;
            distractorImg = otherImages[distractorIdx].img;
          }

          let isYes = (globalIdx % 3 !== 1);
          if (!distractorImg && !isYes) {
            isYes = true;
          }
          const displayedImg = isYes ? targetImg : distractorImg;

          // 1. Top Compartment: Centered Image (compact, strictly NO card frame/borders)
          const lx = cardX + (cardWidth - maxImgDim) / 2;
          const ly = curY;
          if (displayedImg) {
            try {
              doc.addImage(displayedImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          // 2. Middle Compartment: Sentence with highlighted <#...#> in RED (tight gap below image)
          const sentenceTopY = curY + maxImgDim + gapImgToSentence;
          const extraPad = (maxSentenceH - item.sentenceH) / 2;
          drawHighlightedCenteredSentence(
            doc,
            item.spans,
            cardX,
            sentenceTopY + extraPad,
            cardWidth,
            item.sentenceH,
            sFontSize,
            options.fontFamily
          );

          // 3. Bottom: 2 circles "Yes" and "No" centered under each sentence (tight gap below sentence)
          const yesNoTopY = sentenceTopY + maxSentenceH + gapSentenceToYesNo;
          const circleCenterY = yesNoTopY + circleRadius;
          const cardCenterX = cardX + cardWidth / 2;
          const yesCenterX = cardCenterX - circleSpacing / 2;
          const noCenterX = cardCenterX + circleSpacing / 2;

          const isAnsMode = options.answerMode === 'answer';

          if (isAnsMode) {
            const correctCenterX = isYes ? yesCenterX : noCenterX;
            const otherCenterX = isYes ? noCenterX : yesCenterX;
            const correctText = isYes ? 'Yes' : 'No';
            const otherText = isYes ? 'No' : 'Yes';

            // Correct circle: filled in red with white bold text
            doc.setFillColor(220, 38, 38);
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.4);
            doc.circle(correctCenterX, circleCenterY, circleRadius, 'FD');

            applyFont(doc, options.fontFamily, 'bold');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(255, 255, 255);
            doc.text(correctText, correctCenterX, circleCenterY, { align: 'center', baseline: 'middle' });

            // Other circle: hollow with normal text
            doc.setDrawColor(70, 70, 70);
            doc.setLineWidth(0.3);
            doc.circle(otherCenterX, circleCenterY, circleRadius, 'S');

            applyFont(doc, options.fontFamily, 'normal');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(30, 41, 59);
            doc.text(otherText, otherCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.setTextColor(0, 0, 0);
          } else {
            doc.setDrawColor(70, 70, 70);
            doc.setLineWidth(0.3);
            doc.circle(yesCenterX, circleCenterY, circleRadius, 'S');
            doc.circle(noCenterX, circleCenterY, circleRadius, 'S');

            applyFont(doc, options.fontFamily, 'normal');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(30, 41, 59);
            doc.text('Yes', yesCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.text('No', noCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.setTextColor(0, 0, 0);
          }
        }

        curY += rowHeight;
      }

      if (showFooter) {
        applyFont(doc, options.fontFamily, 'normal');
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

    const metrics = calculateType10Metrics(isA5, imgSize, spacing, fontSize, cardWidth);
    const { effectiveFontSize, subW, imgBoxHeight, maxImgDim, wordBoxHeight, rowHeight } = metrics;

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
        applyFont(doc, fontFamily, 'bold');
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

        const lx = cardX + (subW - maxImgDim) / 2;
        const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
        const rx = cardX + subW + (subW - maxImgDim) / 2;
        const ry = cardY + (imgBoxHeight - maxImgDim) / 2;

        // Left Image (Centered in left half)
        if (leftImg) {
          try {
            doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          doc.rect(lx, ly, maxImgDim, maxImgDim);
        }

        // Right Image (Centered in right half)
        if (rightImg) {
          try {
            doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          doc.rect(rx, ry, maxImgDim, maxImgDim);
        }

        const isAnsMode = options.answerMode === 'answer';

        // Highlight correct image in Answer Mode
        if (isAnsMode) {
          const ansX = isCorrectOnLeft ? lx : rx;
          const ansY = isCorrectOnLeft ? ly : ry;

          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.5);
          doc.roundedRect(ansX - 0.8, ansY - 0.8, maxImgDim + 1.6, maxImgDim + 1.6, 1.2, 1.2, 'S');

          const badgeR = 2.0;
          const badgeX = ansX + maxImgDim - 0.8;
          const badgeY = ansY + 0.8;
          doc.setFillColor(220, 38, 38);
          doc.circle(badgeX, badgeY, badgeR, 'F');
          applyFont(doc, 'r0c0i Linotte', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text('✓', badgeX, badgeY + 0.65, { align: 'center' });
        }

        // Word text (Centered under both images)
        const textY = cardY + imgBoxHeight + wordBoxHeight / 2 + (isA5 ? 1.0 : 1.3);
        if (isAnsMode) {
          applyFont(doc, fontFamily, 'bold');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(220, 38, 38);
          doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
            align: 'center',
            maxWidth: cardWidth - 2
          });
          doc.setTextColor(0, 0, 0);
          applyFont(doc, fontFamily, 'normal');
        } else {
          applyFont(doc, fontFamily, 'normal');
          doc.setFontSize(effectiveFontSize);
          doc.setTextColor(30, 41, 59);
          doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
            align: 'center',
            maxWidth: cardWidth - 2
          });
          doc.setTextColor(0, 0, 0);
        }
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
  } else if (type === 11) {
    // -------------------------------------------------------------
    // TYPE 11: Write and circle the correct picture (Tập viết từ và khoanh tranh đúng)
    // Left: Tracing word with font KG Primary Dots and continuous baseline
    // Right: 3 picture choices (1 correct + 2 distractors) with short baseline under each picture
    // Strictly NO bounding box / frame around cards or images!
    // -------------------------------------------------------------
    const isAnsMode = options.answerMode === 'answer';
    const tableX = margin;
    const tableWidth = printableWidth;
    const colWordWidth = isA5 ? 46.0 : 68.0;
    const colPicsWidth = tableWidth - colWordWidth;
    const numChoices = 3; // Fixed to 3 pictures per row
    const slotWidth = colPicsWidth / 3;

    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;
    const isTrace = activeFont === 'KG Primary Dots' || activeFont === 'KGPrimaryDots';
    const defaultFontSize = isTrace ? (isA5 ? 22 : 26) : (isA5 ? 13 : 15);
    const wordFontSize = fontSize || defaultFontSize;

    const imgBoxHeight = Math.max(imgSize + 2.0, isA5 ? 14.0 : 16.0);
    const textH = wordFontSize * 0.352778 * 1.25;
    const contentH = Math.max(imgBoxHeight, textH + 2.0);
    const rowGap = (spacing === 0 ? 2.0 : 2.5) + (spacing !== undefined ? spacing : 0) * 0.25;
    const rowHeight = contentH + rowGap;
    const topMargin = (showHeader && title) ? margin + 12 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const maxRowsPerPage = Math.max(2, Math.floor(availHeight / rowHeight));
    const wordsPerPage = maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    const wordsWithImages = validWords
      .map((w, idx) => ({ word: w, img: wordImages[idx] }))
      .filter((item) => item.img !== null);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 15 : 20);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + 4);
        doc.setTextColor(0, 0, 0);
      }

      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);

      for (let i = startIdx; i < endIdx; i++) {
        const itemIdx = i - startIdx;
        const rowY = topMargin + itemIdx * rowHeight;
        const rowContentHeight = rowHeight - rowGap;
        const rowCenterY = rowY + rowContentHeight / 2;

        const currentWord = validWords[i];
        const targetImg = wordImages[i];

        // Pick 2 distinct distractors from other words with images
        const otherImages = wordsWithImages.filter(
          (item) => item.word.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
        );
        let distractor1: string | null = null;
        let distractor2: string | null = null;
        if (otherImages.length >= 2) {
          const idx1 = (i * 2 + 1) % otherImages.length;
          let idx2 = (idx1 + 1 + (i % (otherImages.length - 1))) % otherImages.length;
          if (idx2 === idx1) idx2 = (idx1 + 1) % otherImages.length;
          distractor1 = otherImages[idx1].img;
          distractor2 = otherImages[idx2].img;
        } else if (otherImages.length === 1) {
          distractor1 = otherImages[0].img;
          distractor2 = targetImg || distractor1;
        } else {
          distractor1 = targetImg;
          distractor2 = targetImg;
        }

        // Determine slot for correct target image (0, 1, or 2)
        const targetSlot = (i * 2 + currentWord.term.length) % 3;
        const distractors = [distractor1, distractor2];
        let dIdx = 0;
        const slotImages: (string | null)[] = [];
        for (let s = 0; s < 3; s++) {
          if (s === targetSlot) {
            slotImages[s] = targetImg || distractor1 || distractor2;
          } else {
            slotImages[s] = distractors[dIdx++] || targetImg;
          }
        }

        // 1. Draw Left Word Section (No underline)
        const wordLeft = tableX;
        const wordRight = tableX + colWordWidth - 4.0;
        const wordCenterX = (wordLeft + wordRight) / 2;

        const layout = layoutTraceText(doc, currentWord.term, wordFontSize, wordRight - wordLeft - 4.0, activeFont);
        if (isAnsMode) {
          applyFont(doc, activeFont, 'bold');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(220, 38, 38);
        } else {
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(isTrace ? 30 : 15, isTrace ? 30 : 23, isTrace ? 30 : 42);
        }

        if (layout.lines.length <= 1) {
          doc.text(layout.lines[0] || '', wordCenterX, rowCenterY + (layout.fontSize * 0.352778) * 0.35, { align: 'center' });
        } else {
          const lineHeight = layout.fontSize * 0.352778 * 1.15;
          const totalH = (layout.lines.length - 1) * lineHeight;
          const topY = rowCenterY - totalH / 2 + (layout.fontSize * 0.352778) * 0.35;
          layout.lines.forEach((lineText, lineIdx) => {
            doc.text(lineText, wordCenterX, topY + lineIdx * lineHeight, { align: 'center' });
          });
        }

        // 2. Draw Right Picture Section (No underline)
        const maxImgDim = Math.min(imgSize, slotWidth - 4.0, imgBoxHeight);
        for (let c = 0; c < numChoices; c++) {
          const slotLeft = tableX + colWordWidth + c * slotWidth;
          const slotCenterX = slotLeft + slotWidth / 2;
          const imgToDraw = slotImages[c];

          const picX = slotCenterX - maxImgDim / 2;
          const picY = rowCenterY - maxImgDim / 2;

          if (imgToDraw) {
            try {
              doc.addImage(imgToDraw, 'JPEG', picX, picY, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(picX, picY, maxImgDim, maxImgDim);
            }
            if (showImageBorder) {
              doc.setDrawColor(180, 180, 180);
              doc.setLineWidth(0.2);
              doc.rect(picX, picY, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.2);
            doc.rect(picX, picY, maxImgDim, maxImgDim);
          }

          if (isAnsMode && c === targetSlot) {
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.85);
            setDocLineDash(doc, []);
            doc.circle(slotCenterX, rowCenterY, maxImgDim * 0.58, 'S');
          }
        }
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
  } else if (type === 12) {
    // -------------------------------------------------------------
    // TYPE 12: Look and write (2 columns, centered image above, blanked sentence below)
    // A4: 3 rows (6 items/page), A5: 2 rows (4 items/page)
    // Strictly NO bounding box / frame around cards or images!
    // -------------------------------------------------------------
    const isAnsMode = options.answerMode === 'answer';
    const cols = 2;
    const colGap = isA5 ? 6.0 : 10.0;
    const cardWidth = (printableWidth - colGap) / 2;
    const topMargin = (showHeader && title) ? margin + 12 : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const sFontSize = fontSize || (isA5 ? 11.5 : 13.5);
    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;

    const imgBoxHeight = imgSize + (isA5 ? 3.0 : 4.0);
    const sentenceBoxHeight = Math.max(isA5 ? 12.0 : 15.0, (sFontSize * 0.352778 * 1.35 * 2) + 2.0);
    const cardHeight = imgBoxHeight + sentenceBoxHeight;
    const spacingMm = (spacing !== undefined ? spacing : 0) * 0.352778;
    const maxRowsPerPage = isA5 ? 2 : 3;
    const rowGap = (spacing === 0)
      ? (isA5 ? 2.0 : 2.5)
      : Math.min(Math.max(3.0 + spacingMm, (availHeight - maxRowsPerPage * cardHeight) / Math.max(1, maxRowsPerPage)), 14.0);
    const rowHeight = cardHeight + rowGap;

    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

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

        // 1. Top: Centered Image (0.5x0.5 in = 12.7x12.7 mm, exactly consistent with other WS)
        const lx = cardX + (cardWidth - imgSize) / 2;
        const ly = cardY + (imgBoxHeight - imgSize) / 2;
        if (targetImg) {
          try {
            doc.addImage(targetImg, 'JPEG', lx, ly, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(lx, ly, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(lx, ly, imgSize, imgSize);
        }

        // 2. Bottom: Sentence or Blanked Word
        if (isAnsMode) {
          if (currentWord.exampleSentence && currentWord.exampleSentence.trim().length > 0) {
            const spans = parseHighlightedSentence(currentWord.exampleSentence, currentWord.term);
            drawType15SentenceLine(
              doc,
              spans,
              null,
              cardX,
              cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2,
              cardWidth,
              sFontSize,
              activeFont
            );
          } else {
            applyFont(doc, activeFont, 'bold');
            doc.setFontSize(sFontSize);
            doc.setTextColor(220, 38, 38);
            doc.text(currentWord.term, cardX + cardWidth / 2, cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2, {
              align: 'center',
              maxWidth: cardWidth - 4
            });
            doc.setTextColor(0, 0, 0);
          }
        } else {
          const sentenceData = getLookAndWriteSentence(currentWord);
          if (sentenceData) {
            drawLookAndWriteSentence(
              doc,
              sentenceData.fullSentence,
              cardX,
              cardY + imgBoxHeight,
              cardWidth,
              sentenceBoxHeight,
              sFontSize,
              activeFont
            );
          } else {
            const blankedTerm = formatLookAndWriteTerm(currentWord.term);
            applyFont(doc, activeFont, 'normal');
            doc.setFontSize(sFontSize);
            doc.setTextColor(30, 41, 59);
            doc.text(blankedTerm, cardX + cardWidth / 2, cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2, {
              align: 'center',
              maxWidth: cardWidth - 4
            });
            doc.setTextColor(0, 0, 0);
          }
        }
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
  } else if (type === 13) {
    // -------------------------------------------------------------
    // TYPE 13: Wordsearch Puzzle (Tìm từ trong ô chữ)
    // Puzzle grid with small dotted borders + word or image hints
    // -------------------------------------------------------------
    const directions = options.wordsearchDirections || ['horizontal', 'vertical', 'diagonalDown'];
    const hintType = options.wordsearchHintType || 'word';
    const gridSizePref = options.wordsearchGridSize || 'auto';
    const gridBorder = options.wordsearchGridBorder || 'none';
    const wordsearchCase = options.wordsearchCase || 'lower';
    const activeFontSize = fontSize || 12;

    // Maximum words per puzzle page to prevent overcrowding and ensure elegant layout:
    // A5: up to 10 words per puzzle, A4: up to 12 words per puzzle
    const wordsPerPage = isA5 ? 10 : 12;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    // Create a map of word imageUrl to pre-fetched base64 for quick lookup
    const wordImagesMap = new Map<string, string | null>();
    validWords.forEach((w, idx) => {
      if (w.imageUrl) wordImagesMap.set(w.imageUrl, wordImages[idx] || null);
    });

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      let currentY = margin + 4;

      // 1. Header (Title)
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 15 : 20);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, currentY);
        doc.setTextColor(0, 0, 0);

        currentY += isA5 ? 6 : 7;
      }

      // Page words slice
      const startIdx = page * wordsPerPage;
      const endIdx = Math.min((page + 1) * wordsPerPage, validWords.length);
      const pageWords = validWords.slice(startIdx, endIdx);

      // 2. Generate Wordsearch Puzzle
      const puzzle = generateWordsearchPuzzle(pageWords, directions, gridSizePref, wordsearchCase);
      const { grid, placedWords } = puzzle;
      const cols = grid[0].length;
      const rows = grid.length;

      // Calculate cell size scaling proportionally with fontSize
      const proportionalCellSize = activeFontSize * 0.58;
      const gapX = isA5 ? 3.0 : 4.0;
      const minFlankW = isA5 ? (hintType === 'word' ? 24 : 18) : (hintType === 'word' ? 30 : 24);
      const maxGridW = printableWidth - 2 * minFlankW - 2 * gapX;
      const maxGridH = printableHeight - (currentY - margin) - (showFooter ? 10 : 4);

      const maxCellFromW = maxGridW / cols;
      const maxCellFromH = maxGridH / rows;
      const cellSize = Math.max(3.8, Math.min(proportionalCellSize, maxCellFromW, maxCellFromH));

      const totalGridW = cols * cellSize;
      const totalGridH = rows * cellSize;

      const flankColW = Math.max(5, (printableWidth - totalGridW) / 2 - gapX);
      const hintsMetrics = calculateWordsearchHintsMetrics(
        placedWords,
        hintType,
        activeFontSize,
        isA5,
        flankColW,
        totalGridH,
        doc,
        activeFont,
        wordsearchCase,
        imgSize
      );
      const hintsTotalH = hintsMetrics.hintsTotalH;

      const blockTotalH = Math.max(totalGridH, hintsTotalH);
      const gridStartX = margin + (printableWidth - totalGridW) / 2;
      const gridStartY = currentY + (blockTotalH - totalGridH) / 2;
      const hintsStartY = currentY + (blockTotalH - hintsTotalH) / 2;

      const isAnsMode = options.answerMode === 'answer';

      // 3. Draw Puzzle Grid
      drawWordsearchGrid(doc, grid, gridStartX, gridStartY, cellSize, activeFont, gridBorder, activeFontSize, isAnsMode, placedWords);

      // 4. Draw Flanking Hints
      await drawWordsearchHints(
        doc,
        placedWords,
        hintType,
        hintsStartY,
        printableWidth,
        margin,
        isA5,
        activeFont,
        wordImagesMap,
        {
          gridStartX,
          totalGridW,
          totalGridH,
          fontSize: activeFontSize,
          showImageBorder,
          gapX,
          wordsearchCase,
          imageSize: imgSize,
          isAnswerMode: isAnsMode
        }
      );

      // 5. Footer
      if (showFooter) {
        doc.setFont('fff', 'normal');
        doc.setFontSize(isA5 ? 8 : 10);
        if (sourceUrl) doc.text(`Learn: ${sourceUrl}`, pageWidth / 2, pageHeight - margin + 3, { align: 'center' });
        if (totalPages > 1) {
          doc.text(`${page + 1}`, pageWidth - margin, pageHeight - margin + 3);
        }
      }
    }
  } else if (type === 14) {
    // -------------------------------------------------------------
    // TYPE 14: Circle pictures with target letter
    // Clean 4 columns x 2 rows (8 words per page)
    // -------------------------------------------------------------
    const cols = 4;
    const colGap = isA5 ? 3.0 : 5.0;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
    const wordsPerPage = 8;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);
    const showLabels = options.showWordLabels !== false;
    const effectiveFontSize = fontSize || (isA5 ? 11.5 : 13.5);
    const labelH = showLabels ? (effectiveFontSize * 0.352778 + 3.5) : 0;
    const cardHeight = imgSize + labelH;

    const effectiveSpacing = spacing !== undefined ? spacing : 6;
    const baseGap = (spacing === 0) ? 1.5 : (isA5 ? 4.0 : 5.0);
    const rowGap = baseGap + effectiveSpacing * 0.352778;
    const rowHeight = cardHeight + rowGap;

    const topMargin = (showHeader && title) ? margin + (isA5 ? 12 : 15) : margin + 4;

    const isAnsMode = options.answerMode === 'answer';
    const targetLetter = (options.targetLetter || 'a').toLowerCase();

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // 1. Header (Title with red target letter)
      if (showHeader && title) {
        drawTargetLetterTitle(
          doc,
          title,
          options.targetLetter,
          margin,
          margin + (isA5 ? 5.5 : 7),
          isA5 ? 15 : 20,
          activeFont
        );
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
        const hasTargetLetter = currentWord.term.toLowerCase().includes(targetLetter);

        // Centered image (0.5 x 0.5 in = 12.7 x 12.7 mm)
        const imgX = cardX + (cardWidth - imgSize) / 2;
        const imgY = cardY;

        if (targetImg) {
          try {
            doc.addImage(targetImg, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        // Highlight correct image in Answer Mode
        if (isAnsMode && hasTargetLetter) {
          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.85);
          setDocLineDash(doc, []);
          doc.circle(imgX + imgSize / 2, imgY + imgSize / 2, imgSize * 0.58, 'S');
        }

        // Lowercase Word label below image
        if (showLabels) {
          if (isAnsMode && hasTargetLetter) {
            applyFont(doc, activeFont, 'bold');
            doc.setFontSize(effectiveFontSize);
            doc.setTextColor(220, 38, 38);
          } else {
            applyFont(doc, activeFont, 'normal');
            doc.setFontSize(effectiveFontSize);
            doc.setTextColor(30, 41, 59);
          }
          const textY = imgY + imgSize + (effectiveFontSize * 0.352778 * 0.9) + 2.0;
          doc.text(currentWord.term.trim().toLowerCase(), cardX + cardWidth / 2, textY, {
            align: 'center',
            maxWidth: cardWidth - 2
          });
          doc.setTextColor(0, 0, 0);
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
  } else if (type === 15) {
    // -------------------------------------------------------------
    // TYPE 15: Read and circle (2 pictures per question in framed card)
    // 2 columns layout.
    // A5: 2 rows (4 items/page); A4: 3 rows (6 items/page) [or 2 rows if large spacing/card height]
    // -------------------------------------------------------------
    const cols = 2;
    const colGap = isA5 ? 5.0 : 8.0;
    const cardWidth = (printableWidth - colGap) / 2;
    const subW = cardWidth / 2;

    const effectiveFontSize = fontSize || (isA5 ? 11.5 : 13.5);
    const effectiveSpacing = spacing !== undefined ? spacing : 6;
    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;
    const numberStyle = options.type15NumberStyle || 'none';
    const borderStyle = options.type15Border || 'full';
    const choiceMode = options.type15ChoiceMode || 'ab';

    const sentenceAreaH = effectiveFontSize * 0.352778 + (isA5 ? 4.5 : 5.5);
    const imgBoxHeight = Math.max(imgSize + (isA5 ? 4.0 : 6.0), isA5 ? 18.0 : 22.0);
    const bottomAreaH = choiceMode === 'ab'
      ? Math.max(effectiveFontSize * 0.352778 + 3.0, isA5 ? 6.5 : 8.0)
      : (choiceMode === 'checkbox' ? (isA5 ? 7.0 : 8.5) : 0);
    const cardHeight = imgBoxHeight + bottomAreaH;
    const itemTotalHeight = sentenceAreaH + cardHeight;

    const baseGap = (effectiveSpacing === 0) ? 1.5 : (isA5 ? 3.5 : 5.0);
    const rowGap = baseGap + effectiveSpacing * 0.352778 * 0.7;
    const rowHeight = itemTotalHeight + rowGap;

    const topMargin = (showHeader && title) ? margin + (isA5 ? 12 : 14) : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const maxRowsPerPage = isA5 ? 2 : Math.max(1, Math.min(3, Math.floor(availHeight / rowHeight)));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    const wordsWithImages = validWords
      .map((w, idx) => ({ word: w, img: wordImages[idx] }))
      .filter((item) => item.img !== null);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title
      if (showHeader && title) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(title, margin, margin + (isA5 ? 5.5 : 7));
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
        const sentence = getType15Sentence(currentWord);

        // Find distractor image from other words
        const otherImages = wordsWithImages.filter(
          (item) => item.word.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
        );
        let distractorImg: string | null = null;
        if (otherImages.length > 0) {
          const distractorIdx = (i * 7 + 3) % otherImages.length;
          distractorImg = otherImages[distractorIdx].img;
        }

        // Balanced alternating 50-50 placement of target picture on 'a' or 'b'
        const isTargetOnA = (i % 4 === 2 || i % 4 === 3);
        const leftImg = isTargetOnA ? targetImg : distractorImg;
        const rightImg = isTargetOnA ? distractorImg : targetImg;

        // 1. Draw Sentence line above card with red highlighted vocabulary
        const textY = cardY + sentenceAreaH / 2 + (isA5 ? 1.0 : 1.3);
        const spans = getType15SentenceSpans(currentWord);
        const numText = numberStyle === 'traditional' ? `${i + 1}. ` : null;
        drawType15SentenceLine(
          doc,
          spans,
          numText,
          cardX,
          textY,
          cardWidth,
          effectiveFontSize,
          activeFont
        );

        // 2. Draw Option Box (Card)
        const boxY = cardY + sentenceAreaH;
        const cornerR = 2.0;

        // Outer rounded border (nét đứt chấm nhỏ giống Loại 13)
        if (borderStyle === 'full' || borderStyle === 'outerOnly') {
          doc.setDrawColor(148, 163, 184); // slate-400
          doc.setLineWidth(0.4);
          setDocLineDash(doc, [0.4, 0.8]);
          doc.roundedRect(cardX, boxY, cardWidth, cardHeight, cornerR, cornerR, 'S');
          setDocLineDash(doc, []); // reset
        }

        // Inner dividers (only for 'full' - nét đứt chấm nhỏ)
        if (borderStyle === 'full') {
          doc.setDrawColor(148, 163, 184); // slate-400
          doc.setLineWidth(0.28);
          setDocLineDash(doc, [0.3, 0.7]);
          doc.line(cardX + subW, boxY, cardX + subW, boxY + cardHeight);

          if (choiceMode === 'ab' || choiceMode === 'checkbox') {
            const dividerY = boxY + imgBoxHeight;
            doc.line(cardX, dividerY, cardX + cardWidth, dividerY);
          }
          setDocLineDash(doc, []); // reset
        }

        const isAnsMode = options.answerMode === 'answer';

        // Choice controls
        if (choiceMode === 'ab') {
          const letterBandY = boxY + imgBoxHeight;
          const letterFontSize = Math.min(effectiveFontSize * 1.1, isA5 ? 13 : 15);
          const letterTextY = letterBandY + bottomAreaH / 2 + (isA5 ? 1.1 : 1.4);

          if (isAnsMode) {
            const correctCenterX = isTargetOnA ? (cardX + subW / 2) : (cardX + subW + subW / 2);
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.65);
            setDocLineDash(doc, []);
            doc.circle(correctCenterX, letterTextY - (isA5 ? 1.1 : 1.3), letterFontSize * 0.45, 'S');

            applyFont(doc, activeFont, isTargetOnA ? 'bold' : 'normal');
            doc.setFontSize(letterFontSize);
            doc.setTextColor(isTargetOnA ? 220 : 30, isTargetOnA ? 38 : 41, isTargetOnA ? 38 : 59);
            doc.text('a', cardX + subW / 2, letterTextY, { align: 'center' });

            applyFont(doc, activeFont, !isTargetOnA ? 'bold' : 'normal');
            doc.setTextColor(!isTargetOnA ? 220 : 30, !isTargetOnA ? 38 : 41, !isTargetOnA ? 38 : 59);
            doc.text('b', cardX + subW + subW / 2, letterTextY, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          } else {
            applyFont(doc, activeFont, 'bold');
            doc.setFontSize(letterFontSize);
            doc.setTextColor(30, 41, 59);
            doc.text('a', cardX + subW / 2, letterTextY, { align: 'center' });
            doc.text('b', cardX + subW + subW / 2, letterTextY, { align: 'center' });
            doc.setTextColor(0, 0, 0);
          }
        } else if (choiceMode === 'checkbox') {
          const checkBandY = boxY + imgBoxHeight;
          const boxDim = isA5 ? 4.5 : 5.2;
          const cBoxY = checkBandY + (bottomAreaH - boxDim) / 2;
          const leftBoxX = cardX + (subW - boxDim) / 2;
          const rightBoxX = cardX + subW + (subW - boxDim) / 2;
          doc.setDrawColor(148, 163, 184); // slate-400
          doc.setLineWidth(0.35);
          doc.roundedRect(leftBoxX, cBoxY, boxDim, boxDim, 0.8, 0.8, 'S');
          doc.roundedRect(rightBoxX, cBoxY, boxDim, boxDim, 0.8, 0.8, 'S');

          if (isAnsMode) {
            const chkX = isTargetOnA ? leftBoxX : rightBoxX;
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.65);
            setDocLineDash(doc, []);
            doc.line(chkX + boxDim * 0.2, cBoxY + boxDim * 0.5, chkX + boxDim * 0.42, cBoxY + boxDim * 0.78);
            doc.line(chkX + boxDim * 0.42, cBoxY + boxDim * 0.78, chkX + boxDim * 0.82, cBoxY + boxDim * 0.22);
          }
        }

        // 3. Draw Images
        const maxImgDim = Math.min(imgSize, subW - 4, imgBoxHeight - 3);

        // Left image
        const lx = cardX + (subW - maxImgDim) / 2;
        const ly = boxY + (imgBoxHeight - maxImgDim) / 2;
        if (leftImg) {
          try {
            doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          doc.rect(lx, ly, maxImgDim, maxImgDim);
        }

        // Right image
        const rx = cardX + subW + (subW - maxImgDim) / 2;
        const ry = boxY + (imgBoxHeight - maxImgDim) / 2;
        if (rightImg) {
          try {
            doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
          } catch {
            if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
          }
        } else if (showImageBorder) {
          doc.rect(rx, ry, maxImgDim, maxImgDim);
        }

        if (choiceMode === 'none' && isAnsMode) {
          const picCenterX = isTargetOnA ? (cardX + subW / 2) : (cardX + subW + subW / 2);
          const picCenterY = boxY + imgBoxHeight / 2;
          doc.setDrawColor(220, 38, 38);
          doc.setLineWidth(0.85);
          setDocLineDash(doc, []);
          doc.circle(picCenterX, picCenterY, maxImgDim * 0.58, 'S');
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
  } else if (type === 16) {
    // -------------------------------------------------------------
    // TYPE 16: Look and circle sound (beginning or ending sound)
    // 3 columns grid, dynamic pagination, compact 0pt spacing
    // -------------------------------------------------------------
    const cols = 3;
    const colGap = isA5 ? 4.0 : 6.0;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

    const soundMode: Type16SoundMode = options.type16SoundMode || 'beginning';
    const choiceCount: Type16ChoiceCount = options.type16ChoiceCount || 3;
    const layout: Type16Layout = options.type16Layout || 'lettersLeft';
    const letterCase: Type16LetterCase = options.type16LetterCase || 'lower';
    const borderStyle: Type16Border = options.type16Border || 'none';

    const effectiveFontSize = fontSize || (isA5 ? 13 : 15);
    const effectiveSpacing = spacing !== undefined ? spacing : 0;
    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;
    const effectiveImgSize = imageSize || (isA5 ? 12.5 : 14.0);

    const metrics = calculateType16Metrics(
      effectiveFontSize,
      effectiveSpacing,
      choiceCount,
      layout,
      borderStyle,
      effectiveImgSize,
      isA5,
      activeFont
    );

    const { fontHeightMm, optPitch, choicesBlockH, contentHeight, cardHeight, rowHeight } = metrics;
    const padY = (borderStyle !== 'none') ? 2.5 : 0;

    const defaultTitle = soundMode === 'ending'
      ? 'Look and circle the ending sound'
      : 'Look and circle the beginning sound';
    const finalTitle = title || defaultTitle;

    const topMargin = (showHeader && finalTitle) ? margin + (isA5 ? 12 : 14) : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const maxRowsPerPage = Math.max(1, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title & Header
      if (showHeader && finalTitle) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(finalTitle, margin, margin + (isA5 ? 5.5 : 7));
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

        const isAnsMode = options.answerMode === 'answer';
        const { choices, targetIndex } = generateType16Choices(
          currentWord.term,
          soundMode,
          choiceCount,
          letterCase,
          validWords
        );

        // 1. Draw Card Border if requested
        const cornerR = 2.0;
        if (borderStyle === 'full' || borderStyle === 'outerOnly') {
          doc.setDrawColor(148, 163, 184); // slate-400
          doc.setLineWidth(0.4);
          setDocLineDash(doc, [0.4, 0.8]);
          doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerR, cornerR, 'S');
          setDocLineDash(doc, []);
        }

        // 2. Layout variants
        if (layout === 'lettersBottom') {
          // Horizontal choices below image
          const imgX = cardX + (cardWidth - effectiveImgSize) / 2;
          const imgY = cardY + padY + 1.0;

          // Draw Image
          if (targetImg) {
            try {
              doc.addImage(targetImg, 'JPEG', imgX, imgY, effectiveImgSize, effectiveImgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
          }

          const gapImgToChoices = (effectiveSpacing === 0 ? 1.5 : 2.5) + (effectiveSpacing * 0.352778 * 0.2);

          // Divider line if full border
          if (borderStyle === 'full') {
            const divY = imgY + effectiveImgSize + gapImgToChoices / 2;
            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.28);
            setDocLineDash(doc, [0.3, 0.7]);
            doc.line(cardX, divY, cardX + cardWidth, divY);
            setDocLineDash(doc, []);
          }

          // Draw horizontal choices neatly grouped under image
          const choiceY = imgY + effectiveImgSize + gapImgToChoices + fontHeightMm * 0.75;
          const choicesRowWidth = Math.min(cardWidth - 4, Math.max(effectiveImgSize + 4, choiceCount * (fontHeightMm * 1.5 + 4)));
          const choiceStep = choicesRowWidth / (choiceCount + 1);
          const startChoiceX = cardX + (cardWidth - choicesRowWidth) / 2;

          for (let j = 0; j < choiceCount; j++) {
            const choiceX = startChoiceX + (j + 1) * choiceStep;
            if (isAnsMode && j === targetIndex) {
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.65);
              setDocLineDash(doc, []);
              doc.circle(choiceX, choiceY - fontHeightMm * 0.28, Math.max(fontHeightMm * 0.65, 3.2), 'S');

              applyFont(doc, activeFont, 'bold');
              doc.setFontSize(effectiveFontSize);
              doc.setTextColor(220, 38, 38);
              doc.text(choices[j], choiceX, choiceY, { align: 'center' });
            } else {
              applyFont(doc, activeFont, 'normal');
              doc.setFontSize(effectiveFontSize);
              doc.setTextColor(30, 41, 59);
              doc.text(choices[j], choiceX, choiceY, { align: 'center' });
            }
          }
          doc.setTextColor(0, 0, 0);

        } else {
          // Vertical layout: 'lettersLeft' (default) or 'lettersRight'
          let choicesCenterX: number;
          let imgX: number;
          let divX: number;

          if (borderStyle === 'none') {
            // No border: pair letters + image together with clean gap, centered as a cohesive unit
            const colChoicesW = Math.max(10, letterCase === 'both' ? fontHeightMm * 2.2 : fontHeightMm * 1.5);
            const pairGap = isA5 ? 4.5 : 6.0;
            const totalPairW = colChoicesW + pairGap + effectiveImgSize;
            const pairStartX = cardX + (cardWidth - totalPairW) / 2;

            if (layout === 'lettersLeft') {
              choicesCenterX = pairStartX + colChoicesW / 2;
              imgX = pairStartX + colChoicesW + pairGap;
              divX = pairStartX + colChoicesW + pairGap / 2;
            } else {
              // 'lettersRight'
              imgX = pairStartX;
              choicesCenterX = pairStartX + effectiveImgSize + pairGap + colChoicesW / 2;
              divX = pairStartX + effectiveImgSize + pairGap / 2;
            }
          } else {
            // Card outline: partition cardWidth into left and right zones
            const colChoicesW = Math.max(14, cardWidth * 0.36);
            const colImgW = cardWidth - colChoicesW;

            if (layout === 'lettersLeft') {
              choicesCenterX = cardX + colChoicesW / 2;
              imgX = cardX + colChoicesW + (colImgW - effectiveImgSize) / 2;
              divX = cardX + colChoicesW;
            } else {
              // 'lettersRight'
              imgX = cardX + (colImgW - effectiveImgSize) / 2;
              choicesCenterX = cardX + colImgW + colChoicesW / 2;
              divX = cardX + colImgW;
            }
          }

          const imgY = cardY + padY + (contentHeight - effectiveImgSize) / 2;

          // Inner divider for full border
          if (borderStyle === 'full') {
            doc.setDrawColor(148, 163, 184);
            doc.setLineWidth(0.28);
            setDocLineDash(doc, [0.3, 0.7]);
            doc.line(divX, cardY, divX, cardY + cardHeight);
            setDocLineDash(doc, []);
          }

          // Draw Image
          if (targetImg) {
            try {
              doc.addImage(targetImg, 'JPEG', imgX, imgY, effectiveImgSize, effectiveImgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
          }

          // Draw Vertical Choices
          const choicesStartY = cardY + padY + (contentHeight - choicesBlockH) / 2 + fontHeightMm * 0.75;
          for (let j = 0; j < choiceCount; j++) {
            const choiceY = choicesStartY + j * optPitch;
            if (isAnsMode && j === targetIndex) {
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.65);
              setDocLineDash(doc, []);
              doc.circle(choicesCenterX, choiceY - fontHeightMm * 0.28, Math.max(fontHeightMm * 0.65, 3.2), 'S');

              applyFont(doc, activeFont, 'bold');
              doc.setFontSize(effectiveFontSize);
              doc.setTextColor(220, 38, 38);
              doc.text(choices[j], choicesCenterX, choiceY, { align: 'center' });
            } else {
              applyFont(doc, activeFont, 'normal');
              doc.setFontSize(effectiveFontSize);
              doc.setTextColor(30, 41, 59);
              doc.text(choices[j], choicesCenterX, choiceY, { align: 'center' });
            }
          }
          doc.setTextColor(0, 0, 0);
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
  } else if (type === 17) {
    // -------------------------------------------------------------
    // TYPE 17: Look and color the words / Cross out the extra letters
    // A4: 3 columns; A5: 2 columns
    // -------------------------------------------------------------
    const taskMode: Type17TaskMode = options.type17TaskMode || 'color';
    const borderStyle: Type17Border = options.type17Border || 'full';
    const cardBorderStyle: Type17CardBorder = options.type17CardBorder || 'none';
    const letterCase: Type17LetterCase = options.type17LetterCase || 'lower';
    const stripLengthOpt: Type17StripLength = options.type17StripLength || 'auto';
    const isAnsMode = options.answerMode === 'answer' || options.type17HighlightTarget === 'red';
    const highlightTarget: Type17HighlightTarget = isAnsMode ? 'red' : (options.type17HighlightTarget || 'none');
    const showExample = options.type17ShowExample !== false;

    const effectiveFontSize = fontSize || (isA5 ? 13 : 15);
    const effectiveSpacing = spacing !== undefined ? spacing : 0;
    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;
    const effectiveImgSize = imageSize || (isA5 ? 14.0 : 16.0);

    const cols = isA5 ? 2 : 3;
    const colGap = isA5 ? 5.0 : 6.0;
    const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

    // Pre-generate all item cells so we know max strip length across items
    const generatedItems = validWords.map((w, idx) =>
      generateType17Letters(w.term, stripLengthOpt, taskMode, letterCase, idx)
    );
    const maxStripLen = Math.max(...generatedItems.map((g) => g.stripLength), taskMode === 'cross' ? 6 : 8);

    const metrics = calculateType17Metrics(
      effectiveFontSize,
      effectiveSpacing,
      maxStripLen,
      cardBorderStyle,
      effectiveImgSize,
      isA5,
      activeFont
    );

    const { rowHeight } = metrics;

    const defaultTitle = taskMode === 'cross'
      ? 'Cross out (/) the extra letters.'
      : 'Look and color the words';
    const finalTitle = title || defaultTitle;

    const topMargin = (showHeader && finalTitle) ? margin + (isA5 ? 12 : 14) : margin + 4;
    const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

    const maxRowsPerPage = Math.max(1, Math.floor(availHeight / rowHeight));
    const wordsPerPage = cols * maxRowsPerPage;
    const totalPages = Math.ceil(validWords.length / wordsPerPage);

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      // Title & Header
      if (showHeader && finalTitle) {
        doc.setFont('fff', 'bold');
        doc.setFontSize(isA5 ? 16 : 22);
        doc.setTextColor(30, 41, 59);
        doc.text(finalTitle, margin, margin + (isA5 ? 5.5 : 7));
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

        const targetImg = wordImages[i];
        const itemGen = generatedItems[i];

        const itemMetrics = calculateType17Metrics(
          effectiveFontSize,
          effectiveSpacing,
          itemGen.stripLength,
          cardBorderStyle,
          effectiveImgSize,
          isA5,
          activeFont
        );

        drawType17Item(
          doc,
          cardX,
          cardY,
          cardWidth,
          targetImg,
          itemGen.cells,
          taskMode,
          borderStyle,
          cardBorderStyle,
          highlightTarget,
          showExample,
          i === 0,
          itemMetrics,
          activeFont,
          showImageBorder
        );
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
  } else if (type === 18) {
    // -------------------------------------------------------------
    // TYPE 18: Color the letters (Find and color target letters in circles)
    // Inspired by WS 9 circular letter frames and rounded outer container
    // -------------------------------------------------------------
    const targetLetterOpt = options.type18TargetLetter || 'E';
    const taskMode: Type18Mode = options.type18Mode || 'both';
    const colorUpper = options.type18ColorUpper || 'green';
    const colorLower = options.type18ColorLower || 'red';
    const rows = options.type18GridRows || 4;
    const cols = options.type18GridCols || 7;
    const outerBorder: Type18Border = options.type18Border || 'rounded';
    const circleStyle: Type18CircleStyle = options.type18CircleStyle || 'solid';
    const distractorCasing: Type18DistractorCasing = options.type18DistractorCasing || 'upper';
    const highlightTarget: Type18HighlightTarget = options.type18HighlightTarget || 'none';

    const effectiveFontSize = fontSize || (isA5 ? 16 : 20);
    const effectiveSpacing = spacing !== undefined ? spacing : 0;
    const activeFont = (options.fontFamily || 'r0c0i Linotte') as string;

    // Determine target letters to generate
    // If user provided words in vocabulary list and multiple words exist, can generate 1 target letter per page
    // Otherwise generate single page with chosen target letter
    let targetLetters: string[] = [];
    if (options.type18TargetLetter && options.type18TargetLetter.trim()) {
      targetLetters = [options.type18TargetLetter.trim().charAt(0).toUpperCase()];
    } else if (validWords.length > 0) {
      const uniqueLetters = Array.from(new Set(validWords.map(w => w.term.trim().charAt(0).toUpperCase()).filter(Boolean))) as string[];
      targetLetters = uniqueLetters.length > 0 ? uniqueLetters : ['E'];
    } else {
      targetLetters = ['E'];
    }

    const totalPages = targetLetters.length;

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) doc.addPage();
      await insertBackground(doc, background, isA5);

      const currentTarget = targetLetters[page] || 'E';
      const upperChar = currentTarget.toUpperCase();
      const lowerChar = currentTarget.toLowerCase();

      // Title determination
      let defaultTitle = '';
      if (taskMode === 'upper_only') {
        defaultTitle = `Color ${upperChar} ${colorUpper}`;
      } else if (taskMode === 'lower_only') {
        defaultTitle = `Color ${lowerChar} ${colorLower}`;
      } else if (taskMode === 'single_color') {
        defaultTitle = `Color letter ${upperChar} and ${lowerChar} ${colorUpper}`;
      } else {
        defaultTitle = `Color ${upperChar} ${colorUpper} and ${lowerChar} ${colorLower}`;
      }
      const finalTitle = title || defaultTitle;

      // 1. Draw Title
      const titleY = margin + (isA5 ? 6 : 8);
      if (showHeader && finalTitle) {
        drawType18Title(
          doc,
          finalTitle,
          currentTarget,
          taskMode,
          colorUpper,
          colorLower,
          margin,
          titleY,
          isA5 ? 15 : 20,
          activeFont
        );
      }

      // 2. Metrics & Grid Generation
      const topMargin = (showHeader && finalTitle) ? titleY + (isA5 ? 5 : 7) : margin + 4;
      const availWidth = printableWidth;
      const availHeight = printableHeight - (topMargin - margin) - (showFooter ? 8 : 4);

      const metrics = calculateType18Metrics(
        effectiveFontSize,
        effectiveSpacing,
        rows,
        cols,
        outerBorder,
        isA5,
        availWidth,
        availHeight
      );

      const gridData = generateType18Grid(
        currentTarget,
        taskMode,
        rows,
        cols,
        distractorCasing,
        page
      );

      // Horizontal centering; startY placed naturally below title header responsive to user's spacing
      const startX = margin + (availWidth - metrics.cardWidth) / 2;
      const startY = topMargin + (isA5 ? 2.0 : 3.0) + (effectiveSpacing * 0.352778);

      drawType18ContainerAndGrid(
        doc,
        startX,
        startY,
        gridData.cells,
        metrics,
        {
          outerBorder,
          circleStyle,
          highlightTarget,
          colorUpper,
          colorLower,
          fontFamily: activeFont
        },
        isA5
      );

      // 3. Footer
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
    spacing: globalSpacing = 0,
    imageSize: globalImgSize = 12.7,
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
  const defaultImgSize = globalImgSize || 12.7; // default 0.5 in (12.7 mm)
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
    const secFont = section.fontFamily || fontFamily || 'r0c0i Linotte';
    const imgSize = section.imageSize || defaultImgSize;
    const headerH = (section.title && section.title.trim().length > 0) ? 7 : 0;

    // Line and gap geometry
    const lineOffset = 3.5 + secSpacing * 0.1;
    const textOffset = 3.5 + secSpacing * 0.1;
    const textOffset1 = 3.5 + secSpacing * 0.1;
    const textOffset2 = 3.5 + secSpacing * 0.1;
    const linePitch = 3.2 + secSpacing * 0.12;

    let minUnitH = 20;
    let rowHeight = 22;

    if (section.type === 1) {
      const effectiveFontSize = secFontSize || (isA5 ? 11.5 : 13.5);
      const hintStyle = section.sentenceHintStyle || 'underscores';
      const traceFontSize = section.sentenceTraceFontSize || (isA5 ? 26 : 28);
      const metrics = calculateType1Metrics(effectiveFontSize, secSpacing, imgSize, hintStyle, traceFontSize);
      rowHeight = metrics.itemTotalHeight;
      minUnitH = rowHeight;
    } else if (section.type === 2) {
      const type2Metrics = calculateType2Metrics(secFontSize, secSpacing, imgSize, isA5);
      rowHeight = type2Metrics.rowHeight;
      minUnitH = rowHeight;
    } else if (section.type === 4) {
      if (section.type4LayoutMode === 'table') {
        const chosenFontSize = secFontSize || (isA5 ? 12 : 14);
        const chosenTraceFontSize = section.type4TraceFontSize || 28;
        const fontHMm = chosenFontSize * 0.352778;
        const traceFontHMm = chosenTraceFontSize * 0.352778;
        const contentH = Math.max(imgSize, traceFontHMm + 1.5, fontHMm);
        const spacingMm = (secSpacing !== undefined ? secSpacing : 0) * 0.352778;
        const baseRowGap = 1.0;
        rowHeight = contentH + spacingMm + baseRowGap;
        minUnitH = rowHeight;
      } else {
        const gridMetrics = calculateType4GridMetrics(secFontSize, secSpacing, imgSize, isA5);
        rowHeight = gridMetrics.rowHeight;
        minUnitH = rowHeight;
      }
    } else if (section.type === 6) {
      const isHorizontal = section.choiceLayout === 'horizontal';
      const numChoices = isHorizontal ? 2 : (section.choiceCount === 2 ? 2 : 3);
      const ptToMm = 0.352778;
      const effectiveFontSize = secFontSize || (isA5 ? 12 : 14);
      const fontHeightMm = effectiveFontSize * ptToMm;
      let contentHeight = imgSize;
      let rowGap = (secSpacing === 0 ? 1.0 : 2.0) + secSpacing * ptToMm * 0.6;
      if (isHorizontal) {
        contentHeight = Math.max(imgSize, fontHeightMm);
        rowGap = (secSpacing === 0 ? 1.2 : 2.5) + secSpacing * ptToMm * 0.75;
      } else {
        const spacingFactor = numChoices === 2 ? 1.40 : 1.36;
        const optPitch = fontHeightMm * spacingFactor + (secSpacing * ptToMm * 0.45);
        const optionsBlockHeight = (numChoices - 1) * optPitch + fontHeightMm;
        contentHeight = Math.max(imgSize, optionsBlockHeight);
        rowGap = (secSpacing === 0 ? 1.0 : 2.0) + secSpacing * ptToMm * 0.6;
      }
      rowHeight = contentHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 7) {
      const type7Metrics = calculateType7Metrics(secFontSize, secSpacing, imgSize, isA5);
      rowHeight = type7Metrics.rowHeight;
      minUnitH = rowHeight;
    } else if (section.type === 8) {
      const traceFontSize = secFontSize || (isA5 ? 22 : 26);
      const isAnsMode = section.answerMode === 'answer';
      const traceFont = isAnsMode ? (secFont && secFont !== 'KG Primary Dots' ? secFont : 'r0c0i Linotte') : 'KG Primary Dots';
      const layout0 = layoutTraceText(doc, secWords[0]?.term || 'word', traceFontSize, (printableWidth - (isA5 ? 24 : 32)) / 3 - 3, traceFont);
      const textBlockH = layout0.lines.length * (layout0.fontSize * 0.352778 * 1.15);
      const contentH = Math.max(imgSize, textBlockH);
      const rowGap = (secSpacing !== undefined ? secSpacing : 0) * 0.352778;
      rowHeight = contentH + Math.max(2.0, (traceFontSize * 0.352778) * 0.22) + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 9) {
      const cols = 3;
      const colGap = isA5 ? 3.0 : 4.5;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
      const secMetrics = calculateType9Metrics(isA5, imgSize, secSpacing, secFontSize, cardWidth);
      rowHeight = secMetrics.baseRowHeight;
      minUnitH = rowHeight;
    } else if (section.type === 10) {
      const cols = 3;
      const colGap = isA5 ? 3.0 : 4.5;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
      const secMetrics = calculateType10Metrics(isA5, imgSize, secSpacing, secFontSize, cardWidth);
      rowHeight = secMetrics.rowHeight;
      minUnitH = rowHeight;
    } else if (section.type === 11) {
      const contentH = Math.max(imgSize + 2.5, isA5 ? 14.0 : 16.0);
      const rowGap = (secSpacing === 0 ? 1.0 : 1.5) + (secSpacing !== undefined ? secSpacing : 0) * 0.22;
      rowHeight = contentH + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 12) {
      const imgBoxHeight = imgSize + 2.0;
      const sentenceBoxHeight = isA5 ? 10.0 : 12.0;
      const cardHeight = imgBoxHeight + sentenceBoxHeight;
      const rowGap = (secSpacing === 0 ? 1.0 : 2.0) + (secSpacing !== undefined ? secSpacing : 0) * 0.35;
      rowHeight = cardHeight + rowGap;
      minUnitH = rowHeight;
    } else if (section.type === 3) {
      if (section.matchMode === 'look_match_write') {
        const metrics = calculateType3LookMatchWriteMetrics(isA5, imgSize, secFontSize, secSpacing, section.lookMatchWriteTraceFontSize);
        const { rowContentHeight, rowGap } = metrics;
        const maxCount = Math.max(3, Math.floor((maxContentY - margin - 14) / (rowContentHeight + rowGap)));
        const count = Math.min(secWords.length, maxCount);
        rowHeight = rowContentHeight + rowGap;
        minUnitH = count * rowContentHeight + (count - 1) * rowGap;
      } else {
        const fontHeightMm = secFontSize * 0.352778;
        const isSentence = section.matchMode === 'sentence';
        const baseBoxHeight = isSentence ? (isA5 ? 10 : 12) : (isA5 ? 7.5 : 9.5);
        const boxHeight = Math.max(baseBoxHeight, fontHeightMm * 1.35);
        const boxGap = (secSpacing === 0 ? 0.8 : 0.8 + secSpacing * 0.352778);
        const maxCount = Math.max(4, Math.floor((maxContentY - margin - 14) / (boxHeight + boxGap)));
        const count = Math.min(secWords.length, maxCount);
        const half = Math.ceil(count / 2);
        const totalMiddleHeight = count * boxHeight + (count - 1) * boxGap;
        minUnitH = Math.max(half * (imgSize + 3), totalMiddleHeight) + 4;
      }
    } else if (section.type === 13) {
      const gridSizePref = section.wordsearchGridSize || 'auto';
      const estimatedCols = typeof gridSizePref === 'number'
        ? gridSizePref
        : Math.max(8, Math.min(12, Math.ceil(Math.sqrt(secWords.length * 8))));
      const secFontSize = section.fontSize || globalFontSize || 12;
      const proportionalCellSize = secFontSize * 0.58;
      const gapX = isA5 ? 3.0 : 4.0;
      const hType = section.wordsearchHintType || 'word';
      const wordsearchCase = section.wordsearchCase || 'lower';
      const minFlankW = isA5 ? (hType === 'word' ? 24 : 18) : (hType === 'word' ? 30 : 24);
      const maxGridW = printableWidth - 2 * minFlankW - 2 * gapX;
      const maxSectionH = isA5 ? 90 : 120;
      const cellSize = Math.max(3.8, Math.min(proportionalCellSize, maxGridW / estimatedCols, maxSectionH / estimatedCols));
      const totalGridW = estimatedCols * cellSize;
      const gridTotalH = estimatedCols * cellSize;
      const flankColW = Math.max(5, (printableWidth - totalGridW) / 2 - gapX);

      const hintsMetrics = calculateWordsearchHintsMetrics(
        secWords,
        hType,
        secFontSize,
        isA5,
        flankColW,
        gridTotalH,
        doc,
        secFont,
        wordsearchCase,
        imgSize
      );
      minUnitH = Math.max(gridTotalH, hintsMetrics.hintsTotalH) + 6;
    } else if (section.type === 14) {
      const secFontSize = section.fontSize || globalFontSize || 12;
      const showLabels = section.showWordLabels !== false;
      const labelH = showLabels ? (secFontSize * 0.352778 + 3.5) : 0;
      const cardH = imgSize + labelH;
      const baseGap = (secSpacing === 0) ? 1.5 : (isA5 ? 4.0 : 5.0);
      const rowGap = baseGap + (secSpacing !== undefined ? secSpacing : 0) * 0.352778;
      rowHeight = cardH + rowGap;
      minUnitH = 2 * rowHeight + 4;
    } else if (section.type === 15) {
      const secFontSize = section.fontSize || globalFontSize || 12;
      const secSentenceH = secFontSize * 0.352778 + (isA5 ? 4.5 : 5.5);
      const secImgBoxH = Math.max(imgSize + (isA5 ? 4.0 : 6.0), isA5 ? 18.0 : 22.0);
      const choiceMode = section.type15ChoiceMode || 'ab';
      const secBottomH = choiceMode === 'ab'
        ? Math.max(secFontSize * 0.352778 + 3.0, isA5 ? 6.5 : 8.0)
        : (choiceMode === 'checkbox' ? (isA5 ? 7.0 : 8.5) : 0);
      const secCardH = secImgBoxH + secBottomH;
      const baseGap = (secSpacing === 0) ? 1.5 : (isA5 ? 3.5 : 5.0);
      const rowGap = baseGap + (secSpacing !== undefined ? secSpacing : 0) * 0.352778 * 0.7;
      rowHeight = secSentenceH + secCardH + rowGap;
      minUnitH = rowHeight + 4;
    } else if (section.type === 16) {
      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 13 : 15);
      const metrics = calculateType16Metrics(
        secFontSize,
        secSpacing,
        section.type16ChoiceCount || 3,
        section.type16Layout || 'lettersLeft',
        section.type16Border || 'none',
        imgSize,
        isA5,
        secFont
      );
      rowHeight = metrics.rowHeight;
      minUnitH = rowHeight + 4;
    } else if (section.type === 17) {
      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 13 : 15);
      const cardBorder = section.type17CardBorder || 'none';
      const stripLen = section.type17StripLength === 'auto' || !section.type17StripLength
        ? (section.type17TaskMode === 'cross' ? 6 : 8)
        : Number(section.type17StripLength);
      const metrics = calculateType17Metrics(
        secFontSize,
        secSpacing,
        stripLen,
        cardBorder,
        imgSize,
        isA5,
        secFont
      );
      rowHeight = metrics.rowHeight;
      minUnitH = rowHeight + 4;
    } else if (section.type === 18) {
      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 16 : 20);
      const rows = section.type18GridRows || 4;
      const cols = section.type18GridCols || 7;
      const outerBorder = section.type18Border || 'rounded';
      const metrics = calculateType18Metrics(
        secFontSize,
        secSpacing,
        rows,
        cols,
        outerBorder,
        isA5,
        printableWidth
      );
      rowHeight = metrics.cardHeight;
      minUnitH = rowHeight + 4;
    }

    // Page break evaluation before section starts
    const shouldBreakBefore =
      (secIdx > 0 && section.pageBreakBefore && !isAtTopOfPage) ||
      (currentY + headerH + minUnitH > maxContentY && !isAtTopOfPage);

    if (shouldBreakBefore) {
      await addNewPage();
    }

    // Render Section Header (Instruction removed completely as requested)
    if (section.title && section.title.trim().length > 0) {
      doc.setFont('r0c0i Linotte', 'bold');
      doc.setFontSize(isA5 ? 11.5 : 13.5);
      doc.setTextColor(15, 23, 42);
      if (section.type === 14) {
        drawTargetLetterTitle(doc, section.title.trim(), section.targetLetter || 'V v', margin, currentY + 3.5, isA5 ? 11.5 : 13.5, 'r0c0i Linotte');
      } else if (section.type === 18) {
        drawType18Title(
          doc,
          section.title.trim(),
          section.type18TargetLetter || 'E',
          section.type18Mode || 'both',
          section.type18ColorUpper || 'green',
          section.type18ColorLower || 'red',
          margin,
          currentY + 3.5,
          isA5 ? 11.5 : 13.5,
          'r0c0i Linotte'
        );
      } else {
        doc.text(section.title.trim(), margin, currentY + 3.5);
      }
      currentY += (isA5 ? 5.5 : 6.0) + Math.min(2.5, (secSpacing !== undefined ? secSpacing : 0) * 0.2);
      doc.setTextColor(0, 0, 0);
      isAtTopOfPage = false;
    }

    // Render items according to section.type
    if (section.type === 1) {
      // -------------------------------------------------------------
      // TYPE 1: Sentence Reorder / Rewrite in Composite Mode
      // -------------------------------------------------------------
      const effectiveSecFontSize = secFontSize || (isA5 ? 11.5 : 13.5);
      const isScramble = section.sentenceScramble !== false;
      const separator = section.sentenceSeparator || 'space';
      const hintStyle = section.sentenceHintStyle || 'underscores';
      const traceFontSize = section.sentenceTraceFontSize || (isA5 ? 26 : 28);

      const metrics = calculateType1Metrics(effectiveSecFontSize, secSpacing, imgSize, hintStyle, traceFontSize);
      const { gapImgToWords, gapWordsToHint, itemGap, itemTotalHeight: itemTotalH } = metrics;

      for (let i = 0; i < secWords.length; i++) {
        if (currentY + itemTotalH > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        const word = secWords[i];
        const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;

        const imgX = (pageWidth - imgSize) / 2;
        const imgY = currentY;

        if (img) {
          try {
            doc.addImage(img, 'JPEG', imgX, imgY, imgSize, imgSize);
          } catch {
            if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
          }
        } else if (showImageBorder) {
          doc.rect(imgX, imgY, imgSize, imgSize);
        }

        const targetSentence = getType1Sentence(word);
        const displayedText = isScramble
          ? scrambleSentenceWords(targetSentence, separator)
          : targetSentence;

        // Hint line preparation: strictly max 1 line for 'dots'
        let hintText = generateSentenceHint(targetSentence, hintStyle);
        if (hintStyle === 'dots') {
          const maxHintWidth = printableWidth - 4;
          applyFont(doc, secFont, 'normal');
          doc.setFontSize(effectiveSecFontSize);
          const normalized = targetSentence.trim().replace(/\s+/g, ' ');
          let dotCount = normalized.length;
          hintText = Array(dotCount).fill('...').join('');
          while (dotCount > 1 && doc.getTextWidth(hintText) > maxHintWidth) {
            dotCount--;
            hintText = Array(dotCount).fill('...').join('');
          }
        }

        applyFont(doc, secFont, 'normal');
        doc.setFontSize(effectiveSecFontSize);
        doc.setTextColor(30, 41, 59);

        const wordsLines = doc.splitTextToSize(displayedText, printableWidth - 4);
        const wordsLineCount = Math.max(1, Array.isArray(wordsLines) ? wordsLines.length : 1);
        const wordsLineHeight = effectiveSecFontSize * 0.352778 * 1.25;

        const wordsY = imgY + imgSize + gapImgToWords + (effectiveSecFontSize * 0.352778 * 0.85);
        doc.text(displayedText, pageWidth / 2, wordsY, {
          align: 'center',
          maxWidth: printableWidth - 4
        });

        const wordsBottom = wordsY + (wordsLineCount - 1) * wordsLineHeight + (effectiveSecFontSize * 0.352778 * 0.35);
        let actualHintBottom = wordsBottom;

        if (section.answerMode === 'answer') {
          applyFont(doc, secFont, 'bold');
          doc.setFontSize(effectiveSecFontSize);
          doc.setTextColor(220, 38, 38);
          const hintY = wordsBottom + gapWordsToHint + (effectiveSecFontSize * 0.352778 * 0.85);
          doc.text(targetSentence, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: printableWidth - 4
          });
          const ansLines = doc.splitTextToSize(targetSentence, printableWidth - 4);
          const ansLineCount = Math.max(1, Array.isArray(ansLines) ? ansLines.length : 1);
          const ansLineHeight = effectiveSecFontSize * 0.352778 * 1.25;
          actualHintBottom = hintY + (ansLineCount - 1) * ansLineHeight + (effectiveSecFontSize * 0.352778 * 0.35);
        } else if (hintStyle === 'trace') {
          doc.setFont('KGPrimaryDots', 'normal');
          let actualTraceFontSize = traceFontSize;
          doc.setFontSize(actualTraceFontSize);
          doc.setTextColor(30, 41, 59);

          // Auto-fit protection: iteratively decrease font size down to 14pt so it fits on 1 single continuous line for kids
          const maxHintW = printableWidth - 4;
          while (doc.getTextWidth(hintText) > maxHintW && actualTraceFontSize > 14) {
            actualTraceFontSize--;
            doc.setFontSize(actualTraceFontSize);
          }

          const traceLines = doc.splitTextToSize(hintText, maxHintW);
          const traceLineCount = Math.max(1, Array.isArray(traceLines) ? traceLines.length : 1);
          const traceLineHeight = actualTraceFontSize * 0.352778 * 1.2;

          const hintY = wordsBottom + gapWordsToHint + (actualTraceFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: maxHintW
          });
          actualHintBottom = hintY + (traceLineCount - 1) * traceLineHeight + (actualTraceFontSize * 0.352778 * 0.35);
        } else if (hintStyle === 'dots') {
          applyFont(doc, secFont, 'normal');
          doc.setFontSize(effectiveSecFontSize);
          doc.setTextColor(51, 65, 85);
          const hintY = wordsBottom + gapWordsToHint + (effectiveSecFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center'
          });
          actualHintBottom = hintY + (effectiveSecFontSize * 0.352778 * 0.35);
        } else {
          // underscores
          applyFont(doc, secFont, 'normal');
          doc.setFontSize(effectiveSecFontSize);
          doc.setTextColor(51, 65, 85);
          const hintLines = doc.splitTextToSize(hintText, printableWidth - 4);
          const hintLineCount = Math.max(1, Array.isArray(hintLines) ? hintLines.length : 1);
          const hintLineHeight = effectiveSecFontSize * 0.352778 * 1.2;

          const hintY = wordsBottom + gapWordsToHint + (effectiveSecFontSize * 0.352778 * 0.85);
          doc.text(hintText, pageWidth / 2, hintY, {
            align: 'center',
            maxWidth: printableWidth - 4
          });
          actualHintBottom = hintY + (hintLineCount - 1) * hintLineHeight + (effectiveSecFontSize * 0.352778 * 0.35);
        }
        doc.setTextColor(0, 0, 0);

        currentY = actualHintBottom + itemGap;
        isAtTopOfPage = false;
      }
    } else if (section.type === 2) {
      // -------------------------------------------------------------
      // TYPE 2: Write words under pictures (3 columns)
      // -------------------------------------------------------------
      const cols = 3;
      const colWidth = printableWidth / cols;
      const halfLineLen = isA5 ? 16 : 20;
      const totalRows = Math.ceil(secWords.length / cols);
      const secMetrics = calculateType2Metrics(secFontSize, secSpacing, imgSize, isA5);

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
          const lineY = imgY + imgSize + secMetrics.lineOffset;
          doc.line(colCenter - halfLineLen, lineY, colCenter + halfLineLen, lineY);
          setDocLineDash(doc, []);

          // If Answer Mode: render word in bold red above dotted baseline
          if (section.answerMode === 'answer') {
            applyFont(doc, secFont, 'bold');
            doc.setFontSize(secMetrics.effectiveFontSize);
            doc.setTextColor(220, 38, 38);
            const wordY = lineY - 1.2;
            doc.text(word.term, colCenter, wordY, { align: 'center', maxWidth: colWidth - 4 });
            applyFont(doc, secFont, 'normal');
            doc.setTextColor(0, 0, 0);
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 4) {
      if (section.type4LayoutMode === 'table') {
        // -------------------------------------------------------------
        // TYPE 4 - Mode 'table': Look and write in Composite Mode
        // -------------------------------------------------------------
        const colMode = section.type4ColumnMode || 'both_trace_first';
        const numTextCols = (colMode === 'initial_only' || colMode === 'final_only' || colMode === 'alphabet_order' || colMode === 'vowels_only') ? 2 : 4;
        const tableX = margin;
        const tableWidth = printableWidth;
        const col1Width = 18; // 18mm provides comfortable spacing around 12.7mm (0.5 inch) image
        const textColsWidth = tableWidth - col1Width;
        const colTextWidth = textColsWidth / numTextCols;

        const chosenFontSize = secFontSize || (isA5 ? 12 : 14);
        const chosenTraceFontSize = section.type4TraceFontSize || 28;
        const regularFont = (secFont && secFont !== 'KG Primary Dots') ? secFont : 'r0c0i Linotte';

        let cellTypes: Array<'initial_trace' | 'initial_blank' | 'final_trace' | 'final_blank'> = [];
        if (colMode === 'both_trace_first') {
          cellTypes = ['initial_trace', 'initial_blank', 'final_trace', 'final_blank'];
        } else if (colMode === 'both_blank_first') {
          cellTypes = ['initial_trace', 'initial_blank', 'final_blank', 'final_trace'];
        } else if (colMode === 'initial_only') {
          cellTypes = ['initial_trace', 'initial_blank'];
        } else if (colMode === 'final_only') {
          cellTypes = ['final_trace', 'final_blank'];
        }

        for (let i = 0; i < secWords.length; i++) {
          if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
            await addNewPage();
          }

          const word = secWords[i];
          const rowY = currentY;
          const rowCenterY = rowY + rowHeight / 2;

          // 1. Column 1: Image (0.5 x 0.5 in = 12.7 x 12.7 mm)
          const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          const imgDim = imgSize;
          if (img) {
            let imgW = imgDim;
            let imgH = imgDim;
            try {
              const props = doc.getImageProperties(img);
              if (props.width && props.height) {
                const aspect = props.width / props.height;
                if (aspect > 1) {
                  imgW = imgDim;
                  imgH = imgDim / aspect;
                } else {
                  imgH = imgDim;
                  imgW = imgDim * aspect;
                }
              }
            } catch {
              // fallback
            }
            const imgX = tableX + (col1Width - imgW) / 2;
            const imgY = rowCenterY - imgH / 2;
            try {
              doc.addImage(img, 'JPEG', imgX, imgY, imgW, imgH);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgW, imgH);
            }
            if (showImageBorder) doc.rect(imgX, imgY, imgW, imgH);
          } else if (showImageBorder) {
            doc.rect(tableX + (col1Width - imgDim) / 2, rowCenterY - imgDim / 2, imgDim, imgDim);
          }

          // 2. Text Columns with safe margin & proportional auto-scaling for long words
          const term = word.term.trim();
          let wordFontSize = chosenFontSize;
          let cellTraceFontSize = chosenTraceFontSize;

          applyFont(doc, regularFont, 'normal');
          doc.setFontSize(wordFontSize);
          const fullW = doc.getTextWidth(term);
          const estCellW = fullW + Math.max(3.0, cellTraceFontSize * 0.18);
          const maxCellW = colTextWidth - (isA5 ? 3.0 : 4.5);
          if (estCellW > maxCellW) {
            const scale = maxCellW / estCellW;
            wordFontSize = Math.max(7.5, Math.floor(chosenFontSize * scale));
            cellTraceFontSize = Math.max(14, Math.floor(chosenTraceFontSize * scale));
          }

          const baselineY = rowCenterY + (cellTraceFontSize * 0.352778) * 0.28;

          if (colMode === 'alphabet_order' || colMode === 'vowels_only') {
            const { traceIndices, blankIndices } = getType4TargetLetterIndices(
              term,
              colMode,
              section.type4AlphabetTargetLetter || 'c'
            );

            const col1X = tableX + col1Width + (isA5 ? 2.0 : 3.5);
            const col2X = tableX + col1Width + colTextWidth + (isA5 ? 2.0 : 3.5);

            const isAnsMode = section.answerMode === 'answer';
            drawType4WordCell(doc, term, { mode: 'custom', traceIndices, blankIndices: new Set<number>() } as Type4CellConfig, col1X, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
            drawType4WordCell(doc, term, { mode: 'custom', traceIndices: new Set<number>(), blankIndices } as Type4CellConfig, col2X, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
          } else {
            const isAnsMode = section.answerMode === 'answer';
            for (let c = 0; c < cellTypes.length; c++) {
              const cellType = cellTypes[c];
              const cellX = tableX + col1Width + c * colTextWidth + (isA5 ? 2.0 : 3.5);
              drawType4WordCell(doc, term, cellType, cellX, baselineY, wordFontSize, regularFont, cellTraceFontSize, isAnsMode);
            }
          }

          currentY += rowHeight;
          isAtTopOfPage = false;
        }
      } else {
        // -------------------------------------------------------------
        // TYPE 4: Missing letters (3 columns - Existing grid mode)
        // -------------------------------------------------------------
        const cols = 3;
        const colWidth = printableWidth / cols;
        const totalRows = Math.ceil(secWords.length / cols);
        const secGridMetrics = calculateType4GridMetrics(secFontSize, secSpacing, imgSize, isA5);

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

            const textY = imgY + imgSize + secGridMetrics.textOffset;
            if (section.answerMode === 'answer') {
              applyFont(doc, secFont, 'bold');
              doc.setFontSize(secFontSize);
              doc.setTextColor(220, 38, 38);
              doc.text(word.term, colCenter, textY, { align: 'center' });
              applyFont(doc, secFont, 'normal');
              doc.setTextColor(0, 0, 0);
            } else {
              doc.setFontSize(secFontSize);
              applyFont(doc, secFont, 'normal');
              doc.setTextColor(0, 0, 0);
              const missingTerm = punchBlanks(word.term, section.blankMode || 'vowels');
              doc.text(missingTerm, colCenter, textY, { align: 'center' });
            }
          }

          currentY += rowHeight;
          isAtTopOfPage = false;
        }
      }
    } else if (section.type === 6) {
      // -------------------------------------------------------------
      // TYPE 6: Multiple choice (2 columns)
      // -------------------------------------------------------------
      const cols = 2;
      const colWidth = printableWidth / cols;
      const totalRows = Math.ceil(secWords.length / cols);
      const secTerms = secWords.map((w) => w.term.trim());
      const ptToMm = 0.352778;
      const effectiveFontSize = secFontSize || (isA5 ? 12 : 14);
      const baseFontHeightMm = effectiveFontSize * ptToMm;
      const isHorizontal = section.choiceLayout === 'horizontal';
      const numChoices = isHorizontal ? 2 : (section.choiceCount === 2 ? 2 : 3);
      let contentHeight = imgSize;
      let spacingFactor = 1.18;
      let baseOptPitch = 0;
      let baseOptionsBlockHeight = 0;

      if (isHorizontal) {
        contentHeight = Math.max(imgSize, baseFontHeightMm);
      } else {
        spacingFactor = numChoices === 2 ? 1.40 : 1.36;
        baseOptPitch = baseFontHeightMm * spacingFactor + (secSpacing * ptToMm * 0.45);
        baseOptionsBlockHeight = (numChoices - 1) * baseOptPitch + baseFontHeightMm;
        contentHeight = Math.max(imgSize, baseOptionsBlockHeight);
      }

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
          const startY = currentY;
          const imgX = startX + 1.5;
          const imgY = startY + Math.max(0, (contentHeight - imgSize) / 2);

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

          const numDistractors = numChoices - 1;

          // Distractor generation: section words -> master words -> fallbacks
          const otherSecTerms = secTerms.filter((t) => t.toLowerCase() !== currentWord.toLowerCase());
          let distractors = shuffleArray(otherSecTerms).slice(0, numDistractors);

          if (distractors.length < numDistractors) {
            const extra = masterTerms.filter(
              (t) => t.toLowerCase() !== currentWord.toLowerCase() && !distractors.some((d) => d.toLowerCase() === t.toLowerCase())
            );
            distractors = [...distractors, ...shuffleArray(extra)].slice(0, numDistractors);
          }

          if (distractors.length < numDistractors) {
            const extraFallbacks = fallbackTerms.filter(
              (t) => t.toLowerCase() !== currentWord.toLowerCase() && !distractors.some((d) => d.toLowerCase() === t.toLowerCase())
            );
            distractors = [...distractors, ...shuffleArray(extraFallbacks)].slice(0, numDistractors);
          }

          const optionsList = shuffleArray([currentWord, ...distractors]);

          if (isHorizontal) {
            // Horizontal layout for 2 choices (side-by-side next to image)
            const optStartX = imgX + imgSize + (isA5 ? 3.5 : 5.0);
            const availTextWidth = (startX + colWidth) - optStartX - (isA5 ? 1.0 : 2.0);
            const slotWidth = availTextWidth / 2;
            const minWordGap = 2.5;
            const maxSlotWordWidth = Math.max(10, slotWidth - minWordGap);

            doc.setFontSize(effectiveFontSize);
            applyFont(doc, secFont, 'normal');

            let maxRequiredWidth = 0;
            for (let opt = 0; opt < 2; opt++) {
              const w = doc.getTextWidth(optionsList[opt] || '');
              if (w > maxRequiredWidth) maxRequiredWidth = w;
            }

            let itemFontSize = effectiveFontSize;
            if (maxRequiredWidth > maxSlotWordWidth && maxRequiredWidth > 0) {
              const scale = maxSlotWordWidth / maxRequiredWidth;
              itemFontSize = Math.max(8, Math.floor(effectiveFontSize * scale));
            }

            doc.setFontSize(itemFontSize);
            applyFont(doc, secFont, 'normal');

            const itemFontHeightMm = itemFontSize * ptToMm;
            const rowCenterY = startY + contentHeight / 2;
            const baselineY = rowCenterY + (itemFontHeightMm * 0.35);

            for (let opt = 0; opt < 2; opt++) {
              const optText = optionsList[opt] || '';
              const optX = optStartX + opt * slotWidth;
              const isCorrect = optText.trim().toLowerCase() === currentWord.trim().toLowerCase();
              if (section.answerMode === 'answer' && isCorrect) {
                const textW = doc.getTextWidth(optText);
                const pillPadX = 1.8;
                const pillPadY = Math.min(0.7, itemFontHeightMm * 0.12);
                const pillH = itemFontHeightMm * 0.95 + pillPadY * 2;
                const pillY = baselineY - itemFontHeightMm * 0.78 - pillPadY;
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.45);
                doc.roundedRect(optX - pillPadX, pillY, textW + pillPadX * 2, pillH, pillH / 2, pillH / 2, 'S');
                applyFont(doc, secFont, 'bold');
                doc.setTextColor(220, 38, 38);
                doc.text(optText, optX, baselineY);
                applyFont(doc, secFont, 'normal');
                doc.setTextColor(30, 41, 59);
              } else {
                doc.setTextColor(30, 41, 59);
                doc.text(optText, optX, baselineY);
              }
            }
          } else {
            const optStartX = imgX + imgSize + 4;

            // Auto-scale safeguard for long words in 2 columns
            doc.setFontSize(effectiveFontSize);
            applyFont(doc, secFont, 'normal');

            const maxAllowedWidth = colWidth - (imgSize + 7.5);
            let itemFontSize = effectiveFontSize;
            let maxOptWidth = 0;
            for (const optText of optionsList) {
              const w = doc.getTextWidth(optText || '');
              if (w > maxOptWidth) maxOptWidth = w;
            }

            if (maxOptWidth > maxAllowedWidth && maxOptWidth > 0) {
              const scale = maxAllowedWidth / maxOptWidth;
              itemFontSize = Math.max(9, Math.floor(effectiveFontSize * scale));
            }

            doc.setFontSize(itemFontSize);
            applyFont(doc, secFont, 'normal');

            const itemFontHeightMm = itemFontSize * ptToMm;
            const itemOptPitch = itemFontHeightMm * spacingFactor + (secSpacing * ptToMm * 0.45);
            const itemOptionsBlockHeight = (numChoices - 1) * itemOptPitch + itemFontHeightMm;
            const fontAscent = itemFontHeightMm * 0.78;

            const optBlockTop = startY + Math.max(0, (contentHeight - itemOptionsBlockHeight) / 2);
            const firstBaseline = optBlockTop + fontAscent;

            for (let opt = 0; opt < numChoices; opt++) {
              const optText = optionsList[opt] || '';
              const optY = firstBaseline + opt * itemOptPitch;
              const isCorrect = optText.trim().toLowerCase() === currentWord.trim().toLowerCase();
              if (section.answerMode === 'answer' && isCorrect) {
                const textW = doc.getTextWidth(optText);
                const pillPadX = 1.8;
                const pillPadY = Math.min(0.7, itemFontHeightMm * 0.12);
                const pillH = itemFontHeightMm * 0.95 + pillPadY * 2;
                const pillY = optY - itemFontHeightMm * 0.78 - pillPadY;
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.45);
                doc.roundedRect(optStartX - pillPadX, pillY, textW + pillPadX * 2, pillH, pillH / 2, pillH / 2, 'S');
                applyFont(doc, secFont, 'bold');
                doc.setTextColor(220, 38, 38);
                doc.text(optText, optStartX, optY);
                applyFont(doc, secFont, 'normal');
                doc.setTextColor(30, 41, 59);
              } else {
                doc.setTextColor(30, 41, 59);
                doc.text(optText, optStartX, optY);
              }
            }
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
      const metrics = calculateType7Metrics(secFontSize, secSpacing, imgSize, isA5);
      const { effectiveFontSize, textOffset1, textOffset2, rowHeight: t7RowHeight } = metrics;
      const rowHeight = t7RowHeight;

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
          const textY1 = imgY + imgSize + textOffset1;
          const textY2 = textY1 + textOffset2;

          doc.setFontSize(effectiveFontSize);
          applyFont(doc, secFont, 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(scrambled, colCenter, textY1, { align: 'center' });

          if (section.answerMode === 'answer') {
            applyFont(doc, secFont, 'bold');
            doc.setTextColor(220, 38, 38);
            doc.text(word.term, colCenter, textY2, { align: 'center' });
            applyFont(doc, secFont, 'normal');
            doc.setTextColor(30, 41, 59);
          } else {
            const blanks = word.term
              .split(' ')
              .map((part) => '__ '.repeat(part.length).trim())
              .join('   ');
            doc.text(blanks, colCenter, textY2, { align: 'center' });
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 3) {
      // -------------------------------------------------------------
      // TYPE 3: Match picture to word or sentence / Look, match and write
      // Strictly NO bounding boxes/frames!
      // -------------------------------------------------------------
      if (section.matchMode === 'look_match_write') {
        const metrics = calculateType3LookMatchWriteMetrics(isA5, imgSize, secFontSize, secSpacing, section.lookMatchWriteTraceFontSize);
        const { rowContentHeight, rowGap, traceFontSize, prefixFontSize } = metrics;
        const rowPitch = rowContentHeight + rowGap;
        const maxChunkSize = Math.max(3, Math.floor((maxContentY - margin - 14) / rowPitch));

        const chunks: WorksheetWord[][] = [];
        for (let i = 0; i < secWords.length; i += maxChunkSize) {
          chunks.push(secWords.slice(i, i + maxChunkSize));
        }

        for (let chunkIdx = 0; chunkIdx < chunks.length; chunkIdx++) {
          const chunk = chunks[chunkIdx];
          const count = chunk.length;
          const chunkHeight = count * rowContentHeight + (count - 1) * rowGap;

          if (currentY + chunkHeight > maxContentY && !isAtTopOfPage) {
            await addNewPage();
          }

          // Prepare row items
          interface LookMatchWriteRowItem {
            originalIndex: number;
            word: WorksheetWord;
            prefix: string;
            suffix: string;
            color: [number, number, number];
          }

          const secHint = section.matchHint || 'none';
          const rowItems: LookMatchWriteRowItem[] = chunk.map((w, idx) => {
            const { prefix, suffix } = splitLookMatchWriteTerm(w.term);
            return {
              originalIndex: idx,
              word: w,
              prefix,
              suffix,
              color: getType3DotColor(idx, false, secHint)
            };
          });

          // Shuffle middle words relative to picture items so row i prefix is shuffled
          let shuffledWordRows = shuffleArray([...rowItems]);
          if (count > 1) {
            let hasCollision = shuffledWordRows.some((item, i) => item.originalIndex === i);
            let attempts = 0;
            while (hasCollision && attempts < 10) {
              shuffledWordRows = shuffleArray([...rowItems]);
              hasCollision = shuffledWordRows.some((item, i) => item.originalIndex === i);
              attempts++;
            }
          }

          // Suffix & Trace column items (Column 2 Suffix and Column 3 Trace/Write ALWAYS belong to the same word!)
          let suffixItems: { suffix: string; word: WorksheetWord; color: [number, number, number] }[];
          if (section.lookMatchWriteShuffleSuffix) {
            let shuffledSuffixes = shuffleArray(rowItems.map(item => ({ suffix: item.suffix, word: item.word, color: item.color, orig: item.originalIndex })));
            if (count > 1) {
              let collision = shuffledSuffixes.some((s, idx) => s.orig === shuffledWordRows[idx].originalIndex);
              let attempts = 0;
              while (collision && attempts < 15) {
                const res = shuffleArray(rowItems.map(item => ({ suffix: item.suffix, word: item.word, color: item.color, orig: item.originalIndex })));
                if (!res.some((s, idx) => s.orig === shuffledWordRows[idx].originalIndex)) {
                  shuffledSuffixes = res;
                  break;
                }
                attempts++;
              }
            }
            suffixItems = shuffledSuffixes.map(s => ({ suffix: s.suffix, word: s.word, color: s.color }));
          } else {
            // Keep suffix and trace on the same horizontal row as the prefix (like sample image)
            suffixItems = shuffledWordRows.map(item => ({ suffix: item.suffix, word: item.word, color: item.color }));
          }

          applyFont(doc, secFont, 'bold');
          doc.setFontSize(prefixFontSize);
          const maxPrefixW = Math.max(...chunk.map(w => doc.getTextWidth(splitLookMatchWriteTerm(w.term).prefix)));
          const maxSuffixW = Math.max(...chunk.map(w => doc.getTextWidth(splitLookMatchWriteTerm(w.term).suffix)));

          const activeWriteFont = (secFont === 'HP001' || secFont === 'HLHOCTRO') ? secFont : 'KG Primary Dots';
          applyFont(doc, activeWriteFont, 'normal');
          doc.setFontSize(traceFontSize);
          const maxTraceW = Math.max(...chunk.map(w => doc.getTextWidth(w.term)));

          const dotRadius = isA5 ? 0.75 : 0.9;
          const dotImgGap = isA5 ? 3.5 : 4.5;

          const imgX = margin + (isA5 ? 1.5 : 3.0);
          const imgDotX = imgX + imgSize + dotImgGap;

          const prefixColWidth = Math.max(isA5 ? 16 : 22, maxPrefixW + (isA5 ? 8 : 12));
          const suffixColWidth = Math.max(isA5 ? 12 : 16, maxSuffixW + (isA5 ? 6 : 8));
          const writeColWidth = Math.max(isA5 ? 26 : 34, maxTraceW + (isA5 ? 6 : 8));

          const totalNeededW = (imgSize + dotImgGap) + prefixColWidth + suffixColWidth + writeColWidth;
          const remainingW = (pageWidth - margin * 2) - totalNeededW;
          const interColGap = Math.max(isA5 ? 8 : 12, Math.min(isA5 ? 20 : 32, remainingW / 3));

          const prefixLeftDotX = imgDotX + interColGap;
          const prefixRightDotX = prefixLeftDotX + prefixColWidth;
          const prefixCenterX = prefixLeftDotX + prefixColWidth / 2;

          const suffixDotX = prefixRightDotX + interColGap;
          const suffixTextX = suffixDotX + (isA5 ? 3.5 : 4.5);

          const writeStartX = suffixDotX + suffixColWidth + interColGap * 0.4;

          for (let i = 0; i < count; i++) {
            const rowCenterY = currentY + i * (rowContentHeight + rowGap) + rowContentHeight / 2;

            // 1. Draw Image
            const imgPosY = rowCenterY - imgSize / 2;
            const word = chunk[i];
            const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
            if (img) {
              try {
                const imgFmt = (img.startsWith('data:image/png') || img.startsWith('iVBORw0KGgo')) ? 'PNG' : 'JPEG';
                doc.addImage(img, imgFmt, imgX, imgPosY, imgSize, imgSize);
              } catch {
                if (showImageBorder) doc.rect(imgX, imgPosY, imgSize, imgSize);
              }
            } else if (showImageBorder) {
              doc.rect(imgX, imgPosY, imgSize, imgSize);
            }
            if (showImageBorder) {
              doc.rect(imgX - 1.5, imgPosY - 1.5, imgSize + 3, imgSize + 3);
            }

            // 2. Draw Image Connector Dot
            const imgDotColor = rowItems[i].color;
            doc.setFillColor(imgDotColor[0], imgDotColor[1], imgDotColor[2]);
            doc.circle(imgDotX, rowCenterY, dotRadius, 'F');

            // 3. Draw Column 2: Prefix
            const wordItem = shuffledWordRows[i];
            const prefixColor = wordItem.color;

            doc.setFillColor(prefixColor[0], prefixColor[1], prefixColor[2]);
            doc.circle(prefixLeftDotX, rowCenterY, dotRadius, 'F');

            applyFont(doc, secFont, 'bold');
            doc.setFontSize(prefixFontSize);
            doc.setTextColor(30, 41, 59);
            doc.text(wordItem.prefix, prefixCenterX, rowCenterY + (isA5 ? 0.9 : 1.2), { align: 'center' });

            doc.setFillColor(prefixColor[0], prefixColor[1], prefixColor[2]);
            doc.circle(prefixRightDotX, rowCenterY, dotRadius, 'F');

            // 4. Draw Column 3: Suffix
            const sItem = suffixItems[i];
            doc.setFillColor(sItem.color[0], sItem.color[1], sItem.color[2]);
            doc.circle(suffixDotX, rowCenterY, dotRadius, 'F');

            applyFont(doc, secFont, 'bold');
            doc.setFontSize(prefixFontSize);
            doc.setTextColor(30, 41, 59);
            doc.text(sItem.suffix, suffixTextX, rowCenterY + (isA5 ? 0.9 : 1.2), { align: 'left' });

            // 5. Draw Column 4: Write / Trace Word
            // Column 2 (Suffix) and Column 3 (Trace/Write) ALWAYS belong to the same word!
            const writeWord = sItem.word.term;
            const writeMode = section.lookMatchWriteMode || 'trace';
            const showBaseline = section.lookMatchWriteShowBaseline !== false;

            let writeTextToDraw = writeWord;
            let currentWriteFont = activeWriteFont;
            let currentWriteFontSize = traceFontSize;

            if (writeMode === 'blank') {
              if (section.answerMode === 'answer') {
                writeTextToDraw = writeWord;
                currentWriteFont = secFont || 'r0c0i Linotte';
                currentWriteFontSize = prefixFontSize;
                applyFont(doc, currentWriteFont, 'bold');
                doc.setFontSize(currentWriteFontSize);
                doc.setTextColor(220, 38, 38);
              } else {
                writeTextToDraw = formatLookMatchWriteBlank(writeWord);
                currentWriteFont = 'r0c0i Linotte';
                currentWriteFontSize = prefixFontSize;
                applyFont(doc, currentWriteFont, 'normal');
                doc.setFontSize(currentWriteFontSize);
                doc.setTextColor(45, 55, 72);
              }
            } else {
              applyFont(doc, currentWriteFont, 'normal');
              doc.setFontSize(currentWriteFontSize);
              doc.setTextColor(45, 55, 72);
            }

            const textBaselineY = rowCenterY + (isA5 ? 1.0 : 1.3);
            doc.text(writeTextToDraw, writeStartX, textBaselineY, { align: 'left' });

            // Dashed baseline underneath word
            if (showBaseline) {
              const textW = doc.getTextWidth(writeTextToDraw);
              const baselineW = Math.max(textW + (isA5 ? 4 : 6), isA5 ? 20 : 28);
              const baselineOffset = writeMode === 'blank' ? (isA5 ? 2.8 : 3.4) : (isA5 ? 1.6 : 2.0);
              const baselineY = textBaselineY + baselineOffset;

              doc.setDrawColor(40, 40, 40);
              doc.setLineWidth(0.4);
              setDocLineDash(doc, [0.8, 0.8]);
              doc.line(writeStartX, baselineY, writeStartX + baselineW, baselineY);
              setDocLineDash(doc, []);
            }
          }

          // If Answer Mode: draw connecting lines for look_match_write
          if (section.answerMode === 'answer') {
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.45);
            for (let i = 0; i < count; i++) {
              const picRowCenterY = currentY + i * (rowContentHeight + rowGap) + rowContentHeight / 2;
              const targetPrefixRowIdx = shuffledWordRows.findIndex((item) => item.originalIndex === i);
              if (targetPrefixRowIdx !== -1) {
                const targetPrefixCenterY = currentY + targetPrefixRowIdx * (rowContentHeight + rowGap) + rowContentHeight / 2;
                doc.line(imgDotX, picRowCenterY, prefixLeftDotX, targetPrefixCenterY);

                const targetSuffixRowIdx = suffixItems.findIndex((s) => s.word.term === chunk[i].term);
                if (targetSuffixRowIdx !== -1) {
                  const targetSuffixCenterY = currentY + targetSuffixRowIdx * (rowContentHeight + rowGap) + rowContentHeight / 2;
                  doc.line(prefixRightDotX, targetPrefixCenterY, suffixDotX, targetSuffixCenterY);
                }
              }
            }
          }

          currentY += chunkHeight;
          isAtTopOfPage = false;
        }
      } else {
        const isSentence = section.matchMode === 'sentence';
        const fontHeightMm = secFontSize * 0.352778;
        const baseBoxHeight = isSentence ? (isA5 ? 10 : 12) : (isA5 ? 7.5 : 9.5);
        const boxHeight = Math.max(baseBoxHeight, fontHeightMm * 1.35);
        const boxWidth = isSentence ? (isA5 ? 76 : 110) : (isA5 ? 46 : 50);
        const boxGap = (secSpacing === 0 ? 0.8 : 0.8 + secSpacing * 0.352778);
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

          const dotRadius = isA5 ? 0.6 : 0.75;
          const dotImgOffset = isA5 ? 2.8 : 3.5;
          const secHint = section.matchHint || 'none';

          for (let i = 0; i < count; i++) {
            const isRight = i >= half;
            const rowInCol = isRight ? i - half : i;
            const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
            const posY = currentY + (half > 1 ? rowInCol * imgPitch : 0);

            const word = chunk[i];
            const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
            if (img) {
              try {
                const imgFmt = (img.startsWith('data:image/png') || img.startsWith('iVBORw0KGgo')) ? 'PNG' : 'JPEG';
                doc.addImage(img, imgFmt, posX, posY, imgSize, imgSize);
              } catch {
                if (showImageBorder) doc.rect(posX, posY, imgSize, imgSize);
              }
            } else if (showImageBorder) {
              doc.rect(posX, posY, imgSize, imgSize);
            }
            if (showImageBorder) {
              doc.rect(posX - 1.5, posY - 1.5, imgSize + 3, imgSize + 3);
            }

            // Draw picture connector dot
            const dotColor = getType3DotColor(i, isRight, secHint);
            const imgCenterY = posY + imgSize / 2;
            const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);
            doc.setFillColor(dotColor[0], dotColor[1], dotColor[2]);
            doc.circle(imgDotX, imgCenterY, dotRadius, 'F');
          }

          // Prepare items for middle column keeping track of originalIndex, isRight, and dotColor
          interface Type3ChunkMatchItem {
            originalIndex: number;
            isRight: boolean;
            term: string;
            color: [number, number, number];
            sentence?: HighlightedSpan[];
          }

          const matchItems: Type3ChunkMatchItem[] = chunk.map((w, idx) => {
            const isRight = idx >= half;
            return {
              originalIndex: idx,
              isRight,
              term: w.term,
              color: getType3DotColor(idx, isRight, secHint),
              sentence: isSentence ? parseHighlightedSentence(w.exampleSentence, w.term) : undefined
            };
          });

          const shuffledItems = shuffleArray(matchItems);

          // Shuffled words or sentences placed in the center (without any bounding boxes)
          if (isSentence) {
            const sFontSize = secFontSize ? (isA5 ? Math.min(secFontSize, 11) : secFontSize) : (isA5 ? 10.5 : 12);
            doc.setFontSize(sFontSize);

            // Dynamic sentence width calculation based on font & font size
            let maxHalfSentenceWidth = 14;
            for (const item of shuffledItems) {
              if (item.sentence) {
                let sentenceWidth = 0;
                for (const span of item.sentence) {
                  applyFont(doc, secFont, span.isHighlighted ? 'bold' : 'normal');
                  sentenceWidth += doc.getTextWidth(span.text);
                }
                if (sentenceWidth / 2 > maxHalfSentenceWidth) {
                  maxHalfSentenceWidth = sentenceWidth / 2;
                }
              }
            }

            const minHalfCol = isA5 ? 18 : 24;
            const textPadding = isA5 ? 3.0 : 3.8;
            let centerColHalfWidth = Math.max(minHalfCol, maxHalfSentenceWidth + textPadding);

            // Safety clamp against picture dots (guarantee at least 10mm clearance from picture dots)
            const leftPictureDotX = margin + 2 + imgSize + dotImgOffset;
            const rightPictureDotX = (pageWidth - margin - imgSize - 2) - dotImgOffset;
            const maxSafeHalfWidth = Math.min((pageWidth / 2) - (leftPictureDotX + 10), (rightPictureDotX - 10) - (pageWidth / 2));
            centerColHalfWidth = Math.min(centerColHalfWidth, maxSafeHalfWidth);

            const leftSentenceDotX = (pageWidth / 2) - centerColHalfWidth;
            const rightSentenceDotX = (pageWidth / 2) + centerColHalfWidth;
            const activeSentenceBoxWidth = Math.max(20, (centerColHalfWidth - textPadding) * 2);
            const sentenceBoxX = (pageWidth - activeSentenceBoxWidth) / 2;

            for (let i = 0; i < count; i++) {
              const centerBoxY = currentY + i * (boxHeight + boxGap);
              const item = shuffledItems[i];
              if (item.sentence) {
                drawHighlightedCenteredSentence(
                  doc,
                  item.sentence,
                  sentenceBoxX,
                  centerBoxY,
                  activeSentenceBoxWidth,
                  boxHeight,
                  sFontSize,
                  secFont
                );
              }

              // Draw connector dot next to the sentence
              const textDotX = item.isRight ? rightSentenceDotX : leftSentenceDotX;
              const textDotY = centerBoxY + boxHeight / 2;
              doc.setFillColor(item.color[0], item.color[1], item.color[2]);
              doc.circle(textDotX, textDotY, dotRadius, 'F');
            }

            // If Answer Mode: draw connecting lines for sentences
            if (section.answerMode === 'answer') {
              for (let i = 0; i < count; i++) {
                const isRight = i >= half;
                const rowInCol = isRight ? i - half : i;
                const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
                const posY = currentY + (half > 1 ? rowInCol * imgPitch : 0);
                const imgCenterY = posY + imgSize / 2;
                const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);

                const targetShuffledIdx = shuffledItems.findIndex((it) => it.originalIndex === i);
                if (targetShuffledIdx !== -1) {
                  const targetItem = shuffledItems[targetShuffledIdx];
                  const targetTextDotX = targetItem.isRight ? rightSentenceDotX : leftSentenceDotX;
                  const targetTextDotY = currentY + targetShuffledIdx * (boxHeight + boxGap) + boxHeight / 2;
                  doc.setDrawColor(220, 38, 38);
                  doc.setLineWidth(0.45);
                  doc.line(imgDotX, imgCenterY, targetTextDotX, targetTextDotY);
                }
              }
            }
          } else {
            applyFont(doc, secFont, 'normal');
            doc.setFontSize(secFontSize);

            // Dynamic column width calculation based on font & font size
            const maxHalfWordWidth = Math.max(...chunk.map((w) => doc.getTextWidth(w.term) / 2));
            const minHalfCol = isA5 ? 20 : 25;
            const textPadding = isA5 ? 3.0 : 3.8;
            let centerColHalfWidth = Math.max(minHalfCol, maxHalfWordWidth + textPadding);

            // Safety clamp against picture dots
            const leftPictureDotX = margin + 2 + imgSize + dotImgOffset;
            const rightPictureDotX = (pageWidth - margin - imgSize - 2) - dotImgOffset;
            const maxSafeHalfWidth = Math.min((pageWidth / 2) - (leftPictureDotX + 6), (rightPictureDotX - 6) - (pageWidth / 2));
            centerColHalfWidth = Math.min(centerColHalfWidth, maxSafeHalfWidth);

            const leftTextDotX = (pageWidth / 2) - centerColHalfWidth;
            const rightTextDotX = (pageWidth / 2) + centerColHalfWidth;

            for (let i = 0; i < count; i++) {
              const centerBoxY = currentY + i * (boxHeight + boxGap);
              const item = shuffledItems[i];

              // Draw centered word
              doc.setTextColor(30, 41, 59);
              doc.text(item.term, pageWidth / 2, centerBoxY + boxHeight / 2 + (isA5 ? 0.9 : 1.2), { align: 'center' });

              // Draw connector dot next to the word
              const textDotX = item.isRight ? rightTextDotX : leftTextDotX;
              const textDotY = centerBoxY + boxHeight / 2;
              doc.setFillColor(item.color[0], item.color[1], item.color[2]);
              doc.circle(textDotX, textDotY, dotRadius, 'F');
            }

            // If Answer Mode: draw connecting lines for words
            if (section.answerMode === 'answer') {
              for (let i = 0; i < count; i++) {
                const isRight = i >= half;
                const rowInCol = isRight ? i - half : i;
                const posX = isRight ? (pageWidth - margin - imgSize - 2) : (margin + 2);
                const posY = currentY + (half > 1 ? rowInCol * imgPitch : 0);
                const imgCenterY = posY + imgSize / 2;
                const imgDotX = isRight ? (posX - dotImgOffset) : (posX + imgSize + dotImgOffset);

                const targetShuffledIdx = shuffledItems.findIndex((it) => it.originalIndex === i);
                if (targetShuffledIdx !== -1) {
                  const targetItem = shuffledItems[targetShuffledIdx];
                  const targetTextDotX = targetItem.isRight ? rightTextDotX : leftTextDotX;
                  const targetTextDotY = currentY + targetShuffledIdx * (boxHeight + boxGap) + boxHeight / 2;
                  doc.setDrawColor(220, 38, 38);
                  doc.setLineWidth(0.45);
                  doc.line(imgDotX, imgCenterY, targetTextDotX, targetTextDotY);
                }
              }
            }
          }

          currentY += chunkHeight;
          isAtTopOfPage = false;
        }
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
      const rowGap = (secSpacing !== undefined ? secSpacing : 6) * 0.352778;
      const isAnsMode = section.answerMode === 'answer';
      const traceFont = isAnsMode
        ? (section.fontFamily && section.fontFamily !== 'KG Primary Dots' ? section.fontFamily : 'r0c0i Linotte')
        : ((section.fontFamily && section.fontFamily !== 'r0c0i Linotte') ? section.fontFamily : 'KG Primary Dots');

      for (let i = 0; i < secWords.length; i++) {
        const word = secWords[i];
        const layout = layoutTraceText(doc, word.term, traceFontSize, colTraceWidth - 3, traceFont);
        const textBlockH = layout.lines.length * (layout.fontSize * 0.352778 * 1.15);
        const contentH = Math.max(imgSize, textBlockH);
        const baseRowHeight = contentH + Math.max(2.0, (traceFontSize * 0.352778) * 0.22);
        const rowHeight = baseRowHeight + rowGap;

        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        const img = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
        const rowY = currentY;
        const rowCenterY = rowY + baseRowHeight / 2;

        // Column 1: Image or Letter Circle Badge (Strictly NO frame/border around image)
        const col1CenterX = tableX + col1Width / 2;
        if (img) {
          const maxDim = Math.min(imgSize, baseRowHeight - 1, col1Width - 4);
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
          const badgeRadius = Math.min(baseRowHeight * 0.38, col1Width * 0.36);
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

        // Columns 2, 3, 4: Trace text with font KG Primary Dots (or solid red font in answer mode)
        if (isAnsMode) {
          applyFont(doc, traceFont, 'bold');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(220, 38, 38);
        } else {
          applyFont(doc, traceFont, 'normal');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(30, 30, 30);
        }

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
          doc.line(tableX, rowY + baseRowHeight, tableX + tableWidth, rowY + baseRowHeight);
          const vCols = [
            tableX,
            tableX + col1Width,
            tableX + col1Width + colTraceWidth,
            tableX + col1Width + colTraceWidth * 2,
            tableX + tableWidth
          ];
          for (const vx of vCols) {
            doc.line(vx, rowY, vx, rowY + baseRowHeight);
          }
          setDocLineDash(doc, []);
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 9) {
      // -------------------------------------------------------------
      // TYPE 9: Look and color Yes or No (3 columns, no frame, 2 circles)
      // Dynamic compact spacing responsive to section spacing setting
      // -------------------------------------------------------------
      const cols = 3;
      const colGap = isA5 ? 3.0 : 4.5;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

      const secMetrics = calculateType9Metrics(isA5, imgSize, secSpacing, secFontSize, cardWidth);
      const { maxImgDim, sFontSize, gapImgToSentence, gapSentenceToYesNo, circleRadius, rowGap } = secMetrics;
      const circleSpacing = isA5 ? 15 : 20;

      // Pre-calculate spans and heights for each word in this section
      const parsedSecWords = secWords.map((w) => {
        const spans = parseHighlightedSentence(w.exampleSentence, w.term);
        const layout = measureHighlightedSentenceLines(doc, spans, cardWidth, sFontSize, secFont);
        return {
          word: w,
          spans,
          sentenceH: layout.totalHeight
        };
      });

      const totalRows = Math.ceil(parsedSecWords.length / cols);
      const poolWithImages = masterWordPool.filter((w) => w.imageUrl && w.imageUrl.trim().length > 0);

      for (let r = 0; r < totalRows; r++) {
        const rowStartIndex = r * cols;
        const rowEndIndex = Math.min(rowStartIndex + cols, parsedSecWords.length);
        const rowItems = parsedSecWords.slice(rowStartIndex, rowEndIndex);

        const maxSentenceH = Math.max(...rowItems.map((item) => item.sentenceH));
        const cardHeight = maxImgDim + gapImgToSentence + maxSentenceH + gapSentenceToYesNo + circleRadius * 2;
        const rowHeight = cardHeight + rowGap;

        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        for (let c = 0; c < rowItems.length; c++) {
          const idx = rowStartIndex + c;
          const item = rowItems[c];
          const currentWord = item.word;
          const cardX = margin + c * (cardWidth + colGap);

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

          // 1. Top Compartment: Centered Image (compact, strictly NO card frame/borders)
          const lx = cardX + (cardWidth - maxImgDim) / 2;
          const ly = currentY;
          if (displayedImg) {
            try {
              doc.addImage(displayedImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          // 2. Middle Compartment: Sentence with highlighted <#...#> in RED (tight gap below image)
          const sentenceTopY = currentY + maxImgDim + gapImgToSentence;
          const extraPad = (maxSentenceH - item.sentenceH) / 2;
          drawHighlightedCenteredSentence(
            doc,
            item.spans,
            cardX,
            sentenceTopY + extraPad,
            cardWidth,
            item.sentenceH,
            sFontSize,
            secFont
          );

          // 3. Bottom: 2 circles "Yes" and "No" centered under each sentence (tight gap below sentence)
          const yesNoTopY = sentenceTopY + maxSentenceH + gapSentenceToYesNo;
          const circleCenterY = yesNoTopY + circleRadius;
          const cardCenterX = cardX + cardWidth / 2;
          const yesCenterX = cardCenterX - circleSpacing / 2;
          const noCenterX = cardCenterX + circleSpacing / 2;

          const isAnsMode = section.answerMode === 'answer';

          if (isAnsMode) {
            const correctCenterX = isYes ? yesCenterX : noCenterX;
            const otherCenterX = isYes ? noCenterX : yesCenterX;
            const correctText = isYes ? 'Yes' : 'No';
            const otherText = isYes ? 'No' : 'Yes';

            // Correct circle: filled in red with white bold text
            doc.setFillColor(220, 38, 38);
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.4);
            doc.circle(correctCenterX, circleCenterY, circleRadius, 'FD');

            applyFont(doc, secFont, 'bold');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(255, 255, 255);
            doc.text(correctText, correctCenterX, circleCenterY, { align: 'center', baseline: 'middle' });

            // Other circle: hollow with normal text
            doc.setDrawColor(70, 70, 70);
            doc.setLineWidth(0.3);
            doc.circle(otherCenterX, circleCenterY, circleRadius, 'S');

            applyFont(doc, secFont, 'normal');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(30, 41, 59);
            doc.text(otherText, otherCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.setTextColor(0, 0, 0);
          } else {
            doc.setDrawColor(70, 70, 70);
            doc.setLineWidth(0.3);
            doc.circle(yesCenterX, circleCenterY, circleRadius, 'S');
            doc.circle(noCenterX, circleCenterY, circleRadius, 'S');

            applyFont(doc, secFont, 'normal');
            doc.setFontSize(isA5 ? 8.5 : 10.5);
            doc.setTextColor(30, 41, 59);
            doc.text('Yes', yesCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.text('No', noCenterX, circleCenterY, { align: 'center', baseline: 'middle' });
            doc.setTextColor(0, 0, 0);
          }
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
      const metrics = calculateType10Metrics(isA5, imgSize, secSpacing, secFontSize, cardWidth);
      const { effectiveFontSize, subW, imgBoxHeight, maxImgDim, wordBoxHeight, rowHeight } = metrics;
      const totalRows = Math.ceil(secWords.length / cols);
      const isAnsMode = section.answerMode === 'answer';

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

          const lx = cardX + (subW - maxImgDim) / 2;
          const ly = cardY + (imgBoxHeight - maxImgDim) / 2;
          const rx = cardX + subW + (subW - maxImgDim) / 2;
          const ry = cardY + (imgBoxHeight - maxImgDim) / 2;

          if (leftImg) {
            try {
              doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          if (rightImg) {
            try {
              doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(rx, ry, maxImgDim, maxImgDim);
          }

          if (isAnsMode) {
            const ansX = isCorrectOnLeft ? lx : rx;
            const ansY = isCorrectOnLeft ? ly : ry;

            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.5);
            doc.roundedRect(ansX - 0.8, ansY - 0.8, maxImgDim + 1.6, maxImgDim + 1.6, 1.2, 1.2, 'S');

            const badgeR = 2.0;
            const badgeX = ansX + maxImgDim - 0.8;
            const badgeY = ansY + 0.8;
            doc.setFillColor(220, 38, 38);
            doc.circle(badgeX, badgeY, badgeR, 'F');
            applyFont(doc, 'r0c0i Linotte', 'bold');
            doc.setFontSize(7.5);
            doc.setTextColor(255, 255, 255);
            doc.text('✓', badgeX, badgeY + 0.65, { align: 'center' });
          }

          const textY = cardY + imgBoxHeight + wordBoxHeight / 2 + (isA5 ? 1.0 : 1.3);
          if (isAnsMode) {
            applyFont(doc, secFont, 'bold');
            doc.setFontSize(effectiveFontSize);
            doc.setTextColor(220, 38, 38);
            doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
              align: 'center',
              maxWidth: cardWidth - 2
            });
            doc.setTextColor(0, 0, 0);
            applyFont(doc, secFont, 'normal');
          } else {
            applyFont(doc, secFont, 'normal');
            doc.setFontSize(effectiveFontSize);
            doc.setTextColor(30, 41, 59);
            doc.text(currentWord.term, cardX + cardWidth / 2, textY, {
              align: 'center',
              maxWidth: cardWidth - 2
            });
            doc.setTextColor(0, 0, 0);
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 11) {
      // -------------------------------------------------------------
      // TYPE 11: Write and circle the correct picture (Composite mode)
      // Strictly NO bounding box / frame around cards or images!
      // -------------------------------------------------------------
      const isAnsMode = section.answerMode === 'answer';
      const tableX = margin;
      const tableWidth = printableWidth;
      const colWordWidth = isA5 ? 46.0 : 68.0;
      const colPicsWidth = tableWidth - colWordWidth;
      const numChoices = 3; // Fixed to 3 pictures per row
      const slotWidth = colPicsWidth / 3;

      const imgBoxHeight = Math.max(imgSize + 2.0, isA5 ? 14.0 : 16.0);
      const activeFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;
      const isTrace = activeFont === 'KG Primary Dots' || activeFont === 'KGPrimaryDots';
      const defaultFontSize = isTrace ? (isA5 ? 22 : 26) : (isA5 ? 13 : 15);
      const wordFontSize = secFontSize || defaultFontSize;

      const textH = wordFontSize * 0.352778 * 1.25;
      const contentH = Math.max(imgBoxHeight, textH + 2.0);
      const rowGap = (secSpacing === 0 ? 2.0 : 2.5) + (secSpacing !== undefined ? secSpacing : 0) * 0.25;
      const rowHeight = contentH + rowGap;

      const poolWithImages = masterWordPool.filter((w) => w.imageUrl && w.imageUrl.trim().length > 0);

      for (let i = 0; i < secWords.length; i++) {
        if (currentY + rowHeight > maxContentY && !isAtTopOfPage) {
          await addNewPage();
        }

        const rowContentHeight = rowHeight - rowGap;
        const rowCenterY = currentY + rowContentHeight / 2;
        const currentWord = secWords[i];

        const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;

        const otherPool = poolWithImages.filter(
          (w) => w.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
        );

        let distractor1: string | null = null;
        let distractor2: string | null = null;
        if (otherPool.length >= 2) {
          const idx1 = (i * 2 + 1) % otherPool.length;
          let idx2 = (idx1 + 1 + (i % (otherPool.length - 1))) % otherPool.length;
          if (idx2 === idx1) idx2 = (idx1 + 1) % otherPool.length;
          distractor1 = await fetchImageAsBase64(otherPool[idx1].imageUrl!);
          distractor2 = await fetchImageAsBase64(otherPool[idx2].imageUrl!);
        } else if (otherPool.length === 1) {
          distractor1 = await fetchImageAsBase64(otherPool[0].imageUrl!);
          distractor2 = targetImg || distractor1;
        } else {
          distractor1 = targetImg;
          distractor2 = targetImg;
        }

        // Determine slot for correct target image (0, 1, or 2)
        const targetSlot = (i * 2 + currentWord.term.length) % 3;
        const distractors = [distractor1, distractor2];
        let dIdx = 0;
        const slotImages: (string | null)[] = [];
        for (let s = 0; s < 3; s++) {
          if (s === targetSlot) {
            slotImages[s] = targetImg || distractor1 || distractor2;
          } else {
            slotImages[s] = distractors[dIdx++] || targetImg;
          }
        }

        // 1. Draw Left Word Section (No underline)
        const wordLeft = tableX;
        const wordRight = tableX + colWordWidth - 4.0;
        const wordCenterX = (wordLeft + wordRight) / 2;

        const layout = layoutTraceText(doc, currentWord.term, wordFontSize, wordRight - wordLeft - 4.0, activeFont);
        if (isAnsMode) {
          applyFont(doc, activeFont, 'bold');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(220, 38, 38);
        } else {
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(layout.fontSize);
          doc.setTextColor(isTrace ? 30 : 15, isTrace ? 30 : 23, isTrace ? 30 : 42);
        }

        if (layout.lines.length <= 1) {
          doc.text(layout.lines[0] || '', wordCenterX, rowCenterY + (layout.fontSize * 0.352778) * 0.35, { align: 'center' });
        } else {
          const lineHeight = layout.fontSize * 0.352778 * 1.15;
          const totalH = (layout.lines.length - 1) * lineHeight;
          const topY = rowCenterY - totalH / 2 + (layout.fontSize * 0.352778) * 0.35;
          layout.lines.forEach((lineText, lineIdx) => {
            doc.text(lineText, wordCenterX, topY + lineIdx * lineHeight, { align: 'center' });
          });
        }

        // 2. Draw Right Picture Section (No underline)
        const maxImgDim = Math.min(imgSize, slotWidth - 4.0, imgBoxHeight);
        for (let c = 0; c < numChoices; c++) {
          const slotLeft = tableX + colWordWidth + c * slotWidth;
          const slotCenterX = slotLeft + slotWidth / 2;
          const imgToDraw = slotImages[c];

          const picX = slotCenterX - maxImgDim / 2;
          const picY = rowCenterY - maxImgDim / 2;

          if (imgToDraw) {
            try {
              doc.addImage(imgToDraw, 'JPEG', picX, picY, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(picX, picY, maxImgDim, maxImgDim);
            }
            if (showImageBorder) {
              doc.setDrawColor(180, 180, 180);
              doc.setLineWidth(0.2);
              doc.rect(picX, picY, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(0.2);
            doc.rect(picX, picY, maxImgDim, maxImgDim);
          }

          if (isAnsMode && c === targetSlot) {
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.85);
            setDocLineDash(doc, []);
            doc.circle(slotCenterX, rowCenterY, maxImgDim * 0.58, 'S');
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 12) {
      // -------------------------------------------------------------
      // TYPE 12: Look and write (2 columns in Composite Mode)
      // -------------------------------------------------------------
      const isAnsMode = section.answerMode === 'answer';
      const cols = 2;
      const colGap = isA5 ? 6.0 : 10.0;
      const cardWidth = (printableWidth - colGap) / 2;
      const sFontSize = secFontSize || (isA5 ? 11.5 : 13.5);
      const imgBoxHeight = imgSize + 2.0;
      const sentenceBoxHeight = Math.max(isA5 ? 10.0 : 12.0, (sFontSize * 0.352778 * 1.35 * 2) + 2.0);
      const cardHeight = imgBoxHeight + sentenceBoxHeight;
      const rowGap = (secSpacing === 0 ? 2.0 : 2.5) + (secSpacing !== undefined ? secSpacing : 0) * 0.35;
      const rowHeight = cardHeight + rowGap;

      const totalRows = Math.ceil(secWords.length / cols);
      for (let r = 0; r < totalRows; r++) {
        if (!isAtTopOfPage && currentY + rowHeight > maxContentY) {
          await addNewPage();
        }

        const startIdx = r * cols;
        const endIdx = Math.min(startIdx + cols, secWords.length);

        for (let i = startIdx; i < endIdx; i++) {
          const col = i % cols;
          const cardX = margin + col * (cardWidth + colGap);
          const cardY = currentY;
          const word = secWords[i];

          const lx = cardX + (cardWidth - imgSize) / 2;
          const ly = cardY + (imgBoxHeight - imgSize) / 2;

          const wordImg = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (wordImg) {
            try {
              doc.addImage(wordImg, 'JPEG', lx, ly, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(lx, ly, imgSize, imgSize);
          }

          if (isAnsMode) {
            if (word.exampleSentence && word.exampleSentence.trim().length > 0) {
              const spans = parseHighlightedSentence(word.exampleSentence, word.term);
              drawType15SentenceLine(
                doc,
                spans,
                null,
                cardX,
                cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2,
                cardWidth,
                sFontSize,
                secFont
              );
            } else {
              applyFont(doc, secFont, 'bold');
              doc.setFontSize(sFontSize);
              doc.setTextColor(220, 38, 38);
              doc.text(word.term, cardX + cardWidth / 2, cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2, {
                align: 'center',
                maxWidth: cardWidth - 4
              });
              doc.setTextColor(0, 0, 0);
            }
          } else {
            const sentenceData = getLookAndWriteSentence(word);
            if (sentenceData) {
              drawLookAndWriteSentence(
                doc,
                sentenceData.fullSentence,
                cardX,
                cardY + imgBoxHeight,
                cardWidth,
                sentenceBoxHeight,
                sFontSize,
                secFont
              );
            } else {
              const blankedTerm = formatLookAndWriteTerm(word.term);
              applyFont(doc, secFont, 'normal');
              doc.setFontSize(sFontSize);
              doc.setTextColor(30, 41, 59);
              doc.text(blankedTerm, cardX + cardWidth / 2, cardY + imgBoxHeight + sentenceBoxHeight / 2 + 1.2, {
                align: 'center',
                maxWidth: cardWidth - 4
              });
              doc.setTextColor(0, 0, 0);
            }
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 13) {
      // -------------------------------------------------------------
      // TYPE 13: Wordsearch Puzzle in Composite Mode
      // -------------------------------------------------------------
      const secFontSize = section.fontSize || globalFontSize || 12;
      const directions = section.wordsearchDirections || ['horizontal', 'vertical', 'diagonalDown'];
      const hintType = section.wordsearchHintType || 'word';
      const gridSizePref = section.wordsearchGridSize || 'auto';
      const gridBorder = section.wordsearchGridBorder || 'none';
      const wordsearchCase = section.wordsearchCase || 'lower';

      const puzzle = generateWordsearchPuzzle(secWords, directions, gridSizePref, wordsearchCase);
      const { grid, placedWords } = puzzle;
      const cols = grid[0].length;
      const rows = grid.length;

      // Proportional cell size based on secFontSize
      const proportionalCellSize = secFontSize * 0.58;
      const gapX = isA5 ? 3.0 : 4.0;
      const minFlankW = isA5 ? (hintType === 'word' ? 24 : 18) : (hintType === 'word' ? 30 : 24);
      const maxGridW = printableWidth - 2 * minFlankW - 2 * gapX;
      const maxSectionH = isA5 ? 90 : 120;
      const maxCellW = maxGridW / cols;
      const maxCellH = maxSectionH / rows;
      const cellSize = Math.max(3.8, Math.min(proportionalCellSize, maxCellW, maxCellH));
      const totalGridW = cols * cellSize;
      const totalGridH = rows * cellSize;

      const flankColW = Math.max(5, (printableWidth - totalGridW) / 2 - gapX);
      const hintsMetrics = calculateWordsearchHintsMetrics(
        placedWords,
        hintType,
        secFontSize,
        isA5,
        flankColW,
        totalGridH,
        doc,
        secFont,
        wordsearchCase
      );
      const hintsTotalH = hintsMetrics.hintsTotalH;

      const blockTotalH = Math.max(totalGridH, hintsTotalH);
      const sectionNeededH = blockTotalH + 6;

      // Check if page break is needed
      if (!isAtTopOfPage && currentY + sectionNeededH > maxContentY) {
        await addNewPage();
      }

      const isAnsMode = section.answerMode === 'answer';

      // Draw puzzle grid centered
      const gridStartX = margin + (printableWidth - totalGridW) / 2;
      const gridStartY = currentY + (blockTotalH - totalGridH) / 2;
      const hintsStartY = currentY + (blockTotalH - hintsTotalH) / 2;

      drawWordsearchGrid(doc, grid, gridStartX, gridStartY, cellSize, secFont, gridBorder, secFontSize, isAnsMode, placedWords);

      // Draw flanking hints
      await drawWordsearchHints(
        doc,
        placedWords,
        hintType,
        hintsStartY,
        printableWidth,
        margin,
        isA5,
        secFont,
        undefined,
        {
          gridStartX,
          totalGridW,
          totalGridH,
          fontSize: secFontSize,
          showImageBorder,
          gapX,
          wordsearchCase,
          imageSize: imgSize,
          isAnswerMode: isAnsMode
        }
      );

      currentY += blockTotalH + 2;
      isAtTopOfPage = false;
    } else if (section.type === 14) {
      // -------------------------------------------------------------
      // TYPE 14: Circle pictures with target letter in Composite Mode
      // Clean 4 columns layout
      // -------------------------------------------------------------
      const cols = 4;
      const colGap = isA5 ? 3.0 : 4.5;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;
      const secFontSize = section.fontSize || globalFontSize || 12;
      const secFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;
      const showLabels = section.showWordLabels !== false;
      const labelH = showLabels ? (secFontSize * 0.352778 + 3.5) : 0;
      const cardH = imgSize + labelH;
      const baseGap = (secSpacing === 0) ? 1.5 : (isA5 ? 4.0 : 5.0);
      const rowGap = baseGap + (secSpacing !== undefined ? secSpacing : 0) * 0.352778;
      const rowHeight = cardH + rowGap;

      const isAnsMode = section.answerMode === 'answer';
      const targetLetter = (section.targetLetter || 'a').toLowerCase();

      const totalRows = Math.ceil(secWords.length / cols);
      for (let r = 0; r < totalRows; r++) {
        if (!isAtTopOfPage && currentY + rowHeight > maxContentY) {
          await addNewPage();
        }

        const startIdx = r * cols;
        const endIdx = Math.min(startIdx + cols, secWords.length);

        for (let i = startIdx; i < endIdx; i++) {
          const col = i % cols;
          const cardX = margin + col * (cardWidth + colGap);
          const cardY = currentY;
          const word = secWords[i];
          const hasTargetLetter = word.term.toLowerCase().includes(targetLetter);

          const imgX = cardX + (cardWidth - imgSize) / 2;
          const imgY = cardY;

          const wordImg = word.imageUrl ? await fetchImageAsBase64(word.imageUrl) : null;
          if (wordImg) {
            try {
              doc.addImage(wordImg, 'JPEG', imgX, imgY, imgSize, imgSize);
            } catch {
              if (showImageBorder) doc.rect(imgX, imgY, imgSize, imgSize);
            }
          } else if (showImageBorder) {
            doc.rect(imgX, imgY, imgSize, imgSize);
          }

          if (isAnsMode && hasTargetLetter) {
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.85);
            setDocLineDash(doc, []);
            doc.circle(imgX + imgSize / 2, imgY + imgSize / 2, imgSize * 0.58, 'S');
          }

          if (showLabels) {
            if (isAnsMode && hasTargetLetter) {
              applyFont(doc, secFont, 'bold');
              doc.setFontSize(secFontSize);
              doc.setTextColor(220, 38, 38);
            } else {
              applyFont(doc, secFont, 'normal');
              doc.setFontSize(secFontSize);
              doc.setTextColor(30, 41, 59);
            }
            const textY = imgY + imgSize + (secFontSize * 0.352778 * 0.9) + 1.5;
            doc.text(word.term.trim().toLowerCase(), cardX + cardWidth / 2, textY, {
              align: 'center',
              maxWidth: cardWidth - 2
            });
            doc.setTextColor(0, 0, 0);
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 15) {
      // -------------------------------------------------------------
      // TYPE 15: Read and circle in Composite Mode
      // -------------------------------------------------------------
      const cols = 2;
      const colGap = isA5 ? 5.0 : 8.0;
      const cardWidth = (printableWidth - colGap) / 2;
      const subW = cardWidth / 2;

      const secFontSize = section.fontSize || globalFontSize || 12;
      const secFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;
      const numberStyle = section.type15NumberStyle || 'none';
      const borderStyle = section.type15Border || 'full';
      const choiceMode = section.type15ChoiceMode || 'ab';

      const secSentenceH = secFontSize * 0.352778 + (isA5 ? 4.5 : 5.5);
      const secImgBoxH = Math.max(imgSize + (isA5 ? 4.0 : 6.0), isA5 ? 18.0 : 22.0);
      const secBottomH = choiceMode === 'ab'
        ? Math.max(secFontSize * 0.352778 + 3.0, isA5 ? 6.5 : 8.0)
        : (choiceMode === 'checkbox' ? (isA5 ? 7.0 : 8.5) : 0);
      const secCardH = secImgBoxH + secBottomH;
      const itemTotalHeight = secSentenceH + secCardH;

      const baseGap = (secSpacing === 0) ? 1.5 : (isA5 ? 3.5 : 5.0);
      const rowGap = baseGap + (secSpacing !== undefined ? secSpacing : 0) * 0.352778 * 0.7;
      const rowHeight = itemTotalHeight + rowGap;

      const totalRows = Math.ceil(secWords.length / cols);
      const poolWithImages = masterWordPool.filter((w) => w.imageUrl && w.imageUrl.trim().length > 0);

      for (let r = 0; r < totalRows; r++) {
        if (!isAtTopOfPage && currentY + rowHeight > maxContentY) {
          await addNewPage();
        }

        const startIdx = r * cols;
        const endIdx = Math.min(startIdx + cols, secWords.length);

        for (let i = startIdx; i < endIdx; i++) {
          const col = i % cols;
          const cardX = margin + col * (cardWidth + colGap);
          const cardY = currentY;
          const currentWord = secWords[i];
          const sentence = getType15Sentence(currentWord);

          const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;

          const otherPool = poolWithImages.filter(
            (w) => w.term.trim().toLowerCase() !== currentWord.term.trim().toLowerCase()
          );
          let distractorImg: string | null = null;
          if (otherPool.length > 0) {
            const distractorIdx = (i * 7 + 3) % otherPool.length;
            distractorImg = await fetchImageAsBase64(otherPool[distractorIdx].imageUrl!);
          }

          const isTargetOnA = (i % 4 === 2 || i % 4 === 3);
          const leftImg = isTargetOnA ? targetImg : distractorImg;
          const rightImg = isTargetOnA ? distractorImg : targetImg;

          // 1. Draw Sentence line above card with red highlighted vocabulary
          const textY = cardY + secSentenceH / 2 + (isA5 ? 1.0 : 1.3);
          const spans = getType15SentenceSpans(currentWord);
          const numText = numberStyle === 'traditional' ? `${i + 1}. ` : null;
          drawType15SentenceLine(
            doc,
            spans,
            numText,
            cardX,
            textY,
            cardWidth,
            secFontSize,
            secFont
          );

          // 2. Draw Option Box (Card)
          const boxY = cardY + secSentenceH;
          const cornerR = 2.0;

          // Outer rounded border (nét đứt chấm nhỏ giống Loại 13)
          if (borderStyle === 'full' || borderStyle === 'outerOnly') {
            doc.setDrawColor(148, 163, 184); // slate-400
            doc.setLineWidth(0.4);
            setDocLineDash(doc, [0.4, 0.8]);
            doc.roundedRect(cardX, boxY, cardWidth, secCardH, cornerR, cornerR, 'S');
            setDocLineDash(doc, []); // reset
          }

          // Inner dividers (only for 'full' - nét đứt chấm nhỏ)
          if (borderStyle === 'full') {
            doc.setDrawColor(148, 163, 184); // slate-400
            doc.setLineWidth(0.28);
            setDocLineDash(doc, [0.3, 0.7]);
            doc.line(cardX + subW, boxY, cardX + subW, boxY + secCardH);

            if (choiceMode === 'ab' || choiceMode === 'checkbox') {
              const dividerY = boxY + secImgBoxH;
              doc.line(cardX, dividerY, cardX + cardWidth, dividerY);
            }
            setDocLineDash(doc, []); // reset
          }

          const isAnsMode = section.answerMode === 'answer';

          // Choice controls
          if (choiceMode === 'ab') {
            const letterBandY = boxY + secImgBoxH;
            const letterFontSize = Math.min(secFontSize * 1.1, isA5 ? 13 : 15);
            const letterTextY = letterBandY + secBottomH / 2 + (isA5 ? 1.1 : 1.4);

            if (isAnsMode) {
              const correctCenterX = isTargetOnA ? (cardX + subW / 2) : (cardX + subW + subW / 2);
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.65);
              setDocLineDash(doc, []);
              doc.circle(correctCenterX, letterTextY - (isA5 ? 1.1 : 1.3), letterFontSize * 0.45, 'S');

              applyFont(doc, secFont, isTargetOnA ? 'bold' : 'normal');
              doc.setFontSize(letterFontSize);
              doc.setTextColor(isTargetOnA ? 220 : 30, isTargetOnA ? 38 : 41, isTargetOnA ? 38 : 59);
              doc.text('a', cardX + subW / 2, letterTextY, { align: 'center' });

              applyFont(doc, secFont, !isTargetOnA ? 'bold' : 'normal');
              doc.setTextColor(!isTargetOnA ? 220 : 30, !isTargetOnA ? 38 : 41, !isTargetOnA ? 38 : 59);
              doc.text('b', cardX + subW + subW / 2, letterTextY, { align: 'center' });
              doc.setTextColor(0, 0, 0);
            } else {
              applyFont(doc, secFont, 'bold');
              doc.setFontSize(letterFontSize);
              doc.setTextColor(30, 41, 59);
              doc.text('a', cardX + subW / 2, letterTextY, { align: 'center' });
              doc.text('b', cardX + subW + subW / 2, letterTextY, { align: 'center' });
              doc.setTextColor(0, 0, 0);
            }
          } else if (choiceMode === 'checkbox') {
            const checkBandY = boxY + secImgBoxH;
            const boxDim = isA5 ? 4.5 : 5.2;
            const cBoxY = checkBandY + (secBottomH - boxDim) / 2;
            const leftBoxX = cardX + (subW - boxDim) / 2;
            const rightBoxX = cardX + subW + (subW - boxDim) / 2;
            doc.setDrawColor(148, 163, 184); // slate-400
            doc.setLineWidth(0.35);
            doc.roundedRect(leftBoxX, cBoxY, boxDim, boxDim, 0.8, 0.8, 'S');
            doc.roundedRect(rightBoxX, cBoxY, boxDim, boxDim, 0.8, 0.8, 'S');

            if (isAnsMode) {
              const chkX = isTargetOnA ? leftBoxX : rightBoxX;
              doc.setDrawColor(220, 38, 38);
              doc.setLineWidth(0.65);
              setDocLineDash(doc, []);
              doc.line(chkX + boxDim * 0.2, cBoxY + boxDim * 0.5, chkX + boxDim * 0.42, cBoxY + boxDim * 0.78);
              doc.line(chkX + boxDim * 0.42, cBoxY + boxDim * 0.78, chkX + boxDim * 0.82, cBoxY + boxDim * 0.22);
            }
          }

          // 3. Draw Images
          const maxImgDim = Math.min(imgSize, subW - 4, secImgBoxH - 3);

          const lx = cardX + (subW - maxImgDim) / 2;
          const ly = boxY + (secImgBoxH - maxImgDim) / 2;
          if (leftImg) {
            try {
              doc.addImage(leftImg, 'JPEG', lx, ly, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(lx, ly, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(lx, ly, maxImgDim, maxImgDim);
          }

          const rx = cardX + subW + (subW - maxImgDim) / 2;
          const ry = boxY + (secImgBoxH - maxImgDim) / 2;
          if (rightImg) {
            try {
              doc.addImage(rightImg, 'JPEG', rx, ry, maxImgDim, maxImgDim);
            } catch {
              if (showImageBorder) doc.rect(rx, ry, maxImgDim, maxImgDim);
            }
          } else if (showImageBorder) {
            doc.rect(rx, ry, maxImgDim, maxImgDim);
          }

          if (choiceMode === 'none' && isAnsMode) {
            const picCenterX = isTargetOnA ? (cardX + subW / 2) : (cardX + subW + subW / 2);
            const picCenterY = boxY + secImgBoxH / 2;
            doc.setDrawColor(220, 38, 38);
            doc.setLineWidth(0.85);
            setDocLineDash(doc, []);
            doc.circle(picCenterX, picCenterY, maxImgDim * 0.58, 'S');
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 16) {
      // -------------------------------------------------------------
      // TYPE 16: Look and circle sound in Composite Mode
      // -------------------------------------------------------------
      const cols = 3;
      const colGap = isA5 ? 4.0 : 6.0;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 13 : 15);
      const secSpacing = section.spacing !== undefined ? section.spacing : (globalSpacing !== undefined ? globalSpacing : 0);
      const secFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;
      const soundMode = section.type16SoundMode || 'beginning';
      const choiceCount = section.type16ChoiceCount || 3;
      const layout = section.type16Layout || 'lettersLeft';
      const letterCase = section.type16LetterCase || 'lower';
      const borderStyle = section.type16Border || 'none';

      const isAnsMode = section.answerMode === 'answer';
      const effectiveImgSize = imgSize || (isA5 ? 12.5 : 14.0);
      const metrics = calculateType16Metrics(
        secFontSize,
        secSpacing,
        choiceCount,
        layout,
        borderStyle,
        effectiveImgSize,
        isA5,
        secFont
      );

      const { fontHeightMm, optPitch, choicesBlockH, contentHeight, cardHeight, rowHeight } = metrics;
      const padY = (borderStyle !== 'none') ? 2.5 : 0;

      const totalRows = Math.ceil(secWords.length / cols);

      for (let r = 0; r < totalRows; r++) {
        if (!isAtTopOfPage && currentY + rowHeight > maxContentY) {
          await addNewPage();
        }

        const startIdx = r * cols;
        const endIdx = Math.min(startIdx + cols, secWords.length);

        for (let i = startIdx; i < endIdx; i++) {
          const col = i % cols;
          const cardX = margin + col * (cardWidth + colGap);
          const cardY = currentY;

          const currentWord = secWords[i];
          const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;

          const { choices, targetIndex } = generateType16Choices(
            currentWord.term,
            soundMode,
            choiceCount,
            letterCase,
            masterWordPool
          );

          // 1. Draw Card Border if requested
          const cornerR = 2.0;
          if (borderStyle === 'full' || borderStyle === 'outerOnly') {
            doc.setDrawColor(148, 163, 184); // slate-400
            doc.setLineWidth(0.4);
            setDocLineDash(doc, [0.4, 0.8]);
            doc.roundedRect(cardX, cardY, cardWidth, cardHeight, cornerR, cornerR, 'S');
            setDocLineDash(doc, []);
          }

          // 2. Layout variants
          if (layout === 'lettersBottom') {
            // Horizontal choices below image
            const imgX = cardX + (cardWidth - effectiveImgSize) / 2;
            const imgY = cardY + padY + 1.0;

            if (targetImg) {
              try {
                doc.addImage(targetImg, 'JPEG', imgX, imgY, effectiveImgSize, effectiveImgSize);
              } catch {
                if (showImageBorder) doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
              }
            } else if (showImageBorder) {
              doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
            }

            const gapImgToChoices = (secSpacing === 0 ? 1.5 : 2.5) + (secSpacing * 0.352778 * 0.2);

            if (borderStyle === 'full') {
              const divY = imgY + effectiveImgSize + gapImgToChoices / 2;
              doc.setDrawColor(148, 163, 184);
              doc.setLineWidth(0.28);
              setDocLineDash(doc, [0.3, 0.7]);
              doc.line(cardX, divY, cardX + cardWidth, divY);
              setDocLineDash(doc, []);
            }

            const choiceY = imgY + effectiveImgSize + gapImgToChoices + fontHeightMm * 0.75;
            const choicesRowWidth = Math.min(cardWidth - 4, Math.max(effectiveImgSize + 4, choiceCount * (fontHeightMm * 1.5 + 4)));
            const choiceStep = choicesRowWidth / (choiceCount + 1);
            const startChoiceX = cardX + (cardWidth - choicesRowWidth) / 2;

            for (let j = 0; j < choiceCount; j++) {
              const choiceX = startChoiceX + (j + 1) * choiceStep;
              if (isAnsMode && j === targetIndex) {
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.65);
                setDocLineDash(doc, []);
                doc.circle(choiceX, choiceY - fontHeightMm * 0.28, Math.max(fontHeightMm * 0.65, 3.2), 'S');

                applyFont(doc, secFont, 'bold');
                doc.setFontSize(secFontSize);
                doc.setTextColor(220, 38, 38);
                doc.text(choices[j], choiceX, choiceY, { align: 'center' });
              } else {
                applyFont(doc, secFont, 'normal');
                doc.setFontSize(secFontSize);
                doc.setTextColor(30, 41, 59);
                doc.text(choices[j], choiceX, choiceY, { align: 'center' });
              }
            }
            doc.setTextColor(0, 0, 0);

          } else {
            // Vertical layout: 'lettersLeft' or 'lettersRight'
            let choicesCenterX: number;
            let imgX: number;
            let divX: number;

            if (borderStyle === 'none') {
              // No border: pair letters + image together with clean gap, centered as a cohesive unit
              const colChoicesW = Math.max(10, letterCase === 'both' ? fontHeightMm * 2.2 : fontHeightMm * 1.5);
              const pairGap = isA5 ? 4.5 : 6.0;
              const totalPairW = colChoicesW + pairGap + effectiveImgSize;
              const pairStartX = cardX + (cardWidth - totalPairW) / 2;

              if (layout === 'lettersLeft') {
                choicesCenterX = pairStartX + colChoicesW / 2;
                imgX = pairStartX + colChoicesW + pairGap;
                divX = pairStartX + colChoicesW + pairGap / 2;
              } else {
                // 'lettersRight'
                imgX = pairStartX;
                choicesCenterX = pairStartX + effectiveImgSize + pairGap + colChoicesW / 2;
                divX = pairStartX + effectiveImgSize + pairGap / 2;
              }
            } else {
              // Card outline: partition cardWidth into left and right zones
              const colChoicesW = Math.max(14, cardWidth * 0.36);
              const colImgW = cardWidth - colChoicesW;

              if (layout === 'lettersLeft') {
                choicesCenterX = cardX + colChoicesW / 2;
                imgX = cardX + colChoicesW + (colImgW - effectiveImgSize) / 2;
                divX = cardX + colChoicesW;
              } else {
                // 'lettersRight'
                imgX = cardX + (colImgW - effectiveImgSize) / 2;
                choicesCenterX = cardX + colImgW + colChoicesW / 2;
                divX = cardX + colImgW;
              }
            }

            const imgY = cardY + padY + (contentHeight - effectiveImgSize) / 2;

            if (borderStyle === 'full') {
              doc.setDrawColor(148, 163, 184);
              doc.setLineWidth(0.28);
              setDocLineDash(doc, [0.3, 0.7]);
              doc.line(divX, cardY, divX, cardY + cardHeight);
              setDocLineDash(doc, []);
            }

            if (targetImg) {
              try {
                doc.addImage(targetImg, 'JPEG', imgX, imgY, effectiveImgSize, effectiveImgSize);
              } catch {
                if (showImageBorder) doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
              }
            } else if (showImageBorder) {
              doc.rect(imgX, imgY, effectiveImgSize, effectiveImgSize);
            }

            const choicesStartY = cardY + padY + (contentHeight - choicesBlockH) / 2 + fontHeightMm * 0.75;
            for (let j = 0; j < choiceCount; j++) {
              const choiceY = choicesStartY + j * optPitch;
              if (isAnsMode && j === targetIndex) {
                doc.setDrawColor(220, 38, 38);
                doc.setLineWidth(0.65);
                setDocLineDash(doc, []);
                doc.circle(choicesCenterX, choiceY - fontHeightMm * 0.28, Math.max(fontHeightMm * 0.65, 3.2), 'S');

                applyFont(doc, secFont, 'bold');
                doc.setFontSize(secFontSize);
                doc.setTextColor(220, 38, 38);
                doc.text(choices[j], choicesCenterX, choiceY, { align: 'center' });
              } else {
                applyFont(doc, secFont, 'normal');
                doc.setFontSize(secFontSize);
                doc.setTextColor(30, 41, 59);
                doc.text(choices[j], choicesCenterX, choiceY, { align: 'center' });
              }
            }
            doc.setTextColor(0, 0, 0);
          }
        }

        currentY += rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 17) {
      // -------------------------------------------------------------
      // TYPE 17: Look and color the words / Cross out in Composite Mode
      // -------------------------------------------------------------
      const cols = isA5 ? 2 : 3;
      const colGap = isA5 ? 5.0 : 6.0;
      const cardWidth = (printableWidth - (cols - 1) * colGap) / cols;

      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 13 : 15);
      const secSpacing = section.spacing !== undefined ? section.spacing : (globalSpacing !== undefined ? globalSpacing : 0);
      const secFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;

      const taskMode: Type17TaskMode = section.type17TaskMode || 'color';
      const borderStyle: Type17Border = section.type17Border || 'full';
      const cardBorderStyle: Type17CardBorder = section.type17CardBorder || 'none';
      const letterCase: Type17LetterCase = section.type17LetterCase || 'lower';
      const stripLengthOpt: Type17StripLength = section.type17StripLength || 'auto';
      const isAnsMode = section.answerMode === 'answer' || section.type17HighlightTarget === 'red';
      const highlightTarget: Type17HighlightTarget = isAnsMode ? 'red' : (section.type17HighlightTarget || 'none');
      const showExample = section.type17ShowExample !== false;

      const totalRows = Math.ceil(secWords.length / cols);
      for (let r = 0; r < totalRows; r++) {
        const rowWordIndices: number[] = [];
        for (let c = 0; c < cols; c++) {
          const idx = r * cols + c;
          if (idx < secWords.length) rowWordIndices.push(idx);
        }

        const rowGens = rowWordIndices.map((idx) =>
          generateType17Letters(secWords[idx].term, stripLengthOpt, taskMode, letterCase, idx)
        );
        const rowMaxStripLen = Math.max(...rowGens.map((g) => g.stripLength), taskMode === 'cross' ? 6 : 8);

        const rowMetrics = calculateType17Metrics(
          secFontSize,
          secSpacing,
          rowMaxStripLen,
          cardBorderStyle,
          imgSize,
          isA5,
          secFont
        );

        if (!isAtTopOfPage && currentY + rowMetrics.rowHeight > maxContentY) {
          await addNewPage();
        }

        for (let c = 0; c < rowWordIndices.length; c++) {
          const wordIdx = rowWordIndices[c];
          const currentWord = secWords[wordIdx];
          const cardX = margin + c * (cardWidth + colGap);
          const cardY = currentY;

          const targetImg = currentWord.imageUrl ? await fetchImageAsBase64(currentWord.imageUrl) : null;
          const itemGen = rowGens[c];

          const itemMetrics = calculateType17Metrics(
            secFontSize,
            secSpacing,
            itemGen.stripLength,
            cardBorderStyle,
            imgSize,
            isA5,
            secFont
          );

          drawType17Item(
            doc,
            cardX,
            cardY,
            cardWidth,
            targetImg,
            itemGen.cells,
            taskMode,
            borderStyle,
            cardBorderStyle,
            highlightTarget,
            showExample,
            wordIdx === 0,
            itemMetrics,
            secFont,
            showImageBorder
          );
        }

        currentY += rowMetrics.rowHeight;
        isAtTopOfPage = false;
      }
    } else if (section.type === 18) {
      // -------------------------------------------------------------
      // TYPE 18: Color the letters in Composite Mode
      // -------------------------------------------------------------
      const secFontSize = section.fontSize || globalFontSize || (isA5 ? 16 : 20);
      const secSpacing = section.spacing !== undefined ? section.spacing : (globalSpacing !== undefined ? globalSpacing : 0);
      const secFont = (section.fontFamily || fontFamily || 'r0c0i Linotte') as string;

      const targetLetter = section.type18TargetLetter || (secWords.length > 0 ? secWords[0].term.charAt(0) : 'E') || 'E';
      const taskMode: Type18Mode = section.type18Mode || 'both';
      const colorUpper = section.type18ColorUpper || 'green';
      const colorLower = section.type18ColorLower || 'red';
      const rows = section.type18GridRows || 4;
      const cols = section.type18GridCols || 7;
      const outerBorder: Type18Border = section.type18Border || 'rounded';
      const circleStyle: Type18CircleStyle = section.type18CircleStyle || 'solid';
      const distractorCasing: Type18DistractorCasing = section.type18DistractorCasing || 'upper';
      const highlightTarget: Type18HighlightTarget = section.type18HighlightTarget || 'none';

      const metrics = calculateType18Metrics(
        secFontSize,
        secSpacing,
        rows,
        cols,
        outerBorder,
        isA5,
        printableWidth
      );

      if (!isAtTopOfPage && currentY + metrics.cardHeight > maxContentY) {
        await addNewPage();
      }

      const gridData = generateType18Grid(
        targetLetter,
        taskMode,
        rows,
        cols,
        distractorCasing,
        secIdx
      );

      const startX = margin + (printableWidth - metrics.cardWidth) / 2;
      drawType18ContainerAndGrid(
        doc,
        startX,
        currentY,
        gridData.cells,
        metrics,
        {
          outerBorder,
          circleStyle,
          highlightTarget,
          colorUpper,
          colorLower,
          fontFamily: secFont
        },
        isA5
      );

      currentY += metrics.cardHeight;
      isAtTopOfPage = false;
    }

    // Inter-section vertical separation (Word standard pt converted to mm)
    const interSectionGap = ((secSpacing ?? globalSpacing ?? 0) * 0.352778) + 3;
    currentY += interSectionGap;
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

