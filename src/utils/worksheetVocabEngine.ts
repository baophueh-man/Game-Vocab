import { Word, WordSet } from '../types';
import { WorksheetWord } from './worksheetGenerator';
import { getImageFile } from '../lib/storage';
import { UICompositeSection } from '../components/worksheet/CompositeSectionCard';
import { WorksheetTemplate } from './worksheetTemplates';
import { generateId } from '../lib/utils';

export type DeckPickMode = 'full' | 'random';
export type SectionApplyMode = 'replace' | 'append';

export interface DeckPickConfig {
  deckId: string;
  deckTitle: string;
  mode: DeckPickMode;
  randomCount: number;
  selected?: boolean;
  setId?: string;
}

/**
 * Normalizes vocabulary term for case-insensitive and trimmed comparisons.
 */
export function normalizeTerm(term: string): string {
  if (!term) return '';
  return term.trim().toLowerCase();
}

/**
 * Deduplicates an array of WorksheetWord items by normalized term and id.
 * Pure non-mutating function: preserves the first occurrence of each unique term/id,
 * merging missing fields (exampleSentence, imageUrl, definition, phonetic) from subsequent occurrences.
 */
// [FEATURE-MAP: ID-01] Core Worksheet Vocab Engine - deduplicateWords with field merging
export function deduplicateWords(words: WorksheetWord[]): WorksheetWord[] {
  if (!words || !Array.isArray(words)) return [];

  const termToIdx = new Map<string, number>();
  const idToIdx = new Map<string, number>();
  const result: WorksheetWord[] = [];

  for (const w of words) {
    if (!w) continue;
    const termNorm = normalizeTerm(w.term);
    const id = w.id;

    let existingIdx = -1;
    if (termNorm && termToIdx.has(termNorm)) {
      existingIdx = termToIdx.get(termNorm)!;
    } else if (id && idToIdx.has(id)) {
      existingIdx = idToIdx.get(id)!;
    }

    if (existingIdx !== -1) {
      const existing = result[existingIdx];
      const incomingSentence = (w.exampleSentence || (w as any).sentence || (w as any).example || (w as any).contextSentence || '').trim();
      const existingSentence = (existing.exampleSentence || '').trim();
      const mergedSentence = existingSentence || incomingSentence || undefined;

      const incomingImage = (w.imageUrl || '').trim();
      const existingImage = (existing.imageUrl || '').trim();
      const mergedImage = existingImage || incomingImage || undefined;

      const incomingDef = (w.definition || (w as any).meaning || '').trim();
      const existingDef = (existing.definition || '').trim();
      const mergedDef = existingDef || incomingDef || undefined;

      const incomingPhonetic = (w.phonetic || '').trim();
      const existingPhonetic = (existing.phonetic || '').trim();
      const mergedPhonetic = existingPhonetic || incomingPhonetic || undefined;

      result[existingIdx] = {
        ...existing,
        exampleSentence: mergedSentence,
        imageUrl: mergedImage,
        definition: mergedDef,
        phonetic: mergedPhonetic
      };

      if (id && !idToIdx.has(id)) {
        idToIdx.set(id, existingIdx);
      }
      if (termNorm && !termToIdx.has(termNorm)) {
        termToIdx.set(termNorm, existingIdx);
      }
      continue;
    }

    const newIdx = result.length;
    if (id) idToIdx.set(id, newIdx);
    if (termNorm) termToIdx.set(termNorm, newIdx);
    result.push({
      ...w,
      exampleSentence: (w.exampleSentence || (w as any).sentence || (w as any).example || (w as any).contextSentence || '').trim() || undefined
    });
  }

  return result;
}

/**
 * Partial Fisher-Yates shuffle algorithm to pick N random items uniformly.
 * Pure non-mutating function: does not alter the input array.
 */
export function pickRandomWords<T>(items: T[], count: number): T[] {
  if (!items || items.length === 0 || count <= 0) return [];
  if (count >= items.length) {
    return [...items];
  }

  const pool = [...items];
  const picked: T[] = [];
  const limit = Math.min(count, pool.length);

  for (let i = 0; i < limit; i++) {
    const randomIndex = Math.floor(Math.random() * (pool.length - i)) + i;
    const temp = pool[i];
    pool[i] = pool[randomIndex];
    pool[randomIndex] = temp;
    picked.push(pool[i]);
  }

  return picked;
}

