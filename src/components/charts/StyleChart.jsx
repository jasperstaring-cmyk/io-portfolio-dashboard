import { useState, useEffect } from 'react'
import ChartTooltip, { useTooltip } from './ChartTooltip'

const STYLES   = ['Value', 'Blend', 'Growth']
const CAP_SIZES = ['Large', 'Mid', 'Small']

// Stijlkleuren — neutraal, geen statusoordeel
// Value/Blend/Growth zijn stijlkeuzes, niet goed/slecht
// Groen (#4ED596) is GERESERVEERD voor compare/delta
const STYLE_COLORS = {
  Value:  '#5B8DEF',  // blauw
  Blend:  '#F5A623',  // amber
  Growth: '#A78BFA',  // paars
}

const CAP_COLORS = {
  Large: '#5B8DEF',   // blauw — grootste
  Mid:   '#F5A623',   // amber — midden
  Small: '#8A8A82',   // grijs — kleinste
}

// Heatmap: blauw→amber intensiteit op basis van gewicht
// Geen groen/rood — die zijn voor statusoordelen
function heatColor(weight, max) {
  const t = max > 0 ? Math.min(weight / max, 1) : 0
  if (t < 0.25)
    return `rgba(91,141,239,${0.12 + t * 0.8})`   // licht blauw
  if (t < 0.60)
    return `rgba(167,139,250,${0.20 + t * 0.65})`  // paars
  return `rgba(245,166,35,${0.25 + (t - 0.60) * 0.9})`  // amber — dominant
}

