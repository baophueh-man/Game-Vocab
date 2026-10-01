import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  isType14WordMatchingTarget,
  WorksheetWord
} from './src/utils/worksheetGenerator';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== STARTING COMPREHENSIVE TYPE 14 VERIFICATION MATRIX ===\n');

  const outDir = path.join(process.cwd(), 'test_output_type14');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Load sample base64 images from test_words_png.json
  const rawWords = JSON.parse(fs.readFileSync('test_words_png.json', 'utf8'));
  const getImg = (name: string) => {
    const found = rawWords.find((w: any) => w.term === name);
    return found ? found.imageUrl : rawWords[0].imageUrl;
  };

  // Test vocabulary list with varied target letters
  // Words with 'v': van, village, volleyball, river (4 words)
  // Words without 'v': ball, apple, cat, duck (4 words)
  const testWords8: WorksheetWord[] = [
    { term: 'van', imageUrl: getImg('ball') },         // has 'v', has 'a'
    { term: 'apple', imageUrl: getImg('apple') },     // no 'v', has 'a'
    { term: 'village', imageUrl: getImg('tree') },     // has 'v', has 'a'
    { term: 'cat', imageUrl: getImg('cat') },         // no 'v', has 'a'
    { term: 'volleyball', imageUrl: getImg('duck') },  // has 'v', has 'a', long word
    { term: 'duck', imageUrl: getImg('duck') },       // no 'v', no 'a'
    { term: 'river', imageUrl: getImg('fish') },       // has 'v', no 'a'
    { term: 'hat', imageUrl: getImg('hat') }          // no 'v', has 'a'
  ];

  // 1. UNIT TESTS for isType14WordMatchingTarget
  console.log('--- 1. Testing isType14WordMatchingTarget logic ---');
  const unitChecks = [
    { term: 'van', target: 'V', expected: true },
    { term: 'VAN', target: 'v', expected: true },
    { term: 'van', target: 'V v', expected: true },
    { term: 'village', target: 'v', expected: true },
    { term: 'cat', target: 'V', expected: false },
    { term: 'cat', target: 'A', expected: true },
    { term: 'duck', target: 'A', expected: false },
    { term: 'river', target: 'r', expected: true },
    { term: 'ship', target: 'sh', expected: true },
    { term: 'fish', target: 'sh', expected: true },
    { term: 'boat', target: 'sh', expected: false }
  ];

  for (const c of unitChecks) {
    const res = isType14WordMatchingTarget(c.term, c.target);
    if (res !== c.expected) {
      throw new Error(`Unit test failed for "${c.term}" with target "${c.target}": expected ${c.expected}, got ${res}`);
    }
  }
  console.log('✓ All isType14WordMatchingTarget unit tests PASSED (100% accuracy).\n');

  // Test Scenarios to generate
  const scenarios = [
    // Scenario 1: Target Letter 'V', Student Mode
    {
      name: 'ws14_01_target_V_student',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'student' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 2: Target Letter 'V', Answer Mode (Red circles around van, village, volleyball, river)
    {
      name: 'ws14_02_target_V_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 3: Target Letter 'A', Answer Mode (Red circles around van, apple, village, cat, volleyball, hat)
    {
      name: 'ws14_03_target_A_answer',
      title: 'Circle the pictures that have letter A',
      targetLetter: 'A',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 4: Spacing 0 pt WITH Word Labels (Answer Mode) - Anti-collision verification
    {
      name: 'ws14_04_spacing_0pt_labels_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 0,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 5: Spacing 0 pt WITHOUT Word Labels (Answer Mode) - Anti-collision verification
    {
      name: 'ws14_05_spacing_0pt_nolabels_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: false,
      spacing: 0,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 6: Spacing 18 pt (Answer Mode)
    {
      name: 'ws14_06_spacing_18pt_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 18,
      fontSize: 14,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 7: Extreme small font (8 pt, Answer Mode)
    {
      name: 'ws14_07_font_8pt_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 8,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 8: Extreme large font (28 pt, Answer Mode) - Test word label clamp / auto-scale
    {
      name: 'ws14_08_font_28pt_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 28,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a4' as const
    },
    // Scenario 9: Font KG Primary Dots (Answer Mode)
    {
      name: 'ws14_09_font_KG_Dots_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 16,
      fontFamily: 'KG Primary Dots' as const,
      paperSize: 'a4' as const
    },
    // Scenario 10: Font Questrial (Answer Mode)
    {
      name: 'ws14_10_font_Questrial_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 6,
      fontSize: 14,
      fontFamily: 'Questrial' as const,
      paperSize: 'a4' as const
    },
    // Scenario 11: Paper size A5 (Answer Mode)
    {
      name: 'ws14_11_paper_a5_answer',
      title: 'Circle the pictures that have letter V',
      targetLetter: 'V',
      answerMode: 'answer' as const,
      showWordLabels: true,
      spacing: 4,
      fontSize: 12,
      fontFamily: 'r0c0i Linotte' as const,
      paperSize: 'a5' as const
    }
  ];

  console.log(`--- 2. Generating ${scenarios.length} Single Mode PDF Scenarios ---`);
  for (const s of scenarios) {
    const doc = await generateWorksheetPDF({
      type: 14,
      title: s.title,
      targetLetter: s.targetLetter,
      answerMode: s.answerMode,
      showWordLabels: s.showWordLabels,
      paperSize: s.paperSize,
      fontSize: s.fontSize,
      fontFamily: s.fontFamily,
      spacing: s.spacing,
      words: testWords8,
      showHeader: true,
      showFooter: true,
      showImageBorder: false
    });

    const pdfPath = path.join(outDir, `${s.name}.pdf`);
    const buf = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(pdfPath, buf);
    console.log(`Generated: ${s.name}.pdf (${buf.length} bytes, ${doc.getNumberOfPages()} page)`);
  }

  // Scenario 12 & 13: Composite Mode with Type 14 Section (Student vs Answer)
  console.log('\n--- 3. Generating Composite Mode PDF Scenarios ---');
  for (const aMode of ['student', 'answer'] as const) {
    const docComposite = await generateCompositeWorksheetPDF({
      title: `English Grade 3 - Unit 4 (${aMode.toUpperCase()})`,
      paperSize: 'a4',
      fontFamily: 'r0c0i Linotte',
      fontSize: 12,
      spacing: 6,
      showHeader: true,
      showFooter: true,
      sections: [
        {
          id: 'sec-1',
          type: 4,
          title: 'I. Look and write the missing letters',
          words: testWords8.slice(0, 4)
        },
        {
          id: 'sec-2',
          type: 14,
          title: 'II. Circle the pictures that have letter V',
          targetLetter: 'V',
          answerMode: aMode,
          showWordLabels: true,
          spacing: 0, // Test Spacing 0 in Composite mode too!
          words: testWords8
        }
      ],
      allWords: testWords8
    });

    const compName = `ws14_12_composite_${aMode}`;
    const compPath = path.join(outDir, `${compName}.pdf`);
    const compBuf = Buffer.from(docComposite.output('arraybuffer'));
    fs.writeFileSync(compPath, compBuf);
    console.log(`Generated: ${compName}.pdf (${compBuf.length} bytes, ${docComposite.getNumberOfPages()} page)`);
  }

  console.log('\n=== ALL PDF SCENARIOS GENERATED SUCCESSFULLY ===\n');
}

main().catch(err => {
  console.error('Error generating PDF scenarios:', err);
  process.exit(1);
});
