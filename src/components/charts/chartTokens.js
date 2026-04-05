/**
 * chartTokens.js — Centrale typografie-tokens voor alle Portfolio Day charts
 *
 * De schaalwaarde komt uit ScaleContext, gevoed vanuit registry.json via App.jsx.
 * Pas de schaal aan via de Configurator → Event → "Tekstschaal (presentatiegrootte)".
 *
 * Gebruik in chart:
 *   import { useT } from './chartTokens'
 *   const T = useT()
 *   fontSize={T.svgSmall}    ← SVG text elementen (geeft getal)
 *   fontSize: T.small        ← CSS/React style props (geeft rem-string)
 */

import { createContext, useContext } from 'react'

// ─── Context ───────────────────────────────────────────────────────────────
export const ScaleContext = createContext(1.0)

// Hook die charts gebruiken om de huidige token-set op te halen
export function useT() {
  const scale = useContext(ScaleContext)
  return makeTokens(scale)
}

// ─── Token-factory ─────────────────────────────────────────────────────────
function rem(base, scale) {
  return `${(base * scale).toFixed(3)}rem`
}

export function makeTokens(scale = 1.0) {
  return {
    // ── CSS rem-waarden (voor HTML/React style props) ──────────────────────
    // Micro-labels: sublabels, sectietitels in chart, legenda-annotaties
    micro:     rem(0.58, scale),
    // Klein: as-labels, descriptietekst, bijschriften
    small:     rem(0.68, scale),
    // Body: rijnamen in bar charts, categorie-namen
    body:      rem(0.82, scale),
    // Medium: secundaire waarden, delta-badges
    medium:    rem(0.95, scale),
    // Large: primaire %-waarden per rij
    large:     rem(1.10, scale),
    // XLarge: prominente per-categorie waarden
    xlarge:    rem(1.40, scale),
    // Display: KPI-koppen, gauge-waarden
    display:   rem(2.00, scale),
    // Hero: de allergrootste waarden (ESG score, sector topPct)
    hero:      rem(3.00, scale),

    // ── SVG px-waarden (geeft getal voor fontSize attribuut) ──────────────
    svgMicro:  Math.round(9  * scale),
    svgSmall:  Math.round(11 * scale),
    svgBody:   Math.round(13 * scale),
    svgLarge:  Math.round(19 * scale),
    svgHero:   Math.round(30 * scale),

    // ── Font weights (onveranderd) ─────────────────────────────────────────
    wMicro:  800,
    wBody:   600,
    wMedium: 700,
    wHeavy:  800,

    // ── Kleuren (onveranderd) ──────────────────────────────────────────────
    primary:   '#FFFFFF',
    secondary: 'rgba(255,255,255,0.75)',
    muted:     'rgba(255,255,255,0.45)',
    faint:     'rgba(255,255,255,0.28)',
    red:       '#E01B41',
    green:     '#4ED596',
    amber:     '#F5A623',
  }
}
