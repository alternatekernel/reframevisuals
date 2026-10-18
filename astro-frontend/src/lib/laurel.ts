// ── Curved laurel branch geometry ───────────────────────────────────────────
// A long, sweeping stem (cubic bézier) with sharp-tipped blade leaves sampled
// along the curve — each leaf swept outward-and-up, tapering toward the apex.
export interface LaurelLeaf { d: string; vx1: number; vy1: number; vx2: number; vy2: number; t: number; }

export const buildLaurel = (): { leaves: LaurelLeaf[]; stemPath: (a: number, b: number) => string } => {
  const P0 = { x: 84, y: 452 };  // base (bottom, near card)
  const P1 = { x: 0, y: 318 };   // bows outward (left)
  const P2 = { x: 30, y: 116 };
  const P3 = { x: 132, y: 66 };  // apex hooks back in — drapes over the card corner

  const bez = (t: number) => {
    const m = 1 - t;
    return {
      x: m * m * m * P0.x + 3 * m * m * t * P1.x + 3 * m * t * t * P2.x + t * t * t * P3.x,
      y: m * m * m * P0.y + 3 * m * m * t * P1.y + 3 * m * t * t * P2.y + t * t * t * P3.y,
    };
  };
  const dbez = (t: number) => {
    const m = 1 - t;
    return {
      x: 3 * m * m * (P1.x - P0.x) + 6 * m * t * (P2.x - P1.x) + 3 * t * t * (P3.x - P2.x),
      y: 3 * m * m * (P1.y - P0.y) + 6 * m * t * (P2.y - P1.y) + 3 * t * t * (P3.y - P2.y),
    };
  };

  const f = (n: number) => n.toFixed(1);
  const N = 16;
  const t0 = 0.05, span = 0.91;
  const leaves: LaurelLeaf[] = [];

  // side: +1 = outer (convex, points away from card), -1 = inner (toward stem/card)
  const makeLeaf = (t: number, side: number, lenScale: number): LaurelLeaf => {
    const r = Math.min(1, Math.max(0, (t - t0) / span));
    const p = bez(t);
    const d = dbez(t);
    const dl = Math.hypot(d.x, d.y) || 1;
    const tx = d.x / dl, ty = d.y / dl;          // unit tangent (up the curve)

    let nx = ty, ny = -tx;                        // normal
    if (nx > 0) { nx = -nx; ny = -ny; }          // force outward (left)
    nx *= side; ny *= side;                       // flip to inner when side = -1

    let lx = nx + 0.5 * tx, ly = ny + 0.5 * ty;  // sweep leaf up along the branch
    const ll = Math.hypot(lx, ly) || 1;
    lx /= ll; ly /= ll;

    const len = (58 - 34 * r) * lenScale;        // long at base → short at tip
    const wid = (10 - 5.5 * r) * (0.6 + 0.4 * lenScale);
    const bx = p.x, by = p.y;
    const ax = bx + lx * len, ay = by + ly * len; // sharp tip
    const mx = (bx + ax) / 2, my = (by + ay) / 2;
    const px = -ly, py = lx;                      // perpendicular to leaf axis
    const c1x = mx + px * wid, c1y = my + py * wid;
    const c2x = mx - px * wid, c2y = my - py * wid;

    return {
      d: `M${f(bx)} ${f(by)} Q${f(c1x)} ${f(c1y)} ${f(ax)} ${f(ay)} Q${f(c2x)} ${f(c2y)} ${f(bx)} ${f(by)} Z`,
      vx1: bx, vy1: by, vx2: ax, vy2: ay, t,
    };
  };

  // Outer row — long leaves along the convex edge
  for (let i = 0; i < N; i++) {
    leaves.push(makeLeaf(t0 + (i / (N - 1)) * span, 1, 1));
  }
  // Inner row — shorter leaves, interleaved between the outer ones
  for (let i = 0; i < N - 1; i++) {
    leaves.push(makeLeaf(t0 + ((i + 0.5) / (N - 1)) * span, -1, 0.64));
  }
  // Crowning leaf right at the apex tip
  leaves.push(makeLeaf(1, 1, 0.9));

  // Smooth stem sub-path sampled between two curve parameters (for front/behind splitting)
  const stemPath = (a: number, b: number): string => {
    const steps = 30;
    let d = '';
    for (let i = 0; i <= steps; i++) {
      const p = bez(a + (b - a) * (i / steps));
      d += i === 0 ? `M${f(p.x)} ${f(p.y)}` : ` L${f(p.x)} ${f(p.y)}`;
    }
    return d;
  };

  return { leaves, stemPath };
};

export const LAUREL = buildLaurel();
export const TSPLIT = 0.5; // split along the branch: t <= TSPLIT -> base half, t > TSPLIT -> apex half
