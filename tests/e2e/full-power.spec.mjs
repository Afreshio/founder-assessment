import { expect, test } from '@playwright/test';
import { scorePower } from '../../site/lp-assets/core.js';
import { POWER_GROUPS as GROUPS } from '../../site/lp-assets/questions.js';
import { answer, fillLead, stubThirdParties } from './helpers.mjs';

const AD_URL =
  '/full-power/?utm_source=facebook&utm_medium=paid_social&utm_campaign=R1_OwnerAngles_Leads&utm_term=R1_OWN-POWER&utm_content=R1_OWN-POWER_P1-circuit&fbclid=abc123';

// Question order on the page: f1 s1 v1 a1 f2 s2 v2 a2 f3 s3 v3 a3, then role and team size.
const ORDER = ['f1', 's1', 'v1', 'a1', 'f2', 's2', 'v2', 'a2', 'f3', 's3', 'v3', 'a3'];
const PICKS = [4, 1, 2, 1, 3, 2, 1, 0, 4, 1, 2, 1];
const EXPECTED = scorePower(Object.fromEntries(ORDER.map((id, i) => [id, PICKS[i]])), GROUPS);

test('ad click to booked call: pixel, HubSpot, webhook and Calendly all get the right data', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.goto(AD_URL);
  await page.locator('[data-cta=start]').first().click();

  await expect(page.locator('.quiz-count')).toHaveText('1 of 14');
  await answer(page, [...PICKS, 0, 2]);

  await expect(page.locator('.quiz-q')).toHaveText('Your Full Power score is ready');
  await page.locator('button[type=submit]').click();
  await expect(page.locator('.form-error')).toHaveText('Add your first name.');

  await fillLead(page, { note: 'Raising prices on our biggest account' });
  await expect(page.locator('.results .num')).toHaveText(`${EXPECTED.percent}%`);
  await expect(page.locator('.results')).toContainText('Fear is your biggest resistor');

  // HubSpot gets only mapped fields, plus page context
  expect(stub.sent.hubspot).toHaveLength(1);
  expect(stub.sent.hubspot[0].url).toContain('/247393378/test-form');
  expect(stub.sent.hubspot[0].body.fields).toEqual([
    { objectTypeId: '0-1', name: 'email', value: 'sam@example.com' },
    { objectTypeId: '0-1', name: 'firstname', value: 'Sam' },
  ]);
  expect(stub.sent.hubspot[0].body.context.pageUri).toMatch(/\/full-power\/$/);

  // The webhook gets the whole lead, including the ad it came from
  const lead = stub.sent.webhook[0].body;
  expect(lead).toMatchObject({
    email: 'sam@example.com',
    leadMagnet: 'full_power_check',
    cell: 'OWN-POWER',
    utm_source: 'facebook',
    utm_term: 'R1_OWN-POWER',
    utm_content: 'R1_OWN-POWER_P1-circuit',
    fbclid: 'abc123',
    role: 'I own a business with a team',
    teamSize: '6 to 20',
    score: EXPECTED.percent,
    lever: 'fear',
    avoiding: 'Raising prices on our biggest account',
  });

  // Pixel: standard events for optimization, custom events for the funnel, Lead carries the dedup id
  const calls = await stub.fbq();
  expect(calls[0]).toEqual(['init', 'TEST_PIXEL']);
  const names = calls.slice(1).map((c) => `${c[0]}:${c[1]}`);
  expect(names).toEqual([
    'track:PageView',
    'track:ViewContent',
    'trackCustom:AssessmentStart',
    'trackCustom:AssessmentComplete',
    'track:Lead',
    'trackCustom:ResultsView',
  ]);
  const leadCall = calls.find((c) => c[1] === 'Lead');
  expect(leadCall[3]).toEqual({ eventID: lead.event_id });
  expect(leadCall[2]).toMatchObject({ content_name: 'full_power_check', cell: 'OWN-POWER' });

  // Booking opens Calendly prefilled with the person, their result and the ad
  await page.getByRole('button', { name: 'Book my free session' }).click();
  await page.waitForFunction(() => window.__calendlyUrl);
  const booking = new URL(await page.evaluate(() => window.__calendlyUrl));
  expect(booking.origin + booking.pathname).toBe('https://calendly.com/douglas-stevenson/meeting');
  expect(booking.searchParams.get('name')).toBe('Sam');
  expect(booking.searchParams.get('email')).toBe('sam@example.com');
  expect(booking.searchParams.get('a1')).toContain(`Full Power check: ${EXPECTED.percent}%. Biggest resistor: Fear.`);
  expect(booking.searchParams.get('a1')).toContain('Putting off: Raising prices');
  expect(booking.searchParams.get('utm_content')).toBe('R1_OWN-POWER_P1-circuit');

  // A completed Calendly booking fires Schedule; messages from other origins are ignored
  await page.evaluate(() => {
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://evil.test', data: { event: 'calendly.event_scheduled' } }));
    window.dispatchEvent(new MessageEvent('message', { origin: 'https://calendly.com', data: { event: 'calendly.event_scheduled' } }));
  });
  const schedules = (await stub.fbq()).filter((c) => c[1] === 'Schedule');
  expect(schedules).toHaveLength(1);
  expect(schedules[0][0]).toBe('track');

  expect(stub.problems).toEqual([]);
});

test('back button keeps earlier answers and progress', async ({ page }) => {
  await stubThirdParties(page);
  await page.goto('/full-power/');
  await page.locator('[data-cta=start]').first().click();
  await answer(page, [3, 1]);
  await expect(page.locator('.quiz-count')).toHaveText('3 of 14');
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.locator('.quiz-count')).toHaveText('2 of 14');
  await expect(page.locator('.quiz-option[aria-pressed=true]')).toHaveText('Rarely');
});

test('progress survives a reload', async ({ page }) => {
  await stubThirdParties(page);
  await page.goto('/full-power/');
  await page.locator('[data-cta=start]').first().click();
  await answer(page, [1, 2, 3]);
  await page.reload();
  await page.locator('[data-cta=start]').first().click();
  await expect(page.locator('.quiz-count')).toHaveText('4 of 14');
});

test('?gate=soft shows the result first and offers the email inside it', async ({ page }) => {
  const stub = await stubThirdParties(page);
  await page.goto('/full-power/?gate=soft');
  await page.locator('[data-cta=start]').first().click();
  await answer(page, [...PICKS, 1, 1]);
  await expect(page.locator('.results .num')).toHaveText(`${EXPECTED.percent}%`);
  expect((await stub.events()).some((e) => e.name === 'Lead')).toBe(false);

  const gate = page.locator('[data-soft-gate]');
  await expect(gate).toBeVisible();
  await fillLead(page, {}, gate);
  await expect(gate.locator('.sent')).toBeVisible();
  expect(stub.sent.webhook[0].body.leadMagnet).toBe('full_power_check');
});

test('a failed HubSpot delivery still shows the result', async ({ page }) => {
  const stub = await stubThirdParties(page, { hubspotStatus: 500 });
  await page.goto('/full-power/');
  await page.locator('[data-cta=start]').first().click();
  await answer(page, [...PICKS, 0, 0]);
  await fillLead(page);
  await expect(page.locator('.results .num')).toBeVisible();
  expect(stub.sent.webhook).toHaveLength(1);
  expect(stub.logs.some((l) => l.startsWith('error: [afresh] Lead delivery failed'))).toBe(true);
  // The browser logs the 500 itself; anything else would be a real problem.
  expect(stub.problems.filter((p) => !p.includes('status of 500'))).toEqual([]);
});
