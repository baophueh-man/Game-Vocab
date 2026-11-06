/**
 * Worksheet Type 19: Vocabulary Maze Puzzle Engine (Mê cung từ vựng)
 * Inspired by authentic Vietnamese & International Primary English Textbooks:
 * - Variant 1 (Single Goal): "Game: Help the boy find the box. Draw a line."
 * - Variant 2 (Multi-Exit): "Game: Find and say. There's a _____."
 * 
 * Supports:
 * - Deterministic seed-based generation
 * - Single Goal & Multi-Exit topology
 * - Guaranteed solvable paths (Breadth-First Search / Depth-First Search solver)
 * - Placement of vocabulary words/images at alcoves and branch exits
 * - Vector-based drawing on jsPDF with customizable wall colors, rounded corners, line caps
 * - Student mode (clean) vs Answer Key mode (highlighted solution paths)
 */

import { jsPDF } from 'jspdf';
import { WorksheetWord } from './worksheetGenerator';
import { getImageFile } from '../lib/storage';
import { getCharacterById, TEXTBOOK_CHARACTERS } from './worksheetCharactersData';

export type Type19MazeMode = 'single_goal' | 'multi_exit';
export type Type19WallColor = 'black_white' | 'orange' | 'blue' | 'purple';
export type Type19EntranceCharacter =
  | 'ben'
  | 'bill'
  | 'linh'
  | 'lucy'
  | 'mai'
  | 'mary'
  | 'minh'
  | 'nam'
  | 'random'
  | 'boy'
  | 'girl'
  | 'runner'
  | 'detective';
export type Type19TargetItem = 'box' | 'gift' | 'house' | 'star' | 'school' | 'vocab';
export type Type19CornerStyle = 'rounded' | 'square';
export type Type19WallThickness = 'thin' | 'medium' | 'thick';

export interface MazePoint {
  r: number;
  c: number;
}

export interface MazePlacedItem {
  word: WorksheetWord;
  point: MazePoint;
  isDestination?: boolean;
  role?: 'primary_path' | 'review_dead_end';
  pathIndex?: number;
  direction?: 'top' | 'right' | 'bottom';
  isWinning?: boolean;
}

export interface MazeCell {
  r: number;
  c: number;
  topWall: boolean;
  rightWall: boolean;
  bottomWall: boolean;
  leftWall: boolean;
  isPath: boolean;
}

export interface MazePuzzleResult {
  grid: MazeCell[][];
  rows: number;
  cols: number;
  startPoint: MazePoint;
  endPoints: MazePoint[];
  solutionPaths: MazePoint[][];
  placedItems: MazePlacedItem[];
  mode: Type19MazeMode;
  entranceCharacter?: Type19EntranceCharacter;
  resolvedCharacter?: Type19EntranceCharacter;
}

export interface MazeGeneratorOptions {
  mode: Type19MazeMode;
  words: WorksheetWord[];
  primaryWords?: WorksheetWord[];
  reviewWords?: WorksheetWord[];
  rows?: number;
  cols?: number;
  seed?: number | string;
  targetItem?: Type19TargetItem;
  entranceCharacter?: Type19EntranceCharacter;
}

// PRNG for reproducible deterministic maze layout
function createPRNG(seedStr: string | number = 'maze_seed_default') {
  let s = 0;
  const str = String(seedStr);
  for (let i = 0; i < str.length; i++) {
    s = (s * 31 + str.charCodeAt(i)) >>> 0;
  }
  if (s === 0) s = 123456789;

  return function nextFloat(): number {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Solves shortest path in a cell grid between start and end using BFS
 */
export function solveMazePath(grid: MazeCell[][], start: MazePoint, end: MazePoint): MazePoint[] {
  const rows = grid.length;
  const cols = grid[0].length;
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const parent: (MazePoint | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  const queue: MazePoint[] = [start];
  visited[start.r][start.c] = true;

  const directions = [
    { dr: -1, dc: 0, wall: 'topWall', opp: 'bottomWall' },
    { dr: 1, dc: 0, wall: 'bottomWall', opp: 'topWall' },
    { dr: 0, dc: -1, wall: 'leftWall', opp: 'rightWall' },
    { dr: 0, dc: 1, wall: 'rightWall', opp: 'leftWall' }
  ];

  let found = false;

  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur.r === end.r && cur.c === end.c) {
      found = true;
      break;
    }

    const cell = grid[cur.r][cur.c];

    for (const d of directions) {
      const nr = cur.r + d.dr;
      const nc = cur.c + d.dc;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        // Check wall barrier between current cell and neighbor
        const hasWall = (cell as any)[d.wall];
        if (!hasWall) {
          visited[nr][nc] = true;
          parent[nr][nc] = cur;
          queue.push({ r: nr, c: nc });
        }
      }
    }
  }

  if (!found) return [];

  const path: MazePoint[] = [];
  let curr: MazePoint | null = end;
  while (curr !== null) {
    path.unshift(curr);
    if (curr.r === start.r && curr.c === start.c) break;
    curr = parent[curr.r][curr.c];
  }

  return path;
}

/**
 * Generates an authentic textbook maze puzzle
 */
