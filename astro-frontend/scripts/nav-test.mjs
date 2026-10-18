// Interaction checks for the server-rendered navigation, footer and cookie banner (no React).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const root = 'dist/client';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
let inquiry = null;
const BASE = process.env.ASTRO_URL || 'http://localhost:4440'; // ASTRO_URL: a running `astro dev` (server-rendered routes)
const srv = http.createServer((q, r) => {
  const p = new URL(q.url, 'http://x').pathname;
  if (p === '/api/portal/inquiry') { let b = ''; q.on('data', (d) => (b += d)); q.on('end', () => { inquiry = b; r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"success":true}'); }); return; }
  if (p === '/api/portal/auth/me') { r.writeHead(200, { 'content-type': 'application/json' }); return r.end(JSON.stringify({ success: true, data: { name: 'Ada Lovelace', email: 'ada@example.com', customerCode: 'RV-001' } })); }
  if (p.startsWith('/api/')) { r.writeHead(200, { 'content-type': 'application/json' }); return r.end('{}'); }
  let f = join(root, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
  if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
});
await new Promise((r) => srv.listen(4440, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
let fails = 0;
const check = (name, ok) => { console.log(ok ? 'PASS' : 'FAIL', name); if (!ok) fails++; };

// Desktop: mega menu, contact popover, cookie banner, footer chat button
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await ctx.route('**/api/**', async (r) => {
    const u = new URL(r.request().url()).pathname;
    if (u === '/api/portal/inquiry') inquiry = r.request().postData();
    const body = u === '/api/portal/auth/me' ? { success: true, data: { name: 'Ada Lovelace', email: 'ada@example.com', customerCode: 'RV-001' } } : { success: true };
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(BASE + '/privacy', { waitUntil: 'networkidle' });
  const menu = p.locator('[data-services-menu]');
  check('mega menu closed initially', (await menu.getAttribute('data-open')) !== 'true');
  await p.locator('[data-services-trigger]').hover();
  await p.waitForTimeout(400);
  check('mega menu opens on hover', (await menu.getAttribute('data-open')) === 'true' && (await menu.locator('a').count()) > 5);
  await p.mouse.move(700, 600);
  await p.waitForTimeout(500);
  check('mega menu closes when pointer leaves', (await menu.getAttribute('data-open')) !== 'true');
  await p.locator('[data-contact-toggle]').click();
  check('contact popover opens', await p.locator('[data-contact-popover]').isVisible());
  await p.locator('[data-contact-email]').fill('nope');
  await p.locator('[data-contact-submit]').click();
  check('invalid email shows an error', await p.locator('[data-contact-error]').isVisible());
  await p.locator('[data-contact-email]').fill('buyer@example.com');
  await p.locator('[data-contact-submit]').click();
  await p.waitForTimeout(500);
  check('inquiry posted to API', Boolean(inquiry && inquiry.includes('buyer@example.com')));
  check('success state shown', await p.locator('[data-contact-done]').isVisible());
  await p.mouse.click(300, 700);
  await p.waitForTimeout(200);
  check('popover closes on outside click', !(await p.locator('[data-contact-popover]').isVisible()));
  await p.waitForTimeout(4200);
  check('cookie banner appears after delay', await p.locator('[data-cookie-banner]').isVisible());
  await p.locator('[data-cookie="accepted"]').click();
  await p.waitForTimeout(500);
  check('cookie choice stored and banner hidden', (await p.evaluate(() => localStorage.getItem('reframe-cookie-consent'))) === 'accepted' && !(await p.locator('[data-cookie-banner]').isVisible()));
  check('no page errors', errs.length === 0);
  await ctx.close();
}

// Authenticated state
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem('portal_token', 'tok'); localStorage.setItem('reframe-current-user', JSON.stringify({ name: 'Ada Lovelace', email: 'ada@example.com' })); localStorage.setItem('reframe-cookie-consent', 'declined'); });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await ctx.route('**/api/**', async (r) => {
    const u = new URL(r.request().url()).pathname;
    if (u === '/api/portal/inquiry') inquiry = r.request().postData();
    const body = u === '/api/portal/auth/me' ? { success: true, data: { name: 'Ada Lovelace', email: 'ada@example.com', customerCode: 'RV-001' } } : { success: true };
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '/about', { waitUntil: 'networkidle' });
  await p.waitForTimeout(500);
  check('signed-in: Sign In button hidden, profile shown', !(await p.locator('a[data-guest-only]').first().isVisible()) && (await p.locator('[data-profile-toggle]').isVisible()));
  await p.locator('[data-profile-toggle]').click();
  check('signed-in: profile menu shows user', (await p.locator('[data-profile-menu] [data-user-name]').textContent()) === 'Ada Lovelace');
  await p.locator('[data-profile-menu] [data-signout]').click();
  await p.waitForTimeout(400);
  check('sign out clears auth', (await p.evaluate(() => localStorage.getItem('portal_token'))) === null && (await p.locator('a[data-guest-only]').first().isVisible()));
  await ctx.close();
}

// Mobile drawer + footer accordion
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.addInitScript(() => localStorage.setItem('reframe-cookie-consent', 'declined'));
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  await ctx.route('**/api/**', async (r) => {
    const u = new URL(r.request().url()).pathname;
    if (u === '/api/portal/inquiry') inquiry = r.request().postData();
    const body = u === '/api/portal/auth/me' ? { success: true, data: { name: 'Ada Lovelace', email: 'ada@example.com', customerCode: 'RV-001' } } : { success: true };
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const p = await ctx.newPage();
  await p.goto(BASE + '/pricing', { waitUntil: 'networkidle' });
  await p.locator('[data-mobile-open]').click();
  await p.waitForTimeout(500);
  check('mobile drawer opens', (await p.locator('[data-mobile-menu]').getAttribute('data-open')) === 'true' && (await p.locator('[data-mobile-menu]').isVisible()));
  await p.locator('[data-mobile-close]').click();
  await p.waitForTimeout(500);
  check('mobile drawer closes', (await p.locator('[data-mobile-menu]').getAttribute('data-open')) === 'false');
  const first = p.locator('footer details').first();
  await first.scrollIntoViewIfNeeded();
  await first.locator('summary').click();
  check('footer accordion opens', await first.evaluate((d) => d.open));
  await p.locator('footer details').nth(1).locator('summary').click();
  check('footer accordion is exclusive', !(await first.evaluate((d) => d.open)));
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `\n${fails} check(s) failed` : '\nAll navigation checks passed');
process.exit(fails ? 1 : 0);
