// Compares element geometry between the original SPA build and the Astro build for one route.
//   node scripts/geom-diff.mjs <spaRoot> <route> [width]
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const [spaRoot, route = '/', width = '1440'] = process.argv.slice(2);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const serve = (root, port, spa) => new Promise((res) => {
  const s = http.createServer((q, r) => {
    const p = new URL(q.url, 'http://x').pathname;
    if (p.startsWith('/api/')) { r.writeHead(502); return r.end('{}'); }
    let f = join(root, p);
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
    if (!existsSync(f) || !statSync(f).isFile()) { if (spa && !extname(p)) f = join(root, 'index.html'); else { r.writeHead(404); return r.end('nf'); } }
    r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
  });
  s.listen(port, () => res(s));
});
const s1 = await serve(spaRoot, 4420, true);
const s2 = await serve('dist/client', 4421, false);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
const grab = async (port) => {
  const ctx = await b.newContext({ viewport: { width: Number(width), height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem('reframe_boot_loader_seen', '1'); localStorage.setItem('reframe-cookie-consent', 'declined'); });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}${route}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1500);
  const rows = await p.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main p, main a, main li, main span, main section, main div')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => { const r = e.getBoundingClientRect(); return { t: e.textContent.trim().slice(0, 40), x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height) }; }));
  await ctx.close();
  return rows;
};
const A = await grab(4420), B = await grab(4421);
let shown = 0;
const used = new Set();
for (const a of A) {
  const j = B.findIndex((x, i) => !used.has(i) && x.t === a.t);
  if (j < 0) { if (shown++ < Number(process.env.MAXS || 8)) console.log('only in SPA:', a.t); continue; }
  used.add(j);
  const x = B[j];
  if (Math.abs(a.x - x.x) > 1 || Math.abs(a.w - x.w) > 1 || Math.abs(a.h - x.h) > 1 || Math.abs(a.y - x.y) > 1) { if (shown++ < Number(process.env.MAXS || 8)) console.log(`diff "${a.t}": spa x${a.x} y${a.y} w${a.w} h${a.h}  astro x${x.x} y${x.y} w${x.w} h${x.h}`); }
}
B.forEach((x, i) => { if (!used.has(i) && shown++ < Number(process.env.MAXS || 12)) console.log('only in Astro:', x.t); });
console.log(`compared ${A.length} vs ${B.length} text nodes`);
await b.close(); s1.close(); s2.close();
