// Captures full-page screenshots of a built site for pixel comparison.
//   node scripts/capture.mjs --root <dir> --mode spa|astro --out <dir> [--routes /a,/b]
// spa   = the original Vite SPA build (index.html fallback);  astro = dist/client with SPA rewrites.
import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const root = arg('root');
const mode = arg('mode', 'astro');
const out = arg('out');
const port = Number(arg('port', 4410));
export const ROUTES = (arg('routes') || '/,/services,/services/background-removal,/services/ghost-mannequin,/pricing,/about,/portfolio,/testimonials,/how-it-works,/platform,/free-trial,/contact,/quote-builder,/start,/book-meeting,/amazon-product-image-editing,/us-photo-editing-service,/privacy,/quality-assurance-process,/resources,/resources/clipping-path-vs-background-removal,/pixelz-alternative,/case-studies,/ai-product-visuals,/blog').split(',');

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain', '.png': 'image/png' };
const spa = /^\/(admin|dashboard|portal|order|login|signup|forgot-password|reset-password)(\/|$)/;

const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/api/')) { res.writeHead(502); return res.end('{}'); }
  let file = join(root, p);
  if (mode === 'astro' && spa.test(p)) file = join(root, 'csr-shell.html');
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
  if (!existsSync(file) || !statSync(file).isFile()) {
    if (mode === 'spa' && !extname(p)) file = join(root, 'index.html');
    else { res.writeHead(404); return res.end('nf'); }
  }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(port, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
for (const [label, vp] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
  mkdirSync(join(out, label), { recursive: true });
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'no-preference', serviceWorkers: 'block' });
    await ctx.addInitScript(() => {
      try { sessionStorage.setItem('reframe_boot_loader_seen', '1'); localStorage.setItem('reframe-cookie-consent', 'declined'); } catch {}
    });
    await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' }).catch(() => {});
    await page.addStyleTag({ content: '[class*="animate-marquee"],[class*="animate-pulse"],[class*="animate-spin"],[class*="animate-shimmer"],[class*="animate-focal"],[class*="animate-glass"],[class*="animate-ping"]{animation-play-state:paused !important}*{caret-color:transparent !important}[data-reveal="load"]{animation:none !important;opacity:1 !important;transform:none !important}html{scroll-behavior:auto !important}' });
    // Bring every section into view (instant) so once-only reveal animations fire, independent of smooth-scroll libraries.
    const count = await page.evaluate(() => document.querySelectorAll('section, footer, h2, h3').length);
    for (let i = 0; i < count; i++) {
      await page.evaluate((n) => document.querySelectorAll('section, footer, h2, h3')[n]?.scrollIntoView({ block: 'center', behavior: 'instant' }), i);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    // Compare final states: force any entrance animation that did not fire (framer inline styles or data-reveal) to its end state.
    await page.evaluate(() => {
      document.querySelectorAll('[style*="opacity: 0"]').forEach((el) => { el.style.setProperty('opacity', '1', 'important'); el.style.setProperty('transform', 'none', 'important'); });
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-revealed'));
    });
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(1500);
    const name = (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\W+/g, '_')) + '.png';
    // Chromium cannot rasterize full pages taller than 16384px in one go, so capture in chunks and stitch.
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    const CH = 6000;
    const parts = [];
    for (let y = 0; y < total; y += CH) {
      parts.push(PNG.sync.read(await page.screenshot({ fullPage: true, clip: { x: 0, y, width: vp.width, height: Math.min(CH, total - y) } })));
    }
    const full = new PNG({ width: parts[0].width, height: parts.reduce((n, p) => n + p.height, 0) });
    let oy = 0;
    for (const part of parts) { PNG.bitblt(part, full, 0, 0, part.width, part.height, 0, oy); oy += part.height; }
    writeFileSync(join(out, label, name), PNG.sync.write(full));
    await ctx.close();
  }
  console.log(`${label}: ${ROUTES.length} routes`);
}
await browser.close();
server.close();
