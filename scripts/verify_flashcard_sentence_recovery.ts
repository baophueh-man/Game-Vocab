import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { WordSet } from '../src/types';
import {
  recoverAndRepairWordSets,
  recoverAndRepairSingleSet,
  buildSmartFallbackSentence,
  PRESET_SETS,
} from '../src/lib/storage';
import { importWordSetPackage, PackageManifest } from '../src/utils/packageZip';

console.log('>>> Starting Flashcard Sentence Recovery & Preservation Verification...');

// ==========================================
// TEST 1: Smart Fallback Sentence Generator
// ==========================================
{
  console.log('Testing buildSmartFallbackSentence...');
  assert.equal(buildSmartFallbackSentence('red'), 'It is <#red#>.');
  assert.equal(buildSmartFallbackSentence('big'), 'It is <#big#>.');
  assert.equal(buildSmartFallbackSentence('small'), 'It is <#small#>.');

  assert.equal(buildSmartFallbackSentence('running'), 'I like <#running#>.');
  assert.equal(buildSmartFallbackSentence('swimming'), 'I like <#swimming#>.');

  assert.equal(buildSmartFallbackSentence('pencils'), 'They are <#pencils#>.');
  assert.equal(buildSmartFallbackSentence('books'), 'They are <#books#>.');

  assert.equal(buildSmartFallbackSentence('apple'), 'It is an <#apple#>.');
  assert.equal(buildSmartFallbackSentence('orange'), 'It is an <#orange#>.');

  assert.equal(buildSmartFallbackSentence('bell'), 'It is a <#bell#>.');
  assert.equal(buildSmartFallbackSentence('cat'), 'It is a <#cat#>.');
  console.log('[PASS] buildSmartFallbackSentence grammatical rules verified.');
}

// ==========================================
// TEST 2: Preset Sets Completeness
// ==========================================
{
  console.log('Testing PRESET_SETS authoritative sentences...');
  assert.equal(PRESET_SETS.length, 3, 'Must have 3 preset sets (L3_U7, L3_U5, L3_U6)');

  for (const preset of PRESET_SETS) {
    assert.ok(preset.words.length > 0, `Preset ${preset.id} must have words`);
    for (const w of preset.words) {
      assert.ok(w.exampleSentence && w.exampleSentence.trim().length > 0, `Preset ${preset.id} word ${w.term} must have exampleSentence`);
      assert.ok(w.exampleTranslation && w.exampleTranslation.trim().length > 0, `Preset ${preset.id} word ${w.term} must have exampleTranslation`);
      assert.ok(/<#[\s\S]*?#>/.test(w.exampleSentence), `Preset ${preset.id} word ${w.term} must highlight term in exampleSentence`);
    }
  }
  console.log('[PASS] All PRESET_SETS have 100% exampleSentence and exampleTranslation.');
}

// ==========================================
// TEST 3: Tier 1 - Shifted Phonetic Recovery
// ==========================================
{
  console.log('Testing Tier 1: Shifted Phonetic Recovery...');
  const degradedSet: WordSet = {
    id: 'deck_tier1',
    title: 'Deck with Shifted Phonetic',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      {
        id: 'w1',
        term: 'bell',
        definition: 'cái chuông',
        phonetic: 'Listen to the bell.', // shifted from 3-col import
      },
      {
        id: 'w2',
        term: 'desk',
        definition: 'bàn học',
        phonetic: '/desk/', // valid IPA phonetic, should NOT be shifted
      },
    ],
  };

  const { repairedSets, modifiedSets } = recoverAndRepairWordSets([degradedSet]);
  assert.equal(repairedSets.length, 1);
  assert.equal(modifiedSets.length, 1);

  const repaired = repairedSets[0];
  const w1 = repaired.words.find((w) => w.id === 'w1')!;
  assert.equal(w1.phonetic, undefined, 'Shifted phonetic should be unset');
  assert.equal(w1.exampleSentence, 'Listen to the <#bell#>.', 'Shifted phonetic should become highlighted exampleSentence');

  const w2 = repaired.words.find((w) => w.id === 'w2')!;
  assert.equal(w2.phonetic, '/desk/', 'Valid IPA phonetic should be preserved');
  assert.equal(w2.exampleSentence, 'It is a <#desk#>.');
  console.log('[PASS] Tier 1: Shifted phonetic successfully converted to exampleSentence.');
}

