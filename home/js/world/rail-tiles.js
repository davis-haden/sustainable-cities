/* Rail tiles (after) and the roads they replace (before), built from the track centreline. */
import { hash } from '../lib/util.js';
import { GREEN_BASE } from './constants.js';
import { RW, rIdx } from './river.js';
import { STATIONS, EV, trackField, pointAt, pieceLen } from './rail.js';
import { bush, plaza } from './pieces.js';
import { plantTrees, riverPaint, riverDetail } from './nature.js';

const STEEL = '#b8c0c8', BALLAST = '#a8a49a', SLEEPER = '#7a6650';
function catenaryAlong(tb, pts) {
  var L = pieceLen(pts);
  [0.27, 0.77].forEach(function (u) {
    var p = pointAt(pts, L * u), nx = -p.tz, nz = p.tx;
    var px = Math.round(p.x - nx * 4.6), pz = Math.round(p.z - nz * 4.6);
    if (px < 0 || px > 19 || pz < 0 || pz > 19 || RW[rIdx(tb, px, pz)]) return;
    for (var y = 1; y <= 7; y++) tb.vox(px, y, pz, '#8d949a');
    for (var k = 0; k <= 4.6; k += 0.5) tb.vox(Math.round(p.x - nx * (4.6 - k)), 7, Math.round(p.z - nz * (4.6 - k)), '#8d949a');
  });
}
function lampsAlong(tb, pts) {
  var p = pointAt(pts, pieceLen(pts) * 0.5), nx = -p.tz, nz = p.tx;
  var px = Math.round(p.x - nx * 5.6), pz = Math.round(p.z - nz * 5.6);
  if (px < 0 || px > 19 || pz < 0 || pz > 19 || RW[rIdx(tb, px, pz)]) return;
  for (var y = 1; y <= 6; y++) tb.vox(px, y, pz, '#6b6f73');
  tb.vox(Math.round(p.x - nx * 4.6), 6, Math.round(p.z - nz * 4.6), '#e8e2b0');
}
function canopyCol(x, z) { return ((x + z) % 2) ? '#1d3f7a' : '#26508f'; }
function sideStation(tb, F) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var f = F[z * 20 + x];
    if (f.side <= 0 || f.d < 3.6 || f.d > 6.6 || f.s < 3 || f.s > 17) continue;
    tb.vox(x, 1, z, f.d < 4.6 ? '#f2c230' : '#d9dbdd');
    if (f.s > 4 && f.s < 16) tb.vox(x, 6, z, canopyCol(x, z));
    if (f.d > 5.6 && (Math.abs(f.s - 4.6) < 0.6 || Math.abs(f.s - 15.4) < 0.6)) for (var y = 2; y <= 5; y++) tb.vox(x, y, z, '#8d949a');
    if (f.d > 5.3 && f.d < 6.2 && Math.abs(f.s - 10) < 2) tb.vox(x, 2, z, '#8a6a44');
  }
}
function terminusStation(tb, F, R) {
  var ex = EV[R.term][0], ez = EV[R.term][1], x, z, f, y;
  for (z = 0; z < 20; z++) for (x = 0; x < 20; x++) {
    f = F[z * 20 + x];
    if (f.d <= 3.05 && f.s < 1.3) { tb.vox(x, 1, z, '#c0392b'); tb.vox(x, 2, z, '#f2c230'); continue; }
    if (f.d >= 3.6 && f.d <= 6.6 && f.s >= 1 && f.s <= 12) {
      tb.vox(x, 1, z, f.d < 4.6 ? '#f2c230' : '#d9dbdd');
      if (f.s >= 2) tb.vox(x, 6, z, canopyCol(x, z));
      if (f.d > 5.6 && (Math.abs(f.s - 2.6) < 0.6 || Math.abs(f.s - 11.4) < 0.6)) for (y = 2; y <= 5; y++) tb.vox(x, y, z, '#8d949a');
    }
  }
  var cx = 9.5 - ex * 2, cz = 9.5 - ez * 2;
  for (var t = 2; t <= 6; t++) for (var u = -6; u <= 6; u++) {
    var hx = Math.round(cx - ex * t + (ex === 0 ? u : 0)), hz = Math.round(cz - ez * t + (ez === 0 ? u : 0));
    for (y = 1; y <= 5; y++) {
      var edge = (t === 2 || t === 6 || u === -6 || u === 6);
      if (!edge && y < 5) continue;
      tb.vox(hx, y, hz, y === 5 ? (((t + u) & 1) ? '#69b848' : '#5fae3e') : ((y === 3 && ((u + 6) & 1)) ? '#8fb4d6' : '#e1ddd3'));
    }
  }
}
function hubStation(tb, F) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var f = F[z * 20 + x];
    if (x >= 3 && x <= 16 && z >= 3 && z <= 16 && f.d >= 3.6) tb.vox(x, 1, z, f.d < 4.6 ? '#f2c230' : '#d9dbdd');
    if (x >= 2 && x <= 17 && z >= 2 && z <= 17) {
      var rim = x === 2 || x === 17 || z === 2 || z === 17;
      tb.vox(x, 10, z, rim ? '#9aa2a8' : ((((x >> 1) + (z >> 1)) & 1) ? '#1d3f7a' : '#bfe0ef'));
    }
  }
  [[3, 3], [16, 3], [3, 16], [16, 16]].forEach(function (p) { for (var y = 2; y <= 9; y++) tb.vox(p[0], y, p[1], '#8d949a'); });
}
function gasStation(tb, F) {
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var f = F[z * 20 + x], y;
    if (f.side <= 0 || f.d <= 5.1 || f.d > 10 || f.s < 2 || f.s > 18) continue;
    tb.paint(x, z, '#a3a39e');
    if (f.d >= 5.6 && f.d <= 9 && f.s >= 3 && f.s <= 11) tb.vox(x, 5, z, ((x + z) & 1) ? '#c0392b' : '#f4f6f8');
    if ((Math.abs(f.d - 6) < 0.5 || Math.abs(f.d - 8.6) < 0.5) && (Math.abs(f.s - 3.5) < 0.5 || Math.abs(f.s - 10.5) < 0.5)) for (y = 1; y <= 4; y++) tb.vox(x, y, z, '#8d949a');
    if (Math.abs(f.d - 7.3) < 0.5 && (Math.abs(f.s - 5.5) < 0.5 || Math.abs(f.s - 8.5) < 0.5)) { tb.vox(x, 1, z, '#c0392b'); tb.vox(x, 2, z, '#c0392b'); tb.vox(x, 3, z, '#222222'); }
    if (f.d >= 6 && f.d <= 9.5 && f.s >= 13 && f.s <= 17) for (y = 1; y <= 4; y++) tb.vox(x, y, z, y === 4 ? '#6b6f73' : (y === 2 && ((x + z) & 1) ? '#3b4a5a' : '#9aa0a5'));
  }
}
function crossing(tb) {
  for (var k = 6; k <= 13; k++) {
    if (k % 2) continue;
    [4, 5, 14, 15].forEach(function (a) { tb.paint(a, k, '#e8e8e2'); tb.paint(k, a, '#e8e8e2'); });
  }
  [[4, 4], [15, 4], [4, 15], [15, 15]].forEach(function (p) {
    for (var y = 1; y <= 5; y++) tb.vox(p[0], y, p[1], '#6b6f73');
    tb.vox(p[0], 6, p[1], '#c0392b'); tb.vox(p[0], 7, p[1], '#2b2b2b');
  });
}
function turnaround(tb, R) {
  var cx = 9.5 - EV[R.term][0] * 2, cz = 9.5 - EV[R.term][1] * 2;
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var d = Math.hypot(x - cx, z - cz);
    if (d <= 2.2) tb.paint(x, z, '#7a7a50');
    else if (d <= 7.2) tb.paint(x, z, '#4b4e52');
    else if (d <= 8.2) tb.paint(x, z, '#b8b8b2');
  }
  var tx = Math.round(cx), tz = Math.round(cz);
  for (var y = 1; y <= 4; y++) tb.vox(tx, y, tz, '#5a5048');
  tb.vox(tx + 1, 3, tz, '#5a5048');
}
function bushesOn(tb) {
  for (var i = 0; i < 10; i++) {
    var x = 1 + Math.floor(hash(tb.c, i, 91) * 18), z = 1 + Math.floor(hash(tb.r, i, 92) * 18);
    if (tb.g[z * 20 + x] !== GREEN_BASE || tb.hard.has(x + ',' + z) || tb.hard.has((x + 1) + ',' + z)) continue;
    bush(tb, x, z);
  }
}
function railTile(tb, R, old) {
  var F = trackField(R.pieces), x, z, f, w;
  if (old) tb.rect(0, 0, 19, 19, R.urban ? '#9a9a94' : '#8f8f8a');
  else if (R.urban) plaza(tb); else tb.rect(0, 0, 19, 19, GREEN_BASE);
  riverPaint(tb, old, R.urban);
  riverDetail(tb, old, function (x, z) { return F[z * 20 + x].d <= (old ? 5.2 : 4.3); });
  for (z = 0; z < 20; z++) for (x = 0; x < 20; x++) {
    f = F[z * 20 + x]; w = RW[rIdx(tb, x, z)];
    if (!old) {
      var onRail = Math.abs(f.d - 1.5) < 0.55;
      if (f.d <= 3.05) {
        if (w) tb.vox(x, 1, z, onRail ? STEEL : '#9ea4a8');
        else { tb.paint(x, z, (Math.floor(f.s) % 2 === 0) ? SLEEPER : BALLAST); if (onRail) tb.vox(x, 1, z, STEEL); }
      } else if (w && f.d <= 4.2) { tb.vox(x, 1, z, '#9ea4a8'); tb.vox(x, 2, z, '#c8cdd1'); }
    } else {
      if (f.d <= 4.05) {
        var col = (f.d < 0.55 && Math.floor(f.s) % 4 < 2 && R.lines.length < 2) ? '#e2d36a' : '#4b4e52';
        if (w) tb.vox(x, 1, z, col); else tb.paint(x, z, col);
      } else if (f.d <= 5.1) {
        if (w) { tb.vox(x, 1, z, '#9aa0a5'); tb.vox(x, 2, z, '#9aa0a5'); } else tb.paint(x, z, '#b8b8b2');
      }
    }
  }
  var hub = R.lines.length > 1, station = !!STATIONS[R.key];
  if (!old) {
    if (hub) hubStation(tb, F);
    else if (R.term) terminusStation(tb, F, R);
    else {
      R.pieces.forEach(function (pts) { catenaryAlong(tb, pts); });
      if (station) sideStation(tb, F);
    }
    if (!R.urban) { bushesOn(tb); plantTrees(tb, 0.3, 0.5); }
  } else {
    R.pieces.forEach(function (pts) { lampsAlong(tb, pts); });
    if (hub) crossing(tb);
    else if (R.term) turnaround(tb, R);
    else if (station) gasStation(tb, F);
  }
}

export { railTile };
