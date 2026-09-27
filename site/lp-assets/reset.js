// 60-second reset: a guided 4-7-8 breathing pacer, then the 5-day Calm Operator series opt-in.
import { breathingTimeline } from './core.js';
import { OWNER_ROLES } from './questions.js';
import { initPage, leadForm, openBooking, submitLead, track } from './lp.js';

const PREP_SECONDS = 3;
export const ROUNDS = 3;
const LABELS = { prep: 'Breathe out', inhale: 'Breathe in', hold: 'Hold', exhale: 'Breathe out' };
const SCALE = { prep: 0.45, inhale: 1, hold: 1, exhale: 0.45 };

function pacer(root, { onStart, onDone }) {
  const orb = root.querySelector('.orb');
  const phase = root.querySelector('.phase');
  const count = root.querySelector('.count');
  const cycle = root.querySelector('.cycle');
  const live = root.querySelector('[aria-live]');
  const startBtn = root.querySelector('[data-pacer=start]');
  const stopBtn = root.querySelector('[data-pacer=stop]');
  const steps = [{ cycle: 0, phase: 'prep', seconds: PREP_SECONDS }, ...breathingTimeline([4, 7, 8], ROUNDS)];
  let timer;

  function show(step, remaining) {
    phase.textContent = LABELS[step.phase];
    count.textContent = String(remaining);
    cycle.textContent = step.cycle ? `Round ${step.cycle} of ${ROUNDS}` : 'Empty your lungs through your mouth';
  }

  function run(index) {
    if (index >= steps.length) {
      stop(true);
      return;
    }
    const step = steps[index];
    orb.style.transitionDuration = step.phase === 'hold' ? '0s' : `${step.seconds}s`;
    orb.style.transform = `scale(${SCALE[step.phase]})`;
    live.textContent = LABELS[step.phase];
    let remaining = step.seconds;
    show(step, remaining);
    const tick = () => {
      remaining -= 1;
      if (remaining <= 0) return run(index + 1);
      show(step, remaining);
      timer = setTimeout(tick, 1000);
    };
    timer = setTimeout(tick, 1000);
  }

  function stop(done) {
    clearTimeout(timer);
    orb.style.transitionDuration = '1s';
    orb.style.transform = `scale(${SCALE.exhale})`;
    phase.textContent = done ? 'Nice.' : 'Ready';
    count.textContent = '';
    cycle.textContent = done ? 'That was one minute.' : `${ROUNDS} rounds, about a minute`;
    startBtn.hidden = false;
    startBtn.textContent = done ? 'Go again' : 'Start the reset';
    stopBtn.hidden = true;
    if (done) onDone();
  }

  startBtn.addEventListener('click', () => {
    startBtn.hidden = true;
    stopBtn.hidden = false;
    onStart();
    run(0);
  });
  stopBtn.addEventListener('click', () => stop(false));
}

export function init() {
  initPage({ page: 'reset', cell: 'OWN-CALM', contentName: 'calm_operator_reset' });
  const after = document.getElementById('after-reset');

  pacer(document.getElementById('pacer'), {
    onStart: () => track('ResetStart', { content_name: 'calm_operator_reset' }),
    onDone: () => {
      track('ResetComplete', { content_name: 'calm_operator_reset' });
      after.hidden = false;
    },
  });

  document.querySelectorAll('[data-lead=reset]').forEach((slot) =>
    leadForm(slot, {
      button: 'Send me the 5-day reset',
      roles: OWNER_ROLES,
      onSubmit: async (contact) => {
        await submitLead({
          ...contact,
          leadMagnet: 'calm_operator_reset',
          bookingNote: 'Came in through the 60-second reset (Calm Operator series).',
        });
        slot.innerHTML = `
          <p class="sent">Day 1 is on its way. Check your inbox in a minute or two.</p>
          <p>Calm raises your supply. If something keeps draining it, the <a href="/full-power/">3-minute Full Power check</a> shows what.</p>
          <button class="btn btn-primary btn-block" type="button" data-book-after>Book a free 30-minute session</button>`;
        slot.querySelector('[data-book-after]').addEventListener('click', () => openBooking('reset_after_lead'));
      },
    })
  );
}
