import { useState } from 'react'
import PresentationView from './components/PresentationView'
import ExplorePresentationView from './components/ExplorePresentationView'
import OperatorPanel from './components/OperatorPanel'
import ExplorePanel from './components/ExplorePanel'
import Configurator from './components/Configurator'
import defaultConfig from './data/eventConfig.json'
import './styles/global.css'

function clonePortfolio(portfolio) {
  return JSON.parse(JSON.stringify(portfolio))
}

export default function App() {
  const [config, setConfig] = useState(defaultConfig)
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [activeDimension, setActiveDimension] = useState(null)
  const [showConfig, setShowConfig] = useState(false)

  const [exploreMode, setExploreMode] = useState(false)
  const [explorePortfolio, setExplorePortfolio] = useState(() => clonePortfolio(defaultConfig.portfolio))
  const [exploreDimension, setExploreDimension] = useState('asset_class')

  const lang = config.event.language || 'en'
  const activeScenario = config.scenarios[activeScenarioIndex]

  function handleSelectScenario(i) {
    setActiveScenarioIndex(i)
    setShowComparison(false)
    setActiveDimension(null)
  }

  function handleSaveConfig(newConfig) {
    setConfig(newConfig)
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowConfig(false)
    setExplorePortfolio(clonePortfolio(newConfig.portfolio))
  }

  function handleEnterExplore() {
    setExplorePortfolio(clonePortfolio(config.portfolio))
    setExploreDimension(activeDimension || activeScenario.dimension)
    setExploreMode(true)
  }

  // Explore updaters — each modifies explorePortfolio immutably
  function handleUpdateAlloc(id, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      allocations: prev.allocations.map(a => a.id === id ? { ...a, current: val } : a),
    }))
  }

  function handleUpdateESG(key, val, sfdrIdx) {
    setExplorePortfolio(prev => {
      if (key === 'sfdr') {
        return {
          ...prev,
          esg: {
            ...prev.esg,
            sfdr: prev.esg.sfdr.map((s, i) => i === sfdrIdx ? { ...s, weight: val } : s),
          },
        }
      }
      return { ...prev, esg: { ...prev.esg, [key]: val } }
    })
  }

  function handleUpdateImpl(key, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      implementation: { ...prev.implementation, [key]: val },
    }))
  }

  function handleUpdateSector(idx, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      sectors: prev.sectors.map((s, i) => i === idx ? { ...s, weight: val } : s),
    }))
  }

  function handleUpdateCurrency(idx, val) {
    setExplorePortfolio(prev => ({
      ...prev,
      currencies: prev.currencies.map((c, i) => i === idx ? { ...c, weight: val } : c),
    }))
  }

  function handleResetAlloc() {
    setExplorePortfolio(clonePortfolio(config.portfolio))
  }

  return (
    <div className="app">
      <div className="presentation-wrapper">
        {exploreMode ? (
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
      </div>

      {showConfig && (
        <Configurator
          config={config}
          onSave={handleSaveConfig}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  )
}