/**
 * Resolves a Word from a WordSet into a WorksheetWord, including firestore image pointers.
 */
export async function mapWordToWorksheetWord(
  word: Word,
  deckId?: string,
  deckTitle?: string,
  deckRole?: 'primary' | 'review'
): Promise<WorksheetWord> {
  let img = word.imageUrl;
  if (img && img.startsWith('firestore://')) {
    const imgId = img.split('/').pop();
    if (imgId) {
      try {
        const cached = await getImageFile(imgId);
        if (cached) img = cached;
      } catch (e) {
        console.warn(`[worksheetVocabEngine] Failed to resolve image ${imgId}:`, e);
      }
    }
  }

  const rawSentence = (
    word.exampleSentence ||
    (word as any).sentence ||
    (word as any).example ||
    (word as any).contextSentence ||
    ''
  ).trim();

  return {
    id: word.id,
    term: word.term,
    definition: word.definition,
    phonetic: word.phonetic || '',
    imageUrl: img,
    exampleSentence: rawSentence || undefined,
    sourceDeckId: deckId,
    sourceDeckTitle: deckTitle,
    deckRole: deckRole
  };
}

/**
 * Maps an entire WordSet to WorksheetWord[], tagging all words with source deck metadata.
 */
export async function mapWordSetToWorksheetWords(
  set: WordSet,
  deckRole?: 'primary' | 'review'
): Promise<WorksheetWord[]> {
  if (!set || !Array.isArray(set.words)) return [];
  return Promise.all(set.words.map((w) => mapWordToWorksheetWord(w, set.id, set.title, deckRole)));
}

/**
 * Loads words from multiple WordSets in parallel, flattening into a combined pool.
 * Orders primary deck first and tags words with 'primary' or 'review' role.
 */
export async function loadFromMultipleWordSets(
  sets: WordSet[],
  primaryDeckId?: string
): Promise<WorksheetWord[]> {
  if (!sets || sets.length === 0) return [];

  // Determine effective primary deck ID (matching primaryDeckId or defaulting to first set)
  const effectivePrimaryId = (primaryDeckId && sets.some((s) => s.id === primaryDeckId))
    ? primaryDeckId
    : sets[0]?.id;

  // Stable sort so that the primary deck is strictly first in the list
  const sortedSets = [...sets].sort((a, b) => {
    if (a.id === effectivePrimaryId) return -1;
    if (b.id === effectivePrimaryId) return 1;
    return 0;
  });

  const nested = await Promise.all(
    sortedSets.map((s, index) => {
      const role: 'primary' | 'review' = (s.id === effectivePrimaryId || index === 0) ? 'primary' : 'review';
      return mapWordSetToWorksheetWords(s, role);
    })
  );
  return nested.flat();
}

/**
 * Samples vocabulary words based on per-deck configurations (Full vs Random N).
 * Resolves images asynchronously and returns deduplicated results.
 */
export async function sampleFromDeckConfigs(
  configs: DeckPickConfig[],
  allSets: WordSet[]
): Promise<WorksheetWord[]> {
  if (!configs || configs.length === 0 || !allSets || allSets.length === 0) {
    return [];
  }

  const activeConfigs = configs.filter((c) => c.selected !== false);
  const pickedWords: WorksheetWord[] = [];

  for (const cfg of activeConfigs) {
    const targetId = cfg.deckId || cfg.setId;
    const targetSet = allSets.find((s) => s.id === targetId);
    if (!targetSet || !Array.isArray(targetSet.words) || targetSet.words.length === 0) {
      continue;
    }

    let chosenRawWords: Word[] = [];
    if (cfg.mode === 'full') {
      chosenRawWords = [...targetSet.words];
    } else {
      const count = Math.min(Math.max(1, cfg.randomCount || 1), targetSet.words.length);
      chosenRawWords = pickRandomWords(targetSet.words, count);
    }

    const deckTitle = cfg.deckTitle || targetSet.title;
    const resolved = await Promise.all(
      chosenRawWords.map((w) => mapWordToWorksheetWord(w, targetSet.id, deckTitle))
    );

    pickedWords.push(...resolved);
  }

  return deduplicateWords(pickedWords);
}

