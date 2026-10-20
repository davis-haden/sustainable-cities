/* TB: a 20 x 20 tile being built. Tile builders paint the ground texture (g) and place voxels (cells);
   rot spins the layout so repeated tile types don't all face the same way. */
import { THREE } from '../lib/three.js';
import { hash, dull, shade } from '../lib/util.js';
import { MAXY, GREEN_BASE } from './constants.js';

function TB(c, r, rot) { this.c = c; this.r = r; this.rot = rot || 0; this.g = new Array(400); this.cells = new Map(); this.top = 0; this.dull = false; this.emit = []; this.hard = new Set(); this.loose = false; this.inTree = false; this.allowLoose = false; }
TB.prototype.world = function (x, z) { var p = this.R(x, z); return [this.c * 20 + p[0], this.r * 20 + p[1]]; };
TB.prototype.R = function (x, z) {
  for (var i = 0; i < this.rot; i++) { var t = x; x = 19 - z; z = t; }
  return [x, z];
};
TB.prototype.paint = function (x, z, c) {
  if (x < 0 || x > 19 || z < 0 || z > 19) return;
  var p = this.R(x, z); this.g[p[1] * 20 + p[0]] = this.dull ? dull(c) : c;
};
TB.prototype.rect = function (x0, z0, x1, z1, c) {
  for (var x = x0; x <= x1; x++) for (var z = z0; z <= z1; z++) this.paint(x, z, c);
};
TB.prototype.vox = function (x, y, z, c, keep) {
  var lo = this.loose ? -2 : 0, hi = this.loose ? 21 : 19;
  if (x < lo || x > hi || z < lo || z > hi || y < 1 || y > MAXY) return;
  var p = this.R(x, z), k = p[0] + ',' + y + ',' + p[1];
  if (keep && this.cells.has(k)) return;
  this.cells.set(k, [p[0], y, p[1], this.dull ? dull(c) : c]);
  if (!this.inTree) this.hard.add(p[0] + ',' + p[1]);
  if (y > this.top) this.top = y;
};
TB.prototype.box = function (x0, y0, z0, x1, y1, z1, c) {
  for (var x = x0; x <= x1; x++) for (var y = y0; y <= y1; y++) for (var z = z0; z <= z1; z++)
    this.vox(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
};
TB.prototype.cyl = function (cx, cz, rad, y0, y1, c) {
  for (var y = y0; y <= y1; y++) for (var x = Math.floor(cx - rad); x <= Math.ceil(cx + rad); x++) for (var z = Math.floor(cz - rad); z <= Math.ceil(cz + rad); z++) {
    if (Math.hypot(x - cx, z - cz) <= rad) this.vox(x, y, z, typeof c === 'function' ? c(x, y, z) : c);
  }
};
TB.prototype.shell = function () {
  var m = this.cells, out = [];
  m.forEach(function (v) {
    var x = v[0], y = v[1], z = v[2];
    if (m.has((x + 1) + ',' + y + ',' + z) && m.has((x - 1) + ',' + y + ',' + z) &&
        m.has(x + ',' + (y + 1) + ',' + z) && (y === 1 || m.has(x + ',' + (y - 1) + ',' + z)) &&
        m.has(x + ',' + y + ',' + (z + 1)) && m.has(x + ',' + y + ',' + (z - 1))) return;
    out.push(v);
  });
  return out;
};
TB.prototype.texture = function () {
  var cv = document.createElement('canvas'); cv.width = cv.height = 20;
  var cx = cv.getContext('2d'), base = this.dull ? dull(GREEN_BASE) : GREEN_BASE;
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var c = this.g[z * 20 + x] || base;
    var f = 0.94 + hash(x + this.c * 20, 3, z + this.r * 20) * 0.12;
    cx.fillStyle = shade(c, f);
    cx.fillRect(x, z, 1, 1);
  }
  var t = new THREE.CanvasTexture(cv);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false; t.encoding = THREE.sRGBEncoding;
  return t;
};

export { TB };
