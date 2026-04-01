const COLORS = {
  equities: '#E01B41',
  fixed_income: '#4ED596',
  real_estate: '#5B8DEF',
  alternatives: '#F5A623',
  cash: '#8A8A82',
}

export default function AssetClassChart({ portfolio, scenario, showComparison, lang }) {
  const allocations = portfolio.allocations

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.allocations) return null
    return scenario.comparison.allocations.find(a => a.id === id)?.current ?? null
  }

  const total = allocations.reduce((s, a) => s + a.current, 0)
  const cx = 180, cy = 180, r = 148, inner = 82
  let cum = -90

  function xy(angle, radius = r) {
    return {
      x: cx + radius * Math.cos(angle * Math.PI / 180),
      y: cy + radius * Math.sin(angle * Math.PI / 180),
    }
  }

  function arc(start, end) {
    const s = xy(start), e = xy(end)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`
  }

  const slices = allocations.map(a => {
    const angle = (a.current / total) * 360
    const s = { ...a, startAngle: cum, endAngle: cum + angle }
    cum += angle
    return s
  })

  const status = a => a.current < a.min || a.current > a.max ? '#E01B41'
    : Math.abs(a.current - a.target) > 5 ? '#F5A623' : '#4ED596'

  return (
    <div style={styles.wrap}>
      {/* Donut — responsive via viewBox */}
      <div style={styles.donutCol}>
        <svg viewBox="0 0 360 360" style={styles.donutSvg}>
          <circle cx={cx} cy={cy} r={r + 10}
            fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="20" />
          {slices.map(s => (
            <path key={s.id} d={arc(s.startAngle, s.endAngle)}
              fill={COLORS[s.id]} opacity={0.88}
              stroke="#0C182E" strokeWidth="2.5" />
          ))}
          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x={cx} y={cy - 20} textAnchor="middle"
            fill="rgba(255,255,255,0.38)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="11" fontWeight="800" letterSpacing="2">PORTFOLIO</text>
          <text x={cx} y={cy + 12} textAnchor="middle"
            fill="white" fontFamily="'Merriweather', serif"
            fontSize="26" fontWeight="700">{portfolio.profile}</text>
          <text x={cx} y={cy + 32} textAnchor="middle"
            fill="rgba(255,255,255,0.32)"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="11">{portfolio.currency}</text>
        </svg>
      </div>

      {/* Table — takes remaining space, vertically centred */}
      <div style={styles.tableCol}>
        <div style={styles.thead}>
          <span style={{ ...styles.th, flex: 2 }}>ASSET CLASS</span>
          <span style={{ ...styles.th, flex: 3 }}>ALLOCATION</span>
          <span style={{ ...styles.th, width: 60, textAlign: 'right' }}>NOW</span>
          <span style={{ ...styles.th, width: 60, textAlign: 'right' }}>TARGET</span>
          <span style={{ ...styles.th, width: 82, textAlign: 'right' }}>RANGE</span>
          <span style={{ ...styles.th, width: 36, textAlign: 'center' }}>●</span>
        </div>
        <div style={styles.divider} />

        {allocations.map(a => {
          const comp = getComp(a.id)
          const label = a.label?.[lang] || a.label?.en
          const max = 65
          const color = COLORS[a.id]

          return (
            <div key={a.id} style={styles.row}>
              <div style={{ ...styles.labelCell, flex: 2 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: color, flexShrink: 0 }} />
                <span style={styles.assetName}>{label}</span>
              </div>

              <div style={{ flex: 3 }}>
                <div style={styles.track}>
                  <div style={{
                    ...styles.rangeBand,
                    left: `${(a.min / max) * 100}%`,
                    width: `${((a.max - a.min) / max) * 100}%`,
                  }} />
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `${(a.target / max) * 100}%`,
                    width: 2,
                    background: 'rgba(255,255,255,0.22)',
                    zIndex: 2,
                  }} />
                  {comp !== null && (
                    <div style={{
                      ...styles.compBar,
                      width: `${(comp / max) * 100}%`,
                    }} />
                  )}
                  <div style={{
                    ...styles.bar,
                    width: `${(a.current / max) * 100}%`,
                    background: color,
                  }} />
                </div>
              </div>

              <div style={{ width: 60, textAlign: 'right' }}>
                <span style={styles.valNow}>{a.current}%</span>
                {comp !== null && comp !== a.current && (
                  <span style={{
                    display: 'block',
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.62rem', fontWeight: 700,
                    color: comp < a.current ? '#4ED596' : '#E01B41',
                  }}>
                    {comp > a.current ? '+' : ''}{comp - a.current}
                  </span>
                )}
              </div>
              <span style={{ ...styles.valMuted, width: 60 }}>{a.target}%</span>
              <span style={{ ...styles.valMuted, width: 82, fontSize: '0.7rem' }}>{a.min}–{a.max}%</span>
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

        <div style={styles.divider} />
        <div style={styles.legend}>
          {[
            { swatch: styles.rangeSwatch, label: 'Bandwidth' },
            { swatch: styles.targetSwatch, label: 'Target' },
            ...(showComparison && scenario?.comparison ? [{
              swatch: styles.compSwatch,
              label: scenario.comparison.label?.[lang] || scenario.comparison.label?.en,
            }] : []),
          ].map(l => (
            <div key={l.label} style={styles.legendItem}>
              <div style={l.swatch} />
              <span style={styles.legendText}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '40px',
    height: '100%',
    width: '100%',
  },
  donutCol: {
    flexShrink: 0,
    width: '38%',
    maxWidth: '340px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  donutSvg: {
    width: '100%',
    height: '100%',
    maxHeight: '320px',
  },
  tableCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 0,
    height: '100%',
  },
  thead: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    paddingBottom: '8px',
  },
  th: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '4px 0',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  labelCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  assetName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.88)',
  },
  track: {
    height: '28px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  rangeBand: {
    position: 'absolute', top: 0, bottom: 0,
    background: 'rgba(255,255,255,0.07)',
  },
  bar: {
    position: 'absolute',
    top: 5, bottom: 5, left: 0,
    borderRadius: 3, opacity: 0.82,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 3,
  },
  compBar: {
    position: 'absolute',
    top: 5, bottom: 5, left: 0,
    borderRadius: 3,
    background: 'rgba(78,213,150,0.42)',
    border: '1.5px solid rgba(78,213,150,0.65)',
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 2,
  },
  valNow: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.92rem', fontWeight: 800,
    color: '#FFFFFF',
  },
  valMuted: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', fontWeight: 400,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'right',
  },
  legend: {
    display: 'flex',
    gap: '20px',
    paddingTop: '8px',
  },
  legendItem: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  rangeSwatch: {
    width: 16, height: 8,
    background: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
  },
  targetSwatch: {
    width: 2, height: 14,
    background: 'rgba(255,255,255,0.28)',
    borderRadius: 1,
  },
  compSwatch: {
    width: 16, height: 8,
    background: 'rgba(78,213,150,0.42)',
    border: '1px solid rgba(78,213,150,0.65)',
    borderRadius: 2,
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.32)',
  },
}
