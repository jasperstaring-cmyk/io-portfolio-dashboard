import { useT } from './chartTokens'
import { useRef, useState, useEffect } from 'react'
import ExploreTotalBadge from './ExploreTotalBadge'

const SFDR_COLORS = {
  'Article 9': '#4ED596',
  'Article 8': '#5B8DEF',
  'Article 6': '#8A8A82',
}

const SFDR_DESC = {
  'Article 9': 'Sustainable investment objective',
  'Article 8': 'Promotes environmental or social characteristics',
  'Article 6': 'No specific sustainability objective',
}

const SFDR_DETAIL = {
  'Article 9': 'Funds with a specific sustainable investment objective — the strictest category. Every investment must contribute to an environmental or social goal, with no significant harm to others.',
  'Article 8': 'Funds that promote E or S characteristics alongside financial returns. ESG integration is systematic but sustainable investment is not the primary objective.',
  'Article 6': 'Funds that consider sustainability risks but have no explicit E or S objectives. Standard disclosure requirements apply.',
}

const SFDR_FLEX = {
  'Article 9': 1.55,
  'Article 8': 1.15,
  'Article 6': 0.85,
}

function scoreColor(s) {
  if (s >= 7) return '#4ED596'
  if (s >= 5) return '#F5A623'
  return '#E01B41'
}

function sfdrRgb(color) {
  if (color === '#4ED596') return '78,213,150'
  if (color === '#5B8DEF') return '91,141,239'
  return '138,138,130'
}

