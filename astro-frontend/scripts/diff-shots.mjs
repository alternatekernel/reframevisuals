// Compares tests/shots against tests/baseline (pixelmatch). Usage: node scripts/diff-shots.mjs [--max 0.02]
import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const maxArg = process.argv.indexOf('--max');
const max = maxArg > -1 ? Number(process.argv[maxArg + 1]) : 0.02;
let worst = 0, over = 0;
for (const vp of ['1440', '390']) {
  mkdirSync(join('tests/diff', vp), { recursive: true });
  for (const f of readdirSync(join('tests/baseline', vp)).filter((x) => x.endsWith('.png'))) {
    const shot = join('tests/shots', vp, f);
    if (!existsSync(shot)) { console.log(vp, f.padEnd(52), 'MISSING'); continue; }
    const a = PNG.sync.read(readFileSync(join('tests/baseline', vp, f)));
    const b = PNG.sync.read(readFileSync(shot));
    const w = Math.min(a.width, b.width), h = Math.min(a.height, b.height);
    const crop = (img) => { const o = new PNG({ width: w, height: h }); PNG.bitblt(img, o, 0, 0, w, h, 0, 0); return o; };
    const A = crop(a), B = crop(b), D = new PNG({ width: w, height: h });
    const n = pixelmatch(A.data, B.data, D.data, w, h, { threshold: 0.15 });
    const ratio = n / (w * h);
    const dh = b.height - a.height;
    const bad = ratio > max || Math.abs(dh) > 24;
    if (bad) { over++; writeFileSync(join('tests/diff', vp, f), PNG.sync.write(D)); }
    worst = Math.max(worst, ratio);
    console.log(vp, f.padEnd(52), `${(ratio * 100).toFixed(2)}% diff`.padEnd(14), `height ${a.height}->${b.height} (${dh >= 0 ? '+' : ''}${dh})`, bad ? 'OVER' : 'ok');
  }
}
console.log(`\n${over} page(s) over threshold (${max * 100}%), worst ${(worst * 100).toFixed(2)}%`);
process.exit(over ? 1 : 0);
