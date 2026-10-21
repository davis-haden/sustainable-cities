/* River: one smooth curve across the map, stored as a 200 x 200 field of cells.
   RW = water (2) / bank (1) / dry (0), RD = distance to the centreline, RWID = local half-width.
   The curve is the Chattahoochee, coming in at the top and running down the west edge. Water is only
   drawn on R and rail tiles, so every tile it crosses must be one of those in MAP. */

const RCP = [[4.8, -0.6], [4.3, 0.7], [3.3, 1.5], [2.4, 2.4], [1.7, 3.5], [1.3, 4.8], [1.1, 6.2], [0.6, 7.6], [-0.6, 8.8]];
const RW = new Uint8Array(40000), RD = new Float32Array(40000), RWID = new Float32Array(40000);
(function () {
  function cr(p0, p1, p2, p3, t) {
    var t2 = t * t, t3 = t2 * t;
    return [0, 1].map(function (k) {
      return 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3);
    });
  }
  var pts = [], i, k, x, z;
  for (i = 0; i < RCP.length - 1; i++) {
    var p0 = RCP[Math.max(0, i - 1)], p1 = RCP[i], p2 = RCP[i + 1], p3 = RCP[Math.min(RCP.length - 1, i + 2)];
    for (k = 0; k < 24; k++) { var q = cr(p0, p1, p2, p3, k / 24); pts.push([q[0] * 20, q[1] * 20]); }
  }
  var n = pts.length, px = new Float32Array(n), pz = new Float32Array(n);
  for (i = 0; i < n; i++) { px[i] = pts[i][0]; pz[i] = pts[i][1]; }
  for (z = 0; z < 200; z++) for (x = 0; x < 200; x++) {
    var best = 1e9, cx = x + 0.5, cz = z + 0.5;
    for (i = 0; i < n; i++) { var dx = cx - px[i], dz = cz - pz[i], d = dx * dx + dz * dz; if (d < best) best = d; }
    var d0 = Math.sqrt(best), w = 4.2 + 1.3 * Math.sin(x * 0.05 + z * 0.031), j = z * 200 + x;
    RD[j] = d0; RWID[j] = w; RW[j] = d0 < w ? 2 : (d0 < w + 2.2 ? 1 : 0);
  }
})();
function rIdx(tb, x, z) { return (tb.r * 20 + z) * 200 + tb.c * 20 + x; }
function waterNext(j) {
  var x = j % 200, z = (j / 200) | 0;
  return (x > 0 && RW[j - 1] === 2) || (x < 199 && RW[j + 1] === 2) || (z > 0 && RW[j - 200] === 2) || (z < 199 && RW[j + 200] === 2);
}

export { RW, RD, RWID, rIdx, waterNext };
