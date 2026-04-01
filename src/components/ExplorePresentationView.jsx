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

const DIM_LABELS = {
  asset_class: 'Asset Class',
  geography: 'Geography',
  esg: 'ESG Profile',
  implementation: 'Implementation',
  performance: 'Performance',
  sector: 'Sector Allocation',
  currency: 'Currency Exposure',
  style: 'Investment Style',
  cost: 'Cost & TER',
}

export default function ExplorePresentationView({
  event, portfolio, activeDimension, lang,
}) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 60)
    return () => clearTimeout(t)
  }, [activeDimension])

  const ChartComponent = DIMENSIONS[activeDimension] || AssetClassChart

  return (
    <div style={s.container}>
      <div style={s.grid} />
      {/* Green glow instead of red — explore mode visual cue */}
      <div style={s.glow} />

      {/* ── HEADER — compact ── */}
      <div style={s.header}>
        <div style={s.logoWrap}>
          <img src="/io_horizontal_white@10x.png" alt="Investment Officer"
            style={s.logo}
            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} />
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <span style={s.fallbackIo}>io</span>
            <span style={s.fallbackText}>investment officer</span>
          </div>
        </div>

        <div style={s.centre}>
          <span style={s.exploreTag}>● EXPLORE MODE</span>
          <span style={s.eventName}>{event.name}</span>
        </div>

        <div style={s.portfolioTag}>
          <span style={s.portLabel}>PORTFOLIO</span>
          <span style={s.portName}>{portfolio.name}</span>
          <span style={s.portSub}>{portfolio.profile} · {portfolio.currency}</span>
        </div>
      </div>

      {/* Green accent line */}
      <div style={s.greenLine} />

      {/* ── DIMENSION LABEL ── */}
      <div style={{
        ...s.dimRow,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease',
      }}>
        <span style={s.dimLabel}>{DIM_LABELS[activeDimension] || activeDimension}</span>
        <span style={s.dimHint}>Drag sliders in operator panel to explore allocations live</span>
      </div>

      {/* ── CHART — takes full remaining space ── */}
      <div style={{
        ...s.chartArea,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.45s ease 0.05s, transform 0.45s ease 0.05s',
      }}>
        <ChartComponent
          portfolio={portfolio}
          scenario={null}
          showComparison={false}
          lang={lang}
        />
      </div>

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <span style={s.footerLeft}>
          {portfolio.name} · {portfolio.profile} · {portfolio.currency}
        </span>
        <span style={s.footerRight}>Explore mode — Investment Officer © 2026</span>
      </div>
    </div>
  )
}

const s = {
  container: {
    width: '100%', height: '100%',
    background: '#0C182E',
    display: 'flex', flexDirection: 'column',
    padding: '16px 40px 12px',
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
    position: 'absolute', top: '-80px', right: '10%',
    width: '600px', height: '300px',
    background: 'radial-gradient(ellipse, rgba(78,213,150,0.06) 0%, transparent 65%)',
    pointerEvents: 'none', zIndex: 0,
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
    position: 'relative', zIndex: 1, flexShrink: 0,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center',
    minWidth: 180,
  },
  logo: {
    height: '36px', width: 'auto', objectFit: 'contain',
  },
  fallbackIo: {
    fontFamily: "'Merriweather', serif",
    fontSize: '2rem', fontWeight: 700, color: '#fff',
  },
  fallbackText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)',
  },
  centre: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 3, flex: 1,
  },
  exploreTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: '#4ED596', letterSpacing: '0.16em',
  },
  eventName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.95rem', fontWeight: 800,
    color: '#FFFFFF', letterSpacing: '0.04em',
  },
  portfolioTag: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'flex-end', gap: 1,
    minWidth: 180,
  },
  portLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.52rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.28)', letterSpacing: '0.12em',
  },
  portName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  portSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', color: 'rgba(255,255,255,0.35)',
  },
  greenLine: {
    height: 2,
    background: 'linear-gradient(90deg, #4ED596 0%, rgba(78,213,150,0.2) 60%, transparent 100%)',
    marginBottom: 10,
    flexShrink: 0, position: 'relative', zIndex: 1,
  },
  dimRow: {
    display: 'flex', alignItems: 'baseline', gap: 16,
    marginBottom: 10, flexShrink: 0,
    position: 'relative', zIndex: 1,
  },
  dimLabel: {
    fontFamily: "'Merriweather', serif",
    fontSize: 'clamp(1.1rem, 2.2vw, 1.5rem)',
    fontWeight: 700, color: '#FFFFFF',
  },
  dimHint: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.28)',
    fontStyle: 'italic',
  },
  chartArea: {
    flex: 1,
    position: 'relative', zIndex: 1,
    minHeight: 0, overflow: 'hidden',
    display: 'flex', alignItems: 'stretch',
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    paddingTop: 8, marginTop: 8,
    flexShrink: 0, position: 'relative', zIndex: 1,
  },
  footerLeft: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)',
  },
  footerRight: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', color: 'rgba(78,213,150,0.5)',
    fontWeight: 600,
  },
}
