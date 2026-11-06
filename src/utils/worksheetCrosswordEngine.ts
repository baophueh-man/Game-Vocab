/**
 * worksheetCrosswordEngine.ts
 * Engine sinh lưới ô chữ liên hoàn (Connected Crossword Grid) đa từ
 * Tham khảo giải thuật của yourhomework.net/tools/crossword
 * Hỗ trợ:
 * - Ghép nhiều từ (4 - 20 từ) trong 1 lưới ô chữ chung
 * - Kiểm tra va chạm nghiêm ngặt (Parallel & Perpendicular Non-interference)
 * - Tùy chọn cờ hiệu / mũi tên nét rỗng (Hollow Arrows) tiết kiệm mực in
 * - Tùy chọn Bỏ đánh số (Hide Clue Numbers) hoặc Có đánh số (Numbered)
 */

import { jsPDF } from 'jspdf';
import {
  WorksheetWord,
  Type20GridBorder,
  Type20LineStyle,
  Type20BorderColor,
  Type20Casing,
  Type20HintMode,
  applyFont
} from './worksheetGenerator';

export type CrosswordOrientation = 'horizontal' | 'vertical' | 'none';

export interface CrosswordPlacedWord {
  id: number;
  word: WorksheetWord;
  clean: string;
  length: number;
  x: number;
  y: number;
  orientation: 'horizontal' | 'vertical';
  clueNumber: number;
}

export interface CrosswordGridCell {
  x: number;
  y: number;
  char?: string;
  isLetter: boolean;
  isClueMarker?: boolean;
  clueNumber?: number;
  clueDirection?: 'horizontal' | 'vertical';
  wordIds: number[];
}

export interface CrosswordLayoutResult {
  placedWords: CrosswordPlacedWord[];
  unplacedWords: WorksheetWord[];
  grid: Map<string, CrosswordGridCell>;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  cols: number;
  rows: number;
}

function hashStringToSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createMulberry32(seedVal: number): () => number {
  let s = seedVal >>> 0;
  return function nextRandom(): number {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface MatchPair {
  idx1: number;
  idx2: number;
}

interface InternalWord {
  id: number;
  word: WorksheetWord;
  clean: string;
  length: number;
  x: number;
  y: number;
  orientation: CrosswordOrientation;
  clueNumber: number;
}

function findMatches(w1: InternalWord, w2: InternalWord): MatchPair[] {
  const matches: MatchPair[] = [];
  for (let i = 0; i < w1.length; i++) {
    const c1 = w1.clean[i];
    for (let j = 0; j < w2.length; j++) {
      if (c1 === w2.clean[j]) {
        matches.push({ idx1: i, idx2: j });
      }
    }
  }
  return matches;
}

function wordsInterfere(w1: InternalWord, w2: InternalWord): boolean {
  if (w1.orientation === w2.orientation) {
    // Parallel words
    let diff: number;
    let start1: number, start2: number, end1: number, end2: number;

    if (w1.orientation === 'horizontal') {
      diff = Math.abs(w1.y - w2.y);
      // Tính cả vùng an toàn trước từ cho Mũi tên (x-1) và Khung tranh (x-2, x-3)
      start1 = w1.x - 3;
      start2 = w2.x - 3;
      end1 = w1.x + w1.length - 1;
      end2 = w2.x + w2.length - 1;
    } else {
      diff = Math.abs(w1.x - w2.x);
      // Tính cả vùng an toàn trước từ cho Mũi tên (y-1) và Khung tranh (y-2, y-3)
      start1 = w1.y - 3;
      start2 = w2.y - 3;
      end1 = w1.y + w1.length - 1;
      end2 = w2.y + w2.length - 1;
    }

    if (diff === 0) {
      // Cùng 1 hàng/cột: Không được đè hoặc liền sát không có khoảng trống
      if (start1 >= start2 - 1 && start1 <= end2 + 1) return true;
      if (end1 >= start2 - 1 && end1 <= end2 + 1) return true;
      if (start1 <= start2 && end1 >= end2) return true;
    } else if (diff === 1) {
      // Hai hàng/cột kề nhau: Không được dính sườn song song
      if (start1 >= start2 && start1 <= end2 - 1) return true;
      if (end1 >= start2 + 1 && end1 <= end2) return true;
      if (start1 <= start2 && end1 >= end2) return true;
    } else if (diff <= 2) {
      // Hai hàng/cột cách nhau 2 ô: kiểm tra va chạm giữa 2 khung tranh gợi ý
      const w1ClueStart = w1.orientation === 'horizontal' ? w1.x - 3 : w1.y - 3;
      const w2ClueStart = w2.orientation === 'horizontal' ? w2.x - 3 : w2.y - 3;
      if (Math.abs(w1ClueStart - w2ClueStart) <= 2) {
        return true; // Khung tranh gợi ý của 2 từ song song quá gần nhau sẽ đè lề
      }
    }
    return false;
  } else {
    // Perpendicular words (1 ngang, 1 dọc)
    const horiz = w1.orientation === 'horizontal' ? w1 : w2;
    const vert = w1.orientation === 'vertical' ? w1 : w2;

    const hStart = horiz.x;
    const hEnd = horiz.x + horiz.length - 1;
    const vStart = vert.y;
    const vEnd = vert.y + vert.length - 1;

    // 1. Kiểm tra chạm đầu/đuôi (adjacent ends)
    if (horiz.y === vStart - 1 || horiz.y === vEnd + 1) {
      if (vert.x >= hStart - 1 && vert.x <= hEnd + 1) {
        return true;
      }
    }
    if (vert.x === hStart - 1 || vert.x === hEnd + 1) {
      if (horiz.y >= vStart - 1 && horiz.y <= vEnd + 1) {
        return true;
      }
    }

    // 2. Kiểm tra ô giao nhau
    if (horiz.y >= vStart && horiz.y <= vEnd && vert.x >= hStart && vert.x <= hEnd) {
      const charHoriz = horiz.clean[vert.x - hStart];
      const charVert = vert.clean[horiz.y - vStart];
      if (charHoriz !== charVert) {
        return true; // Ký tự lệch nhau -> Va chạm
      }
    }

    // 3. Vùng an toàn của Clue Horiz (Mũi tên & Khung tranh tại hStart-1, hStart-2, hStart-3)
    // Không được trùng hoặc quá sát ô ký tự của vert
    if (vert.x >= hStart - 3 && vert.x <= hStart - 1 && horiz.y >= vStart - 1 && horiz.y <= vEnd + 1) {
      return true;
    }

    // 4. Vùng an toàn của Clue Vert (Mũi tên & Khung tranh tại vStart-1, vStart-2, vStart-3)
    // Không được trùng hoặc quá sát ô ký tự của horiz
    if (horiz.y >= vStart - 3 && horiz.y <= vStart - 1 && vert.x >= hStart - 1 && vert.x <= hEnd + 1) {
      return true;
    }

    // 5. Kiểm tra va chạm CHÉO giữa 2 Hộp Clue (Clue Horiz vs Clue Vert)
    // Horiz Clue chiếm [hStart-3 .. hStart-1] theo trục X và [horiz.y-1 .. horiz.y+1] theo trục Y
    // Vert Clue chiếm [vert.x-1 .. vert.x+1] theo trục X và [vStart-3 .. vStart-1] theo trục Y
    const horizClueXMin = hStart - 3;
    const horizClueXMax = hStart;
    const horizClueYMin = horiz.y - 1;
    const horizClueYMax = horiz.y + 1;

    const vertClueXMin = vert.x - 1;
    const vertClueXMax = vert.x + 1;
    const vertClueYMin = vStart - 3;
    const vertClueYMax = vStart;

    const xOverlap = Math.max(0, Math.min(horizClueXMax, vertClueXMax) - Math.max(horizClueXMin, vertClueXMin));
    const yOverlap = Math.max(0, Math.min(horizClueYMax, vertClueYMax) - Math.max(horizClueYMin, vertClueYMin));

    if (xOverlap > 0 && yOverlap > 0) {
      return true; // Hai hộp tranh gợi ý và mũi tên sẽ đè chồng lên nhau
    }

    return false;
  }
}

/**
 * Thử tạo layout ô chữ liên hoàn từ danh sách từ vựng
 */
export function generateConnectedCrossword(
  rawWords: WorksheetWord[],
  options: {
    maxAttempts?: number;
    showClueNumber?: boolean;
    seed?: number | string;
  } = {}
): CrosswordLayoutResult | null {
  const valid = (rawWords || [])
    .filter((w) => w && w.term && w.term.trim().length > 1)
    .map((w, idx) => ({
      id: idx + 1,
      word: w,
      clean: w.term.trim().toUpperCase().replace(/[^A-Z]/g, ''),
      length: w.term.trim().toUpperCase().replace(/[^A-Z]/g, '').length,
      x: 0,
      y: 0,
      orientation: 'none' as CrosswordOrientation,
      clueNumber: idx + 1
    }))
    .filter((w) => w.length >= 2);

  if (valid.length === 0) return null;

  // Tính số lượng matches giữa các từ
  const matchMatrix: Map<number, Map<number, MatchPair[]>> = new Map();
  const matchCounts: Map<number, number> = new Map();

  for (let i = 0; i < valid.length; i++) {
    matchMatrix.set(valid[i].id, new Map());
    matchCounts.set(valid[i].id, 0);
  }

  for (let i = 0; i < valid.length; i++) {
    for (let j = i + 1; j < valid.length; j++) {
      const matches = findMatches(valid[i], valid[j]);
      matchMatrix.get(valid[i].id)!.set(valid[j].id, matches);
      // Đảo ngược match cho j -> i
      const inverted = matches.map((m) => ({ idx1: m.idx2, idx2: m.idx1 }));
      matchMatrix.get(valid[j].id)!.set(valid[i].id, inverted);

      matchCounts.set(valid[i].id, matchCounts.get(valid[i].id)! + matches.length);
      matchCounts.set(valid[j].id, matchCounts.get(valid[j].id)! + matches.length);
    }
  }

  const maxAttempts = options.maxAttempts || 80;
  let bestResult: {
    placed: InternalWord[];
    unplaced: InternalWord[];
    aspectScore: number;
  } | null = null;

  const seedNum = options.seed !== undefined
    ? (typeof options.seed === 'number' ? options.seed : hashStringToSeed(String(options.seed)))
    : hashStringToSeed(valid.map(w => w.clean).join('_'));
  const prng = createMulberry32(seedNum);

  // Thử nhiều lượt với các từ khởi đầu (seeds) khác nhau
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    // Xáo trộn nhẹ thứ tự hoặc chọn seed
    const wordsPool = valid.map((w) => ({ ...w, x: 0, y: 0, orientation: 'none' as CrosswordOrientation }));

    // Ưu tiên từ có độ dài tốt hoặc nhiều match làm hạt giống
    const seedIndex = attempt % wordsPool.length;
    const firstWord = wordsPool.splice(seedIndex, 1)[0];
    firstWord.x = 0;
    firstWord.y = 0;
    firstWord.orientation = attempt % 2 === 0 ? 'horizontal' : 'vertical';

    const placed: InternalWord[] = [firstWord];
    // Fisher-Yates shuffle remaining candidates based on deterministic PRNG
    const remaining = [...wordsPool];
    for (let s = remaining.length - 1; s > 0; s--) {
      const r = Math.floor(prng() * (s + 1));
      [remaining[s], remaining[r]] = [remaining[r], remaining[s]];
    }

    let progress = true;
    while (progress && remaining.length > 0) {
      progress = false;

      // ponytail: greedy overlap-first sort. Upgrade to exact branch-and-bound if vocabulary sets exceed 30 words.
      remaining.sort((a, b) => {
        let mA = 0;
        let mB = 0;
        for (let p = 0; p < placed.length; p++) {
          mA += (matchMatrix.get(a.id)?.get(placed[p].id) || []).length;
          mB += (matchMatrix.get(b.id)?.get(placed[p].id) || []).length;
        }
        return mB - mA || b.length - a.length;
      });

      for (let rIdx = 0; rIdx < remaining.length; rIdx++) {
        const candidate = remaining[rIdx];
        let foundSpot = false;

        // Thử match với các từ đã đặt
        for (let pIdx = 0; pIdx < placed.length; pIdx++) {
          const placedWord = placed[pIdx];
          const matches = matchMatrix.get(candidate.id)?.get(placedWord.id) || [];

          for (const m of matches) {
            // Xác định hướng và tọa độ
            if (placedWord.orientation === 'horizontal') {
              candidate.orientation = 'vertical';
              candidate.x = placedWord.x + m.idx2;
              candidate.y = placedWord.y - m.idx1;
            } else {
              candidate.orientation = 'horizontal';
              candidate.x = placedWord.x - m.idx1;
              candidate.y = placedWord.y + m.idx2;
            }

            // Kiểm tra va chạm với TẤT CẢ các từ đã đặt
            let collision = false;
            for (const pw of placed) {
              if (wordsInterfere(candidate, pw)) {
                collision = true;
                break;
              }
            }

            if (!collision) {
              placed.push({ ...candidate });
              remaining.splice(rIdx, 1);
              foundSpot = true;
              progress = true;
              break;
            }
          }

          if (foundSpot) break;
        }

        if (foundSpot) break;
      }
    }

    // Đánh giá kết quả layout
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    placed.forEach((w) => {
      const x1 = w.x - 1; // marker
      const x2 = w.orientation === 'horizontal' ? w.x + w.length - 1 : w.x;
      const y1 = w.y - 1; // marker
      const y2 = w.orientation === 'vertical' ? w.y + w.length - 1 : w.y;
      if (x1 < minX) minX = x1;
      if (x2 > maxX) maxX = x2;
      if (y1 < minY) minY = y1;
      if (y2 > maxY) maxY = y2;
    });

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;
    // Tỉ lệ vàng gần vuông (1.0 đến 1.4) là lý tưởng
    const ratio = Math.max(w / Math.max(1, h), h / Math.max(1, w));
    const aspectScore = placed.length * 100 - ratio * 10;

    if (!bestResult || placed.length > bestResult.placed.length || (placed.length === bestResult.placed.length && aspectScore > bestResult.aspectScore)) {
      bestResult = {
        placed,
        unplaced: remaining,
        aspectScore
      };

      if (placed.length === valid.length && ratio < 1.6) {
        // Đã đặt được 100% từ và tỉ lệ khung hình rất đẹp -> chốt sớm
        break;
      }
    }
  }

  if (!bestResult || bestResult.placed.length === 0) return null;

  // Bounding box chuẩn hóa
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  bestResult.placed.forEach((w) => {
    const x1 = w.x;
    const x2 = w.orientation === 'horizontal' ? w.x + w.length - 1 : w.x;
    const y1 = w.y;
    const y2 = w.orientation === 'vertical' ? w.y + w.length - 1 : w.y;
    if (x1 < minX) minX = x1;
    if (x2 > maxX) maxX = x2;
    if (y1 < minY) minY = y1;
    if (y2 > maxY) maxY = y2;
  });

  // Đánh số thứ tự từ 1..N theo quy tắc crossword truyền thống (top to bottom, left to right)
  const sortedForNumbering = [...bestResult.placed].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  // Gán số thứ tự clueNumber
  sortedForNumbering.forEach((w, idx) => {
    w.clueNumber = idx + 1;
  });

  // Xây dựng ma trận grid map
  const grid = new Map<string, CrosswordGridCell>();

  bestResult.placed.forEach((w) => {
    // 1. Ô Clue Marker (mũi tên rỗng)
    const markerX = w.orientation === 'horizontal' ? w.x - 1 : w.x;
    const markerY = w.orientation === 'vertical' ? w.y - 1 : w.y;
    const markerKey = `${markerX},${markerY}`;

    if (!grid.has(markerKey)) {
      grid.set(markerKey, {
        x: markerX,
        y: markerY,
        isLetter: false,
        isClueMarker: true,
        clueNumber: w.clueNumber,
        clueDirection: w.orientation === 'vertical' ? 'vertical' : 'horizontal',
        wordIds: [w.id]
      });
    } else {
      const cell = grid.get(markerKey)!;
      cell.wordIds.push(w.id);
    }

    // Cập nhật minX/minY nếu marker vượt ra ngoài
    if (markerX < minX) minX = markerX;
    if (markerY < minY) minY = markerY;

    // 2. Các ô chữ cái
    for (let i = 0; i < w.length; i++) {
      const cx = w.orientation === 'horizontal' ? w.x + i : w.x;
      const cy = w.orientation === 'vertical' ? w.y + i : w.y;
      const cellKey = `${cx},${cy}`;

      if (!grid.has(cellKey)) {
        grid.set(cellKey, {
          x: cx,
          y: cy,
          char: w.clean[i],
          isLetter: true,
          wordIds: [w.id]
        });
      } else {
        const cell = grid.get(cellKey)!;
        cell.wordIds.push(w.id);
      }
    }
  });

  return {
    placedWords: bestResult.placed.map((w) => ({
      id: w.id,
      word: w.word,
      clean: w.clean,
      length: w.length,
      x: w.x,
      y: w.y,
      orientation: w.orientation as 'horizontal' | 'vertical',
      clueNumber: w.clueNumber
    })),
    unplacedWords: bestResult.unplaced.map((w) => w.word),
    grid,
    minX,
    maxX,
    minY,
    maxY,
    cols: maxX - minX + 1,
    rows: maxY - minY + 1
  };
}

function setDocLineDash(doc: jsPDF, dashArray: number[]) {
  if (typeof (doc as any).setLineDashPattern === 'function') {
    (doc as any).setLineDashPattern(dashArray, 0);
  } else if (typeof (doc as any).setLineDash === 'function') {
    (doc as any).setLineDash(dashArray);
  }
}

export function drawConnectedCrosswordGrid(
  doc: jsPDF,
  layout: CrosswordLayoutResult,
  areaX: number,
  areaY: number,
  areaWidth: number,
  areaHeight: number,
  options: {
    gridBorder?: Type20GridBorder;
    lineStyle?: Type20LineStyle;
    borderColor?: Type20BorderColor;
    casing?: Type20Casing;
    showClueNumber?: boolean;
    showClueImage?: boolean;
    showClueText?: boolean;
    showTrace?: boolean;
    hollowArrows?: boolean;
    hintMode?: Type20HintMode;
    isAnswerMode?: boolean;
    activeFont?: string;
    fontSize?: number;
    isA5?: boolean;
    wordImagesMap?: Map<string, string | null>;
    clueColumns?: number;
  }
) {
  const {
    gridBorder = 'full',
    lineStyle = 'solid',
    borderColor = 'orange',
    casing = 'upper',
    showClueNumber = true,
    showClueImage = true,
    showClueText = true,
    showTrace = false,
    hollowArrows = true,
    hintMode = 'all_blank',
    isAnswerMode = false,
    activeFont = 'r0c0i Linotte',
    fontSize = 14,
    isA5 = false,
    wordImagesMap,
    clueColumns
  } = options;

  const trMap: Record<string, [number, number, number]> = {
    orange: [249, 115, 22],
    amber: [245, 158, 11],
    slate: [100, 116, 139],
    blue: [37, 99, 235],
    indigo: [79, 70, 229],
    green: [22, 163, 74],
    emerald: [16, 185, 129],
    purple: [124, 58, 237],
    red: [220, 38, 38]
  };
  const [tr, tg, tb] = trMap[borderColor] || [249, 115, 22];

  const placedWords = layout.placedWords;

  // 1. Tính toán kích thước & căn chỉnh không gian
  // Nếu có ảnh trực tiếp (inline images), chừa lề cho ảnh + mũi tên
  let arrowW = isA5 ? 4.8 : 5.8;
  let arrowH = arrowW;
  let imgSize = showClueImage ? (isA5 ? 10.5 : 13.5) : 0;

  // Footer clue list chỉ hiển thị khi người dùng tắt ảnh inline (!showClueImage) và bật hiện text (showClueText)
  const showFooterClues = !showClueImage && showClueText;
  const numClues = placedWords.length;
  const colsClues = clueColumns || (isA5 ? 2 : (numClues > 6 ? 3 : 2));
  const numClueRows = Math.ceil(numClues / colsClues);
  const clueRowH = isA5 ? 6 : 7.5;
  const clueSectionH = showFooterClues ? Math.min(areaHeight * 0.4, numClueRows * clueRowH + 6) : 0;

  const leftPad = showClueImage ? (imgSize + arrowW + 3) : (arrowW + 2);
  const topPad = showClueImage ? (imgSize + arrowH + 3) : (arrowH + 2);
  const rightPad = 3;
  const bottomPad = showFooterClues ? (clueSectionH + 4) : 3;

  const availableW = areaWidth - leftPad - rightPad;
  const availableH = areaHeight - topPad - bottomPad;

  // Tính cellSize tối ưu
  const dynamicCell = Math.min(
    isA5 ? 11 : 13.5,
    Math.min(availableW / Math.max(1, layout.cols), availableH / Math.max(1, layout.rows))
  );
  const cellSize = Math.max(isA5 ? 6.2 : 7.2, dynamicCell);
  const cellFontSize = Math.min(fontSize, Math.max(7.5, cellSize * 1.3));

  // Tinh chỉnh kích thước mũi tên và tranh theo cellSize
  arrowW = Math.max(4.2, Math.min(6, cellSize * 0.62));
  arrowH = arrowW;
  if (showClueImage) {
    imgSize = Math.max(isA5 ? 9.5 : 11.5, Math.min(isA5 ? 12.5 : 15, cellSize * 1.25));
  }

  const effectiveLeftPad = showClueImage ? (imgSize + arrowW + 2.5) : (arrowW + 1.5);
  const effectiveTopPad = showClueImage ? (imgSize + arrowH + 2.5) : (arrowH + 1.5);

  const gridActualW = layout.cols * cellSize;
  const gridActualH = layout.rows * cellSize;

  const totalDiagramW = gridActualW + effectiveLeftPad + rightPad;
  const totalDiagramH = gridActualH + effectiveTopPad + bottomPad;

  const gridStartX = areaX + effectiveLeftPad + Math.max(0, (areaWidth - totalDiagramW) / 2);
  const gridStartY = areaY + effectiveTopPad + Math.max(0, (areaHeight - totalDiagramH) / 2);

  // 2. VẼ TẤT CẢ CÁC Ô CHỮ CÁI (CROSSWORD LETTER CELLS)
  layout.grid.forEach((cell) => {
    if (!cell.isLetter || !cell.char) return;

    const cx = gridStartX + (cell.x - layout.minX) * cellSize;
    const cy = gridStartY + (cell.y - layout.minY) * cellSize;
    const isIntersection = cell.wordIds.length > 1;

    let isBlankInStudent = true;
    if (hintMode === 'intersection_blank' || hintMode === 'missing_intersect') {
      isBlankInStudent = isIntersection;
    } else if (hintMode === 'first_blank') {
      const isFirstLetter = placedWords.some((pw) => pw.x === cell.x && pw.y === cell.y);
      isBlankInStudent = isFirstLetter;
    } else if (hintMode === 'missing_vowels') {
      isBlankInStudent = /[AEIOUaeiou]/.test(cell.char);
    } else if (hintMode === 'full_answer') {
      isBlankInStudent = false;
    } else {
      isBlankInStudent = true; // all_blank
    }

    // Tô màu nền ô
    if (isAnswerMode && isBlankInStudent) {
      doc.setFillColor(254, 242, 242); // Đỏ phớt cho ô đáp án cần điền
      doc.rect(cx, cy, cellSize, cellSize, 'F');
    } else if (isAnswerMode && isIntersection) {
      doc.setFillColor(254, 243, 199); // Vàng nhạt cho ô giao nhau
      doc.rect(cx, cy, cellSize, cellSize, 'F');
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(cx, cy, cellSize, cellSize, 'F');
    }

    // Viền ô chữ
    if (gridBorder === 'full') {
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(0.38);
      if (lineStyle === 'dotted') {
        setDocLineDash(doc, [0.4, 0.8]);
      } else {
        setDocLineDash(doc, []);
      }
      doc.rect(cx, cy, cellSize, cellSize, 'S');
      setDocLineDash(doc, []);
    } else if (gridBorder === 'outerOnly') {
      // Chỉ vẽ các cạnh tiếp giáp với khoảng trống bên ngoài (Loại 13 style)
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(0.42);
      if (lineStyle === 'dotted') {
        setDocLineDash(doc, [0.4, 0.8]);
      } else {
        setDocLineDash(doc, []);
      }
      const hasTop = layout.grid.get(`${cell.x},${cell.y - 1}`)?.isLetter;
      const hasBottom = layout.grid.get(`${cell.x},${cell.y + 1}`)?.isLetter;
      const hasLeft = layout.grid.get(`${cell.x - 1},${cell.y}`)?.isLetter;
      const hasRight = layout.grid.get(`${cell.x + 1},${cell.y}`)?.isLetter;

      if (!hasTop) doc.line(cx, cy, cx + cellSize, cy);
      if (!hasBottom) doc.line(cx, cy + cellSize, cx + cellSize, cy + cellSize);
      if (!hasLeft) doc.line(cx, cy, cx, cy + cellSize);
      if (!hasRight) doc.line(cx + cellSize, cy, cx + cellSize, cy + cellSize);
      setDocLineDash(doc, []);
    } else if (gridBorder === 'none' && !isAnswerMode && isBlankInStudent) {
      // Khi không viền ở chế độ học sinh: vẽ đường gạch chân đáy để học sinh biết vị trí viết
      doc.setDrawColor(180, 190, 205);
      doc.setLineWidth(0.3);
      doc.line(cx + 1, cy + cellSize - 0.5, cx + cellSize - 1, cy + cellSize - 0.5);
    }

    // Hiển thị ký tự trong ô
    const displayChar = casing === 'lower' ? cell.char.toLowerCase() : cell.char.toUpperCase();

    if (isAnswerMode || hintMode === 'full_answer') {
      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(cellFontSize);
      if (isAnswerMode && isBlankInStudent) {
        doc.setTextColor(220, 38, 38); // MỰC ĐỎ GIÁO VIÊN
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(displayChar, cx + cellSize / 2, cy + cellSize / 2, { align: 'center', baseline: 'middle' });
    } else if (showTrace) {
      // Chữ mờ cho học sinh tập tô (Tracer)
      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(cellFontSize);
      doc.setTextColor(203, 213, 225); // Màu xám nhạt tập tô
      doc.text(displayChar, cx + cellSize / 2, cy + cellSize / 2, { align: 'center', baseline: 'middle' });
    } else if (!isBlankInStudent) {
      // Gợi ý chữ cái có sẵn theo hintMode
      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(cellFontSize);
      doc.setTextColor(30, 41, 59);
      doc.text(displayChar, cx + cellSize / 2, cy + cellSize / 2, { align: 'center', baseline: 'middle' });
    }
  });

  // 3. VẼ TRANH MINH HỌA INLINE & MŨI TÊN (HOLLOW ARROWS) TẠI ĐẦU MỖI TỪ
  interface Box { x: number; y: number; w: number; h: number }
  const placedClueBoxes: Box[] = [];

  placedWords.forEach((pw) => {
    const firstCellX = gridStartX + (pw.x - layout.minX) * cellSize;
    const firstCellY = gridStartY + (pw.y - layout.minY) * cellSize;

    if (pw.orientation === 'horizontal') {
      // Từ hàng ngang: Tranh và mũi tên nằm BÊN TRÁI ô đầu tiên
      const arrowX = firstCellX - arrowW - 1;
      const arrowY = firstCellY + (cellSize - arrowH) / 2;
      let imgX = arrowX - imgSize - 1.5;
      let imgY = firstCellY + (cellSize - imgSize) / 2;

      // Tranh gợi ý inline (kèm cơ chế chống đè tranh đa chiều)
      if (showClueImage && imgSize > 0) {
        for (const b of placedClueBoxes) {
          if (
            imgX < b.x + b.w + 0.5 &&
            imgX + imgSize > b.x - 0.5 &&
            imgY < b.y + b.h + 0.5 &&
            imgY + imgSize > b.y - 0.5
          ) {
            // Đã có tranh/mũi tên khác chiếm chỗ -> dịch chuyển ra vị trí an toàn
            if (imgY >= b.y) {
              imgY = b.y + b.h + 1.2;
            } else {
              imgY = b.y - imgSize - 1.2;
            }
          }
        }
        placedClueBoxes.push({ x: imgX, y: imgY, w: imgSize, h: imgSize });

        doc.setDrawColor(tr, tg, tb);
        doc.setLineWidth(0.28);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.8, 1.8, 'F'); // Không viền tranh gợi ý (tiết kiệm mực)

        const imgData = pw.word.imageUrl ? (wordImagesMap?.get(pw.word.imageUrl) || null) : null;
        if (imgData) {
          try {
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, imgX + 0.8, imgY + 0.8, imgSize - 1.6, imgSize - 1.6);
          } catch {
            // fallback
          }
        } else {
          const fallbackText = pw.word.translation || pw.word.definition || pw.clean;
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(Math.min(7.5, imgSize * 0.42));
          doc.setTextColor(71, 85, 105);
          doc.text(fallbackText, imgX + imgSize / 2, imgY + imgSize / 2, {
            align: 'center',
            baseline: 'middle',
            maxWidth: imgSize - 1.5
          });
        }
      }

      // Mũi tên chỉ sang phải ▶ (Rỗng nền trắng hoặc Đặc theo hollowArrows)
      const isArrowHollow = hollowArrows !== false;
      if (isArrowHollow) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(tr, tg, tb);
      }
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(0.35);

      const tip = arrowW * 0.35;
      doc.lines(
        [
          [arrowW - tip, 0],
          [tip, arrowH / 2],
          [-tip, arrowH / 2],
          [-(arrowW - tip), 0],
          [0, -arrowH]
        ],
        arrowX,
        arrowY,
        [1, 1],
        'FD',
        true
      );

      // Đánh số thứ tự trong mũi tên (nếu bật showClueNumber)
      if (showClueNumber && pw.clueNumber) {
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(Math.min(fontSize, Math.max(7, arrowH * 1.05)));
        if (isArrowHollow) {
          doc.setTextColor(30, 41, 59);
        } else {
          doc.setTextColor(255, 255, 255);
        }
        doc.text(String(pw.clueNumber), arrowX + (arrowW - tip / 2) / 2, arrowY + arrowH / 2, {
          align: 'center',
          baseline: 'middle'
        });
      }
    } else {
      // Từ hàng dọc: Tranh và mũi tên nằm PHÍA TRÊN ô đầu tiên
      const arrowX = firstCellX + (cellSize - arrowW) / 2;
      const arrowY = firstCellY - arrowH - 1;
      let imgX = firstCellX + (cellSize - imgSize) / 2;
      let imgY = arrowY - imgSize - 1.5;

      // Tranh gợi ý inline (kèm cơ chế chống đè tranh đa chiều)
      if (showClueImage && imgSize > 0) {
        for (const b of placedClueBoxes) {
          if (
            imgX < b.x + b.w + 0.5 &&
            imgX + imgSize > b.x - 0.5 &&
            imgY < b.y + b.h + 0.5 &&
            imgY + imgSize > b.y - 0.5
          ) {
            // Đã có tranh/mũi tên khác chiếm chỗ -> dịch chuyển ra vị trí an toàn
            if (imgX >= b.x) {
              imgX = b.x + b.w + 1.2;
            } else {
              imgX = b.x - imgSize - 1.2;
            }
          }
        }
        placedClueBoxes.push({ x: imgX, y: imgY, w: imgSize, h: imgSize });

        doc.setDrawColor(tr, tg, tb);
        doc.setLineWidth(0.28);
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(imgX, imgY, imgSize, imgSize, 1.8, 1.8, 'F'); // Không viền tranh gợi ý (tiết kiệm mực)

        const imgData = pw.word.imageUrl ? (wordImagesMap?.get(pw.word.imageUrl) || null) : null;
        if (imgData) {
          try {
            const format = imgData.startsWith('data:image/png') ? 'PNG' : 'JPEG';
            doc.addImage(imgData, format, imgX + 0.8, imgY + 0.8, imgSize - 1.6, imgSize - 1.6);
          } catch {
            // fallback
          }
        } else {
          const fallbackText = pw.word.translation || pw.word.definition || pw.clean;
          applyFont(doc, activeFont, 'normal');
          doc.setFontSize(Math.min(7.5, imgSize * 0.42));
          doc.setTextColor(71, 85, 105);
          doc.text(fallbackText, imgX + imgSize / 2, imgY + imgSize / 2, {
            align: 'center',
            baseline: 'middle',
            maxWidth: imgSize - 1.5
          });
        }
      }

      // Mũi tên chỉ xuống dưới ▼ (Rỗng nền trắng hoặc Đặc theo hollowArrows)
      const isArrowHollow = hollowArrows !== false;
      if (isArrowHollow) {
        doc.setFillColor(255, 255, 255);
      } else {
        doc.setFillColor(tr, tg, tb);
      }
      doc.setDrawColor(tr, tg, tb);
      doc.setLineWidth(0.35);

      const tip = arrowH * 0.35;
      doc.lines(
        [
          [arrowW, 0],
          [0, arrowH - tip],
          [-arrowW / 2, tip],
          [-arrowW / 2, -tip],
          [0, -(arrowH - tip)]
        ],
        arrowX,
        arrowY,
        [1, 1],
        'FD',
        true
      );

      // Đánh số thứ tự trong mũi tên (nếu bật showClueNumber)
      if (showClueNumber && pw.clueNumber) {
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(Math.min(fontSize, Math.max(7, arrowH * 1.05)));
        if (isArrowHollow) {
          doc.setTextColor(30, 41, 59);
        } else {
          doc.setTextColor(255, 255, 255);
        }
        doc.text(String(pw.clueNumber), arrowX + arrowW / 2, arrowY + (arrowH - tip / 2) / 2, {
          align: 'center',
          baseline: 'middle'
        });
      }
    }
  });

  // 4. FOOTER CLUES (Chỉ khi tắt ảnh inline và bật showClueText)
  if (showFooterClues && clueSectionH > 0) {
    const cluesStartY = gridStartY + gridActualH + (isA5 ? 3 : 5);
    const colW = (areaWidth - 4) / colsClues;
    const sortedWords = [...placedWords].sort((a, b) => a.clueNumber - b.clueNumber);

    sortedWords.forEach((pw, idx) => {
      const cCol = idx % colsClues;
      const cRow = Math.floor(idx / colsClues);
      const itemX = areaX + 2 + cCol * colW;
      const itemY = cluesStartY + cRow * clueRowH;

      const dirLabel = pw.orientation === 'horizontal' ? 'Across' : 'Down';
      const labelText = showClueNumber
        ? `${pw.clueNumber}. (${dirLabel}):`
        : `(${dirLabel}):`;

      applyFont(doc, activeFont, 'bold');
      doc.setFontSize(isA5 ? 8 : 9.5);
      doc.setTextColor(tr, tg, tb);
      doc.text(labelText, itemX, itemY + 3);

      const labelW = doc.getTextWidth(labelText) + 2;
      const clueDesc = pw.word.translation || pw.word.definition || '';

      applyFont(doc, activeFont, 'normal');
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(clueDesc, itemX + labelW, itemY + 3, { maxWidth: colW - labelW - 2 });

      if (isAnswerMode) {
        applyFont(doc, activeFont, 'bold');
        doc.setFontSize(isA5 ? 7.5 : 8.5);
        doc.setTextColor(220, 38, 38);
        doc.text(`[ ${pw.clean} ]`, itemX + labelW, itemY + 6.5);
      }
    });
  }

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

