import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { shareUrl } from '../urlState';
import {
  BAY, LENGTH_MAX, LENGTH_MIN, RIDGE_MAX, RIDGE_MIN, WALL_H, WIDTH_MAX, WIDTH_MIN,
  braceAngleDeg, clamp, n0, n1, snap, type Bracing, type Model, type Params,
} from '../model';

const BRACING_OPTIONS: { value: Bracing; label: string; hint: string }[] = [
  { value: 'ingen', label: 'Ingen', hint: 'Rammen står uten avstivning og tar ikke opp vindlast.' },
  { value: 'tre', label: 'Skråstag i tre 48 × 98', hint: 'Felles inn i stendere og sperrer fra innsiden. Ett stag fra hvert hjørne.' },
  { value: 'stal', label: 'Stålbånd 40 × 2 mm', hint: 'Hullbånd spikret på innsiden av stendere og sperrer. Ett bånd fra hvert hjørne, som skråstagene.' },
];

function BracingFacts({ model }: { model: Model }) {
  const angle = (list: Model['wallBracesLong']) => (list.length ? `${n0(braceAngleDeg(list[0]))}°` : '–');
  return (
    <dl className="facts">
      <div>
        <dt>Langvegger</dt>
        <dd>{model.braceBaysL} fag · {angle(model.wallBracesLong)}</dd>
      </div>
      <div>
        <dt>Gavler</dt>
        <dd>{model.braceBaysW} fag · {angle(model.wallBracesGable)}</dd>
      </div>
      <div>
        <dt>Tak</dt>
        <dd>{model.braceBaysL} fag · {angle(model.roofBraces)}</dd>
      </div>
    </dl>
  );
}

function NumberField({
  id, value, min, max, step = 1, unit, onCommit,
}: {
  id: string; value: number; min: number; max: number; step?: number; unit: string; onCommit: (v: number) => void;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);

  const parse = (t: string) => {
    const v = Number(t);
    return t.trim() !== '' && Number.isFinite(v) ? v : null;
  };
  const onChange = (e: ChangeEvent<HTMLInputElement>) => {
    const t = e.target.value;
    setText(t);
    const v = parse(t);
    if (v !== null && v >= min && v <= max) onCommit(v);
  };
  const onBlur = () => {
    const v = parse(text);
    const c = v === null ? value : clamp(v, min, max);
    setText(String(c));
    onCommit(c);
  };

  return (
    <div className="row">
      <input id={id} type="number" inputMode="decimal" min={min} max={max} step={step} value={text} onChange={onChange} onBlur={onBlur} />
      <span>{unit}</span>
    </div>
  );
}

function ShareLink({ params }: { params: Params }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    const url = shareUrl(params);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt('Kopier lenken:', url);
    }
  };

  return (
    <section>
      <h2>Del</h2>
      <button type="button" className="button" onClick={copy}>
        {copied ? 'Kopiert!' : 'Kopier lenke'}
      </button>
      <span className="hint">Alle valg ligger i adressen, så lenken kan sendes videre.</span>
    </section>
  );
}

