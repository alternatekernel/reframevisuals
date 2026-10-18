// Lists src files that nothing reachable imports (entries: Astro pages/layouts/components, SPA main, chat + boot islands).
// Usage: node scripts/unused.mjs [--delete]
import { readFileSync, readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, dirname, resolve, extname } from 'node:path';

const root = 'src';
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const all = walk(root);
const exts = ['', '.ts', '.tsx', '.astro', '.js', '.mjs', '.css', '.json'];
const resolveImport = (from, spec) => {
  let base;
  if (spec.startsWith('.')) base = resolve(dirname(from), spec);
  else if (spec === 'react-router-dom') base = resolve(root, 'shims/react-router-dom');
  else if (spec === 'react-helmet-async') base = resolve(root, 'shims/react-helmet-async');
  else return null;
  for (const e of exts) { const f = base + e; if (existsSync(f) && statSync(f).isFile()) return f; }
  for (const e of exts.slice(1)) { const f = join(base, 'index' + e); if (existsSync(f)) return f; }
  return null;
};
const entries = all.filter((f) => /^src[\\/](pages|layouts|directives)[\\/]/.test(f) || f.endsWith('.astro') || /lib[\\/]ui[\\/]/.test(f) || f.endsWith('.css'))
  .concat(['src/spa/main.tsx', 'src/islands/ChatIsland.tsx', 'src/islands/BootLoaderIsland.tsx', 'src/islands/wrapped/EmbeddedChat.tsx'].filter(existsSync));
// Astro integration glue / generated per-mode files are always kept.
const keep = (f) => /cms-emdash|live\.config|env\.d\.ts/.test(f);
const seen = new Set();
const stack = entries.map((f) => resolve(f));
while (stack.length) {
  const f = stack.pop();
  if (seen.has(f)) continue;
  seen.add(f);
  if (!/\.(ts|tsx|astro|js|mjs)$/.test(f)) continue;
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/(?:from\s+|import\s*\(\s*|import\s+|require\(\s*)['"]([^'"]+)['"]/g)) {
    const r = resolveImport(f, m[1]);
    if (r && !seen.has(r)) stack.push(r);
  }
}
const unused = all.map((f) => resolve(f)).filter((f) => !seen.has(f) && !keep(f) && /\.(tsx?|astro|js)$/.test(f));
// An Astro page's own .astro is an entry; a .tsx with a sibling .astro replaced by it is dead too.
for (const f of unused) console.log(f.replace(resolve(root) + '/', ''));
console.error(`${unused.length} unused of ${all.length}`);
if (process.argv.includes('--delete')) for (const f of unused) unlinkSync(f);
