import { useState } from 'react'
import { c } from './configuratorStyles'
import {
  Section, Field, TextInput, Textarea, NumInput, LangTabs,
  LANGUAGES, LANG_FULL,
} from './ConfigFormParts'
import ConfigComparisonEditor from './ConfigComparisonEditor'

const DIMENSIONS = [
  { id: 'asset_class',    label: 'Asset Class',    icon: '◉' },
  { id: 'geography',      label: 'Geography',      icon: '⊕' },
  { id: 'esg',            label: 'ESG',            icon: '◈' },
  { id: 'implementation', label: 'Implementation', icon: '◧' },
  { id: 'performance',    label: 'Performance',    icon: '↗' },
  { id: 'sector',         label: 'Sector',         icon: '⬡' },
  { id: 'currency',       label: 'Currency',       icon: '€' },
  { id: 'style',          label: 'Style',          icon: '▦' },
  { id: 'cost',           label: 'Cost',           icon: '€€' },
]

// Haal implementation categories op ongeacht formaat
function getImplCats(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight, label: { en: id } }))
}

export default function ConfigScenarioEditor({ sc, idx, portfolio, updaters, onRemove, canRemove }) {
  const [activeLang, setActiveLang]       = useState('en')
  const [showBase, setShowBase]           = useState(false)
  const [showFraming, setShowFraming]     = useState(false)
  const [showExplore, setShowExplore]     = useState(false)

  const {
    upScenario, upScenarioLang, upSpeaker,
    upBaseToggle, upBaseAlloc, upBaseImplCat,
    upFraming,
    upExploreToggle, upExploreStartFrom,
  } = updaters

  const useEventPortfolio = sc.base?.useEventPortfolio !== false
  const implCats = getImplCats(portfolio.implementation)

  return (
    <div style={c.scenEditor}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 16,
      }}>
        <div style={c.sectionTitle}>Use Case {idx + 1}</div>
        {canRemove && (
          <button style={c.btnDanger} onClick={onRemove}>Remove</button>
        )}
      </div>

      <div style={c.grid2}>

        {/* ── Left column ── */}
        <div>

          {/* Speaker */}
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

          {/* Dimension */}
          <Section title="Dimension">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
              {DIMENSIONS.map(d => (
                <button key={d.id}
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
          </Section>

          {/* ── Base override ── */}
          <Section title="Starting point">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button
                style={{ ...c.toggleBtn, ...(useEventPortfolio ? {} : c.toggleBtnOn) }}
                onClick={() => {
                  upBaseToggle(idx, !useEventPortfolio)
                  setShowBase(!useEventPortfolio)
                }}
              >
                {useEventPortfolio ? '○ Own starting point' : '● Own starting point'}
              </button>
              <span style={c.helpText}>
                {useEventPortfolio
                  ? 'Follows event portfolio'
                  : 'Custom overrides active'}
              </span>
            </div>

            {!useEventPortfolio && (
              <>
                <button style={c.collapseBtn} onClick={() => setShowBase(v => !v)}>
                  {showBase ? '▾ Hide overrides' : '▸ Show overrides'}
                </button>

                {showBase && (
                  <div style={{ marginTop: 10 }}>
                    {/* Allocation overrides */}
                    <div style={c.subLabel}>Allocation overrides</div>
                    <div style={{ ...c.helpText, marginBottom: 6 }}>
                      Leave blank to inherit from event portfolio.
                    </div>
                    <div style={c.tableHead}>
                      <span style={{ flex: 2 }}>Category</span>
                      <span style={c.th}>Base</span>
                      <span style={{ ...c.th, width: 16, color: 'transparent' }}>→</span>
                      <span style={c.th}>Override</span>
                    </div>
                    {portfolio.allocations.map(a => {
                      const override = sc.base?.allocations?.find(x => x.id === a.id)
                      return (
                        <div key={a.id} style={c.deltaRow}>
                          <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: a.color }} />
                            <span style={c.rowLabel}>{a.label?.en || a.id}</span>
                          </div>
                          <span style={c.deltaFrom}>{a.current}%</span>
                          <span style={c.deltaArrow}>→</span>
                          <input
                            style={{ ...c.input, width: 64 }}
                            type="number" min={0} max={100}
                            placeholder="—"
                            value={override?.current ?? ''}
                            onChange={e => upBaseAlloc(idx, a.id, 'current', e.target.value === '' ? undefined : Number(e.target.value))}
                          />
                        </div>
                      )
                    })}

                    {/* Implementation overrides */}
                    {sc.dimension === 'implementation' && implCats.length > 0 && (
                      <div style={{ marginTop: 12 }}>
                        <div style={c.subLabel}>Implementation overrides</div>
                        {implCats.map(cat => {
                          const override = sc.base?.implementation?.categories?.find(c => c.id === cat.id)
                          const label = typeof cat.label === 'object' ? (cat.label.en || cat.id) : cat.label
                          return (
                            <div key={cat.id} style={c.deltaRow}>
                              <span style={{ ...c.rowLabel, flex: 1 }}>{label}</span>
                              <span style={c.deltaFrom}>{cat.weight}%</span>
                              <span style={c.deltaArrow}>→</span>
                              <NumInput small
                                value={override?.weight ?? ''}
                                onChange={v => upBaseImplCat(idx, cat.id, v)} />
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </Section>

          {/* ── Compare ── */}
          <ConfigComparisonEditor
            sc={sc}
            idx={idx}
            portfolio={portfolio}
            updaters={updaters}
          />

        </div>

        {/* ── Right column ── */}
        <div>

          {/* Policy question & theme */}
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
                  placeholder="Name as shown on screen..."
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

          {/* ── Framing ── */}
          <Section title="Framing (optional)">
            <div style={{ ...c.helpText, marginBottom: 8 }}>
              Override category labels for this use case only. Leave blank to use event portfolio labels.
            </div>
            <button style={c.collapseBtn} onClick={() => setShowFraming(v => !v)}>
              {showFraming ? '▾ Hide framing' : '▸ Show framing'}
            </button>

            {showFraming && sc.dimension === 'implementation' && (
              <div style={{ marginTop: 10 }}>
                {implCats.map(cat => {
                  const catLabel = typeof cat.label === 'object' ? (cat.label.en || cat.id) : cat.label
                  const framingCat = sc.framing?.implementation?.[cat.id]
                  return (
                    <div key={cat.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EFEFED' }}>
                      <div style={{ ...c.subLabel, marginBottom: 4 }}>{catLabel}</div>
                      {['en', 'nl', 'fr', 'de'].map(lang => (
                        <Field key={lang} label={`Label (${lang.toUpperCase()})`} row>
                          <TextInput
                            value={framingCat?.label?.[lang] || ''}
                            onChange={v => upFraming(idx, 'implementation', cat.id, 'label', lang, v)}
                            placeholder={`Override label in ${lang}...`}
                          />
                        </Field>
                      ))}
                      <Field label="Sub (EN)" row>
                        <TextInput
                          value={framingCat?.sub?.en || ''}
                          onChange={v => upFraming(idx, 'implementation', cat.id, 'sub', 'en', v)}
                          placeholder="Override sub-description..."
                        />
                      </Field>
                    </div>
                  )
                })}
              </div>
            )}

            {showFraming && sc.dimension === 'asset_class' && (
              <div style={{ marginTop: 10 }}>
                {portfolio.allocations.map(a => {
                  const framingCat = sc.framing?.asset_class?.[a.id]
                  const label = a.label?.en || a.id
                  return (
                    <div key={a.id} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid #EFEFED' }}>
                      <div style={{ ...c.subLabel, marginBottom: 4 }}>{label}</div>
                      {['en', 'nl', 'fr', 'de'].map(lang => (
                        <Field key={lang} label={`Label (${lang.toUpperCase()})`} row>
                          <TextInput
                            value={framingCat?.label?.[lang] || ''}
                            onChange={v => upFraming(idx, 'asset_class', a.id, 'label', lang, v)}
                            placeholder={`Override label in ${lang}...`}
                          />
                        </Field>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}

            {showFraming && sc.dimension !== 'implementation' && sc.dimension !== 'asset_class' && (
              <div style={{ ...c.helpText, marginTop: 8 }}>
                Framing is available for Implementation and Asset Class dimensions.
              </div>
            )}
          </Section>

          {/* ── Explore ── */}
          <Section title="Explore">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <button
                style={{ ...c.toggleBtn, ...(sc.explore?.enabled ? c.toggleBtnOn : {}) }}
                onClick={() => upExploreToggle(idx, !sc.explore?.enabled)}
              >
                {sc.explore?.enabled ? '● Explore ON' : '○ Explore OFF'}
              </button>
              <span style={c.helpText}>
                {sc.explore?.enabled
                  ? 'Live sliders available for this use case'
                  : 'Explore mode disabled for this use case'}
              </span>
            </div>

            {sc.explore?.enabled && (
              <>
                <button style={c.collapseBtn} onClick={() => setShowExplore(v => !v)}>
                  {showExplore ? '▾ Hide explore settings' : '▸ Show explore settings'}
                </button>

                {showExplore && (
                  <div style={{ marginTop: 10 }}>
                    <Field label="Start explore from">
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        {['base', 'compare'].map(opt => (
                          <button key={opt}
                            onClick={() => upExploreStartFrom(idx, opt)}
                            style={{
                              padding: '5px 12px',
                              background: (sc.explore?.startFrom || 'base') === opt ? '#0C182E' : '#F8F8F7',
                              border: `1.5px solid ${(sc.explore?.startFrom || 'base') === opt ? '#0C182E' : '#E0E0DC'}`,
                              borderRadius: 5, cursor: 'pointer',
                              fontFamily: "'Merriweather Sans', sans-serif",
                              fontSize: '0.7rem', fontWeight: 700,
                              color: (sc.explore?.startFrom || 'base') === opt ? '#FFFFFF' : '#0C182E',
                            }}
                          >
                            {opt === 'base' ? 'Base (open)' : 'Compare (after reveal)'}
                          </button>
                        ))}
                      </div>
                    </Field>
                    <div style={{ ...c.helpText, marginTop: 6 }}>
                      {(sc.explore?.startFrom || 'base') === 'base'
                        ? 'Explore starts from the base portfolio — leads the audience to a conclusion.'
                        : 'Explore starts from the compare state — deepens the conversation after the reveal.'}
                    </div>
                  </div>
                )}
              </>
            )}
          </Section>

        </div>
      </div>
    </div>
  )
}
