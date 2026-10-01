import puppeteer from 'file:///C:/Users/TGC/.gemini/config/skills/web-app-qa/node_modules/puppeteer-core/lib/puppeteer/puppeteer-core.js';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const APP_URL = 'http://localhost:3005/worksheet';
const OUTPUT_DIR = path.join(process.cwd(), 'test_output_ws1_5', 'browser_focused_previews');
const ARTIFACT_DIR = 'C:\\Users\\TGC\\.gemini\\antigravity\\brain\\31d0f4be-68d4-4eba-b392-5c7e1128dd7f';

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Load real base64 png images
const sampleWordsRaw = JSON.parse(fs.readFileSync('test_words_png.json', 'utf8'));
const getImg = (name) => {
  const found = sampleWordsRaw.find((w) => w.term === name);
  return found ? found.imageUrl : sampleWordsRaw[0].imageUrl;
};

const TEST_DECKS = [
  {
    id: 'deck-ws1-5-qa',
    title: 'QA Vocabulary Deck Types 1-5',
    description: 'Testing Types 1-5 Student & Answer Modes in browser',
    createdAt: Date.now() + 1000000,
    userId: 'qa-tester',
    words: [
      { id: 'w1', term: 'apple', definition: 'quả táo', imageUrl: getImg('apple'), exampleSentence: 'I eat a sweet red apple every day.' },
      { id: 'w2', term: 'ball', definition: 'quả bóng', imageUrl: getImg('ball'), exampleSentence: 'The children play with a colorful ball.' },
      { id: 'w3', term: 'cat', definition: 'con mèo', imageUrl: getImg('cat'), exampleSentence: 'The little cat sleeps quietly on the rug.' },
      { id: 'w4', term: 'duck', definition: 'con vịt', imageUrl: getImg('duck'), exampleSentence: 'A yellow duck swims peacefully in the pond.' },
      { id: 'w5', term: 'fish', definition: 'con cá', imageUrl: getImg('fish'), exampleSentence: 'Gold fish swim fast in clear water.' },
      { id: 'w6', term: 'hat', definition: 'cái mũ', imageUrl: getImg('hat'), exampleSentence: 'She wears a nice warm hat in winter.' }
    ]
  }
];

// Helper to wait for server to come alive
async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status === 200 || res.status === 304) {
        return true;
      }
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`Server did not respond at ${url} within ${timeoutMs}ms`);
}

