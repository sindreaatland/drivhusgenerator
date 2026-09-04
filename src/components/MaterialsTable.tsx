import { kr, n0, n1, type Materials, type Model, type Params } from '../model';

function Row({
  name, qty, amount, price, className, showPrice,
}: {
  name: string; qty?: string; amount?: string; price?: string; className?: string; showPrice: boolean;
}) {
  return (
    <tr className={className}>
      <td>{name}</td>
      <td className="num">{qty}</td>
      <td className="num">{amount}</td>
      {showPrice && <td className="num">{price}</td>}
    </tr>
  );
}

export function MaterialsTable({ m, mat, params }: { m: Model; mat: Materials; params: Params }) {
  const glassSum = mat.glassCount * params.glassPrice;
  const woodSum = mat.woodM * params.woodPrice;
  const bandSum = mat.bandM * params.bandPrice;
  const each = (n: number, len: number) => `à ${n0(len)} cm = ${n1((n * len) / 100)} m`;
  const gableMin = mat.gableStudLens.length ? Math.min(...mat.gableStudLens) : 0;
  const gableMax = mat.gableStudLens.length ? Math.max(...mat.gableStudLens) : 0;
  const { showPrice } = params;
  const cols = showPrice ? 4 : 3;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Post</th>
            <th className="num">Antall</th>
            <th className="num">Mengde</th>
            {showPrice && <th className="num">Pris</th>}
          </tr>
        </thead>
        <tbody>
          <tr className="section"><th colSpan={cols}>Glass 60 × 210 cm</th></tr>
          <Row showPrice={showPrice} name="Langvegger" qty={`${mat.glassLongWalls} stk`} amount={`${2 * m.nL} fag`} />
          <Row showPrice={showPrice} name="Gavlvegger under 210 cm" qty={`${mat.glassGableLower} stk`} amount={`${2 * m.nW} fag`} />
          <Row showPrice={showPrice} name="Gavltrekanter (tilpasses)" qty={`${mat.glassGableTri} stk`} amount={`${n0(m.rise)} cm høyde i møne`} />
          <Row
            showPrice={showPrice}
            name="Tak (tilpasses)"
            qty={`${mat.glassRoof} stk`}
            amount={`${mat.glassRoofPerBay} ${mat.glassRoofPerBay === 1 ? 'del' : 'deler'} per fag: ${m.roofPieces.map(n0).join(' + ')} cm`}
          />
          <Row
            className="sum"
            name="Sum glass"
            qty={`${mat.glassCount} stk`}
            amount={showPrice ? `${n1(mat.glassArea)} m² · ${kr(params.glassPrice)}/stk` : `${n1(mat.glassArea)} m²`}
            price={kr(glassSum)}
            showPrice={showPrice}
          />

          <tr className="section"><th colSpan={cols}>Konstruksjonsvirke 48 × 98 mm</th></tr>
          <Row showPrice={showPrice} name="Stendere langvegger" qty={`${mat.longStuds} stk`} amount={`à ${n0(mat.studLen)} cm = ${n1(mat.longStudM)} m`} />
          <Row showPrice={showPrice} name="Stendere gavler" qty={`${mat.gableStuds} stk`} amount={`${n0(gableMin)}–${n0(gableMax)} cm = ${n1(mat.gableStudM)} m`} />
          <Row showPrice={showPrice} name="Sperrer" qty={`${mat.rafters} stk`} amount={`à ${n0(m.slopeLen)} cm = ${n1(mat.rafterM)} m`} />
          <Row showPrice={showPrice} name="Mønebjelke" qty="1 stk" amount={`${n1(mat.ridgeM)} m`} />
          <Row showPrice={showPrice} name="Sviller (bunnsvill rundt, toppsvill langvegger)" amount={`${n1(mat.plateM)} m`} />
          {m.bracing === 'tre' && (
            <>
              <Row showPrice={showPrice} name="Skråstag langvegger (innfelt)" qty={`${mat.braceLong} stk`} amount={each(mat.braceLong, mat.braceLongLen)} />
              <Row showPrice={showPrice} name="Skråstag gavler (innfelt)" qty={`${mat.braceGable} stk`} amount={each(mat.braceGable, mat.braceGableLen)} />
              <Row showPrice={showPrice} name="Skråstag takplan (innfelt i sperrene)" qty={`${mat.braceRoof} stk`} amount={each(mat.braceRoof, mat.braceRoofLen)} />
            </>
          )}
          <Row
            className="sum"
            name="Sum konstruksjonsvirke"
            amount={showPrice ? `${n1(mat.woodM)} m · ${n1(params.woodPrice)} kr/m` : `${n1(mat.woodM)} m`}
            price={kr(woodSum)}
            showPrice={showPrice}
          />

          {m.bracing === 'stal' && (
            <>
              <tr className="section"><th colSpan={cols}>Hullbånd 40 × 2 mm</th></tr>
              <Row showPrice={showPrice} name="Stålbånd langvegger" qty={`${mat.braceLong} stk`} amount={each(mat.braceLong, mat.braceLongLen)} />
              <Row showPrice={showPrice} name="Stålbånd gavler" qty={`${mat.braceGable} stk`} amount={each(mat.braceGable, mat.braceGableLen)} />
              <Row showPrice={showPrice} name="Stålbånd takplan (under sperrene)" qty={`${mat.braceRoof} stk`} amount={each(mat.braceRoof, mat.braceRoofLen)} />
              <Row
                className="sum"
                name="Sum hullbånd"
                amount={showPrice ? `${n1(mat.bandM)} m · ${n1(params.bandPrice)} kr/m` : `${n1(mat.bandM)} m`}
                price={kr(bandSum)}
                showPrice={showPrice}
              />
            </>
          )}

          {showPrice && <Row className="total" name="Totalt" price={kr(glassSum + woodSum + bandSum)} showPrice />}
        </tbody>
      </table>
    </div>
  );
}
