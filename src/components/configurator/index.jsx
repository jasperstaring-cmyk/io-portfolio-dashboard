import { useState } from 'react'
import { useConfigDraft } from './useConfigDraft'
import ConfigEventTab from './ConfigEventTab'
import ConfigScenarioTab from './ConfigScenarioTab'
import { c } from './configuratorStyles'

export default function Configurator({ config: initialConfig, onApply, onSave, onClose, onSaveToRegistry }) {
  const [activeTab, setActiveTab] = useState('event')
  const [activeScenario, setActiveScenario] = useState(0)
  const [appliedFlash, setAppliedFlash] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  const { draft, hasUnsavedChanges, markSaved, discardChanges, ...updaters } = useConfigDraft(initialConfig)

  // Apply — update live dashboard state, keep configurator open
  function handleApply() {
    onApply(draft)
    setAppliedFlash(true)
    setTimeout(() => setAppliedFlash(false), 2000)
  }

  // Save to registry — persist and update dashboard, but do NOT close configurator
  function handleSaveToRegistry() {
    onApply(draft)
    markSaved()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
    if (onSaveToRegistry) onSaveToRegistry(draft)
  }

  // Discard changes
  function handleDiscard() {
    discardChanges()
  }

  const tabs = [
    { id: 'event', label: 'Portfolio & Event' },
    { id: 'scenarios', label: `Use Cases (${draft.scenarios.length})` },
  ]

  return (
    <div style={c.overlay}>
      <div style={c.panel}>

        {/* ── Header ── */}
        <div style={c.header}>
          <div>
            <div style={c.headerTitle}>Dashboard Configurator</div>
            <div style={c.headerSub}>{draft.event.name || 'Event setup'}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
            <button
              onClick={() => window.open('/brochure.html', '_blank')}
              style={{
                padding: '6px 12px',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 5,
                cursor: 'pointer',
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              Brochure ↗
            </button>
            <button
              onClick={() => window.open('/handleiding.html', '_blank')}
              style={{
                padding: '6px 12px',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.18)',
                borderRadius: 5,
                cursor: 'pointer',
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.55)',
              }}
            >
              User guide ↗
            </button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>

            {/* Status indicator */}
            {hasUnsavedChanges && !savedFlash && (
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.68rem', color: 'rgba(245,166,35,0.9)', fontWeight: 700,
              }}>
                ● Unsaved changes
              </span>
            )}
            {appliedFlash && (
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.68rem', color: '#4ED596', fontWeight: 700,
              }}>
                ✓ Applied to dashboard
              </span>
            )}
            {savedFlash && (
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.68rem', color: '#4ED596', fontWeight: 700,
              }}>
                ✓ Saved to registry
              </span>
            )}

            <button style={c.btnDiscard}
              onClick={handleDiscard}
              disabled={!hasUnsavedChanges}
              title="Discard all unsaved changes">
              Discard changes
            </button>

            <button style={c.btnCancel} onClick={onClose}>Close</button>

            <button style={c.btnSaveStay} onClick={handleApply}
              title="Update live dashboard — changes are not persisted">
              ✓ Apply
            </button>

            <button style={c.btnSave} onClick={handleSaveToRegistry}
              title="Save to registry — changes are persisted">
              ↑ Save to registry
            </button>

          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={c.tabs}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ ...c.tab, ...(activeTab === t.id ? c.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
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
