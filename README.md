# Drivhusgenerator

Nettapp som lager tekniske tegninger og prisoverslag for et drivhus bygd i
konstruksjonsvirke 48 × 98 mm i veggene og 48 × 148 mm i taket, med
limtredrager 140 × 315 mm i mønet og glass på 60 × 210 cm.

Du velger bredde, lengde og mønehøyde, og får:

- fasadetegninger av langside og gavl med mål
- 3D-visning du kan rotere og zoome, med et spisebord på 90 × 240 cm som størrelsesreferanse
- vindavstivning med innfelte skråstag i tre eller stålbånd, i hjørnefeltene på alle vegger og i endefeltene i takplanet
- stolper 48 × 148 under mønedrageren i begge gavler, og klemmelist 21 × 45 over alle glasskanter
- materialliste med antall glass og meter virke, fordelt på 48 × 98, 48 × 148, limtre og klemmelist
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
| `bredde`  | bredde kortside i cm         | 300      |
| `lengde`  | lengde langside i cm         | 480      |
| `mone`    | mønehøyde i cm               | 290      |
| `avstivning` | vindavstivning: `ingen`, `tre` (skråstag 48 × 98) eller `stal` (hullbånd 40 × 2 mm) | tre |
| `glass`   | pris per glass i kr          | 650      |
| `virke`   | pris per meter 48 × 98 i kr  | 39       |
| `sperre`  | pris per meter 48 × 148 i kr | 59       |
| `drager`  | pris per meter limtre 140 × 315 i kr | 750 |
| `list`    | pris per meter klemmelist i kr | 35     |
| `band`    | pris per meter hullbånd i kr | 30       |
| `pris`    | vis pris, `1` eller `0`      | 0        |

Bredde og lengde rundes til nærmeste 60 cm, som er senteravstanden
mellom stenderne.

## Teknologi

Vite, React, TypeScript og three.js via @react-three/fiber.
