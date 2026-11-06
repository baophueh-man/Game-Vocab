import { WorksheetWord, WorksheetTypeMeta } from './worksheetGenerator';
import { UICompositeSection } from '../components/worksheet/CompositeSectionCard';

/**
 * Standard default titles mapping for all known Worksheet types.
 * Supports types 1 through 20+ with automatic fallback for newly added types.
 */
export const DEFAULT_SECTION_TITLES: Record<number, string> = {
  1: 'Reorder the words to make correct sentences',
  2: 'Write the words',
  3: 'Match picture with word',
  4: 'Missing letters',
  5: 'Look and read',
  6: 'Multiple choice',
  7: 'Unscramble letters',
  8: 'Look and trace',
  9: 'Look and color Yes or No',
  10: 'Look and color',
  11: 'Write and circle the correct picture.',
  12: 'Look and write',
  13: 'Word Search Puzzle',
  14: 'Circle the pictures that have letter V',
  15: 'Read the sentence and circle the correct picture.',
  16: 'Look and circle the beginning sound',
  17: 'Look and color the words',
  18: 'Color E green and e red',
  19: 'Game: Find and say.',
  20: 'Criss-Cross Words'
};

/**
 * Generates a unique, collision-resistant identifier for a composite section.
 */
export function generateSectionId(): string {
  return `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Factory function creating a properly configured UICompositeSection for a given WorksheetType.
 * Is completely non-destructive and independent of other worksheet types.
 */
export function createSectionForType(
  type: number,
  words: WorksheetWord[] = [],
  orderIndex: number = 0,
  allTypes?: WorksheetTypeMeta[]
): UICompositeSection {
  const typeNum = Number(type);
  const matchedMeta = allTypes?.find((t) => t.type === typeNum);
  const title =
    DEFAULT_SECTION_TITLES[typeNum] ||
    matchedMeta?.name ||
    `Worksheet Section ${typeNum}`;

  const isType8 = typeNum === 8;
  const isType11 = typeNum === 11;
  const isType5 = typeNum === 5;

  const section: UICompositeSection = {
    id: generateSectionId(),
    type: typeNum as any,
    title,
    targetWordCount: words && words.length > 0 ? Math.min(4, words.length) : 4,
    selectedWordIndices: words && words.length > 0 ? words.map((_, i) => i) : [],
    pageBreakBefore: false,
    fontFamily: (isType8 || isType11) ? 'KG Primary Dots' : (isType5 ? 'HP001' : 'r0c0i Linotte'),
    fontSize: (isType8 || isType11) ? 22 : 12,
    spacing: 0,
    imageSize: 12.7,
    blankMode: typeNum === 4 ? 'vowels' : undefined,
    choiceCount: typeNum === 6 ? 3 : undefined,
    choiceLayout: typeNum === 6 ? 'vertical' : undefined,
    matchMode: typeNum === 3 ? 'word' : undefined,
    matchHint: typeNum === 3 ? 'none' : undefined,
    wordsearchDirections: typeNum === 13 ? ['horizontal', 'vertical', 'diagonalDown'] : undefined,
    wordsearchHintType: typeNum === 13 ? 'word' : undefined,
    wordsearchCase: typeNum === 13 ? 'lower' : undefined,
    targetLetter: typeNum === 14 ? 'V' : undefined,
    type15Border: typeNum === 15 ? 'full' : undefined,
    type15ChoiceMode: typeNum === 15 ? 'ab' : undefined,
    type15Seed: typeNum === 15 ? Date.now() : undefined,
    type16SoundMode: typeNum === 16 ? 'beginning' : undefined,
    type16ChoiceCount: typeNum === 16 ? 3 : undefined,
    type17TaskMode: typeNum === 17 ? 'color' : undefined,
    type17Border: typeNum === 17 ? 'full' : undefined,
    type18TargetLetter: typeNum === 18 ? 'E' : undefined,
    type18Mode: typeNum === 18 ? 'both' : undefined,
    type18ColorUpper: typeNum === 18 ? 'green' : undefined,
    type18ColorLower: typeNum === 18 ? 'red' : undefined,
    type19MazeMode: typeNum === 19 ? 'single_goal' : undefined,
    type20HintMode: typeNum === 20 ? 'all_blank' : undefined,
    type20GridMode: typeNum === 20 ? 'connected' : undefined,
    type20HollowArrows: typeNum === 20 ? true : undefined,
    type20ShowClueNumber: typeNum === 20 ? false : undefined
  };

  return section;
}

/**
 * Creates a complete list of UICompositeSection items, one for each available worksheet type.
 * Ensures dynamic discovery from the provided types list without hardcoding.
 */
export function createAllWorksheetSections(
  availableTypes: WorksheetTypeMeta[],
  words: WorksheetWord[] = []
): UICompositeSection[] {
  if (!availableTypes || availableTypes.length === 0) {
    return [];
  }

  // Filter out Type 5 (handwriting ô ly) as per composite worksheet standard
  const validTypes = availableTypes.filter((t) => t.type !== 5);

  return validTypes.map((meta, index) =>
    createSectionForType(meta.type, words, index, validTypes)
  );
}

/**
 * Appends all available worksheet types to an existing list of composite sections.
 * Guarantees zero side-effects on existing sections.
 */
export function appendAllWorksheetSections(
  currentSections: UICompositeSection[],
  availableTypes: WorksheetTypeMeta[],
  words: WorksheetWord[] = []
): UICompositeSection[] {
  const newSections = createAllWorksheetSections(availableTypes, words);
  return [...(currentSections || []), ...newSections];
}