/**
 * Merges newly picked words into a section's existing word list.
 * In 'replace' mode: returns deduplicated incoming words.
 * In 'append' mode: returns deduplicated existing + incoming words.
 */
export function mergeSectionWords(
  existing: WorksheetWord[],
  incoming: WorksheetWord[],
  mode: SectionApplyMode | 'replace' | 'append'
): WorksheetWord[] {
  if (mode === 'replace') {
    return deduplicateWords(incoming || []);
  }
  return deduplicateWords([...(existing || []), ...(incoming || [])]);
}

/**
 * Quota-Aware Randomization:
 * Selects word indices honoring role quotas (primaryCount from primary deck,
 * reviewCount from review decks with round-robin cross-deck distribution).
 * Guarantees zero out-of-bounds or undefined indices via resilient modulo fallback.
 */
export function pickQuotaAwareRandomWordIndices(
  words: WorksheetWord[],
  primaryCount: number,
  reviewCount: number
): number[] {
  if (!words || !Array.isArray(words) || words.length === 0) {
    return [];
  }

  const pTarget = Math.max(0, Math.floor(primaryCount || 0));
  const rTarget = Math.max(0, Math.floor(reviewCount || 0));

  if (pTarget === 0 && rTarget === 0) {
    return [];
  }

  const shuffle = <T>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  // Partition word indices into primary and review pools
  const primaryIndices: number[] = [];
  const reviewIndices: number[] = [];
  const reviewDecksMap = new Map<string, number[]>();

  words.forEach((w, idx) => {
    if (w && w.deckRole === 'review') {
      reviewIndices.push(idx);
      const deckKey = w.sourceDeckId || w.sourceDeckTitle || '__review__';
      if (!reviewDecksMap.has(deckKey)) {
        reviewDecksMap.set(deckKey, []);
      }
      reviewDecksMap.get(deckKey)!.push(idx);
    } else {
      primaryIndices.push(idx);
    }
  });

  // 1. Pick Primary Words
  const pickedPrimary: number[] = [];
  if (pTarget > 0) {
    if (primaryIndices.length > 0) {
      const shuffledPrimary = shuffle(primaryIndices);
      for (let i = 0; i < pTarget; i++) {
        pickedPrimary.push(shuffledPrimary[i % shuffledPrimary.length]);
      }
    } else if (reviewIndices.length > 0) {
      // Fallback to review words if primary pool is empty
      const shuffledFallback = shuffle(reviewIndices);
      for (let i = 0; i < pTarget; i++) {
        pickedPrimary.push(shuffledFallback[i % shuffledFallback.length]);
      }
    }
  }

  // 2. Pick Review Words
  const pickedReview: number[] = [];
  if (rTarget > 0) {
    if (reviewIndices.length > 0 && reviewDecksMap.size > 0) {
      // Group reviewIndices by sourceDeckId and round-robin sample across review decks
      const deckKeys = shuffle(Array.from(reviewDecksMap.keys()));
      const shuffledDecks = deckKeys.map((k) => shuffle(reviewDecksMap.get(k)!));

      const roundRobinPool: number[] = [];
      const maxLen = Math.max(...shuffledDecks.map((d) => d.length));
      for (let step = 0; step < maxLen; step++) {
        for (const deckWords of shuffledDecks) {
          if (step < deckWords.length) {
            roundRobinPool.push(deckWords[step]);
          }
        }
      }

      if (roundRobinPool.length > 0) {
        for (let i = 0; i < rTarget; i++) {
          pickedReview.push(roundRobinPool[i % roundRobinPool.length]);
        }
      }
    } else {
      // Fallback: If reviewIndices is empty, draw from primaryIndices
      if (primaryIndices.length > 0) {
        const shuffledFallback = shuffle(primaryIndices);
        for (let i = 0; i < rTarget; i++) {
          pickedReview.push(shuffledFallback[(pickedPrimary.length + i) % shuffledFallback.length]);
        }
      }
    }
  }

  return [...pickedPrimary, ...pickedReview];
}

/**
 * Smart Word Allocation Engine: Allocates word count slots across composite sections.
 * Guarantees a sequential, non-overlapping partition when the pool has enough words.
 * Gracefully wraps around via modulo when totalWords < totalSlots so each section
 * gets its designated count of valid words without out-of-bound errors.
 */
