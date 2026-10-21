/* "Before" tiles: coal, factories, tank farms, scrapyards and vacant lots. Stacks register smoke emitters. */
import { hash, pick, shadeHex } from '../lib/util.js';

function stack(tb, cx, cz, h, rad) {
  tb.cyl(cx, cz, rad, 1, h, function (x, y) { return y >= h - 1 ? '#2c2c2c' : ((Math.floor(y / 3) % 2) ? '#e8e8e8' : '#c5483a'); });
  tb.emit.push([cx, h + 1, cz, 2.4]);
}
function buildCoal(tb, n) {
  tb.rect(0, 0, 19, 19, '#6a655a'); tb.rect(0, 16, 19, 18, '#4b4e52');
  for (var i = 0; i < 40; i++) tb.paint(Math.floor(hash(tb.c, i, 7) * 20), Math.floor(hash(tb.r, i, 8) * 20), '#3d3a35');
  tb.box(2, 1, 9, 11, 10, 15, function (x, y) { return y === 10 ? '#4a4a4c' : ((y % 3 === 0 && x % 2 === 0) ? '#3a3f44' : '#8a7f74'); });
  var xs = n === 3 ? [4, 9, 14] : [5, 13], hs = [18, 16, 18];
  xs.forEach(function (sx, k) { stack(tb, sx, 4, hs[k], 1.7); });
  for (var x = 13; x <= 18; x++) for (var z = 9; z <= 15; z++) {
    var h = Math.round(4 - 0.75 * Math.hypot(x - 15.5, z - 12));
    for (var y = 1; y <= h; y++) tb.vox(x, y, z, pick(['#2b2b2b', '#3a3a3a', '#222222'], hash(x, y, z)));
  }
  tb.box(11, 5, 12, 13, 5, 12, '#555a5e');
}
function buildFactory(tb) {
  tb.rect(0, 0, 19, 19, '#6f6a60'); tb.rect(0, 15, 19, 17, '#4b4e52');
  tb.box(2, 1, 6, 17, 5, 13, function (x, y) { return (y === 3 && x % 2 === 0) ? '#2f3a42' : '#a35f45'; });
  for (var x = 2; x <= 17; x++) for (var z = 6; z <= 13; z++) {
    var hg = 6 + ((x - 2) % 4);
    for (var y = 6; y <= hg; y++) tb.vox(x, y, z, y === hg ? '#5a5d61' : '#8d8f92');
  }
  tb.cyl(16.5, 3, 1.3, 1, 15, function (cx, cy) { return cy >= 14 ? '#2c2c2c' : '#8a3f32'; });
  tb.emit.push([16, 16, 3, 2.2]);
  tb.cyl(3.5, 3, 1.1, 1, 11, function (cx, cy) { return cy >= 10 ? '#2c2c2c' : '#8a3f32'; });
  tb.emit.push([3, 12, 3, 1.9]);
  tb.box(3, 1, 15, 8, 2, 16, function (cx, cy) { return cy === 2 ? '#c9c4b8' : '#3b4a5a'; });
}
function buildTanks(tb) {
  tb.rect(0, 0, 19, 19, '#5e5a50');
  for (var i = 0; i < 50; i++) tb.paint(Math.floor(hash(tb.c, i, 17) * 20), Math.floor(hash(tb.r, i, 18) * 20), '#34312d');
  [[5, 5, 6], [14, 5, 7], [5, 14, 6], [14, 14, 5]].forEach(function (t) {
    tb.cyl(t[0], t[1], 3.2, 1, t[2], function (x, y) { return y === t[2] ? '#8f8a80' : (y === t[2] - 1 ? '#8a3f32' : '#d6d1c4'); });
  });
  tb.rect(8, 5, 11, 5, '#8a4b2a'); tb.rect(8, 14, 11, 14, '#8a4b2a');
  for (var k = 8; k <= 11; k++) { tb.vox(k, 1, 5, '#8a4b2a'); tb.vox(k, 1, 14, '#8a4b2a'); tb.vox(5, 1, k, '#8a4b2a'); tb.vox(14, 1, k, '#8a4b2a'); }
  for (var y = 1; y <= 14; y++) tb.vox(10, y, 10, '#666b70');
  tb.vox(10, 15, 10, '#ff8a1f'); tb.vox(10, 16, 10, '#ffd23f'); tb.vox(10, 17, 10, '#ff8a1f');
  tb.emit.push([10, 18, 10, 2.2]);
}
function buildScrap(tb) {
  tb.rect(0, 0, 19, 19, '#7a7058');
  [[2, 3, '#8a3f32', 2], [9, 3, '#3d5a73', 1], [2, 7, '#5a6b3a', 1], [10, 7, '#8a3f32', 2], [2, 12, '#7a6a3a', 2], [11, 12, '#3d5a73', 1]].forEach(function (b) {
    tb.box(b[0], 1, b[1], b[0] + 5, 2 * b[3], b[1] + 1, function (x, y) { return (x + y) % 3 === 0 ? shadeHex(b[2]) : b[2]; });
  });
  for (var i = 0; i < 26; i++) {
    var px = Math.floor(hash(tb.c, i, 5) * 18) + 1, pz = Math.floor(hash(tb.r, i, 6) * 18) + 1;
    if (pz > 8 && pz < 12 || px > 7 && px < 13 && pz < 10) tb.vox(px, 1, pz, pick(['#6b6f73', '#8a4b2a', '#5e5646', '#9a9a95'], hash(px, i, pz)));
  }
  for (var y = 1; y <= 10; y++) tb.vox(15, y, 16, '#c9a227');
  for (var x = 10; x <= 15; x++) tb.vox(x, 10, 16, '#c9a227');
  tb.vox(16, 1, 4, '#6b6f73'); tb.vox(16, 2, 4, '#6b6f73'); tb.vox(16, 3, 4, '#ff8a1f');
  tb.emit.push([16, 4, 4, 1.6]);
}

