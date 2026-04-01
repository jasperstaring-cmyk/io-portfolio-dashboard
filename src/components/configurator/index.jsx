import { useState } from 'react'
import { useConfigDraft } from './useConfigDraft'
import ConfigEventTab from './ConfigEventTab'
import ConfigScenarioTab from './ConfigScenarioTab'
import { c } from './configuratorStyles'

export default function Configurator({ config: initialConfig, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState('event')
  const [activeScenario, setActiveScenario] = useState(0)
  const [saved, setSaved] = useState(false)

  const { draft, ...updaters } = useConfigDraft(initialConfig)

  function handleSaveAndClose() {
    onSave(draft)
  }

  function handleSaveAndStay() {
    onSave(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const tabs = [
    { id: 'event', label: 'Event & Portfolio' },
    { id: 'scenarios', label: `Scenarios (${draft.scenarios.length})` },
  ]

  return (
    <div style={c.overlay}>
      <div style={c.panel}>

        {/* Header */}
        <div style={c.header}>
          <div>
            <div style={c.headerTitle}>Dashboard Configurator</div>
            <div style={c.headerSub}>{draft.event.name || 'Event setup'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {saved && (
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.72rem', color: '#4ED596', fontWeight: 700,
              }}>
                ✓ Applied
              </span>
            )}
            <button style={c.btnCancel} onClick={onClose}>Close</button>
            <button style={c.btnSaveStay} onClick={handleSaveAndStay}>
              ✓ Apply & stay
            </button>
            <button style={c.btnSave} onClick={handleSaveAndClose}>
              ✓ Apply & close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={c.tabs}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ ...c.tab, ...(activeTab === t.id ? c.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={c.content}>
          {activeTab === 'event' && (
            <ConfigEventTab draft={draft} updaters={updaters} />
          )}
          {activeTab === 'scenarios' && (
            <ConfigScenarioTab
              draft={draft}
              activeScenario={activeScenario}
              setActiveScenario={setActiveScenario}
              updaters={updaters}
            />
          )}
        </div>

      </div>
    </div>
  )
}
