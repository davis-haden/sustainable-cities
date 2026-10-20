/* Forest density: soft blobs in world space, so woods spill across tile edges. */

const BLOBS = [[0.9, 0.7, 1.6], [3.4, 1.4, 0.9], [1.4, 2.6, 0.9], [0.5, 4.9, 1.4], [0.4, 7.4, 1.0], [2.2, 9.3, 1.5], [8.9, 6.6, 0.7], [6.8, 8.3, 0.6], [9.6, 0.4, 0.5]];
function forestAt(wx, wz) {
  var tx = (wx + 0.5) / 20, tz = (wz + 0.5) / 20, f = 0;
  for (var i = 0; i < BLOBS.length; i++) { var b = BLOBS[i]; f = Math.max(f, 1 - Math.hypot(tx - b[0], tz - b[1]) / b[2]); }
  return f + 0.18 * Math.sin(wx * 0.21 + wz * 0.07) * Math.sin(wz * 0.17 - wx * 0.05);
}

export { forestAt };
