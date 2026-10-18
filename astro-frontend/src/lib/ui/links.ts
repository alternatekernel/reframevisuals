// Whole-card links: an element with data-href navigates on click unless the click was on a real link/button inside it.
document.addEventListener('click', (e) => {
  const t = e.target as Element;
  if (t.closest('a, button, input, select, textarea, label')) return;
  const card = t.closest<HTMLElement>('[data-href]');
  if (card?.dataset.href) window.location.href = card.dataset.href;
});
