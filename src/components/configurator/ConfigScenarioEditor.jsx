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

function getImplCats(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight, label: { en: id } }))
}

// ── Tooltip — hover ────────────────────────────────────────────────────────
function Tooltip({ text }) {
  const [open, setOpen] = useState(false)
  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <span style={{
        width: 16, height: 16, borderRadius: '50%',
        border: '1.5px solid #8A8A82',
        fontFamily: "'Merriweather Sans', sans-serif",
        fontSize: '0.6rem', fontWeight: 800,
        color: '#8A8A82', lineHeight: 1,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'default', flexShrink: 0, userSelect: 'none',
      }}>?</span>
      {open && (
        <span style={{
          position: 'absolute', left: 22, top: 0, transform: 'none',
          zIndex: 200,
          background: '#0C182E', color: '#FFFFFF', textTransform: 'none', letterSpacing: 'normal', fontWeight: 400,
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '0.72rem', lineHeight: 1.5,
          padding: '7px 11px', borderRadius: 5,
          width: 240, boxShadow: '0 4px 12px rgba(0,0,0,0.22)',
          pointerEvents: 'none', whiteSpace: 'normal',
        }}>
          {text}
        </span>
      )}
    </span>
  )
}

// ── Accordeon ─────────────────────────────────────────────────────────────
function Accord({ title, tooltip, defaultOpen = false, children, headerRight }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{
      border: '1px solid #E0E0DC', borderRadius: 7,
      marginBottom: 12, overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '12px 16px',
          background: open ? '#F4F4F2' : '#FFFFFF',
          border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #E0E0DC' : 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: '0.75rem', fontWeight: 800,
            color: '#0C182E', letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}>
            {title}
          </span>
          {tooltip && <Tooltip text={tooltip} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {headerRight}
          <span style={{
            fontFamily: "'Merriweather Sans', sans-serif",
            fontSize: '0.72rem', color: '#8A8A82',
          }}>
            {open ? '▾' : '▸'}
          </span>
        </div>
      </button>
      {open && (
        <div style={{ padding: '14px 16px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Series editor ──────────────────────────────────────────────────────────
function SeriesEditor({ series, onUpdate, placeholder }) {
  const rows = series || []

  function updateRow(i, field, val) {
    const updated = rows.map((r, idx) =>
      idx === i ? { ...r, [field]: field === 'label' ? val : Number(val) } : r
    )
    onUpdate(updated)
  }

  function addRow() {
    const last = rows[rows.length - 1]
    onUpdate([...rows, {
      label: '',
      portfolio: last?.portfolio ?? 100,
      benchmark: last?.benchmark ?? 100,
    }])
  }

  function removeRow(i) {
    onUpdate(rows.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ marginTop: 8 }}>
      {/* Kolomhoofden */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
        <div style={{ ...se.thCell, flex: 1 }}>Label</div>
        <div style={{ ...se.thCell, width: 80 }}>Portfolio</div>
        <div style={{ ...se.thCell, width: 80 }}>Benchmark</div>
        <div style={{ width: 28 }} />
      </div>
      {rows.map((row, i) => (
        <div key={i} style={se.row}>
          <input
            style={{ ...c.input, flex: 1, minWidth: 0 }}
            type="text"
            value={row.label || ''}
            placeholder={placeholder || (i === 0 ? 'e.g. Jan 2024 or Q1' : '')}
            onChange={e => updateRow(i, 'label', e.target.value)}
          />
          <input
            style={{ ...c.input, width: 80, textAlign: 'right' }}
            type="number" step="0.1"
            value={row.portfolio ?? ''}
            onChange={e => updateRow(i, 'portfolio', e.target.value)}
          />
          <input
            style={{ ...c.input, width: 80, textAlign: 'right' }}
            type="number" step="0.1"
            value={row.benchmark ?? ''}
            onChange={e => updateRow(i, 'benchmark', e.target.value)}
          />
          <button style={se.removeBtn} onClick={() => removeRow(i)} title="Remove">×</button>
        </div>
      ))}
      {rows.length === 0 && (
        <div style={se.empty}>No data points yet. Add a row to start.</div>
      )}
      <button style={se.addBtn} onClick={addRow}>+ Add data point</button>
      {rows.length > 0 && (
        <div style={se.hint}>
          First row is index 100. Label is free text: month, quarter, year, or any period.
        </div>
      )}
    </div>
  )
}

const se = {
  thCell: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700,
    color: '#8A8A82', letterSpacing: '0.06em',
    textTransform: 'uppercase', paddingBottom: 3,
  },
  row: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 },
  removeBtn: {
    width: 24, height: 24, flexShrink: 0,
    background: 'none', border: '1px solid rgba(224,27,65,0.25)',
    borderRadius: 4, cursor: 'pointer',
    color: '#E01B41', fontSize: '0.85rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
  },
  addBtn: {
    marginTop: 8, padding: '5px 12px', background: 'none',
    border: '1px solid rgba(78,213,150,0.4)', borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 700, color: '#1a7a50',
  },
  empty: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', color: '#8A8A82', fontStyle: 'italic', marginBottom: 6,
  },
  hint: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.66rem', color: '#8A8A82', marginTop: 8, lineHeight: 1.5,
  },
}

// ── Main component ─────────────────────────────────────────────────────────
export default function ConfigScenarioEditor({ sc, idx, portfolio, updaters, onRemove, canRemove }) {
  const [activeLang, setActiveLang] = useState('en')

  const {
    upScenario, upScenarioLang, upSpeaker,
    upBaseToggle, upBaseAlloc, upBaseImplCat,
    upFraming,
    upExploreToggle, upExploreStartFrom,
    upPerfView,
  } = updaters

  const useEventPortfolio = sc.base?.useEventPortfolio !== false
  const implCats = getImplCats(portfolio.implementation)
  const hasPerfView = !!(sc.performanceView?.base?.length || sc.performanceView?.compare?.length)

  function handlePerfBaseSeries(series) { upPerfView(idx, 'base', series) }
  function handlePerfCompareSeries(series) { upPerfView(idx, 'compare', series) }

  return (
    <div style={c.scenEditor}>

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 18,
      }}>
        <div style={c.sectionTitle}>Use Case {idx + 1}</div>
        {canRemove && (
          <button style={c.btnDanger} onClick={onRemove}>Remove</button>
        )}
      </div>

      <div style={c.grid2}>

        {/* ══════════════════════════════
            LINKERKOLOM
            ══════════════════════════════ */}
        <div>

          {/* Spreker & Dimensie */}
          <Accord title="Speaker & Dimension" defaultOpen={true}>
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
            <div style={{ marginTop: 14 }}>
              <div style={c.subLabel}>Dimension</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {DIMENSIONS.map(d => (
                  <button key={d.id}
                    onClick={() => upScenario(idx, 'dimension', d.id)}
                    style={{
                      padding: '6px 11px',
                      background: sc.dimension === d.id ? '#E01B41' : '#F8F8F7',
                      border: `1.5px solid ${sc.dimension === d.id ? '#E01B41' : '#E0E0DC'}`,
                      borderRadius: 5, cursor: 'pointer',
                      fontFamily: "'Merriweather Sans', sans-serif",
                      fontSize: '0.75rem', fontWeight: 700,
                      color: sc.dimension === d.id ? '#FFFFFF' : '#0C182E',
                      transition: 'all 0.12s',
                    }}
                  >
                    {d.icon} {d.label}
                  </button>
                ))}
              </div>
            </div>
          </Accord>

          {/* Startpunt */}
          <Accord title="Starting point">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button
                style={{ ...c.toggleBtn, ...(useEventPortfolio ? {} : c.toggleBtnOn) }}
                onClick={() => upBaseToggle(idx, !useEventPortfolio)}
              >
                {useEventPortfolio ? '○ Own starting point' : '● Own starting point'}
              </button>
              <span style={c.helpText}>
                {useEventPortfolio ? 'Follows event portfolio' : 'Custom overrides active'}
              </span>
            </div>

            {!useEventPortfolio && (
              <div style={{ marginTop: 8 }}>
                <div style={c.subLabel}>Allocatie overrides</div>
                <div style={{ ...c.helpText, marginBottom: 8 }}>
                  Leave blank to inherit from the event portfolio.
                </div>
                <div style={c.tableHead}>
                  <span style={{ flex: 2 }}>Categorie</span>
                  <span style={c.th}>Basis</span>
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

                {sc.dimension === 'implementation' && implCats.length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <div style={c.subLabel}>Implementation overrides</div>
                    {implCats.map(cat => {
                      const override = sc.base?.implementation?.categories?.find(x => x.id === cat.id)
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
          </Accord>

          {/* Compare */}
          <Accord
            title="Compare"
            tooltip="Show an alternative portfolio state alongside the base — visible when the operator activates Compare on stage."
          >
            <ConfigComparisonEditor
              sc={sc}
              idx={idx}
              portfolio={portfolio}
              updaters={updaters}
            />
          </Accord>

          {/* Framing */}
          <Accord title="Framing (optional)">
            <div style={{ ...c.helpText, marginBottom: 12 }}>
              Override category labels for this use case only. Leave blank to use event portfolio labels.
            </div>

            {sc.dimension === 'implementation' && implCats.map(cat => {
              const catLabel = typeof cat.label === 'object' ? (cat.label.en || cat.id) : cat.label
              const framingCat = sc.framing?.implementation?.[cat.id]
              return (
                <div key={cat.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #EFEFED' }}>
                  <div style={{ ...c.subLabel, marginBottom: 6 }}>{catLabel}</div>
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

            {sc.dimension === 'asset_class' && portfolio.allocations.map(a => {
              const framingCat = sc.framing?.asset_class?.[a.id]
              const label = a.label?.en || a.id
              return (
                <div key={a.id} style={{ marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #EFEFED' }}>
                  <div style={{ ...c.subLabel, marginBottom: 6 }}>{label}</div>
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

            {sc.dimension !== 'implementation' && sc.dimension !== 'asset_class' && (
              <div style={c.helpText}>
                Framing is available for the Implementation and Asset Class dimensions.
              </div>
            )}
          </Accord>

        </div>

        {/* ══════════════════════════════
            RECHTERKOLOM
            ══════════════════════════════ */}
        <div>

          {/* Beleidsvraag & Scherm */}
          <Accord
            title="Policy question & screen"
            defaultOpen={true}
          >
            <Field label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                Screen name (operatorbalk)
                <Tooltip text="Short navigation label in the operator panel. Max 3 words, e.g. 'ESG & SFDR'." />
              </span>
            }>
              <TextInput wide
                value={sc.screenName?.en || sc.screenName || ''}
                onChange={v => upScenario(idx, 'screenName', typeof sc.screenName === 'object' ? { ...sc.screenName, en: v } : v)}
                placeholder="e.g. Active / Passive, ESG & SFDR..."
              />
            </Field>

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
                  placeholder="Naam zoals getoond op scherm..."
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

            <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['en', 'nl', 'fr', 'de'].map(lang => {
                const hasQ = !!(sc.policyQuestion?.[lang])
                return (
                  <span key={lang} style={{
                    padding: '3px 8px', borderRadius: 3,
                    fontFamily: "'Merriweather Sans', sans-serif",
                    fontSize: '0.65rem', fontWeight: 700,
                    background: hasQ ? 'rgba(78,213,150,0.1)' : 'rgba(0,0,0,0.04)',
                    color: hasQ ? '#1a7a50' : '#8A8A82',
                    border: `1px solid ${hasQ ? 'rgba(78,213,150,0.3)' : '#E0E0DC'}`,
                  }}>
                    {lang.toUpperCase()} {hasQ ? '✓' : '—'}
                  </span>
                )
              })}
            </div>
          </Accord>

          {/* Explore */}
          <Accord
            title="Explore"
            tooltip="Enables live sliders so the audience can shift weights interactively during the session."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <button
                style={{ ...c.toggleBtn, ...(sc.explore?.enabled ? c.toggleBtnOn : {}) }}
                onClick={() => upExploreToggle(idx, !sc.explore?.enabled)}
              >
                {sc.explore?.enabled ? '● Explore ON' : '○ Explore OFF'}
              </button>
              <span style={c.helpText}>
                {sc.explore?.enabled
                  ? 'Live sliders available for this use case'
                  : 'Explore disabled for this use case'}
              </span>
            </div>

            {sc.explore?.enabled && (
              <div style={{ marginTop: 8 }}>
                <Field label="Start explore from">
                  <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                    {['base', 'compare'].map(opt => (
                      <button key={opt}
                        onClick={() => upExploreStartFrom(idx, opt)}
                        style={{
                          padding: '6px 14px',
                          background: (sc.explore?.startFrom || 'base') === opt ? '#0C182E' : '#F8F8F7',
                          border: `1.5px solid ${(sc.explore?.startFrom || 'base') === opt ? '#0C182E' : '#E0E0DC'}`,
                          borderRadius: 5, cursor: 'pointer',
                          fontFamily: "'Merriweather Sans', sans-serif",
                          fontSize: '0.75rem', fontWeight: 700,
                          color: (sc.explore?.startFrom || 'base') === opt ? '#FFFFFF' : '#0C182E',
                        }}
                      >
                        {opt === 'base' ? 'Base (open)' : 'Compare (after reveal)'}
                      </button>
                    ))}
                  </div>
                </Field>
                <div style={{ ...c.helpText, marginTop: 8 }}>
                  {(sc.explore?.startFrom || 'base') === 'base'
                    ? 'Explore starts from the base portfolio — guides the audience towards a conclusion.'
                    : 'Explore starts from the compare state — deepens the conversation after the reveal.'}
                </div>
              </div>
            )}
          </Accord>

          {/* Performance view */}
          <Accord
            title="Performance view (optioneel)"
            tooltip="Adds a time series chart showing the impact of this use case. Appears as a separate button in the operator panel."
            headerRight={hasPerfView
              ? <span style={{
                  fontSize: '0.68rem', color: '#1a7a50',
                  fontFamily: "'Merriweather Sans', sans-serif", fontWeight: 700,
                }}>data present</span>
              : null
            }
          >
            <div style={{ marginBottom: 16 }}>
              <div style={c.subLabel}>Base portfolio — time series</div>
              <div style={{ ...c.helpText, marginBottom: 6 }}>
                Performance of the portfolio as configured for this use case.
              </div>
              <SeriesEditor
                series={sc.performanceView?.base}
                onUpdate={handlePerfBaseSeries}
                placeholder="e.g. Q1 2024"
              />
            </div>

            <div>
              <div style={c.subLabel}>Compare scenario — time series (optional)</div>
              <div style={{ ...c.helpText, marginBottom: 6 }}>
                Alternative performance if the compare scenario had been applied. Only shown when Compare is active in the operator panel.
              </div>
              <SeriesEditor
                series={sc.performanceView?.compare}
                onUpdate={handlePerfCompareSeries}
                placeholder="e.g. Q1 2024"
              />
            </div>
          </Accord>

        </div>
      </div>
    </div>
  )
}
