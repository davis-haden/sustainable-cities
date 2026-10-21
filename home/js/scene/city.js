/* Builds the whole city into the scene: every tile's before/after voxels, ground textures, turbines,
   overhead wires, the floating base and the smoke/steam puffs. Returns what the rest of the app animates. */
import { THREE } from '../lib/three.js';
import { hash, mixHex } from '../lib/util.js';
import { TS, GRID, MAP, KIND } from '../world/constants.js';
import { RW } from '../world/river.js';
import { RAIL, STATIONS } from '../world/rail.js';
import { makeNew, makeOld } from '../world/tiles.js';
import { HUB_Y, ROTOR_Z, nacelleCells, rotorCells } from '../world/voxels.js';
import { boxGeo, matLand, meshFrom, shareMesh } from './meshes.js';

/* add a tile's visible cubes to one big list; returns [start, count] so the tile can scale its own range */
function addCells(list, set, tb, x0, z0) {
  var start = list.length, cells = tb.shell(), top = Math.max(2, tb.top);
  for (var i = 0; i < cells.length; i++) {
    var v = cells[i], wx = x0 + v[0], wz = z0 + v[2], key = wx + ',' + v[1] + ',' + wz;
    if (set.has(key)) continue;
    set.add(key);
    list.push([wx, v[1], wz, v[3], (v[1] - 1) / (top - 1)]);
  }
  return [start, list.length - start];
}

