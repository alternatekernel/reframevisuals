// Vanilla behavior for the server-rendered navigation (replaces the React Navigation island).
// Uses document-level delegation so it survives View Transition swaps; bound once per page load.
type User = { name?: string; email?: string; avatarUrl?: string; customerCode?: string };

const API = (import.meta.env.VITE_API_URL as string | undefined) || '/api';
const qs = <T extends Element = HTMLElement>(sel: string) => document.querySelector<T>(sel);
const qsa = <T extends Element = HTMLElement>(sel: string) => Array.from(document.querySelectorAll<T>(sel));
const doc = document.documentElement;

// ---- services mega menu -------------------------------------------------------------------
let closeTimer: number | undefined;
let dropdownHovered = false;
const menu = () => qs('[data-services-menu]');
const setServicesOpen = (open: boolean) => {
  const m = menu();
  if (!m) return;
  m.dataset.open = String(open);
  qs('[data-services-backdrop]')?.classList.toggle('hidden', !open);
  qs('[data-services-chevron]')?.classList.toggle('rotate-180', open);
};
const scheduleClose = () => { clearTimeout(closeTimer); closeTimer = window.setTimeout(() => setServicesOpen(false), 100); };

document.addEventListener('mouseover', (e) => {
  const t = e.target as Element;
  if (t.closest('[data-services-trigger]')) { if (menu()) { clearTimeout(closeTimer); setServicesOpen(true); } return; }
  if (t.closest('[data-services-menu]')) { clearTimeout(closeTimer); dropdownHovered = true; setServicesOpen(true); return; }
  if (t.closest('[data-services-backdrop]')) { setServicesOpen(false); }
});
document.addEventListener('mouseout', (e) => {
  const t = e.target as Element;
  const to = e.relatedTarget as Element | null;
  if (t.closest('[data-services-trigger]') && !to?.closest('[data-services-menu]') && !dropdownHovered) scheduleClose();
  if (t.closest('[data-services-menu]') && !to?.closest('[data-services-menu]')) { dropdownHovered = false; scheduleClose(); }
});

// ---- mobile drawer ----------------------------------------------------------------------
const setMobile = (open: boolean) => {
  const m = qs('[data-mobile-menu]');
  const b = qs('[data-mobile-backdrop]');
  if (m) m.dataset.open = String(open);
  if (b) b.dataset.open = String(open);
  qs('[data-mobile-open]')?.setAttribute('aria-expanded', String(open));
};

// ---- contact popover ----------------------------------------------------------------------
const setContact = (open: boolean) => {
  qs('[data-contact-popover]')?.classList.toggle('hidden', !open);
  if (!open) resetContact();
};
const resetContact = () => {
  qs('[data-contact-form]')?.classList.remove('hidden');
  const done = qs('[data-contact-done]'); done?.classList.add('hidden'); done?.classList.remove('flex');
  const err = qs('[data-contact-error]'); if (err) { err.textContent = ''; err.classList.add('hidden'); }
  const input = qs<HTMLInputElement>('[data-contact-email]'); if (input) { input.value = ''; input.disabled = false; }
  qs('[data-contact-spinner]')?.classList.add('hidden');
  qs('[data-contact-submit-label]')?.classList.remove('hidden');
  const btn = qs<HTMLButtonElement>('[data-contact-submit]'); if (btn) btn.disabled = false;
};
const showContactError = (msg: string) => { const err = qs('[data-contact-error]'); if (err) { err.textContent = msg; err.classList.remove('hidden'); } };

async function submitContact() {
  const input = qs<HTMLInputElement>('[data-contact-email]');
  const btn = qs<HTMLButtonElement>('[data-contact-submit]');
  if (!input || !btn) return;
  if (!input.value.includes('@')) { showContactError('Please enter a valid email address.'); return; }
  btn.disabled = true; input.disabled = true;
  qs('[data-contact-spinner]')?.classList.remove('hidden');
  qs('[data-contact-submit-label]')?.classList.add('hidden');
  try {
    await fetch(`${API.replace(/\/$/, '')}/portal/inquiry`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: input.value }) });
    qs('[data-contact-form]')?.classList.add('hidden');
    const done = qs('[data-contact-done]'); done?.classList.remove('hidden'); done?.classList.add('flex');
    window.setTimeout(() => setContact(false), 5000);
  } catch {
    resetContact();
    showContactError('Something went wrong. Please try emailing us directly.');
  }
}

// ---- profile menu + auth ------------------------------------------------------------------
const setProfile = (open: boolean) => {
  qs('[data-profile-menu]')?.classList.toggle('hidden', !open);
  qs('[data-profile-toggle]')?.setAttribute('aria-expanded', String(open));
};

function renderUser(user: User) {
  qsa('[data-user-name]').forEach((el) => (el.textContent = user.name || 'Customer'));
  qsa('[data-user-email]').forEach((el) => (el.textContent = user.email || ''));
  qsa('[data-user-code]').forEach((el) => { el.textContent = user.customerCode || ''; el.classList.toggle('hidden', !user.customerCode); });
  qsa('[data-user-initial]').forEach((el) => { el.textContent = (user.name?.[0] || 'C').toUpperCase(); el.classList.toggle('hidden', Boolean(user.avatarUrl)); });
  qsa<HTMLImageElement>('[data-user-avatar]').forEach((img) => { if (user.avatarUrl) { img.src = user.avatarUrl; img.alt = user.name || ''; } img.classList.toggle('hidden', !user.avatarUrl); });
  qsa<HTMLImageElement>('[data-user-avatar-btn]').forEach((img) => { if (user.avatarUrl) { img.src = user.avatarUrl; img.alt = user.name || 'Profile'; } img.classList.toggle('hidden', !user.avatarUrl); });
  qs('[data-user-icon-btn]')?.classList.toggle('hidden', Boolean(user.avatarUrl));
}

