/**
 * resolveUseCase.test.js
 * Unit tests voor de centrale resolutiefunctie.
 *
 * Draai met: npm test
 *
 * Investment Officer — Portfolio Day Dashboard
 * April 2026
 */

import { describe, test, expect } from 'vitest'
import {
  resolveUseCase,
  resolveRegistry,
  getLabel,
  applyFraming,
} from './resolveUseCase.js'

// ─── Testdata ─────────────────────────────────────────────────────────────────

const BASE_PORTFOLIO = {
  name: 'Test Portfolio',
  profile: 'Balanced',
  currency: 'EUR',
  allocations: [
    { id: 'equities',     current: 48, target: 45, min: 35, max: 55, color: '#E01B41' },
    { id: 'fixed_income', current: 32, target: 35, min: 25, max: 45, color: '#4ED596' },
    { id: 'alternatives', current: 9,  target: 8,  min: 4,  max: 12, color: '#F5A623' },
    { id: 'cash',         current: 11, target: 12, min: 2,  max: 8,  color: '#8A8A82' },
  ],
  implementation: {
    categories: [
      { id: 'active',     label: { en: 'Active Management' }, sub: { en: 'Alpha-seeking' },   color: '#E01B41', weight: 55 },
      { id: 'passive',    label: { en: 'Passive / ETF'     }, sub: { en: 'Index-tracking' },  color: '#5B8DEF', weight: 35 },
      { id: 'individual', label: { en: 'Individual'        }, sub: { en: 'Direct holdings' }, color: '#F5A623', weight: 10 },
    ],
  },
  esg: {
    score: 6.8,
    maxScore: 10,
    sfdr: [
      { article: 'Article 9', weight: 22 },
      { article: 'Article 8', weight: 54 },
      { article: 'Article 6', weight: 24 },
    ],
  },
  sectors: [
    { id: 'technology', label: 'Technology', weight: 18, color: '#5B8DEF' },
    { id: 'financials', label: 'Financials', weight: 16, color: '#E01B41' },
  ],
  currencies: [
    { currency: 'EUR', weight: 52 },
    { currency: 'USD', weight: 30 },
  ],
  costs: {
    weightedTer: 0.42,
    marketAvg: 0.68,
  },
}

const BASE_EVENT = {
  id: 'test_event',
  name: 'Test Event',
  language: 'en',
  portfolio: BASE_PORTFOLIO,
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Base resolutie', () => {

  test('useEventPortfolio: true — alle allocations overgenomen', () => {
    const usecase = { id: 'test', dimension: 'asset_class', base: { useEventPortfolio: true } }
    const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedBase.allocations).toHaveLength(4)
    expect(resolvedBase.allocations[0].current).toBe(48)
    expect(resolvedBase.name).toBe('Test Portfolio')
  })

  test('geen base — impliciete erfelijkheid van event-portfolio', () => {
    const usecase = { id: 'test', dimension: 'asset_class' }
    const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedBase.allocations).toHaveLength(4)
    expect(resolvedBase.allocations[0].current).toBe(48)
  })

  test('partiële override — één allocation overschreven, rest geërfd', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      base: {
        useEventPortfolio: false,
        allocations: [{ id: 'alternatives', current: 20 }],
      },
    }
    const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedBase.allocations).toHaveLength(4)
    expect(resolvedBase.allocations.find(a => a.id === 'alternatives').current).toBe(20)
    expect(resolvedBase.allocations.find(a => a.id === 'equities').current).toBe(48)
    expect(resolvedBase.allocations.find(a => a.id === 'alternatives').color).toBe('#F5A623')
  })

  test('nieuw id toevoegen aan allocations', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      base: {
        useEventPortfolio: false,
        allocations: [{ id: 'gold', current: 8, target: 8, min: 0, max: 15, color: '#FFD700' }],
      },
    }
    const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedBase.allocations).toHaveLength(5)
    expect(resolvedBase.allocations.find(a => a.id === 'gold')).toBeDefined()
  })

  test('weight: 0 behoudt categorie (niet verwijderd)', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      base: {
        useEventPortfolio: false,
        allocations: [{ id: 'alternatives', current: 0 }],
      },
    }
    const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedBase.allocations).toHaveLength(4)
    expect(resolvedBase.allocations.find(a => a.id === 'alternatives').current).toBe(0)
  })

})

