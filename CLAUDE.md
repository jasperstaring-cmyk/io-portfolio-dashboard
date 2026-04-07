# IO Portfolio Dashboard — CLAUDE.md

> **Lees dit bestand altijd volledig vóór je code schrijft.**  
> Dit is de technische referentie voor Claude Code. Alle architectuurkeuzes, patronen en constanten staan hier.

---

## 1. Wat het is

Het IO Portfolio Dashboard is een live presentatie-instrument voor kennisevents. Per sessie wordt ingezoomd op het deel van de beleggingsportefeuille dat relevant is voor het onderwerp van dat moment. Het vertrekpunt is altijd de **beleidsvraag** — de vraag die een beleggingsprofessional in de zaal zichzelf stelt.

---

## 2. Werkwijze

**Twee omgevingen, vaste rolverdeling:**

- **Dit Claude-project** (claude.ai) — richting bepalen, code voorbereiden, documentatie bijhouden
- **Claude Code** (lokaal) — bestanden plaatsen, builden, testen, committen

**Workflow:**
1. Claude schrijft code in dit project
2. Jasper plaatst bestanden lokaal
3. Claude Code runt build + tests
4. Commit naar GitHub → Vercel deployt automatisch

**Bestandslevering:** altijd individuele bestanden met exact doelpad — nooit zips tenzij expliciet gevraagd.

---

## 3. Technische stack

| Onderdeel | Keuze |
|-----------|-------|
| Framework | React 18 |
| Bundler | Vite 6 |
| Testing | Vitest + GitHub Actions CI |
| Visualisatie | Handgebouwde SVG — geen externe charting libraries |
| Kaart | D3 + TopoJSON (geladen via CDN — zie §10) |
| Config | `registry.json` (schema v1.1) |
| Repository | `jasperstaring-cmyk/io-portfolio-dashboard` |
| Deployment | Vercel (auto-deploy op push naar `main`) |

---

## 4. Mappenstructuur

```
public/
  io_horizontal_white@10x.png
  brochure.html                        ← statische brochure (inline base64)
  handleiding.html                     ← statische handleiding (inline base64)
src/
  App.jsx                              ← hoofdcomponent, laadt registry, levert ScaleContext
  main.jsx
  data/
    registry.json                      ← ENIGE config-bestand (schema v1.1)
  utils/
    resolveUseCase.js                  ← ENIGE plek met merge/inheritance logica
    resolveUseCase.test.js             ← unit tests (Vitest) — 46 tests
  components/
    IdleView.jsx
    PresentationView.jsx               ← beleidsvraag schaalt via useTextScale()
    ExplorePresentationView.jsx
    OperatorPanel.jsx
    ExplorePanel.jsx
    Configurator.jsx
    configurator/
      index.jsx
      useConfigDraft.js                ← alle draft-state en updaters incl. drie schaalassen
      configuratorStyles.js
      ConfigFormParts.jsx
      ConfigEventTab.jsx               ← drie presentatiesliders onder "Presentatie-instellingen"
      ConfigScenarioTab.jsx
      ConfigScenarioEditor.jsx
      ConfigComparisonEditor.jsx
    charts/
      chartTokens.js                   ← CENTRALE typografie- en lijndikte-tokens + ScaleContext
      AssetClassChart.jsx
      GeographyChart.jsx
      ESGChart.jsx
      ImplementationChart.jsx
      PerformanceChart.jsx
      SectorChart.jsx
      CurrencyChart.jsx
      StyleChart.jsx
      CostChart.jsx
      ChartTooltip.jsx
      ExploreTotalBadge.jsx
  styles/
    global.css
```

Voeg geen nieuwe bestanden of mappen toe zonder expliciete instructie.

---

## 5. Architectuur — drie absolute regels

### 5.1 `registry.json` is de enige bron van waarheid
- Bestandspad: `src/data/registry.json`
- Schema versie: `1.1` — staat altijd in het `schemaVersion` veld
- Bevat: `schemaVersion`, `displayScale`, `textScale`, `labelScale`, `strokeScale`, `activeEventId`, `events[]`
- Verander nooit de schema-structuur zonder expliciete instructie

