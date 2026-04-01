import { useState } from 'react'

const DIMENSIONS = [
  { id: 'asset_class',    label: 'Asset Class',    icon: '◉' },
  { id: 'geography',      label: 'Geography',      icon: '⊕' },
  { id: 'esg',            label: 'ESG',            icon: '◈' },
  { id: 'implementation', label: 'Implementation', icon: '◧' },
  { id: 'performance',    label: 'Performance',    icon: '↗' },
  { id: 'sector',         label: 'Sector',         icon: '⬡' },
  { id: 'currency',       label: 'Currency',       icon: '€' },
  { id: 'style',          label: 'Style',          icon: '▦' },
]

function TotalBadge({ values, target = 100 }) {
  const total = values.reduce((s, v) => s + (Number(v) || 0), 0)
  const ok = Math.abs(total - target) < 1
  return (
    <span style={{
      padding: '1px 7px', borderRadius: 4,
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: '0.62rem', fontWeight: 800,
      background: ok ? 'rgba(78,213,150,0.12)' : 'rgba(224,27,65,0.12)',
      color: ok ? '#1a7a50' : '#E01B41',
      border: `1px solid ${ok ? 'rgba(78,213,150,0.3)' : 'rgba(224,27,65,0.3)'}`,
    }}>
      {total}%
    </span>
  )
}

function SliderRow({ label, color, value, base, min = 0, max = 70, onChange }) {
  const changed = value !== base
  const delta = value - base
  return (
    <div style={s.sliderRow}>
      <div style={s.sliderLabel}>
        {color && <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />}
        <span style={{ ...s.sliderName, color: changed ? '#0C182E' : '#4A4A44' }}>{label}</span>
      </div>
      <input type="range" min={min} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={s.range} />
      <span style={{ ...s.sliderVal, color: changed ? '#E01B41' : '#8A8A82', fontWeight: changed ? 800 : 600 }}>
        {value}{typeof value === 'number' && max <= 100 ? '%' : ''}
      </span>
      {changed && (
        <span style={s.delta}>{delta > 0 ? '+' : ''}{delta}</span>
      )}
    </div>
  )
}

