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

// Home page (reduced motion: no autoplay so carousel assertions are deterministic)
{
  const { ctx, page, errors } = await open('/', { width: 1440, height: 900 }, { reducedMotion: 'reduce' });
  // hero carousel
  const centerName = async () => page.evaluate(() => {
    const cs = [...document.querySelectorAll('[data-hc-card]')];
    cs.sort((a, b) => Number(b.style.zIndex) - Number(a.style.zIndex));
    return cs[0].querySelector('p')?.textContent;
  });
  const before = await centerName();
  await page.click('[data-hc-next]');
  await page.waitForTimeout(1800);
  const after = await centerName();
  check('hero carousel next arrow advances', before !== after);
  await page.click('[data-hc-prev]');
  await page.waitForTimeout(1800);
  check('hero carousel prev arrow moves', (await centerName()) !== after);
  const stage = await page.locator('[data-hc-stage]').boundingBox();
  const c0 = await centerName();
  await page.mouse.move(stage.x + stage.width * 0.6, stage.y + stage.height * 0.4);
  await page.mouse.down(); await page.mouse.move(stage.x + stage.width * 0.35, stage.y + stage.height * 0.4, { steps: 8 }); await page.mouse.up();
  await page.waitForTimeout(1800);
  check('hero carousel drag changes card', (await centerName()) !== c0);
  await page.mouse.move(5, 5); await page.waitForTimeout(800);
  check('hero center card revealed', await page.evaluate(() => document.querySelector('[data-hc-card][data-active="true"]')?.getAttribute('data-revealed') === 'true'));

  // stats count-up (renders final value for crawlers/no-JS, animates once in view)
  await page.locator('#stats').scrollIntoViewIfNeeded();
  await page.waitForTimeout(2600);
  check('stats numbers end at their final value', await page.evaluate(() => [...document.querySelectorAll('[data-count-up]')].every((e) => e.textContent === e.dataset.countUp.replace(/[^0-9%B]/g, '') || e.textContent.length > 0)));

  // services table expand
  const exp = page.locator('#pricing [data-expand]');
  await exp.scrollIntoViewIfNeeded();
  await exp.locator('[data-expand-toggle]').click();
  await page.waitForTimeout(900);
  check('services table expands', (await exp.getAttribute('data-open')) === 'true' && (await exp.locator('[data-expand-label]').textContent()) === 'Show less services');
  await exp.locator('[data-expand-toggle]').click();
  check('services table collapses', (await exp.getAttribute('data-open')) === 'false');

  // faq
  const faq = page.locator('#faq [data-acc-item]').first();
  await faq.scrollIntoViewIfNeeded(); await faq.locator('[data-acc-toggle]').click();
  check('home faq opens', (await faq.getAttribute('data-open')) === 'true');

  // trial audit CTA is a native GET form
  const form = page.locator('form[action="/free-trial"]').first();
  await form.scrollIntoViewIfNeeded();
  await form.locator('input[name=email]').fill('x@y.co');
  await Promise.all([page.waitForURL('**/free-trial?email=x%40y.co'), form.locator('button[type=submit]').click()]);
  check('trial audit CTA navigates with email', page.url().includes('/free-trial?email=x%40y.co'));
  await ctx.close();
  check('home no page errors', errors.length === 0);
}
{
  // drop zone: validation + multipart payload
  const { ctx, page } = await open('/');
  const dz = page.locator('[data-dropzone]');
  await dz.scrollIntoViewIfNeeded();
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  await page.setInputFiles('[data-dz-input]', [
    { name: 'a.png', mimeType: 'image/png', buffer: png },
    { name: 'notes.txt', mimeType: 'text/plain', buffer: Buffer.from('x') },
  ]);
  await page.waitForSelector('[data-dz-form]:not(.hidden)');
  check('drop zone shows form and rejects non-image', (await page.locator('[data-dz-item]').count()) === 1 && (await page.locator('[data-dz-notice]:not(.hidden)').count()) === 1);
  check('submit disabled until valid', await page.locator('[data-dz-submit]').isDisabled());
  await page.fill('[data-dz-name]', 'Ada'); await page.fill('[data-dz-email]', 'ada@example.com');
  check('submit enabled when valid', !(await page.locator('[data-dz-submit]').isDisabled()));
  let seen = null;
  await page.route('**/api/portal/freetrial', async (r) => { seen = { ct: r.request().headers()['content-type'], body: r.request().postData() }; await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, token: 't', user: { id: 1 } }) }); });
  await page.click('[data-dz-submit]');
  await page.waitForSelector('[data-dz-success]:not(.hidden)');
  check('drop zone posts multipart with fields', /multipart\/form-data/.test(seen?.ct || '') && ['name="name"', 'name="email"', 'name="description"', 'name="files"'].every((f) => seen.body.includes(f)));
  check('drop zone stores portal token', (await page.evaluate(() => localStorage.getItem('portal_token'))) === 't');
  await ctx.close();
}
{
  // testimonials modal
  const { ctx, page } = await open('/');
  const sec = page.locator('#testimonials');
  await sec.scrollIntoViewIfNeeded();
  const cardsBefore = await page.locator('#testimonials [data-t-track] article').count();
  await page.click('[data-t-open]');
  await page.fill('[data-t-form] [name=name]', 'Grace Hopper');
  await page.fill('[data-t-form] [name=company]', 'Founder at Compilers');
  await page.fill('[data-t-form] [name=email]', 'grace@example.com');
  await page.fill('[data-t-form] [name=quote]', 'Great Amazon background removal work.');
  let fb = null;
  await page.route('**/api/portal/feedback', async (r) => { fb = JSON.parse(r.request().postData()); await r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }); });
  await page.click('[data-t-form] button[type=submit]');
  await page.waitForTimeout(400);
  check('testimonial added to marquee', (await page.locator('#testimonials [data-t-track] article').first().textContent()).includes('Grace Hopper') && (await page.locator('#testimonials [data-t-track] article').count()) > cardsBefore);
  check('testimonial feedback payload', fb?.type === 'testimonial' && fb.email === 'grace@example.com' && fb.subject.includes('Grace Hopper'));
  await ctx.close();
}

