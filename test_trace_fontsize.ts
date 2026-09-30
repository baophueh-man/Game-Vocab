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

async function runTraceFontSizeTests() {
  console.log('--- Testing Look, Match & Write Trace Font Size Option ---');

  // Case A: Main Font 12pt (Col 1 & 2), Trace Font 28pt (Col 3 Trace), Spacing 6pt
  {
    console.log('Generating Case A: Main 12pt, Trace 28pt, Spacing 6pt...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Trace 28pt, Col 1-2 12pt)',
      paperSize: 'a4',
      fontSize: 12,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteTraceFontSize: 28,
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
    fs.writeFileSync(path.join(outDir, 'trace_font28_main12_spacing6.pdf'), buf);
  }

  // Case B: Main Font 12pt (Col 1 & 2), Trace Font 26pt (Col 3 Trace), Spacing 0pt (Critical check)
  {
    console.log('Generating Case B: Main 12pt, Trace 26pt, Spacing 0pt...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Trace 26pt, Col 1-2 12pt, Spacing 0pt)',
      paperSize: 'a4',
      fontSize: 12,
      imageSize: 18,
      spacing: 0,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteTraceFontSize: 26,
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: true,
      matchHint: 'match',
      showBorder: false,
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'trace_font26_main12_spacing0.pdf'), buf);
  }

  // Case C: Main Font 12pt, Trace Font 18pt (Smaller trace comparison)
  {
    console.log('Generating Case C: Main 12pt, Trace 18pt comparison...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Trace 18pt comparison)',
      paperSize: 'a4',
      fontSize: 12,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteTraceFontSize: 18,
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: false,
      matchHint: 'none',
      showBorder: false,
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'trace_font18_main12_spacing6.pdf'), buf);
  }

  // Case D: Composite Mode with Trace Font Size
  {
    console.log('Generating Case D: Composite Mode with Section Type 3 look_match_write (Trace 28pt)...');
    const sections: CompositeWorksheetSection[] = [
      {
        id: 'sec-1',
        type: 3,
        words: sampleWords.slice(0, 4),
        title: 'Section 1: Look, match & write',
        fontSize: 12,
        imageSize: 18,
        spacing: 4,
        matchMode: 'look_match_write',
        lookMatchWriteMode: 'trace',
        lookMatchWriteTraceFontSize: 28,
        lookMatchWriteShowBaseline: true,
        lookMatchWriteShuffleSuffix: false,
        matchHint: 'match',
      },
      {
        id: 'sec-2',
        type: 1,
        words: sampleWords.slice(4, 6),
        title: 'Section 2: Flashcards',
        fontSize: 14,
        imageSize: 25,
        spacing: 6,
      }
    ];

    const pdf = await generateCompositeWorksheetPDF({
      paperSize: 'a4',
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
      showHeader: true,
      showFooter: true,
      headerTitle: 'Composite Worksheet Test (Trace 28pt)',
      sections,
    });
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'trace_composite_font28_main12.pdf'), buf);
  }

  console.log('--- All Trace Font Size PDF test files generated successfully! ---');
}

runTraceFontSizeTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
