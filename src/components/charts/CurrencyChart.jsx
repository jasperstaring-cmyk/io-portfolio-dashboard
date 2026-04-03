import { useState, useEffect, useRef } from 'react'

// Categoriekleuren — neutraal, geen statusoordeel
// Groen (#4ED596) = stijging, Rood (#E01B41) = daling — richting, niet oordeel
const FX_COLORS = {
  USD:   '#F5A623',
  GBP:   '#A78BFA',
  JPY:   '#8A8A82',
  CHF:   'rgba(255,255,255,0.50)',
  Other: 'rgba(255,255,255,0.30)',
}
const HOME_COLOR = '#5B8DEF'

const BAR_WIDTH    = 520   // px — vaste breedte
const TOTAL_HEIGHT = 300   // px — vaste hoogte
const MIN_SEG_H    = 26    // px — minimum segmenthoogte

export default function CurrencyChart({ portfolio, scenario, showComparison }) {
  const [animated, setAnimated] = useState(false)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) prevCompare.current = showComparison
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const homeCurrency   = portfolio.currency || 'EUR'
  const rawCurrencies  = portfolio.currencies || []
  const compCurrencies = showComparison ? scenario?.comparison?.currencies : null

  // Schaal altijd naar 100%
  const rawActive = rawCurrencies.map(c => {
    const comp = compCurrencies?.find(x => x.currency === c.currency)
    return {
      currency: c.currency,
      rawVal:   comp ? comp.weight : c.weight,
      baseRaw:  c.weight,
      isHome:   c.currency === homeCurrency,
      color:    c.currency === homeCurrency
        ? HOME_COLOR
        : (FX_COLORS[c.currency] ?? 'rgba(255,255,255,0.30)'),
    }
  })

  const activeTotal = rawActive.reduce((s, c) => s + c.rawVal, 0) || 100
  const baseTotal   = rawActive.reduce((s, c) => s + c.baseRaw, 0) || 100

  const data = rawActive.map(c => ({
    ...c,
    pct:     Math.round((c.rawVal  / activeTotal) * 100),
    basePct: Math.round((c.baseRaw / baseTotal)   * 100),
  }))

  // Afrondingscorrectie
  const pctSum = data.reduce((s, c) => s + c.pct, 0)
  if (pctSum !== 100 && data.length > 0) data[0].pct += 100 - pctSum

  // FX exposure metrics
  const homePct     = data.find(c => c.isHome)?.pct     ?? 0
  const baseHomePct = data.find(c => c.isHome)?.basePct ?? 0
  const fxExp       = 100 - homePct
  const baseFxExp   = 100 - baseHomePct
  const fxDelta     = showComparison ? fxExp - baseFxExp : 0
  const hasFxDelta  = showComparison && fxDelta !== 0
  const dColor      = d => d < 0 ? '#E01B41' : '#4ED596'

  // Vaste hoogtes — nooit veranderen, ook niet bij explore
  const rawHeights = data.map(c => Math.max(Math.round((c.pct / 100) * TOTAL_HEIGHT), MIN_SEG_H))
  const hSum = rawHeights.reduce((a, b) => a + b, 0)
  if (hSum !== TOTAL_HEIGHT && rawHeights.length > 0) rawHeights[0] += TOTAL_HEIGHT - hSum

  return (
    <div style={{
      ...s.wrap,
      opacity:   animated ? 1 : 0,
      transform: animated ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>

      {/* ── Hele compositie gecentreerd ── */}
      <div style={s.composition}>

        {/* ── BOVEN: metric + delta boven de balk ── */}
        <div style={s.metricBlock}>
          <div style={s.sublabel}>FX EXPOSURE</div>

          <div style={s.metricRow}>
            {/* Groot getal */}
            <div style={{
              ...s.bigNumber,
              color: hasFxDelta ? dColor(fxDelta) : '#E01B41',
              transition: 'color 0.5s ease',
            }}>
              {fxExp}%
            </div>
            <div style={s.bigNumberSub}>non-{homeCurrency}</div>
          </div>

          {/* Delta-slot — vaste hoogte zodat positie niet verspringt */}
          <div style={s.deltaSlot}>
            {hasFxDelta && (
              <>
                <span style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: '1.2rem', fontWeight: 800,
                  color: dColor(fxDelta),
                }}>
                  {fxDelta > 0 ? '+' : ''}{fxDelta}%
                </span>
                <span style={s.vsBase}>vs base</span>
              </>
            )}
          </div>
        </div>

        {/* ── ONDER: balk + labels ── */}
        <div style={s.barBlock}>
          <div style={s.sublabelSmall}>CURRENCY BREAKDOWN</div>

          <div style={{ display: 'flex', alignItems: 'flex-start' }}>

            {/* Verticale gestapelde balk — vaste afmetingen */}
            <div style={{
              width: BAR_WIDTH,
              height: TOTAL_HEIGHT,
              borderRadius: 10,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
            }}>
              {data.map((c, i) => {
                const cDelta    = c.pct - c.basePct
                const hasCDelta = showComparison && cDelta !== 0
                const segColor  = !c.isHome && hasCDelta ? dColor(cDelta) : c.color

                return (
                  <div key={c.currency} style={{
                    width: '100%',
                    height: rawHeights[i],
                    flexShrink: 0,
                    background: segColor,
                    opacity: 0.90,
                    borderBottom: i < data.length - 1 ? '2px solid #0C182E' : 'none',
                    position: 'relative',
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    transition: 'background 0.5s ease',
                  }}>
                    {/* Label in segment */}
                    {rawHeights[i] >= 34 && (
                      <div style={{
                        position: 'absolute', left: 14,
                        display: 'flex', alignItems: 'center', gap: 6,
                      }}>
                        <span style={{
                          fontFamily: "'Merriweather Sans', sans-serif",
                          fontSize: rawHeights[i] >= 64 ? '1rem' : '0.82rem',
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.82)',
                        }}>
                          {c.currency}
                        </span>
                        {!c.isHome && <span style={s.fxBadge}>FX</span>}
                      </div>
                    )}

                    {/* Ghost streep rechts bij compare */}
                    {showComparison && (
                      <div style={{
                        position: 'absolute', top: 0, right: 0, bottom: 0,
                        width: 3, background: c.color, opacity: 0.35,
                      }} />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Percentages + delta direct rechts van balk */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              height: TOTAL_HEIGHT,
              paddingLeft: 14,
            }}>
              {data.map((c, i) => {
                const cDelta    = c.pct - c.basePct
                const hasCDelta = showComparison && cDelta !== 0
                const pctColor  = !c.isHome && hasCDelta ? dColor(cDelta) : c.color

                return (
                  <div key={c.currency} style={{
                    height: rawHeights[i],
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontSize: rawHeights[i] >= 64 ? '1.5rem'
                              : rawHeights[i] >= 34 ? '1.15rem'
                              : '0.88rem',
                      fontWeight: 800,
                      color: pctColor,
                      transition: 'color 0.5s ease',
                      whiteSpace: 'nowrap',
                    }}>
                      {c.pct}%
                    </span>

                    {/* Delta slot — vaste breedte, voorkomt layout shift */}
                    <div style={s.rowDeltaSlot}>
                      {hasCDelta && rawHeights[i] >= 26 && (
                        <span style={{
                          fontFamily: "'Merriweather Sans', sans-serif",
                          fontSize: '0.75rem', fontWeight: 800,
                          color: dColor(cDelta),
                        }}>
                          {cDelta > 0 ? '+' : ''}{cDelta}%
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

          </div>
        </div>

      </div>

    </div>
  )
}

const s = {
  wrap: {
    display: 'flex',
    height: '100%', width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Hele compositie als één blok gecentreerd
  composition: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    alignItems: 'flex-start',
  },

  // Metric boven de balk
  metricBlock: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: 16,
  },
  sublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    marginBottom: 6,
  },
  sublabelSmall: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.22)', letterSpacing: '0.1em',
    marginBottom: 8,
  },
  metricRow: {
    display: 'flex', alignItems: 'baseline', gap: 14,
  },
  bigNumber: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '4.8rem', fontWeight: 800, lineHeight: 1,
  },
  bigNumberSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.40)',
  },
  // Vaste hoogte — voorkomt verspringen bij compare toggle
  deltaSlot: {
    height: 30,
    display: 'flex', alignItems: 'center', gap: 8,
    marginTop: 4,
  },
  vsBase: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', color: 'rgba(255,255,255,0.35)',
  },

  // Balk blok
  barBlock: {
    display: 'flex', flexDirection: 'column',
  },

  fxBadge: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '7px', fontWeight: 800, letterSpacing: '0.06em',
    color: 'rgba(255,255,255,0.55)',
    border: '0.5px solid rgba(255,255,255,0.25)',
    borderRadius: 3, padding: '1px 4px',
  },

  // Vaste breedte delta-slot per rij
  rowDeltaSlot: {
    minWidth: 48, flexShrink: 0,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem',
    color: 'transparent',
  },
}