describe('Compare resolutie', () => {

  test('asset_class compare — label en overschreven waarden correct', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      compare: {
        label: { en: 'Defensive', nl: 'Defensief' },
        allocations: [
          { id: 'equities',     current: 28 },
          { id: 'fixed_income', current: 52 },
        ],
      },
    }
    const { resolvedCompare } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedCompare).not.toBeNull()
    expect(resolvedCompare.label).toEqual({ en: 'Defensive', nl: 'Defensief' })
    expect(resolvedCompare.allocations.find(a => a.id === 'equities').current).toBe(28)
    expect(resolvedCompare.allocations.find(a => a.id === 'alternatives').current).toBe(9)
  })

  test('scope-filtering — costs buiten implementation-dimensie gefilterd', () => {
    const usecase = {
      id: 'active_passive',
      dimension: 'implementation',
      compare: {
        label: { en: 'Passive equivalent' },
        implementation: { active: 5, passive: 90, individual: 5 },
        costs: { weightedTer: 0.14 },
      },
    }
    const { resolvedCompare } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedCompare).not.toBeNull()
    const costsUnchanged =
      resolvedCompare.costs === undefined ||
      resolvedCompare.costs?.weightedTer === BASE_PORTFOLIO.costs?.weightedTer
    expect(costsUnchanged).toBe(true)
  })

  test('scope-filtering — costs wél doorgelaten in cost-dimensie', () => {
    const usecase = {
      id: 'cost_test',
      dimension: 'cost',
      compare: {
        label: { en: 'Passive ETF' },
        costs: { weightedTer: 0.14 },
      },
    }
    const { resolvedCompare } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedCompare).not.toBeNull()
    expect(resolvedCompare.costs.weightedTer).toBe(0.14)
  })

  test('geen compare geconfigureerd — resolvedCompare is null', () => {
    const usecase = { id: 'test', dimension: 'asset_class' }
    const { resolvedCompare, meta } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedCompare).toBeNull()
    expect(meta.compareAvailable).toBe(false)
  })

})

describe('Framing', () => {

  test('framing resolutie — label en sub overschreven', () => {
    const usecase = {
      id: 'blokland',
      dimension: 'implementation',
      framing: {
        implementation: {
          individual: {
            label: { en: 'Illiquid / Private Markets', nl: 'Illiquide / Private Markets' },
            sub:   { en: 'Capital locked, no redemption' },
          },
        },
      },
    }
    const { resolvedFraming } = resolveUseCase(BASE_EVENT, usecase)
    expect(resolvedFraming).not.toBeNull()
    expect(resolvedFraming.individual.label.en).toBe('Illiquid / Private Markets')
    expect(resolvedFraming.individual.sub.en).toBe('Capital locked, no redemption')
  })

  test('applyFraming — label en sub overschreven, color en weight ongewijzigd', () => {
    const category = {
      id: 'individual',
      label: { en: 'Individual Securities' },
      sub:   { en: 'Direct holdings' },
      color: '#F5A623',
      weight: 10,
    }
    const framing = {
      individual: {
        label: { en: 'Illiquid / Private Markets' },
        sub:   { en: 'Capital locked' },
      },
    }
    const result = applyFraming(category, framing)
    expect(result.label.en).toBe('Illiquid / Private Markets')
    expect(result.sub.en).toBe('Capital locked')
    expect(result.color).toBe('#F5A623')
    expect(result.weight).toBe(10)
    expect(category.label.en).toBe('Individual Securities')
  })

  test('applyFraming — geen framing voor deze categorie, ongewijzigd teruggegeven', () => {
    const category = { id: 'active', label: { en: 'Active Management' }, weight: 55 }
    const framing = { individual: { label: { en: 'Illiquid' } } }
    const result = applyFraming(category, framing)
    expect(result.label.en).toBe('Active Management')
  })

})

describe('Explore config', () => {

  test('explore enabled — config en meta correct', () => {
    const usecase = {
      id: 'test',
      dimension: 'implementation',
      explore: {
        enabled: true,
        startFrom: 'base',
        dimensions: ['implementation'],
        exploreRanges: {
          implementation: {
            active:     { min: 0, max: 80 },
            individual: { min: 0, max: 60 },
          },
        },
      },
    }
    const { exploreConfig, meta } = resolveUseCase(BASE_EVENT, usecase)
    expect(exploreConfig.enabled).toBe(true)
    expect(meta.exploreAvailable).toBe(true)
    expect(exploreConfig.startFrom).toBe('base')
    expect(exploreConfig.exploreRanges.implementation.active).toEqual({ min: 0, max: 80 })
  })

  test('explore ontbreekt — disabled en exploreAvailable false', () => {
    const usecase = { id: 'test', dimension: 'asset_class' }
    const { exploreConfig, meta } = resolveUseCase(BASE_EVENT, usecase)
    expect(exploreConfig.enabled).toBe(false)
    expect(meta.exploreAvailable).toBe(false)
  })

})

