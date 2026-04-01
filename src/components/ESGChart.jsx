import { useRef, useEffect } from 'react'

export default function ESGChart({ portfolio, scenario, showComparison }) {
  const esg = portfolio.esg
  const compEsg = showComparison ? scenario?.comparison?.esg : null
  const active = compEsg || esg

  const startAngle = 210, endAngle = 330
  const totalAng = endAngle - startAngle
  const cx = 160, cy = 150, r = 112

  function pt(angle) {
    return { x: cx + r * Math.cos(angle * Math.PI / 180), y: cy + r * Math.sin(angle * Math.PI / 180) }
  }
  function arcPath(start, end) {
    const s = pt(start), e = pt(end)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }

  const activeAngle = startAngle + (active.score / esg.maxScore) * totalAng
  const baseAngle = startAngle + (esg.score / esg.maxScore) * totalAng
  const scoreColor = active.score >= 7 ? '#4ED596' : active.score >= 5 ? '#F5A623' : '#E01B41'
  const needlePt = pt(activeAngle)
  const basePt = pt(baseAngle)

  const sfdr = active.sfdr || esg.sfdr
  const sfdrColors = { 'Article 9': '#4ED596', 'Article 8': '#5B8DEF', 'Article 6': '#8A8A82' }

  // Animate needle via JS for reliable cross-browser support
  const needleRef = useRef(null)
  useEffect(() => {
    // needle position is set via transform in render, transition handles animation
  }, [activeAngle])

  return (
    <div style={s.wrap}>
      <div style={s.gaugeCol}>
        <div style={s.label}>ESG SCORE</div>
        <div style={s.gaugeSvgWrap}>
          <svg viewBox="0 0 320 250" style={s.gaugeSvg} preserveAspectRatio="xMidYMid meet">
            {/* Background */}
            <path d={arcPath(startAngle, endAngle)}
              fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="20" strokeLinecap="round" />
            {/* Zones */}
            <path d={arcPath(startAngle, startAngle + totalAng * 0.4)}
              fill="none" stroke="rgba(224,27,65,0.18)" strokeWidth="20" strokeLinecap="round" />
            <path d={arcPath(startAngle + totalAng * 0.4, startAngle + totalAng * 0.7)}
              fill="none" stroke="rgba(245,166,35,0.18)" strokeWidth="20" strokeLinecap="round" />
            <path d={arcPath(startAngle + totalAng * 0.7, endAngle)}
              fill="none" stroke="rgba(78,213,150,0.18)" strokeWidth="20" strokeLinecap="round" />

            {/* Base arc when comparing */}
            {compEsg && (
              <path d={arcPath(startAngle, baseAngle)}
                fill="none" stroke="rgba(255,255,255,0.2)"
                strokeWidth="8" strokeLinecap="round" strokeDasharray="5 3" />
            )}

            {/* Active arc */}
            <path d={arcPath(startAngle, activeAngle)}
              fill="none" stroke={scoreColor} strokeWidth="20" strokeLinecap="round"
              style={{ transition: 'stroke 0.6s ease' }} />

            {/* Base needle dot */}
            {compEsg && (
              <circle cx={basePt.x} cy={basePt.y} r="7"
                fill="rgba(255,255,255,0.22)" stroke="#0C182E" strokeWidth="2" />
            )}

            {/* Active needle — transform for reliable animation */}
            <g ref={needleRef}
              style={{
                transform: `translate(${needlePt.x}px, ${needlePt.y}px)`,
                transition: 'transform 0.9s cubic-bezier(0.4,0,0.2,1)',
              }}>
              <circle r="12" fill={scoreColor} stroke="#0C182E" strokeWidth="3"
                style={{ transition: 'fill 0.6s ease' }} />
            </g>

            {/* Score label */}
            <text x={cx} y={cy - 20} textAnchor="middle"
              fontFamily="'Merriweather Sans', sans-serif"
              fontSize="10" fontWeight="800" fill="rgba(255,255,255,0.3)" letterSpacing="2">
              ESG SCORE
            </text>
            <text x={cx} y={cy + 24} textAnchor="middle"
              fontFamily="'Merriweather', serif" fontSize="52" fontWeight="700"
              fill={scoreColor} style={{ transition: 'fill 0.6s ease' }}>
              {active.score.toFixed(1)}
            </text>
            {compEsg ? (
              <text x={cx} y={cx + 46} textAnchor="middle"
                fontFamily="'Merriweather Sans', sans-serif" fontSize="11" fontWeight="700"
                fill={compEsg.score > esg.score ? '#4ED596' : '#E01B41'}>
                {compEsg.score > esg.score ? '▲ +' : '▼ '}
                {Math.abs(compEsg.score - esg.score).toFixed(1)} vs base
              </text>
            ) : (
              <text x={cx} y={cx + 46} textAnchor="middle"
                fontFamily="'Merriweather Sans', sans-serif" fontSize="10"
                fill="rgba(255,255,255,0.25)">
                out of {esg.maxScore}
              </text>
            )}

            {/* Scale */}
            {[0,2,4,6,8,10].map(v => {
              const a = startAngle + (v / esg.maxScore) * totalAng
              const p1 = { x: cx+(r-14)*Math.cos(a*Math.PI/180), y: cy+(r-14)*Math.sin(a*Math.PI/180) }
              const p2 = { x: cx+(r+14)*Math.cos(a*Math.PI/180), y: cy+(r+14)*Math.sin(a*Math.PI/180) }
              const pt2 = { x: cx+(r+27)*Math.cos(a*Math.PI/180), y: cy+(r+27)*Math.sin(a*Math.PI/180) }
              return (
                <g key={v}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <text x={pt2.x} y={pt2.y+3} textAnchor="middle" fontFamily="'Merriweather Sans'" fontSize="9" fill="rgba(255,255,255,0.22)">{v}</text>
                </g>
              )
            })}
          </svg>
        </div>

        <div style={s.metricCard}>
          <span style={s.mLabel}>Carbon Risk Score</span>
          <span style={{ ...s.mVal, color: esg.carbonRisk < 15 ? '#4ED596' : '#F5A623' }}>
            {esg.carbonRisk}
          </span>
          <span style={s.mSub}>lower = better</span>
        </div>
      </div>

      {/* SFDR */}
      <div style={s.sfdrCol}>
        <div style={s.label}>SFDR CLASSIFICATION{compEsg ? ' — SCENARIO' : ''}</div>

        {sfdr.map(item => {
          const baseItem = esg.sfdr.find(x => x.article === item.article)
          return (
            <div key={item.article} style={s.sfdrItem}>
              <div style={s.sfdrRow}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 115, flexShrink: 0 }}>
                  <div style={{ width: 11, height: 11, borderRadius: 3, background: sfdrColors[item.article], flexShrink: 0 }} />
                  <span style={s.sfdrName}>{item.article}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={s.sfdrTrack}>
                    {compEsg && baseItem && (
                      <div style={{
                        position: 'absolute', top: 0, bottom: 0, left: 0, borderRadius: 4,
                        background: sfdrColors[item.article], width: `${baseItem.weight}%`, opacity: 0.16,
                      }} />
                    )}
                    <div style={{
                      height: '100%', borderRadius: 4,
                      background: sfdrColors[item.article],
                      width: `${item.weight}%`, opacity: 0.78,
                      transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
                      position: 'relative', zIndex: 1,
                    }} />
                  </div>
                </div>
                <span style={{ ...s.sfdrPct, color: sfdrColors[item.article] }}>{item.weight}%</span>
              </div>
              <div style={s.sfdrDesc}>
                {item.article === 'Article 9' && 'Sustainable investment objective'}
                {item.article === 'Article 8' && 'Promotes environmental or social characteristics'}
                {item.article === 'Article 6' && 'No specific sustainability objective'}
              </div>
            </div>
          )
        })}

        <div style={{ marginTop: 16 }}>
          <div style={s.label}>PORTFOLIO DISTRIBUTION</div>
          <div style={s.stackedBar}>
            {sfdr.map(item => (
              <div key={item.article} style={{
                width: `${item.weight}%`, height: '100%',
                background: sfdrColors[item.article], opacity: 0.78,
                transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
              }} />
            ))}
          </div>
          <div style={s.stackLegend}>
            {sfdr.map(item => (
              <span key={item.article} style={{ ...s.stackItem, color: sfdrColors[item.article] }}>
                {item.article.replace('Article ', 'Art.')} {item.weight}%
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

const s = {
  wrap: { display: 'flex', gap: 44, height: '100%', width: '100%', alignItems: 'stretch' },
  gaugeCol: { flexShrink: 0, width: '40%', maxWidth: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 },
  gaugeSvgWrap: { flex: 1, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 },
  gaugeSvg: { width: '100%', height: '100%', display: 'block' },
  sfdrCol: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center', minWidth: 0 },
  label: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', fontWeight: 800, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: 4, alignSelf: 'flex-start' },
  metricCard: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '10px 20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8 },
  mLabel: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)' },
  mVal: { fontFamily: "'Merriweather', serif", fontSize: '1.8rem', fontWeight: 700 },
  mSub: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)' },
  sfdrItem: { display: 'flex', flexDirection: 'column', gap: 5 },
  sfdrRow: { display: 'flex', alignItems: 'center', gap: 12 },
  sfdrName: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.82rem', fontWeight: 700, color: 'rgba(255,255,255,0.85)' },
  sfdrTrack: { height: 30, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  sfdrPct: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '1.05rem', fontWeight: 800, width: 50, textAlign: 'right' },
  sfdrDesc: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.63rem', color: 'rgba(255,255,255,0.28)', paddingLeft: 123 },
  stackedBar: { height: 12, display: 'flex', borderRadius: 6, overflow: 'hidden', gap: 1, marginTop: 6 },
  stackLegend: { display: 'flex', gap: 16, marginTop: 6 },
  stackItem: { fontFamily: "'Merriweather Sans', sans-serif", fontSize: '0.65rem', fontWeight: 700 },
}
