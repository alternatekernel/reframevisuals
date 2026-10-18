// Reports JavaScript bytes (uncompressed) loaded by each route in the built Astro site. Usage: node scripts/js-weight.mjs [/a,/b]
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const routes = (process.argv[2] || '/,/about,/how-it-works,/services,/pricing,/portfolio,/testimonials,/platform,/privacy,/case-studies,/resources,/us-photo-editing-service,/free-trial,/contact').split(',');
const root = 'dist/client';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const s = http.createServer((q, r) => {
  const p = new URL(q.url, 'http://x').pathname;
  if (p.startsWith('/api/')) { r.writeHead(502); return r.end('{}'); }
  let f = join(root, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
  if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
});
await new Promise((r) => s.listen(4430, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
let total = 0;
for (const route of routes) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  const p = await ctx.newPage();
  let bytes = 0, files = 0;
  p.on('response', async (res) => { if (res.url().endsWith('.js')) { try { bytes += (await res.body()).length; files++; } catch {} } });
  await p.goto(`http://localhost:4430${route}`, { waitUntil: 'networkidle' });
  // scroll so client:visible islands load too
  for (let y = 0; y < 20000; y += 700) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(60); }
  await p.waitForTimeout(800);
  console.log(route.padEnd(34), `${(bytes / 1024).toFixed(0).padStart(6)} KB JS in ${String(files).padStart(2)} files`);
  total += bytes;
  await ctx.close();
}
console.log(`average ${(total / routes.length / 1024).toFixed(0)} KB`);
await b.close(); s.close();
