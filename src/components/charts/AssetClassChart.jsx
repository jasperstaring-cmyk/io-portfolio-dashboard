import { useState, useEffect, useRef } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'
import ExploreTotalBadge from './ExploreTotalBadge'

// Kleurlogica conform IO-stijl:
// Rood   = equities (dominant)
// Blauw  = fixed income
// Amber  = real estate
// Paars  = alternatives
// Wit    = cash
// Groen/Rood = GERESERVEERD voor compare delta
const COLORS = {
  equities:     '#E01B41',
  fixed_income: '#5B8DEF',
  real_estate:  '#F5A623',
  alternatives: '#A78BFA',
  cash:         'rgba(255,255,255,0.55)',
}

const GAP_DEG      = 1.4
const EXPLODE_SEL  = 22   // explode bij segment-selectie
const EXPLODE_COMP = 12   // explode alle segmenten bij compare
const VW = 680, VH = 460
const CX = VW / 2, CY = VH / 2 + 8
const R  = 152

// Callout-lijn afstanden
const R_EDGE = R + 14
const R_KNIK = R + 48
const H_EXT  = 46

// Veilige marges voor label-clamp (viewport-coördinaten)
const SAFE_LEFT = 22, SAFE_RIGHT = VW - 22
const SAFE_TOP  = 18, SAFE_BOTTOM = VH - 18

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function piePath(startDeg, endDeg, ex, ey) {
  const g       = GAP_DEG / 2
  const [x1,y1] = polar(CX + ex, CY + ey, R, startDeg + g)
  const [x2,y2] = polar(CX + ex, CY + ey, R, endDeg   - g)
  const large   = (endDeg - startDeg - GAP_DEG) > 180 ? 1 : 0
  return `M ${CX+ex},${CY+ey} L ${x1},${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
}

// Knik-lijn + label met viewport-clamp
function callout(midDeg, ex, ey) {
  const rad     = (midDeg - 90) * Math.PI / 180
  const goRight = Math.cos(rad) >= 0

  const p1 = polar(CX + ex, CY + ey, R_EDGE, midDeg)
  const p2 = polar(CX + ex, CY + ey, R_KNIK, midDeg)

  // Horizontale extensie, geclampt zodat label niet buiten viewport loopt
  const rawP3x = p2[0] + (goRight ? H_EXT : -H_EXT)
  const p3x    = Math.max(SAFE_LEFT + 60, Math.min(SAFE_RIGHT - 60, rawP3x))
  const p3     = [p3x, Math.max(SAFE_TOP + 24, Math.min(SAFE_BOTTOM - 36, p2[1]))]

  const actualRight = p3[0] > CX
  return {
    p1, p2, p3,
    anchor: actualRight ? 'start' : 'end',
    labelX: p3[0] + (actualRight ? 8 : -8),
    labelY: p3[1],
  }
}

// Delta-badge positie: net buiten segment, op mid-hoek
function deltaBadgePos(midDeg, ex, ey) {
  const r = R + 28
  const [bx, by] = polar(CX + ex, CY + ey, r, midDeg)
  return { bx, by }
}

export default function AssetClassChart({ portfolio, comparisonPortfolio, showComparison, framing, lang, exploreMode = false }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated,   setAnimated]   = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      setSelectedId(null)
      prevCompare.current = showComparison
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const allocations = portfolio.allocations

  // Explore gap detectie — som van ruwe current-waarden
  const rawSum = allocations.reduce((s, a) => s + (a.current || 0), 0)

  function getComp(id) {
    if (!showComparison || !comparisonPortfolio?.allocations) return null
    return comparisonPortfolio.allocations.find(a => a.id === id)?.current ?? null
  }

  const activeAllocs = allocations.map(a => {
    const comp = getComp(a.id)
    return { ...a, compVal: comp, displayVal: comp !== null ? comp : a.current }
  })

  const total = activeAllocs.reduce((s, a) => s + a.displayVal, 0)

  let cum = 0
  const slices = activeAllocs.map(a => {
    const deg   = (a.displayVal / total) * 360
    const start = cum, end = cum + deg, mid = (start + end) / 2
    cum += deg
    return { ...a, startDeg: start, endDeg: end, midDeg: mid, color: COLORS[a.id] }
  })

  const hasSelection = !!selectedId
  // Framing overschrijft label per asset class id voor deze use case
  const labelLang = a => {
    const catFraming = framing?.[a.id]
    const labelVal = catFraming?.label ?? a.label
    if (!labelVal) return a.id
    if (typeof labelVal === 'string') return labelVal
    return labelVal[lang] || labelVal.en || a.id
  }

  function statusInfo(a) {
    const val = a.displayVal
    if (val < a.min || val > a.max) return { label: 'Outside range', color: '#E01B41' }
    if (Math.abs(val - a.target) > 5) return { label: 'Off target', color: '#F5A623' }
    return { label: 'Within policy', color: '#4ED596' }
  }

  // Explode-offset per segment:
  // - compare aan: alle segmenten exploderen klein uit elkaar
  // - segment geselecteerd: dat segment explodeert verder
  function explodeOffset(sl) {
    const rad = (sl.midDeg - 90) * Math.PI / 180
    const isSelected = sl.id === selectedId

    if (isSelected) {
      // Selectie-explode domineert
      const dist = EXPLODE_SEL + (showComparison ? EXPLODE_COMP : 0)
      return { ex: Math.cos(rad) * dist, ey: Math.sin(rad) * dist }
    }
    if (showComparison) {
      // Compare: alle segmenten licht uit elkaar
      return { ex: Math.cos(rad) * EXPLODE_COMP, ey: Math.sin(rad) * EXPLODE_COMP }
    }
    return { ex: 0, ey: 0 }
  }

  return (
    <div style={{ ...s.wrap, position: 'relative' }}>
      <ExploreTotalBadge total={rawSum} label="Allocation" exploreMode={exploreMode} />
      <svg
        viewBox={`0 0 ${VW} ${VH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          ...s.svg,
          opacity:   animated ? 1 : 0,
          transform: animated ? 'scale(1)' : 'scale(0.93)',
          transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
          transformOrigin: 'center',
        }}
      >
        <defs>
          <radialGradient id="ac-bg-base" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#E01B41" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#E01B41" stopOpacity="0"    />
          </radialGradient>
          <radialGradient id="ac-bg-comp" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#4ED596" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#4ED596" stopOpacity="0"    />
          </radialGradient>
          {/* Diepte-schaduw filter onder de pie — iets sterker voor groot scherm */}
          <filter id="pie-depth" x="-20%" y="-15%" width="140%" height="145%">
            <feDropShadow dx="0" dy="14" stdDeviation="18" floodColor="#000000" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="5"  stdDeviation="6"  floodColor="#000000" floodOpacity="0.30" />
          </filter>
        </defs>

        {/* Klik buiten pie → deselecteer */}
        <rect
          x="0" y="0" width={VW} height={VH}
          fill="transparent"
          style={{ cursor: hasSelection ? 'default' : 'auto' }}
          onClick={() => setSelectedId(null)}
        />

        {/* Achtergrondgloed */}
        <circle cx={CX} cy={CY} r={R + 48}
          fill={showComparison ? 'url(#ac-bg-comp)' : 'url(#ac-bg-base)'}
          style={{ transition: 'fill 0.6s ease' }}
        />

        {/* Subtiele buitenring */}
        <circle cx={CX} cy={CY} r={R + 5}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5"
        />

        {/* Compare stippelring */}
        {showComparison && (
          <circle cx={CX} cy={CY} r={R + 7}
            fill="none"
            stroke="rgba(78,213,150,0.28)"
            strokeWidth="1.2"
            strokeDasharray="5 4"
          />
        )}

        {/* ── Pie segmenten — met diepte-filter ── */}
        <g filter="url(#pie-depth)">
          {slices.map(sl => {
            const { ex, ey } = explodeOffset(sl)
            const isSelected = sl.id === selectedId
            const dimmed     = hasSelection && !isSelected
            return (
              <path
                key={sl.id}
                d={piePath(sl.startDeg, sl.endDeg, ex, ey)}
                fill={sl.color}
                fillOpacity={dimmed ? 0.42 : showComparison ? 0.82 : 0.92}
                stroke="#0C182E"
                strokeWidth="1.0"
                style={{
                  cursor: 'pointer',
                  transition: 'all 0.45s cubic-bezier(0.4,0,0.2,1)',
                  filter: isSelected ? `drop-shadow(0 0 6px ${sl.color}44)` : 'none',
                }}
                onClick={() => setSelectedId(prev => prev === sl.id ? null : sl.id)}
                onMouseEnter={e => !hasSelection && showTooltip(e, {
                  label: labelLang(sl),
                  value: `${sl.displayVal}%`,
                  color: sl.color,
                })}
                onMouseLeave={hideTooltip}
              />
            )
          })}
        </g>

        {/* ── Delta-badges bij compare — buiten segmenten ── */}
        {showComparison && slices.map(sl => {
          const hasChange = sl.compVal !== null && sl.compVal !== sl.current
          if (!hasChange) return null
          const delta      = sl.compVal - sl.current
          const { ex, ey } = explodeOffset(sl)
          const { bx, by } = deltaBadgePos(sl.midDeg, ex, ey)
          const badgeColor = delta < 0 ? '#E01B41' : '#4ED596'
          const badgeText  = (delta > 0 ? '+' : '') + delta + '%'

          // Badge achtergrond rect (geclampt binnen viewport)
          const bw = 38, bh = 20
          const rx = Math.max(SAFE_LEFT, Math.min(SAFE_RIGHT - bw, bx - bw / 2))
          const ry = Math.max(SAFE_TOP,  Math.min(SAFE_BOTTOM - bh, by - bh / 2))

          return (
            <g key={sl.id + '-delta'} style={{ pointerEvents: 'none' }}>
              <rect
                x={rx} y={ry} width={bw} height={bh} rx="3"
                fill={badgeColor} fillOpacity="0.15"
                stroke={badgeColor} strokeWidth="0.8" strokeOpacity="0.6"
              />
              <text
                x={rx + bw / 2} y={ry + bh / 2 + 5}
                textAnchor="middle"
                fontFamily="'Merriweather Sans', sans-serif"
                fontSize="11" fontWeight="800"
                fill={badgeColor}
              >
                {badgeText}
              </text>
            </g>
          )
        })}

        {/* ── Callout lijntjes + labels ── */}
        {slices.map(sl => {
          const { ex, ey }                       = explodeOffset(sl)
          const { p1, p2, p3, anchor, labelX, labelY } = callout(sl.midDeg, ex, ey)
          const isSelected = sl.id === selectedId
          const isDimmed   = hasSelection && !isSelected
          const st         = statusInfo(sl)

          const lineStroke  = isSelected ? sl.color : 'rgba(255,255,255,0.40)'
          const lineW       = isSelected ? '1.0' : '0.7'
          const lineOpacity = isDimmed ? 0.07 : isSelected ? 0.75 : 0.32

          const pctSize  = isSelected ? 30 : 19
          const nameSize = isSelected ? 14 : 12

          const pctY    = labelY - 4
          const nameY   = labelY + nameSize + 4
          const statusY = nameY + 17

          return (
            <g
              key={sl.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setSelectedId(prev => prev === sl.id ? null : sl.id)}
            >
              <polyline
                points={`${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p3[0]},${p3[1]}`}
                fill="none"
                stroke={lineStroke}
                strokeWidth={lineW}
                strokeOpacity={lineOpacity}
                style={{ transition: 'all 0.35s ease' }}
              />

              {/* Percentage */}
              <text
                x={labelX} y={pctY}
                textAnchor={anchor}
                fontFamily="'Merriweather Sans', sans-serif"
                fontSize={pctSize} fontWeight="800"
                fill={sl.color}
                fillOpacity={isDimmed ? 0.14 : 1}
                style={{ transition: 'all 0.35s ease' }}
              >
                {sl.displayVal}%
              </text>

              {/* Naam */}
              <text
                x={labelX} y={nameY}
                textAnchor={anchor}
                fontFamily="'Merriweather Sans', sans-serif"
                fontSize={nameSize} fontWeight={isSelected ? '600' : '500'}
                fill="rgba(255,255,255,0.65)"
                fillOpacity={isDimmed ? 0.14 : 1}
                style={{ transition: 'all 0.35s ease' }}
              >
                {labelLang(sl)}
              </text>

              {/* Status pill — alleen bij selectie */}
              {isSelected && (
                <text
                  x={labelX} y={statusY}
                  textAnchor={anchor}
                  fontFamily="'Merriweather Sans', sans-serif"
                  fontSize="11" fontWeight="700"
                  fill={st.color}
                  letterSpacing="0.05em"
                >
                  {st.label}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100%', width: '100%',
  },
  svg: {
    width: '100%', height: '100%', display: 'block',
    overflow: 'visible',
  },
}
