import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  generateType18Grid,
  calculateType18Metrics,
  WorksheetWord
} from './src/utils/worksheetGenerator';
import fs from 'fs';
import path from 'path';

const sampleWords: WorksheetWord[] = JSON.parse(fs.readFileSync(path.resolve('test_words_png.json'), 'utf-8'));

async function run() {
  console.log('=== STARTING TEST SUITE FOR WORKSHEET TYPE 18 ===\n');

  const outDir = path.resolve('test_output_type18');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // -------------------------------------------------------------
  // Test 1: Unit testing generateType18Grid
  // -------------------------------------------------------------
  console.log('--- Test 1: Unit Testing generateType18Grid ---');
  {
    // 1a. Mode 'both' with target 'E' (4x7 = 28 cells)
    const gridBoth = generateType18Grid('E', 'both', 4, 7, 'upper', 0);
    console.log(`[PASS] Grid 'both' total cells: ${gridBoth.cells.length}`);
    if (gridBoth.cells.length !== 28) {
      throw new Error(`Expected 28 cells, got ${gridBoth.cells.length}`);
    }
    console.log(`[PASS] Target counts: upper=${gridBoth.targetUpperCount}, lower=${gridBoth.targetLowerCount}, distractors=${gridBoth.distractorCount}`);
    if (gridBoth.targetUpperCount !== 7 || gridBoth.targetLowerCount !== 6) {
      throw new Error(`Expected upper=7, lower=6, got upper=${gridBoth.targetUpperCount}, lower=${gridBoth.targetLowerCount}`);
    }

    // Verify all target cells have correct letters
    for (const c of gridBoth.cells) {
      if (c.isTargetUpper && c.char !== 'E') {
        throw new Error(`Upper target cell has wrong char: ${c.char}`);
      }
      if (c.isTargetLower && c.char !== 'e') {
        throw new Error(`Lower target cell has wrong char: ${c.char}`);
      }
      if (!c.isTargetUpper && !c.isTargetLower && c.char.toUpperCase() === 'E') {
        throw new Error(`Distractor cell has target letter: ${c.char}`);
      }
    }
    console.log('[PASS] All cells correctly identify target uppercase E and lowercase e');

    // 1b. Mode 'upper_only' with target 'B'
    const gridUpper = generateType18Grid('B', 'upper_only', 4, 7, 'upper', 1);
    console.log(`[PASS] Upper only mode: upperCount=${gridUpper.targetUpperCount}, lowerCount=${gridUpper.targetLowerCount}`);
    if (gridUpper.targetLowerCount !== 0 || gridUpper.targetUpperCount < 10) {
      throw new Error(`Upper only mode invalid target counts: upper=${gridUpper.targetUpperCount}, lower=${gridUpper.targetLowerCount}`);
    }

    // 1c. Mode 'lower_only' with target 'd'
    const gridLower = generateType18Grid('d', 'lower_only', 3, 6, 'lower', 2);
    console.log(`[PASS] Lower only mode 3x6: totalCells=${gridLower.cells.length}, lowerCount=${gridLower.targetLowerCount}`);
    if (gridLower.cells.length !== 18 || gridLower.targetUpperCount !== 0) {
      throw new Error(`Lower only mode invalid target counts: upper=${gridLower.targetUpperCount}, lower=${gridLower.targetLowerCount}`);
    }
  }

  // -------------------------------------------------------------
  // Test 2: Unit testing calculateType18Metrics (Spacing 0pt & Font Scaling)
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Unit Testing calculateType18Metrics ---');
  {
    // Compare Spacing 0pt vs Spacing 6pt vs Spacing 18pt
    const m0 = calculateType18Metrics(20, 0, 4, 7, 'rounded', false);
    const m6 = calculateType18Metrics(20, 6, 4, 7, 'rounded', false);
    const m18 = calculateType18Metrics(20, 18, 4, 7, 'rounded', false);

    console.log(`Spacing 0pt: gapY=${m0.baseGapBetweenCirclesY.toFixed(2)}mm, padY=${m0.padY.toFixed(2)}mm, cardHeight=${m0.cardHeight.toFixed(2)}mm`);
    console.log(`Spacing 6pt: gapY=${m6.baseGapBetweenCirclesY.toFixed(2)}mm, padY=${m6.padY.toFixed(2)}mm, cardHeight=${m6.cardHeight.toFixed(2)}mm`);
    console.log(`Spacing 18pt: gapY=${m18.baseGapBetweenCirclesY.toFixed(2)}mm, padY=${m18.padY.toFixed(2)}mm, cardHeight=${m18.cardHeight.toFixed(2)}mm`);

    if (m0.cardHeight >= m6.cardHeight || m6.cardHeight >= m18.cardHeight) {
      throw new Error(`Height must strictly increase with spacing! m0=${m0.cardHeight}, m6=${m6.cardHeight}, m18=${m18.cardHeight}`);
    }
    if (m0.baseGapBetweenCirclesY >= m6.baseGapBetweenCirclesY) {
      throw new Error(`0pt spacing gap (${m0.baseGapBetweenCirclesY}) must be strictly smaller than 6pt gap (${m6.baseGapBetweenCirclesY})!`);
    }
    console.log('[PASS] Spacing 0pt verified: true tight rowGap without 6pt fallback!');

    // Test Font Scaling Protection on small vs huge font sizes (8pt vs 20pt vs 48pt)
    const mSmall = calculateType18Metrics(8, 0, 4, 7, 'rounded', false);
    const mNormal = calculateType18Metrics(20, 0, 4, 7, 'rounded', false);
    const mHuge = calculateType18Metrics(48, 0, 4, 7, 'rounded', false);

    console.log(`Font 8pt -> effectiveFontSize=${mSmall.effectiveCellFontSize.toFixed(2)}pt (requested 8pt)`);
    console.log(`Font 20pt -> effectiveFontSize=${mNormal.effectiveCellFontSize.toFixed(2)}pt (requested 20pt)`);
    console.log(`Font 48pt -> effectiveFontSize=${mHuge.effectiveCellFontSize.toFixed(2)}pt (capped to fit circle diameter ${mHuge.circleDiameter.toFixed(2)}mm)`);

    if (mSmall.effectiveCellFontSize !== 8) {
      throw new Error(`Small font should remain 8pt, got ${mSmall.effectiveCellFontSize}`);
    }
    if (mHuge.effectiveCellFontSize >= 48) {
      throw new Error(`48pt font should be scaled down to safely fit inside circle, got ${mHuge.effectiveCellFontSize}`);
    }
    console.log('[PASS] Font scaling protection verified: huge font scaled down to fit inside circle safely!');
  }

  // -------------------------------------------------------------
  // Test 3: PDF Generation - Standard Mode (Matching Sample Image)
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Generating PDF - Standard Mode (E green and e red, 4x7, rounded) ---');
  {
    const doc = await generateWorksheetPDF({
      type: 18,
      title: 'Color E green and e red',
      type18TargetLetter: 'E',
      type18Mode: 'both',
      type18ColorUpper: 'green',
      type18ColorLower: 'red',
      type18GridRows: 4,
      type18GridCols: 7,
      type18Border: 'rounded',
      type18CircleStyle: 'solid',
      type18DistractorCasing: 'upper',
      type18HighlightTarget: 'none',
      paperSize: 'a4',
      fontSize: 20,
      spacing: 0,
      showHeader: true,
      showFooter: true
    }, sampleWords.slice(0, 5));

    const outPath = path.join(outDir, 'test_type18_standard_a4.pdf');
    fs.writeFileSync(outPath, Buffer.from(doc.output('arraybuffer')));
    console.log(`[PASS] Generated: ${outPath}`);
  }

  // -------------------------------------------------------------
  // Test 4: PDF Generation - Answer Key Mode (Teacher Key)
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Generating PDF - Answer Key Mode ---');
  {
    const docKey = await generateWorksheetPDF({
      type: 18,
      title: 'Color E green and e red (Answer Key)',
      type18TargetLetter: 'E',
      type18Mode: 'both',
      type18ColorUpper: 'green',
      type18ColorLower: 'red',
      type18GridRows: 4,
      type18GridCols: 7,
      type18Border: 'rounded',
      type18CircleStyle: 'solid',
      type18DistractorCasing: 'upper',
      type18HighlightTarget: 'answer_key',
      paperSize: 'a4',
      fontSize: 20,
      spacing: 0,
      showHeader: true,
      showFooter: true
    }, sampleWords.slice(0, 5));

    const outPath = path.join(outDir, 'test_type18_answer_key_a4.pdf');
    fs.writeFileSync(outPath, Buffer.from(docKey.output('arraybuffer')));
    console.log(`[PASS] Generated: ${outPath}`);
  }

  // -------------------------------------------------------------
  // Test 5: PDF Generation - Spacing 0pt vs Spacing 18pt
  // -------------------------------------------------------------
  console.log('\n--- Test 5: Generating PDF - Spacing 0pt vs Spacing 18pt ---');
  {
    // 5a. Spacing 0pt
    const doc0 = await generateWorksheetPDF({
      type: 18,
      title: 'Color A blue and a yellow (Spacing 0pt)',
      type18TargetLetter: 'A',
      type18Mode: 'both',
      type18ColorUpper: 'blue',
      type18ColorLower: 'yellow',
      type18GridRows: 4,
      type18GridCols: 7,
      type18Border: 'rounded',
      spacing: 0,
      paperSize: 'a4',
      showHeader: true
    }, sampleWords.slice(0, 5));
    fs.writeFileSync(path.join(outDir, 'test_type18_spacing_0pt.pdf'), Buffer.from(doc0.output('arraybuffer')));

    // 5b. Spacing 18pt
    const doc18 = await generateWorksheetPDF({
      type: 18,
      title: 'Color A blue and a yellow (Spacing 18pt)',
      type18TargetLetter: 'A',
      type18Mode: 'both',
      type18ColorUpper: 'blue',
      type18ColorLower: 'yellow',
      type18GridRows: 4,
      type18GridCols: 7,
      type18Border: 'rounded',
      spacing: 18,
      paperSize: 'a4',
      showHeader: true
    }, sampleWords.slice(0, 5));
    fs.writeFileSync(path.join(outDir, 'test_type18_spacing_18pt.pdf'), Buffer.from(doc18.output('arraybuffer')));
    console.log('[PASS] Generated spacing comparison PDFs (0pt & 18pt)');
  }

  // -------------------------------------------------------------
  // Test 6: PDF Generation - Fonts (Linotte, Farsan, HP001, Questrial, KG Primary Dots)
  // -------------------------------------------------------------
  console.log('\n--- Test 6: Generating PDF - Font Variations ---');
  {
    const fonts: ('r0c0i Linotte' | 'Farsan' | 'HP001' | 'Questrial' | 'KG Primary Dots')[] = [
      'r0c0i Linotte',
      'Farsan',
      'HP001',
      'Questrial',
      'KG Primary Dots'
    ];

    for (const f of fonts) {
      const docFont = await generateWorksheetPDF({
        type: 18,
        title: `Color B orange and b purple (Font: ${f})`,
        type18TargetLetter: 'B',
        type18Mode: 'both',
        type18ColorUpper: 'orange',
        type18ColorLower: 'purple',
        fontFamily: f,
        fontSize: 22,
        spacing: 0,
        paperSize: 'a4',
        showHeader: true
      }, sampleWords.slice(0, 5));

      const cleanFont = f.replace(/[^a-zA-Z0-9]/g, '_');
      fs.writeFileSync(path.join(outDir, `test_type18_font_${cleanFont}.pdf`), Buffer.from(docFont.output('arraybuffer')));
      console.log(`[PASS] Generated font PDF: ${f}`);
    }
  }

  // -------------------------------------------------------------
  // Test 7: PDF Generation - Border & Circle Styles (Rect, None, Dashed, Double)
  // -------------------------------------------------------------
  console.log('\n--- Test 7: Generating PDF - Border & Circle Styles ---');
  {
    // 7a. Rect border + Dashed circle
    const docDashed = await generateWorksheetPDF({
      type: 18,
      title: 'Color C pink and c blue (Rect Border, Dashed Circles)',
      type18TargetLetter: 'C',
      type18Mode: 'both',
      type18ColorUpper: 'pink',
      type18ColorLower: 'blue',
      type18Border: 'rect',
      type18CircleStyle: 'dashed',
      spacing: 0,
      paperSize: 'a4',
      showHeader: true
    }, sampleWords.slice(0, 5));
    fs.writeFileSync(path.join(outDir, 'test_type18_border_rect_dashed.pdf'), Buffer.from(docDashed.output('arraybuffer')));

    // 7b. No outer border + Double circle
    const docDouble = await generateWorksheetPDF({
      type: 18,
      title: 'Color D green and d red (No Border, Double Circles)',
      type18TargetLetter: 'D',
      type18Mode: 'both',
      type18ColorUpper: 'green',
      type18ColorLower: 'red',
      type18Border: 'none',
      type18CircleStyle: 'double',
      spacing: 0,
      paperSize: 'a4',
      showHeader: true
    }, sampleWords.slice(0, 5));
    fs.writeFileSync(path.join(outDir, 'test_type18_border_none_double.pdf'), Buffer.from(docDouble.output('arraybuffer')));
    console.log('[PASS] Generated border and circle style comparison PDFs');
  }

  // -------------------------------------------------------------
  // Test 8: PDF Generation - A5 Format
  // -------------------------------------------------------------
  console.log('\n--- Test 8: Generating PDF - A5 Format ---');
  {
    const docA5 = await generateWorksheetPDF({
      type: 18,
      title: 'Color M green and m red',
      type18TargetLetter: 'M',
      type18Mode: 'both',
      type18ColorUpper: 'green',
      type18ColorLower: 'red',
      type18GridRows: 4,
      type18GridCols: 7,
      type18Border: 'rounded',
      paperSize: 'a5',
      fontSize: 16,
      spacing: 0,
      showHeader: true,
      showFooter: true
    }, sampleWords.slice(0, 5));
    fs.writeFileSync(path.join(outDir, 'test_type18_single_a5.pdf'), Buffer.from(docA5.output('arraybuffer')));
    console.log('[PASS] Generated A5 format PDF');
  }

  // -------------------------------------------------------------
  // Test 9: Composite Worksheet with Type 18 Section
  // -------------------------------------------------------------
  console.log('\n--- Test 9: Composite Worksheet with Type 18 Section ---');
  {
    const docComposite = await generateCompositeWorksheetPDF({
      title: 'Bài Tập Tiếng Anh Tổng Hợp Có Loại 18',
      paperSize: 'a4',
      fontFamily: 'r0c0i Linotte',
      fontSize: 14,
      spacing: 0,
      showHeader: true,
      showFooter: true,
      allWords: sampleWords,
      sections: [
        {
          id: 'sec-1',
          type: 14,
          title: 'Phần 1: Circle pictures with letter E',
          targetLetter: 'E e',
          words: sampleWords.slice(0, 4)
        },
        {
          id: 'sec-2',
          type: 18,
          title: 'Phần 2: Color E green and e red',
          type18TargetLetter: 'E',
          type18Mode: 'both',
          type18ColorUpper: 'green',
          type18ColorLower: 'red',
          type18GridRows: 3,
          type18GridCols: 7,
          type18Border: 'rounded',
          type18CircleStyle: 'solid',
          words: sampleWords.slice(0, 3)
        }
      ]
    });

    const outPath = path.join(outDir, 'test_type18_composite_a4.pdf');
    fs.writeFileSync(outPath, Buffer.from(docComposite.output('arraybuffer')));
    console.log(`[PASS] Generated composite PDF: ${outPath}`);
  }

  console.log('\n=== ALL WORKSHEET TYPE 18 TESTS COMPLETED SUCCESSFULLY! ===');
}

run().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
