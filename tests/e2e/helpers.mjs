// Stubs every third party the pages talk to, and records what each would have received.
export const TEST_CONFIG = `export const CONFIG = {
  metaPixelId: 'TEST_PIXEL',
  hubspot: {
    portalId: '247393378',
    formGuid: 'test-form',
    endpoint: 'https://api.hsforms.com/submissions/v3/integration/submit',
    fieldMap: { email: 'email', firstName: 'firstname' },
  },
  webhookUrl: 'https://hooks.test/lead',
  bookingUrl: 'https://calendly.com/douglas-stevenson/meeting',
};`;

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

export async function stubThirdParties(page, { hubspotStatus = 200 } = {}) {
  const sent = { hubspot: [], webhook: [] };
  const problems = [];
  const logs = [];

  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    logs.push(`${m.type()}: ${m.text()}`);
    if (m.type() === 'error' && !m.text().startsWith('[afresh] Lead delivery failed')) problems.push(`console: ${m.text()}`);
  });

  await page.route('**/lp-assets/config.js', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: TEST_CONFIG })
  );
  await page.route('https://connect.facebook.net/**', (route) => route.fulfill({ contentType: 'text/javascript', body: '' }));
  await page.route('https://assets.calendly.com/**', (route) =>
    route.request().url().endsWith('.css')
      ? route.fulfill({ contentType: 'text/css', body: '' })
      : route.fulfill({
          contentType: 'text/javascript',
          body: 'window.Calendly = { initPopupWidget: ({ url }) => { window.__calendlyUrl = url; } };',
        })
  );
  const capture = (list, status) => (route) => {
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    list.push({ url: route.request().url(), body: route.request().postDataJSON() });
    return route.fulfill({ status, headers: CORS, contentType: 'application/json', body: '{}' });
  };
  await page.route('https://api.hsforms.com/**', capture(sent.hubspot, hubspotStatus));
  await page.route('https://hooks.test/**', capture(sent.webhook, 200));

  return {
    sent,
    problems,
    logs,
    /** Every fbq() call so far, as plain arrays. The stubbed fbevents.js never drains the queue. */
    fbq: () => page.evaluate(() => (window.fbq?.queue || []).map((args) => JSON.parse(JSON.stringify(Array.from(args))))),
    events: () => page.evaluate(() => window.__afreshEvents),
  };
}

/** Answer the current quiz: `picks` are option indexes, one per question. */
export async function answer(page, picks) {
  for (const pick of picks) {
    const heading = await page.locator('.quiz-q').textContent();
    await page.locator('.quiz-option').nth(pick).click();
    await page.waitForFunction((previous) => document.querySelector('.quiz-q')?.textContent !== previous, heading);
  }
}

export async function fillLead(page, { firstName = 'Sam', email = 'sam@example.com', note, role = 'I own a business with a team' } = {}, scope = page) {
  await scope.locator('input[name=firstName]').first().fill(firstName);
  await scope.locator('input[name=email]').first().fill(email);
  if (note !== undefined) await scope.locator('textarea[name=note]').first().fill(note);
  const select = scope.locator('select[name=role]').first();
  if (role && (await select.count())) await select.selectOption(role);
  await scope.locator('button[type=submit]').first().click();
}
