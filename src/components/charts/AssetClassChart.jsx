import { useState, useEffect } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'

// Kleurlogica conform IO-stijl:
// Rood   = equities (dominant, grootste positie — trekt terecht de meeste aandacht)
// Blauw  = fixed income (neutraal, stabiel)
// Amber  = real estate (derde categorie)
// Gray   = alternatives
// Wit/transparant = cash (minste gewicht, minste kleur)
// Groen is GERESERVEERD voor compare/positieve delta — nooit voor een asset class zelf
const COLORS = {
  equities:     '#E01B41',
  fixed_income: '#5B8DEF',
  real_estate:  '#F5A623',
  alternatives: '#8A8A82',
  cash:         'rgba(255,255,255,0.35)',
}

export default function AssetClassChart({ portfolio, scenario, showComparison, lang }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const allocations = portfolio.allocations

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.allocations) return null
    return scenario.comparison.allocations.find(a => a.id === id)?.current ?? null
  }

  const activeAllocs = allocations.map(a => {
    const comp = getComp(a.id)
    return { ...a, compVal: comp, displayVal: comp !== null ? comp : a.current }
  })

  const donutTotal = activeAllocs.reduce((s, a) => s + a.displayVal, 0)

  // Donut als arcs (niet als pie-segmenten) — eleganter, geen harde strokeWidth-scheiding
  const cx = 160, cy = 160, R = 118, STROKE = 28, inner = R - STROKE / 2 - 2
  const circumference = 2 * Math.PI * R
  const GAP_DEG = 1.4 // kleine gap tussen segmenten in graden

  function arcParams(startDeg, endDeg) {
    const gapRad = (GAP_DEG / 2) * Math.PI / 180
    const startRad = (startDeg - 90) * Math.PI / 180 + gapRad
    const endRad   = (endDeg   - 90) * Math.PI / 180 - gapRad
    const x1 = cx + R * Math.cos(startRad)
    const y1 = cy + R * Math.sin(startRad)
    const x2 = cx + R * Math.cos(endRad)
    const y2 = cy + R * Math.sin(endRad)
    const large = (endDeg - startDeg - GAP_DEG) > 180 ? 1 : 0
    return { x1, y1, x2, y2, large }
  }

  let cum = 0
  const slices = activeAllocs.map(a => {
    const deg = (a.displayVal / donutTotal) * 360
    const sl = { ...a, startDeg: cum, endDeg: cum + deg }
    cum += deg
    return sl
  })

  const status = a => a.current < a.min || a.current > a.max
    ? '#E01B41'
    : Math.abs(a.current - a.target) > 5
      ? '#F5A623'
      : '#4ED596'

  return (
    <div style={s.wrap}>

      {/* ── Donut ─────────────────────────────────────────────────────── */}
      <div style={s.donutCol}>
        <svg
          key={showComparison ? 'comp' : 'base'}
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid meet"
          style={{
            ...s.svg,
            opacity: animated ? 1 : 0,
            transform: animated ? 'scale(1)' : 'scale(0.92)',
            transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
            transformOrigin: 'center',
          }}
        >
          <defs>
            {/* Subtiele gloed achter de donut */}
            <radialGradient id="ac-glow" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stopColor="#E01B41" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#E01B41" stopOpacity="0" />
            </radialGradient>
            {/* Compare-gloed in groen */}
            <radialGradient id="ac-glow-comp" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stopColor="#4ED596" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Achtergrondgloed */}
          <circle cx={cx} cy={cy} r={R + 20}
            fill={showComparison ? 'url(#ac-glow-comp)' : 'url(#ac-glow)'}
            style={{ transition: 'fill 0.6s ease' }}
          />

          {/* Buitenste gidsring */}
          <circle cx={cx} cy={cy} r={R + STROKE / 2 + 6}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Track ring — de grijze onderlaag */}
          <circle cx={cx} cy={cy} r={R}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={STROKE}
          />

          {/* Arc-segmenten */}
          {slices.map(sl => {
            const { x1, y1, x2, y2, large } = arcParams(sl.startDeg, sl.endDeg)
            const color = COLORS[sl.id]
            return (
              <path
                key={sl.id}
                d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
                fill="none"
                stroke={color}
                strokeWidth={STROKE}
                strokeLinecap="butt"
                opacity={showComparison ? 0.70 : 0.92}
                style={{ transition: 'opacity 0.5s ease', cursor: 'pointer' }}
                onMouseEnter={e => showTooltip(e, {
                  label: sl.label?.[lang] || sl.label?.en || sl.id,
                  value: `${sl.displayVal}%`,
                  color,
                  sub: sl.compVal !== null ? `Base: ${sl.current}%` : `Target: ${sl.target}%`,
                  delta: sl.compVal !== null && sl.compVal !== sl.current
                    ? `${sl.compVal > sl.current ? '+' : ''}${sl.compVal - sl.current}%`
                    : null,
                })}
                onMouseLeave={hideTooltip}
              />
            )
          })}

          {/* Compare-ring — gestippeld groen */}
          {showComparison && (
            <circle cx={cx} cy={cy} r={R + STROKE / 2 + 2}
              fill="none"
              stroke="rgba(78,213,150,0.45)"
              strokeWidth="2"
              strokeDasharray="7 4"
            />
          )}

          {/* Centerveld */}
          <circle cx={cx} cy={cy} r={inner}
            fill="#0C182E"
          />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1"
          />

          {/* Centerlabels */}
          <text x={cx} y={cy - 20} textAnchor="middle"
            fill="rgba(255,255,255,0.30)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="800" letterSpacing="2">
            {showComparison ? 'SCENARIO' : 'PORTFOLIO'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={showComparison ? '#4ED596' : 'white'}
            fontFamily="'Merriweather', serif"
            fontSize="22" fontWeight="700"
            style={{ transition: 'fill 0.5s ease' }}>
            {portfolio.profile}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle"
            fill="rgba(255,255,255,0.26)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="10">
            {portfolio.currency}
          </text>
        </svg>
      </div>

      {/* ── Tabel ─────────────────────────────────────────────────────── */}
      <div style={s.tableCol}>
        <div style={s.thead}>
          <span style={{ ...s.th, flex: 2 }}>ASSET CLASS</span>
          <span style={{ ...s.th, flex: 3 }}>ALLOCATION</span>
          <span style={{ ...s.th, width: 64, textAlign: 'right' }}>NOW</span>
          <span style={{ ...s.th, width: 60, textAlign: 'right' }}>TARGET</span>
          <span style={{ ...s.th, width: 80, textAlign: 'right' }}>RANGE</span>
          <span style={{ ...s.th, width: 36, textAlign: 'center' }}>●</span>
        </div>
        <div style={s.divider} />

        {allocations.map(a => {
          const comp      = getComp(a.id)
          const displayVal = comp !== null ? comp : a.current
          const delta     = comp !== null ? comp - a.current : 0
          const label     = a.label?.[lang] || a.label?.en
          const maxBar    = 65
          const color     = COLORS[a.id]
          const hasChange = comp !== null && delta !== 0

          return (
            <div key={a.id}
              onMouseEnter={e => showTooltip(e, {
                label,
                value: `${displayVal}%`,
                color,
                sub: `Target: ${a.target}% · Range: ${a.min}–${a.max}%`,
                delta: hasChange ? `${delta > 0 ? '+' : ''}${delta}% vs base` : null,
              })}
              onMouseLeave={hideTooltip}
              style={{
                ...s.row,
                background: hasChange
                  ? delta < 0
                    ? 'rgba(78,213,150,0.05)'
                    : 'rgba(224,27,65,0.05)'
                  : 'transparent',
                transition: 'background 0.6s ease',
              }}
            >
              {/* Label + kleurstreep */}
              <div style={{ ...s.cell, flex: 2 }}>
                <div style={{
                  width: 3, height: 26, borderRadius: 2,
                  background: color, flexShrink: 0,
                  boxShadow: `0 0 6px ${color}66`,
                }} />
                <span style={s.name}>{label}</span>
              </div>

              {/* Bar */}
              <div style={{ flex: 3 }}>
                <div style={s.track}>
                  {/* Bandbredte */}
                  <div style={{
                    ...s.rangeBand,
                    left:  `${(a.min / maxBar) * 100}%`,
                    width: `${((a.max - a.min) / maxBar) * 100}%`,
                  }} />
                  {/* Target tick */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(a.target / maxBar) * 100}%`,
                    width: 2, background: 'rgba(255,255,255,0.2)', zIndex: 2,
                  }} />
                  {/* Base-bar bij compare */}
                  {comp !== null && (
                    <div style={{
                      position: 'absolute', top: 6, bottom: 6, left: 0,
                      borderRadius: 3, background: color, opacity: 0.16,
                      width: `${(a.current / maxBar) * 100}%`,
                    }} />
                  )}
                  {/* Actieve bar */}
                  <div style={{
                    position: 'absolute', top: 6, bottom: 6, left: 0,
                    borderRadius: 3, opacity: 0.88,
                    width: `${(displayVal / maxBar) * 100}%`,
                    background: hasChange
                      ? delta < 0 ? '#4ED596' : '#E01B41'
                      : color,
                    zIndex: 3,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                    boxShadow: hasChange
                      ? delta < 0
                        ? '0 0 8px rgba(78,213,150,0.35)'
                        : '0 0 8px rgba(224,27,65,0.35)'
                      : 'none',
                  }} />
                </div>
              </div>

              {/* Waarde */}
              <div style={{ width: 64, textAlign: 'right' }}>
                <span style={{
                  ...s.valNow,
                  color: hasChange
                    ? delta < 0 ? '#4ED596' : '#E01B41'
                    : '#FFFFFF',
                  transition: 'color 0.5s ease',
                }}>
                  {displayVal}%
                </span>
                {hasChange && (
                  <span style={{
                    display: 'block',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.58rem', fontWeight: 600,
                    color: 'rgba(255,255,255,0.32)',
                  }}>
                    was {a.current}%
                  </span>
                )}
              </div>

              <span style={{ ...s.muted, width: 60 }}>{a.target}%</span>
              <span style={{ ...s.muted, width: 80, fontSize: '0.68rem' }}>
                {a.min}–{a.max}%
              </span>

              {/* Statusdot */}
              <div style={{ width: 36, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: status(a),
                  boxShadow: `0 0 8px ${status(a)}99`,
                }} />
              </div>
            </div>
          )
        })}

        <div style={s.divider} />

        {/* Legenda */}
        <div style={s.legend}>
          {[
            { el: <div style={s.rangeSwatch} />, label: 'Bandwidth' },
            { el: <div style={s.targetSwatch} />, label: 'Target' },
            ...(showComparison && scenario?.comparison ? [{
              el: <div style={s.compSwatch} />,
              label: scenario.comparison.label?.en,
            }] : []),
          ].map(l => (
            <div key={l.label} style={s.legendItem}>
              {l.el}
              <span style={s.legendText}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

const s = {
  wrap:      { display: 'flex', alignItems: 'stretch', gap: 40, height: '100%', width: '100%' },
  donutCol:  { flexShrink: 0, width: '36%', maxWidth: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  svg:       { width: '100%', height: '100%', display: 'block' },
  tableCol:  { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 },
  thead:     { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 },
  th:        { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' },
  divider:   { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
  row:       { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRadius: 4 },
  cell:      { display: 'flex', alignItems: 'center', gap: 10 },
  name:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)' },
  track:     { height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  rangeBand: { position: 'absolute', top: 0, bottom: 0, background: 'rgba(255,255,255,0.07)' },
  valNow:    { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.92rem', fontWeight: 800 },
  muted:     { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.32)', textAlign: 'right' },
  legend:    { display: 'flex', gap: 20, paddingTop: 8 },
  legendItem:{ display: 'flex', alignItems: 'center', gap: 6 },
  rangeSwatch: { width: 16, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 2 },
  targetSwatch:{ width: 2, height: 14, background: 'rgba(255,255,255,0.28)', borderRadius: 1 },
  compSwatch:  { width: 16, height: 8, background: 'rgba(78,213,150,0.42)', border: '1px solid rgba(78,213,150,0.65)', borderRadius: 2 },
  legendText:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' },
}
