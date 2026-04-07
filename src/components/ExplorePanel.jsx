import { useState } from 'react'

function TotalBadge({ values }) {
  const total = Math.round(values.reduce((s, v) => s + (v || 0), 0))
  const ok = total === 100
  const over = total > 100
  const color = ok ? '#4ED596' : over ? '#E01B41' : '#F5A623'
  return (
    <span style={{ fontSize: '12px', fontWeight: 800, color, marginLeft: '10px', fontFamily: "'Merriweather Sans', system-ui, sans-serif" }}>
      {total}%{ok ? ' ✓' : ''}
    </span>
  )
}

function SliderCol({ label, color, value, base, onChange, min = 0, max = 100 }) {
  const changed = value !== base
  const delta = value - base
  return (
    <div style={s.sliderCol}>
      <div style={s.sliderTop}>
        <span style={{ ...s.sliderDot, background: color }} />
        <span style={s.sliderLabel}>{label}</span>
      </div>
      <div style={s.sliderMid}>
        <span style={{ ...s.sliderVal, color: changed ? '#E01B41' : 'rgba(255,255,255,0.9)', fontWeight: changed ? 800 : 600 }}>
          {value}{max <= 100 ? '%' : ''}
        </span>
        {changed && <span style={s.delta}>{delta > 0 ? '+' : ''}{delta}</span>}
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={s.range} />
    </div>
  )
}

const GEO_COLORS = {
  'Europe': '#5B8DEF', 'North America': '#F5A623',
  'Asia Pacific': '#A78BFA', 'Emerging Markets': '#8A8A82',
}

function getImplCategories(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  const LEGACY = {
    active:     { label: { en: 'Active' },       color: '#E01B41' },
    passive:    { label: { en: 'Passive / ETF' }, color: '#5B8DEF' },
    individual: { label: { en: 'Individual' },    color: '#F5A623' },
  }
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight, ...(LEGACY[id] || { label: { en: id }, color: '#8A8A82' }) }))
}

