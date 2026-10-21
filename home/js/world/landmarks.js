/* Atlanta skyline landmarks that take the place of one tower tile's usual buildings. They stand in
   both the "before" and "after" city (dulled before), so each keeps its shape through the timeline. */
import { hash, pick } from '../lib/util.js';
import { tree, bld } from './pieces.js';

/* window grid on a facade: lit or glazed cells on odd floors and odd columns, like bld() */
function glaze(tb, x, y, z, p, wall) {
  if (y < 3 || y % 2 === 0 || p % 2 === 0) return wall;
  return hash(x, y, z) > 0.93 ? '#ffe29a' : pick(['#7fa6c9', '#8fb4d6', '#6f98bd'], hash(x, y, z));
}
/* hollow square shaft from x0,z0 (size n) between y0 and y1 */
function shaft(tb, x0, z0, n, y0, y1, wall, corner) {
  var x1 = x0 + n - 1, z1 = z0 + n - 1;
  for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) for (var z = z0; z <= z1; z++) {
    var ex = x === x0 || x === x1, ez = z === z0 || z === z1;
    if (!ex && !ez) continue;
    if (ex && ez && corner === null) continue;
    tb.vox(x, y, z, ex && ez ? (corner || wall) : glaze(tb, x, y, z, ex ? z - z0 : x - x0, wall));
  }
}
/* stepped pyramid: each [half-width, from y, to y] layer centred on 9.5 (even sizes) or 9 (odd) */
function steps(tb, layers, centre, col) {
  layers.forEach(function (L) {
    for (var y = L[1]; y <= L[2]; y++) for (var x = Math.ceil(centre - L[0]); x <= Math.floor(centre + L[0]); x++) for (var z = Math.ceil(centre - L[0]); z <= Math.floor(centre + L[0]); z++) {
      tb.vox(x, y, z, typeof col === 'function' ? col(x, y, z) : col);
    }
  });
}
function cornerTrees(tb) { tree(tb, 2, 2, 2); tree(tb, 17, 2, 2); tree(tb, 2, 17, 2); tree(tb, 17, 17, 2); }

/* Bank of America Plaza: a granite shaft under a stepped gold pyramid and an open lattice spire */
function bankOfAmerica(tb) {
  shaft(tb, 6, 6, 8, 1, 31, '#d9c7ae', '#c4ae92');
  var gold = function (x, y, z) { return (x + y + z) % 2 ? '#e3b44c' : '#c8902c'; };
  steps(tb, [[3.5, 32, 32], [2.5, 33, 34], [1.5, 35, 36], [0.5, 37, 41]], 9.5, gold);
  tb.vox(9, 42, 9, '#f2d27a');
  cornerTrees(tb);
}
/* Westin Peachtree Plaza: a mirrored glass cylinder on a low podium, crowned by the revolving restaurant */
function westin(tb) {
  bld(tb, 3, 3, 14, 14, 1, 3, '#cdbfa8', { roof: 'green' });
  tb.cyl(9.5, 9.5, 4.3, 1, 29, function (x, y) { return y % 3 === 0 ? '#9fb2c0' : (y % 3 === 1 ? '#5f707d' : '#6d7f8c'); });
  tb.cyl(9.5, 9.5, 4.8, 30, 31, function (x, y) { return y === 30 ? '#ffd88a' : '#3f4c57'; });
  tb.cyl(9.5, 9.5, 3.4, 32, 32, '#c9d0d5');
  tb.vox(9, 33, 9, '#9aa4ac'); tb.vox(9, 34, 9, '#9aa4ac');
}
/* One Atlantic Center: rose granite with gothic corner pinnacles and a copper pyramid roof */
function oneAtlantic(tb) {
  shaft(tb, 6, 6, 7, 1, 28, '#d6a897', '#c48f7e');
  [[6, 6], [12, 6], [6, 12], [12, 12]].forEach(function (p) { tb.vox(p[0], 29, p[1], '#c48f7e'); tb.vox(p[0], 30, p[1], '#c9894f'); });
  var copper = function (x, y, z) { return (x + z) % 2 ? '#c9894f' : '#b07440'; };
  steps(tb, [[3, 29, 29], [2, 30, 31], [1, 32, 33], [0, 34, 36]], 9, copper);
  bld(tb, 14, 13, 5, 6, 1, 7, '#e1ddd3', { roof: 'green' });
  tree(tb, 2, 2, 2); tree(tb, 2, 17, 2); tree(tb, 17, 2, 2);
}
/* Truist Plaza: dark granite with clipped corners and a stepped crown lit white at night */
function truist(tb) {
  shaft(tb, 6, 6, 8, 1, 26, '#6a625b', null);
  steps(tb, [[3.5, 27, 27], [2.5, 28, 29], [1.5, 30, 31], [0.5, 32, 34]], 9.5, function (x, y) { return y % 2 ? '#e8ecee' : '#6a625b'; });
  bld(tb, 1, 13, 5, 6, 1, 6, '#c9d4dc', { roof: 'solar' });
  tree(tb, 17, 2, 2); tree(tb, 17, 17, 2); tree(tb, 2, 2, 2);
}

/* keyed 'col,row'; each must be a T tile in MAP */
const LANDMARKS = {
  '6,3': { name: 'Bank of America Plaza', build: bankOfAmerica },
  '4,3': { name: 'One Atlantic Center', build: oneAtlantic },
  '4,6': { name: 'Westin Peachtree Plaza', build: westin },
  '6,6': { name: 'Truist Plaza', build: truist }
};

export { LANDMARKS };
