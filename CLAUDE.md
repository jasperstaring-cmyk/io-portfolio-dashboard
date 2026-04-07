# CLAUDE.md — Portfolio Day Dashboard
> Instructiebestand voor Claude Code. **Altijd volledig lezen vóór je iets implementeert.**
> Dit is het enige projectdocument dat je kunt lezen. Alle andere documentatie leeft buiten de repo.
> Bij twijfel over architectuur of keuzes: stop en vraag. Ga nooit op eigen interpretatie af.

---

## 1. Wat is dit project?

Het **Portfolio Day Dashboard** is een interactief presentatie-instrument van **Investment Officer (IO)**, gebouwd voor live gebruik op het podium tijdens de jaarlijkse Portfolio Day voor beleggingsprofessionals (NL/BE). Het is geen klantapplicatie en geen realtime tool — het is een visuele rode draad door het programma.

**Doelgroep:** ~150 buy-side beleggingsprofessionals in een auditoriumsetting.
**Zichtbaarheid:** Groot scherm op het podium, kijkafstand 15–20 meter.

---

## 2. Jouw rol als Claude Code

Jij **implementeert uitsluitend**. Jij bedenkt geen architectuur, kiest geen alternatieven, en maakt geen eigen afwegingen.

**Wat jij doet:**
- Bestanden plaatsen op de exacte paden die de instructie opgeeft
- `npm run build` en `npm test` uitvoeren na elke wijziging
- Committen naar `main` → Vercel deployt automatisch
- Resultaat rapporteren (build OK/errors, test-uitslag, wat je ziet)

**Wat jij nooit doet:**
- Bestanden hernoemen, verplaatsen of samenvoegen tenzij expliciet gevraagd
- Meer wijzigen dan de instructie vraagt
- Architectuurkeuzes maken of bestaande patronen "verbeteren"
- Externe libraries toevoegen die nog niet in `package.json` staan
- Bestanden rechtstreeks in GitHub aanpassen — alles gaat via de lokale omgeving

Als een instructie onduidelijk is of lijkt te conflicteren met wat je in de code ziet: **stop en vraag**, implementeer niet op goed geluk.

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
    PresentationView.jsx               ← chrome schaalt via useT()
    ExplorePresentationView.jsx
    OperatorPanel.jsx                  ← horizontale balk onderin, vier actieknoppen
    ExplorePanel.jsx                   ← uitklaplade + balkstructuur gelijk aan OperatorPanel
    Configurator.jsx
    configurator/
      index.jsx
      useConfigDraft.js                ← alle draft-state en updaters incl. displayScale
      configuratorStyles.js
      ConfigFormParts.jsx
      ConfigEventTab.jsx               ← bevat tekstschaal-slider
      ConfigScenarioTab.jsx            ← use case lijst toont screenName
      ConfigScenarioEditor.jsx         ← invoerveld voor screenName
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
- Bevat: `schemaVersion`, `displayScale`, `activeEventId`, `events[]`
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
  "activeEventId": "portfolio_day_2026",
  "events": [ /* Event[] */ ]
}
```

### Use case structuur
Elke use case heeft vier lagen:
- `base` — startpunt (erft van event-portfolio of eigen override)
- `compare` — het alternatieve scenario dat de operator live kan activeren
- `explore` — de verkenningsruimte voor interactie met de zaal
- `performanceView` — optionele tijdreeks per use case

```json
{
  "id": "opening",
  "screenName": "Active / Passive",
  "dimension": "asset_class",
  "policyQuestion": { "nl": "...", "en": "..." },
  "theme": { "nl": "...", "en": "..." },
  "speaker": { "name": "...", "title": "...", "organisation": "..." },
  "base": { "useEventPortfolio": true },
  "compare": {
    "label": { "nl": "...", "en": "..." },
    "allocations": [ { "id": "equities", "current": 35 } ]
  },
  "framing": { "asset_class": { "equities": { "label": { "nl": "Groeimotor", "en": "Growth engine" } } } },
  "explore": { "enabled": true, "startFrom": "base", "dimensions": ["asset_class"] },
  "performanceView": { "base": [ /* TimeSeriesPoint[] */ ] }
}
```

### screenName
Nieuw veld per use case (april 2026). Korte inhoudelijke naam (max 3 woorden), zichtbaar in operatorbalk en configuratorlijst. Geen sprekernaam. Kan string zijn of `{ en: "...", nl: "..." }` — primaire waarde is `.en`.

### Implementation — enige geldige formaat
```json
"implementation": {
  "categories": [
    { "id": "active",   "label": { "nl": "Actief beheer", "en": "Active Management" }, "weight": 55, "color": "#E01B41" },
    { "id": "passive",  "label": { "nl": "Passief / ETF", "en": "Passive / ETF" },     "weight": 35, "color": "#5B8DEF" }
  ],
  "explore": {
    "active":  { "min": 0, "max": 80 },
    "passive": { "min": 0, "max": 80 }
  }
}
```

Het `categories[]` formaat is het **enige geldige formaat** in schema v1.1. Gebruik nooit een oud formaat.

### Geldige dimensie-waarden
`"asset_class"` | `"geography"` | `"esg"` | `"implementation"` | `"performance"` | `"sector"` | `"currency"` | `"style"` | `"cost"`

---

## 7. Typografie en lijndikte — chartTokens.js

Alle typografie én lijndikte zijn gecentraliseerd in `src/components/charts/chartTokens.js`. Dit bestand levert `ScaleContext`, `makeTokens(scale)` en de `useT()` hook.

### Gebruik in elke chart én PresentationView — altijd zo:
```js
import { useT } from '../charts/chartTokens'  // pad aanpassen aan locatie

