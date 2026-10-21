/* Hover tooltip, the details card, and flying the camera to a tile and back.
   Only tiles with a kind (power, rail, nature) react; plain city blocks stay quiet. */
import { TD, yearAt } from '../world/constants.js';
import { NAMES, INFO, PHASE_NAMES, oldName, placeName } from '../world/info.js';
import { placeGlow } from '../scene/glow.js';

export function isGreen(t) { return !!(t && t.kind && t.p >= 0.98); }

export function createDetails(ctx) {
  var el = ctx.el, sel = ctx.sel, cam = ctx.cam, glow = ctx.glow;
  var hoverState = '';

  function hoverText(t) {
    if (isGreen(t)) return NAMES[t.kind] + ' · click for details';
    return oldName(t) + ' → ' + NAMES[t.kind] + ' by ' + yearAt(t.ts + TD);
  }
  function setHover(t) {
    if (t && !t.kind) t = null;
    var text = t ? hoverText(t) : '';
    if (t === sel.hover && text === hoverState) return;
    sel.hover = t; hoverState = text;
    if (t) { placeGlow(glow.hover, t); el.tip.textContent = text; el.tip.hidden = false; el.canvas.classList.add('pick'); }
    else { glow.hover.visible = false; el.tip.hidden = true; el.canvas.classList.remove('pick'); }
  }

  /* fill the card: what the tile is now (once green), or what it was and when it changes */
  function selectTile(t) {
    sel.tile = t && t.kind ? t : null;
    el.stage.classList.toggle('has-sel', !!sel.tile);
    if (!sel.tile) { el.pop.hidden = true; glow.sel.visible = false; return; }
    var tile = sel.tile;
    sel.green = isGreen(tile);
    var info = INFO[tile.kind], dl = el.popStats, done = yearAt(tile.ts + TD);
    var place = placeName(tile);
    el.popWhere.textContent = (place ? place + ' · ' : '') + 'Tile ' + tile.label;
    dl.textContent = '';
    if (sel.green) {
      el.popTag.textContent = info.tag;
      el.popTitle.textContent = NAMES[tile.kind];
      el.popBlurb.textContent = info.blurb;
      info.stats.forEach(function (s) {
        var d = document.createElement('div'), a = document.createElement('dt'), b = document.createElement('dd');
        a.textContent = s[0]; b.textContent = s[1]; d.appendChild(a); d.appendChild(b); dl.appendChild(d);
      });
      el.popSkip.hidden = true;
    } else {
      el.popTag.textContent = 'Before';
      el.popTitle.textContent = oldName(tile);
      el.popBlurb.textContent = 'This tile becomes a ' + NAMES[tile.kind].toLowerCase() + ' during phase ' + (tile.ph + 1) + ' (' + PHASE_NAMES[tile.ph] + '), finishing around ' + done + '.';
      el.popSkip.textContent = 'Skip ahead to ' + done;
      el.popSkip.hidden = false;
    }
    el.pop.classList.toggle('is-before', !sel.green);
    el.pop.hidden = false; el.pop.scrollTop = 0;
    placeGlow(glow.sel, tile);
  }

  /* clicking a tile flies to it; closing its details flies back to where the visitor was */
  function focusTile(t) {
    if (!sel.saved) sel.saved = { target: cam.target.clone(), zoom: cam.focusing ? cam.zoomGoal : cam.zoom, orbit: ctx.input.orbit };
    selectTile(t);
    cam.goal.set(t.cx, 4, t.cz); cam.zoomGoal = 0.45; cam.focusing = true; ctx.input.orbit = false; ctx.wake();
  }
  function unfocus() {
    selectTile(null);
    if (!sel.saved) return;
    cam.goal.copy(sel.saved.target); cam.zoomGoal = sel.saved.zoom; ctx.input.orbit = sel.saved.orbit; cam.focusing = true;
    sel.saved = null; ctx.wake();
  }

  el.popSkip.addEventListener('click', function () {
    if (sel.tile) ctx.timeline.seek(sel.tile.ts + TD + 0.05, ctx.tl.playing);
  });
  el.popClose.addEventListener('click', unfocus);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && sel.tile) unfocus(); });
  /* a click anywhere off the scene also closes the details */
  document.addEventListener('pointerdown', function (e) {
    if (sel.tile && !el.stage.contains(e.target)) unfocus();
  });

  /* called every frame: keep the tooltip and card in step with a tile that's converting */
  function refresh() {
    if (sel.hover) setHover(sel.hover);
    if (sel.tile && isGreen(sel.tile) !== sel.green) selectTile(sel.tile);
  }

  return { setHover: setHover, selectTile: selectTile, focusTile: focusTile, unfocus: unfocus, refresh: refresh };
}
