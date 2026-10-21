/* The frame loop. Each frame advances the timeline, converts tiles, animates turbines, smoke and
   transit, eases the camera, keeps the island framed, updates hover/tooltip/HUD/callouts and renders.
   It only runs while the hero is on screen; wake() restarts it. */
import { THREE } from './lib/three.js';
import { clamp, hash, s01 } from './lib/util.js';
import { TD } from './world/constants.js';

/* turbine speed from wind speed (m/s): tip-speed ratio TSR on a rotor of radius RM metres,
   capped at the 12 m/s rated speed and stopped above 25 m/s */
var RM = 43, TSR = 7, WIND = 9;
function rpmRaw(v) { return v * TSR * 60 / (2 * Math.PI * RM); }
var RPM_CAP = rpmRaw(12);
function rpmFor(v) { return v > 25 ? 0 : Math.min(rpmRaw(v), RPM_CAP); }

export function createLoop(ctx, parts) {
  var el = ctx.el, cam = ctx.cam, city = ctx.city, tiles = city.tiles, tl = ctx.tl, input = ctx.input, mouse = input.mouse, intro = ctx.intro;
  var beaconOn = new THREE.Color('#ff3b2a').convertSRGBToLinear(), beaconOff = new THREE.Color('#4a0f0b').convertSRGBToLinear();
  var puffDummy = new THREE.Object3D();
  var clock = new THREE.Clock(), time = 0, omega = rpmFor(WIND) * 2 * Math.PI / 60, rafId = 0, lastHud = 0;

  function wake() {
    if (rafId || !ctx.onScreen || document.hidden) return;
    clock.getDelta(); /* drop the time spent asleep */
    rafId = requestAnimationFrame(frame);
  }

  function frame() {
    rafId = 0;
    var dt = Math.min(clock.getDelta(), 0.05), i, k;
    if (intro.active) intro.step(performance.now());
    parts.playback.step(dt);

    /* tiles: convert the ones whose progress changed; hide whole phases that are entirely old or new */
    var dirty = false, phD = [false, false, false], anyOld = [false, false, false], anyNew = [false, false, false];
    for (i = 0; i < tiles.length; i++) {
      var t = tiles[i], p = clamp((tl.T - t.ts) / TD, 0, 1);
      if (p !== t.p) { parts.updateTile(t, p); dirty = true; phD[t.ph] = true; }
      if (t.p < 1) anyOld[t.ph] = true;
      if (t.p > 0) anyNew[t.ph] = true;
    }
    for (i = 0; i < 3; i++) {
      if (phD[i]) { city.oldMeshes[i].instanceMatrix.needsUpdate = true; city.newMeshes[i].instanceMatrix.needsUpdate = true; }
      city.oldMeshes[i].visible = anyOld[i]; city.newMeshes[i].visible = anyNew[i];
    }
    ctx.details.refresh();

    /* turbines grow in once their tile converts, then turn; the beacon blinks */
    omega += (rpmFor(WIND) * 2 * Math.PI / 60 - omega) * (1 - Math.exp(-dt / 1.2));
    var animate = input.animate;
    if (animate) {
      time += dt;
      city.beaconMat.color.copy((time % 1.5) < 0.3 ? beaconOn : beaconOff);
    } else {
      city.beaconMat.color.copy(beaconOn);
    }
    parts.transit.update(dt, animate);
    for (i = 0; i < city.turbines.length; i++) {
      var tu = city.turbines[i], ts = s01((tu.tile.p - 0.55) / 0.4);
      tu.yaw.visible = ts > 0.002; tu.yaw.scale.setScalar(Math.max(ts, 0.001));
      if (animate) {
        tu.rotor.rotation.z -= omega * tu.k * dt;
        tu.yaw.rotation.y = 0.08 * Math.sin(time * 0.17 + tu.ph) + 0.03 * Math.sin(time * 0.53 + tu.ph);
      }
    }

    /* smoke from stacks fades as a tile converts; steam from the reactor's tower appears */
    var pi = 0;
    for (i = 0; i < city.emitters.length; i++) {
      var e = city.emitters[i], steam = e.type === 'steam';
      var f = steam ? s01((e.tile.p - 0.6) / 0.4) : 1 - s01(e.tile.p / 0.5);
      for (k = 0; k < e.n; k++) {
        var u = (((time * (steam ? 0.12 : 0.16) + k / e.n + hash(pi, 1, 2) * 0.1) % 1) + 1) % 1;
        var sc = e.size * (0.7 + 2.2 * u) * (u < 0.75 ? 1 : (1 - u) / 0.25) * f;
        puffDummy.position.set(e.x + Math.sin(pi * 7.3) * 0.7, e.y + u * (steam ? 7 : 10), e.z - WIND * 0.5 * u + Math.cos(pi * 5.1) * 0.7);
        puffDummy.scale.setScalar(Math.max(sc, 0.0001)); puffDummy.updateMatrix();
        city.smoke.setMatrixAt(pi, puffDummy.matrix); pi++;
      }
    }
    city.smoke.instanceMatrix.needsUpdate = true;

    /* camera: slow orbit, ease toward a focus target, then framing */
    if (input.orbit) cam.theta += dt * 0.08;
    if (cam.focusing) {
      var k2 = 1 - Math.exp(-dt * 4);
      cam.target.lerp(cam.goal, k2); cam.zoom += (cam.zoomGoal - cam.zoom) * k2;
      if (cam.target.distanceTo(cam.goal) < 0.05 && Math.abs(cam.zoom - cam.zoomGoal) < 0.005) cam.focusing = false;
    }
    cam.place();
    /* zoomed in far enough: the copy fades and the city glides to the centre (a little hysteresis stops flicker) */
    var zNow = cam.focusing ? cam.zoomGoal : cam.zoom, wasZoomed = el.hero.classList.contains('is-zoomed');
    var zoomedIn = !intro.active && (wasZoomed ? zNow < 0.9 : zNow < 0.82); /* the intro's close-up doesn't count */
    if (wasZoomed !== zoomedIn) el.hero.classList.toggle('is-zoomed', zoomedIn);
    var kGoal = zoomedIn ? 1 : 0;
    if (cam.centreK !== kGoal) {
      cam.centreK = ctx.reduce ? kGoal : cam.centreK + (kGoal - cam.centreK) * (1 - Math.exp(-dt * 4));
      if (Math.abs(cam.centreK - kGoal) < 0.002) cam.centreK = kGoal;
      cam.applyOffset();
    }
    if (!intro.active && cam.centreK < 1) cam.centreIsland(1 - Math.exp(-dt * 6));

    /* hover: re-pick when the view or the city changed, and keep the tooltip inside the stage */
    if (input.orbit || cam.focusing || dirty) mouse.dirty = true;
    if (mouse.in && mouse.dirty && input.ptrs.size === 0) { mouse.dirty = false; ctx.details.setHover(ctx.pickTile()); }
    if (mouse.in && !el.tip.hidden) {
      var tx = Math.min(mouse.cx + 14, el.stage.clientWidth - el.tip.offsetWidth - 8), ty = mouse.cy + 18;
      if (tx < mouse.cx + 14) ty = mouse.cy + 22;
      el.tip.style.left = tx + 'px'; el.tip.style.top = ty + 'px';
    }

    /* text on the page updates about ten times a second; the callout lines every frame */
    var now = performance.now();
    var hudTick = now - lastHud > 90 || tl.drawnT === null;
    if (hudTick) { lastHud = now; tl.drawnT = tl.T; parts.updateHud(); }
    parts.updateCalls(hudTick);
    ctx.glow.hover.userData.halo.material.opacity = 0.78 + 0.22 * Math.sin(now * 0.005);
    ctx.glow.sel.userData.halo.material.opacity = 1;
    parts.drawWaves(dt, animate);
    ctx.renderer.render(ctx.scene, cam.camera);
    if (ctx.onScreen && !document.hidden) rafId = requestAnimationFrame(frame);
  }

  return { wake: wake, frame: frame };
}
