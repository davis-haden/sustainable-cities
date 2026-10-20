/* "Jump to" legend: one chip per tile type, counting finished tiles; a click flies to the next one. */
import { isGreen } from './details.js';

var CATS = [
  { label: 'Wind', color: '#f4f6f8', kinds: ['wind'] },
  { label: 'Solar', color: '#1d3f7a', kinds: ['solar'] },
  { label: 'Nuclear', color: '#d5d9dc', kinds: ['nuclear'] },
  { label: 'Light rail', color: '#3fae5a', kinds: ['rail', 'station', 'bridge', 'hub'] },
  { label: 'Gardens', color: '#4aa83f', kinds: ['garden'] },
  { label: 'Forest', color: '#2e7a45', kinds: ['forest'] },
  { label: 'River', color: '#3d8fd1', kinds: ['river'] }
];

export function createLegend(ctx) {
  var tiles = ctx.city.tiles;
  var cats = CATS.map(function (cat) {
    var list = tiles.filter(function (t) { return cat.kinds.indexOf(t.kind) >= 0; });
    var li = document.createElement('li'), b = document.createElement('button'), sw = document.createElement('i'), n = document.createElement('b');
    b.type = 'button'; b.className = 'vc-chip';
    sw.style.background = cat.color; n.textContent = '0/' + list.length;
    b.appendChild(sw); b.appendChild(document.createTextNode(cat.label + ' ')); b.appendChild(n);
    var idx = 0;
    b.addEventListener('click', function () {
      var ready = list.filter(isGreen), pool = ready.length ? ready : list;
      var t = pool[idx % pool.length]; idx++;
      ctx.details.focusTile(t);
    });
    li.appendChild(b); ctx.el.legend.appendChild(li);
    return { list: list, nEl: n };
  });

  /* refresh the done/total counts */
  return function update() {
    cats.forEach(function (cat) {
      var n = 0; cat.list.forEach(function (t) { if (t.p >= 0.98) n++; });
      cat.nEl.textContent = n + '/' + cat.list.length;
    });
  };
}
