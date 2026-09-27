// Browser runtime shared by the landing pages: attribution, tracking, lead capture and booking.
import { CONFIG } from './config.js';
import { bookingUrl, hubspotBody, isEmail, parseAttribution } from './core.js';

const ATTR_KEY = 'afresh_attr_v1';
const LEAD_KEY = 'afresh_lead_v1';
const CALENDLY_JS = 'https://assets.calendly.com/assets/external/widget.js';
const CALENDLY_CSS = 'https://assets.calendly.com/assets/external/widget.css';

const context = { page: '', cell: '' };

// Every tracked event also lands here, which is what the e2e tests and pre-launch checks read.
export const events = (window.__afreshEvents = window.__afreshEvents || []);

function store(kind) {
  try {
    const s = window[kind];
    s.setItem('__afresh', '1');
    s.removeItem('__afresh');
    return s;
  } catch {
    return null;
  }
}

export function readJson(kind, key) {
  try {
    return JSON.parse(store(kind)?.getItem(key) || 'null');
  } catch {
    return null;
  }
}

export function writeJson(kind, key, value) {
  try {
    store(kind)?.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: the page still works, it just forgets on reload
  }
}

/**
 * The most recent tagged ad click wins; untagged page views keep whatever the session already has,
 * so moving between pages (or reloading) does not lose the ad that brought someone in.
 */
export function getAttribution() {
  const saved = readJson('sessionStorage', ATTR_KEY);
  const fresh = parseAttribution(location.search);
  if (saved && Object.keys(fresh).length === 0) return saved;
  if (document.referrer && !document.referrer.startsWith(location.origin)) fresh.referrer = document.referrer.slice(0, 300);
  fresh.first_page = location.pathname;
  writeJson('sessionStorage', ATTR_KEY, fresh);
  return fresh;
}

export function getLead() {
  return readJson('sessionStorage', LEAD_KEY) || {};
}

function loadPixel(id) {
  if (window.fbq) return;
  /* eslint-disable */
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
  n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
  document,'script','https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */
  window.fbq('init', id);
  window.fbq('track', 'PageView');
}

export function uuid() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Fire an event to the Meta Pixel (when configured) and to any other analytics on the page.
 * Standard events (ViewContent, Lead, Schedule) use fbq('track'); the rest use trackCustom.
 */
export function track(name, params = {}, { standard = false, eventID } = {}) {
  const payload = { ...params, page: context.page, cell: context.cell };
  events.push({ name, params: payload, standard, eventID });
  try {
    const method = standard ? 'track' : 'trackCustom';
    if (eventID) window.fbq?.(method, name, payload, { eventID });
    else window.fbq?.(method, name, payload);
  } catch {
    // ignore
  }
  try {
    window.dataLayer?.push({ event: name, ...payload });
  } catch {
    // ignore
  }
  try {
    window.gtag?.('event', name, payload);
  } catch {
    // ignore
  }
  try {
    window.plausible?.(name, { props: payload });
  } catch {
    // ignore
  }
}

function hubspotCookie() {
  const match = document.cookie.match(/(?:^|;\s*)hubspotutk=([^;]+)/);
  return match ? match[1] : undefined;
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    keepalive: true,
  });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.status;
}

/**
 * Record a lead: fire the pixel Lead event, then send it to HubSpot and/or the webhook.
 * The visitor sees their result either way; delivery failures are logged, never shown.
 */
export async function submitLead(lead) {
  const eventID = uuid();
  const full = {
    ...getAttribution(),
    ...lead,
    page: context.page,
    cell: context.cell,
    landing_url: `${location.origin}${location.pathname}`,
    submitted_at: new Date().toISOString(),
    event_id: eventID,
  };
  writeJson('sessionStorage', LEAD_KEY, { firstName: full.firstName, email: full.email, note: full.bookingNote });
  track('Lead', { content_name: full.leadMagnet }, { standard: true, eventID });

  const sends = [];
  const { hubspot } = CONFIG;
  if (hubspot.portalId && hubspot.formGuid) {
    const body = hubspotBody(full, hubspot.fieldMap, {
      pageUri: full.landing_url,
      pageName: document.title,
      hutk: hubspotCookie(),
    });
    sends.push(postJson(`${hubspot.endpoint}/${hubspot.portalId}/${hubspot.formGuid}`, body));
  }
  if (CONFIG.webhookUrl) sends.push(postJson(CONFIG.webhookUrl, full));
  if (sends.length === 0) console.warn('[afresh] No lead destination configured in lp-assets/config.js', full);

  const results = await Promise.allSettled(sends);
  results.filter((r) => r.status === 'rejected').forEach((r) => console.error('[afresh] Lead delivery failed', r.reason));
  return full;
}

