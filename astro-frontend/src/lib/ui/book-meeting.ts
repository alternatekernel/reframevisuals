// /book-meeting form (vanilla port of views/BookMeetingPage.tsx): slot picker + POST /api/portal/inquiry.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function init(root: HTMLElement) {
  if (root.dataset.bmReady) return;
  root.dataset.bmReady = '1';
  const form = root.querySelector<HTMLFormElement>('[data-bm-form]')!;
  const f = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
  const slots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-bm-slot]'));
  const submit = root.querySelector<HTMLButtonElement>('[data-bm-submit]')!;
  const error = root.querySelector<HTMLElement>('[data-bm-error]')!;

  // Defaults are computed in the browser (the page itself is prerendered).
  const d = new Date(); const today = d.toISOString().slice(0, 10);
  d.setDate(d.getDate() + 1);
  f('meetingDate').min = today;
  f('meetingDate').value = d.toISOString().slice(0, 10);
  let time = '11:00';
  let busy = false;

  const valid = () => f('name').value.trim().length > 1 && EMAIL.test(f('email').value) && f('company').value.trim().length > 1 && f('message').value.trim().length > 5 && !!f('meetingDate').value && !!time;
  const render = () => {
    slots.forEach((s) => {
      const on = s.dataset.bmSlot === time;
      s.classList.toggle('bg-[var(--color-text-primary)]', on); s.classList.toggle('text-white', on); s.classList.toggle('border-transparent', on);
      s.classList.toggle('bg-white', !on); s.classList.toggle('text-black/70', !on); s.classList.toggle('border-black/[0.18]', !on); s.classList.toggle('hover:border-black/30', !on);
    });
    submit.disabled = !valid() || busy;
    submit.textContent = busy ? 'Booking...' : 'Schedule Call';
  };
  slots.forEach((s) => s.addEventListener('click', () => { time = s.dataset.bmSlot!; render(); }));
  form.addEventListener('input', render); form.addEventListener('change', render);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid()) return;
    busy = true; error.classList.add('hidden'); render();
    try {
      await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: f('email').value,
          metadata: { type: 'Meeting Request', name: f('name').value, company: f('company').value, description: f('message').value, meetingDate: f('meetingDate').value, meetingTime: time, meetingType: f('meetingType').value, requiresEmailVerification: false },
        }),
      });
      root.querySelector('[data-bm-page]')!.classList.add('hidden');
      root.querySelector('[data-bm-success]')!.classList.remove('hidden');
      window.scrollTo(0, 0);
    } catch {
      error.textContent = 'Unable to connect. Please try again.';
      error.classList.remove('hidden');
    } finally { busy = false; render(); }
  });
  render();
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-book-meeting]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
