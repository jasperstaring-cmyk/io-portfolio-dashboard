import { T } from './chartTokens'
import { useState, useEffect, useRef } from 'react'

const STYLES    = ['Value', 'Blend', 'Growth']
const CAP_SIZES = ['Large', 'Mid', 'Small']

// Heatmap kleur: licht bij laag gewicht, intens bij hoog gewicht
// Geen groen/rood — die zijn gereserveerd voor compare delta
function heatColor(weight, max) {
  const t = max > 0 ? Math.min(weight / max, 1) : 0
  if (t < 0.25) return `rgba(91,141,239,${0.14 + t * 0.9})`
  if (t < 0.60) return `rgba(167,139,250,${0.22 + t * 0.65})`
  return `rgba(245,166,35,${0.28 + (t - 0.60) * 0.95})`
}

export default function StyleChart({ portfolio, comparisonPortfolio, showComparison }) {
  const [animated, setAnimated] = useState(false)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) prevCompare.current = showComparison
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const styleData = portfolio.style?.matrix || []

  function getComp(id) {
    if (!showComparison || !comparisonPortfolio?.style) return null
    const found = comparisonPortfolio.style.find(s => s.id === id)
    return found != null ? found.weight : null
  }

  const active = styleData.map(cell => {
    const comp = getComp(cell.id)
    const displayVal = comp !== null ? comp : cell.weight
    const delta = comp !== null ? comp - cell.weight : 0
    return {
      ...cell,
      compVal: comp,
      displayVal,
      delta,
      hasChange: showComparison && comp !== null && delta !== 0,
    }
  })

  const maxCell = Math.max(...active.map(c => c.displayVal), 1)

  const colTotals = STYLES.map(style =>
    active.filter(c => c.style === style).reduce((s, c) => s + c.displayVal, 0)
  )
  const baseColTotals = STYLES.map(style =>
    active.filter(c => c.style === style).reduce((s, c) => s + c.weight, 0)
  )
  const rowTotals = CAP_SIZES.map(cap =>
    active.filter(c => c.capSize === cap).reduce((s, c) => s + c.displayVal, 0)
  )

  function getCell(cap, style) {
    return active.find(c => c.capSize === cap && c.style === style)
  }

  const growthTilt     = colTotals[2] - colTotals[0]
  const baseGrowthTilt = baseColTotals[2] - baseColTotals[0]
  const tiltDelta      = showComparison ? growthTilt - baseGrowthTilt : 0
  const largeCap       = rowTotals[0]

  function tiltLabel(tilt) {
    if (Math.abs(tilt) < 5) return 'Balanced'
    return tilt > 0 ? `Growth +${tilt}%` : `Value +${Math.abs(tilt)}%`
  }

  return (
    <div style={s.wrap}>

      <div style={s.sublabel}>STYLE BOX</div>

      {/* Kolomheaders */}
      <div style={s.colHeaders}>
        <div style={s.rowHeaderSpacer} />
        {STYLES.map(style => (
          <div key={style} style={s.colHeader}>{style}</div>
        ))}
      </div>

      {/* Matrix rijen */}
      <div style={s.matrixBody}>
        {CAP_SIZES.map((cap, ri) => (
          <div key={cap} style={s.matrixRow}>
            <div style={s.rowHeader}>{cap}</div>

            {STYLES.map(style => {
              const cell = getCell(cap, style)
              const val  = cell?.displayVal || 0
              const base = cell?.weight     || 0
              const delta = cell?.delta     || 0
              const hasChange = cell?.hasChange || false
              const dColor = delta < 0 ? '#E01B41' : '#4ED596'

              return (
                <div key={`${cap}-${style}`} style={{
                  ...s.cell,
                  background: hasChange
                    ? `linear-gradient(${heatColor(val, maxCell)}, ${heatColor(val, maxCell)}), ${delta > 0 ? 'rgba(78,213,150,0.10)' : 'rgba(224,27,65,0.10)'}`
                    : heatColor(val, maxCell),
                  boxShadow: hasChange
                    ? `inset 0 0 0 2px ${delta > 0 ? 'rgba(78,213,150,0.55)' : 'rgba(224,27,65,0.55)'}`
                    : 'inset 0 0 0 1px rgba(255,255,255,0.07)',
                  outline: 'none',
                  opacity:   animated ? 1 : 0.4,
                  transform: animated ? 'scale(1)' : 'scale(0.94)',
                  transition: 'background 0.7s ease, box-shadow 0.4s ease, opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.26,0.64,1)',
                }}>
                  {/* Percentage groot */}
                  <div style={s.cellVal}>{val}%</div>

                  {/* Delta */}
                  <div style={s.cellDeltaSlot}>
                    {hasChange && (
                      <span style={{
                        fontFamily: "'Merriweather Sans', sans-serif",
                        fontSize: T.large, fontWeight: T.wHeavy,
                        color: delta > 0 ? '#4ED596' : '#E01B41',
                        lineHeight: 1,
                      }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* Tiltkaarten onderaan */}
      <div style={s.tiltRow}>
        <div style={s.tiltCard}>
          <div style={s.tiltLabel}>STYLE TILT</div>
          <div style={s.tiltValue}>{tiltLabel(growthTilt)}</div>
          <div style={s.tiltDeltaSlot}>
            {showComparison && tiltDelta !== 0 && (
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: T.medium, fontWeight: T.wHeavy,
                color: tiltDelta < 0 ? '#E01B41' : '#4ED596',
              }}>
                {tiltDelta > 0 ? '+' : ''}{tiltDelta}% vs base
              </span>
            )}
          </div>
        </div>

        <div style={s.tiltCard}>
          <div style={s.tiltLabel}>LARGE CAP</div>
          <div style={s.tiltValue}>{largeCap}%</div>
          <div style={s.tiltDeltaSlot} />
        </div>
      </div>

    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    height: '100%', width: '100%',
    justifyContent: 'center', gap: 0,
  },
  sublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMicro,
    color: T.faint, letterSpacing: '0.1em',
    marginBottom: 10, flexShrink: 0,
  },
  colHeaders: {
    display: 'flex', gap: 6, marginBottom: 6, flexShrink: 0,
  },
  rowHeaderSpacer: {
    width: 52, flexShrink: 0,
  },
  colHeader: {
    flex: 1,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.body, fontWeight: T.wMedium,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  matrixBody: {
    display: 'flex', flexDirection: 'column',
    gap: 6, flex: 1, minHeight: 0,
  },
  matrixRow: {
    display: 'flex', gap: 6, flex: 1,
  },
  rowHeader: {
    width: 52, flexShrink: 0,
    display: 'flex', alignItems: 'center',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.body, fontWeight: T.wMedium,
    color: 'rgba(255,255,255,0.55)',
  },
  cell: {
    flex: 1,
    borderRadius: 8,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: 0,
    minHeight: 0,
    cursor: 'default',
  },
  cellVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.xlarge, fontWeight: T.wHeavy,
    color: 'rgba(255,255,255,0.88)', lineHeight: 1,
  },
  cellDeltaSlot: {
    height: 28,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Merriweather Sans', sans-serif",
  },
  tiltRow: {
    display: 'flex', gap: 12,
    marginTop: 12, flexShrink: 0,
  },
  tiltCard: {
    flex: 1, padding: '12px 18px',
    background: 'rgba(255,255,255,0.04)',
    border: '0.5px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  tiltLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMicro,
    color: T.faint, letterSpacing: '0.1em',
    marginBottom: 4,
  },
  tiltValue: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.xlarge, fontWeight: T.wHeavy,
    color: 'rgba(255,255,255,0.82)',
  },
  tiltDeltaSlot: {
    height: 22,
    display: 'flex', alignItems: 'center',
    marginTop: 3,
  },
}
