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

async function runShuffleTests() {
  console.log('--- Testing Look, Match & Write Shuffled Suffix with Col 2 & Col 3 Bound ---');

  // Test 1: Single Mode with lookMatchWriteShuffleSuffix = true (Xáo trộn độc lập)
  {
    console.log('Generating Test 1: Single Mode Shuffled Suffix (Col 2 & Col 3 together)...');
    const opts: WorksheetOptions = {
      type: 3,
      words: sampleWords,
      title: 'Look, match and write (Shuffled Suffix Test)',
      paperSize: 'a4',
      fontSize: 12,
      imageSize: 18,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      lookMatchWriteTraceFontSize: 28,
      lookMatchWriteShowBaseline: true,
      lookMatchWriteShuffleSuffix: true, // XAO TRON DOC LAP
      matchHint: 'match',
      showBorder: false,
      showHeader: true,
      showFooter: true,
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
    };
    const pdf = await generateWorksheetPDF(opts);
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'test_shuffled_col2_col3_single.pdf'), buf);
  }

  // Test 2: Composite Mode with lookMatchWriteShuffleSuffix = true
  {
    console.log('Generating Test 2: Composite Mode Shuffled Suffix...');
    const sections: CompositeWorksheetSection[] = [
      {
        id: 'sec-shuffle',
        type: 3,
        words: sampleWords,
        title: 'Section: Look, match & write (Shuffled Suffix)',
        fontSize: 12,
        imageSize: 18,
        spacing: 4,
        matchMode: 'look_match_write',
        lookMatchWriteMode: 'trace',
        lookMatchWriteTraceFontSize: 26,
        lookMatchWriteShowBaseline: true,
        lookMatchWriteShuffleSuffix: true,
        matchHint: 'match',
      }
    ];

    const pdf = await generateCompositeWorksheetPDF({
      paperSize: 'a4',
      fontFamily: 'r0c0i Linotte',
      colorMode: 'color',
      showHeader: true,
      showFooter: true,
      headerTitle: 'Composite Worksheet Shuffled Suffix Test',
      sections,
    });
    const buf = Buffer.from(pdf.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, 'test_shuffled_col2_col3_composite.pdf'), buf);
  }

  console.log('--- Test PDF generation completed successfully! ---');
}

runShuffleTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