export default function StyleChart({ portfolio, scenario, showComparison, lang }) {
  const { tooltip, showTooltip, hideTooltip } = useTooltip()
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const styleData = portfolio.style?.matrix || []

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.style) return null
    const found = scenario.comparison.style.find(s => s.id === id)
    return found != null ? found.weight : null
  }

  const active = styleData.map(cell => {
    const comp = getComp(cell.id)
    return { ...cell, compVal: comp, displayVal: comp !== null ? comp : cell.weight }
  })

  const maxCell   = Math.max(...active.map(c => c.displayVal), 1)
  const colTotals = STYLES.map(style =>
    active.filter(c => c.style === style).reduce((s, c) => s + c.displayVal, 0)
  )
  const rowTotals = CAP_SIZES.map(cap =>
    active.filter(c => c.capSize === cap).reduce((s, c) => s + c.displayVal, 0)
  )
  const maxSummary = Math.max(...colTotals, ...rowTotals, 1)

  function getCell(cap, style) {
    return active.find(c => c.capSize === cap && c.style === style)
  }

  const growthTilt = colTotals[2] - colTotals[0]
  const largeTilt  = rowTotals[0]

  // Stijltilt: neutraal wit, niet rood/groen
  // (growth vs value is een keuze, geen fout)
  const tiltColor = 'rgba(255,255,255,0.82)'

  return (
    <div style={s.wrap}>

      {/* ── Stijlmatrix ───────────────────────────────────────────────── */}
      <div style={s.matrixCol}>
        <div style={s.matrixLabel}>STYLE BOX</div>

        <div style={s.matrixGrid}>
          <div style={s.cornerCell} />
          {STYLES.map(style => (
            <div key={style} style={s.colHeader}>{style}</div>
          ))}

          {CAP_SIZES.map(cap => (
            <>
              <div key={cap} style={s.rowHeader}>{cap}</div>
              {STYLES.map(style => {
                const cell    = getCell(cap, style)
                const val     = cell?.displayVal || 0
                const base    = cell?.weight || 0
                const comp    = cell?.compVal
                const hasChange = comp !== null && comp !== base
                const delta   = hasChange ? comp - base : 0

                return (
                  <div
                    key={`${cap}-${style}`}
                    style={{
                      ...s.cell,
                      background: heatColor(val, maxCell),
                      // Compare-outline: groen/rood alleen voor delta
                      outline: hasChange
                        ? `2px solid ${delta > 0 ? '#E01B41' : '#4ED596'}`
                        : '1px solid rgba(255,255,255,0.08)',
                      opacity:   animated ? 1 : 0.4,
                      transform: animated ? 'scale(1)' : 'scale(0.94)',
                      transition: 'background 0.7s ease, outline 0.3s ease, opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.26,0.64,1)',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={e => showTooltip(e, {
                      label: `${cap} ${style}`,
                      value: `${val}%`,
                      sub:   hasChange ? `Base: ${base}%` : null,
                      delta: hasChange ? `${delta > 0 ? '+' : ''}${delta}%` : null,
                    })}
                    onMouseLeave={hideTooltip}
                  >
                    <span style={s.cellVal}>{val}%</span>
                    {hasChange && (
                      <span style={{
                        ...s.cellDelta,
                        color: delta > 0 ? '#E01B41' : '#4ED596',
                      }}>
                        {delta > 0 ? '+' : ''}{delta}
                      </span>
                    )}
                  </div>
                )
              })}
            </>
          ))}
        </div>

        {/* Tiltkaarten — neutraal wit */}
        <div style={s.tiltRow}>
          <div style={s.tiltCard}>
            <div style={s.tiltLabel}>STYLE TILT</div>
            <div style={{ ...s.tiltValue, color: tiltColor }}>
              {Math.abs(growthTilt) < 5
                ? 'Balanced'
                : growthTilt > 0
                  ? `Growth +${growthTilt}%`
                  : `Value +${Math.abs(growthTilt)}%`}
            </div>
          </div>
          <div style={s.tiltCard}>
            <div style={s.tiltLabel}>LARGE CAP</div>
            <div style={{ ...s.tiltValue, color: tiltColor }}>{largeTilt}%</div>
          </div>
        </div>
      </div>

      {/* ── Samenvatting bars ─────────────────────────────────────────── */}
      <div style={s.barsCol}>

        <div style={s.barSection}>
          <div style={s.barSectionLabel}>BY STYLE</div>
          {STYLES.map((style, i) => (
            <div key={style} style={s.barRow}>
              <div style={s.barLabelWrap}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: STYLE_COLORS[style], flexShrink: 0,
                  boxShadow: `0 0 5px ${STYLE_COLORS[style]}88`,
                }} />
                <span style={s.barLabel}>{style}</span>
              </div>
              <div style={s.track}>
                <div style={{
                  position: 'absolute', top: 4, bottom: 4, left: 0,
                  borderRadius: 3, opacity: 0.82,
                  width: `${(colTotals[i] / maxSummary) * 100}%`,
                  background: STYLE_COLORS[style],
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <span style={s.barVal}>{colTotals[i]}%</span>
            </div>
          ))}
        </div>

        <div style={s.barDivider} />

        <div style={s.barSection}>
          <div style={s.barSectionLabel}>BY MARKET CAP</div>
          {CAP_SIZES.map((cap, i) => (
            <div key={cap} style={s.barRow}>
              <div style={s.barLabelWrap}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: CAP_COLORS[cap], flexShrink: 0,
                  boxShadow: `0 0 5px ${CAP_COLORS[cap]}88`,
                }} />
                <span style={s.barLabel}>{cap} cap</span>
              </div>
              <div style={s.track}>
                <div style={{
                  position: 'absolute', top: 4, bottom: 4, left: 0,
                  borderRadius: 3, opacity: 0.82,
                  width: `${(rowTotals[i] / maxSummary) * 100}%`,
                  background: CAP_COLORS[cap],
                  transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                }} />
              </div>
              <span style={s.barVal}>{rowTotals[i]}%</span>
            </div>
          ))}
        </div>

        {showComparison && scenario?.comparison && (
          <>
            <div style={s.barDivider} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
              <div style={{ width: 16, height: 8, background: 'rgba(78,213,150,0.42)', border: '1px solid rgba(78,213,150,0.65)', borderRadius: 2 }} />
              <span style={{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.30)' }}>
                {scenario.comparison.label?.en || 'Alternative'}
              </span>
            </div>
          </>
        )}
      </div>

      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}

const s = {
  wrap:           { display: 'flex', alignItems: 'stretch', gap: 48, height: '100%', width: '100%' },
  matrixCol:      { flexShrink: 0, width: '44%', display: 'flex', flexDirection: 'column', gap: 14, justifyContent: 'center' },
  matrixLabel:    { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em' },
  matrixGrid:     { display: 'grid', gridTemplateColumns: '52px 1fr 1fr 1fr', gridTemplateRows: '28px repeat(3, 1fr)', gap: 6, flex: 1, minHeight: 0 },
  cornerCell:     { background: 'none' },
  colHeader:      { display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', fontWeight: 800, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.06em' },
  rowHeader:      { display: 'flex', alignItems: 'center', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)' },
  cell:           { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 6, gap: 2, minHeight: 52 },
  cellVal:        { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 800, color: 'rgba(255,255,255,0.90)' },
  cellDelta:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.6rem', fontWeight: 700 },
  tiltRow:        { display: 'flex', gap: 10 },
  tiltCard:       { flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '8px 12px', textAlign: 'center' },
  tiltLabel:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.54rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 3 },
  tiltValue:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 800 },
  barsCol:        { flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8, minWidth: 0 },
  barSection:     { display: 'flex', flexDirection: 'column', gap: 8 },
  barSectionLabel:{ fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 2 },
  barRow:         { display: 'flex', alignItems: 'center', gap: 12 },
  barLabelWrap:   { display: 'flex', alignItems: 'center', gap: 7, width: 80, flexShrink: 0 },
  barLabel:       { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.70)' },
  track:          { flex: 1, height: 24, background: 'rgba(255,255,255,0.05)', borderRadius: 4, position: 'relative', overflow: 'hidden' },
  barVal:         { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.82rem', fontWeight: 800, color: 'rgba(255,255,255,0.88)', width: 36, textAlign: 'right' },
  barDivider:     { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' },
}
