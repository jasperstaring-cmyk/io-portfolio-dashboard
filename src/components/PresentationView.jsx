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
import { resolveUseCase } from '../utils/resolveUseCase'
import { useT, useTextScale } from './charts/chartTokens'

const DIMENSIONS = {
  asset_class:    AssetClassChart,
  geography:      GeographyChart,
  esg:            ESGChart,
  implementation: ImplementationChart,
  performance:    PerformanceChart,
  sector:         SectorChart,
  currency:       CurrencyChart,
  style:          StyleChart,
  cost:           CostChart,
}

export default function PresentationView({
  event, portfolio, scenario, showComparison, activeDimension,
  showPerformanceView, lang
}) {
  const T = useT()
  const textScale = useTextScale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(false)
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [scenario?.id, activeDimension, showPerformanceView])

  const resolvedEvent = { ...event, portfolio }
  const { resolvedBase, resolvedCompare, resolvedFraming } = resolveUseCase(
    resolvedEvent,
    scenario || {},
    { activeDimension: activeDimension || scenario?.dimension }
  )

  const ChartComponent = DIMENSIONS[activeDimension] || AssetClassChart
  const policyQuestion = scenario?.policyQuestion?.[lang] || scenario?.policyQuestion?.en
  const themeName      = scenario?.theme?.[lang]           || scenario?.theme?.en
  const compLabel      = scenario?.compare?.label?.[lang]  || scenario?.compare?.label?.en
                      || scenario?.comparison?.label?.[lang] || scenario?.comparison?.label?.en
  const sp             = scenario?.speakerProfile

  const comparisonPortfolio = showComparison ? resolvedCompare : null

  const perfView    = scenario?.performanceView
  const hasPerfView = !!(perfView?.base?.length || perfView?.compare?.length)

  const perfBasePortfolio = hasPerfView ? {
    ...resolvedBase,
    performance: { ...resolvedBase.performance, series: perfView.base || [] },
  } : null

  const perfComparePortfolio = (hasPerfView && showComparison && perfView?.compare?.length) ? {
    ...resolvedBase,
    performance: { ...resolvedBase.performance, series: perfView.compare },
  } : null

  const showingPerf = showPerformanceView && hasPerfView

  const s = makeStyles(T, textScale)

  return (
    <div style={s.container}>
      <div style={s.grid} />
      <div style={s.glow} />

      {/* ── HEADER ── */}
      <div style={s.header}>
        <div style={s.logoWrap}>
          <img
            src="/io_horizontal_white@10x.png"
            alt="Investment Officer"
            style={s.logo}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <span style={s.fallbackIo}>io</span>
            <span style={s.fallbackText}>investment officer</span>
          </div>
        </div>

        <div style={s.eventName}>{event.name}</div>

        {sp ? (
          <div style={s.speakerBlock}>
            <span style={s.nowDot}>● NOW</span>
            <span style={s.speakerName}>{sp.name}</span>
            <span style={s.speakerRole}>{sp.title}</span>
            <span style={s.speakerOrg}>{sp.organisation}</span>
          </div>
        ) : (
          <div style={s.speakerPlaceholder} />
        )}
      </div>

      <div style={s.redLine} />

      {/* ── POLICY QUESTION ── */}
      <div style={{
        ...s.policyBlock,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.42s ease, transform 0.42s ease',
      }}>
        <div style={s.policyMeta}>
          {showComparison && compLabel && (
            <span style={s.compTag}>⟳ {compLabel}</span>
          )}
          {showingPerf && (
            <span style={s.perfTag}>↗ Performance impact</span>
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
        {showingPerf ? (
          <PerformanceChart
            portfolio={perfBasePortfolio}
            comparisonPortfolio={perfComparePortfolio}
            showComparison={showComparison && !!perfComparePortfolio}
            lang={lang}
          />
        ) : (
          <ChartComponent
            portfolio={resolvedBase}
            comparisonPortfolio={comparisonPortfolio}
            showComparison={showComparison && !!comparisonPortfolio}
            framing={resolvedFraming}
            lang={lang}
          />
        )}
      </div>

      {/* ── FOOTER ── */}
      <div style={s.footer}>
        <span style={s.footerLeft}>
          <span style={s.footerLabel}>Portfolio Question</span>
          {scenario?.theme?.[lang] || scenario?.theme?.en || ''}
        </span>
        <span style={s.footerRight}>Investment Officer © 2026</span>
      </div>
    </div>
  )
}

// ─── Styles — T schaalt labels/chrome, textScale schaalt beleidsvraag ───────
function makeStyles(T, textScale) {
  return {
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

    // ── Header — schaalt op labelScale via T ──
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
      height: '44px',
      width: 'auto', objectFit: 'contain',
    },
    fallbackIo: {
      fontFamily: "'Merriweather', serif",
      fontSize: T.xlarge,
      fontWeight: 700,
      color: '#fff', letterSpacing: '-0.05em',
    },
    fallbackText: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.small,
      color: 'rgba(255,255,255,0.55)',
    },
    eventName: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.body,
      fontWeight: 800,
      color: '#FFFFFF',
      letterSpacing: '0.04em',
      textAlign: 'center',
      flex: 1,
    },
    speakerBlock: {
      display: 'flex', flexDirection: 'column',
      alignItems: 'flex-end', gap: '3px',
      minWidth: '220px',
    },
    speakerPlaceholder: {
      minWidth: '220px',
    },
    nowDot: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.micro,
      fontWeight: 800,
      color: '#E01B41', letterSpacing: '0.16em',
    },
    speakerName: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.medium,
      fontWeight: 800,
      color: '#FFFFFF',
      textAlign: 'right',
    },
    speakerRole: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.small,
      fontWeight: 400,
      color: 'rgba(255,255,255,0.55)',
      textAlign: 'right',
    },
    speakerOrg: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.small,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.38)',
      textAlign: 'right',
    },

    // ── Red line ──
    redLine: {
      height: '2px',
      background: 'linear-gradient(90deg, #E01B41 0%, rgba(224,27,65,0.22) 65%, transparent 100%)',
      marginBottom: '16px',
      flexShrink: 0, position: 'relative', zIndex: 1,
    },

    // ── Policy block — beleidsvraag schaalt op textScale ──
    policyBlock: {
      marginBottom: '18px',
      position: 'relative', zIndex: 1, flexShrink: 0,
    },
    policyMeta: {
      display: 'flex', alignItems: 'center', gap: '10px',
      marginBottom: '10px',
    },
    policyLabel: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.micro,
      fontWeight: 800,
      color: '#E01B41', letterSpacing: '0.13em',
    },
    themeTag: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.micro,
      fontWeight: 600,
      color: 'rgba(255,255,255,0.32)',
      letterSpacing: '0.07em', textTransform: 'uppercase',
      background: 'rgba(255,255,255,0.05)',
      padding: '3px 9px', borderRadius: '3px',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    compTag: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.micro,
      fontWeight: 700,
      color: '#4ED596',
      background: 'rgba(78,213,150,0.1)',
      border: '1px solid rgba(78,213,150,0.28)',
      padding: '3px 9px', borderRadius: '3px',
    },
    perfTag: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: T.micro,
      fontWeight: 700,
      color: '#5B8DEF',
      background: 'rgba(91,141,239,0.1)',
      border: '1px solid rgba(91,141,239,0.28)',
      padding: '3px 9px', borderRadius: '3px',
    },

    // Beleidsvraag: schaalt op textScale (onafhankelijk van grafiek-labels)
    policyQuestion: {
      fontFamily: "'Merriweather', serif",
      fontSize: `${(1.40 * textScale).toFixed(3)}rem`,
      fontWeight: 700,
      color: '#FFFFFF',
      lineHeight: 1.28, letterSpacing: '-0.025em',
      maxWidth: '86%',
    },

    // ── Chart area ──
    chartArea: {
      flex: 1, position: 'relative', zIndex: 1,
      minHeight: 0, overflow: 'hidden',
      display: 'flex', alignItems: 'stretch',
    },

    // ── Footer — bewust klein, schaalt niet ──
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
    footerLabel: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: '0.62rem',
      fontWeight: 800,
      color: '#E01B41',
      textTransform: 'uppercase',
      letterSpacing: '0.08em',
      marginRight: '8px',
    },
    footerRight: {
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: '0.62rem', color: 'rgba(255,255,255,0.45)',
      fontWeight: 500,
    },
  }
}
