import { useState } from 'react'
import PresentationView from './components/PresentationView'
import OperatorPanel from './components/OperatorPanel'
import Configurator from './components/Configurator'
import defaultConfig from './data/eventConfig.json'
import './styles/global.css'

export default function App() {
  const [config, setConfig] = useState(defaultConfig)
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [activeDimension, setActiveDimension] = useState(null)
  const [showConfig, setShowConfig] = useState(false)

  const lang = config.event.language || 'en'
  const activeScenario = config.scenarios[activeScenarioIndex]

  function handleSelectScenario(i) {
    setActiveScenarioIndex(i)
    setShowComparison(false)
    setActiveDimension(null)
  }

  function handleSaveConfig(newConfig) {
    setConfig(newConfig)
    // Reset to first scenario when config changes
    setActiveScenarioIndex(0)
    setShowComparison(false)
    setActiveDimension(null)
    setShowConfig(false)
  }

  return (
    <div className="app">
      <div className="presentation-wrapper">
        <PresentationView
          event={config.event}
          portfolio={config.portfolio}
          scenario={activeScenario}
          showComparison={showComparison}
          activeDimension={activeDimension || activeScenario.dimension}
          lang={lang}
        />
      </div>
      <div className="operator-wrapper" style={{ position: 'relative' }}>
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
        />
        {/* Subtle config button — bottom right of operator panel */}
        <button
          onClick={() => setShowConfig(true)}
          title="Open configurator"
          style={{
            position: 'absolute',
            bottom: 10, right: 12,
            padding: '4px 10px',
            background: 'none',
            border: '1px solid #C5C5BF',
            borderRadius: 4,
            cursor: 'pointer',
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: '0.58rem', fontWeight: 700,
            color: '#8A8A82',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            opacity: 0.6,
            transition: 'opacity 0.2s ease',
          }}
          onMouseEnter={e => e.target.style.opacity = 1}
          onMouseLeave={e => e.target.style.opacity = 0.6}
        >
          ⚙ Configure
        </button>
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
