import {
  DEFAULT_PARAMS, LENGTH_MAX, LENGTH_MIN, RIDGE_MAX, RIDGE_MIN, WIDTH_MAX, WIDTH_MIN,
  clamp, snap, type Params,
} from './model';

const KEYS = {
  width: 'bredde',
  length: 'lengde',
  ridge: 'mone',
  glassPrice: 'glass',
  woodPrice: 'virke',
  showPrice: 'pris',
} as const;

/** Leser parametre fra en query-string. Ugyldige eller manglende verdier faller tilbake til standard. */
export function paramsFromSearch(search: string): Params {
  const q = new URLSearchParams(search);
  const num = (key: string): number | null => {
    const raw = q.get(key);
    if (raw === null) return null;
    const n = Number(raw.replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const p: Params = { ...DEFAULT_PARAMS };
  const width = num(KEYS.width);
  if (width !== null) p.width = clamp(snap(width), WIDTH_MIN, WIDTH_MAX);
  const length = num(KEYS.length);
  if (length !== null) p.length = clamp(snap(length), LENGTH_MIN, LENGTH_MAX);
  const ridge = num(KEYS.ridge);
  if (ridge !== null) p.ridge = clamp(Math.round(ridge), RIDGE_MIN, RIDGE_MAX);
  const glass = num(KEYS.glassPrice);
  if (glass !== null) p.glassPrice = Math.max(0, glass);
  const wood = num(KEYS.woodPrice);
  if (wood !== null) p.woodPrice = Math.max(0, wood);
  const showPrice = q.get(KEYS.showPrice);
  if (showPrice !== null) p.showPrice = !['0', 'false', 'nei'].includes(showPrice.trim().toLowerCase());
  return p;
}

export function searchFromParams(p: Params): string {
  const q = new URLSearchParams();
  q.set(KEYS.width, String(p.width));
  q.set(KEYS.length, String(p.length));
  q.set(KEYS.ridge, String(p.ridge));
  q.set(KEYS.glassPrice, String(p.glassPrice));
  q.set(KEYS.woodPrice, String(p.woodPrice));
  q.set(KEYS.showPrice, p.showPrice ? '1' : '0');
  return `?${q.toString()}`;
}

/** Full delbar lenke for gitte parametre. */
export function shareUrl(p: Params): string {
  return `${window.location.origin}${window.location.pathname}${searchFromParams(p)}`;
}
