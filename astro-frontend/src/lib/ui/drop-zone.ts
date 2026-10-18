// Home page instant free-trial drop zone (vanilla port of sections/landing/InstantDropZone.tsx).
// Posts multipart form data to /api/portal/freetrial exactly like the React version.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_FILES = 3;
const MAX_SIZE = 15 * 1024 * 1024;
type Asset = { file: File; preview: string };

const fmt = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / (1024 * 1024)).toFixed(1)} MB`);

function init(root: HTMLElement) {
  if (root.dataset.dzReady) return;
  root.dataset.dzReady = '1';
  const q = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s)!;
  const qo = <T extends HTMLElement = HTMLElement>(s: string) => root.querySelector<T>(s) as T;
  const area = q('[data-dz-area]'), empty = q('[data-dz-empty]'), files = q('[data-dz-files]'), grid = q('[data-dz-grid]');
  const addBtn = q('[data-dz-add]'), thumb = q<HTMLTemplateElement>('[data-dz-thumb]'), input = q<HTMLInputElement>('[data-dz-input]');
  const notice = q('[data-dz-notice]'), noticeText = q('[data-dz-notice-text]'), noticeList = q('[data-dz-notice-list]');
  const form = q<HTMLFormElement>('[data-dz-form]'), formView = qo('[data-dz-view]'), success = qo('[data-dz-success]');
  const name = q<HTMLInputElement>('[data-dz-name]'), email = q<HTMLInputElement>('[data-dz-email]');
  const instr = q<HTMLTextAreaElement>('[data-dz-instructions]'), link = q<HTMLInputElement>('[data-dz-link]');
  const submit = q<HTMLButtonElement>('[data-dz-submit]'), submitLabel = q('[data-dz-submit-label]'), submitArrow = q('[data-dz-submit-arrow]');
  const progress = q('[data-dz-progress]'), error = q('[data-dz-error]'), dragIcon = q('[data-dz-icon]'), dragText = q('[data-dz-drag-text]');
  const count = qo('[data-dz-count]');

  let assets: Asset[] = [];
  let dragging = false, busy = false;

  const valid = () => assets.length > 0 && name.value.trim() !== '' && EMAIL.test(email.value);
  const cls = (v: string | undefined) => (v || '').split(/\s+/).filter(Boolean);
  const render = () => {
    const has = assets.length > 0;
    empty.classList.toggle('hidden', has);
    files.classList.toggle('hidden', !has);
    form.classList.toggle('hidden', !has);
    cls(area.dataset.dzIdle).forEach((c) => area.classList.toggle(c, !has));
    cls(area.dataset.dzOn).forEach((c) => area.classList.toggle(c, dragging));
    cls(area.dataset.dzOff).forEach((c) => area.classList.toggle(c, !dragging));
    cls(dragIcon.dataset.dzOn).forEach((c) => dragIcon.classList.toggle(c, dragging));
    cls(dragIcon.dataset.dzOff).forEach((c) => dragIcon.classList.toggle(c, !dragging));
    dragText.textContent = dragging ? 'Release to add your images' : 'Drag up to 3 images here';
    grid.querySelectorAll('[data-dz-item]').forEach((n) => n.remove());
    assets.forEach((a, i) => {
      const el = (thumb.content.cloneNode(true) as DocumentFragment).firstElementChild as HTMLElement;
      el.dataset.dzItem = String(i);
      const img = el.querySelector('img')!; img.src = a.preview; img.alt = a.file.name;
      el.querySelector('[data-dz-remove]')!.setAttribute('aria-label', `Remove ${a.file.name}`);
      el.querySelector('[data-dz-remove]')!.setAttribute('data-index', String(i));
      el.querySelector('[data-dz-meta]')!.textContent = `${a.file.name} · ${fmt(a.file.size)}`;
      grid.insertBefore(el, addBtn);
    });
    addBtn.classList.toggle('hidden', assets.length >= MAX_FILES);
    const left = MAX_FILES - assets.length;
    q('[data-dz-left]').textContent = `${left} slot${left === 1 ? '' : 's'} left`;
    submit.disabled = !valid() || busy;
    submitLabel.textContent = busy ? 'Uploading...' : 'Get my free edits';
    submitArrow.classList.toggle('hidden', busy);
  };

  const showNotice = (msg: string, rejected: string[]) => {
    notice.classList.toggle('hidden', !msg);
    noticeText.textContent = msg;
    noticeList.textContent = rejected.length ? `Not added: ${rejected.join(', ')}` : '';
    noticeList.classList.toggle('hidden', rejected.length === 0);
  };

  const addFiles = (list: File[]) => {
    if (!list.length) return;
    const ok = list.filter((f) => f.type.startsWith('image/') && f.size <= MAX_SIZE);
    const bad = list.filter((f) => !(f.type.startsWith('image/') && f.size <= MAX_SIZE));
    const incoming = ok.map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
    const slots = Math.max(MAX_FILES - assets.length, 0);
    const accepted = incoming.slice(0, slots);
    const overflow = incoming.slice(slots);
    overflow.forEach((a) => URL.revokeObjectURL(a.preview));
    const rejected = [...bad.map((f) => f.name), ...overflow.map((a) => a.file.name)];
    if (overflow.length && bad.length) showNotice('Free sample allows up to 3 images (max 15MB each, image files only). Some files were not added.', rejected);
    else if (overflow.length) showNotice('Free sample allows up to 3 images. Extra files were not added.', rejected);
    else if (bad.length) showNotice('Only image files up to 15MB are accepted. Some files were not added.', rejected);
    else showNotice('', []);
    const hadFiles = assets.length > 0;
    assets = [...assets, ...accepted];
    render();
    if (!hadFiles && assets.length) name.focus();
  };

  area.addEventListener('click', (e) => { if (!assets.length && !(e.target as Element).closest('button')) input.click(); });
  area.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && !assets.length) { e.preventDefault(); input.click(); } });
  area.addEventListener('dragover', (e) => { e.preventDefault(); if (!dragging) { dragging = true; render(); } });
  area.addEventListener('dragleave', (e) => { if (!area.contains(e.relatedTarget as Node)) { dragging = false; render(); } });
  area.addEventListener('drop', (e) => { e.preventDefault(); dragging = false; if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files)); render(); });
  input.addEventListener('change', () => { if (input.files) addFiles(Array.from(input.files)); input.value = ''; });
  addBtn.addEventListener('click', (e) => { e.stopPropagation(); input.click(); });
  grid.addEventListener('click', (e) => {
    const rm = (e.target as Element).closest<HTMLElement>('[data-dz-remove]');
    if (!rm) return;
    e.stopPropagation();
    const i = Number(rm.dataset.index);
    URL.revokeObjectURL(assets[i].preview);
    assets.splice(i, 1);
    if (assets.length < MAX_FILES) showNotice('', []);
    render();
  });
  [name, email].forEach((el) => el.addEventListener('input', render));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!valid() || busy) return;
    busy = true; error.classList.add('hidden'); progress.classList.remove('hidden'); render();
    try {
      const body = new FormData();
      body.append('name', name.value);
      body.append('email', email.value);
      body.append('description', instr.value.trim() || root.dataset.dzFallback || 'Instant drop-zone submission (homepage)');
      if (link.value.trim()) body.append('sourceLink', link.value.trim());
      assets.forEach((a) => body.append('files', a.file));
      const res = await fetch('/api/portal/freetrial', { method: 'POST', body });
      const isJson = (res.headers.get('content-type') || '').includes('application/json');
      const result = isJson ? await res.json() : null;
      if (!res.ok) {
        const fallback = !isJson ? await res.text() : '';
        throw new Error(result?.message || fallback || `Submission failed (${res.status})`);
      }
      if (result?.success && result?.token) {
        localStorage.setItem('portal_token', result.token);
        localStorage.setItem('portal_user', JSON.stringify(result.user));
        localStorage.setItem('reframe_cs_welcome_trigger', 'true');
        if (count) count.textContent = assets.length === 1 ? 'image is' : `${assets.length} images are`;
        if (root.dataset.dzPageSuccess) document.dispatchEvent(new CustomEvent('ft:success'));
        else { formView.classList.add('hidden'); success.classList.remove('hidden'); }
        return;
      }
      throw new Error(result?.message || 'Submission failed');
    } catch (err: any) {
      console.error('Failed to submit free trial:', err);
      error.textContent = err?.message || 'Unable to submit your free trial. Please try again or email us.';
      error.classList.remove('hidden');
    } finally {
      busy = false; progress.classList.add('hidden'); render();
    }
  });
  if (root.dataset.dzPrefillEmail) { const e = new URLSearchParams(location.search).get('email'); if (e) email.value = e; }
  render();
}

const scan = () => document.querySelectorAll<HTMLElement>('[data-dropzone]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
