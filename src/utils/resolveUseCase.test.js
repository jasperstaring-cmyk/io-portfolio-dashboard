/**
 * resolveUseCase.test.js
 * Unit tests voor de centrale resolutiefunctie.
 *
 * Draai met: node resolveUseCase.test.js
 * Geen testframework nodig — puur Node.js.
 *
 * Investment Officer — Portfolio Day Dashboard
 * April 2026
 */

// ─── Inline import (voor Node zonder bundler) ─────────────────────────────────
// Kopieer de inhoud van resolveUseCase.js hier, of gebruik:
// import { resolveUseCase, resolveRegistry, getLabel, applyFraming } from './resolveUseCase.js'
//
// Voor StackBlitz: plaats resolveUseCase.js in src/utils/ en importeer vanaf daar.

import {
  resolveUseCase,
  resolveRegistry,
  getLabel,
  applyFraming,
} from './resolveUseCase.js'

// ─── Testinfrastructuur ───────────────────────────────────────────────────────

let passed = 0
let failed = 0
const errors = []

function assert(condition, label) {
  if (condition) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.log(`  ✗ ${label}`)
    failed++
    errors.push(label)
  }
}

function assertEqual(actual, expected, label) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (ok) {
    console.log(`  ✓ ${label}`)
    passed++
  } else {
    console.log(`  ✗ ${label}`)
    console.log(`    Verwacht: ${JSON.stringify(expected)}`)
    console.log(`    Gekregen: ${JSON.stringify(actual)}`)
    failed++
    errors.push(label)
  }
}

function section(title) {
  console.log(`\n── ${title} ──`)
}

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
      { id: 'active',     label: { en: 'Active Management' }, sub: { en: 'Alpha-seeking' }, color: '#E01B41', weight: 55 },
      { id: 'passive',    label: { en: 'Passive / ETF'     }, sub: { en: 'Index-tracking' }, color: '#5B8DEF', weight: 35 },
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

section('1. Base resolutie — useEventPortfolio: true')

{
  const usecase = {
    id: 'test',
    dimension: 'asset_class',
    base: { useEventPortfolio: true },
  }
  const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedBase.allocations.length === 4, 'Alle allocations overgenomen van event-portfolio')
  assert(resolvedBase.allocations[0].current === 48, 'Equities current correct')
  assertEqual(resolvedBase.name, 'Test Portfolio', 'Portfolio naam correct')
}

section('2. Base resolutie — geen base (impliciete erfelijkheid)')

{
  const usecase = { id: 'test', dimension: 'asset_class' }
  const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedBase.allocations.length === 4, 'Alle allocations aanwezig')
  assert(resolvedBase.allocations[0].current === 48, 'Equities current correct')
}

section('3. Base resolutie — partiële override')

{
  const usecase = {
    id: 'test',
    dimension: 'asset_class',
    base: {
      useEventPortfolio: false,
      allocations: [
        { id: 'alternatives', current: 20 },
      ],
    },
  }
  const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedBase.allocations.length === 4, 'Alle vier allocations aanwezig')
  assertEqual(
    resolvedBase.allocations.find(a => a.id === 'alternatives').current,
    20,
    'Alternatives current overschreven naar 20'
  )
  assertEqual(
    resolvedBase.allocations.find(a => a.id === 'equities').current,
    48,
    'Equities current ongewijzigd gebleven'
  )
  assertEqual(
    resolvedBase.allocations.find(a => a.id === 'alternatives').color,
    '#F5A623',
    'Alternatives color geërfd van event-portfolio'
  )
}

section('4. Base resolutie — nieuw id toevoegen')

{
  const usecase = {
    id: 'test',
    dimension: 'asset_class',
    base: {
      useEventPortfolio: false,
      allocations: [
        { id: 'gold', current: 8, target: 8, min: 0, max: 15, color: '#FFD700' },
      ],
    },
  }
  const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedBase.allocations.length === 5, 'Vijf allocations — gold toegevoegd')
  assert(
    resolvedBase.allocations.find(a => a.id === 'gold') !== undefined,
    'Gold aanwezig in opgeloste base'
  )
}

section('5. Base resolutie — weight: 0 behoudt categorie')

{
  const usecase = {
    id: 'test',
    dimension: 'asset_class',
    base: {
      useEventPortfolio: false,
      allocations: [
        { id: 'alternatives', current: 0 },
      ],
    },
  }
  const { resolvedBase } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedBase.allocations.length === 4, 'Alle vier allocations aanwezig (geen verwijdering)')
  assertEqual(
    resolvedBase.allocations.find(a => a.id === 'alternatives').current,
    0,
    'Alternatives current is 0 — verborgen maar aanwezig'
  )
}

