/**
 * chartTokens.js — Centrale typografie- en lijndikte-tokens voor alle Portfolio Day charts
 *
 * ScaleContext bevat nu een object met drie onafhankelijke assen:
 *   textScale   — beleidsvraag / framing-tekst in PresentationView (0.80–2.00)
 *   labelScale  — grafiek-labels en -waarden: SVG fontSize, CSS rem (0.80–1.60)
 *   strokeScale — lijndikte: strokeWidth (0.80–1.60)
 *
 * Backwards-compatible:
 *   useT() schaalt tekst op labelScale en stroke op strokeScale.
 *   useTextScale() geeft de textScale terug voor PresentationView.
 *   ScaleContext accepteert nog steeds een getal (legacy) of een object.
 *
 * Gebruik in chart:
 *   import { useT } from './chartTokens'
 *   const T = useT()
 *   fontSize={T.svgSmall}         ← SVG text elementen (geeft getal, op labelScale)
 *   fontSize: T.small             ← CSS/React style props (geeft rem-string, op labelScale)
 *   strokeWidth={T.strokeMid}     ← SVG lijndikte (geeft getal, op strokeScale)
 *
 * Gebruik in PresentationView (beleidsvraag):
 *   import { useTextScale } from './chartTokens'
 *   const textScale = useTextScale()
 *   fontSize: `${2.0 * textScale}rem`
 *
 * Stroke-tokens (meeschalen met strokeScale):
 *   T.strokeHair   — kaartgrenzen, subtiele scheidingen (0.5 → 0.9)
 *   T.strokeThin   — callout-lijnen rust, gridlijnen zichtbaar (0.9 → 1.5)
 *   T.strokeMid    — callout-lijnen actief, compare-ringen, badge-borders (1.6 → 2.5)
 *   T.strokeThick  — hoofd-datalijnen (performance, arcs) (2.8 → 4.5)
 *   T.strokeHeavy  — geaccentueerde arcs, naald-borders (4.0 → 6.0)
 */

import { createContext, useContext } from 'react'

// ─── Context ───────────────────────────────────────────────────────────────
// Accepteert getal (legacy) of object { textScale, labelScale, strokeScale }
export const ScaleContext = createContext(1.0)

// Intern: normaliseer context-waarde naar object
function resolveScales(ctxValue) {
  if (typeof ctxValue === 'number') {
    return { textScale: ctxValue, labelScale: ctxValue, strokeScale: ctxValue }
  }
  return {
    textScale:   ctxValue.textScale   ?? 1.0,
    labelScale:  ctxValue.labelScale  ?? 1.0,
    strokeScale: ctxValue.strokeScale ?? 1.0,
  }
}

// Hook voor charts: gebruikt labelScale voor tekst, strokeScale voor lijnen
export function useT() {
  const ctx = useContext(ScaleContext)
  const { labelScale, strokeScale } = resolveScales(ctx)
  return makeTokens(labelScale, strokeScale)
}

// Hook voor PresentationView: geeft textScale terug voor beleidsvraag/framing
export function useTextScale() {
  const ctx = useContext(ScaleContext)
  return resolveScales(ctx).textScale
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

export function makeTokens(labelScale = 1.0, strokeScale = 1.0) {
  return {
    // ── CSS rem-waarden (voor HTML/React style props) — schalen op labelScale ──
    micro:    rem(0.58, labelScale),
    small:    rem(0.68, labelScale),
    body:     rem(0.82, labelScale),
    medium:   rem(0.95, labelScale),
    large:    rem(1.10, labelScale),
    xlarge:   rem(1.40, labelScale),
    display:  rem(2.00, labelScale),
    hero:     rem(3.00, labelScale),

    // ── SVG px-waarden (geeft getal voor fontSize attribuut) — op labelScale ──
    svgMicro: Math.round(9  * labelScale),
    svgSmall: Math.round(11 * labelScale),
    svgBody:  Math.round(13 * labelScale),
    svgLarge: Math.round(19 * labelScale),
    svgHero:  Math.round(30 * labelScale),

    // ── Stroke-dikte (geeft getal voor strokeWidth attribuut) — op strokeScale ─
    strokeHair:  stroke(0.5, strokeScale),   // kaartgrenzen, subtiele scheidingen
    strokeThin:  stroke(0.9, strokeScale),   // callout-lijnen rust, zichtbare gridlijnen
    strokeMid:   stroke(1.6, strokeScale),   // callout-lijnen actief, compare-ringen, badges
    strokeThick: stroke(2.8, strokeScale),   // hoofd-datalijnen (performance, portfoliolijn)
    strokeHeavy: stroke(4.5, strokeScale),   // ESG arc-dikte, gauge-tracks

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
