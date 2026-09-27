// Tiny Habits recipe builder: Anchor, Behavior, Celebration, then the 5-day starter opt-in.
import { habitRecipe } from './core.js';
import { OWNER_ROLES } from './questions.js';
import { escapeHtml, initPage, leadForm, openBooking, submitLead, track } from './lp.js';

export const CHOICES = {
  anchor: [
    'pour my first coffee',
    'sit down at my desk',
    'finish a sales call',
    'close my laptop for the day',
    'plug in my phone at night',
  ],
  behavior: [
    'write down the one call I am avoiding',
    'open the bank balance and read it',
    'send one thank-you message to someone on the team',
    "write tomorrow's single most important task",
    'take one slow 4-7-8 breath',
  ],
  celebration: ['say "Nice!"', 'do a small fist pump', 'smile', 'think "That is how I run this place"'],
};

const HINTS = {
  anchor: 'After I...',
  behavior: 'I will...',
  celebration: 'Then I...',
};

function chipGroup(key) {
  return `
    <div class="chips" role="group" aria-label="${key}">
      ${CHOICES[key].map((text) => `<button type="button" class="chip" data-key="${key}" data-value="${escapeHtml(text)}" aria-pressed="false">${escapeHtml(text)}</button>`).join('')}
    </div>
    <label class="visually-hidden" for="custom-${key}">Or write your own</label>
    <input class="custom-input" id="custom-${key}" data-custom="${key}" placeholder="Or write your own: ${HINTS[key]}" maxlength="90">`;
}

export function init() {
  initPage({ page: 'tiny-habits', cell: 'OWN-HABIT', contentName: 'tiny_habits_starter' });

  const builder = document.getElementById('builder');
  ['anchor', 'behavior', 'celebration'].forEach((key) => {
    builder.querySelector(`[data-group=${key}]`).innerHTML = chipGroup(key);
  });

  const state = { anchor: '', behavior: '', celebration: '' };
  const card = document.getElementById('recipe-card');
  const next = document.getElementById('recipe-next');
  let built = false;

  function update() {
    const recipe = habitRecipe(state);
    if (!recipe) {
      card.innerHTML = '<p class="muted">Pick an anchor and a tiny behavior to see your recipe.</p>';
      next.hidden = true;
      return;
    }
    card.innerHTML = `<p class="quiz-kicker">Your recipe</p><p class="recipe">${escapeHtml(recipe.recipe)}</p><p>${escapeHtml(recipe.celebration)}</p>`;
    next.hidden = false;
    if (!built) {
      built = true;
      track('RecipeBuilt', { content_name: 'tiny_habits_starter' });
    }
  }

  builder.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    const { key, value } = chip.dataset;
    state[key] = value;
    builder.querySelectorAll(`.chip[data-key=${key}]`).forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    builder.querySelector(`[data-custom=${key}]`).value = '';
    update();
  });

  builder.addEventListener('input', (event) => {
    const key = event.target.dataset.custom;
    if (!key) return;
    state[key] = event.target.value;
    builder.querySelectorAll(`.chip[data-key=${key}]`).forEach((c) => c.setAttribute('aria-pressed', 'false'));
    update();
  });

  const slot = document.querySelector('[data-lead=habits]');
  leadForm(slot, {
    button: 'Email me my recipe and the 5-day starter',
    roles: OWNER_ROLES,
    onSubmit: async (contact) => {
      const recipe = habitRecipe(state);
      const text = recipe ? `${recipe.recipe} ${recipe.celebration}` : '';
      await submitLead({
        ...contact,
        leadMagnet: 'tiny_habits_starter',
        recipe: text,
        bookingNote: `Tiny Habits recipe: ${text}`,
      });
      slot.innerHTML = `
        <p class="sent">Sent. Day 1 of the starter is on its way.</p>
        <p>Try your recipe tomorrow morning. If it does not happen, make it smaller, not harder.</p>
        <button class="btn btn-primary btn-block" type="button" data-book-after>Book a free 30-minute session with Doug</button>`;
      slot.querySelector('[data-book-after]').addEventListener('click', () => openBooking('habits_after_lead'));
    },
  });

  document.querySelectorAll('[data-cta=build]').forEach((el) =>
    el.addEventListener('click', (event) => {
      event.preventDefault();
      builder.scrollIntoView({ behavior: 'smooth', block: 'start' });
      builder.querySelector('.chip')?.focus({ preventScroll: true });
    })
  );

  update();
}
