import { useState } from 'react'
import PresentationView from './components/PresentationView'
import ExplorePresentationView from './components/ExplorePresentationView'
import IdleView from './components/IdleView'
import OperatorPanel from './components/OperatorPanel'
import ExplorePanel from './components/ExplorePanel'
import Configurator from './components/Configurator'
import rawRegistry from './data/registry.json'
import { ScaleContext } from './components/charts/chartTokens'
import { resolveRegistry } from './utils/resolveUseCase'
import './styles/global.css'

const initialScale = rawRegistry.displayScale ?? 1.0

const {
  event: initialEvent,
  usecases: initialUsecases,
  allEvents: allRegistryEvents,
} = resolveRegistry(rawRegistry)

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

function buildLegacyConfig(event, usecases, scale) {
  const normalizedUsecases = usecases.map(normalizeUsecaseForLegacy)
  return {
    event: {
      name: event.name,
      language: event.language || 'en',
    },
    portfolio: event.portfolio,
    scenarios: normalizedUsecases,
    usecases: normalizedUsecases,
    displayScale: scale ?? 1.0,
  }
}

function clonePortfolio(portfolio) {
  return JSON.parse(JSON.stringify(portfolio))
}

export default function App() {
  const [config, setConfig] = useState(
    buildLegacyConfig(initialEvent, initialUsecases, initialScale)
  )
  const [allEvents] = useState(allRegistryEvents || [])
  const [activeEventId, setActiveEventId] = useState(initialEvent?.id || null)
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [activeDimension, setActiveDimension] = useState(null)
  const [showConfig, setShowConfig] = useState(false)
  const [idleMode, setIdleMode] = useState(true)
  const [showPerformanceView, setShowPerformanceView] = useState(false)

  const [displayScale, setDisplayScale] = useState(initialScale)

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
    setShowPerformanceView(false)
  }

  function handleSelectEvent(eventId) {
    if (!allEvents?.length) return
    const event = allEvents.find(e => e.id === eventId)
    if (!event) return
    const usecases = event.usecases || event.scenarios || []
    setConfig(buildLegacyConfig(event, usecases, displayScale))
    setActiveEventId(eventId)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowPerformanceView(false)
    setIdleMode(true)
    setExplorePortfolio(clonePortfolio(event.portfolio))
  }

  function handleApplyConfig(newConfig) {
    if (newConfig.displayScale !== undefined) setDisplayScale(newConfig.displayScale)
    setConfig(newConfig)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowPerformanceView(false)
    setExplorePortfolio(clonePortfolio(newConfig.portfolio))
  }

  function handleSaveConfig(newConfig) {
    if (newConfig.displayScale !== undefined) setDisplayScale(newConfig.displayScale)
    setConfig(newConfig)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowPerformanceView(false)
    setShowConfig(false)
    setExplorePortfolio(clonePortfolio(newConfig.portfolio))
  }

  function handleSelectDimension(dim) {
    setActiveDimension(dim)
    setShowPerformanceView(false)
  }

  function handleTogglePerformanceView() {
    setShowPerformanceView(prev => !prev)
  }

  function handleEnterExplore() {
    const exploreConfig = activeScenario?.explore
    const startFrom = exploreConfig?.startFrom || 'base'
    const useCompareAsStart = startFrom === 'compare' && showComparison

    let startPortfolio
    if (useCompareAsStart && activeScenario?.comparison) {
      const baseClone = clonePortfolio(config.portfolio)
      const comp = activeScenario.comparison
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
    <ScaleContext.Provider value={displayScale}>
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
              showPerformanceView={showPerformanceView}
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
              onSelectDimension={handleSelectDimension}
              activeScenario={activeScenario}
              lang={lang}
              onEnterExplore={handleEnterExplore}
              allEvents={allEvents}
              activeEventId={activeEventId}
              onSelectEvent={handleSelectEvent}
              showPerformanceView={showPerformanceView}
              onTogglePerformanceView={handleTogglePerformanceView}
              idleMode={idleMode}
              onToggleIdle={() => setIdleMode(prev => !prev)}
              exploreActive={exploreMode}
              onOpenConfig={() => setShowConfig(true)}
            />
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
    </ScaleContext.Provider>
  )
}
