import { useState } from 'react'
import { c } from './configuratorStyles'
import {
  Section, Field, TextInput, Textarea, LangTabs,
  LANGUAGES, LANG_FULL,
} from './ConfigFormParts'
import ConfigComparisonEditor from './ConfigComparisonEditor'

const DIMENSIONS = [
  { id: 'asset_class', label: 'Asset Class', icon: '◉' },
  { id: 'geography', label: 'Geography', icon: '⊕' },
  { id: 'esg', label: 'ESG', icon: '◈' },
  { id: 'implementation', label: 'Implementation', icon: '◧' },
  { id: 'performance', label: 'Performance', icon: '↗' },
  { id: 'sector', label: 'Sector', icon: '⬡' },
  { id: 'currency', label: 'Currency', icon: '€' },
  { id: 'style', label: 'Style', icon: '▦' },
]

export default function ConfigScenarioEditor({ sc, idx, portfolio, updaters, onRemove, canRemove }) {
  const [activeLang, setActiveLang] = useState('en')
  const { upScenario, upScenarioLang, upSpeaker } = updaters

  return (
    <div style={c.scenEditor}>

      {/* Header row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <div style={c.sectionTitle}>Scenario {idx + 1}</div>
        {canRemove && (
          <button style={c.btnDanger} onClick={onRemove}>Remove scenario</button>
        )}
      </div>

      <div style={c.grid2}>

        {/* ── Left: speaker + dashboard settings + compare ── */}
        <div>

          <Section title="Speaker">
            <Field label="Full name">
              <TextInput wide value={sc.speakerProfile?.name}
                onChange={v => upSpeaker(idx, 'name', v)} />
            </Field>
            <Field label="Title / function">
              <TextInput wide value={sc.speakerProfile?.title}
                onChange={v => upSpeaker(idx, 'title', v)} />
            </Field>
            <Field label="Organisation">
              <TextInput wide value={sc.speakerProfile?.organisation}
                onChange={v => upSpeaker(idx, 'organisation', v)} />
            </Field>
          </Section>

          <Section title="Dashboard">
            <Field label="Default dimension">
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                {DIMENSIONS.map(d => (
                  <button
                    key={d.id}
                    onClick={() => upScenario(idx, 'dimension', d.id)}
                    style={{
                      padding: '5px 10px',
                      background: sc.dimension === d.id ? '#E01B41' : '#F8F8F7',
                      border: `1.5px solid ${sc.dimension === d.id ? '#E01B41' : '#E0E0DC'}`,
                      borderRadius: 5, cursor: 'pointer',
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontSize: '0.7rem', fontWeight: 700,
                      color: sc.dimension === d.id ? '#FFFFFF' : '#0C182E',
                      transition: 'all 0.12s',
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          <ConfigComparisonEditor
            sc={sc}
            idx={idx}
            portfolio={portfolio}
            updaters={updaters}
          />

        </div>

        {/* ── Right: policy question + theme per language ── */}
        <div>
          <Section title="Policy Question & Theme">
            <LangTabs active={activeLang} onChange={setActiveLang} />

            <div key={activeLang}>
              <Field label="Theme tag">
                <TextInput wide
                  value={sc.theme?.[activeLang]}
                  onChange={v => upScenarioLang(idx, 'theme', activeLang, v)}
                  placeholder={`Theme in ${LANG_FULL[activeLang]}...`}
                />
              </Field>
              <Field label={`Speaker name (${LANG_FULL[activeLang]})`}>
                <TextInput wide
                  value={sc.speaker?.[activeLang]}
                  onChange={v => upScenarioLang(idx, 'speaker', activeLang, v)}
                  placeholder={`Name as shown on screen...`}
                />
              </Field>
              <Field label="Policy question">
                <Textarea rows={4}
                  value={sc.policyQuestion?.[activeLang]}
                  onChange={v => upScenarioLang(idx, 'policyQuestion', activeLang, v)}
                  placeholder={`Policy question in ${LANG_FULL[activeLang]}...`}
                />
              </Field>
            </div>

            {/* Completeness indicator */}
            <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['en', 'nl', 'fr', 'de'].map(lang => {
                const hasQ = !!(sc.policyQuestion?.[lang])
                return (
                  <span key={lang} style={{
                    padding: '2px 7px', borderRadius: 3,
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.58rem', fontWeight: 700,
                    background: hasQ ? 'rgba(78,213,150,0.1)' : 'rgba(0,0,0,0.04)',
                    color: hasQ ? '#1a7a50' : '#8A8A82',
                    border: `1px solid ${hasQ ? 'rgba(78,213,150,0.3)' : '#E0E0DC'}`,
                  }}>
                    {lang.toUpperCase()} {hasQ ? '✓' : '—'}
                  </span>
                )
              })}
            </div>
          </Section>
        </div>

      </div>
    </div>
  )
}
