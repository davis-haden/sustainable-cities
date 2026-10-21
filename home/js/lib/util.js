/* Small math, hashing and colour helpers shared by the world builder and the scene. */

function hash(x, y, z) { var n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return n - Math.floor(n); }
function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
function smooth(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
function s01(x) { var t = clamp(x, 0, 1); return t * t * (3 - 2 * t); }
function pick(arr, h) { return arr[Math.floor(h * arr.length) % arr.length]; }
function rgbOf(hex) { var n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function hex2(v) { var s = Math.round(clamp(v, 0, 255)).toString(16); return s.length < 2 ? '0' + s : s; }
function mixHex(a, b, k) {
  var p = rgbOf(a), q = rgbOf(b);
  return '#' + hex2(p[0] + (q[0] - p[0]) * k) + hex2(p[1] + (q[1] - p[1]) * k) + hex2(p[2] + (q[2] - p[2]) * k);
}
function dull(h) { return mixHex(mixHex(h, '#6f6a60', 0.62), '#000000', 0.08); }
function shade(hex, f) {
  var p = rgbOf(hex);
  return 'rgb(' + Math.min(255, Math.round(p[0] * f)) + ',' + Math.min(255, Math.round(p[1] * f)) + ',' + Math.min(255, Math.round(p[2] * f)) + ')';
}

function shadeHex(h) { return mixHex(h, '#000000', 0.25); }

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

export { hash, clamp, smooth, s01, pick, rgbOf, mixHex, dull, shade, shadeHex, easeOut, easeInOut };
