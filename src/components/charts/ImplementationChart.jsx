export default function ImplementationChart({ portfolio, scenario, showComparison }) {
  const impl = portfolio.implementation
  const compImpl = showComparison && scenario?.comparison?.implementation
  const costs = portfolio.costs
  const compCosts = showComparison && scenario?.comparison?.costs

  const current = compImpl || impl
  const activeCosts = compCosts || costs

  const items = [
    {
      id: 'active',
      label: 'Active Management',
      sublabel: 'Alpha-seeking, manager discretion',
      color: '#E01B41',
    },
    {
      id: 'passive',
      label: 'Passive / ETF',
      sublabel: 'Index-tracking, market beta',
      color: '#4ED596',
    },
    {
      id: 'individual',
      label: 'Individual Securities',
      sublabel: 'Direct stock & bond holdings',
      color: '#5B8DEF',
    },
  ]

  // Donut
  const cx = 130, cy = 130, r = 100, inner = 58
  let cum = -90

  function polarXY(angle, radius = r) {
    return {
      x: cx + radius * Math.cos(angle * Math.PI / 180),
      y: cy + radius * Math.sin(angle * Math.PI / 180),
    }
  }

  function arc(start, end, color, val) {
    if (val <= 0) return null
    const s = polarXY(start), e = polarXY(end)
    const large = end - start > 180 ? 1 : 0
    return (
      <path
        d={`M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${cx} ${cy} Z`}
        fill={color} opacity={0.85}
        stroke="#0C182E" strokeWidth="2.5" />
    )
  }

  const slices = items.map(item => {
    const val = current[item.id] || 0
    const angle = (val / 100) * 360
    const s = { ...item, val, startAngle: cum, endAngle: cum + angle }
    cum += angle
    return s
  })

  const terSaving = compCosts
    ? Math.abs(compCosts.weightedTer - costs.weightedTer).toFixed(2)
    : null

  return (
    <div style={styles.container}>
      {/* Donut */}
      <div style={styles.donutWrap}>
        <div style={styles.sectionTitle}>PORTFOLIO CONSTRUCTION</div>
        <svg width="260" height="260" viewBox="0 0 260 260">
          {/* Outer subtle ring */}
          <circle cx={cx} cy={cy} r={r + 10}
            fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="18" />
          {slices.map(s => arc(s.startAngle, s.endAngle, s.color, s.val))}
          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner - 1}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x={cx} y={cy - 10} textAnchor="middle"
            fontFamily="'Merriweather Sans'" fontSize="9"
            fontWeight="700" fill="rgba(255,255,255,0.35)" letterSpacing="0.08em">
            {compImpl ? 'SCENARIO' : 'CURRENT'}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle"
            fontFamily="'Merriweather', serif"
            fontSize="14" fontWeight="700" fill="white">
            mix
          </text>
        </svg>
      </div>

      {/* Breakdown bars */}
      <div style={styles.breakdownWrap}>
        <div style={styles.sectionTitle}>BREAKDOWN</div>
        {items.map(item => {
          const baseVal = impl[item.id] || 0
          const currVal = current[item.id] || 0
          const delta = currVal - baseVal

          return (
            <div key={item.id} style={styles.itemBlock}>
              <div style={styles.itemHeader}>
                <div style={styles.itemLabelGroup}>
                  <div style={{ ...styles.dot, background: item.color }} />
                  <div>
                    <div style={styles.itemLabel}>{item.label}</div>
                    <div style={styles.itemSublabel}>{item.sublabel}</div>
                  </div>
                </div>
                <div style={styles.itemVals}>
                  <span style={{ ...styles.itemPct, color: item.color }}>
                    {currVal}%
                  </span>
                  {compImpl && delta !== 0 && (
                    <span style={{
                      ...styles.itemDelta,
                      color: delta < 0 ? '#4ED596' : '#E01B41',
                      background: delta < 0
                        ? 'rgba(78,213,150,0.1)' : 'rgba(224,27,65,0.1)',
                    }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </div>
              </div>
              <div style={styles.track}>
                {compImpl && baseVal > 0 && (
                  <div style={{
                    ...styles.baseBar,
                    width: `${baseVal}%`,
                    background: item.color,
                    opacity: 0.25,
                  }} />
                )}
                <div style={{
                  ...styles.bar,
                  width: `${currVal}%`,
                  background: item.color,
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Cost impact */}
      <div style={styles.costWrap}>
        <div style={styles.sectionTitle}>COST IMPACT (TER)</div>
        <div style={styles.costCard}>
          <div style={styles.terDisplay}>
            <span style={styles.terLabel}>Weighted avg. TER</span>
            <span style={styles.terVal}>{activeCosts.weightedTer.toFixed(2)}%</span>
          </div>

          {compCosts && (
            <>
              <div style={styles.costDivider} />
              <div style={styles.savingRow}>
                <span style={styles.savingLabel}>
                  {compCosts.weightedTer < costs.weightedTer ? '↓ Annual saving' : '↑ Additional cost'}
                </span>
                <span style={{
                  ...styles.savingVal,
                  color: compCosts.weightedTer < costs.weightedTer ? '#4ED596' : '#E01B41',
                }}>
                  {terSaving}% p.a.
                </span>
              </div>
            </>
          )}

          <div style={styles.costDivider} />
          <div style={styles.exampleRow}>
            <span style={styles.exampleLabel}>On €1M portfolio</span>
            <span style={styles.exampleVal}>
              ~€{(activeCosts.weightedTer / 100 * 1000000).toLocaleString('nl-NL')}/yr
            </span>
          </div>

          {compCosts && (
            <div style={styles.exampleRow}>
              <span style={styles.exampleLabel}>vs current</span>
              <span style={{
                ...styles.exampleVal,
                color: compCosts.weightedTer < costs.weightedTer ? '#4ED596' : '#E01B41',
                fontSize: '0.8rem',
              }}>
                {compCosts.weightedTer < costs.weightedTer ? 'saves ' : 'costs '}
                €{Math.abs((compCosts.weightedTer - costs.weightedTer) / 100 * 1000000).toLocaleString('nl-NL')}/yr
              </span>
            </div>
          )}
        </div>
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
  donutWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flexShrink: 0,
  },
  sectionTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: '0.1em',
  },
  breakdownWrap: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    justifyContent: 'center',
  },
  itemBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  itemHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLabelGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  itemLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.88)',
  },
  itemSublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.3)',
  },
  itemVals: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  itemPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.1rem',
    fontWeight: 800,
  },
  itemDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 700,
    padding: '2px 7px',
    borderRadius: '4px',
  },
  track: {
    height: '8px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '4px',
    position: 'relative',
    overflow: 'hidden',
  },
  baseBar: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    borderRadius: '4px',
    transition: 'width 0.7s ease',
  },
  bar: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    borderRadius: '4px',
    opacity: 0.75,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
  },
  costWrap: {
    width: '220px',
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  costCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  terDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  terLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
  },
  terVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '2.2rem',
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1,
  },
  costDivider: {
    height: '1px',
    background: 'rgba(255,255,255,0.08)',
  },
  savingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  savingLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem',
    color: 'rgba(255,255,255,0.4)',
  },
  savingVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem',
    fontWeight: 800,
  },
  exampleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exampleLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.3)',
  },
  exampleVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
  },
}
