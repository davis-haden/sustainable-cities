/* Daylight: a sky/ground fill light and a shadow-casting sun. (The sky colour itself is the stage
   background in home/css/hero.css.) */
import { THREE } from '../lib/three.js';

function linear(hex) { return new THREE.Color(hex).convertSRGBToLinear(); }

export function addLighting(scene) {
  var hemi = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.62);
  hemi.color.copy(linear('#ffffff'));
  hemi.groundColor.copy(linear('#a8b89a'));
  scene.add(hemi);

  var sun = new THREE.DirectionalLight(0xffffff, 0.9);
  sun.color.copy(linear('#fff4e0'));
  sun.position.set(-150, 260, 100);
  sun.target.position.set(0, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -150; sun.shadow.camera.right = 150;
  sun.shadow.camera.top = 150; sun.shadow.camera.bottom = -150;
  sun.shadow.camera.near = 10; sun.shadow.camera.far = 700;
  sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.05;
  scene.add(sun); scene.add(sun.target);
}
