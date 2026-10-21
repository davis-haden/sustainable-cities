/* "After" tiles: clean power, gardens and the greener city blocks. */
import { hash, pick } from '../lib/util.js';
import { GREEN_BASE } from './constants.js';
import { tree, bush, bld, plaza } from './pieces.js';
import { LANDMARKS } from './landmarks.js';

function buildWind(tb) {
  tb.rect(0, 0, 19, 19, GREEN_BASE);
  for (var x = 5; x <= 14; x++) for (var z = 5; z <= 14; z++) if (Math.hypot(x - 9.5, z - 9.5) <= 3.8) tb.paint(x, z, '#b9bec2');
  tb.rect(9, 13, 10, 19, '#cdbb8f');
  for (var fx = 6; fx <= 13; fx++) for (var fz = 6; fz <= 13; fz++) if (Math.hypot(fx - 9.5, fz - 9.5) <= 2.9) tb.vox(fx, 1, fz, '#bfc4c8');
  for (var y = 2; y <= 17; y++) {
    var r = 2.2 - 0.8 * (y - 2) / 15;
    for (var tx = 7; tx <= 12; tx++) for (var tz = 7; tz <= 12; tz++) {
      if (Math.hypot(tx - 9.5, tz - 9.5) <= r) tb.vox(tx, y, tz, y <= 3 ? '#d3d9dd' : '#f3f6f8');
    }
  }
  [9, 10].forEach(function (dx) { tb.vox(dx, 2, 11, '#2b3640'); tb.vox(dx, 3, 11, '#2b3640'); });
  [[2, 3], [16, 3], [3, 16], [16, 16], [2, 10]].forEach(function (p) { bush(tb, p[0], p[1]); });
  for (var i = 0; i < 14; i++) {
    var px = Math.floor(hash(tb.c, i, 1) * 18) + 1, pz = Math.floor(hash(tb.r, i, 2) * 18) + 1;
    if (Math.hypot(px - 9.5, pz - 9.5) > 5 && pz < 13) tb.vox(px, 1, pz, pick(['#ff6b6b', '#ffd84d', '#ffffff', '#c48bff'], hash(i, tb.c, tb.r)));
  }
}

function buildSolar(tb) {
  tb.rect(0, 0, 19, 19, GREEN_BASE);
  var rows = [3, 8, 13];
  rows.forEach(function (rz) {
    tb.rect(1, rz + 3, 18, rz + 4, '#b9b19a');
    for (var x = 2; x <= 17; x++) for (var k = 0; k < 3; k++) {
      var c = (x % 4 === 1) ? '#aeb7c0' : (((x + k) % 2) ? '#1d3f7a' : '#26508f');
      tb.vox(x, 4 - k, rz + k, c);
    }
    [3, 9, 15].forEach(function (px) { tb.vox(px, 1, rz + 1, '#8d949a'); tb.vox(px, 2, rz + 1, '#8d949a'); tb.vox(px, 1, rz, '#8d949a'); tb.vox(px, 2, rz, '#8d949a'); tb.vox(px, 3, rz, '#8d949a'); });
  });
  tb.box(15, 1, 18, 18, 2, 19, function (x, y) { return y === 1 ? '#f2c230' : '#a7b0b7'; });
  tb.rect(14, 18, 19, 19, '#b9b19a');
}

