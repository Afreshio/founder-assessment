// Pure functions shared by the landing pages. No DOM access, so node tests can import this file.

export const FREQUENCY_SCALE = [
  { value: 0, label: 'Never' },
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Almost always' },
];

export const AGREEMENT_SCALE = [
  { value: 0, label: 'Not true' },
  { value: 1, label: 'A little true' },
  { value: 2, label: 'Somewhat true' },
  { value: 3, label: 'Mostly true' },
  { value: 4, label: 'Completely true' },
];

export const SCALE_MAX = 4;

export const RESISTORS = ['fear', 'resentment', 'anger'];

function average(answers, ids) {
  if (ids.length === 0) return 0;
  const total = ids.reduce((sum, id) => {
    const value = answers[id];
    if (typeof value !== 'number') throw new Error(`Missing answer: ${id}`);
    return sum + value;
  }, 0);
  return total / (ids.length * SCALE_MAX);
}

/**
 * The Full Power score treats the owner as a circuit: P = V^2 / R.
 * Voltage (drive and energy) and each resistor (fear, resentment, anger) are 0..1 averages.
 * V runs 0.6..1 and R runs 1..2, so the score lands between 18% and 100%.
 *
 * The lever is the biggest resistor, because clearing resistance is what the coaching does.
 * Supply only becomes the lever when every resistor is at "rarely" or below and supply is not
 * already high. (Ranking by raw gain would pick supply for almost everyone, since V is squared.)
 * `gains` holds how much P would rise from each single fix, for the "lift your score" lines.
 */
export function scorePower(answers, groups) {
  const voltage = average(answers, groups.voltage);
  const resistors = Object.fromEntries(RESISTORS.map((key) => [key, average(answers, groups[key])]));
  const resistance = RESISTORS.reduce((sum, key) => sum + resistors[key], 0) / RESISTORS.length;

  const power = (v, r) => (0.6 + 0.4 * v) ** 2 / (1 + r);
  const current = power(voltage, resistance);

  const gains = { voltage: power(1, resistance) - current };
  for (const key of RESISTORS) {
    const others = RESISTORS.filter((k) => k !== key).reduce((sum, k) => sum + resistors[k], 0);
    gains[key] = power(voltage, others / RESISTORS.length) - current;
  }

  // Ties go to the first resistor listed.
  const resistor = RESISTORS.reduce((best, key) => (resistors[key] > resistors[best] + 1e-9 ? key : best));
  const lever = resistors[resistor] <= 0.25 && voltage < 0.75 ? 'voltage' : resistor;

  const percent = Math.round(current * 100);
  const band = percent >= 75 ? 'bright' : percent >= 50 ? 'flicker' : 'dim';

  return { percent, band, voltage, resistance, resistors, gains, resistor, lever };
}

/** Career Campaign Scorecard: five pillars, each a 0..1 average; overall is 0..100. */
export const CAREER_PILLARS = ['target', 'story', 'network', 'pipeline', 'energy'];

export function scoreCareer(answers, groups) {
  const pillars = Object.fromEntries(CAREER_PILLARS.map((key) => [key, average(answers, groups[key])]));
  const percent = Math.round((CAREER_PILLARS.reduce((sum, key) => sum + pillars[key], 0) / CAREER_PILLARS.length) * 100);
  const ordered = [...CAREER_PILLARS].sort((a, b) => pillars[a] - pillars[b] || CAREER_PILLARS.indexOf(a) - CAREER_PILLARS.indexOf(b));
  const band = percent >= 75 ? 'strong' : percent >= 50 ? 'building' : 'early';
  return { percent, band, pillars, weakest: ordered[0], strongest: ordered[ordered.length - 1] };
}

/** Tiny Habits recipe (Anchor, Behavior, Celebration) as display text. */
export function habitRecipe({ anchor, behavior, celebration }) {
  const clean = (text) => String(text || '').trim().replace(/[.\s]+$/, '');
  const lower = (text) => (/^[A-Z][a-z]/.test(text) ? text[0].toLowerCase() + text.slice(1) : text);
  const a = lower(clean(anchor).replace(/^after i\s+/i, ''));
  const b = lower(clean(behavior).replace(/^i will\s+/i, ''));
  const c = clean(celebration);
  if (!a || !b) return null;
  return {
    recipe: `After I ${a}, I will ${b}.`,
    celebration: c ? `Then I celebrate: ${c}.` : 'Then I celebrate, right away, in whatever way feels natural.',
  };
}

/** Timeline for a paced breath, default 4-7-8 for four cycles. */
export function breathingTimeline(pattern = [4, 7, 8], cycles = 4) {
  const names = ['inhale', 'hold', 'exhale'];
  const steps = [];
  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    pattern.forEach((seconds, index) => steps.push({ cycle, phase: names[index], seconds }));
  }
  return steps;
}

export const ATTRIBUTION_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid'];

/** Pull ad attribution from a query string. Returns only keys that are present. */
export function parseAttribution(search) {
  const params = new URLSearchParams(search || '');
  const out = {};
  for (const key of ATTRIBUTION_KEYS) {
    const value = params.get(key);
    if (value) out[key] = value.slice(0, 200);
  }
  return out;
}

/**
 * Calendly link with prefill. Calendly reads name, email, a1 (the first custom question)
 * and utm_* parameters, so the booking carries the ad it came from and the person's result.
 */
export function bookingUrl(base, { name, email, note, attribution = {} } = {}) {
  const url = new URL(base);
  if (name) url.searchParams.set('name', name);
  if (email) url.searchParams.set('email', email);
  if (note) url.searchParams.set('a1', note.slice(0, 900));
  for (const key of ATTRIBUTION_KEYS) {
    if (key.startsWith('utm_') && attribution[key]) url.searchParams.set(key, attribution[key]);
  }
  return url.toString();
}

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(value || '').trim());
}

/** HubSpot Forms API body. Only mapped fields are sent: unknown properties make HubSpot reject the whole submission. */
export function hubspotBody(lead, fieldMap, context = {}) {
  const fields = Object.entries(fieldMap)
    .filter(([key]) => lead[key] !== undefined && lead[key] !== null && lead[key] !== '')
    .map(([key, name]) => ({ objectTypeId: '0-1', name, value: String(lead[key]) }));
  const ctx = {};
  if (context.pageUri) ctx.pageUri = context.pageUri;
  if (context.pageName) ctx.pageName = context.pageName;
  if (context.hutk) ctx.hutk = context.hutk;
  return { fields, context: ctx };
}
