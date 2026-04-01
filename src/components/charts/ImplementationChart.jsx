export default function ImplementationChart({ portfolio, scenario, showComparison }) {
  const impl = portfolio.implementation
  const compImpl = showComparison && scenario?.comparison?.implementation
  const costs = portfolio.costs
  const compCosts = showComparison && scenario?.comparison?.costs
  const active = compImpl || impl
  const activeCosts = compCosts || costs

  const items = [
    { id: 'active', label: 'Active Management', sub: 'Alpha-seeking, manager discretion', color: '#E01B41' },
    { id: 'passive', label: 'Passive / ETF', sub: 'Index-tracking, market beta', color: '#4ED596' },
    { id: 'individual', label: 'Individual Securities', sub: 'Direct stock & bond holdings', color: '#5B8DEF' },
  ]

  const cx = 140, cy = 140, r = 110, inner = 60
  let cum = -90

  function pt(angle) {
    return { x: cx + r * Math.cos(angle*Math.PI/180), y: cy + r * Math.sin(angle*Math.PI/180) }
  }

  const slices = items.map(item => {
    const val = active[item.id] || 0
    const angle = (val / 100) * 360
    const sl = { ...item, val, start: cum, end: cum + angle }
    cum += angle
    return sl
  })

  return (
    <div style={s.wrap}>
      {/* Donut */}
      <div style={s.donutCol}>
        <div style={s.label}>PORTFOLIO CONSTRUCTION</div>
        <svg viewBox="0 0 280 280" style={s.donutSvg}>
          <circle cx={cx} cy={cy} r={r+10}
            fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="18" />
          {slices.map(sl => {
            if (sl.val <= 0) return null
            const a = pt(sl.start), b = pt(sl.end)
            const large = sl.end - sl.start > 180 ? 1 : 0
            return (
              <path key={sl.id}
                d={`M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} L ${cx} ${cy} Z`}
                fill={sl.color} opacity={0.86}
                stroke="#0C182E" strokeWidth="2.5" />
            )
          })}
          <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
          <circle cx={cx} cy={cy} r={inner-1}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
          <text x={cx} y={cy-8} textAnchor="middle"
            fontFamily="'Merriweather Sans'" fontSize="10"
            fontWeight="700" fill="rgba(255,255,255,0.32)" letterSpacing="1">
            {compImpl ? 'SCENARIO' : 'CURRENT'}
          </text>
          <text x={cx} y={cy+14} textAnchor="middle"
            fontFamily="'Merriweather', serif"
            fontSize="15" fontWeight="700" fill="white">mix</text>
        </svg>
      </div>

      {/* Breakdown */}
      <div style={s.breakdownCol}>
        <div style={s.label}>BREAKDOWN</div>
        {items.map(item => {
          const base = impl[item.id] || 0
          const curr = active[item.id] || 0
          const delta = curr - base
          return (
            <div key={item.id} style={s.itemBlock}>
              <div style={s.itemRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 11, height: 11, borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                  <div>
                    <div style={s.itemLabel}>{item.label}</div>
                    <div style={s.itemSub}>{item.sub}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ ...s.itemPct, color: item.color }}>{curr}%</span>
                  {compImpl && delta !== 0 && (
                    <span style={{
                      ...s.delta,
                      color: delta < 0 ? '#4ED596' : '#E01B41',
                      background: delta < 0 ? 'rgba(78,213,150,0.1)' : 'rgba(224,27,65,0.1)',
                    }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </div>
              </div>
              <div style={s.track}>
                {compImpl && base > 0 && (
                  <div style={{ ...s.baseBar, width: `${base}%`, background: item.color }} />
                )}
                <div style={{ ...s.bar, width: `${curr}%`, background: item.color }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Cost card */}
      <div style={s.costCol}>
        <div style={s.label}>COST IMPACT (TER)</div>
        <div style={s.costCard}>
          <div>
            <div style={s.terLabel}>Weighted avg. TER</div>
            <div style={s.terVal}>{activeCosts.weightedTer.toFixed(2)}%</div>
          </div>

          {compCosts && (
            <>
              <div style={s.divider} />
              <div style={s.savingRow}>
                <span style={s.savingLabel}>
                  {compCosts.weightedTer < costs.weightedTer ? '↓ Annual saving' : '↑ Extra cost'}
                </span>
                <span style={{
                  ...s.savingVal,
                  color: compCosts.weightedTer < costs.weightedTer ? '#4ED596' : '#E01B41',
                }}>
                  {Math.abs(compCosts.weightedTer - costs.weightedTer).toFixed(2)}% p.a.
                </span>
              </div>
            </>
          )}

          <div style={s.divider} />
          <div style={s.exRow}>
            <span style={s.exLabel}>On €1M portfolio</span>
            <span style={s.exVal}>
              ~€{(activeCosts.weightedTer / 100 * 1_000_000).toLocaleString('nl-NL')}/yr
            </span>
          </div>

          {compCosts && (
            <div style={s.exRow}>
              <span style={s.exLabel}>vs current</span>
              <span style={{
                ...s.exVal, fontSize: '0.78rem',
                color: compCosts.weightedTer < costs.weightedTer ? '#4ED596' : '#E01B41',
              }}>
                {compCosts.weightedTer < costs.weightedTer ? 'saves ' : 'costs '}
                €{Math.abs((compCosts.weightedTer - costs.weightedTer) / 100 * 1_000_000).toLocaleString('nl-NL')}/yr
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', gap: 36,
    height: '100%', width: '100%',
    alignItems: 'center',
  },
  donutCol: {
    flexShrink: 0, width: '30%', maxWidth: 280,
    display: 'flex', flexDirection: 'column',
    gap: 8, height: '100%', justifyContent: 'center',
  },
  donutSvg: {
    width: '100%', height: 'auto', maxHeight: '260px',
  },
  breakdownCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 16, justifyContent: 'center',
  },
  costCol: {
    width: 220, flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 10,
  },
  label: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
  },
  itemBlock: {
    display: 'flex', flexDirection: 'column', gap: 7,
  },
  itemRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  itemLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)',
  },
  itemSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)',
  },
  itemPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.1rem', fontWeight: 800,
  },
  delta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 700,
    padding: '2px 7px', borderRadius: 4,
  },
  track: {
    height: 10,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 5, position: 'relative', overflow: 'hidden',
  },
  baseBar: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    borderRadius: 5, opacity: 0.22,
    transition: 'width 0.7s ease',
  },
  bar: {
    position: 'absolute', top: 0, bottom: 0, left: 0,
    borderRadius: 5, opacity: 0.75,
    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
  },
  costCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, padding: '18px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  terLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)',
    marginBottom: 4,
  },
  terVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '2.4rem', fontWeight: 700, color: '#FFFFFF', lineHeight: 1,
  },
  divider: { height: 1, background: 'rgba(255,255,255,0.08)' },
  savingRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  savingLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)',
  },
  savingVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 800,
  },
  exRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  exLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.3)',
  },
  exVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.68)',
  },
}