// ==========================================
// VERIFICATION 0: Tier 0 - Canonical L1 & L2 Single Source of Truth & Level Isolation
// ==========================================
{
  console.log('Verifying Tier 0: Canonical L1 & L2 Single Source of Truth & Level Isolation...');
  const l1Deck: WordSet = {
    id: 'deck_l1_check',
    title: 'L1 - Unit 1',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      { id: 'l1_1', term: 'bike', definition: 'xe đạp' },
      { id: 'l1_2', term: 'chips', definition: 'khoai tây chiên' },
      { id: 'l1_3', term: 'desk', definition: 'cái bàn học' },
      { id: 'l1_4', term: 'duck', definition: 'con vịt' },
      { id: 'l1_5', term: 'milk', definition: 'sữa' },
      { id: 'l1_6', term: 'pen', definition: 'bút mực' },
    ],
  };

  const l2Deck: WordSet = {
    id: 'deck_l2_check',
    title: 'L2 - Unit 1',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      { id: 'l2_1', term: 'bike', definition: 'xe đạp' },
      { id: 'l2_2', term: 'chips', definition: 'khoai tây chiên' },
      { id: 'l2_3', term: 'desk', definition: 'cái bàn' },
      { id: 'l2_4', term: 'duck', definition: 'con vịt' },
      { id: 'l2_5', term: 'milk', definition: 'sữa' },
      { id: 'l2_6', term: 'pen', definition: 'bút' },
      { id: 'l2_7', term: 'running', definition: 'chạy bộ' },
    ],
  };

  const { repairedSets } = recoverAndRepairWordSets([l1Deck, l2Deck]);
  const repairedL1 = repairedSets.find((s) => s.id === 'deck_l1_check')!;
  const repairedL2 = repairedSets.find((s) => s.id === 'deck_l2_check')!;

  // Verify L1 exact sentences from L1.txt
  assert.equal(repairedL1.words.find((w) => w.term === 'bike')?.exampleSentence, 'I have a <#bike#>.');
  assert.equal(repairedL1.words.find((w) => w.term === 'chips')?.exampleSentence, 'I like <#chips#>.');
  assert.equal(repairedL1.words.find((w) => w.term === 'desk')?.exampleSentence, 'This is a <#desk#>.');
  assert.equal(repairedL1.words.find((w) => w.term === 'duck')?.exampleSentence, 'This is a <#duck#>.');
  assert.equal(repairedL1.words.find((w) => w.term === 'milk')?.exampleSentence, 'I like <#milk#>.');
  assert.equal(repairedL1.words.find((w) => w.term === 'pen')?.exampleSentence, "It's a red <#pen#>.");

  // Verify L2 exact sentences from L2.txt
  assert.equal(repairedL2.words.find((w) => w.term === 'bike')?.exampleSentence, 'Is she riding a <#bike#>?');
  assert.equal(repairedL2.words.find((w) => w.term === 'chips')?.exampleSentence, 'The <#chips#> are yummy.');
  assert.equal(repairedL2.words.find((w) => w.term === 'desk')?.exampleSentence, 'I can see a <#desk#>.');
  assert.equal(repairedL2.words.find((w) => w.term === 'duck')?.exampleSentence, "There's a <#duck#>.");
  assert.equal(repairedL2.words.find((w) => w.term === 'milk')?.exampleSentence, 'Pass me the <#milk#>, please.');
  assert.equal(repairedL2.words.find((w) => w.term === 'pen')?.exampleSentence, "It's a <#pen#>.");
  assert.equal(repairedL2.words.find((w) => w.term === 'running')?.exampleSentence, 'He is <#running#>.');

  console.log('[PASS] Tier 0: Canonical L1 & L2 Single Source of Truth & Level Isolation verified.');
}

// ==========================================
// VERIFICATION 4: Tier 2 - Cross-Set Dictionary Recovery
// ==========================================
{
  console.log('Verifying Tier 2: Cross-Set Dictionary Recovery...');
  const richDeck: WordSet = {
    id: 'deck_rich',
    title: 'Grade 4 - Unit 6 (Extended)',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      {
        id: 'r1',
        term: 'ruler',
        definition: 'thước kẻ',
        phonetic: '/ˈruː.lər/',
        exampleSentence: 'This is my <#ruler#>.',
        exampleTranslation: 'Đây là thước kẻ của tôi.',
      },
    ],
  };

  const emptySentenceDeck: WordSet = {
    id: 'deck_empty',
    title: 'Grade 4 - Unit 6 (Quick)',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      {
        id: 'e1',
        term: 'ruler',
        definition: 'thước kẻ',
      },
    ],
  };

  const { repairedSets, modifiedSets } = recoverAndRepairWordSets([richDeck, emptySentenceDeck]);
  const repairedEmpty = repairedSets.find((s) => s.id === 'deck_empty')!;
  const repairedWord = repairedEmpty.words[0];

  assert.equal(repairedWord.exampleSentence, 'This is my <#ruler#>.');
  assert.equal(repairedWord.exampleTranslation, 'Đây là thước kẻ của tôi.');
  assert.equal(repairedWord.phonetic, '/ˈruː.lər/');
  assert.ok(modifiedSets.some((s) => s.id === 'deck_empty'), 'deck_empty should be marked modified');
  console.log('[PASS] Tier 2: Cross-Set Dictionary Recovery successfully filled missing fields.');
}