function buildNuclear(tb) {
  tb.rect(0, 0, 19, 19, '#aeb3ac');
  for (var i = 0; i < 20; i++) { tb.paint(i, 0, GREEN_BASE); tb.paint(i, 19, GREEN_BASE); tb.paint(0, i, GREEN_BASE); tb.paint(19, i, GREEN_BASE); }
  tb.rect(1, 10, 18, 11, '#6b7075');
  tb.rect(17, 11, 18, 18, '#6b7075');
  var y, x, z, d;
  for (y = 1; y <= 20; y++) {
    var r = 3.5 + 1.2 * Math.pow((y - 15) / 14, 2);
    for (x = 0; x <= 11; x++) for (z = 0; z <= 11; z++) {
      d = Math.hypot(x - 5.5, z - 5.5);
      if (d <= r && d > r - 1.35) tb.vox(x, y, z, y >= 19 ? '#bdb7a8' : '#e8e4da');
      else if (y === 1 && d <= r - 1.35) tb.vox(x, 1, z, '#4a98c9');
    }
  }
  for (y = 1; y <= 8; y++) for (x = 10; x <= 19; x++) for (z = 1; z <= 10; z++) {
    if (Math.hypot(x - 14.5, z - 5.5) <= 4.1) tb.vox(x, y, z, y === 4 ? '#c3c9cd' : '#d5d9dc');
  }
  for (y = 9; y <= 12; y++) for (x = 10; x <= 19; x++) for (z = 1; z <= 10; z++) {
    d = Math.hypot(x - 14.5, z - 5.5);
    if (d * d + Math.pow(y - 8, 2) <= 4.2 * 4.2) tb.vox(x, y, z, '#d5d9dc');
  }
  tb.box(2, 1, 13, 17, 6, 17, function (hx, hy) { return hy === 6 ? '#8f9aa0' : (hy === 3 ? '#b7c1c6' : '#cfd3cf'); });
  [3, 7, 11, 15].forEach(function (cx) { tb.box(cx, 1, 18, cx + 1, 2, 19, function (px, py) { return py === 2 ? '#9aa3a9' : '#f2c230'; }); });
  tb.box(5, 1, 11, 6, 2, 12, '#8a9399');
  tb.box(14, 1, 11, 15, 2, 12, '#8a9399');
}

function buildGarden(tb) {
  tb.rect(0, 0, 19, 19, GREEN_BASE);
  tb.rect(9, 0, 10, 19, '#d8cba6'); tb.rect(0, 9, 19, 10, '#d8cba6');
  for (var px = 6; px <= 13; px++) for (var pz = 6; pz <= 13; pz++) if (Math.hypot(px - 9.5, pz - 9.5) <= 3) tb.paint(px, pz, '#cdbb8f');
  var v = (tb.c * 3 + tb.r * 5) % 3, x, z;
  tb.box(9, 1, 9, 10, 1, 10, '#9aa1a7'); tb.box(9, 2, 9, 10, 2, 10, '#5fb0e0');
  [[7, 9], [12, 9], [7, 10], [12, 10]].forEach(function (p) { tb.vox(p[0], 1, p[1], '#8a6a44'); });
  if (v === 0) {
    [[4, 4], [15, 4], [4, 15], [15, 15]].forEach(function (p) { tree(tb, p[0], p[1], 3); });
    [[4, 7], [15, 7], [7, 15], [12, 15]].forEach(function (p) { bush(tb, p[0], p[1]); });
  } else if (v === 1) {
    for (var bz = 1; bz <= 4; bz += 3) for (x = 1; x <= 7; x++) for (z = bz; z <= bz + 1; z++) {
      tb.vox(x, 1, z, '#6b4a2e');
      tb.vox(x, 2, z, x % 2 ? '#4fa03a' : '#d9583f');
    }
    tb.box(12, 1, 2, 18, 4, 6, function (gx, gy, gz) { return gy === 4 ? '#9fd9d2' : ((gx === 12 || gx === 18) && (gz === 2 || gz === 6) ? '#e8eef0' : '#c4efe8'); });
    tree(tb, 4, 15, 3); tree(tb, 15, 15, 3);
  } else {
    for (x = 2; x <= 8; x++) for (z = 12; z <= 17; z++) if (Math.hypot(x - 5.5, z - 14.5) <= 3.6) tb.paint(x, z, '#4aa8de');
    for (x = 0; x < 20; x++) for (z = 0; z < 20; z++) {
      if ((x === 9 || x === 10 || z === 9 || z === 10) || Math.hypot(x - 5.5, z - 14.5) <= 4) continue;
      if (hash(x + tb.c * 20, 5, z + tb.r * 20) > 0.86) tb.vox(x, 1, z, pick(['#ff6b6b', '#ffd84d', '#ffffff', '#c48bff', '#ff9ed1'], hash(x, z, tb.c)));
    }
    tree(tb, 15, 4, 3); tree(tb, 15, 15, 3); tree(tb, 3, 4, 3);
    tb.box(13, 1, 12, 14, 2, 12, '#ffd84d'); tb.box(16, 1, 12, 17, 2, 12, '#f4f6f8');
  }
}

