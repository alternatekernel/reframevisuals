// Prints where two screenshots differ: per horizontal band diff%. Usage: node scripts/diff-bands.mjs <name> [vp=1440] [band=300]
import { readFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const [name, vp = '1440', band = '300'] = process.argv.slice(2);
const a = PNG.sync.read(readFileSync(`tests/baseline/${vp}/${name}.png`));
const b = PNG.sync.read(readFileSync(`tests/shots/${vp}/${name}.png`));
const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height), B = Number(band);
for (let y = 0; y < h; y += B) {
  const hh = Math.min(B, h - y);
  const cut = (img) => { const o = new PNG({ width: w, height: hh }); PNG.bitblt(img, o, 0, y, w, hh, 0, 0); return o; };
  const A = cut(a), C = cut(b), D = new PNG({ width: w, height: hh });
  const n = pixelmatch(A.data, C.data, D.data, w, hh, { threshold: 0.15 });
  const pct = (n / (w * hh)) * 100;
  if (pct > 0.1) console.log(String(y).padStart(6), `${pct.toFixed(2)}%`);
}
