// Compares built <title>/<meta description> against SEO_META_BY_PATH (production's server-injected meta).
import { readFileSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { execSync } from 'node:child_process';

const src = readFileSync('src/data/seoMeta.ts', 'utf8');
const m = src.match(/SEO_META_BY_PATH[^=]*=\s*(\{[\s\S]*?\n\});/);
const map = new Function(`return ${m[1]}`)();
const dec = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
let checked = 0, diff = 0, missing = 0;
for (const [path, want] of Object.entries(map)) {
  const file = path === '/' ? 'dist/client/index.html' : `dist/client${path}/index.html`;
  if (!existsSync(file)) { missing++; console.log('MISSING', path); continue; }
  const html = readFileSync(file, 'utf8');
  const title = dec((html.match(/<title>([^<]*)<\/title>/) || [])[1] || '');
  const desc = dec((html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '');
  checked++;
  if (title !== want.title || desc !== want.description) { diff++; console.log('DIFF', path, '\n  got :', title, '|', desc.slice(0, 60), '\n  want:', want.title, '|', want.description.slice(0, 60)); }
}
console.log(`checked ${checked}, diffs ${diff}, missing ${missing}`);
process.exit(diff ? 1 : 0);
