// Render every ad in ads/ads.json to PNG (feed 4:5 and story 9:16), plus link-preview images for the pages.
// Usage: npm run render:ads
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { frame, SIZES } from '../ads/creatives.mjs';

const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const ads = JSON.parse(await readFile(`${root}ads/ads.json`, 'utf8'));

async function dataUri(path, type) {
  return `data:${type};base64,${(await readFile(path)).toString('base64')}`;
}

const fontDir = require.resolve('@fontsource/inter/package.json').replace('package.json', 'files/');
const weights = [400, 700, 800, 900];
const fontFaces = (
  await Promise.all(
    weights.map(async (w) => `@font-face{font-family:Inter;font-weight:${w};src:url(${await dataUri(`${fontDir}inter-latin-${w}-normal.woff2`, 'font/woff2')}) format('woff2')}`)
  )
).join('\n');
const assets = { fontFaces, headshot: await dataUri(`${root}site/lp-assets/img/doug.webp`, 'image/webp') };

// Link previews: one per landing page, drawn from that page's lead creative.
const OG = { 'og-full-power': 'circuit', 'og-reset': 'breath', 'og-tiny-habits': 'recipe', 'og-career-move': 'campaign' };

const browser = await chromium.launch();
const page = await browser.newPage();
await mkdir(`${root}ads/out`, { recursive: true });

async function shoot(name, sizeName, path) {
  const { width, height } = SIZES[sizeName];
  await page.setViewportSize({ width, height });
  await page.setContent(frame(name, sizeName, assets), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const overflow = await page.evaluate(() => {
    const f = document.querySelector('.frame');
    return f.scrollHeight > f.clientHeight + 1 || f.scrollWidth > f.clientWidth + 1;
  });
  if (overflow) throw new Error(`${name} (${sizeName}) overflows its frame: shorten the copy or reduce hsize`);
  await page.screenshot({ path });
}

const manifest = [];
for (const ad of ads.ads) {
  for (const sizeName of ['feed', 'story']) {
    const file = `ads/out/${ad.id}_${sizeName}.png`;
    await shoot(ad.creative, sizeName, `${root}${file}`);
    manifest.push(file);
  }
}
for (const [file, creative] of Object.entries(OG)) {
  await shoot(creative, 'og', `${root}site/lp-assets/img/${file}.png`);
  manifest.push(`site/lp-assets/img/${file}.png`);
}
await browser.close();
await writeFile(`${root}ads/out/manifest.txt`, `${manifest.join('\n')}\n`);
console.log(`Rendered ${manifest.length} images`);
