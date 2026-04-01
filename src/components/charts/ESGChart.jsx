export default function ESGChart({ portfolio, scenario, showComparison }) {
  const esg = portfolio.esg
  const compEsg = showComparison && scenario?.comparison?.esg
  const activeEsg = compEsg || esg

  const scorePercent = (activeEsg.score / esg.maxScore) * 100
  const basePercent = (esg.score / esg.maxScore) * 100

  // Large gauge
  const r = 110, cx = 160, cy = 155
  const startAngle = 210, endAngle = 330
  const totalAng = endAngle - startAngle

  function polarXY(angle) {
    const rad = (angle * Math.PI) / 180
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
  }

  function arcPath(start, end, radius = r) {
    const s = polarXY(start, radius), e = polarXY(end, radius)
    // Recalculate with given radius
    const sR = {
      x: cx + radius * Math.cos(start * Math.PI / 180),
      y: cy + radius * Math.sin(start * Math.PI / 180),
    }
    const eR = {
      x: cx + radius * Math.cos(end * Math.PI / 180),
      y: cy + radius * Math.sin(end * Math.PI / 180),
    }
    const large = end - start > 180 ? 1 : 0
    return `M ${sR.x} ${sR.y} A ${radius} ${radius} 0 ${large} 1 ${eR.x} ${eR.y}`
  }

  const scoreAngle = startAngle + (scorePercent / 100) * totalAng
  const baseAngle = startAngle + (basePercent / 100) * totalAng

  // Score color based on value
  const scoreColor = activeEsg.score >= 7 ? '#4ED596'
    : activeEsg.score >= 5 ? '#F5A623' : '#E01B41'

  const sfdr = activeEsg.sfdr || esg.sfdr
  const sfdrColors = {
    'Article 9': '#4ED596',
    'Article 8': '#5B8DEF',
    'Article 6': '#8A8A82',
  }

  return (
    <div style={styles.container}>
      {/* Left: Gauge + metrics */}
      <div style={styles.gaugeSection}>
        <div style={styles.sectionTitle}>ESG SCORE</div>
        <svg width="320" height="220" viewBox="0 0 320 220">
          {/* Background track */}
          <path d={arcPath(startAngle, endAngle)}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="18" strokeLinecap="round" />

          {/* Zone coloring: red → amber → green */}
          <path d={arcPath(startAngle, startAngle + totalAng * 0.4)}
            fill="none" stroke="rgba(224,27,65,0.2)" strokeWidth="18" strokeLinecap="round" />
          <path d={arcPath(startAngle + totalAng * 0.4, startAngle + totalAng * 0.7)}
            fill="none" stroke="rgba(245,166,35,0.2)" strokeWidth="18" strokeLinecap="round" />
          <path d={arcPath(startAngle + totalAng * 0.7, endAngle)}
            fill="none" stroke="rgba(78,213,150,0.2)" strokeWidth="18" strokeLinecap="round" />

          {/* Base score arc (if comparing) */}
          {compEsg && (
            <path d={arcPath(startAngle, baseAngle)}
              fill="none" stroke="rgba(255,255,255,0.15)"
              strokeWidth="10" strokeLinecap="round" strokeDasharray="4 3" />
          )}

          {/* Active score arc */}
          <path d={arcPath(startAngle, scoreAngle)}
            fill="none" stroke={scoreColor}
            strokeWidth="18" strokeLinecap="round" />

          {/* Score needle dot */}
          <circle
            cx={cx + r * Math.cos(scoreAngle * Math.PI / 180)}
            cy={cy + r * Math.sin(scoreAngle * Math.PI / 180)}
            r="10" fill={scoreColor} stroke="#0C182E" strokeWidth="3" />

          {/* Center score */}
          <text x={cx} y={cy - 24} textAnchor="middle"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="9" fontWeight="800" fill="rgba(255,255,255,0.35)"
            letterSpacing="0.1em">ESG SCORE</text>
          <text x={cx} y={cy + 16} textAnchor="middle"
            fontFamily="'Merriweather', serif"
            fontSize="52" fontWeight="700" fill={scoreColor}>
            {activeEsg.score.toFixed(1)}
          </text>
          <text x={cx} y={cy + 36} textAnchor="middle"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="10" fontWeight="400" fill="rgba(255,255,255,0.3)">
            out of {esg.maxScore}
          </text>

          {/* Scale ticks */}
          {[0, 2, 4, 6, 8, 10].map(val => {
            const angle = startAngle + (val / esg.maxScore) * totalAng
            const inner = r - 14, outer = r + 14
            const x1 = cx + inner * Math.cos(angle * Math.PI / 180)
            const y1 = cy + inner * Math.sin(angle * Math.PI / 180)
            const x2 = cx + outer * Math.cos(angle * Math.PI / 180)
            const y2 = cy + outer * Math.sin(angle * Math.PI / 180)
            const tx = cx + (r + 26) * Math.cos(angle * Math.PI / 180)
            const ty = cy + (r + 26) * Math.sin(angle * Math.PI / 180)
            return (
              <g key={val}>
                <line x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x={tx} y={ty + 3} textAnchor="middle"
                  fontFamily="'Merriweather Sans'" fontSize="8"
                  fill="rgba(255,255,255,0.25)">{val}</text>
              </g>
            )
          })}
        </svg>

        {/* Metrics below gauge */}
        <div style={styles.metricsRow}>
          <div style={styles.metricCard}>
            <span style={styles.metricLabel}>Carbon Risk</span>
            <span style={{
              ...styles.metricVal,
              color: esg.carbonRisk < 15 ? '#4ED596' : '#F5A623',
            }}>
              {esg.carbonRisk}
            </span>
            <span style={styles.metricSub}>lower = better</span>
          </div>
          {compEsg && (
            <div style={styles.compareNote}>
              <span style={styles.compareLabel}>Base score</span>
              <span style={styles.compareVal}>{esg.score.toFixed(1)}</span>
              <span style={{
                ...styles.compareDelta,
                color: compEsg.score > esg.score ? '#4ED596' : '#E01B41',
              }}>
                {compEsg.score > esg.score ? '↑ +' : '↓ '}
                {Math.abs(compEsg.score - esg.score).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: SFDR breakdown */}
      <div style={styles.sfdrSection}>
        <div style={styles.sectionTitle}>SFDR CLASSIFICATION</div>

        {/* Visual donut for SFDR */}
        <div style={styles.sfdrVisual}>
          {sfdr.map((s, i) => {
            const color = sfdrColors[s.article] || '#8A8A82'
            return (
              <div key={s.article} style={styles.sfdrBlock}>
                <div style={styles.sfdrBarRow}>
                  <div style={styles.sfdrLabelGroup}>
                    <div style={{ ...styles.sfdrDot, background: color }} />
                    <span style={styles.sfdrName}>{s.article}</span>
                  </div>
                  <div style={styles.sfdrTrackOuter}>
                    <div style={{
                      ...styles.sfdrBar,
                      width: `${s.weight}%`,
                      background: color,
                    }} />
                  </div>
                  <span style={{ ...styles.sfdrPct, color }}>{s.weight}%</span>
                </div>
                <div style={styles.sfdrDesc}>
                  {s.article === 'Article 9' && 'Sustainable investment objective'}
                  {s.article === 'Article 8' && 'Promotes environmental/social characteristics'}
                  {s.article === 'Article 6' && 'No specific sustainability objective'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stacked bar summary */}
        <div style={styles.stackedBarWrap}>
          <div style={styles.stackedBarLabel}>PORTFOLIO DISTRIBUTION</div>
          <div style={styles.stackedBar}>
            {sfdr.map(s => (
              <div key={s.article} style={{
                width: `${s.weight}%`,
                height: '100%',
                background: sfdrColors[s.article] || '#8A8A82',
                opacity: 0.8,
                transition: 'width 0.7s ease',
              }} />
            ))}
          </div>
          <div style={styles.stackedLegend}>
            {sfdr.map(s => (
              <span key={s.article} style={{
                ...styles.stackedLegendItem,
                color: sfdrColors[s.article],
              }}>
                {s.article.replace('Article ', 'Art.')} {s.weight}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    gap: '40px',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
  gaugeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0',
    flexShrink: 0,
    width: '320px',
  },
  sfdrSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
    alignSelf: 'flex-start',
  },
  metricsRow: {
    display: 'flex',
    gap: '12px',
    width: '100%',
    justifyContent: 'center',
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '12px 20px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
  },
  metricLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.4)',
  },
  metricVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.6rem',
    fontWeight: 700,
  },
  metricSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    color: 'rgba(255,255,255,0.25)',
  },
  compareNote: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    padding: '12px 20px',
    background: 'rgba(78,213,150,0.06)',
    border: '1px solid rgba(78,213,150,0.2)',
    borderRadius: '8px',
  },
  compareLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.4)',
  },
  compareVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.2rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.5)',
  },
  compareDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 800,
  },
  sfdrVisual: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sfdrBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  sfdrBarRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  sfdrLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '110px',
    flexShrink: 0,
  },
  sfdrDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
    flexShrink: 0,
  },
  sfdrName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.85)',
  },
  sfdrTrackOuter: {
    flex: 1,
    height: '28px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  sfdrBar: {
    height: '100%',
    borderRadius: '4px',
    opacity: 0.78,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
  },
  sfdrPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
    width: '48px',
    textAlign: 'right',
  },
  sfdrDesc: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.3)',
    paddingLeft: '118px',
  },
  stackedBarWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginTop: '8px',
  },
  stackedBarLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.1em',
  },
  stackedBar: {
    height: '10px',
    display: 'flex',
    borderRadius: '5px',
    overflow: 'hidden',
    gap: '1px',
  },
  stackedLegend: {
    display: 'flex',
    gap: '16px',
  },
  stackedLegendItem: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem',
    fontWeight: 700,
  },
}