export function allocateWordSlotsToSections(
  targetCounts: number[],
  totalWords: number
): number[][] {
  if (totalWords <= 0 || !targetCounts || targetCounts.length === 0) {
    return (targetCounts || []).map(() => []);
  }

  const result: number[][] = [];
  let poolCursor = 0;

  for (const rawCount of targetCounts) {
    const slotCount = Math.max(0, Math.floor(rawCount || 0));
    const sectionIndices: number[] = [];

    for (let i = 0; i < slotCount; i++) {
      const wordIdx = (poolCursor + i) % totalWords;
      sectionIndices.push(wordIdx);
    }

    result.push(sectionIndices);
    poolCursor = (poolCursor + slotCount) % totalWords;
  }

  return result;
}

/**
 * Re-evaluates and updates selectedWordIndices for existing composite sections
 * when a new word bank is loaded, respecting each section's targetWordCount.
 * Preserves all section configurations (type, title, instructions, styling, layout).
 */
export function reallocateWordsForSections(
  sections: UICompositeSection[],
  availableWords: WorksheetWord[]
): UICompositeSection[] {
  if (!sections || !Array.isArray(sections) || sections.length === 0) {
    return [];
  }

  const totalWords = availableWords ? availableWords.length : 0;
  if (totalWords === 0) {
    return sections.map((sec) => ({
      ...sec,
      selectedWordIndices: []
    }));
  }

  const hasReviewWords = availableWords.some((w) => w && w.deckRole === 'review');

  const targetCounts = sections.map((sec) => {
    if (sec.primaryWordCount !== undefined && sec.reviewWordCount !== undefined) {
      return sec.primaryWordCount + sec.reviewWordCount;
    }
    if (sec.targetWordCount !== undefined && sec.targetWordCount > 0) {
      return sec.targetWordCount;
    }
    if (sec.selectedWordIndices && sec.selectedWordIndices.length > 0) {
      return sec.selectedWordIndices.length;
    }
    return 4;
  });

  const allocated = allocateWordSlotsToSections(targetCounts, totalWords);

  return sections.map((sec, idx) => {
    let selectedIndices: number[];
    let targetCount = targetCounts[idx];

    if (
      sec.primaryWordCount !== undefined &&
      sec.reviewWordCount !== undefined &&
      hasReviewWords
    ) {
      selectedIndices = pickQuotaAwareRandomWordIndices(
        availableWords,
        sec.primaryWordCount,
        sec.reviewWordCount
      );
      targetCount = sec.primaryWordCount + sec.reviewWordCount;
    } else {
      selectedIndices = allocated[idx] || [];
    }

    if (sec.type === 14 && sec.targetLetterMode !== 'manual') {
      const secWords = selectedIndices.map((i) => availableWords[i]).filter(Boolean);
      const autoLetter = getMostFrequentLetter(secWords, sec.targetLetter || 'V');
      return {
        ...sec,
        targetWordCount: targetCount,
        selectedWordIndices: selectedIndices,
        targetLetter: autoLetter,
        targetLetterMode: 'auto',
        title: `Circle the pictures that have letter ${autoLetter}`
      };
    }

    return {
      ...sec,
      targetWordCount: targetCount,
      selectedWordIndices: selectedIndices
    };
  });
}

/**
 * Converts template sections into UICompositeSection[] with allocated words
 * and freshly generated unique IDs (id: generateId()).
 */
