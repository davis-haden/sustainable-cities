/* The gold frame that outlines a hovered or selected tile. */
import { THREE } from '../lib/three.js';
import { boxGeo } from './meshes.js';

var glowTex = null;
function makeTexture() {
  var cv = document.createElement('canvas'); cv.width = cv.height = 256;
  var cx = cv.getContext('2d');
  var inset = 256 * (12 / 44), side = 256 * (20 / 44);
  cx.strokeStyle = '#db9558'; cx.shadowColor = '#db9558';
  cx.lineWidth = 5;
  [34, 22, 12].forEach(function (blur) { cx.shadowBlur = blur; cx.strokeRect(inset, inset, side, side); });
  var t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  return t;
}

export function makeGlow(scene) {
  if (!glowTex) glowTex = makeTexture();
  var g = new THREE.Group();
  var halo = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, fog: false }));
  halo.rotation.x = -Math.PI / 2; halo.position.y = 0.6; g.add(halo);
  var fm = new THREE.MeshBasicMaterial({ color: new THREE.Color('#e8a86c').convertSRGBToLinear(), fog: false });
  [[20.8, 0.7, 0, -10], [20.8, 0.7, 0, 10], [0.7, 19.4, -10, 0], [0.7, 19.4, 10, 0]].forEach(function (f) {
    var bar = new THREE.Mesh(boxGeo, fm);
    bar.scale.set(f[0], 0.5, f[1]);
    bar.position.set(f[2], 0.85, f[3]); g.add(bar);
  });
  g.userData.halo = halo; g.visible = false;
  scene.add(g);
  return g;
}

export function placeGlow(g, tile) { g.position.set(tile.cx, 0, tile.cz); g.visible = !!tile; }
