/**
 * chartTokens.js — Centrale typografie-tokens voor alle Portfolio Day charts
 *
 * Schaal aanpassen voor auditorium:
 *   SCALE = 1.0  →  huidige desktop-weergave (concept/validatie)
 *   SCALE = 1.20 →  lichte vergroting (kleine zaal / breakout)
 *   SCALE = 1.35 →  auditorium 150 personen op 15–20m (aanbevolen startpunt)
 *   SCALE = 1.50 →  maximaal / zeer grote zaal
 *
 * Gebruik in chart:
 *   import { T, px } from './chartTokens'
 *   fontSize={px(T.svgSmall)}     ← voor SVG text elementen (geeft getal)
 *   fontSize: T.small             ← voor CSS/React style props (geeft rem-string)
 */

export const SCALE = 1.0

// ─── CSS rem-waarden (voor HTML/React style props) ─────────────────────────
// Alle waarden worden vermenigvuldigd met SCALE.
// Gebruik: fontSize: T.small  →  '0.68rem' bij SCALE=1.0
function rem(base) {
  return `${(base * SCALE).toFixed(3)}rem`
}

export const T = {
  // Micro-labels: sublabels, sectietitels in chart, legenda-annotaties
  // Voorbeelden: "ESG SCORE", "SFDR CLASSIFICATION", "REGIONAL BREAKDOWN"
  micro:     rem(0.58),

  // Klein: as-labels, descriptietekst, bijschriften, "CLICK AGAIN TO CLOSE"
  // Voorbeelden: x-as datums, sfdrDesc, carbonSub, sfdrDetail body
  small:     rem(0.68),

  // Body: rijnamen in bar charts, categorie-namen, list items
  // Voorbeelden: regionName, restName, sfdrName (Art.6/8), topName
  body:      rem(0.82),

  // Medium: secundaire waarden, delta-badges, barlabels met %
  // Voorbeelden: delta-tekst, restMeta pct, topDelta
  medium:    rem(0.95),

  // Large: primaire %-waarden per rij in bar charts
  // Voorbeelden: pct in Geography, restPct, sfdrName (Art.9)
  large:     rem(1.10),

  // XLarge: prominente per-categorie waarden (sector top, currency donut)
  // Voorbeelden: topPct sector, large kpi's
  xlarge:    rem(1.40),

  // Display: KPI-koppen, gauge-waarden, donut-centrum
  // Voorbeelden: carbonVal, alphaVal, CostChart TER readout (klein)
  display:   rem(2.00),

  // Hero: de allergrootste waarden (ESG score in gauge, sector top%)
  // Voorbeelden: ESG score 48px, sector topPct 3.2rem
  hero:      rem(3.00),

  // ─── SVG px-waarden ────────────────────────────────────────────────────
  // Voor SVG <text fontSize={}> attributen. Geeft een getal terug.
  svgMicro:  Math.round(9  * SCALE),   // was 8-9   — as-labels performance, kleine notities
  svgSmall:  Math.round(11 * SCALE),   // was 10-11 — delta-badges, schaallabels cost, status pill
  svgBody:   Math.round(13 * SCALE),   // was 12    — callout naam-labels asset class
  svgLarge:  Math.round(19 * SCALE),   // was 19    — callout % niet-geselecteerd asset class
  svgHero:   Math.round(30 * SCALE),   // was 30    — callout % geselecteerd asset class

  // ─── Font weights (onveranderd — geen schaaleffect) ────────────────────
  wMicro:  800,   // sublabels, uppercase annotaties
  wBody:   600,   // namen, labels
  wMedium: 700,   // secundaire waarden, delta
  wHeavy:  800,   // primaire waarden, KPI's

  // ─── Kleuren (onveranderd) ─────────────────────────────────────────────
  // Tekst op donkere achtergrond
  primary:   '#FFFFFF',
  secondary: 'rgba(255,255,255,0.75)',
  muted:     'rgba(255,255,255,0.45)',
  faint:     'rgba(255,255,255,0.28)',

  // Accent (conform IO-stijl: rood/groen alleen voor delta-richting)
  red:       '#E01B41',
  green:     '#4ED596',
  amber:     '#F5A623',
}

/**
 * px(value) — helper om SVG fontSize als getal terug te geven
 * Gebruik: fontSize={px(T.svgSmall)}
 * (Identiek aan gewoon T.svgSmall, maar leesbaar als functie-aanroep)
 */
export function px(val) { return val }