### 5.2 `resolveUseCase()` is de enige merge-logica
- Bestandspad: `src/utils/resolveUseCase.js`
- **Alle** inheritance en merge-logica leeft hier — nergens anders
- `resolveRegistry()` leeft ook in dit bestand
- Voeg nooit merge-logica toe in een component of chart

### 5.3 Charts ontvangen alleen opgeloste props
Charts krijgen:
- `portfolio` — de opgeloste base-portefeuille (output van `resolveUseCase()`)
- `comparisonPortfolio` — de opgeloste compare-state, of `null`
- `showComparison` — boolean
- `lang` — taalcode

**Nooit:** `scenario.comparison`, ruwe registry-data, of onverwerkte config direct aan een chart doorgeven.

---

## 6. Datamodel v1.1 — kernstructuur

### registry.json root
```json
{
  "schemaVersion": "1.1",
  "displayScale": 1.0,
  "textScale": 1.0,
  "labelScale": 1.0,
  "strokeScale": 1.0,
  "activeEventId": "portfolio_day_2026",
  "events": [ /* Event[] */ ]
}
```

`displayScale` is legacy — blijft aanwezig voor backwards-compat. De drie nieuwe velden (`textScale`, `labelScale`, `strokeScale`) zijn leidend. Als ze ontbreken, valt App.jsx terug op `displayScale`.

### Use case structuur
Elke use case heeft vier lagen:
- `base` — startpunt (erft van event-portfolio of eigen override)
- `compare` — het alternatieve scenario dat de operator live kan activeren
- `explore` — de verkenningsruimte voor interactie met de zaal
- `performanceView` — optionele tijdreeks per use case

---

## 7. Typografie-systeem — chartTokens (drie schaalassen)

**ScaleContext** bevat nu een object met drie onafhankelijke assen:

| As | Bereik | Doel |
|---|---|---|
| `textScale` | 0.80–2.00 | Beleidsvraag / framing-tekst in PresentationView |
| `labelScale` | 0.80–1.60 | Grafiek-labels en -waarden (SVG fontSize, CSS rem) |
| `strokeScale` | 0.80–1.60 | Lijndikte (strokeWidth) |

**ScaleContext accepteert getal (legacy) of object.** Bij een getal worden alle drie de assen op die waarde gezet.

**Twee hooks:**

```js
import { useT, useTextScale } from './chartTokens'

// In charts — gebruikt labelScale voor tekst, strokeScale voor lijnen:
const T = useT()

// In PresentationView — uitsluitend voor beleidsvraag:
const textScale = useTextScale()
```

**`makeTokens(labelScale, strokeScale)`** — twee parameters (was één). Altijd aanroepen ná de hook.

```js
export default function MijnChart({ portfolio }) {
  const T = useT()
  const s = makeStyles(T)
  // ...
}

function makeStyles(T) {
  return {
    label: { fontSize: T.small, fontWeight: T.wBody },
    // ...
  }
}
```

**PresentationView — beleidsvraag:**
```js
const textScale = useTextScale()
// fontSize schaalt op textScale, onafhankelijk van grafiek-labels:
policyQuestion: {
  fontSize: `${(1.40 * textScale).toFixed(3)}rem`,
}
```

**Token-tabel:**
| Token | Gebruik |
|-------|---------|
| `T.micro` t/m `T.hero` | CSS font-size (rem-string), schaalt op `labelScale` |
| `T.svgMicro` t/m `T.svgHero` | SVG fontSize attribuut (getal), schaalt op `labelScale` |
| `T.strokeHair` t/m `T.strokeHeavy` | SVG strokeWidth (getal), schaalt op `strokeScale` |
| `T.wBody`, `T.wMedium`, `T.wHeavy` | Font-weight (getal), onveranderd |
| `T.primary`, `T.secondary`, `T.muted`, `T.faint` | Witschaal kleuren |
| `T.red`, `T.green`, `T.amber` | Status-kleuren |

**Nooit `T` buiten de component-functie gebruiken.** `makeStyles(T)` altijd aanroepen ná de hook.

---

## 8. Kleurlogica — strict

