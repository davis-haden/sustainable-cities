/* The story below the city: scroll-linked motion that ties the four chapters into one narrative.
   - the thread down the left fills as you read, and each chapter's dot pops when you reach it
   - chapter headings rise in word by word
   - in chapter 1 the smog over the skyline lifts as the figure scrolls through the view
   - numbers count up, research photos drift (parallax)
   - the "what you can do" pledges toggle and remember your picks
   Everything settles to its final state under prefers-reduced-motion. Independent of three.js. */

var story = document.getElementById('story');
if (story) init();

function init() {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  /* --- headings: wrap each word in a mask so it can rise into place --- */
  document.querySelectorAll('[data-split]').forEach(function (h) {
    var i = 0, walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT), nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      var frag = document.createDocumentFragment();
      node.textContent.split(/(\s+)/).forEach(function (part) {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
        var w = document.createElement('span'), inner = document.createElement('span');
        w.className = 'w'; inner.textContent = part; inner.style.setProperty('--w', i++);
        w.appendChild(inner); frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
  });

  /* --- one-shot triggers: headings rise, numbers count up --- */
  function countUp(el) {
    var to = parseFloat(el.dataset.count), t0 = null, dur = 1400;
    if (reduce) { el.textContent = to; return; }
    function frame(t) {
      if (t0 === null) t0 = t;
      var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e);
      if (k < 1) requestAnimationFrame(frame);
    }
    el.textContent = '0';
    requestAnimationFrame(frame);
  }
  var once = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      if (e.target.hasAttribute('data-count')) countUp(e.target);
      else e.target.classList.add('is-in');
      once.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  document.querySelectorAll('[data-split], [data-count]').forEach(function (el) { once.observe(el); });

  /* --- scroll-linked: the thread, chapter dots, the smog, parallax --- */
  var dots = Array.from(story.querySelectorAll('.chapter-dot'));
  var haze = story.querySelector('.haze');
  var pics = Array.from(story.querySelectorAll('.proof-card img'));
  var cue = story.querySelector('.story-cue');
  var header = document.querySelector('.site-header');
  var ticking = false;

  function update() {
    ticking = false;
    var vh = window.innerHeight, mid = vh * 0.6, r = story.getBoundingClientRect();
    /* thread: 0 when the story's top reaches the reading line, 1 at its bottom */
    story.style.setProperty('--story-p', clamp((mid - r.top) / r.height, 0, 1).toFixed(4));
    dots.forEach(function (d) { d.classList.toggle('is-reached', d.getBoundingClientRect().top < mid); });
    if (cue) cue.classList.toggle('is-gone', r.top < vh * 0.35);
    /* phones: the header turns into a solid bar once the page moves, like on the other pages */
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);

    if (haze) {
      /* wide screens pin the figure beside the copy, so read progress through the whole chapter.
         Phones stack it below the copy, so follow the figure itself: smoggy as it comes up from the
         bottom of the screen, clear by the time it reaches the upper third. */
      var p;
      if (reduce) p = 1;
      else if (getComputedStyle(haze).position === 'sticky') {
        var gr = haze.parentNode.getBoundingClientRect();
        p = clamp((vh * 0.15 - gr.top) / (gr.height * 0.6), 0, 1);
      } else {
        var hr = haze.getBoundingClientRect();
        p = clamp((vh * 0.85 - hr.top) / (vh * 0.55), 0, 1);
      }
      haze.style.setProperty('--clear', p.toFixed(3));
      haze.classList.toggle('is-clear', p > 0.55);
    }
    if (!reduce) pics.forEach(function (img) {
      var b = img.parentNode.getBoundingClientRect(), k = (b.top + b.height / 2 - vh / 2) / vh;
      img.style.setProperty('--py', (k * -24).toFixed(1) + 'px');
    });
  }
  function request() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();

  /* --- pledges: toggle, count, remember (best effort; storage may be unavailable) --- */
  var pledges = Array.from(document.querySelectorAll('.pledge'));
  var nEl = document.getElementById('pledge-n'), msgEl = document.getElementById('pledge-msg');
  var MSGS = ['Every city starts with one choice.', 'Nice start. One habit is how it begins.', 'Two down. That adds up fast.',
    'Three! Your block thanks you.', 'Four. You are basically a city planner now.', 'All five. Go tell a friend.'];
  var saved = [];
  try { saved = JSON.parse(localStorage.getItem('bbiss-pledges') || '[]'); } catch (e) { saved = []; }

  function refresh() {
    var n = pledges.filter(function (b) { return b.getAttribute('aria-pressed') === 'true'; }).length;
    if (nEl) nEl.textContent = n;
    if (msgEl) msgEl.textContent = MSGS[n];
    try { localStorage.setItem('bbiss-pledges', JSON.stringify(pledges.map(function (b) { return b.getAttribute('aria-pressed') === 'true'; }))); } catch (e) {}
  }
  pledges.forEach(function (b, i) {
    if (saved[i]) b.setAttribute('aria-pressed', 'true');
    b.addEventListener('click', function () {
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      refresh();
    });
  });
  refresh();
}