export function generateMazePuzzle(options: MazeGeneratorOptions): MazePuzzleResult {
  const mode = options.mode || 'single_goal';
  const rows = Math.max(5, Math.min(8, options.rows || 6));
  const cols = Math.max(6, Math.min(10, options.cols || 8));
  const prng = createPRNG(options.seed || `${mode}_${rows}_${cols}`);
  const words = options.words || [];

  const rawChar = options.entranceCharacter || (mode === 'multi_exit' ? 'linh' : 'ben');
  let resolvedChar: Type19EntranceCharacter = rawChar;
  if (rawChar === 'random') {
    const textbookCharIds: Type19EntranceCharacter[] = ['ben', 'bill', 'linh', 'lucy', 'mai', 'mary', 'minh', 'nam'];
    resolvedChar = textbookCharIds[Math.floor(prng() * textbookCharIds.length)];
  }

  // Initialize all grid cells with all 4 walls closed
  const grid: MazeCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: MazeCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        r,
        c,
        topWall: true,
        rightWall: true,
        bottomWall: true,
        leftWall: true,
        isPath: false
      });
    }
    grid.push(row);
  }

  if (mode === 'single_goal') {
    // -------------------------------------------------------------
    // VARIANT 1: Single Goal (Help the boy find the box) - Image 1
    // Start on left: (startRow, 0)
    // End on right: (endRow, cols - 1)
    // -------------------------------------------------------------
    const startRow = Math.min(rows - 2, Math.max(1, Math.floor(rows / 2)));
    const endRow = Math.min(rows - 2, Math.max(1, Math.floor(rows / 3)));

    const startPoint: MazePoint = { r: startRow, c: 0 };
    const endPoint: MazePoint = { r: endRow, c: cols - 1 };

    // Open entrance on left wall of start cell
    grid[startRow][0].leftWall = false;
    // Open exit on right wall of end cell
    grid[endRow][cols - 1].rightWall = false;

    // Carve maze corridors using recursive DFS spanning tree
    const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

    function carvePassages(r: number, c: number) {
      visited[r][c] = true;
      grid[r][c].isPath = true;

      // Directions: Up, Right, Down, Left
      const dirs = [
        { dr: -1, dc: 0, wall: 'topWall', opp: 'bottomWall' },
        { dr: 0, dc: 1, wall: 'rightWall', opp: 'leftWall' },
        { dr: 1, dc: 0, wall: 'bottomWall', opp: 'topWall' },
        { dr: 0, dc: -1, wall: 'leftWall', opp: 'rightWall' }
      ];

      // Shuffle directions deterministically
      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      for (const d of dirs) {
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          (grid[r][c] as any)[d.wall] = false;
          (grid[nr][nc] as any)[d.opp] = false;
          carvePassages(nr, nc);
        }
      }
    }

    carvePassages(startRow, 0);

    // Compute main solution path
    const solutionPath = solveMazePath(grid, startPoint, endPoint);

    // -------------------------------------------------------------
    // DUAL ROUTING PLACEMENT:
    // 1. Primary words (Bộ chính) -> Placed uniformly along solutionPath (excluding entrance & exit)
    //    Character MUST pass through primary words to reach the goal.
    // 2. Review words (Bộ ôn tập) -> Placed in dead ends (lối cụt) off the solution path.
    // -------------------------------------------------------------
    let primaryList: WorksheetWord[] = [];
    let reviewList: WorksheetWord[] = [];

    if (options.primaryWords && options.primaryWords.length > 0) {
      primaryList = [...options.primaryWords];
      reviewList = options.reviewWords ? [...options.reviewWords] : [];
    } else {
      const explicitPrimary = words.filter(w => w.deckRole === 'primary');
      const explicitReview = words.filter(w => w.deckRole === 'review');

      if (explicitPrimary.length > 0 || explicitReview.length > 0) {
        primaryList = explicitPrimary;
        reviewList = explicitReview;
      } else {
        // Fallback: If no explicit deckRole tags (e.g. single deck loaded),
        // partition words: first half (up to 3 words) are primary path words,
        // and remaining words are review dead-end words.
        const primaryCount = Math.min(3, Math.max(1, Math.floor(words.length / 2)));
        primaryList = words.slice(0, primaryCount);
        reviewList = words.slice(primaryCount);
      }
    }

    // Ensure we have at least 1 primary word along the solution path if any words exist
    if (primaryList.length === 0 && reviewList.length > 0) {
      const takeCount = Math.min(2, Math.max(1, Math.floor(reviewList.length / 2)));
      primaryList = reviewList.splice(0, takeCount);
    }

    const placedItems: MazePlacedItem[] = [];
    const pathSet = new Set(solutionPath.map(p => `${p.r},${p.c}`));

    // Destination Goal at endPoint is primaryList[0] (strictly from Primary Deck)
    const goalWord = primaryList[0] || words[0] || { id: 'goal', term: 'Goal', deckRole: 'primary' };
    placedItems.push({
      word: goalWord,
      point: endPoint,
      isDestination: true,
      role: 'primary_path'
    });

    // 1. Place remaining Primary words along candidate cells of solutionPath
    const interiorPrimary = primaryList.slice(1);
    const candidatePath = solutionPath.length > 2
      ? solutionPath.slice(1, solutionPath.length - 1)
      : [];
    const numCandidates = candidatePath.length;
    const numPrimaryToPlace = Math.min(interiorPrimary.length, numCandidates);

    if (numPrimaryToPlace > 0 && numCandidates > 0) {
      const chosenPathIndices: number[] = [];
      let lastIdx = -1;
      for (let i = 0; i < numPrimaryToPlace; i++) {
        let idx = Math.round(((i + 1) * (numCandidates - 1)) / (numPrimaryToPlace + 1));
        if (idx <= lastIdx) idx = lastIdx + 1;
        if (idx >= numCandidates) idx = numCandidates - 1;
        if (idx > lastIdx && idx < numCandidates) {
          chosenPathIndices.push(idx);
          lastIdx = idx;
        }
      }

      for (let i = 0; i < chosenPathIndices.length; i++) {
        const pIdx = chosenPathIndices[i];
        placedItems.push({
          word: interiorPrimary[i],
          point: candidatePath[pIdx],
          role: 'primary_path',
          pathIndex: pIdx + 1
        });
      }
    }

    // 2. Place Review words into dead-ends (lối cụt) off the solution path
    const deadEnds: MazePoint[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = grid[r][c];
        let openCount = 0;
        if (!cell.topWall && r > 0) openCount++;
        if (!cell.rightWall && c < cols - 1) openCount++;
        if (!cell.bottomWall && r < rows - 1) openCount++;
        if (!cell.leftWall && c > 0) openCount++;

        if (openCount === 1 && !pathSet.has(`${r},${c}`)) {
          deadEnds.push({ r, c });
        }
      }
    }

    if (deadEnds.length < reviewList.length) {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!pathSet.has(`${r},${c}`) && !deadEnds.some(p => p.r === r && p.c === c)) {
            deadEnds.push({ r, c });
          }
        }
      }
    }

    const reviewCountToPlace = Math.min(reviewList.length, deadEnds.length);
    for (let i = 0; i < reviewCountToPlace; i++) {
      placedItems.push({
        word: reviewList[i],
        point: deadEnds[i],
        role: 'review_dead_end'
      });
    }

    return {
      grid,
      rows,
      cols,
      startPoint,
      endPoints: [endPoint],
      solutionPaths: [solutionPath],
      placedItems,
      mode: 'single_goal',
      entranceCharacter: options.entranceCharacter,
      resolvedCharacter: resolvedChar
    };
  } else {
    // -------------------------------------------------------------
    // VARIANT 2: Multi-Exit (Find and say: There's a _____) - Textbook Standard
    // 1 Start on left
    // 2 to 4 Exits branching to distinct borders (Top, Right, Bottom)
    // Guaranteed: Destinations ALWAYS taken from Primary Deck words!
    // NO review words inside corridors to avoid image overlapping/jumping
    // -------------------------------------------------------------
    const startRow = Math.min(rows - 1, Math.max(1, Math.floor(rows / 3)));
    const startPoint: MazePoint = { r: startRow, c: 0 };
    grid[startRow][0].leftWall = false; // Entrance doorway

    // Primary Deck words for destinations
    let primaryList: WorksheetWord[] = [];
    if (options.primaryWords && options.primaryWords.length > 0) {
      primaryList = [...options.primaryWords];
    } else {
      const explicitPrimary = words.filter(w => w.deckRole === 'primary');
      primaryList = explicitPrimary.length > 0 ? explicitPrimary : [...words];
    }

    const destPool = primaryList.length > 0 ? primaryList : words;
    const numExits = Math.max(2, Math.min(4, destPool.length || 4));

    let chosenExits: { point: MazePoint; wall: 'topWall' | 'rightWall' | 'bottomWall'; dir: 'top' | 'right' | 'bottom'; desc: string }[] = [];
    if (numExits === 2) {
      chosenExits = [
        { point: { r: Math.min(rows - 1, Math.max(1, Math.floor(rows * 0.25))), c: cols - 1 }, wall: 'rightWall', dir: 'right', desc: 'top_right' },
        { point: { r: Math.min(rows - 1, Math.max(2, Math.floor(rows * 0.75))), c: cols - 1 }, wall: 'rightWall', dir: 'right', desc: 'bottom_right' }
      ];
    } else if (numExits === 3) {
      chosenExits = [
        { point: { r: 0, c: Math.min(cols - 1, Math.max(1, Math.floor(cols * 0.6))) }, wall: 'topWall', dir: 'top', desc: 'top' },
        { point: { r: Math.min(rows - 1, Math.max(1, Math.floor(rows * 0.5))), c: cols - 1 }, wall: 'rightWall', dir: 'right', desc: 'right' },
        { point: { r: rows - 1, c: Math.min(cols - 1, Math.max(1, Math.floor(cols * 0.6))) }, wall: 'bottomWall', dir: 'bottom', desc: 'bottom' }
      ];
    } else {
      chosenExits = [
        { point: { r: 0, c: Math.min(cols - 1, Math.max(1, Math.floor(cols * 0.6))) }, wall: 'topWall', dir: 'top', desc: 'top' },
        { point: { r: Math.min(rows - 1, Math.max(1, Math.floor(rows * 0.25))), c: cols - 1 }, wall: 'rightWall', dir: 'right', desc: 'top_right' },
        { point: { r: Math.min(rows - 1, Math.max(2, Math.floor(rows * 0.75))), c: cols - 1 }, wall: 'rightWall', dir: 'right', desc: 'bottom_right' },
        { point: { r: rows - 1, c: Math.min(cols - 1, Math.max(1, Math.floor(cols * 0.6))) }, wall: 'bottomWall', dir: 'bottom', desc: 'bottom' }
      ];
    }

    // Pick 1 deterministic winning exit based on seed PRNG
    const winningExitIdx = Math.floor(prng() * numExits);
    const winningExit = chosenExits[winningExitIdx];

    // Reserve decoy exit cells so the main maze tree avoids them, turning them into authentic dead-end stubs
    const reservedDecoyCells = new Set<string>();
    for (let j = 0; j < chosenExits.length; j++) {
      if (j === winningExitIdx) continue;
      reservedDecoyCells.add(`${chosenExits[j].point.r},${chosenExits[j].point.c}`);
    }

    // Carve maze corridors from startPoint to all reachable cells (including winningExit)
    const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
    for (const key of reservedDecoyCells) {
      const [rr, cc] = key.split(',').map(Number);
      visited[rr][cc] = true;
    }

    function carvePassages(r: number, c: number) {
      visited[r][c] = true;
      grid[r][c].isPath = true;

      const dirs = [
        { dr: -1, dc: 0, wall: 'topWall', opp: 'bottomWall' },
        { dr: 0, dc: 1, wall: 'rightWall', opp: 'leftWall' },
        { dr: 1, dc: 0, wall: 'bottomWall', opp: 'topWall' },
        { dr: 0, dc: -1, wall: 'leftWall', opp: 'rightWall' }
      ];

      for (let i = dirs.length - 1; i > 0; i--) {
        const j = Math.floor(prng() * (i + 1));
        [dirs[i], dirs[j]] = [dirs[j], dirs[i]];
      }

      for (const d of dirs) {
        const nr = r + d.dr;
        const nc = c + d.dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          (grid[r][c] as any)[d.wall] = false;
          (grid[nr][nc] as any)[d.opp] = false;
          carvePassages(nr, nc);
        }
      }
    }

    carvePassages(startRow, 0);

    // Open outer border doorway for all chosen exits
    for (let i = 0; i < chosenExits.length; i++) {
      const ex = chosenExits[i];
      (grid[ex.point.r][ex.point.c] as any)[ex.wall] = false;
    }

    const winningPath = solveMazePath(grid, startPoint, winningExit.point);

    const endPoints: MazePoint[] = [];
    const placedItems: MazePlacedItem[] = [];

    for (let i = 0; i < chosenExits.length; i++) {
      const ex = chosenExits[i];
      endPoints.push(ex.point);
      placedItems.push({
        word: destPool[i],
        point: ex.point,
        isDestination: true,
        role: 'primary_path',
        direction: ex.dir,
        isWinning: i === winningExitIdx
      });
    }

    return {
      grid,
      rows,
      cols,
      startPoint,
      endPoints,
      solutionPaths: [winningPath],
      placedItems,
      mode: 'multi_exit',
      entranceCharacter: options.entranceCharacter,
      resolvedCharacter: resolvedChar
    };
  }
}

