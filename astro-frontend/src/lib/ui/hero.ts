// Home hero behaviours (vanilla port of sections/Hero.tsx + components/hero/*):
//  - fading grid backdrop on scroll, rotating headline, intro cleanup
//  - the "fanned" card carousel: spring physics, drag / trackpad / arrows, auto-advance, before/after reveal.

// ---------- tiny spring integrator ----------
class Spring {
  x: number; v = 0; target: number; k = 150; c = 25; moving = false;
  constructor(x: number) { this.x = x; this.target = x; }
  set(x: number) { this.x = x; this.target = x; this.v = 0; this.moving = false; }
  stop() { this.target = this.x; this.v = 0; this.moving = false; }
  to(target: number, k: number, c: number) { this.target = target; this.k = k; this.c = c; this.moving = true; }
}
const REST = 0.0005;

function initHero(section: HTMLElement) {
  if (section.dataset.heroReady) return;
  section.dataset.heroReady = '1';

  // Intro animation flag lives on <html> only for the first visit; drop it once the intro has played.
  window.setTimeout(() => document.documentElement.removeAttribute('data-hero-intro'), 3500);

  // ----- scroll fade of the grid backdrop (opacity 1 -> 0 between 200px and 800px) -----
  const grid = section.querySelector<HTMLElement>('[data-hero-grid]');
  let gridRaf = 0;
  const gridUpdate = () => {
    gridRaf = 0;
    if (!grid) return;
    const t = Math.min(1, Math.max(0, (window.scrollY - 200) / 600));
    grid.style.opacity = String(1 - t);
  };
  window.addEventListener('scroll', () => { if (!gridRaf) gridRaf = requestAnimationFrame(gridUpdate); }, { passive: true });
  gridUpdate();

  // ----- headline rotation (9s, only while hero is on screen and tab visible) -----
  const head = section.querySelector<HTMLElement>('[data-hero-headline]');
  let heroInView = true;
  if (head) {
    const items: { tag: string; line1: string; line2: string }[] = JSON.parse(head.dataset.headlines || '[]');
    const tag = head.querySelector<HTMLElement>('[data-hl-tag]')!, l1 = head.querySelector<HTMLElement>('[data-hl-1]')!, l2 = head.querySelector<HTMLElement>('[data-hl-2]')!;
    let idx = 0; let timer = 0;
    const tick = () => {
      if (document.hidden) return;
      idx = (idx + 1) % items.length;
      head.style.transition = 'opacity 0.5s linear';
      head.style.opacity = '0';
      window.setTimeout(() => {
        tag.textContent = items[idx].tag; l1.textContent = items[idx].line1; l2.textContent = items[idx].line2;
        // later headlines appear without the intro slide-in
        head.querySelectorAll('.hero-a').forEach((e) => ((e as HTMLElement).style.animation = 'none'));
        head.style.opacity = '1';
      }, 500);
    };
    const sync = () => { clearInterval(timer); if (heroInView) timer = window.setInterval(tick, 9000); };
    new IntersectionObserver(([e]) => { heroInView = e.isIntersecting; sync(); }, { threshold: 0 }).observe(section);
    sync();
  }

  // ----- mobile "swipe" arrow bob only while hero visible -----
  const bob = section.querySelector<HTMLElement>('[data-hero-bob]');
  if (bob) new IntersectionObserver(([e]) => { bob.style.animationPlayState = e.isIntersecting ? 'running' : 'paused'; }, { threshold: 0 }).observe(section);

  // ----- carousel (desktop tree only) -----
  const root = section.querySelector<HTMLElement>('[data-hc]');
  if (!root) return;
  const mq = window.matchMedia('(min-width: 640px)');
  const start = () => { if (mq.matches && !root.dataset.hcReady) { root.dataset.hcReady = '1'; carousel(root); } };
  mq.addEventListener('change', start);
  start();
}

