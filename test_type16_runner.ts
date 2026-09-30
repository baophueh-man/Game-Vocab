import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  generateType16Choices,
  calculateType16Metrics,
  WorksheetWord
} from './src/utils/worksheetGenerator';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('===============================================================');
  console.log('TEST SUITE: Worksheet Type 16 (Look and circle the sound)');
  console.log('===============================================================\n');

  const outDir = path.resolve('test_output_type16');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Unit Testing generateType16Choices
  console.log('--- 1. Unit Testing generateType16Choices ---');
  {
    // Case 1a: Beginning sound for 'bell' -> target 'b', 3 choices, lower
    const c1 = generateType16Choices('bell', 'beginning', 3, 'lower');
    if (c1.targetLetter !== 'b') throw new Error(`Case 1a failed: targetLetter is ${c1.targetLetter}`);
    if (c1.choices.length !== 3) throw new Error(`Case 1a failed: choices length is ${c1.choices.length}`);
    if (!c1.choices.includes('b')) throw new Error(`Case 1a failed: 'b' not in choices ${JSON.stringify(c1.choices)}`);
    const unique1 = new Set(c1.choices);
    if (unique1.size !== 3) throw new Error(`Case 1a failed: duplicate choices ${JSON.stringify(c1.choices)}`);
    console.log('[PASS] Case 1a beginning sound "bell":', c1.choices, 'target:', c1.targetLetter);

    // Case 1b: Ending sound for 'cat' -> target 't', 3 choices, lower
    const c2 = generateType16Choices('cat', 'ending', 3, 'lower');
    if (c2.targetLetter !== 't') throw new Error(`Case 1b failed: targetLetter is ${c2.targetLetter}`);
    if (!c2.choices.includes('t')) throw new Error(`Case 1b failed: 't' not in choices`);
    console.log('[PASS] Case 1b ending sound "cat":', c2.choices, 'target:', c2.targetLetter);

    // Case 1c: Choice count = 2
    const c3 = generateType16Choices('pen', 'beginning', 2, 'lower');
    if (c3.choices.length !== 2) throw new Error(`Case 1c failed: length is ${c3.choices.length}`);
    if (!c3.choices.includes('p')) throw new Error(`Case 1c failed: 'p' not in choices`);
    console.log('[PASS] Case 1c 2 choices "pen":', c3.choices);

    // Case 1d: Choice count = 4
    const c4 = generateType16Choices('dog', 'beginning', 4, 'lower');
    if (c4.choices.length !== 4) throw new Error(`Case 1d failed: length is ${c4.choices.length}`);
    if (!c4.choices.includes('d')) throw new Error(`Case 1d failed: 'd' not in choices`);
    console.log('[PASS] Case 1d 4 choices "dog":', c4.choices);

    // Case 1e: Letter cases: 'upper' and 'both'
    const c5 = generateType16Choices('pencil', 'beginning', 3, 'upper');
    if (c5.targetLetter !== 'P' || !c5.choices.includes('P')) throw new Error('Case 1e upper failed');
    console.log('[PASS] Case 1e uppercase "pencil":', c5.choices);

    const c6 = generateType16Choices('pencil', 'beginning', 3, 'both');
    if (c6.targetLetter !== 'Pp' || !c6.choices.includes('Pp')) throw new Error('Case 1e both failed');
    console.log('[PASS] Case 1e both case "pencil":', c6.choices);
  }

  // 2. Unit Testing calculateType16Metrics (Testing Spacing 0pt & Font sizes)
  console.log('\n--- 2. Unit Testing calculateType16Metrics (Zero Spacing & Font Scaling) ---');
  {
    const m0 = calculateType16Metrics(15, 0, 3, 'lettersLeft', 'none', 12.7, false);
    const m6 = calculateType16Metrics(15, 6, 3, 'lettersLeft', 'none', 12.7, false);
    const m24 = calculateType16Metrics(15, 24, 3, 'lettersLeft', 'none', 12.7, false);

    console.log(`Spacing 0pt: rowGap=${m0.rowGap.toFixed(2)}mm, optPitch=${m0.optPitch.toFixed(2)}mm, rowHeight=${m0.rowHeight.toFixed(2)}mm`);
    console.log(`Spacing 6pt: rowGap=${m6.rowGap.toFixed(2)}mm, optPitch=${m6.optPitch.toFixed(2)}mm, rowHeight=${m6.rowHeight.toFixed(2)}mm`);
    console.log(`Spacing 24pt: rowGap=${m24.rowGap.toFixed(2)}mm, optPitch=${m24.optPitch.toFixed(2)}mm, rowHeight=${m24.rowHeight.toFixed(2)}mm`);

    if (m0.spacingMm !== 0 || !m0.isZero) {
      throw new Error(`Spacing 0pt must have spacingMm=0 and isZero=true!`);
    }
    if (m0.rowHeight >= m6.rowHeight || m6.rowHeight >= m24.rowHeight) {
      throw new Error(`rowHeight must strictly increase with spacing! Got 0pt: ${m0.rowHeight}, 6pt: ${m6.rowHeight}, 24pt: ${m24.rowHeight}`);
    }
    if (m0.rowGap > 4.0) {
      throw new Error(`Spacing 0pt rowGap too loose: ${m0.rowGap}mm (expected <= 4.0mm)`);
    }
    console.log('[PASS] Spacing 0pt produces genuinely compact, zero-bloat row height!');

    // Test Tiny Font (8pt) vs Large Font (24pt)
    const mTiny = calculateType16Metrics(8, 0, 3, 'lettersLeft', 'none', 12.7, false);
    const mLarge = calculateType16Metrics(24, 0, 3, 'lettersLeft', 'none', 12.7, false);

    if (mTiny.optPitch >= mLarge.optPitch) {
      throw new Error('optPitch must scale with font size to prevent overlapping!');
    }
    console.log(`[PASS] Font scaling verified: 8pt pitch=${mTiny.optPitch.toFixed(2)}mm vs 24pt pitch=${mLarge.optPitch.toFixed(2)}mm`);
  }

  // Sample words matching the user reference
  // 1x1 base64 PNG dummy for visual rendering
  const dummyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  const userReferenceWords9: WorksheetWord[] = [
    { term: 'bell', imageUrl: dummyPng },
    { term: 'cat', imageUrl: dummyPng },
    { term: 'pen', imageUrl: dummyPng },
    { term: 'dog', imageUrl: dummyPng },
    { term: 'pencil', imageUrl: dummyPng },
    { term: 'cloud', imageUrl: dummyPng },
    { term: 'dish', imageUrl: dummyPng },
    { term: 'desk', imageUrl: dummyPng },
    { term: 'fries', imageUrl: dummyPng }
  ];

  // Helper to save PDF
  async function saveDoc(doc: any, filename: string) {
    const filePath = path.join(outDir, filename);
    const buf = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(filePath, buf);
    console.log(`[SAVED] ${filename} (${buf.length} bytes, ${doc.getNumberOfPages()} pages)`);
    return filePath;
  }

  // 3. Testing PDF Generation Scenarios
  console.log('\n--- 3. Testing Full PDF Generation Matrix ---');

  // 3A: Standard matching User Reference Image (3x3 grid, Spacing 0pt, A4, lettersLeft, lower)
  {
    const doc = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle the beginning sound',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      imageSize: 12.7,
      words: userReferenceWords9,
      type16SoundMode: 'beginning',
      type16ChoiceCount: 3,
      type16Layout: 'lettersLeft',
      type16LetterCase: 'lower',
      type16Border: 'none',
      showHeader: true,
      showFooter: true
    });
    await saveDoc(doc, 'ws16_user_reference_sample_a4.pdf');
  }

  // 3B: Layout Variations: lettersRight vs lettersBottom
  {
    const docRight = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle the beginning sound (Letters Right)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      type16Layout: 'lettersRight',
      type16Border: 'none',
      showHeader: true
    });
    await saveDoc(docRight, 'ws16_layout_lettersRight.pdf');

    const docBottom = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle the beginning sound (Letters Bottom)',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 0,
      words: userReferenceWords9,
      type16Layout: 'lettersBottom',
      type16Border: 'none',
      showHeader: true
    });
    await saveDoc(docBottom, 'ws16_layout_lettersBottom.pdf');
  }

  // 3C: Border Variations (none, outerOnly, full)
  {
    const docOuter = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Border: outerOnly)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      type16Border: 'outerOnly',
      showHeader: true
    });
    await saveDoc(docOuter, 'ws16_border_outerOnly.pdf');

    const docFull = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Border: full)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      type16Border: 'full',
      showHeader: true
    });
    await saveDoc(docFull, 'ws16_border_full.pdf');
  }

  // 3D: Choice Counts (2, 3, 4)
  {
    const doc2 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (2 Choices)',
      paperSize: 'a4',
      fontSize: 16,
      spacing: 0,
      words: userReferenceWords9,
      type16ChoiceCount: 2,
      showHeader: true
    });
    await saveDoc(doc2, 'ws16_choice_count_2.pdf');

    const doc4 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (4 Choices)',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 0,
      words: userReferenceWords9,
      type16ChoiceCount: 4,
      showHeader: true
    });
    await saveDoc(doc4, 'ws16_choice_count_4.pdf');
  }

  // 3E: Letter Cases (lower, upper, both)
  {
    const docUpper = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Uppercase)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      type16LetterCase: 'upper',
      showHeader: true
    });
    await saveDoc(docUpper, 'ws16_case_upper.pdf');

    const docBoth = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Both Cases: Aa, Bb)',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 0,
      words: userReferenceWords9,
      type16LetterCase: 'both',
      showHeader: true
    });
    await saveDoc(docBoth, 'ws16_case_both.pdf');
  }

  // 3F: Sound Modes (beginning vs ending)
  {
    const docEnding = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle the ending sound',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      type16SoundMode: 'ending',
      showHeader: true
    });
    await saveDoc(docEnding, 'ws16_sound_ending.pdf');
  }

  // 3G: Font Variations (All 6 Fonts)
  {
    const fonts: ('r0c0i Linotte' | 'Farsan' | 'HP001' | 'HLHOCTRO' | 'Questrial' | 'KG Primary Dots')[] = [
      'r0c0i Linotte',
      'Farsan',
      'HP001',
      'HLHOCTRO',
      'Questrial',
      'KG Primary Dots'
    ];

    for (const f of fonts) {
      const doc = await generateWorksheetPDF({
        type: 16,
        title: `Type 16 - Font: ${f}`,
        paperSize: 'a4',
        fontSize: 15,
        fontFamily: f,
        spacing: 0,
        words: userReferenceWords9,
        showHeader: true
      });
      const cleanName = f.replace(/\s+/g, '_');
      await saveDoc(doc, `ws16_font_${cleanName}.pdf`);
    }
  }

  // 3H: Font Sizes (Tiny 8pt vs Normal 15pt vs Large 24pt)
  {
    const doc8 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Tiny Font 8pt)',
      paperSize: 'a4',
      fontSize: 8,
      spacing: 0,
      words: userReferenceWords9,
      showHeader: true
    });
    await saveDoc(doc8, 'ws16_fontsize_8pt.pdf');

    const doc24 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Large Font 24pt)',
      paperSize: 'a4',
      fontSize: 24,
      spacing: 0,
      words: userReferenceWords9,
      showHeader: true
    });
    await saveDoc(doc24, 'ws16_fontsize_24pt.pdf');
  }

  // 3I: Spacing levels (0pt vs 6pt vs 24pt)
  {
    const docSp0 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Spacing 0 pt - Compact)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: userReferenceWords9,
      showHeader: true
    });
    await saveDoc(docSp0, 'ws16_spacing_0pt.pdf');

    const docSp24 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle (Spacing 24 pt - Spacious)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 24,
      words: userReferenceWords9,
      showHeader: true
    });
    await saveDoc(docSp24, 'ws16_spacing_24pt.pdf');
  }

  // 3J: Multi-page Pagination (36 words overflowing cleanly across pages on A4, 24 words on A5)
  {
    const baseTerms = ['apple', 'ball', 'cat', 'dog', 'elephant', 'fish', 'goat', 'hat', 'igloo', 'kite', 'lion', 'monkey'];
    const words36: WorksheetWord[] = [];
    for (let k = 0; k < 36; k++) {
      words36.push({
        term: `${baseTerms[k % baseTerms.length]}${Math.floor(k / baseTerms.length) > 0 ? (k + 1) : ''}`,
        imageUrl: dummyPng
      });
    }

    const docMultiA4 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle sound (36 Words Multi-Page A4)',
      paperSize: 'a4',
      fontSize: 15,
      spacing: 0,
      words: words36,
      showHeader: true,
      showFooter: true
    });
    const pA4 = docMultiA4.getNumberOfPages();
    if (pA4 <= 1) throw new Error(`Expected > 1 page for 36 words on A4, got ${pA4}`);
    await saveDoc(docMultiA4, 'ws16_multipage_a4.pdf');

    const docMultiA5 = await generateWorksheetPDF({
      type: 16,
      title: 'Look and circle sound (36 Words Multi-Page A5)',
      paperSize: 'a5',
      fontSize: 13,
      spacing: 0,
      words: words36,
      showHeader: true,
      showFooter: true
    });
    const pA5 = docMultiA5.getNumberOfPages();
    if (pA5 <= 1) throw new Error(`Expected > 1 page for 36 words on A5, got ${pA5}`);
    await saveDoc(docMultiA5, 'ws16_multipage_a5.pdf');
  }

  // 4. Composite Mode Integration
  console.log('\n--- 4. Testing Composite Mode with Type 16 Section ---');
  {
    const compDoc = await generateCompositeWorksheetPDF({
      title: 'Composite Exam (Including Section Type 16)',
      paperSize: 'a4',
      showHeader: true,
      showFooter: true,
      sections: [
        {
          id: 'sec1',
          type: 16,
          title: 'Section 1: Look and circle the beginning sound',
          words: userReferenceWords9.slice(0, 6),
          type16SoundMode: 'beginning',
          type16ChoiceCount: 3,
          type16Layout: 'lettersLeft',
          type16Border: 'outerOnly',
          spacing: 0,
          fontSize: 14
        },
        {
          id: 'sec2',
          type: 16,
          title: 'Section 2: Look and circle the ending sound',
          words: userReferenceWords9.slice(6, 9),
          type16SoundMode: 'ending',
          type16ChoiceCount: 3,
          type16Layout: 'lettersBottom',
          type16Border: 'none',
          spacing: 0,
          fontSize: 13
        }
      ]
    });
    await saveDoc(compDoc, 'ws16_composite.pdf');
  }

  console.log('\n===============================================================');
  console.log('>>> ALL TYPE 16 AUTOMATED TESTS PASSED WITH 100% SUCCESS! <<<');
  console.log('===============================================================');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
