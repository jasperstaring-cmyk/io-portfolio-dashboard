import { c } from './configuratorStyles'
import {
  Section, Field, NumInput, TextInput, LangTabs, SubLabel, TotalBadge,
  LANGUAGES, LANG_FULL,
} from './ConfigFormParts'
import { useState } from 'react'

const DIMENSION_LABELS = {
  asset_class: 'Asset Class',
  geography: 'Geography',
  esg: 'ESG',
  implementation: 'Implementation',
  performance: 'Performance',
}

export default function ConfigComparisonEditor({ sc, idx, portfolio, updaters }) {
  const [activeLang, setActiveLang] = useState('en')
  const {
    toggleComparison, upCompLabel,
    upCompAlloc, upCompESG, upCompSFDR,
    upCompImplCat,
    upCompSector, upCompCurrency,
  } = updaters

  const comp = sc.comparison

  // Compute alloc total for comparison (merges base + overrides)
  function compAllocTotal() {
    return portfolio.allocations.reduce((sum, a) => {
      const override = comp?.allocations?.find(ca => ca.id === a.id)
      return sum + (override ? override.current : a.current)
    }, 0)
  }

  return (
    <Section title="Compare">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: comp ? 14 : 0 }}>
        <button
          style={{ ...c.toggleBtn, ...(comp ? c.toggleBtnOn : {}) }}
          onClick={() => toggleComparison(idx)}
        >
          {comp ? '● Compare ON' : '○ Compare OFF'}
        </button>
        {!comp && (
          <span style={c.helpText}>
            Enable to show an alternative portfolio state for this scenario
          </span>
        )}
      </div>

      {comp && (
        <div>

          {/* Comparison label per language */}
          <SubLabel>Comparison label (shown in operator panel)</SubLabel>
          <LangTabs active={activeLang} onChange={setActiveLang} />
          <Field label={LANG_FULL[activeLang]}>
            <TextInput wide
              value={comp.label?.[activeLang]}
              onChange={v => upCompLabel(idx, activeLang, v)}
              placeholder={`Label in ${LANG_FULL[activeLang]}...`}
            />
          </Field>

          {/* Allocation overrides — from→to display */}
          <div style={{ marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <SubLabel>Allocation overrides</SubLabel>
              <TotalBadge
                values={portfolio.allocations.map(a => {
                  const ov = comp.allocations?.find(ca => ca.id === a.id)
                  return ov ? ov.current : a.current
                })}
                label="Total"
              />
            </div>
            <div style={{ ...c.helpText, marginBottom: 8 }}>
              Leave blank to keep base value. Only changed categories are stored.
            </div>

            {/* Column headers */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 4, borderBottom: '1px solid #EFEFED', marginBottom: 2 }}>
              <div style={{ flex: 1 }} />
              <span style={{ ...c.th, width: 40 }}>Base</span>
              <span style={{ ...c.th, width: 16, color: 'transparent' }}>→</span>
              <span style={{ ...c.th, width: 64 }}>Compare</span>
              <span style={{ ...c.th, width: 44 }}>Δ</span>
            </div>

            {portfolio.allocations.map(a => {
              const override = comp.allocations?.find(ca => ca.id === a.id)
              const compVal = override ? override.current : undefined
              const delta = compVal !== undefined ? compVal - a.current : 0
              const hasChange = compVal !== undefined

              return (
                <div key={a.id} style={c.deltaRow}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: a.color, flexShrink: 0,
                    }} />
                    <span style={c.rowLabel}>{a.label?.en || a.id}</span>
                  </div>
                  <span style={c.deltaFrom}>{a.current}%</span>
                  <span style={c.deltaArrow}>→</span>
                  <input
                    style={{ ...c.input, width: 64 }}
                    type="number" min={0} max={100}
                    placeholder="—"
                    value={compVal ?? ''}
                    onChange={e => upCompAlloc(idx, a.id, e.target.value)}
                  />
                  <span style={{
                    ...c.deltaDiff,
                    color: !hasChange ? '#C0C0BB'
                      : delta > 0 ? '#4ED596'
                      : delta < 0 ? '#E01B41'
                      : '#8A8A82',
                  }}>
                    {hasChange && delta !== 0
                      ? `${delta > 0 ? '+' : ''}${delta}%`
                      : hasChange ? '=' : '—'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* ESG override — shown when dimension is ESG */}
          {sc.dimension === 'esg' && (
            <div style={{ marginTop: 14 }}>
              <SubLabel>ESG override</SubLabel>
              <Field label="Compare ESG score (0–10)" row>
                <NumInput small step={0.1} min={0} max={10}
                  value={comp.esg?.score ?? ''}
                  onChange={v => upCompESG(idx, 'score', v)} />
              </Field>

              {/* SFDR overrides */}
              <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <SubLabel>SFDR distribution (compare)</SubLabel>
                  {comp.esg?.sfdr && (
                    <TotalBadge
                      values={comp.esg.sfdr.map(x => x.weight)}
                      label="SFDR"
                    />
                  )}
                </div>
                {portfolio.esg.sfdr.map((item, i) => {
                  const compWeight = comp.esg?.sfdr?.[i]?.weight ?? item.weight
                  const delta = compWeight - item.weight
                  return (
                    <div key={item.article} style={c.deltaRow}>
                      <span style={{ ...c.rowLabel, flex: 1 }}>{item.article}</span>
                      <span style={c.deltaFrom}>{item.weight}%</span>
                      <span style={c.deltaArrow}>→</span>
                      <NumInput small
                        value={comp.esg?.sfdr?.[i]?.weight ?? item.weight}
                        onChange={v => upCompSFDR(idx, i, v)} />
                      <span style={{
                        ...c.deltaDiff,
                        color: delta > 0 ? '#4ED596' : delta < 0 ? '#E01B41' : '#8A8A82',
                      }}>
                        {delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}%` : '='}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Implementation override — shown when dimension is implementation */}
          {sc.dimension === 'implementation' && (() => {
            const implCats = Array.isArray(portfolio.implementation?.categories)
              ? portfolio.implementation.categories
              : Object.entries(portfolio.implementation || {})
                  .filter(([, v]) => typeof v === 'number')
                  .map(([id, weight]) => ({ id, weight, label: { en: id } }))
            const compCats = comp.implementation?.categories || []
            const total = implCats.map(cat => {
              const cc = compCats.find(c => c.id === cat.id)
              return cc ? cc.weight : cat.weight
            })
            return (
              <div style={{ marginTop: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <SubLabel>Implementation override</SubLabel>
                  <TotalBadge values={total} label="Mix total" />
                </div>
                {implCats.map(cat => {
                  const label = typeof cat.label === 'object' ? (cat.label.en || cat.id) : (cat.label || cat.id)
                  const compCat = compCats.find(c => c.id === cat.id)
                  const compVal = compCat?.weight
                  const delta = compVal !== undefined ? compVal - cat.weight : 0
                  return (
                    <div key={cat.id} style={c.deltaRow}>
                      <span style={{ ...c.rowLabel, flex: 1 }}>{label}</span>
                      <span style={c.deltaFrom}>{cat.weight}%</span>
                      <span style={c.deltaArrow}>→</span>
                      <NumInput small
                        value={compVal ?? ''}
                        onChange={v => upCompImplCat(idx, cat.id, v)} />
                      <span style={{
                        ...c.deltaDiff,
                        color: delta > 0 ? '#4ED596' : delta < 0 ? '#E01B41' : '#8A8A82',
                      }}>
                        {compVal !== undefined && delta !== 0
                          ? `${delta > 0 ? '+' : ''}${delta}%`
                          : compVal !== undefined ? '=' : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Sector override */}
          {sc.dimension === 'sector' && (
            <div style={{ marginTop: 14 }}>
              <SubLabel>Sector overrides</SubLabel>
              <div style={{ ...c.helpText, marginBottom: 8 }}>
                Only fill in sectors that change.
              </div>
              {(portfolio.sectors || []).map((sec, i) => {
                const compSec = comp.sectors?.find(s => s.id === sec.id)
                const compVal = compSec?.weight
                const delta = compVal !== undefined ? compVal - sec.weight : 0
                return (
                  <div key={sec.id} style={c.deltaRow}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: sec.color }} />
                      <span style={c.rowLabel}>{typeof sec.label === 'object' ? (sec.label.en || sec.id) : (sec.label || sec.id)}</span>
                      <span style={c.helpText}>({sec.weight}%)</span>
                    </div>
                    <span style={c.deltaArrow}>→</span>
                    <input style={{ ...c.input, width: 64 }}
                      type="number" min={0} max={100}
                      placeholder="—"
                      value={compVal ?? ''}
                      onChange={e => upCompSector(idx, sec.id, e.target.value)} />
                    <span style={{
                      ...c.deltaDiff,
                      color: !compVal ? '#C0C0BB' : delta > 0 ? '#E01B41' : delta < 0 ? '#4ED596' : '#8A8A82',
                    }}>
                      {compVal !== undefined && delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}%` : compVal !== undefined ? '=' : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          {/* Currency override */}
          {sc.dimension === 'currency' && (
            <div style={{ marginTop: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <SubLabel>Currency overrides</SubLabel>
                {comp.currencies && (
                  <TotalBadge values={comp.currencies.map(c => c.weight)} label="Total" />
                )}
              </div>
              {(portfolio.currencies || []).map((cur, i) => {
                const compCur = comp.currencies?.find(c => c.currency === cur.currency)
                const compVal = compCur?.weight
                const delta = compVal !== undefined ? compVal - cur.weight : 0
                return (
                  <div key={cur.currency} style={c.deltaRow}>
                    <span style={{ ...c.rowLabel, flex: 1 }}>{cur.currency}</span>
                    <span style={c.deltaFrom}>{cur.weight}%</span>
                    <span style={c.deltaArrow}>→</span>
                    <input style={{ ...c.input, width: 64 }}
                      type="number" min={0} max={100}
                      placeholder="—"
                      value={compVal ?? ''}
                      onChange={e => upCompCurrency(idx, cur.currency, e.target.value)} />
                    <span style={{
                      ...c.deltaDiff,
                      color: !compVal ? '#C0C0BB' : delta > 0 ? '#E01B41' : delta < 0 ? '#4ED596' : '#8A8A82',
                    }}>
                      {compVal !== undefined && delta !== 0 ? `${delta > 0 ? '+' : ''}${delta}%` : compVal !== undefined ? '=' : '—'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}
    </Section>
  )
}
