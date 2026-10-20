/* Which tile is under the pointer: march the mouse ray through the voxel grid and take the first cube
   (or ground cell) it actually hits, counting each tile's old or new cubes depending on its progress.
   Turbine rotors are separate meshes, so they are tested as spheres around the hub. */
import { THREE } from '../lib/three.js';
import { TS, GRID } from '../world/constants.js';
import { HUB_Y, ROTOR_Z } from '../world/voxels.js';

function vkey(x, y, z) { return ((x + 128) * 64 + y) * 256 + (z + 128); }

export function createPicker(ctx) {
  var city = ctx.city, tiles = city.tiles, turbines = city.turbines, mouse = ctx.input.mouse;
  var raycaster = new THREE.Raycaster();
  var NOWN = new Map(), OOWN = new Map();
  tiles.forEach(function (t, ti) {
    var i, NL = city.NEWP[t.ph], OL = city.OLDP[t.ph];
    for (i = t.ns; i < t.ns + t.nn; i++) NOWN.set(vkey(NL[i][0], NL[i][1], NL[i][2]), ti);
    for (i = t.os; i < t.os + t.on; i++) OOWN.set(vkey(OL[i][0], OL[i][1], OL[i][2]), ti);
  });
  function solidAt(x, y, z) {
    var k = vkey(x, y, z), a = NOWN.get(k), b;
    if (a !== undefined && tiles[a].p > 0.5) return true;
    b = OOWN.get(k);
    return b !== undefined && tiles[b].p <= 0.5;
  }
  function tileOfCell(x, z) {
    if (x < -100 || x > 99 || z < -100 || z > 99) return null;
    return tiles[Math.floor((z + 100) / TS) * GRID + Math.floor((x + 100) / TS)];
  }
  var hubSphere = new THREE.Sphere(new THREE.Vector3(), 8.5), sphereHit = new THREE.Vector3(), turbPos = new THREE.Vector3();

  return function pickTile() {
    raycaster.setFromCamera({ x: mouse.x, y: mouse.y }, ctx.cam.camera);
    var ray = raycaster.ray, o = ray.origin, d = ray.direction;
    var lo = [-100.5, 0.5, -100.5], hi = [99.5, 32, 99.5], org = [o.x, o.y, o.z], dir = [d.x, d.y, d.z];
    var t0 = 0, t1 = 1e9, a;
    for (a = 0; a < 3; a++) {
      if (Math.abs(dir[a]) < 1e-9) { if (org[a] < lo[a] || org[a] > hi[a]) return null; continue; }
      var ta = (lo[a] - org[a]) / dir[a], tb = (hi[a] - org[a]) / dir[a];
      if (ta > tb) { var sw = ta; ta = tb; tb = sw; }
      t0 = Math.max(t0, ta); t1 = Math.min(t1, tb);
    }
    var best = null, bestT = Infinity;
    if (t0 <= t1) {
      var t = t0 + 1e-4, p = [org[0] + dir[0] * t, org[1] + dir[1] * t, org[2] + dir[2] * t];
      var cell = [Math.floor(p[0] + 0.5), Math.floor(p[1] + 0.5), Math.floor(p[2] + 0.5)], step = [], tMax = [], tDel = [];
      for (a = 0; a < 3; a++) {
        step[a] = dir[a] > 0 ? 1 : -1;
        tDel[a] = Math.abs(dir[a]) < 1e-9 ? Infinity : 1 / Math.abs(dir[a]);
        tMax[a] = Math.abs(dir[a]) < 1e-9 ? Infinity : t + ((cell[a] + 0.5 * step[a]) - p[a]) / dir[a];
      }
      for (var n = 0; n < 800 && t <= t1 + 1; n++) {
        if (cell[1] <= 0) { best = tileOfCell(cell[0], cell[2]); bestT = t; break; }
        if (solidAt(cell[0], cell[1], cell[2])) { best = tileOfCell(cell[0], cell[2]); bestT = t; break; }
        a = tMax[0] < tMax[1] ? (tMax[0] < tMax[2] ? 0 : 2) : (tMax[1] < tMax[2] ? 1 : 2);
        t = tMax[a]; cell[a] += step[a]; tMax[a] += tDel[a];
      }
    }
    for (var i = 0; i < turbines.length; i++) {
      var tu = turbines[i];
      if (!tu.yaw.visible || tu.tile.p < 0.5) continue;
      turbPos.set(0, HUB_Y, ROTOR_Z - 1).applyMatrix4(tu.yaw.matrixWorld);
      hubSphere.center.copy(turbPos);
      if (ray.intersectSphere(hubSphere, sphereHit)) {
        var ts = sphereHit.distanceTo(o);
        if (ts < bestT) { bestT = ts; best = tu.tile; }
      }
    }
    return best;
  };
}
