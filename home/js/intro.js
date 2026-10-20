/* Intro: a small square window opens on a close-up of the city, then grows to full bleed as the camera
   pulls back and swings round. .intro-type on the hero raises the headline; .intro-done reveals the
   panels and starts the timeline. */
import { clamp, easeOut, easeInOut } from './lib/util.js';
import { DEF } from './view/camera.js';

export function createIntro(ctx) {
  var intro = ctx.intro, el = ctx.el, cam = ctx.cam, tl = ctx.tl;

  intro.start = function () {
    if (intro.active || intro.done) return;
    el.hero.classList.add('intro-type');
    if (ctx.reduce) { intro.finish(); return; }
    intro.active = { t0: performance.now() };
    ctx.input.orbit = false; cam.focusing = false;
    cam.zoom = cam.zoomGoal = 0.3; cam.theta = DEF.theta - 0.6;
    intro.step(intro.active.t0);
    ctx.wake();
  };

  /* called each frame while the intro runs: clip the stage to the growing window and move the camera */
  intro.step = function (now) {
    var e = now - intro.active.t0, w = cam.view.w, h = cam.view.h;
    var cx = w / 2 - cam.view.side, cy = h / 2 - cam.viewY(), r0 = Math.min(w, h) * 0.08;
    var r = r0 * easeOut(clamp((e - 450) / 450, 0, 1)), g = 1 - easeInOut(clamp((e - 1000) / 1300, 0, 1));
    el.stage.style.clipPath = 'inset(' + ((cy - r) * g).toFixed(1) + 'px ' + ((w - cx - r) * g).toFixed(1) + 'px ' +
      ((h - cy - r) * g).toFixed(1) + 'px ' + ((cx - r) * g).toFixed(1) + 'px)';
    var k = easeInOut(clamp((e - 900) / 1700, 0, 1));
    cam.zoom = cam.zoomGoal = 0.3 + (DEF.zoom - 0.3) * k; cam.theta = DEF.theta - 0.6 * (1 - k);
    if (e >= 2600) intro.finish();
  };

  /* also called early when the visitor scrolls, drags or zooms */
  intro.finish = function () {
    if (intro.done) return;
    var wasRunning = !!intro.active;
    intro.active = null; intro.done = true;
    el.hero.classList.add('intro-type', 'intro-done');
    el.stage.style.clipPath = '';
    if (wasRunning) { cam.zoom = cam.zoomGoal = DEF.zoom; ctx.input.orbit = !ctx.reduce; }
    setTimeout(function () { if (!ctx.reduce && tl.T < 0 && !tl.playing) tl.playing = true; }, wasRunning ? 400 : 0);
    ctx.wake();
  };
}
