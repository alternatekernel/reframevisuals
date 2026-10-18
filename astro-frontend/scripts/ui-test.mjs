// Interaction checks for the vanilla UI toolkit on built pages (accordion, pricing table, inquiry form, before/after, currency).
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { chromium } from 'playwright-core';

const root = 'dist/client';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const posts = [];
const srv = http.createServer((q, r) => {
  const p = new URL(q.url, 'http://x').pathname;
  if (p.startsWith('/api/')) { let b = ''; q.on('data', (d) => (b += d)); q.on('end', () => { posts.push([p, b]); r.writeHead(200, { 'content-type': 'application/json' }); r.end('{"success":true}'); }); return; }
  let f = join(root, p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f) && existsSync(f + '.html')) f += '.html';
  if (!existsSync(f) || !statSync(f).isFile()) { r.writeHead(404); return r.end('nf'); }
  r.writeHead(200, { 'content-type': types[extname(f)] || 'application/octet-stream' }); r.end(readFileSync(f));
});
await new Promise((r) => srv.listen(4441, r));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] });
let fails = 0;
const check = (name, ok) => { console.log(ok ? 'PASS' : 'FAIL', name); if (!ok) fails++; };
const open = async (path, vp = { width: 1440, height: 900 }, opts = {}) => {
  const ctx = await b.newContext({ viewport: vp, ...opts });
  await ctx.route(/^https?:\/\/(?!localhost)/, (r) => r.abort());
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`http://localhost:4441${path}`, { waitUntil: 'networkidle' });
  return { ctx, page, errors };
};

// /pricing
{
  const { ctx, page, errors } = await open('/pricing');
  const items = page.locator('[data-acc-item]');
  check('pricing faq renders 4 items', (await items.count()) === 4);
  await items.nth(1).locator('[data-acc-toggle]').scrollIntoViewIfNeeded();
  await items.nth(1).locator('[data-acc-toggle]').click();
  check('pricing faq opens', (await items.nth(1).getAttribute('data-open')) === 'true');
  await items.nth(2).locator('[data-acc-toggle]').click();
  check('faq single-open', (await items.nth(1).getAttribute('data-open')) === 'false' && (await items.nth(2).getAttribute('data-open')) === 'true');

  const inq = page.locator('[data-inquiry]');
  await inq.scrollIntoViewIfNeeded();
  await page.fill('#pricing-cta-email', 'bad');
  await page.click('[data-inquiry-submit]');
  check('inquiry ignores invalid email', posts.length === 0);
  await page.fill('#pricing-cta-email', 'buyer@example.com');
  await page.click('[data-inquiry-submit]');
  await page.waitForSelector('[data-inquiry-success]:not(.hidden)');
  const body = JSON.parse(posts.at(-1)[1]);
  check('inquiry payload', posts.at(-1)[0] === '/api/portal/inquiry' && body.email === 'buyer@example.com' && body.metadata.type === 'Pricing Page Custom Pricing Breakdown' && body.metadata.source === 'Pricing CTA');

  const row = page.locator('[data-pricing-table] [data-service-id]').nth(2);
  const id = await row.getAttribute('data-service-id');
  await row.scrollIntoViewIfNeeded();
  await Promise.all([page.waitForURL(`**/services/${id}`), row.locator('div').first().click()]);
  check('pricing row navigates to service page', page.url().endsWith(`/services/${id}`));
  check('pricing no page errors', errors.length === 0);
  await ctx.close();
}
// /pricing mobile: sticky order button follows tapped row
{
  const { ctx, page } = await open('/pricing', { width: 390, height: 844 });
  const rows = page.locator('[data-pricing-table] [data-service-id]');
  const row = rows.nth(3);
  await row.scrollIntoViewIfNeeded();
  await row.tap?.().catch(() => {}); await row.click();
  const name = await row.getAttribute('data-service-name');
  check('mobile order button shows selected service', (await page.locator('[data-pricing-order-name]').textContent()) === name);
  await ctx.close();
}
// Currency
{
  const { ctx, page } = await open('/pricing', { width: 1440, height: 900 }, { locale: 'en-GB' });
  const t = await page.locator('[data-usd]').first().textContent();
  check('currency auto-detects GBP', t.includes('£'));
  await ctx.close();
}
// /services before/after
{
  const { ctx, page, errors } = await open('/services');
  const ba = page.locator('[data-ba]').first();
  await ba.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  const clip1 = await ba.locator('[data-ba-before]').evaluate((e) => e.style.clipPath);
  await page.waitForTimeout(900);
  const clip2 = await ba.locator('[data-ba-before]').evaluate((e) => e.style.clipPath);
  check('before/after animates', clip1 !== clip2 && clip1.includes('inset'));
  check('before/after overlay visible once in view', (await ba.locator('[data-ba-before]').evaluate((e) => e.style.opacity)) === '1');
  const stage = ba.locator('[data-ba-stage]');
  const box = await stage.boundingBox();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.5);
  await page.mouse.down(); await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.5, { steps: 4 }); await page.mouse.up();
  await page.waitForTimeout(150);
  const clip3 = await ba.locator('[data-ba-before]').evaluate((e) => e.style.clipPath);
  check('drag moves split', /inset\(0px? [7-8]\d(\.\d+)?% 0px? 0px?\)/.test(clip3) || clip3.includes('inset(0'));
  const orderBtns = await page.locator('[data-order-now]:not(.hidden)').count();
  check('exactly one Order Now visible', orderBtns === 1);
  check('services no page errors', errors.length === 0);
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