const AUTH_KEYS = ['reframe-current-user', 'reframe-token', 'portal_token', 'reframe-auth'];
function clearAuth() {
  AUTH_KEYS.forEach((k) => localStorage.removeItem(k));
  doc.removeAttribute('data-authed');
}

let validated = false;
async function syncAuth() {
  let cached: User | null = null;
  try { cached = JSON.parse(localStorage.getItem('reframe-current-user') || 'null'); } catch { /* ignore */ }
  const portalToken = localStorage.getItem('portal_token');
  const adminToken = localStorage.getItem('reframe-token');
  if (!portalToken && !adminToken) { clearAuth(); return; }
  if (cached) { doc.setAttribute('data-authed', ''); renderUser(cached); }
  if (validated) return;
  validated = true;
  // Never trust the cached user alone: confirm the portal session with the backend, like the React provider did.
  if (portalToken) {
    try {
      const res = await fetch(`${API.replace(/\/$/, '')}/portal/auth/me`, { credentials: 'include', headers: { Authorization: `Bearer ${portalToken}`, 'x-guest-id': localStorage.getItem('portal_guest_id') || '' } });
      const body = await res.json();
      if (res.ok && body?.success && body.data && !body.data.isGuest) {
        const user = { ...(cached || {}), ...body.data };
        localStorage.setItem('reframe-current-user', JSON.stringify(user));
        doc.setAttribute('data-authed', '');
        renderUser(user);
      } else clearAuth();
    } catch { /* network failure: keep the cached state */ }
  }
}

async function signOut() {
  try {
    await fetch(`${API.replace(/\/$/, '')}/portal/auth/logout`, { method: 'POST', credentials: 'include', headers: { Authorization: `Bearer ${localStorage.getItem('portal_token') || ''}` } });
  } catch { /* ignore */ }
  clearAuth();
  ['customer_code', 'portal_guest_id', 'reframe_cs_conv_id', 'reframe_cs_messages', 'reframe_cs_last_admin_msg_id', 'reframe_cs_identity', 'reframe_cs_contact_captured'].forEach((k) => localStorage.removeItem(k));
  localStorage.setItem('portal_logged_out', 'true');
  window.dispatchEvent(new Event('portal-logout'));
  setProfile(false);
  setMobile(false);
}

// ---- click delegation -----------------------------------------------------------------------
document.addEventListener('click', (e) => {
  const t = e.target as Element;
  if (t.closest('[data-mobile-open]')) return setMobile(true);
  if (t.closest('[data-mobile-close]') || t.closest('[data-mobile-backdrop]') || t.closest('[data-mobile-menu] a')) setMobile(false);
  if (t.closest('[data-menu-link]') || t.closest('[data-services-backdrop]')) setServicesOpen(false);
  if (t.closest('[data-contact-toggle]')) { const hidden = qs('[data-contact-popover]')?.classList.contains('hidden'); return setContact(Boolean(hidden)); }
  if (t.closest('[data-contact-submit]')) return void submitContact();
  if (t.closest('[data-profile-toggle]')) { const hidden = qs('[data-profile-menu]')?.classList.contains('hidden'); return setProfile(Boolean(hidden)); }
  if (t.closest('[data-signout]')) return void signOut();
});
document.addEventListener('mousedown', (e) => {
  const t = e.target as Element;
  if (!t.closest('[data-contact-root]')) { const p = qs('[data-contact-popover]'); if (p && !p.classList.contains('hidden')) setContact(false); }
  if (!t.closest('[data-profile-root]')) { const p = qs('[data-profile-menu]'); if (p && !p.classList.contains('hidden')) setProfile(false); }
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { setMobile(false); setServicesOpen(false); setContact(false); setProfile(false); } });

// ---- hide-on-scroll (home) + reveal on top-edge hover --------------------------------------
let hiddenBySection = false;
let hoveringTop = false;
let raf = 0;
const applyNavState = () => { const nav = qs('[data-nav]'); if (nav) nav.dataset.hidden = String(hiddenBySection && !hoveringTop); };
const checkSection = () => {
  if (window.location.pathname !== '/') { hiddenBySection = false; return applyNavState(); }
  const grid = document.getElementById('image-grid');
  if (!grid) return;
  const rect = grid.getBoundingClientRect();
  hiddenBySection = rect.top <= 0 && rect.bottom >= 64;
  applyNavState();
};
window.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(checkSection); }, { passive: true });

if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  let mraf = 0;
  window.addEventListener('mousemove', (e) => {
    cancelAnimationFrame(mraf);
    mraf = requestAnimationFrame(() => {
      if (e.clientY <= 30) hoveringTop = true; else if (e.clientY > 120) hoveringTop = false;
      applyNavState();
    });
  });
}

const onPageLoad = () => { setServicesOpen(false); setMobile(false); setContact(false); setProfile(false); checkSection(); void syncAuth(); };
document.addEventListener('astro:page-load', onPageLoad);
onPageLoad();