/**
 * Calculates metric dimensions for Type 19 Maze in Single and Composite layout
 */
export function calculateType19MazeMetrics(isA5: boolean, printableWidth: number, mode: Type19MazeMode = 'single_goal') {
  const cardWidth = printableWidth;
  const cardHeight = isA5 ? (mode === 'single_goal' ? 105 : 120) : (mode === 'single_goal' ? 140 : 165);
  return {
    cardWidth,
    cardHeight,
    mazeWidth: cardWidth * (mode === 'single_goal' ? 0.76 : 0.70),
    mazeHeight: cardHeight * (mode === 'single_goal' ? 0.72 : 0.68)
  };
}

/**
 * Draws a hollow directional arrow (sharp outline, white interior) to save printer ink
 */
export function drawHollowArrow(
  doc: jsPDF,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: { r: number; g: number; b: number },
  arrowHeadSize: number = 3.6,
  shaftThickness: number = 1.3
) {
  const dx = endX - startX;
  const dy = endY - startY;
  const len = Math.hypot(dx, dy);
  if (len < 0.4) return;

  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;

  const headLen = Math.min(arrowHeadSize, len * 0.55);
  const headHalfW = headLen * 0.70;
  const shaftHalfW = Math.min(shaftThickness / 2, headHalfW * 0.45);
  const shaftLen = len - headLen;

  const p0 = { x: startX + nx * shaftHalfW, y: startY + ny * shaftHalfW };
  const p1 = { x: startX + ux * shaftLen + nx * shaftHalfW, y: startY + uy * shaftLen + ny * shaftHalfW };
  const p2 = { x: startX + ux * shaftLen + nx * headHalfW, y: startY + uy * shaftLen + ny * headHalfW };
  const p3 = { x: endX, y: endY };
  const p4 = { x: startX + ux * shaftLen - nx * headHalfW, y: startY + uy * shaftLen - ny * headHalfW };
  const p5 = { x: startX + ux * shaftLen - nx * shaftHalfW, y: startY + uy * shaftLen - ny * shaftHalfW };
  const p6 = { x: startX - nx * shaftHalfW, y: startY - ny * shaftHalfW };

  const relVectors: [number, number][] = [
    [p1.x - p0.x, p1.y - p0.y],
    [p2.x - p1.x, p2.y - p1.y],
    [p3.x - p2.x, p3.y - p2.y],
    [p4.x - p3.x, p4.y - p3.y],
    [p5.x - p4.x, p5.y - p4.y],
    [p6.x - p5.x, p6.y - p5.y],
    [p0.x - p6.x, p0.y - p6.y]
  ];

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setLineWidth(0.45);
  doc.lines(relVectors, p0.x, p0.y, [1, 1], 'FD', true);
}

/**
 * Backward compatibility alias: drawBoldArrow delegates to drawHollowArrow
 */
export function drawBoldArrow(
  doc: jsPDF,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  color: { r: number; g: number; b: number },
  arrowHeadSize: number = 3.6
) {
  drawHollowArrow(doc, startX, startY, endX, endY, color, arrowHeadSize);
}

function internalSafeAddImage(doc: jsPDF, img: string, x: number, y: number, w: number, h: number) {
  if (!img) return;
  try {
    const isPng = img.startsWith('data:image/png') || img.startsWith('iVBORw0KGgo') || img.includes('data:image/png');
    doc.addImage(img, isPng ? 'PNG' : 'JPEG', x, y, w, h);
  } catch {
    try {
      doc.addImage(img, 'JPEG', x, y, w, h);
    } catch {
      // ignore
    }
  }
}

/**
 * Draws a cartoon character (Textbook character image or vector graphics)
 */
