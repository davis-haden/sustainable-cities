/* Light rail: two lines that cross at one interchange, after MARTA's: a red north-south line from
   Buckhead through Midtown and Downtown to the airport, and a blue east-west line that crosses the
   Chattahoochee. They meet at Five Points.
   Builds each line's world-space path and, per tile, the track pieces the tile builders follow. */
import { clamp } from '../lib/util.js';
import { TS, codeAt } from './constants.js';

const LINES = [
  { name: 'Red', color: '#d8452f', tiles: [[5, 0], [5, 1], [5, 2], [5, 3], [5, 4], [5, 5], [5, 6], [5, 7], [5, 8], [4, 8], [4, 9]] },
  { name: 'Blue', color: '#2f80c8', tiles: [[0, 5], [1, 5], [2, 5], [3, 5], [4, 5], [5, 5], [6, 5], [7, 5], [8, 5], [9, 5]] }
];
/* Midtown, Vine City, Decatur, West End */
const STATIONS = { '5,3': 1, '3,5': 1, '8,5': 1, '5,7': 1 };
const MID = { N: [9.5, -0.5], S: [9.5, 19.5], W: [-0.5, 9.5], E: [19.5, 9.5] };
const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
const EV = { N: [0, -1], S: [0, 1], E: [1, 0], W: [-1, 0] };
function edgeTo(a, b) { return b[0] > a[0] ? 'E' : (b[0] < a[0] ? 'W' : (b[1] > a[1] ? 'S' : 'N')); }
/* track centerline inside one tile, from a to b (edge names or local points), sampled every quarter cell */
function pieceFor(a, b) {
  var A = typeof a === 'string' ? MID[a] : a, B = typeof b === 'string' ? MID[b] : b, pts = [], n, i;
  if (typeof a === 'string' && typeof b === 'string' && OPP[a] !== b) {
    var cx = (a === 'E' || b === 'E') ? 19.5 : -0.5, cz = (a === 'S' || b === 'S') ? 19.5 : -0.5;
    var a0 = Math.atan2(A[1] - cz, A[0] - cx), a1 = Math.atan2(B[1] - cz, B[0] - cx), da = a1 - a0;
    while (da > Math.PI) da -= 2 * Math.PI;
    while (da < -Math.PI) da += 2 * Math.PI;
    n = Math.ceil(Math.abs(da) * 10 / 0.25);
    for (i = 0; i <= n; i++) { var an = a0 + da * i / n; pts.push([cx + 10 * Math.cos(an), cz + 10 * Math.sin(an)]); }
  } else {
    n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.25));
    for (i = 0; i <= n; i++) pts.push([A[0] + (B[0] - A[0]) * i / n, A[1] + (B[1] - A[1]) * i / n]);
  }
  return pts;
}
const RAIL = {};
LINES.forEach(function (L, li) {
  var n = L.tiles.length;
  L.path = [];
  L.tiles.forEach(function (t, i) {
    var key = t[0] + ',' + t[1], R = RAIL[key] || (RAIL[key] = { key: key, conns: {}, lines: [], pieces: [], term: null });
    var ein = i > 0 ? edgeTo(t, L.tiles[i - 1]) : null, eout = i < n - 1 ? edgeTo(t, L.tiles[i + 1]) : null;
    R.lines.push(li);
    if (ein) R.conns[ein] = 1;
    if (eout) R.conns[eout] = 1;
    if (!ein || !eout) {
      var open = ein || eout;
      R.term = open;
      R.pieces.push(pieceFor([9.5 - EV[open][0] * 2, 9.5 - EV[open][1] * 2], open));
    } else R.pieces.push(pieceFor(ein, eout));
    var a = ein || [9.5 + EV[eout][0] * 3, 9.5 + EV[eout][1] * 3], b = eout || [9.5 + EV[ein][0] * 3, 9.5 + EV[ein][1] * 3];
    var x0 = t[0] * TS - 100, z0 = t[1] * TS - 100;
    pieceFor(a, b).forEach(function (p, j) { if (j === 0 && L.path.length) return; L.path.push([x0 + p[0], z0 + p[1]]); });
  });
  L.cum = [0];
  for (var i = 1; i < L.path.length; i++) L.cum.push(L.cum[i - 1] + Math.hypot(L.path[i][0] - L.path[i - 1][0], L.path[i][1] - L.path[i - 1][1]));
  L.len = L.cum[L.cum.length - 1];
});
Object.keys(RAIL).forEach(function (k) {
  var R = RAIL[k], p = k.split(','), c = +p[0], r = +p[1], n = 0;
  for (var dc = -1; dc <= 1; dc++) for (var dr = -1; dr <= 1; dr++) { var cc = codeAt(c + dc, r + dr); if (cc === 'T' || cc === 'M') n++; }
  R.urban = n >= 3;
});
/* per-cell distance to the track, arc length along it, and which side of it the cell is on */
function trackField(pieces) {
  var F = new Array(400);
  var meta = pieces.map(function (pts) {
    var s = [0];
    for (var i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return s;
  });
  for (var z = 0; z < 20; z++) for (var x = 0; x < 20; x++) {
    var best = 1e9, bs = 0, side = 0, bp = 0;
    for (var pi = 0; pi < pieces.length; pi++) {
      var pts = pieces[pi];
      for (var i = 0; i < pts.length; i++) {
        var dx = x - pts[i][0], dz = z - pts[i][1], d = dx * dx + dz * dz;
        if (d < best) {
          best = d; bs = meta[pi][i]; bp = pi;
          var j = Math.min(i + 1, pts.length - 1), k0 = Math.max(i - 1, 0);
          side = (pts[j][0] - pts[k0][0]) * dz - (pts[j][1] - pts[k0][1]) * dx;
        }
      }
    }
    F[z * 20 + x] = { d: Math.sqrt(best), s: bs, side: side, p: bp };
  }
  return F;
}
function pointAt(pts, s) {
  var acc = 0;
  for (var i = 1; i < pts.length; i++) {
    var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + l >= s || i === pts.length - 1) {
      var t = l ? clamp((s - acc) / l, 0, 1) : 0, tx = (pts[i][0] - pts[i - 1][0]) / (l || 1), tz = (pts[i][1] - pts[i - 1][1]) / (l || 1);
      return { x: pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, z: pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t, tx: tx, tz: tz };
    }
    acc += l;
  }
  return { x: pts[0][0], z: pts[0][1], tx: 1, tz: 0 };
}
function pieceLen(pts) { var s = 0; for (var i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; }

/* the tile where the two lines cross */
const HUBT = Object.keys(RAIL).filter(function (k) { return RAIL[k].lines.length > 1; })[0].split(',').map(Number);

export { LINES, STATIONS, EV, RAIL, HUBT, trackField, pointAt, pieceLen };
