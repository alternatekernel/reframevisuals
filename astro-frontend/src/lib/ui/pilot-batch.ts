// /pilot-batch form (vanilla port of views/PilotBatchPage.tsx).
import { getApiEndpoint } from '../apiConfig';
import { getGuestId, uploadFilesDirect } from '../directUpload';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fmt = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);
const token = () => { const t = localStorage.getItem('portal_token'); return t && t !== 'null' ? t : null; };

function init(root: HTMLElement) {
  if (root.dataset.pbReady) return;
  root.dataset.pbReady = '1';
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const authed = Boolean(token());
  root.querySelectorAll<HTMLElement>('[data-guest-only]').forEach((e) => e.classList.toggle('hidden', authed));
  root.querySelectorAll<HTMLElement>('[data-authed-only]').forEach((e) => e.classList.toggle('hidden', !authed));
  document.querySelectorAll<HTMLElement>('[data-pb-nav]').forEach((b) => b.addEventListener('click', () => (window.location.href = b.dataset.pbNav!)));

  const service = q<HTMLSelectElement>('[data-pb-service]'), format = q<HTMLSelectElement>('[data-pb-format]'), customFormat = q<HTMLInputElement>('[data-pb-custom-format]');
  const notes = q<HTMLTextAreaElement>('[data-pb-notes]'), email = q<HTMLInputElement>('[data-pb-email]');
  const mainInput = q<HTMLInputElement>('[data-pb-main-input]'), supInput = q<HTMLInputElement>('[data-pb-support-input]');
  const mainList = q('[data-pb-main-list]'), supList = q('[data-pb-support-list]');
  const tpl = q<HTMLTemplateElement>('[data-pb-tpl]'), supTpl = q<HTMLTemplateElement>('[data-pb-support-tpl]');
  const error = q('[data-pb-error]'), submit = q<HTMLButtonElement>('[data-pb-submit]');
  let main: File[] = [], support: File[] = [], busy = false;

  const finalFormat = () => (format.value === 'Other' ? customFormat.value.trim() : format.value);
  const can = () => main.length > 0 && !!service.value && !!finalFormat() && (authed || EMAIL.test(email.value.trim()));
  const fill = (host: HTMLElement, t: HTMLTemplateElement, files: File[]) => {
    host.innerHTML = '';
    files.forEach((f, i) => {
      const el = (t.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
      el.querySelector('[data-rm]')!.setAttribute('data-index', String(i));
      el.querySelector('[data-name]')!.textContent = `${f.name} · ${fmt(f.size)}`;
      host.appendChild(el);
    });
    host.classList.toggle('hidden', !files.length);
  };
  const render = () => {
    customFormat.classList.toggle('hidden', format.value !== 'Other');
    fill(mainList, tpl, main); fill(supList, supTpl, support);
    submit.disabled = !can() || busy;
    submit.textContent = busy ? 'Uploading…' : 'Submit Test Batch for Review';
  };
  q('[data-pb-main-btn]').addEventListener('click', () => mainInput.click());
  q('[data-pb-support-btn]').addEventListener('click', () => supInput.click());
  mainInput.addEventListener('change', () => { main = [...main, ...Array.from(mainInput.files || []).slice(0, Math.max(15 - main.length, 0))]; mainInput.value = ''; render(); });
  supInput.addEventListener('change', () => { support = [...support, ...Array.from(supInput.files || [])]; supInput.value = ''; render(); });
  mainList.addEventListener('click', (e) => { const r = (e.target as Element).closest<HTMLElement>('[data-rm]'); if (r) { main.splice(Number(r.dataset.index), 1); render(); } });
  supList.addEventListener('click', (e) => { const r = (e.target as Element).closest<HTMLElement>('[data-rm]'); if (r) { support.splice(Number(r.dataset.index), 1); render(); } });
  [service, format, customFormat, notes, email].forEach((el) => { el.addEventListener('input', render); el.addEventListener('change', render); });

  submit.addEventListener('click', async () => {
    if (!can() || busy) return;
    error.classList.add('hidden'); busy = true; render();
    try {
      const body = new FormData();
      body.append('service', service.value);
      body.append('outputFormat', finalFormat());
      body.append('instructions', notes.value);
      if (!authed) body.append('email', email.value.trim());
      const guestId = getGuestId();
      const endpoint = getApiEndpoint('/portal/upload');
      const mainUploads = await uploadFilesDirect(endpoint, main, guestId);
      const supportUploads = await uploadFilesDirect(endpoint, support, guestId, 'support');
      body.append('guestId', guestId);
      body.append('mainUploads', JSON.stringify(mainUploads));
      body.append('supportUploads', JSON.stringify(supportUploads));
      const t = token();
      const res = await fetch(getApiEndpoint('/portal/pilot-batch'), { method: 'POST', headers: t ? { Authorization: `Bearer ${t}` } : {}, body });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Submission failed. Please try again.');
      if (data.token) { localStorage.setItem('portal_token', data.token); if (data.user) localStorage.setItem('customer_name', data.user.name); }
      q('[data-pb-code]').textContent = data.orderCode;
      q('[data-pb-who]').textContent = authed ? 'your account email' : email.value;
      q('[data-pb-form]').classList.add('hidden');
      q('[data-pb-done]').classList.remove('hidden');
      window.scrollTo(0, 0);
    } catch (err: any) {
      error.textContent = err.message || 'Something went wrong. Please try again.';
      error.classList.remove('hidden');
    } finally { busy = false; render(); }
  });
  render();
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-pilot-batch]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