export function applyTemplateToSections(
  template: WorksheetTemplate,
  availableWords: WorksheetWord[]
): UICompositeSection[] {
  if (!template || !template.sections || !Array.isArray(template.sections) || template.sections.length === 0) {
    return [];
  }

  const totalWords = availableWords ? availableWords.length : 0;
  const hasReviewWords = totalWords > 0 && availableWords.some((w) => w && w.deckRole === 'review');

  const targetCounts = template.sections.map((ts) => {
    if (ts.primaryWordCount !== undefined && ts.reviewWordCount !== undefined) {
      return ts.primaryWordCount + ts.reviewWordCount;
    }
    return Math.max(1, ts.wordCount || (ts as any).targetWordCount || 4);
  });

  const allocated = allocateWordSlotsToSections(targetCounts, totalWords);

  return template.sections.map((ts, idx) => {
    let selectedIndices: number[] | undefined;

    // 1. If template section has explicit selectedWordIndices, check if terms match
    if (ts.selectedWordIndices && Array.isArray(ts.selectedWordIndices) && ts.selectedWordIndices.length > 0 && totalWords > 0) {
      const valid = ts.selectedWordIndices.filter((i) => typeof i === 'number' && i >= 0 && i < totalWords);
      if (valid.length > 0) {
        if (ts.selectedWordTerms && Array.isArray(ts.selectedWordTerms) && ts.selectedWordTerms.length > 0) {
          // Verify if terms at these indices still match the saved terms
          const currentTerms = valid.map((i) => normalizeTerm(availableWords[i]?.term)).filter(Boolean);
          const expectedTerms = ts.selectedWordTerms.map((t) => normalizeTerm(t));
          const allMatch = currentTerms.length === expectedTerms.length && currentTerms.every((t, idx) => t === expectedTerms[idx]);
          if (allMatch) {
            selectedIndices = valid;
          }
        } else {
          selectedIndices = valid;
        }
      }
    }

    // 2. If not matched by index (e.g. deck was shuffled or re-ordered), match by selectedWordTerms
    if (
      (!selectedIndices || selectedIndices.length === 0) &&
      ts.selectedWordTerms &&
      Array.isArray(ts.selectedWordTerms) &&
      ts.selectedWordTerms.length > 0 &&
      totalWords > 0
    ) {
      const matched: number[] = [];
      for (const term of ts.selectedWordTerms) {
        const norm = normalizeTerm(term);
        const found = availableWords.findIndex((w, i) => !matched.includes(i) && normalizeTerm(w.term) === norm);
        if (found !== -1) {
          matched.push(found);
        }
      }
      if (matched.length > 0) {
        selectedIndices = matched;
      }
    }

    // 3. Fallback to quota-aware randomization or sequential modulo allocation only if no specific selection was stored
    if (!selectedIndices || selectedIndices.length === 0) {
      if (
        ts.primaryWordCount !== undefined &&
        ts.reviewWordCount !== undefined &&
        hasReviewWords
      ) {
        selectedIndices = pickQuotaAwareRandomWordIndices(
          availableWords,
          ts.primaryWordCount,
          ts.reviewWordCount
        );
      } else {
        selectedIndices = allocated[idx] || [];
      }
    }

    const finalTargetCount = (selectedIndices && selectedIndices.length > 0)
      ? selectedIndices.length
      : targetCounts[idx];

    const secWords = (selectedIndices || []).map((i) => availableWords[i]).filter(Boolean);
    const isAutoType14 = ts.type === 14 && ts.targetLetterMode !== 'manual';
    const resolvedTargetLetter = isAutoType14
      ? getMostFrequentLetter(secWords, ts.targetLetter || 'V')
      : ts.targetLetter;
    const resolvedTitle = isAutoType14
      ? `Circle the pictures that have letter ${resolvedTargetLetter}`
      : ts.title;

    return {
      ...ts,
      id: generateId(),
      type: ts.type,
      title: resolvedTitle,
      instruction: ts.instruction,
      targetWordCount: finalTargetCount,
      primaryWordCount: ts.primaryWordCount,
      reviewWordCount: ts.reviewWordCount,
      selectedWordIndices: selectedIndices || [],
      blankMode: ts.blankMode,
      type4LayoutMode: ts.type4LayoutMode,
      type4ColumnMode: ts.type4ColumnMode,
      type4TraceFontSize: ts.type4TraceFontSize,
      type4AlphabetTargetLetter: ts.type4AlphabetTargetLetter,
      pageBreakBefore: ts.pageBreakBefore,
      fontSize: ts.fontSize,
      fontFamily: ts.fontFamily,
      spacing: ts.spacing,
      imageSize: ts.imageSize,
      choiceCount: ts.choiceCount,
      choiceLayout: ts.choiceLayout,
      matchMode: ts.matchMode,
      matchHint: ts.matchHint,
      lookMatchWriteShuffleSuffix: ts.lookMatchWriteShuffleSuffix,
      lookMatchWriteMode: ts.lookMatchWriteMode,
      lookMatchWriteShowBaseline: ts.lookMatchWriteShowBaseline,
      lookMatchWriteTraceFontSize: ts.lookMatchWriteTraceFontSize,
      wordsearchDirections: ts.wordsearchDirections,
      wordsearchHintType: ts.wordsearchHintType,
      wordsearchGridSize: ts.wordsearchGridSize,
      wordsearchGridBorder: ts.wordsearchGridBorder,
      wordsearchCase: ts.wordsearchCase,
      wordsearchSeed: ts.wordsearchSeed,
      type3Seed: ts.type3Seed,
      type6Seed: ts.type6Seed,
      targetLetter: resolvedTargetLetter,
      targetLetterMode: isAutoType14 ? 'auto' : ts.targetLetterMode,
      showWordLabels: ts.showWordLabels,
      sentenceScramble: ts.sentenceScramble,
      sentenceSeparator: ts.sentenceSeparator,
      sentenceHintStyle: ts.sentenceHintStyle,
      sentenceTraceFontSize: ts.sentenceTraceFontSize,
      type15NumberStyle: ts.type15NumberStyle,
      type15Border: ts.type15Border,
      type15ChoiceMode: ts.type15ChoiceMode,
      type15LetterBandBg: ts.type15LetterBandBg,
      type16SoundMode: ts.type16SoundMode,
      type16ChoiceCount: ts.type16ChoiceCount,
      type16Layout: ts.type16Layout,
      type16LetterCase: ts.type16LetterCase,
      type16Border: ts.type16Border,
      type17TaskMode: ts.type17TaskMode,
      type17Border: ts.type17Border,
      type17CardBorder: ts.type17CardBorder,
      type17LetterCase: ts.type17LetterCase,
      type17StripLength: ts.type17StripLength,
      type17HighlightTarget: ts.type17HighlightTarget,
      type17ShowExample: ts.type17ShowExample,
      type18TargetLetter: ts.type18TargetLetter,
      type18Mode: ts.type18Mode,
      type18ColorUpper: ts.type18ColorUpper,
      type18ColorLower: ts.type18ColorLower,
      type18GridRows: ts.type18GridRows,
      type18GridCols: ts.type18GridCols,
      type18Border: ts.type18Border,
      type18CircleStyle: ts.type18CircleStyle,
      type18DistractorCasing: ts.type18DistractorCasing,
      type18HighlightTarget: ts.type18HighlightTarget,
      type19MazeMode: ts.type19MazeMode,
      type19WallColor: ts.type19WallColor,
      type19EntranceCharacter: ts.type19EntranceCharacter,
      type19TargetItem: ts.type19TargetItem,
      type19SentenceStem: ts.type19SentenceStem,
      type19CornerStyle: ts.type19CornerStyle,
      type19WallThickness: ts.type19WallThickness,
      type19MazeSeed: ts.type19MazeSeed,
      type19HintMode: ts.type19HintMode,
      type19GridBorder: ts.type19GridBorder,
      type19LineStyle: ts.type19LineStyle,
      type19BorderColor: ts.type19BorderColor,
      type19PuzzlesPerPage: ts.type19PuzzlesPerPage,
      type19Casing: ts.type19Casing,
      type19ShowClueImage: ts.type19ShowClueImage,
      type19ShowClueNumber: ts.type19ShowClueNumber,
      type19ShowClueText: ts.type19ShowClueText,
      type19ShowTrace: ts.type19ShowTrace,
      type20HintMode: ts.type20HintMode,
      type20GridBorder: ts.type20GridBorder,
      type20LineStyle: ts.type20LineStyle,
      type20BorderColor: ts.type20BorderColor,
      type20PuzzlesPerPage: ts.type20PuzzlesPerPage,
      type20Casing: ts.type20Casing,
      type20ShowClueImage: ts.type20ShowClueImage,
      type20ShowClueNumber: ts.type20ShowClueNumber,
      type20ShowClueText: ts.type20ShowClueText,
      type20ShowTrace: ts.type20ShowTrace,
      type20GridMode: ts.type20GridMode,
      type20HollowArrows: ts.type20HollowArrows,
      type20ClueColumns: ts.type20ClueColumns,
      type19CellSize: ts.type19CellSize,
      answerMode: ts.answerMode
    };
  });
}

