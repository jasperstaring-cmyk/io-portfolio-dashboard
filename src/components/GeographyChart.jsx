import { useEffect, useState } from 'react'

const RC = {
  'Europe': '#4ED596',
  'North America': '#E01B41',
  'Asia Pacific': '#5B8DEF',
  'Emerging Markets': '#F5A623',
}

export default function GeographyChart({ portfolio, scenario, showComparison }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const geoMap = {}
  portfolio.allocations.forEach(a => {
    a.geographic?.forEach(g => {
      geoMap[g.region] = (geoMap[g.region] || 0) + g.weight
    })
  })

  const compMap = {}
  if (showComparison && scenario?.comparison?.allocations) {
    portfolio.allocations.forEach(a => {
      const comp = scenario.comparison.allocations.find(c => c.id === a.id)
      const geo = comp?.geographic || a.geographic
      geo?.forEach(g => { compMap[g.region] = (compMap[g.region] || 0) + g.weight })
    })
  }

  const activeMap = showComparison && Object.keys(compMap).length > 0 ? compMap : geoMap

  const regions = Object.keys(RC).map(r => ({
    id: r, color: RC[r],
    base: geoMap[r] || 0,
    active: activeMap[r] || 0,
    delta: (activeMap[r] || 0) - (geoMap[r] || 0),
  })).filter(r => r.base > 0 || r.active > 0)
    .sort((a, b) => b.active - a.active)

  const maxW = Math.max(...regions.map(r => Math.max(r.base, r.active)), 1)

  // Opacity reflects active weight — deeper = more exposure
  function op(w) { return 0.08 + (w / 100) * 0.78 }

  // Region map positions
  const POSITIONS = {
    'North America': { x: 105, y: 98 },
    'Europe': { x: 228, y: 76 },
    'Asia Pacific': { x: 378, y: 98 },
    'Emerging Markets': { x: 242, y: 172 },
  }

  return (
    <div style={s.wrap}>
      {/* World map */}
      <div style={s.mapCol}>
        <div style={s.label}>GLOBAL EXPOSURE{showComparison ? ' — SCENARIO' : ''}</div>
        <svg viewBox="0 0 500 260" style={s.mapSvg}>
          <rect x="0" y="0" width="500" height="260" fill="rgba(255,255,255,0.012)" rx="8" />
          {[65,130,195].map(y => (
            <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[100,200,300,400].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* North America */}
          {['#E01B41'].map(c => (
            <g key="na">
              <ellipse cx="105" cy="95" rx="70" ry="52"
                fill={c} fillOpacity={animated ? op(activeMap['North America'] || 0) : op(geoMap['North America'] || 0)}
                stroke={c} strokeOpacity={animated ? (activeMap['North America'] > 0 ? 0.55 : 0.15) : 0.55}
                strokeWidth="1"
                style={{ transition: 'fill-opacity 0.8s ease, stroke-opacity 0.8s ease' }} />
              <ellipse cx="118" cy="55" rx="45" ry="22"
                fill={c} fillOpacity={animated ? op(activeMap['North America'] || 0) * 0.6 : op(geoMap['North America'] || 0) * 0.6}
                stroke={c} strokeOpacity="0.25" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
            </g>
          ))}

          {/* Europe */}
          {['#4ED596'].map(c => (
            <g key="eu">
              <ellipse cx="228" cy="72" rx="36" ry="28"
                fill={c} fillOpacity={animated ? op(activeMap['Europe'] || 0) : op(geoMap['Europe'] || 0)}
                stroke={c} strokeOpacity={animated ? (activeMap['Europe'] > 0 ? 0.6 : 0.15) : 0.6}
                strokeWidth="1"
                style={{ transition: 'fill-opacity 0.8s ease, stroke-opacity 0.8s ease' }} />
              <ellipse cx="232" cy="42" rx="18" ry="16"
                fill={c} fillOpacity={animated ? op(activeMap['Europe'] || 0) * 0.65 : op(geoMap['Europe'] || 0) * 0.65}
                stroke={c} strokeOpacity="0.3" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
              <ellipse cx="204" cy="60" rx="10" ry="12"
                fill={c} fillOpacity={animated ? op(activeMap['Europe'] || 0) * 0.75 : op(geoMap['Europe'] || 0) * 0.75}
                stroke={c} strokeOpacity="0.35" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
            </g>
          ))}

          {/* Asia Pacific */}
          {['#5B8DEF'].map(c => (
            <g key="ap">
              <ellipse cx="340" cy="52" rx="110" ry="32"
                fill={c} fillOpacity={animated ? op(activeMap['Asia Pacific'] || 0) * 0.45 : op(geoMap['Asia Pacific'] || 0) * 0.45}
                stroke={c} strokeOpacity="0.18" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
              <ellipse cx="368" cy="95" rx="52" ry="38"
                fill={c} fillOpacity={animated ? op(activeMap['Asia Pacific'] || 0) : op(geoMap['Asia Pacific'] || 0)}
                stroke={c} strokeOpacity={animated ? (activeMap['Asia Pacific'] > 0 ? 0.5 : 0.15) : 0.5}
                strokeWidth="1"
                style={{ transition: 'fill-opacity 0.8s ease, stroke-opacity 0.8s ease' }} />
              <ellipse cx="430" cy="82" rx="16" ry="22"
                fill={c} fillOpacity={animated ? op(activeMap['Asia Pacific'] || 0) * 0.75 : op(geoMap['Asia Pacific'] || 0) * 0.75}
                stroke={c} strokeOpacity="0.35" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
              <ellipse cx="418" cy="195" rx="40" ry="28"
                fill={c} fillOpacity={animated ? op(activeMap['Asia Pacific'] || 0) * 0.7 : op(geoMap['Asia Pacific'] || 0) * 0.7}
                stroke={c} strokeOpacity="0.3" strokeWidth="0.5"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
            </g>
          ))}

          {/* Emerging Markets */}
          {['#F5A623'].map(c => (
            <g key="em">
              <ellipse cx="138" cy="178" rx="38" ry="52"
                fill={c} fillOpacity={animated ? op(activeMap['Emerging Markets'] || 0) * 0.8 : op(geoMap['Emerging Markets'] || 0) * 0.8}
                stroke={c} strokeOpacity="0.35" strokeWidth="0.8"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
              <ellipse cx="242" cy="168" rx="42" ry="58"
                fill={c} fillOpacity={animated ? op(activeMap['Emerging Markets'] || 0) : op(geoMap['Emerging Markets'] || 0)}
                stroke={c} strokeOpacity={animated ? (activeMap['Emerging Markets'] > 0 ? 0.5 : 0.15) : 0.5}
                strokeWidth="1"
                style={{ transition: 'fill-opacity 0.8s ease, stroke-opacity 0.8s ease' }} />
              <ellipse cx="292" cy="118" rx="28" ry="32"
                fill={c} fillOpacity={animated ? op(activeMap['Emerging Markets'] || 0) * 0.82 : op(geoMap['Emerging Markets'] || 0) * 0.82}
                stroke={c} strokeOpacity="0.35" strokeWidth="0.8"
                style={{ transition: 'fill-opacity 0.8s ease' }} />
            </g>
          ))}

          {/* Region labels with active weight */}
          {regions.map(r => {
            const pos = POSITIONS[r.id]
            if (!pos) return null
            const showDelta = showComparison && r.delta !== 0
            return (
              <g key={r.id}>
                <text x={pos.x} y={pos.y - 8} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="8" fontWeight="800" fill={r.color} fillOpacity="0.9">
                  {r.id === 'Emerging Markets' ? 'EM' : r.id}
                </text>
                <text x={pos.x} y={pos.y + 8} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="13" fontWeight="800" fill={r.color}>
                  {r.active}%
                </text>
                {showDelta && (
                  <text x={pos.x} y={pos.y + 22} textAnchor="middle"
                    fontFamily="'Merriweather Sans', sans-serif"
                    fontSize="9" fontWeight="700"
                    fill={r.delta > 0 ? '#E01B41' : '#4ED596'}>
                    {r.delta > 0 ? '▲' : '▼'} {Math.abs(r.delta)}%
                  </text>
                )}
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bar breakdown */}
      <div style={s.barsCol}>
        <div style={s.label}>REGIONAL BREAKDOWN</div>
        {regions.map(r => {
          const showDelta = showComparison && r.delta !== 0
          return (
            <div key={r.id} style={s.regionRow}>
              <div style={s.regionLabel}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                <span style={s.regionName}>{r.id}</span>
              </div>
              <div style={{ flex: 1, position: 'relative' }}>
                <div style={s.track}>
                  {/* Base bar (faint when comparing) */}
                  {showComparison && (
                    <div style={{
                      position: 'absolute', top: 4, bottom: 4, left: 0,
                      borderRadius: 3, background: r.color, opacity: 0.2,
                      width: `${(r.base / maxW) * 100}%`,
                    }} />
                  )}
                  {/* Active bar */}
                  <div style={{
                    position: 'absolute', top: 4, bottom: 4, left: 0,
                    borderRadius: 3, opacity: 0.82,
                    background: showDelta
                      ? r.delta > 0 ? '#E01B41' : '#4ED596'
                      : r.color,
                    width: animated ? `${(r.active / maxW) * 100}%` : `${(r.base / maxW) * 100}%`,
                    transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1), background 0.4s ease',
                    zIndex: 2,
                  }} />
                </div>
              </div>
              <div style={s.vals}>
                <span style={{
                  ...s.pct,
                  color: showDelta ? (r.delta > 0 ? '#E01B41' : '#4ED596') : r.color,
                  transition: 'color 0.4s ease',
                }}>
                  {r.active}%
                </span>
                {showDelta && (
                  <span style={{
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.68rem', fontWeight: 700,
                    color: r.delta > 0 ? '#E01B41' : '#4ED596',
                  }}>
                    {r.delta > 0 ? '+' : ''}{r.delta}%
                  </span>
                )}
                {showComparison && !showDelta && (
                  <span style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)' }}>
                    no change
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', gap: 40, height: '100%', width: '100%', alignItems: 'center' },
  mapCol: { flex: 1.5, display: 'flex', flexDirection: 'column', gap: 8, height: '100%', justifyContent: 'center' },
  mapSvg: { width: '100%', height: 'auto', maxHeight: '260px' },
  barsCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' },
  label: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' },
  regionRow: { display: 'flex', alignItems: 'center', gap: 12 },
  regionLabel: { display: 'flex', alignItems: 'center', gap: 8, width: 145, flexShrink: 0 },
  regionName: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.75)' },
  track: { height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  vals: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 90 },
  pct: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '1.05rem', fontWeight: 800 },
}
