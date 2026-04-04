import { useState } from 'react'
import PresentationView from './components/PresentationView'
import ExplorePresentationView from './components/ExplorePresentationView'
import IdleView from './components/IdleView'
import OperatorPanel from './components/OperatorPanel'
import ExplorePanel from './components/ExplorePanel'
import Configurator from './components/Configurator'
import rawRegistry from './data/registry.json'
import { resolveRegistry } from './utils/resolveUseCase'
import './styles/global.css'

// Laad het actieve event uit de registry
const { event: initialEvent, usecases: initialUsecases } = resolveRegistry(rawRegistry)

// Normaliseert een use case zodat zowel 'compare' (v1.1) als 'comparison' (v1.0)
// altijd beide aanwezig zijn — bestaande componenten lezen nog 'comparison',
// nieuwe code gebruikt 'compare'
function normalizeUsecaseForLegacy(uc) {
  const normalized = { ...uc }
  if (uc.compare !== undefined && uc.comparison === undefined) {
    normalized.comparison = uc.compare
  }
  if (uc.comparison !== undefined && uc.compare === undefined) {
    normalized.compare = uc.comparison
  }
  return normalized
}

// Bouw een config-object in het formaat dat de rest van de app verwacht
function buildLegacyConfig(event, usecases) {
  const normalizedUsecases = usecases.map(normalizeUsecaseForLegacy)
  return {
    event: {
      name: event.name,
      language: event.language || 'en',
    },
    portfolio: event.portfolio,
    scenarios: normalizedUsecases,
    usecases: normalizedUsecases,
  }
}

function clonePortfolio(portfolio) {
  return JSON.parse(JSON.stringify(portfolio))
}

