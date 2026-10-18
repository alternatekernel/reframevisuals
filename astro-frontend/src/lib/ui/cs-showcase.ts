// ReframeCS showcase: while the chat preview is on screen (desktop), tell the floating chat widget to step aside
// ('reframe-cs-showcase-view') and pulse a focus ring on the preview 1s later.
const frame = document.querySelector<HTMLElement>('[data-cs-showcase]');
if (frame && 'IntersectionObserver' in window) {
  let timer: number | undefined;
  const notify = (inView: boolean) => window.dispatchEvent(new CustomEvent('reframe-cs-showcase-view', { detail: { inView } }));
  const inner = frame.querySelector<HTMLElement>('[data-cs-glow]');
  const glow = (on: boolean) => { if (inner) inner.dataset.glow = String(on); };
  const io = new IntersectionObserver((entries) => {
    const entering = entries[entries.length - 1].isIntersecting;
    if (window.innerWidth < 768) return;
    clearTimeout(timer);
    notify(entering);
    if (entering) {
      timer = window.setTimeout(() => { glow(true); timer = window.setTimeout(() => glow(false), 1400); }, 1000);
    } else glow(false);
  }, { rootMargin: '-120px' });
  io.observe(frame);
  document.addEventListener('astro:before-swap', () => { clearTimeout(timer); notify(false); io.disconnect(); }, { once: true });
}