export function buildCity(scene) {
  var tiles = [], emitters = [], turbines = [];
  /* cubes are split by timeline phase, so a finished phase's old cubes (or an unstarted phase's new ones) are not drawn at all */
  var NEWP = [[], [], []], OLDP = [[], [], []];
  var nacBase = meshFrom(nacelleCells(), matLand, true);
  var rotBase = meshFrom(rotorCells(), matLand, true);
  var beaconMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  var sideMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
  sideMat.color.set('#8a8f94').convertSRGBToLinear();
  var plateGeo = new THREE.BoxGeometry(TS, 2, TS);
  var overGeo = new THREE.PlaneGeometry(TS, TS);
  var wireMat = new THREE.LineBasicMaterial({ color: 0x2c3238 });

  var NSET = new Set(), OSET = new Set();
  for (var r = 0; r < GRID; r++) {
    for (var c = 0; c < GRID; c++) {
      var code = MAP[r].charAt(c), RL = RAIL[c + ',' + r], nb = makeNew(code, c, r), ob = makeOld(code, c, r);
      var x0 = c * TS - 100, z0 = r * TS - 100, cx = x0 + 9.5, cz = z0 + 9.5;
      var kind = KIND[code] || null;
      if (RL) {
        var wcount = 0;
        for (var q = 0; q < 400; q++) if (RW[(r * 20 + ((q / 20) | 0)) * 200 + c * 20 + q % 20] === 2) wcount++;
        kind = RL.lines.length > 1 ? 'hub' : ((RL.term || STATIONS[RL.key]) ? 'station' : (wcount >= 20 ? 'bridge' : 'rail'));
      }
      var tile = { c: c, r: r, code: code, kind: kind, cx: cx, cz: cz, label: String.fromCharCode(65 + c) + (r + 1), p: 0, ts: 0, cls: 'city', top: nb.top };
      if (code === 'W' || code === 'S' || code === 'N') tile.cls = 'power';
      else if (RL) tile.cls = 'rail';
      else if (code === 'G' || code === 'F' || code === 'R') tile.cls = 'garden';
      tile.ph = tile.cls === 'power' ? 0 : (tile.cls === 'rail' ? 1 : 2);
      var rn = addCells(NEWP[tile.ph], NSET, nb, x0, z0), ro = addCells(OLDP[tile.ph], OSET, ob, x0, z0);
      tile.ns = rn[0]; tile.nn = rn[1]; tile.os = ro[0]; tile.on = ro[1];

      /* ground: the "before" texture on the plate, the "after" texture on a plane that fades in over it */
      var oldTex = ob.texture(), newTex = nb.texture();
      var plate = new THREE.Mesh(plateGeo, [sideMat, sideMat, new THREE.MeshLambertMaterial({ map: oldTex }), sideMat, sideMat, sideMat]);
      plate.position.set(cx, -0.5, cz); plate.receiveShadow = true;
      scene.add(plate);
      var over = new THREE.Mesh(overGeo, new THREE.MeshLambertMaterial({ map: newTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }));
      over.rotation.x = -Math.PI / 2; over.position.set(cx, 0.52, cz); over.receiveShadow = true; over.visible = false;
      scene.add(over); tile.over = over;
      tiles.push(tile);

      ob.emit.forEach(function (e) { emitters.push({ x: x0 + e[0], y: e[1], z: z0 + e[2], tile: tile, type: 'smoke', n: 5, size: e[3] }); });
      if (code === 'W') {
        var yaw = new THREE.Group(); yaw.position.set(cx, 0, cz);
        yaw.add(shareMesh(nacBase));
        var rotor = new THREE.Group(); rotor.position.set(0, HUB_Y, ROTOR_Z);
        rotor.add(shareMesh(rotBase)); yaw.add(rotor);
        var bc = new THREE.Mesh(boxGeo, beaconMat); bc.position.set(0.5, HUB_Y + 4, -3.5); yaw.add(bc);
        rotor.rotation.z = hash(c, r, 1) * 6.28;
        yaw.visible = false; yaw.scale.setScalar(0.001);
        scene.add(yaw);
        turbines.push({ yaw: yaw, rotor: rotor, k: 0.94 + hash(c, r, 2) * 0.12, ph: hash(c, r, 3) * 20, tile: tile });
      } else if (code === 'N') {
        emitters.push({ x: x0 + 5.5, y: 21, z: z0 + 5.5, tile: tile, type: 'steam', n: 10, size: 2 });
      } else if (RL) {
        /* overhead wires, shown once the tile has mostly converted */
        var wp = [];
        RL.pieces.forEach(function (pts) {
          for (var i = 2; i < pts.length; i += 2) wp.push(x0 + pts[i - 2][0], 7, z0 + pts[i - 2][1], x0 + pts[i][0], 7, z0 + pts[i][1]);
          var e = pts.length - 1;
          if (e % 2) wp.push(x0 + pts[e - 1][0], 7, z0 + pts[e - 1][1], x0 + pts[e][0], 7, z0 + pts[e][1]);
        });
        var wg = new THREE.BufferGeometry();
        wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
        var wl = new THREE.LineSegments(wg, wireMat); wl.visible = false;
        scene.add(wl); tile.wire = wl;
      }
    }
  }

  var oldMeshes = OLDP.map(function (l) { var m = meshFrom(l, matLand, true, 1); scene.add(m); return m; });
  var newMeshes = NEWP.map(function (l) { var m = meshFrom(l, matLand, true, 0.0001); m.visible = false; scene.add(m); return m; });

  /* floating base under the city */
  [[196, 3, -3, '#8b5a36'], [170, 4.5, -6.75, '#7e502f'], [120, 6, -12, '#7c848b'], [60, 5, -17.5, '#6b737a']].forEach(function (b) {
    var m = new THREE.MeshLambertMaterial({ color: 0xffffff }); m.color.set(b[3]).convertSRGBToLinear();
    var bm = new THREE.Mesh(new THREE.BoxGeometry(b[0], b[1], b[0]), m);
    bm.position.set(0, b[2], 0); scene.add(bm);
  });

  /* smoke and steam puffs: one instanced mesh, coloured once, moved every frame by the loop */
  var puffTotal = 0;
  emitters.forEach(function (e) { puffTotal += e.n; });
  var smoke = new THREE.InstancedMesh(boxGeo, new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.88, depthWrite: false }), Math.max(1, puffTotal));
  var col = new THREE.Color(), pi = 0;
  emitters.forEach(function (e) {
    for (var k = 0; k < e.n; k++) {
      col.set(e.type === 'steam' ? '#ffffff' : mixHex('#34363a', '#5a5c60', hash(pi, 3, 1)));
      col.convertSRGBToLinear(); smoke.setColorAt(pi, col); pi++;
    }
  });
  if (smoke.instanceColor) smoke.instanceColor.needsUpdate = true;
  smoke.frustumCulled = false;
  scene.add(smoke);

  return {
    tiles: tiles, NEWP: NEWP, OLDP: OLDP, oldMeshes: oldMeshes, newMeshes: newMeshes,
    turbines: turbines, emitters: emitters, smoke: smoke, beaconMat: beaconMat
  };
}
