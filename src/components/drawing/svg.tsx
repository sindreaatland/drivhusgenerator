import type { ReactNode, SVGAttributes } from 'react';

/** Tegnekontekst: k er en skalaenhet (cm) som gjør tekst og strek like store uansett størrelse på drivhuset. */
export interface DrawCtx {
  k: number;
  font: number;
  tick: number;
  over: number;
  sw: number;
}

export const makeCtx = (k: number): DrawCtx => ({
  k,
  font: 1.15 * k,
  tick: 0.35 * k,
  over: 0.5 * k,
  sw: 0.09 * k,
});

export const f = (v: number) => Math.round(v * 100) / 100;

export const COLORS = {
  wood: '#dfbe85',
  woodStroke: '#6b4a1c',
  woodFaint: '#efdcb8',
  woodFaintStroke: '#b08d5a',
  glass: '#d6eaf8',
  glassStroke: '#8bb8d9',
  ink: '#1f2937',
  dim: '#b91c1c',
};

export type Kind = 'wood' | 'woodFaint' | 'glass' | 'outline' | 'ground' | 'dim' | 'tick';

function style(c: DrawCtx, kind: Kind): SVGAttributes<SVGElement> {
  switch (kind) {
    case 'wood':
      return { fill: COLORS.wood, stroke: COLORS.woodStroke, strokeWidth: f(c.sw) };
    case 'woodFaint':
      return { fill: COLORS.woodFaint, stroke: COLORS.woodFaintStroke, strokeWidth: f(c.sw) };
    case 'glass':
      return { fill: COLORS.glass, stroke: COLORS.glassStroke, strokeWidth: f(c.sw * 0.6) };
    case 'outline':
      return { fill: 'none', stroke: COLORS.ink, strokeWidth: f(c.sw * 1.4) };
    case 'ground':
      return { stroke: COLORS.ink, strokeWidth: f(c.sw * 2.5) };
    case 'dim':
      return { stroke: COLORS.dim, strokeWidth: f(c.sw * 0.45), fill: 'none' };
    case 'tick':
      return { stroke: COLORS.dim, strokeWidth: f(c.sw * 0.9) };
  }
}

// Modellkoordinater har y oppover; SVG har y nedover. Alle hjelpere speiler y.

export function Rect({ c, x, y, w, h, kind }: { c: DrawCtx; x: number; y: number; w: number; h: number; kind: Kind }) {
  return <rect x={f(x)} y={f(-(y + h))} width={f(w)} height={f(h)} {...style(c, kind)} />;
}

export function Poly({ c, pts, kind }: { c: DrawCtx; pts: [number, number][]; kind: Kind }) {
  return <polygon points={pts.map(([x, y]) => `${f(x)},${f(-y)}`).join(' ')} {...style(c, kind)} />;
}

export function Line({ c, x1, y1, x2, y2, kind }: { c: DrawCtx; x1: number; y1: number; x2: number; y2: number; kind: Kind }) {
  return <line x1={f(x1)} y1={f(-y1)} x2={f(x2)} y2={f(-y2)} {...style(c, kind)} />;
}

export function Text({
  c, x, y, rotate = 0, anchor = 'middle', color = COLORS.dim, children,
}: {
  c: DrawCtx; x: number; y: number; rotate?: number; anchor?: 'start' | 'middle' | 'end'; color?: string; children: ReactNode;
}) {
  const sx = f(x);
  const sy = f(-y);
  return (
    <text
      x={sx}
      y={sy}
      fontSize={f(c.font)}
      textAnchor={anchor}
      fill={color}
      fontFamily="system-ui, -apple-system, sans-serif"
      transform={rotate ? `rotate(${f(rotate)} ${sx} ${sy})` : undefined}
    >
      {children}
    </text>
  );
}

