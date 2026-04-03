import { useState, useEffect, useRef } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'

// Kleurlogica conform IO-stijl:
// Rood   = equities (dominant, grootste positie)
// Blauw  = fixed income
// Amber  = real estate
// Paars  = alternatives (gewijzigd van grijs — beter onderscheidbaar van cash)
// Wit    = cash (minste gewicht, minste kleur)
// Groen is GERESERVEERD voor compare/positieve delta — nooit voor asset class
const COLORS = {
  equities:     '#E01B41',
  fixed_income: '#5B8DEF',
  real_estate:  '#F5A623',
  alternatives: '#A78BFA',
  cash:         'rgba(255,255,255,0.55)',
}

const GAP_DEG  = 1.2   // gap tussen segmenten
const EXPLODE  = 18    // pixels uitspringen bij selectie
const CX = 160, CY = 160, R = 148

function polar(cx, cy, r, deg) {
  const rad = (deg - 90) * Math.PI / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function piePath(startDeg, endDeg, exploded, midDeg) {
  const g  = GAP_DEG / 2
  const ex = exploded ? Math.cos((midDeg - 90) * Math.PI / 180) * EXPLODE : 0
  const ey = exploded ? Math.sin((midDeg - 90) * Math.PI / 180) * EXPLODE : 0
  const [x1, y1] = polar(CX + ex, CY + ey, R, startDeg + g)
  const [x2, y2] = polar(CX + ex, CY + ey, R, endDeg   - g)
  const large = (endDeg - startDeg - GAP_DEG) > 180 ? 1 : 0
  return `M ${CX + ex},${CY + ey} L ${x1},${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`
}

export default function AssetClassChart({ portfolio, scenario, showComparison, lang }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated, setAnimated]   = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const prevCompare = useRef(showComparison)

  // Animatie bij mount en bij compare-toggle
  useEffect(() => {
    setAnimated(false)
    // Bij compare-toggle: reset selectie zodat de pie opnieuw animeert
    if (prevCompare.current !== showComparison) {
      setSelectedId(null)
      prevCompare.current = showComparison
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const allocations = portfolio.allocations

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.allocations) return null
    return scenario.comparison.allocations.find(a => a.id === id)?.current ?? null
  }

  const activeAllocs = allocations.map(a => {
    const comp = getComp(a.id)
    return { ...a, compVal: comp, displayVal: comp !== null ? comp : a.current }
  })

  const total = activeAllocs.reduce((s, a) => s + a.displayVal, 0)

  // Bouw pie-segmenten
  let cum = 0
  const slices = activeAllocs.map(a => {
    const deg    = (a.displayVal / total) * 360
    const start  = cum
    const end    = cum + deg
    const mid    = (start + end) / 2
    cum += deg
    return { ...a, startDeg: start, endDeg: end, midDeg: mid, color: COLORS[a.id] }
  })

  const selected = selectedId ? slices.find(s => s.id === selectedId) : null
  const hasSelection = !!selected

  function handleSegmentClick(id) {
    setSelectedId(prev => prev === id ? null : id)
  }

  // Status helper
  function statusColor(a) {
    const val = a.compVal !== null ? a.compVal : a.current
    if (val < a.min || val > a.max) return '#E01B41'
    if (Math.abs(val - a.target) > 5) return '#F5A623'
    return '#4ED596'
  }

  function statusLabel(a) {
    const val = a.compVal !== null ? a.compVal : a.current
    if (val < a.min)  return 'Below range'
    if (val > a.max)  return 'Above range'
    if (Math.abs(val - a.target) > 5) return 'Off target'
    return 'Within policy'
  }

  const labelLang = a => a.label?.[lang] || a.label?.en || a.id

  return (
    <div style={s.wrap}>

      {/* ── Pie ───────────────────────────────────────────────────────── */}
      <div style={s.pieCol}>
        <svg
          viewBox="0 0 320 320"
          preserveAspectRatio="xMidYMid meet"
          style={{
            ...s.svg,
            opacity:   animated ? 1 : 0,
            transform: animated ? 'scale(1)' : 'scale(0.92)',
            transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
            transformOrigin: 'center',
          }}
        >
          <defs>
            <radialGradient id="ac-glow-base" cx="50%" cy="50%" r="50%">
              <stop offset="20%" stopColor="#E01B41" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#E01B41" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="ac-glow-comp" cx="50%" cy="50%" r="50%">
              <stop offset="20%" stopColor="#4ED596" stopOpacity="0.07" />
              <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Achtergrondgloed */}
          <circle cx={CX} cy={CY} r={R + 24}
            fill={showComparison ? 'url(#ac-glow-comp)' : 'url(#ac-glow-base)'}
            style={{ transition: 'fill 0.6s ease' }}
          />

          {/* Subtiele buitenring */}
          <circle cx={CX} cy={CY} r={R + 6}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth="0.5"
          />

          {/* Compare-ring gestippeld groen */}
          {showComparison && (
            <circle cx={CX} cy={CY} r={R + 8}
              fill="none"
              stroke="rgba(78,213,150,0.40)"
              strokeWidth="1.5"
              strokeDasharray="6 4"
            />
          )}

          {/* Pie segmenten */}
          {slices.map(sl => {
            const exploded = sl.id === selectedId
            const dimmed   = hasSelection && !exploded
            return (
              <path
                key={sl.id}
                d={piePath(sl.startDeg, sl.endDeg, exploded, sl.midDeg)}
                fill={sl.color}
                fillOpacity={dimmed ? 0.22 : showComparison ? 0.80 : 0.90}
                stroke="#0C182E"
                strokeWidth="1"
                style={{
                  cursor: 'pointer',
                  transition: 'fill-opacity 0.35s ease, d 0.35s cubic-bezier(0.4,0,0.2,1)',
                  filter: exploded ? `drop-shadow(0 0 8px ${sl.color}88)` : 'none',
                }}
                onClick={() => handleSegmentClick(sl.id)}
                onMouseEnter={e => !hasSelection && showTooltip(e, {
                  label: labelLang(sl),
                  value: `${sl.displayVal}%`,
                  color: sl.color,
                  sub:   `Target: ${sl.target}%`,
                  delta: sl.compVal !== null && sl.compVal !== sl.current
                    ? `${sl.compVal > sl.current ? '+' : ''}${sl.compVal - sl.current}%`
                    : null,
                })}
                onMouseLeave={hideTooltip}
              />
            )
          })}
        </svg>
      </div>

      {/* ── Info paneel ───────────────────────────────────────────────── */}
      <div style={s.infoCol}>

        {/* ── OVERZICHT — geen selectie ── */}
        {!hasSelection && (
          <div style={s.overview}>
            <div style={s.overviewLabel}>ASSET CLASS</div>
            {slices.map(sl => {
              const hasChange = sl.compVal !== null && sl.compVal !== sl.current
              const delta     = hasChange ? sl.compVal - sl.current : 0
              return (
                <div
                  key={sl.id}
                  style={s.ovRow}
                  onClick={() => handleSegmentClick(sl.id)}
                >
                  <div style={{
                    ...s.ovDot,
                    background:  sl.color,
                    boxShadow:   `0 0 6px ${sl.color}66`,
                  }} />
                  <span style={s.ovName}>{labelLang(sl)}</span>
                  <span style={{
                    ...s.ovPct,
                    color: hasChange
                      ? delta < 0 ? '#4ED596' : '#E01B41'
                      : sl.color,
                    transition: 'color 0.4s ease',
                  }}>
                    {sl.displayVal}%
                  </span>
                  {hasChange && (
                    <span style={{
                      ...s.ovDelta,
                      color: delta < 0 ? '#4ED596' : '#E01B41',
                    }}>
                      {delta > 0 ? '+' : ''}{delta}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* ── DETAIL — segment geselecteerd ── */}
        {hasSelection && selected && (
          <div style={{
            ...s.detail,
            opacity:   animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(8px)',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
          }}>
            {/* Terugknop */}
            <button
              style={s.backBtn}
              onClick={() => setSelectedId(null)}
            >
              ← all categories
            </button>

            <div style={s.detailSublabel}>ASSET CLASS</div>

            {/* Groot percentage */}
            <div style={{
              ...s.detailPct,
              color: selected.color,
              transition: 'color 0.4s ease',
            }}>
              {selected.displayVal}%
            </div>

            <div style={s.detailName}>{labelLang(selected)}</div>

            {/* Target rij */}
            <div style={s.detailRow}>
              <span style={s.detailRowLabel}>TARGET</span>
              <span style={s.detailRowVal}>{selected.target}%</span>
            </div>

            {/* Status pill */}
            <div style={{
              ...s.statusPill,
              background: `${statusColor(selected)}18`,
              color:       statusColor(selected),
              boxShadow:  `0 0 12px ${statusColor(selected)}22`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: statusColor(selected),
                flexShrink: 0,
              }} />
              {statusLabel(selected)}
            </div>

            {/* Compare delta */}
            {showComparison && selected.compVal !== null && selected.compVal !== selected.current && (
              <div style={s.compareBlock}>
                <div style={s.compareBlockLabel}>SCENARIO SHIFT</div>
                <div style={{
                  ...s.compareDelta,
                  color: selected.compVal < selected.current ? '#4ED596' : '#E01B41',
                }}>
                  {selected.compVal > selected.current ? '+' : ''}
                  {selected.compVal - selected.current}%
                </div>
                <div style={s.compareFrom}>
                  was {selected.current}%
                  {' '}→{' '}
                  now {selected.compVal}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', alignItems: 'stretch',
    gap: 36, height: '100%', width: '100%',
  },
  pieCol: {
    flexShrink: 0, width: '44%', maxWidth: 340,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 0,
  },
  svg: { width: '100%', height: '100%', display: 'block' },

  // Info kolom
  infoCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', minWidth: 0,
  },

  // Overzicht
  overview: { display: 'flex', flexDirection: 'column', gap: 10 },
  overviewLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    marginBottom: 6,
  },
  ovRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    cursor: 'pointer', padding: '6px 4px', borderRadius: 4,
    transition: 'background 0.2s ease',
  },
  ovDot: {
    width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
  },
  ovName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.72)', flex: 1,
  },
  ovPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.1rem', fontWeight: 800,
    minWidth: 48, textAlign: 'right',
  },
  ovDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 700,
    minWidth: 36, textAlign: 'right',
  },

  // Detail
  detail: {
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  backBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
    color: 'rgba(255,255,255,0.30)',
    padding: '0 0 14px 0', textAlign: 'left',
    transition: 'color 0.2s ease',
  },
  detailSublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em',
    marginBottom: 8,
  },
  detailPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '4.2rem', fontWeight: 800, lineHeight: 1,
    marginBottom: 2,
  },
  detailName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.62)', marginBottom: 18,
  },
  detailRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
  },
  detailRowLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
    color: 'rgba(255,255,255,0.30)', width: 56,
  },
  detailRowVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.55)',
  },
  statusPill: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em',
    padding: '5px 12px', borderRadius: 3,
    alignSelf: 'flex-start', marginTop: 12,
  },

  // Compare block
  compareBlock: {
    marginTop: 20, paddingTop: 16,
    borderTop: '0.5px solid rgba(255,255,255,0.08)',
  },
  compareBlockLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.25)', letterSpacing: '0.10em',
    marginBottom: 4,
  },
  compareDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.1,
  },
  compareFrom: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 400,
    color: 'rgba(255,255,255,0.30)', marginTop: 4,
  },
}
