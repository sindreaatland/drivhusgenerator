// Alle mål i cm.

export const BAY = 60; // senteravstand stendere = bredde på glass
export const WALL_H = 210; // vegghøyde langside = høyde på glass
export const PANEL_W = 60;
export const PANEL_H = 210;
export const STUD_W = 4.8; // 48 mm
export const STUD_D = 9.8; // 98 mm

export const WIDTH_MIN = 120;
export const WIDTH_MAX = 720;
export const LENGTH_MIN = 120;
export const LENGTH_MAX = 1200;
export const RIDGE_MIN = 240;
export const RIDGE_MAX = 600;

export interface Params {
  width: number;
  length: number;
  ridge: number;
  glassPrice: number; // kr per panel 60 × 210
  woodPrice: number; // kr per meter 48 × 98
  showPrice: boolean; // vis priser og prisoverslag
}

export const DEFAULT_PARAMS: Params = {
  width: 300,
  length: 480,
  ridge: 290,
  glassPrice: 650,
  woodPrice: 39,
  showPrice: false,
};

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
  roofPieces: number[]; // glassdeler langs takfallet per fag, fra raft mot møne (cm)
  roofTop: (z: number) => number; // overkant tak ved avstand z fra langvegg
  roofUnder: (z: number) => number; // underkant sperre ved avstand z fra langvegg
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

export function buildModel(W: number, L: number, ridge: number): Model {
  const nW = Math.round(W / BAY);
  const nL = Math.round(L / BAY);
  const halfW = W / 2;
  const rise = ridge - WALL_H;
  const slopeLen = Math.hypot(halfW, rise);
  const angle = Math.atan2(rise, halfW);
  const tv = STUD_D / Math.cos(angle);
  const seatX = Math.min(halfW, (tv * halfW) / rise);
  const roofTop = (z: number) => WALL_H + rise * (1 - Math.abs(z - halfW) / halfW);
  const roofUnder = (z: number) => Math.max(WALL_H, roofTop(z) - tv);
  return {
    W, L, ridge, nW, nL, halfW, rise, slopeLen, angle,
    angleDeg: (angle * 180) / Math.PI,
    tv, seatX, roofPieces: roofPieces(slopeLen), roofTop, roofUnder,
  };
}

/** Utstrekning [fra, til] for stender nr. i av n fag langs en vegg med lengde len. Hjørnestendere ligger flush. */
export function studSpan(i: number, n: number, len: number): [number, number] {
  if (i === 0) return [0, STUD_W];
  if (i === n) return [len - STUD_W, len];
  return [i * BAY - STUD_W / 2, i * BAY + STUD_W / 2];
}

/** Topp på gavlstender (venstre og høyre kant). Stender under mønebjelken stopper under den. */
export function gableStudTops(m: Model, z0: number, z1: number): [number, number] {
  if (z0 <= m.halfW && z1 >= m.halfW) {
    const cap = m.ridge - m.tv - STUD_D;
    return [cap, cap];
  }
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
  rafterM: number;
  ridgeM: number;
  plateM: number;
  woodM: number;
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

  // Konstruksjonsvirke 48 × 98
  const studLen = WALL_H - 2 * STUD_W;
  const longStuds = 2 * (m.nL + 1);
  const longStudM = (longStuds * studLen) / 100;
  const gableStudLens: number[] = [];
  for (let j = 1; j < m.nW; j++) {
    const [z0, z1] = studSpan(j, m.nW, m.W);
    gableStudLens.push(Math.min(...gableStudTops(m, z0, z1)) - STUD_W);
  }
  const gableStuds = 2 * gableStudLens.length;
  const gableStudM = (2 * gableStudLens.reduce((a, b) => a + b, 0)) / 100;
  const rafters = 2 * (m.nL + 1);
  const rafterM = (rafters * m.slopeLen) / 100;
  const ridgeM = m.L / 100;
  const plateM = (2 * (m.W + m.L) + 2 * m.L) / 100; // bunnsvill rundt + toppsvill på langvegger
  const woodM = longStudM + gableStudM + rafterM + ridgeM + plateM;

  return {
    glassLongWalls, glassGableLower, glassGableTri, glassRoofPerBay, glassRoof, glassCount, glassArea,
    studLen, longStuds, longStudM, gableStuds, gableStudLens, gableStudM,
    rafters, rafterM, ridgeM, plateM, woodM,
  };
}

const nf0 = new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat('nb-NO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
export const n0 = (v: number) => nf0.format(v);
export const n1 = (v: number) => nf1.format(v);
export const kr = (v: number) => `${nf0.format(Math.round(v))} kr`;