export async function drawMazeCharacter(
  doc: jsPDF,
  entranceChar: Type19EntranceCharacter,
  cx: number,
  cy: number,
  scale: number,
  isA5: boolean,
  activeFont: string,
  fetchImageBase64?: (url: string) => Promise<string | null>
) {
  const s = scale;

  // Check if entranceChar is one of the 8 textbook characters from Unit 2 (NHANVAT)
  const textbookChar = getCharacterById(entranceChar);
  if (textbookChar) {
    const charW = 12.7; // exactly 0.5 inch
    const charH = 12.7; // exactly 0.5 inch
    let drawn = false;

    // 1. Instant pre-baked base64 (synchronous, 100% offline, guaranteed zero-latency)
    if (textbookChar.imageBase64) {
      try {
        internalSafeAddImage(doc, textbookChar.imageBase64, cx - charW / 2, cy - charH / 2, charW, charH);
        drawn = true;
      } catch {
        // fallback
      }
    }

    // 2. Fallback to runtime fetch if base64 not pre-baked
    if (!drawn && fetchImageBase64) {
      try {
        const base64 = await fetchImageBase64(textbookChar.avatarUrl);
        if (base64) {
          internalSafeAddImage(doc, base64, cx - charW / 2, cy - charH / 2, charW, charH);
          drawn = true;
        }
      } catch {
        // fallback
      }
    }

    if (!drawn) {
      // Vector avatar fallback
      doc.setFillColor(textbookChar.gender === 'boy' ? 14 : 244, textbookChar.gender === 'boy' ? 165 : 114, textbookChar.gender === 'boy' ? 233 : 182);
      doc.circle(cx, cy, 6.35, 'F');
      doc.setFont(activeFont, 'bold');
      doc.setFontSize(isA5 ? 8.5 : 10);
      doc.setTextColor(255, 255, 255);
      doc.text(textbookChar.name[0], cx, cy + 1.2, { align: 'center' });
    }

    // Name tag below character
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 7.5 : 8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(textbookChar.name, cx, cy + 6.35 + 2.5, { align: 'center' });
    return;
  }

  if (entranceChar === 'boy') {
    // -------------------------------------------------------------
    // RUNNING BOY (Matching Image 1)
    // Cheerful boy running towards the right with dynamic motion
    // -------------------------------------------------------------
    // Head (Skin tone)
    doc.setFillColor(254, 215, 170); // Peach / warm skin
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.25 * s);
    doc.circle(cx + 0.3 * s, cy - 6 * s, 3.2 * s, 'FD');

    // Cheerful profile: eye & smile
    doc.setFillColor(15, 23, 42);
    doc.circle(cx + 1.8 * s, cy - 6.2 * s, 0.45 * s, 'F'); // Eye
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.3 * s);
    doc.line(cx + 1.5 * s, cy - 4.8 * s, cx + 2.6 * s, cy - 5.1 * s); // Cheerful mouth

    // Hair cap (Dark brown with bangs facing forward)
    doc.setFillColor(69, 26, 3);
    doc.ellipse(cx + 0.1 * s, cy - 7.6 * s, 3.3 * s, 2.0 * s, 'F');
    // Front tuft
    doc.triangle(cx + 1.2 * s, cy - 8.2 * s, cx + 3.2 * s, cy - 6.8 * s, cx + 2.0 * s, cy - 6.2 * s, 'F');

    // Torso (Running t-shirt leaning forward)
    doc.setFillColor(14, 165, 233); // Sky-500
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.3 * s);
    doc.roundedRect(cx - 2.2 * s, cy - 2.8 * s, 4.8 * s, 5.0 * s, 0.8 * s, 0.8 * s, 'FD');
    // White collar
    doc.setFillColor(255, 255, 255);
    doc.circle(cx + 0.5 * s, cy - 2.6 * s, 1.1 * s, 'F');

    // Running Arms
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(1.1 * s);
    doc.setLineCap('round');
    // Back arm (swinging back)
    doc.line(cx - 1.2 * s, cy - 1.5 * s, cx - 4.0 * s, cy + 0.5 * s);
    doc.setFillColor(254, 215, 170);
    doc.circle(cx - 4.2 * s, cy + 0.7 * s, 0.8 * s, 'F');
    // Front arm (swinging forward towards entrance)
    doc.line(cx + 1.8 * s, cy - 1.5 * s, cx + 4.5 * s, cy - 0.8 * s);
    doc.setFillColor(254, 215, 170);
    doc.circle(cx + 4.7 * s, cy - 0.8 * s, 0.8 * s, 'F');

    // Shorts (Navy)
    doc.setFillColor(30, 41, 59);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.25 * s);
    doc.rect(cx - 2.2 * s, cy + 2.2 * s, 4.8 * s, 2.6 * s, 'FD');

    // Running Legs & Shoes
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(1.15 * s);
    // Front leg (striding forward)
    doc.line(cx + 0.8 * s, cy + 4.8 * s, cx + 3.2 * s, cy + 7.8 * s);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(cx + 2.2 * s, cy + 7.4 * s, 3.0 * s, 1.4 * s, 0.5 * s, 0.5 * s, 'F');
    // Back leg (kicked back)
    doc.line(cx - 1.0 * s, cy + 4.8 * s, cx - 3.8 * s, cy + 6.8 * s);
    doc.roundedRect(cx - 5.2 * s, cy + 6.4 * s, 2.6 * s, 1.4 * s, 0.5 * s, 0.5 * s, 'F');

    // Subtle motion arcs
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35 * s);
    doc.line(cx - 6.2 * s, cy + 5.2 * s, cx - 4.8 * s, cy + 5.2 * s);
    doc.line(cx - 6.6 * s, cy + 7.0 * s, cx - 5.5 * s, cy + 7.0 * s);

    // Label
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(30, 41, 59);
    doc.text('Boy', cx, cy + 12.5 * s, { align: 'center' });

  } else if (entranceChar === 'girl') {
    // -------------------------------------------------------------
    // THINKING GIRL (Matching Image 2)
    // Cute girl with curly hair, finger to chin in thoughtful pose
    // -------------------------------------------------------------
    // Head (Skin tone)
    doc.setFillColor(254, 215, 170);
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.25 * s);
    doc.circle(cx, cy - 5.6 * s, 3.2 * s, 'FD');

    // Curly hair puffs (Dark chocolate)
    doc.setFillColor(63, 34, 18);
    doc.circle(cx - 0.5 * s, cy - 7.6 * s, 3.1 * s, 'F'); // Top cap
    doc.circle(cx - 3.2 * s, cy - 5.8 * s, 2.2 * s, 'F'); // Left puff
    doc.circle(cx + 2.2 * s, cy - 6.8 * s, 1.8 * s, 'F'); // Right puff
    // Cute pink bow
    doc.setFillColor(244, 63, 94); // Rose-500
    doc.circle(cx - 2.8 * s, cy - 8.4 * s, 1.1 * s, 'F');
    doc.circle(cx - 1.4 * s, cy - 8.7 * s, 1.1 * s, 'F');

    // Thoughtful facial expression: eye looking up-right, gentle smile
    doc.setFillColor(15, 23, 42);
    doc.circle(cx + 1.4 * s, cy - 5.8 * s, 0.45 * s, 'F');
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.3 * s);
    doc.line(cx + 1.2 * s, cy - 4.4 * s, cx + 2.2 * s, cy - 4.6 * s);

    // Hand to chin (Classic thinking pose from Image 2!)
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(1.1 * s);
    doc.setLineCap('round');
    doc.line(cx + 0.5 * s, cy - 1.0 * s, cx + 1.6 * s, cy - 4.0 * s);
    doc.setFillColor(254, 215, 170);
    doc.circle(cx + 1.7 * s, cy - 4.1 * s, 0.8 * s, 'F');

    // Pinafore dress / overalls (Slate-teal)
    doc.setFillColor(71, 85, 105);
    doc.setDrawColor(51, 65, 85);
    doc.setLineWidth(0.25 * s);
    doc.triangle(cx, cy - 2.5 * s, cx - 3.4 * s, cy + 4.5 * s, cx + 3.4 * s, cy + 4.5 * s, 'FD');
    // White blouse collar
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy - 2.4 * s, 1.1 * s, 'F');

    // Legs & Shoes
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(1.1 * s);
    doc.line(cx - 1.2 * s, cy + 4.5 * s, cx - 1.2 * s, cy + 8.0 * s);
    doc.line(cx + 1.2 * s, cy + 4.5 * s, cx + 1.2 * s, cy + 8.0 * s);
    doc.setFillColor(30, 41, 59);
    doc.circle(cx - 1.2 * s, cy + 8.4 * s, 1.1 * s, 'F');
    doc.circle(cx + 1.2 * s, cy + 8.4 * s, 1.1 * s, 'F');

    // Label
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(30, 41, 59);
    doc.text('Girl', cx, cy + 12.5 * s, { align: 'center' });

  } else if (entranceChar === 'runner') {
    // -------------------------------------------------------------
    // ATHLETIC RUNNER
    // Red headband, sporty tank top with badge
    // -------------------------------------------------------------
    doc.setFillColor(254, 215, 170);
    doc.circle(cx, cy - 6 * s, 3.2 * s, 'F');
    // Hair & Headband
    doc.setFillColor(69, 26, 3);
    doc.circle(cx, cy - 7.5 * s, 3.0 * s, 'F');
    doc.setFillColor(239, 68, 68); // Red headband
    doc.rect(cx - 3.2 * s, cy - 7.0 * s, 6.4 * s, 1.4 * s, 'F');

    doc.setFillColor(15, 23, 42);
    doc.circle(cx + 1.5 * s, cy - 6.0 * s, 0.45 * s, 'F');

    // Athletic tank top
    doc.setFillColor(239, 68, 68);
    doc.roundedRect(cx - 2.2 * s, cy - 2.8 * s, 4.4 * s, 5.0 * s, 0.6 * s, 0.6 * s, 'F');
    doc.setFillColor(255, 255, 255);
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 6 : 7.5);
    doc.text('1', cx, cy + 0.5 * s, { align: 'center' });

    // Stride legs
    doc.setDrawColor(254, 215, 170);
    doc.setLineWidth(1.15 * s);
    doc.setLineCap('round');
    doc.line(cx + 0.8 * s, cy + 2.5 * s, cx + 3.5 * s, cy + 7.5 * s);
    doc.line(cx - 0.8 * s, cy + 2.5 * s, cx - 3.5 * s, cy + 6.8 * s);
    doc.setFillColor(15, 23, 42);
    doc.roundedRect(cx + 2.5 * s, cy + 7.2 * s, 2.8 * s, 1.4 * s, 0.5 * s, 0.5 * s, 'F');
    doc.roundedRect(cx - 4.8 * s, cy + 6.4 * s, 2.6 * s, 1.4 * s, 0.5 * s, 0.5 * s, 'F');

    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(30, 41, 59);
    doc.text('Runner', cx, cy + 12.5 * s, { align: 'center' });

  } else {
    // -------------------------------------------------------------
    // DETECTIVE (Spy / Explorer)
    // Fedora hat, stylish coat, magnifying glass looking at maze
    // -------------------------------------------------------------
    doc.setFillColor(254, 215, 170);
    doc.circle(cx, cy - 5.2 * s, 3.0 * s, 'F');

    // Fedora Hat (Warm amber/brown)
    doc.setFillColor(180, 83, 9);
    doc.roundedRect(cx - 4.2 * s, cy - 6.8 * s, 8.4 * s, 1.3 * s, 0.6 * s, 0.6 * s, 'F'); // Brim
    doc.roundedRect(cx - 2.8 * s, cy - 9.8 * s, 5.6 * s, 3.2 * s, 0.8 * s, 0.8 * s, 'F'); // Crown
    doc.setFillColor(69, 26, 3);
    doc.rect(cx - 2.8 * s, cy - 7.5 * s, 5.6 * s, 0.7 * s, 'F'); // Hat band

    // Trench coat
    doc.setFillColor(217, 119, 6);
    doc.triangle(cx, cy - 2.2 * s, cx - 3.4 * s, cy + 4.8 * s, cx + 3.4 * s, cy + 4.8 * s, 'F');

    // Magnifying glass (held in right hand pointing towards maze)
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(0.65 * s);
    doc.circle(cx + 3.8 * s, cy - 1.2 * s, 1.8 * s, 'D'); // Lens
    doc.setFillColor(224, 242, 254);
    doc.circle(cx + 3.8 * s, cy - 1.2 * s, 1.7 * s, 'F');
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.85 * s);
    doc.line(cx + 2.5 * s, cy - 0.2 * s, cx + 1.2 * s, cy + 1.2 * s); // Handle

    // Standing legs
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(1.1 * s);
    doc.line(cx - 1.2 * s, cy + 4.8 * s, cx - 1.2 * s, cy + 8.2 * s);
    doc.line(cx + 1.2 * s, cy + 4.8 * s, cx + 1.2 * s, cy + 8.2 * s);

    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(30, 41, 59);
    doc.text('Detective', cx, cy + 12.5 * s, { align: 'center' });
  }

  doc.setLineCap('butt');
}

