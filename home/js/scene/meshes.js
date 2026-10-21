/* Shared geometry and materials, and helpers that turn voxel lists into instanced meshes. */
import { THREE } from '../lib/three.js';
import { hash } from '../lib/util.js';

export const boxGeo = new THREE.BoxGeometry(1, 1, 1);
export const matLand = new THREE.MeshLambertMaterial({ color: 0xffffff });

/* one instanced cube per [x, y, z, colour] entry; s0 is the starting scale (the timeline grows/shrinks them) */
export function meshFrom(arr, material, shadows, s0) {
  var mesh = new THREE.InstancedMesh(boxGeo, material, Math.max(1, arr.length));
  var dummy = new THREE.Object3D(), col = new THREE.Color();
  dummy.scale.setScalar(s0 === undefined ? 1 : s0);
  for (var i = 0; i < arr.length; i++) {
    var v = arr[i];
    dummy.position.set(v[0], v[1], v[2]);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
    col.set(v[3]);
    col.offsetHSL(0, 0, (hash(v[0], v[1], v[2]) - 0.5) * 0.07);
    col.convertSRGBToLinear();
    mesh.setColorAt(i, col);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  mesh.castShadow = shadows; mesh.receiveShadow = shadows;
  mesh.frustumCulled = false;
  return mesh;
}

/* a second instanced mesh drawing the same instances (turbines and train cars share one copy each) */
export function shareMesh(base) {
  var m = new THREE.InstancedMesh(boxGeo, base.material, base.count);
  m.instanceMatrix = base.instanceMatrix; m.instanceColor = base.instanceColor;
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  return m;
}
