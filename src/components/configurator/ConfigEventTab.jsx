import { c } from './configuratorStyles'
import {
  Section, Field, TextInput, NumInput,
  LangTabs, TotalBadge, SubLabel, LANG_FULL,
} from './ConfigFormParts'
import { useState } from 'react'

const LANGUAGES = ['en', 'nl', 'fr', 'de']

// Haal implementation categories op ongeacht formaat
function getImplCats(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight,
      label: { en: id.charAt(0).toUpperCase() + id.slice(1) }
    }))
}

// ── Series editor ──────────────────────────────────────────────────────────
// Beheert de tijdreeks voor de performance chart.
// Elk datapunt heeft een vrij label (maand, kwartaal, jaar — wat past),
// een portfolio-indexwaarde en een benchmark-indexwaarde.

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
    <div style={{ marginTop: 6 }}>
      {rows.length > 0 && (
        <div style={{ display: 'flex', gap: 4, marginBottom: 4, paddingLeft: 2 }}>
          <span style={{ ...se.th, flex: 2 }}>Label</span>
          <span style={se.th}>Portfolio</span>
          <span style={se.th}>Benchmark</span>
          <span style={{ width: 22 }} />
        </div>
      )}

      {rows.map((row, i) => (
        <div key={i} style={se.row}>
          <input
            style={{ ...c.input, flex: 2, minWidth: 0 }}
            type="text"
            value={row.label || ''}
            placeholder={i === 0 ? 'e.g. Jan 2024 or Q1 or 2022' : ''}
            onChange={e => updateRow(i, 'label', e.target.value)}
          />
          <input
            style={{ ...c.input, width: 70 }}
            type="number"
            step="0.1"
            value={row.portfolio ?? ''}
            onChange={e => updateRow(i, 'portfolio', e.target.value)}
          />
          <input
            style={{ ...c.input, width: 70 }}
            type="number"
            step="0.1"
            value={row.benchmark ?? ''}
            onChange={e => updateRow(i, 'benchmark', e.target.value)}
          />
          <button style={se.removeBtn} onClick={() => removeRow(i)} title="Remove">×</button>
        </div>
      ))}

      {rows.length === 0 && (
        <div style={se.empty}>
          No data points yet. Add a row to define the chart's time series.
        </div>
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
  th: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem', fontWeight: 700,
    color: '#8A8A82', letterSpacing: '0.06em',
    textTransform: 'uppercase', width: 70,
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 4, marginBottom: 3,
  },
  removeBtn: {
    width: 22, height: 22, flexShrink: 0,
    background: 'none', border: '1px solid rgba(224,27,65,0.25)',
    borderRadius: 4, cursor: 'pointer',
    color: '#E01B41', fontSize: '0.8rem', fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 0,
  },
  addBtn: {
    marginTop: 6,
    padding: '4px 10px',
    background: 'none',
    border: '1px solid rgba(78,213,150,0.4)',
    borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 700,
    color: '#1a7a50',
  },
  empty: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: '#8A8A82',
    fontStyle: 'italic', marginBottom: 6,
  },
  hint: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', color: '#8A8A82',
    marginTop: 6, lineHeight: 1.5,
  },
}

// ── Main component ─────────────────────────────────────────────────────────

