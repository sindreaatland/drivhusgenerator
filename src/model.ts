// Alle mål i cm.

export const BAY = 60; // senteravstand stendere = bredde på glass
export const WALL_H = 210; // vegghøyde langside = høyde på glass
export const PANEL_W = 60;
export const PANEL_H = 210;
export const STUD_W = 4.8; // 48 mm, stendere og sviller 48 × 98
export const STUD_D = 9.8; // 98 mm
export const RAFTER_W = 4.8; // sperrer 48 × 148
export const RAFTER_D = 14.8;
export const BEAM_W = 14; // limtredrager i mønet 140 × 315
export const BEAM_H = 31.5;
export const POST_W = 14.8; // stolpe 48 × 148 under mønedrageren i hver gavl, 148 ligger i gavlplanet
export const POST_T = 4.8;
export const STRIP_W = 4.5; // klemmelist 21 × 45 over alle glasskanter
export const STRIP_T = 2.1;

export const WIDTH_MIN = 120;
export const WIDTH_MAX = 720;
export const LENGTH_MIN = 120;
export const LENGTH_MAX = 1200;
export const RIDGE_MIN = 240;
export const RIDGE_MAX = 600;

/** Vindavstivning: ingen, innfelte skråstag i tre eller stålbånd (hullbånd) lagt som skråstagene. */
export type Bracing = 'ingen' | 'tre' | 'stal';
export const BRACINGS: readonly Bracing[] = ['ingen', 'tre', 'stal'];
export const BRACE_W = STUD_D; // skråstag 48 × 98 felles inn i stenderne, 98 ligger i veggplanet
export const BRACE_T = STUD_W;
export const BAND_W = 4; // hullbånd 40 × 2 mm
export const BAND_T = 0.2;

export const braceSize = (kind: Bracing): { w: number; t: number } =>
  kind === 'stal' ? { w: BAND_W, t: BAND_T } : { w: BRACE_W, t: BRACE_T };

export interface Params {
  width: number;
  length: number;
  ridge: number;
  bracing: Bracing;
  glassPrice: number; // kr per panel 60 × 210
  woodPrice: number; // kr per meter 48 × 98
  rafterPrice: number; // kr per meter 48 × 148
  beamPrice: number; // kr per meter limtre 140 × 315
  stripPrice: number; // kr per meter klemmelist
  bandPrice: number; // kr per meter hullbånd
  showPrice: boolean; // vis priser og prisoverslag
}

export const DEFAULT_PARAMS: Params = {
  width: 300,
  length: 480,
  ridge: 290,
  bracing: 'tre',
  glassPrice: 650,
  woodPrice: 39,
  rafterPrice: 59,
  beamPrice: 750,
  stripPrice: 35,
  bandPrice: 30,
  showPrice: false,
};

/**
 * Én diagonal i et vegg- eller takplan. Senterlinje i planets egne koordinater:
 * [langs planet, opp langs planet]. a ligger i hjørnet ved svill/raft, b ved stenderen/sperren feltet ender på.
 */
export interface Brace {
  a: [number, number];
  b: [number, number];
}

export interface Model {
  W: number;
  L: number;
  ridge: number;
  nW: number; // antall fag på kortside
  nL: number; // antall fag på langside
  halfW: number;
  rise: number; // mønehøyde − 210
  slopeLen: number; // sperrelengde
  angle: number; // takvinkel (rad)
  angleDeg: number;
  tv: number; // sperrens vertikale tykkelse
  seatX: number; // avstand fra vegg til der sperrens underside forlater toppsvillen
  beamTop: number; // overkant mønedrager, der sperrenes underside treffer dragerens kanter
  beamBottom: number; // underkant mønedrager
  gableStuds: [number, number][]; // stendere i én gavl, uten den stolpen erstatter
  post: [number, number]; // stolpe under mønedrageren, utstrekning på tvers av gavlen
  postTop: number; // stolpen bærer drageren
  roofPieces: number[]; // glassdeler langs takfallet per fag, fra raft mot møne (cm)
  roofTop: (z: number) => number; // overkant tak ved avstand z fra langvegg
  roofUnder: (z: number) => number; // underkant sperre ved avstand z fra langvegg
  bracing: Bracing;
  braceW: number; // bredde på skråstag/bånd i planet
  braceT: number; // tykkelse ut av planet
  braceBaysL: number; // fag per hjørnefelt på langvegg og i tak
  braceBaysW: number; // fag per hjørnefelt på gavl
  wallBracesLong: Brace[]; // (x, y) i langveggens plan, én vegg
  wallBracesGable: Brace[]; // (z, y) i gavlens plan, én gavl
  roofBraces: Brace[]; // (x, s) i takplanet, s langs takfallet fra raft; én takside
  roofBraceDepth: number; // fra overkant tak ned til senter av avstivningen, langs normalen
}

