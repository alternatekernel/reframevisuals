// Service list behaviours: variant picker for the before/after card and the "Order Now" button on the row nearest the viewport centre.
const rows = () => Array.from(document.querySelectorAll<HTMLElement>('[data-service-detail]'));

const setPill = (detail: HTMLElement, index: number) =>
  detail.querySelectorAll<HTMLElement>('[data-ba-variant]').forEach((b) => { b.dataset.active = String(Number(b.dataset.baVariant) === index); });

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-ba-variant]');
  const detail = btn?.closest<HTMLElement>('[data-service-detail]');
  if (!btn || !detail) return;
  detail.dataset.manual = '1';
  setPill(detail, Number(btn.dataset.baVariant));
  (detail.querySelector('[data-ba]') as any)?.baSetImages?.(btn.dataset.before || '', btn.dataset.after || '');
});

// While the card autoplays, the pill follows the sequence.
document.addEventListener('ba:sequence', (e) => {
  const detail = (e.target as Element).closest<HTMLElement>('[data-service-detail]');
  if (!detail || detail.dataset.manual) return;
  const { index, length } = (e as CustomEvent).detail;
  setPill(detail, index === length - 1 ? length - 2 : index);
});

function watchRows() {
  const all = rows();
  if (!all.length || !('IntersectionObserver' in window)) return;
  const ratios = new Map<Element, number>();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) ratios.set(en.target, en.isIntersecting ? en.intersectionRatio : 0);
    let best: Element | null = null; let bestRatio = 0;
    for (const r of all) { const v = ratios.get(r) || 0; if (v > bestRatio) { bestRatio = v; best = r; } }
    all.forEach((r) => {
      const on = r === best;
      const cta = r.querySelector<HTMLElement>('[data-order-now]');
      cta?.classList.toggle('hidden', !on);
      cta?.classList.toggle('inline-flex', on);
    });
  }, { threshold: [0.2, 0.35, 0.5, 0.65, 0.8], rootMargin: '-15% 0px -15% 0px' });
  all.forEach((r) => io.observe(r));
}
watchRows();
document.addEventListener('astro:page-load', watchRows);
