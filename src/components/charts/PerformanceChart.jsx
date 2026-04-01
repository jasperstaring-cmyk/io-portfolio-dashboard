export default function PerformanceChart({ portfolio }) {
  const p = portfolio.performance

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const portfolioLine = [100,102.1,101.4,103.8,105.2,103.9,106.1,107.4,105.8,107.2,108.9,104.2 + p.ytd * 0.3]
  const benchmarkLine = [100,101.2,100.8,102.4,103.6,102.1,104.3,105.1,103.9,104.8,106.2,103.5 + p.benchmark * 0.3]

  const allVals = [...portfolioLine, ...benchmarkLine]
  const minVal = Math.min(...allVals) - 0.8
  const maxVal = Math.max(...allVals) + 0.8
  const range = maxVal - minVal

  const w = 560, h = 200
  const padL = 48, padR = 24, padT = 16, padB = 36

  function toX(i) {
    return padL + (i / (months.length - 1)) * (w - padL - padR)
  }
  function toY(val) {
    return padT + (1 - (val - minVal) / range) * (h - padT - padB)
  }

  function buildPath(data) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(v)}`).join(' ')
  }

  function buildArea(data) {
    const line = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ')
    return `${toX(0)},${h - padB} ${line} ${toX(months.length - 1)},${h - padB}`
  }

  const metrics = [
    { label: 'YTD Return', value: `+${p.ytd}%`, color: '#4ED596', positive: true },
    { label: '1Y Return', value: `+${p.oneYear}%`, color: '#4ED596', positive: true },
    { label: '3Y Ann.', value: `+${p.threeYear}%`, color: '#4ED596', positive: true },
    { label: 'vs Benchmark', value: `+${(p.ytd - p.benchmark).toFixed(1)}%`, color: '#4ED596', positive: true },
    { label: 'Volatility', value: `${p.volatility}%`, color: 'rgba(255,255,255,0.65)', positive: null },
    { label: 'Max Drawdown', value: `${p.maxDrawdown}%`, color: '#E01B41', positive: false },
  ]

  return (
    <div style={styles.container}>
      {/* Chart */}
      <div style={styles.chartSection}>
        <div style={styles.sectionTitle}>PORTFOLIO PERFORMANCE — YTD (INDEXED TO 100)</div>

        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ED596" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="benchGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" stopOpacity="1" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Y-axis grid + labels */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const y = padT + t * (h - padT - padB)
            const val = (maxVal - t * range).toFixed(1)
            return (
              <g key={t}>
                <line x1={padL} y1={y} x2={w - padR} y2={y}
                  stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x={padL - 6} y={y + 4} textAnchor="end"
                  fontFamily="'Merriweather Sans'" fontSize="8"
                  fill="rgba(255,255,255,0.22)">{val}</text>
              </g>
            )
          })}

          {/* X-axis month labels */}
          {months.map((m, i) => (
            <text key={m} x={toX(i)} y={h - 8} textAnchor="middle"
              fontFamily="'Merriweather Sans'" fontSize="8"
              fill="rgba(255,255,255,0.25)">{m}</text>
          ))}

          {/* Baseline at 100 */}
          <line x1={padL} y1={toY(100)} x2={w - padR} y2={toY(100)}
            stroke="rgba(255,255,255,0.12)" strokeWidth="1" strokeDasharray="4 3" />

          {/* Benchmark area fill */}
          <polygon points={buildArea(benchmarkLine)}
            fill="url(#benchGrad)" opacity="0.5" />

          {/* Portfolio area fill */}
          <polygon points={buildArea(portfolioLine)}
            fill="url(#perfGrad)" />

          {/* Benchmark line */}
          <path d={buildPath(benchmarkLine)}
            fill="none" stroke="rgba(255,255,255,0.22)"
            strokeWidth="1.5" strokeDasharray="5 3" strokeLinecap="round" />

          {/* Portfolio line */}
          <path d={buildPath(portfolioLine)}
            fill="none" stroke="#4ED596"
            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* End dots */}
          <circle
            cx={toX(months.length - 1)}
            cy={toY(portfolioLine[portfolioLine.length - 1])}
            r="5" fill="#4ED596" stroke="#0C182E" strokeWidth="2" />
          <circle
            cx={toX(months.length - 1)}
            cy={toY(benchmarkLine[benchmarkLine.length - 1])}
            r="3.5" fill="rgba(255,255,255,0.3)" stroke="#0C182E" strokeWidth="1.5" />

          {/* YTD label at end of portfolio line */}
          <text
            x={toX(months.length - 1) + 8}
            y={toY(portfolioLine[portfolioLine.length - 1]) + 4}
            fontFamily="'Merriweather Sans'" fontSize="9" fontWeight="800"
            fill="#4ED596">
            +{p.ytd}%
          </text>
        </svg>

        {/* Legend */}
        <div style={styles.legend}>
          <div style={styles.legendItem}>
            <div style={{ ...styles.legendLine, background: '#4ED596' }} />
            <span style={styles.legendText}>Portfolio</span>
          </div>
          <div style={styles.legendItem}>
            <div style={{
              ...styles.legendLine,
              background: 'rgba(255,255,255,0.25)',
              backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0, rgba(255,255,255,0.25) 5px, transparent 5px, transparent 8px)',
            }} />
            <span style={styles.legendText}>Benchmark</span>
          </div>
        </div>
      </div>

      {/* Metrics grid */}
      <div style={styles.metricsSection}>
        <div style={styles.sectionTitle}>KEY METRICS</div>
        <div style={styles.metricsGrid}>
          {metrics.map(m => (
            <div key={m.label} style={{
              ...styles.metricCard,
              borderColor: m.positive === true
                ? 'rgba(78,213,150,0.15)'
                : m.positive === false
                  ? 'rgba(224,27,65,0.15)'
                  : 'rgba(255,255,255,0.08)',
            }}>
              <span style={styles.metricLabel}>{m.label}</span>
              <span style={{ ...styles.metricVal, color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    gap: '36px',
    height: '100%',
    width: '100%',
    alignItems: 'flex-start',
    paddingTop: '4px',
  },
  chartSection: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  sectionTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
  },
  legend: {
    display: 'flex',
    gap: '20px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  },
  legendLine: {
    width: '22px',
    height: '2.5px',
    borderRadius: '1px',
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.38)',
  },
  metricsSection: {
    width: '220px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
  },
  metricCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid',
    borderRadius: '8px',
    padding: '12px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem',
    color: 'rgba(255,255,255,0.32)',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  metricVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.05rem',
    fontWeight: 700,
    lineHeight: 1.2,
  },
}
