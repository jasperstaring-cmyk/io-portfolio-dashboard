import { useT } from './chartTokens'
import { useState, useEffect, useRef } from 'react'
import ExploreTotalBadge from './ExploreTotalBadge'

const META = {
  financials:       { label: 'Cyclical',   detail: 'Sensitive to economic cycles — performs well in expansion, underperforms in downturns.' },
  real_estate_sec:  { label: 'Cyclical',   detail: 'Interest rate sensitive. Benefits from low rates and economic growth.' },
  consumer_disc:    { label: 'Cyclical',   detail: 'Discretionary spending falls in recessions — high beta to consumer confidence.' },
  materials:        { label: 'Cyclical',   detail: 'Tied to global industrial activity and commodity prices.' },
  technology:       { label: 'Sensitive',  detail: 'Growth-oriented. Sensitive to interest rate expectations and earnings revisions.' },
  industrials:      { label: 'Sensitive',  detail: 'Linked to global trade and capital investment cycles.' },
  energy:           { label: 'Sensitive',  detail: 'Driven by commodity prices and geopolitical dynamics.' },
  communication:    { label: 'Sensitive',  detail: 'Mix of growth (streaming, tech) and value (telecom) characteristics.' },
  healthcare:       { label: 'Defensive',  detail: 'Stable demand regardless of economic cycle — lower beta, consistent earnings.' },
  consumer_staples: { label: 'Defensive',  detail: 'Essential goods maintain demand in downturns — dividend-oriented.' },
  utilities:        { label: 'Defensive',  detail: 'Regulated, bond-like returns. Outperforms in risk-off environments.' },
}

const TOP_N = 3