| Kleur | Hex | Gebruik |
|-------|-----|---------|
| Groen | `#4ED596` | Uitsluitend positieve delta-richting |
| Rood | `#E01B41` | Uitsluitend negatieve delta-richting |
| Amber | `#F5A623` | Categorieonderscheid (derde kleur) |
| Blauw | `#5B8DEF` | Categorieonderscheid (eerste kleur) |
| Paars | `rgba(167,139,250,…)` | Categorieonderscheid (tweede kleur) |

**Uitzondering:** `CostChart` gebruikt groen/rood als statuskleur (lage/hoge TER). Dit is bewust en gedocumenteerd.

---

## 9. Configurator — schaalassen

**Drie sliders in `ConfigEventTab.jsx`** onder sectiekop "Presentatie-instellingen":

| Slider | Updater | Bereik | Wat het doet |
|---|---|---|---|
| Beleidsvraag | `upTextScale` | 0.80–2.00 | Schaalt de beleidsvraag/framing-tekst bovenin PresentationView |
| Grafiek-labels | `upLabelScale` | 0.80–1.60 | Schaalt alle labels en waarden binnen de grafieken |
| Lijndikte | `upStrokeScale` | 0.80–1.60 | Schaalt strokeWidth van grafieklijnen, arcs en compare-ringen |

**`useConfigDraft.js`** exporteert:
- `upTextScale(val)` — past `draft.textScale` aan
- `upLabelScale(val)` — past `draft.labelScale` aan
- `upStrokeScale(val)` — past `draft.strokeScale` aan
- `upScale(val)` — legacy, past alleen `draft.displayScale` aan

**`App.jsx`** heeft drie losse useState-waarden:
```js
const [textScale,   setTextScale]   = useState(rawRegistry.textScale   ?? initialScale)
const [labelScale,  setLabelScale]  = useState(rawRegistry.labelScale  ?? initialScale)
const [strokeScale, setStrokeScale] = useState(rawRegistry.strokeScale ?? initialScale)
```

ScaleContext wordt gevoed als object:
```js
const scaleContextValue = { textScale, labelScale, strokeScale }
<ScaleContext.Provider value={scaleContextValue}>
```

---

## 10. Technische constanten

- Arc-animaties via `useEffect` + inline opacity/transform (niet via CSS className op SVG)
- ESG-arc animatie via `stroke-dashoffset`
- SVG naald-animaties via `transform translate` op een `<g>` element
- Alle chart-wrappers gebruiken `alignItems: stretch` met `minHeight: 0`
- SVG's gebruiken `preserveAspectRatio="xMidYMid meet"`
- GeographyChart: geografische gewichten proportioneel geschaald met `a.current`
- Explore-state wordt geïsoleerd via deep clone bij activering
- Charts ontvangen `comparisonPortfolio` als prop — nooit `scenario.comparison`
- `ExploreTotalBadge` ontvangt `exploreMode` prop — badge nooit zichtbaar buiten explore context
- `performanceView` op use case-niveau overschrijft event-portfolio performance via de bestaande merge-logica
- GeographyChart kaartgrenzen: D3 buiten React render, stroke niet via tokens — bewust en acceptabel
- ESGChart arc-dikte: vaste SVG-waarde in eigen viewBox — niet via tokens
- D3 geladen via CDN — niet geschikt voor offline gebruik (openstaand punt)
- Configurator-tooltips via `createPortal` naar `document.body`

---

## 11. Testing en CI

- Unit tests: `src/utils/resolveUseCase.test.js` (Vitest)
- GitHub Actions CI: draait automatisch op elke push naar `main`
- StackBlitz terminal kan Vitest niet direct uitvoeren — GitHub Actions is het verificatiepad

---

## 12. Openstaande punten

| Punt | Status |
|------|--------|
| Registry persistentie via GitHub Contents API | 🔜 Volgende bouwstap |
| D3 lokaal bundelen (GeographyChart — offline gebruik) | 🔜 Na concept-validatie |
| ExplorePanel sliders — verificatie correct functioneren | 🔜 Nog te testen |

---

*IO Portfolio Dashboard — CLAUDE.md — April 2026*
