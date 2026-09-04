import { BAY, STUD_D, STUD_W, WALL_H, studSpan, type Model } from '../../model';
import { COLORS, DimH, DimV, Line, Rect, Text, f, makeCtx } from './svg';

export function LongSideDrawing({ m }: { m: Model }) {
  const { L, ridge, nL, tv, rise, angle, roofPieces } = m;
  const k = Math.max(L / 70, ridge / 40);
  const c = makeCtx(k);
  const padL = 8 * k;
  const padR = 5 * k;
  const padT = 1.5 * k;
  const padB = 8.5 * k;
  const studs = Array.from({ length: nL + 1 }, (_, i) => studSpan(i, nL, L));
  // Skjøter mellom glassdeler langs takfallet, projisert i høyde sett fra siden
  const joints = roofPieces.slice(0, -1).map((_, i) => WALL_H + roofPieces.slice(0, i + 1).reduce((a, b) => a + b, 0) * Math.sin(angle));

  return (
    <svg
      viewBox={`${f(-padL)} ${f(-(ridge + padT))} ${f(L + padL + padR)} ${f(ridge + padT + padB)}`}
      role="img"
      aria-label="Fasade langside"
    >
      {/* glass i vegg og tak */}
      <Rect c={c} x={0} y={STUD_W} w={L} h={WALL_H - 2 * STUD_W} kind="glass" />
      <Rect c={c} x={0} y={WALL_H} w={L} h={rise} kind="glass" />
      {/* bunnsvill og toppsvill */}
      <Rect c={c} x={0} y={0} w={L} h={STUD_W} kind="wood" />
      <Rect c={c} x={0} y={WALL_H - STUD_W} w={L} h={STUD_W} kind="wood" />
      {joints.map((y, i) => (
        <Line key={i} c={c} x1={0} y1={y} x2={L} y2={y} kind="glass" />
      ))}
      {/* mønebjelke sett gjennom takglasset */}
      <Rect c={c} x={0} y={ridge - tv - STUD_D} w={L} h={STUD_D} kind="woodFaint" />
      {/* stendere og sperrer c/c 60 */}
      {studs.map(([x0, x1], i) => (
        <g key={i}>
          <Rect c={c} x={x0} y={STUD_W} w={x1 - x0} h={WALL_H - 2 * STUD_W} kind="wood" />
          <Rect c={c} x={x0} y={WALL_H} w={x1 - x0} h={rise} kind="wood" />
        </g>
      ))}
      <Rect c={c} x={0} y={0} w={L} h={ridge} kind="outline" />
      <Line c={c} x1={0} y1={WALL_H} x2={L} y2={WALL_H} kind="outline" />
      <Line c={c} x1={-1.5 * k} y1={0} x2={L + 1.5 * k} y2={0} kind="ground" />
      {/* mål */}
      <DimH c={c} x1={0} x2={BAY} yObj={0} yDim={-2.5 * k} label="c/c 60" />
      <DimH c={c} x1={0} x2={L} yObj={0} yDim={-5.5 * k} label={`${L}`} />
      <DimV c={c} y1={0} y2={WALL_H} xObj={0} xDim={-2.5 * k} label={`${WALL_H}`} />
      <DimV c={c} y1={0} y2={ridge} xObj={0} xDim={-5.5 * k} label={`${ridge}`} />
      <DimV c={c} y1={WALL_H} y2={ridge} xObj={L} xDim={L + 2.5 * k} label={`${rise}`} />
      <Text c={c} x={L} y={-7.6 * k} anchor="end" color={COLORS.ink}>Mål i cm</Text>
    </svg>
  );
}
