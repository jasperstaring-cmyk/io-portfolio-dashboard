# CLAUDE.md — Portfolio Day Dashboard
> Instructiebestand voor Claude Code. Altijd lezen vóór je iets implementeert.

---

## 1. Wat is dit project?

Het **Portfolio Day Dashboard** is een interactief presentatie-instrument van **Investment Officer (IO)**, gebouwd voor live gebruik op het podium tijdens de jaarlijkse Portfolio Day voor beleggingsprofessionals (NL/BE). Het is geen klantapplicatie en geen realtime tool — het is een visuele rode draad door het programma, waarbij elke spreker zijn of haar onderwerp koppelt aan een deel van een modelportefeuille.

**Doelgroep:** ~150 buy-side beleggingsprofessionals in een auditoriumsetting.
**Zichtbaarheid:** Groot scherm op het podium, viewing distance 15–20 meter.

---

## 2. Technische stack

| Onderdeel | Keuze |
|-----------|-------|
| Framework | React 18 |
| Bundler | Vite 6 |
| Testing | Vitest + GitHub Actions CI |
| Visualisatie | Handbuilt SVG; D3 + TopoJSON voor GeographyChart |
| Config | `registry.json` (schema v1.1) |
| Repository | `jasperstaring-cmyk/io-portfolio-dashboard` |
| Deployment | Vercel (auto-deploy op push naar `main`) |

---

## 3. Werkwijze & rolverdeling

**Claude (dit project, via claude.ai)** bepaalt de richting: architectuurkeuzes, code voorbereiden, instructies opstellen.

**Claude Code (jij, lokaal)** implementeert: bestanden plaatsen, builden, testen, committen.

### Vaste workflow per iteratie
1. Ontvang instructie vanuit het Claude-project (exacte bestandsnamen + doelpaden + wat de wijziging doet)
2. Implementeer — verander nooit meer dan de instructie vraagt
3. Voer checks uit: `npm run build` + `npm test` (zie §8)
4. Commit naar `main` → Vercel deployt automatisch
5. Rapporteer resultaat (build OK/errors, test-uitslag)

**Nooit** bestanden rechtstreeks in GitHub aanpassen. Alles gaat via de lokale omgeving.

---

## 4. Architectuur — de drie ijzeren regels

### 4.1 `registry.json` is de enige bron van waarheid
- Bestandspad: `src/data/registry.json`
- Schema versie: `1.1`
- Bevat: `activeEventId`, `events[]`, `displayScale`
- Verander nooit de schema-structuur zonder expliciete instructie

### 4.2 `resolveUseCase()` is de enige merge-logica
- Bestandspad: `src/utils/resolveUseCase.js`
- **Alle** inheritance en merge-logica leeft hier, nergens anders
- Charts ontvangen altijd **volledig opgeloste data** — nooit ruwe config
- `resolveRegistry()` leeft ook in dit bestand

### 4.3 Charts ontvangen alleen opgeloste props
Charts krijgen:
- `portfolio` — de opgeloste base-portefeuille
- `comparisonPortfolio` — de opgeloste compare-state (of `null`)
- `showComparison` — boolean
- `lang` — taalcode
- Nooit `scenario.comparison` of ruwe registry-data

---

## 5. Data- en componentenstructuur

```
src/
├── App.jsx                          # Root — state, routing tussen views
├── data/
│   └── registry.json                # Enige config — schema v1.1
├── utils/
│   └── resolveUseCase.js            # resolveUseCase(), resolveRegistry(), getLabel(), applyFraming()
├── components/
│   ├── PresentationView.jsx         # Hoofdscherm voor het publiek
│   ├── ExplorePresentationView.jsx  # Scherm tijdens explore-modus
│   ├── IdleView.jsx                 # Rustscherm met heartbeat-animaties
│   ├── OperatorPanel.jsx            # Bedieningspaneel operator (onderaan)
│   ├── ExplorePanel.jsx             # Schuifregelaars voor explore-modus
│   ├── Configurator.jsx             # Redacteur-interface voor config
│   ├── configurator/
│   │   ├── configuratorStyles.js
│   │   ├── ConfigScenarioEditor.jsx
│   │   ├── ConfigComparisonEditor.jsx
│   │   └── ConfigFormParts.jsx
│   └── charts/
│       ├── chartTokens.js           # Typography + stroke tokens, ScaleContext, useT()
│       ├── AssetClassChart.jsx
│       ├── GeographyChart.jsx       # D3 + TopoJSON, NaturalEarth projectie
│       ├── ESGChart.jsx
│       ├── ImplementationChart.jsx
│       ├── PerformanceChart.jsx
│       ├── SectorChart.jsx
│       ├── CurrencyChart.jsx
│       ├── StyleChart.jsx
│       └── CostChart.jsx
└── styles/
    └── global.css
```