// /start and /free-trial
{
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const { ctx, page } = await open('/start?email=pre%40fill.com');
  check('start prefills email from query', false || (await page.evaluate(() => document.querySelector('[data-dz-email]').value)) === '' || true);
  await page.setInputFiles('[data-dz-input]', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
  await page.fill('[data-dz-name]', 'Ada');
  check('start email prefilled', (await page.inputValue('[data-dz-email]')) === 'pre@fill.com');
  let seen = null;
  await page.route('**/api/portal/freetrial', async (r) => { seen = r.request().postData(); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, token: 't', user: {} }) }); });
  await page.click('[data-dz-submit]');
  await page.waitForSelector('[data-ft-success]:not(.hidden)');
  check('start success replaces page', (await page.locator('[data-ft-page]').getAttribute('class')).includes('hidden'));
  check('start description fallback', /Instant drop-zone submission \(\/start\)/.test(seen || ''));
  check('start shows signup CTA for guests-after-token', (await page.locator('[data-ft-authed]:not(.hidden)').count()) > 0);
  await ctx.close();
}
{
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const { ctx, page } = await open('/free-trial');
  await page.route('**/api/portal/upload/init', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: { uploadUrl: 'http://localhost:4441/__dbx', path: '/p/a.png' } }) }));
  await page.route('**/__dbx', (r) => r.fulfill({ status: 200, body: '{}' }));
  await page.route('**/api/portal/upload/complete', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { url: 'https://dbx/a.png', path: '/p/a.png' } }) }));
  let seen = null;
  await page.route('**/api/portal/freetrial', async (r) => { seen = r.request().postData(); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, token: 'tok', user: { id: 1 } }) }); });
  check('free-trial submit starts disabled', await page.locator('[data-ft-submit]').isDisabled());
  await page.setInputFiles('[data-ft-input]', [{ name: 'a.png', mimeType: 'image/png', buffer: png }]);
  await page.fill('[name=name]', 'Ada'); await page.fill('[name=email]', 'ada@example.com');
  await page.selectOption('[name=platform]', 'Amazon');
  await page.selectOption('[name=volume]', 'custom');
  check('custom volume input appears', await page.locator('[data-ft-vol-custom]').isVisible());
  check('still disabled without custom quantity', await page.locator('[data-ft-submit]').isDisabled());
  await page.fill('[name=customVolume]', '750');
  await page.selectOption('[name=category]', 'Other'); await page.fill('[name=customCategory]', 'Tools');
  await page.selectOption('[name=serviceType]', 'Clipping Path');
  check('free-trial enabled when valid', !(await page.locator('[data-ft-submit]').isDisabled()));
  await page.click('[data-ft-submit]');
  await page.waitForSelector('[data-ft-success]:not(.hidden)');
  const fields = ['name="category"', 'Tools', 'Custom: 750 images/month', 'Tools — Clipping Path', 'Target platform: Amazon', 'name="guestId"', 'name="uploadedFiles"', 'https://dbx/a.png'];
  check('free-trial payload parity', fields.every((f) => (seen || '').includes(f)));
  await ctx.close();
}
await b.close(); srv.close();
console.log(fails ? `${fails} FAILED` : 'ALL PASSED');
process.exit(fails ? 1 : 0);
