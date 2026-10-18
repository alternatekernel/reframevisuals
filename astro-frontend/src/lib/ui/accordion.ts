// Accordion: [data-acc-group] > [data-acc-item][data-open] > button[data-acc-toggle] + [data-acc-panel].
// A group is single-open unless data-acc-group="multi".
const setOpen = (item: HTMLElement, open: boolean) => {
  item.dataset.open = String(open);
  item.querySelector('[data-acc-toggle]')?.setAttribute('aria-expanded', String(open));
};

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest<HTMLElement>('[data-acc-toggle]');
  if (!btn) return;
  const item = btn.closest<HTMLElement>('[data-acc-item]');
  if (!item) return;
  const open = item.dataset.open !== 'true';
  const group = item.closest<HTMLElement>('[data-acc-group]');
  if (open && group && group.dataset.accGroup !== 'multi') {
    group.querySelectorAll<HTMLElement>('[data-acc-item][data-open="true"]').forEach((i) => i !== item && setOpen(i, false));
  }
  setOpen(item, open);
});
