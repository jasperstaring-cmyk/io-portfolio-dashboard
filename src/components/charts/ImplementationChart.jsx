import { useState, useEffect, useRef } from 'react'

// Categoriekleuren — neutraal, geen statusoordeel
// Active/Passive/Individual zijn implementatiekeuzes, niet goed/slecht
// Groen (#4ED596) is GERESERVEERD voor compare/delta/besparingen
const IMPL_COLORS = {
  active:     '#E01B41',
  passive:    '#5B8DEF',
  individual: '#F5A623',
}

const ITEMS = [
  { id: 'active',     label: 'Active Management',    sub: 'Alpha-seeking, manager discretion' },
  { id: 'passive',    label: 'Passive / ETF',         sub: 'Index-tracking, market beta'       },
  { id: 'individual', label: 'Individual Securities', sub: 'Direct stock & bond holdings'      },
]

const PORTFOLIO_SIZE = 1_000_000

// Drempelwaarden voor labels in de balk en boven de balk
const MIN_PCT_FOR_SUBLABEL  = 18   // sub-omschrijving verdwijnt onder dit %
const MIN_PCT_FOR_NAMELABEL = 10   // naam verdwijnt onder dit %
const MIN_PCT_FOR_TER       = 14   // TER in balk verdwijnt onder dit %