let calendlyLoading;
function loadCalendly() {
  if (window.Calendly) return Promise.resolve();
  if (!calendlyLoading) {
    calendlyLoading = new Promise((resolve, reject) => {
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = CALENDLY_CSS;
      document.head.appendChild(css);
      const script = document.createElement('script');
      script.src = CALENDLY_JS;
      script.async = true;
      script.onload = () => (window.Calendly ? resolve() : reject(new Error('Calendly missing')));
      script.onerror = reject;
      document.head.appendChild(script);
      setTimeout(() => reject(new Error('Calendly timed out')), 5000);
    });
  }
  return calendlyLoading;
}

export function openBooking(source) {
  const lead = getLead();
  const url = bookingUrl(CONFIG.bookingUrl, {
    name: lead.firstName,
    email: lead.email,
    note: lead.note,
    attribution: getAttribution(),
  });
  track('BookingClick', { source });
  // The fallback navigates in the same tab: a window.open after an async failure is no longer
  // tied to the tap, and mobile browsers block it as a popup.
  loadCalendly()
    .then(() => window.Calendly.initPopupWidget({ url }))
    .catch(() => window.location.assign(url));
}

window.addEventListener('message', (event) => {
  if (event.origin !== 'https://calendly.com') return;
  if (event.data?.event === 'calendly.event_scheduled') track('Schedule', { content_name: 'unblock_session' }, { standard: true });
});

/**
 * Name + email form. `onSubmit` gets { firstName, email, note, role } and should resolve when done.
 * Pass `note` to add an optional free-text question (it rides along to the booking as a1), and
 * `roles` to ask "Which best describes you?" so leads can be qualified.
 */
export function leadForm(container, { button, note, roles, fine, onSubmit }) {
  const id = uuid().slice(0, 8);
  container.innerHTML = `
    <form class="lead-form" novalidate>
      <label for="fn-${id}">First name</label>
      <input id="fn-${id}" name="firstName" autocomplete="given-name" required maxlength="60">
      <label for="em-${id}">Email</label>
      <input id="em-${id}" name="email" type="email" inputmode="email" autocomplete="email" required maxlength="120">
      ${roles ? `<label for="rl-${id}">Which best describes you?</label>
      <select id="rl-${id}" name="role" required>
        <option value="">Choose one</option>
        ${roles.map((r) => `<option>${escapeHtml(r)}</option>`).join('')}
      </select>` : ''}
      ${note ? `<label for="nt-${id}">${note} <span class="optional">(optional)</span></label>
      <textarea id="nt-${id}" name="note" rows="3" maxlength="400"></textarea>` : ''}
      <p class="form-error" role="alert" hidden></p>
      <button class="btn btn-primary btn-block" type="submit">${button}</button>
      <p class="fine">${fine || 'No spam. Unsubscribe any time.'} <a href="/privacy/">Privacy</a></p>
    </form>`;
  const form = container.querySelector('form');
  const error = form.querySelector('.form-error');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    const firstName = String(data.firstName || '').trim();
    const email = String(data.email || '').trim();
    const role = String(data.role || '');
    const problem = !firstName
      ? ['Add your first name.', 'input[name=firstName]']
      : !isEmail(email)
        ? ['That email address does not look right.', 'input[name=email]']
        : roles && !role
          ? ['Choose the option that fits best.', 'select[name=role]']
          : null;
    if (problem) {
      error.textContent = problem[0];
      error.hidden = false;
      form.querySelector(problem[1]).focus();
      return;
    }
    error.hidden = true;
    const submit = form.querySelector('button[type=submit]');
    submit.disabled = true;
    submit.textContent = 'One moment...';
    await onSubmit({ firstName, email, note: String(data.note || '').trim(), ...(roles ? { role } : {}) });
  });
  return form;
}

function stickyCta() {
  const bar = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  if (!bar || !hero || !('IntersectionObserver' in window)) return;
  new IntersectionObserver(([entry]) => {
    bar.classList.toggle('show', !entry.isIntersecting && !document.body.classList.contains('in-flow'));
  }).observe(hero);
}

export function initPage({ page, cell, contentName }) {
  context.page = page;
  context.cell = cell;
  getAttribution();
  if (CONFIG.metaPixelId) loadPixel(CONFIG.metaPixelId);
  track('ViewContent', { content_name: contentName }, { standard: true });
  document.querySelectorAll('[data-cta=book]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.preventDefault();
      openBooking(el.dataset.source || 'page');
    })
  );
  document.querySelectorAll('[data-year]').forEach((el) => (el.textContent = String(new Date().getFullYear())));
  stickyCta();
}

/** Enter a full-screen flow (quiz, tool) and hide the marketing page behind it. */
export function enterFlow(section) {
  document.body.classList.add('in-flow');
  document.querySelector('.sticky-cta')?.classList.remove('show');
  section.hidden = false;
  window.scrollTo(0, 0);
}

export function escapeHtml(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
