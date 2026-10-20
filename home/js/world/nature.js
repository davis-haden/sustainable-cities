/* Trees that ignore tile edges, forest floors, the river (before and after) and clear-cut land. */
import { hash, pick, clamp, mixHex } from '../lib/util.js';
import { GREEN_BASE, codeAt } from './constants.js';
import { RW, RD, RWID, rIdx, waterNext } from './river.js';
import { forestAt } from './forest.js';
import { RAIL } from './rail.js';
import { tree, pine, bush } from './pieces.js';

function canPlant(tb, x, z) {
  for (var dx = -2; dx <= 2; dx++) for (var dz = -2; dz <= 2; dz++) {
    if (dx * dx + dz * dz > 5) continue;
    var lx = x + dx, lz = z + dz, p = tb.R(lx, lz);
    if (tb.hard.has(p[0] + ',' + p[1])) return false;
    if (lx < 0 || lx > 19 || lz < 0 || lz > 19) {
      var wx = tb.c * 20 + p[0], wz = tb.r * 20 + p[1];
      if (wx < 0 || wx > 199 || wz < 0 || wz > 199) return false;
      var code = codeAt(Math.floor(wx / 20), Math.floor(wz / 20));
      if ('FRW'.indexOf(code) < 0 || RAIL[Math.floor(wx / 20) + ',' + Math.floor(wz / 20)] || RW[wz * 200 + wx]) return false;
    } else {
      var g = tb.g[p[1] * 20 + p[0]];
      if (g !== undefined && g !== GREEN_BASE) return false;
    }
  }
  var p0 = tb.R(x, z);
  return !tb.cells.has(p0[0] + ',1,' + p0[1]);
}
function plantTrees(tb, minF, dens) {
  tb.allowLoose = true;
  for (var gz = 1; gz < 20; gz += 3) for (var gx = 1; gx < 20; gx += 3) {
    var x = gx + Math.floor(hash(gx + tb.c * 20, 17, gz + tb.r * 20) * 3) - 1;
    var z = gz + Math.floor(hash(gx + tb.c * 20, 19, gz + tb.r * 20) * 3) - 1;
    if (x < 0 || x > 19 || z < 0 || z > 19) continue;
    var w = tb.world(x, z), f = forestAt(w[0], w[1]);
    if (f < minF || hash(w[0], 23, w[1]) > dens + f * 0.6) continue;
    if (!canPlant(tb, x, z)) continue;
    var hh = hash(w[0], 29, w[1]);
    if (hh < 0.38) pine(tb, x, z, 4 + Math.floor(hh * 80) % 3); else tree(tb, x, z, 3 + Math.floor(hh * 70) % 3);
  }
  tb.allowLoose = false;
}
/* darker forest floor and lighter meadow patches, both from world position so they run across tiles */
function floorTint(tb) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var p = tb.R(x, z), gi = p[1] * 20 + p[0], g = tb.g[gi];
    if (g !== undefined && g !== GREEN_BASE) continue;
    var wx = tb.c * 20 + p[0], wz = tb.r * 20 + p[1], f = forestAt(wx, wz);
    if (f > 0.12) tb.g[gi] = mixHex(GREEN_BASE, '#46813a', clamp((f - 0.12) * 1.5, 0, 0.7));
    else {
      var m = 0.5 + 0.5 * Math.sin(wx * 0.07 + 1.3) * Math.sin(wz * 0.06 + 0.4);
      if (m > 0.6) tb.g[gi] = mixHex(GREEN_BASE, '#9cc65f', (m - 0.6) * 0.9);
    }
  }
}
function buildForest(tb) {
  tb.rect(0, 0, 19, 19, GREEN_BASE);
  plantTrees(tb, -1, 0.62);
  for (var i = 0; i < 12; i++) {
    var x = Math.floor(hash(tb.c, i, 51) * 20), z = Math.floor(hash(tb.r, i, 52) * 20);
    if (!tb.cells.has(x + ',1,' + z) && !RW[rIdx(tb, x, z)]) tb.vox(x, 1, z, i % 3 ? '#4f9d3a' : '#8d949a');
  }
}
function riverPaint(tb, old, noPath) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var j = rIdx(tb, x, z), w = RW[j], d = RD[j], wid = RWID[j], h = hash(tb.c * 20 + x, 41, tb.r * 20 + z);
    if (w === 2) {
      var depth = clamp((wid - d) / wid, 0, 1);
      if (old) tb.paint(x, z, h > 0.95 ? '#8f8a6a' : (h < 0.03 ? '#6c5f78' : mixHex('#6f6b46', '#4c4930', depth)));
      else tb.paint(x, z, h > 0.965 ? '#c4e8f7' : mixHex('#72c3e6', '#2a70b3', depth));
    } else if (w === 1) {
      if (old) tb.paint(x, z, h > 0.5 ? '#a19d94' : '#9a968c');
      else tb.paint(x, z, d < wid + 1.1 ? (h > 0.5 ? '#dccb9c' : '#cfbf8e') : (h > 0.5 ? '#a3bb6c' : '#93b261'));
    } else if (!old && !noPath && Math.abs(d - wid - 5.2) < 0.7) tb.paint(x, z, '#d8cba6');
  }
}
function riverDetail(tb, old, skip) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var j = rIdx(tb, x, z), w = RW[j];
    if (w !== 1 || (skip && skip(x, z))) continue;
    var h = hash(tb.c * 20 + x, 43, tb.r * 20 + z);
    if (old) { if (waterNext(j)) tb.vox(x, 1, z, '#b4b1a8'); }
    else if (RD[j] < RWID[j] + 1.4 && h > 0.68) { tb.vox(x, 1, z, '#6f9e3a'); if (h > 0.88) tb.vox(x, 2, z, '#93b84c'); }
  }
}
function buildRiver(tb) {
  tb.rect(0, 0, 19, 19, GREEN_BASE);
  riverPaint(tb, false); riverDetail(tb, false);
  var x, z, j, boat = hash(tb.c, tb.r, 61) > 0.8;
  for (z = 0; z < 20; z++) for (x = 0; x < 20; x++) {
    j = rIdx(tb, x, z);
    if (!RW[j] && Math.abs(RD[j] - RWID[j] - 6.7) < 0.5 && hash(tb.c * 20 + x, 47, tb.r * 20 + z) > 0.985) tb.vox(x, 1, z, '#8a6a44');
    if (boat && RW[j] === 2 && RD[j] < 0.8 && x < 18) { tb.vox(x, 1, z, '#f08a24'); tb.vox(x + 1, 1, z, '#f08a24'); boat = false; }
  }
  plantTrees(tb, -1, 0.42);
}
function buildOldRiver(tb) {
  tb.rect(0, 0, 19, 19, '#7a7058');
  var i, x, z, j, pipes = 0;
  for (i = 0; i < 40; i++) tb.paint(Math.floor(hash(tb.c, i, 71) * 20), Math.floor(hash(tb.r, i, 72) * 20), '#6a6050');
  riverPaint(tb, true); riverDetail(tb, true);
  for (z = 0; z < 20; z++) for (x = 0; x < 20; x++) {
    j = rIdx(tb, x, z);
    if (pipes < 2 && RW[j] === 1 && waterNext(j) && hash(tb.c * 20 + x, 73, tb.r * 20 + z) > 0.95) { tb.vox(x, 2, z, '#5e6266'); tb.vox(x, 3, z, '#5e6266'); pipes++; }
  }
  for (i = 0; i < 16; i++) {
    x = Math.floor(hash(tb.c, i, 75) * 20); z = Math.floor(hash(tb.r, i, 76) * 20);
    if (!RW[rIdx(tb, x, z)]) tb.vox(x, 1, z, pick(['#2b2b2b', '#6b6f73', '#8a4b2a', '#c9c4b8'], hash(x, i, z)));
  }
  for (i = 0; i < 3; i++) {
    x = 2 + Math.floor(hash(tb.c, i, 77) * 16); z = 2 + Math.floor(hash(tb.r, i, 78) * 16);
    if (RW[rIdx(tb, x, z)] || RD[rIdx(tb, x, z)] < RWID[rIdx(tb, x, z)] + 3) continue;
    for (var y = 1; y <= 4; y++) tb.vox(x, y, z, '#5a5048');
    tb.vox(x + 1, 3, z, '#5a5048'); tb.vox(x - 1, 4, z, '#5a5048');
  }
}
function buildClearcut(tb) {
  tb.rect(0, 0, 19, 19, '#7d6b4a');
  var i, x, z;
  for (i = 0; i < 70; i++) tb.paint(Math.floor(hash(tb.c, i, 81) * 20), Math.floor(hash(tb.r, i, 82) * 20), i % 2 ? '#6a5a3e' : '#8a7a56');
  for (z = 0; z < 20; z++) { var tx = 8 + Math.round(Math.sin(z * 0.35 + tb.c) * 2); tb.paint(tx, z, '#5c4d34'); tb.paint(tx + 3, z, '#5c4d34'); }
  for (var gz = 1; gz < 20; gz += 3) for (var gx = 1; gx < 20; gx += 3) {
    var h = hash(gx + tb.c * 20, 83, gz + tb.r * 20);
    if (h < 0.4) continue;
    x = gx + Math.floor(h * 10) % 2; z = gz;
    tb.vox(x, 1, z, '#8a6a44');
    if (h > 0.85) tb.vox(x, 2, z, '#c8a878');
  }
  function logs(xa, xb, z0, layers) {
    for (var y = 1; y <= layers; y++) tb.box(xa + (y - 1), y, z0, xb - (y - 1), y, z0 + 1, function (bx) { return (bx === xa + (y - 1) || bx === xb - (y - 1)) ? '#c8a878' : '#7a5530'; });
  }
  logs(11, 17, 13, 3); logs(2, 7, 15, 2);
  [[4, 4], [15, 5]].forEach(function (p) { for (var y = 1; y <= 5; y++) tb.vox(p[0], y, p[1], '#5a5048'); tb.vox(p[0] + 1, 4, p[1], '#5a5048'); });
}

export { plantTrees, floorTint, buildForest, riverPaint, riverDetail, buildRiver, buildOldRiver, buildClearcut };
