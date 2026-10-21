/* Timeline playback: play/pause/replay, the scrubber, and the phase buttons (on the dock and in the
   phase cards below the hero). The time itself lives in ctx.tl.T and advances in the frame loop. */
import { clamp } from '../lib/util.js';
import { T_END } from '../world/constants.js';

export function createPlayback(ctx) {
  var el = ctx.el, tl = ctx.tl, wasPlaying = false;

  function seek(t, keepPlaying) {
    tl.T = clamp(t, 0, T_END);
    tl.playing = !!keepPlaying && tl.T < T_END;
    tl.drawnT = null; ctx.wake();
  }

  el.play.addEventListener('click', function () {
    if (tl.T >= T_END) { ctx.details.unfocus(); tl.T = -0.4; tl.playing = true; }
    else tl.playing = !tl.playing;
    tl.drawnT = null; ctx.wake();
  });
  el.scrub.addEventListener('pointerdown', function () { tl.scrubbing = true; wasPlaying = tl.playing; });
  el.scrub.addEventListener('input', function () { seek(parseFloat(el.scrub.value), false); });
  el.scrub.addEventListener('change', function () { tl.scrubbing = false; if (wasPlaying) seek(tl.T, true); wasPlaying = false; });
  document.querySelectorAll('[data-vc-seek]').forEach(function (b) {
    b.addEventListener('click', function () {
      seek(parseFloat(b.getAttribute('data-vc-seek')), !ctx.reduce);
      if (!b.closest('#vc-stage')) el.stage.scrollIntoView({ behavior: ctx.reduce ? 'auto' : 'smooth', block: 'center' });
    });
  });

  /* advance time by dt while playing */
  function step(dt) {
    if (tl.playing) { tl.T += dt; if (tl.T >= T_END) { tl.T = T_END; tl.playing = false; } }
  }

  return { seek: seek, step: step };
}
