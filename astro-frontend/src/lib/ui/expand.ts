// Show-all/show-less toggle: [data-expand][data-open] contains [data-expand-body] and button[data-expand-toggle] with
// [data-expand-label] (data-open-label / data-closed-label) and an optional [data-expand-chevron].
document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-expand-toggle]');
  const root = btn?.closest<HTMLElement>('[data-expand]');
  if (!btn || !root) return;
  const open = root.dataset.open !== 'true';
  if (!open) {
    const y = root.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
  root.dataset.open = String(open);
  btn.setAttribute('aria-expanded', String(open));
  const label = btn.querySelector<HTMLElement>('[data-expand-label]');
  if (label) label.textContent = open ? label.dataset.openLabel || '' : label.dataset.closedLabel || '';
});