export default function App() {
  const [config, setConfig] = useState(
    buildLegacyConfig(initialEvent, initialUsecases)
  )
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [activeDimension, setActiveDimension] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [idleMode, setIdleMode] = useState(true)

  const [exploreMode, setExploreMode] = useState(false)
  const [explorePortfolio, setExplorePortfolio] = useState(
    () => clonePortfolio(initialEvent.portfolio)
  )
  const [exploreDimension, setExploreDimension] = useState('asset_class')

  const lang = config.event.language || 'en'
  const activeScenario = config.scenarios[activeScenarioIndex]

  function handleSelectScenario(i) {
    setActiveScenarioIndex(i)
    setShowComparison(false)
    setActiveDimension(null)
  }

  // Apply — update dashboard state, keep configurator open
  function handleApplyConfig(newConfig) {
    setConfig(newConfig)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setExplorePortfolio(clonePortfolio(newConfig.portfolio))
  }

  // Save — update dashboard state and close configurator
  function handleSaveConfig(newConfig) {
    setConfig(newConfig)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowConfig(false)
    setExplorePortfolio(clonePortfolio(newConfig.portfolio))
  }

  function handleEnterExplore() {
    // Stap 5: startFrom "base" of "compare" — bepaald door use case explore-configuratie
    // Als startFrom "compare" is én compare actief is, start explore vanuit de compare-state
    const exploreConfig = activeScenario?.explore
    const startFrom = exploreConfig?.startFrom || 'base'
    const useCompareAsStart = startFrom === 'compare' && showComparison

    // Bepaal het startpunt: base portfolio of compare portfolio
    // resolveUseCase is al aangeroepen in PresentationView — hier klonen we direct
    let startPortfolio
    if (useCompareAsStart && activeScenario?.comparison) {
      // Deep merge van base portfolio met comparison-overrides als startpunt
      const baseClone = clonePortfolio(config.portfolio)
      const comp = activeScenario.comparison
      // Pas compare-velden toe op het startpunt
      if (comp.allocations) {
        baseClone.allocations = baseClone.allocations.map(a => {
          const c = comp.allocations.find(x => x.id === a.id)
          return c ? { ...a, ...c } : a
        })
      }
      if (comp.implementation) {
        if (comp.implementation.categories) {
          baseClone.implementation = { ...baseClone.implementation, categories: comp.implementation.categories.map(cc => {
            const base = (baseClone.implementation.categories || []).find(b => b.id === cc.id)
            return base ? { ...base, weight: cc.weight } : cc
          })}
        } else {
          baseClone.implementation = { ...baseClone.implementation, ...comp.implementation }
        }
      }
      if (comp.sectors)    baseClone.sectors    = baseClone.sectors.map(s => { const c = comp.sectors.find(x => x.id === s.id); return c ? { ...s, weight: c.weight } : s })
      if (comp.currencies) baseClone.currencies = baseClone.currencies.map(c => { const cc = comp.currencies.find(x => x.currency === c.currency); return cc ? { ...c, weight: cc.weight } : c })
      if (comp.esg)        baseClone.esg        = { ...baseClone.esg, ...comp.esg }
      startPortfolio = baseClone
    } else {
      startPortfolio = clonePortfolio(config.portfolio)
    }

    // Bereken geo-override voor startpositie
    const geoOverride = {}
    startPortfolio.allocations.forEach(a => {
      if (!a.geographic?.length) return
      const geoSum = a.geographic.reduce((s, g) => s + g.weight, 0)
      if (!geoSum) return
      const scale = a.current / geoSum
      a.geographic.forEach(g => {
        geoOverride[g.region] = Math.round(
          ((geoOverride[g.region] || 0) + g.weight * scale) * 10
        ) / 10
      })
    })
    startPortfolio.geoOverride = geoOverride

    setExplorePortfolio(startPortfolio)
    setExploreDimension(activeDimension || activeScenario.dimension)
    setExploreMode(true)
  }

  function handleUpdateAlloc(id, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      allocations: prev.allocations.map(a =>
        a.id === id ? { ...a, current: val } : a
      ),
    }))
  }

  function handleUpdateESG(key, val, sfdrIdx) {
    setExplorePortfolio(prev => {
      if (key === 'sfdr') {
        return {
          ...prev,
          esg: {
            ...prev.esg,
            sfdr: prev.esg.sfdr.map((s, i) =>
              i === sfdrIdx ? { ...s, weight: val } : s
            ),
          },
        }
      }
      return { ...prev, esg: { ...prev.esg, [key]: val } }
    })
  }

  function handleUpdateImpl(id, val) {
    setExplorePortfolio(prev => {
      const impl = prev.implementation
      // v1.1: categories array
      if (Array.isArray(impl?.categories)) {
        return {
          ...prev,
          implementation: {
            ...impl,
            categories: impl.categories.map(c =>
              c.id === id ? { ...c, weight: val } : c
            ),
          },
        }
      }
      // v1.0 fallback: plat object
      return { ...prev, implementation: { ...impl, [id]: val } }
    })
  }

  function handleUpdateSector(idx, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      sectors: prev.sectors.map((s, i) =>
        i === idx ? { ...s, weight: val } : s
      ),
    }))
  }

  function handleUpdateCurrency(idx, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      currencies: prev.currencies.map((c, i) =>
        i === idx ? { ...c, weight: val } : c
      ),
    }))
  }

  function handleUpdateGeo(region, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      geoOverride: { ...(prev.geoOverride || {}), [region]: val },
    }))
  }

  function handleResetAlloc() {
    setExplorePortfolio(clonePortfolio(config.portfolio))
  }

  return (
    <div className="app">
      <div className="presentation-wrapper">
        {idleMode ? (
          <IdleView event={config.event} />
        ) : exploreMode ? (
          <ExplorePresentationView
            event={config.event}
            portfolio={explorePortfolio}
            activeDimension={exploreDimension}
            lang={lang}
          />
        ) : (
          <PresentationView
            event={config.event}
            portfolio={config.portfolio}
            scenario={activeScenario}
            showComparison={showComparison}
            activeDimension={activeDimension || activeScenario.dimension}
            lang={lang}
          />
        )}
      </div>

      <div className="operator-wrapper" style={{ position: 'relative' }}>
        {exploreMode ? (
          <ExplorePanel
            portfolio={config.portfolio}
            explorePortfolio={explorePortfolio}
            onUpdateAlloc={handleUpdateAlloc}
            onUpdateESG={handleUpdateESG}
            onUpdateImpl={handleUpdateImpl}
            onUpdateSector={handleUpdateSector}
            onUpdateCurrency={handleUpdateCurrency}
            onUpdateGeo={handleUpdateGeo}
            onResetAlloc={handleResetAlloc}
            activeDimension={exploreDimension}
            onSelectDimension={setExploreDimension}
            onExitExplore={() => setExploreMode(false)}
          />
        ) : (
          <OperatorPanel
            scenarios={config.scenarios}
            activeIndex={activeScenarioIndex}
            onSelectScenario={handleSelectScenario}
            showComparison={showComparison}
            onToggleComparison={() => setShowComparison(!showComparison)}
            activeDimension={activeDimension || activeScenario.dimension}
            onSelectDimension={setActiveDimension}
            activeScenario={activeScenario}
            lang={lang}
            onEnterExplore={handleEnterExplore}
          />
        )}

        {!exploreMode && (
          <button
            onClick={() => setShowConfig(true)}
            style={{
              position: 'absolute', bottom: 10, right: 12,
              padding: '4px 10px', background: 'none',
              border: '1px solid #C5C5BF', borderRadius: 4, cursor: 'pointer',
              fontFamily: "'Merriweather Sans', sans-serif",
              fontSize: '0.58rem', fontWeight: 700, color: '#8A8A82',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              opacity: 0.6, transition: 'opacity 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.6}
          >
            ⚙ Configure
          </button>
        )}
        {!exploreMode && (
          <button
            onClick={() => setIdleMode(prev => !prev)}
            style={{
              position: 'absolute', bottom: 10, right: 108,
              padding: '4px 10px', background: 'none',
              border: `1px solid ${idleMode ? '#E01B41' : '#C5C5BF'}`,
              borderRadius: 4, cursor: 'pointer',
              fontFamily: "'Merriweather Sans', sans-serif",
              fontSize: '0.58rem', fontWeight: 700,
              color: idleMode ? '#E01B41' : '#8A8A82',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              opacity: 0.8, transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => e.target.style.opacity = 1}
            onMouseLeave={e => e.target.style.opacity = 0.8}
            title={
              idleMode
                ? 'Startscherm actief — klik om dashboard te starten'
                : 'Dashboard actief — klik voor startscherm'
            }
          >
            {idleMode ? '▶ Start' : '⏸ Idle'}
          </button>
        )}
      </div>

      {showConfig && (
        <Configurator
          config={config}
          onApply={handleApplyConfig}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
