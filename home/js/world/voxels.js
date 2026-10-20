/* Voxel shapes for things that move: turbine nacelle and rotor, and light-rail cars. */

const HUB_Y = 19, ROTOR_Z = 5, TLEN = 8;
function nacelleCells() {
  var out = [], nx, ny, nz;
  for (nx = -1.5; nx <= 1.5; nx += 1) for (ny = HUB_Y - 1; ny <= HUB_Y + 1; ny++) for (nz = -4.5; nz <= 2.5; nz += 1) {
    var c = '#e9edf0';
    if (nz <= -3.5) c = '#cfd6db';
    else if (nz >= 2.5) c = '#d4dbe0';
    else if (ny === HUB_Y + 1 && nz >= -2.5 && nz <= -0.5) c = '#bcc5cc';
    else if (ny === HUB_Y - 1) c = '#cbd2d7';
    out.push([nx, ny, nz, c]);
  }
  out.push([0.5, HUB_Y + 2, -3.5, '#9aa4ac'], [0.5, HUB_Y + 3, -3.5, '#9aa4ac'], [-0.5, HUB_Y + 3, -3.5, '#c9d0d5'], [1.5, HUB_Y + 3, -3.5, '#c9d0d5']);
  return out;
}
function rotorCells() {
  var m = new Map();
  function add(x, y, z, c) { var k = x + ',' + y + ',' + z; if (!m.has(k)) m.set(k, [x, y, z, c]); }
  var sx, sy, sz;
  for (sx = -2; sx <= 2; sx++) for (sy = -2; sy <= 2; sy++) for (sz = -2; sz <= 3; sz++) {
    if ((sx * sx + sy * sy) / (1.6 * 1.6) + Math.pow((sz - 0.5) / 2.2, 2) <= 1) m.set(sx + ',' + sy + ',' + sz, [sx, sy, sz, '#f4f6f8']);
  }
  function chord(rr) { return rr < 2.5 ? 2 : 2.4 - 1.4 * ((rr - 2.5) / (TLEN - 2.5)); }
  function pitch(rr) { return 0.45 * (1 - rr / TLEN) + 0.05; }
  [0, 1, 2].forEach(function (k) {
    var a = k * 2 * Math.PI / 3, ca = Math.cos(a), sa = Math.sin(a);
    for (var rr = 1.3; rr <= TLEN + 0.01; rr += 0.25) {
      var c = chord(rr), lead = -0.35 * c, trail = 0.65 * c, red = rr > TLEN - 2.0;
      for (var u = lead; u <= trail + 0.001; u += 0.25) {
        var zo = u * pitch(rr), tmax = rr < 3.5 ? 1 : 0;
        var px = Math.round(u * ca - rr * sa), py = Math.round(u * sa + rr * ca);
        for (var q = 0; q <= tmax; q++) add(px, py, Math.round(zo) + q, red ? '#d93a26' : '#f4f6f8');
      }
    }
  });
  return Array.from(m.values());
}
function carCells(first, body) {
  var out = [];
  for (var x = -1.5; x <= 1.5; x += 1) for (var z = -3.5; z <= 3.5; z += 1) {
    var side = Math.abs(x) > 1;
    out.push([x, 2, z, side ? body : '#47525c']);
    var win = side && (z === -2.5 || z === -1.5 || z === 0.5 || z === 1.5);
    var c3 = win ? '#a9d3e8' : '#f4f6f8';
    if (first && z === 3.5) c3 = '#2b3f55';
    out.push([x, 3, z, c3]);
    out.push([x, 4, z, (!side && z > -2) ? '#e0e8ea' : '#f4f6f8']);
  }
  out.push([-0.5, 5, 0.5, '#3b4650'], [0.5, 5, 0.5, '#3b4650'], [-0.5, 6, 0.5, '#3b4650'], [0.5, 6, 0.5, '#3b4650']);
  return out;
}

export { HUB_Y, ROTOR_Z, TLEN, nacelleCells, rotorCells, carCells };