/**
 * Draws the target destination item (3D Box, Gift, Star, House, School) using native jsPDF vector graphics
 */
export function drawMazeTargetItem(
  doc: jsPDF,
  targetItem: Type19TargetItem,
  cx: number,
  cy: number,
  scale: number,
  isA5: boolean,
  activeFont: string
) {
  const s = scale;

  if (targetItem === 'box') {
    // -------------------------------------------------------------
    // 3D ISOMETRIC CARDBOARD BOX (Matching Image 1)
    // Cardboard flaps, realistic isometric depth and warm tones
    // -------------------------------------------------------------
    const w = 11.5 * s;
    const h = 8.5 * s;
    const d = 5.2 * s;

    const pTop = { x: cx, y: cy - h * 0.5 };
    const pRight = { x: cx + w * 0.5, y: cy - h * 0.5 + d * 0.5 };
    const pBottomTop = { x: cx, y: cy - h * 0.5 + d };
    const pLeft = { x: cx - w * 0.5, y: cy - h * 0.5 + d * 0.5 };

    const pBottomLeft = { x: cx - w * 0.5, y: pLeft.y + h * 0.65 };
    const pBottomCenter = { x: cx, y: pBottomTop.y + h * 0.65 };
    const pBottomRight = { x: cx + w * 0.5, y: pRight.y + h * 0.65 };

    doc.setLineWidth(0.35 * s);
    doc.setDrawColor(146, 64, 14); // Warm brown

    // 1. Top face (Light cardboard tone)
    doc.setFillColor(245, 208, 169);
    doc.triangle(pTop.x, pTop.y, pRight.x, pRight.y, pBottomTop.x, pBottomTop.y, 'FD');
    doc.triangle(pTop.x, pTop.y, pLeft.x, pLeft.y, pBottomTop.x, pBottomTop.y, 'FD');
    // Flap seam across top lid (Cardboard tape/crease)
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.3 * s);
    const seamStart = { x: (pTop.x + pLeft.x) / 2, y: (pTop.y + pLeft.y) / 2 };
    const seamEnd = { x: (pRight.x + pBottomTop.x) / 2, y: (pRight.y + pBottomTop.y) / 2 };
    doc.line(seamStart.x, seamStart.y, seamEnd.x, seamEnd.y);

    // 2. Left face (Mid cardboard tone)
    doc.setDrawColor(146, 64, 14);
    doc.setLineWidth(0.35 * s);
    doc.setFillColor(227, 170, 116);
    doc.triangle(pLeft.x, pLeft.y, pBottomTop.x, pBottomTop.y, pBottomCenter.x, pBottomCenter.y, 'FD');
    doc.triangle(pLeft.x, pLeft.y, pBottomLeft.x, pBottomLeft.y, pBottomCenter.x, pBottomCenter.y, 'FD');

    // 3. Right face (Shaded darker cardboard tone)
    doc.setFillColor(201, 136, 75);
    doc.triangle(pBottomTop.x, pBottomTop.y, pRight.x, pRight.y, pBottomRight.x, pBottomRight.y, 'FD');
    doc.triangle(pBottomTop.x, pBottomTop.y, pBottomCenter.x, pBottomCenter.y, pBottomRight.x, pBottomRight.y, 'FD');

    // Label
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(120, 53, 15);
    doc.text('Box', cx, pBottomCenter.y + 4.5 * s, { align: 'center' });

  } else if (targetItem === 'gift') {
    // -------------------------------------------------------------
    // 3D PRESENT / GIFT BOX
    // Ruby red cube with shining gold ribbon wrapping & ribbon bow
    // -------------------------------------------------------------
    const w = 11.0 * s;
    const h = 8.0 * s;
    const d = 5.0 * s;

    const pTop = { x: cx, y: cy - h * 0.5 };
    const pRight = { x: cx + w * 0.5, y: cy - h * 0.5 + d * 0.5 };
    const pBottomTop = { x: cx, y: cy - h * 0.5 + d };
    const pLeft = { x: cx - w * 0.5, y: cy - h * 0.5 + d * 0.5 };
    const pBottomLeft = { x: cx - w * 0.5, y: pLeft.y + h * 0.65 };
    const pBottomCenter = { x: cx, y: pBottomTop.y + h * 0.65 };
    const pBottomRight = { x: cx + w * 0.5, y: pRight.y + h * 0.65 };

    doc.setLineWidth(0.3 * s);
    doc.setDrawColor(159, 18, 57);

    // Faces
    doc.setFillColor(244, 63, 94); // Light rose top
    doc.triangle(pTop.x, pTop.y, pRight.x, pRight.y, pBottomTop.x, pBottomTop.y, 'FD');
    doc.triangle(pTop.x, pTop.y, pLeft.x, pLeft.y, pBottomTop.x, pBottomTop.y, 'FD');

    doc.setFillColor(225, 29, 72); // Mid crimson left
    doc.triangle(pLeft.x, pLeft.y, pBottomTop.x, pBottomTop.y, pBottomCenter.x, pBottomCenter.y, 'FD');
    doc.triangle(pLeft.x, pLeft.y, pBottomLeft.x, pBottomLeft.y, pBottomCenter.x, pBottomCenter.y, 'FD');

    doc.setFillColor(190, 18, 60); // Darker crimson right
    doc.triangle(pBottomTop.x, pBottomTop.y, pRight.x, pRight.y, pBottomRight.x, pBottomRight.y, 'FD');
    doc.triangle(pBottomTop.x, pBottomTop.y, pBottomCenter.x, pBottomCenter.y, pBottomRight.x, pBottomRight.y, 'FD');

    // Golden Ribbon stripes
    doc.setDrawColor(250, 204, 21); // Amber-400
    doc.setLineWidth(1.4 * s);
    doc.line((pTop.x + pLeft.x) / 2, (pTop.y + pLeft.y) / 2, (pRight.x + pBottomTop.x) / 2, (pRight.y + pBottomTop.y) / 2);
    doc.line(cx, pBottomTop.y, cx, pBottomCenter.y);

    // Cute Ribbon Bow on top
    doc.setFillColor(250, 204, 21);
    doc.circle(pTop.x - 1.2 * s, pTop.y - 0.8 * s, 1.2 * s, 'F');
    doc.circle(pTop.x + 1.2 * s, pTop.y - 0.8 * s, 1.2 * s, 'F');
    doc.setFillColor(234, 179, 8);
    doc.circle(pTop.x, pTop.y - 0.4 * s, 0.8 * s, 'F');

    // Label
    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(159, 18, 57);
    doc.text('Gift', cx, pBottomCenter.y + 4.5 * s, { align: 'center' });

  } else if (targetItem === 'star') {
    // -------------------------------------------------------------
    // 5-POINTED GOLDEN STAR
    // Sharp golden star with radiant border and shine
    // -------------------------------------------------------------
    const rOuter = 6.2 * s;
    const rInner = 2.6 * s;
    const starPts: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * Math.PI) / 5 - Math.PI / 2;
      const r = i % 2 === 0 ? rOuter : rInner;
      starPts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
    }

    doc.setFillColor(251, 191, 36); // Amber-400
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.35 * s);

    for (let i = 0; i < 10; i++) {
      const next = (i + 1) % 10;
      doc.triangle(cx, cy, starPts[i].x, starPts[i].y, starPts[next].x, starPts[next].y, 'FD');
    }

    // Shine highlight
    doc.setFillColor(255, 255, 255);
    doc.circle(cx - 1.2 * s, cy - 1.8 * s, 0.9 * s, 'F');

    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(180, 83, 9);
    doc.text('Star', cx, cy + rOuter + 4.0 * s, { align: 'center' });

  } else if (targetItem === 'house') {
    // -------------------------------------------------------------
    // CUTE COTTAGE / HOUSE
    // Red pitched roof, chimney, warm cream wall, blue door
    // -------------------------------------------------------------
    // Chimney
    doc.setFillColor(185, 28, 28);
    doc.rect(cx + 2.4 * s, cy - 7.5 * s, 1.8 * s, 3.2 * s, 'F');

    // Roof (Red triangle)
    doc.setFillColor(220, 38, 38);
    doc.setDrawColor(153, 27, 27);
    doc.setLineWidth(0.35 * s);
    doc.triangle(cx, cy - 7.2 * s, cx - 6.5 * s, cy - 1.5 * s, cx + 6.5 * s, cy - 1.5 * s, 'FD');

    // Wall (Cream)
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(217, 119, 6);
    doc.rect(cx - 5.2 * s, cy - 1.5 * s, 10.4 * s, 6.5 * s, 'FD');

    // Door (Blue)
    doc.setFillColor(2, 132, 199);
    doc.roundedRect(cx - 1.4 * s, cy + 1.2 * s, 2.8 * s, 3.8 * s, 0.5 * s, 0.5 * s, 'F');

    // Attic Window
    doc.setFillColor(255, 255, 255);
    doc.circle(cx, cy - 3.2 * s, 1.1 * s, 'FD');

    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(185, 28, 28);
    doc.text('House', cx, cy + 9.5 * s, { align: 'center' });

  } else {
    // -------------------------------------------------------------
    // SCHOOL BUILDING
    // Arched entrance, peaked roof with bell/flag
    // -------------------------------------------------------------
    doc.setFillColor(254, 240, 138); // Soft yellow
    doc.setDrawColor(180, 83, 9);
    doc.setLineWidth(0.35 * s);
    doc.rect(cx - 6.0 * s, cy - 2.0 * s, 12.0 * s, 7.0 * s, 'FD');

    // Roof
    doc.setFillColor(234, 88, 12);
    doc.triangle(cx, cy - 7.5 * s, cx - 7.0 * s, cy - 2.0 * s, cx + 7.0 * s, cy - 2.0 * s, 'FD');

    // Flagpole & Flag on top
    doc.setDrawColor(71, 85, 105);
    doc.setLineWidth(0.4 * s);
    doc.line(cx, cy - 7.5 * s, cx, cy - 10.2 * s);
    doc.setFillColor(220, 38, 38);
    doc.triangle(cx, cy - 10.2 * s, cx + 2.6 * s, cy - 9.0 * s, cx, cy - 7.8 * s, 'FD');

    // Door
    doc.setFillColor(30, 41, 59);
    doc.roundedRect(cx - 1.6 * s, cy + 1.5 * s, 3.2 * s, 3.5 * s, 0.8 * s, 0.8 * s, 'F');

    doc.setFont(activeFont, 'bold');
    doc.setFontSize(isA5 ? 8.5 : 10);
    doc.setTextColor(180, 83, 9);
    doc.text('School', cx, cy + 9.5 * s, { align: 'center' });
  }
}

