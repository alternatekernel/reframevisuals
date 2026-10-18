// Connector geometry for the workflow diagram. Endpoints are "fraction|px" pairs resolved against the container width
// so the same spec renders on the server (default width) and is re-resolved on resize in src/lib/ui/workflow.ts.
export type Pt = [number, number, number]; // [x fraction of width, x px offset, y px]
export interface Conn { from: Pt; to: Pt; color: string; i: number; vertical: boolean }

const M = 0.5; // base delay
export const delay = (i: number) => M + i * 0.14;

export const pathD = (c: Conn, w: number) => {
  const x1 = c.from[0] * w + c.from[1], y1 = c.from[2], x2 = c.to[0] * w + c.to[1], y2 = c.to[2];
  if (c.vertical) { const my = (y1 + y2) / 2; return `M ${x1} ${y1} C ${x1} ${my}, ${x2} ${my}, ${x2} ${y2}`; }
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
};

const mid = 150;
export const DESKTOP: Conn[] = [
  { from: [0, 34, 34], to: [0.2, -55, mid], color: '#3B82F6', i: 0, vertical: false },
  { from: [0, 34, 150], to: [0.2, -55, mid], color: '#C2410C', i: 0, vertical: false },
  { from: [0, 34, 266], to: [0.2, -55, mid], color: '#8B5CF6', i: 0, vertical: false },
  { from: [0.2, 55, mid], to: [0.38, -55, mid], color: '#3B82F6', i: 1, vertical: false },
  { from: [0.38, 55, mid], to: [0.62, -55, mid], color: '#C2410C', i: 2, vertical: false },
  { from: [0.62, 55, mid], to: [0.8, -55, mid], color: '#8B5CF6', i: 3, vertical: false },
  { from: [0.8, 55, mid], to: [1, -34, 34], color: '#DB2777', i: 4, vertical: false },
  { from: [0.8, 55, mid], to: [1, -34, 150], color: '#4F46E5', i: 4, vertical: false },
  { from: [0.8, 55, mid], to: [1, -34, 266], color: '#0D9488', i: 4, vertical: false },
];
export const MOBILE: Conn[] = [
  { from: [1 / 6, 0, 100], to: [0.5, 0, 170], color: '#3B82F6', i: 0, vertical: true },
  { from: [0.5, 0, 100], to: [0.5, 0, 170], color: '#C2410C', i: 0, vertical: true },
  { from: [5 / 6, 0, 100], to: [0.5, 0, 170], color: '#8B5CF6', i: 0, vertical: true },
  { from: [0.5, 0, 234], to: [0.5, 0, 310], color: '#3B82F6', i: 1, vertical: true },
  { from: [0.5, 0, 374], to: [0.5, 0, 450], color: '#C2410C', i: 2, vertical: true },
  { from: [0.5, 0, 514], to: [0.5, 0, 590], color: '#8B5CF6', i: 3, vertical: true },
  { from: [0.5, 0, 654], to: [1 / 6, 0, 720], color: '#DB2777', i: 4, vertical: true },
  { from: [0.5, 0, 654], to: [0.5, 0, 720], color: '#4F46E5', i: 4, vertical: true },
  { from: [0.5, 0, 654], to: [5 / 6, 0, 720], color: '#0D9488', i: 4, vertical: true },
];
