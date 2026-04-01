const COLORS = {
  equities: '#E01B41',
  fixed_income: '#4ED596',
  real_estate: '#5B8DEF',
  alternatives: '#F5A623',
  cash: '#8A8A82',
}

export default function AssetClassChart({ portfolio, scenario, showComparison, lang }) {
  const allocations = portfolio.allocations

  function getComparisonCurrent(id) {
    if (!showComparison || !scenario?.comparison?.allocations) return null
    const found = scenario.comparison.allocations.find(a => a.id === id)
    return found ? found.current : null
  }

  const total = allocations.reduce((s, a) => s + a.current, 0)
  const cx = 160, cy = 160, r = 130, innerR = 72
  let cumAngle = -90

  function polarToXY(cx, cy, r, angleDeg) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToXY(cx, cy, r, startAngle)
    const end = polarToXY(cx, cy, r, endAngle)
    const largeArc = endAngle - startAngle > 180 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} L ${cx} ${cy} Z`
  }

  const slices = allocations.map(a => {
    const angle = (a.current / total) * 360
    const slice = { ...a, startAngle: cumAngle, endAngle: cumAngle + angle }
    cumAngle += angle
    return slice
  })

  const statusColor = (a) => {
    if (a.current < a.min || a.current > a.max) return '#E01B41'
    if (Math.abs(a.current - a.target) > 5) return '#F5A623'
    return '#4ED596'
  }

  return (
    <div style={styles.container}>
      <div style={styles.chartWrap}>
        <svg width="320" height="320" viewBox="0 0 320 320">
          <circle cx={cx} cy={cy} r={r + 8}
            fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="16" />
          {slices.map(s => (
            <path key={s.id}
              d={describeArc(cx, cy, r, s.startAngle, s.endAngle)}
              fill={COLORS[s.id] || '#8A8A82'}
              opacity={0.88}
              stroke="#0C182E" strokeWidth="2.5" />
          ))}
          <circle cx={cx} cy={cy} r={innerR} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={innerR - 1}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <text x={cx} y={cy - 18} textAnchor="middle"
            fill="rgba(255,255,255,0.4)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="700" letterSpacing="0.1em">PORTFOLIO</text>
          <text x={cx} y={cy + 8} textAnchor="middle"
            fill="white" fontFamily="'Merriweather', serif"
            fontSize="20" fontWeight="700">{portfolio.profile}</text>
          <text x={cx} y={cy + 26} textAnchor="middle"
            fill="rgba(255,255,255,0.35)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="400">{portfolio.currency}</text>
        </svg>
      </div>

      <div style={styles.tableWrap}>
        <div style={styles.tableHeader}>
          <span style={{ ...styles.col, flex: 2 }}>ASSET CLASS</span>
          <span style={{ ...styles.col, flex: 3 }}>ALLOCATION</span>
          <span style={{ ...styles.col, width: 56, textAlign: 'right' }}>NOW</span>
          <span style={{ ...styles.col, width: 56, textAlign: 'right' }}>TARGET</span>
          <span style={{ ...styles.col, width: 80, textAlign: 'right' }}>RANGE</span>
          <span style={{ ...styles.col, width: 40, textAlign: 'center' }}>STATUS</span>
        </div>
        <div style={styles.dividerLine} />

        {allocations.map(a => {
          const compVal = getComparisonCurrent(a.id)
          const label = a.label?.[lang] || a.label?.en
          const maxBar = 65
          const color = COLORS[a.id] || '#8A8A82'

          return (
            <div key={a.id} style={styles.row}>
              <div style={{ ...styles.cellLabel, flex: 2 }}>
                <div style={{ ...styles.colorBar, background: color }} />
                <span style={styles.assetName}>{label}</span>
              </div>
              <div style={{ flex: 3, position: 'relative' }}>
                <div style={styles.track}>
                  <div style={{
                    ...styles.rangeBand,
                    left: `${(a.min / maxBar) * 100}%`,
                    width: `${((a.max - a.min) / maxBar) * 100}%`,
                  }} />
                  <div style={{
                    ...styles.targetTick,
                    left: `${(a.target / maxBar) * 100}%`,
                  }} />
                  {compVal && (
                    <div style={{
                      ...styles.compBar,
                      width: `${(compVal / maxBar) * 100}%`,
                    }} />
                  )}
                  <div style={{
                    ...styles.currentBar,
                    width: `${(a.current / maxBar) * 100}%`,
                    background: color,
                  }} />
                </div>
              </div>
              <div style={{ width: 56, textAlign: 'right' }}>
                <span style={styles.valCurrent}>{a.current}%</span>
                {compVal && compVal !== a.current && (
                  <span style={{
                    ...styles.valDelta,
                    color: compVal < a.current ? '#4ED596' : '#E01B41',
                  }}>
                    {compVal > a.current ? '+' : ''}{compVal - a.current}
                  </span>
                )}
              </div>
              <span style={{ ...styles.valMuted, width: 56, textAlign: 'right' }}>{a.target}%</span>
              <span style={{ ...styles.valMuted, width: 80, textAlign: 'right', fontSize: '0.68rem' }}>
                {a.min}–{a.max}%
              </span>
              <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 11, height: 11, borderRadius: '50%',
                  background: statusColor(a),
                  boxShadow: `0 0 8px ${statusColor(a)}88`,
                }} />
              </div>
            </div>
          )
        })}

        <div style={styles.dividerLine} />
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={styles.legendRangeSwatch} />
            <span style={styles.legendText}>Bandwidth</span>
          </div>
          <div style={styles.legendItem}>
            <div style={styles.legendTargetSwatch} />
            <span style={styles.legendText}>Target</span>
          </div>
          {showComparison && scenario?.comparison && (
            <div style={styles.legendItem}>
              <div style={styles.legendCompSwatch} />
              <span style={styles.legendText}>
                {scenario.comparison.label?.[lang] || scenario.comparison.label?.en}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    height: '100%',
    width: '100%',
  },
  chartWrap: { flexShrink: 0 },
  tableWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    justifyContent: 'center',
    gap: 0,
  },
  tableHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '8px',
  },
  col: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
  },
  dividerLine: {
    height: '1px',
    background: 'rgba(255,255,255,0.07)',
    margin: '4px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '11px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  cellLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  colorBar: {
    width: '3px',
    height: '24px',
    borderRadius: '2px',
    flexShrink: 0,
    opacity: 0.85,
  },
  assetName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.88)',
  },
  track: {
    height: '26px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  rangeBand: {
    position: 'absolute',
    top: 0, bottom: 0,
    background: 'rgba(255,255,255,0.07)',
  },
  targetTick: {
    position: 'absolute',
    top: 0, bottom: 0,
    width: '2px',
    background: 'rgba(255,255,255,0.25)',
    zIndex: 2,
  },
  currentBar: {
    position: 'absolute',
    top: '4px', bottom: '4px', left: 0,
    borderRadius: '3px',
    opacity: 0.82,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 3,
  },
  compBar: {
    position: 'absolute',
    top: '4px', bottom: '4px', left: 0,
    borderRadius: '3px',
    background: 'rgba(78,213,150,0.45)',
    border: '1.5px solid rgba(78,213,150,0.7)',
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 2,
  },
  valCurrent: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.9rem',
    fontWeight: 800,
    color: '#FFFFFF',
  },
  valDelta: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    fontWeight: 700,
  },
  valMuted: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    paddingTop: '8px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendRangeSwatch: {
    width: '16px', height: '8px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '2px',
  },
  legendTargetSwatch: {
    width: '2px', height: '12px',
    background: 'rgba(255,255,255,0.3)',
    borderRadius: '1px',
  },
  legendCompSwatch: {
    width: '16px', height: '8px',
    background: 'rgba(78,213,150,0.45)',
    border: '1px solid rgba(78,213,150,0.7)',
    borderRadius: '2px',
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.35)',
  },
}
