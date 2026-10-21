/* Everything on the page that reports the timeline: year, phase, play button state and scrubber. */
import { clamp } from '../lib/util.js';
import { T_END, START_YEAR, yearAt } from '../world/constants.js';

export function createHud(ctx) {
  var el = ctx.el, tl = ctx.tl;

  return function update() {
    var T = tl.T, tt = Math.max(0, T);
    el.year.textContent = String(yearAt(tt));
    var phase = T < 0.3 ? 'Starting point' : (T < 10 ? 'Phase 1 · Clean power' : (T < 20 ? 'Phase 2 · Light rail' : (T < T_END ? 'Phase 3 · Nature' : 'Complete · Green city')));
    if (el.phase.textContent !== phase) {
      el.phase.textContent = phase;
      el.phase.classList.remove('is-changing'); void el.phase.offsetWidth; el.phase.classList.add('is-changing');
    }
    el.stage.classList.toggle('is-complete', T >= T_END);
    el.dock.dataset.phase = T < 0.3 ? 0 : (T < 10 ? 1 : (T < 20 ? 2 : 3));
    var state = T >= T_END ? 'replay' : (tl.playing ? 'pause' : 'play');
    if (el.play.dataset.state !== state) {
      el.play.dataset.state = state;
      el.play.setAttribute('aria-label', state === 'replay' ? 'Replay from ' + START_YEAR : (state === 'pause' ? 'Pause' : 'Play'));
    }
    if (!tl.scrubbing) el.scrub.value = tt.toFixed(2);
    el.scrub.style.setProperty('--p', (clamp(tt / T_END, 0, 1) * 100).toFixed(2) + '%');
    el.scrub.setAttribute('aria-valuetext', el.year.textContent + ', ' + phase);
  };
}
