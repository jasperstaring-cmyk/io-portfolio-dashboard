import { useT } from './chartTokens'
import { useState, useEffect, useRef } from 'react'

// Kleurlogica conform IO-stijl op donkere achtergrond:
// Groen = positief rendement / outperformance
// Rood  = negatief / risicoindicator (drawdown)
// Wit   = neutraal (volatiliteit)
const C = {
  green:  '#4ED596',
  red:    '#E01B41',
  white:  'rgba(255,255,255,0.88)',
  muted:  'rgba(255,255,255,0.28)',
  bench:  'rgba(255,255,255,0.22)',
}

function generateSyntheticSeries(p) {
  const port  = [100,102.1,101.4,103.8,105.2,103.9,106.1,107.4,105.8,107.2,108.9,104.2 + p.ytd * 0.3]
  const bench = [100,101.2,100.8,102.4,103.6,102.1,104.3,105.1,103.9,104.8,106.2,103.5 + p.benchmark * 0.3]
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return { port, bench, labels: months }
}

function processRealSeries(series) {
  if (!series?.length) return null

  const base    = series[0].portfolio
  const baseBch = series[0].benchmark ?? series[0].portfolio

  const port  = series.map(s => (s.portfolio / base) * 100)
  const bench = series.map(s => ((s.benchmark ?? s.portfolio) / baseBch) * 100)

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const labels = series.map(s => {
    if (s.label) return s.label
    if (!s.month) return ''
    const parts = s.month.split('-')
    const m = parseInt(parts[1], 10) - 1
    const y = parts[0]?.slice(2)
    return y ? `${MONTHS[m]} '${y}` : MONTHS[m]
  })

  return { port, bench, labels }
}

