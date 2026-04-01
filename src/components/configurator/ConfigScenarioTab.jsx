import { c } from './configuratorStyles'
import ConfigScenarioEditor from './ConfigScenarioEditor'

const DIM_ICONS = {
  asset_class: '◉',
  geography: '⊕',
  esg: '◈',
  implementation: '◧',
  performance: '↗',
}

const DIM_SHORT = {
  asset_class: 'Asset',
  geography: 'Geo',
  esg: 'ESG',
  implementation: 'Impl.',
  performance: 'Perf.',
}

export default function ConfigScenarioTab({
  draft, activeScenario, setActiveScenario, updaters,
}) {
  const { addScenario, removeScenario } = updaters

  function handleAdd() {
    addScenario(draft.scenarios.length)
    setActiveScenario(draft.scenarios.length)
  }

  function handleRemove(idx) {
    if (draft.scenarios.length <= 1) return
    removeScenario(idx)
    setActiveScenario(Math.max(0, idx - 1))
  }

  const sc = draft.scenarios[activeScenario]

  return (
    <div style={c.scenLayout}>

      {/* ── Scenario list ── */}
      <div style={c.scenList}>
        {draft.scenarios.map((s, i) => {
          const isActive = i === activeScenario
          const hasComp = !!s.comparison
          return (
            <button key={s.id} onClick={() => setActiveScenario(i)}
              style={{
                ...c.scenItem,
                background: isActive ? '#0C182E' : '#FFFFFF',
              }}>
              <span style={{ ...c.scenNum, color: '#E01B41' }}>{i + 1}</span>

              <span style={{
                ...c.scenName,
                color: isActive ? '#FFFFFF' : '#0C182E',
              }}>
                {s.speakerProfile?.name || s.speaker?.en || 'Unnamed'}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
                {/* Dimension badge */}
                <span style={{
                  ...c.dimBadge,
                  background: isActive ? 'rgba(224,27,65,0.22)' : 'rgba(224,27,65,0.08)',
                  color: isActive ? '#ff6b8a' : '#E01B41',
                }}>
                  {DIM_ICONS[s.dimension]}
                </span>

                {/* Green dot if comparison active */}
                {hasComp && (
                  <span style={{
                    ...c.compDot,
                    background: isActive ? '#4ED596' : '#4ED596',
                    opacity: isActive ? 1 : 0.7,
                  }} title="Has comparison" />
                )}
              </div>
            </button>
          )
        })}

        {/* Legend */}
        <div style={{
          padding: '7px 12px',
          borderTop: '1px solid #EFEFED',
          display: 'flex', gap: 10,
        }}>
          <span style={{ ...c.helpText, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ ...c.compDot, width: 5, height: 5 }} /> Compare
          </span>
        </div>

        <button style={c.addBtn} onClick={handleAdd}>+ Add scenario</button>
      </div>

      {/* ── Scenario editor ── */}
      {sc && (
        <ConfigScenarioEditor
          sc={sc}
          idx={activeScenario}
          portfolio={draft.portfolio}
          updaters={updaters}
          onRemove={() => handleRemove(activeScenario)}
          canRemove={draft.scenarios.length > 1}
        />
      )}
    </div>
  )
}
