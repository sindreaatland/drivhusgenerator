# Drivhusgenerator

Nettapp som lager tekniske tegninger og prisoverslag for et drivhus bygd i
konstruksjonsvirke 48 × 98 mm i veggene og 48 × 148 mm i taket, med
limtredrager 140 × 315 mm i mønet, takglass på 125 × 199,5 cm og veggglass
på 61 × 199,5 cm. Sperrene står c/c 125,8 cm, så takglasset hviler 2,0 cm på
hver sperre. Stenderne står c/c 62,9 cm med to veggglass per fag, og da
hviler veggglasset 1,45 cm på hver stender.

Du velger bredde, lengde og mønehøyde, og får:

- fasadetegninger av langside og gavl med mål
- 3D-visning du kan rotere og zoome, med et spisebord på 90 × 240 cm som størrelsesreferanse
- vindavstivning med innfelte skråstag i tre eller stålbånd, i hjørnefeltene på alle vegger og i endefeltene i takplanet
- stolper 48 × 148 under mønedrageren i begge gavler, og klemmelist 21 × 45 på alle glass (kun vertikale lister på gavlene)
- materialliste med antall takglass og veggglass og meter virke, fordelt på 48 × 98, 48 × 148, limtre og klemmelist
- prisoverslag, som kan slås av og på med «Vis pris»

Alle valg ligger i adressen, så lenken kan deles.

## Kjøre lokalt

```
npm install
npm run dev
```

Appen åpnes på http://localhost:5173/.

## Bygge for publisering

```
npm run build
```

Ferdig side havner i `dist/`. Den er helt statisk og kan legges ut på
for eksempel Cloudflare Pages, Netlify eller Vercel med byggekommando
`npm run build` og utmappe `dist`.

## Parametre i lenken

| Parameter | Betydning                    | Standard |
|-----------|------------------------------|----------|
| `bredde`  | bredde kortside i cm         | 251,6    |
| `lengde`  | lengde langside i cm         | 503,2    |
| `mone`    | mønehøyde i cm               | 290      |
| `avstivning` | vindavstivning: `ingen`, `tre` (skråstag 48 × 98) eller `stal` (hullbånd 40 × 2 mm) | tre |
| `glass`   | pris per takglass 125 × 199,5 i kr | 650 |
| `vegglass` | pris per veggglass 61 × 199,5 i kr | 350 |
| `virke`   | pris per meter 48 × 98 i kr  | 39       |
| `sperre`  | pris per meter 48 × 148 i kr | 59       |
| `drager`  | pris per meter limtre 140 × 315 i kr | 750 |
| `list`    | pris per meter klemmelist i kr | 35     |
| `band`    | pris per meter hullbånd i kr | 30       |
| `pris`    | vis pris, `1` eller `0`      | 0        |

Bredde og lengde rundes til nærmeste 125,8 cm, som er senteravstanden
mellom sperrene. Stenderne står c/c 62,9 cm.

## Teknologi

Vite, React, TypeScript og three.js via @react-three/fiber.
