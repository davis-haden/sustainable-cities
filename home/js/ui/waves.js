/* The city's progress as a picture: layered green sine waves on the cream sheet behind the island.
   One band per kind of tile, stacked up from the bottom; each band swells as its tiles go green, so the
   sheet fills with green as the city does. Values ease toward their targets so the waves grow rather
   than jump, and the waves keep rolling while the scene animates. Drawn on a 2D canvas inside
   .vc-frame, under the 3D canvas, and called every frame from loop.js. */

/* bottom to top: nature at the base, power at the crest, shading from deep forest to pale sage (r g b) */
var BANDS = [
  { kinds: ['river'], rgb: '86 110 70' },
  { kinds: ['forest'], rgb: '104 128 84' },
  { kinds: ['garden'], rgb: '122 145 98' },
  { kinds: ['rail', 'station', 'bridge', 'hub'], rgb: '140 161 112' },
  { kinds: ['nuclear'], rgb: '151 168 122' },
  { kinds: ['solar'], rgb: '168 187 163' },
  { kinds: ['wind'], rgb: '196 210 178' }
];
var TAU = Math.PI * 2, STEP = 8;
var STACK = 0.62; /* a finished city's waves fill this share of the sheet's height */

export function createWaves(ctx) {
  var frame = ctx.el.stage.querySelector('.vc-frame');
  var canvas = document.createElement('canvas');
  canvas.className = 'vc-waves';
  canvas.setAttribute('aria-hidden', 'true');
  frame.appendChild(canvas);
  var g = canvas.getContext('2d'), W = 0, H = 0, dpr = 1, time = 0;
  var prev = null, cur = null;

  var bands = BANDS.map(function (b, i) {
    return {
      rgb: b.rgb, v: 0,
      list: ctx.city.tiles.filter(function (t) { return b.kinds.indexOf(t.kind) >= 0; }),
      /* each band rolls at its own wavelength, speed and phase so the stack never looks mechanical */
      f: TAU / (380 + i * 70), s: 0.35 + i * 0.07, ph: i * 1.3
    };
  });

  function size() {
    var w = canvas.clientWidth, h = canvas.clientHeight; /* a little larger than the frame, see .vc-waves */
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (w === W && h === H) return;
    W = w; H = h;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    var n = Math.ceil(w / STEP) + 1;
    prev = new Float32Array(n); cur = new Float32Array(n);
  }

  /* each band sits on the one below it; its thickness rolls but never drops below ~45%, so
     neighbouring edges never cross and an empty band is simply flat */
  function stack() {
    var maxBand = H * STACK / bands.length, n = prev.length, j, x;
    prev.fill(H);
    for (var i = 0; i < bands.length; i++) {
      var b = bands[i], th = b.v * maxBand;
      for (j = 0; j < n; j++) {
        x = j * STEP;
        cur[j] = prev[j] - th * (1 + 0.35 * Math.sin(x * b.f + time * b.s + b.ph) + 0.2 * Math.sin(x * b.f * 2.3 - time * b.s * 0.7 + b.ph * 1.7));
      }
      if (th > 0.3) {
        g.beginPath(); g.moveTo(0, cur[0]);
        for (j = 1; j < n; j++) g.lineTo(j * STEP, cur[j]);
        for (j = n - 1; j >= 0; j--) g.lineTo(j * STEP, prev[j]);
        g.closePath();
        g.fillStyle = 'rgb(' + b.rgb + ' / 0.55)'; g.fill();
        /* a thin cream crest line along the top of each band */
        g.beginPath(); g.moveTo(0, cur[0]);
        for (j = 1; j < n; j++) g.lineTo(j * STEP, cur[j]);
        g.strokeStyle = 'rgb(252 249 234 / 0.75)'; g.lineWidth = 1.5; g.stroke();
      }
      var t = prev; prev = cur; cur = t;
    }
  }

  return function draw(dt, animate) {
    size();
    if (!W || !H) return;
    if (animate) time += dt;
    var k = ctx.reduce ? 1 : 1 - Math.exp(-dt * 2.5);
    bands.forEach(function (b) {
      var sum = 0;
      b.list.forEach(function (t) { sum += t.p; });
      b.v += ((b.list.length ? sum / b.list.length : 0) - b.v) * k;
    });

    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, W, H);
    stack();
  };
}
