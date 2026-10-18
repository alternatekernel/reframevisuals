// Count-up numbers: <span data-count-up="64%"> keeps its final text in the HTML (crawlers) and animates 0 -> value once in view.
const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|linkedinbot|twitterbot|discordbot|google-read-aloud/i;

const format = (value: string, n: number) => (value.includes('%') ? `${n}%` : value.includes('B') ? `${n}B` : String(n));

function run(el: HTMLElement) {
  const value = el.dataset.countUp || '';
  const target = parseInt(value.replace(/[^0-9]/g, ''), 10);
  if (!Number.isFinite(target)) return;
  const start = performance.now();
  const tick = (now: number) => {
    const p = Math.min((now - start) / 2000, 1);
    el.textContent = format(value, Math.round(target * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function scan() {
  if (BOT.test(navigator.userAgent || '') || typeof IntersectionObserver === 'undefined') return;
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      run(e.target as HTMLElement);
    }
  }, { rootMargin: '-10% 0px' });
  document.querySelectorAll<HTMLElement>('[data-count-up]:not([data-count-seen])').forEach((el) => { el.dataset.countSeen = '1'; io.observe(el); });
}
scan();
document.addEventListener('astro:page-load', scan);
