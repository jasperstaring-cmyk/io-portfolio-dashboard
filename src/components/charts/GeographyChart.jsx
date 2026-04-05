import { T } from './chartTokens'
import { useEffect, useRef } from 'react'

// Categoriekleuren — neutraal, geen statusoordeel
// Rood en groen zijn GERESERVEERD voor compare/delta
const RC = {
  'Europe':          '#5B8DEF',
  'North America':   '#F5A623',
  'Asia Pacific':    '#A78BFA',
  'Emerging Markets':'#8A8A82',
}

// ISO 3166-1 numeric → regio mapping
// Europe (developed)
const EUROPE_IDS = new Set([
  8,20,40,56,70,100,112,191,196,203,208,233,246,250,276,
  300,348,352,372,380,428,438,442,470,492,499,528,578,616,
  620,642,703,705,724,752,756,826,831,832,833,
])
// North America
const NORTH_AMERICA_IDS = new Set([124,840,630])
// Asia Pacific (developed)
const ASIA_PACIFIC_IDS = new Set([36,344,356,392,410,446,458,554,608,702,704,764])
// Emerging Markets — LatAm, Afrika, ME, EM Azië, Oost-Europa buiten EU
const EMERGING_IDS = new Set([
  // Latin America
  32,68,76,152,170,188,192,214,218,222,320,332,340,484,558,591,600,604,858,862,
  // Africa
  12,24,72,108,120,132,140,148,174,178,180,204,226,231,232,
  266,288,324,384,404,426,430,450,454,466,478,508,516,562,566,
  646,686,694,706,710,716,728,732,768,800,818,834,854,894,
  // Middle East
  31,48,275,368,376,400,414,422,512,634,682,784,887,
  // EM Asia / Central Asia
  4,50,64,116,144,156,360,398,417,418,496,524,586,762,792,795,860,
  // Eastern Europe / Balkans buiten EU
  51,112,440,498,643,688,804,
])

// Antarctica landcode uitsluiten
const ANTARCTICA_ID = 10

function getRegion(numericId) {
  const n = parseInt(numericId)
  if (n === ANTARCTICA_ID) return null
  if (EUROPE_IDS.has(n))       return 'Europe'
  if (NORTH_AMERICA_IDS.has(n)) return 'North America'
  if (ASIA_PACIFIC_IDS.has(n)) return 'Asia Pacific'
  if (EMERGING_IDS.has(n))     return 'Emerging Markets'
  return null
}

// Bouw een regionaal gewichtenmap op basis van allocaties.
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

// Laad D3 + TopoJSON dynamisch (vermijdt bundler-issues in Vite/StackBlitz)
let d3Promise = null
let topojsonPromise = null
let worldPromise = null

function loadDeps() {
  if (!d3Promise) {
    d3Promise = import('https://cdn.jsdelivr.net/npm/d3@7/+esm')
  }
  if (!topojsonPromise) {
    topojsonPromise = import('https://cdn.jsdelivr.net/npm/topojson-client@3/+esm')
  }
  if (!worldPromise) {
    worldPromise = fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
  }
  return Promise.all([d3Promise, topojsonPromise, worldPromise])
}