export default function ExplorePanel({
  portfolio, explorePortfolio,
  onUpdateAlloc, onUpdateESG, onUpdateImpl, onUpdateSector, onUpdateCurrency,
  onUpdateGeo, onResetAlloc,
  activeDimension, onExitExplore,
  activeScenario, lang,
  allEvents, activeEventId, onSelectEvent,
}) {
  const [open, setOpen] = useState(true)

  const showAlloc    = activeDimension === 'asset_class'
  const showGeo      = activeDimension === 'geography'
  const showESG      = activeDimension === 'esg'
  const showImpl     = activeDimension === 'implementation'
  const showSector   = activeDimension === 'sector'
  const showCurrency = activeDimension === 'currency'
  const noSliders    = ['performance', 'style', 'cost'].includes(activeDimension)

  const baseImplCats    = getImplCategories(portfolio.implementation)
  const exploreImplCats = getImplCategories(explorePortfolio.implementation)

  const hasMultipleEvents = allEvents?.length > 1

  const screenName =
    activeScenario?.screenName?.[lang] ||
    activeScenario?.screenName?.en ||
    activeScenario?.screenName || ''

  function renderSliders() {
    if (showAlloc) return {
      label: 'Allocation',
      badge: <TotalBadge values={explorePortfolio.allocations.map(a => a.current)} />,
      cols: explorePortfolio.allocations.map(a => {
        const base = portfolio.allocations.find(x => x.id === a.id)?.current ?? a.current
        const label = typeof a.label === 'string' ? a.label : a.label?.en || a.id
        return { key: a.id, label, color: a.color || '#8A8A82', value: a.current, base, onChange: v => onUpdateAlloc(a.id, v) }
      })
    }
    if (showGeo) {
      const entries = Object.entries(explorePortfolio.geoOverride || {})
      return {
        label: 'Geography',
        badge: <TotalBadge values={entries.map(([, w]) => w)} />,
        cols: entries.map(([region, weight]) => {
          const base = portfolio.allocations.reduce((sum, a) => {
            const geoSum = a.geographic?.reduce((s, g) => s + g.weight, 0) || 0
            if (!geoSum) return sum
            const scale = a.current / geoSum
            const g = a.geographic?.find(x => x.region === region)
            return sum + (g ? g.weight * scale : 0)
          }, 0)
          return { key: region, label: region, color: GEO_COLORS[region] || '#8A8A82', value: Math.round(weight), base: Math.round(base), onChange: v => onUpdateGeo(region, v) }
        })
      }
    }
    if (showESG) {
      const scoreCols = [{ key: 'score', label: 'ESG Score', color: '#4ED596', value: explorePortfolio.esg?.score ?? 0, base: portfolio.esg?.score ?? 0, min: 0, max: 10, onChange: v => onUpdateESG('score', v) }]
      const sfdrCols = (explorePortfolio.esg?.sfdr || []).map((item, i) => ({
        key: item.article, label: item.article,
        color: i === 0 ? '#4ED596' : i === 1 ? '#5B8DEF' : '#8A8A82',
        value: item.weight, base: portfolio.esg?.sfdr?.[i]?.weight ?? item.weight,
        onChange: v => onUpdateESG('sfdr', v, i)
      }))
      return { label: 'ESG', badge: null, cols: [...scoreCols, ...sfdrCols] }
    }
    if (showImpl) return {
      label: 'Implementation',
      badge: <TotalBadge values={exploreImplCats.map(c => c.weight)} />,
      cols: exploreImplCats.map(cat => {
        const base = baseImplCats.find(b => b.id === cat.id)?.weight ?? cat.weight
        const label = typeof cat.label === 'string' ? cat.label : cat.label?.en || cat.id
        return { key: cat.id, label, color: cat.color || '#8A8A82', value: cat.weight, base, onChange: v => onUpdateImpl(cat.id, v) }
      })
    }
    if (showSector) return {
      label: 'Sectors',
      badge: <TotalBadge values={explorePortfolio.sectors?.map(sec => sec.weight) || []} />,
      cols: (explorePortfolio.sectors || []).map((sec, i) => {
        const base = portfolio.sectors?.[i]?.weight ?? sec.weight
        const label = typeof sec.label === 'string' ? sec.label : sec.label?.en || sec.id
        return { key: sec.id, label, color: sec.color || '#8A8A82', value: sec.weight, base, onChange: v => onUpdateSector(i, v) }
      })
    }
    if (showCurrency) return {
      label: 'Currency',
      badge: <TotalBadge values={explorePortfolio.currencies?.map(c => c.weight) || []} />,
      cols: (explorePortfolio.currencies || []).map((cur, i) => {
        const base = portfolio.currencies?.[i]?.weight ?? cur.weight
        const color = cur.currency === 'EUR' ? '#5B8DEF' : cur.currency === 'USD' ? '#F5A623' : cur.currency === 'GBP' ? '#A78BFA' : '#8A8A82'
        return { key: cur.currency, label: cur.currency, color, value: cur.weight, base, onChange: v => onUpdateCurrency(i, v) }
      })
    }
    return null
  }

  const sliderData = renderSliders()

  function splitRows(cols) {
    if (!cols || cols.length <= 6) return [cols]
    const half = Math.ceil(cols.length / 2)
    return [cols.slice(0, half), cols.slice(half)]
  }

  const rows = sliderData ? splitRows(sliderData.cols) : []

  return (
    <div style={s.panel}>

      <div style={s.greenLine} />

      {/* ── Uitklaplade ── */}
      <div style={s.drawerWrap}>
        <button style={s.toggleTab} onClick={() => setOpen(o => !o)}>
          <span style={s.toggleChevron}>{open ? '▼' : '▲'}</span>
          <span style={s.toggleLabel}>{open ? 'Hide' : 'Show'}</span>
          <span style={s.toggleChevron}>{open ? '▼' : '▲'}</span>
        </button>
        <div style={{
          ...s.drawerBody,
          maxHeight: open ? '320px' : '0px',
          opacity: open ? 1 : 0,
          paddingTop: open ? '24px' : '0px',
          paddingBottom: open ? '20px' : '0px',
        }}>
          {sliderData && (
            <>
              <div style={s.drawerHeader}>
                <span style={s.drawerLabel}>{sliderData.label}</span>
                {sliderData.badge}
                <button style={s.resetBtn} onClick={onResetAlloc}>Reset to base</button>
              </div>
              {rows.map((row, ri) => (
                <div key={ri} style={{ ...s.sliderRow, marginTop: ri > 0 ? '16px' : 0 }}>
                  {row.map(col => <SliderCol key={col.key} {...col} />)}
                </div>
              ))}
            </>
          )}
          {noSliders && <div style={s.noSliders}>No sliders available for this dimension.</div>}
        </div>
      </div>

      {/* ── Control balk ── */}
      <div style={s.mainRow}>

        {hasMultipleEvents && (
          <>
            <div style={s.eventSection}>
              <div style={s.microLabel}>Event</div>
              <select
                value={activeEventId || ''}
                onChange={e => onSelectEvent(e.target.value)}
                style={s.eventSelect}
              >
                {allEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.name || e.id}</option>
                ))}
              </select>
            </div>
            <div style={s.vDivider} />
          </>
        )}

        <div style={s.screenNameSection}>
          <div style={s.exploreTag}>
            <span style={s.exploreDot} />
            Explore
          </div>
          <div style={s.screenNameText}>{screenName || '\u00A0'}</div>
        </div>

        {/* Spacer duwt Back naar rechts */}
        <div style={{ flex: '1 1 0' }} />

        <div style={s.vDivider} />

        {/* ── Back knop — prominent en podiumleesbaar ── */}
        <button style={s.backBtn} onClick={onExitExplore}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5M5 12l7-7M5 12l7 7"
              stroke="#4ED596" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span style={s.backLabel}>Back</span>
        </button>

      </div>
    </div>
  )
}

