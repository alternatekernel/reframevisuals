// Tiny delegated behaviors that replace React handlers in server-rendered shell components.
const loggedIn = () => {
  try { return Boolean(localStorage.getItem('portal_token') || localStorage.getItem('reframe-current-user')); } catch { return false; }
};

function syncAuthCtas() {
  if (!loggedIn()) return;
  document.querySelectorAll<HTMLAnchorElement>('[data-auth-cta]').forEach((a) => {
    a.href = '/dashboard?view=new-project';
    const label = a.querySelector('[data-auth-cta-label]');
    if (label) label.textContent = 'Start New Job';
    a.setAttribute('aria-label', 'Start New Job');
  });
}

document.addEventListener('click', (e) => {
  const target = e.target as Element | null;
  const chat = target?.closest('[data-open-chat]');
  if (chat) {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('reframe-cs:open'));
    return;
  }
  const logo = target?.closest('[data-logo-home]');
  if (logo && window.location.pathname === '/') {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

syncAuthCtas();
document.addEventListener('astro:page-load', syncAuthCtas);
import './ui/forms';