function buildLot(tb) {
  var v = Math.floor(hash(tb.c * 3, tb.r * 5, 3) * 3), x, z;
  if (v === 0) {
    tb.rect(0, 0, 19, 19, '#55585c');
    for (x = 2; x <= 17; x += 3) { for (z = 2; z <= 7; z++) tb.paint(x, z, '#d8d8d2'); for (z = 12; z <= 17; z++) tb.paint(x, z, '#d8d8d2'); }
    for (x = 2; x <= 14; x += 3) {
      [3, 13].forEach(function (z0, row) {
        if (hash(x + tb.c * 20, row, tb.r) > 0.42) {
          var col = pick(['#c0392b', '#2f6fa8', '#e0b23a', '#e8e8e8', '#3a3a3a', '#2e8b57'], hash(x, row, tb.c + tb.r));
          tb.box(x + 1, 1, z0, x + 2, 1, z0 + 3, col); tb.box(x + 1, 2, z0 + 1, x + 2, 2, z0 + 2, '#9ec6e0');
        }
      });
    }
    for (var y = 1; y <= 6; y++) tb.vox(9, y, 9, '#6b6f73');
  } else if (v === 1) {
    tb.rect(0, 0, 19, 19, '#8a7a58');
    for (var i = 0; i < 60; i++) tb.paint(Math.floor(hash(tb.c, i, 31) * 20), Math.floor(hash(tb.r, i, 32) * 20), '#7a7048');
    for (i = 1; i <= 18; i++) {
      var post = i % 2 === 0;
      [1, 18].forEach(function (e) {
        tb.vox(i, 1, e, '#8b9096'); tb.vox(i, 2, e, '#a7adb2'); if (post) tb.vox(i, 3, e, '#8b9096');
        tb.vox(e, 1, i, '#8b9096'); tb.vox(e, 2, i, '#a7adb2'); if (post) tb.vox(e, 3, i, '#8b9096');
      });
    }
    for (var yy = 1; yy <= 6; yy++) { tb.vox(5, yy, 4, '#6b6f73'); tb.vox(14, yy, 4, '#6b6f73'); }
    tb.box(4, 6, 4, 15, 9, 4, function (bx, by) { return ((bx + by) % 3 === 0) ? '#4a3a2a' : '#d9c64a'; });
    [[4, 12], [15, 13], [9, 15]].forEach(function (p) { for (var t = 1; t <= 4; t++) tb.vox(p[0], t, p[1], '#5a5048'); tb.vox(p[0] + 1, 3, p[1], '#5a5048'); tb.vox(p[0] - 1, 4, p[1], '#5a5048'); });
    for (i = 0; i < 12; i++) tb.vox(Math.floor(hash(tb.c, i, 41) * 14) + 3, 1, Math.floor(hash(tb.r, i, 42) * 12) + 6, pick(['#c0392b', '#d8d8d2', '#3d6a9a'], hash(i, tb.c, 5)));
  } else {
    tb.rect(0, 0, 19, 19, '#6a6050');
    var top = 0;
    for (x = 1; x <= 18; x++) for (z = 1; z <= 18; z++) {
      var h = Math.round(6 - 0.8 * Math.hypot(x - 9.5, z - 9.5));
      for (var y3 = 1; y3 <= h; y3++) { tb.vox(x, y3, z, hash(x, y3, z) > 0.94 ? pick(['#c0392b', '#3d6a9a', '#d8d8d2'], hash(z, y3, x)) : pick(['#7a6a50', '#5e5646', '#8c8c88', '#4d4a43'], hash(x, y3, z))); if (y3 > top) top = y3; }
    }
    tb.emit.push([9, top + 1, 9, 1.8]);
  }
}

export { buildCoal, buildFactory, buildTanks, buildScrap, buildLot };
