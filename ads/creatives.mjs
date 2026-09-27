// Ad creative templates. Each creative supplies parts; frame() lays them out for each placement.
import { bulbSvg, circuitSvg } from '../site/lp-assets/art.js';

export const SIZES = {
  feed: { width: 1080, height: 1350 }, // 4:5, Facebook and Instagram feeds
  story: { width: 1080, height: 1920 }, // 9:16, Stories and Reels (keep text out of top 250px and bottom 340px)
  og: { width: 1200, height: 630 }, // link previews for the landing pages
};

const THEMES = {
  power: { bg: 'radial-gradient(120% 70% at 85% 0%, #2d2610 0%, #0f1419 60%)', fg: '#f4f1ea', muted: '#b9bec4', accent: '#ffc24b', pillFg: '#0f1419' },
  calm: { bg: 'linear-gradient(180deg, #0b1a24 0%, #14304a 100%)', fg: '#eef6f8', muted: '#a9bfc9', accent: '#5fd4c4', pillFg: '#0b1a24' },
  habits: { bg: '#fff7ea', fg: '#1a1f24', muted: '#5b636b', accent: '#1f8a4c', pillFg: '#ffffff' },
  career: { bg: 'linear-gradient(180deg, #e9f0ff 0%, #ffffff 70%)', fg: '#0f1419', muted: '#56606a', accent: '#2a66ff', pillFg: '#ffffff' },
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

function battery(level, label, color) {
  const bars = Array.from({ length: 5 }, (_, i) => `<rect x="${14 + i * 30}" y="14" width="24" height="52" rx="4" fill="${i < level ? color : '#e6dccb'}"/>`).join('');
  return `<figure style="margin:0;text-align:center">
    <svg viewBox="0 0 190 80" width="190" height="80"><rect x="3" y="3" width="170" height="74" rx="12" fill="none" stroke="#1a1f24" stroke-width="5"/><rect x="176" y="26" width="10" height="28" rx="3" fill="#1a1f24"/>${bars}</svg>
    <figcaption style="font-weight:800;font-size:34px;margin-top:10px">${label}</figcaption></figure>`;
}

export const CREATIVES = {
  circuit: () => ({
    theme: 'power',
    kicker: 'For business owners',
    headline: "You're not short on drive. You're losing power to resistance.",
    hsize: 84,
    art: `<div style="width:100%">${circuitSvg({ glow: 0.25 })}</div>`,
    footer: 'The Full Power check &middot; 3 minutes &middot; free',
  }),
  equation: () => ({
    theme: 'power',
    kicker: 'Owner physics',
    art: `<div style="font-size:196px;font-weight:900;letter-spacing:-6px;color:#ffc24b;line-height:1;white-space:nowrap">P = V<sup style="font-size:96px">2</sup>&divide;R</div>
      <div style="display:grid;gap:14px;font-size:40px;margin-top:40px;text-align:left">
        <div><b style="color:#ffc24b;display:inline-block;width:70px">V</b>Your drive</div>
        <div><b style="color:#ffc24b;display:inline-block;width:70px">R</b>Fear, resentment, anger</div>
        <div><b style="color:#ffc24b;display:inline-block;width:70px">P</b>What reaches the business</div>
      </div>`,
    headline: 'Most owners push more V. The faster fix is less R.',
    hsize: 64,
    headlineAfterArt: true,
    footer: 'Find your biggest resistor &middot; free',
  }),
  bulb: () => ({
    theme: 'power',
    art: bulbSvg(0.3, { size: 330, id: 'ad' }),
    headline: 'How much of your effort actually reaches the business?',
    hsize: 78,
    headlineAfterArt: true,
    footer: 'The Full Power check &middot; 3 minutes',
  }),
  breath: () => ({
    theme: 'calm',
    kicker: 'Before the hard call',
    art: `<div style="display:flex;gap:56px;justify-content:center;align-items:flex-end">
      ${[['4', 'Inhale'], ['7', 'Hold'], ['8', 'Exhale']]
        .map(([n, l]) => `<div style="text-align:center"><div style="font-size:260px;font-weight:900;line-height:1;color:#5fd4c4">${n}</div><div style="font-size:40px;font-weight:700;color:#a9bfc9;margin-top:8px">${l}</div></div>`)
        .join('')}
    </div>`,
    headline: 'The 60-second reset.',
    hsize: 92,
    headlineAfterArt: true,
    footer: 'Try it free &middot; no app',
  }),
  pregame: () => ({
    theme: 'calm',
    kicker: 'A pre-game routine for owners',
    headline: 'Before the price conversation.<br>Before the hard feedback.<br>Before you hit send.',
    hsize: 72,
    art: `<div style="font-size:120px;font-weight:900;color:#5fd4c4;line-height:1">60 seconds.</div><div style="font-size:48px;font-weight:700;color:#a9bfc9;margin-top:16px">Inhale 4 &middot; Hold 7 &middot; Exhale 8</div>`,
    footer: 'The Calm Operator reset &middot; free',
  }),
  mantra: ({ headshot }) => ({
    theme: 'calm',
    art: `<img src="${headshot}" style="width:300px;height:300px;border-radius:50%;object-fit:cover;border:8px solid #5fd4c4">`,
    headline: 'Nearly 40 years of meditation. 23 years as a founder and CEO.',
    hsize: 72,
    headlineAfterArt: true,
    body: 'The Calm Operator reset: five short lessons for people who run businesses.',
    footer: 'Free 5-day email series',
  }),
  recipe: () => ({
    theme: 'habits',
    kicker: 'A Tiny Habits recipe',
    art: `<div style="background:#fff;border:4px dashed #1f8a4c;border-radius:28px;padding:56px 60px;text-align:left;box-shadow:0 20px 50px rgba(80,60,20,.12)">
      <div style="font-size:30px;font-weight:800;letter-spacing:4px;color:#1f8a4c;margin-bottom:22px">MY RECIPE</div>
      <div style="font-size:58px;font-weight:800;line-height:1.2">After I pour my first coffee, I will write down the one call I'm avoiding.</div>
      <div style="font-size:40px;margin-top:26px;color:#5b636b">Then I celebrate: "Nice!"</div>
    </div>`,
    headline: 'Big changes start embarrassingly small.',
    hsize: 72,
    headlineAfterArt: true,
    footer: 'Build yours in 60 seconds &middot; free',
  }),
  willpower: () => ({
    theme: 'habits',
    headline: 'Stop running your business on willpower.',
    hsize: 96,
    art: `<div style="display:flex;gap:44px;justify-content:center">${battery(5, '9am', '#1f8a4c')}${battery(3, '12pm', '#e0a100')}${battery(1, '3pm', '#e4572e')}</div>`,
    body: 'Habits do not run out by 3pm.',
    footer: 'Free Tiny Habits builder',
  }),
  bmap: () => ({
    theme: 'habits',
    kicker: "BJ Fogg's Behavior Model",
    art: `<div style="font-size:200px;font-weight:900;letter-spacing:-6px;color:#1f8a4c;line-height:1;white-space:nowrap">B = MAP</div>
      <div style="display:flex;gap:36px;justify-content:center;font-size:40px;font-weight:700;margin-top:26px"><span>Motivation</span><span>Ability</span><span>Prompt</span></div>`,
    headline: 'Most owners try to fix motivation. Fix the other two.',
    hsize: 70,
    headlineAfterArt: true,
    footer: 'Free habit builder &middot; 60 seconds',
  }),
  campaign: () => ({
    theme: 'career',
    headline: "A career move is not a job search. It's a campaign.",
    hsize: 88,
    art: `<div style="display:flex;flex-wrap:wrap;gap:20px;justify-content:center">
      ${['Target', 'Story', 'Network', 'Pipeline', 'Energy']
        .map((p, i) => `<span style="font-size:42px;font-weight:800;padding:22px 36px;border-radius:999px;${i === 2 ? 'background:#2a66ff;color:#fff' : 'background:#fff;border:3px solid #c9d6f5;color:#0f1419'}">${p}</span>`)
        .join('')}
    </div><div style="font-size:36px;color:#56606a;margin-top:28px">Which one is holding yours back?</div>`,
    footer: 'Career Campaign Scorecard &middot; 3 minutes',
  }),
  title: () => ({
    theme: 'career',
    art: `<div style="background:#fff;border-radius:28px;padding:48px 56px;text-align:left;box-shadow:0 20px 50px rgba(20,40,90,.12);border:2px solid #dbe4f7;width:84%">
      <div style="font-size:34px;color:#56606a;font-weight:700">On paper</div>
      <div style="font-size:58px;font-weight:800;margin-bottom:30px;text-decoration:line-through;text-decoration-color:#e4572e;text-decoration-thickness:6px">Your current title</div>
      <div style="font-size:34px;color:#56606a;font-weight:700">In practice</div>
      <div style="font-size:58px;font-weight:800;color:#2a66ff">The level you operate at</div>
    </div>`,
    headline: 'Your next move starts with the story, not the resume.',
    hsize: 74,
    headlineAfterArt: true,
    footer: 'Free Career Campaign Scorecard',
  }),
  conversations: () => ({
    theme: 'career',
    headline: '<span style="color:#8a94a3">Applications capture opportunities.</span><br>Conversations create them.',
    hsize: 100,
    footer: 'Career Campaign Scorecard &middot; free',
  }),
};

export function frame(name, sizeName, assets) {
  const size = SIZES[sizeName];
  const parts = CREATIVES[name](assets);
  const t = THEMES[parts.theme];
  const story = sizeName === 'story';
  const og = sizeName === 'og';
  const scale = og ? 0.62 : 1;
  const hsize = Math.round((parts.hsize || 80) * scale);
  const pad = og ? '56px 64px' : story ? '250px 84px 340px' : '84px 84px 76px';

  const headline = `<h1 style="font-size:${hsize}px;line-height:1.08;letter-spacing:-0.02em;font-weight:900;margin:0">${parts.headline}</h1>`;
  const kicker = parts.kicker ? `<div style="font-size:${Math.round(30 * scale)}px;font-weight:800;letter-spacing:5px;text-transform:uppercase;color:${t.accent};margin-bottom:${Math.round(28 * scale)}px">${esc(parts.kicker)}</div>` : '';
  const body = parts.body ? `<p style="font-size:${Math.round(42 * scale)}px;color:${t.muted};margin:${Math.round(28 * scale)}px 0 0;line-height:1.3">${esc(parts.body)}</p>` : '';
  const art = parts.art ? `<div class="art" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;${og ? '' : `margin:${story ? 90 : 56}px 0`}">${parts.art}</div>` : '';
  const footer = `<div style="display:flex;justify-content:space-between;align-items:center;gap:24px">
      <span style="background:${t.accent};color:${t.pillFg};font-weight:800;font-size:${Math.round(34 * scale)}px;padding:${Math.round(20 * scale)}px ${Math.round(34 * scale)}px;border-radius:999px">${parts.footer}</span>
      <span style="font-weight:900;font-size:${Math.round(40 * scale)}px;letter-spacing:-1px">Afresh</span>
    </div>`;

  const text = `${kicker}${headline}${body}`;
  let content;
  if (og) {
    content = `<div style="display:grid;grid-template-columns:${parts.art ? '1.15fr 1fr' : '1fr'};gap:48px;align-items:center;flex:1">
        <div>${text}</div>${parts.art ? `<div style="zoom:.55">${art}</div>` : ''}
      </div>${footer}`;
  } else {
    const main = parts.headlineAfterArt ? `${kicker}${art}${headline}${body}` : `${text}${art}`;
    content = `<div style="flex:1;display:flex;flex-direction:column;justify-content:center">${main}</div>${footer}`;
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    ${assets.fontFaces}
    *{box-sizing:border-box} html,body{margin:0}
    body{width:${size.width}px;height:${size.height}px;overflow:hidden;background:${t.bg};color:${t.fg};font-family:Inter,sans-serif;-webkit-font-smoothing:antialiased}
    .frame{width:100%;height:100%;display:flex;flex-direction:column;padding:${pad}}
    .art svg{max-width:100%;height:auto}
  </style></head><body><div class="frame">${content}</div></body></html>`;
}
