/* Everything on the page that reports the timeline: year, phase, play button state, scrubber, the
   readout box (clean power, green tiles, CO2 index) and the legend counts. */
import { clamp } from '../lib/util.js';
import { T_END } from '../world/constants.js';

export function createHud(ctx, classCounts, updateLegend) {
  var el = ctx.el, tl = ctx.tl, tiles = ctx.city.tiles;

  return function update() {
    var T = tl.T, sum = { power: 0, rail: 0, garden: 0, city: 0 }, done = 0;
    tiles.forEach(function (t) { sum[t.cls] += t.p; if (t.p >= 0.98) done++; });
    var fP = sum.power / classCounts.power, fT = sum.rail / classCounts.rail, fG = sum.garden / classCounts.garden, fB = sum.city / classCounts.city;
    var co2 = 100 - 88 * (0.6 * fP + 0.15 * fT + 0.1 * fG + 0.15 * fB);
    var tt = Math.max(0, T);
    el.year.textContent = String(Math.round(2000 + 50 * clamp(tt / T_END, 0, 1)));
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
      el.play.setAttribute('aria-label', state === 'replay' ? 'Replay from 2000' : (state === 'pause' ? 'Pause' : 'Play'));
    }
    if (!tl.scrubbing) el.scrub.value = tt.toFixed(2);
    el.scrub.style.setProperty('--p', (clamp(tt / T_END, 0, 1) * 100).toFixed(2) + '%');
    el.scrub.setAttribute('aria-valuetext', el.year.textContent + ', ' + phase);
    updateLegend();
    el.bPower.textContent = Math.round(fP * 100) + '%'; el.barPower.style.width = (fP * 100).toFixed(1) + '%';
    el.bTiles.textContent = done + '/' + tiles.length; el.barTiles.style.width = (done / tiles.length * 100).toFixed(1) + '%';
    el.bCo2.textContent = Math.round(co2); el.barCo2.style.width = clamp(co2, 0, 100).toFixed(1) + '%';
  };
}