section('6. Compare resolutie — asset_class')

{
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

  assert(resolvedCompare !== null, 'Compare aanwezig')
  assertEqual(resolvedCompare.label, { en: 'Defensive', nl: 'Defensief' }, 'Label correct')
  assertEqual(
    resolvedCompare.allocations.find(a => a.id === 'equities').current,
    28,
    'Equities current in compare correct'
  )
  assertEqual(
    resolvedCompare.allocations.find(a => a.id === 'alternatives').current,
    9,
    'Alternatives current geërfd van resolvedBase in compare'
  )
}

section('7. Compare scope-filtering — costs buiten implementation-dimensie')

{
  const usecase = {
    id: 'active_passive',
    dimension: 'implementation',
    compare: {
      label: { en: 'Passive equivalent' },
      implementation: { active: 5, passive: 90, individual: 5 },
      costs: { weightedTer: 0.14 }, // moet worden gefilterd
    },
  }
  const { resolvedCompare } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedCompare !== null, 'Compare aanwezig')
  assert(
    resolvedCompare.costs === undefined || resolvedCompare.costs?.weightedTer === BASE_PORTFOLIO.costs?.weightedTer,
    'Costs uit implementation-compare gefilterd of niet overschreven'
  )
}

section('8. Compare scope-filtering — costs wél in cost-dimensie')

{
  const usecase = {
    id: 'cost_test',
    dimension: 'cost',
    compare: {
      label: { en: 'Passive ETF' },
      costs: { weightedTer: 0.14 },
    },
  }
  const { resolvedCompare } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedCompare !== null, 'Compare aanwezig')
  assertEqual(resolvedCompare.costs.weightedTer, 0.14, 'Costs.weightedTer correct in cost-dimensie')
}

section('9. Compare — null als geen compare aanwezig')

{
  const usecase = { id: 'test', dimension: 'asset_class' }
  const { resolvedCompare, meta } = resolveUseCase(BASE_EVENT, usecase)

  assert(resolvedCompare === null, 'resolvedCompare is null')
  assert(meta.compareAvailable === false, 'compareAvailable is false')
}

section('10. Framing resolutie')

{
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

  assert(resolvedFraming !== null, 'Framing aanwezig')
  assertEqual(
    resolvedFraming.individual.label.en,
    'Illiquid / Private Markets',
    'Framing label correct'
  )
  assertEqual(
    resolvedFraming.individual.sub.en,
    'Capital locked, no redemption',
    'Framing sub correct'
  )
}

section('11. applyFraming hulpfunctie')

{
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

  assertEqual(result.label.en, 'Illiquid / Private Markets', 'Label overschreven door framing')
  assertEqual(result.sub.en, 'Capital locked', 'Sub overschreven door framing')
  assertEqual(result.color, '#F5A623', 'Color ongewijzigd — niet in framing')
  assertEqual(result.weight, 10, 'Weight ongewijzigd')

  // Originele categorie niet gemuteerd
  assertEqual(category.label.en, 'Individual Securities', 'Originele categorie niet gemuteerd')
}

section('12. applyFraming — geen framing voor deze categorie')

{
  const category = { id: 'active', label: { en: 'Active Management' }, weight: 55 }
  const framing = { individual: { label: { en: 'Illiquid' } } }

  const result = applyFraming(category, framing)
  assertEqual(result.label.en, 'Active Management', 'Active label ongewijzigd als niet in framing')
}

section('13. Explore config')

{
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

  assert(exploreConfig.enabled === true, 'Explore enabled')
  assert(meta.exploreAvailable === true, 'exploreAvailable correct')
  assertEqual(exploreConfig.startFrom, 'base', 'startFrom correct')
  assertEqual(
    exploreConfig.exploreRanges.implementation.active,
    { min: 0, max: 80 },
    'exploreRanges correct'
  )
}

section('14. Explore — niet beschikbaar als explore ontbreekt')

{
  const usecase = { id: 'test', dimension: 'asset_class' }
  const { exploreConfig, meta } = resolveUseCase(BASE_EVENT, usecase)

  assert(exploreConfig.enabled === false, 'Explore disabled als niet geconfigureerd')
  assert(meta.exploreAvailable === false, 'exploreAvailable false')
}

section('15. v1.0 implementation formaat — backwards compatibility')

