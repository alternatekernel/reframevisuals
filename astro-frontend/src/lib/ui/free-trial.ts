// /free-trial form (vanilla port of views/FreeTrialPage.tsx). Files are uploaded straight to storage with
// uploadFilesDirect, then the form is posted to /api/portal/freetrial exactly like the React version did.
import { getGuestId, uploadFilesDirect } from '../directUpload';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fmt = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);
type Asset = { file: File; preview: string };

function init(root: HTMLElement) {
  if (root.dataset.ftReady) return;
  root.dataset.ftReady = '1';
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const form = q<HTMLFormElement>('[data-ft-form]');
  const f = (n: string) => form.elements.namedItem(n) as HTMLInputElement;
  const drop = q('[data-ft-drop]'), input = q<HTMLInputElement>('[data-ft-input]');
  const notice = q('[data-ft-notice]'), noticeText = q('[data-ft-notice-text]'), noticeList = q('[data-ft-notice-list]');
  const list = q('[data-ft-list]'), listWrap = q('[data-ft-list-wrap]'), listCount = q('[data-ft-list-count]');
  const supportDrop = q('[data-ft-support-drop]'), supportInput = q<HTMLInputElement>('[data-ft-support-input]'), supportList = q('[data-ft-support-list]');
  const fileTpl = q<HTMLTemplateElement>('[data-ft-file-tpl]'), supTpl = q<HTMLTemplateElement>('[data-ft-support-tpl]');
  const catOther = q<HTMLInputElement>('[data-ft-cat-other]'), volCustom = q<HTMLInputElement>('[data-ft-vol-custom]');
  const stage = q('[data-ft-stage]'), error = q('[data-ft-error]'), submit = q<HTMLButtonElement>('[data-ft-submit]');

  const qs = new URLSearchParams(location.search).get('email');
  if (qs) f('email').value = qs;

  let project: Asset[] = [], support: Asset[] = [], dragging = false, busy = false;
  const valid = () => project.length > 0 && f('name').value.trim() !== '' && EMAIL.test(f('email').value) && f('platform').value.trim() !== '' && f('volume').value.trim() !== '' && (f('volume').value !== 'custom' || Number(f('customVolume').value) > 0);

  const render = () => {
    catOther.classList.toggle('hidden', f('category').value !== 'Other');
    volCustom.classList.toggle('hidden', f('volume').value !== 'custom');
    for (const c of ['bg-black/[0.04]', 'border-black', 'scale-[0.99]']) drop.classList.toggle(c, dragging);
    for (const c of ['border-black/20', 'hover:border-black', 'hover:bg-black/[0.04]']) drop.classList.toggle(c, !dragging);
    list.innerHTML = '';
    project.forEach((a, i) => {
      const el = (fileTpl.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
      el.querySelector('[data-rm]')!.setAttribute('data-index', String(i));
      el.querySelector('[data-name]')!.textContent = `${a.file.name} · ${fmt(a.file.size)}`;
      list.appendChild(el);
    });
    listWrap.classList.toggle('hidden', !project.length);
    listCount.textContent = `${project.length} image${project.length === 1 ? '' : 's'} selected for upload`;
    supportList.innerHTML = '';
    support.forEach((a, i) => {
      const el = (supTpl.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
      el.querySelector('[data-rm]')!.setAttribute('data-index', String(i));
      el.querySelector('[data-name]')!.textContent = `${a.file.name} · ${fmt(a.file.size)}`;
      supportList.appendChild(el);
    });
    supportList.classList.toggle('hidden', !support.length);
    submit.disabled = !valid() || busy;
    submit.textContent = busy ? 'Submitting...' : 'Get 3 Images Edited Free';
  };
  const setNotice = (msg: string, rejected: string[]) => {
    notice.classList.toggle('hidden', !msg);
    noticeText.textContent = msg;
    noticeList.textContent = rejected.length ? `Rejected: ${rejected.join(', ')}` : '';
    noticeList.classList.toggle('hidden', !rejected.length);
  };
  const addProject = (files: File[]) => {
    const ok = files.filter((x) => x.type.startsWith('image/') && x.size <= 15 * 1024 * 1024).map((x) => ({ file: x, preview: URL.createObjectURL(x) }));
    if (!ok.length) return;
    const slots = Math.max(3 - project.length, 0);
    const accepted = ok.slice(0, slots), rejected = ok.slice(slots);
    rejected.forEach((a) => URL.revokeObjectURL(a.preview));
    setNotice(rejected.length ? 'Free sample allows up to 3 images. Extra files were not added.' : '', rejected.map((a) => a.file.name));
    project = [...project, ...accepted];
    render();
  };

  drop.addEventListener('click', () => input.click());
  drop.addEventListener('dragover', (e) => { e.preventDefault(); dragging = true; render(); });
  drop.addEventListener('dragleave', () => { dragging = false; render(); });
  drop.addEventListener('drop', (e) => { e.preventDefault(); dragging = false; if (e.dataTransfer?.files) addProject(Array.from(e.dataTransfer.files)); render(); });
  input.addEventListener('change', () => { if (input.files) addProject(Array.from(input.files)); input.value = ''; });
  supportDrop.addEventListener('click', () => supportInput.click());
  supportInput.addEventListener('change', () => {
    if (supportInput.files) support = [...support, ...Array.from(supportInput.files).filter((x) => x.size <= 25 * 1024 * 1024).map((x) => ({ file: x, preview: URL.createObjectURL(x) }))];
    supportInput.value = ''; render();
  });
  list.addEventListener('click', (e) => {
    const rm = (e.target as Element).closest<HTMLElement>('[data-rm]'); if (!rm) return;
    const i = Number(rm.dataset.index); URL.revokeObjectURL(project[i].preview); project.splice(i, 1);
    if (project.length < 3) setNotice('', []);
    render();
  });
  supportList.addEventListener('click', (e) => {
    const rm = (e.target as Element).closest<HTMLElement>('[data-rm]'); if (!rm) return;
    const i = Number(rm.dataset.index); URL.revokeObjectURL(support[i].preview); support.splice(i, 1); render();
  });
  form.addEventListener('input', () => {
    if (f('volume').value !== 'custom') f('customVolume').value = '';
    render();
  });
  form.addEventListener('change', render);

  const stageMsg = { uploading: ['bg-blue-50 text-blue-700 border-blue-100', 'Uploading selected images...'], done: ['bg-green-50 text-green-700 border-green-100', 'Upload done. Your sample request has been received.'], error: ['bg-red-50 text-red-600 border-red-100', 'Upload could not be completed. Please review the error below.'] } as const;
  const setStage = (s: 'idle' | keyof typeof stageMsg) => {
    stage.classList.toggle('hidden', s === 'idle');
    if (s === 'idle') return;
    stage.className = `p-3.5 rounded-xl border text-[14px] font-semibold ${stageMsg[s][0]}`;
    stage.textContent = stageMsg[s][1];
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid() || busy) return;
    busy = true; error.classList.add('hidden'); setStage('uploading'); render();
    try {
      const body = new FormData();
      const category = f('category').value === 'Other' ? f('customCategory').value.trim() : f('category').value.trim();
      const serviceType = f('serviceType').value.trim();
      const cat = category;
      const servicesText = cat && serviceType ? `${cat} — ${serviceType}` : cat ? `Category: ${cat}` : serviceType ? `Service: ${serviceType}` : '';
      const volume = f('volume').value === 'custom' ? `Custom: ${f('customVolume').value} images/month` : f('volume').value;
      body.append('name', f('name').value);
      body.append('email', f('email').value);
      body.append('category', category);
      body.append('volume', volume);
      body.append('serviceType', f('serviceType').value || 'Not provided');
      body.append('description', [
        f('description').value,
        `Services requested: ${servicesText || 'Not provided'}`,
        `Target platform: ${f('platform').value || 'Not provided'}`,
        `Estimated monthly volume: ${volume || 'Not provided'}`,
        `Paid project timeline: ${'Not provided'}`,
      ].filter(Boolean).join('\n\n'));
      const guestId = getGuestId();
      const uploaded = await uploadFilesDirect('/api/portal/upload', project.map((a) => a.file), guestId);
      body.append('guestId', guestId);
      body.append('uploadedFiles', JSON.stringify(uploaded));
      const res = await fetch('/api/portal/freetrial', { method: 'POST', body });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const result = isJson ? await res.json() : null;
      if (!res.ok) { const t = !isJson ? await res.text() : ''; throw new Error(result?.message || t || `Submission failed (${res.status})`); }
      if (result?.success && result?.token) {
        localStorage.setItem('portal_token', result.token);
        localStorage.setItem('portal_user', JSON.stringify(result.user));
        localStorage.setItem('reframe_cs_welcome_trigger', 'true');
        setStage('done');
        document.dispatchEvent(new CustomEvent('ft:success'));
        return;
      }
      throw new Error(result?.message || 'Submission failed');
    } catch (err: any) {
      console.error('Failed to submit free trial:', err);
      setStage('error');
      error.textContent = err?.message || 'Unable to submit your free trial. Please try again or email us.';
      error.classList.remove('hidden');
    } finally { busy = false; render(); }
  });
  render();
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-free-trial]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