function carousel(root: HTMLElement) {
  const container = root.querySelector<HTMLElement>('[data-hc-stage]')!;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-card]'));
  const total = cards.length;
  const INITIAL = 2;
  const progress = new Spring(INITIAL);
  const smooth = new Spring(INITIAL);
  let gap = 265, cw = 273, gapAnim: { from: [number, number]; to: [number, number]; t0: number } | null = null;
  let dragRef = false, panning = false, inView = false, scrolledDebounce = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  type CardState = { el: HTMLElement; active: boolean; hovered: boolean; hoverOp: Spring; variants: { before: string; after: string }[]; vi: number; timers: number[]; variantTimer: number; completeTimer: number; busy: boolean };
  const states: CardState[] = cards.map((el) => ({
    el, active: false, hovered: false, hoverOp: new Spring(0), vi: 0, timers: [], variantTimer: 0, completeTimer: 0, busy: false,
    variants: el.dataset.variants ? JSON.parse(el.dataset.variants) : [],
  }));

  // ---- layout ----
  const wrap = (diff: number) => ((((diff + total / 2) % total) + total) % total) - total / 2;
  const render = () => {
    const p = smooth.x;
    states.forEach((s, i) => {
      const o = wrap(i - p);
      const x = o * gap;
      const y = Math.abs(o) * 15;
      const rot = panning ? 0 : o * 4;
      s.el.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
      s.el.style.zIndex = String(Math.round(100 - Math.abs(o) * 10));
      const tri = Math.max(0, 1 - Math.abs(o) / 0.5);
      const op = Math.max(tri, s.hoverOp.x);
      s.el.style.setProperty('--hc-icon', op.toFixed(3));
      const active = Math.abs(o) < 0.02;
      if (active !== s.active) { s.active = active; s.el.dataset.active = String(active); sync(s); }
    });
  };
  const applyDims = () => {
    root.style.setProperty('--hc-w', `${cw}px`);
    states.forEach((s) => (s.el.style.marginLeft = `${-(cw + 23) / 2}px`));
  };

  // ---- animation loop ----
  let raf = 0; let last = 0;
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000 || 0.016, 0.05); last = now;
    let busy = false;
    const sub = 1 / 120; let rem = dt;
    while (rem > 0) {
      const h = Math.min(sub, rem); rem -= h;
      if (progress.moving) {
        const a = -progress.k * (progress.x - progress.target) - progress.c * progress.v;
        progress.v += a * h; progress.x += progress.v * h;
        if (Math.abs(progress.x - progress.target) < REST && Math.abs(progress.v) < REST) { progress.x = progress.target; progress.v = 0; progress.moving = false; }
      }
      const a2 = -150 * (smooth.x - progress.x) - 25 * smooth.v;
      smooth.v += a2 * h; smooth.x += smooth.v * h;
      for (const s of states) {
        const hs = s.hoverOp;
        if (hs.moving) {
          const a3 = -300 * (hs.x - hs.target) - 30 * hs.v;
          hs.v += a3 * h; hs.x += hs.v * h;
          if (Math.abs(hs.x - hs.target) < 0.001 && Math.abs(hs.v) < 0.001) { hs.x = hs.target; hs.v = 0; hs.moving = false; }
        }
      }
    }
    if (gapAnim) {
      const t = Math.min((now - gapAnim.t0) / 300, 1);
      const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      gap = gapAnim.from[0] + (gapAnim.to[0] - gapAnim.from[0]) * e;
      cw = gapAnim.from[1] + (gapAnim.to[1] - gapAnim.from[1]) * e;
      applyDims();
      if (t >= 1) gapAnim = null; else busy = true;
    }
    render();
    const smoothRest = Math.abs(smooth.x - progress.x) < REST && Math.abs(smooth.v) < REST;
    if (progress.moving || !smoothRest || busy || states.some((s) => s.hoverOp.moving)) raf = requestAnimationFrame(loop);
    else { smooth.x = progress.x; smooth.v = 0; render(); raf = 0; }
  };
  const kick = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  const springTo = (target: number, k: number, c: number) => { progress.to(target, k, c); kick(); };

  // ---- responsive size ----
  const dims = () => {
    const width = window.innerWidth, height = window.innerHeight;
    let tg = 265, tw = 273;
    if (width < 390) { tg = 138; tw = 148; } else if (width < 640) { tg = 150; tw = 160; } else if (width < 1024) { tg = 190; tw = 195; } else if (width < 1440) { tg = 210; tw = 210; }
    if (width >= 640) {
      const short = height <= 860;
      const stage = short ? Math.min(Math.max(height * 0.42, 280), 340) : width >= 1024 ? Math.min(Math.max(height * 0.44, 330), 440) : Math.min(Math.max(height * 0.42, 300), 360);
      const maxW = Math.floor((stage - (short ? 75 : 60)) / 1.25);
      if (maxW < tw) { tg = Math.round(tg * (maxW / tw)); tw = maxW; }
    }
    return [tg, tw] as [number, number];
  };
  { const [tg, tw] = dims(); gap = tg; cw = tw; applyDims(); }
  window.addEventListener('resize', () => { const [tg, tw] = dims(); gapAnim = { from: [gap, cw], to: [tg, tw], t0: performance.now() }; kick(); });

  // ---- before/after reveal + variants per card ----
  const setReveal = (s: CardState, on: boolean) => { s.el.dataset.revealed = String(on); };
  const fast = (s: CardState) => {
    s.el.dataset.fast = '1';
    s.timers.forEach(clearTimeout);
    s.timers = [window.setTimeout(() => delete s.el.dataset.fast, 900)];
  };
  const showVariant = (s: CardState, i: number) => {
    const v = s.variants[i];
    const fade = s.el.querySelector<HTMLElement>('[data-hc-fade]')!;
    const before = s.el.querySelector<HTMLImageElement>('[data-hc-before-img]')!;
    const after = s.el.querySelector<HTMLImageElement>('[data-hc-after-img]')!;
    const src = (u: string, w: number) => (u.includes('upload/') ? u.replace(/upload\/[^/]+\//, `upload/f_auto,q_auto,c_scale,w_${w}/`) : u);
    const ss = (u: string) => (u.includes('upload/') ? [420, 640].map((w) => `${src(u, w)} ${w}w`).join(', ') : '');
    s.busy = true;
    fade.style.opacity = '0';
    window.setTimeout(() => {
      before.src = src(v.before, 420); before.srcset = ss(v.before);
      after.src = src(v.after, 420); after.srcset = ss(v.after);
      setReveal(s, false);
      s.el.dataset.instant = '1';
      void s.el.offsetWidth;
      delete s.el.dataset.instant;
      fade.style.opacity = '1';
      s.busy = false;
      sync(s);
    }, 1200);
  };
  function sync(s: CardState) {
    clearInterval(s.variantTimer); clearTimeout(s.completeTimer);
    const live = s.active && !s.hovered && inView && !document.hidden;
    setReveal(s, s.active && !s.hovered && !s.busy);
    if (!live || s.busy) return;
    if (s.variants.length > 1) s.variantTimer = window.setInterval(() => { s.vi = (s.vi + 1) % s.variants.length; showVariant(s, s.vi); }, 6000);
    s.completeTimer = window.setTimeout(() => cardComplete(states.indexOf(s)), 2700);
  }
  function cardComplete(idx: number) {
    if (!inView || document.hidden || dragRef) return;
    const current = progress.x;
    const norm = ((current % total) + total) % total;
    const dist = Math.abs(idx - norm);
    if (dist < 0.1 || dist > total - 0.1) {
      window.setTimeout(() => {
        if (dragRef || !inView || document.hidden) return;
        springTo(Math.round(current + 1), 40, 20);
      }, 1000);
    }
  }
  states.forEach((s) => {
    s.el.addEventListener('mouseenter', () => { s.hovered = true; s.hoverOp.to(1, 300, 30); fast(s); sync(s); kick(); });
    s.el.addEventListener('mouseleave', () => { s.hovered = false; s.hoverOp.to(0, 300, 30); fast(s); sync(s); kick(); });
  });

  // ---- visibility / autoplay ----
  let autoplay = 0;
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    clearInterval(autoplay);
    if (inView && !reduce) autoplay = window.setInterval(() => { if (!dragRef) springTo(Math.round(progress.x + 1), 90, 18); }, 3200);
    states.forEach(sync);
  }, { threshold: 0.35 }).observe(root);
  document.addEventListener('visibilitychange', () => states.forEach(sync));

  // ---- scroll freezes motion ----
  const onScroll = () => {
    if (!dragRef) { progress.stop(); dragRef = true; }
    clearTimeout(scrolledDebounce);
    scrolledDebounce = window.setTimeout(() => { dragRef = false; }, 200);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- arrows ----
  root.querySelector('[data-hc-prev]')?.addEventListener('click', () => springTo(Math.round(progress.x - 1), 200, 25));
  root.querySelector('[data-hc-next]')?.addEventListener('click', () => springTo(Math.round(progress.x + 1), 200, 25));

  // ---- trackpad horizontal swipe ----
  let wheeling = false, wheelStart = 0, lastDelta = 0, wheelTimer = 0;
  container.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (!wheeling) { progress.stop(); wheeling = true; wheelStart = progress.x; dragRef = true; }
    lastDelta = e.deltaX * 0.006;
    progress.set(progress.x + lastDelta); kick();
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      wheeling = false; dragRef = false;
      const cur = progress.x; let target = Math.round(cur);
      const diff = cur - wheelStart;
      if (Math.abs(diff) > 0.1 && Math.abs(diff) < 0.5) target = lastDelta > 0 ? Math.ceil(cur) : Math.floor(cur);
      springTo(target, 150, 25);
    }, 150);
  }, { passive: false });

  // ---- drag (pan) ----
  let downX = 0, lastX = 0, active = false, samples: { t: number; x: number }[] = [], suppressClick = false;
  container.style.touchAction = 'pan-y';
  container.addEventListener('pointerdown', (e) => { if (e.button !== 0) return; active = true; downX = lastX = e.clientX; samples = [{ t: performance.now(), x: e.clientX }]; });
  window.addEventListener('pointermove', (e) => {
    if (!active) return;
    if (!panning) {
      if (Math.abs(e.clientX - downX) < 3) return;
      panning = true; dragRef = true; container.style.cursor = 'grabbing'; container.setPointerCapture?.(e.pointerId);
    }
    progress.set(progress.x + -(e.clientX - lastX) / gap);
    lastX = e.clientX;
    samples.push({ t: performance.now(), x: e.clientX }); if (samples.length > 6) samples.shift();
    kick();
  });
  const end = () => {
    if (!active) return;
    active = false;
    if (!panning) return;
    panning = false; dragRef = false; container.style.cursor = 'grab';
    suppressClick = true; window.setTimeout(() => (suppressClick = false), 60);
    const a = samples[0], b = samples[samples.length - 1];
    const vx = b && a && b.t > a.t ? ((b.x - a.x) / (b.t - a.t)) * 1000 : 0;
    springTo(Math.round(progress.x + (-vx / gap) * 0.2), 100, 20);
  };
  window.addEventListener('pointerup', end);
  window.addEventListener('pointercancel', end);
  container.addEventListener('click', (e) => { if (suppressClick) { e.preventDefault(); e.stopPropagation(); } }, true);
  container.style.cursor = 'grab';

  render();
}

const scan = () => document.querySelectorAll<HTMLElement>('[data-section="hero"]').forEach(initHero);
scan();
document.addEventListener('astro:page-load', scan);
