import { useEffect, useMemo, useState } from 'react';
import { buildModel, computeMaterials, type Params } from './model';
import { paramsFromSearch, searchFromParams } from './urlState';
import { Controls } from './components/Controls';
import { LongSideDrawing } from './components/drawing/LongSideDrawing';
import { GableDrawing } from './components/drawing/GableDrawing';
import { Viewer3D } from './components/Viewer3D';
import { MaterialsTable } from './components/MaterialsTable';

export default function App() {
  const [params, setParams] = useState<Params>(() => paramsFromSearch(window.location.search));

  // Speil alle valg i adressen, litt forsinket så slider-drag ikke oppdaterer for hvert steg.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const search = searchFromParams(params);
      if (window.location.search !== search) window.history.replaceState(null, '', search + window.location.hash);
    }, 200);
    return () => window.clearTimeout(id);
  }, [params]);
  const model = useMemo(
    () => buildModel(params.width, params.length, params.ridge, params.bracing),
    [params.width, params.length, params.ridge, params.bracing],
  );
  const materials = useMemo(() => computeMaterials(model), [model]);

  return (
    <>
      <header className="topbar">
        <h1>Drivhusgenerator</h1>
        <p>Tekniske tegninger og prisoverslag for drivhus i 48 × 98 konstruksjonsvirke med glass 60 × 210 cm.</p>
      </header>
      <main className="layout">
        <Controls params={params} model={model} onChange={setParams} />
        <section className="content">
          <article className="card">
            <h2>Fasade langside</h2>
            <div className="drawing">
              <LongSideDrawing m={model} />
            </div>
          </article>
          <article className="card">
            <h2>Fasade kortside (gavl)</h2>
            <div className="drawing">
              <GableDrawing m={model} />
            </div>
          </article>
          <article className="card">
            <h2>3D</h2>
            <Viewer3D m={model} />
            <p className="hint">Dra for å rotere, rull for å zoome, høyreklikk og dra for å flytte. Spisebordet midt i er 90 × 240 cm og viser størrelsen.</p>
          </article>
          <article className="card">
            <h2>{params.showPrice ? 'Materialer og pris' : 'Materialer'}</h2>
            <MaterialsTable m={model} mat={materials} params={params} />
          </article>
        </section>
      </main>
    </>
  );
}