describe('Backwards compatibility (v1.0)', () => {

  test('v1.0 implementation formaat genormaliseerd naar categories', () => {
    const eventV10 = {
      ...BASE_EVENT,
      portfolio: {
        ...BASE_PORTFOLIO,
        implementation: { active: 55, passive: 35, individual: 10 },
      },
    }
    const usecase = {
      id: 'test',
      dimension: 'implementation',
      comparison: {
        label: { en: 'Passive equivalent' },
        implementation: { active: 5, passive: 90, individual: 5 },
      },
    }
    const { resolvedBase, resolvedCompare } = resolveUseCase(eventV10, usecase)
    expect(resolvedBase.implementation.categories).toBeDefined()
    expect(resolvedBase.implementation.categories).toHaveLength(3)
    expect(resolvedBase.implementation.categories.find(c => c.id === 'active').weight).toBe(55)
    expect(resolvedCompare).not.toBeNull()
    expect(resolvedCompare.implementation.categories.find(c => c.id === 'passive').weight).toBe(90)
  })

})

describe('resolveRegistry', () => {

  test('legacy eventConfig.json structuur', () => {
    const legacyConfig = {
      event: { name: 'Portfolio Day 2026', language: 'en' },
      portfolio: BASE_PORTFOLIO,
      scenarios: [
        { id: 'opening', dimension: 'asset_class', policyQuestion: { en: 'Test?' } },
      ],
    }
    const { event, usecases } = resolveRegistry(legacyConfig)
    expect(event.name).toBe('Portfolio Day 2026')
    expect(usecases).toHaveLength(1)
    expect(usecases[0].id).toBe('opening')
  })

  test('nieuwe registry.json structuur — actief event correct geselecteerd', () => {
    const registry = {
      schemaVersion: '1.1',
      activeEventId: 'event_2026',
      events: [
        { id: 'event_2025', name: 'Portfolio Day 2025', portfolio: BASE_PORTFOLIO, usecases: [] },
        { id: 'event_2026', name: 'Portfolio Day 2026', portfolio: BASE_PORTFOLIO, usecases: [
          { id: 'opening', dimension: 'asset_class' },
        ]},
      ],
    }
    const { event, usecases, allEvents } = resolveRegistry(registry)
    expect(event.id).toBe('event_2026')
    expect(event.name).toBe('Portfolio Day 2026')
    expect(usecases).toHaveLength(1)
    expect(allEvents).toHaveLength(2)
  })

})

describe('getLabel', () => {

  test('NL label correct', () => {
    expect(getLabel({ en: 'Equities', nl: 'Aandelen' }, 'nl')).toBe('Aandelen')
  })

  test('fallback naar EN als gevraagde taal ontbreekt', () => {
    expect(getLabel({ en: 'Equities', nl: 'Aandelen' }, 'de')).toBe('Equities')
  })

  test('directe string wordt ongewijzigd teruggegeven', () => {
    expect(getLabel('Direct string', 'en')).toBe('Direct string')
  })

  test('null geeft lege string', () => {
    expect(getLabel(null, 'en')).toBe('')
  })

})

describe('Meta-object', () => {

  test('compareAvailable en exploreAvailable correct gevuld', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      compare: {
        label: { en: 'Test compare' },
        allocations: [{ id: 'equities', current: 30 }],
      },
      explore: { enabled: true, startFrom: 'compare', dimensions: ['asset_class'] },
    }
    const { meta } = resolveUseCase(BASE_EVENT, usecase)
    expect(meta.dimension).toBe('asset_class')
    expect(meta.compareAvailable).toBe(true)
    expect(meta.exploreAvailable).toBe(true)
    expect(meta.compareLabel).toEqual({ en: 'Test compare' })
  })

})

describe('Immutabiliteit', () => {

  test('event-portfolio niet gemuteerd door resolveUseCase', () => {
    const usecase = {
      id: 'test',
      dimension: 'asset_class',
      base: {
        useEventPortfolio: false,
        allocations: [{ id: 'equities', current: 10 }],
      },
    }
    const originalCurrent = BASE_EVENT.portfolio.allocations[0].current
    resolveUseCase(BASE_EVENT, usecase)
    expect(BASE_EVENT.portfolio.allocations[0].current).toBe(originalCurrent)
  })

})
