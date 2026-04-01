import { useState, useEffect, useRef } from 'react'

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
  const port = [100,102.1,101.4,103.8,105.2,103.9,106.1,107.4,105.8,107.2,108.9,104.2 + p.ytd * 0.3]
  const bench = [100,101.2,100.8,102.4,103.6,102.1,104.3,105.1,103.9,104.8,106.2,103.5 + p.benchmark * 0.3]

  const all = [...port, ...bench]
  const minV = Math.min(...all) - 0.8
  const maxV = Math.max(...all) + 0.8
  const range = maxV - minV

  // Use relative coordinates — SVG scales via viewBox
  const W = 520, H = 200
  const pL = 46, pR = 28, pT = 12, pB = 36

  function tx(i) { return pL + (i / (months.length-1)) * (W-pL-pR) }
  function ty(v) { return pT + (1 - (v-minV)/range) * (H-pT-pB) }
  function linePath(data) { return data.map((v,i) => `${i===0?'M':'L'} ${tx(i)} ${ty(v)}`).join(' ') }
  function areaPath(data) {
    return `${tx(0)},${H-pB} ${data.map((v,i)=>`${tx(i)},${ty(v)}`).join(' ')} ${tx(months.length-1)},${H-pB}`
  }

  const metrics = [
    { label: 'YTD Return', value: `+${p.ytd}%`, color: '#4ED596', pos: true },
    { label: '1Y Return', value: `+${p.oneYear}%`, color: '#4ED596', pos: true },
    { label: '3Y Ann.', value: `+${p.threeYear}%`, color: '#4ED596', pos: true },
    { label: 'vs Benchmark', value: `+${(p.ytd-p.benchmark).toFixed(1)}%`, color: '#4ED596', pos: true },
    { label: 'Volatility', value: `${p.volatility}%`, color: 'rgba(255,255,255,0.62)', pos: null },
    { label: 'Max Drawdown', value: `${p.maxDrawdown}%`, color: '#E01B41', pos: false },
  ]

  return (
    <div style={s.wrap}>
      {/* Chart column */}
      <div style={s.chartCol}>
        <div style={s.topLabel}>PORTFOLIO PERFORMANCE — YTD (INDEXED TO 100)</div>
        <div style={s.svgWrap}>
          <svg viewBox={`0 0 ${W} ${H}`} style={s.svg} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ED596" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Y grid */}
            {[0,0.25,0.5,0.75,1].map(t => {
              const y = pT + t*(H-pT-pB)
              return (
                <g key={t}>
                  <line x1={pL} y1={y} x2={W-pR} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                  <text x={pL-5} y={y+4} textAnchor="end"
                    fontFamily="'Merriweather Sans'" fontSize="8"
                    fill="rgba(255,255,255,0.22)">{(maxV-t*range).toFixed(1)}</text>
                </g>
              )
            })}

            {/* Month labels */}
            {months.map((m,i) => (
              <text key={m} x={tx(i)} y={H-6} textAnchor="middle"
                fontFamily="'Merriweather Sans'" fontSize="8"
                fill="rgba(255,255,255,0.24)">{m}</text>
            ))}

            {/* Baseline */}
            <line x1={pL} y1={ty(100)} x2={W-pR} y2={ty(100)}
              stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="4 3" />

            {/* Area + lines */}
            <polygon points={areaPath(port)} fill="url(#pg)"
              opacity={drawn ? 1 : 0}
              style={{ transition: drawn ? 'opacity 0.8s ease 0.4s' : 'none' }} />
            <path d={linePath(bench)} fill="none"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1.5"
              strokeDasharray="5 3" strokeLinecap="round" />
            <path ref={pathRef} d={linePath(port)} fill="none"
              stroke="#4ED596" strokeWidth="2.8"
              strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="1000"
              strokeDashoffset={drawn ? 0 : 1000}
              style={{ transition: drawn ? 'stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)' : 'none' }} />

            {/* End dots */}
            <circle cx={tx(months.length-1)} cy={ty(port[port.length-1])}
              r="5.5" fill="#4ED596" stroke="#0C182E" strokeWidth="2.5" />
            <circle cx={tx(months.length-1)} cy={ty(bench[bench.length-1])}
              r="3.5" fill="rgba(255,255,255,0.28)" stroke="#0C182E" strokeWidth="1.5" />
            <text x={tx(months.length-1)+9} y={ty(port[port.length-1])+4}
              fontFamily="'Merriweather Sans'" fontSize="9.5" fontWeight="800" fill="#4ED596">
              +{p.ytd}%
            </text>
          </svg>
        </div>

        {/* Legend */}
        <div style={s.legend}>
          <div style={s.li}><div style={{ ...s.ll, background: '#4ED596' }} /><span style={s.lt}>Portfolio</span></div>
          <div style={s.li}><div style={{ width:22, height:2, background:'repeating-linear-gradient(90deg,rgba(255,255,255,0.25) 0,rgba(255,255,255,0.25) 5px,transparent 5px,transparent 8px)' }} /><span style={s.lt}>Benchmark</span></div>
        </div>
      </div>

      {/* Metrics */}
      <div style={s.metricsCol}>
        <div style={s.topLabel}>KEY METRICS</div>
        <div style={s.grid}>
          {metrics.map(m => (
            <div key={m.label} style={{
              ...s.card,
              borderColor: m.pos===true ? 'rgba(78,213,150,0.15)' : m.pos===false ? 'rgba(224,27,65,0.15)' : 'rgba(255,255,255,0.08)',
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
  wrap: { display: 'flex', gap: 32, height: '100%', width: '100%', alignItems: 'stretch' },
  chartCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0, minHeight: 0 },
  topLabel: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', flexShrink: 0 },
  svgWrap: { flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  svg: { width: '100%', height: '100%', display: 'block', overflow: 'visible' },
  legend: { display: 'flex', gap: 20, flexShrink: 0 },
  li: { display: 'flex', alignItems: 'center', gap: 7 },
  ll: { width: 22, height: 2.5, borderRadius: 1 },
  lt: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)' },
  metricsCol: { width: 210, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'flex-start' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 },
  card: { background: 'rgba(255,255,255,0.04)', border: '1px solid', borderRadius: 8, padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 4 },
  cLabel: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 600, letterSpacing: '0.04em' },
  cVal: { fontFamily: "'Merriweather', serif", fontSize: '1rem', fontWeight: 700, lineHeight: 1.2 },
}
