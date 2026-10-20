/* When each tile converts. Phase 1 (0-10) is clean power in a shuffled order, phase 2 (10-20) lays
   track outward from the interchange, and phase 3 (20-30) greens the rest, nearest the interchange first.
   Sets t.ts on every tile and returns how many tiles each class has (for the readout). */
import { hash } from '../lib/util.js';
import { TD } from '../world/constants.js';
import { LINES, HUBT } from '../world/rail.js';

function assign(list, p0) {
  var n = list.length;
  list.forEach(function (t, i) { t.ts = p0 + 0.3 + (n > 1 ? i / (n - 1) : 0) * (10 - TD - 0.6); });
}

export function scheduleTiles(tiles) {
  var power = tiles.filter(function (t) { return t.cls === 'power'; });
  power.sort(function (a, b) { return hash(a.c, a.r, 11) - hash(b.c, b.r, 11); });
  assign(power, 0);

  var rail = tiles.filter(function (t) { return t.cls === 'rail'; });
  rail.forEach(function (t) {
    var best = 99;
    LINES.forEach(function (L) {
      var hi = -1, ti = -1;
      L.tiles.forEach(function (q, i) { if (q[0] === HUBT[0] && q[1] === HUBT[1]) hi = i; if (q[0] === t.c && q[1] === t.r) ti = i; });
      if (hi >= 0 && ti >= 0) best = Math.min(best, Math.abs(ti - hi));
    });
    t.hubDist = best + hash(t.c, t.r, 13) * 0.4;
  });
  rail.sort(function (a, b) { return a.hubDist - b.hubDist; });
  assign(rail, 10);

  var greens = tiles.filter(function (t) { return t.cls === 'garden' || t.cls === 'city'; });
  greens.sort(function (a, b) {
    return (Math.hypot(a.c - HUBT[0], a.r - HUBT[1]) + hash(a.c, a.r, 12) * 1.2) - (Math.hypot(b.c - HUBT[0], b.r - HUBT[1]) + hash(b.c, b.r, 12) * 1.2);
  });
  assign(greens, 20);

  var counts = { power: power.length, rail: rail.length, garden: 0, city: 0 };
  tiles.forEach(function (t) { if (t.cls === 'garden' || t.cls === 'city') counts[t.cls]++; });
  return counts;
}
