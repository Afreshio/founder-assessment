// Full Power check: the owner-as-circuit assessment (P = V^2 / R).
import { FREQUENCY_SCALE, RESISTORS, scorePower } from './core.js';
import { OWNER_ROLES as ROLE_OPTIONS, POWER_GROUPS as GROUPS, POWER_ITEMS as ITEMS } from './questions.js';
import { bulbSvg, circuitSvg } from './art.js';
import { initPage, openBooking, submitLead } from './lp.js';
import { createQuiz } from './quiz.js';

const LATELY = 'Lately, how often is this true?';

const SIZE_OPTIONS = ['Just me', '2 to 5', '6 to 20', '21 to 100', 'More than 100'];

const STEPS = [
  ...ITEMS.map(([id, , prompt]) => ({ id, kind: 'scale', kicker: LATELY, prompt, options: FREQUENCY_SCALE })),
  { id: 'role', kind: 'choice', prompt: 'Which best describes you?', options: ROLE_OPTIONS.map((l) => ({ value: l, label: l })) },
  {
    id: 'size',
    kind: 'choice',
    prompt: 'How many people work in the business (or on your team), including you?',
    options: SIZE_OPTIONS.map((l) => ({ value: l, label: l })),
  },
];

const BANDS = {
  dim: {
    title: 'Running dim',
    body: 'You are putting real effort in, and a lot of it is being burned off before it reaches the business. That is not a character flaw. It is a circuit problem, and circuits can be fixed.',
  },
  flicker: {
    title: 'Flickering',
    body: 'Real power is getting through, but a meaningful share is turning into heat. That is the tiring part: effort that never becomes light.',
  },
  bright: {
    title: 'Running bright',
    body: 'Most of your energy is reaching the work. The job now is protecting it. Your resistors are small, which makes this the easiest time to clear them.',
  },
};

export const LEVERS = {
  fear: {
    name: 'Fear',
    title: 'Fear is your biggest resistor',
    body: 'The call you have not made. The price you have not raised. The hire, or the firing, that keeps slipping to next month. From the inside, fear rarely feels like fear. It feels like being busy, being careful, or waiting for more information.',
    recipe: 'After I pour my first coffee, I will write down the one conversation I am avoiding.',
    why: 'You are not committing to have it yet. Naming it makes it smaller, and it gives your brain a real next step instead of a vague dread.',
  },
  resentment: {
    name: 'Resentment',
    title: 'Resentment is your biggest resistor',
    body: 'The partner who is not pulling their weight. The client who took advantage. The employee you have quietly given up on. Resentment keeps score in the background and drains energy from everything else. Most of it grows from an expectation that was never said out loud.',
    recipe: 'After I close my laptop for the day, I will finish one sentence on paper: "I expected ___, and I never said it."',
    why: 'An unspoken expectation cannot be met or renegotiated. Writing it down is the first step to a clean conversation instead of a slow burn.',
  },
  anger: {
    name: 'Anger',
    title: 'Anger is your biggest resistor',
    body: 'The sharp email. The meeting that goes quiet. The team that stops bringing you bad news. Anger is usually information (something matters to you) arriving with too much voltage. The goal is not to stop feeling it. It is to put a gap between the spark and the send.',
    recipe: 'After I notice my jaw tighten, I will take one slow 4-7-8 breath before I reply.',
    why: 'One breath is enough of a gap to choose your response. BJ Fogg calls habits anchored to a difficult moment "pearl habits": the irritation becomes the prompt.',
  },
  voltage: {
    name: 'Supply',
    title: 'Your supply is your biggest lever',
    body: 'Your resistance is not the main problem. Your supply is. Short nights, no recovery between hard moments, and no reset button mean you are running the business on a low battery. More willpower will not fix a low battery.',
    recipe: 'After I plug in my phone at night, I will leave it outside the bedroom.',
    why: 'It is tiny, it removes the last-thing-at-night inbox check, and it protects the one resource every other fix depends on.',
  },
};

function bars(result) {
  const pct = (x) => Math.round(x * 100);
  const row = (label, hint, value, good) => `
    <div class="bar-row">
      <div class="bar-label">${label} <span>${hint}</span></div>
      <div class="bar-track"><div class="bar-fill${good ? ' good' : ''}" style="width:${Math.max(3, pct(value))}%"></div></div>
    </div>`;
  return `<div class="bars">
    ${row('Your supply', `${pct(result.voltage)}% charged`, result.voltage, true)}
    ${RESISTORS.map((key) => row(LEVERS[key].name, `${pct(result.resistors[key])}% resistance`, result.resistors[key], false)).join('')}
  </div>`;
}

// When the lever is a resistor but the battery is also low, say so without changing the focus.
function supplyNote(result) {
  if (result.lever === 'voltage' || result.voltage >= 0.5) return '';
  const lifted = Math.min(100, Math.round((result.percent / 100 + result.gains.voltage) * 100));
  return `
    <div class="panel">
      <h3>Your supply is running low too</h3>
      <p>Short nights and no recovery between hard moments make every resistor feel bigger. Recharging would lift your score to about ${lifted}% on its own. The 5-day series includes the simplest fixes.</p>
    </div>`;
}

