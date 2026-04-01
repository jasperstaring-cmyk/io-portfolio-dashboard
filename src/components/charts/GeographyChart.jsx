const RC = {
  'Europe': '#4ED596',
  'North America': '#E01B41',
  'Asia Pacific': '#5B8DEF',
  'Emerging Markets': '#F5A623',
}

export default function GeographyChart({ portfolio, scenario, showComparison, lang }) {
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

  const regions = Object.keys(RC).map(r => ({
    id: r, color: RC[r],
    weight: geoMap[r] || 0,
    comp: showComparison ? (compMap[r] || 0) : 0,
  })).filter(r => r.weight > 0).sort((a, b) => b.weight - a.weight)

  const maxW = Math.max(...regions.map(r => r.weight), 1)

  function opacity(w) { return 0.1 + (w / 100) * 0.75 }

  return (
    <div style={s.wrap}>
      {/* World map SVG — responsive */}
      <div style={s.mapCol}>
        <div style={s.label}>GLOBAL EXPOSURE</div>
        <svg viewBox="0 0 500 260" style={s.mapSvg} xmlns="http://www.w3.org/2000/svg">
          {/* Ocean */}
          <rect x="0" y="0" width="500" height="260" fill="rgba(255,255,255,0.015)" rx="8" />

          {/* Grid */}
          {[65,130,195].map(y => (
            <line key={y} x1="0" y1={y} x2="500" y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[100,200,300,400].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="260"
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* ── North America ── */}
          <ellipse cx="105" cy="95" rx="70" ry="52"
            fill={RC['North America']}
            fillOpacity={opacity(geoMap['North America'] || 0)}
            stroke={RC['North America']} strokeOpacity="0.5" strokeWidth="1" />
          {/* Canada bump */}
          <ellipse cx="118" cy="55" rx="45" ry="22"
            fill={RC['North America']}
            fillOpacity={opacity(geoMap['North America'] || 0) * 0.7}
            stroke={RC['North America']} strokeOpacity="0.3" strokeWidth="0.5" />
          {/* Alaska */}
          <ellipse cx="48" cy="58" rx="22" ry="16"
            fill={RC['North America']}
            fillOpacity={opacity(geoMap['North America'] || 0) * 0.6}
            stroke={RC['North America']} strokeOpacity="0.3" strokeWidth="0.5" />

          {/* ── Europe ── */}
          <ellipse cx="228" cy="72" rx="36" ry="28"
            fill={RC['Europe']}
            fillOpacity={opacity(geoMap['Europe'] || 0)}
            stroke={RC['Europe']} strokeOpacity="0.5" strokeWidth="1" />
          {/* Scandinavia */}
          <ellipse cx="232" cy="42" rx="18" ry="16"
            fill={RC['Europe']}
            fillOpacity={opacity(geoMap['Europe'] || 0) * 0.7}
            stroke={RC['Europe']} strokeOpacity="0.3" strokeWidth="0.5" />
          {/* UK */}
          <ellipse cx="204" cy="60" rx="10" ry="12"
            fill={RC['Europe']}
            fillOpacity={opacity(geoMap['Europe'] || 0) * 0.8}
            stroke={RC['Europe']} strokeOpacity="0.4" strokeWidth="0.5" />

          {/* ── Russia / Central Asia ── */}
          <ellipse cx="340" cy="52" rx="110" ry="32"
            fill={RC['Asia Pacific']}
            fillOpacity={opacity(geoMap['Asia Pacific'] || 0) * 0.5}
            stroke={RC['Asia Pacific']} strokeOpacity="0.2" strokeWidth="0.5" />

          {/* ── East Asia / China ── */}
          <ellipse cx="368" cy="95" rx="52" ry="38"
            fill={RC['Asia Pacific']}
            fillOpacity={opacity(geoMap['Asia Pacific'] || 0)}
            stroke={RC['Asia Pacific']} strokeOpacity="0.5" strokeWidth="1" />
          {/* Japan */}
          <ellipse cx="430" cy="82" rx="16" ry="22"
            fill={RC['Asia Pacific']}
            fillOpacity={opacity(geoMap['Asia Pacific'] || 0) * 0.8}
            stroke={RC['Asia Pacific']} strokeOpacity="0.4" strokeWidth="0.5" />
          {/* SE Asia */}
          <ellipse cx="388" cy="148" rx="28" ry="18"
            fill={RC['Asia Pacific']}
            fillOpacity={opacity(geoMap['Asia Pacific'] || 0) * 0.7}
            stroke={RC['Asia Pacific']} strokeOpacity="0.3" strokeWidth="0.5" />
          {/* Australia */}
          <ellipse cx="418" cy="195" rx="40" ry="28"
            fill={RC['Asia Pacific']}
            fillOpacity={opacity(geoMap['Asia Pacific'] || 0) * 0.75}
            stroke={RC['Asia Pacific']} strokeOpacity="0.4" strokeWidth="0.5" />

          {/* ── South America ── */}
          <ellipse cx="138" cy="178" rx="38" ry="52"
            fill={RC['Emerging Markets']}
            fillOpacity={opacity(geoMap['Emerging Markets'] || 0) * 0.8}
            stroke={RC['Emerging Markets']} strokeOpacity="0.4" strokeWidth="0.8" />

          {/* ── Africa ── */}
          <ellipse cx="242" cy="168" rx="42" ry="58"
            fill={RC['Emerging Markets']}
            fillOpacity={opacity(geoMap['Emerging Markets'] || 0)}
            stroke={RC['Emerging Markets']} strokeOpacity="0.5" strokeWidth="1" />

          {/* ── Middle East / India ── */}
          <ellipse cx="292" cy="118" rx="28" ry="32"
            fill={RC['Emerging Markets']}
            fillOpacity={opacity(geoMap['Emerging Markets'] || 0) * 0.85}
            stroke={RC['Emerging Markets']} strokeOpacity="0.4" strokeWidth="0.8" />

          {/* Region weight labels */}
          {[
            { id: 'North America', x: 105, y: 98 },
            { id: 'Europe', x: 228, y: 76 },
            { id: 'Asia Pacific', x: 378, y: 98 },
            { id: 'Emerging Markets', x: 242, y: 172 },
          ].map(pos => {
            const r = regions.find(r => r.id === pos.id)
            if (!r || r.weight === 0) return null
            return (
              <g key={pos.id}>
                <text x={pos.x} y={pos.y - 5} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="8.5" fontWeight="800" fill={r.color} fillOpacity="0.95">
                  {pos.id === 'Emerging Markets' ? 'EM' : pos.id.split(' ').map((w, i) => (
                    <tspan key={i} x={pos.x} dy={i === 0 ? 0 : 11}>{w}</tspan>
                  ))}
                </text>
                <text x={pos.x} y={pos.id === 'North America' || pos.id === 'Asia Pacific' ? pos.y + 10 : pos.y + 8}
                  textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="13" fontWeight="800" fill={r.color}>
                  {r.weight}%
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bar breakdown */}
      <div style={s.barsCol}>
        <div style={s.label}>REGIONAL BREAKDOWN</div>
        {regions.map(r => (
          <div key={r.id} style={s.regionRow}>
            <div style={s.regionLabel}>
              <div style={{ width: 9, height: 9, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={s.regionName}>{r.id}</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={s.track}>
                {showComparison && r.comp > 0 && (
                  <div style={{
                    ...s.compBar,
                    width: `${(r.comp / maxW) * 100}%`,
                  }} />
                )}
                <div style={{
                  ...s.bar,
                  width: `${(r.weight / maxW) * 100}%`,
                  background: r.color,
                }} />
              </div>
            </div>
            <div style={s.vals}>
              <span style={{ ...s.pct, color: r.color }}>{r.weight}%</span>
              {showComparison && r.comp > 0 && r.comp !== r.weight && (
                <span style={{
                  ...s.delta,
                  color: r.comp > r.weight ? '#4ED596' : '#E01B41',
                }}>
                  → {r.comp}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex',
    gap: '40px',
    height: '100%',
    width: '100%',
    alignItems: 'center',
  },
  mapCol: {
    flex: 1.5,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    height: '100%',
    justifyContent: 'center',
  },
  mapSvg: {
    width: '100%',
    height: 'auto',
    maxHeight: '260px',
  },
  label: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: '0.1em',
  },
  barsCol: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    justifyContent: 'center',
  },
  regionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  regionLabel: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: 145, flexShrink: 0,
  },
  regionName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
  },
  track: {
    height: 26,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: 5, bottom: 5, left: 0,
    borderRadius: 3, opacity: 0.82,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 2,
  },
  compBar: {
    position: 'absolute',
    top: 5, bottom: 5, left: 0,
    borderRadius: 3,
    background: 'rgba(78,213,150,0.38)',
    border: '1px solid rgba(78,213,150,0.6)',
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 1,
  },
  vals: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', minWidth: 90,
  },
  pct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.05rem', fontWeight: 800,
  },
  delta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 600,
  },
}
