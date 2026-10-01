import {
  generateWorksheetPDF,
  generateCompositeWorksheetPDF,
  WorksheetWord,
  CompositeWorksheetSection
} from './src/utils/worksheetGenerator';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('=== STARTING COMPREHENSIVE WORKSHEET 1 TO 5 VERIFICATION MATRIX ===\n');

  const outDir = path.join(process.cwd(), 'test_output_ws1_5');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Helper to save PDF
  const savePdf = (doc: any, filename: string) => {
    const buffer = Buffer.from(doc.output('arraybuffer'));
    fs.writeFileSync(path.join(outDir, filename), buffer);
    console.log(`✓ Saved: ${filename} (${buffer.length} bytes, ${doc.getNumberOfPages()} pages)`);
  };

  // Load sample base64 images from test_words_png.json
  const rawWords = JSON.parse(fs.readFileSync('test_words_png.json', 'utf8'));
  const getImg = (name: string) => {
    const found = rawWords.find((w: any) => w.term === name);
    return found ? found.imageUrl : rawWords[0].imageUrl;
  };

  const testWords: WorksheetWord[] = [
    { term: 'apple', exampleSentence: 'I eat a sweet red apple every day.', imageUrl: getImg('apple') },
    { term: 'ball', exampleSentence: 'The children play with a colorful ball.', imageUrl: getImg('ball') },
    { term: 'cat', exampleSentence: 'The little cat sleeps quietly on the rug.', imageUrl: getImg('cat') },
    { term: 'duck', exampleSentence: 'A yellow duck swims peacefully in the pond.', imageUrl: getImg('duck') },
    { term: 'fish', exampleSentence: 'Gold fish swim fast in clear water.', imageUrl: getImg('fish') },
    { term: 'hat', exampleSentence: 'She wears a nice warm hat in winter.', imageUrl: getImg('hat') },
    { term: 'tree', exampleSentence: 'Green leaves grow on the tall apple tree.', imageUrl: getImg('tree') },
    { term: 'elephant', exampleSentence: 'The giant elephant walks slowly in the forest.', imageUrl: getImg('apple') },
    { term: 'butterfly', exampleSentence: 'A pretty butterfly flies around colorful flowers.', imageUrl: getImg('ball') }
  ];

  console.log('--- 1. Testing Type 1 (Sentence Reorder / Rewrite) Scenarios ---');
  {
    // 1A. Student Mode (Default)
    const pdf1Student = await generateWorksheetPDF({
      type: 1,
      title: 'Reorder the words to make correct sentences',
      paperSize: 'a4',
      fontSize: 13.5,
      spacing: 6,
      sentenceScramble: true,
      sentenceSeparator: 'space',
      sentenceHintStyle: 'underscores',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf1Student, 'ws1_student_a4.pdf');

    // 1B. Answer Mode
    const pdf1Answer = await generateWorksheetPDF({
      type: 1,
      title: 'Reorder the words to make correct sentences',
      paperSize: 'a4',
      fontSize: 13.5,
      spacing: 6,
      sentenceScramble: true,
      sentenceSeparator: 'space',
      sentenceHintStyle: 'underscores',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf1Answer, 'ws1_answer_a4.pdf');

    // 1C. Spacing 0 pt Compact
    const pdf1Zero = await generateWorksheetPDF({
      type: 1,
      title: 'Type 1 - Spacing 0 pt Compact',
      paperSize: 'a4',
      fontSize: 13.5,
      spacing: 0,
      sentenceScramble: true,
      sentenceHintStyle: 'dots',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf1Zero, 'ws1_spacing_0pt.pdf');

    // 1D. Font Size 24 pt (Large)
    const pdf1Large = await generateWorksheetPDF({
      type: 1,
      title: 'Type 1 - Large Font 24 pt Protection',
      paperSize: 'a4',
      fontSize: 24,
      spacing: 6,
      sentenceScramble: true,
      sentenceHintStyle: 'underscores',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 4)
    });
    savePdf(pdf1Large, 'ws1_fontsize_24pt.pdf');

    // 1E. Font Choice (KG Primary Dots trace)
    const pdf1Dots = await generateWorksheetPDF({
      type: 1,
      title: 'Type 1 - Trace Mode Font KG Primary Dots',
      paperSize: 'a4',
      fontSize: 13.5,
      spacing: 6,
      sentenceScramble: true,
      sentenceHintStyle: 'trace',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf1Dots, 'ws1_font_kgdots.pdf');
  }

  console.log('\n--- 2. Testing Type 2 (Write words based on pictures 3x4) Scenarios ---');
  {
    // 2A. Student Mode
    const pdf2Student = await generateWorksheetPDF({
      type: 2,
      title: 'Look and write the words',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf2Student, 'ws2_student_a5.pdf');

    // 2B. Answer Mode
    const pdf2Answer = await generateWorksheetPDF({
      type: 2,
      title: 'Look and write the words',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf2Answer, 'ws2_answer_a5.pdf');

    // 2C. Spacing 0 pt
    const pdf2Zero = await generateWorksheetPDF({
      type: 2,
      title: 'Look and write - Spacing 0 pt',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 0,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf2Zero, 'ws2_spacing_0pt.pdf');

    // 2D. Large Font 24 pt (Testing descenders & baseline clearance)
    const pdf2Large = await generateWorksheetPDF({
      type: 2,
      title: 'Look and write - Font 24 pt',
      paperSize: 'a4',
      fontSize: 24,
      spacing: 0,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf2Large, 'ws2_fontsize_24pt_spacing0.pdf');
  }

  console.log('\n--- 3. Testing Type 3 (Match picture with word/sentence) Scenarios ---');
  {
    // 3A. Look, match & write - Student Mode
    const pdf3LMWStudent = await generateWorksheetPDF({
      type: 3,
      title: 'Look, match and write',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf3LMWStudent, 'ws3_lookmatchwrite_student.pdf');

    // 3B. Look, match & write - Answer Mode
    const pdf3LMWAnswer = await generateWorksheetPDF({
      type: 3,
      title: 'Look, match and write',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      matchMode: 'look_match_write',
      lookMatchWriteMode: 'trace',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf3LMWAnswer, 'ws3_lookmatchwrite_answer.pdf');

    // 3C. Look, match & write - Spacing 0 pt
    const pdf3LMWZero = await generateWorksheetPDF({
      type: 3,
      title: 'Look, match and write - Spacing 0 pt',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 0,
      matchMode: 'look_match_write',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf3LMWZero, 'ws3_lookmatchwrite_spacing_0pt.pdf');

    // 3D. Standard Word Matching - Student & Answer
    const pdf3WordStudent = await generateWorksheetPDF({
      type: 3,
      title: 'Match picture with word',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 6,
      matchMode: 'word',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf3WordStudent, 'ws3_word_matching_student.pdf');

    const pdf3WordAnswer = await generateWorksheetPDF({
      type: 3,
      title: 'Match picture with word',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 6,
      matchMode: 'word',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf3WordAnswer, 'ws3_word_matching_answer.pdf');

    // 3E. Standard Sentence Matching - Answer Mode
    const pdf3SentAnswer = await generateWorksheetPDF({
      type: 3,
      title: 'Match picture with sentence',
      paperSize: 'a4',
      fontSize: 13,
      spacing: 6,
      matchMode: 'sentence',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf3SentAnswer, 'ws3_sentence_matching_answer.pdf');
  }

  console.log('\n--- 4. Testing Type 4 (Missing letters) Scenarios ---');
  {
    // 4A. Grid Mode (Missing letters 3x4) - Student Mode
    const pdf4GridStudent = await generateWorksheetPDF({
      type: 4,
      title: 'Missing letters',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      type4LayoutMode: 'grid',
      blankMode: 'vowels',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf4GridStudent, 'ws4_grid_student.pdf');

    // 4B. Grid Mode - Answer Mode
    const pdf4GridAnswer = await generateWorksheetPDF({
      type: 4,
      title: 'Missing letters',
      paperSize: 'a5',
      fontSize: 12,
      spacing: 6,
      type4LayoutMode: 'grid',
      blankMode: 'vowels',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf4GridAnswer, 'ws4_grid_answer.pdf');

    // 4C. Table Mode (Look and write) - Student Mode
    const pdf4TableStudent = await generateWorksheetPDF({
      type: 4,
      title: 'Look and write',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 6,
      type4LayoutMode: 'table',
      type4ColumnMode: 'both_trace_first',
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf4TableStudent, 'ws4_table_student.pdf');

    // 4D. Table Mode - Answer Mode
    const pdf4TableAnswer = await generateWorksheetPDF({
      type: 4,
      title: 'Look and write',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 6,
      type4LayoutMode: 'table',
      type4ColumnMode: 'both_trace_first',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf4TableAnswer, 'ws4_table_answer.pdf');

    // 4E. Table Mode - Spacing 0 pt
    const pdf4Zero = await generateWorksheetPDF({
      type: 4,
      title: 'Look and write - Spacing 0 pt',
      paperSize: 'a4',
      fontSize: 14,
      spacing: 0,
      type4LayoutMode: 'table',
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 6)
    });
    savePdf(pdf4Zero, 'ws4_table_spacing_0pt.pdf');
  }

  console.log('\n--- 5. Testing Type 5 (Handwriting Practice Font HP001 + Ô Ly Grid) Scenarios ---');
  {
    // 5A. Student Mode A4
    const pdf5StudentA4 = await generateWorksheetPDF({
      type: 5,
      title: 'Handwriting practice',
      paperSize: 'a4',
      fontSize: 22,
      spacing: 6,
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf5StudentA4, 'ws5_student_a4.pdf');

    // 5B. Answer Mode A4
    const pdf5AnswerA4 = await generateWorksheetPDF({
      type: 5,
      title: 'Handwriting practice',
      paperSize: 'a4',
      fontSize: 22,
      spacing: 6,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf5AnswerA4, 'ws5_answer_a4.pdf');

    // 5C. Student Mode A5
    const pdf5StudentA5 = await generateWorksheetPDF({
      type: 5,
      title: 'Handwriting practice',
      paperSize: 'a5',
      fontSize: 15,
      spacing: 6,
      answerMode: 'student',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf5StudentA5, 'ws5_student_a5.pdf');

    // 5D. Answer Mode A5
    const pdf5AnswerA5 = await generateWorksheetPDF({
      type: 5,
      title: 'Handwriting practice',
      paperSize: 'a5',
      fontSize: 15,
      spacing: 6,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf5AnswerA5, 'ws5_answer_a5.pdf');

    // 5E. Spacing 0 pt
    const pdf5Zero = await generateWorksheetPDF({
      type: 5,
      title: 'Handwriting practice - Spacing 0 pt',
      paperSize: 'a4',
      fontSize: 22,
      spacing: 0,
      answerMode: 'answer',
      showHeader: true,
      showFooter: true,
      words: testWords.slice(0, 5)
    });
    savePdf(pdf5Zero, 'ws5_spacing_0pt.pdf');
  }

  console.log('\n--- 6. Testing Composite Mode with All Types 1, 2, 3, 4, 5 ---');
  {
    const compositeSectionsStudent: CompositeWorksheetSection[] = [
      {
        id: 'sec-1',
        type: 1,
        title: 'Section 1: Reorder words',
        instruction: 'Put the words in the right order.',
        words: testWords.slice(0, 2),
        answerMode: 'student',
        sentenceScramble: true
      },
      {
        id: 'sec-2',
        type: 2,
        title: 'Section 2: Write the words',
        instruction: 'Write the correct word under each picture.',
        words: testWords.slice(2, 5),
        answerMode: 'student'
      },
      {
        id: 'sec-3',
        type: 3,
        title: 'Section 3: Match picture with word',
        instruction: 'Match each picture to the correct word.',
        words: testWords.slice(5, 7),
        matchMode: 'word',
        answerMode: 'student'
      },
      {
        id: 'sec-4',
        type: 4,
        title: 'Section 4: Missing letters',
        instruction: 'Fill in the missing vowels.',
        words: testWords.slice(0, 3),
        type4LayoutMode: 'grid',
        blankMode: 'vowels',
        answerMode: 'student'
      },
      {
        id: 'sec-5',
        type: 5,
        title: 'Section 5: Handwriting practice',
        instruction: 'Practice writing the words on the lines.',
        words: testWords.slice(3, 5),
        answerMode: 'student'
      }
    ];

    const pdfCompStudent = await generateCompositeWorksheetPDF({
      title: 'Review Test 1 to 5 (Student Mode)',
      paperSize: 'a4',
      showHeader: true,
      showFooter: true,
      sections: compositeSectionsStudent
    });
    savePdf(pdfCompStudent, 'composite_ws_1_to_5_student.pdf');

    const compositeSectionsAnswer: CompositeWorksheetSection[] = compositeSectionsStudent.map(s => ({
      ...s,
      answerMode: 'answer'
    }));

    const pdfCompAnswer = await generateCompositeWorksheetPDF({
      title: 'Review Test 1 to 5 (Teacher Answer Key)',
      paperSize: 'a4',
      showHeader: true,
      showFooter: true,
      sections: compositeSectionsAnswer
    });
    savePdf(pdfCompAnswer, 'composite_ws_1_to_5_answer.pdf');
  }

  console.log('\n=== ALL WORKSHEET 1 TO 5 PDF SCENARIOS GENERATED SUCCESSFULLY ===');
}

main().catch(err => {
  console.error('Error running matrix:', err);
  process.exit(1);
});
