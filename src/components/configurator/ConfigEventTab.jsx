import { c } from './configuratorStyles'
import {
  Section, Field, TextInput, NumInput,
  LangTabs, TotalBadge, SubLabel, LANG_FULL,
} from './ConfigFormParts'
import { useState } from 'react'

const LANGUAGES = ['en', 'nl', 'fr', 'de']

export default function ConfigEventTab({ draft, updaters }) {
  const [activeLang, setActiveLang] = useState('en')
  const { upEvent, upPortfolio, upAlloc, upImpl, upPerf, upESG, upSFDR, upSector, upCurrency } = updaters
  const p = draft.portfolio

  const allocTotal = p.allocations.reduce((s, a) => s + (Number(a.current) || 0), 0)
  const targetTotal = p.allocations.reduce((s, a) => s + (Number(a.target) || 0), 0)
  const sfdrTotal = p.esg.sfdr.reduce((s, x) => s + (Number(x.weight) || 0), 0)

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
              <NumInput small value={a.target} onChange={v => upAlloc(a.id, 'target', v)} />
              <NumInput small value={a.min} onChange={v => upAlloc(a.id, 'min', v)} />
              <NumInput small value={a.max} onChange={v => upAlloc(a.id, 'max', v)} />
            </div>
          ))}
        </Section>

      </div>

      {/* ── Right column ── */}
      <div>

        {/* Implementation mix */}
        <Section title="Implementation Mix">
          <TotalBadge
            values={[p.implementation.active, p.implementation.passive, p.implementation.individual]}
            label="Mix total"
          />
          <div style={{ marginTop: 8 }}>
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
        <Section title="Performance Numbers">
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

        {/* Sector weights */}
        <Section
          title="Sector Weights"
          titleRight={
            <TotalBadge values={(p.sectors || []).map(s => s.weight)} label="Total" />
          }
        >
          {(p.sectors || []).map((sec, i) => (
            <Field key={sec.id} label={sec.label} row>
              <NumInput small value={sec.weight} onChange={v => upSector(i, v)} />
              <span style={c.unit}>%</span>
            </Field>
          ))}
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