export default function ExplorePanel({
  portfolio, explorePortfolio,
  onUpdateAlloc, onUpdateESG, onUpdateImpl, onUpdateSector, onUpdateCurrency,
  onResetAlloc,
  activeDimension, onSelectDimension, onExitExplore,
}) {
  // Determine which sliders to show based on active dimension
  const showAlloc = activeDimension === 'asset_class'
  const showGeo = activeDimension === 'geography'
  const showESG = activeDimension === 'esg'
  const showImpl = activeDimension === 'implementation'
  const showSector = activeDimension === 'sector'
  const showCurrency = activeDimension === 'currency'
  const noSliders = activeDimension === 'performance' || activeDimension === 'style'

  return (
    <div style={s.panel}>

      {/* Left: exit + label */}
      <div style={s.section}>
        <div style={s.exploreTag}><span style={s.exploreDot}>●</span>EXPLORE</div>
        <button style={s.exitBtn} onClick={onExitExplore}>← Back to programme</button>
      </div>

      <div style={s.vDivider} />

      {/* Centre: dimension-aware sliders */}
      <div style={s.sliderSection}>

        {showAlloc && (
          <>
            <div style={s.sectionLabel}>
              ASSET ALLOCATION
              <TotalBadge values={explorePortfolio.allocations.map(a => a.current)} />
            </div>
            <div style={s.sliders}>
              {explorePortfolio.allocations.map(a => {
                const base = portfolio.allocations.find(x => x.id === a.id)?.current ?? a.current
                return (
                  <SliderRow key={a.id}
                    label={a.label?.en || a.id} color={a.color}
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
              ASSET ALLOCATION
              <span style={{ fontSize: '0.52rem', color: '#8A8A82', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>
                — shifts geographic exposure
              </span>
              <TotalBadge values={explorePortfolio.allocations.map(a => a.current)} />
            </div>
            <div style={s.sliders}>
              {explorePortfolio.allocations.map(a => {
                const base = portfolio.allocations.find(x => x.id === a.id)?.current ?? a.current
                return (
                  <SliderRow key={a.id}
                    label={a.label?.en || a.id} color={a.color}
                    value={a.current} base={base}
                    onChange={v => onUpdateAlloc(a.id, v)} />
                )
              })}
            </div>
          </>
        )}

        {showESG && (
          <>
            <div style={s.sectionLabel}>ESG PROFILE</div>
            <div style={s.sliders}>
              <SliderRow label="ESG Score" color="#4ED596"
                value={explorePortfolio.esg?.score ?? portfolio.esg.score}
                base={portfolio.esg.score}
                min={0} max={10}
                onChange={v => onUpdateESG('score', v)} />
              {portfolio.esg.sfdr.map((item, i) => (
                <SliderRow key={item.article}
                  label={item.article} color={i === 0 ? '#4ED596' : i === 1 ? '#5B8DEF' : '#8A8A82'}
                  value={explorePortfolio.esg?.sfdr?.[i]?.weight ?? item.weight}
                  base={item.weight}
                  min={0} max={100}
                  onChange={v => onUpdateESG('sfdr', v, i)} />
              ))}
            </div>
          </>
        )}

        {showImpl && (
          <>
            <div style={s.sectionLabel}>
              IMPLEMENTATION MIX
              <TotalBadge values={[
                explorePortfolio.implementation?.active ?? portfolio.implementation.active,
                explorePortfolio.implementation?.passive ?? portfolio.implementation.passive,
                explorePortfolio.implementation?.individual ?? portfolio.implementation.individual,
              ]} />
            </div>
            <div style={s.sliders}>
              {[
                { key: 'active', label: 'Active', color: '#E01B41' },
                { key: 'passive', label: 'Passive / ETF', color: '#4ED596' },
                { key: 'individual', label: 'Individual', color: '#5B8DEF' },
              ].map(f => (
                <SliderRow key={f.key} label={f.label} color={f.color}
                  value={explorePortfolio.implementation?.[f.key] ?? portfolio.implementation[f.key]}
                  base={portfolio.implementation[f.key]}
                  onChange={v => onUpdateImpl(f.key, v)} />
              ))}
            </div>
          </>
        )}

        {showSector && (
          <>
            <div style={s.sectionLabel}>
              SECTOR WEIGHTS
              <TotalBadge values={(explorePortfolio.sectors || portfolio.sectors || []).map(s => s.weight)} />
            </div>
            <div style={s.sliders}>
              {(portfolio.sectors || []).map((sec, i) => {
                const exploreWeight = explorePortfolio.sectors?.[i]?.weight ?? sec.weight
                return (
                  <SliderRow key={sec.id} label={sec.label} color={sec.color}
                    value={exploreWeight} base={sec.weight}
                    onChange={v => onUpdateSector(i, v)} />
                )
              })}
            </div>
          </>
        )}

        {showCurrency && (
          <>
            <div style={s.sectionLabel}>
              CURRENCY WEIGHTS
              <TotalBadge values={(explorePortfolio.currencies || portfolio.currencies || []).map(c => c.weight)} />
            </div>
            <div style={s.sliders}>
              {(portfolio.currencies || []).map((cur, i) => {
                const exploreWeight = explorePortfolio.currencies?.[i]?.weight ?? cur.weight
                return (
                  <SliderRow key={cur.currency} label={cur.currency}
                    color={cur.currency === 'EUR' ? '#4ED596' : cur.currency === 'USD' ? '#E01B41' : '#5B8DEF'}
                    value={exploreWeight} base={cur.weight}
                    onChange={v => onUpdateCurrency(i, v)} />
                )
              })}
            </div>
          </>
        )}

        {noSliders && (
          <div style={{ color: '#8A8A82', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.72rem' }}>
            No live sliders for this dimension — switch to another to explore.
          </div>
        )}

        <button style={s.resetBtn} onClick={onResetAlloc}>Reset all to base</button>
      </div>

      <div style={s.vDivider} />

      {/* Right: dimension selector */}
      <div style={s.section}>
        <div style={s.sectionLabel}>DIMENSION</div>
        <div style={s.dimGrid}>
          {DIMENSIONS.map(d => {
            const isActive = activeDimension === d.id
            return (
              <button key={d.id} onClick={() => onSelectDimension(d.id)} style={{
                ...s.dimBtn,
                background: isActive ? '#E01B41' : '#FFFFFF',
                borderColor: isActive ? '#E01B41' : '#E0E0DC',
              }}>
                <span style={s.dimIcon}>{d.icon}</span>
                <span style={{ ...s.dimLabel, color: isActive ? '#FFFFFF' : '#0C182E' }}>{d.label}</span>
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}

const s = {
  panel: { height: '100%', display: 'flex', alignItems: 'stretch', background: '#F0F8F4', borderTop: '2.5px solid #4ED596' },
  section: { display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 10, padding: '10px 18px', flexShrink: 0 },
  sliderSection: { display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 18px', flex: 1, minWidth: 0, minHeight: 0, overflow: 'hidden' },
  vDivider: { width: 1, background: 'rgba(78,213,150,0.3)', margin: '14px 0', flexShrink: 0 },
  exploreTag: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', fontWeight: 800, color: '#4ED596', letterSpacing: '0.14em', display: 'flex', alignItems: 'center', gap: 5 },
  exploreDot: { fontSize: '0.5rem', animation: 'explore-pulse 1.8s ease-in-out infinite' },
  exitBtn: { padding: '7px 14px', background: '#FFFFFF', border: '1.5px solid #E0E0DC', borderRadius: 6, cursor: 'pointer', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.68rem', fontWeight: 700, color: '#0C182E', whiteSpace: 'nowrap' },
  sectionLabel: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.54rem', fontWeight: 800, color: '#8A8A82', letterSpacing: '0.12em', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 },
  sliders: { display: 'flex', flexDirection: 'column', gap: 3, overflowY: 'auto', flex: 1, minHeight: 0 },
  sliderRow: { display: 'flex', alignItems: 'center', gap: 8 },
  sliderLabel: { display: 'flex', alignItems: 'center', gap: 5, width: 120, flexShrink: 0 },
  sliderName: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.63rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  range: { flex: 1, height: 3, accentColor: '#E01B41', cursor: 'pointer', minWidth: 60 },
  sliderVal: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.72rem', width: 32, textAlign: 'right', flexShrink: 0 },
  delta: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.6rem', fontWeight: 700, color: '#E01B41', width: 26, textAlign: 'right', flexShrink: 0 },
  resetBtn: { flexShrink: 0, alignSelf: 'flex-start', padding: '4px 10px', background: 'none', border: '1px solid rgba(78,213,150,0.4)', borderRadius: 4, cursor: 'pointer', fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.6rem', fontWeight: 700, color: '#1a7a50', marginTop: 4 },
  dimGrid: { display: 'flex', flexWrap: 'wrap', gap: 5, maxWidth: 340 },
  dimBtn: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 10px', border: '1.5px solid', borderRadius: 6, cursor: 'pointer', minWidth: 70, transition: 'all 0.12s ease' },
  dimIcon: { fontSize: '0.82rem', lineHeight: 1 },
  dimLabel: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.54rem', fontWeight: 700, textAlign: 'center' },
}