async function run() {
  console.log('=== STARTING WS 1 TO 5 COMPREHENSIVE BROWSER QA ===');

  // Check if server is already running on port 3005
  let serverProcess = null;
  let isRunning = false;
  try {
    const res = await fetch('http://localhost:3005');
    if (res.ok || res.status === 200 || res.status === 304) {
      console.log('✓ Existing server already active on port 3005');
      isRunning = true;
    }
  } catch {
    // not running
  }

  if (!isRunning) {
    console.log('Starting local server (tsx server.ts)...');
    serverProcess = spawn('cmd.exe', ['/c', 'npm run dev'], {
      cwd: process.cwd(),
      stdio: 'pipe'
    });
    serverProcess.stdout.on('data', (d) => process.stdout.write(`[SERVER]: ${d.toString()}`));
    serverProcess.stderr.on('data', (d) => process.stderr.write(`[SERVER-ERR]: ${d.toString()}`));
    await waitForServer('http://localhost:3005');
    console.log('✓ Server started successfully!');
  }

  const consoleErrors = [];
  const pageErrors = [];

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--window-size=1440,1100'
    ],
    defaultViewport: { width: 1440, height: 1100 }
  });

  const page = await browser.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('net::ERR_ABORTED') && !text.includes('favicon.ico')) {
        consoleErrors.push(text);
        console.error('[BROWSER CONSOLE ERROR]:', text);
      }
    }
  });

  page.on('pageerror', (err) => {
    pageErrors.push(err.message);
    console.error('[BROWSER PAGE ERROR]:', err.message);
  });

  try {
    await page.evaluateOnNewDocument((decks) => {
      localStorage.setItem('vocagame_custom_sets', JSON.stringify(decks));
    }, TEST_DECKS);

    console.log('1. Navigating to', APP_URL);
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 25000 });

    await page.evaluate((decks) => {
      localStorage.setItem('vocagame_custom_sets', JSON.stringify(decks));
    }, TEST_DECKS);

    // Switch to multi-deck mode to load test vocabulary
    console.log('2. Loading vocabulary via multi-deck selection...');
    await page.waitForSelector('[data-testid="source-mode-multi"]', { timeout: 15000 });
    await page.click('[data-testid="source-mode-multi"]');
    await new Promise((r) => setTimeout(r, 600));

    await page.waitForSelector('[data-testid="multi-deck-checkbox-deck-ws1-5-qa"]', { timeout: 10000 });
    await page.evaluate(() => {
      const cb = document.querySelector('[data-testid="multi-deck-checkbox-deck-ws1-5-qa"]');
      if (cb) (cb.closest('label') || cb).click();
    });

    console.log('3. Applying selected vocabulary...');
    await page.waitForSelector('[data-testid="load-multi-decks-btn"]:not([disabled])', { timeout: 10000 });
    await page.click('[data-testid="load-multi-decks-btn"]');
    await new Promise((r) => setTimeout(r, 1500));

    // Ensure Single mode
    await page.waitForSelector('[data-testid="mode-tab-single"]', { timeout: 10000 });
    await page.click('[data-testid="mode-tab-single"]');
    await new Promise((r) => setTimeout(r, 600));

    const typesToTest = [1, 2, 3, 4, 5];

    for (const type of typesToTest) {
      console.log(`\n========================================`);
      console.log(`Testing Worksheet Type ${type} in Browser`);
      console.log(`========================================`);

      // Click type card
      const typeCardSelector = `[data-testid="single-type-card-${type}"]`;
      await page.waitForSelector(typeCardSelector, { timeout: 10000 });
      await page.click(typeCardSelector);
      await new Promise((r) => setTimeout(r, 1500));

      // 1. Test "Học sinh" (Student Mode)
      const studentBtn = `[data-testid="single-type${type}-answermode-student"]`;
      if (await page.$(studentBtn)) {
        console.log(`  -> Switching Type ${type} to 'Học sinh'...`);
        await page.click(studentBtn);
        await new Promise((r) => setTimeout(r, 2000));

        const previewContainer = await page.$('[data-testid="pdf-preview-container"]');
        if (previewContainer) {
          const shotPath = path.join(OUTPUT_DIR, `ws${type}_focused_student.png`);
          await previewContainer.screenshot({ path: shotPath });
          fs.copyFileSync(shotPath, path.join(ARTIFACT_DIR, `ws${type}_focused_student.png`));
          console.log(`     ✓ Saved focused preview: ws${type}_focused_student.png`);
        }
      }

      // 2. Test "Đáp án" (Answer Mode)
      const answerBtn = `[data-testid="single-type${type}-answermode-answer"]`;
      if (await page.$(answerBtn)) {
        console.log(`  -> Switching Type ${type} to 'Đáp án'...`);
        await page.click(answerBtn);
        await new Promise((r) => setTimeout(r, 2000));

        const previewContainer = await page.$('[data-testid="pdf-preview-container"]');
        if (previewContainer) {
          const shotPath = path.join(OUTPUT_DIR, `ws${type}_focused_answer.png`);
          await previewContainer.screenshot({ path: shotPath });
          fs.copyFileSync(shotPath, path.join(ARTIFACT_DIR, `ws${type}_focused_answer.png`));
          console.log(`     ✓ Saved focused preview: ws${type}_focused_answer.png`);
        }
      }

      // 3. Test Spacing 0 pt
      const spacingSelect = await page.$('[data-testid="single-spacing-select"]');
      if (spacingSelect) {
        console.log(`  -> Switching Type ${type} to Spacing 0 pt...`);
        await page.select('[data-testid="single-spacing-select"]', '0');
        await new Promise((r) => setTimeout(r, 2000));

        const previewContainer = await page.$('[data-testid="pdf-preview-container"]');
        if (previewContainer) {
          const shotPath = path.join(OUTPUT_DIR, `ws${type}_focused_spacing0.png`);
          await previewContainer.screenshot({ path: shotPath });
          fs.copyFileSync(shotPath, path.join(ARTIFACT_DIR, `ws${type}_focused_spacing0.png`));
          console.log(`     ✓ Saved focused preview: ws${type}_focused_spacing0.png`);
        }
      }
    }

    // 4. Test Composite Mode
    console.log(`\n========================================`);
    console.log(`Testing Composite Mode in Browser`);
    console.log(`========================================`);
    await page.waitForSelector('[data-testid="mode-tab-composite"]', { timeout: 10000 });
    await page.click('[data-testid="mode-tab-composite"]');
    await new Promise((r) => setTimeout(r, 2000));

    const compPreviewContainer = await page.$('[data-testid="pdf-preview-container"]');
    if (compPreviewContainer) {
      const compShotPath = path.join(OUTPUT_DIR, `composite_ws_focused_preview.png`);
      await compPreviewContainer.screenshot({ path: compShotPath });
      fs.copyFileSync(compShotPath, path.join(ARTIFACT_DIR, `composite_ws_focused_preview.png`));
      console.log(`✓ Saved focused composite preview: composite_ws_focused_preview.png`);
    }

    console.log('\n--- BROWSER QA RESULTS ---');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);

    if (consoleErrors.length > 0 || pageErrors.length > 0) {
      throw new Error('QA Failed with console or page errors.');
    }

    console.log('🎉 ALL BROWSER QA TESTS FOR TYPES 1 TO 5 PASSED WITH 0 ERRORS!');
  } finally {
    await browser.close();
    if (serverProcess) {
      console.log('Stopping test server process...');
      serverProcess.kill('SIGTERM');
    }
  }
}

run().catch((err) => {
  console.error('Fatal Browser QA error:', err);
  process.exit(1);
});
