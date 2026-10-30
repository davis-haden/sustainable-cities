/* The guided tour: a small card above the timeline (up top on phones) that walks a first-time visitor through the four
   things the city does: turn it, zoom it, move through time, open a tile. Each step waits for the
   visitor to actually do it (watched each frame from the shared state, so mouse, touch, keyboard and
   the buttons all count), shows a hint where to do it, then moves on. It starts once after the intro
   on a first visit; the ? button in the view controls replays it. */
import { T_END, yearAt } from '../world/constants.js';
import { DEF } from '../view/camera.js';

var SEEN_KEY = 'vc-tour-seen';

export function createTour(ctx) {
  var el = ctx.el, stage = el.stage, cam = ctx.cam, input = ctx.input, sel = ctx.sel;
  var touch = window.matchMedia('(pointer: coarse)').matches, phone = window.matchMedia('(max-width: 767px)');
  var track = el.scrub.parentElement;

  var STEPS = [
    { title: 'Turn the city', gesture: 'drag',
      text: touch ? 'Swipe sideways across the city to spin it around.' : 'Drag across the city to spin it around. Arrow keys work too.' },
    { title: 'Zoom in', target: el.zoom,
      text: touch ? 'Pinch the city, or tap + below, to get a closer look.' : 'Scroll over the city, or press + below, to get a closer look.' },
    { title: 'Move through time', target: track,
      text: (touch ? 'Slide' : 'Drag') + ' the timeline, or pick a phase, to jump anywhere from ' + yearAt(0) + ' to ' + yearAt(T_END) + '.' },
    { title: 'Open a tile', gesture: 'tap',
      text: (touch ? 'Tap' : 'Click') + ' a tile, like the one circled, to see what it was and what it becomes.' }
  ];

  /* the card */
  var card = document.createElement('div');
  card.className = 'vc-tour';
  card.hidden = true;
  card.setAttribute('role', 'region');
  card.setAttribute('aria-label', 'How to explore the city');
  card.innerHTML =
    '<div class="vc-tour-hd"><span class="vc-tour-n"></span><button type="button" class="vc-tour-x" aria-label="End the tour">&times;</button></div>' +
    '<div class="vc-tour-body" aria-live="polite"><p class="vc-tour-title"></p><p class="vc-tour-text"></p></div>' +
    '<div class="vc-tour-ft"><span class="vc-tour-dots" aria-hidden="true"></span><button type="button" class="vc-tour-next"></button></div>';
  var q = function (s) { return card.querySelector(s); };
  var nEl = q('.vc-tour-n'), titleEl = q('.vc-tour-title'), textEl = q('.vc-tour-text'), dots = q('.vc-tour-dots'), next = q('.vc-tour-next');
  STEPS.forEach(function () { dots.appendChild(document.createElement('i')); });

  /* hints over the city: a hand that sweeps sideways, and a ring around a tile to tap */
  var hand = document.createElement('div'), ring = document.createElement('div');
  hand.className = 'vc-tour-hand'; ring.className = 'vc-tour-ring';
  hand.hidden = ring.hidden = true;
  hand.setAttribute('aria-hidden', 'true'); ring.setAttribute('aria-hidden', 'true');
  hand.innerHTML = ring.innerHTML = '<i></i>';
  stage.appendChild(hand); stage.appendChild(ring); stage.appendChild(card);

  var step = -1, base = null, doneAt = 0, rafId = 0, ringTile = null, timer = 0, used = false;

  function seen() { try { return localStorage.getItem(SEEN_KEY) === '1'; } catch (e) { return false; } }
  function remember() { try { localStorage.setItem(SEEN_KEY, '1'); } catch (e) {} }

  function zoomNow() { return cam.focusing ? cam.zoomGoal : cam.zoom; }

  function show(i) {
    var s = STEPS[i];
    step = i; doneAt = 0; ringTile = null;
    base = { theta: cam.theta, phi: cam.phi, zoom: zoomNow(), tile: sel.tile };
    card.classList.remove('is-done', 'is-finished');
    nEl.textContent = 'Explore · ' + (i + 1) + ' of ' + STEPS.length;
    titleEl.textContent = s.title; textEl.textContent = s.text;
    next.textContent = i === STEPS.length - 1 ? 'Finish' : 'Skip step';
    Array.prototype.forEach.call(dots.children, function (d, k) { d.className = k < i ? 'is-past' : (k === i ? 'is-on' : ''); });
    document.querySelectorAll('.vc-tour-target').forEach(function (n) { n.classList.remove('vc-tour-target'); });
    if (s.target) s.target.classList.add('vc-tour-target');
    hand.hidden = s.gesture !== 'drag';
    ring.hidden = true;
  }

  /* has the visitor done this step? read from the shared state, so every input method counts */
  function achieved() {
    switch (step) {
      case 0:
        if (input.orbit) { base.theta = cam.theta; base.phi = cam.phi; return false; } /* the slow auto-orbit doesn't count */
        return Math.abs(cam.theta - base.theta) > 0.45 || Math.abs(cam.phi - base.phi) > 0.2;
      case 1: return zoomNow() < Math.min(base.zoom, DEF.zoom) * 0.85;
      case 2: return used;
      case 3: return !!sel.tile && sel.tile !== base.tile;
    }
    return false;
  }

  function complete() {
    doneAt = performance.now();
    card.classList.add('is-done');
    hand.hidden = ring.hidden = true;
    if (STEPS[step].target) STEPS[step].target.classList.remove('vc-tour-target');
  }

  /* the screen point of a tile's top, relative to the stage */
  function tilePoint(t) { return cam.toScreen(t.cx, Math.min(t.top || 4, 10), t.cz); }
  /* a tile near the middle of the island that's clear of the card and the dock, and that a tap there
     actually picks (a taller block in front would steal it) */
  function chooseTile() {
    var w = cam.view.w, cr = card.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    var bottom = el.dock.offsetTop + el.line.offsetTop - 30, top = 90, pad = 30;
    var c = { l: cr.left - sr.left - pad, r: cr.right - sr.left + pad, t: cr.top - sr.top - pad, b: cr.bottom - sr.top + pad };
    var mid = tilePoint({ cx: 0, cz: 0, top: 6 }), mouse = input.mouse, mx = mouse.x, my = mouse.y;
    var picks = ctx.city.tiles.filter(function (t) { return t.kind; }).map(function (t) {
      var s = tilePoint(t);
      return { t: t, s: s, d: Math.hypot(s.x - mid.x, s.y - mid.y) };
    }).filter(function (o) {
      var underCard = o.s.x > c.l && o.s.x < c.r && o.s.y > c.t && o.s.y < c.b;
      return !o.s.behind && !underCard && o.s.x > 40 && o.s.x < w - 40 && o.s.y > top && o.s.y < bottom;
    }).sort(function (a, b) { return a.d - b.d; });
    var found = null;
    for (var i = 0; i < picks.length && i < 24 && !found; i++) {
      mouse.x = picks[i].s.x / w * 2 - 1; mouse.y = -(picks[i].s.y / cam.view.h) * 2 + 1;
      if (ctx.pickTile() === picks[i].t) found = picks[i].t;
    }
    mouse.x = mx; mouse.y = my;
    return found;
  }

  function place(node, s) { node.style.left = s.x.toFixed(1) + 'px'; node.style.top = s.y.toFixed(1) + 'px'; }

  function frame() {
    rafId = 0;
    if (step < 0) return;
    /* the card sits just above the timeline line, wherever the dock's height puts it; on phones it
       goes up top over the headline instead (CSS), so the island and the controls stay clear */
    card.style.bottom = phone.matches ? '' : (stage.clientHeight - el.dock.offsetTop - el.line.offsetTop + 14) + 'px';
    if (doneAt) {
      if (performance.now() - doneAt > 900) { if (step < STEPS.length - 1) show(step + 1); else finish(); }
    } else if (achieved()) {
      complete();
    } else if (STEPS[step].gesture === 'drag') {
      place(hand, tilePoint({ cx: 0, cz: 0, top: 6 }));
    } else if (STEPS[step].gesture === 'tap') {
      if (sel.tile) { ring.hidden = true; }
      else {
        var s = ringTile && tilePoint(ringTile);
        if (!s || s.behind || s.x < 0 || s.y < 0 || s.x > cam.view.w || s.y > cam.view.h) { ringTile = chooseTile(); s = ringTile && tilePoint(ringTile); }
        ring.hidden = !s;
        if (s) place(ring, s);
      }
    }
    if (step >= 0) rafId = requestAnimationFrame(frame);
  }

  function start() {
    clearTimeout(timer);
    used = false;
    card.hidden = false;
    stage.classList.add('is-touring');
    show(0);
    if (!rafId) rafId = requestAnimationFrame(frame);
  }

  /* last card: a short "you're set" that fades on its own */
  function finish() {
    remember();
    step = -1;
    hand.hidden = ring.hidden = true;
    card.classList.remove('is-done'); card.classList.add('is-finished');
    nEl.textContent = 'Explore · done';
    titleEl.textContent = 'You’re all set';
    textEl.textContent = 'Press play to watch all fifty years, or scroll down for the story.';
    next.textContent = 'Close';
    Array.prototype.forEach.call(dots.children, function (d) { d.className = 'is-past'; });
    /* on phones the details sheet covers the card, so its few seconds start once the tile is closed */
    (function wait() { timer = setTimeout(sel.tile ? wait : end, sel.tile ? 300 : 5000); })();
  }

  function end() {
    clearTimeout(timer);
    if (step >= 0) remember();
    step = -1;
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    card.hidden = hand.hidden = ring.hidden = true;
    stage.classList.remove('is-touring');
    document.querySelectorAll('.vc-tour-target').forEach(function (n) { n.classList.remove('vc-tour-target'); });
  }

  next.addEventListener('click', function () {
    if (card.classList.contains('is-finished')) end();
    else if (step === STEPS.length - 1) finish();
    else if (step >= 0 && !doneAt) show(step + 1);
  });
  q('.vc-tour-x').addEventListener('click', end);
  /* capture phase, so a details card closing on the same Escape is still open when this checks */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !card.hidden && !sel.tile) end(); }, true);
  /* the timeline step: a drag on the scrubber or a phase button */
  el.scrub.addEventListener('input', function () { used = true; });
  track.querySelectorAll('[data-vc-seek]').forEach(function (b) { b.addEventListener('click', function () { used = true; }); });

  /* the ? button replays the tour from the opening view */
  el.help.addEventListener('click', function () {
    ctx.intro.finish();
    if (sel.tile) ctx.details.unfocus();
    ctx.controls.resetView();
    start();
  });

  return {
    /* called when the intro finishes: on a first visit, start once the panels have settled in */
    offer: function (delay) {
      if (seen()) return;
      timer = setTimeout(function () {
        if (ctx.onScreen && step < 0 && card.hidden && stage.getBoundingClientRect().top > -stage.offsetHeight * 0.3) start();
      }, delay);
    },
    end: end
  };
}
