import { BAY, BEAM_H, BEAM_W, POST_W, STUD_D, STUD_W, WALL_H, bracePoly, gableStudTops, n0, n1, type Model } from '../../model';
import { COLORS, DimAlong, DimH, DimV, Line, Poly, Rect, Text, f, makeCtx } from './svg';

export function GableDrawing({ m }: { m: Model }) {
  const { W, ridge, halfW, rise, tv, seatX, beamBottom, postTop, gableStuds, angle, angleDeg, slopeLen, roofPieces, roofTop, bracing, braceW, wallBracesGable } = m;
  const braceKind = bracing === 'stal' ? 'steel' : 'wood';
  const k = Math.max(W / 70, ridge / 40);
  const c = makeCtx(k);
  const padL = 8 * k;
  const padR = 5 * k;
  const padT = 6.5 * k;
  const padB = 8.5 * k;
  const angleX = halfW / 2;
  const roofDim = 4 * k;
  // Punkt på høyre takflate i avstand s fra raften
  const rightSlope = (s: number): [number, number] => [W - s * Math.cos(angle), WALL_H + s * Math.sin(angle)];
  const pieceStarts = roofPieces.map((_, i) => roofPieces.slice(0, i).reduce((a, b) => a + b, 0));

  return (
    <svg
      viewBox={`${f(-padL)} ${f(-(ridge + padT))} ${f(W + padL + padR)} ${f(ridge + padT + padB)}`}
      role="img"
      aria-label="Fasade kortside (gavl)"
    >
      {/* glass opp til underkant sperre */}
      <Poly
        c={c}
        pts={[[0, STUD_W], [0, WALL_H], [seatX, WALL_H], [halfW, ridge - tv], [W - seatX, WALL_H], [W, WALL_H], [W, STUD_W]]}
        kind="glass"
      />
      {/* bunnsvill */}
      <Rect c={c} x={0} y={0} w={W} h={STUD_W} kind="wood" />
      {/* vindavstivning i gavlen, innfelt i stenderne */}
      {wallBracesGable.map((br, i) => (
        <Poly key={i} c={c} pts={bracePoly(br, braceW)} kind={braceKind} />
      ))}
      {/* hjørnestendere fra langveggene (98 dype sett fra enden) og toppsvill sett fra enden */}
      <Rect c={c} x={0} y={STUD_W} w={STUD_D} h={WALL_H - 2 * STUD_W} kind="wood" />
      <Rect c={c} x={W - STUD_D} y={STUD_W} w={STUD_D} h={WALL_H - 2 * STUD_W} kind="wood" />
      <Rect c={c} x={0} y={WALL_H - STUD_W} w={STUD_D} h={STUD_W} kind="wood" />
      <Rect c={c} x={W - STUD_D} y={WALL_H - STUD_W} w={STUD_D} h={STUD_W} kind="wood" />
      {/* gavlstendere c/c 60 opp til sperre */}
      {gableStuds.map(([x0, x1], j) => {
        const [t0, t1] = gableStudTops(m, x0, x1);
        return <Poly key={j} c={c} pts={[[x0, STUD_W], [x1, STUD_W], [x1, t1], [x0, t0]]} kind="wood" />;
      })}
      {/* stolpe 48 × 148 under mønedrageren */}
      <Rect c={c} x={halfW - POST_W / 2} y={STUD_W} w={POST_W} h={postTop - STUD_W} kind="wood" />
      {/* mønedrager i limtre sett fra enden */}
      <Rect c={c} x={halfW - BEAM_W / 2} y={beamBottom} w={BEAM_W} h={BEAM_H} kind="wood" />
      {/* sperrer */}
      <Poly c={c} pts={[[0, WALL_H], [halfW, ridge], [halfW, ridge - tv], [seatX, WALL_H]]} kind="wood" />
      <Poly c={c} pts={[[W, WALL_H], [halfW, ridge], [halfW, ridge - tv], [W - seatX, WALL_H]]} kind="wood" />
      <Poly c={c} pts={[[0, 0], [0, WALL_H], [halfW, ridge], [W, WALL_H], [W, 0]]} kind="outline" />
      <Line c={c} x1={-1.5 * k} y1={0} x2={W + 1.5 * k} y2={0} kind="ground" />
      {/* mål */}
      <DimH c={c} x1={0} x2={BAY} yObj={0} yDim={-2.5 * k} label="c/c 60" />
      <DimH c={c} x1={0} x2={W} yObj={0} yDim={-5.5 * k} label={`${W}`} />
      <DimV c={c} y1={0} y2={WALL_H} xObj={0} xDim={-2.5 * k} label={`${WALL_H}`} />
      <DimV c={c} y1={0} y2={ridge} xObj={0} xDim={-5.5 * k} label={`${ridge}`} />
      <DimV c={c} y1={WALL_H} y2={ridge} xObj={W} xDim={W + 2.5 * k} label={`${rise}`} />
      {/* takside raft–møne, og glassdeler langs takfallet */}
      <DimAlong c={c} p1={[0, WALL_H]} p2={[halfW, ridge]} offset={roofDim} label={n0(slopeLen)} />
      {roofPieces.length > 1 &&
        roofPieces.map((len, i) => (
          <DimAlong key={i} c={c} p1={rightSlope(pieceStarts[i] + len)} p2={rightSlope(pieceStarts[i])} offset={roofDim} label={n0(len)} />
        ))}
      <Text c={c} x={angleX} y={roofTop(angleX) + 0.6 * k} rotate={-angleDeg} color={COLORS.ink}>
        {n1(angleDeg)}°
      </Text>
      <Text c={c} x={W} y={-7.6 * k} anchor="end" color={COLORS.ink}>Mål i cm</Text>
    </svg>
  );
}