const s = {
  panel: {
    width: '100%',
    background: '#0C182E',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    flexShrink: 0,
    position: 'relative',
  },
  greenLine: { height: '3px', background: '#4ED596', width: '100%' },

  /* ── Uitklaplade ── */
  drawerWrap: {
    position: 'absolute',
    bottom: '103px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: 'min(1400px, 96vw)',
    zIndex: 100,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    /* Verankert de lade visueel aan de footer — geen zwevend effect */
    filter: 'drop-shadow(0 -8px 32px rgba(0,0,0,0.55))',
  },
  toggleTab: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '8px 28px',
    background: '#0C182E',
    border: '1px solid rgba(78,213,150,0.45)',
    borderBottom: 'none',
    borderRadius: '10px 10px 0 0',
    cursor: 'pointer',
    alignSelf: 'center',
    width: '160px',
  },
  toggleChevron: { fontSize: '9px', color: 'rgba(78,213,150,0.7)' },
  toggleLabel: {
    fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
    letterSpacing: '0.1em', color: '#4ED596',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
  },
  drawerBody: {
    background: '#0C182E',
    border: '1px solid rgba(78,213,150,0.35)',
    /* Onderste border weggelaten zodat de lade naadloos aansluit op de footer */
    borderBottom: 'none',
    overflow: 'hidden',
    transition: 'max-height 0.32s ease, opacity 0.25s ease, padding 0.32s ease',
    paddingLeft: '36px',
    paddingRight: '36px',
  },
  drawerHeader: {
    display: 'flex', alignItems: 'center', marginBottom: '18px',
  },
  drawerLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px', fontWeight: 800,
    textTransform: 'uppercase', letterSpacing: '0.18em',
    color: 'rgba(255,255,255,0.35)',
  },
  resetBtn: {
    marginLeft: 'auto', padding: '6px 16px',
    background: 'transparent',
    border: '1px solid rgba(78,213,150,0.35)',
    borderRadius: '5px', cursor: 'pointer',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px', fontWeight: 700,
    color: '#4ED596', textTransform: 'uppercase', letterSpacing: '0.08em',
  },
  sliderRow: { display: 'flex', flexDirection: 'row', gap: '24px' },
  sliderCol: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '6px' },
  sliderTop: { display: 'flex', alignItems: 'center', gap: '7px' },
  sliderDot: { width: '9px', height: '9px', borderRadius: '50%', flexShrink: 0 },
  sliderLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px', fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  sliderMid: { display: 'flex', alignItems: 'baseline', gap: '6px' },
  sliderVal: { fontFamily: "'Merriweather Sans', system-ui, sans-serif", fontSize: '22px', lineHeight: 1 },
  delta: { fontFamily: "'Merriweather Sans', system-ui, sans-serif", fontSize: '11px', fontWeight: 700, color: '#E01B41' },
  range: { width: '100%', accentColor: '#4ED596', cursor: 'pointer' },
  noSliders: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px', color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic', padding: '16px 0',
  },

  /* ── Control balk ── */
  mainRow: {
    display: 'flex', flexDirection: 'row', alignItems: 'center',
    padding: '0 24px', height: '100px', gap: 0,
  },

  eventSection: {
    display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: '5px',
    flexShrink: 0, paddingRight: '16px',
  },
  eventSelect: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '11px', fontWeight: 700,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px', padding: '5px 10px',
    cursor: 'pointer', appearance: 'none', maxWidth: '160px',
  },

  screenNameSection: {
    display: 'flex', flexDirection: 'column', justifyContent: 'center',
    gap: '5px', minWidth: 0, paddingRight: '16px',
  },
  exploreTag: {
    display: 'flex', alignItems: 'center', gap: '6px',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px', fontWeight: 800,
    color: '#4ED596', letterSpacing: '0.14em', textTransform: 'uppercase',
  },
  exploreDot: {
    display: 'inline-block', width: '6px', height: '6px',
    borderRadius: '50%', background: '#4ED596',
    animation: 'explore-pulse 1.8s ease-in-out infinite', flexShrink: 0,
  },
  screenNameText: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px', fontWeight: 700, color: '#ffffff',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  microLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '8px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.16em',
    color: 'rgba(255,255,255,0.35)',
  },
  vDivider: {
    width: '1px', height: '60px',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0, margin: '0 20px',
  },

  /* ── Back knop — horizontale pill, prominent en podiumleesbaar ── */
  backBtn: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    height: '56px',
    padding: '0 28px',
    flexShrink: 0,
    borderRadius: '10px',
    border: '1px solid rgba(78,213,150,0.5)',
    cursor: 'pointer',
    background: 'rgba(78,213,150,0.1)',
    transition: 'background 0.18s, border-color 0.18s',
  },
  backLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px', fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '0.1em',
    color: '#4ED596',
  },
}