export default function GeographyChart({ portfolio, comparisonPortfolio, showComparison }) {
  const svgRef = useRef(null)

  // baseMap: altijd berekend uit originele allocaties
  const baseMap = buildGeoMap(portfolio.allocations)
  const activeMap = portfolio.geoOverride ? portfolio.geoOverride : baseMap

  const compMap = {}
  if (showComparison && comparisonPortfolio?.allocations) {
    Object.assign(compMap, buildGeoMap(comparisonPortfolio.allocations))
  }

  const hasCompData = showComparison && Object.keys(compMap).length > 0
  const displayMap  = hasCompData ? compMap : activeMap

  // Regio's voor bar chart
  const regions = Object.keys(RC).map(r => ({
    id: r, color: RC[r],
    base:   Math.round((baseMap[r]   || 0) * 10) / 10,
    active: Math.round((displayMap[r] || 0) * 10) / 10,
    delta:  hasCompData
      ? Math.round(((compMap[r] || 0) - (baseMap[r] || 0)) * 10) / 10
      : Math.round(((activeMap[r] || 0) - (baseMap[r] || 0)) * 10) / 10,
  })).filter(r => r.base > 0)
    .sort((a, b) => b.base - a.base)

  const maxW = Math.max(...regions.map(r => Math.max(r.base, r.active)), 1)

  // Intensiteit op basis van gewicht: 0% → 0.08 (barely visible), 40% → 0.90
  function regionOpacity(regionName) {
    const w = displayMap[regionName] || 0
    if (w === 0) return 0.06
    const maxRegion = Math.max(...Object.values(displayMap).filter(v => v > 0), 1)
    return 0.18 + (w / maxRegion) * 0.70
  }

  // Teken kaart via D3 zodra SVG beschikbaar is
  useEffect(() => {
    if (!svgRef.current) return
    const svgEl = svgRef.current

    loadDeps().then(([d3, topojson, world]) => {
      if (!svgEl) return

      const W = 560, H = 290
      const svg = d3.select(svgEl)
        .attr('viewBox', `0 0 ${W} ${H}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')

      svg.selectAll('*').remove()

      const projection = d3.geoNaturalEarth1()
        .scale(98)
        .translate([W / 2 - 5, H / 2 + 12])

      const path = d3.geoPath(projection)
      const countries = topojson.feature(world, world.objects.countries)

      svg.selectAll('path.country')
        .data(countries.features)
        .join('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('fill', d => {
          const region = getRegion(d.id)
          if (!region) return 'rgba(255,255,255,0.00)'  // Antarctica → onzichtbaar
          return RC[region] || 'rgba(255,255,255,0.06)'
        })
        .attr('fill-opacity', d => {
          const region = getRegion(d.id)
          if (!region) return 0
          return regionOpacity(region)
        })
        .attr('stroke', '#0C182E')
        .attr('stroke-width', 0.45)
        .style('transition', 'fill-opacity 0.85s ease')

    }).catch(() => {
      // Stille fallback — kaart laadt niet, bars blijven zichtbaar
    })
  }, [JSON.stringify(displayMap)])

  // Update alleen opacities bij data-wijziging (geen volledige herrender)
  useEffect(() => {
    if (!svgRef.current) return
    const svgEl = svgRef.current

    import('https://cdn.jsdelivr.net/npm/d3@7/+esm').then(d3 => {
      d3.select(svgEl).selectAll('path.country')
        .attr('fill-opacity', d => {
          const region = getRegion(d?.id)
          if (!region) return 0
          return regionOpacity(region)
        })
    }).catch(() => {})
  }, [JSON.stringify(displayMap)])

  return (
    <div style={s.wrap}>
      {/* Kaart kolom */}
      <div style={s.mapCol}>
        <div style={s.label}>GLOBAL EXPOSURE{hasCompData ? ' — SCENARIO' : ''}</div>
        <div style={s.mapWrap}>
          <svg
            ref={svgRef}
            style={s.mapSvg}
            preserveAspectRatio="xMidYMid meet"
          />
        </div>
      </div>

      {/* Bar chart kolom */}
      <div style={s.barsCol}>
        <div style={s.label}>REGIONAL BREAKDOWN</div>
        {regions.map(r => {
          const hasDelta = hasCompData && r.delta !== 0
          return (
            <div key={r.id} style={s.regionRow}>
              <div style={s.regionLabel}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: r.color, flexShrink: 0,
                  boxShadow: `0 0 6px ${r.color}88`,
                }} />
                <span style={s.regionName}>{r.id}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.track}>
                  {showComparison && (
                    <div style={{
                      position: 'absolute', top: 4, bottom: 4, left: 0,
                      borderRadius: 3, background: r.color, opacity: 0.16,
                      width: `${(r.base / maxW) * 100}%`,
                    }} />
                  )}
                  <div style={{
                    position: 'absolute', top: 4, bottom: 4, left: 0,
                    borderRadius: 3, opacity: 0.85, zIndex: 2,
                    background: hasDelta
                      ? (r.delta > 0 ? '#E01B41' : '#4ED596')
                      : r.color,
                    width: `${(r.active / maxW) * 100}%`,
                    transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1),background 0.5s ease',
                    boxShadow: hasDelta
                      ? (r.delta > 0
                        ? '0 0 8px rgba(224,27,65,0.35)'
                        : '0 0 8px rgba(78,213,150,0.35)')
                      : 'none',
                  }} />
                </div>
              </div>
              <div style={s.vals}>
                <span style={{
                  ...s.pct,
                  color: hasDelta
                    ? (r.delta > 0 ? '#E01B41' : '#4ED596')
                    : r.color,
                  transition: 'color 0.5s ease',
                }}>
                  {r.active}%
                </span>
                {hasDelta && (
                  <span style={{
                    fontFamily: "'Merriweather Sans',sans-serif",
                    fontSize: T.small, fontWeight: T.wMedium,
                    color: r.delta > 0 ? '#E01B41' : '#4ED596',
                  }}>
                    {r.delta > 0 ? '+' : ''}{r.delta}%
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
  wrap:        { display: 'flex', gap: 40, height: '100%', width: '100%', alignItems: 'stretch' },
  mapCol:      { flex: 1.6, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0 },
  mapWrap:     { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  mapSvg:      { width: '100%', height: '100%', display: 'block' },
  barsCol:     { flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minWidth: 0 },
  label:       { fontFamily: "'Merriweather Sans',sans-serif", fontSize: T.micro, fontWeight: T.wMicro, color: T.faint, letterSpacing: '0.1em' },
  regionRow:   { display: 'flex', alignItems: 'center', gap: 12 },
  regionLabel: { display: 'flex', alignItems: 'center', gap: 8, width: 145, flexShrink: 0 },
  regionName:  { fontFamily: "'Merriweather Sans',sans-serif", fontSize: T.body, fontWeight: T.wBody, color: T.secondary },
  track:       { height: 26, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  vals:        { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 90 },
  pct:         { fontFamily: "'Merriweather Sans',sans-serif", fontSize: T.large, fontWeight: T.wHeavy },
}