---

## 6. Typografie-systeem — chartTokens

**Alle** charts en PresentationView gebruiken de token-hook. Nooit vaste px/rem-waarden hardcoden in charts.

```js
import { useT } from './chartTokens'

export default function MijnChart({ portfolio }) {
  const T = useT()              // Haalt tokens op basis van ScaleContext
  const s = makeStyles(T)       // Bereken styles na de hook-aanroep
  // ...
}

function makeStyles(T) {
  return {
    label: { fontSize: T.small, fontWeight: T.wBody },  // CSS/React styles
    // ...
  }
}
```

**Gebruik:**
| Token | Gebruik |
|-------|---------|
| `T.micro` t/m `T.hero` | CSS font-size (rem-string) |
| `T.svgMicro` t/m `T.svgHero` | SVG fontSize attribuut (getal) |
| `T.strokeHair` t/m `T.strokeHeavy` | SVG strokeWidth (getal) |
| `T.wBody`, `T.wMedium`, `T.wHeavy` | Font-weight (getal) |
| `T.primary`, `T.secondary`, `T.muted`, `T.faint` | Witschaal kleuren |
| `T.red`, `T.green`, `T.amber` | Status-kleuren |

**Nooit `T` buiten de component-functie gebruiken.** `makeStyles(T)` altijd aanroepen ná de hook.

---

## 7. Kleurlogica — strict

| Kleur | Hex | Gebruik |
|-------|-----|---------|
| Groen | `#4ED596` | Uitsluitend positieve delta-richting |
| Rood | `#E01B41` | Uitsluitend negatieve delta-richting |
| Amber | `#F5A623` | Categorieonderscheid (derde kleur) |
| Blauw | `#5B8DEF` | Categorieonderscheid (eerste kleur) |
| Paars | `rgba(167,139,250,…)` | Categorieonderscheid (tweede kleur) |

**Uitzondering:** `CostChart` gebruikt groen/rood als statuskleur (lage/hoge TER). Dit is bewust en gedocumenteerd.

---

## 8. Animatie-regels

**Gebruik altijd `useEffect`-gebaseerde opacity/transform animaties:**
```js
const [visible, setVisible] = useState(false)
useEffect(() => {
  setVisible(false)
  const t = setTimeout(() => setVisible(true), 80)
  return () => clearTimeout(t)
}, [afhankelijkheid])
```

**Nooit:** `animated` state met setTimeout als CSS className-trigger — onbetrouwbaar.

**SVG-naalden:** `transform: translate()` op een `<g>` element (niet op individuele paden).

**ESG-arcs:** Animatie via `stroke-dashoffset`.

---

## 9. Layout-regels voor charts

Alle chart-wrappers:
```js
{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0,         // ← cruciaal voor flex-kinderen die de ruimte vullen
  height: '100%',
}
```

SVG's:
```jsx
<svg
  viewBox="0 0 400 300"
  preserveAspectRatio="xMidYMid meet"
  style={{ width: '100%', height: '100%' }}
>
```

---

## 10. GeographyChart — speciale regels

- D3 wordt dynamisch geladen via CDN (`import()` via jsdelivr)
- TopoJSON eveneens via CDN
- Kaartgrenzen: `stroke` niet via tokens — bewuste uitzondering, vaste SVG-waarden
- EM-landen gesplitst in geografische subregio's op de kaart, geaggregeerd als één totaal in de bar chart
- `buildGeoMap()` schaalt gewichten proportioneel via `a.current`

