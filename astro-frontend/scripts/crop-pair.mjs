// Side-by-side crop of baseline | shot | diff. Usage: node scripts/crop-pair.mjs <name> <vp> <y> <h> <out.png>
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
const [name, vp, y0, hh, out] = process.argv.slice(2);
const y = Number(y0), h = Number(hh);
const a = PNG.sync.read(readFileSync(`tests/baseline/${vp}/${name}.png`));
const b = PNG.sync.read(readFileSync(`tests/shots/${vp}/${name}.png`));
const w = Math.min(a.width, b.width);
const cut = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, y, w, h, 0, 0); return o; };
const A = cut(a), B = cut(b), D = new PNG({ width: w, height: h });
pixelmatch(A.data, B.data, D.data, w, h, { threshold: 0.15 });
const o = new PNG({ width: w * 3 + 20, height: h });
[A, B, D].forEach((im, i) => PNG.bitblt(im, o, 0, 0, w, h, i * (w + 10), 0));
writeFileSync(out, PNG.sync.write(o));
