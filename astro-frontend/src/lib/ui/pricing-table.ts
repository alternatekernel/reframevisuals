// Pricing table: desktop row click opens the service page; on phones rows select by tap or scroll position and drive the sticky order button.
const root = document.querySelector<HTMLElement>('[data-pricing-table]');
if (root) {
  const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-service-id]'));
  const cta = document.querySelector<HTMLAnchorElement>('[data-pricing-order]');
  const select = (id: string) => {
    rows.forEach((r) => { r.dataset.selected = String(r.dataset.serviceId === id); });
    const row = rows.find((r) => r.dataset.serviceId === id);
    if (cta && row) {
      cta.href = `/order?serviceId=${id}`;
      const name = cta.querySelector('[data-pricing-order-name]');
      if (name) name.textContent = row.dataset.serviceName || '';
    }
  };
  root.addEventListener('click', (e) => {
    const row = (e.target as Element).closest<HTMLElement>('[data-service-id]');
    if (!row || (e.target as Element).closest('a')) return;
    if (window.innerWidth < 640) select(row.dataset.serviceId!);
    else window.location.href = `/services/${row.dataset.serviceId}`;
  });
  if (window.innerWidth < 640 && rows.length) {
    const ratios: Record<string, number> = {};
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) ratios[(en.target as HTMLElement).dataset.serviceId!] = en.isIntersecting ? en.intersectionRatio : 0;
      let best: string | null = null; let bestRatio = 0;
      for (const r of rows) { const v = ratios[r.dataset.serviceId!] || 0; if (v > bestRatio) { bestRatio = v; best = r.dataset.serviceId!; } }
      if (best) select(best);
    }, { rootMargin: '-20% 0px -35% 0px', threshold: [0.15, 0.3, 0.5, 0.7, 0.9] });
    rows.forEach((r) => io.observe(r));
  }
}

// Local-only email capture (no network call in the original either).
document.addEventListener('submit', (e) => {
  const form = (e.target as Element).closest<HTMLFormElement>('[data-local-form]');
  if (!form) return;
  e.preventDefault();
  form.classList.add('hidden');
  form.parentElement?.querySelector('[data-local-success]')?.classList.remove('hidden');
});
