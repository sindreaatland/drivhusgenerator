# Drivhusgenerator

Nettapp som lager tekniske tegninger og prisoverslag for et drivhus bygd i
48 × 98 mm konstruksjonsvirke med glass på 60 × 210 cm.

Du velger bredde, lengde og mønehøyde, og får:

- fasadetegninger av langside og gavl med mål
- 3D-visning du kan rotere og zoome, med et spisebord på 90 × 240 cm som størrelsesreferanse
- materialliste med antall glass og meter virke
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
| `glass`   | pris per glass i kr          | 650      |
| `virke`   | pris per meter virke i kr    | 39       |
| `pris`    | vis pris, `1` eller `0`      | 0        |

Bredde og lengde rundes til nærmeste 60 cm, som er senteravstanden
mellom stenderne.

## Teknologi

Vite, React, TypeScript og three.js via @react-three/fiber.
