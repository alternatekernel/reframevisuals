// Serves dist/client with the SPA rewrites and loads pages in Chromium, reporting console errors.
import http from 'node:http';
import { readFileSync, existsSync, statSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const root = 'dist/client';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain' };
const spaPrefix = /^\/(admin|dashboard|portal|order|login|signup|forgot-password|reset-password)(\/|$)/;

const server = http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.startsWith('/api/')) { res.writeHead(502); return res.end('{}'); }
  let file = spaPrefix.test(p) ? join(root, 'csr-shell.html') : join(root, p);
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
  if (!existsSync(file) && existsSync(file + '.html')) file += '.html';
  if (!existsSync(file)) { res.writeHead(404); return res.end('nf'); }
  res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(4401, r));

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
mkdirSync('tests/shots', { recursive: true });
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/about', '/services', '/pricing', '/login', '/dashboard'];
let bad = 0;
for (const path of pages) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => m.type() === 'error' && !/Failed to load resource|502|ERR_/.test(m.text()) && errs.push('console: ' + m.text().slice(0, 160)));
  await page.goto('http://localhost:4401' + path, { waitUntil: 'networkidle' }).catch((e) => errs.push('nav: ' + e.message));
  await page.screenshot({ path: `tests/shots/${path.replace(/\W+/g, '_') || 'home'}.png` });
  const h1 = await page.locator('h1').first().textContent({ timeout: 1000 }).catch(() => null);
  console.log(path, '| h1:', (h1 || '').trim().slice(0, 60), '| errors:', errs.length);
  errs.slice(0, 3).forEach((e) => console.log('   ', e));
  bad += errs.length;
  await page.close();
}
await browser.close();
server.close();
process.exit(bad ? 1 : 0);
