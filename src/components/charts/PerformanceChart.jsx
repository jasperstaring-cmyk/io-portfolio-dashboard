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

export default function PerformanceChart({ portfolio }) {
  const [drawn, setDrawn] = useState(false)
  const pathRef = useRef(null)

  useEffect(() => {
    setDrawn(false)
    const t = setTimeout(() => setDrawn(true), 60)
    return () => clearTimeout(t)
  }, [portfolio.performance.ytd])

  const p = portfolio.performance
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const port  = [100,102.1,101.4,103.8,105.2,103.9,106.1,107.4,105.8,107.2,108.9,104.2 + p.ytd * 0.3]
  const bench = [100,101.2,100.8,102.4,103.6,102.1,104.3,105.1,103.9,104.8,106.2,103.5 + p.benchmark * 0.3]

  const all  = [...port, ...bench]
  const minV = Math.min(...all) - 0.8
  const maxV = Math.max(...all) + 0.8
  const range = maxV - minV

  const W = 520, H = 200
  const pL = 46, pR = 36, pT = 16, pB = 36

  function tx(i) { return pL + (i / (months.length - 1)) * (W - pL - pR) }
  function ty(v)  { return pT + (1 - (v - minV) / range) * (H - pT - pB) }
  function linePath(data) { return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${tx(i)} ${ty(v)}`).join(' ') }
  function areaPath(data) {
    return `${tx(0)},${H - pB} ${data.map((v, i) => `${tx(i)},${ty(v)}`).join(' ')} ${tx(months.length - 1)},${H - pB}`
  }

  // Metrics: kleur op basis van werkelijke waarde, niet hardcoded
  const alpha = (p.ytd - p.benchmark).toFixed(1)
  const metrics = [
    { label: 'YTD Return',    value: `${p.ytd >= 0 ? '+' : ''}${p.ytd}%`,         color: p.ytd >= 0 ? C.green : C.red },
    { label: '1Y Return',     value: `${p.oneYear >= 0 ? '+' : ''}${p.oneYear}%`,  color: p.oneYear >= 0 ? C.green : C.red },
    { label: '3Y Ann.',       value: `${p.threeYear >= 0 ? '+' : ''}${p.threeYear}%`, color: p.threeYear >= 0 ? C.green : C.red },
    { label: 'vs Benchmark',  value: `${alpha >= 0 ? '+' : ''}${alpha}%`,          color: alpha >= 0 ? C.green : C.red },
    { label: 'Volatility',    value: `${p.volatility}%`,                            color: C.white },
    { label: 'Max Drawdown',  value: `${p.maxDrawdown}%`,                           color: C.red },
  ]

  const endX = tx(months.length - 1)
  const endY = ty(port[port.length - 1])

  return (
    <div style={s.wrap}>

      {/* ── Chart column ──────────────────────────────────────────────── */}
      <div style={s.chartCol}>
        <div style={s.topLabel}>PORTFOLIO PERFORMANCE — YTD (INDEXED TO 100)</div>

        <div style={s.svgWrap}>
          <svg viewBox={`0 0 ${W} ${H}`} style={s.svg} preserveAspectRatio="xMidYMid meet">
            <defs>
              {/* Groene area-gradient */}
              <linearGradient id="perf-area" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.20" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </linearGradient>
              {/* Radiale gloed achter eindpunt portfoliolijn */}
              <radialGradient id="perf-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.22" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </radialGradient>
              {/* Achtergrondgloed over de gehele grafiek — subtiel, linksboven */}
              <radialGradient id="perf-bg-glow" cx="70%" cy="30%" r="55%">
                <stop offset="0%"   stopColor={C.green} stopOpacity="0.04" />
                <stop offset="100%" stopColor={C.green} stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Achtergrondgloed */}
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
                    fontFamily="'Merriweather Sans', sans-serif" fontSize="8"
                    fill={C.muted}>
                    {(maxV - t * range).toFixed(1)}
                  </text>
                </g>
              )
            })}

            {/* Maandlabels */}
            {months.map((m, i) => (
              <text key={m} x={tx(i)} y={H - 8} textAnchor="middle"
                fontFamily="'Merriweather Sans', sans-serif" fontSize="8"
                fill={C.muted}>
                {m}
              </text>
            ))}

            {/* Baseline 100 */}
            <line x1={pL} y1={ty(100)} x2={W - pR} y2={ty(100)}
              stroke="rgba(255,255,255,0.10)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Area onder portfoliolijn */}
            <polygon points={areaPath(port)} fill="url(#perf-area)"
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.9s ease 0.3s' : 'none' }} />

            {/* Benchmarklijn — gestippeld, teruggetrokken */}
            <path d={linePath(bench)} fill="none"
              stroke={C.bench} strokeWidth="1.5"
              strokeDasharray="5 3" strokeLinecap="round" />

            {/* Portfoliolijn — draw-animatie */}
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
              fontSize="10" fontWeight="800" fill={C.green}
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
        </div>
      </div>

      {/* ── Metrics column ────────────────────────────────────────────── */}
      <div style={s.metricsCol}>
        <div style={s.topLabel}>KEY METRICS</div>
        <div style={s.grid}>
          {metrics.map(m => (
            <div key={m.label} style={{
              ...s.card,
              borderColor: m.color === C.green
                ? 'rgba(78,213,150,0.18)'
                : m.color === C.red
                  ? 'rgba(224,27,65,0.18)'
                  : 'rgba(255,255,255,0.08)',
              // Subtiele achtergrondgloed per kaart op basis van kleur
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

const s = {
  wrap: {
    display: 'flex', gap: 32,
    height: '100%', width: '100%',
    alignItems: 'stretch',
  },
  chartCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 10, minWidth: 0, minHeight: 0,
  },
  topLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    flexShrink: 0,
  },
  svgWrap: {
    flex: 1, minHeight: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  svg: { width: '100%', height: '100%', display: 'block', overflow: 'visible' },
  legend: { display: 'flex', gap: 20, flexShrink: 0 },
  li:     { display: 'flex', alignItems: 'center', gap: 7 },
  ll:     { width: 22, height: 2.5, borderRadius: 1 },
  lt:     {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)',
  },

  // Metrics
  metricsCol: {
    width: 220, flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    gap: 10, justifyContent: 'flex-start',
  },
  grid: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
    flex: 1,
  },
  card: {
    border: '1px solid',
    borderRadius: 8,
    padding: '14px 14px 12px',
    display: 'flex', flexDirection: 'column',
    gap: 6,
    transition: 'border-color 0.4s ease',
  },
  cLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.55rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    lineHeight: 1.3,
  },
  // Waarden zijn groot en dominant — dit is de kern van de metrics-kaart
  cVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.55rem', fontWeight: 700,
    lineHeight: 1,
    letterSpacing: '-0.02em',
  },
}
