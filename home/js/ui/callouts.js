/* Callouts: leader lines from four live tiles to labels in the side columns. The two tiles furthest
   left on screen take the left labels, and so on; labels follow their tile's height within the free
   band of their column and hide when there isn't room. */
import { clamp } from '../lib/util.js';
import { TD } from '../world/constants.js';
import { oldName } from '../world/info.js';
import { yearAt } from '../world/constants.js';

var SVGNS = 'http://www.w3.org/2000/svg';
var FEATURED = [['Wind', ['wind']], ['Solar', ['solar']], ['Light rail', ['hub']], ['Forest', ['forest']]];

function callStatus(t) {
  if (t.p >= 0.98) return 'Online since ' + yearAt(t.ts + TD);
  if (t.p > 0.02) return 'Converting ' + Math.round(t.p * 100) + '%';
  return oldName(t) + ' → ' + yearAt(t.ts + TD);
}

export function createCallouts(ctx) {
  var el = ctx.el, stage = el.stage, cam = ctx.cam;
  var CALLS = FEATURED.map(function (c, i) {
    /* the tile of each kind furthest from the middle keeps its line clear of the rest of the city */
    var t = ctx.city.tiles.filter(function (q) { return c[1].indexOf(q.kind) >= 0; })
      .sort(function (a, b) { return Math.hypot(b.cx, b.cz) - Math.hypot(a.cx, a.cz); })[0];
    return t && { tile: t, n: '0' + (i + 1), name: c[0], pt: [t.cx, Math.min(t.top || 4, 10), t.cz], sx: 0, sy: 0 };
  }).filter(Boolean);

  /* four fixed slots: 0 and 1 on the left, 2 and 3 on the right */
  var slots = CALLS.map(function (_, i) {
    var b = document.createElement('button'), path = document.createElementNS(SVGNS, 'path'), dot = document.createElementNS(SVGNS, 'rect');
    b.type = 'button'; b.className = 'vc-call';
    b.dataset.slot = i; b.innerHTML = '<b></b><span></span>';
    dot.setAttribute('width', 6); dot.setAttribute('height', 6);
    el.lines.appendChild(path); el.lines.appendChild(dot); el.calls.appendChild(b);
    var s = { el: b, path: path, dot: dot, call: null, text: '', y: null };
    b.addEventListener('click', function () { if (s.call) ctx.details.focusTile(s.call.tile); });
    return s;
  });

  function relRect(node) {
    if (!node || node.offsetParent === null) return null;
    var r = node.getBoundingClientRect(), sr = stage.getBoundingClientRect();
    return { top: r.top - sr.top, bottom: r.bottom - sr.top };
  }
  /* the free vertical band in a side column: under the headline / date range, above the about box or timeline */
  function band(topEl, botEl, h) {
    var t = relRect(topEl), b = relRect(botEl), lr = relRect(el.line);
    return { top: (t ? t.bottom : 80) + 14, bottom: (b ? b.top : (lr ? lr.top : h - 80)) - 14 };
  }
  /* labels follow their tile's height, clamped into the band and pushed apart so they never touch */
  function stackSide(pair, bd) {
    var lh = pair[0].s.el.offsetHeight || 44, gap = 10;
    if (bd.bottom - bd.top < 2 * lh + gap) return false;
    pair.forEach(function (o) { o.y = clamp(o.c.sy, bd.top + lh / 2, bd.bottom - lh / 2); });
    if (pair[1].y - pair[0].y < lh + gap) {
      var mid = (pair[0].y + pair[1].y) / 2;
      mid = clamp(mid, bd.top + lh + gap / 2, bd.bottom - lh - gap / 2);
      pair[0].y = mid - (lh + gap) / 2; pair[1].y = mid + (lh + gap) / 2;
    }
    return true;
  }

  var callsOn = false;
  return function update(hudTick) {
    var on = ctx.intro.done && !ctx.sel.tile && !el.hero.classList.contains('is-zoomed') && el.calls.offsetParent !== null;
    var h = cam.view.h, fits = false, left, right;
    if (on) {
      CALLS.forEach(function (c) {
        var s = cam.toScreen(c.pt[0], c.pt[1], c.pt[2]);
        c.sx = s.x; c.sy = s.y;
      });
      var byX = CALLS.slice().sort(function (a, b) { return a.sx - b.sx; });
      var bySy = function (a, b) { return a.c.sy - b.c.sy; };
      left = byX.slice(0, 2).map(function (c) { return { c: c }; }).sort(bySy);
      right = byX.slice(2).map(function (c) { return { c: c }; }).sort(bySy);
      left[0].s = slots[0]; left[1].s = slots[1]; right[0].s = slots[2]; right[1].s = slots[3];
      fits = stackSide(left, band(el.h1, null, h)) && stackSide(right, band(el.date, el.about, h));
    }
    on = on && fits;
    if (on !== callsOn) { callsOn = on; stage.classList.toggle('calls-on', on); slots.forEach(function (s) { s.y = null; }); }
    if (!on) return;
    left.concat(right).forEach(function (o, i) {
      var c = o.c, s = o.s, tick = hudTick;
      if (s.call !== c) {
        s.call = c; s.el.classList.remove('is-swap'); void s.el.offsetWidth; s.el.classList.add('is-swap');
        s.el.firstChild.textContent = c.n + ' — ' + c.name;
        s.el.setAttribute('aria-label', c.name + ', tile ' + c.tile.label + ': show details');
        tick = true;
      }
      if (tick) {
        var txt = callStatus(c.tile);
        if (txt !== s.text) { s.text = txt; s.el.lastChild.textContent = txt; }
      }
      /* ease toward the target so labels glide as the city turns */
      s.y = s.y == null || ctx.reduce ? o.y : s.y + (o.y - s.y) * 0.18;
      s.el.style.top = s.y.toFixed(1) + 'px';
      /* label edge facing the city, then one right-angle elbow up or down to the tile */
      var isL = i < 2, ax = s.el.offsetLeft + (isL ? s.el.offsetWidth : 0);
      s.path.setAttribute('d', 'M' + ax.toFixed(1) + ' ' + s.y.toFixed(1) + 'H' + c.sx.toFixed(1) + 'V' + c.sy.toFixed(1));
      s.dot.setAttribute('x', (c.sx - 3).toFixed(1)); s.dot.setAttribute('y', (c.sy - 3).toFixed(1));
    });
  };
}
