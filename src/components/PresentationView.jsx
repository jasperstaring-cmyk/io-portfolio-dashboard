import { useEffect, useState } from 'react'
import AssetClassChart from './charts/AssetClassChart'
import GeographyChart from './charts/GeographyChart'
import ESGChart from './charts/ESGChart'
import ImplementationChart from './charts/ImplementationChart'
import PerformanceChart from './charts/PerformanceChart'
import SectorChart from './charts/SectorChart'
import CurrencyChart from './charts/CurrencyChart'
import StyleChart from './charts/StyleChart'
import CostChart from './charts/CostChart'

const DIMENSIONS = {
  asset_class: AssetClassChart,
  geography: GeographyChart,
  esg: ESGChart,
  implementation: ImplementationChart,
  performance: PerformanceChart,
  sector: SectorChart,
  currency: CurrencyChart,
  style: StyleChart,
  cost: CostChart,
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
  const themeName = scenario?.theme?.[lang] || scenario?.theme?.en
  const compLabel = scenario?.comparison?.label?.[lang] || scenario?.comparison?.label?.en
  const sp = scenario?.speakerProfile

  return (
    <div style={s.container}>
      <div style={s.grid} />
      <div style={s.glow} />

      {/* ── HEADER ── */}
      <div style={s.header}>
        {/* Logo — left */}
        <div style={s.logoWrap}>
          <img src="/io_horizontal_white@10x.png" alt="Investment Officer"
            style={s.logo}
            onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex' }} />
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <span style={s.fallbackIo}>io</span>
            <span style={s.fallbackText}>investment officer</span>
          </div>
        </div>

        {/* Event name — centre */}
        <div style={s.eventName}>{event.name}</div>

        {/* Speaker profile — right */}
        {sp ? (
          <div style={s.speakerBlock}>
            <span style={s.nowDot}>● NOW</span>
            <span style={s.speakerName}>{sp.name}</span>
            <span style={s.speakerRole}>{sp.title}</span>
            <span style={s.speakerOrg}>{sp.organisation}</span>
          </div>
        ) : (
          <div style={{ minWidth: 220 }} />
        )}
      </div>

      {/* Red accent line */}
      <div style={s.redLine} />

      {/* ── POLICY QUESTION ── */}
      <div style={{
        ...s.policyBlock,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.42s ease, transform 0.42s ease',
      }}>
        <div style={s.policyMeta}>
          <span style={s.policyLabel}>PORTFOLIO QUESTION</span>
          <span style={s.themeTag}>{themeName}</span>
          {showComparison && compLabel && (
            <span style={s.compTag}>⟳ {compLabel}</span>
          )}
        </div>
        <div style={s.policyQuestion}>{policyQuestion}</div>
      </div>

      {/* ── CHART ── */}
      <div style={{
        ...s.chartArea,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(14px)',
        transition: 'opacity 0.52s ease 0.07s, transform 0.52s ease 0.07s',
      }}>
        <ChartComponent
          portfolio={portfolio}
          scenario={scenario}
          showComparison={showComparison}
          lang={lang}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <span style={s.footerLeft}>
          {portfolio.name} · {portfolio.profile} · {portfolio.currency}
        </span>
        <span style={s.footerRight}>Investment Officer © 2026</span>
      </div>
    </div>
  )
}

const s = {
  container: {
    width: '100%', height: '100%',
    background: '#0C182E',
    display: 'flex', flexDirection: 'column',
    padding: '20px 40px 14px',
    position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)
    `,
    backgroundSize: '72px 72px',
    pointerEvents: 'none', zIndex: 0,
  },
  glow: {
    position: 'absolute', top: '-100px', right: '5%',
    width: '700px', height: '400px',
    background: 'radial-gradient(ellipse, rgba(224,27,65,0.05) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },

  // Header: three-column layout
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    position: 'relative', zIndex: 1, flexShrink: 0,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center',
    minWidth: '220px',
  },
  logo: {
    height: '44px',   // prominent but not dominating
    width: 'auto', objectFit: 'contain',
  },
  fallbackIo: {
    fontFamily: "'Merriweather', serif",
    fontSize: '2.2rem', fontWeight: 700,
    color: '#fff', letterSpacing: '-0.05em',
  },
  fallbackText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)',
  },

  // Event name — centre, elegant but not overpowering
  eventName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.05rem', fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '0.04em',
    textAlign: 'center',
    flex: 1,
  },

  // Speaker block — right-aligned, compact 4-line card
  speakerBlock: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: '2px',
    minWidth: '220px',
  },
  nowDot: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.52rem', fontWeight: 800,
    color: '#E01B41', letterSpacing: '0.16em',
  },
  speakerName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.9rem', fontWeight: 800,
    color: '#FFFFFF',
  },
  speakerRole: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 400,
    color: 'rgba(255,255,255,0.5)',
  },
  speakerOrg: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.38)',
  },

  redLine: {
    height: '2px',
    background: 'linear-gradient(90deg, #E01B41 0%, rgba(224,27,65,0.22) 65%, transparent 100%)',
    marginBottom: '16px',
    flexShrink: 0, position: 'relative', zIndex: 1,
  },

  // Policy block — generous space, the heart of the screen
  policyBlock: {
    marginBottom: '18px',
    position: 'relative', zIndex: 1, flexShrink: 0,
  },
  policyMeta: {
    display: 'flex', alignItems: 'center', gap: '10px',
    marginBottom: '9px',
  },
  policyLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: '#E01B41', letterSpacing: '0.13em',
  },
  themeTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.07em', textTransform: 'uppercase',
    background: 'rgba(255,255,255,0.05)',
    padding: '3px 9px', borderRadius: '3px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  compTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 700,
    color: '#4ED596',
    background: 'rgba(78,213,150,0.1)',
    border: '1px solid rgba(78,213,150,0.28)',
    padding: '3px 9px', borderRadius: '3px',
  },
  policyQuestion: {
    fontFamily: "'Merriweather', serif",
    fontSize: 'clamp(1.2rem, 2.5vw, 1.8rem)',
    fontWeight: 700, color: '#FFFFFF',
    lineHeight: 1.28, letterSpacing: '-0.025em',
    maxWidth: '86%',
  },

  chartArea: {
    flex: 1, position: 'relative', zIndex: 1,
    minHeight: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'stretch',
  },

  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    paddingTop: '10px', marginTop: '10px',
    flexShrink: 0, position: 'relative', zIndex: 1,
  },
  footerLeft: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.5)',
  },
  footerRight: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)',
    fontWeight: 500,
  },
}
