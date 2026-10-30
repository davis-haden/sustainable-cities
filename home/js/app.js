/* Wires the home page's voxel city together. Each module gets the shared ctx (DOM elements, renderer,
   scene, camera and the small bits of shared state) and returns the functions others need, which are
   hung back on ctx so modules can call each other without importing each other.

     world/     the map and the voxel builders (pure: no DOM, no scene)
     scene/     three.js objects: city, transit, lights, glow
     view/      camera framing and camera controls
     ui/        picking, details card, callouts, HUD, background waves, scroll, guided tour
     timeline/  schedule, tile conversion, playback
     intro.js   the opening animation
     loop.js    the per-frame update */
import { THREE } from './lib/three.js';
import { buildCity } from './scene/city.js';
import { buildTransit } from './scene/transit.js';
import { addLighting } from './scene/lighting.js';
import { makeGlow } from './scene/glow.js';
import { createCamera, DEF } from './view/camera.js';
import { createControls } from './view/controls.js';
import { createPicker } from './ui/picking.js';
import { createDetails } from './ui/details.js';
import { createWaves } from './ui/waves.js';
import { createCallouts } from './ui/callouts.js';
import { createHud } from './ui/hud.js';
import { watchScroll } from './ui/scroll.js';
import { scheduleTiles } from './timeline/schedule.js';
import { createConverter } from './timeline/convert.js';
import { createPlayback } from './timeline/playback.js';
import { createIntro } from './intro.js';
import { createTour } from './ui/tour.js';
import { createLoop } from './loop.js';

export function startApp(ctx) {
  var scene = new THREE.Scene();
  ctx.scene = scene;
  ctx.city = buildCity(scene);
  var transit = buildTransit(scene, ctx.city.tiles);
  addLighting(scene);
  ctx.glow = { hover: makeGlow(scene), sel: makeGlow(scene) };

  ctx.cam = createCamera(ctx);
  ctx.pickTile = createPicker(ctx);
  ctx.details = createDetails(ctx);
  var updateCalls = createCallouts(ctx);
  scheduleTiles(ctx.city.tiles);
  var updateTile = createConverter(ctx.city);
  ctx.timeline = createPlayback(ctx);
  var updateHud = createHud(ctx);
  var drawWaves = createWaves(ctx);
  createIntro(ctx);
  var loop = createLoop(ctx, { playback: ctx.timeline, updateTile: updateTile, transit: transit, updateHud: updateHud, updateCalls: updateCalls, drawWaves: drawWaves });
  ctx.wake = loop.wake;
  ctx.controls = createControls(ctx);
  ctx.tour = createTour(ctx);
  watchScroll(ctx);

  scene.updateMatrixWorld(true);
  ctx.cam.fit();
  loop.frame();
  if (window.ResizeObserver) { var ro = new ResizeObserver(ctx.cam.fit); ro.observe(ctx.el.stage); ro.observe(ctx.el.dock); }
  else window.addEventListener('resize', ctx.cam.fit);

  watchVisibility(ctx);
  ctx.el.stage.classList.add('is-ready');
}

/* Run the loop only while the hero is on screen, start the intro once most of it is visible, and reset
   the view when it scrolls away. Observes the hero, not the stage: the stage's intro clip-path would
   read as hidden. */
function watchVisibility(ctx) {
  var hero = ctx.el.hero, cam = ctx.cam, sel = ctx.sel;
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      var e = entries[entries.length - 1];
      ctx.onScreen = e.isIntersecting;
      /* scrolled past: fully gone snaps back to the opening view, mostly gone (short pages) glides back */
      if (!ctx.onScreen) ctx.controls.snapHome();
      else if (e.intersectionRatio < 0.35 && e.boundingClientRect.top < 0 && (sel.tile || sel.saved || cam.zoomGoal !== DEF.zoom || !ctx.input.orbit)) {
        ctx.details.selectTile(null); sel.saved = null; ctx.controls.engage(false); ctx.controls.resetView();
      }
      if (ctx.onScreen && !ctx.intro.done && e.intersectionRatio >= 0.4) ctx.intro.start();
      ctx.wake();
    }, { threshold: [0, 0.35, 0.4] }).observe(hero);
  } else {
    ctx.onScreen = true; ctx.intro.start();
  }
  /* fallback: if the observer's first callback never arrives, don't leave the hero closed */
  setTimeout(function () {
    var r = hero.getBoundingClientRect();
    if (!ctx.intro.active && !ctx.intro.done && r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4) { ctx.onScreen = true; ctx.intro.start(); }
  }, 1500);
  document.addEventListener('visibilitychange', ctx.wake);
}
