import { expect, test } from '@playwright/test';
import { scoreCareer } from '../../site/lp-assets/core.js';
import { CAREER_GROUPS } from '../../site/lp-assets/questions.js';
import { answer, fillLead, stubThirdParties } from './helpers.mjs';

test('60-second reset: paces 4-7-8, then offers the series and records the lead', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.clock.install();
  await page.goto('/reset/');

  await page.getByRole('button', { name: 'Start the reset' }).click();
  await expect(page.getByRole('button', { name: 'Start the reset' })).toBeHidden();
  await expect(page.locator('.pacer .phase')).toHaveText('Breathe out');
  await page.clock.runFor(3_000);
  await expect(page.locator('.pacer .phase')).toHaveText('Breathe in');
  await expect(page.locator('.pacer .cycle')).toHaveText('Round 1 of 3');
  await page.clock.runFor(4_000);
  await expect(page.locator('.pacer .phase')).toHaveText('Hold');
  await expect(page.locator('.pacer .count')).toHaveText('7');
  await page.clock.runFor(7_000);
  await expect(page.locator('.pacer .phase')).toHaveText('Breathe out');
  await expect(page.locator('.pacer .count')).toHaveText('8');

  await expect(page.locator('#after-reset')).toBeHidden();
  await page.clock.runFor(8_000 + 19_000 * 2);
  await expect(page.locator('.pacer .phase')).toHaveText('Nice.');
  await expect(page.locator('#after-reset')).toBeVisible();

  const names = (await stub.events()).map((e) => e.name);
  expect(names).toEqual(['ViewContent', 'ResetStart', 'ResetComplete']);

  const after = page.locator('#after-reset');
  await fillLead(page, { role: null }, after);
  await expect(after.locator('.form-error')).toHaveText('Choose the option that fits best.');
  await after.locator('select[name=role]').selectOption('I am a startup founder');
  await after.locator('button[type=submit]').click();
  await expect(after.locator('.sent')).toContainText('Day 1 is on its way');
  expect(stub.sent.webhook[0].body).toMatchObject({ leadMagnet: 'calm_operator_reset', cell: 'OWN-CALM', role: 'I am a startup founder' });
  expect(stub.problems).toEqual([]);
});

test('60-second reset: stop returns to ready', async ({ page }) => {
  await stubThirdParties(page);
  await page.clock.install();
  await page.goto('/reset/');
  await page.getByRole('button', { name: 'Start the reset' }).click();
  await page.clock.runFor(5_000);
  await page.getByRole('button', { name: 'Stop' }).click();
  await expect(page.locator('.pacer .phase')).toHaveText('Ready');
  await expect(page.getByRole('button', { name: 'Start the reset' })).toBeVisible();
  await page.clock.runFor(60_000);
  await expect(page.locator('#after-reset')).toBeHidden();
});

test('Tiny Habits builder: chips and custom text build the recipe that gets emailed', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.goto('/tiny-habits/');
  const card = page.locator('#recipe-card');
  await expect(page.locator('#recipe-next')).toBeHidden();

  await page.getByRole('button', { name: 'sit down at my desk' }).click();
  await page.getByRole('button', { name: 'open the bank balance and read it' }).click();
  await expect(card.locator('.recipe')).toHaveText('After I sit down at my desk, I will open the bank balance and read it.');
  expect((await stub.events()).filter((e) => e.name === 'RecipeBuilt')).toHaveLength(1);

  await page.fill('[data-custom=anchor]', 'After I park the car');
  await expect(page.getByRole('button', { name: 'sit down at my desk' })).toHaveAttribute('aria-pressed', 'false');
  await page.getByRole('button', { name: 'smile' }).click();
  await expect(card).toContainText('After I park the car, I will open the bank balance and read it.');
  await expect(card).toContainText('Then I celebrate: smile.');

  await fillLead(page, {}, page.locator('#recipe-next'));
  await expect(page.locator('#recipe-next .sent')).toBeVisible();
  expect(stub.sent.webhook[0].body).toMatchObject({
    leadMagnet: 'tiny_habits_starter',
    cell: 'OWN-HABIT',
    recipe: 'After I park the car, I will open the bank balance and read it. Then I celebrate: smile.',
    role: 'I own a business with a team',
  });
  expect(stub.problems).toEqual([]);
});

test('Career scorecard: result, weakest pillar and lead payload', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.goto('/career-move/?utm_source=facebook&utm_content=R1_CAREER_K1-campaign');
  await page.locator('[data-cta=start]').first().click();
  await expect(page.locator('.quiz-count')).toHaveText('1 of 12');

  // Order: t1 s1 n1 p1 e1 t2 s2 n2 p2 e2
  const ids = ['t1', 's1', 'n1', 'p1', 'e1', 't2', 's2', 'n2', 'p2', 'e2'];
  const picks = [4, 3, 0, 2, 3, 3, 2, 1, 2, 4];
  const expected = scoreCareer(Object.fromEntries(ids.map((id, i) => [id, picks[i]])), CAREER_GROUPS);
  await answer(page, [...picks, 1, 2]);
  await fillLead(page, { note: 'Director of Product' });

  await expect(page.locator('.results .num')).toHaveText(String(expected.percent));
  await expect(page.locator('.results')).toContainText('Your network is untapped');
  expect(stub.sent.webhook[0].body).toMatchObject({
    leadMagnet: 'career_campaign_scorecard',
    cell: 'CAREER',
    weakest: 'network',
    situation: 'Between roles',
    level: 'Director',
    targetRole: 'Director of Product',
    utm_content: 'R1_CAREER_K1-campaign',
  });
  expect(stub.problems).toEqual([]);
});

test('attribution: the ad that brought someone in follows them to other pages, until a new ad click', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.goto('/full-power/?utm_source=facebook&utm_content=AD_A&fbclid=first');
  await page.goto('/tiny-habits/');
  await page.getByRole('button', { name: 'sit down at my desk' }).click();
  await page.getByRole('button', { name: 'take one slow 4-7-8 breath' }).click();
  await fillLead(page, {}, page.locator('#recipe-next'));
  await expect(page.locator('#recipe-next .sent')).toBeVisible();
  expect(stub.sent.webhook[0].body).toMatchObject({ utm_content: 'AD_A', fbclid: 'first', first_page: '/full-power/' });

  await page.goto('/reset/?utm_source=facebook&utm_content=AD_B');
  await fillLead(page, {}, page.locator('.section.alt'));
  await expect(page.locator('.section.alt .sent')).toBeVisible();
  const second = stub.sent.webhook[1].body;
  expect(second).toMatchObject({ utm_content: 'AD_B', first_page: '/reset/' });
  expect(second.fbclid).toBeUndefined();
});
