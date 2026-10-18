// Vanilla replacement for the React CookieConsent: same rules (quiet routes, yields to open chat, 4s delay).
const KEY = 'reframe-cookie-consent';
const QUIET = ['/contact', '/login', '/signup', '/forgot-password', '/reset-password'];
let timer: number | undefined;
let chatOpen = false;

const banner = () => document.querySelector<HTMLElement>('[data-cookie-banner]');
const hide = () => {
  const el = banner();
  if (!el) return;
  el.dataset.show = 'false';
  window.setTimeout(() => { if (el.dataset.show !== 'true') el.classList.add('hidden'); }, 300);
};
const show = () => {
  const el = banner();
  if (!el) return;
  el.classList.remove('hidden');
  requestAnimationFrame(() => requestAnimationFrame(() => { el.dataset.show = 'true'; }));
};
const evaluate = () => {
  clearTimeout(timer);
  chatOpen = chatOpen || document.body.hasAttribute('data-reframe-cs-open');
  const quiet = QUIET.includes(window.location.pathname) || chatOpen;
  if (quiet) return hide();
  let consent: string | null = null;
  try { consent = localStorage.getItem(KEY); } catch { /* ignore */ }
  if (consent) return;
  timer = window.setTimeout(show, 4000);
};

document.addEventListener('click', (e) => {
  const b = (e.target as Element).closest<HTMLElement>('[data-cookie]');
  if (!b) return;
  try { localStorage.setItem(KEY, b.dataset.cookie || 'declined'); } catch { /* ignore */ }
  hide();
});
window.addEventListener('reframe-cs:state', (e) => { chatOpen = Boolean((e as CustomEvent).detail?.open); evaluate(); });
document.addEventListener('astro:page-load', evaluate);
evaluate();