/**
 * Reorders an array by shifting an item from fromIndex to toIndex.
 * Pure non-mutating function.
 */
export function reorderIndices(indices: number[], fromIndex: number, toIndex: number): number[] {
  if (!indices || fromIndex < 0 || toIndex < 0 || fromIndex >= indices.length || toIndex >= indices.length || fromIndex === toIndex) {
    return indices || [];
  }
  const result = [...indices];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * Sorts an array of word indices alphabetically based on the underlying words' terms.
 * Pure non-mutating function.
 */
export function sortIndicesAlphabetically(
  indices: number[],
  words: WorksheetWord[],
  direction: 'asc' | 'desc' = 'asc'
): number[] {
  if (!indices || indices.length === 0 || !words || words.length === 0) return indices || [];
  const result = [...indices];
  return result.sort((a, b) => {
    const termA = normalizeTerm(words[a]?.term || '');
    const termB = normalizeTerm(words[b]?.term || '');
    return direction === 'asc' ? termA.localeCompare(termB) : termB.localeCompare(termA);
  });
}

/**
 * Shuffles an array of word indices randomly (Fisher-Yates).
 * Pure non-mutating function.
 */
export function shuffleWordIndices(indices: number[]): number[] {
  if (!indices || indices.length <= 1) return [...(indices || [])];
  const pool = [...indices];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool;
}

/**
 * Resets word indices back to the original index order (numeric ascending).
 * Pure non-mutating function.
 */
export function resetIndicesToOriginal(indices: number[]): number[] {
  if (!indices) return [];
  return [...indices].sort((a, b) => a - b);
}

export interface LetterFrequencyStat {
  letter: string;     // Uppercase 'A' - 'Z'
  wordCount: number;  // Number of words containing this letter
  charCount: number;  // Total character occurrences across all words
}

/**
 * Computes frequency stats for English A-Z letters across vocabulary terms.
 * Sorted by wordCount (descending), then charCount (descending), then alphabetical (ascending).
 * ponytail: filters standard Latin a-z only; upgrade to accented letters if bilingual phonics needed.
 */
export function getLetterFrequencyStats(
  words: (WorksheetWord | { term: string } | string)[]
): LetterFrequencyStat[] {
  if (!words || !Array.isArray(words) || words.length === 0) {
    return [];
  }

  const wordCounts: Record<string, number> = {};
  const charCounts: Record<string, number> = {};

  for (const item of words) {
    if (!item) continue;
    const term = typeof item === 'string' ? item : (item.term || '');
    const clean = term.toLowerCase();
    const seenInWord = new Set<string>();

    for (const ch of clean) {
      if (ch >= 'a' && ch <= 'z') {
        charCounts[ch] = (charCounts[ch] || 0) + 1;
        if (!seenInWord.has(ch)) {
          seenInWord.add(ch);
          wordCounts[ch] = (wordCounts[ch] || 0) + 1;
        }
      }
    }
  }

  const stats: LetterFrequencyStat[] = [];
  for (let i = 0; i < 26; i++) {
    const ch = String.fromCharCode(97 + i); // 'a' to 'z'
    const wCount = wordCounts[ch] || 0;
    const cCount = charCounts[ch] || 0;
    if (wCount > 0) {
      stats.push({
        letter: ch.toUpperCase(),
        wordCount: wCount,
        charCount: cCount
      });
    }
  }

  stats.sort((a, b) => {
    if (b.wordCount !== a.wordCount) return b.wordCount - a.wordCount;
    if (b.charCount !== a.charCount) return b.charCount - a.charCount;
    return a.letter.localeCompare(b.letter);
  });

  return stats;
}

/**
 * Returns the single most frequent letter from a word list according to Hybrid Word-Coverage.
 * Fallbacks to 'V' if the word list is empty or has no Latin alphabetic characters.
 */
export function getMostFrequentLetter(
  words: (WorksheetWord | { term: string } | string)[],
  fallback: string = 'V'
): string {
  const stats = getLetterFrequencyStats(words);
  if (stats.length > 0 && stats[0].wordCount > 0) {
    return stats[0].letter;
  }
  return fallback;
}