export default function ImplementationChart({ portfolio, scenario, showComparison }) {
  const [animated,    setAnimated]    = useState(false)
  const [costVisible, setCostVisible] = useState(false)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      prevCompare.current = showComparison
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  useEffect(() => {
    setCostVisible(false)
    if (showComparison) {
      const t = setTimeout(() => setCostVisible(true), 500)
      return () => clearTimeout(t)
    }
  }, [showComparison])

  const impl      = portfolio.implementation
  const compImpl  = showComparison ? scenario?.comparison?.implementation : null
  const costs     = portfolio.costs
  const compCosts = showComparison ? scenario?.comparison?.costs : null

  const activeImpl = compImpl || impl

  // FIX 1: proportionele schaling — altijd optellen tot 100%
  // zodat explore-mode met totaal ≠ 100 geen lege balk geeft
  const rawVals  = ITEMS.map(item => activeImpl[item.id] || 0)
  const rawTotal = rawVals.reduce((a, b) => a + b, 0) || 100
  const rawBase  = ITEMS.map(item => impl[item.id] || 0)
  const rawBaseTotal = rawBase.reduce((a, b) => a + b, 0) || 100

  const segments = ITEMS.map((item, i) => ({
    ...item,
    color:    IMPL_COLORS[item.id],
    base:     Math.round((rawBase[i] / rawBaseTotal) * 100),
    val:      Math.round((rawVals[i] / rawTotal) * 100),
    rawVal:   rawVals[i],   // originele waarde voor labels
    delta:    showComparison ? (activeImpl[item.id] || 0) - (impl[item.id] || 0) : 0,
    ter:      costs?.breakdown?.find(b => b.id === item.id)?.ter ?? null,
  }))

  // Afrondingscorrectie: zorg dat som exact 100 is
  const scaledTotal = segments.reduce((a, s) => a + s.val, 0)
  if (scaledTotal !== 100 && segments.length > 0) {
    segments[0].val += 100 - scaledTotal
  }

  const baseTer   = costs?.weightedTer   ?? 0
  const activeTer = compCosts?.weightedTer ?? baseTer
  const saving    = baseTer - activeTer
  const baseEur   = Math.round(baseTer   / 100 * PORTFOLIO_SIZE)
  const activeEur = Math.round(activeTer / 100 * PORTFOLIO_SIZE)
  const saveEur   = Math.round(Math.abs(saving) / 100 * PORTFOLIO_SIZE)

  return (
    <div style={s.wrap}>

      {/* ── Sublabel ── */}
      <div style={s.sublabel}>PORTFOLIO CONSTRUCTION</div>

      {/* ── Segment-labels boven de balk ── */}
      <div style={{
        ...s.labelsRow,
        opacity:   animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.5s ease 0.05s, transform 0.5s ease 0.05s',
      }}>
        {segments.map((seg, i) => {
          const hasChange = showComparison && seg.delta !== 0
          // FIX 2: labels schalen mee met segmentbreedte
          const showName = seg.val >= MIN_PCT_FOR_NAMELABEL
          const showSub  = seg.val >= MIN_PCT_FOR_SUBLABEL

          return (
            <div key={seg.id} style={{
              ...s.labelCol,
              width: `${seg.val}%`,
              transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
              paddingRight: i < segments.length - 1 ? 14 : 0,
            }}>
              {/* Percentage — altijd zichtbaar */}
              <div style={{
                ...s.labelPct,
                color: hasChange
                  ? seg.delta < 0 ? '#4ED596' : '#E01B41'
                  : seg.color,
                transition: 'color 0.5s ease',
              }}>
                {seg.rawVal}%
              </div>

              {/* Naam — verdwijnt bij kleine segmenten */}
              {showName && (
                <div style={s.labelName}>{seg.label}</div>
              )}

              {/* Sub-omschrijving — verdwijnt eerder */}
              {showSub && (
                <div style={s.labelSub}>{seg.sub}</div>
              )}

              {/* Delta bij compare */}
              {hasChange && (
                <div style={{
                  ...s.labelDelta,
                  color: seg.delta < 0 ? '#4ED596' : '#E01B41',
                }}>
                  {seg.delta > 0 ? '+' : ''}{seg.delta}%
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Gestapelde balk ── */}
      <div style={{
        ...s.trackWrap,
        opacity:   animated ? 1 : 0,
        transform: animated ? 'scaleY(1)' : 'scaleY(0.7)',
        transition: 'opacity 0.45s ease 0.1s, transform 0.45s cubic-bezier(0.34,1.26,0.64,1) 0.1s',
        transformOrigin: 'top',
      }}>
        {/* Ghost balk: originele verdeling als dunne streep bovenin bij compare */}
        {showComparison && (
          <div style={s.ghostTrack}>
            {segments.map((seg, i) => (
              <div key={seg.id} style={{
                width: `${seg.base}%`,
                background: seg.color,
                transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
                borderRight: i < segments.length - 1 ? '2px solid #0C182E' : 'none',
              }} />
            ))}
          </div>
        )}

        {/* Actieve balk */}
        <div style={s.activeTrack}>
          {segments.map((seg, i) => (
            <div key={seg.id} style={{
              width: `${seg.val}%`,
              background: seg.color,
              opacity: 0.90,
              transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: i < segments.length - 1 ? '2px solid #0C182E' : 'none',
            }}>
              {/* FIX 3: TER met werkelijke waarde, alleen als segment breed genoeg */}
              {seg.val >= MIN_PCT_FOR_TER && seg.ter !== null && (
                <span style={s.terInBar}>
                  TER {seg.ter.toFixed(2)}%
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Kostenblok — alleen bij compare ── */}
      {showComparison && (
        <div style={{
          ...s.costBlock,
          opacity:   costVisible ? 1 : 0,
          transform: costVisible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.5s ease, transform 0.5s ease',
        }}>
          <div style={s.costCell}>
            <div style={s.costCellLabel}>CURRENT TER</div>
            <div style={s.costCellVal}>{baseTer.toFixed(2)}%</div>
            <div style={s.costCellSub}>~€{baseEur.toLocaleString('nl-NL')}/yr on €1M</div>
          </div>

          <div style={s.costArrow}>→</div>

          <div style={s.costCell}>
            <div style={{ ...s.costCellLabel, color: 'rgba(78,213,150,0.55)' }}>SCENARIO TER</div>
            <div style={{ ...s.costCellVal, color: '#4ED596' }}>{activeTer.toFixed(2)}%</div>
            <div style={s.costCellSub}>~€{activeEur.toLocaleString('nl-NL')}/yr on €1M</div>
          </div>

          <div style={{ flex: 1 }} />

          {saving !== 0 && (
            <div style={s.savingBlock}>
              <div style={{ ...s.costCellLabel, color: saving > 0 ? 'rgba(78,213,150,0.55)' : 'rgba(224,27,65,0.55)' }}>
                {saving > 0 ? 'ANNUAL SAVING' : 'EXTRA COST'}
              </div>
              <div style={{
                ...s.savingVal,
                color: saving > 0 ? '#4ED596' : '#E01B41',
              }}>
                {saving > 0 ? '+' : '-'}€{saveEur.toLocaleString('nl-NL')}
              </div>
              <div style={s.costCellSub}>per year on €1M portfolio</div>
            </div>
          )}
        </div>
      )}

    </div>
  )
}

const s = {
  // FIX 4: verticale centrering via flex met padding
  wrap: {
    display: 'flex', flexDirection: 'column',
    height: '100%', width: '100%',
    justifyContent: 'center',
    paddingTop: 8, paddingBottom: 8,
  },

  sublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    marginBottom: 18,
  },

  labelsRow: {
    display: 'flex', width: '100%',
    marginBottom: 10, alignItems: 'flex-end',
  },
  labelCol: {
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 2,
    minWidth: 0,
  },
  labelPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '2.4rem', fontWeight: 800, lineHeight: 1,
  },
  labelName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.72)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  labelSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 400,
    color: 'rgba(255,255,255,0.32)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  labelDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem', fontWeight: 800,
    marginTop: 2,
  },

  trackWrap: {
    width: '100%', borderRadius: 10,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
    marginBottom: 14,
  },
  ghostTrack: {
    display: 'flex', height: 5,
    opacity: 0.38,
  },
  activeTrack: {
    display: 'flex', height: 72,
  },
  terInBar: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: '0.04em',
    pointerEvents: 'none',
  },

  costBlock: {
    display: 'flex', alignItems: 'center', gap: 24,
    padding: '14px 20px',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.03)',
    border: '0.5px solid rgba(78,213,150,0.18)',
  },
  costCell: {
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  costCellLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.10em',
  },
  costCellVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.8rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.65)', lineHeight: 1,
  },
  costCellSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', color: 'rgba(255,255,255,0.32)',
  },
  costArrow: {
    fontSize: '1.4rem',
    color: 'rgba(78,213,150,0.45)',
    flexShrink: 0,
  },
  savingBlock: {
    display: 'flex', flexDirection: 'column', gap: 3,
    textAlign: 'right',
  },
  savingVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '2.6rem', fontWeight: 800,
    lineHeight: 1,
  },
}
