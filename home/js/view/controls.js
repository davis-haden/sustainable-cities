/* Pointer, wheel, keyboard and button controls for the camera: drag to orbit, pinch or engaged wheel to
   zoom, arrow keys, the zoom/reset buttons, and a click on a tile to open it. */
import { clamp } from '../lib/util.js';
import { DEF } from './camera.js';

/* zoom limits: in to a close-up, out only as far as the opening view, where scrolling moves on down the page */
var ZOOM_MIN = 0.2, ZOOM_MAX = DEF.zoom;

export function createControls(ctx) {
  var el = ctx.el, stage = el.stage, canvas = el.canvas, cam = ctx.cam, input = ctx.input, mouse = input.mouse, ptrs = input.ptrs;
  var lastPinch = 0, down = null, moved = false, toastTimer = 0, toastShown = 0;

  function pinch() { var p = Array.from(ptrs.values()); return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); }
  /* "engaged" (clicked, dragged or focused): the wheel zooms the scene instead of scrolling the page */
  function engage(on) { input.engaged = on; stage.classList.toggle('is-engaged', on); if (on && el.toast) el.toast.classList.remove('is-shown'); }
  function toast() {
    if (!el.toast || toastShown >= 2) return;
    toastShown++;
    el.toast.classList.add('is-shown');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.toast.classList.remove('is-shown'); }, 1800);
  }
  function pointerToMouse(e) {
    var rect = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouse.cx = e.clientX - rect.left; mouse.cy = e.clientY - rect.top;
  }

  stage.addEventListener('pointerleave', function () { engage(false); });
  canvas.addEventListener('focus', function () { engage(true); });
  canvas.addEventListener('blur', function () { engage(false); });
  canvas.addEventListener('pointerdown', function (e) {
    ctx.intro.finish();
    engage(true);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 1) { down = { x: e.clientX, y: e.clientY }; moved = false; }
    if (ptrs.size === 2) { lastPinch = pinch(); moved = true; }
    cam.focusing = false;
  });
  canvas.addEventListener('pointermove', function (e) {
    pointerToMouse(e);
    mouse.in = true; mouse.dirty = true;
    var p = ptrs.get(e.pointerId);
    if (!p) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y;
    p.x = e.clientX; p.y = e.clientY;
    if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) { moved = true; input.orbit = false; }
    if (!moved) return;
    if (ptrs.size === 1) {
      cam.theta -= dx * 0.0075;
      cam.phi = clamp(cam.phi - dy * 0.0075, 0.25, 1.5);
    } else if (ptrs.size === 2) {
      var dd = pinch();
      if (lastPinch && dd) cam.zoom = clamp(cam.zoom * lastPinch / dd, ZOOM_MIN, ZOOM_MAX);
      lastPinch = dd;
    }
  });
  canvas.addEventListener('pointerup', function (e) {
    var wasOne = ptrs.size === 1;
    ptrs.delete(e.pointerId); lastPinch = 0;
    if (wasOne && !moved) {
      pointerToMouse(e);
      var t = ctx.pickTile();
      if (t && t.kind) ctx.details.focusTile(t); else if (ctx.sel.tile) ctx.details.unfocus();
    }
  });
  canvas.addEventListener('pointercancel', function (e) { ptrs.delete(e.pointerId); lastPinch = 0; });
  canvas.addEventListener('pointerleave', function () { mouse.in = false; ctx.details.setHover(null); });
  /* the wheel zooms once the scene is engaged or with a pinch / Ctrl / Cmd; otherwise it scrolls the page */
  canvas.addEventListener('wheel', function (e) {
    if (!input.engaged && !e.ctrlKey && !e.metaKey) { if (ctx.intro.done) toast(); return; }
    ctx.intro.finish();
    /* already zoomed all the way out and still scrolling down: hand the wheel back to the page */
    if (e.deltaY > 0 && !e.ctrlKey && !e.metaKey && (cam.focusing ? cam.zoomGoal : cam.zoom) >= ZOOM_MAX - 1e-3) { engage(false); return; }
    e.preventDefault(); cam.focusing = false;
    cam.zoom = clamp(cam.zoom * Math.exp(e.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAX); cam.zoomGoal = cam.zoom;
  }, { passive: false });
  canvas.addEventListener('keydown', function (e) {
    var used = true;
    if (e.key === 'ArrowLeft') cam.theta -= 0.12;
    else if (e.key === 'ArrowRight') cam.theta += 0.12;
    else if (e.key === 'ArrowUp') cam.phi = clamp(cam.phi - 0.08, 0.25, 1.5);
    else if (e.key === 'ArrowDown') cam.phi = clamp(cam.phi + 0.08, 0.25, 1.5);
    else if (e.key === '+' || e.key === '=') cam.zoom = clamp(cam.zoom * 0.92, ZOOM_MIN, ZOOM_MAX);
    else if (e.key === '-') cam.zoom = clamp(cam.zoom * 1.08, ZOOM_MIN, ZOOM_MAX);
    else used = false;
    if (used) { e.preventDefault(); input.orbit = false; }
  });

  function zoomBy(f) {
    cam.goal.copy(cam.target); cam.zoomGoal = clamp((cam.focusing ? cam.zoomGoal : cam.zoom) * f, ZOOM_MIN, ZOOM_MAX); cam.focusing = true; ctx.wake();
  }
  /* glide back to the opening view */
  function resetView() {
    cam.theta = DEF.theta; cam.phi = DEF.phi; cam.zoomGoal = DEF.zoom; cam.goal.set(0, 6, 0); cam.focusing = true; input.orbit = !ctx.reduce;
  }
  /* once the stage is fully out of view, quietly put everything back to the opening view */
  function snapHome() {
    ctx.details.selectTile(null); ctx.details.setHover(null); ctx.sel.saved = null; engage(false);
    cam.theta = DEF.theta; cam.phi = DEF.phi; cam.zoom = cam.zoomGoal = DEF.zoom;
    cam.target.set(0, 6, 0); cam.goal.copy(cam.target); cam.focusing = false;
    input.orbit = !ctx.reduce;
    cam.centreK = 0; el.hero.classList.remove('is-zoomed');
    cam.applyOffset(); cam.place();
  }
  el.zoomIn.addEventListener('click', function () { zoomBy(0.75); });
  el.zoomOut.addEventListener('click', function () { zoomBy(1 / 0.75); });
  el.resetView.addEventListener('click', function () { ctx.details.selectTile(null); ctx.sel.saved = null; resetView(); });

  return { engage: engage, resetView: resetView, snapHome: snapHome };
}