{
  const eventV10 = {
    ...BASE_EVENT,
    portfolio: {
      ...BASE_PORTFOLIO,
      implementation: { active: 55, passive: 35, individual: 10 }, // v1.0 formaat
    },
  }
  const usecase = {
    id: 'test',
    dimension: 'implementation',
    comparison: { // v1.0 sleutel
      label: { en: 'Passive equivalent' },
      implementation: { active: 5, passive: 90, individual: 5 },
    },
  }
  const { resolvedBase, resolvedCompare } = resolveUseCase(eventV10, usecase)

  assert(resolvedBase.implementation.categories !== undefined, 'v1.0 implementation genormaliseerd naar categories')
  assert(resolvedBase.implementation.categories.length === 3, 'Drie categorieën aanwezig')
  assertEqual(
    resolvedBase.implementation.categories.find(c => c.id === 'active').weight,
    55,
    'Active weight correct na normalisatie'
  )
  assert(resolvedCompare !== null, 'Compare aanwezig (via v1.0 comparison sleutel)')
  assertEqual(
    resolvedCompare.implementation.categories.find(c => c.id === 'passive').weight,
    90,
    'Passive weight correct in compare na normalisatie'
  )
}

section('16. resolveRegistry — huidige eventConfig.json structuur')

{
  const legacyConfig = {
    event: { name: 'Portfolio Day 2026', language: 'en' },
    portfolio: BASE_PORTFOLIO,
    scenarios: [
      { id: 'opening', dimension: 'asset_class', policyQuestion: { en: 'Test?' } },
    ],
  }
  const { event, usecases } = resolveRegistry(legacyConfig)

  assertEqual(event.name, 'Portfolio Day 2026', 'Event naam correct')
  assert(usecases.length === 1, 'Één use case geladen')
  assertEqual(usecases[0].id, 'opening', 'Use case id correct')
}

section('17. resolveRegistry — nieuwe registry structuur')

{
  const registry = {
    schemaVersion: '1.1',
    activeEventId: 'event_2026',
    events: [
      {
        id: 'event_2025',
        name: 'Portfolio Day 2025',
        portfolio: BASE_PORTFOLIO,
        usecases: [],
      },
      {
        id: 'event_2026',
        name: 'Portfolio Day 2026',
        portfolio: BASE_PORTFOLIO,
        usecases: [
          { id: 'opening', dimension: 'asset_class' },
        ],
      },
    ],
  }
  const { event, usecases, allEvents } = resolveRegistry(registry)

  assertEqual(event.id, 'event_2026', 'Actief event correct geselecteerd')
  assertEqual(event.name, 'Portfolio Day 2026', 'Event naam correct')
  assert(usecases.length === 1, 'Use cases van actief event geladen')
  assert(allEvents.length === 2, 'Alle events beschikbaar')
}

section('18. getLabel hulpfunctie')

{
  assertEqual(getLabel({ en: 'Equities', nl: 'Aandelen' }, 'nl'), 'Aandelen', 'NL label correct')
  assertEqual(getLabel({ en: 'Equities', nl: 'Aandelen' }, 'de'), 'Equities', 'Fallback naar EN als DE ontbreekt')
  assertEqual(getLabel('Direct string', 'en'), 'Direct string', 'Directe string correct')
  assertEqual(getLabel(null, 'en'), '', 'Null geeft lege string')
}

section('19. Meta-object')

{
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

  assertEqual(meta.dimension, 'asset_class', 'Dimensie correct')
  assert(meta.compareAvailable === true, 'compareAvailable correct')
  assert(meta.exploreAvailable === true, 'exploreAvailable correct')
  assertEqual(meta.compareLabel, { en: 'Test compare' }, 'compareLabel correct')
}

section('20. Immutabiliteit — originelen niet gemuteerd')

{
  const usecase = {
    id: 'test',
    dimension: 'asset_class',
    base: {
      useEventPortfolio: false,
      allocations: [{ id: 'equities', current: 10 }],
    },
  }
  const originalEquitiesCurrent = BASE_EVENT.portfolio.allocations[0].current

  resolveUseCase(BASE_EVENT, usecase)

  assertEqual(
    BASE_EVENT.portfolio.allocations[0].current,
    originalEquitiesCurrent,
    'Event-portfolio niet gemuteerd door resolveUseCase'
  )
}

// ─── Samenvatting ─────────────────────────────────────────────────────────────

console.log('\n' + '═'.repeat(50))
console.log(`Resultaat: ${passed} geslaagd, ${failed} mislukt`)

if (errors.length > 0) {
  console.log('\nMislukte tests:')
  errors.forEach(e => console.log(`  ✗ ${e}`))
  process.exit(1)
} else {
  console.log('Alle tests geslaagd ✓')
  process.exit(0)
}