/**
 * Draws an authentic textbook speech bubble whose pointer tail points cleanly to the character's head
 */
export function drawSpeechBubble(
  doc: jsPDF,
  bubX: number,
  bubY: number,
  bubW: number,
  bubH: number,
  tailTipX: number,
  tailTipY: number,
  text: string,
  strokeColor: { r: number; g: number; b: number },
  fontFamily: string,
  isA5: boolean
) {
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(strokeColor.r, strokeColor.g, strokeColor.b);
  doc.setLineWidth(0.65);
  doc.roundedRect(bubX, bubY, bubW, bubH, 4, 4, 'FD');

  // Pointer Tail pointing down directly to character's head
  const tailBaseX1 = Math.min(bubX + bubW - 4, Math.max(bubX + 4, tailTipX - 2.5));
  const tailBaseX2 = Math.min(bubX + bubW - 2, Math.max(bubX + 6, tailTipX + 3.5));
  const tailBaseY = bubY + bubH;

  doc.setFillColor(255, 255, 255);
  doc.triangle(tailBaseX1, tailBaseY - 0.2, tailBaseX2, tailBaseY - 0.2, tailTipX, tailTipY, 'FD');

  // Text inside bubble
  doc.setFont(fontFamily, 'bold');
  doc.setFontSize(isA5 ? 10.5 : 12.5);
  doc.setTextColor(15, 23, 42);
  doc.text(text, bubX + bubW / 2, bubY + bubH / 2 + (isA5 ? 1.3 : 1.6), { align: 'center' });
}

/**
 * Draws the vector Maze puzzle directly onto the jsPDF document
 */
