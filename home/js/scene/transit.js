/* Things that drive: light-rail trains (shown once their track is built; each shuttles end to end and
   waits its turn at the interchange) and road traffic (shown until rail replaces the roads). */
import { THREE } from '../lib/three.js';
import { clamp, hash, pick } from '../lib/util.js';
import { TS, GRID } from '../world/constants.js';
import { RW } from '../world/river.js';
import { LINES, HUBT } from '../world/rail.js';
import { carCells } from '../world/voxels.js';
import { boxGeo, matLand, meshFrom, shareMesh } from './meshes.js';

var CAR_GAP = 9;

/* position and heading at arc length s along a line's path */
function pathAt(L, s) {
  s = clamp(s, 0, L.len);
  var lo = 0, hi = L.cum.length - 1;
  while (hi - lo > 1) { var m = (lo + hi) >> 1; if (L.cum[m] <= s) lo = m; else hi = m; }
  var a = L.path[lo], b = L.path[hi], seg = (L.cum[hi] - L.cum[lo]) || 1, t = (s - L.cum[lo]) / seg;
  return { x: a[0] + (b[0] - a[0]) * t, z: a[1] + (b[1] - a[1]) * t, ang: Math.atan2(b[0] - a[0], b[1] - a[1]) };
}
function waterAt(x, z) { return RW[clamp(Math.round(z + 100), 0, 199) * 200 + clamp(Math.round(x + 100), 0, 199)]; }

export function buildTransit(scene, tiles) {
  var HUB = [HUBT[0] * TS - 100 + 9.5, HUBT[1] * TS - 100 + 9.5];
  function tileAt(x, z) {
    var cc = clamp(Math.floor((x + 100) / TS), 0, GRID - 1), rr = clamp(Math.floor((z + 100) / TS), 0, GRID - 1);
    return tiles[rr * GRID + cc];
  }

  var trains = [];
  LINES.forEach(function (L, li) {
    var meshes = [carCells(true, L.color), carCells(false, L.color)].map(function (cells) { return meshFrom(cells, matLand, true); });
    var cars = [];
    for (var k = 0; k < 3; k++) {
      var g = new THREE.Group();
      g.add(shareMesh(meshes[k === 1 ? 1 : 0]));
      g.visible = false; scene.add(g); cars.push(g);
    }
    trains.push({ L: L, idx: li, cars: cars, a: 4 + (L.len - 2 * CAR_GAP - 8) * (li ? 0.72 : 0.12), dir: li ? -1 : 1, wait: 0 });
  });
  function inHub(tr, a) {
    for (var k = 0; k < 3; k++) { var p = pathAt(tr.L, a + k * CAR_GAP); if (Math.hypot(p.x - HUB[0], p.z - HUB[1]) < 15) return true; }
    return false;
  }
  function stepTrain(tr, dt) {
    if (tr.wait > 0) { tr.wait -= dt; return; }
    var lo = 4, hi = tr.L.len - 4 - 2 * CAR_GAP, na = tr.a + tr.dir * 8 * dt, flip = false;
    if (na >= hi) { na = hi; flip = true; } else if (na <= lo) { na = lo; flip = true; }
    var other = trains[1 - tr.idx];
    if (other && !inHub(tr, tr.a) && inHub(tr, na) && inHub(other, other.a)) return;
    tr.a = na;
    if (flip) { tr.dir = -tr.dir; tr.wait = 2.5; }
  }

  var traffic = [], carMats = {};
  function carMat(col) {
    if (!carMats[col]) { carMats[col] = new THREE.MeshLambertMaterial({ color: 0xffffff }); carMats[col].color.set(col).convertSRGBToLinear(); }
    return carMats[col];
  }
  var glassMat = new THREE.MeshLambertMaterial({ color: 0xffffff }); glassMat.color.set('#9ec6e0').convertSRGBToLinear();
  for (var ti = 0; ti < 18; ti++) {
    var tg = new THREE.Group(), TL = LINES[ti % 2];
    var body = new THREE.Mesh(boxGeo, carMat(pick(['#c0392b', '#2f6fa8', '#e0b23a', '#e8e8e8', '#3a3a3a', '#2e8b57'], hash(ti, 4, 4))));
    body.scale.set(3, 1.5, 5.6); body.position.y = 1.5; body.castShadow = true;
    var cab = new THREE.Mesh(boxGeo, glassMat); cab.scale.set(2.4, 1.1, 2.8); cab.position.set(0, 2.8, -0.3); cab.castShadow = true;
    tg.add(body); tg.add(cab); scene.add(tg);
    traffic.push({ g: tg, L: TL, s: (ti >> 1) * 2 * TL.len / 9 + hash(ti, 1, 9) * 6, v: 9 + hash(ti, 2, 9) * 4 });
  }

  /* advance (when animating) and place every train car and road car */
  function update(dt, animate) {
    var i, k;
    if (animate) {
      for (i = 0; i < trains.length; i++) stepTrain(trains[i], dt);
      for (i = 0; i < traffic.length; i++) traffic[i].s += traffic[i].v * dt;
    }
    for (i = 0; i < trains.length; i++) {
      var tr = trains[i];
      for (k = 0; k < tr.cars.length; k++) {
        var pa = pathAt(tr.L, tr.a + k * CAR_GAP), cg = tr.cars[k];
        cg.position.set(pa.x, 0, pa.z); cg.rotation.y = pa.ang + (k === 0 ? Math.PI : 0);
        cg.visible = tileAt(pa.x, pa.z).p >= 0.95;
      }
    }
    for (i = 0; i < traffic.length; i++) {
      var tc = traffic[i], LL = tc.L, span = 2 * LL.len, u = ((tc.s % span) + span) % span, back = u > LL.len;
      var pc = pathAt(LL, back ? span - u : u), ang = pc.ang + (back ? Math.PI : 0);
      var wx = pc.x - Math.cos(ang) * 2.2, wz = pc.z + Math.sin(ang) * 2.2;
      tc.g.position.set(wx, waterAt(wx, wz) ? 1 : 0, wz); tc.g.rotation.y = ang;
      tc.g.visible = tileAt(pc.x, pc.z).p < 0.12;
    }
  }

  return { update: update };
}