/** Deler ett fag av taket i glass langs takfallet: hele paneler à 210 fra raften, og en rest øverst mot mønet. */
export function roofPieces(slopeLen: number): number[] {
  const full = Math.floor(slopeLen / PANEL_H);
  const rest = slopeLen - full * PANEL_H;
  const pieces: number[] = Array.from({ length: full }, () => PANEL_H);
  if (rest >= 0.5 || pieces.length === 0) pieces.push(rest);
  return pieces;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const snap = (v: number) => Math.round(v / BAY) * BAY;

/** Antall fag hvert hjørnefelt med avstivning spenner over i et plan med n fag. */
export const braceBays = (n: number) => Math.max(1, Math.min(2, Math.floor(n / 2)));

/** Diagonal med ytterkant i hjørnet x0 og senter ved stenderen i xFar, fra y0 til y1. */
function cornerBrace(x0: number, xFar: number, y0: number, y1: number, w: number): Brace {
  const dir = Math.sign(xFar - x0);
  let h = 0;
  for (let i = 0; i < 3; i++) {
    const phi = Math.atan2(Math.abs(y1 - y0), Math.abs(xFar - x0) - h);
    h = w / 2 / Math.sin(phi);
  }
  return { a: [x0 + dir * h, y0], b: [xFar, y1] };
}

/**
 * Avstivning i et plan med n fag à 60, fra svill/raft (y0) til overkant (y1), i planets koordinater:
 * én diagonal fra hvert hjørne, stigende inn mot midten. Samme oppsett for skråstag i tre og stålbånd.
 * inset er avstanden fra planets ende inn til hjørnet avstivningen starter i.
 */
export function planeBraces(kind: Bracing, n: number, inset: number, y0: number, y1: number, w: number): Brace[] {
  if (kind === 'ingen') return [];
  const len = n * BAY;
  const span = braceBays(n) * BAY;
  return [cornerBrace(inset, span, y0, y1, w), cornerBrace(len - inset, len - span, y0, y1, w)];
}

function braceDir(br: Brace) {
  const dx = br.b[0] - br.a[0];
  const dy = br.b[1] - br.a[1];
  const len = Math.hypot(dx, dy);
  return { dx, dy, len, ux: dx / len, uy: dy / len, phi: Math.atan2(Math.abs(dy), Math.abs(dx)) };
}

/** Vinkel mot svillen i grader. */
export const braceAngleDeg = (br: Brace) => (braceDir(br).phi * 180) / Math.PI;

/** Omriss av diagonalen med bredde w, kappet parallelt med svillen i begge ender. */
export function bracePoly(br: Brace, w: number): [number, number][] {
  const h = w / 2 / Math.sin(braceDir(br).phi);
  return [[br.a[0] - h, br.a[1]], [br.a[0] + h, br.a[1]], [br.b[0] + h, br.b[1]], [br.b[0] - h, br.b[1]]];
}

/** Senterlinje forkortet i begge ender så en boks med bredde w ikke går inn i svillene. */
export function braceEnds(br: Brace, w: number): [[number, number], [number, number]] {
  const { ux, uy, phi } = braceDir(br);
  const e = w / 2 / Math.tan(phi);
  return [[br.a[0] + ux * e, br.a[1] + uy * e], [br.b[0] - ux * e, br.b[1] - uy * e]];
}

/** Kappelengde langs diagonalen, ytterkant til ytterkant. */
export function braceLen(br: Brace, w: number): number {
  const { len, phi } = braceDir(br);
  return len + w / Math.tan(phi);
}

export function buildModel(W: number, L: number, ridge: number, bracing: Bracing): Model {
  const nW = Math.round(W / BAY);
  const nL = Math.round(L / BAY);
  const halfW = W / 2;
  const rise = ridge - WALL_H;
  const slopeLen = Math.hypot(halfW, rise);
  const angle = Math.atan2(rise, halfW);
  const tv = RAFTER_D / Math.cos(angle);
  const seatX = Math.min(halfW, (tv * halfW) / rise);
  const beamTop = ridge - tv - (BEAM_W / 2) * Math.tan(angle);
  const beamBottom = beamTop - BEAM_H;
  const post: [number, number] = [halfW - POST_W / 2, halfW + POST_W / 2];
  const gableStuds = Array.from({ length: Math.max(0, nW - 1) }, (_, j) => studSpan(j + 1, nW, W))
    .filter(([z0, z1]) => z1 < post[0] || z0 > post[1]);
  const roofTop = (z: number) => WALL_H + rise * (1 - Math.abs(z - halfW) / halfW);
  const roofUnder = (z: number) => Math.max(WALL_H, roofTop(z) - tv);

  // Vindavstivning. Skråstag felles inn i stendere og sperrer fra innsiden; stålbånd spikres på innsiden/undersiden.
  const { w: braceW, t: braceT } = braceSize(bracing);
  const wallBracesLong = planeBraces(bracing, nL, 0, STUD_W, WALL_H - STUD_W, braceW);
  const wallBracesGable = planeBraces(bracing, nW, STUD_D, STUD_W, WALL_H - STUD_W, braceW);
  const roofBraceDepth = bracing === 'stal' ? RAFTER_D + braceT / 2 : RAFTER_D - braceT / 2;
  const sA = roofBraceDepth / Math.tan(angle); // der avstivningen møter toppsvillen ved sperrefoten
  const sB = (halfW - BEAM_W / 2 - roofBraceDepth * Math.sin(angle)) / Math.cos(angle); // inntil mønedrageren
  const roofBraces = planeBraces(bracing, nL, 0, sA, sB, braceW);

  return {
    W, L, ridge, nW, nL, halfW, rise, slopeLen, angle,
    angleDeg: (angle * 180) / Math.PI,
    tv, seatX, beamTop, beamBottom, gableStuds, post, postTop: beamBottom,
    roofPieces: roofPieces(slopeLen), roofTop, roofUnder,
    bracing, braceW, braceT,
    braceBaysL: braceBays(nL), braceBaysW: braceBays(nW),
    wallBracesLong, wallBracesGable, roofBraces, roofBraceDepth,
  };
}

/** Utstrekning [fra, til] for stender nr. i av n fag langs en vegg med lengde len. Hjørnestendere ligger flush. */
export function studSpan(i: number, n: number, len: number): [number, number] {
  if (i === 0) return [0, STUD_W];
  if (i === n) return [len - STUD_W, len];
  return [i * BAY - STUD_W / 2, i * BAY + STUD_W / 2];
}

/** Topp på gavlstender (venstre og høyre kant), opp til underkant sperre. */
export function gableStudTops(m: Model, z0: number, z1: number): [number, number] {
  return [m.roofUnder(z0), m.roofUnder(z1)];
}

export interface Materials {
  glassLongWalls: number;
  glassGableLower: number;
  glassGableTri: number;
  glassRoofPerBay: number;
  glassRoof: number;
  glassCount: number;
  glassArea: number; // m²
  studLen: number; // cm, stender langvegg mellom sviller
  longStuds: number;
  longStudM: number;
  gableStuds: number;
  gableStudLens: number[]; // cm, én gavl
  gableStudM: number;
  rafters: number;
  rafterM: number; // 48 × 148
  posts: number; // stolper under mønedrageren
  postLen: number; // cm
  postM: number;
  heavyM: number; // 48 × 148 totalt: sperrer og stolper
  ridgeM: number; // limtredrager 140 × 315
  plateM: number;
  stripLongM: number; // klemmelist, meter
  stripGableM: number;
  stripRoofM: number;
  stripM: number;
  braceLong: number; // diagonaler på begge langvegger
  braceLongLen: number; // cm per stk
  braceGable: number;
  braceGableLen: number;
  braceRoof: number; // diagonaler på begge taksider
  braceRoofLen: number;
  braceM: number; // meter avstivning totalt
  braceWoodM: number; // skråstag i tre, inngår i woodM
  bandM: number; // hullbånd
  woodM: number; // 48 × 98 totalt: stendere, sviller og skråstag
}

export function computeMaterials(m: Model): Materials {
  // Glass – ett panel 60 × 210 per fag i vegg; gavltrekant og tak tilpasses fra hele paneler.
  const glassLongWalls = 2 * m.nL;
  const glassGableLower = 2 * m.nW;
  let tri = 0;
  for (let i = 0; i < m.nW; i++) {
    const z0 = i * BAY;
    const z1 = z0 + BAY;
    const straddles = z0 < m.halfW && z1 > m.halfW;
    const hMax = straddles ? m.rise : Math.max(m.roofTop(z0), m.roofTop(z1)) - WALL_H;
    tri += Math.ceil(hMax / PANEL_H);
  }
  const glassGableTri = 2 * tri;
  const glassRoofPerBay = m.roofPieces.length;
  const glassRoof = 2 * m.nL * glassRoofPerBay;
  const glassCount = glassLongWalls + glassGableLower + glassGableTri + glassRoof;
  const glassArea =
    (2 * m.L * WALL_H + 2 * m.W * WALL_H + m.W * m.rise + 2 * m.L * m.slopeLen) / 1e4;

  // Konstruksjonsvirke 48 × 98 i veggene, 48 × 148 i sperrene, limtredrager i mønet
  const studLen = WALL_H - 2 * STUD_W;
  const longStuds = 2 * (m.nL + 1);
  const longStudM = (longStuds * studLen) / 100;
  const gableTops = m.gableStuds.map(([z0, z1]) => Math.min(...gableStudTops(m, z0, z1)));
  const gableStudLens = gableTops.map((t) => t - STUD_W);
  const gableStuds = 2 * gableStudLens.length;
  const gableStudM = (2 * gableStudLens.reduce((a, b) => a + b, 0)) / 100;
  const rafters = 2 * (m.nL + 1);
  const rafterM = (rafters * m.slopeLen) / 100;
  const posts = 2;
  const postLen = m.postTop - STUD_W;
  const postM = (posts * postLen) / 100;
  const heavyM = rafterM + postM;
  const ridgeM = m.L / 100;
  const plateM = (2 * (m.W + m.L) + 2 * m.L) / 100; // bunnsvill rundt + toppsvill på langvegger

  // Vindavstivning – alle diagonaler i samme plan er like lange, to vegger/taksider av hver.
  const lenOf = (list: Brace[]) => (list.length ? braceLen(list[0], m.braceW) : 0);
  const braceLong = 2 * m.wallBracesLong.length;
  const braceLongLen = lenOf(m.wallBracesLong);
  const braceGable = 2 * m.wallBracesGable.length;
  const braceGableLen = lenOf(m.wallBracesGable);
  const braceRoof = 2 * m.roofBraces.length;
  const braceRoofLen = lenOf(m.roofBraces);
  const braceM = (braceLong * braceLongLen + braceGable * braceGableLen + braceRoof * braceRoofLen) / 100;
  const braceWoodM = m.bracing === 'tre' ? braceM : 0;
  const bandM = m.bracing === 'stal' ? braceM : 0;
  const woodM = longStudM + gableStudM + plateM + braceWoodM;

  // Klemmelist: én list der to glass møtes på samme stender. Langvegger og tak har også lister langs kantene,
  // gavlene har bare vertikale lister fra bunnsvill helt opp til overkant tak, over gavlsperren.
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  const stripLongM = (2 * ((m.nL + 1) * WALL_H + 2 * m.L)) / 100; // stendere, bunnsvill og toppsvill
  const gableStripZ = [...m.gableStuds.map(([z0, z1]) => (z0 + z1) / 2), STUD_D / 2, m.W - STUD_D / 2, m.halfW]; // stendere, hjørner, midt på stolpen
  const stripGableM = (2 * sum(gableStripZ.map((z) => m.roofTop(z)))) / 100;
  const stripRoofM = (2 * ((m.nL + 1) * m.slopeLen + (1 + m.roofPieces.length) * m.L)) / 100; // sperrer, raft, møne og skjøter langs takfallet
  const stripM = stripLongM + stripGableM + stripRoofM;

  return {
    glassLongWalls, glassGableLower, glassGableTri, glassRoofPerBay, glassRoof, glassCount, glassArea,
    studLen, longStuds, longStudM, gableStuds, gableStudLens, gableStudM,
    rafters, rafterM, posts, postLen, postM, heavyM, ridgeM, plateM,
    stripLongM, stripGableM, stripRoofM, stripM,
    braceLong, braceLongLen, braceGable, braceGableLen, braceRoof, braceRoofLen, braceM, braceWoodM, bandM,
    woodM,
  };
}

const nf0 = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n0 = (v: number) => nf0.format(v);
export const n1 = (v: number) => nf1.format(v);
export const kr = (v: number) => `${nf0.format(Math.round(v))} kr`;
