import { c } from './configuratorStyles'
import ConfigScenarioEditor from './ConfigScenarioEditor'

const DIM_ICONS = {
  asset_class: '◉',
  geography: '⊕',
  esg: '◈',
  implementation: '◧',
  performance: '↗',
  sector: '⬡',
  currency: '€',
  style: '▦',
  cost: '€€',
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
          const hasExplore = !!s.explore?.enabled

          // Gebruik screenName als primaire label — dan sprekernaam als fallback
          const displayName =
            s.screenName?.en || s.screenName ||
            s.speakerProfile?.name || s.speaker?.en || 'Unnamed'

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
                {displayName}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 'auto', flexShrink: 0 }}>
                {/* Dimension badge */}
                <span style={{
                  ...c.dimBadge,
                  background: isActive ? 'rgba(224,27,65,0.22)' : 'rgba(224,27,65,0.08)',
                  color: isActive ? '#ff6b8a' : '#E01B41',
                }}>
                  {DIM_ICONS[s.dimension] || '◉'}
                </span>

                {/* Groene dot als compare aanstaat */}
                {hasComp && (
                  <span style={{
                    ...c.compDot,
                    background: '#4ED596',
                    opacity: isActive ? 1 : 0.7,
                  }} title="Compare configured" />
                )}

                {/* Blauwe dot als explore aanstaat */}
                {hasExplore && (
                  <span style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#5B8DEF',
                    opacity: isActive ? 1 : 0.7,
                    flexShrink: 0,
                  }} title="Explore enabled" />
                )}
              </div>
            </button>
          )
        })}

        <button style={c.addBtn} onClick={handleAdd}>+ Add use case</button>
      </div>

      {/* ── Editor ── */}
      <div style={c.scenEditorWrap}>
        {sc && (
          <ConfigScenarioEditor
            key={sc.id}
            sc={sc}
            idx={activeScenario}
            portfolio={draft.portfolio}
            updaters={updaters}
            onRemove={() => handleRemove(activeScenario)}
            canRemove={draft.scenarios.length > 1}
          />
        )}
      </div>

    </div>
  )
}
