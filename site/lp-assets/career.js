// Career Campaign Scorecard: the five pillars from afresh.io/career-transition, scored in 3 minutes.
import { AGREEMENT_SCALE, CAREER_PILLARS, scoreCareer } from './core.js';
import { CAREER_GROUPS as GROUPS, CAREER_ITEMS as ITEMS } from './questions.js';
import { escapeHtml, initPage, openBooking, submitLead } from './lp.js';
import { createQuiz } from './quiz.js';

const RIGHT_NOW = 'How true is this for you right now?';

const SITUATIONS = ['Employed, ready for a change', 'Between roles', 'Leaving my own business', 'Just exploring'];
const LEVELS = ['Individual contributor', 'Manager', 'Director', 'VP or above', 'Founder or owner'];

const STEPS = [
  ...ITEMS.map(([id, , prompt]) => ({ id, kind: 'scale', kicker: RIGHT_NOW, prompt, options: AGREEMENT_SCALE })),
  { id: 'situation', kind: 'choice', prompt: 'Where are you right now?', options: SITUATIONS.map((l) => ({ value: l, label: l })) },
  { id: 'level', kind: 'choice', prompt: 'What level are you at?', options: LEVELS.map((l) => ({ value: l, label: l })) },
];

export const PILLARS = {
  target: {
    name: 'Target',
    title: 'Your target is blurry',
    body: 'When the destination is vague, every posting looks possible and none feels right. Scattershot applications are the most common way a search stalls.',
    actions: [
      'Write one sentence: the role, level, type of company and pay that would make the move worth it.',
      'List 10 companies you would be proud to work for.',
      'Cross off anything you would only take out of panic.',
    ],
  },
  story: {
    name: 'Story',
    title: 'Your story undersells you',
    body: 'Your title does not show the level you actually operate at. If you cannot explain why this move makes sense in under a minute, neither can the people you need to refer you.',
    actions: [
      'Draft a 60-second answer to: where have you been, what are you great at, where are you going?',
      'Rewrite your LinkedIn headline around the role you want, not the one you have.',
      'Put three results with numbers at the top of your resume.',
    ],
  },
  network: {
    name: 'Network',
    title: 'Your network is untapped',
    body: 'Most good moves come through people, not job boards. Conversations create opportunities. Applications only capture them.',
    actions: [
      'List 20 people who know your work well.',
      'Send three "I would value your perspective" messages this week. Not job asks.',
      'For each target company, find one person you could be introduced to.',
    ],
  },
  pipeline: {
    name: 'Pipeline',
    title: 'Your pipeline has no system',
    body: 'When opportunities live in your head and your inbox, they stall quietly. Every live opportunity needs a next action and a date.',
    actions: [
      'Put every opportunity in one list: company, contact, stage, next action, date.',
      'Review it at the same time every week.',
      'Count conversations, not just applications.',
    ],
  },
  energy: {
    name: 'Energy',
    title: 'Your energy is the bottleneck',
    body: 'Searches create a nasty loop: apply, wait, rejection, doubt, apply more. The person running the campaign is the most important asset in it.',
    actions: [
      'Set a weekly rhythm you can keep on a bad week. Make it smaller than you think.',
      'Anchor each search session to something you already do: "After I pour my coffee, I will open my pipeline list."',
      'Try the 60-second reset before your next interview.',
    ],
  },
};

const BANDS = {
  early: { title: 'Early days', body: 'Your campaign has not really started yet, which is good news: the fixes are simple, and the first one makes the rest easier.' },
  building: { title: 'Building', body: 'You have real pieces in place. One weak pillar is holding back the others, and it is usually a quick fix once you can see it.' },
  strong: { title: 'Campaign-ready', body: 'You are running this like a campaign. Keep your rhythm, and tighten the weakest pillar before it costs you an offer.' },
};

export function renderResults(answers) {
  const result = scoreCareer(answers, GROUPS);
  const band = BANDS[result.band];
  const weak = PILLARS[result.weakest];
  const strong = PILLARS[result.strongest];
  const pct = (x) => Math.round(x * 100);
  const bars = CAREER_PILLARS.map(
    (key) => `
      <div class="bar-row">
        <div class="bar-label">${PILLARS[key].name} <span>${pct(result.pillars[key])}%</span></div>
        <div class="bar-track"><div class="bar-fill good" style="width:${Math.max(3, pct(result.pillars[key]))}%"></div></div>
      </div>`
  ).join('');
  return `
    <p class="quiz-kicker">Your Career Campaign score</p>
    <div class="score"><div class="num">${result.percent}</div><div class="label">out of 100</div></div>
    <h2 tabindex="-1" data-focus>${band.title}</h2>
    <p>${band.body}</p>

    <div class="panel"><h3>Your five pillars</h3><div class="bars">${bars}</div></div>

    <div class="panel">
      <h3>${weak.title}</h3>
      <p>${weak.body}</p>
      <p><strong>Three things to do this week:</strong></p>
      <ol>${weak.actions.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ol>
      ${result.weakest === 'energy' ? '<p><a href="/reset/">Try the 60-second reset</a></p>' : ''}
    </div>

    <div class="panel">
      <h3>Your strongest pillar: ${strong.name}</h3>
      <p class="muted">Lead with it. In conversations and interviews, start from what is already working.</p>
    </div>

    <div class="panel cta-panel">
      <div class="who">
        <img src="/lp-assets/img/doug.webp" alt="Doug Stevenson" width="52" height="52" loading="lazy">
        <p><strong>Doug Stevenson</strong><br>Career transition coach. Certified Working Genius facilitator.</p>
      </div>
      <h3>Map your next move with Doug</h3>
      <p>Book a free 30-minute Career Map session. You will leave with your target on one line and a first list of real companies and people to approach.</p>
      <button class="btn btn-primary btn-block" type="button" data-book="results">Book my free session</button>
    </div>

    <div class="panel" data-soft-gate hidden>
      <h3>Want a copy?</h3>
      <div class="slot"></div>
    </div>

    <button class="link-btn retake" type="button" data-retake>Retake the scorecard</button>`;
}

export function init() {
  initPage({ page: 'career-move', cell: 'CAREER', contentName: 'career_campaign_scorecard' });
  const gate = new URLSearchParams(location.search).get('gate') === 'soft' ? 'soft' : 'hard';
  const quiz = createQuiz({
    root: document.getElementById('quiz'),
    id: 'career_campaign_scorecard',
    steps: STEPS,
    gate,
    emailStep: {
      title: 'Your Career Campaign score is ready',
      body: 'Where should we send a copy? You will also get three short emails on fixing your weakest pillar.',
      button: 'Show my score',
      note: 'What role are you aiming for next?',
    },
    onLead: (contact, answers) => {
      const result = scoreCareer(answers, GROUPS);
      return submitLead({
        ...contact,
        leadMagnet: 'career_campaign_scorecard',
        situation: answers.situation,
        level: answers.level,
        score: result.percent,
        weakest: result.weakest,
        targetRole: contact.note,
        bookingNote: `Career Campaign score ${result.percent}/100. Weakest pillar: ${PILLARS[result.weakest].name}. ${answers.situation}, ${answers.level}.${contact.note ? ` Aiming for: ${contact.note}` : ''}`,
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
