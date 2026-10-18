// /quote-builder estimator + request form (vanilla port of views/QuoteBuilderPage.tsx).
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const money = (n: number) => `$${n.toFixed(2)}`;

function init(root: HTMLElement) {
  if (root.dataset.qReady) return;
  root.dataset.qReady = '1';
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const buttons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-q-service]'));
  const volume = q<HTMLInputElement>('[data-q-volume]'), turnaround = q<HTMLSelectElement>('[data-q-turnaround]');
  const name = q<HTMLInputElement>('[data-q-name-field]'), company = q<HTMLInputElement>('[data-q-company]'), email = q<HTMLInputElement>('[data-q-email]');
  const submit = q<HTMLButtonElement>('[data-q-submit]'), error = q('[data-q-error]');
  const form = q<HTMLFormElement>('[data-q-form]'), done = q('[data-q-done]');
  let selected = new Set<string>(['bg-removal']);
  let vol = 100, busy = false;

  const calc = () => {
    const base = buttons.filter((b) => selected.has(b.dataset.qService!)).reduce((s, b) => s + Number(b.dataset.price), 0);
    const raw = base * vol;
    const pct = vol >= 2000 ? 30 : vol >= 500 ? 20 : vol >= 100 ? 10 : 0;
    const discount = raw * (pct / 100);
    const mult = turnaround.value === '12' ? 1.5 : turnaround.value === '24' ? 1.25 : 1;
    return { base, pct, discount, mult, total: (raw - discount) * mult };
  };
  const valid = () => name.value.trim().length > 1 && EMAIL.test(email.value) && company.value.trim().length > 1;
  const render = () => {
    buttons.forEach((b) => {
      const on = selected.has(b.dataset.qService!);
      for (const c of ['bg-black', 'text-white', 'border-transparent']) b.classList.toggle(c, on);
      for (const c of ['bg-[var(--color-bg-secondary)]', 'border-black/[0.18]', 'text-black/70', 'hover:border-black/30']) b.classList.toggle(c, !on);
      const p = b.querySelector('[data-q-price]')!; p.classList.toggle('text-white/60', on); p.classList.toggle('text-black/40', !on);
    });
    const c = calc();
    q('[data-q-discount-note]').classList.toggle('hidden', c.pct === 0);
    q('[data-q-discount-pct]').textContent = String(c.pct);
    q('[data-q-rate]').textContent = money(c.base);
    q('[data-q-discount-row]').classList.toggle('hidden', c.pct === 0);
    q('[data-q-discount-label]').textContent = `Volume discount (${c.pct}%)`;
    q('[data-q-discount-amt]').textContent = `-${money(c.discount / vol)} /ea`;
    q('[data-q-turn-row]').classList.toggle('hidden', !(c.mult > 1));
    q('[data-q-turn-label]').textContent = `Turnaround fee (+${Math.round((c.mult - 1) * 100)}%)`;
    q('[data-q-turn-mult]').textContent = `x${c.mult}`;
    q('[data-q-total]').textContent = money(c.total);
    submit.disabled = busy || !valid();
    submit.textContent = busy ? 'Requesting...' : 'Request this Quote';
  };
  buttons.forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.qService!;
    if (selected.has(id)) { if (selected.size > 1) selected.delete(id); } else selected.add(id);
    render();
  }));
  volume.addEventListener('input', () => { vol = Math.max(1, parseInt(volume.value) || 0); render(); });
  [turnaround, name, company, email].forEach((el) => { el.addEventListener('input', render); el.addEventListener('change', render); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid()) return;
    busy = true; error.classList.add('hidden'); render();
    const c = calc();
    const names = buttons.filter((b) => selected.has(b.dataset.qService!)).map((b) => b.dataset.qName).join(', ');
    const message = `Quote Details:\n- Services: ${names}\n- Image Volume: ${vol} images\n- Turnaround SLA: ${turnaround.value}h\n- Estimated Total: $${c.total.toFixed(2)}`;
    try {
      const res = await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.value.trim(), metadata: { type: 'Quote Builder Request', name: name.value.trim(), email: email.value.trim(), company: company.value.trim(), message } }),
      });
      if (!res.ok) throw new Error('Quote request submission failed');
      q('[data-q-done-email]').textContent = email.value;
      q('[data-q-intro]').classList.add('hidden');
      form.classList.add('hidden'); done.classList.remove('hidden');
    } catch {
      error.textContent = 'Unable to send quote request. Please email hello@reframevisuals.com.';
      error.classList.remove('hidden');
    } finally { busy = false; render(); }
  });
  root.querySelector('[data-q-again]')?.addEventListener('click', () => { done.classList.add('hidden'); form.classList.remove('hidden'); q('[data-q-intro]').classList.remove('hidden'); });
  render();
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-quote-builder]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
