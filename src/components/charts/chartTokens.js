/**
 * chartTokens.js — Centrale typografie- en lijndikte-tokens voor alle Portfolio Day charts
 *
 * De schaalwaarde komt uit ScaleContext, gevoed vanuit registry.json via App.jsx.
 * Pas de schaal aan via de Configurator → Event → "Tekstschaal (presentatiegrootte)".
 *
 * Gebruik in chart:
 *   import { useT } from './chartTokens'
 *   const T = useT()
 *   fontSize={T.svgSmall}         ← SVG text elementen (geeft getal)
 *   fontSize: T.small             ← CSS/React style props (geeft rem-string)
 *   strokeWidth={T.strokeMid}     ← SVG lijndikte (geeft getal)
 *
 * Stroke-tokens (meeschalen met displayScale):
 *   T.strokeHair   — kaartgrenzen, subtiele scheidingen (0.5 → 0.9)
 *   T.strokeThin   — callout-lijnen rust, gridlijnen zichtbaar (0.9 → 1.5)
 *   T.strokeMid    — callout-lijnen actief, compare-ringen, badge-borders (1.6 → 2.5)
 *   T.strokeThick  — hoofd-datalijnen (performance, arcs) (2.8 → 4.5)
 *   T.strokeHeavy  — geaccentueerde arcs, naald-borders (4.0 → 6.0)
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

function stroke(base, scale) {
  // Lijndikte schaalt minder agressief dan typografie: wortelfactor
  // zodat lijnen op 1.35× leesbaar zijn zonder te zwaar te worden
  return +(base * Math.pow(scale, 0.75)).toFixed(2)
}

export function makeTokens(scale = 1.0) {
  return {
    // ── CSS rem-waarden (voor HTML/React style props) ──────────────────────
    micro:    rem(0.58, scale),
    small:    rem(0.68, scale),
    body:     rem(0.82, scale),
    medium:   rem(0.95, scale),
    large:    rem(1.10, scale),
    xlarge:   rem(1.40, scale),
    display:  rem(2.00, scale),
    hero:     rem(3.00, scale),

    // ── SVG px-waarden (geeft getal voor fontSize attribuut) ──────────────
    svgMicro: Math.round(9  * scale),
    svgSmall: Math.round(11 * scale),
    svgBody:  Math.round(13 * scale),
    svgLarge: Math.round(19 * scale),
    svgHero:  Math.round(30 * scale),

    // ── Stroke-dikte (geeft getal voor strokeWidth attribuut) ─────────────
    // Schaalt met wortelfactor: zichtbaar beter op afstand, niet overdreven dik
    strokeHair:  stroke(0.5, scale),   // kaartgrenzen, subtiele scheidingen
    strokeThin:  stroke(0.9, scale),   // callout-lijnen rust, zichtbare gridlijnen
    strokeMid:   stroke(1.6, scale),   // callout-lijnen actief, compare-ringen, badges
    strokeThick: stroke(2.8, scale),   // hoofd-datalijnen (performance, portfoliolijn)
    strokeHeavy: stroke(4.5, scale),   // ESG arc-dikte, gauge-tracks

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
