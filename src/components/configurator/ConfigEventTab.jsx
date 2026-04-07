import { c } from './configuratorStyles'
import {
  Section, Field, TextInput, NumInput,
  LangTabs, TotalBadge, SubLabel, LANG_FULL,
} from './ConfigFormParts'
import { useState } from 'react'

const LANGUAGES = ['en', 'nl', 'fr', 'de']

function getImplCats(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight,
      label: { en: id.charAt(0).toUpperCase() + id.slice(1) }
    }))
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

// ── Herbruikbare slider-rij ────────────────────────────────────────────────
function ScaleSlider({ value, onChange, min, max, step, helpText }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <input
          type="range" min={min} max={max} step={step}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ flex: 1, accentColor: '#0C182E' }}
        />
        <span style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '0.82rem', fontWeight: 700,
          color: '#0C182E', minWidth: 40, textAlign: 'right',
        }}>
          {Number(value).toFixed(2)}×
        </span>
      </div>
      {helpText && <div style={c.helpText}>{helpText}</div>}
    </>
  )
}

// ── Series editor ──────────────────────────────────────────────────────────
function SeriesEditor({ series, onUpdate }) {
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
      {/* Header */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 4 }}>
        <div style={{ ...se.thCell, flex: 1 }}>Label</div>
        <div style={{ ...se.thCell, width: 80 }}>Portfolio</div>
        <div style={{ ...se.thCell, width: 80 }}>Benchmark</div>
        <div style={{ width: 28 }} />
      </div>
      {/* Rijen */}
      {rows.map((row, i) => (
        <div key={i} style={se.row}>
          <input
            style={{ ...c.input, flex: 1, minWidth: 0 }}
            type="text"
            value={row.label || ''}
            placeholder={i === 0 ? 'e.g. Jan 2024 or Q1 or 2022' : ''}
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
        <div style={se.empty}>No data points yet. Add a row to define the time series.</div>
      )}
      <button style={se.addBtn} onClick={addRow}>+ Add data point</button>
      {rows.length > 0 && (
        <div style={se.hint}>
          First row is index 100 — enter absolute values (e.g. 100, 103.2).
          Label is free text: month, quarter, year, or any period.
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
    textTransform: 'uppercase',
    paddingBottom: 3,
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

// ── Nav items ──────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'event',          label: 'Event' },
  { id: 'portfolio',      label: 'Portfolio' },
  { id: 'allocatie',      label: 'Allocation' },
  { id: 'implementation', label: 'Implementation' },
  { id: 'esg',            label: 'ESG' },
  { id: 'performance',    label: 'Performance' },
  { id: 'sector',         label: 'Sector & Currency' },
]

// ── Main component ─────────────────────────────────────────────────────────
export default function ConfigEventTab({ draft, updaters }) {
  const [activeSection, setActiveSection] = useState('event')
  const {
    upEvent, upPortfolio, upAlloc, upImplCat, upPerf, upESG, upSFDR,
    upSector, upCurrency,
    upTextScale, upLabelScale, upStrokeScale,
  } = updaters

  const p = draft.portfolio

  // Scale-waarden met fallback op displayScale voor backwards-compat
  const legacyScale  = draft.displayScale ?? 1.0
  const textScale    = draft.textScale    ?? legacyScale
  const labelScale   = draft.labelScale   ?? legacyScale
  const strokeScale  = draft.strokeScale  ?? legacyScale

  const allocTotal  = p.allocations.reduce((s, a) => s + (Number(a.current) || 0), 0)
  const targetTotal = p.allocations.reduce((s, a) => s + (Number(a.target)  || 0), 0)
  const sfdrTotal   = p.esg.sfdr.reduce((s, x) => s + (Number(x.weight) || 0), 0)
  const implCats    = getImplCats(p.implementation)
  const implTotal   = implCats.reduce((s, cat) => s + (Number(cat.weight) || 0), 0)
  const sectorTotal = (p.sectors || []).reduce((s, x) => s + (Number(x.weight) || 0), 0)
  const currTotal   = (p.currencies || []).reduce((s, x) => s + (Number(x.weight) || 0), 0)

  function upSeries(newSeries) { upPerf('series', newSeries) }

  function indicator(total, tolerance = 0.5) {
    return Math.abs(total - 100) >= tolerance ? 'warn' : null
  }

  const indicators = {
    allocatie:      indicator(allocTotal) || indicator(targetTotal),
    implementation: indicator(implTotal),
    esg:            indicator(sfdrTotal),
    sector:         indicator(sectorTotal) || indicator(currTotal),
  }

  return (
    <div style={{ display: 'flex', height: '100%', minHeight: 0 }}>

      {/* ── Zijbalk navigatie ── */}
      <div style={{
        width: 178, flexShrink: 0,
        borderRight: '1px solid #E0E0DC',
        paddingTop: 10, paddingBottom: 10,
      }}>
        {NAV_ITEMS.map(item => {
          const isActive = activeSection === item.id
          const warn = indicators[item.id]
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                width: '100%', padding: '10px 16px',
                background: isActive ? '#F0F0ED' : 'none',
                border: 'none',
                borderLeft: `2px solid ${isActive ? '#E01B41' : 'transparent'}`,
                cursor: 'pointer',
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.82rem', fontWeight: isActive ? 700 : 400,
                color: isActive ? '#0C182E' : '#5A5A54',
                textAlign: 'left',
                transition: 'all 0.1s',
              }}
            >
              {item.label}
              {warn && (
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: '#F5A623', flexShrink: 0,
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Actief paneel ── */}
      <div style={{ flex: 1, padding: '24px 28px', overflowY: 'auto' }}>

        {/* ── Event ── */}
        {activeSection === 'event' && (
          <div style={{ maxWidth: 540 }}>
            <PanelTitle>Event</PanelTitle>
            <Field label="Event name">
              <TextInput wide value={draft.event.name} onChange={v => upEvent('name', v)} />
            </Field>
            <Field label="Default language">
              <select style={c.input} value={draft.event.language}
                onChange={e => upEvent('language', e.target.value)}>
                {LANGUAGES.map(l => (
                  <option key={l} value={l}>{LANG_FULL[l]}</option>
                ))}
              </select>
            </Field>

            {/* ── Presentatie-instellingen ── */}
            <div style={{
              marginTop: 28,
              paddingTop: 20,
              borderTop: '1px solid #E0E0DC',
            }}>
              <div style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.72rem', fontWeight: 800,
                color: '#8A8A82', letterSpacing: '0.08em',
                textTransform: 'uppercase', marginBottom: 18,
              }}>
                Presentatie-instellingen
              </div>

              {/* Slider 1: Beleidsvraag */}
              <Field label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  Beleidsvraag
                  <Tooltip text="Schaalt de grootte van de beleidsvraag en framing-tekst bovenin het scherm. Vergroot voor grote zalen en projectieschermen." />
                </span>
              }>
                <ScaleSlider
                  value={textScale}
                  onChange={upTextScale}
                  min="0.8" max="2.0" step="0.05"
                  helpText="0.80 = laptop · 1.00 = normaal · 1.35 = auditorium · 1.80 = groot scherm"
                />
              </Field>

              {/* Slider 2: Grafiek-labels */}
              <Field label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  Grafiek-labels
                  <Tooltip text="Schaalt de lettergrootte van alle labels en waarden binnen de grafieken. Vergroot als cijfers op afstand moeilijk leesbaar zijn." />
                </span>
              }>
                <ScaleSlider
                  value={labelScale}
                  onChange={upLabelScale}
                  min="0.8" max="1.6" step="0.05"
                  helpText="0.80 = compact · 1.00 = normaal · 1.35 = auditorium · 1.60 = groot scherm"
                />
              </Field>

              {/* Slider 3: Lijndikte */}
              <Field label={
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  Lijndikte
                  <Tooltip text="Schaalt de dikte van grafieklijnen, arcs en compare-ringen. Vergroot als lijnen op afstand moeilijk zichtbaar zijn." />
                </span>
              }>
                <ScaleSlider
                  value={strokeScale}
                  onChange={upStrokeScale}
                  min="0.8" max="1.6" step="0.05"
                  helpText="0.80 = dun · 1.00 = normaal · 1.35 = auditorium · 1.60 = dik"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── Portfolio ── */}
        {activeSection === 'portfolio' && (
          <div style={{ maxWidth: 540 }}>
            <PanelTitle>Portfolio</PanelTitle>
            <Field label="Portfolio name">
              <TextInput wide value={p.name} onChange={v => upPortfolio('name', v)} />
            </Field>
            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Risk profile">
                <select style={c.input} value={p.profile}
                  onChange={e => upPortfolio('profile', e.target.value)}>
                  {['Defensive', 'Balanced', 'Growth', 'Dynamic'].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
              <Field label="Currency">
                <select style={c.input} value={p.currency}
                  onChange={e => upPortfolio('currency', e.target.value)}>
                  {['EUR', 'GBP', 'CHF', 'USD'].map(v => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        )}

        {/* ── Allocatie ── */}
        {activeSection === 'allocatie' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <PanelTitle style={{ marginBottom: 0 }}>Asset Allocation</PanelTitle>
              <div style={{ display: 'flex', gap: 6 }}>
                <TotalBadge values={p.allocations.map(a => a.current)} label="Current" />
                <TotalBadge values={p.allocations.map(a => a.target)} label="Target" />
              </div>
            </div>
            {(Math.abs(allocTotal - 100) >= 0.5 || Math.abs(targetTotal - 100) >= 0.5) && (
              <WarnBanner>
                {[
                  Math.abs(allocTotal - 100) >= 0.5 && `Current: ${allocTotal}%`,
                  Math.abs(targetTotal - 100) >= 0.5 && `Target: ${targetTotal}%`,
                ].filter(Boolean).join(' · ')}
                {' — must add up to 100%'}
              </WarnBanner>
            )}
            <div style={c.tableHead}>
              <span style={{ flex: 2 }}>Categorie</span>
              <span style={c.th}>Current</span>
              <span style={c.th}>Target</span>
              <span style={c.th}>Min</span>
              <span style={c.th}>Max</span>
            </div>
            {p.allocations.map(a => (
              <div key={a.id} style={c.tableRow}>
                <div style={{ flex: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: a.color, flexShrink: 0 }} />
                  <span style={c.rowLabel}>{a.label?.en || a.id}</span>
                </div>
                <NumInput small value={a.current} onChange={v => upAlloc(a.id, 'current', v)} />
                <NumInput small value={a.target}  onChange={v => upAlloc(a.id, 'target',  v)} />
                <NumInput small value={a.min}     onChange={v => upAlloc(a.id, 'min',     v)} />
                <NumInput small value={a.max}     onChange={v => upAlloc(a.id, 'max',     v)} />
              </div>
            ))}
          </div>
        )}

        {/* ── Implementation ── */}
        {activeSection === 'implementation' && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <PanelTitle style={{ marginBottom: 0 }}>Implementation Mix</PanelTitle>
              <TotalBadge values={implCats.map(cat => cat.weight)} label="Mix total" />
            </div>
            {Math.abs(implTotal - 100) >= 0.5 && (
              <WarnBanner>Mix total: {implTotal}% — must add up to 100%</WarnBanner>
            )}
            {implCats.map(cat => {
              const label = typeof cat.label === 'object'
                ? (cat.label.en || cat.id)
                : (cat.label || cat.id)
              return (
                <Field key={cat.id} label={`${label} %`} row>
                  <NumInput small value={cat.weight}
                    onChange={v => upImplCat(cat.id, 'weight', v)} />
                </Field>
              )
            })}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EFEFED' }}>
              <Field label="Weighted avg. TER (%)" row>
                <NumInput small step={0.01}
                  value={p.costs?.weightedTer}
                  onChange={v => upPortfolio('costs', { ...p.costs, weightedTer: v })} />
              </Field>
            </div>
          </div>
        )}

        {/* ── ESG ── */}
        {activeSection === 'esg' && (
          <div style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <PanelTitle style={{ marginBottom: 0 }}>ESG Profiel</PanelTitle>
              <TotalBadge values={p.esg.sfdr.map(x => x.weight)} label="SFDR" />
            </div>
            <div style={{ display: 'flex', gap: 20, marginBottom: 18 }}>
              <Field label="ESG Score (0–10)" row>
                <NumInput small step={0.1} min={0} max={10} value={p.esg.score}
                  onChange={v => upESG('score', v)} />
              </Field>
              <Field label="Carbon Risk Score" row>
                <NumInput small value={p.esg.carbonRisk} onChange={v => upESG('carbonRisk', v)} />
              </Field>
            </div>
            <SubLabel>SFDR-verdeling</SubLabel>
            {Math.abs(sfdrTotal - 100) >= 0.5 && (
              <WarnBanner>SFDR total: {sfdrTotal}% — must add up to 100%</WarnBanner>
            )}
            {p.esg.sfdr.map((item, i) => (
              <Field key={item.article} label={item.article} row>
                <NumInput small value={item.weight} onChange={v => upSFDR(i, v)} />
                <span style={c.unit}>%</span>
              </Field>
            ))}
          </div>
        )}

        {/* ── Performance ── */}
        {activeSection === 'performance' && (
          <div style={{ maxWidth: 620 }}>
            <PanelTitle>Performance</PanelTitle>
            <SubLabel>Key metrics</SubLabel>
            <div style={{ ...c.grid2mini, marginBottom: 24 }}>
              {[
                { key: 'ytd',         label: 'YTD %' },
                { key: 'oneYear',     label: '1Y %' },
                { key: 'threeYear',   label: '3Y Ann. %' },
                { key: 'benchmark',   label: 'Benchmark %' },
                { key: 'volatility',  label: 'Volatility %' },
                { key: 'maxDrawdown', label: 'Max Drawdown %' },
              ].map(f => (
                <Field key={f.key} label={f.label}>
                  <NumInput step={0.1} value={p.performance[f.key]} onChange={v => upPerf(f.key, v)} />
                </Field>
              ))}
            </div>
            <SubLabel>Time series (chart)</SubLabel>
            <SeriesEditor series={p.performance?.series} onUpdate={upSeries} />
          </div>
        )}

        {/* ── Sector & Valuta ── */}
        {activeSection === 'sector' && (
          <div style={{ display: 'flex', gap: 48, alignItems: 'flex-start' }}>

            <div style={{ minWidth: 280 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <PanelTitle style={{ marginBottom: 0 }}>Sector Weights</PanelTitle>
                <TotalBadge values={(p.sectors || []).map(s => s.weight)} label="Total" />
              </div>
              {Math.abs(sectorTotal - 100) >= 0.5 && (
                <WarnBanner>Sector total: {sectorTotal}% — must add up to 100%</WarnBanner>
              )}
              {(p.sectors || []).map((sec, i) => {
                const label = typeof sec.label === 'object' ? (sec.label.en || sec.id) : (sec.label || sec.id)
                return (
                  <Field key={sec.id} label={label} row>
                    <NumInput small value={sec.weight} onChange={v => upSector(i, v)} />
                    <span style={c.unit}>%</span>
                  </Field>
                )
              })}
            </div>

            <div style={{ minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <PanelTitle style={{ marginBottom: 0 }}>Currency Weights</PanelTitle>
                <TotalBadge values={(p.currencies || []).map(cur => cur.weight)} label="Total" />
              </div>
              {Math.abs(currTotal - 100) >= 0.5 && (
                <WarnBanner>Currency total: {currTotal}% — must add up to 100%</WarnBanner>
              )}
              {(p.currencies || []).map((cur, i) => (
                <Field key={cur.currency} label={cur.currency} row>
                  <NumInput small value={cur.weight} onChange={v => upCurrency(i, v)} />
                  <span style={c.unit}>%</span>
                </Field>
              ))}
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

// ── Hulpcomponenten ────────────────────────────────────────────────────────

function PanelTitle({ children, style }) {
  return (
    <div style={{
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: '0.82rem', fontWeight: 800,
      color: '#0C182E', letterSpacing: '0.06em',
      textTransform: 'uppercase', marginBottom: 18,
      ...style,
    }}>
      {children}
    </div>
  )
}

function WarnBanner({ children }) {
  return (
    <div style={{
      fontFamily: "'Merriweather Sans', sans-serif",
      fontSize: '0.72rem',
      background: 'rgba(224,27,65,0.06)',
      border: '1px solid rgba(224,27,65,0.18)',
      borderRadius: 4, padding: '6px 10px', marginBottom: 12,
      color: '#E01B41',
    }}>
      {children}
    </div>
  )
}
