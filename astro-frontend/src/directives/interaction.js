// client:interaction — hydrate on first pointer/keyboard/touch interaction with the island, on the
// `reframe-cs:open` event, or (fallback) after the page has been idle for a while.
/** @type {import('astro').ClientDirective} */
export default (load, _options, el) => {
  let started = false;
  const events = ['pointerover', 'pointerdown', 'focusin', 'touchstart', 'keydown'];
  const cleanup = () => {
    events.forEach((e) => document.removeEventListener(e, onInteract, true));
    window.removeEventListener('reframe-cs:open', onOpen);
    clearTimeout(timer);
  };
  const start = async (replayOpen) => {
    if (started) return;
    started = true;
    cleanup();
    const hydrate = await load();
    await hydrate();
    if (replayOpen) window.dispatchEvent(new CustomEvent('reframe-cs:open', { detail: replayOpen === true ? undefined : replayOpen }));
  };
  const onInteract = (e) => { if (el.contains(e.target)) start(e.type === 'pointerdown' || e.type === 'touchstart'); };
  const onOpen = (e) => { start(e.detail || true); };
  events.forEach((e) => document.addEventListener(e, onInteract, true));
  window.addEventListener('reframe-cs:open', onOpen);
  const timer = setTimeout(() => start(false), 15000);
};