export async function drawType19Maze(
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  height: number,
  puzzle: MazePuzzleResult,
  options: {
    mazeMode?: Type19MazeMode;
    wallColor?: Type19WallColor;
    entranceCharacter?: Type19EntranceCharacter;
    targetItem?: Type19TargetItem;
    sentenceStem?: string;
    cornerStyle?: Type19CornerStyle;
    wallThickness?: Type19WallThickness;
    answerMode?: 'student' | 'answer';
    isA5?: boolean;
    fontFamily?: string;
    fontSize?: number;
    fetchImageBase64?: (url: string) => Promise<string | null>;
  }
) {
  const mode = options.mazeMode || puzzle.mode || 'single_goal';
  const wallColor = options.wallColor || (mode === 'multi_exit' ? 'orange' : 'black_white');
  const entranceChar = options.entranceCharacter || (mode === 'multi_exit' ? 'girl' : 'boy');
  const targetItem = options.targetItem || 'box';
  const cornerStyle = options.cornerStyle || 'rounded';
  const wallThickness = options.wallThickness || 'medium';
  const isAnsMode = options.answerMode === 'answer';
  const isA5 = options.isA5 ?? false;
  const activeFont = options.fontFamily || 'r0c0i Linotte';

  // RGB color palette
  let r = 51, g = 65, b = 85; // black_white (slate-700)
  if (wallColor === 'orange') {
    r = 234; g = 88; b = 12; // textbook vibrant orange
  } else if (wallColor === 'blue') {
    r = 2; g = 132; b = 199; // sky-600
  } else if (wallColor === 'purple') {
    r = 147; g = 51; b = 234; // violet-600
  }

  // Wall stroke width in mm
  let lineWidth = 0.75;
  if (wallThickness === 'thin') lineWidth = 0.45;
  if (wallThickness === 'thick') lineWidth = 1.15;

  const resolvedChar = puzzle.resolvedCharacter || (entranceChar === 'random' ? 'ben' : entranceChar);

  if (mode === 'multi_exit') {
    // -------------------------------------------------------------
    // VARIANT 2: Multi-Exit ("Find and say")
    // COLUMN 1 (LEFT): Speech Bubble ("There's a _____") on top,
    //                  Entrance Character (0.5x0.5 inch = 12.7x12.7mm) + name underneath,
    //                  Hollow entrance arrow pointing RIGHT into maze entrance.
    // COLUMN 2 (RIGHT): Maze grid with Exits (Top, Right, Bottom).
    //                  Each exit has a hollow arrow pointing OUT to destination primary word.
    // ZERO OVERLAP! ZERO COVERING!
    // -------------------------------------------------------------
    const leftColW = isA5 ? 38 : 44;
    const rightColW = isA5 ? 24 : 28;
    const topExitH = isA5 ? 22 : 26;
    const bottomExitH = isA5 ? 18 : 22;

    const mazeX = x + leftColW + 4;
    const mazeY = y + topExitH;
    const mazeW = width - leftColW - 4 - rightColW;
    const mazeH = height - topExitH - bottomExitH;

    const rows = puzzle.rows;
    const cols = puzzle.cols;
    const cellW = mazeW / cols;
    const cellH = mazeH / rows;

    // 1. Draw Maze Vector Walls
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(lineWidth);
    doc.setLineCap(cornerStyle === 'rounded' ? 'round' : 'square');
    doc.setLineJoin(cornerStyle === 'rounded' ? 'round' : 'miter');

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = puzzle.grid[row][col];
        const cx = mazeX + col * cellW;
        const cy = mazeY + row * cellH;

        if (row === 0 && cell.topWall) doc.line(cx, cy, cx + cellW, cy);
        if (col === 0 && cell.leftWall) doc.line(cx, cy, cx, cy + cellH);
        if (cell.bottomWall) doc.line(cx, cy + cellH, cx + cellW, cy + cellH);
        if (cell.rightWall) doc.line(cx + cellW, cy, cx + cellW, cy + cellH);
      }
    }

    // 2. Draw Solution Path (Answer Mode)
    if (isAnsMode && puzzle.solutionPaths && puzzle.solutionPaths.length > 0) {
      const path = puzzle.solutionPaths[0]; // winning path
      if (path && path.length > 1) {
        doc.setDrawColor(225, 29, 72); // Rose-600
        doc.setLineWidth(1.2);
        (doc as any).setLineDashPattern?.([2.2, 1.4], 0);

        const startPt = path[0];
        const leadInX = mazeX - (isA5 ? 5 : 7);
        const leadInY = mazeY + (startPt.r + 0.5) * cellH;
        doc.line(leadInX, leadInY, mazeX + (startPt.c + 0.5) * cellW, mazeY + (startPt.r + 0.5) * cellH);

        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];
          doc.line(
            mazeX + (p1.c + 0.5) * cellW,
            mazeY + (p1.r + 0.5) * cellH,
            mazeX + (p2.c + 0.5) * cellW,
            mazeY + (p2.r + 0.5) * cellH
          );
        }

        const endPt = path[path.length - 1];
        let leadOutX = mazeX + (endPt.c + 0.5) * cellW;
        let leadOutY = mazeY + (endPt.r + 0.5) * cellH;
        if (endPt.r === 0) leadOutY = mazeY - 5;
        else if (endPt.r === rows - 1) leadOutY = mazeY + mazeH + 5;
        else leadOutX = mazeX + mazeW + 5;

        doc.line(mazeX + (endPt.c + 0.5) * cellW, mazeY + (endPt.r + 0.5) * cellH, leadOutX, leadOutY);
        (doc as any).setLineDashPattern?.([], 0);
      }
    }

    // 3. Left Column: Speech Bubble on top, Character + Name underneath, Hollow entrance arrow
    const bubbleText = options.sentenceStem || "There's a _____.";
    const bubW = leftColW - 4;
    const bubH = isA5 ? 11.5 : 13.5;
    const bubX = x + 2;
    const bubY = y + Math.max(2, (height - (bubH + 24)) * 0.22);

    const charCx = x + leftColW / 2;
    const charCy = bubY + bubH + 3.5 + 6.35; // 6.35 = half of 12.7mm (0.5 inch)

    // Speech bubble with pointer tail pointing directly to character head
    drawSpeechBubble(doc, bubX, bubY, bubW, bubH, charCx, charCy - 6.35, bubbleText, { r, g, b }, activeFont, isA5);

    // Entrance Character (strictly 12.7 x 12.7 mm = 0.5 x 0.5 inch)
    await drawMazeCharacter(doc, resolvedChar, charCx, charCy, 1.0, isA5, activeFont, options.fetchImageBase64);

    // Entrance Arrow: Hollow arrow pointing from character to maze entrance
    const startEntranceY = mazeY + (puzzle.startPoint.r + 0.5) * cellH;
    drawHollowArrow(
      doc,
      charCx + 7.5,
      startEntranceY,
      mazeX - 1.5,
      startEntranceY,
      { r, g, b },
      isA5 ? 2.8 : 3.4,
      1.2
    );

    // 4. Exits with Hollow Arrows and Destination Items (Primary Words only)
    for (let i = 0; i < puzzle.placedItems.length; i++) {
      const item = puzzle.placedItems[i];
      const exPt = item.point;
      const dir = (item as any).direction || (exPt.r === 0 ? 'top' : exPt.r === rows - 1 ? 'bottom' : 'right');

      let arrowStartX = 0, arrowStartY = 0, arrowEndX = 0, arrowEndY = 0;
      let spriteX = 0, spriteY = 0;
      let textX = 0, textY = 0;
      const spriteDim = isA5 ? 9.5 : 11.5;

      if (dir === 'top') {
        const doorX = mazeX + (exPt.c + 0.5) * cellW;
        arrowStartX = doorX;
        arrowStartY = mazeY - 0.5;
        arrowEndX = doorX;
        arrowEndY = mazeY - 4.5;

        spriteX = doorX - spriteDim / 2;
        spriteY = mazeY - 5.5 - spriteDim;
        textX = doorX;
        textY = spriteY - 1.2;
      } else if (dir === 'bottom') {
        const doorX = mazeX + (exPt.c + 0.5) * cellW;
        arrowStartX = doorX;
        arrowStartY = mazeY + mazeH + 0.5;
        arrowEndX = doorX;
        arrowEndY = mazeY + mazeH + 4.5;

        spriteX = doorX - spriteDim / 2;
        spriteY = mazeY + mazeH + 5.5;
        textX = doorX;
        textY = spriteY + spriteDim + 2.8;
      } else {
        // right
        const doorY = mazeY + (exPt.r + 0.5) * cellH;
        arrowStartX = mazeX + mazeW + 0.5;
        arrowStartY = doorY;
        arrowEndX = mazeX + mazeW + 4.5;
        arrowEndY = doorY;

        spriteX = mazeX + mazeW + 5.5;
        spriteY = doorY - spriteDim / 2 - 1.5;
        textX = spriteX + spriteDim / 2;
        textY = spriteY + spriteDim + 2.6;
      }

      // Draw Hollow Exit Arrow
      drawHollowArrow(doc, arrowStartX, arrowStartY, arrowEndX, arrowEndY, { r, g, b }, isA5 ? 2.6 : 3.2, 1.15);

      // Draw Destination Image
      let drawnImg = false;
      if (item.word.imageUrl && options.fetchImageBase64) {
        try {
          const imgBase64 = await options.fetchImageBase64(item.word.imageUrl);
          if (imgBase64) {
            internalSafeAddImage(doc, imgBase64, spriteX, spriteY, spriteDim, spriteDim);
            drawnImg = true;
          }
        } catch {
          // fallback
        }
      }

      // If no image, render fallback placeholder circle with initial
      if (!drawnImg) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(r, g, b);
        doc.setLineWidth(0.35);
        doc.circle(spriteX + spriteDim / 2, spriteY + spriteDim / 2, spriteDim / 2, 'FD');
      }

      // Destination Word Text
      doc.setFont(activeFont, 'bold');
      doc.setFontSize(isA5 ? 7.5 : 8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(item.word.term, textX, textY, { align: 'center' });
    }
  } else {
    // -------------------------------------------------------------
    // VARIANT 1: Single Goal ("Help [Character] find the [Word]")
    // Destination at Exit: primaryWords[0] (Image + Word text)
    // Both Entrance & Exit arrows are hollow to save ink
    // -------------------------------------------------------------
    const charColW = isA5 ? 24 : 30;
    const exitColW = isA5 ? 24 : 30;

    const mazeX = x + charColW + 2;
    const mazeY = y + 6;
    const mazeW = width - charColW - exitColW - 4;
    const mazeH = height - 12;

    const rows = puzzle.rows;
    const cols = puzzle.cols;
    const cellW = mazeW / cols;
    const cellH = mazeH / rows;

    // Walls
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(lineWidth);
    doc.setLineCap(cornerStyle === 'rounded' ? 'round' : 'square');
    doc.setLineJoin(cornerStyle === 'rounded' ? 'round' : 'miter');

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const cell = puzzle.grid[row][col];
        const cx = mazeX + col * cellW;
        const cy = mazeY + row * cellH;

        if (row === 0 && cell.topWall) doc.line(cx, cy, cx + cellW, cy);
        if (col === 0 && cell.leftWall) doc.line(cx, cy, cx, cy + cellH);
        if (cell.bottomWall) doc.line(cx, cy + cellH, cx + cellW, cy + cellH);
        if (cell.rightWall) doc.line(cx + cellW, cy, cx + cellW, cy + cellH);
      }
    }

    // Solution path
    if (isAnsMode && puzzle.solutionPaths && puzzle.solutionPaths.length > 0) {
      const path = puzzle.solutionPaths[0];
      if (path && path.length > 1) {
        doc.setDrawColor(225, 29, 72);
        doc.setLineWidth(1.2);
        (doc as any).setLineDashPattern?.([2.2, 1.4], 0);

        const startPt = path[0];
        const leadInX = mazeX - (isA5 ? 5 : 7);
        const leadInY = mazeY + (startPt.r + 0.5) * cellH;
        doc.line(leadInX, leadInY, mazeX + (startPt.c + 0.5) * cellW, mazeY + (startPt.r + 0.5) * cellH);

        for (let i = 0; i < path.length - 1; i++) {
          const p1 = path[i];
          const p2 = path[i + 1];
          doc.line(
            mazeX + (p1.c + 0.5) * cellW,
            mazeY + (p1.r + 0.5) * cellH,
            mazeX + (p2.c + 0.5) * cellW,
            mazeY + (p2.r + 0.5) * cellH
          );
        }

        const endPt = path[path.length - 1];
        doc.line(
          mazeX + (endPt.c + 0.5) * cellW,
          mazeY + (endPt.r + 0.5) * cellH,
          mazeX + mazeW + (isA5 ? 5 : 7),
          mazeY + (endPt.r + 0.5) * cellH
        );
        (doc as any).setLineDashPattern?.([], 0);
      }
    }

    // Character at entrance (12.7 x 12.7 mm = 0.5 x 0.5 inch)
    const startY = mazeY + (puzzle.startPoint.r + 0.5) * cellH;
    const charCx = x + charColW * 0.45;
    const charCy = startY;

    await drawMazeCharacter(doc, resolvedChar, charCx, charCy, 1.0, isA5, activeFont, options.fetchImageBase64);

    // Hollow entrance arrow
    drawHollowArrow(
      doc,
      charCx + 7.5,
      startY,
      mazeX - 1.5,
      startY,
      { r, g, b },
      isA5 ? 3.0 : 3.6,
      1.3
    );

    // Goal at Exit: primaryWords[0] (Image + Word label, NO 3D box/gift/etc.)
    const exitPt = puzzle.endPoints[0];
    const exitY = mazeY + (exitPt.r + 0.5) * cellH;
    const exitX = mazeX + mazeW;

    // Hollow exit arrow
    drawHollowArrow(
      doc,
      exitX + 1.5,
      exitY,
      exitX + (isA5 ? 6.5 : 8.5),
      exitY,
      { r, g, b },
      isA5 ? 3.0 : 3.6,
      1.3
    );

    // Destination Item (Goal Word from Primary Deck)
    const goalItem = puzzle.placedItems.find(item => item.isDestination) || puzzle.placedItems[0];
    const targetCx = exitX + (isA5 ? 16 : 20);
    const targetCy = exitY;
    const spriteDim = isA5 ? 12 : 15;

    let drawnGoalImg = false;
    if (goalItem && goalItem.word.imageUrl && options.fetchImageBase64) {
      try {
        const imgBase64 = await options.fetchImageBase64(goalItem.word.imageUrl);
        if (imgBase64) {
          internalSafeAddImage(doc, imgBase64, targetCx - spriteDim / 2, targetCy - spriteDim / 2 - 1.5, spriteDim, spriteDim);
          drawnGoalImg = true;
        }
      } catch {
        // fallback
      }
    }

    if (!drawnGoalImg) {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(r, g, b);
      doc.setLineWidth(0.3);
      doc.circle(targetCx, targetCy - 1.5, spriteDim / 2, 'FD');
    }

    if (goalItem) {
      doc.setFont(activeFont, 'bold');
      doc.setFontSize(isA5 ? 8 : 9.5);
      doc.setTextColor(30, 41, 59);
      doc.text(goalItem.word.term, targetCx, targetCy + spriteDim / 2 + 2.0, { align: 'center' });
    }

    // Inside-maze items (primary words on path, review words in dead-ends)
    const interiorItems = puzzle.placedItems.filter(item => !item.isDestination);
    for (const item of interiorItems) {
      const itemX = mazeX + (item.point.c + 0.5) * cellW;
      const itemY = mazeY + (item.point.r + 0.5) * cellH;
      const itemDim = Math.min(cellW, cellH) * 0.72;

      let drawnImage = false;
      if (item.word.imageUrl && options.fetchImageBase64) {
        try {
          const imgBase64 = await options.fetchImageBase64(item.word.imageUrl);
          if (imgBase64) {
            internalSafeAddImage(doc, imgBase64, itemX - itemDim / 2, itemY - itemDim / 2 - (isA5 ? 1.0 : 1.3), itemDim, itemDim);
            drawnImage = true;
          }
        } catch {
          // fallback
        }
      }

      if (isAnsMode && item.role === 'primary_path') {
        doc.setFont(activeFont, 'bold');
        doc.setFontSize(isA5 ? 7 : 8.5);
        const textW = doc.getTextWidth(item.word.term);
        const padX = 1.2;
        const textH = isA5 ? 3.0 : 3.6;
        const badgeY = itemY + (drawnImage ? (itemDim / 2 - 0.2) : -1.8);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(225, 29, 72);
        doc.setLineWidth(0.3);
        doc.roundedRect(itemX - textW / 2 - padX, badgeY, textW + padX * 2, textH, 0.7, 0.7, 'FD');
        doc.setTextColor(190, 18, 60);
      } else {
        doc.setFont(activeFont, 'bold');
        doc.setFontSize(isA5 ? 7 : 8.5);
        doc.setTextColor(71, 85, 105);
      }
      doc.text(item.word.term, itemX, itemY + (drawnImage ? (itemDim / 2 + 1.0) : 1.5), { align: 'center' });
    }
  }

  // Restore defaults
  doc.setDrawColor(0, 0, 0);
  doc.setTextColor(0, 0, 0);
  doc.setLineWidth(0.2);
}

