import { useState } from 'react'

const DIMENSIONS = [
  { id: 'asset_class', label: 'Asset Class' },
  { id: 'geography', label: 'Geography' },
  { id: 'esg', label: 'ESG' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'performance', label: 'Performance' },
]

const LANGUAGES = ['en', 'nl', 'fr', 'de']
const LANG_LABELS = { en: 'English', nl: 'Nederlands', fr: 'Français', de: 'Deutsch' }

// ── Small reusable components ──────────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div style={c.section}>
      <div style={c.sectionTitle}>{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children, row }) {
  return (
    <div style={row ? { ...c.field, display: 'flex', alignItems: 'center', gap: 8 } : c.field}>
      <label style={c.label}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, wide }) {
  return (
    <input style={wide ? { ...c.input, width: '100%' } : c.input}
      type="text" value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''} />
  )
}

function NumInput({ value, onChange, min = 0, max = 100, step = 1, small }) {
  return (
    <input style={small ? { ...c.input, width: 64 } : { ...c.input, width: 80 }}
      type="number" value={value ?? ''} min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))} />
  )
}

function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea style={c.textarea}
      value={value || ''} rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''} />
  )
}

// ── Main configurator ──────────────────────────────────────────────────────

export default function Configurator({ config: initialConfig, onSave, onClose }) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initialConfig)))
  const [activeTab, setActiveTab] = useState('event')
  const [activeScenario, setActiveScenario] = useState(0)

  const p = draft.portfolio
  const sc = draft.scenarios[activeScenario]

  // ── Updaters ────────────────────────────────────────────────────────────

  function upEvent(key, val) {
    setDraft(d => ({ ...d, event: { ...d.event, [key]: val } }))
  }

  function upPortfolio(key, val) {
    setDraft(d => ({ ...d, portfolio: { ...d.portfolio, [key]: val } }))
  }

  function upAlloc(id, key, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        allocations: d.portfolio.allocations.map(a => a.id === id ? { ...a, [key]: val } : a)
      }
    }))
  }

  function upImpl(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: { ...d.portfolio, implementation: { ...d.portfolio.implementation, [key]: val } }
    }))
  }

  function upPerf(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: { ...d.portfolio, performance: { ...d.portfolio.performance, [key]: val } }
    }))
  }

  function upESG(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: { ...d.portfolio, esg: { ...d.portfolio.esg, [key]: val } }
    }))
  }

  function upSFDR(idx, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        esg: {
          ...d.portfolio.esg,
          sfdr: d.portfolio.esg.sfdr.map((s, i) => i === idx ? { ...s, weight: val } : s)
        }
      }
    }))
  }

  function upScenario(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => i === idx ? { ...s, [key]: val } : s)
    }))
  }

  function upScenarioLang(idx, field, lang, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, [field]: { ...s[field], [lang]: val } } : s
      )
    }))
  }

  function upSpeaker(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, speakerProfile: { ...s.speakerProfile, [key]: val } } : s
      )
    }))
  }

  function upCompLabel(idx, lang, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? { ...s.comparison, label: { ...s.comparison.label, [lang]: val } }
            : null
        }
      )
    }))
  }

  function upCompAlloc(idx, allocId, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx || !s.comparison) return s
        const allocs = s.comparison.allocations || []
        const exists = allocs.find(a => a.id === allocId)
        const newAllocs = val === ''
          ? allocs.filter(a => a.id !== allocId)
          : exists
            ? allocs.map(a => a.id === allocId ? { ...a, current: Number(val) } : a)
            : [...allocs, { id: allocId, current: Number(val) }]
        return { ...s, comparison: { ...s.comparison, allocations: newAllocs } }
      })
    }))
  }

  function upCompESG(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? { ...s.comparison, esg: { ...(s.comparison.esg || {}), [key]: val } }
            : null
        }
      )
    }))
  }

  function upCompImpl(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? { ...s.comparison, implementation: { ...(s.comparison.implementation || {}), [key]: val } }
            : null
        }
      )
    }))
  }

  function upCompCosts(idx, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? { ...s.comparison, costs: { weightedTer: val } }
            : null
        }
      )
    }))
  }

  function toggleComparison(idx) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx) return s
        if (s.comparison) return { ...s, comparison: null }
        return {
          ...s,
          comparison: {
            label: { en: 'Alternative scenario', nl: '', fr: '', de: '' },
            allocations: []
          }
        }
      })
    }))
  }

  function addScenario() {
    const newSc = {
      id: `sc_${Date.now()}`,
      speakerProfile: { name: '', title: '', organisation: '' },
      speaker: { en: 'New Speaker', nl: '', fr: '', de: '' },
      theme: { en: 'Theme', nl: '', fr: '', de: '' },
      policyQuestion: { en: '', nl: '', fr: '', de: '' },
      dimension: 'asset_class',
      state: 'base',
      comparison: null
    }
    setDraft(d => ({ ...d, scenarios: [...d.scenarios, newSc] }))
    setActiveScenario(draft.scenarios.length)
  }

  function removeScenario(idx) {
    if (draft.scenarios.length <= 1) return
    setDraft(d => ({ ...d, scenarios: d.scenarios.filter((_, i) => i !== idx) }))
    setActiveScenario(Math.max(0, idx - 1))
  }

  return (
    <div style={c.overlay}>
      <div style={c.panel}>

        {/* Header */}
        <div style={c.header}>
          <div>
            <div style={c.headerTitle}>Dashboard Configurator</div>
            <div style={c.headerSub}>{draft.event.name || 'Event setup'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={c.btnCancel} onClick={onClose}>Cancel</button>
            <button style={c.btnSave} onClick={() => onSave(draft)}>
              ✓ Apply to dashboard
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={c.tabs}>
          {[
            { id: 'event', label: 'Event & Portfolio' },
            { id: 'scenarios', label: `Scenarios (${draft.scenarios.length})` },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ ...c.tab, ...(activeTab === t.id ? c.tabActive : {}) }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={c.content}>

          {/* ── TAB 1: EVENT & PORTFOLIO ── */}
          {activeTab === 'event' && (
            <div style={c.grid2}>

              {/* Left column */}
              <div>
                <Section title="Event Settings">
                  <Field label="Event name">
                    <TextInput wide value={draft.event.name} onChange={v => upEvent('name', v)} />
                  </Field>
                  <Field label="Language (default)">
                    <select style={c.input} value={draft.event.language}
                      onChange={e => upEvent('language', e.target.value)}>
                      {LANGUAGES.map(l => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
                    </select>
                  </Field>
                </Section>

                <Section title="Portfolio Identity">
                  <Field label="Portfolio name">
                    <TextInput wide value={p.name} onChange={v => upPortfolio('name', v)} />
                  </Field>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Field label="Risk profile">
                      <select style={c.input} value={p.profile}
                        onChange={e => upPortfolio('profile', e.target.value)}>
                        {['Defensive','Balanced','Growth','Dynamic'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </Field>
                    <Field label="Currency">
                      <select style={c.input} value={p.currency}
                        onChange={e => upPortfolio('currency', e.target.value)}>
                        {['EUR','GBP','CHF','USD'].map(v => <option key={v}>{v}</option>)}
                      </select>
                    </Field>
                  </div>
                </Section>

                <Section title="Asset Allocation">
                  <div style={c.tableHead}>
                    <span style={{ flex: 2 }}>Category</span>
                    <span style={c.th}>Current</span>
                    <span style={c.th}>Target</span>
                    <span style={c.th}>Min</span>
                    <span style={c.th}>Max</span>
                  </div>
                  {p.allocations.map(a => (
                    <div key={a.id} style={c.tableRow}>
                      <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                        <span style={c.rowLabel}>{a.label?.en || a.id}</span>
                      </div>
                      <NumInput small value={a.current} onChange={v => upAlloc(a.id, 'current', v)} />
                      <NumInput small value={a.target} onChange={v => upAlloc(a.id, 'target', v)} />
                      <NumInput small value={a.min} onChange={v => upAlloc(a.id, 'min', v)} />
                      <NumInput small value={a.max} onChange={v => upAlloc(a.id, 'max', v)} />
                    </div>
                  ))}
                </Section>
              </div>

              {/* Right column */}
              <div>
                <Section title="Implementation Mix">
                  {[
                    { key: 'active', label: 'Active management %' },
                    { key: 'passive', label: 'Passive / ETF %' },
                    { key: 'individual', label: 'Individual securities %' },
                  ].map(f => (
                    <Field key={f.key} label={f.label} row>
                      <NumInput small value={p.implementation[f.key]} onChange={v => upImpl(f.key, v)} />
                    </Field>
                  ))}
                  <Field label="Weighted avg. TER (%)" row>
                    <NumInput small step={0.01} value={p.costs.weightedTer}
                      onChange={v => upPortfolio('costs', { ...p.costs, weightedTer: v })} />
                  </Field>
                </Section>

                <Section title="ESG Profile">
                  <Field label="ESG Score (0–10)" row>
                    <NumInput small step={0.1} min={0} max={10} value={p.esg.score}
                      onChange={v => upESG('score', v)} />
                  </Field>
                  <Field label="Carbon Risk Score" row>
                    <NumInput small value={p.esg.carbonRisk} onChange={v => upESG('carbonRisk', v)} />
                  </Field>
                  <div style={{ marginTop: 8 }}>
                    <div style={c.subLabel}>SFDR Distribution</div>
                    {p.esg.sfdr.map((item, i) => (
                      <Field key={item.article} label={item.article} row>
                        <NumInput small value={item.weight} onChange={v => upSFDR(i, v)} />
                        <span style={c.unit}>%</span>
                      </Field>
                    ))}
                  </div>
                </Section>

                <Section title="Performance">
                  <div style={c.grid2mini}>
                    {[
                      { key: 'ytd', label: 'YTD %' },
                      { key: 'oneYear', label: '1Y %' },
                      { key: 'threeYear', label: '3Y Ann. %' },
                      { key: 'benchmark', label: 'Benchmark %' },
                      { key: 'volatility', label: 'Volatility %' },
                      { key: 'maxDrawdown', label: 'Max Drawdown %' },
                    ].map(f => (
                      <Field key={f.key} label={f.label}>
                        <NumInput step={0.1} value={p.performance[f.key]} onChange={v => upPerf(f.key, v)} />
                      </Field>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          )}

          {/* ── TAB 2: SCENARIOS ── */}
          {activeTab === 'scenarios' && (
            <div style={c.scenLayout}>

              {/* Scenario list */}
              <div style={c.scenList}>
                {draft.scenarios.map((s, i) => (
                  <button key={s.id} onClick={() => setActiveScenario(i)}
                    style={{
                      ...c.scenItem,
                      background: i === activeScenario ? '#0C182E' : '#FFFFFF',
                    }}>
                    <span style={{ ...c.scenNum, color: '#E01B41' }}>{i + 1}</span>
                    <span style={{
                      ...c.scenName,
                      color: i === activeScenario ? '#FFFFFF' : '#0C182E',
                    }}>
                      {s.speakerProfile?.name || s.speaker?.en || 'Unnamed'}
                    </span>
                  </button>
                ))}
                <button style={c.addBtn} onClick={addScenario}>+ Add scenario</button>
              </div>

              {/* Scenario editor */}
              {sc && (
                <div style={c.scenEditor}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div style={c.sectionTitle}>Scenario {activeScenario + 1}</div>
                    {draft.scenarios.length > 1 && (
                      <button style={c.btnDanger} onClick={() => removeScenario(activeScenario)}>
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={c.grid2}>
                    {/* Left */}
                    <div>
                      <Section title="Speaker">
                        <Field label="Full name">
                          <TextInput wide value={sc.speakerProfile?.name}
                            onChange={v => upSpeaker(activeScenario, 'name', v)} />
                        </Field>
                        <Field label="Title / function">
                          <TextInput wide value={sc.speakerProfile?.title}
                            onChange={v => upSpeaker(activeScenario, 'title', v)} />
                        </Field>
                        <Field label="Organisation">
                          <TextInput wide value={sc.speakerProfile?.organisation}
                            onChange={v => upSpeaker(activeScenario, 'organisation', v)} />
                        </Field>
                      </Section>

                      <Section title="Dashboard">
                        <Field label="Default dimension">
                          <select style={c.input} value={sc.dimension}
                            onChange={e => upScenario(activeScenario, 'dimension', e.target.value)}>
                            {DIMENSIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </Field>
                      </Section>

                      {/* Compare toggle */}
                      <Section title="Compare">
                        <button
                          style={{ ...c.toggleBtn, ...(sc.comparison ? c.toggleBtnOn : {}) }}
                          onClick={() => toggleComparison(activeScenario)}>
                          {sc.comparison ? '● Compare ON' : '○ Compare OFF'}
                        </button>

                        {sc.comparison && (
                          <div style={{ marginTop: 14 }}>
                            {/* Labels per taal */}
                            <div style={c.subLabel}>Comparison label</div>
                            {LANGUAGES.map(lang => (
                              <Field key={lang} label={lang.toUpperCase()}>
                                <TextInput wide value={sc.comparison.label?.[lang]}
                                  onChange={v => upCompLabel(activeScenario, lang, v)}
                                  placeholder={`Label in ${LANG_LABELS[lang]}...`} />
                              </Field>
                            ))}

                            {/* Allocation overrides */}
                            <div style={{ ...c.subLabel, marginTop: 12 }}>Allocation overrides</div>
                            <div style={c.helpText}>Only fill in categories that change.</div>
                            {p.allocations.map(a => {
                              const cv = sc.comparison.allocations?.find(ca => ca.id === a.id)?.current
                              return (
                                <div key={a.id} style={c.tableRow}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                                    <span style={c.rowLabel}>{a.label?.en || a.id}</span>
                                    <span style={c.helpText}>({a.current}%)</span>
                                  </div>
                                  <span style={c.helpText}>→</span>
                                  <input style={{ ...c.input, width: 64 }}
                                    type="number" min={0} max={100}
                                    placeholder="—"
                                    value={cv ?? ''}
                                    onChange={e => upCompAlloc(activeScenario, a.id, e.target.value)} />
                                  <span style={c.unit}>%</span>
                                </div>
                              )
                            })}

                            {/* ESG override */}
                            {sc.dimension === 'esg' && (
                              <div style={{ marginTop: 12 }}>
                                <div style={c.subLabel}>ESG override</div>
                                <Field label="Compare ESG score" row>
                                  <NumInput small step={0.1} min={0} max={10}
                                    value={sc.comparison.esg?.score ?? ''}
                                    onChange={v => upCompESG(activeScenario, 'score', v)} />
                                </Field>
                              </div>
                            )}

                            {/* Implementation override */}
                            {sc.dimension === 'implementation' && (
                              <div style={{ marginTop: 12 }}>
                                <div style={c.subLabel}>Implementation override</div>
                                {[
                                  { key: 'active', label: 'Active %' },
                                  { key: 'passive', label: 'Passive %' },
                                  { key: 'individual', label: 'Individual %' },
                                ].map(f => (
                                  <Field key={f.key} label={f.label} row>
                                    <NumInput small value={sc.comparison.implementation?.[f.key] ?? ''}
                                      onChange={v => upCompImpl(activeScenario, f.key, v)} />
                                  </Field>
                                ))}
                                <Field label="Compare TER (%)" row>
                                  <NumInput small step={0.01}
                                    value={sc.comparison.costs?.weightedTer ?? ''}
                                    onChange={v => upCompCosts(activeScenario, v)} />
                                </Field>
                              </div>
                            )}
                          </div>
                        )}
                      </Section>
                    </div>

                    {/* Right */}
                    <div>
                      <Section title="Policy Question & Theme (per language)">
                        {LANGUAGES.map(lang => (
                          <div key={lang} style={{ marginBottom: 16 }}>
                            <div style={c.langTag}>{LANG_LABELS[lang]}</div>
                            <Field label="Theme tag">
                              <TextInput wide value={sc.theme?.[lang]}
                                onChange={v => upScenarioLang(activeScenario, 'theme', lang, v)}
                                placeholder={`Theme in ${LANG_LABELS[lang]}...`} />
                            </Field>
                            <Field label="Policy question">
                              <Textarea value={sc.policyQuestion?.[lang]}
                                onChange={v => upScenarioLang(activeScenario, 'policyQuestion', lang, v)}
                                placeholder={`Policy question in ${LANG_LABELS[lang]}...`} />
                            </Field>
                          </div>
                        ))}
                      </Section>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────

const c = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(12,24,46,0.88)',
    display: 'flex',
  },
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#F8F8F7', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px',
    background: '#0C182E',
    borderBottom: '2px solid #E01B41',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.42)', marginTop: 2,
  },
  tabs: {
    display: 'flex',
    background: '#FFFFFF',
    borderBottom: '1px solid #E0E0DC',
    padding: '0 24px',
    flexShrink: 0,
  },
  tab: {
    padding: '11px 18px', background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 600,
    color: '#8A8A82', cursor: 'pointer', marginBottom: -1,
    transition: 'color 0.15s',
  },
  tabActive: {
    borderBottomColor: '#E01B41', color: '#0C182E',
  },
  content: {
    flex: 1, overflow: 'auto', padding: '20px 24px',
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
    alignItems: 'start',
  },
  grid2mini: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
  },
  section: {
    marginBottom: 16, background: '#FFFFFF',
    border: '1px solid #E0E0DC', borderRadius: 8,
    padding: '14px 16px',
  },
  sectionTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 800, color: '#0C182E',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid #EFEFED',
  },
  subLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800, color: '#8A8A82',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 6,
  },
  langTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 800, color: '#E01B41',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 6,
  },
  field: { marginBottom: 8 },
  label: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700, color: '#8A8A82',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3,
  },
  input: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', color: '#0C182E',
    background: '#F8F8F7',
    border: '1.5px solid #E0E0DC',
    borderRadius: 5, padding: '6px 9px',
    outline: 'none', width: '100%',
  },
  textarea: {
    display: 'block', width: '100%',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', color: '#0C182E',
    background: '#F8F8F7',
    border: '1.5px solid #E0E0DC',
    borderRadius: 5, padding: '6px 9px',
    resize: 'vertical', outline: 'none',
  },
  tableHead: {
    display: 'flex', gap: 6, alignItems: 'center',
    paddingBottom: 5, marginBottom: 4,
    borderBottom: '1px solid #EFEFED',
  },
  th: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800, color: '#8A8A82',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    width: 64, textAlign: 'center',
  },
  tableRow: {
    display: 'flex', gap: 6, alignItems: 'center',
    paddingTop: 5, paddingBottom: 5,
    borderBottom: '1px solid #FAFAF8',
  },
  rowLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', color: '#0C182E',
  },
  helpText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: '#8A8A82',
  },
  unit: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', color: '#8A8A82',
  },
  scenLayout: {
    display: 'flex', gap: 20, alignItems: 'flex-start',
  },
  scenList: {
    width: 190, flexShrink: 0,
    background: '#FFFFFF', border: '1px solid #E0E0DC',
    borderRadius: 8, overflow: 'hidden',
  },
  scenItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '9px 12px',
    background: 'none', border: 'none',
    borderBottom: '1px solid #EFEFED',
    cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s',
  },
  scenNum: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    width: 14, flexShrink: 0,
  },
  scenName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  addBtn: {
    width: '100%', padding: '9px 12px',
    background: 'none', border: 'none',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 700,
    color: '#E01B41', cursor: 'pointer', textAlign: 'left',
  },
  scenEditor: { flex: 1 },
  btnSave: {
    padding: '8px 18px',
    background: '#4ED596', border: 'none',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 700, color: '#0C182E',
  },
  btnCancel: {
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF',
  },
  btnDanger: {
    padding: '5px 12px',
    background: 'rgba(224,27,65,0.07)',
    border: '1px solid rgba(224,27,65,0.22)',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 600, color: '#E01B41',
  },
  toggleBtn: {
    padding: '7px 14px',
    background: '#FFFFFF', border: '1.5px solid #E0E0DC',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', fontWeight: 700, color: '#8A8A82',
  },
  toggleBtnOn: {
    background: 'rgba(78,213,150,0.08)',
    borderColor: '#4ED596', color: '#0C182E',
  },
}
