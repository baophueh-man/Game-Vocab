import assert from 'node:assert/strict';
import {
  reorderIndices,
  sortIndicesAlphabetically,
  shuffleWordIndices,
  resetIndicesToOriginal
} from './src/utils/worksheetVocabEngine';
import { shuffleArray, WorksheetWord } from './src/utils/worksheetGenerator';

const words: WorksheetWord[] = [
  { term: 'Zebra', definition: 'Ngựa vằn' },
  { term: 'apple', definition: 'Quả táo' },
  { term: 'Mango', definition: 'Quả xoài' },
  { term: 'banana', definition: 'Quả chuối' }
];

assert.deepEqual(sortIndicesAlphabetically([0, 1, 2, 3], words, 'asc'), [1, 3, 2, 0]);
assert.deepEqual(sortIndicesAlphabetically([0, 1, 2, 3], words, 'desc'), [0, 2, 3, 1]);
assert.deepEqual(reorderIndices([0, 1, 2, 3], 0, 3), [1, 2, 3, 0]);
assert.deepEqual(resetIndicesToOriginal([3, 1, 0, 2]), [0, 1, 2, 3]);
assert.deepEqual(shuffleWordIndices([0, 1, 2, 3]).slice().sort(), [0, 1, 2, 3]);

// Verify deterministic fallback when no seed is passed (Student vs Answer alignment)
const run1 = shuffleArray(words).map((w) => w.term);
const run2 = shuffleArray(words).map((w) => w.term);
assert.deepEqual(run1, run2);

console.log('PASS: vocab ordering & deterministic shuffleArray self-check');
process.exit(0);
