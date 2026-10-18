// Adds .is-revealed to [data-reveal] elements the first time they enter the viewport (like framer's useInView once).
let io: IntersectionObserver | null = null;

function scan() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
    return;
  }
  io ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-revealed');
        io!.unobserve(e.target);
      }
    },
    { threshold: 0.08 }
  );
  document.querySelectorAll('[data-reveal]:not(.is-revealed)').forEach((el) => io!.observe(el));
}

scan();
document.addEventListener('astro:page-load', scan);
