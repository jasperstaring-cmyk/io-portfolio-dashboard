import { useState } from 'react'
import PresentationView from './components/PresentationView'
import OperatorPanel from './components/OperatorPanel'
import eventConfig from './data/eventConfig.json'
import './styles/global.css'

export default function App() {
  const [activeScenarioIndex, setActiveScenarioIndex] = useState(0)
  const [showComparison, setShowComparison] = useState(false)
  const [activeDimension, setActiveDimension] = useState(null)
  const lang = eventConfig.event.language || 'en'

  const activeScenario = eventConfig.scenarios[activeScenarioIndex]

  function handleSelectScenario(i) {
    setActiveScenarioIndex(i)
    setShowComparison(false)
    setActiveDimension(null)
  }

  return (
    <div className="app">
      <div className="presentation-wrapper">
        <PresentationView
          event={eventConfig.event}
          portfolio={eventConfig.portfolio}
          scenario={activeScenario}
          showComparison={showComparison}
          activeDimension={activeDimension || activeScenario.dimension}
          lang={lang}
        />
      </div>
      <div className="operator-wrapper">
        <OperatorPanel
          scenarios={eventConfig.scenarios}
          activeIndex={activeScenarioIndex}
          onSelectScenario={handleSelectScenario}
          showComparison={showComparison}
          onToggleComparison={() => setShowComparison(!showComparison)}
          activeDimension={activeDimension || activeScenario.dimension}
          onSelectDimension={setActiveDimension}
          activeScenario={activeScenario}
          lang={lang}
        />
      </div>
    </div>
  )
}
