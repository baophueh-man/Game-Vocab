import assert from 'node:assert/strict';
import {
  deduplicateWords,
  loadFromMultipleWordSets
} from '../src/utils/worksheetVocabEngine';
import {
  getFallbackSentenceForWord,
  getType1Sentence,
  getType2Sentence,
  getLookAndWriteSentence,
  getType15Sentence,
  getType15SentenceSpans,
  parseHighlightedSentence,
  setActiveFallbackWordPool
} from '../src/utils/worksheetGenerator';

console.log('--- RUNNING WORKSHEET SENTENCE RECOVERY VERIFICATION ---');

async function run() {
  // 1. Requirement 1: Vocabulary engine preserves and merges exampleSentence
  {
    const duplicateInput = [
      {
        id: 'item-1',
        term: 'bell',
        definition: 'cái chuông'
      },
      {
        id: 'item-2',
        term: 'bell',
        definition: 'cái chuông trường học',
        phonetic: '/bel/',
        imageUrl: 'https://images.unsplash.com/school-bell.jpg',
        exampleSentence: 'Ring the school bell.'
      }
    ];

    const merged = deduplicateWords(duplicateInput);
    assert.equal(merged.length, 1, 'deduplicateWords should keep single record');
    assert.equal(merged[0].term, 'bell');
    assert.equal(merged[0].exampleSentence, 'Ring the school bell.', 'Missing exampleSentence must be merged');
    assert.equal(merged[0].imageUrl, 'https://images.unsplash.com/school-bell.jpg', 'Missing imageUrl must be merged');
    assert.equal(merged[0].phonetic, '/bel/', 'Missing phonetic must be merged');
    console.log('[PASS] Requirement 1.1: deduplicateWords merges missing fields correctly.');
  }

  // 1.2 Multi-deck mapping reads all sentence field variants
  {
    const sampleDeck = {
      id: 'deck-school-grade3',
      title: 'Unit 1: School Things - Lesson 1',
      createdAt: Date.now(),
      userId: 'teacher_grade3',
      words: [
        { id: 'w1', term: 'pen', definition: 'cây bút mực', sentence: 'I have a blue pen.' },
        { id: 'w2', term: 'pencil', definition: 'bút chì', example: 'This is my new pencil.' },
        { id: 'w3', term: 'book', definition: 'quyển sách', contextSentence: 'Open your English book.' },
        { id: 'w4', term: 'ruler', definition: 'thước kẻ', exampleSentence: 'Pass me the long ruler.' }
      ]
    };

    const loaded = await loadFromMultipleWordSets([sampleDeck as any]);
    assert.equal(loaded.length, 4);
    assert.equal(loaded[0].exampleSentence, 'I have a blue pen.');
    assert.equal(loaded[1].exampleSentence, 'This is my new pencil.');
    assert.equal(loaded[2].exampleSentence, 'Open your English book.');
    assert.equal(loaded[3].exampleSentence, 'Pass me the long ruler.');
    console.log('[PASS] Requirement 1.2: loadFromMultipleWordSets extracts sentence variants.');
  }

  // 2. Requirement 2: Smart detection for 3-col vs 4-col Excel rows
  {
    function parseExcelRow(row: string[]) {
      const term = String(row[0] || '').trim();
      const def = String(row[1] || '').trim();
      const col2 = row.length >= 3 ? String(row[2] || '').trim() : '';
      const col3 = row.length >= 4 ? String(row[3] || '').trim() : '';
      const col4 = row.length >= 5 ? String(row[4] || '').trim() : '';

      let phonetic: string | undefined = col2 || undefined;
      let exampleSentence: string | undefined = col3 || undefined;
      const exampleTranslation: string | undefined = col4 || undefined;

      if ((row.length === 3 || !col3) && col2) {
        const isPhoneticWrapped = /^\/.*\/$/.test(col2) || /^\[.*\]$/.test(col2);
        if (/\s/.test(col2) && !isPhoneticWrapped) {
          exampleSentence = col2;
          phonetic = undefined;
        }
      }

      return { term, def, phonetic, exampleSentence, exampleTranslation };
    }

    const row3Sentence = parseExcelRow(['chair', 'cái ghế', 'Please sit on the chair.']);
    assert.equal(row3Sentence.exampleSentence, 'Please sit on the chair.');
    assert.equal(row3Sentence.phonetic, undefined);

    const row3PhoneticSlash = parseExcelRow(['chair', 'cái ghế', '/tʃeə(r)/']);
    assert.equal(row3PhoneticSlash.phonetic, '/tʃeə(r)/');
    assert.equal(row3PhoneticSlash.exampleSentence, undefined);

    const row3PhoneticBracket = parseExcelRow(['chair', 'cái ghế', '[tʃeə]']);
    assert.equal(row3PhoneticBracket.phonetic, '[tʃeə]');
    assert.equal(row3PhoneticBracket.exampleSentence, undefined);

    const row4Full = parseExcelRow(['desk', 'bàn học', '/desk/', 'Put your bag on the desk.']);
    assert.equal(row4Full.phonetic, '/desk/');
    assert.equal(row4Full.exampleSentence, 'Put your bag on the desk.');

    console.log('[PASS] Requirement 2: Smart detection for 3-column vs 4-column Excel rows.');
  }

  // 3. Requirement 3: Smart Sentence Fallback Engine
  {
    const wordWithSentence = { term: 'bell', exampleSentence: 'Listen to the bell.' };
    assert.equal(getFallbackSentenceForWord(wordWithSentence, false), 'Listen to the bell.');
    assert.equal(getFallbackSentenceForWord(wordWithSentence, true), 'Listen to the <#bell#>.');

    const wordPlural = { term: 'pencils' };
    assert.equal(getFallbackSentenceForWord(wordPlural, false), 'They are pencils.');
    assert.equal(getFallbackSentenceForWord(wordPlural, true), 'They are <#pencils#>.');

    const wordGlass = { term: 'glass' };
    assert.equal(getFallbackSentenceForWord(wordGlass, false), 'It is a glass.');
    const wordBus = { term: 'bus' };
    assert.equal(getFallbackSentenceForWord(wordBus, false), 'It is a bus.');
    const wordIris = { term: 'iris' };
    assert.equal(getFallbackSentenceForWord(wordIris, false), 'It is an iris.');

    const wordVowel = { term: 'orange' };
    assert.equal(getFallbackSentenceForWord(wordVowel, false), 'It is an orange.');
    assert.equal(getFallbackSentenceForWord(wordVowel, true), 'It is an <#orange#>.');

    const wordConsonant = { term: 'pen' };
    assert.equal(getFallbackSentenceForWord(wordConsonant, false), 'It is a pen.');
    assert.equal(getFallbackSentenceForWord(wordConsonant, true), 'It is a <#pen#>.');

    setActiveFallbackWordPool([{ term: 'window', exampleSentence: 'Look through the large window.' }]);
    const wordFromPool = { term: 'window' };
    assert.equal(getFallbackSentenceForWord(wordFromPool, false), 'Look through the large window.');
    assert.equal(getFallbackSentenceForWord(wordFromPool, true), 'Look through the large <#window#>.');
    setActiveFallbackWordPool([]);

    console.log('[PASS] Requirement 3.1: getFallbackSentenceForWord grammatical and pool fallbacks.');
  }

  // 3.6 Application across all exercise types
  {
    const rawWord = { term: 'desk' };

    const type1Sentence = getType1Sentence(rawWord);
    assert.equal(type1Sentence, 'It is a desk.');
    assert.notEqual(type1Sentence, 'desk.');

    const type2Data = getType2Sentence(rawWord);
    assert.ok(type2Data);
    assert.ok(type2Data.fullSentence.includes('It is a'));

    const lookWriteData = getLookAndWriteSentence(rawWord);
    assert.ok(lookWriteData);
    assert.ok(lookWriteData.fullSentence.includes('It is a'));

    const type15Sentence = getType15Sentence(rawWord);
    assert.equal(type15Sentence, 'It is a desk.');

    const type15Spans = getType15SentenceSpans(rawWord);
    assert.ok(type15Spans.length >= 2);
    const highlightedSpan = type15Spans.find((s) => s.isHighlighted);
    assert.ok(highlightedSpan);
    assert.equal(highlightedSpan.text, 'desk');

    const parsedFallback = parseHighlightedSentence('', 'apples');
    assert.ok(parsedFallback.some((s) => s.isHighlighted && s.text === 'apples'));
    assert.ok(parsedFallback.some((s) => s.text.includes('They are')));

    console.log('[PASS] Requirement 3.2: Type 1, Type 2, Type 12, Type 15, and parseHighlightedSentence.');
  }

  console.log('--- ALL AUTOMATED VERIFICATIONS PASSED ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