export default function MijnChart({ ... }) {
  const T = useT()           // ← altijd bovenaan de component-functie
  const s = makeStyles(T)    // ← makeStyles aanroepen ná de hook, binnen de functie
  // ...
}

function makeStyles(T) {     // ← buiten de component-functie definiëren
  return {
    label: { fontSize: T.small },
    lijn:  { strokeWidth: T.strokeMid },
  }
}
```

**Nooit:** `T` gebruiken buiten de component-functie, of hardcoded px/rem-waarden in charts.

### Typografie-tokens (basiswaarden bij scale 1.0)
| Token | Waarde | Gebruik |
|---|---|---|
| `T.micro` | 0.58rem | Sublabels, sectietitels in chart |
| `T.small` | 0.68rem | As-labels, bijschriften |
| `T.body` | 0.82rem | Rijnamen, categorie-namen |
| `T.medium` | 0.95rem | Secundaire waarden |
| `T.large` | 1.10rem | Primaire %-waarden |
| `T.xlarge` | 1.40rem | Prominente waarden, beleidsvraag |
| `T.display` | 2.00rem | KPI-koppen, gauge-waarden |
| `T.hero` | 3.00rem | Allergrootste waarden |
| `T.svgMicro` | 9px | SVG as-labels |
| `T.svgSmall` | 11px | SVG delta-badges |
| `T.svgBody` | 13px | SVG callout namen |
| `T.svgLarge` | 19px | SVG callout percentages |
| `T.svgHero` | 30px | SVG callout percentages (geselecteerd) |

### Stroke-tokens
| Token | Waarde | Gebruik |
|---|---|---|
| `T.strokeHair` | 0.5 | Kaartgrenzen, subtiele scheidingen |
| `T.strokeThin` | 0.9 | Gridlijnen, segment-scheidingen |
| `T.strokeMid` | 1.6 | Callout-lijnen actief, compare-ringen |
| `T.strokeThick` | 2.8 | Hoofd-datalijnen (PerformanceChart) |
| `T.strokeHeavy` | 4.5 | ESG arc-dikte, gauge-tracks |

---

## 8. Kleurlogica — strict

| Kleur | Hex | Gebruik |
|-------|-----|---------|
| Blauw | `#5B8DEF` | Categorieonderscheid — eerste kleur |
| Amber | `#F5A623` | Categorieonderscheid — derde kleur |
| Paars | `rgba(167,139,250,0.85)` | Categorieonderscheid — tweede kleur |
| Grijs | `#8A8A82` | Categorieonderscheid — restcategorie |
| **Groen** | `#4ED596` | **Uitsluitend** positieve delta-richting |
| **Rood** | `#E01B41` | **Uitsluitend** negatieve delta-richting + UI-accenten |

