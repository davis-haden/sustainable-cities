/* Orbit camera and framing. The camera circles `target` at angle theta (around) and phi (down from
   straight above), at baseDist * zoom. fit() sizes the island to the free space on the stage and
   centreIsland() keeps it vertically centred as it turns. */
import { THREE } from '../lib/three.js';

export const DEF = { theta: 0.7, phi: 1.0, zoom: 1 };
var FOV = 34;

/* screen box of the island: slab corners (ground to a typical roofline) and the narrow tip of the base */
var ISL = [];
[-100, 100].forEach(function (x) { [-100, 100].forEach(function (z) { ISL.push([x, -4.5, z], [x, 3, z], [x * 0.3, -18, z * 0.3]); }); });
/* points along the slab's top (roofline) and bottom edges, for checking the island against the panels */
var EDGE = [];
[[-100, -100, 100, -100], [100, -100, 100, 100], [100, 100, -100, 100], [-100, 100, -100, -100]].forEach(function (e) {
  for (var i = 0; i <= 20; i++) {
    var x = e[0] + (e[2] - e[0]) * i / 20, z = e[1] + (e[3] - e[1]) * i / 20;
    EDGE.push([x, 12, z], [x, -4.5, z]);
  }
});

export function createCamera(ctx) {
  var el = ctx.el, stage = el.stage;
  var camera = new THREE.PerspectiveCamera(FOV, 1, 1, 3000);
  var v3 = new THREE.Vector3();

  var cam = {
    camera: camera,
    theta: DEF.theta, phi: DEF.phi, zoom: DEF.zoom,
    zoomGoal: 1, focusing: false, baseDist: 320,
    target: new THREE.Vector3(0, 6, 0), goal: new THREE.Vector3(0, 6, 0),
    /* view offset: "side" leaves room for the copy; "centre" is used once zoomed in far enough that the
       copy fades out, and centreK eases between them. Vertically, "auto" keeps the whole island centred
       in the free band; "focus" centres the camera target (for a selected tile). */
    centreK: 0,
    view: { w: 1, h: 1, side: 0, centre: 0, auto: 0, focus: 0, freeCy: 0, bias: 0 }
  };
  var view = cam.view;

  cam.place = function () {
    var dist = cam.baseDist * cam.zoom, t = cam.target;
    camera.position.set(t.x + dist * Math.sin(cam.phi) * Math.sin(cam.theta), t.y + dist * Math.cos(cam.phi), t.z + dist * Math.sin(cam.phi) * Math.cos(cam.theta));
    camera.lookAt(t);
  };
  cam.viewY = function () { return view.auto + (view.focus - view.auto) * cam.centreK; };
  cam.applyOffset = function () {
    camera.setViewOffset(view.w, view.h, view.side + (view.centre - view.side) * cam.centreK, cam.viewY(), view.w, view.h);
    camera.updateProjectionMatrix();
  };
  /* world point to stage pixels */
  cam.toScreen = function (x, y, z) {
    v3.set(x, y, z).project(camera);
    return { x: (v3.x + 1) / 2 * view.w, y: (1 - v3.y) / 2 * view.h, behind: v3.z > 1 };
  };

  /* the space the overlays cover, so the city is framed in what's left. Layout offsets (not bounding
     boxes) so scroll parallax on the copy never shifts the framing. */
  function insets(w, h) {
    var ins = { l: 32, r: 32, t: 24, b: 24 }, wide = w >= 900; /* side margins keep the island's corners off the frame */
    if (el.header) ins.t = el.header.offsetTop + el.header.offsetHeight + 16;
    /* on wide screens only the timeline line counts; the boxes above it sit in the corners */
    if (el.dock) ins.b = Math.max(ins.b, h - el.dock.offsetTop - (wide && el.line ? el.line.offsetTop : 0) + 16);
    if (el.copy && !wide) ins.t = Math.max(ins.t, el.copy.offsetTop + el.copy.offsetHeight + 8); /* below 900px the headline sits above the city; wider, it lives in the left column */
    if (h - ins.t - ins.b < h * 0.3) ins.t = Math.min(ins.t, h * 0.25);
    return ins;
  }
  function islandBox() {
    var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, ok = true;
    camera.updateMatrixWorld();
    ISL.forEach(function (p) {
      var s = cam.toScreen(p[0], p[1], p[2]);
      if (s.behind) ok = false; /* behind the camera: the box means nothing */
      x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); y0 = Math.min(y0, s.y); y1 = Math.max(y1, s.y);
    });
    return ok && { w: x1 - x0, h: y1 - y0, cy: (y0 + y1) / 2 };
  }
  function panelRects() {
    var sr = stage.getBoundingClientRect(), out = [], pad = 12;
    function add(r) { if (r.width && r.height) out.push({ l: r.left - sr.left - pad, r: r.right - sr.left + pad, t: r.top - sr.top - pad, b: r.bottom - sr.top + pad }); }
    if (el.h1 && view.w >= 900) {
      /* width from the text, height from the h1 box: the intro slides the text, not the box */
      var rg = document.createRange(), hb = el.h1.getBoundingClientRect(); rg.selectNodeContents(el.h1);
      var tr = rg.getBoundingClientRect();
      add({ left: tr.left, right: tr.right, top: hb.top, bottom: hb.bottom, width: tr.width, height: hb.height });
    }
    [el.spec, el.explore, el.about].forEach(function (p) { if (p && p.offsetParent) add(p.getBoundingClientRect()); });
    return out;
  }
  function hitsPanels(rects) {
    camera.updateMatrixWorld();
    return EDGE.some(function (p) {
      var s = cam.toScreen(p[0], p[1], p[2]);
      return rects.some(function (r) { return s.x > r.l && s.x < r.r && s.y > r.t && s.y < r.b; });
    });
  }
  /* nudge "auto" so the island's box sits in the middle of the free band (k = 1 snaps) */
  cam.centreIsland = function (k) {
    var b = islandBox();
    if (!b) return;
    var need = cam.viewY() + (b.cy - view.freeCy - view.bias);
    view.auto += (need - view.auto) * k;
    cam.applyOffset();
  };

  cam.fit = function () {
    var w = Math.max(1, stage.clientWidth), h = Math.max(1, stage.clientHeight), ins = insets(w, h);
    if (el.dock) stage.style.setProperty('--vc-dock-h', (h - el.dock.offsetTop) + 'px'); /* lets CSS sit things just above the dock */
    ctx.renderer.setSize(w, h, false);
    camera.aspect = w / h;
    view.bias = 0;
    view.w = w; view.h = h; view.focus = (ins.b - ins.t) / 2; view.freeCy = (ins.t + h - ins.b) / 2;
    view.side = (ins.r - ins.l) / 2; view.centre = 0;
    /* room for the island: between the header and the timeline, and on wide screens between the
       side columns that hold the callouts and boxes */
    var availW = w - ins.l - ins.r, availH = h - ins.t - ins.b;
    if (w >= 900 && el.explore && el.explore.offsetParent) {
      var cr = el.explore.getBoundingClientRect().right - stage.getBoundingClientRect().left + 24;
      availW = Math.min(availW, w - 2 * cr);
    }
    availW *= 0.96; availH *= 0.9;
    /* size it at the default view and at a diagonal (its widest while orbiting), keep the larger need */
    var keep = { theta: cam.theta, phi: cam.phi, zoom: cam.zoom, target: cam.target.clone() };
    cam.zoom = 1; cam.phi = DEF.phi; cam.target.set(0, 6, 0); cam.baseDist = 320;
    cam.applyOffset();
    var need = 0;
    [DEF.theta, Math.PI / 4].forEach(function (th) {
      cam.theta = th; cam.place();
      var b = islandBox();
      if (b) need = Math.max(need, b.w / availW, b.h / availH);
    });
    cam.baseDist = 320 * (need || 1);
    /* then make sure it clears the headline and panels at both angles: first let it sit a little
       below centre (short screens, where the headline reaches down), then step back if still needed */
    var rects = panelRects(), clear = false;
    for (var tries = 0; tries < 12 && !clear; tries++) {
      for (var k = 0; k <= 4 && !clear; k++) {
        view.bias = h * 0.02 * k;
        clear = [DEF.theta, Math.PI / 4].every(function (th) {
          cam.theta = th; cam.place(); cam.centreIsland(1); cam.centreIsland(1);
          return !hitsPanels(rects);
        });
      }
      if (!clear) cam.baseDist *= 1.045;
    }
    /* centre it once at the default view, then the frame loop keeps it there */
    cam.theta = DEF.theta; cam.place(); cam.centreIsland(1); cam.centreIsland(1);
    cam.theta = keep.theta; cam.phi = keep.phi; cam.zoom = keep.zoom; cam.target.copy(keep.target);
    cam.applyOffset();
    cam.place();
  };

  return cam;
}
