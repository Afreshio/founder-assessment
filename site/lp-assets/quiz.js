// One-question-per-screen quiz used by the Full Power check and the Career Campaign Scorecard.
import { enterFlow, escapeHtml, leadForm, readJson, track, writeJson } from './lp.js';

/**
 * steps: { id, kind: 'scale' | 'choice', prompt, options: [{ value, label }] }[]
 * gate:  'hard' asks for email before results; 'soft' shows results first with the form inside.
 * onLead(contact, answers) records the lead; renderResults(answers) returns the results HTML.
 */
export function createQuiz({ root, id, steps, gate = 'hard', emailStep, onLead, renderResults, afterResults }) {
  const key = `afresh_quiz_${id}`;
  const state = readJson('sessionStorage', key) || { answers: {}, index: 0, lead: false };
  const save = () => writeJson('sessionStorage', key, state);
  let started = false;

  function progress(index) {
    const total = steps.length;
    const shown = Math.min(index + 1, total);
    return `
      <div class="quiz-top">
        <button class="quiz-back" type="button" ${index === 0 ? 'hidden' : ''}>Back</button>
        <span class="quiz-count" aria-live="polite">${index < total ? `${shown} of ${total}` : 'Almost done'}</span>
      </div>
      <div class="quiz-bar" aria-hidden="true"><span style="width:${Math.round((index / total) * 100)}%"></span></div>`;
  }

  function focusHeading() {
    root.querySelector('[data-focus]')?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }

  function wireBack(index) {
    root.querySelector('.quiz-back')?.addEventListener('click', () => {
      state.index = Math.max(0, index - 1);
      save();
      render();
    });
  }

  function renderQuestion(index) {
    const step = steps[index];
    const current = state.answers[step.id];
    root.innerHTML = `
      <div class="quiz-card">
        ${progress(index)}
        ${step.kicker ? `<p class="quiz-kicker">${escapeHtml(step.kicker)}</p>` : ''}
        <h2 class="quiz-q" tabindex="-1" data-focus>${escapeHtml(step.prompt)}</h2>
        <div class="quiz-options" role="group" aria-label="Answers">
          ${step.options
            .map(
              (option) => `<button type="button" class="quiz-option" data-value="${escapeHtml(option.value)}"
                aria-pressed="${current === option.value}">${escapeHtml(option.label)}</button>`
            )
            .join('')}
        </div>
      </div>`;
    wireBack(index);
    root.querySelectorAll('.quiz-option').forEach((button) =>
      button.addEventListener('click', () => {
        const option = step.options.find((o) => String(o.value) === button.dataset.value);
        state.answers[step.id] = option.value;
        root.querySelectorAll('.quiz-option').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
        if (index === steps.length - 1) track('AssessmentComplete', { content_name: id });
        state.index = index + 1;
        save();
        setTimeout(render, 160);
      })
    );
    focusHeading();
  }

  function renderEmail() {
    root.innerHTML = `
      <div class="quiz-card">
        ${progress(steps.length)}
        <h2 class="quiz-q" tabindex="-1" data-focus>${emailStep.title}</h2>
        <p class="quiz-sub">${emailStep.body}</p>
        <div class="quiz-form"></div>
      </div>`;
    wireBack(steps.length);
    leadForm(root.querySelector('.quiz-form'), {
      button: emailStep.button,
      note: emailStep.note,
      fine: emailStep.fine,
      onSubmit: async (contact) => {
        await onLead(contact, state.answers);
        state.lead = true;
        save();
        render();
      },
    });
    focusHeading();
  }

  function renderDone() {
    root.innerHTML = `<div class="results">${renderResults(state.answers)}</div>`;
    if (!state.lead) {
      const slot = root.querySelector('[data-soft-gate]');
      if (slot) {
        slot.hidden = false;
        leadForm(slot.querySelector('.slot') || slot, {
          button: emailStep.button,
          note: emailStep.note,
          fine: emailStep.fine,
          onSubmit: async (contact) => {
            await onLead(contact, state.answers);
            state.lead = true;
            save();
            slot.innerHTML = '<p class="sent">Sent. Check your inbox in a minute or two.</p>';
          },
        });
      }
    }
    root.querySelector('[data-retake]')?.addEventListener('click', () => {
      state.answers = {};
      state.index = 0;
      save();
      render();
    });
    track('ResultsView', { content_name: id });
    afterResults?.(root, state.answers);
    focusHeading();
  }

  function render() {
    if (state.index < steps.length) return renderQuestion(state.index);
    if (gate === 'hard' && !state.lead) return renderEmail();
    return renderDone();
  }

  return {
    start() {
      enterFlow(root);
      if (!started && Object.keys(state.answers).length === 0) track('AssessmentStart', { content_name: id });
      started = true;
      render();
    },
  };
}