export default function PerformanceChart({ portfolio, comparisonPortfolio, showComparison }) {
  const T = useT()
  const s = makeStyles(T)
  const [drawn, setDrawn] = useState(false)
  const pathRef = useRef(null)

  useEffect(() => {
    setDrawn(false)
    const t = setTimeout(() => setDrawn(true), 60)
    return () => clearTimeout(t)
  }, [portfolio.performance.ytd, portfolio.performance.series?.length])

  const p = portfolio.performance

  const seriesData = p.series?.length
    ? processRealSeries(p.series)
    : generateSyntheticSeries(p)

  const { port, bench, labels } = seriesData

  const compP = showComparison ? comparisonPortfolio?.performance : null
  const compSeriesRaw = compP?.series?.length ? processRealSeries(compP.series) : null

  const all  = [...port, ...bench, ...(compSeriesRaw ? compSeriesRaw.port : [])]
  const minV = Math.min(...all) - 0.8
  const maxV = Math.max(...all) + 0.8
  const range = maxV - minV

  const W = 520, H = 200
  const pL = 46, pR = 36, pT = 16, pB = 36
  const n = labels.length

  function tx(i) { return pL + (i / Math.max(n - 1, 1)) * (W - pL - pR) }
  function ty(v)  { return pT + (1 - (v - minV) / range) * (H - pT - pB) }
  function linePath(data) {
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i)} ${ty(v)}`).join(' ')
  }
  function areaPath(data) {
    return `${tx(0)},${H - pB} ${data.map((v, i) => `${tx(i)},${ty(v)}`).join(' ')} ${tx(n - 1)},${H - pB}`
  }

  const alpha = (p.ytd - p.benchmark).toFixed(1)
  const metrics = [
    { label: 'YTD Return',   value: `${p.ytd >= 0 ? '+' : ''}${p.ytd}%`,            color: p.ytd >= 0 ? C.green : C.red },
    { label: '1Y Return',    value: `${p.oneYear >= 0 ? '+' : ''}${p.oneYear}%`,     color: p.oneYear >= 0 ? C.green : C.red },
    { label: '3Y Ann.',      value: `${p.threeYear >= 0 ? '+' : ''}${p.threeYear}%`, color: p.threeYear >= 0 ? C.green : C.red },
    { label: 'vs Benchmark', value: `${alpha >= 0 ? '+' : ''}${alpha}%`,             color: alpha >= 0 ? C.green : C.red },
    { label: 'Volatility',   value: `${p.volatility}%`,                              color: C.white },
    { label: 'Max Drawdown', value: `${p.maxDrawdown}%`,                             color: C.red },
  ]

  const endX = tx(n - 1)
  const endY = ty(port[port.length - 1])

  const isReal = !!p.series?.length
  const chartLabel = isReal
    ? `PORTFOLIO PERFORMANCE — ${labels[0]} → ${labels[labels.length - 1]} (INDEXED TO 100)`
    : 'PORTFOLIO PERFORMANCE — YTD (INDEXED TO 100)'

  return (
    <div style={s.wrap}>

      {/* Chart column */}
      <div style={s.chartCol}>
        <div style={s.topLabel}>{chartLabel}</div>

        <div style={s.svgWrap}>
          <svg viewBox={`0 0 ${W} ${H}`} style={s.svg} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.20" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </linearGradient>
              <radialGradient id="perf-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.22" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="perf-bg-glow" cx="70%" cy="30%" r="55%">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.04" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </radialGradient>
              {compSeriesRaw && (
                <linearGradient id="perf-area-comp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#F5A623" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#F5A623" stopOpacity="0" />
                </linearGradient>
              )}
            </defs>

            <rect x={pL} y={pT} width={W - pL - pR} height={H - pT - pB}
              fill="url(#perf-bg-glow)" />

            {/* Y-gridlijnen */}
            {[0, 0.25, 0.5, 0.75, 1].map(t => {
              const y = pT + t * (H - pT - pB)
              return (
                <g key={t}>
                  <line x1={pL} y1={y} x2={W - pR} y2={y}
                    stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x={pL - 6} y={y + 4} textAnchor="end"
                    fontFamily="'Merriweather Sans', sans-serif" fontSize={T.svgMicro}
                    fill={C.muted}>
                    {(maxV - t * range).toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* X-labels */}
            {labels.map((m, i) => {
              const step = Math.max(1, Math.floor(n / 12))
              if (i % step !== 0 && i !== n - 1) return null
              return (
                <text key={i} x={tx(i)} y={H - 8} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif" fontSize={T.svgMicro}
                  fill={C.muted}>
                  {m}
                </text>
              )
            })}

            {/* Baseline 100 */}
            <line x1={pL} y1={ty(100)} x2={W - pR} y2={ty(100)}
              stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Compare lijn */}
            {compSeriesRaw && (
              <>
                <polygon points={areaPath(compSeriesRaw.port)} fill="url(#perf-area-comp)"
                  opacity={drawn ? 0.6 : 0}
                  style={{ transition: drawn ? 'opacity 0.9s ease 0.3s' : 'none' }} />
                <path d={linePath(compSeriesRaw.port)} fill="none"
                  stroke="#F5A623" strokeWidth="1.8"
                  strokeDasharray="6 3" strokeLinecap="round"
                  opacity={drawn ? 0.7 : 0}
                  style={{ transition: drawn ? 'opacity 0.5s ease 0.2s' : 'none' }} />
              </>
            )}

            {/* Area onder portfoliolijn */}
            <polygon points={areaPath(port)} fill="url(#perf-area)"
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.9s ease 0.3s' : 'none' }} />

            {/* Benchmarklijn */}
            <path d={linePath(bench)} fill="none"
              stroke={C.bench} strokeWidth="1.5"
              strokeDasharray="5 3" strokeLinecap="round" />

            {/* Portfoliolijn */}
            <path ref={pathRef} d={linePath(port)} fill="none"
              stroke={C.green} strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="1000"
              strokeDashoffset={drawn ? 0 : 1000}
              style={{ transition: drawn ? 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)' : 'none' }} />

            {/* Gloed achter eindpunt */}
            <ellipse cx={endX} cy={endY} rx="28" ry="22"
              fill="url(#perf-glow)"
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.6s ease 0.9s' : 'none' }} />

            {/* Eindpunt benchmark */}
            <circle cx={endX} cy={ty(bench[bench.length - 1])}
              r="3.5" fill={C.bench} stroke="#0C182E" strokeWidth="1.5" />

            {/* Eindpunt portfolio */}
            <circle cx={endX} cy={endY}
              r="6" fill={C.green} stroke="#0C182E" strokeWidth="2.5"
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.3s ease 1s' : 'none' }} />
            <circle cx={endX} cy={endY}
              r="11" fill="none" stroke={C.green} strokeWidth="0.8"
              opacity={drawn ? 0.25 : 0}
              style={{ transition: drawn ? 'opacity 0.3s ease 1.1s' : 'none' }} />

            {/* YTD-label naast eindpunt */}
            <text x={endX + 10} y={endY + 4}
              fontFamily="'Merriweather Sans', sans-serif"
              fontSize={T.svgSmall} fontWeight="800" fill={C.green}
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.3s ease 1.1s' : 'none' }}>
              {p.ytd >= 0 ? '+' : ''}{p.ytd}%
            </text>
          </svg>
        </div>

        {/* Legenda */}
        <div style={s.legend}>
          <div style={s.li}>
            <div style={{ ...s.ll, background: C.green }} />
            <span style={s.lt}>Portfolio</span>
          </div>
          <div style={s.li}>
            <div style={{ width: 22, height: 2, background: 'repeating-linear-gradient(90deg,rgba(255,255,255,0.22) 0,rgba(255,255,255,0.22) 5px,transparent 5px,transparent 8px)' }} />
            <span style={s.lt}>Benchmark</span>
          </div>
          {compSeriesRaw && (
            <div style={s.li}>
              <div style={{ width: 22, height: 2, background: 'repeating-linear-gradient(90deg,#F5A623 0,#F5A623 6px,transparent 6px,transparent 9px)' }} />
              <span style={s.lt}>Compare</span>
            </div>
          )}
          {!isReal && (
            <span style={{ ...s.lt, opacity: 0.45, fontStyle: 'italic' }}>
              — indicative data
            </span>
          )}
        </div>
      </div>

      {/* Metrics column */}
      <div style={s.metricsCol}>
        <div style={s.topLabel}>KEY METRICS</div>

        {(() => {
          const alphaMet  = metrics.find(m => m.label === 'vs Benchmark')
          const alphaPos  = parseFloat(alpha) >= 0
          return (
            <div style={{
              ...s.alphaCard,
              borderColor: alphaPos ? 'rgba(78,213,150,0.35)' : 'rgba(224,27,65,0.35)',
              background:  alphaPos ? 'rgba(78,213,150,0.07)' : 'rgba(224,27,65,0.07)',
            }}>
              <span style={s.alphaLabel}>Alpha vs Benchmark</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ ...s.alphaVal, color: alphaMet.color }}>
                  {alphaMet.value}
                </span>
                <span style={{ ...s.alphaSub, color: alphaMet.color }}>
                  {alphaPos ? 'outperformance' : 'underperformance'}
                </span>
              </div>
            </div>
          )
        })()}

        <div style={s.grid}>
          {metrics.filter(m => m.label !== 'vs Benchmark').map(m => (
            <div key={m.label} style={{
              ...s.card,
              borderColor: m.color === C.green
                ? 'rgba(78,213,150,0.18)'
                : m.color === C.red
                  ? 'rgba(224,27,65,0.18)'
                  : 'rgba(255,255,255,0.08)',
              background: m.color === C.green
                ? 'rgba(78,213,150,0.05)'
                : m.color === C.red
                  ? 'rgba(224,27,65,0.05)'
                  : 'rgba(255,255,255,0.03)',
            }}>
              <span style={s.cLabel}>{m.label}</span>
              <span style={{ ...s.cVal, color: m.color }}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

function makeStyles(T) {
  return {
  wrap: { display: 'flex', gap: 32, height: '100%', width: '100%', alignItems: 'stretch' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, minHeight: 0 },
  topLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMicro,
    color: T.faint, letterSpacing: '0.1em', flexShrink: 0,
  },
  svgWrap: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svg: { width: '100%', height: '100%', display: 'block', overflow: 'visible' },
  legend: { display: 'flex', gap: 20, flexShrink: 0, flexWrap: 'wrap', alignItems: 'center' },
  li:  { display: 'flex', alignItems: 'center', gap: 7 },
  ll:  { width: 22, height: 2.5, borderRadius: 1 },
  lt:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: T.small, color: 'rgba(255,255,255,0.35)' },
  metricsCol: { width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-start' },
  alphaCard: {
    border: '1px solid', borderRadius: 8, padding: '12px 16px', flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 4,
    transition: 'border-color 0.4s ease, background 0.4s ease',
  },
  alphaLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMedium,
    color: 'rgba(255,255,255,0.35)', letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  alphaVal:  { fontFamily: "'Merriweather', serif", fontSize: T.display, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' },
  alphaSub:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: T.small, fontWeight: 600, opacity: 0.7 },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, flex: 1 },
  card: {
    border: '1px solid', borderRadius: 8, padding: '14px 14px 12px',
    display: 'flex', flexDirection: 'column', gap: 6,
    transition: 'border-color 0.4s ease',
  },
  cLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMedium,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.3,
  },
  cVal: { fontFamily: "'Merriweather', serif", fontSize: T.xlarge, fontWeight: 700, lineHeight: 1, letterSpacing: '-0.02em' },
}
}
