// Vanilla port of components/BeforeAfterCard.tsx: sweep/return animation, sequence mode, hover + drag split.
// Markup is rendered by components/astro/BeforeAfter.astro; options come from data-* attributes.
type Seq = { image: string; label: string };
const clamp = (v: number, a: number, b: number) => Math.min(Math.max(v, a), b);
const easeIn = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
const easeOut = (p: number) => p * p * (3 - 2 * p);

const srcSet = (url: string) => {
  if (!url || !url.includes('cloudinary.com')) return '';
  const base = url.replace(/w_\d+/, 'w_WIDTH');
  return [300, 600, 800].map((w) => `${base.replace('w_WIDTH', 'w_' + w)} ${w}w`).join(', ');
};

function init(root: HTMLElement) {
  if (root.dataset.baReady) return;
  root.dataset.baReady = '1';
  const $ = <T extends HTMLElement>(s: string) => root.querySelector<T>(s);
  const stage = $('[data-ba-stage]')!;
  const bg = $<HTMLImageElement>('[data-ba-bg]')!;
  const over = $<HTMLImageElement>('[data-ba-over]')!;
  const beforeLayer = $('[data-ba-before]')!;
  const divider = $('[data-ba-divider]')!;
  const handle = $('[data-ba-handle]');
  const labelWrap = $('[data-ba-label]');
  const labelText = $('[data-ba-label-text]');
  const labelIcon = $('[data-ba-label-icon]');
  const labelPlay = $('[data-ba-icon-play]');
  const labelCheck = $('[data-ba-icon-check]');
  const meta = $<HTMLMetaElement>('[data-ba-meta-image]');

  let sequence: Seq[] | undefined = root.dataset.baSeq ? JSON.parse(root.dataset.baSeq) : undefined;
  if (sequence && sequence.length < 2) sequence = undefined;
  const sweep = Number(root.dataset.baSweep) || 3000;
  const ret = Number(root.dataset.baReturn) || 2000;
  const noHover = root.dataset.baNoHover === 'true';
  const hideUi = root.dataset.baHideUi === 'true';
  const mode = root.dataset.baActive; // 'true' | 'view' | undefined

  let active = mode === 'true';
  let hovering = false, dragging = false, complete = false;
  let seqIndex = 0;
  let raf = 0, startAt = 0, run = 0;
  let label = 'AFTER';

  const setImg = (img: HTMLImageElement, url: string) => {
    if (img.getAttribute('src') === url) return;
    img.setAttribute('src', url || '');
    const ss = srcSet(url);
    if (ss) img.setAttribute('srcset', ss); else img.removeAttribute('srcset');
  };
  const setLabel = (l: string) => {
    if (l === label) return;
    label = l;
    if (!labelText) return;
    labelText.textContent = l;
    const before = l === 'BEFORE';
    labelIcon?.classList.toggle('bg-brand', before);
    labelIcon?.classList.toggle('bg-black', !before);
    labelPlay?.classList.toggle('hidden', !before);
    labelCheck?.classList.toggle('hidden', before);
  };
  const split = (pos: number) => {
    (beforeLayer as HTMLElement).style.clipPath = `inset(0 ${100 - pos}% 0 0)`;
    divider.style.left = `${pos}%`;
    if (handle) handle.style.left = `${pos}%`;
  };
  const refresh = () => {
    const show = active || complete || (!hideUi && (hovering || dragging));
    const o = show ? '1' : '0';
    beforeLayer.style.opacity = o;
    divider.style.opacity = o;
    labelWrap?.classList.toggle('opacity-100', show);
    labelWrap?.classList.toggle('opacity-0', !show);
    if (handle) {
      const hv = hovering || dragging || complete;
      const inner = handle.firstElementChild as HTMLElement | null;
      if (inner) { inner.style.opacity = hv ? '1' : '0'; inner.style.transform = hv ? 'scale(1)' : 'scale(0.9)'; }
    }
    stage.classList.toggle('cursor-col-resize', hovering || dragging);
  };
  const syncImages = () => {
    if (!sequence) return;
    const last = seqIndex === sequence.length - 1;
    setImg(over, last ? sequence[0].image : sequence[seqIndex].image);
    const bgUrl = last ? sequence[sequence.length - 1].image : sequence[(seqIndex + 1) % sequence.length].image;
    setImg(bg, bgUrl);
    meta?.setAttribute('content', bgUrl);
  };
  const emit = (name: string, detail?: unknown) => root.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
  const setSeq = (i: number) => { seqIndex = i; syncImages(); emit('ba:sequence', { index: i, length: sequence!.length }); };

  const start = () => {
    cancelAnimationFrame(raf);
    const id = ++run;
    complete = false;
    seqIndex = 0;
    syncImages();
    startAt = performance.now();
    split(100);
    setLabel('AFTER');
    refresh();
    const tick = () => {
      if (id !== run) return;
      if (hovering || dragging) { raf = requestAnimationFrame(tick); return; }
      const elapsed = performance.now() - startAt;
      if (elapsed >= sweep + ret) {
        split(50); setLabel('AFTER'); complete = true; refresh(); emit('ba:complete');
        setTimeout(() => {
          if (id === run && !hovering && !dragging) { complete = false; seqIndex = 0; syncImages(); startAt = performance.now(); raf = requestAnimationFrame(tick); refresh(); }
        }, 1500);
        return;
      }
      let pos: number;
      if (sequence) {
        const finalReturn = seqIndex === sequence.length - 1;
        if (!finalReturn) {
          if (elapsed >= sweep) {
            const next = seqIndex + 1;
            setSeq(next);
            startAt = performance.now();
            if (next === sequence.length - 1) { split(0); setLabel(sequence[next].label); } else { split(100); setLabel(sequence[next].label); }
            raf = requestAnimationFrame(tick);
            return;
          }
          pos = 100 - easeIn(elapsed / sweep) * 100;
          split(pos);
          setLabel(pos > 50 ? sequence[seqIndex].label : sequence[seqIndex + 1].label);
        } else {
          if (elapsed >= ret) { split(50); setLabel(sequence[sequence.length - 1].label); complete = true; refresh(); emit('ba:complete'); return; }
          pos = easeOut(elapsed / ret) * 50;
          split(pos);
          setLabel(pos > 50 ? sequence[0].label : sequence[sequence.length - 1].label);
        }
      } else {
        pos = elapsed < sweep ? 100 - easeIn(elapsed / sweep) * 100 : easeOut((elapsed - sweep) / ret) * 50;
        split(pos);
        setLabel(pos > 50 ? 'BEFORE' : 'AFTER');
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  };

  const activate = () => { active = true; refresh(); start(); };
  const deactivate = () => { active = false; run++; cancelAnimationFrame(raf); complete = false; seqIndex = 0; syncImages(); split(50); setLabel('AFTER'); refresh(); };
  // External control (mobile image grid): data-ba-active="external".
  (root as any).baSetActive = (on: boolean) => { if (on && !active) activate(); else if (!on && active) deactivate(); };
  if (mode === 'true') activate();
  else if (mode === 'view' && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); activate(); } }, { threshold: 0.4 });
    io.observe(root);
  }

  // Pointer interaction.
  const posFrom = (x: number) => { const r = stage.getBoundingClientRect(); return clamp(((x - r.left) / r.width) * 100, 2, 98); };
  let moveRaf = 0;
  const move = (x: number) => { cancelAnimationFrame(moveRaf); moveRaf = requestAnimationFrame(() => { const p = posFrom(x); split(p); setLabel(p > 50 ? 'BEFORE' : 'AFTER'); }); };
  if (!noHover) {
    stage.addEventListener('pointerenter', () => { hovering = true; refresh(); });
    stage.addEventListener('pointerleave', () => { hovering = false; refresh(); });
    stage.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      stage.setPointerCapture(e.pointerId);
      dragging = true; refresh(); move(e.clientX);
      const onMove = (ev: PointerEvent) => { ev.preventDefault(); move(ev.clientX); };
      const onUp = () => { dragging = false; refresh(); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }
  stage.addEventListener('contextmenu', (e) => { if ((e.target as Element).tagName === 'IMG') e.preventDefault(); });

  // Switch to a fixed before/after pair (used by variant pickers); stops sequence mode.
  (root as any).baSetImages = (before: string, after: string) => {
    sequence = undefined;
    setImg(over, before);
    setImg(bg, after);
    meta?.setAttribute('content', after);
    if (active) start();
  };
}

const scan = () => document.querySelectorAll<HTMLElement>('[data-ba]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