function buildTower(tb) {
  plaza(tb);
  var lm = LANDMARKS[tb.c + ',' + tb.r];
  if (lm) { lm.build(tb); return; }
  var specs = [[2, 2, 7, 7], [11, 3, 6, 7], [5, 12, 8, 6]];
  specs.forEach(function (s, i) {
    var ht = 17 + Math.floor(hash(tb.c * 7 + i, tb.r * 3, i) * 10);
    var wall = pick(['#d7dce0', '#c9d4dc', '#e1ddd3', '#bcc8d0'], hash(tb.c + i, tb.r, 5));
    var h1 = Math.max(10, Math.round(ht * 0.6));
    bld(tb, s[0], s[1], s[2], s[3], 1, h1, wall, { roof: 'green' });
    bld(tb, s[0] + 1, s[1] + 1, s[2] - 2, s[3] - 2, h1 + 1, ht, wall, { roof: i % 2 ? 'solar' : 'green' });
  });
  tree(tb, 1, 17, 2); tree(tb, 17, 1, 2); tree(tb, 17, 17, 2); tree(tb, 14, 13, 2);
}
function buildMid(tb) {
  plaza(tb);
  [[1, 1], [11, 1], [1, 11], [11, 11]].forEach(function (s, i) {
    var ht = 7 + Math.floor(hash(tb.c * 5 + i, tb.r * 7, i) * 6);
    var wall = pick(['#c98a6b', '#e3d9c3', '#b9c4cc', '#d9b99b'], hash(tb.c * 3 + i, tb.r, 9));
    bld(tb, s[0], s[1], 8, 8, 1, ht, wall, { roof: hash(tb.c + i, tb.r + 2, 1) > 0.5 ? 'solar' : 'green' });
  });
  tree(tb, 9, 9, 2); tree(tb, 10, 10, 2);
}
function house(tb, x0, z0, col, kind, doorSouth) {
  var x, y, z;
  for (y = 1; y <= 4; y++) for (x = x0; x <= x0 + 4; x++) for (z = z0; z <= z0 + 5; z++) {
    if (x !== x0 && x !== x0 + 4 && z !== z0 && z !== z0 + 5) continue;
    tb.vox(x, y, z, col);
  }
  var fz = doorSouth ? z0 + 5 : z0;
  tb.vox(x0 + 2, 1, fz, '#4a3a2a'); tb.vox(x0 + 2, 2, fz, '#4a3a2a');
  tb.vox(x0 + 1, 3, fz, '#9ec6e0'); tb.vox(x0 + 3, 3, fz, '#9ec6e0');
  var rc = kind === 'solar' ? '#1d3f7a' : (kind === 'green' ? '#69b848' : '#b5533c');
  if (tb.dull) rc = '#5a5d61';
  for (z = z0; z <= z0 + 5; z++) {
    for (x = x0; x <= x0 + 4; x++) tb.vox(x, 5, z, x === x0 + 2 && kind === 'solar' && !tb.dull ? '#aeb7c0' : rc);
    for (x = x0 + 1; x <= x0 + 3; x++) tb.vox(x, 6, z, rc);
    tb.vox(x0 + 2, 7, z, kind === 'solar' && !tb.dull ? '#aeb7c0' : rc);
  }
}
function buildLow(tb) {
  tb.rect(0, 0, 19, 19, '#bfc2ba');
  tb.rect(0, 8, 19, 11, GREEN_BASE); tb.rect(0, 9, 19, 10, '#d8cba6');
  [2, 12].forEach(function (z0, row) {
    [1, 7, 13].forEach(function (x0, i) {
      var col = pick(['#e8d6b8', '#d7e0cf', '#cfd8e6', '#f0e0c8'], hash(tb.c + i, tb.r + row, 6));
      var kind = pick(['solar', 'tile', 'green', 'solar'], hash(tb.c * 2 + i, tb.r + row * 3, 8));
      house(tb, x0, z0, col, kind, row === 0);
    });
  });
  tree(tb, 4, 9, 3); tree(tb, 15, 10, 3); bush(tb, 9, 8); bush(tb, 10, 11);
}

export { buildWind, buildSolar, buildNuclear, buildGarden, buildTower, buildMid, buildLow };
