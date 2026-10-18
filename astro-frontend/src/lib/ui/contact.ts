// /contact form (vanilla port of views/ContactPage.tsx): inline validation + POST /api/portal/inquiry.
function init(root: HTMLElement) {
  if (root.dataset.cReady) return;
  root.dataset.cReady = '1';
  const form = root.querySelector<HTMLFormElement>('[data-cform-form]')!;
  const f = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
  const error = root.querySelector<HTMLElement>('[data-cform-error]')!;
  const submit = root.querySelector<HTMLButtonElement>('[data-cform-submit]')!;
  const showError = (m: string) => { error.textContent = m; error.classList.toggle('hidden', !m); form.setAttribute('aria-describedby', m ? 'contact-form-error' : ''); };
  form.addEventListener('input', () => { if (!error.classList.contains('hidden')) showError(''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = { name: f('name').value.trim(), email: f('email').value.trim(), company: f('company').value.trim(), message: f('message').value.trim() };
    const invalid = v.name.length < 2 ? 'Please enter your name.' : !/^\S+@\S+\.\S+$/.test(v.email) ? 'Please enter a valid work email.' : v.message.length < 10 ? 'Please add a short message.' : '';
    if (invalid) { showError(invalid); return; }
    submit.disabled = true; submit.textContent = 'Sending...'; showError('');
    try {
      const res = await fetch('/api/portal/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: v.email, metadata: { type: 'Contact Page', name: v.name, email: v.email, company: v.company, message: v.message } }),
      });
      if (!res.ok) throw new Error('failed');
      root.querySelector('[data-cform-email]')!.textContent = v.email;
      form.classList.add('hidden');
      root.querySelector('[data-cform-done]')!.classList.remove('hidden');
      form.reset();
    } catch {
      showError('Could not send your message. Email hello@reframevisuals.com directly.');
    } finally { submit.disabled = false; submit.textContent = 'Send Message'; }
  });
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-cform]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
