import { useState } from 'react'

// ── useConfigDraft v2 ──────────────────────────────────────────────────────
// Owns all draft state for the configurator.
// Works with registry.json format (v1.1) — backwards compatible with v1.0.
// Exposes clean updater functions. No JSX — pure logic only.

// Helper: get implementation categories regardless of format
function getImplCats(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  return Object.entries(implementation)
    .filter(([, v]) => typeof v === 'number')
    .map(([id, weight]) => ({ id, weight }))
}

export function useConfigDraft(initialConfig) {
  const [draft, setDraft] = useState(() => JSON.parse(JSON.stringify(initialConfig)))
  const [savedDraft, setSavedDraft] = useState(() => JSON.parse(JSON.stringify(initialConfig)))
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  function mark(fn) {
    setDraft(fn)
    setHasUnsavedChanges(true)
  }

  // ── Event ────────────────────────────────────────────────────────────────

  function upEvent(key, val) {
    mark(d => ({ ...d, event: { ...d.event, [key]: val } }))
  }

  // ── Portfolio ────────────────────────────────────────────────────────────

  function upPortfolio(key, val) {
    mark(d => ({ ...d, portfolio: { ...d.portfolio, [key]: val } }))
  }

  function upAlloc(id, key, val) {
    mark(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        allocations: d.portfolio.allocations.map(a =>
          a.id === id ? { ...a, [key]: val } : a
        ),
      },
    }))
  }

  // v1.1: update implementation category by id
  function upImplCat(id, key, val) {
    mark(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        implementation: {
          ...d.portfolio.implementation,
          categories: (d.portfolio.implementation.categories || []).map(c =>
            c.id === id ? { ...c, [key]: val } : c
          ),
        },
      },
    }))
  }

  function upPerf(key, val) {
    mark(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        performance: { ...d.portfolio.performance, [key]: val },
      },
    }))
  }

  function upESG(key, val) {
    mark(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        esg: { ...d.portfolio.esg, [key]: val },
      },
    }))
  }

  function upSFDR(idx, val) {
    mark(d => ({
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
    mark(d => ({
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
    mark(d => ({
      ...d,
      portfolio: {
        ...d.portfolio,
        currencies: d.portfolio.currencies.map((c, i) =>
          i === idx ? { ...c, weight: val } : c
        ),
      },
    }))
  }

  // ── Use cases (scenarios) ────────────────────────────────────────────────

  function upScenario(idx, key, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, [key]: val } : s
      ),
    }))
  }

  function upScenarioLang(idx, field, lang, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx ? { ...s, [field]: { ...s[field], [lang]: val } } : s
      ),
    }))
  }

  function upSpeaker(idx, key, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i === idx
          ? { ...s, speakerProfile: { ...s.speakerProfile, [key]: val } }
          : s
      ),
    }))
  }

  // ── Base override ────────────────────────────────────────────────────────

  function upBaseToggle(idx, useEventPortfolio) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          base: useEventPortfolio
            ? { useEventPortfolio: true }
            : { useEventPortfolio: false, ...(s.base?.useEventPortfolio === false ? s.base : {}) },
        }
      ),
    }))
  }

  function upBaseAlloc(idx, allocId, key, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx) return s
        const base = s.base || { useEventPortfolio: false }
        const allocs = base.allocations || []
        const exists = allocs.find(a => a.id === allocId)
        const newAllocs = exists
          ? allocs.map(a => a.id === allocId ? { ...a, [key]: val } : a)
          : [...allocs, { id: allocId, [key]: val }]
        return { ...s, base: { ...base, allocations: newAllocs } }
      }),
    }))
  }

  function upBaseImplCat(idx, catId, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx) return s
        const base = s.base || { useEventPortfolio: false }
        const cats = base.implementation?.categories || []
        const exists = cats.find(c => c.id === catId)
        const newCats = exists
          ? cats.map(c => c.id === catId ? { ...c, weight: val } : c)
          : [...cats, { id: catId, weight: val }]
        return {
          ...s,
          base: {
            ...base,
            implementation: { ...(base.implementation || {}), categories: newCats },
          },
        }
      }),
    }))
  }

  // ── Framing ──────────────────────────────────────────────────────────────

  function upFraming(idx, dimension, catId, field, lang, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx) return s
        const framing = s.framing || {}
        const dimFraming = framing[dimension] || {}
        const catFraming = dimFraming[catId] || {}
        const fieldVal = catFraming[field] || {}
        return {
          ...s,
          framing: {
            ...framing,
            [dimension]: {
              ...dimFraming,
              [catId]: {
                ...catFraming,
                [field]: { ...fieldVal, [lang]: val },
              },
            },
          },
        }
      }),
    }))
  }

  // ── Explore ──────────────────────────────────────────────────────────────

  function upExploreToggle(idx, enabled) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          explore: {
            ...(s.explore || {}),
            enabled,
            startFrom: s.explore?.startFrom || 'base',
            dimensions: s.explore?.dimensions || [s.dimension],
          },
        }
      ),
    }))
  }

  function upExploreStartFrom(idx, startFrom) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) =>
        i !== idx ? s : {
          ...s,
          explore: { ...(s.explore || { enabled: true }), startFrom },
        }
      ),
    }))
  }

  // ── Comparison ───────────────────────────────────────────────────────────

  function upCompLabel(idx, lang, val) {
    mark(d => ({
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
    mark(d => ({
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
    mark(d => ({
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
    mark(d => ({
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

  function upCompImplCat(idx, catId, val) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.map((s, i) => {
        if (i !== idx || !s.comparison) return s
        const cats = s.comparison.implementation?.categories || []
        const exists = cats.find(c => c.id === catId)
        const newCats = val === ''
          ? cats.filter(c => c.id !== catId)
          : exists
            ? cats.map(c => c.id === catId ? { ...c, weight: Number(val) } : c)
            : [...cats, { id: catId, weight: Number(val) }]
        return {
          ...s,
          comparison: {
            ...s.comparison,
            implementation: { ...(s.comparison.implementation || {}), categories: newCats },
          },
        }
      }),
    }))
  }

  function upCompSector(idx, sectorId, val) {
    mark(d => ({
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
    mark(d => ({
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
    mark(d => ({
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

  // ── Scenario CRUD ────────────────────────────────────────────────────────

  function addScenario(currentLength) {
    const newSc = {
      id: `sc_${Date.now()}`,
      speakerProfile: { name: '', title: '', organisation: '' },
      speaker: { en: 'New Speaker', nl: '', fr: '', de: '' },
      theme: { en: 'Theme', nl: '', fr: '', de: '' },
      policyQuestion: { en: '', nl: '', fr: '', de: '' },
      dimension: 'asset_class',
      base: { useEventPortfolio: true },
      comparison: null,
    }
    mark(d => ({ ...d, scenarios: [...d.scenarios, newSc] }))
    return currentLength
  }

  function removeScenario(idx) {
    mark(d => ({
      ...d,
      scenarios: d.scenarios.filter((_, i) => i !== idx),
    }))
  }

  // ── Registry / persistence ───────────────────────────────────────────────

  function markSaved() {
    setSavedDraft(JSON.parse(JSON.stringify(draft)))
    setHasUnsavedChanges(false)
  }

  function discardChanges() {
    setDraft(JSON.parse(JSON.stringify(savedDraft)))
    setHasUnsavedChanges(false)
  }

  return {
    draft,
    hasUnsavedChanges,
    // Event
    upEvent,
    // Portfolio
    upPortfolio, upAlloc, upImplCat, upPerf, upESG, upSFDR, upSector, upCurrency,
    // Use cases
    upScenario, upScenarioLang, upSpeaker,
    // Base override
    upBaseToggle, upBaseAlloc, upBaseImplCat,
    // Framing
    upFraming,
    // Explore
    upExploreToggle, upExploreStartFrom,
    // Comparison
    upCompLabel, upCompAlloc, upCompESG, upCompSFDR,
    upCompImplCat, toggleComparison,
    upCompSector, upCompCurrency,
    // Scenario CRUD
    addScenario, removeScenario,
    // Persistence
    markSaved, discardChanges,
  }
}
