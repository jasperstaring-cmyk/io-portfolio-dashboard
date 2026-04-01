export default function ESGChart({ portfolio, scenario, showComparison }) {
  const esg = portfolio.esg
  const compEsg = showComparison && scenario?.comparison?.esg
  const active = compEsg || esg

  const startAngle = 210, endAngle = 330
  const totalAng = endAngle - startAngle
  const cx = 160, cy = 160, r = 120

  function pt(angle) {
    return {
      x: cx + r * Math.cos(angle * Math.PI / 180),
      y: cy + r * Math.sin(angle * Math.PI / 180),
    }
  }

  function arcPath(start, end) {
    const s = pt(start), e = pt(end)
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }

  const scoreAngle = startAngle + (active.score / esg.maxScore) * totalAng
  const baseAngle = startAngle + (esg.score / esg.maxScore) * totalAng
  const scoreColor = active.score >= 7 ? '#4ED596' : active.score >= 5 ? '#F5A623' : '#E01B41'

  const sfdr = active.sfdr || esg.sfdr
  const sfdrColors = { 'Article 9': '#4ED596', 'Article 8': '#5B8DEF', 'Article 6': '#8A8A82' }

  return (
    <div style={s.wrap}>
      {/* Gauge */}
      <div style={s.gaugeCol}>
        <div style={s.label}>ESG SCORE</div>
        <svg viewBox="0 0 320 260" style={s.gaugeSvg}>
          {/* Background arc */}
          <path d={arcPath(startAngle, endAngle)}
            fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="20" strokeLinecap="round" />

          {/* Zone coloring */}
          <path d={arcPath(startAngle, startAngle + totalAng * 0.4)}
            fill="none" stroke="rgba(224,27,65,0.18)" strokeWidth="20" strokeLinecap="round" />
          <path d={arcPath(startAngle + totalAng * 0.4, startAngle + totalAng * 0.7)}
            fill="none" stroke="rgba(245,166,35,0.18)" strokeWidth="20" strokeLinecap="round" />
          <path d={arcPath(startAngle + totalAng * 0.7, endAngle)}
            fill="none" stroke="rgba(78,213,150,0.18)" strokeWidth="20" strokeLinecap="round" />

          {/* Base arc when comparing */}
          {compEsg && (
            <path d={arcPath(startAngle, baseAngle)}
              fill="none" stroke="rgba(255,255,255,0.18)"
              strokeWidth="10" strokeLinecap="round" strokeDasharray="5 3" />
          )}

          {/* Score arc */}
          <path d={arcPath(startAngle, scoreAngle)}
            fill="none" stroke={scoreColor}
            strokeWidth="20" strokeLinecap="round" />

          {/* Needle */}
          <circle cx={pt(scoreAngle).x} cy={pt(scoreAngle).y}
            r="12" fill={scoreColor} stroke="#0C182E" strokeWidth="3" />

          {/* Score text */}
          <text x={cx} y={cy - 20} textAnchor="middle"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="11" fontWeight="800" fill="rgba(255,255,255,0.32)" letterSpacing="2">
            ESG SCORE
          </text>
          <text x={cx} y={cy + 28} textAnchor="middle"
            fontFamily="'Merriweather', serif"
            fontSize="58" fontWeight="700" fill={scoreColor}>
            {active.score.toFixed(1)}
          </text>
          <text x={cx} y={cy + 50} textAnchor="middle"
            fontFamily="'Merriweather Sans', sans-serif"
            fontSize="11" fill="rgba(255,255,255,0.28)">
            out of {esg.maxScore}
          </text>

          {/* Scale */}
          {[0,2,4,6,8,10].map(v => {
            const a = startAngle + (v / esg.maxScore) * totalAng
            const p1 = { x: cx + (r-14)*Math.cos(a*Math.PI/180), y: cy + (r-14)*Math.sin(a*Math.PI/180) }
            const p2 = { x: cx + (r+14)*Math.cos(a*Math.PI/180), y: cy + (r+14)*Math.sin(a*Math.PI/180) }
            const pt2 = { x: cx + (r+28)*Math.cos(a*Math.PI/180), y: cy + (r+28)*Math.sin(a*Math.PI/180) }
            return (
              <g key={v}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                <text x={pt2.x} y={pt2.y + 3} textAnchor="middle"
                  fontFamily="'Merriweather Sans'" fontSize="9"
                  fill="rgba(255,255,255,0.22)">{v}</text>
              </g>
            )
          })}
        </svg>

        {/* Carbon metric */}
        <div style={s.metricRow}>
          <div style={s.metricCard}>
            <span style={s.metricLabel}>Carbon Risk Score</span>
            <span style={{
              ...s.metricVal,
              color: esg.carbonRisk < 15 ? '#4ED596' : '#F5A623',
            }}>{esg.carbonRisk}</span>
            <span style={s.metricSub}>lower = better</span>
          </div>
          {compEsg && (
            <div style={s.compareCard}>
              <span style={s.metricLabel}>Base score</span>
              <span style={s.metricValMuted}>{esg.score.toFixed(1)}</span>
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.82rem', fontWeight: 800,
                color: compEsg.score > esg.score ? '#4ED596' : '#E01B41',
              }}>
                {compEsg.score > esg.score ? '↑ +' : '↓ '}
                {Math.abs(compEsg.score - esg.score).toFixed(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* SFDR */}
      <div style={s.sfdrCol}>
        <div style={s.label}>SFDR CLASSIFICATION</div>

        {sfdr.map(item => (
          <div key={item.article} style={s.sfdrItem}>
            <div style={s.sfdrHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 115 }}>
                <div style={{ width: 11, height: 11, borderRadius: 3, background: sfdrColors[item.article], flexShrink: 0 }} />
                <span style={s.sfdrName}>{item.article}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={s.sfdrTrack}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: sfdrColors[item.article],
                    width: `${item.weight}%`,
                    opacity: 0.78,
                    transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
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
        ))}

        {/* Stacked bar */}
        <div style={{ marginTop: 16 }}>
          <div style={s.label}>PORTFOLIO DISTRIBUTION</div>
          <div style={s.stackedBar}>
            {sfdr.map(item => (
              <div key={item.article} style={{
                width: `${item.weight}%`,
                height: '100%',
                background: sfdrColors[item.article],
                opacity: 0.78,
                transition: 'width 0.7s ease',
              }} />
            ))}
          </div>
          <div style={s.stackedLegend}>
            {sfdr.map(item => (
              <span key={item.article} style={{ ...s.stackedItem, color: sfdrColors[item.article] }}>
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
  wrap: {
    display: 'flex', gap: 44,
    height: '100%', width: '100%',
    alignItems: 'center',
  },
  gaugeCol: {
    flexShrink: 0, width: '42%', maxWidth: 340,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 0,
    height: '100%', justifyContent: 'center',
  },
  gaugeSvg: {
    width: '100%', height: 'auto', maxHeight: '240px',
  },
  sfdrCol: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 16, justifyContent: 'center',
  },
  label: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em',
    marginBottom: 4,
  },
  metricRow: {
    display: 'flex', gap: 10, marginTop: 4,
  },
  metricCard: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
    padding: '12px 18px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 8,
  },
  compareCard: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 2,
    padding: '12px 18px',
    background: 'rgba(78,213,150,0.06)',
    border: '1px solid rgba(78,213,150,0.2)',
    borderRadius: 8,
  },
  metricLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.38)',
  },
  metricVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.7rem', fontWeight: 700,
  },
  metricValMuted: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.3rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.45)',
  },
  metricSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', color: 'rgba(255,255,255,0.25)',
  },
  sfdrItem: {
    display: 'flex', flexDirection: 'column', gap: 5,
  },
  sfdrHeader: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  sfdrName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.82rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.85)',
  },
  sfdrTrack: {
    height: 30,
    background: 'rgba(255,255,255,0.05)',
    borderRadius: 4, overflow: 'hidden',
  },
  sfdrPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.05rem', fontWeight: 800,
    width: 50, textAlign: 'right',
  },
  sfdrDesc: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.63rem', color: 'rgba(255,255,255,0.28)',
    paddingLeft: 123,
  },
  stackedBar: {
    height: 12, display: 'flex',
    borderRadius: 6, overflow: 'hidden',
    gap: 1, marginTop: 6,
  },
  stackedLegend: {
    display: 'flex', gap: 16, marginTop: 6,
  },
  stackedItem: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', fontWeight: 700,
  },
}