**Uitzondering:** `CostChart` gebruikt groen voor lage kosten en rood voor hoge kosten — dit is een statuskleur, gedocumenteerd als bewuste uitzondering.

**ESG score kleurlogica** (ook een uitzondering — statuskleur):
- ≥ 7.0 → groen (`#4ED596`)
- ≥ 5.0 → amber (`#F5A623`)
- < 5.0 → rood (`#E01B41`)

---

## 9. Animatie-regels

### Gebruik altijd useEffect-gebaseerde animaties:
```js
const [visible, setVisible] = useState(false)
useEffect(() => {
  setVisible(false)
  const t = setTimeout(() => setVisible(true), 80)
  return () => clearTimeout(t)
}, [afhankelijkheid])
```

**Nooit:** `animated` state met setTimeout als CSS className-trigger op SVG-elementen — onbetrouwbaar.

### Specifieke gevallen:
- **SVG-naalden:** `transform: translate()` op een `<g>` element — niet op individuele paden
- **ESG-arcs:** animatie via `stroke-dashoffset`
- **Arc-animaties algemeen:** `useEffect` + inline `opacity`/`transform`

---

## 10. Layout-regels voor charts

Alle chart-wrappers:
```js
{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  minHeight: 0,      // ← cruciaal voor flex-kinderen die de ruimte vullen
  height: '100%',
}
```

Alle SVG's:
```jsx
<svg
  viewBox="0 0 400 300"
  preserveAspectRatio="xMidYMid meet"
  style={{ width: '100%', height: '100%' }}
>
```

---

## 11. GeographyChart — speciale regels

- D3 wordt dynamisch geladen via CDN (`import()` via jsdelivr)
- TopoJSON eveneens via CDN
- Kaartgrenzen: `stroke` **niet** via tokens — bewuste uitzondering, vaste SVG-waarden
- EM-landen gesplitst in geografische subregio's op de kaart, geaggregeerd als één totaal in de bar chart
- `buildGeoMap()` schaalt gewichten proportioneel via `a.current`
- D3-logica leeft buiten de React render-cyclus — bewust patroon, niet aanpassen

**Let op:** CDN-laden is niet geschikt voor offline gebruik. Bundeling staat op de roadmap maar wordt pas opgepakt na expliciete instructie.

---

## 12. Explore-modus

- Explore-state wordt **altijd** via deep clone geïsoleerd bij activering
- Wijzigingen in explore beïnvloeden base/compare state **nooit**
- `ExploreTotalBadge` ontvangt `exploreMode` prop — badge is **nooit** zichtbaar buiten explore context
- `ExplorePanel` bevat de sliders; `ExplorePresentationView` toont de chart
- Explore gap: als de som van explore-gewichten < 100%, verschijnt een gestreept grijs segment in Implementation- en Currency-balken

---

## 13. Operatorbalk en modi

### Vijf modi
| Modus | Naam | Beschrijving |
|---|---|---|
| 0 | Idle | Startscherm. Alleen Configure, eventnaam en Start zichtbaar in balk. |
| 1 | Scenario | Actieve use case. Alle balksecties zichtbaar. |
| 2 | Navigatie | Operator navigeert en togglet Compare/Performance. |
| 3 | Performance view | Performance chart vervangt tijdelijk de actieve dimensie. |
| 4 | Explore | Aparte groene UI met uitklaplade en sliders. Terug via Back-knop. |

### Zichtbaarheid in idle-stand
In idle zijn **alleen** zichtbaar: Configure, eventnaam, screenName en Start-knop.
Navigatieteller, Compare, Performance en Explore zijn `visibility: hidden` — ze houden hun ruimte maar zijn niet zichtbaar.

### Explore uitklaplade
- Zweeft omhoog vanuit bovenkant operatorbalk
- Breedte: `min(1400px, 96vw)`, gecentreerd horizontaal
- Groene bovenlijn (3px `#4ED596`) als explore-indicator
- Toggle tab: "▼ Hide" / "▲ Show" — gecentreerd bovenin de lade
- Lade animeert via `max-height` + `opacity` transition
- `operator-wrapper` in `global.css` heeft `overflow: visible` en `position: relative` — nodig voor de lade, niet aanpassen

### Back-knop in Explore
Horizontale groene pill, podiumleesbaar op 15–20 meter afstand.

---

