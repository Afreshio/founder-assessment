import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bookingUrl,
  breathingTimeline,
  habitRecipe,
  hubspotBody,
  isEmail,
  parseAttribution,
  scoreCareer,
  scorePower,
} from '../../site/lp-assets/core.js';

const POWER_GROUPS = {
  fear: ['f1', 'f2', 'f3'],
  resentment: ['s1', 's2', 's3'],
  anger: ['a1', 'a2', 'a3'],
  voltage: ['v1', 'v2', 'v3'],
};

function powerAnswers({ fear = 0, resentment = 0, anger = 0, voltage = 4 }) {
  const out = {};
  for (const [group, value] of Object.entries({ fear, resentment, anger, voltage })) {
    POWER_GROUPS[group].forEach((id) => (out[id] = value));
  }
  return out;
}

test('Full Power: no resistance and full supply scores 100', () => {
  const result = scorePower(powerAnswers({}), POWER_GROUPS);
  assert.equal(result.percent, 100);
  assert.equal(result.band, 'bright');
});

test('Full Power: maximum resistance and empty supply is the 18% floor', () => {
  const result = scorePower(powerAnswers({ fear: 4, resentment: 4, anger: 4, voltage: 0 }), POWER_GROUPS);
  assert.equal(result.percent, 18);
  assert.equal(result.band, 'dim');
});

test('Full Power: the lever is the biggest resistor, even when supply is middling', () => {
  const fearHeavy = scorePower(powerAnswers({ fear: 4, resentment: 1, anger: 1, voltage: 3 }), POWER_GROUPS);
  assert.equal(fearHeavy.lever, 'fear');
  assert.ok(fearHeavy.gains.fear > fearHeavy.gains.resentment);

  // Raw gain would pick supply here (V is squared); the resistor still leads.
  const angry = scorePower(powerAnswers({ fear: 1, resentment: 2, anger: 4, voltage: 2 }), POWER_GROUPS);
  assert.ok(angry.gains.voltage > angry.gains.anger);
  assert.equal(angry.lever, 'anger');
});

test('Full Power: supply is the lever only when resistance is low and supply is not high', () => {
  const lowSupply = scorePower(powerAnswers({ fear: 1, resentment: 1, anger: 1, voltage: 0 }), POWER_GROUPS);
  assert.equal(lowSupply.lever, 'voltage');
  assert.equal(lowSupply.resistor, 'fear');

  const allGood = scorePower(powerAnswers({ fear: 1, resentment: 0, anger: 0, voltage: 4 }), POWER_GROUPS);
  assert.equal(allGood.lever, 'fear');
});

test('Full Power: ties between resistors go to the first listed', () => {
  const result = scorePower(powerAnswers({ fear: 3, resentment: 3, anger: 3, voltage: 4 }), POWER_GROUPS);
  assert.equal(result.lever, 'fear');
});

test('Full Power: bands split at 50 and 75', () => {
  const flicker = scorePower(powerAnswers({ fear: 2, resentment: 2, anger: 2, voltage: 3 }), POWER_GROUPS);
  assert.ok(flicker.percent >= 50 && flicker.percent < 75, `got ${flicker.percent}`);
  assert.equal(flicker.band, 'flicker');
});

test('Full Power: a missing answer throws instead of scoring silently', () => {
  const answers = powerAnswers({});
  delete answers.f2;
  assert.throws(() => scorePower(answers, POWER_GROUPS), /Missing answer: f2/);
});

test('Career: weakest and strongest pillars, with ties broken by pillar order', () => {
  const groups = { target: ['t1', 't2'], story: ['s1', 's2'], network: ['n1', 'n2'], pipeline: ['p1', 'p2'], energy: ['e1', 'e2'] };
  const answers = { t1: 4, t2: 4, s1: 2, s2: 2, n1: 0, n2: 1, p1: 1, p2: 0, e1: 3, e2: 3 };
  const result = scoreCareer(answers, groups);
  assert.equal(result.weakest, 'network');
  assert.equal(result.strongest, 'target');
  assert.equal(result.percent, 50);
  assert.equal(result.band, 'building');
});

test('habitRecipe normalizes the pieces into one sentence', () => {
  assert.deepEqual(habitRecipe({ anchor: 'After I pour my first coffee.', behavior: 'I will Open the bank balance', celebration: 'say "Nice!"' }), {
    recipe: 'After I pour my first coffee, I will open the bank balance.',
    celebration: 'Then I celebrate: say "Nice!".',
  });
  assert.equal(habitRecipe({ anchor: '', behavior: 'x' }), null);
  assert.match(habitRecipe({ anchor: 'sit down', behavior: 'breathe' }).celebration, /right away/);
});

test('breathingTimeline: 4-7-8 for three rounds is 57 seconds', () => {
  const steps = breathingTimeline([4, 7, 8], 3);
  assert.equal(steps.length, 9);
  assert.equal(steps.reduce((sum, s) => sum + s.seconds, 0), 57);
  assert.deepEqual(steps.slice(0, 3).map((s) => s.phase), ['inhale', 'hold', 'exhale']);
});

test('parseAttribution keeps only known keys and caps length', () => {
  const out = parseAttribution(`?utm_source=facebook&utm_content=${'x'.repeat(300)}&gclid=zzz&fbclid=abc`);
  assert.equal(out.utm_source, 'facebook');
  assert.equal(out.fbclid, 'abc');
  assert.equal(out.utm_content.length, 200);
  assert.equal(out.gclid, undefined);
});

test('bookingUrl prefills Calendly and forwards utm tags but not fbclid', () => {
  const url = new URL(
    bookingUrl('https://calendly.com/douglas-stevenson/meeting', {
      name: 'Sam Lee',
      email: 'sam@example.com',
      note: 'Full Power check: 42%.',
      attribution: { utm_source: 'facebook', utm_content: 'R1_OWN-POWER_P1-circuit', fbclid: 'abc' },
    })
  );
  assert.equal(url.searchParams.get('name'), 'Sam Lee');
  assert.equal(url.searchParams.get('email'), 'sam@example.com');
  assert.equal(url.searchParams.get('a1'), 'Full Power check: 42%.');
  assert.equal(url.searchParams.get('utm_content'), 'R1_OWN-POWER_P1-circuit');
  assert.equal(url.searchParams.get('fbclid'), null);
});

test('hubspotBody sends only mapped, non-empty fields', () => {
  const body = hubspotBody(
    { email: 'a@b.co', firstName: 'Al', score: 40, lever: '' },
    { email: 'email', firstName: 'firstname', lever: 'afresh_lever' },
    { pageUri: 'https://afresh.io/full-power/', hutk: undefined }
  );
  assert.deepEqual(body.fields.map((f) => f.name), ['email', 'firstname']);
  assert.deepEqual(body.context, { pageUri: 'https://afresh.io/full-power/' });
  assert.equal(body.fields[0].objectTypeId, '0-1');
});

test('isEmail', () => {
  assert.ok(isEmail(' sam@example.com '));
  assert.ok(!isEmail('sam@example'));
  assert.ok(!isEmail('sam example.com'));
});
