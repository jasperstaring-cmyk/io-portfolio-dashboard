import { useState, useEffect, useRef } from 'react'

// Sectorkleur komt uit de data (redactioneel bepaald per event)
// Groen (#4ED596) is GERESERVEERD voor compare/delta — nooit als sectorkleur

// Statische meta-categorie mapping per sector-id
// Cyclical = conjunctuurgevoelig, Sensitive = gemengd, Defensive = defensief
const META = {
  financials:       { label: 'Cyclical',  },
  real_estate_sec:  { label: 'Cyclical',  },
  consumer_disc:    { label: 'Cyclical',  },
  materials:        { label: 'Cyclical',  },
  technology:       { label: 'Sensitive', },
  industrials:      { label: 'Sensitive', },
  energy:           { label: 'Sensitive', },
  communication:    { label: 'Sensitive', },
  healthcare:       { label: 'Defensive', },
  consumer_staples: { label: 'Defensive', },
  utilities:        { label: 'Defensive', },
}

// TOP_N: hoeveel sectoren groot worden getoond
const TOP_N = 3

export default function SectorChart({ portfolio, scenario, showComparison, lang }) {
  const [animated, setAnimated] = useState(false)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      prevCompare.current = showComparison
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const sectors = portfolio.sectors || []

  function getComp(id) {
    if (!showComparison || !scenario?.comparison?.sectors) return null
    const found = scenario.comparison.sectors.find(s => s.id === id)
    return found != null ? found.weight : null
  }

  // Bouw actieve sectorlijst, gesorteerd op displayVal
  const active = sectors.map(s => {
    const comp = getComp(s.id)
    const displayVal = comp !== null ? comp : s.weight
    const delta = comp !== null ? comp - s.weight : 0
    return {
      ...s,
      compVal:    comp,
      displayVal,
      delta,
      hasChange:  showComparison && comp !== null && delta !== 0,
      meta:       META[s.id]?.label ?? 'Other',
    }
  }).sort((a, b) => b.displayVal - a.displayVal)

  const top    = active.slice(0, TOP_N)
  const rest   = active.slice(TOP_N)
  const maxVal = active[0]?.displayVal || 1

  const labelLang = s => s.label?.[lang] || s.label?.en || s.label || s.id

  return (
    <div style={{
      ...s.wrap,
      opacity:   animated ? 1 : 0,
      transform: animated ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>

      {/* ── Sublabel ── */}
      <div style={s.sublabel}>SECTOR ALLOCATION</div>

      {/* ── TOP 3 kaarten ── */}
      <div style={s.topRow}>
        {top.map(sec => {
          const deltaColor = sec.delta < 0 ? '#4ED596' : '#E01B41'
          const borderCol  = sec.hasChange
            ? (sec.delta < 0 ? 'rgba(78,213,150,0.35)' : 'rgba(224,27,65,0.35)')
            : 'rgba(255,255,255,0.07)'

          return (
            <div key={sec.id} style={{
              ...s.topCard,
              borderColor: borderCol,
              transition: 'border-color 0.5s ease',
            }}>
              {/* Meta tag */}
              <div style={{ ...s.metaTag, color: sec.color }}>
                {sec.meta.toUpperCase()}
              </div>

              {/* Groot percentage */}
              <div style={{
                ...s.topPct,
                color: sec.hasChange ? deltaColor : 'white',
                transition: 'color 0.5s ease',
              }}>
                {sec.displayVal}%
              </div>

              {/* Naam */}
              <div style={s.topName}>{labelLang(sec)}</div>

              {/* Balk */}
              <div style={s.topTrack}>
                {showComparison && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0,
                    width: `${(sec.weight / maxVal) * 100}%`,
                    background: sec.color, opacity: 0.18, borderRadius: 3,
                  }} />
                )}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0,
                  width: `${(sec.displayVal / maxVal) * 100}%`,
                  background: sec.hasChange ? deltaColor : sec.color,
                  opacity: 0.82, borderRadius: 3,
                  transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                }} />
              </div>

              {/* Delta — vaste hoogte zodat kaart niet verspringt */}
              <div style={s.topDeltaSlot}>
                {sec.hasChange && (
                  <span style={{ color: deltaColor, fontWeight: 800, fontSize: '0.82rem' }}>
                    {sec.delta > 0 ? '+' : ''}{sec.delta}% vs base
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Scheidingslijn ── */}
      <div style={s.divider}>
        <span style={s.dividerLabel}>REMAINING SECTORS</span>
        <div style={s.dividerLine} />
      </div>

      {/* ── Rest — compact tweekoloms grid ── */}
      <div style={s.restGrid}>
        {rest.map(sec => {
          const deltaColor = sec.delta < 0 ? '#4ED596' : '#E01B41'
          return (
            <div key={sec.id} style={s.restRow}>
              {/* Kleurstreep */}
              <div style={{ ...s.restStripe, background: sec.color }} />

              {/* Naam + meta */}
              <div style={s.restInfo}>
                <div style={s.restName}>{labelLang(sec)}</div>
                <div style={s.restMeta}>{sec.meta}</div>
              </div>

              {/* Balk */}
              <div style={s.restTrack}>
                {showComparison && (
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0,
                    width: `${(sec.weight / maxVal) * 100}%`,
                    background: sec.color, opacity: 0.15, borderRadius: 3,
                  }} />
                )}
                <div style={{
                  position: 'absolute', top: 0, bottom: 0, left: 0,
                  width: `${(sec.displayVal / maxVal) * 100}%`,
                  background: sec.hasChange ? deltaColor : sec.color,
                  opacity: 0.75, borderRadius: 3,
                  transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                }} />
              </div>

              {/* Percentage */}
              <div style={{
                ...s.restPct,
                color: sec.hasChange ? deltaColor : 'rgba(255,255,255,0.6)',
                transition: 'color 0.5s ease',
              }}>
                {sec.displayVal}%
              </div>

              {/* Delta — vaste breedte zodat layout niet verspringt */}
              <div style={s.restDeltaSlot}>
                {sec.hasChange && (
                  <span style={{ color: deltaColor }}>
                    {sec.delta > 0 ? '+' : ''}{sec.delta}%
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
  wrap: {
    display: 'flex', flexDirection: 'column',
    height: '100%', width: '100%',
    justifyContent: 'center', gap: 0,
    paddingTop: '6%',
  },

  sublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    marginBottom: 12,
    flexShrink: 0,
  },

  // ── Top kaarten ──
  topRow: {
    display: 'flex', gap: 12,
    marginBottom: 14,
    flexShrink: 0,
  },
  topCard: {
    flex: 1,
    padding: '16px 20px',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    border: '1px solid',
    display: 'flex', flexDirection: 'column', gap: 0,
  },
  metaTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em',
    opacity: 0.75, marginBottom: 6,
  },
  topPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '3.2rem', fontWeight: 800, lineHeight: 1,
    marginBottom: 4,
  },
  topName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.1rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
  },
  topTrack: {
    height: 10, background: 'rgba(255,255,255,0.06)',
    borderRadius: 4, position: 'relative', overflow: 'hidden',
    marginBottom: 8,
  },
  topDeltaSlot: {
    height: 22,
    display: 'flex', alignItems: 'center',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.88rem',
    color: 'transparent',
  },

  // ── Scheidingslijn ──
  divider: {
    display: 'flex', alignItems: 'center', gap: 12,
    marginBottom: 10, flexShrink: 0,
  },
  dividerLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.22)', whiteSpace: 'nowrap',
  },
  dividerLine: {
    flex: 1, height: 1, background: 'rgba(255,255,255,0.07)',
  },

  // ── Rest grid — compacter en groter ──
  restGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '4px 28px',
    flex: 1,
    alignContent: 'start',
  },
  restRow: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '5px 0',
  },
  restStripe: {
    width: 4, height: 32, borderRadius: 2,
    flexShrink: 0, opacity: 0.75,
  },
  restInfo: {
    width: 148, flexShrink: 0,
  },
  restName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.95rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.75)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  restMeta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', color: 'rgba(255,255,255,0.30)',
  },
  restTrack: {
    flex: 1, height: 12,
    background: 'rgba(255,255,255,0.06)',
    borderRadius: 4, position: 'relative', overflow: 'hidden',
  },
  restPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.1rem', fontWeight: 800,
    minWidth: 42, textAlign: 'right', flexShrink: 0,
  },
  restDeltaSlot: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.80rem', fontWeight: 800,
    minWidth: 44, textAlign: 'right', flexShrink: 0,
    color: 'transparent',
  },
}