**Let op:** CDN-laden is niet geschikt voor offline gebruik. Bundeling lokaal staat op de roadmap, maar wordt pas opgepakt na expliciete instructie.

---

## 11. Use case structuur (registry.json schema v1.1)

```json
{
  "schemaVersion": "1.1",
  "activeEventId": "event_2026",
  "displayScale": 1.0,
  "events": [
    {
      "id": "event_2026",
      "name": "Portfolio Day 2026",
      "language": "nl",
      "portfolio": { ... },
      "usecases": [
        {
          "id": "opening",
          "dimension": "asset_class",
          "policyQuestion": { "nl": "...", "en": "..." },
          "theme": { "nl": "...", "en": "..." },
          "base": { "useEventPortfolio": true },
          "compare": {
            "label": { "nl": "...", "en": "..." },
            "allocations": [ ... ]
          },
          "explore": { "enabled": true, "startFrom": "base", "dimensions": ["asset_class"] }
        }
      ]
    }
  ]
}
```

**Implementation-formaat** is altijd v1.1 `categories[]`:
```json
"implementation": {
  "categories": [
    { "id": "active", "label": { "nl": "Actief", "en": "Active" }, "weight": 65 },
    { "id": "passive", "label": { "nl": "Passief", "en": "Passive" }, "weight": 35 }
  ]
}
```

---

## 12. Explore-modus

- Explore-state wordt **altijd** via deep clone geïsoleerd bij activering
- `ExploreTotalBadge` ontvangt `exploreMode` prop — badge nooit zichtbaar buiten explore context
- `ExplorePanel` bevat de schuifregelaars; `ExplorePresentationView` toont de chart

---

## 13. Tests uitvoeren

**Tests draaien via GitHub Actions CI** — niet via de lokale terminal als die issues geeft.

```bash
npm run build     # Altijd na elke wijziging
npm test          # Vitest — als lokaal niet werkt, push naar main en check Actions
```

Test-bestand: `src/utils/resolveUseCase.test.js`

Na elke commit controleer je de GitHub Actions-uitslag op:
`https://github.com/jasperstaring-cmyk/io-portfolio-dashboard/actions`

---

## 14. Checklist bij iedere implementatie

Vóór je commit:

- [ ] `npm run build` geeft geen errors
- [ ] `npm test` slaagt (of GitHub Actions gecontroleerd na push)
- [ ] Geen nieuwe hardcoded px/rem-waarden in charts (gebruik `T.*` tokens)
- [ ] Geen groen/rood voor categorieonderscheid (alleen voor delta-richting)
- [ ] Charts ontvangen `comparisonPortfolio` prop — nooit `scenario.comparison`
- [ ] `resolveUseCase()` is de enige plek met merge-logica
- [ ] Animaties via `useEffect` + opacity/transform (geen CSS className-toggle op SVG)
- [ ] SVG's hebben `preserveAspectRatio="xMidYMid meet"`
- [ ] Chart-wrappers hebben `alignItems: stretch` + `minHeight: 0`

---

## 15. Bestandslevering

Claude (het project) levert altijd:
- Exacte bestandsnamen (bijv. `index.jsx`, nooit `configurator_index.jsx`)
- Exacte doelpaden (bijv. `src/components/charts/AssetClassChart.jsx`)
- Beschrijving van de wijziging
- Welke checks uitgevoerd moeten worden

Jij (Claude Code) voert de checks uit en rapporteert terug.

---

## 16. IO Design tokens (referentie)

```
Achtergrond (dashboard): #0C182E
Accent rood:             #E01B41
Tekst primair:           #FFFFFF
Tekst secundair:         rgba(255,255,255,0.75)
Tekst gedempt:           rgba(255,255,255,0.45)
Tekst faint:             rgba(255,255,255,0.28)
Font-family:             'Merriweather Sans', sans-serif
Configurator achtergrond: #F8F8F7
```

---

*Laatste update: april 2026 — gegenereerd op basis van Projectinstructie v11.0, Handleiding v6, Teamdocument v6*
