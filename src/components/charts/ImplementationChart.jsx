import { useState, useEffect } from 'react'

// Categoriekleuren — neutraal, geen statusoordeel
// Active/Passive/Individual zijn implementatiekeuzes, niet goed/slecht
// Groen (#4ED596) is GERESERVEERD voor compare/delta
const IMPL_COLORS = {
  active:     '#E01B41',  // rood — dominant, grootste categorie in de meeste portefeuilles
  passive:    '#5B8DEF',  // blauw — tweede categorie
  individual: '#F5A623',  // amber — kleinste categorie
}

export default function ImplementationChart({ portfolio, scenario, showComparison }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const impl = portfolio.implementation
  const compImpl  = showComparison ? scenario?.comparison?.implementation : null
  const costs     = portfolio.costs
  const compCosts = showComparison ? scenario?.comparison?.costs : null

  const active      = compImpl  || impl
  const activeCosts = compCosts || costs

  const items = [
    { id: 'active',     label: 'Active Management',    sub: 'Alpha-seeking, manager discretion',  color: IMPL_COLORS.active },
    { id: 'passive',    label: 'Passive / ETF',         sub: 'Index-tracking, market beta',         color: IMPL_COLORS.passive },
    { id: 'individual', label: 'Individual Securities', sub: 'Direct stock & bond holdings',        color: IMPL_COLORS.individual },
  ]

  // Arc-donut — zelfde techniek als AssetClassChart
  const cx = 130, cy = 130, R = 96, STROKE = 24, inner = R - STROKE / 2 - 2
  const GAP_DEG = 1.4

  function arcParams(startDeg, endDeg) {
    const gapRad = (GAP_DEG / 2) * Math.PI / 180
    const startRad = (startDeg - 90) * Math.PI / 180 + gapRad
    const endRad   = (endDeg   - 90) * Math.PI / 180 - gapRad
    return {
      x1: cx + R * Math.cos(startRad), y1: cy + R * Math.sin(startRad),
      x2: cx + R * Math.cos(endRad),   y2: cy + R * Math.sin(endRad),
      large: (endDeg - startDeg - GAP_DEG) > 180 ? 1 : 0,
    }
  }

  let cum = 0
  const slices = items.map(item => {
    const val = active[item.id] || 0
    const deg = (val / 100) * 360
    const sl = { ...item, val, startDeg: cum, endDeg: cum + deg }
    cum += deg
    return sl
  })

  const saving = compCosts ? costs.weightedTer - compCosts.weightedTer : 0

  return (
    <div style={s.wrap}>

      {/* ── Donut ─────────────────────────────────────────────────────── */}
      <div style={s.donutCol}>
        <div style={s.label}>PORTFOLIO CONSTRUCTION</div>
        <div style={s.donutSvgWrap}>
          <svg
            key={showComparison ? 'comp' : 'base'}
            viewBox="0 0 260 260"
            preserveAspectRatio="xMidYMid meet"
            style={{
              ...s.donutSvg,
              opacity: animated ? 1 : 0,
              transform: animated ? 'scale(1)' : 'scale(0.92)',
              transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
              transformOrigin: 'center',
            }}
          >
            <defs>
              <radialGradient id="impl-glow" cx="50%" cy="50%" r="50%">
                <stop offset="30%" stopColor={IMPL_COLORS.active} stopOpacity="0.07" />
                <stop offset="100%" stopColor={IMPL_COLORS.active} stopOpacity="0" />
              </radialGradient>
              <radialGradient id="impl-glow-comp" cx="50%" cy="50%" r="50%">
                <stop offset="30%" stopColor="#4ED596" stopOpacity="0.07" />
                <stop offset="100%" stopColor="#4ED596" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Achtergrondgloed */}
            <circle cx={cx} cy={cy} r={R + 20}
              fill={showComparison ? 'url(#impl-glow-comp)' : 'url(#impl-glow)'}
              style={{ transition: 'fill 0.6s ease' }} />

            {/* Gidsring */}
            <circle cx={cx} cy={cy} r={R + STROKE / 2 + 6}
              fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />

            {/* Track */}
            <circle cx={cx} cy={cy} r={R}
              fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={STROKE} />

            {/* Arc-segmenten */}
            {slices.map(sl => {
              if (sl.val <= 0) return null
              const { x1, y1, x2, y2, large } = arcParams(sl.startDeg, sl.endDeg)
              return (
                <path key={sl.id}
                  d={`M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`}
                  fill="none" stroke={sl.color} strokeWidth={STROKE} strokeLinecap="butt"
                  opacity={showComparison ? 0.70 : 0.88}
                  style={{ transition: 'opacity 0.5s ease' }} />
              )
            })}

            {/* Compare-ring */}
            {showComparison && (
              <circle cx={cx} cy={cy} r={R + STROKE / 2 + 2}
                fill="none" stroke="rgba(78,213,150,0.45)"
                strokeWidth="2" strokeDasharray="7 4" />
            )}

            {/* Centerveld */}
            <circle cx={cx} cy={cy} r={inner} fill="#0C182E" />
            <circle cx={cx} cy={cy} r={inner - 1}
              fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

            <text x={cx} y={cx - 8} textAnchor="middle"
              fontFamily="'Merriweather Sans', sans-serif"
              fontSize="9" fontWeight="700"
              fill="rgba(255,255,255,0.28)" letterSpacing="1">
              {showComparison ? 'SCENARIO' : 'CURRENT'}
            </text>
            <text x={cx} y={cx + 12} textAnchor="middle"
              fontFamily="'Merriweather', serif"
              fontSize="14" fontWeight="700"
              fill={showComparison ? '#4ED596' : 'white'}
              style={{ transition: 'fill 0.5s ease' }}>
              mix
            </text>
          </svg>
        </div>
      </div>

      {/* ── Breakdown ─────────────────────────────────────────────────── */}
      <div style={s.breakdownCol}>
        <div style={s.label}>BREAKDOWN</div>
        {items.map(item => {
          const base  = impl[item.id] || 0
          const curr  = active[item.id] || 0
          const delta = curr - base
          const hasChange = showComparison && delta !== 0

          return (
            <div key={item.id} style={{
              ...s.itemBlock,
              background: hasChange ? 'rgba(255,255,255,0.03)' : 'transparent',
              borderRadius: 6, padding: '5px 8px',
              transition: 'background 0.5s ease',
            }}>
              <div style={s.itemRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: item.color, flexShrink: 0,
                    boxShadow: `0 0 5px ${item.color}66`,
                  }} />
                  <div>
                    <div style={s.itemLabel}>{item.label}</div>
                    <div style={s.itemSub}>{item.sub}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    ...s.itemPct,
                    color: hasChange ? (delta < 0 ? '#4ED596' : '#E01B41') : item.color,
                    transition: 'color 0.5s ease',
                  }}>
                    {curr}%
                  </span>
                  {hasChange && (
                    <span style={{
                      ...s.delta,
                      color: delta < 0 ? '#4ED596' : '#E01B41',
                      background: delta < 0 ? 'rgba(78,213,150,0.10)' : 'rgba(224,27,65,0.10)',
                    }}>
                      {delta > 0 ? '+' : ''}{delta}
                    </span>
                  )}
                </div>
              </div>
              <div style={s.track}>
                {showComparison && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0,
                    borderRadius: 5, background: item.color, opacity: 0.16,
                    width: `${base}%`,
                  }} />
                )}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0,
                  borderRadius: 5, opacity: 0.78,
                  background: hasChange ? (delta < 0 ? '#4ED596' : '#E01B41') : item.color,
                  width: `${curr}%`,
                  transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                  boxShadow: hasChange
                    ? delta < 0
                      ? '0 0 8px rgba(78,213,150,0.3)'
                      : '0 0 8px rgba(224,27,65,0.3)'
                    : 'none',
                }} />
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Cost kaart ────────────────────────────────────────────────── */}
      <div style={s.costCol}>
        <div style={s.label}>COST IMPACT (TER)</div>
        <div style={{
          ...s.costCard,
          borderColor: showComparison && saving > 0
            ? 'rgba(78,213,150,0.35)'
            : 'rgba(255,255,255,0.10)',
          transition: 'border-color 0.6s ease',
        }}>
          <div>
            <div style={s.terLabel}>Weighted avg. TER</div>
            <div style={{
              ...s.terVal,
              color: showComparison && saving > 0 ? '#4ED596' : '#FFFFFF',
              transition: 'color 0.6s ease',
            }}>
              {activeCosts.weightedTer.toFixed(2)}%
            </div>
          </div>
          {compCosts && saving !== 0 && (
            <>
              <div style={s.divider} />
              <div style={s.savingRow}>
                <span style={s.savingLabel}>
                  {saving > 0 ? '↓ Annual saving' : '↑ Extra cost'}
                </span>
                <span style={{ ...s.savingVal, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
                  {Math.abs(saving).toFixed(2)}% p.a.
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
          {compCosts && saving !== 0 && (
            <div style={s.exRow}>
              <span style={s.exLabel}>vs current</span>
              <span style={{ ...s.exVal, fontSize: '0.78rem', color: saving > 0 ? '#4ED596' : '#E01B41' }}>
                {saving > 0 ? 'saves ' : 'costs '}
                €{Math.abs(saving / 100 * 1_000_000).toLocaleString('nl-NL')}/yr
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap:         { display: 'flex', gap: 36, height: '100%', width: '100%', alignItems: 'stretch' },
  donutCol:     { flexShrink: 0, width: '28%', maxWidth: 265, display: 'flex', flexDirection: 'column', gap: 8 },
  donutSvgWrap: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  donutSvg:     { width: '100%', height: '100%', display: 'block' },
  breakdownCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center', minWidth: 0 },
  costCol:      { width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'center' },
  label:        { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em' },
  itemBlock:    { display: 'flex', flexDirection: 'column', gap: 7 },
  itemRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  itemLabel:    { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.85rem', fontWeight: 700, color: 'rgba(255,255,255,0.88)' },
  itemSub:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)' },
  itemPct:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '1.1rem', fontWeight: 800 },
  delta:        { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.7rem', fontWeight: 700, padding: '2px 7px', borderRadius: 4 },
  track:        { height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 5, position: 'relative', overflow: 'hidden' },
  costCard:     { background: 'rgba(255,255,255,0.04)', border: '1px solid', borderRadius: 10, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 },
  terLabel:     { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)', marginBottom: 4 },
  terVal:       { fontFamily: "'Merriweather', serif", fontSize: '2.4rem', fontWeight: 700, lineHeight: 1 },
  divider:      { height: 1, background: 'rgba(255,255,255,0.08)' },
  savingRow:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  savingLabel:  { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', color: 'rgba(255,255,255,0.38)' },
  savingVal:    { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.88rem', fontWeight: 800 },
  exRow:        { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  exLabel:      { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.30)' },
  exVal:        { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.68)' },
}