export default function ConfigEventTab({ draft, updaters }) {
  const [activeLang, setActiveLang] = useState('en')
  const { upEvent, upPortfolio, upAlloc, upImplCat, upPerf, upESG, upSFDR, upSector, upCurrency, upScale } = updaters
  const p = draft.portfolio

  const displayScale = draft.displayScale ?? 1.0

  const allocTotal  = p.allocations.reduce((s, a) => s + (Number(a.current) || 0), 0)
  const targetTotal = p.allocations.reduce((s, a) => s + (Number(a.target)  || 0), 0)
  const sfdrTotal   = p.esg.sfdr.reduce((s, x) => s + (Number(x.weight) || 0), 0)
  const implCats    = getImplCats(p.implementation)
  const implTotal   = implCats.reduce((s, c) => s + (Number(c.weight) || 0), 0)

  function upSeries(newSeries) {
    upPerf('series', newSeries)
  }

  return (
    <div style={c.grid2}>

      {/* ── Left column ── */}
      <div>

        {/* Event settings */}
        <Section title="Event">
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
          <Field label="Tekstschaal (presentatiegrootte)">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="range"
                min="0.8" max="1.6" step="0.05"
                value={displayScale}
                onChange={e => upScale(e.target.value)}
                style={{ flex: 1, accentColor: '#0C182E' }}
              />
              <span style={{
                fontFamily: "'Merriweather Sans', sans-serif",
                fontSize: '0.75rem', fontWeight: 700,
                color: '#0C182E', minWidth: 36, textAlign: 'right',
              }}>
                {displayScale.toFixed(2)}×
              </span>
            </div>
            <div style={c.helpText}>
              1.00 = laptop · 1.20 = kleine zaal · 1.35 = auditorium · 1.50 = groot scherm
            </div>
          </Field>
        </Section>

        {/* Portfolio identity */}
        <Section title="Portfolio">
          <Field label="Portfolio name">
            <TextInput wide value={p.name} onChange={v => upPortfolio('name', v)} />
          </Field>
          <div style={{ display: 'flex', gap: 10 }}>
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
        </Section>

        {/* Asset allocation */}
        <Section
          title="Asset Allocation"
          titleRight={
            <div style={{ display: 'flex', gap: 6 }}>
              <TotalBadge values={p.allocations.map(a => a.current)} label="Current" />
              <TotalBadge values={p.allocations.map(a => a.target)} label="Target" />
            </div>
          }
        >
          {(Math.abs(allocTotal - 100) >= 0.5 || Math.abs(targetTotal - 100) >= 0.5) && (
            <div style={{
              ...c.helpText,
              background: 'rgba(224,27,65,0.06)',
              border: '1px solid rgba(224,27,65,0.18)',
              borderRadius: 4, padding: '5px 8px', marginBottom: 8,
              color: '#E01B41',
            }}>
              {[
                Math.abs(allocTotal - 100) >= 0.5 && `Current total: ${allocTotal}%`,
                Math.abs(targetTotal - 100) >= 0.5 && `Target total: ${targetTotal}%`,
              ].filter(Boolean).join(' · ')}
              {' — must add up to 100%'}
            </div>
          )}
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
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: a.color, flexShrink: 0,
                }} />
                <span style={c.rowLabel}>{a.label?.en || a.id}</span>
              </div>
              <NumInput small value={a.current} onChange={v => upAlloc(a.id, 'current', v)} />
              <NumInput small value={a.target}  onChange={v => upAlloc(a.id, 'target',  v)} />
              <NumInput small value={a.min}     onChange={v => upAlloc(a.id, 'min',     v)} />
              <NumInput small value={a.max}     onChange={v => upAlloc(a.id, 'max',     v)} />
            </div>
          ))}
        </Section>

      </div>

      {/* ── Right column ── */}
      <div>

        {/* Implementation mix — reads from categories[] */}
        <Section
          title="Implementation Mix"
          titleRight={<TotalBadge values={implCats.map(c => c.weight)} label="Mix total" />}
        >
          <div style={{ marginTop: 8 }}>
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
            <Field label="Weighted avg. TER (%)" row>
              <NumInput small step={0.01}
                value={p.costs?.weightedTer}
                onChange={v => upPortfolio('costs', { ...p.costs, weightedTer: v })} />
            </Field>
          </div>
        </Section>

        {/* ESG profile */}
        <Section
          title="ESG Profile"
          titleRight={
            <TotalBadge values={p.esg.sfdr.map(x => x.weight)} label="SFDR" />
          }
        >
          <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
            <Field label="ESG Score (0–10)" row>
              <NumInput small step={0.1} min={0} max={10} value={p.esg.score}
                onChange={v => upESG('score', v)} />
            </Field>
            <Field label="Carbon Risk Score" row>
              <NumInput small value={p.esg.carbonRisk} onChange={v => upESG('carbonRisk', v)} />
            </Field>
          </div>
          <SubLabel>SFDR Distribution</SubLabel>
          {sfdrTotal !== 100 && Math.abs(sfdrTotal - 100) >= 0.5 && (
            <div style={{
              ...c.helpText,
              background: 'rgba(224,27,65,0.06)',
              border: '1px solid rgba(224,27,65,0.18)',
              borderRadius: 4, padding: '5px 8px', marginBottom: 8,
              color: '#E01B41',
            }}>
              SFDR weights total {sfdrTotal}% — adjust to reach 100%
            </div>
          )}
          {p.esg.sfdr.map((item, i) => (
            <Field key={item.article} label={item.article} row>
              <NumInput small value={item.weight} onChange={v => upSFDR(i, v)} />
              <span style={c.unit}>%</span>
            </Field>
          ))}
        </Section>

        {/* Performance */}
        <Section title="Performance">
          <SubLabel>Key metrics</SubLabel>
          <div style={c.grid2mini}>
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
          <SubLabel style={{ marginTop: 12 }}>Time series (chart)</SubLabel>
          <SeriesEditor
            series={p.performance?.series}
            onUpdate={upSeries}
          />
        </Section>

        {/* Sector weights */}
        <Section
          title="Sector Weights"
          titleRight={
            <TotalBadge values={(p.sectors || []).map(s => s.weight)} label="Total" />
          }
        >
          {(p.sectors || []).map((sec, i) => {
            const label = typeof sec.label === 'object' ? (sec.label.en || sec.id) : (sec.label || sec.id)
            return (
              <Field key={sec.id} label={label} row>
                <NumInput small value={sec.weight} onChange={v => upSector(i, v)} />
                <span style={c.unit}>%</span>
              </Field>
            )
          })}
        </Section>

        {/* Currency weights */}
        <Section
          title="Currency Weights"
          titleRight={
            <TotalBadge values={(p.currencies || []).map(c => c.weight)} label="Total" />
          }
        >
          {(p.currencies || []).map((cur, i) => (
            <Field key={cur.currency} label={cur.currency} row>
              <NumInput small value={cur.weight} onChange={v => upCurrency(i, v)} />
              <span style={c.unit}>%</span>
            </Field>
          ))}
        </Section>

      </div>
    </div>
  )
}
