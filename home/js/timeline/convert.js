/* Converting one tile to progress p (0..1): its old cubes shrink away top-down, its new cubes grow in
   bottom-up (each with a little jitter), the new ground fades in, and rail wires appear. */
import { hash, s01 } from '../lib/util.js';

export function createConverter(city) {
  var NEWP = city.NEWP, OLDP = city.OLDP;
  var jit = new Float32Array(Math.max.apply(null, NEWP.concat(OLDP).map(function (l) { return l.length; })) + 1);
  for (var ji = 0; ji < jit.length; ji++) jit[ji] = hash(ji, 7, 3) * 0.05;

  return function updateTile(t, p) {
    t.p = p;
    var OL = OLDP[t.ph], NL = NEWP[t.ph], oa = city.oldMeshes[t.ph].instanceMatrix.array, na = city.newMeshes[t.ph].instanceMatrix.array, i, s, o, f;
    for (i = t.os; i < t.os + t.on; i++) {
      f = OL[i][4];
      s = 1 - s01((p - 0.3 * (1 - f) - jit[i]) / 0.3);
      if (s < 0.0001) s = 0.0001;
      o = i * 16; oa[o] = s; oa[o + 5] = s; oa[o + 10] = s;
    }
    for (i = t.ns; i < t.ns + t.nn; i++) {
      f = NL[i][4];
      s = s01((p - 0.35 - 0.25 * f - jit[i]) / 0.3);
      if (s < 0.0001) s = 0.0001;
      o = i * 16; na[o] = s; na[o + 5] = s; na[o + 10] = s;
    }
    var ov = s01((p - 0.35) / 0.4);
    t.over.visible = ov > 0.001; t.over.material.opacity = ov;
    if (t.wire) t.wire.visible = p > 0.6;
  };
}
