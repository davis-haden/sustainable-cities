/* Shared building pieces: trees, bushes, buildings and plazas.
   These also build the dingy "before" city blocks when tb.dull is set. */
import { hash, pick } from '../lib/util.js';

const LEAF = ['#3f9a3a', '#4aa83f', '#368a34', '#5fb049'];
function tree(tb, x, z, h) {
  if (tb.dull) {
    for (var t = 1; t <= h + 1; t++) tb.vox(x, t, z, '#5a5048');
    tb.vox(x + 1, h, z, '#5a5048'); tb.vox(x - 1, h + 1, z, '#5a5048');
    return;
  }
  tb.inTree = true;
  for (var i = 1; i <= h; i++) tb.vox(x, i, z, '#6b4423');
  tb.loose = tb.allowLoose;
  for (var dx = -2; dx <= 2; dx++) for (var dy = -1; dy <= 1; dy++) for (var dz = -2; dz <= 2; dz++) {
    if (dx * dx + dy * dy * 1.3 + dz * dz <= 4.4) tb.vox(x + dx, h + 1 + dy, z + dz, pick(LEAF, hash(x + dx + tb.c * 20, dy + h, z + dz + tb.r * 20)), true);
  }
  tb.loose = false; tb.inTree = false;
}
function pine(tb, x, z, h) {
  h = h || 5;
  tb.inTree = true;
  tb.vox(x, 1, z, '#5e3d20');
  tb.loose = tb.allowLoose;
  var layers = h - 1;
  for (var k = 0; k < layers; k++) {
    var rad = 2.1 - 1.6 * k / Math.max(1, layers - 1);
    for (var dx = -2; dx <= 2; dx++) for (var dz = -2; dz <= 2; dz++) {
      if (dx * dx + dz * dz <= rad * rad) tb.vox(x + dx, 2 + k, z + dz, pick(['#2e7a45', '#276b3d', '#33834a'], hash(x + dx + tb.c * 20, k, z + dz + tb.r * 20)), true);
    }
  }
  tb.vox(x, h + 1, z, '#2e7a45', true);
  tb.loose = false; tb.inTree = false;
}
function bush(tb, x, z) {
  if (tb.dull) { tb.vox(x, 1, z, '#6b6048'); return; }
  tb.vox(x, 1, z, '#4f9d3a'); tb.vox(x + 1, 1, z, '#468f35'); tb.vox(x, 2, z, '#5fb049', true);
}
function bld(tb, x0, z0, w, d, y0, h, wall, o) {
  var x1 = x0 + w - 1, z1 = z0 + d - 1, x, y, z;
  for (y = y0; y <= h; y++) for (x = x0; x <= x1; x++) for (z = z0; z <= z1; z++) {
    var ex = (x === x0 || x === x1), ez = (z === z0 || z === z1);
    if (!ex && !ez && y < h) continue;
    var c = wall;
    if (y === h) {
      if (ex || ez) c = '#9aa2a8';
      else if (tb.dull) c = '#8a8d90';
      else if (o.roof === 'solar') c = ((x - x0) % 2 === 1) ? '#1d3f7a' : '#aeb7c0';
      else c = pick(['#69b848', '#5fae3e', '#74c04e'], hash(x, y, z));
    } else if (y >= 3 && ex !== ez) {
      var p = ex ? (z - z0) : (x - x0);
      if (y % 2 === 1 && p % 2 === 1) c = hash(x, y, z) > 0.93 ? '#ffe29a' : pick(['#7fa6c9', '#8fb4d6', '#6f98bd'], hash(x, y, z));
    }
    tb.vox(x, y, z, c);
  }
  if (y0 === 1) { var dx = x0 + (w >> 1); tb.vox(dx, 1, z1, '#3a4550'); tb.vox(dx, 2, z1, '#3a4550'); }
  if (o.roof !== 'solar' && !tb.dull) {
    for (x = x0 + 1; x < x1; x++) for (z = z0 + 1; z < z1; z++) if (hash(x + tb.c * 20, h, z + tb.r * 20) > 0.84) tb.vox(x, h + 1, z, '#4fa03a');
  }
}
function plaza(tb) {
  tb.rect(0, 0, 19, 19, '#bfc2ba');
  for (var x = 0; x < 20; x++) for (var z = 0; z < 20; z++) if (((x >> 1) + (z >> 1)) % 2) tb.paint(x, z, '#b4b8af');
}

export { tree, pine, bush, bld, plaza };
