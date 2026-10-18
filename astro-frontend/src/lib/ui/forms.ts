// Quick-inquiry forms: [data-inquiry] holds an email input + submit button and posts JSON to /api/portal/inquiry.
// Markup contract: [data-inquiry-form] (visible until success), [data-inquiry-input], [data-inquiry-submit] with
// [data-inquiry-label], [data-inquiry-success] (hidden until success). Metadata comes from data-type / data-source.
async function submitInquiry(root: HTMLElement) {
  const input = root.querySelector<HTMLInputElement>('[data-inquiry-input]');
  const btn = root.querySelector<HTMLButtonElement>('[data-inquiry-submit]');
  const label = root.querySelector<HTMLElement>('[data-inquiry-label]');
  const email = input?.value?.trim();
  if (!email || !email.includes('@') || !btn) return;
  const idle = label?.textContent ?? '';
  btn.disabled = true;
  if (label) label.textContent = '...';
  try {
    await fetch('/api/portal/inquiry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, metadata: { type: root.dataset.type, source: root.dataset.source } }),
    });
    root.querySelector('[data-inquiry-form]')?.classList.add('hidden');
    root.querySelector('[data-inquiry-success]')?.classList.remove('hidden');
  } catch {
    btn.disabled = false;
    if (label) label.textContent = idle;
  }
}

document.addEventListener('click', (e) => {
  const btn = (e.target as Element).closest('[data-inquiry-submit]');
  const root = btn?.closest<HTMLElement>('[data-inquiry]');
  if (root) void submitInquiry(root);
});
