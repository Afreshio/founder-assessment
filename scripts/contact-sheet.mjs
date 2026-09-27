// Contact sheet of rendered ads (one image per placement) for quick review: ads/out/contact-sheet-<size>.png
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url).pathname;
const ads = JSON.parse(await readFile(`${root}ads/ads.json`, 'utf8'));
const size = process.argv[2] || 'feed';
const cols = 4;
const w = 300;
const h = size === 'feed' ? 375 : 533;

const cells = await Promise.all(
  ads.ads.map(async (ad) => {
    const b64 = (await readFile(`${root}ads/out/${ad.id}_${size}.png`)).toString('base64');
    return `<figure><img src="data:image/png;base64,${b64}"><figcaption>${ad.id.replace('R1_', '')}</figcaption></figure>`;
  })
);
const html = `<style>body{margin:0;padding:24px;background:#e9ecef;font:600 13px system-ui}
  .g{display:grid;grid-template-columns:repeat(${cols},${w}px);gap:20px}
  figure{margin:0} img{width:${w}px;height:${h}px;display:block;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.15)}
  figcaption{margin-top:6px}</style><div class="g">${cells.join('')}</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: cols * (w + 20) + 28, height: 800 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'load' });
await page.screenshot({ path: `${root}ads/out/contact-sheet-${size}.png`, fullPage: true });
await browser.close();
console.log(`ads/out/contact-sheet-${size}.png`);