## 14. CSS en global.css

- `operator-wrapper` heeft `overflow: visible` en `position: relative` — **niet wijzigen**
- Voeg geen inline stijlen toe die al in `global.css` gedefinieerd zijn
- Gebruik geen Tailwind of andere CSS-frameworks — alleen handgeschreven CSS en inline styles

---

## 15. IO Design tokens — referentie

```
Achtergrond (dashboard):  #0C182E
Accent rood:              #E01B41
Tekst primair:            #FFFFFF
Tekst secundair:          rgba(255,255,255,0.75)
Tekst gedempt:            rgba(255,255,255,0.45)
Tekst faint:              rgba(255,255,255,0.28)
Font-family:              'Merriweather Sans', sans-serif
Configurator achtergrond: #F8F8F7
```

---

## 16. Tests uitvoeren

```bash
npm run build     # Altijd na elke wijziging — geen errors toegestaan
npm test          # Vitest — 46 tests in resolveUseCase.test.js
```

Als `npm test` lokaal niet werkt: push naar `main` en controleer GitHub Actions op:
`https://github.com/jasperstaring-cmyk/io-portfolio-dashboard/actions`

Test-bestand: `src/utils/resolveUseCase.test.js` — **niet aanpassen** tenzij expliciet gevraagd.

---

## 17. Checklist vóór elke commit

- [ ] `npm run build` geeft geen errors
- [ ] `npm test` slaagt (of GitHub Actions gecontroleerd na push)
- [ ] Geen hardcoded px/rem-waarden in charts — gebruik `T.*` tokens
- [ ] Geen groen/rood voor categorieonderscheid — alleen voor delta-richting (uitzonderingen: CostChart en ESG score)
- [ ] Charts ontvangen `comparisonPortfolio` prop — nooit `scenario.comparison`
- [ ] `resolveUseCase()` is de enige plek met merge-logica
- [ ] Animaties via `useEffect` + opacity/transform — geen CSS className-toggle op SVG
- [ ] SVG's hebben `preserveAspectRatio="xMidYMid meet"`
- [ ] Chart-wrappers hebben `alignItems: stretch` + `minHeight: 0`
- [ ] `useT()` bovenaan de component-functie, `makeStyles(T)` erna — `T` nooit buiten de functie
- [ ] Niet meer gewijzigd dan de instructie vroeg

---

## 18. Bestandslevering

Instructies vanuit het Claude-project bevatten altijd:
- Exacte bestandsnamen (bijv. `index.jsx`, nooit `configurator_index.jsx`)
- Exacte doelpaden (bijv. `src/components/charts/AssetClassChart.jsx`)
- Beschrijving van wat de wijziging doet
- Welke checks uitgevoerd moeten worden

Jij voert de checks uit en rapporteert het resultaat terug — inclusief eventuele build-errors of afwijkende test-uitkomsten.

---

## 19. Openstaande punten (april 2026)

| Punt | Status | Toelichting |
|------|--------|-------------|
| **Registry persistentie via GitHub Contents API** | 🔜 Volgende bouwstap | Save to registry schrijft nog niet naar GitHub. Wacht op expliciete instructie. |
| **Auditorium-optimalisatie** | ✅ Opgelost | Typografie, lijndikte, PresentationView-chrome via chartTokens.js |
| **OperatorPanel herontwerp** | ✅ Opgelost | Horizontale balk, vier actieknoppen, screenName, navigatieteller |
| **ExplorePanel uitklaplade** | ✅ Opgelost | Omhoog vanuit control panel, horizontale sliders, toggle tab |
| **screenName veld** | ✅ Opgelost | Per use case instelbaar in configurator, zichtbaar in operatorbalk en lijst |
| **Idle-stand verfijning** | ✅ Opgelost | Balk maximaal rustig in idle: alleen Configure, eventnaam en Start zichtbaar |
| **Back-knop Explore** | ✅ Opgelost | Horizontale pill, podiumleesbaar op 15–20 meter |

Implementeer niets uit de "openstaande punten" zonder expliciete instructie — ook al lijkt het logisch of bijna af.

---

*Investment Officer — Portfolio Day Dashboard*
*CLAUDE.md — gegenereerd op basis van Projectinstructie v14.0, Datamodel v1.1 — april 2026*
