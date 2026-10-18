// Workflow diagram: reveals once when scrolled into view and keeps the SVG connectors aligned to the container width.
import { DESKTOP, MOBILE, pathD, type Conn } from '../workflowGeom';

function layout(box: HTMLElement | null, conns: Conn[]) {
  if (!box) return;
  const svg = box.querySelector<SVGSVGElement>('svg[data-wf-svg]');
  if (!svg) return;
  const apply = () => {
    const w = box.offsetWidth;
    if (!w) return;
    svg.setAttribute('width', String(w));
    svg.querySelectorAll<SVGPathElement>('path[data-wf-path]').forEach((p, i) => p.setAttribute('d', pathD(conns[i], w)));
  };
  apply();
  new ResizeObserver(apply).observe(box);
}

function init(root: HTMLElement) {
  if (root.dataset.wfReady) return;
  root.dataset.wfReady = '1';
  layout(root.querySelector('[data-wf-desktop]'), DESKTOP);
  layout(root.querySelector('[data-wf-mobile]'), MOBILE);
  if (!('IntersectionObserver' in window)) { root.classList.add('is-in'); return; }
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { root.classList.add('is-in'); io.disconnect(); } }, { rootMargin: '-80px 0px' });
  io.observe(root);
}
const scan = () => document.querySelectorAll<HTMLElement>('[data-workflow]').forEach(init);
scan();
document.addEventListener('astro:page-load', scan);
