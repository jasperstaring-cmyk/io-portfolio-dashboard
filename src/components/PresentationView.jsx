import { useEffect, useState } from 'react'
import AssetClassChart from './charts/AssetClassChart'
import GeographyChart from './charts/GeographyChart'
import ESGChart from './charts/ESGChart'
import ImplementationChart from './charts/ImplementationChart'
import PerformanceChart from './charts/PerformanceChart'

const DIMENSIONS = {
  asset_class: AssetClassChart,
  geography: GeographyChart,
  esg: ESGChart,
  implementation: ImplementationChart,
  performance: PerformanceChart,
}

export default function PresentationView({
  event, portfolio, scenario, showComparison, activeDimension, lang
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [scenario?.id, activeDimension])

  const ChartComponent = DIMENSIONS[activeDimension] || AssetClassChart
  const policyQuestion = scenario?.policyQuestion?.[lang] || scenario?.policyQuestion?.en
  const speakerName = scenario?.speaker?.[lang] || scenario?.speaker?.en
  const themeName = scenario?.theme?.[lang] || scenario?.theme?.en

  return (
    <div style={styles.container}>
      {/* Subtle background texture */}
      <div style={styles.gridOverlay} />
      <div style={styles.glowAccent} />

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logoArea}>
          <img
            src="/io_horizontal_white@10x.png"
            alt="Investment Officer"
            style={styles.logo}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div style={{ display: 'none', alignItems: 'center', gap: '6px' }}>
            <span style={styles.logoFallbackIo}>io</span>
            <span style={styles.logoFallbackText}>investment<br/>officer</span>
          </div>
          <div style={styles.headerDivider} />
          <div style={styles.eventMeta}>
            <span style={styles.eventName}>{event.name}</span>
            <span style={styles.eventDate}>{event.date} — {event.location}</span>
          </div>
        </div>
        <div style={styles.speakerMeta}>
          <span style={styles.nowBadge}>NOW</span>
          <span style={styles.speakerName}>{speakerName}</span>
        </div>
      </div>

      {/* Red accent line */}
      <div style={styles.accentLine} />

      {/* Policy question */}
      <div style={{
        ...styles.policyWrap,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}>
        <div style={styles.policyMeta}>
          <span style={styles.policyLabel}>PORTFOLIO QUESTION</span>
          <span style={styles.themeTag}>{themeName}</span>
        </div>
        <div style={styles.policyQuestion}>{policyQuestion}</div>
      </div>

      {/* Chart — takes ALL remaining space */}
      <div style={{
        ...styles.chartArea,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
        transition: 'opacity 0.5s ease 0.06s, transform 0.5s ease 0.06s',
      }}>
        <ChartComponent
          portfolio={portfolio}
          scenario={scenario}
          showComparison={showComparison}
          lang={lang}
        />
      </div>

      {/* Comparison badge */}
      {showComparison && scenario?.comparison && (
        <div style={styles.compBadge}>
          <span style={styles.compLabel}>COMPARING</span>
          <span style={styles.compName}>
            {scenario.comparison.label?.[lang] || scenario.comparison.label?.en}
          </span>
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <span style={styles.footerLeft}>
          {portfolio.name} · {portfolio.profile} · {portfolio.currency}
        </span>
        <span style={styles.footerRight}>investmentofficer.eu</span>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    background: '#0C182E',
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 36px 12px',
    position: 'relative',
    overflow: 'hidden',
    gap: '10px',
  },
  gridOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)
    `,
    backgroundSize: '64px 64px',
    pointerEvents: 'none',
    zIndex: 0,
  },
  glowAccent: {
    position: 'absolute',
    top: '-80px',
    right: '8%',
    width: '600px',
    height: '350px',
    background: 'radial-gradient(ellipse, rgba(224,27,65,0.05) 0%, transparent 65%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  },
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  logo: {
    height: '26px',
    width: 'auto',
    objectFit: 'contain',
  },
  logoFallbackIo: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1,
    letterSpacing: '-0.04em',
  },
  logoFallbackText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 1.4,
  },
  headerDivider: {
    width: '1px',
    height: '26px',
    background: 'rgba(255,255,255,0.12)',
  },
  eventMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
  },
  eventName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.76rem',
    fontWeight: 700,
    color: '#FFFFFF',
    letterSpacing: '0.01em',
  },
  eventDate: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.38)',
  },
  speakerMeta: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
  },
  nowBadge: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.52rem',
    fontWeight: 800,
    color: '#E01B41',
    letterSpacing: '0.16em',
  },
  speakerName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.72)',
  },
  accentLine: {
    height: '1.5px',
    background: 'linear-gradient(90deg, #E01B41 0%, rgba(224,27,65,0.3) 60%, transparent 100%)',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  policyWrap: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
  },
  policyMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  policyLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem',
    fontWeight: 800,
    color: '#E01B41',
    letterSpacing: '0.13em',
  },
  themeTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    fontWeight: 600,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.07em',
    textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.05)',
    padding: '2px 8px',
    borderRadius: '3px',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  policyQuestion: {
    fontFamily: "'Merriweather', serif",
    fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)',
    fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1.3,
    letterSpacing: '-0.025em',
    maxWidth: '82%',
  },
  chartArea: {
    flex: 1,
    position: 'relative',
    zIndex: 1,
    minHeight: 0,
    overflow: 'hidden',
  },
  compBadge: {
    position: 'absolute',
    top: '18px',
    right: '36px',
    background: 'rgba(78,213,150,0.09)',
    border: '1px solid rgba(78,213,150,0.32)',
    borderRadius: '6px',
    padding: '6px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '2px',
    zIndex: 10,
  },
  compLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.5rem',
    fontWeight: 800,
    color: '#4ED596',
    letterSpacing: '0.14em',
  },
  compName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#4ED596',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: '8px',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  footerLeft: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    color: 'rgba(255,255,255,0.22)',
  },
  footerRight: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem',
    color: 'rgba(255,255,255,0.16)',
  },
}
