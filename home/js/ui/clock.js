/* "Local time" in the home header, ticking every second. */
export function startClock(node) {
  if (!node) return;
  function tick() { node.textContent = new Date().toLocaleTimeString('en-US', { hour12: true }); }
  tick();
  setInterval(tick, 1000);
}
