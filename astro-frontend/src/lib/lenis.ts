import Lenis from 'lenis';

declare global {
  interface Window { __lenis?: Lenis }
}

if (typeof window !== 'undefined' && !window.__lenis) {
  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  window.__lenis = lenis;
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
  document.addEventListener('astro:after-swap', () => lenis.scrollTo(0, { immediate: true }));
}
