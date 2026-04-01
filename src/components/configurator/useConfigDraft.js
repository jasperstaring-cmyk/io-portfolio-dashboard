import { useState } from 'react'

// ── useConfigDraft ─────────────────────────────────────────────────────────
// Owns all draft state and exposes clean updater functions.
// No JSX — pure logic only.

export function useConfigDraft(initialConfig) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initialConfig)))

  // ── Event ────────────────────────────────────────────────────────────────

  function upEvent(key, val) {
    setDraft(d => ({ ...d, event: { ...d.event, [key]: val } }))
  }

  // ── Portfolio ────────────────────────────────────────────────────────────

  function upPortfolio(key, val) {
    setDraft(d => ({ ...d, portfolio: { ...d.portfolio, [key]: val } }))
  }

  function upAlloc(id, key, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        allocations: d.portfolio.allocations.map(a =>
          a.id === id ? { ...a, [key]: val } : a
        ),
      },
    }))
  }

  function upImpl(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        implementation: { ...d.portfolio.implementation, [key]: val },
      },
    }))
  }

  function upPerf(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        performance: { ...d.portfolio.performance, [key]: val },
      },
    }))
  }

  function upESG(key, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        esg: { ...d.portfolio.esg, [key]: val },
      },
    }))
  }

  function upSFDR(idx, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        esg: {
          ...d.portfolio.esg,
          sfdr: d.portfolio.esg.sfdr.map((s, i) =>
            i === idx ? { ...s, weight: val } : s
          ),
        },
      },
    }))
  }


  function upSector(idx, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        sectors: d.portfolio.sectors.map((s, i) =>
          i === idx ? { ...s, weight: val } : s
        ),
      },
    }))
  }

  function upCurrency(idx, val) {
    setDraft(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        currencies: d.portfolio.currencies.map((c, i) =>
          i === idx ? { ...c, weight: val } : c
        ),
      },
    }))
  }

  // ── Scenarios ────────────────────────────────────────────────────────────

  function upScenario(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, [key]: val } : s
      ),
    }))
  }

  function upScenarioLang(idx, field, lang, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, [field]: { ...s[field], [lang]: val } } : s
      ),
    }))
  }

  function upSpeaker(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx
          ? { ...s, speakerProfile: { ...s.speakerProfile, [key]: val } }
          : s
      ),
    }))
  }

  // ── Comparison ───────────────────────────────────────────────────────────

  function upCompLabel(idx, lang, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? { ...s.comparison, label: { ...s.comparison.label, [lang]: val } }
            : null,
        }
      ),
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
      }),
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
            : null,
        }
      ),
    }))
  }

  function upCompSFDR(idx, sfdrIdx, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx || !s.comparison) return s
        const baseSFDR = d.portfolio.esg.sfdr
        const current = s.comparison.esg?.sfdr || baseSFDR.map(x => ({ ...x }))
        const updated = current.map((item, j) => j === sfdrIdx ? { ...item, weight: val } : item)
        return {
          ...s,
          comparison: {
            ...s.comparison,
            esg: { ...(s.comparison.esg || {}), sfdr: updated },
          },
        }
      }),
    }))
  }

  function upCompImpl(idx, key, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          comparison: s.comparison
            ? {
                ...s.comparison,
                implementation: { ...(s.comparison.implementation || {}), [key]: val },
              }
            : null,
        }
      ),
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
            : null,
        }
      ),
    }))
  }


  function upCompSector(idx, sectorId, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx || !s.comparison) return s
        const sectors = s.comparison.sectors || []
        const exists = sectors.find(x => x.id === sectorId)
        const newSectors = val === ''
          ? sectors.filter(x => x.id !== sectorId)
          : exists
            ? sectors.map(x => x.id === sectorId ? { ...x, weight: Number(val) } : x)
            : [...sectors, { id: sectorId, weight: Number(val) }]
        return { ...s, comparison: { ...s.comparison, sectors: newSectors } }
      }),
    }))
  }

  function upCompCurrency(idx, currency, val) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx || !s.comparison) return s
        const currencies = s.comparison.currencies || []
        const exists = currencies.find(x => x.currency === currency)
        const newCurrencies = val === ''
          ? currencies.filter(x => x.currency !== currency)
          : exists
            ? currencies.map(x => x.currency === currency ? { ...x, weight: Number(val) } : x)
            : [...currencies, { currency, weight: Number(val) }]
        return { ...s, comparison: { ...s.comparison, currencies: newCurrencies } }
      }),
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
            allocations: [],
          },
        }
      }),
    }))
  }

  function addScenario(currentLength) {
    const newSc = {
      id: `sc_${Date.now()}`,
      speakerProfile: { name: '', title: '', organisation: '' },
      speaker: { en: 'New Speaker', nl: '', fr: '', de: '' },
      theme: { en: 'Theme', nl: '', fr: '', de: '' },
      policyQuestion: { en: '', nl: '', fr: '', de: '' },
      dimension: 'asset_class',
      state: 'base',
      comparison: null,
    }
    setDraft(d => ({ ...d, scenarios: [...d.scenarios, newSc] }))
    return currentLength // caller uses this as new active index
  }

  function removeScenario(idx) {
    setDraft(d => ({
      ...d,
      scenarios: d.scenarios.filter((_, i) => i !== idx),
    }))
  }

  return {
    draft,
    // Event
    upEvent,
    // Portfolio
    upPortfolio, upAlloc, upImpl, upPerf, upESG, upSFDR, upSector, upCurrency,
    // Scenarios
    upScenario, upScenarioLang, upSpeaker,
    // Comparison
    upCompLabel, upCompAlloc, upCompESG, upCompSFDR,
    upCompImpl, upCompCosts, toggleComparison,
    upCompSector, upCompCurrency,
    // Scenario CRUD
    addScenario, removeScenario,
  }
}
