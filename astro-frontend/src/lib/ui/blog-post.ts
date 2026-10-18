// Blog post reader tools (vanilla port of the interactive parts of views/BlogPostPage.tsx): progress bar, minutes left,
// table-of-contents highlight, reader prefs, save / share / copy-heading, reading history, newsletter form.
import { getReaderPrefs, getSavedSlugs, pushReadingHistory, setReaderPrefs, toggleSavedSlug, type ReaderPrefs } from '../../utils/blog';

function init(root: HTMLElement) {
  if (root.dataset.bpReady) return;
  root.dataset.bpReady = '1';
  const slug = root.dataset.slug!;
  const minutes = Number(root.dataset.minutes) || 1;
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s);
  const bar = q('[data-progress]')!, remaining = q('[data-remaining]'), toast = q('[data-toast]')!, cont = q('[data-continue]');

  let toastTimer = 0;
  const say = (msg: string) => { toast.textContent = msg; toast.classList.remove('hidden'); clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.add('hidden'), 2200); };

  // reader prefs
  let prefs: ReaderPrefs = getReaderPrefs();
  const applyPrefs = () => {
    root.dataset.fs = prefs.fontSize; root.dataset.lh = prefs.lineHeight;
    root.querySelectorAll<HTMLElement>('[data-fs-btn]').forEach((b) => (b.dataset.active = String(b.dataset.fsBtn === prefs.fontSize)));
    root.querySelectorAll<HTMLElement>('[data-lh-btn]').forEach((b) => (b.dataset.active = String(b.dataset.lhBtn === prefs.lineHeight)));
  };
  applyPrefs(); setReaderPrefs(prefs);
  root.querySelectorAll<HTMLElement>('[data-fs-btn]').forEach((b) => b.addEventListener('click', () => { prefs = { ...prefs, fontSize: b.dataset.fsBtn as any }; setReaderPrefs(prefs); applyPrefs(); }));
  root.querySelectorAll<HTMLElement>('[data-lh-btn]').forEach((b) => b.addEventListener('click', () => { prefs = { ...prefs, lineHeight: b.dataset.lhBtn as any }; setReaderPrefs(prefs); applyPrefs(); }));

  // history + saved
  pushReadingHistory(slug);
  const syncSaved = () => { const on = getSavedSlugs().includes(slug); q('[data-save-on]')?.classList.toggle('hidden', !on); q('[data-save-off]')?.classList.toggle('hidden', on); };
  syncSaved();
  q('[data-save]')?.addEventListener('click', () => { const next = toggleSavedSlug(slug); syncSaved(); say(next.includes(slug) ? 'Article saved.' : 'Article removed from saved.'); });
  q('[data-share]')?.addEventListener('click', async () => {
    const url = location.href;
    try {
      if (navigator.share) { await navigator.share({ title: root.dataset.title, url }); say('Share dialog opened.'); return; }
      await navigator.clipboard.writeText(url); say('Link copied to clipboard.');
    } catch { say('Could not share automatically. Please copy the URL manually.'); }
  });
  root.addEventListener('click', async (e) => {
    const btn = (e.target as Element).closest<HTMLElement>('[data-copy-heading]');
    if (!btn) return;
    try { await navigator.clipboard.writeText(`${location.origin}/blog/${slug}#${btn.dataset.copyHeading}`); say('Heading link copied.'); }
    catch { say('Could not copy link. Please copy manually from address bar.'); }
  });

  // progress
  const onScroll = () => {
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0;
    (bar as HTMLElement).style.width = `${pct}%`;
    if (remaining) remaining.textContent = String(Math.max(1, Math.round(minutes * (1 - pct / 100))));
    cont?.classList.toggle('hidden', !(pct > 60));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // toc highlight
  const links = Array.from(root.querySelectorAll<HTMLElement>('[data-toc]'));
  const nodes = links.map((l) => document.getElementById(l.dataset.toc!)).filter(Boolean) as HTMLElement[];
  if (nodes.length) {
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible[0]) { const id = (visible[0].target as HTMLElement).id; links.forEach((l) => l.classList.toggle('is-active', l.dataset.toc === id)); }
    }, { rootMargin: '-20% 0px -60% 0px', threshold: [0, 1] });
    nodes.forEach((n) => io.observe(n));
  }

  // feedback (local UI only, as in the original)
  root.querySelectorAll<HTMLElement>('[data-fb]').forEach((b) => b.addEventListener('click', () => root.querySelectorAll<HTMLElement>('[data-fb]').forEach((x) => (x.dataset.active = String(x === b)))));

  // ?sub= toast
  const sub = new URLSearchParams(location.search).get('sub');
  const msgs: Record<string, string> = { confirmed: "Subscription confirmed! You'll receive future posts.", unsubscribed: "You've been unsubscribed.", invalid: 'That confirmation link is no longer valid.' };
  if (sub && msgs[sub]) say(msgs[sub]);

  // newsletter
  const form = q<HTMLFormElement>('[data-sub-form]');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    if (!email) return;
    const btn = q<HTMLButtonElement>('[data-sub-btn]')!; btn.disabled = true; btn.textContent = '…';
    const err = q('[data-sub-error]')!; err.classList.add('hidden');
    try {
      const base = (import.meta.env.VITE_API_URL as string | undefined) || '';
      const res = await fetch(`${base}/api/blog/subscribe`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await res.json();
      const ok = q('[data-sub-ok]')!; ok.textContent = data.message || 'Check your inbox to confirm.'; ok.classList.remove('hidden'); form.classList.add('hidden');
    } catch {
      err.textContent = 'Something went wrong. Please try again.'; err.classList.remove('hidden'); btn.disabled = false; btn.textContent = 'Subscribe';
    }
  });
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-blog-post]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
