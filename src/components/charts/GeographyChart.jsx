const REGION_COLORS = {
  'Europe': '#4ED596',
  'North America': '#E01B41',
  'Asia Pacific': '#5B8DEF',
  'Emerging Markets': '#F5A623',
  'Other': '#8A8A82',
}

// Simplified but recognisable world map paths
const WORLD_PATHS = {
  // North America
  northAmerica: "M 85,42 L 95,38 L 115,35 L 130,40 L 145,38 L 155,45 L 160,55 L 155,65 L 148,72 L 140,80 L 130,88 L 118,95 L 108,100 L 98,105 L 88,110 L 78,108 L 68,100 L 62,90 L 58,78 L 60,65 L 65,52 Z",
  // Greenland
  greenland: "M 148,18 L 162,15 L 175,18 L 178,26 L 172,32 L 160,34 L 150,30 L 145,24 Z",
  // Central America
  centralAmerica: "M 108,100 L 118,95 L 122,100 L 118,108 L 112,112 L 105,108 Z",
  // South America
  southAmerica: "M 118,108 L 130,110 L 142,112 L 148,120 L 150,132 L 148,148 L 142,162 L 132,172 L 120,175 L 110,168 L 104,155 L 100,140 L 100,125 L 105,115 L 112,110 Z",
  // Western Europe
  westEurope: "M 188,38 L 198,35 L 210,36 L 218,42 L 215,50 L 208,56 L 200,58 L 192,54 L 186,48 Z",
  // Eastern Europe / Russia west
  eastEurope: "M 210,36 L 228,33 L 245,30 L 258,32 L 265,40 L 260,50 L 248,54 L 235,56 L 220,54 L 212,48 Z",
  // Scandinavia
  scandinavia: "M 198,22 L 210,18 L 220,20 L 225,28 L 218,34 L 208,35 L 200,32 Z",
  // Russia
  russia: "M 245,30 L 265,40 L 285,35 L 310,32 L 335,30 L 355,35 L 360,44 L 345,52 L 320,55 L 295,54 L 270,52 L 258,50 L 252,42 Z",
  // Middle East
  middleEast: "M 225,58 L 242,55 L 255,58 L 260,66 L 255,74 L 244,78 L 232,75 L 222,68 Z",
  // Africa
  africa: "M 195,62 L 210,58 L 225,58 L 228,68 L 230,82 L 228,98 L 222,112 L 212,122 L 200,125 L 188,122 L 180,112 L 178,98 L 180,82 L 185,70 Z",
  // South Asia (India)
  southAsia: "M 268,58 L 280,55 L 292,58 L 295,68 L 290,78 L 280,85 L 268,82 L 262,72 Z",
  // Southeast Asia
  seAsia: "M 295,68 L 312,65 L 322,70 L 318,80 L 308,85 L 295,82 Z",
  // China / East Asia
  china: "M 292,38 L 315,32 L 335,30 L 348,36 L 348,48 L 335,55 L 315,58 L 295,55 L 286,48 Z",
  // Japan/Korea
  japanKorea: "M 348,36 L 358,34 L 365,38 L 362,46 L 354,50 L 346,46 Z",
  // Australia
  australia: "M 312,112 L 335,108 L 355,112 L 362,122 L 358,135 L 345,142 L 328,142 L 312,135 L 308,122 Z",
  // UK/Ireland
  uk: "M 185,36 L 192,34 L 196,38 L 192,44 L 185,44 Z",
}

// Map regions to path groups
const REGION_PATHS = {
  'North America': ['northAmerica', 'greenland', 'centralAmerica'],
  'Europe': ['westEurope', 'eastEurope', 'scandinavia', 'uk'],
  'Asia Pacific': ['russia', 'china', 'japanKorea', 'southAsia', 'seAsia', 'australia'],
  'Emerging Markets': ['southAmerica', 'africa', 'middleEast'],
}

