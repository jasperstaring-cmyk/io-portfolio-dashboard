import { useEffect, useState } from 'react'

const COLORS = {
  equities: '#E01B41',
  fixed_income: '#4ED596',
  real_estate: '#5B8DEF',
  alternatives: '#F5A623',
  cash: '#8A8A82',
}

export default function AssetClassChart({ portfolio, scenario, showComparison, lang }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 50)
    return () => clearTimeout(t)
  }, [showComparison])

  const allocations = portfolio.allocations

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.allocations) return null
    return scenario.comparison.allocations.find(a => a.id === id)?.current ?? null
  }

  // Build donut from active values (comp or base)
  const activeAllocs = allocations.map(a => {
    const comp = getComp(a.id)
    return { ...a, displayCurrent: comp !== null ? comp : a.current }
  })
  const total = activeAllocs.reduce((s, a) => s + a.displayCurrent, 0)

  const cx = 180, cy = 180, r = 148, inner = 82
  let cum = -90

  function xy(angle) {
    return { x: cx + r * Math.cos(angle * Math.PI / 180), y: cy + r * Math.sin(angle * Math.PI / 180) }
  }
  function arc(start, end) {
    const s = xy(start), e = xy(end)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`
  }

  const slices = activeAllocs.map(a => {
    const angle = (a.displayCurrent / total) * 360
    const sl = { ...a, startAngle: cum, endAngle: cum + angle }
    cum += angle
    return sl
  })

  const status = a => a.current < a.min || a.current > a.max ? '#E01B41'
    : Math.abs(a.current - a.target) > 5 ? '#F5A623' : '#4ED596'

  return (
    <div style={s.wrap}>
      {/* Donut — reflects active state */}
      <div style={s.donutCol}>
        <svg viewBox="0 0 360 360" style={s.svg}>
          <circle cx={cx} cy={cy} r={r + 10}
            fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="20" />
          {slices.map(sl => (
            <path key={sl.id} d={arc(sl.startAngle, sl.endAngle)}
              fill={COLORS[sl.id]} opacity={showComparison ? 0.7 : 0.88}
              stroke="#0C182E" strokeWidth="2.5"
              style={{ transition: 'd 0.7s ease' }} />
          ))}
          {/* Comparison ring — subtle outline when active */}
          {showComparison && (
            <circle cx={cx} cy={cy} r={r + 2}
              fill="none" stroke="rgba(78,213,150,0.35)" strokeWidth="3"
              strokeDasharray="8 4" />
          )}
          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x={cx} y={cy - 20} textAnchor="middle"
            fill="rgba(255,255,255,0.32)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="10" fontWeight="800" letterSpacing="2">
            {showComparison ? 'SCENARIO' : 'PORTFOLIO'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={showComparison ? '#4ED596' : 'white'}
            fontFamily="'Merriweather', serif"
            fontSize="24" fontWeight="700"
            style={{ transition: 'fill 0.4s ease' }}>
            {portfolio.profile}
          </text>
          <text x={cx} y={cy + 30} textAnchor="middle"
            fill="rgba(255,255,255,0.28)"
            fontFamily="'Merriweather Sans', sans-serif" fontSize="11">
            {portfolio.currency}
          </text>
        </svg>
      </div>

      {/* Table */}
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
          const comp = getComp(a.id)
          const label = a.label?.[lang] || a.label?.en
          const displayVal = comp !== null ? comp : a.current
          const delta = comp !== null ? comp - a.current : 0
          const max = 65
          const color = COLORS[a.id]
          const hasChange = comp !== null && delta !== 0

          return (
            <div key={a.id} style={{
              ...s.row,
              background: hasChange
                ? delta > 0
                  ? 'rgba(224,27,65,0.06)'
                  : 'rgba(78,213,150,0.06)'
                : 'transparent',
              borderRadius: hasChange ? 4 : 0,
              transition: 'background 0.5s ease',
            }}>
              <div style={{ ...s.cell, flex: 2 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={s.name}>{label}</span>
              </div>

              <div style={{ flex: 3 }}>
                <div style={s.track}>
                  <div style={{
                    ...s.rangeBand,
                    left: `${(a.min / max) * 100}%`,
                    width: `${((a.max - a.min) / max) * 100}%`,
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(a.target / max) * 100}%`,
                    width: 2, background: 'rgba(255,255,255,0.2)', zIndex: 2,
                  }} />
                  {/* Base bar (always shown faintly when comparing) */}
                  {comp !== null && (
                    <div style={{
                      position: 'absolute', top: 5, bottom: 5, left: 0,
                      borderRadius: 3, background: color, opacity: 0.22,
                      width: `${(a.current / max) * 100}%`,
                      zIndex: 2,
                    }} />
                  )}
                  {/* Active bar */}
                  <div style={{
                    position: 'absolute', top: 5, bottom: 5, left: 0,
                    borderRadius: 3, opacity: comp !== null ? 0.9 : 0.82,
                    width: animated ? `${(displayVal / max) * 100}%` : `${(a.current / max) * 100}%`,
                    background: comp !== null ? (delta < 0 ? '#4ED596' : '#E01B41') : color,
                    zIndex: 3,
                    transition: 'width 0.75s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
                  }} />
                </div>
              </div>

              {/* Value — shows comp value when active */}
              <div style={{ width: 64, textAlign: 'right' }}>
                <span style={{
                  ...s.valNow,
                  color: hasChange
                    ? delta < 0 ? '#4ED596' : '#E01B41'
                    : '#FFFFFF',
                  transition: 'color 0.4s ease',
                }}>
                  {displayVal}%
                </span>
                {hasChange && (
                  <span style={{
                    display: 'block',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.6rem', fontWeight: 700,
                    color: 'rgba(255,255,255,0.4)',
                  }}>
                    was {a.current}%
                  </span>
                )}
              </div>
              <span style={{ ...s.muted, width: 60 }}>{a.target}%</span>
              <span style={{ ...s.muted, width: 80, fontSize: '0.68rem' }}>{a.min}–{a.max}%</span>
              <div style={{ width: 36, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: status(a), boxShadow: `0 0 8px ${status(a)}88`,
                }} />
              </div>
            </div>
          )
        })}

        <div style={s.divider} />
        <div style={s.legend}>
          {[
            { el: <div style={s.rangeSwatch} />, label: 'Bandwidth' },
            { el: <div style={s.targetSwatch} />, label: 'Target' },
            ...(showComparison ? [{ el: <div style={s.compSwatch} />, label: 'Scenario value' }] : []),
          ].map(l => (
            <div key={l.label} style={s.legendItem}>
              {l.el}
              <span style={s.legendText}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', alignItems: 'center', gap: 40, height: '100%', width: '100%' },
  donutCol: { flexShrink: 0, width: '38%', maxWidth: 340, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svg: { width: '100%', height: '100%', maxHeight: 320 },
  tableCol: { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 0, height: '100%' },
  thead: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 8 },
  th: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' },
  divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
  row: { display: 'flex', alignItems: 'center', gap: 12, padding: '11px 6px', borderBottom: '1px solid rgba(255,255,255,0.04)' },
  cell: { display: 'flex', alignItems: 'center', gap: 10 },
  name: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 600, color: 'rgba(255,255,255,0.88)' },
  track: { height: 28, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  rangeBand: { position: 'absolute', top: 0, bottom: 0, background: 'rgba(255,255,255,0.07)' },
  valNow: { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.92rem', fontWeight: 800 },
  muted: { display: 'block', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.75rem', fontWeight: 400, color: 'rgba(255,255,255,0.32)', textAlign: 'right' },
  legend: { display: 'flex', gap: 20, paddingTop: 8 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  rangeSwatch: { width: 16, height: 8, background: 'rgba(255,255,255,0.12)', borderRadius: 2 },
  targetSwatch: { width: 2, height: 14, background: 'rgba(255,255,255,0.28)', borderRadius: 1 },
  compSwatch: { width: 16, height: 8, background: 'rgba(78,213,150,0.42)', border: '1px solid rgba(78,213,150,0.65)', borderRadius: 2 },
  legendText: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' },
}