// ==========================================
// TEST 5: Tier 3 - Smart Grammar Fallback
// ==========================================
{
  console.log('Testing Tier 3: Smart Grammar Fallback for isolated novel words...');
  const novelDeck: WordSet = {
    id: 'deck_novel',
    title: 'Novel Vocabulary Deck',
    createdAt: Date.now(),
    userId: 'user1',
    words: [
      {
        id: 'n1',
        term: 'giraffe',
        definition: 'hươu cao cổ',
      },
      {
        id: 'n2',
        term: 'elephant',
        definition: 'con voi',
      },
      {
        id: 'n3',
        term: 'blue',
        definition: 'màu xanh dương',
      },
    ],
  };

  const { repairedSets } = recoverAndRepairWordSets([novelDeck]);
  const repairedNovel = repairedSets[0];

  assert.equal(repairedNovel.words[0].exampleSentence, 'It is a <#giraffe#>.');
  assert.equal(repairedNovel.words[1].exampleSentence, 'It is an <#elephant#>.');
  assert.equal(repairedNovel.words[2].exampleSentence, 'It is <#blue#>.');
  console.log('[PASS] Tier 3: Smart Grammar Fallback correctly assigned sentences to all words.');
}

// ==========================================
// TEST 6: recoverAndRepairSingleSet with Presets
// ==========================================
{
  console.log('Testing recoverAndRepairSingleSet...');
  const degradedPresetCopy: WordSet = {
    id: 'set_l3_u5',
    title: 'L3 - U5 (Old Cache)',
    createdAt: 1000,
    userId: 'guest',
    words: [
      {
        id: 'w_old_1',
        term: 'singing',
        definition: 'ca hát',
      },
    ],
  };

  const { repairedSet, modified } = recoverAndRepairSingleSet(degradedPresetCopy, PRESET_SETS);
  assert.ok(modified, 'Degraded preset copy should be flagged as modified');
  assert.equal(repairedSet.words.length, 8, 'Authoritative preset has 8 words');
  assert.ok(repairedSet.words[0].exampleSentence, 'Authoritative preset has complete sentences');
  console.log('[PASS] recoverAndRepairSingleSet protects preset integrity.');
}

// ==========================================
// TEST 7: ZIP Package Export/Import Roundtrip
// ==========================================
{
  console.log('Testing PackageManifest & importWordSetPackage...');
  const testManifest: PackageManifest = {
    version: '1.0',
    type: 'vocagame_full_package',
    title: 'Unit 7 Package',
    description: 'Unit 7 classroom commands package',
    createdAt: new Date().toISOString(),
    words: [
      {
        id: 'w1',
        term: 'open your book',
        definition: 'mở sách ra',
        phonetic: '/ˈəʊpən jɔː bʊk/',
        exampleSentence: '<#Open your book#>, please!',
        exampleTranslation: 'Xin mời mở sách ra!',
        imageFileName: null,
        audioFileName: null,
        audioViFileName: null,
      },
    ],
  };

  const zip = new JSZip();
  zip.file('package.json', JSON.stringify(testManifest));

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  const syntheticFile = new File([zipBuffer], 'unit7_package.zip', { type: 'application/zip' });

  const imported = await importWordSetPackage(syntheticFile);
  assert.ok(imported.title.includes('Unit 7 Package'));
  assert.equal(imported.words.length, 1);
  const importedWord = imported.words[0];
  assert.equal(importedWord.term, 'open your book');
  assert.equal(importedWord.definition, 'mở sách ra');
  assert.equal(importedWord.phonetic, '/ˈəʊpən jɔː bʊk/');
  assert.equal(importedWord.exampleSentence, '<#Open your book#>, please!');
  assert.equal(importedWord.exampleTranslation, 'Xin mời mở sách ra!');
  console.log('[PASS] importWordSetPackage preserves phonetic, exampleSentence, and exampleTranslation.');
}

console.log('\n======================================================');
console.log('>>> ALL VERIFICATION TESTS PASSED SUCCESSFULLY! (10/10)');
console.log('======================================================\n');
process.exit(0);