export default function GeographyChart({ portfolio, scenario, showComparison, lang }) {
  const geoMap = {}
  portfolio.allocations.forEach(a => {
    if (a.geographic) {
      a.geographic.forEach(g => {
        geoMap[g.region] = (geoMap[g.region] || 0) + g.weight
      })
    }
  })

  const compGeoMap = {}
  if (showComparison && scenario?.comparison?.allocations) {
    portfolio.allocations.forEach(a => {
      const compAlloc = scenario.comparison.allocations.find(c => c.id === a.id)
      const geo = compAlloc?.geographic || a.geographic
      if (geo) {
        geo.forEach(g => {
          compGeoMap[g.region] = (compGeoMap[g.region] || 0) + g.weight
        })
      }
    })
  }

  const regions = Object.keys(REGION_COLORS)
    .map(r => ({
      id: r,
      color: REGION_COLORS[r],
      weight: geoMap[r] || 0,
      compWeight: showComparison ? (compGeoMap[r] || 0) : 0,
    }))
    .filter(r => r.weight > 0)

  const maxWeight = Math.max(...regions.map(r => r.weight), 1)

  function getRegionOpacity(regionId, weight) {
    const base = 0.12
    const max = 0.82
    return base + (weight / 100) * (max - base)
  }

  return (
    <div style={styles.container}>
      {/* World Map */}
      <div style={styles.mapWrap}>
        <div style={styles.mapLabel}>GLOBAL EXPOSURE</div>
        <svg
          viewBox="0 0 460 185"
          style={styles.mapSvg}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ocean background */}
          <rect x="0" y="0" width="460" height="185"
            fill="rgba(255,255,255,0.02)" rx="6" />

          {/* Grid lines */}
          {[46,92,138].map(y => (
            <line key={y} x1="0" y1={y} x2="460" y2={y}
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}
          {[92,184,276,368].map(x => (
            <line key={x} x1={x} y1="0" x2={x} y2="185"
              stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Render all paths, colored by region */}
          {Object.entries(REGION_PATHS).map(([region, pathIds]) => {
            const color = REGION_COLORS[region] || '#8A8A82'
            const weight = geoMap[region] || 0
            const opacity = getRegionOpacity(region, weight)
            return pathIds.map(pathId => (
              <path
                key={`${region}-${pathId}`}
                d={WORLD_PATHS[pathId]}
                fill={color}
                fillOpacity={opacity}
                stroke={color}
                strokeOpacity={weight > 0 ? 0.6 : 0.15}
                strokeWidth="0.8"
              />
            ))
          })}

          {/* Region weight labels on map */}
          {regions.map(r => {
            const labelPos = {
              'North America': { x: 108, y: 78 },
              'Europe': { x: 202, y: 48 },
              'Asia Pacific': { x: 318, y: 62 },
              'Emerging Markets': { x: 205, y: 115 },
            }
            const pos = labelPos[r.id]
            if (!pos) return null
            return (
              <g key={r.id}>
                <text x={pos.x} y={pos.y - 6} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="7.5" fontWeight="800" fill={r.color}
                  fillOpacity="0.9">
                  {r.id === 'Emerging Markets' ? 'EM' : r.id.replace(' ', '\n')}
                </text>
                <text x={pos.x} y={pos.y + 7} textAnchor="middle"
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="10" fontWeight="800" fill={r.color}>
                  {r.weight}%
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Bar chart breakdown */}
      <div style={styles.barsWrap}>
        <div style={styles.barsTitle}>REGIONAL BREAKDOWN</div>
        {regions.sort((a, b) => b.weight - a.weight).map(r => (
          <div key={r.id} style={styles.regionRow}>
            <div style={styles.regionLabel}>
              <div style={{ ...styles.regionDot, background: r.color }} />
              <span style={styles.regionName}>{r.id}</span>
            </div>
            <div style={styles.trackWrap}>
              <div style={styles.track}>
                {/* Comparison bar behind */}
                {showComparison && r.compWeight > 0 && (
                  <div style={{
                    ...styles.compBar,
                    width: `${(r.compWeight / maxWeight) * 100}%`,
                  }} />
                )}
                <div style={{
                  ...styles.bar,
                  width: `${(r.weight / maxWeight) * 100}%`,
                  background: r.color,
                }} />
              </div>
            </div>
            <div style={styles.regionVals}>
              <span style={{ ...styles.regionPct, color: r.color }}>
                {r.weight}%
              </span>
              {showComparison && r.compWeight > 0 && r.compWeight !== r.weight && (
                <span style={{
                  ...styles.compPct,
                  color: r.compWeight > r.weight ? '#4ED596' : '#E01B41',
                }}>
                  → {r.compWeight}%
                </span>
              )}
            </div>
          </div>
        ))}
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
    alignItems: 'center',
  },
  mapWrap: {
    flex: 1.4,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    height: '100%',
    justifyContent: 'center',
  },
  mapLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
  },
  mapSvg: {
    width: '100%',
    height: 'auto',
    maxHeight: '240px',
  },
  barsWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    justifyContent: 'center',
  },
  barsTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
    marginBottom: '4px',
  },
  regionRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  regionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    width: '140px',
    flexShrink: 0,
  },
  regionDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  regionName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
  },
  trackWrap: { flex: 1 },
  track: {
    height: '22px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: '4px', bottom: '4px', left: 0,
    borderRadius: '3px',
    opacity: 0.82,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 2,
  },
  compBar: {
    position: 'absolute',
    top: '4px', bottom: '4px', left: 0,
    borderRadius: '3px',
    background: 'rgba(78,213,150,0.4)',
    border: '1px solid rgba(78,213,150,0.6)',
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
    zIndex: 1,
  },
  regionVals: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    minWidth: '80px',
  },
  regionPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem',
    fontWeight: 800,
  },
  compPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 600,
  },
}
