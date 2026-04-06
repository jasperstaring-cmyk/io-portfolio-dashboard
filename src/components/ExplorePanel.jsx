function TotalBadge({ values }) {
  const total = Math.round(values.reduce((s, v) => s + (v || 0), 0))
  const ok = total === 100
  const over = total > 100
  const color = ok ? '#4ED596' : over ? '#E01B41' : '#F5A623'
  return (
    <span style={{
      fontFamily: "'Merriweather Sans', system-ui, sans-serif",
      fontSize: '9px', fontWeight: 800,
      color, marginLeft: '8px', letterSpacing: '0.06em',
    }}>
      {total}%{ok ? ' ✓' : ''}
    </span>
  )
}

function SliderRow({ label, color, value, base, onChange, min = 0, max = 100 }) {
  const changed = value !== base
  const delta = value - base
  return (
    <div style={s.sliderRow}>
      <div style={s.sliderLabel}>
        <span style={{ ...s.sliderDot, background: color }} />
        <span style={s.sliderName}>{label}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={s.range} />
      <span style={{ ...s.sliderVal, color: changed ? '#E01B41' : 'rgba(255,255,255,0.5)', fontWeight: changed ? 800 : 600 }}>
        {value}{typeof value === 'number' && max <= 100 ? '%' : ''}
      </span>
      {changed && (
        <span style={s.delta}>{delta > 0 ? '+' : ''}{delta}</span>
      )}
    </div>
  )
}

