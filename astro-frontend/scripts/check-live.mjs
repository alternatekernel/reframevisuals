// Usage: node scripts/check-live.mjs https://reframevisuals-astro.vercel.app
// Checks status, <title>/<meta description> vs SEO_META_BY_PATH, redirects, robots and sitemap on a deployed site.
import { readFileSync } from 'node:fs';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!base) { console.error('Pass the site URL'); process.exit(2); }

const src = readFileSync(new URL('../src/data/seoMeta.ts', import.meta.url), 'utf8');
const map = new Function(`return ${src.match(/SEO_META_BY_PATH[^=]*=\s*(\{[\s\S]*?\n\});/)[1]}`)();
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
let bad = 0;
const fail = (m) => { bad++; console.log('FAIL', m); };

for (const [path, want] of Object.entries(map)) {
  if (['/contact-us', '/order/dedicated'].includes(path)) continue;
  const res = await fetch(base + path, { redirect: 'manual' }).catch((e) => ({ status: 0, text: async () => '', err: e.message }));
  if (res.status !== 200) { fail(`${path} -> HTTP ${res.status}`); continue; }
  const html = await res.text();
  const title = dec((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const desc = dec((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  if (title !== want.title) fail(`${path} title: "${title}" != "${want.title}"`);
  if (desc !== want.description) fail(`${path} description differs`);
}

for (const [from, to] of [['/insights', '/blog'], ['/support', '/contact'], ['/services/jewelry-retouch', '/jewelry-photo-retouching-service']]) {
  const r = await fetch(base + from, { redirect: 'manual' });
  const loc = r.headers.get('location') || '';
  if (r.status !== 301 || !loc.endsWith(to)) fail(`redirect ${from}: ${r.status} ${loc}`);
}
for (const p of ['/robots.txt', '/sitemap.xml', '/sitemap-blog.xml', '/llms.txt', '/login', '/admin', '/blog', '/p/does-not-exist']) {
  const r = await fetch(base + p, { redirect: 'manual' });
  console.log(`${p} -> ${r.status}${r.headers.get('cache-control') ? ' cc=' + r.headers.get('cache-control') : ''}`);
}
console.log(bad ? `\n${bad} problem(s)` : '\nAll meta and redirect checks passed');
process.exit(bad ? 1 : 0);
