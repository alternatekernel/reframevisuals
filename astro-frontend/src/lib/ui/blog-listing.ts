// Blog listing: live search (debounced, replaces history), sort select, "Load more", reading history, admin edit links.
const HISTORY_KEY = 'reframe_blog_history';

function init(root: HTMLElement) {
  if (root.dataset.blReady) return;
  root.dataset.blReady = '1';

  const form = root.querySelector<HTMLFormElement>('[data-blog-form]');
  const search = root.querySelector<HTMLInputElement>('[data-blog-search]');
  const sort = root.querySelector<HTMLSelectElement>('[data-blog-sort]');
  const go = () => {
    if (!form) return;
    const params = new URLSearchParams(new FormData(form) as any);
    for (const [k, v] of Array.from(params.entries())) if (!v || (k === 'sort' && v === 'latest')) params.delete(k);
    const qs = params.toString();
    location.replace(qs ? `/blog?${qs}` : '/blog');
  };
  let t = 0;
  search?.addEventListener('input', () => { clearTimeout(t); t = window.setTimeout(go, 350); });
  sort?.addEventListener('change', go);
  form?.addEventListener('submit', (e) => { e.preventDefault(); go(); });
  if (search && new URLSearchParams(location.search).has('q')) { search.focus(); search.setSelectionRange(search.value.length, search.value.length); }

  root.querySelectorAll<HTMLElement>('[data-load-more]').forEach((box) => {
    const btn = box.querySelector<HTMLElement>('[data-load-more-btn]');
    const step = Number(box.dataset.step) || 8;
    btn?.addEventListener('click', () => {
      const hidden = Array.from(box.querySelectorAll<HTMLElement>('[data-load-item].hidden'));
      hidden.slice(0, step).forEach((el) => el.classList.remove('hidden'));
      if (hidden.length <= step) btn.parentElement?.classList.add('hidden');
    });
  });

  try {
    const user = JSON.parse(localStorage.getItem('reframe-current-user') || 'null');
    if (user?.email?.toLowerCase() === 'admin@reframevisuals.com') root.querySelectorAll('[data-admin-only]').forEach((e) => e.classList.remove('hidden'));
  } catch { /* ignore */ }

  const hist = root.querySelector<HTMLElement>('[data-reading-history]');
  if (hist) {
    try {
      const posts: { slug: string; title: string }[] = JSON.parse(hist.dataset.posts || '[]');
      const slugs: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      const found = slugs.map((s) => posts.find((p) => p.slug === s)).filter(Boolean).slice(0, 3) as { slug: string; title: string }[];
      if (found.length) {
        const list = hist.querySelector<HTMLElement>('[data-history-list]')!;
        found.forEach((p) => { const a = document.createElement('a'); a.href = `/blog/${p.slug}`; a.className = 'block text-[14px] text-black/70 hover:text-black'; a.textContent = p.title; list.appendChild(a); });
        list.classList.remove('hidden');
        hist.querySelector('[data-history-empty]')?.classList.add('hidden');
      }
    } catch { /* ignore */ }
  }
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-blog-listing]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