const GEO_COLORS = {
  'Europe': '#5B8DEF',
  'North America': '#F5A623',
  'Asia Pacific': '#A78BFA',
  'Emerging Markets': '#8A8A82',
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
  activeDimension, onSelectDimension, onExitExplore,
}) {
  const showAlloc    = activeDimension === 'asset_class'
  const showGeo      = activeDimension === 'geography'
  const showESG      = activeDimension === 'esg'
  const showImpl     = activeDimension === 'implementation'
  const showSector   = activeDimension === 'sector'
  const showCurrency = activeDimension === 'currency'
  const noSliders    = ['performance', 'style', 'cost'].includes(activeDimension)

  const baseImplCats    = getImplCategories(portfolio.implementation)
  const exploreImplCats = getImplCategories(explorePortfolio.implementation)

  return (
    <div style={s.panel}>

      {/* Groene lijn bovenaan — explore staat */}
      <div style={s.greenLine} />

      <div style={s.mainRow}>

        {/* ── Links: explore label + exit ── */}
        <div style={s.exitSection}>
          <div style={s.exploreTag}>
            <span style={s.exploreDot} />
            Explore
          </div>
          <button style={s.exitBtn} onClick={onExitExplore}>← Back</button>
        </div>

        <div style={s.vDivider} />

        {/* ── Sliders ── */}
        <div style={s.sliderSection}>

          {showAlloc && (
            <>
              <div style={s.sectionLabel}>
                Allocation
                <TotalBadge values={explorePortfolio.allocations.map(a => a.current)} />
              </div>
              <div style={s.sliders}>
                {explorePortfolio.allocations.map(a => {
                  const base = portfolio.allocations.find(x => x.id === a.id)?.current ?? a.current
                  const label = typeof a.label === 'string' ? a.label : a.label?.en || a.id
                  return (
                    <SliderRow key={a.id} label={label} color={a.color || '#8A8A82'}
                      value={a.current} base={base}
                      onChange={v => onUpdateAlloc(a.id, v)} />
                  )
                })}
              </div>
            </>
          )}

          {showGeo && (
            <>
              <div style={s.sectionLabel}>
                Geography
                <TotalBadge values={Object.values(explorePortfolio.geoOverride || {})} />
              </div>
              <div style={s.sliders}>
                {Object.entries(explorePortfolio.geoOverride || {}).map(([region, weight]) => {
                  const base = portfolio.allocations.reduce((sum, a) => {
                    const geoSum = a.geographic?.reduce((s, g) => s + g.weight, 0) || 0
                    if (!geoSum) return sum
                    const scale = a.current / geoSum
                    const g = a.geographic?.find(x => x.region === region)
                    return sum + (g ? g.weight * scale : 0)
                  }, 0)
                  return (
                    <SliderRow key={region} label={region}
                      color={GEO_COLORS[region] || '#8A8A82'}
                      value={Math.round(weight)} base={Math.round(base)}
                      onChange={v => onUpdateGeo(region, v)} />
                  )
                })}
              </div>
            </>
          )}

          {showESG && (
            <>
              <div style={s.sectionLabel}>ESG Score</div>
              <div style={s.sliders}>
                <SliderRow label="ESG Score" color="#4ED596"
                  value={explorePortfolio.esg?.score ?? 0}
                  base={portfolio.esg?.score ?? 0}
                  min={0} max={10}
                  onChange={v => onUpdateESG('score', v)} />
                {explorePortfolio.esg?.sfdr?.map((sfdrItem, i) => (
                  <SliderRow key={sfdrItem.article} label={sfdrItem.article}
                    color={i === 0 ? '#4ED596' : i === 1 ? '#5B8DEF' : '#8A8A82'}
                    value={sfdrItem.weight}
                    base={portfolio.esg?.sfdr?.[i]?.weight ?? sfdrItem.weight}
                    onChange={v => onUpdateESG('sfdr', v, i)} />
                ))}
              </div>
            </>
          )}

          {showImpl && (
            <>
              <div style={s.sectionLabel}>
                Implementation
                <TotalBadge values={exploreImplCats.map(c => c.weight)} />
              </div>
              <div style={s.sliders}>
                {exploreImplCats.map(cat => {
                  const base = baseImplCats.find(b => b.id === cat.id)?.weight ?? cat.weight
                  const label = typeof cat.label === 'string' ? cat.label : cat.label?.en || cat.id
                  return (
                    <SliderRow key={cat.id} label={label} color={cat.color || '#8A8A82'}
                      value={cat.weight} base={base}
                      onChange={v => onUpdateImpl(cat.id, v)} />
                  )
                })}
              </div>
            </>
          )}

          {showSector && (
            <>
              <div style={s.sectionLabel}>
                Sectors
                <TotalBadge values={explorePortfolio.sectors?.map(s => s.weight) || []} />
              </div>
              <div style={s.sliders}>
                {explorePortfolio.sectors?.map((sec, i) => {
                  const base = portfolio.sectors?.[i]?.weight ?? sec.weight
                  const label = typeof sec.label === 'string' ? sec.label : sec.label?.en || sec.id
                  return (
                    <SliderRow key={sec.id} label={label} color={sec.color || '#8A8A82'}
                      value={sec.weight} base={base}
                      onChange={v => onUpdateSector(i, v)} />
                  )
                })}
              </div>
            </>
          )}

          {showCurrency && (
            <>
              <div style={s.sectionLabel}>
                Currency
                <TotalBadge values={explorePortfolio.currencies?.map(c => c.weight) || []} />
              </div>
              <div style={s.sliders}>
                {explorePortfolio.currencies?.map((cur, i) => {
                  const base = portfolio.currencies?.[i]?.weight ?? cur.weight
                  const color = cur.currency === 'EUR' ? '#5B8DEF' : cur.currency === 'USD' ? '#F5A623' : cur.currency === 'GBP' ? '#A78BFA' : '#8A8A82'
                  return (
                    <SliderRow key={cur.currency} label={cur.currency} color={color}
                      value={cur.weight} base={base}
                      onChange={v => onUpdateCurrency(i, v)} />
                  )
                })}
              </div>
            </>
          )}

          {noSliders && (
            <div style={s.noSliders}>
              No sliders available for this dimension.
            </div>
          )}

        </div>

        <div style={s.vDivider} />

        {/* ── Reset ── */}
        <div style={s.resetSection}>
          <button style={s.resetBtn} onClick={onResetAlloc}>Reset to base</button>
        </div>

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
  },
  greenLine: {
    height: '3px',
    background: '#4ED596',
    width: '100%',
  },
  mainRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 24px',
    height: '100px',
    gap: 0,
  },

  /* Exit sectie */
  exitSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: '10px',
    flexShrink: 0,
    paddingRight: '4px',
  },
  exploreTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px',
    fontWeight: 800,
    color: '#4ED596',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
  },
  exploreDot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    background: '#4ED596',
    animation: 'explore-pulse 1.8s ease-in-out infinite',
    flexShrink: 0,
  },
  exitBtn: {
    padding: '7px 14px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '10px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.8)',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
  },

  /* Divider */
  vDivider: {
    width: '1px',
    height: '60px',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
    margin: '0 20px',
  },

  /* Sliders */
  sliderSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  sectionLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '8px',
    fontWeight: 800,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  sliders: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
    flex: 1,
    minHeight: 0,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  sliderLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    width: '110px',
    flexShrink: 0,
  },
  sliderDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  sliderName: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '10px',
    fontWeight: 500,
    color: 'rgba(255,255,255,0.75)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  range: {
    flex: 1,
    height: '3px',
    accentColor: '#4ED596',
    cursor: 'pointer',
    minWidth: '60px',
  },
  sliderVal: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '11px',
    width: '36px',
    textAlign: 'right',
    flexShrink: 0,
  },
  delta: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px',
    fontWeight: 700,
    color: '#E01B41',
    width: '28px',
    textAlign: 'right',
    flexShrink: 0,
  },
  noSliders: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '11px',
    color: 'rgba(255,255,255,0.35)',
    fontStyle: 'italic',
  },

  /* Reset sectie */
  resetSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resetBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid rgba(78,213,150,0.35)',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px',
    fontWeight: 700,
    color: '#4ED596',
    whiteSpace: 'nowrap',
    transition: 'background 0.15s',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
}
