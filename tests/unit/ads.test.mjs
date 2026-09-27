import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { lintAd, lintAll } from '../../scripts/lint-copy.mjs';

const root = new URL('../..', import.meta.url).pathname;
const data = JSON.parse(await readFile(`${root}ads/ads.json`, 'utf8'));
const base = { id: 'R1_OWN-POWER_X', cell: 'OWN-POWER', creative: 'circuit', headline: 'Short', description: 'Free', cta: 'LEARN_MORE' };

test('the shipped ads and landing pages pass the copy lint', async () => {
  const errors = (await lintAll()).flatMap((item) => item.errors.map((e) => `${item.name}: ${e}`));
  assert.deepEqual(errors, []);
});

test('every cell has three ads and every ad has rendered images', () => {
  for (const cell of data.cells) assert.equal(data.ads.filter((a) => a.cell === cell.id).length, 3, cell.id);
  for (const ad of data.ads) {
    for (const size of ['feed', 'story']) assert.ok(existsSync(`${root}ads/out/${ad.id}_${size}.png`), `${ad.id} ${size}: run npm run render:ads`);
  }
});

test('lint flags a personal attribute aimed at the viewer', () => {
  const { errors } = lintAd({ ...base, primaryText: 'Are you stressed about payroll? Try this.' }, data.cells);
  assert.ok(errors.some((e) => e.includes('personal attributes')), errors.join('\n'));
});

test('lint allows the topic when it is not about the viewer', () => {
  const { errors, warnings } = lintAd({ ...base, primaryText: 'Owners who feel overwhelmed often skip the basics.' }, data.cells);
  assert.deepEqual(errors, []);
  assert.ok(warnings.some((w) => w.includes('overwhelmed')));
});

test('lint catches em dashes, bad CTAs, unknown creatives and missing pages', () => {
  const { errors } = lintAd({ ...base, cta: 'TAKE_QUIZ', creative: 'nope', primaryText: 'One thing — then another.' }, [
    { id: 'OWN-POWER', url: 'https://afresh.io/missing-page/' },
  ]);
  assert.ok(errors.some((e) => e.includes('dash')));
  assert.ok(errors.some((e) => e.includes('TAKE_QUIZ')));
  assert.ok(errors.some((e) => e.includes('creative')));
  assert.ok(errors.some((e) => e.includes('/missing-page/')));
});