export default function SectorChart({ portfolio, comparisonPortfolio, showComparison, lang, exploreMode = false }) {
  const T = useT()
  const s = makeStyles(T)
  const [animated, setAnimated] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      prevCompare.current = showComparison
      setSelectedId(null)
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const sectors = portfolio.sectors || []
  const rawSum  = sectors.reduce((s, sec) => s + (sec.weight || 0), 0)

  function getComp(id) {
    if (!showComparison || !comparisonPortfolio?.sectors) return null
    const found = comparisonPortfolio.sectors.find(s => s.id === id)
    return found != null ? found.weight : null
  }

  const active = sectors.map(s => {
    const comp = getComp(s.id)
    const displayVal = comp !== null ? comp : s.weight
    const delta = comp !== null ? comp - s.weight : 0
    const metaEntry = META[s.id] || { label: 'Other', detail: '' }
    return {
      ...s,
      compVal: comp,
      displayVal,
      delta,
      hasChange:  showComparison && comp !== null && delta !== 0,
      meta:       metaEntry.label,
      detail:     metaEntry.detail,
    }
  }).sort((a, b) => b.displayVal - a.displayVal)

  const top    = active.slice(0, TOP_N)
  const rest   = active.slice(TOP_N)
  const maxVal = active[0]?.displayVal || 1
  const hasSelection = !!selectedId

  const labelLang = s => s.label?.[lang] || s.label?.en || s.label || s.id

  function handleClick(id) {
    setSelectedId(prev => prev === id ? null : id)
  }

  return (
    <div style={{
      ...s.wrap,
      position: 'relative',
      opacity:   animated ? 1 : 0,
      transform: animated ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.5s ease, transform 0.5s ease',
    }}>
      <ExploreTotalBadge total={rawSum} label="Sectors" exploreMode={exploreMode} />

      <div style={s.sublabel}>
        SECTOR ALLOCATION
        {hasSelection && (
          <span style={{marginLeft:10, fontSize: T.micro, color: T.faint, fontWeight:600, letterSpacing:'0.06em'}}>
            CLICK AGAIN TO CLOSE
          </span>
        )}
      </div>

      {/* Top 3 kaarten */}
      <div style={s.topRow}>
        {top.map(sec => {
          const deltaColor  = sec.delta < 0 ? '#E01B41' : '#4ED596'
          const isSelected  = selectedId === sec.id
          const isDimmed    = hasSelection && !isSelected
          const borderCol   = isSelected
            ? sec.color
            : sec.hasChange
              ? (sec.delta < 0 ? 'rgba(224,27,65,0.35)' : 'rgba(78,213,150,0.35)')
              : 'rgba(255,255,255,0.07)'

          return (
            <div key={sec.id} onClick={() => handleClick(sec.id)} style={{
              ...s.topCard,
              borderColor: borderCol,
              opacity: isDimmed ? 0.35 : 1,
              cursor: 'pointer',
              background: isSelected
                ? 'rgba(255,255,255,0.07)'
                : 'rgba(255,255,255,0.04)',
              boxShadow: isSelected ? `0 0 0 1px ${sec.color}50` : 'none',
              transition: 'border-color 0.3s ease, opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
            }}>
              <div style={{ ...s.metaTag, color: sec.color }}>{sec.meta.toUpperCase()}</div>

              <div style={{
                ...s.topPct,
                color: sec.hasChange ? deltaColor : 'white',
                transition: 'color 0.5s ease',
              }}>
                {sec.displayVal}%
              </div>

              <div style={s.topName}>{labelLang(sec)}</div>

              <div style={s.topTrack}>
                {showComparison && (
                  <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${(sec.weight/maxVal)*100}%`,background:sec.color,opacity:0.18,borderRadius:3}} />
                )}
                <div style={{
                  position:'absolute',top:0,bottom:0,left:0,
                  width:`${(sec.displayVal/maxVal)*100}%`,
                  background: sec.hasChange ? deltaColor : sec.color,
                  opacity:0.82, borderRadius:3,
                  transition:'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                }} />
              </div>

              <div style={s.topDeltaSlot}>
                {sec.hasChange && (
                  <span style={{color:deltaColor, fontWeight:800, fontSize: T.medium}}>
                    {sec.delta>0?'+':''}{sec.delta}% vs base
                  </span>
                )}
              </div>

              {/* Detail — uitklapbaar bij selectie */}
              <div style={{maxHeight: isSelected ? 80 : 0, overflow:'hidden', transition:'max-height 0.35s ease'}}>
                <div style={{
                  fontFamily:"'Merriweather Sans', sans-serif",
                  fontSize: T.small, fontWeight:400,
                  color:'rgba(255,255,255,0.50)',
                  lineHeight:1.5,
                  paddingTop:8,
                  borderTop:`1px solid ${sec.color}30`,
                  marginTop:4,
                }}>
                  {sec.detail}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={s.divider}>
        <span style={s.dividerLabel}>REMAINING SECTORS</span>
        <div style={s.dividerLine} />
      </div>

      {/* Rest rijen */}
      <div style={s.restGrid}>
        {rest.map(sec => {
          const deltaColor = sec.delta < 0 ? '#E01B41' : '#4ED596'
          const isSelected = selectedId === sec.id
          const isDimmed   = hasSelection && !isSelected

          return (
            <div key={sec.id} onClick={() => handleClick(sec.id)} style={{
              ...s.restRow,
              opacity: isDimmed ? 0.32 : 1,
              cursor: 'pointer',
              background: isSelected ? 'rgba(255,255,255,0.05)' : 'transparent',
              borderRadius: 6,
              transition: 'opacity 0.3s ease, background 0.3s ease',
            }}>
              <div style={{...s.restStripe, background:sec.color, opacity: isSelected ? 1 : 0.75}} />

              <div style={s.restInfo}>
                <div style={{...s.restName, color: isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.75)'}}>{labelLang(sec)}</div>
                <div style={{...s.restMeta, color: isSelected ? sec.color : 'rgba(255,255,255,0.30)'}}>{sec.meta}</div>
              </div>

              <div style={s.restTrack}>
                {showComparison && (
                  <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${(sec.weight/maxVal)*100}%`,background:sec.color,opacity:0.15,borderRadius:3}} />
                )}
                <div style={{
                  position:'absolute',top:0,bottom:0,left:0,
                  width:`${(sec.displayVal/maxVal)*100}%`,
                  background: sec.hasChange ? deltaColor : sec.color,
                  opacity:0.75, borderRadius:3,
                  transition:'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                }} />
              </div>

              <div style={{...s.restPct, color: sec.hasChange ? deltaColor : 'rgba(255,255,255,0.6)', transition:'color 0.5s ease'}}>
                {sec.displayVal}%
              </div>

              <div style={s.restDeltaSlot}>
                {sec.hasChange && (
                  <span style={{color:deltaColor}}>{sec.delta>0?'+':''}{sec.delta}%</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

function makeStyles(T) {
  return {
  wrap: { display:'flex', flexDirection:'column', height:'100%', width:'100%', justifyContent:'center', gap:0, paddingTop:'6%' },
  sublabel: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.micro, fontWeight: T.wMicro, color: T.faint, letterSpacing:'0.1em', marginBottom:12, flexShrink:0 },
  topRow: { display:'flex', gap:12, marginBottom:14, flexShrink:0 },
  topCard: { flex:1, padding:'16px 20px', borderRadius:10, border:'1px solid', display:'flex', flexDirection:'column', gap:0 },
  metaTag: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.micro, fontWeight: T.wMicro, letterSpacing:'0.1em', opacity:0.75, marginBottom:6 },
  topPct: { fontFamily:"'Merriweather Sans', sans-serif", fontSize:'3.2rem', fontWeight:800, lineHeight:1, marginBottom:4 },
  topName: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.large, fontWeight: T.wBody, color:'rgba(255,255,255,0.75)', marginBottom:14 },
  topTrack: { height:10, background:'rgba(255,255,255,0.06)', borderRadius:4, position:'relative', overflow:'hidden', marginBottom:8 },
  topDeltaSlot: { height:22, display:'flex', alignItems:'center', fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.medium, color:'transparent' },
  divider: { display:'flex', alignItems:'center', gap:12, marginBottom:10, flexShrink:0 },
  dividerLabel: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.micro, fontWeight: T.wMicro, letterSpacing:'0.1em', color:'rgba(255,255,255,0.22)', whiteSpace:'nowrap' },
  dividerLine: { flex:1, height:1, background:'rgba(255,255,255,0.07)' },
  restGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'4px 28px', flex:1, alignContent:'start' },
  restRow: { display:'flex', alignItems:'center', gap:10, padding:'5px 6px' },
  restStripe: { width:4, height:32, borderRadius:2, flexShrink:0 },
  restInfo: { width:148, flexShrink:0 },
  restName: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.body, fontWeight: T.wBody, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', transition:'color 0.3s ease' },
  restMeta: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, transition:'color 0.3s ease' },
  restTrack: { flex:1, height:12, background:'rgba(255,255,255,0.06)', borderRadius:4, position:'relative', overflow:'hidden' },
  restPct: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.large, fontWeight: T.wHeavy, minWidth:42, textAlign:'right', flexShrink:0 },
  restDeltaSlot: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.medium, fontWeight: T.wHeavy, minWidth:44, textAlign:'right', flexShrink:0, color:'transparent' },
}
}
