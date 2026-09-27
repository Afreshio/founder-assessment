// Pre-flight checks for ad copy (ads/ads.json) and landing page copy (site/).
// Errors fail the build; warnings are printed for a human to judge.
// Usage: npm run lint:ads
import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { CREATIVES } from '../ads/creatives.mjs';

const root = new URL('..', import.meta.url).pathname;

// Meta's Personal Attributes policy: ads may not assert or imply the viewer has a sensitive trait
// (physical or mental health, financial status, and others). "Are you anxious?" fails; "Calm under
// pressure for owners" is fine. We flag any sentence that pairs second-person language with one of these.
export const SENSITIVE = [
  'anxiety', 'anxious', 'depress', 'insomnia', 'can\'t sleep', 'sleepless', 'burn(?:ed|t)? ?out', 'panic',
  'trauma', 'ptsd', 'adhd', 'mental health', 'disorder', 'addict', 'lonely', 'overweight', 'in debt',
  'broke', 'bankrupt', 'unemployed', 'laid off', 'fired', 'divorc', 'stressed', 'overwhelmed', 'exhausted',
];
// Health-adjacent words are allowed, but a domain full of them risks Meta classifying it as health and
// wellness, which restricts optimizing for Lead events. Worth knowing which ads carry them.
export const HEALTH_ADJACENT = ['sleep', 'meditat', 'breath', 'stress', 'mindful', 'wellness', 'mantra', 'therapy', 'heal', 'cure'];
export const CLAIMS = ['guarantee', 'double your', '10x', 'overnight', '\\$\\d', 'risk[- ]free'];
export const CTAS = ['LEARN_MORE', 'SIGN_UP', 'BOOK_NOW', 'GET_QUOTE', 'SUBSCRIBE', 'DOWNLOAD', 'APPLY_NOW', 'CONTACT_US'];

const SECOND_PERSON = /\b(you|your|you're|youre|yours|yourself)\b/i;
const DASHES = /[—–]/; // em dash, en dash (house style: none)

const rx = (list) => new RegExp(`\\b(${list.join('|')})`, 'i');
const sentences = (text) => text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export function lintAd(ad, cells) {
  const errors = [];
  const warnings = [];
  const fields = { primaryText: ad.primaryText, headline: ad.headline, description: ad.description };

  for (const [field, text] of Object.entries(fields)) {
    if (!text) {
      errors.push(`${field} is empty`);
      continue;
    }
    if (DASHES.test(text)) errors.push(`${field} has an em or en dash (house style)`);
    for (const sentence of sentences(text)) {
      const hit = sentence.match(rx(SENSITIVE));
      if (hit && SECOND_PERSON.test(sentence)) errors.push(`${field}: "${sentence}" pairs "you" with "${hit[0]}" (personal attributes policy)`);
      else if (hit) warnings.push(`${field}: mentions "${hit[0]}"; keep it about the topic, never about the viewer`);
    }
    const claim = text.match(rx(CLAIMS));
    if (claim) warnings.push(`${field}: "${claim[0]}" reads as a results claim`);
    const health = text.match(rx(HEALTH_ADJACENT));
    if (health) warnings.push(`${field}: health-adjacent word "${health[0]}" (see domain classification note)`);
  }

  if (ad.headline && ad.headline.length > 40) warnings.push(`headline is ${ad.headline.length} chars; mobile shows about 40`);
  if (ad.description && ad.description.length > 30) warnings.push(`description is ${ad.description.length} chars; keep under 30`);
  const hook = (ad.primaryText || '').split(/\n\s*\n/)[0];
  if (hook.length > 125) warnings.push(`first paragraph is ${hook.length} chars; only about 125 show before "See more"`);
  if (!CTAS.includes(ad.cta)) errors.push(`cta "${ad.cta}" is not a Meta call to action button`);
  if (!CREATIVES[ad.creative]) errors.push(`creative "${ad.creative}" has no template in ads/creatives.mjs`);

  const cell = cells.find((c) => c.id === ad.cell);
  if (!cell) errors.push(`cell "${ad.cell}" is not defined`);
  else {
    const path = new URL(cell.url).pathname;
    if (!existsSync(`${root}site${path}index.html`)) errors.push(`landing page ${path} does not exist in site/`);
    if (!ad.id.includes(`_${cell.id}_`)) errors.push(`ad id should contain _${cell.id}_ so reports group by cell`);
  }
  return { errors, warnings };
}

async function sitePages(dir = `${root}site`) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = `${dir}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await sitePages(path)));
    else if (/\.(html|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

export async function lintAll() {
  const data = JSON.parse(await readFile(`${root}ads/ads.json`, 'utf8'));
  const report = [];
  const ids = new Set();
  for (const ad of data.ads) {
    const result = lintAd(ad, data.cells);
    if (ids.has(ad.id)) result.errors.push('duplicate ad id');
    ids.add(ad.id);
    report.push({ name: ad.id, ...result });
  }
  for (const file of await sitePages()) {
    const text = await readFile(file, 'utf8');
    const errors = [];
    text.split('\n').forEach((line, i) => {
      if (DASHES.test(line)) errors.push(`line ${i + 1}: em or en dash (house style)`);
    });
    if (errors.length) report.push({ name: file.replace(root, ''), errors, warnings: [] });
  }
  return report;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = await lintAll();
  let errorCount = 0;
  for (const item of report) {
    if (!item.errors.length && !item.warnings.length) continue;
    console.log(`\n${item.name}`);
    item.errors.forEach((e) => console.log(`  ERROR ${e}`));
    item.warnings.forEach((w) => console.log(`  warn  ${w}`));
    errorCount += item.errors.length;
  }
  console.log(`\n${report.length} items checked, ${errorCount} errors`);
  process.exit(errorCount ? 1 : 0);
}
