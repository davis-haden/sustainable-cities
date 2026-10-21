/* Forest density: soft blobs in world space, so woods spill across tile edges. Atlanta's tree canopy:
   woods along the Chattahoochee and the South River Forest, plus leafy neighbourhoods. */

const BLOBS = [[1.0, 0.9, 1.7], [0.4, 3.0, 1.0], [1.0, 9.0, 1.3], [8.6, 7.9, 1.4], [9.5, 6.2, 0.7], [7.8, 0.8, 1.0], [2.8, 7.4, 0.9], [8.2, 3.9, 0.7]];
function forestAt(wx, wz) {
  var tx = (wx + 0.5) / 20, tz = (wz + 0.5) / 20, f = 0;
  for (var i = 0; i < BLOBS.length; i++) { var b = BLOBS[i]; f = Math.max(f, 1 - Math.hypot(tx - b[0], tz - b[1]) / b[2]); }
  return f + 0.18 * Math.sin(wx * 0.21 + wz * 0.07) * Math.sin(wz * 0.17 - wx * 0.05);
}

export { forestAt };
