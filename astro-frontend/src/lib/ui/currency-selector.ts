// Floating currency selector: shown on /pricing (sm and up) once the hero section has scrolled out of view.
import { getCurrency, setCurrency, type Currency } from './currency';

const FLAGS: Record<string, string> = { USD: 'us', EUR: 'eu', GBP: 'gb', INR: 'in', CAD: 'ca', AUD: 'au', AED: 'ae' };
const root = () => document.querySelector<HTMLElement>('[data-currency-selector]');
let heroVisible = false;
let io: IntersectionObserver | undefined;

function render() {
  const el = root();
  if (!el) return;
  const cur = getCurrency();
  el.querySelector('[data-cs-code]')!.textContent = cur;
  const img = el.querySelector<HTMLImageElement>('[data-cs-flag]');
  if (img) img.src = `https://flagcdn.com/w20/${FLAGS[cur]}.png`;
  el.querySelectorAll<HTMLElement>('[data-cs-option]').forEach((b) => {
    const active = b.dataset.csOption === cur;
    b.dataset.active = String(active);
    b.setAttribute('aria-selected', String(active));
    b.querySelector('[data-cs-active]')?.classList.toggle('hidden', !active);
  });
}
function visibility() {
  const el = root();
  if (!el) return;
  const show = window.location.pathname === '/pricing' && !heroVisible;
  el.classList.toggle('hidden', !show);
  el.classList.toggle('sm:block', show);
  if (!show) setOpen(false);
}
function setOpen(open: boolean) {
  const el = root();
  if (!el) return;
  el.querySelector<HTMLElement>('[data-cs-list]')!.dataset.open = String(open);
  el.querySelector('[data-cs-toggle]')?.setAttribute('aria-expanded', String(open));
  el.querySelector('[data-cs-chevron]')?.classList.toggle('rotate-180', open);
}
function observeHero() {
  io?.disconnect();
  const heroes = Array.from(document.querySelectorAll('[data-section="hero"]'));
  if (!heroes.length) { heroVisible = false; return visibility(); }
  io = new IntersectionObserver(() => {
    heroVisible = heroes.some((h) => { const r = h.getBoundingClientRect(); return r.bottom > 0 && r.top < window.innerHeight; });
    visibility();
  }, { threshold: [0, 0.05, 0.1] });
  heroes.forEach((h) => io!.observe(h));
}

document.addEventListener('click', (e) => {
  const t = e.target as Element;
  if (t.closest('[data-cs-toggle]')) { const open = root()?.querySelector<HTMLElement>('[data-cs-list]')?.dataset.open === 'true'; return setOpen(!open); }
  const opt = t.closest<HTMLElement>('[data-cs-option]');
  if (opt) { setCurrency(opt.dataset.csOption as Currency); render(); setOpen(false); }
});
document.addEventListener('mousedown', (e) => { if (!(e.target as Element).closest('[data-currency-selector]')) setOpen(false); });
window.addEventListener('rv-currency', render);
const init = () => { render(); observeHero(); };
document.addEventListener('astro:page-load', init);
init();
