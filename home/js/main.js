/* Home page entry point. Finds the hero's elements, checks that three.js and WebGL are available, then
   loads the app (home/js/app.js). If either is missing the page shows a message instead of the city.
   Element ids are prefixed "vc-" (voxel city) so they can't clash with the rest of the site. */
import { T_END } from './world/constants.js';
import { startClock } from './ui/clock.js';

var $ = function (id) { return document.getElementById('vc-' + id); };
startClock(document.getElementById('hdr-clock'));

var stage = $('stage');
if (stage) boot();

function boot() {
  var hero = stage.parentElement;
  var el = {
    stage: stage, hero: hero, canvas: $('gl'), msg: $('msg'), tip: $('tip'), toast: $('toast'),
    lines: $('lines'), calls: $('calls'), legend: $('legend'), dock: $('dock'),
    pop: $('pop'), popClose: $('popClose'), popTag: $('popTag'), popWhere: $('popWhere'), popTitle: $('popTitle'),
    popBlurb: $('popBlurb'), popStats: $('popStats'), popSkip: $('popSkip'),
    play: $('play'), scrub: $('scrub'), year: $('year'), phase: $('phase'),
    zoomIn: $('zoomIn'), zoomOut: $('zoomOut'), resetView: $('resetView'),
    bPower: $('bPower'), bTiles: $('bTiles'), bCo2: $('bCo2'), barPower: $('barPower'), barTiles: $('barTiles'), barCo2: $('barCo2'),
    header: document.querySelector('.site-header'), copy: hero.querySelector('.hero-copy'), h1: hero.querySelector('.hero-copy h1'),
    line: hero.querySelector('.vc-line'), spec: hero.querySelector('.vc-spec'), explore: hero.querySelector('.vc-explore'), about: hero.querySelector('.vc-about')
  };
  hero.classList.add('is-intro');

  function bail(text) {
    el.msg.textContent = text; el.msg.hidden = false;
    stage.style.clipPath = 'none'; hero.classList.add('intro-type', 'intro-done');
  }
  if (!window.THREE) { bail('The 3D library could not be loaded.'); return; }
  var THREE = window.THREE, renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: el.canvas, antialias: true, alpha: true });
  } catch (e) { bail('This browser could not start WebGL, so the 3D scene cannot be drawn.'); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ctx = {
    el: el, renderer: renderer, reduce: reduce, onScreen: false,
    /* reduced motion: start at 2050, no orbit, nothing animating */
    input: { orbit: !reduce, animate: !reduce, engaged: false, ptrs: new Map(), mouse: { x: 0, y: 0, cx: 0, cy: 0, in: false, dirty: false } },
    tl: { T: reduce ? T_END : -0.8, playing: false, scrubbing: false, drawnT: null },
    sel: { tile: null, hover: null, green: false, saved: null },
    intro: { active: null, done: false },
    wake: function () {}
  };

  /* loaded only once three.js is known to be here, since its modules build three.js objects on import */
  import('./app.js').then(function (m) { m.startApp(ctx); }).catch(function (err) {
    console.error(err);
    bail('The 3D scene could not be started.');
  });
}