export function Controls({ params, model, onChange }: { params: Params; model: Model; onChange: (p: Params) => void }) {
  const set = (patch: Partial<Params>) => onChange({ ...params, ...patch });

  return (
    <aside className="panel">
      <section>
        <h2>Mål</h2>
        <label className="field">
          <span className="field-label">
            Bredde (kortside) <output>{params.width} cm</output>
          </span>
          <input
            type="range"
            min={WIDTH_MIN}
            max={WIDTH_MAX}
            step={BAY}
            value={params.width}
            onChange={(e) => set({ width: snap(Number(e.target.value)) })}
          />
          <span className="hint">Trinn på {BAY} cm · {model.nW} fag</span>
        </label>
        <label className="field">
          <span className="field-label">
            Lengde (langside) <output>{params.length} cm</output>
          </span>
          <input
            type="range"
            min={LENGTH_MIN}
            max={LENGTH_MAX}
            step={BAY}
            value={params.length}
            onChange={(e) => set({ length: snap(Number(e.target.value)) })}
          />
          <span className="hint">Trinn på {BAY} cm · {model.nL} fag</span>
        </label>
        <div className="field">
          <label className="field-label" htmlFor="ridge">Mønehøyde</label>
          <NumberField id="ridge" value={params.ridge} min={RIDGE_MIN} max={RIDGE_MAX} unit="cm" onCommit={(v) => set({ ridge: Math.round(v) })} />
          <input
            type="range"
            aria-label="Mønehøyde"
            min={RIDGE_MIN}
            max={RIDGE_MAX}
            step={1}
            value={params.ridge}
            onChange={(e) => set({ ridge: Number(e.target.value) })}
          />
          <span className="hint">Vegghøyde på langside er fast {WALL_H} cm. Taket starter ved {WALL_H} cm.</span>
        </div>
        <dl className="facts">
          <div>
            <dt>Takvinkel</dt>
            <dd>{n1(model.angleDeg)}°</dd>
          </div>
          <div>
            <dt>Grunnflate</dt>
            <dd>{n1((params.width * params.length) / 1e4)} m²</dd>
          </div>
          <div>
            <dt>Takflate</dt>
            <dd>{n1((2 * params.length * model.slopeLen) / 1e4)} m²</dd>
          </div>
        </dl>
        <dl className="facts facts-list">
          <div>
            <dt>Takside, raft til møne (sperrelengde)</dt>
            <dd>{n0(model.slopeLen)} cm</dd>
          </div>
          <div>
            <dt>Tak over mønet, raft til raft</dt>
            <dd>{n0(2 * model.slopeLen)} cm</dd>
          </div>
          <div>
            <dt>Glass per fag langs takfallet</dt>
            <dd>
              {model.roofPieces.map(n0).join(' + ')} cm
              <span className="muted"> · {model.roofPieces.length} {model.roofPieces.length === 1 ? 'del' : 'deler'} per takside</span>
            </dd>
          </div>
        </dl>
      </section>
      <section>
        <h2>Vindavstivning</h2>
        <div className="choices">
          {BRACING_OPTIONS.map((o) => (
            <label key={o.value} className="check">
              <input type="radio" name="avstivning" value={o.value} checked={params.bracing === o.value} onChange={() => set({ bracing: o.value })} />
              {o.label}
            </label>
          ))}
        </div>
        <span className="hint">{BRACING_OPTIONS.find((o) => o.value === params.bracing)?.hint}</span>
        {params.bracing !== 'ingen' && (
          <>
            <BracingFacts model={model} />
            <span className="hint">
              Ligger i hjørnefeltene på alle fire vegger og i endefeltene i takplanet, så vind på veggene føres ned til bunnsvillen. Diagonalene virker best med 45–60° mot svillen.
            </span>
          </>
        )}
      </section>
      <section>
        <h2>Priser</h2>
        <label className="check">
          <input type="checkbox" checked={params.showPrice} onChange={(e) => set({ showPrice: e.target.checked })} />
          Vis pris
        </label>
        {params.showPrice ? (
          <>
            <div className="field">
              <label className="field-label" htmlFor="glassPrice">Glass 60 × 210 cm</label>
              <NumberField id="glassPrice" value={params.glassPrice} min={0} max={1e6} unit="kr/stk" onCommit={(v) => set({ glassPrice: v })} />
            </div>
            <div className="field">
              <label className="field-label" htmlFor="woodPrice">Konstruksjonsvirke 48 × 98</label>
              <NumberField id="woodPrice" value={params.woodPrice} min={0} max={1e5} step={0.5} unit="kr/m" onCommit={(v) => set({ woodPrice: v })} />
            </div>
            {params.bracing === 'stal' && (
              <div className="field">
                <label className="field-label" htmlFor="bandPrice">Hullbånd 40 × 2 mm</label>
                <NumberField id="bandPrice" value={params.bandPrice} min={0} max={1e5} step={0.5} unit="kr/m" onCommit={(v) => set({ bandPrice: v })} />
              </div>
            )}
          </>
        ) : (
          <span className="hint">Prisene er skjult. Huk av for å vise prisoverslag i materiallisten.</span>
        )}
      </section>
      <ShareLink params={params} />
    </aside>
  );
}
