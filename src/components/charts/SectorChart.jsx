import { useState, useEffect } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'
export default function SectorChart({ portfolio, scenario, showComparison, lang }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])
  const sectors = portfolio.sectors || []

  // Resolve comparison overrides
  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.sectors) return null
    const found = scenario.comparison.sectors?.find(s => s.id === id)
    return found ? found.weight : null
  }

  const active = sectors.map(s => {
    const comp = getComp(s.id)
    return { ...s, compVal: comp, displayVal: comp !== null ? comp : s.weight }
  })

  const donutTotal = active.reduce((sum, s) => sum + s.displayVal, 0) || 100
  const cx = 160, cy = 160, r = 130, inner = 72
  let cum = -90

  function xy(angle) {
    const rad = angle * Math.PI / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }
  function arc(start, end) {
    // Prevent full-circle degenerate case
    const safeEnd = end - start >= 360 ? start + 359.99 : end
    const s = xy(start), e = xy(safeEnd)
    const large = safeEnd - start > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`
  }

  const slices = active.map(s => {
    const angle = (s.displayVal / donutTotal) * 360
    const sl = { ...s, startAngle: cum, endAngle: cum + angle }
    cum += angle
    return sl
  })

  const maxBar = Math.max(...active.map(s => s.displayVal), 25)

  // Top 5 for donut label
  const top5 = [...active].sort((a, b) => b.displayVal - a.displayVal).slice(0, 5)

  return (
    <div style={s.wrap}>

      {/* Donut */}
      <div style={s.donutCol}>
        <svg key={showComparison ? 'comp' : 'base'} viewBox="0 0 320 320" style={s.svg} preserveAspectRatio="xMidYMid meet">
          <circle cx={cx} cy={cy} r={r + 10}
            fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="18" />

          {slices.map(sl => (
            <path key={sl.id}
              d={arc(sl.startAngle, sl.endAngle)}
              fill={sl.color}
              opacity={showComparison ? 0.72 : 0.88}
              stroke="#0C182E" strokeWidth="2.5"
              style={{ transition: 'opacity 0.5s ease', cursor: 'pointer' }}
              onMouseEnter={e => showTooltip(e, { label: sl.label, value: `${sl.displayVal}%`, color: sl.color })}
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
            {showComparison ? 'SCENARIO' : 'SECTOR MIX'}
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle"
            fill={showComparison ? '#4ED596' : 'white'}
            fontFamily="'Merriweather', serif" fontSize="20" fontWeight="700"
            style={{ transition: 'fill 0.5s ease' }}>
            {active.length}
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle"
            fill="rgba(255,255,255,0.28)"
            fontFamily="'Merriweather Sans', sans-serif" fontSize="10">
            sectors
          </text>
        </svg>
      </div>

      {/* Bars */}
      <div style={s.barsCol}>
        <div style={s.thead}>
          <span style={{ ...s.th, flex: 2 }}>SECTOR</span>
          <span style={{ ...s.th, flex: 3 }}>WEIGHT</span>
          <span style={{ ...s.th, width: 52, textAlign: 'right' }}>%</span>
        </div>
        <div style={s.divider} />

        {active.map(sec => {
          const comp = sec.compVal
          const hasChange = comp !== null && comp !== sec.weight
          const delta = hasChange ? comp - sec.weight : 0

          return (
            <div key={sec.id} style={{
              ...s.row,
              background: hasChange
                ? delta < 0 ? 'rgba(78,213,150,0.05)' : 'rgba(224,27,65,0.05)'
                : 'transparent',
              transition: 'background 0.6s ease',
            }}
            onMouseEnter={e => showTooltip(e, { label: sec.label, value: `${sec.displayVal}%`, color: sec.color, delta: hasChange ? `${delta > 0 ? '+' : ''}${delta}% vs base` : null })}
            onMouseLeave={hideTooltip}>
              <div style={{ ...s.cell, flex: 2 }}>
                <div style={{
                  width: 4, height: 24, borderRadius: 2,
                  background: sec.color, flexShrink: 0,
                }} />
                <span style={s.name}>{sec.label}</span>
              </div>

              <div style={{ flex: 3 }}>
                <div style={s.track}>
                  {/* Ghost bar — base when comparing */}
                  {hasChange && (
                    <div style={{
                      position: 'absolute', top: 4, bottom: 4, left: 0,
                      borderRadius: 3,
                      background: sec.color, opacity: 0.18,
                      width: `${(sec.weight / maxBar) * 100}%`,
                    }} />
                  )}
                  {/* Active bar */}
                  <div style={{
                    position: 'absolute', top: 4, bottom: 4, left: 0,
                    borderRadius: 3, opacity: 0.85,
                    width: `${(sec.displayVal / maxBar) * 100}%`,
                    background: hasChange
                      ? (delta < 0 ? '#4ED596' : '#E01B41')
                      : sec.color,
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
                  {sec.displayVal}%
                </span>
                {hasChange && (
                  <span style={s.was}>was {sec.weight}%</span>
                )}
              </div>
            </div>
          )
        })}

        <div style={s.divider} />
        {showComparison && scenario?.comparison && (
          <div style={s.legend}>
            <div style={s.legendItem}>
              <div style={s.compSwatch} />
              <span style={s.legendText}>
                {scenario.comparison.label?.en || 'Alternative'}
              </span>
            </div>
          </div>
        )}
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
    display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0,
  },
  svg: { width: '100%', height: '100%', display: 'block' },
  barsCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', minWidth: 0, overflowY: 'auto',
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
    padding: '7px 6px',
    borderBottom: '1px solid rgba(255,255,255,0.04)', borderRadius: 4,
  },
  cell: { display: 'flex', alignItems: 'center', gap: 8 },
  name: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.88)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
    maxWidth: 130,
  },
  track: {
    height: 24, background: 'rgba(255,255,255,0.05)',
    borderRadius: 4, position: 'relative', overflow: 'hidden',
  },
  val: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem', fontWeight: 800,
  },
  was: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
  },
  legend: { display: 'flex', gap: 16, paddingTop: 8 },
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
