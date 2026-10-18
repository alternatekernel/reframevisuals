// After codemod-astro: point imports at sibling .astro files; give still-React children a client directive if they need JS.
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';

const roots = ['src/sections', 'src/views'];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const astroFiles = roots.flatMap(walk).filter((f) => f.endsWith('.astro'));
const needsJs = (tsx) => /\buse(State|Effect|Ref|Reducer|Context|Content|Currency|Services|Modal|Navigate|SearchParams|Blog)\w*\(|\bon[A-Z]\w*=\{|AnimatePresence|framer-motion/.test(readFileSync(tsx, 'utf8'));

for (const file of astroFiles) {
  let src = readFileSync(file, 'utf8');
  const dir = dirname(file);
  const directives = [];
  src = src.replace(/^import\s+(\w+)\s+from\s+'(\.[^']+)';?$/gm, (line, name, spec) => {
    if (/\.(astro|css|ts|json)$/.test(spec)) return line;
    const base = resolve(dir, spec);
    if (existsSync(base + '.astro')) return `import ${name} from '${spec}.astro';`;
    if (existsSync(base + '.tsx')) {
      if (!needsJs(base + '.tsx')) return line;
      // Interactive React child: hydrate it through a provider-wrapped island.
      mkdirSync('src/islands/wrapped', { recursive: true });
      const wrapper = join('src/islands/wrapped', `${name}.tsx`);
      const rel = relative(dirname(wrapper), base).replace(/\\/g, '/');
      writeFileSync(wrapper, `import View from '${rel}';\nimport { routed } from '../routed';\n\nexport default routed(View as any);\n`);
      directives.push(name);
      return `import ${name} from '${relative(dir, join('src/islands/wrapped', name)).replace(/\\/g, '/')}';`;
    }
    return line;
  });
  for (const name of directives) {
    src = src.replace(new RegExp(`<${name}(?=[\\s/>])(?![^>]*client:)`, 'g'), `<${name} client:visible path={Astro.url.pathname}`);
  }
  writeFileSync(file, src);
  if (directives.length) console.log(`${file}: hydrates ${directives.join(', ')}`);
}