export default function ESGChart({ portfolio, comparisonPortfolio, showComparison, exploreMode = false }) {
  const T = useT()
  const s = makeStyles(T)
  const [animated, setAnimated] = useState(false)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      prevCompare.current = showComparison
      setSelectedArticle(null)
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const esg     = portfolio.esg
  const compEsg = showComparison ? comparisonPortfolio?.esg : null
  const active  = compEsg || esg

  const cx = 140, cy = 138, r = 105
  const startDeg = 210, endDeg = 330, totalDeg = endDeg - startDeg

  function pt(deg) {
    const rad = (deg - 90) * Math.PI / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  function arcPath(s, e) {
    const [x1,y1] = pt(s), [x2,y2] = pt(e)
    const large = (e - s) > 180 ? 1 : 0
    return `M ${x1},${y1} A ${r} ${r} 0 ${large} 1 ${x2},${y2}`
  }

  const activeEnd = startDeg + (active.score / esg.maxScore) * totalDeg
  const baseEnd   = startDeg + (esg.score  / esg.maxScore) * totalDeg
  const col       = scoreColor(active.score)
  const arcLen    = 2 * Math.PI * r * (totalDeg / 360)
  const dashOffset = arcLen * (1 - active.score / esg.maxScore)
  const [nx, ny]  = pt(activeEnd)
  const [bx, by]  = pt(baseEnd)

  const sfdrBase   = esg.sfdr   || []
  const sfdrActive = active.sfdr || esg.sfdr || []
  const sfdrSum    = sfdrActive.reduce((s, x) => s + (x.weight || 0), 0)

  const sfdrItems = sfdrActive.map(item => {
    const base  = sfdrBase.find(x => x.article === item.article)
    const delta = base ? item.weight - base.weight : 0
    return {
      ...item,
      baseWeight: base?.weight ?? item.weight,
      delta,
      hasChange: showComparison && delta !== 0,
      color:  SFDR_COLORS[item.article] ?? '#8A8A82',
      desc:   SFDR_DESC[item.article]   ?? '',
      detail: SFDR_DETAIL[item.article] ?? '',
      flex:   SFDR_FLEX[item.article]   ?? 1,
    }
  })

  const deltaScore   = compEsg ? +(active.score - esg.score).toFixed(1) : null
  const hasSelection = !!selectedArticle

  function handleCardClick(article) {
    setSelectedArticle(prev => prev === article ? null : article)
  }

  return (
    <div style={{ ...s.wrap, position: 'relative' }}>
      <ExploreTotalBadge total={sfdrSum} label="SFDR" exploreMode={exploreMode} />

      <div style={s.gaugeCol}>
        <div style={s.sublabel}>ESG SCORE</div>
        <div style={s.gaugeSvgWrap}>
          <svg viewBox="0 0 280 200" preserveAspectRatio="xMidYMid meet"
            style={{
              ...s.gaugeSvg,
              opacity: animated ? 1 : 0,
              transform: animated ? 'scale(1)' : 'scale(0.93)',
              transition: 'opacity 0.5s ease, transform 0.55s cubic-bezier(0.34,1.26,0.64,1)',
              transformOrigin: 'center',
            }}
          >
            <defs>
              <radialGradient id="esg-glow-new" cx="50%" cy="65%" r="48%">
                <stop offset="0%" stopColor={col} stopOpacity="0.14" />
                <stop offset="100%" stopColor={col} stopOpacity="0" />
              </radialGradient>
            </defs>
            <ellipse cx={cx} cy={cy+20} rx="120" ry="90" fill="url(#esg-glow-new)" style={{transition:'fill 0.6s ease'}} />
            <path d={arcPath(startDeg,endDeg)} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="18" strokeLinecap="round" />
            <path d={arcPath(startDeg, startDeg+totalDeg*0.40)} fill="none" stroke="rgba(224,27,65,0.16)" strokeWidth="18" strokeLinecap="round" />
            <path d={arcPath(startDeg+totalDeg*0.40, startDeg+totalDeg*0.70)} fill="none" stroke="rgba(245,166,35,0.16)" strokeWidth="18" strokeLinecap="round" />
            <path d={arcPath(startDeg+totalDeg*0.70, endDeg)} fill="none" stroke="rgba(78,213,150,0.16)" strokeWidth="18" strokeLinecap="round" />
            {compEsg && <path d={arcPath(startDeg,baseEnd)} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="8" strokeLinecap="round" strokeDasharray="5 4" />}
            <path d={arcPath(startDeg,endDeg)} fill="none" stroke={col} strokeWidth="18" strokeLinecap="round"
              strokeDasharray={arcLen} strokeDashoffset={dashOffset}
              style={{transition:'stroke-dashoffset 0.9s cubic-bezier(0.4,0,0.2,1), stroke 0.6s ease'}} />
            {compEsg && <circle cx={bx} cy={by} r="7" fill="rgba(255,255,255,0.20)" stroke="#0C182E" strokeWidth="2" />}
            <g style={{transform:`translate(${nx}px,${ny}px)`, transition:'transform 0.9s cubic-bezier(0.4,0,0.2,1)'}}>
              <circle r="16" fill={col} opacity="0.14" style={{transition:'fill 0.6s ease'}} />
              <circle r="11" fill={col} stroke="#0C182E" strokeWidth="2.5" style={{transition:'fill 0.6s ease'}} />
            </g>
            {/* ESG score groot — schaalbaar via svgHero */}
            <text x={cx} y={cy-14} textAnchor="middle" fontFamily="'Merriweather Sans', sans-serif" fontSize="48" fontWeight="800" fill={col} style={{transition:'fill 0.6s ease'}}>{active.score.toFixed(1)}</text>
            <text x={cx} y={cy+14} textAnchor="middle" fontFamily="'Merriweather Sans', sans-serif" fontSize={T.svgSmall} fontWeight="600" fill={T.faint}>
              {deltaScore ? (deltaScore>0?`+${deltaScore} vs base`:`${deltaScore} vs base`) : `out of ${esg.maxScore}`}
            </text>
          </svg>
        </div>

        <div style={{
          ...s.carbonCard,
          borderColor: esg.carbonRisk < 15 ? 'rgba(78,213,150,0.20)' : 'rgba(245,166,35,0.20)',
        }}>
          <div style={s.sublabel}>CARBON RISK SCORE</div>
          <div style={{...s.carbonVal, color: esg.carbonRisk < 15 ? '#4ED596' : '#F5A623'}}>{esg.carbonRisk}</div>
          <div style={s.carbonSub}>lower = better</div>
        </div>
      </div>

      <div style={s.sfdrCol}>
        <div style={s.sublabel}>
          SFDR CLASSIFICATION{compEsg ? ' — SCENARIO' : ''}
          {hasSelection && (
            <span style={{marginLeft:10, fontSize: T.micro, color: T.faint, fontWeight:600, letterSpacing:'0.06em'}}>
              CLICK AGAIN TO CLOSE
            </span>
          )}
        </div>

        {sfdrItems.map(item => {
          const deltaColor = item.delta > 0 ? '#4ED596' : '#E01B41'
          const isSelected = selectedArticle === item.article
          const isDimmed   = hasSelection && !isSelected
          const borderCol  = isSelected ? item.color
            : item.hasChange ? (item.delta > 0 ? 'rgba(78,213,150,0.35)' : 'rgba(224,27,65,0.35)')
            : 'rgba(255,255,255,0.07)'

          return (
            <div key={item.article} onClick={() => handleCardClick(item.article)} style={{
              ...s.sfdrCard,
              borderColor: borderCol,
              opacity: isDimmed ? 0.35 : 1,
              cursor: 'pointer',
              background: isSelected ? `rgba(${sfdrRgb(item.color)},0.08)` : 'rgba(255,255,255,0.04)',
              boxShadow: isSelected ? `0 0 0 1px ${item.color}40` : 'none',
              transition: 'border-color 0.3s ease, opacity 0.3s ease, background 0.3s ease, box-shadow 0.3s ease',
            }}>
              <div style={s.sfdrHeader}>
                <div>
                  <div style={{
                    ...s.sfdrName,
                    color: item.color,
                    fontSize: item.article === 'Article 9' ? T.large : T.body,
                  }}>
                    {item.article}
                  </div>
                  <div style={s.sfdrDesc}>{item.desc}</div>
                </div>
                <div style={s.sfdrPctWrap}>
                  <div style={{
                    ...s.sfdrPct,
                    color: item.hasChange ? deltaColor : 'white',
                    fontSize: item.article === 'Article 9' ? T.hero : T.display,
                    transition: 'color 0.5s ease',
                  }}>
                    {item.weight}%
                  </div>
                  <div style={{height:18, display:'flex', alignItems:'center', justifyContent:'flex-end'}}>
                    {item.hasChange && (
                      <span style={{fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, fontWeight: T.wHeavy, color:deltaColor}}>
                        {item.delta>0?'+':''}{item.delta}% vs base
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div style={s.sfdrTrack}>
                {showComparison && <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${item.baseWeight}%`,background:item.color,opacity:0.16,borderRadius:4}} />}
                <div style={{position:'absolute',top:0,bottom:0,left:0,width:`${item.weight}%`,background:item.hasChange?deltaColor:item.color,opacity:0.85,borderRadius:4,transition:'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease'}} />
              </div>

              <div style={{maxHeight: isSelected ? 100 : 0, overflow:'hidden', transition:'max-height 0.35s ease'}}>
                <div style={{fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, fontWeight:400, color:'rgba(255,255,255,0.55)', lineHeight:1.55, paddingTop:8, borderTop:`1px solid ${item.color}30`, marginTop:6}}>
                  {item.detail}
                </div>
              </div>
            </div>
          )
        })}

        <div>
          <div style={{...s.sublabel, marginBottom:6}}>PORTFOLIO DISTRIBUTION</div>
          <div style={s.distTrack}>
            {sfdrItems.map((item, i) => (
              <div key={item.article} onClick={() => handleCardClick(item.article)} style={{
                flex: item.weight, background: item.color,
                opacity: hasSelection ? (selectedArticle===item.article ? 0.90 : 0.25) : 0.80,
                borderRight: i < sfdrItems.length-1 ? '2px solid #0C182E' : 'none',
                cursor: 'pointer',
                transition: 'flex 0.85s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease',
              }} />
            ))}
          </div>
          <div style={s.distLegend}>
            {sfdrItems.map(item => (
              <span key={item.article} onClick={() => handleCardClick(item.article)} style={{
                fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, fontWeight: T.wMedium,
                color: item.color, cursor:'pointer',
                opacity: hasSelection ? (selectedArticle===item.article ? 1 : 0.35) : 1,
                transition:'opacity 0.3s ease',
              }}>
                {item.article.replace('Article ','Art.')} {item.weight}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function makeStyles(T) {
  return {
  wrap: { display:'flex', gap:32, height:'100%', width:'100%', alignItems:'center' },
  gaugeCol: { flexShrink:0, width:'42%', maxWidth:380, display:'flex', flexDirection:'column', alignItems:'center', gap:10, alignSelf:'stretch' },
  gaugeSvgWrap: { flex:1, width:'100%', display:'flex', alignItems:'center', justifyContent:'center', minHeight:0 },
  gaugeSvg: { width:'100%', height:'100%', display:'block' },
  carbonCard: { width:'100%', padding:'10px 18px', background:'rgba(255,255,255,0.04)', border:'1px solid', borderRadius:10, display:'flex', flexDirection:'column', alignItems:'center', gap:2, flexShrink:0 },
  carbonVal: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.display, fontWeight: T.wHeavy, lineHeight:1 },
  carbonSub: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, color: T.faint },
  sfdrCol: { flex:1, display:'flex', flexDirection:'column', gap:6, minWidth:0 },
  sfdrCard: { padding:'10px 14px', borderRadius:10, border:'1px solid', display:'flex', flexDirection:'column', gap:6, flex:'none' },
  sfdrHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 },
  sfdrName: { fontFamily:"'Merriweather Sans', sans-serif", fontWeight: T.wMedium, lineHeight:1.2 },
  sfdrDesc: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.small, color:'rgba(255,255,255,0.32)', marginTop:2 },
  sfdrPctWrap: { flexShrink:0, textAlign:'right' },
  sfdrPct: { fontFamily:"'Merriweather Sans', sans-serif", fontWeight: T.wHeavy, lineHeight:1 },
  sfdrTrack: { height:8, background:'rgba(255,255,255,0.06)', borderRadius:4, position:'relative', overflow:'hidden', flexShrink:0 },
  distTrack: { height:10, borderRadius:5, overflow:'hidden', display:'flex' },
  distLegend: { display:'flex', gap:16, marginTop:5 },
  sublabel: { fontFamily:"'Merriweather Sans', sans-serif", fontSize: T.micro, fontWeight: T.wMicro, color: T.faint, letterSpacing:'0.1em', alignSelf:'flex-start' },
}
}
