import fs from 'fs';
import path from 'path';
import { generateWorksheetPDF, generateCompositeWorksheetPDF, WorksheetWord, WorksheetOptions, CompositeWorksheetSection } from './src/utils/worksheetGenerator';

// Load generated colorful test images
const imgMap = JSON.parse(fs.readFileSync('test_images_b64.json', 'utf8'));

const sampleWords: WorksheetWord[] = [
  { term: 'bell', definition: 'cái chuông', imageUrl: imgMap['bell'] },
  { term: 'duck', definition: 'con vịt', imageUrl: imgMap['duck'] },
  { term: 'pen', definition: 'cái bút', imageUrl: imgMap['pen'] },
  { term: 'pencil', definition: 'bút chì', imageUrl: imgMap['pencil'] },
  { term: 'cat', definition: 'con mèo', imageUrl: imgMap['cat'] },
  { term: 'apple', definition: 'quả táo', imageUrl: imgMap['apple'] },
];

const outDir = path.resolve(process.cwd(), 'test_output');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function runTests() {
  console.log('--- Starting Look, Match & Write PDF Generation Tests with Real Images ---');

  // 1. Standard Case: A4, Trace, Baseline ON, Suffix Not Shuffled, Match hint 'match'
  {
    console.log('Generating Case 1: Standard A4 (Trace, Baseline ON, No Shuffle)...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write',
      paperSize: 'a4',
      fontSize: 14,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: false,
      matchHint: 'match',
      showBorder: false,
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'case1_standard_a4.pdf'), buf);
  }

  // 2. Case 2: Blank Mode (each letter is '__')
  {
    console.log('Generating Case 2: Blank Mode (__)...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write',
      paperSize: 'a4',
      fontSize: 14,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'blank',
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: false,
      matchHint: 'match',
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'case2_blank_a4.pdf'), buf);
  }

  // 3. Case 3: Suffix Shuffled ON
  {
    console.log('Generating Case 3: Suffix Shuffled...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write',
      paperSize: 'a4',
      fontSize: 14,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: true,
      matchHint: 'match',
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'case3_shuffled_suffix.pdf'), buf);
  }

  // 4. Case 4: Baseline OFF
  {
    console.log('Generating Case 4: Baseline OFF...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write',
      paperSize: 'a4',
      fontSize: 14,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: false,
      lookMatchWriteShuffleSuffix: false,
      matchHint: 'match',
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'case4_no_baseline.pdf'), buf);
  }

  // 5. Case 5: Spacing 0 pt vs 12 pt
  {
    console.log('Generating Case 5a: Spacing 0 pt...');
    const opts0: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Spacing 0 pt)',
      paperSize: 'a4',
      fontSize: 16,
      imageSize: 18,
      spacing: 0,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      showHeader: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf0 = await generateWorksheetPDF(opts0);
    fs.writeFileSync(path.join(outDir, 'case5a_spacing_0pt.pdf'), Buffer.from(pdf0.output('arraybuffer')));

    console.log('Generating Case 5b: Spacing 12 pt...');
    const opts12: WorksheetOptions = {
      ...opts0,
      title: 'Look, match and write (Spacing 12 pt)',
      spacing: 12,
    };
    const pdf12 = await generateWorksheetPDF(opts12);
    fs.writeFileSync(path.join(outDir, 'case5b_spacing_12pt.pdf'), Buffer.from(pdf12.output('arraybuffer')));
  }

  // 6. Case 6: Font Size 8 pt vs 24 pt
  {
    console.log('Generating Case 6a: Font 8 pt...');
    const opts8: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Font 8 pt)',
      paperSize: 'a4',
      fontSize: 8,
      imageSize: 15,
      spacing: 4,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      showHeader: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf8 = await generateWorksheetPDF(opts8);
    fs.writeFileSync(path.join(outDir, 'case6a_font_8pt.pdf'), Buffer.from(pdf8.output('arraybuffer')));

    console.log('Generating Case 6b: Font 24 pt (Stress test with 0pt spacing)...');
    const opts24: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Font 24 pt + Spacing 0)',
      paperSize: 'a4',
      fontSize: 24,
      imageSize: 22,
      spacing: 0, // stress test with 0 spacing
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      showHeader: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdf24 = await generateWorksheetPDF(opts24);
    fs.writeFileSync(path.join(outDir, 'case6b_font_24pt.pdf'), Buffer.from(pdf24.output('arraybuffer')));
  }

  // 7. Case 7: A5 Paper Size
  {
    console.log('Generating Case 7: A5 Paper...');
    const optsA5: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write',
      paperSize: 'a5',
      fontSize: 12,
      imageSize: 14,
      spacing: 4,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteShowBaseline: true,
      showHeader: true,
      fontFamily: 'r0c0i Linotte',
    };
    const pdfA5 = await generateWorksheetPDF(optsA5);
    fs.writeFileSync(path.join(outDir, 'case7_a5_paper.pdf'), Buffer.from(pdfA5.output('arraybuffer')));
  }

  // 8. Case 8: Composite Mode with Section Type 3 look_match_write
  {
    console.log('Generating Case 8: Composite Mode...');
    const sections: CompositeWorksheetSection[] = [
      {
        id: 'sec1',
        type: 3,
        words: sampleWords.slice(0, 4),
        matchMode: 'look_match_write',
        lookMatchWriteMode: 'trace',
        lookMatchWriteShowBaseline: true,
        lookMatchWriteShuffleSuffix: false,
        imageSize: 16,
        fontSize: 13,
        spacing: 4,
        matchHint: 'match',
        instruction: 'Look at the pictures, match the word parts, and write the full words.',
      },
    ];
    const compOpts: WorksheetOptions = {
      title: 'COMPOSITE WORKSHEET TEST',
      paperSize: 'a4',
      fontSize: 14,
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
    };
    const compPdf = await generateCompositeWorksheetPDF({
      sections,
      ...compOpts
    });
    fs.writeFileSync(path.join(outDir, 'case8_composite.pdf'), Buffer.from(compPdf.output('arraybuffer')));
  }

  console.log('All PDF cases regenerated successfully with real test images!');
}

runTests().catch(err => {
  console.error('Error generating PDFs:', err);
  process.exit(1);
});
