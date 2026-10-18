// Testimonials marquee: appends aria-hidden clones for a seamless loop (skipped for crawlers), restores visitor-added
// testimonials from localStorage, and runs the "Share your experience" modal (posts to /api/portal/feedback).
import { highlightHtml } from '../testimonialText';

const BOT = /bot|crawler|spider|crawling|slurp|bingpreview|lighthouse|pagespeed|headless|facebookexternalhit|whatsapp|linkedinbot|twitterbot|discordbot|google-read-aloud/i;
const STORE = 'reframe_custom_testimonials';
type Item = { name: string; company: string; quote: string; metric?: string };

function init(root: HTMLElement) {
  if (root.dataset.tReady) return;
  root.dataset.tReady = '1';
  const track = root.querySelector<HTMLElement>('[data-t-track]')!;
  const tpl = root.querySelector<HTMLTemplateElement>('[data-t-tpl]')!;
  const modal = root.querySelector<HTMLElement>('[data-t-modal]')!;
  const form = root.querySelector<HTMLFormElement>('[data-t-form]')!;
  const count = root.querySelector<HTMLElement>('[data-t-count]')!;

  const card = (item: Item): HTMLElement => {
    const el = (tpl.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
    el.querySelector('[data-t-quote]')!.innerHTML = highlightHtml(item.quote);
    el.querySelector('[data-t-name]')!.textContent = item.name;
    el.querySelector('[data-t-company]')!.textContent = item.company;
    el.querySelector('[data-t-initials]')!.textContent = item.name.split(' ').map((n) => n[0]).join('').slice(0, 2);
    const metric = el.querySelector('[data-t-metric]');
    if (item.metric) { if (metric) metric.textContent = item.metric; } else el.querySelector('[data-t-metric-wrap]')?.remove();
    el.querySelector('[data-t-username]')?.remove();
    const verified = item.company.includes(',') || item.company.toLowerCase().includes(' at ');
    if (!verified) el.querySelector('[data-t-verified]')?.remove();
    return el;
  };

  let custom: Item[] = [];
  try { const saved = JSON.parse(localStorage.getItem(STORE) || '[]'); if (Array.isArray(saved)) custom = saved; } catch { /* ignore */ }
  custom.slice().reverse().forEach((item) => track.prepend(card(item)));

  if (!BOT.test(navigator.userAgent || '')) {
    const base = Array.from(track.children) as HTMLElement[];
    for (let i = 0; i < 2; i++) base.forEach((n) => { const c = n.cloneNode(true) as HTMLElement; c.setAttribute('aria-hidden', 'true'); track.appendChild(c); });
  }

  const open = () => {
    try { const u = JSON.parse(localStorage.getItem('reframe-current-user') || 'null'); const e = form.elements.namedItem('email') as HTMLInputElement; if (u?.email && !e.value) e.value = u.email; } catch { /* ignore */ }
    modal.classList.remove('hidden');
  };
  const close = () => modal.classList.add('hidden');
  root.addEventListener('click', (e) => {
    const t = e.target as Element;
    if (t.closest('[data-t-open]')) open();
    else if (t.closest('[data-t-close]')) close();
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.classList.contains('hidden')) close(); });
  (form.elements.namedItem('quote') as HTMLTextAreaElement).addEventListener('input', (e) => { count.textContent = String((e.target as HTMLTextAreaElement).value.length); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(form);
    const get = (k: string) => String(f.get(k) || '').trim();
    if (!get('name') || !get('company') || !get('quote') || !get('email')) return;
    const item: Item = { name: get('name'), company: get('company'), quote: get('quote'), metric: get('metric') || undefined };
    custom = [item, ...custom];
    try { localStorage.setItem(STORE, JSON.stringify(custom)); } catch { /* ignore */ }
    track.prepend(card(item));
    close();
    form.reset();
    count.textContent = '0';
    try {
      const message = [`Name: ${item.name}`, `Company/Role: ${item.company}`, `Quote: "${item.quote}"`, item.metric ? `Impact Metric: ${item.metric}` : ''].filter(Boolean).join('\n');
      const token = localStorage.getItem('reframe-token');
      await fetch('/api/portal/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ type: 'testimonial', subject: `New Testimonial from ${item.name}`, message, email: get('email') }),
      });
    } catch (err) { console.error('Failed to submit testimonial to notifications:', err); }
  });
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-testimonials]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