export function renderResults(answers) {
  const result = scorePower(answers, GROUPS);
  const band = BANDS[result.band];
  const lever = LEVERS[result.lever];
  const lifted = Math.min(100, Math.round((result.percent / 100 + result.gains[result.lever]) * 100));
  const liftLine =
    lifted > result.percent
      ? `<p><strong>Clearing it would lift your score to about ${lifted}%</strong>, with no extra hours.</p>`
      : '';
  return `
    <p class="quiz-kicker">Your Full Power score</p>
    <div class="score">
      ${bulbSvg(result.percent / 100, { size: 92, id: 'result' })}
      <div><div class="num">${result.percent}%</div><div class="label">of your power is reaching the business</div></div>
    </div>
    <h2 tabindex="-1" data-focus>${band.title}</h2>
    <p>${band.body}</p>

    <div class="panel">
      <h3>Where the power goes</h3>
      ${bars(result)}
    </div>

    <div class="panel">
      <h3>${lever.title}</h3>
      <p>${lever.body}</p>
      ${liftLine}
    </div>
    ${supplyNote(result)}

    <div class="panel">
      <h3>Your tiny first step</h3>
      <p class="muted">Built with BJ Fogg's Tiny Habits method: anchor it to something you already do, make it tiny, then celebrate.</p>
      <p class="recipe">${lever.recipe}</p>
      <p>Then celebrate right away. A fist pump, a "nice", a smile. It feels silly, and it is the part that wires the habit in.</p>
      <p class="muted">${lever.why}</p>
    </div>

    <div class="panel">
      <h3>The 60-second reset</h3>
      <p>Before your next hard conversation: breathe in through your nose for 4, hold for 7, breathe out slowly through your mouth for 8. Three rounds, about a minute.</p>
      <p><a href="/reset/">Try it with a guide</a></p>
    </div>

    <div class="panel cta-panel">
      <div class="who">
        <img src="/lp-assets/img/doug.webp" alt="Doug Stevenson" width="52" height="52" loading="lazy">
        <p><strong>Doug Stevenson</strong><br>Founder and CEO for 23 years. Now coaches owners.</p>
      </div>
      <h3>Want help clearing it?</h3>
      <p>Book a free 30-minute Unblock Session. You will pick the one resistor worth clearing first and leave with a two-week plan, whether or not we work together.</p>
      <button class="btn btn-primary btn-block" type="button" data-book="results">Book my free session</button>
    </div>

    <div class="panel" data-soft-gate hidden>
      <h3>Want a copy?</h3>
      <p class="muted">We will email your result and a short 5-day series on clearing your biggest resistor.</p>
      <div class="slot"></div>
    </div>

    <button class="link-btn retake" type="button" data-retake>Retake the check</button>`;
}

function bookingNote(answers, result, avoiding) {
  const parts = [`Full Power check: ${result.percent}%. Biggest resistor: ${LEVERS[result.resistor].name}. Supply: ${Math.round(result.voltage * 100)}%.`];
  if (answers.role) parts.push(`${answers.role} (${answers.size}).`);
  if (avoiding) parts.push(`Putting off: ${avoiding}`);
  return parts.join(' ');
}

export function init() {
  document.querySelectorAll('[data-art=circuit]').forEach((el) => (el.innerHTML = circuitSvg({ glow: 0.28 })));
  initPage({ page: 'full-power', cell: 'OWN-POWER', contentName: 'full_power_check' });

  const gate = new URLSearchParams(location.search).get('gate') === 'soft' ? 'soft' : 'hard';
  const quiz = createQuiz({
    root: document.getElementById('quiz'),
    id: 'full_power_check',
    steps: STEPS,
    gate,
    emailStep: {
      title: 'Your Full Power score is ready',
      body: 'Where should we send a copy? You will also get a short 5-day series on clearing your biggest resistor.',
      button: 'Show my score',
      note: 'What is the one thing you have been putting off?',
    },
    onLead: (contact, answers) => {
      const result = scorePower(answers, GROUPS);
      const pct = (x) => Math.round(x * 100);
      return submitLead({
        ...contact,
        leadMagnet: 'full_power_check',
        role: answers.role,
        teamSize: answers.size,
        score: result.percent,
        lever: result.lever,
        resistor: result.resistor,
        voltage: pct(result.voltage),
        fear: pct(result.resistors.fear),
        resentment: pct(result.resistors.resentment),
        anger: pct(result.resistors.anger),
        avoiding: contact.note,
        bookingNote: bookingNote(answers, result, contact.note),
      });
    },
    renderResults,
    afterResults: (root) =>
      root.querySelectorAll('[data-book]').forEach((el) => el.addEventListener('click', () => openBooking(el.dataset.book))),
  });

  document.querySelectorAll('[data-cta=start]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.preventDefault();
      quiz.start();
    })
  );
}

