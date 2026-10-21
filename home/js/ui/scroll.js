/* Scrolling: the headline drifts up and fades (CSS reads --vc-sk), and scrolling during the intro
   skips the rest of it. */
import { clamp } from '../lib/util.js';

export function watchScroll(ctx) {
  var el = ctx.el, queued = false;
  function onScroll() {
    if (queued) return;
    queued = true;
    window.requestAnimationFrame(function () {
      queued = false;
      var y = window.scrollY;
      if (!ctx.reduce && el.copy) el.copy.style.setProperty('--vc-sk', clamp(y / (el.stage.offsetHeight * 0.6), 0, 1).toFixed(3));
      if (ctx.intro.active && y > 40) ctx.intro.finish();
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}
