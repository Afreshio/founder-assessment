// Inline SVG art shared by the pages (and mirrored in the ad creatives).

/** Light bulb whose glow tracks `level` (0..1). */
export function bulbSvg(level, { size = 112, id = 'b' } = {}) {
  const p = Math.max(0, Math.min(1, level));
  return `<svg viewBox="0 0 120 160" width="${size}" height="${Math.round(size * 1.33)}" aria-hidden="true" focusable="false">
    <defs>
      <radialGradient id="glow-${id}">
        <stop offset="0" stop-color="#ffc24b" stop-opacity="${(0.95 * p).toFixed(2)}"/>
        <stop offset="1" stop-color="#ffc24b" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="56" r="60" fill="url(#glow-${id})"/>
    <path d="M60 16a38 38 0 0 0-21 69.6c4.2 3 6 7.4 6 12.4v8h30v-8c0-5 1.8-9.4 6-12.4A38 38 0 0 0 60 16z" fill="#26303a"/>
    <path d="M60 16a38 38 0 0 0-21 69.6c4.2 3 6 7.4 6 12.4v8h30v-8c0-5 1.8-9.4 6-12.4A38 38 0 0 0 60 16z" fill="#ffc24b" fill-opacity="${(0.12 + 0.88 * p).toFixed(2)}" stroke="#f4f1ea" stroke-opacity="0.8" stroke-width="3"/>
    <path d="M49 74l5.5-13 5.5 13 5.5-13 5.5 13" fill="none" stroke="${p > 0.45 ? '#fff8e6' : '#6b5a33'}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="45" y="110" width="30" height="7" rx="3.5" fill="#aeb4bb"/>
    <rect x="47" y="120" width="26" height="7" rx="3.5" fill="#aeb4bb"/>
    <path d="M52 131h16l-4 8h-8z" fill="#aeb4bb"/>
  </svg>`;
}

/** The hero diagram: your drive (battery) through fear, resentment and anger to a dim bulb. */
export function circuitSvg({ glow = 0.3 } = {}) {
  const Y = 50;
  const zig = (cx) => {
    const x = cx - 24;
    return `M${x - 16} ${Y}H${x}l4-9 8 18 8-18 8 18 8-18 8 18 4-9H${x + 64}`;
  };
  const heat = (cx) =>
    `<path d="M${cx - 8} 34c-4-5 4-8 0-13s4-8 0-12M${cx + 6} 34c-4-5 4-8 0-13s4-8 0-12" fill="none" stroke="#e4572e" stroke-width="2" stroke-linecap="round" opacity="0.85"/>`;
  return `<svg viewBox="0 0 360 166" style="overflow:visible" role="img" aria-label="A circuit: your drive flows through fear, resentment and anger before it reaches a dim bulb labeled the business.">
    <defs>
      <radialGradient id="hero-glow"><stop offset="0" stop-color="#ffc24b" stop-opacity="${glow}"/><stop offset="1" stop-color="#ffc24b" stop-opacity="0"/></radialGradient>
    </defs>
    <g fill="none" stroke="#f4f1ea" stroke-opacity="0.75" stroke-width="2.5" stroke-linejoin="round">
      <path d="M22 96V${Y}H44"/>
      <path d="M22 108V150H332V130"/>
      <path d="M332 88V${Y}H300"/>
      <path d="M120 ${Y}H130M210 ${Y}H220"/>
    </g>
    <g fill="none" stroke="#e4572e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
      <path d="${zig(80)}"/>
      <path d="${zig(170)}"/>
      <path d="${zig(260)}"/>
    </g>
    ${heat(80)}${heat(170)}${heat(260)}
    <g font-family="Inter, system-ui, sans-serif" font-weight="800" font-size="11" letter-spacing="0.6" fill="#ff9b7a" text-anchor="middle">
      <text x="80" y="82">FEAR</text>
      <text x="170" y="82">RESENTMENT</text>
      <text x="260" y="82">ANGER</text>
    </g>
    <g stroke="#ffc24b" stroke-width="3" stroke-linecap="round">
      <path d="M6 96H38"/>
      <path d="M13 108H31"/>
    </g>
    <g font-family="Inter, system-ui, sans-serif" font-size="10.5" font-weight="700" letter-spacing="0.8" fill="#b9bec4">
      <text x="44" y="126">YOUR DRIVE</text>
      <text x="302" y="126" text-anchor="end">THE BUSINESS</text>
    </g>
    <circle cx="332" cy="109" r="44" fill="url(#hero-glow)"/>
    <circle cx="332" cy="109" r="20" fill="#26303a" stroke="#f4f1ea" stroke-opacity="0.8" stroke-width="2.5"/>
    <circle cx="332" cy="109" r="20" fill="#ffc24b" fill-opacity="${Math.min(1, glow + 0.05)}"/>
    <path d="M325 113l3.5-8 3.5 8 3.5-8 3.5 8" fill="none" stroke="#6b5a33" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
