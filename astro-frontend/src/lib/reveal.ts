// Adds .is-revealed to [data-reveal] elements the first time they enter the viewport (like framer's useInView once).
const observers = new Map<number, IntersectionObserver>();
const observerFor = (threshold: number) => {
  let o = observers.get(threshold);
  if (!o) {
    o = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.classList.add('is-revealed');
          o!.unobserve(e.target);
        }
      },
      { threshold }
    );
    observers.set(threshold, o);
  }
  return o;
};

function scan() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  document.querySelectorAll<HTMLElement>('[data-reveal]:not(.is-revealed)').forEach((el) => observerFor(Number(el.dataset.revealThreshold) || 0.08).observe(el));
}

scan();
document.addEventListener('astro:page-load', scan);
