// Categoriekleuren — neutraal, geen statusoordeel
// Rood en groen zijn GERESERVEERD voor compare/delta
const RC = {
  'Europe':          '#5B8DEF',
  'North America':   '#F5A623',
  'Asia Pacific':    '#A78BFA',
  'Emerging Markets':'#8A8A82',
}

// Bouw een regionaal gewichtenmap op basis van allocaties.
// Geografische sub-gewichten worden proportioneel geschaald met a.current
// zodat explore-mode sliders (die a.current aanpassen) de kaart live updaten.
function buildGeoMap(allocations) {
  const map = {}
  allocations.forEach(a => {
    if (!a.geographic?.length) return
    const geoSum = a.geographic.reduce((s, g) => s + g.weight, 0)
    if (geoSum === 0) return
    const scale = a.current / geoSum
    a.geographic.forEach(g => {
      map[g.region] = (map[g.region] || 0) + Math.round(g.weight * scale * 10) / 10
    })
  })
  return map
}

export default function GeographyChart({ portfolio, scenario, showComparison }) {
  // geoOverride: aanwezig in explore mode — directe regio-gewichten
  // zonder geoOverride: bereken proportioneel uit asset class allocaties
  const geoMap = portfolio.geoOverride
    ? portfolio.geoOverride
    : buildGeoMap(portfolio.allocations)

  const compMap = {}
  if (showComparison && scenario?.comparison?.allocations) {
    const compAllocs = portfolio.allocations.map(a => {
      const comp = scenario.comparison.allocations.find(c => c.id === a.id)
      return {
        current:    comp?.current ?? a.current,
        geographic: comp?.geographic || a.geographic,
      }
    })
    Object.assign(compMap, buildGeoMap(compAllocs))
  }

  const hasCompData = showComparison && Object.keys(compMap).length > 0
  const activeMap = hasCompData ? compMap : geoMap

  const regions = Object.keys(RC).map(r => ({
    id: r, color: RC[r],
    base:   Math.round((geoMap[r]   || 0) * 10) / 10,
    active: Math.round((activeMap[r] || 0) * 10) / 10,
    delta:  hasCompData
      ? Math.round(((activeMap[r] || 0) - (geoMap[r] || 0)) * 10) / 10
      : 0,
  })).filter(r => r.base > 0 || r.active > 0)
    .sort((a, b) => b.base - a.base)

  const maxW = Math.max(...regions.map(r => Math.max(r.base, r.active)), 1)
  function op(w) { return 0.07 + (w / 100) * 0.75 }

  const LABEL_POS = {
    'North America':    { x: 105, y: 148 },
    'Europe':           { x: 228, y: 35  },
    'Asia Pacific':     { x: 375, y: 148 },
    'Emerging Markets': { x: 350, y: 198 },
  }

  return (
    <div style={s.wrap}>
      <div style={s.mapCol}>
        <div style={s.label}>GLOBAL EXPOSURE{hasCompData ? ' — SCENARIO' : ''}</div>
        <div style={s.mapWrap}>
          <svg viewBox="0 0 500 260" style={s.mapSvg} preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="geo-glow-eu" cx="46%" cy="27%" r="22%">
                <stop offset="0%" stopColor={RC['Europe']} stopOpacity="0.12" />
                <stop offset="100%" stopColor={RC['Europe']} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="geo-glow-na" cx="21%" cy="37%" r="28%">
                <stop offset="0%" stopColor={RC['North America']} stopOpacity="0.10" />
                <stop offset="100%" stopColor={RC['North America']} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="geo-glow-ap" cx="74%" cy="35%" r="26%">
                <stop offset="0%" stopColor={RC['Asia Pacific']} stopOpacity="0.10" />
                <stop offset="100%" stopColor={RC['Asia Pacific']} stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect x="0" y="0" width="500" height="260" fill="rgba(255,255,255,0.012)" rx="8" />
            {[65,130,195].map(y => <line key={y} x1="0" y1={y} x2="500" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
            {[100,200,300,400].map(x => <line key={x} x1={x} y1="0" x2={x} y2="260" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />)}
            <rect x="0" y="0" width="500" height="260" fill="url(#geo-glow-eu)" />
            <rect x="0" y="0" width="500" height="260" fill="url(#geo-glow-na)" />
            <rect x="0" y="0" width="500" height="260" fill="url(#geo-glow-ap)" />

            <ellipse cx="105" cy="95" rx="70" ry="52" fill={RC['North America']} fillOpacity={op(activeMap['North America']||0)} stroke={RC['North America']} strokeOpacity={activeMap['North America']>0?0.45:0.10} strokeWidth="1" style={{transition:'fill-opacity 0.8s ease,stroke-opacity 0.8s ease'}} />
            <ellipse cx="118" cy="52" rx="45" ry="22" fill={RC['North America']} fillOpacity={op(activeMap['North America']||0)*0.5} stroke={RC['North America']} strokeOpacity="0.18" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />

            <ellipse cx="228" cy="70" rx="36" ry="28" fill={RC['Europe']} fillOpacity={op(activeMap['Europe']||0)} stroke={RC['Europe']} strokeOpacity={activeMap['Europe']>0?0.50:0.10} strokeWidth="1" style={{transition:'fill-opacity 0.8s ease,stroke-opacity 0.8s ease'}} />
            <ellipse cx="232" cy="42" rx="18" ry="16" fill={RC['Europe']} fillOpacity={op(activeMap['Europe']||0)*0.6} stroke={RC['Europe']} strokeOpacity="0.22" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />
            <ellipse cx="204" cy="60" rx="10" ry="12" fill={RC['Europe']} fillOpacity={op(activeMap['Europe']||0)*0.7} stroke={RC['Europe']} strokeOpacity="0.25" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />

            <ellipse cx="340" cy="50" rx="110" ry="30" fill={RC['Asia Pacific']} fillOpacity={op(activeMap['Asia Pacific']||0)*0.35} stroke={RC['Asia Pacific']} strokeOpacity="0.12" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />
            <ellipse cx="368" cy="92" rx="52" ry="38" fill={RC['Asia Pacific']} fillOpacity={op(activeMap['Asia Pacific']||0)} stroke={RC['Asia Pacific']} strokeOpacity={activeMap['Asia Pacific']>0?0.45:0.10} strokeWidth="1" style={{transition:'fill-opacity 0.8s ease,stroke-opacity 0.8s ease'}} />
            <ellipse cx="432" cy="80" rx="16" ry="22" fill={RC['Asia Pacific']} fillOpacity={op(activeMap['Asia Pacific']||0)*0.7} stroke={RC['Asia Pacific']} strokeOpacity="0.25" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />
            <ellipse cx="420" cy="192" rx="40" ry="28" fill={RC['Asia Pacific']} fillOpacity={op(activeMap['Asia Pacific']||0)*0.62} stroke={RC['Asia Pacific']} strokeOpacity="0.22" strokeWidth="0.5" style={{transition:'fill-opacity 0.8s ease'}} />

            <ellipse cx="138" cy="178" rx="38" ry="52" fill={RC['Emerging Markets']} fillOpacity={op(activeMap['Emerging Markets']||0)*0.75} stroke={RC['Emerging Markets']} strokeOpacity="0.25" strokeWidth="0.8" style={{transition:'fill-opacity 0.8s ease'}} />
            <ellipse cx="242" cy="168" rx="42" ry="58" fill={RC['Emerging Markets']} fillOpacity={op(activeMap['Emerging Markets']||0)} stroke={RC['Emerging Markets']} strokeOpacity={activeMap['Emerging Markets']>0?0.45:0.10} strokeWidth="1" style={{transition:'fill-opacity 0.8s ease,stroke-opacity 0.8s ease'}} />
            <ellipse cx="292" cy="118" rx="28" ry="32" fill={RC['Emerging Markets']} fillOpacity={op(activeMap['Emerging Markets']||0)*0.75} stroke={RC['Emerging Markets']} strokeOpacity="0.25" strokeWidth="0.8" style={{transition:'fill-opacity 0.8s ease'}} />

            {regions.map(r => {
              const pos = LABEL_POS[r.id]
              if (!pos) return null
              const hasDelta = hasCompData && r.delta !== 0
              return (
                <g key={r.id}>
                  <rect x={pos.x-26} y={pos.y-14} width={52} height={hasDelta?30:20} rx="4" fill="rgba(12,24,46,0.75)" />
                  <text x={pos.x} y={pos.y} textAnchor="middle" fontFamily="'Merriweather Sans',sans-serif" fontSize="11" fontWeight="800" fill={r.color}>{r.active}%</text>
                  {hasDelta && (
                    <text x={pos.x} y={pos.y+13} textAnchor="middle" fontFamily="'Merriweather Sans',sans-serif" fontSize="8" fontWeight="700" fill={r.delta>0?'#E01B41':'#4ED596'}>
                      {r.delta>0?'▲':'▼'}{Math.abs(r.delta)}%
                    </text>
                  )}
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <div style={s.barsCol}>
        <div style={s.label}>REGIONAL BREAKDOWN</div>
        {regions.map(r => {
          const hasDelta = hasCompData && r.delta !== 0
          return (
            <div key={r.id} style={s.regionRow}>
              <div style={s.regionLabel}>
                <div style={{width:8,height:8,borderRadius:'50%',background:r.color,flexShrink:0,boxShadow:`0 0 6px ${r.color}88`}} />
                <span style={s.regionName}>{r.id}</span>
              </div>
              <div style={{flex:1}}>
                <div style={s.track}>
                  {showComparison && <div style={{position:'absolute',top:4,bottom:4,left:0,borderRadius:3,background:r.color,opacity:0.16,width:`${(r.base/maxW)*100}%`}} />}
                  <div style={{position:'absolute',top:4,bottom:4,left:0,borderRadius:3,opacity:0.85,background:hasDelta?(r.delta>0?'#E01B41':'#4ED596'):r.color,width:`${(r.active/maxW)*100}%`,transition:'width 0.85s cubic-bezier(0.4,0,0.2,1),background 0.5s ease',zIndex:2,boxShadow:hasDelta?(r.delta>0?'0 0 8px rgba(224,27,65,0.35)':'0 0 8px rgba(78,213,150,0.35)'):'none'}} />
                </div>
              </div>
              <div style={s.vals}>
                <span style={{...s.pct,color:hasDelta?(r.delta>0?'#E01B41':'#4ED596'):r.color,transition:'color 0.5s ease'}}>{r.active}%</span>
                {hasDelta && <span style={{fontFamily:"'Merriweather Sans',sans-serif",fontSize:'0.68rem',fontWeight:700,color:r.delta>0?'#E01B41':'#4ED596'}}>{r.delta>0?'+':''}{r.delta}%</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const s = {
  wrap:       {display:'flex',gap:40,height:'100%',width:'100%',alignItems:'stretch'},
  mapCol:     {flex:1.5,display:'flex',flexDirection:'column',gap:8,minWidth:0},
  mapWrap:    {flex:1,display:'flex',alignItems:'center',justifyContent:'center',minHeight:0},
  mapSvg:     {width:'100%',height:'100%',display:'block'},
  barsCol:    {flex:1,display:'flex',flexDirection:'column',gap:16,justifyContent:'center',minWidth:0},
  label:      {fontFamily:"'Merriweather Sans',sans-serif",fontSize:'0.58rem',fontWeight:800,color:'rgba(255,255,255,0.28)',letterSpacing:'0.1em'},
  regionRow:  {display:'flex',alignItems:'center',gap:12},
  regionLabel:{display:'flex',alignItems:'center',gap:8,width:145,flexShrink:0},
  regionName: {fontFamily:"'Merriweather Sans',sans-serif",fontSize:'0.8rem',fontWeight:600,color:'rgba(255,255,255,0.75)'},
  track:      {height:26,background:'rgba(255,255,255,0.05)',borderRadius:4,position:'relative',overflow:'hidden'},
  vals:       {display:'flex',flexDirection:'column',alignItems:'flex-end',minWidth:90},
  pct:        {fontFamily:"'Merriweather Sans',sans-serif",fontSize:'1.05rem',fontWeight:800},
}
