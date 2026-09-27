import { expect, test } from '@playwright/test';
import { stubThirdParties } from './helpers.mjs';

const PAGES = [
  { path: '/full-power/', cell: 'OWN-POWER' },
  { path: '/reset/', cell: 'OWN-CALM' },
  { path: '/tiny-habits/', cell: 'OWN-HABIT' },
  { path: '/career-move/', cell: 'CAREER' },
];

for (const { path, cell } of PAGES) {
  test(`${path} loads clean on a small phone`, async ({ page }) => {
    const stub = await stubThirdParties(page);
    await page.setViewportSize({ width: 360, height: 740 });
    await page.goto(path);

    await expect(page.locator('h1')).toHaveCount(1);
    const primaryCta = page.locator('.hero .btn-primary').first();
    await expect(primaryCta).toBeVisible();
    const box = await primaryCta.boundingBox();
    expect(box.y + box.height, 'hero CTA is above the fold').toBeLessThanOrEqual(740 + 120);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, 'no sideways scrolling').toBeLessThanOrEqual(0);

    const unlabeled = await page.evaluate(() =>
      [...document.querySelectorAll('img:not([alt]), input:not([type=hidden]), textarea')]
        .filter((el) => el.tagName === 'IMG' || !(el.labels?.length || el.getAttribute('aria-label')))
        .map((el) => el.outerHTML.slice(0, 80))
    );
    expect(unlabeled).toEqual([]);

    const view = (await stub.events()).find((e) => e.name === 'ViewContent');
    expect(view.params.cell).toBe(cell);
    expect(await page.locator('meta[property="og:image"]').getAttribute('content')).toMatch(/^https:\/\/afresh\.io\/lp-assets\/img\/og-.+\.png$/);
    expect(stub.problems).toEqual([]);
  });
}

test('link-preview images exist for every page', async ({ request }) => {
  for (const name of ['full-power', 'reset', 'tiny-habits', 'career-move']) {
    const response = await request.get(`/lp-assets/img/og-${name}.png`);
    expect(response.ok(), name).toBe(true);
  }
});

test('sticky CTA appears once the hero scrolls away, and hides during the quiz', async ({ page }) => {
  await stubThirdParties(page);
  await page.goto('/full-power/');
  const sticky = page.locator('.sticky-cta');
  await expect(sticky).not.toHaveClass(/show/);
  await page.mouse.wheel(0, 1800);
  await expect(sticky).toHaveClass(/show/);
  await sticky.getByRole('link').click();
  await expect(page.locator('#quiz .quiz-q')).toBeVisible();
  await expect(sticky).not.toHaveClass(/show/);
});

test('footer booking link opens Calendly without a lead', async ({ page }) => {
  await stubThirdParties(page);
  await page.goto('/career-move/?utm_source=facebook&utm_content=K2');
  await page.locator('footer [data-cta=book]').click();
  await page.waitForFunction(() => window.__calendlyUrl);
  const url = new URL(await page.evaluate(() => window.__calendlyUrl));
  expect(url.searchParams.get('utm_content')).toBe('K2');
  expect(url.searchParams.get('email')).toBeNull();
});

test('privacy page is reachable from every landing page', async ({ page }) => {
  for (const { path } of PAGES) {
    await page.goto(path);
    await expect(page.locator('a[href="/privacy/"]').first()).toBeAttached();
  }
  const response = await page.goto('/privacy/');
  expect(response.ok()).toBe(true);
});
