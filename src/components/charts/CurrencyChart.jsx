import { useState, useEffect } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'

// Categoriekleuren — neutraal, geen statusoordeel
// Groen (#4ED596) is GERESERVEERD voor compare/delta
const CURRENCY_COLORS = {
  EUR:   '#5B8DEF',  // blauw — thuisvaluta, grootste positie
  USD:   '#F5A623',  // amber — tweede positie
  GBP:   '#A78BFA',  // paars — derde positie
  JPY:   '#8A8A82',  // grijs — kleinere positie
  CHF:   'rgba(255,255,255,0.45)', // wit-transparant — kleinste
  Other: 'rgba(255,255,255,0.20)',
}

export default function CurrencyChart({ portfolio, scenario, showComparison, lang }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const currencies = portfolio.currencies || []

  function getComp(currency) {
    if (!showComparison || !scenario?.comparison?.currencies) return null
    const found = scenario.comparison.currencies?.find(c => c.currency === currency)
    return found ? found.weight : null
  }

  const active = currencies.map(c => {
    const comp = getComp(c.currency)
    return { ...c, compVal: comp, displayVal: comp !== null ? comp : c.weight }
  })

  const donutTotal = active.reduce((sum, c) => sum + c.displayVal, 0) || 100
  const maxBar = Math.max(...active.map(c => c.displayVal), 20)
  const dominant = [...active].sort((a, b) => b.displayVal - a.displayVal)[0]
  const hedgedPct = active.find(c => c.currency === 'EUR')?.displayVal ?? 0

  // Arc-donut — zelfde techniek als AssetClassChart
  const cx = 160, cy = 160, R = 118, STROKE = 28, inner = R - STROKE / 2 - 2
  const GAP_DEG = 1.4

  function arcParams(startDeg, endDeg) {
    const gapRad = (GAP_DEG / 2) * Math.PI / 180
    const startRad = (startDeg - 90) * Math.PI / 180 + gapRad
    const endRad   = (endDeg   - 90) * Math.PI / 180 - gapRad
    return {
      x1: cx + R * Math.cos(startRad), y1: cy + R * Math.sin(startRad),
      x2: cx + R * Math.cos(endRad),   y2: cy + R * Math.sin(endRad),
      large: (endDeg - startDeg - GAP_DEG) > 180 ? 1 : 0,
    }
  }

  let cum = 0
  const slices = active.map(c => {
    const deg = (c.displayVal / donutTotal) * 360
    const sl = { ...c, startDeg: cum, endDeg: cum + deg }
    cum += deg
    return sl
  })

  const dominantColor = CURRENCY_COLORS[dominant?.currency] || 'rgba(255,255,255,0.45)'

  return (
    <div style={s.wrap}>

      {/* ── Donut ─────────────────────────────────────────────────────── */}
      <div style={s.donutCol}>
        <svg
          key={showComparison ? 'comp' : 'base'}
          viewBox="0 0 320 320"
          style={{ ...s.svg, flex: 1, minHeight: 0,
            opacity: animated ? 1 : 0,
            transform: animated ? 'scale(1)' : 'scale(0.92)',
            transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
            transformOrigin: 'center',
          }}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <radialGradient id="cur-glow" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stopColor={CURRENCY_COLORS['EUR']} stopOpacity="0.07" />
              <stop offset="100%" stopColor={CURRENCY_COLORS['EUR']} stopOpacity="0" />
            </radialGradient>
            <radialGradient id="cur-glow-comp" cx="50%" cy="50%" r="50%">
              <stop offset="30%" stopColor="#4ED596" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Achtergrondgloed */}
          <circle cx={cx} cy={cy} r={R + 20}
            fill={showComparison ? 'url(#cur-glow-comp)' : 'url(#cur-glow)'}
            style={{ transition: 'fill 0.6s ease' }} />

          {/* Gidsring */}
          <circle cx={cx} cy={cy} r={R + STROKE / 2 + 6}
            fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />

          {/* Track */}
          <circle cx={cx} cy={cy} r={R}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} />

          {/* Arc-segmenten */}
          {slices.map(sl => {
            const { x1, y1, x2, y2, large } = arcParams(sl.startDeg, sl.endDeg)
            const color = CURRENCY_COLORS[sl.currency] || 'rgba(255,255,255,0.20)'
            return (
              <path key={sl.currency}
                d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
                fill="none" stroke={color} strokeWidth={STROKE} strokeLinecap="butt"
                opacity={showComparison ? 0.70 : 0.92}
                style={{ transition: 'opacity 0.5s ease', cursor: 'pointer' }}
                onMouseEnter={e => showTooltip(e, {
                  label: sl.currency,
                  value: `${sl.displayVal}%`,
                  color,
                  sub: sl.currency !== 'EUR' ? 'FX risk' : 'Home currency',
                })}
                onMouseLeave={hideTooltip}
              />
            )
          })}

          {/* Compare-ring */}
          {showComparison && (
            <circle cx={cx} cy={cy} r={R + STROKE / 2 + 2}
              fill="none" stroke="rgba(78,213,150,0.45)"
              strokeWidth="2" strokeDasharray="7 4" />
          )}

          {/* Centerveld */}
          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

          <text x={cx} y={cy - 20} textAnchor="middle"
            fill="rgba(255,255,255,0.30)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="800" letterSpacing="2">
            {showComparison ? 'SCENARIO' : 'CURRENCY'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={showComparison ? '#4ED596' : dominantColor}
            fontFamily="'Merriweather', serif" fontSize="22" fontWeight="700"
            style={{ transition: 'fill 0.5s ease' }}>
            {dominant?.currency || '—'}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle"
            fill="rgba(255,255,255,0.26)"
            fontFamily="'Merriweather Sans', sans-serif" fontSize="10">
            {dominant?.displayVal}% dominant
          </text>
        </svg>

        {/* FX-risico kaart */}
        <div style={s.fxCard}>
          <div style={s.fxLabel}>FX EXPOSURE</div>
          <div style={s.fxValue}>{100 - hedgedPct}%</div>
          <div style={s.fxSub}>non-EUR</div>
        </div>
      </div>

      {/* ── Bars ──────────────────────────────────────────────────────── */}
      <div style={s.barsCol}>
        <div style={s.thead}>
          <span style={{ ...s.th, flex: 2 }}>CURRENCY</span>
          <span style={{ ...s.th, flex: 3 }}>WEIGHT</span>
          <span style={{ ...s.th, width: 52, textAlign: 'right' }}>%</span>
        </div>
        <div style={s.divider} />

        {active.map(cur => {
          const comp = cur.compVal
          const hasChange = comp !== null && comp !== cur.weight
          const delta = hasChange ? comp - cur.weight : 0
          const color = CURRENCY_COLORS[cur.currency] || 'rgba(255,255,255,0.20)'

          return (
            <div key={cur.currency} style={{
              ...s.row,
              background: hasChange
                ? delta < 0 ? 'rgba(78,213,150,0.05)' : 'rgba(224,27,65,0.05)'
                : 'transparent',
              transition: 'background 0.6s ease',
            }}>
              <div style={{ ...s.cell, flex: 2 }}>
                <div style={{
                  width: 3, height: 24, borderRadius: 2,
                  background: color, flexShrink: 0,
                  boxShadow: `0 0 5px ${color}66`,
                }} />
                <span style={s.name}>{cur.currency}</span>
                {cur.currency !== 'EUR' && (
                  <span style={s.fxTag}>FX risk</span>
                )}
              </div>

              <div style={{ flex: 3 }}>
                <div style={s.track}>
                  {hasChange && (
                    <div style={{
                      position: 'absolute', top: 4, bottom: 4, left: 0,
                      borderRadius: 3, background: color, opacity: 0.16,
                      width: `${(cur.weight / maxBar) * 100}%`,
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', top: 4, bottom: 4, left: 0,
                    borderRadius: 3, opacity: 0.88,
                    width: `${(cur.displayVal / maxBar) * 100}%`,
                    background: hasChange
                      ? (delta < 0 ? '#4ED596' : '#E01B41')
                      : color,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                    boxShadow: hasChange
                      ? delta < 0
                        ? '0 0 8px rgba(78,213,150,0.35)'
                        : '0 0 8px rgba(224,27,65,0.35)'
                      : 'none',
                  }} />
                </div>
              </div>

              <div style={{ width: 52, textAlign: 'right' }}>
                <span style={{
                  ...s.val,
                  color: hasChange
                    ? (delta < 0 ? '#4ED596' : '#E01B41')
                    : 'rgba(255,255,255,0.88)',
                  transition: 'color 0.5s ease',
                }}>
                  {cur.displayVal}%
                </span>
                {hasChange && (
                  <span style={s.was}>was {cur.weight}%</span>
                )}
              </div>
            </div>
          )
        })}

        <div style={s.divider} />
        <div style={s.legend}>
          <div style={s.legendItem}>
            <div style={{ width: 3, height: 14, borderRadius: 2, background: CURRENCY_COLORS['EUR'] }} />
            <span style={s.legendText}>EUR — home currency (no FX risk)</span>
          </div>
          {showComparison && scenario?.comparison && (
            <div style={s.legendItem}>
              <div style={s.compSwatch} />
              <span style={s.legendText}>
                {scenario.comparison.label?.en || 'Alternative'}
              </span>
            </div>
          )}
        </div>
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

const s = {
  wrap:     { display: 'flex', alignItems: 'stretch', gap: 40, height: '100%', width: '100%' },
  donutCol: { flexShrink: 0, width: '32%', maxWidth: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 0, gap: 12 },
  svg:      { width: '100%', display: 'block' },
  fxCard:   { width: '100%', background: 'rgba(224,27,65,0.07)', border: '1px solid rgba(224,27,65,0.18)', borderRadius: 8, padding: '10px 16px', textAlign: 'center' },
  fxLabel:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 2 },
  fxValue:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '1.6rem', fontWeight: 800, color: '#E01B41', lineHeight: 1 },
  fxSub:    { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.32)', marginTop: 2 },
  barsCol:  { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 },
  thead:    { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 6 },
  th:       { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' },
  divider:  { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
  row:      { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)', borderRadius: 4 },
  cell:     { display: 'flex', alignItems: 'center', gap: 8 },
  name:     { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)' },
  fxTag:    { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.54rem', fontWeight: 700, color: 'rgba(224,27,65,0.7)', background: 'rgba(224,27,65,0.08)', border: '1px solid rgba(224,27,65,0.16)', borderRadius: 3, padding: '1px 5px', letterSpacing: '0.04em' },
  track:    { height: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  val:      { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 800 },
  was:      { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 600, color: 'rgba(255,255,255,0.32)' },
  legend:   { display: 'flex', gap: 16, paddingTop: 8, flexWrap: 'wrap' },
  legendItem:{ display: 'flex', alignItems: 'center', gap: 6 },
  compSwatch:{ width: 16, height: 8, background: 'rgba(78,213,150,0.42)', border: '1px solid rgba(78,213,150,0.65)', borderRadius: 2 },
  legendText:{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.30)' },
}