/** Horisontalt mål mellom x1 og x2. yObj er objektet som måles, yDim er der målelinjen ligger. */
export function DimH({ c, x1, x2, yObj, yDim, label }: { c: DrawCtx; x1: number; x2: number; yObj: number; yDim: number; label: string }) {
  const s = Math.sign(yDim - yObj) || -1;
  return (
    <g>
      <Line c={c} x1={x1} y1={yObj} x2={x1} y2={yDim + c.over * s} kind="dim" />
      <Line c={c} x1={x2} y1={yObj} x2={x2} y2={yDim + c.over * s} kind="dim" />
      <Line c={c} x1={x1 - c.over} y1={yDim} x2={x2 + c.over} y2={yDim} kind="dim" />
      <Line c={c} x1={x1 - c.tick} y1={yDim - c.tick} x2={x1 + c.tick} y2={yDim + c.tick} kind="tick" />
      <Line c={c} x1={x2 - c.tick} y1={yDim - c.tick} x2={x2 + c.tick} y2={yDim + c.tick} kind="tick" />
      <Text c={c} x={(x1 + x2) / 2} y={yDim + 0.3 * c.k}>{label}</Text>
    </g>
  );
}

/** Vertikalt mål mellom y1 og y2. xObj er objektet som måles, xDim er der målelinjen ligger. */
export function DimV({ c, y1, y2, xObj, xDim, label }: { c: DrawCtx; y1: number; y2: number; xObj: number; xDim: number; label: string }) {
  const s = Math.sign(xDim - xObj) || -1;
  return (
    <g>
      <Line c={c} x1={xObj} y1={y1} x2={xDim + c.over * s} y2={y1} kind="dim" />
      <Line c={c} x1={xObj} y1={y2} x2={xDim + c.over * s} y2={y2} kind="dim" />
      <Line c={c} x1={xDim} y1={y1 - c.over} x2={xDim} y2={y2 + c.over} kind="dim" />
      <Line c={c} x1={xDim - c.tick} y1={y1 - c.tick} x2={xDim + c.tick} y2={y1 + c.tick} kind="tick" />
      <Line c={c} x1={xDim - c.tick} y1={y2 - c.tick} x2={xDim + c.tick} y2={y2 + c.tick} kind="tick" />
      <Text c={c} x={s < 0 ? xDim - 0.35 * c.k : xDim + 0.35 * c.k + c.font} y={(y1 + y2) / 2} rotate={-90}>{label}</Text>
    </g>
  );
}

/**
 * Mål langs en vilkårlig retning fra p1 til p2 (p1 bør ha minst x, så teksten leses fra venstre).
 * Målelinjen legges `offset` ut fra p1–p2 langs normalen 90° mot klokka, dvs. utover for takflatene.
 */
export function DimAlong({ c, p1, p2, offset, label }: { c: DrawCtx; p1: [number, number]; p2: [number, number]; offset: number; label: string }) {
  const dx = p2[0] - p1[0];
  const dy = p2[1] - p1[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const nx = -uy;
  const ny = ux;
  const q1: [number, number] = [p1[0] + nx * offset, p1[1] + ny * offset];
  const q2: [number, number] = [p2[0] + nx * offset, p2[1] + ny * offset];
  const e = offset + c.over;
  const tx = ux + nx;
  const ty = uy + ny;
  const rot = (-Math.atan2(uy, ux) * 180) / Math.PI;
  const mx = (q1[0] + q2[0]) / 2 + nx * 0.3 * c.k;
  const my = (q1[1] + q2[1]) / 2 + ny * 0.3 * c.k;
  return (
    <g>
      <Line c={c} x1={p1[0]} y1={p1[1]} x2={p1[0] + nx * e} y2={p1[1] + ny * e} kind="dim" />
      <Line c={c} x1={p2[0]} y1={p2[1]} x2={p2[0] + nx * e} y2={p2[1] + ny * e} kind="dim" />
      <Line c={c} x1={q1[0] - ux * c.over} y1={q1[1] - uy * c.over} x2={q2[0] + ux * c.over} y2={q2[1] + uy * c.over} kind="dim" />
      <Line c={c} x1={q1[0] - tx * c.tick} y1={q1[1] - ty * c.tick} x2={q1[0] + tx * c.tick} y2={q1[1] + ty * c.tick} kind="tick" />
      <Line c={c} x1={q2[0] - tx * c.tick} y1={q2[1] - ty * c.tick} x2={q2[0] + tx * c.tick} y2={q2[1] + ty * c.tick} kind="tick" />
      <Text c={c} x={mx} y={my} rotate={rot}>{label}</Text>
    </g>
  );
}
