// Home image grid: on phones the card nearest the viewport centre plays its before/after sweep (others rest).
const cards = () => Array.from(document.querySelectorAll<HTMLElement>('#image-grid [data-mobile-card-index]'));
let io: IntersectionObserver | null = null;
let active = -1;

const setActive = (i: number) => {
  if (i === active) return;
  active = i;
  cards().forEach((c, idx) => (c.querySelector('[data-ba]') as any)?.baSetActive?.(idx === i));
};

function setup() {
  io?.disconnect();
  io = null;
  if (!window.matchMedia('(max-width: 639px)').matches) { active = -1; cards().forEach((c) => (c.querySelector('[data-ba]') as any)?.baSetActive?.(false)); return; }
  if (active === -1) setActive(0);
  io = new IntersectionObserver((entries) => {
    let best = -1; let ratio = 0;
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      const idx = Number((en.target as HTMLElement).dataset.mobileCardIndex);
      if (en.intersectionRatio > ratio) { ratio = en.intersectionRatio; best = idx; }
    }
    if (best >= 0) setActive(best);
  }, { threshold: [0.35, 0.55, 0.75], rootMargin: '-20% 0px -20% 0px' });
  cards().forEach((c) => io!.observe(c));
}
if (document.getElementById('image-grid')) {
  setup();
  window.addEventListener('resize', setup);
}
