import { useState, useEffect } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'
const CURRENCY_COLORS = {
  EUR: '#4ED596',
  USD: '#E01B41',
  GBP: '#5B8DEF',
  JPY: '#F5A623',
  CHF: '#A78BFA',
  Other: '#8A8A82',
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
  const cx = 160, cy = 160, r = 130, inner = 72
  let cum = -90

  function xy(angle) {
    const rad = angle * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function arc(start, end) {
    const safeEnd = end - start >= 360 ? start + 359.99 : end
    const sv = xy(start), ev = xy(safeEnd)
    const large = safeEnd - start > 180 ? 1 : 0
    return `M ${sv.x} ${sv.y} A ${r} ${r} 0 ${large} 1 ${ev.x} ${ev.y} L ${cx} ${cy} Z`
  }

  const slices = active.map(c => {
    const angle = (c.displayVal / donutTotal) * 360
    const sl = { ...c, startAngle: cum, endAngle: cum + angle }
    cum += angle
    return sl
  })

  const maxBar = Math.max(...active.map(c => c.displayVal), 20)

  // Dominant currency for center label
  const dominant = [...active].sort((a, b) => b.displayVal - a.displayVal)[0]

  // Hedged % — EUR is home currency, so hedged = EUR weight + any explicit hedge
  const hedgedPct = active.find(c => c.currency === 'EUR')?.displayVal ?? 0

  return (
    <div style={s.wrap}>

      {/* Donut */}
      <div style={s.donutCol}>
        <svg key={showComparison ? 'comp' : 'base'} viewBox="0 0 320 320" style={s.svg} preserveAspectRatio="xMidYMid meet">
          <circle cx={cx} cy={cy} r={r + 10}
            fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="18" />

          {slices.map(sl => (
            <path key={sl.currency}
              d={arc(sl.startAngle, sl.endAngle)}
              fill={CURRENCY_COLORS[sl.currency] || '#8A8A82'}
              opacity={showComparison ? 0.72 : 0.88}
              stroke="#0C182E" strokeWidth="2.5"
              style={{ transition: 'opacity 0.5s ease', cursor: 'pointer' }}
              onMouseEnter={e => showTooltip(e, { label: sl.currency, value: `${sl.displayVal}%`, color: CURRENCY_COLORS[sl.currency] || '#8A8A82', sub: sl.currency !== 'EUR' ? 'FX risk' : 'Home currency' })}
              onMouseLeave={hideTooltip}
            />
          ))}

          {showComparison && (
            <circle cx={cx} cy={cy} r={r + 2}
              fill="none" stroke="rgba(78,213,150,0.4)"
              strokeWidth="3" strokeDasharray="8 4" />
          )}

          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />

          <text x={cx} y={cy - 18} textAnchor="middle"
            fill="rgba(255,255,255,0.32)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="800" letterSpacing="2">
            {showComparison ? 'SCENARIO' : 'CURRENCY'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={showComparison ? '#4ED596' : (CURRENCY_COLORS[dominant?.currency] || 'white')}
            fontFamily="'Merriweather', serif" fontSize="22" fontWeight="700"
            style={{ transition: 'fill 0.5s ease' }}>
            {dominant?.currency || '—'}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle"
            fill="rgba(255,255,255,0.28)"
            fontFamily="'Merriweather Sans', sans-serif" fontSize="10">
            {dominant?.displayVal}% dominant
          </text>
        </svg>

        {/* FX risk indicator */}
        <div style={s.fxCard}>
          <div style={s.fxLabel}>FX EXPOSURE</div>
          <div style={s.fxValue}>{100 - hedgedPct}%</div>
          <div style={s.fxSub}>non-EUR</div>
        </div>
      </div>

      {/* Bars */}
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
          const color = CURRENCY_COLORS[cur.currency] || '#8A8A82'

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
                  width: 4, height: 24, borderRadius: 2,
                  background: color, flexShrink: 0,
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
                      borderRadius: 3, background: color, opacity: 0.18,
                      width: `${(cur.weight / maxBar) * 100}%`,
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', top: 4, bottom: 4, left: 0,
                    borderRadius: 3, opacity: 0.85,
                    width: `${(cur.displayVal / maxBar) * 100}%`,
                    background: hasChange
                      ? (delta < 0 ? '#4ED596' : '#E01B41')
                      : color,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
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
            <div style={{ width: 4, height: 14, borderRadius: 2, background: '#4ED596' }} />
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
  wrap: {
    display: 'flex', alignItems: 'stretch', gap: 40,
    height: '100%', width: '100%',
  },
  donutCol: {
    flexShrink: 0, width: '32%', maxWidth: 300,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', minHeight: 0, gap: 12,
  },
  svg: { width: '100%', height: '100%', display: 'block', flex: 1, minHeight: 0 },
  fxCard: {
    width: '100%', background: 'rgba(224,27,65,0.08)',
    border: '1px solid rgba(224,27,65,0.2)',
    borderRadius: 8, padding: '10px 16px', textAlign: 'center',
  },
  fxLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em',
    marginBottom: 2,
  },
  fxValue: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.6rem', fontWeight: 800, color: '#E01B41',
    lineHeight: 1,
  },
  fxSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
    marginTop: 2,
  },
  barsCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', minWidth: 0,
  },
  thead: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 6 },
  th: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.04)', borderRadius: 4,
  },
  cell: { display: 'flex', alignItems: 'center', gap: 8 },
  name: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.88)',
  },
  fxTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.54rem', fontWeight: 700,
    color: 'rgba(224,27,65,0.7)',
    background: 'rgba(224,27,65,0.08)',
    border: '1px solid rgba(224,27,65,0.18)',
    borderRadius: 3, padding: '1px 5px',
    letterSpacing: '0.04em',
  },
  track: {
    height: 24, background: 'rgba(255,255,255,0.05)',
    borderRadius: 4, position: 'relative', overflow: 'hidden',
  },
  val: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 800,
  },
  was: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
  },
  legend: { display: 'flex', gap: 16, paddingTop: 8, flexWrap: 'wrap' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  compSwatch: {
    width: 16, height: 8,
    background: 'rgba(78,213,150,0.42)',
    border: '1px solid rgba(78,213,150,0.65)', borderRadius: 2,
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)',
  },
}
