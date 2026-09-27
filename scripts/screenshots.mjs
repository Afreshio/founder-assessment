// Phone-size screenshots of every landing page and its main flow, for review before launch.
// Usage: npm run serve (in another terminal), then: node scripts/screenshots.mjs [outDir] [--full]
// --full adds a full-length capture of each page (large files; handy for review, not for the repo).
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.env.BASE_URL || 'http://localhost:4173';
const args = process.argv.slice(2);
const full = args.includes('--full');
const out = args.find((a) => !a.startsWith('--')) || 'docs/screenshots';
await mkdir(out, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await context.newPage();
const problems = [];
page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
page.on('console', (m) => m.type() === 'error' && problems.push(`console: ${m.text()}`));

async function answerAll(count) {
  for (let i = 0; i < count; i += 1) {
    await page.locator('.quiz-option').nth([3, 2, 1, 3, 2][i % 5]).click();
    await page.waitForTimeout(220);
  }
}

async function fillLead(note) {
  await page.fill('input[name=firstName] >> nth=0', 'Sam');
  await page.fill('input[name=email] >> nth=0', 'sam@example.com');
  if (note) await page.fill('textarea[name=note]', note);
  await page.click('button[type=submit] >> nth=0');
}

for (const p of ['full-power', 'reset', 'tiny-habits', 'career-move']) {
  await page.goto(`${base}/${p}/`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${out}/${p}-hero.png` });
  if (full) await page.screenshot({ path: `${out}/${p}-page.png`, fullPage: true });
}

await page.goto(`${base}/full-power/`, { waitUntil: 'networkidle' });
await page.evaluate(() => sessionStorage.clear());
await page.click('[data-cta=start] >> nth=0');
await page.screenshot({ path: `${out}/full-power-question.png` });
await answerAll(14);
await page.screenshot({ path: `${out}/full-power-email.png` });
await fillLead('Raising prices on our biggest account');
await page.waitForSelector('.results');
await page.screenshot({ path: `${out}/full-power-results.png`, fullPage: true });

await page.goto(`${base}/career-move/`, { waitUntil: 'networkidle' });
await page.click('[data-cta=start] >> nth=0');
await answerAll(12);
await fillLead('Director of Product');
await page.waitForSelector('.results');
await page.screenshot({ path: `${out}/career-move-results.png`, fullPage: true });

await page.goto(`${base}/tiny-habits/`, { waitUntil: 'networkidle' });
await page.click('.chip[data-key=anchor] >> nth=0');
await page.click('.chip[data-key=behavior] >> nth=0');
await page.click('.chip[data-key=celebration] >> nth=0');
await page.locator('#builder').screenshot({ path: `${out}/tiny-habits-builder.png` });

await page.clock.install();
await page.goto(`${base}/reset/`, { waitUntil: 'networkidle' });
await page.click('[data-pacer=start]');
await page.clock.runFor(5500);
await page.waitForTimeout(300);
await page.locator('.hero').screenshot({ path: `${out}/reset-pacer.png` });

await browser.close();
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`Screenshots written to ${out}/`);
