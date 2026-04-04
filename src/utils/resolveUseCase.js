/**
 * resolveUseCase.js
 * Portfolio Day Dashboard — centrale resolutiefunctie
 *
 * Produceert een volledig opgeloste state voor elke use case.
 * Charts ontvangen altijd opgeloste data — nooit ruwe config.
 *
 * Ondersteunt zowel het huidige config-formaat (v1.0) als het
 * nieuwe formaat (v1.1) zodat migratie stapsgewijs kan plaatsvinden.
 *
 * Datamodel: Portfolio Day Dashboard Datamodel v1.1
 * Investment Officer — April 2026
 */

// ─── Hulpfuncties ────────────────────────────────────────────────────────────

/**
 * Diepe kloon via JSON — veilig voor alle config-datatypen.
 */
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

/**
 * Merge twee arrays op id-veld.
 * - Items in override die een id-match hebben in base: merge velden
 * - Items in override zonder match in base: voeg toe
 * - Items in base zonder match in override: behoud ongewijzigd
 * - Items met weight: 0 in override: behoud maar markeer als hidden
 */
function mergeById(base, override) {
  if (!override?.length) return deepClone(base)
  if (!base?.length) return deepClone(override)

  const result = deepClone(base)

  for (const overrideItem of override) {
    const id = overrideItem.id
    const idx = result.findIndex(b => b.id === id)

    if (idx !== -1) {
      // Merge — scalaire velden worden overschreven, arrays recursief gemergd
      result[idx] = mergeObjects(result[idx], overrideItem)
    } else {
      // Nieuw id — toevoegen
      result.push(deepClone(overrideItem))
    }
  }

  return result
}

/**
 * Merge twee objecten. Scalaire waarden worden overschreven.
 * Arrays worden per id gemergd als ze id-velden bevatten,
 * anders volledig vervangen.
 */
function mergeObjects(base, override) {
  if (!override) return deepClone(base)
  if (!base) return deepClone(override)

  const result = deepClone(base)

  for (const key of Object.keys(override)) {
    const baseVal = result[key]
    const overVal = override[key]

    if (Array.isArray(overVal) && Array.isArray(baseVal)) {
      // Array met id-velden: per id mergen
      if (overVal.length > 0 && overVal[0].id !== undefined) {
        result[key] = mergeById(baseVal, overVal)
      } else {
        // Array zonder id-velden (bijv. sfdr zonder id): volledig vervangen
        result[key] = deepClone(overVal)
      }
    } else if (
      overVal !== null &&
      typeof overVal === 'object' &&
      !Array.isArray(overVal) &&
      baseVal !== null &&
      typeof baseVal === 'object'
    ) {
      // Nested object: recursief mergen
      result[key] = mergeObjects(baseVal, overVal)
    } else {
      // Scalair: overschrijven
      result[key] = overVal
    }
  }

  return result
}

// ─── Normalisatiefuncties ────────────────────────────────────────────────────
// Zorgen dat zowel v1.0 als v1.1 config-formaten correct werken.

/**
 * Normaliseert implementation naar het v1.1 categories-formaat.
 * v1.0: { active: 55, passive: 35, individual: 10 }
 * v1.1: { categories: [ { id, label, sub, color, weight }, ... ] }
 *
 * Standaard labels en kleuren worden gebruikt als fallback voor v1.0.
 */
const IMPL_DEFAULTS = {
  active: {
    label: { en: 'Active Management',    nl: 'Actief beheer',        fr: 'Gestion active',      de: 'Aktives Management' },
    sub:   { en: 'Alpha-seeking, manager discretion', nl: 'Actief selectieproces' },
    color: '#E01B41',
  },
  passive: {
    label: { en: 'Passive / ETF',        nl: 'Passief / ETF',        fr: 'Passif / ETF',        de: 'Passiv / ETF' },
    sub:   { en: 'Index-tracking, market beta', nl: 'Indexvolgend' },
    color: '#5B8DEF',
  },
  individual: {
    label: { en: 'Individual Securities', nl: 'Individuele effecten', fr: 'Titres individuels',  de: 'Einzeltitel' },
    sub:   { en: 'Direct stock & bond holdings', nl: 'Directe posities' },
    color: '#F5A623',
  },
}

function normalizeImplementation(impl) {
  if (!impl) return { categories: [] }

  // Al in v1.1 formaat
  if (impl.categories) return deepClone(impl)

  // v1.0 formaat — converteer naar categories
  const categories = Object.entries(impl)
    .filter(([key]) => key !== 'categories')
    .map(([id, weight]) => ({
      id,
      weight: typeof weight === 'number' ? weight : 0,
      ...(IMPL_DEFAULTS[id] || {
        label: { en: id },
        sub:   { en: '' },
        color: '#8A8A82',
      }),
    }))

  return { categories }
}

/**
 * Normaliseert een use case naar het v1.1 formaat.
 * v1.0: { comparison: {...}, scenarios: [...] }
 * v1.1: { compare: {...}, usecases: [...] }
 */
function normalizeUseCase(usecase) {
  const uc = deepClone(usecase)

  // comparison → compare
  if (uc.comparison !== undefined && uc.compare === undefined) {
    uc.compare = uc.comparison
    delete uc.comparison
  }

  // state: "base" verwijderen — overbodig
  delete uc.state

  // useEventPortfolio default: true als geen base aanwezig
  if (!uc.base) {
    uc.base = { useEventPortfolio: true }
  }

  return uc
}

/**
 * Normaliseert een event naar het v1.1 formaat.
 * v1.0: event heeft scenarios[]
 * v1.1: event heeft usecases[]
 */
function normalizeEvent(event) {
  const e = deepClone(event)

  // Normaliseer implementation in portfolio
  if (e.portfolio?.implementation) {
    e.portfolio.implementation = normalizeImplementation(e.portfolio.implementation)
  }

  return e
}

// ─── Compare scope-filtering ─────────────────────────────────────────────────

/**
 * De velden die semantisch horen bij elke dimensie.
 * Compare-data buiten deze set wordt genegeerd voor de actieve dimensie.
 */
const DIMENSION_FIELDS = {
  asset_class:    ['allocations'],
  geography:      ['allocations'],
  esg:            ['esg'],
  implementation: ['implementation'],
  performance:    ['performance'],
  sector:         ['sectors'],
  currency:       ['currencies'],
  style:          ['style'],
  cost:           ['costs'],
}

/**
 * Filtert compare-data op de velden die horen bij de actieve dimensie.
 * Data buiten scope wordt genegeerd — voorkomt onbedoelde state-lekkage.
 *
 * Uitzondering: cost-data in implementation-compare wordt altijd verwijderd
 * tenzij de actieve dimensie 'cost' is.
 */
function filterCompareToScope(compare, dimension) {
  if (!compare) return null

  const allowedFields = DIMENSION_FIELDS[dimension] || []
  const filtered = { label: compare.label }
  let hasData = false

  for (const field of allowedFields) {
    if (compare[field] !== undefined) {
      filtered[field] = compare[field]
      hasData = true
    }
  }

  // Costs altijd verwijderen tenzij dimensie 'cost' is
  if (dimension !== 'cost' && filtered.costs) {
    delete filtered.costs
  }

  return hasData ? filtered : null
}

// ─── Framing resolutie ───────────────────────────────────────────────────────

/**
 * Lost framing op voor een specifieke dimensie.
 * Mergt portfolio-level labels met use case-level framing.
 *
 * Framing is georganiseerd per dimensie-id, dan per categorie-id.
 * Alleen opgegeven velden worden overschreven.
 */
function resolveFraming(resolvedBase, framing, dimension) {
  if (!framing?.[dimension]) return null

  const dimensionFraming = framing[dimension]
  const result = {}

  for (const [categoryId, override] of Object.entries(dimensionFraming)) {
    result[categoryId] = deepClone(override)
  }

  return result
}

/**
 * Past framing toe op een categorie-object.
 * Wordt gebruikt door charts om de juiste labels te tonen.
 */
export function applyFraming(category, framing) {
  if (!framing?.[category.id]) return category

  const override = framing[category.id]
  return {
    ...category,
    ...(override.label ? { label: override.label } : {}),
    ...(override.sub   ? { sub:   override.sub   } : {}),
  }
}

// ─── Hoofdfunctie ────────────────────────────────────────────────────────────

/**
 * resolveUseCase(event, usecase, options?)
 *
 * Produceert een volledig opgeloste state voor één use case.
 *
 * @param {object} event    - Het event-object (genormaliseerd of v1.0)
 * @param {object} usecase  - De use case (genormaliseerd of v1.0)
 * @param {object} options  - Optioneel: { activeDimension }
 *
 * @returns {object} {
 *   resolvedBase,     // Volledig opgeloste portefeuille voor deze use case
 *   resolvedCompare,  // Opgeloste compare-state (of null)
 *   resolvedFraming,  // Opgeloste framing voor de actieve dimensie (of null)
 *   exploreConfig,    // Explore-configuratie (of { enabled: false })
 *   usecase,          // Genormaliseerde use case
 *   meta,             // { compareAvailable, exploreAvailable, dimension }
 * }
 */
export function resolveUseCase(event, usecase, options = {}) {
  // ── 1. Normaliseer invoer ──────────────────────────────────────────────────
  const normalizedEvent   = normalizeEvent(event)
  const normalizedUseCase = normalizeUseCase(usecase)

  const dimension = options.activeDimension || normalizedUseCase.dimension

  // ── 2. Resolve base ───────────────────────────────────────────────────────
  // Als useEventPortfolio: true → gebruik event-portfolio volledig
  // Anders → merge event-portfolio met use case base-overrides
  let resolvedBase

  if (!normalizedUseCase.base || normalizedUseCase.base.useEventPortfolio === true) {
    resolvedBase = deepClone(normalizedEvent.portfolio)
  } else {
    const baseOverride = deepClone(normalizedUseCase.base)
    delete baseOverride.useEventPortfolio

    // Normaliseer implementation in base-override als aanwezig
    if (baseOverride.implementation) {
      baseOverride.implementation = normalizeImplementation(baseOverride.implementation)
    }

    resolvedBase = mergeObjects(normalizedEvent.portfolio, baseOverride)
  }

  // Zorg dat implementation altijd in v1.1 formaat is in resolvedBase
  if (resolvedBase.implementation) {
    resolvedBase.implementation = normalizeImplementation(resolvedBase.implementation)
  }

  // ── 3. Resolve compare ────────────────────────────────────────────────────
  const rawCompare = normalizedUseCase.compare || null
  const scopedCompare = filterCompareToScope(rawCompare, dimension)

  let resolvedCompare = null

  if (scopedCompare) {
    const compareOverride = deepClone(scopedCompare)
    const label = compareOverride.label
    delete compareOverride.label

    // Normaliseer implementation in compare als aanwezig
    if (compareOverride.implementation) {
      compareOverride.implementation = normalizeImplementation(compareOverride.implementation)
    }

    resolvedCompare = {
      label,
      ...mergeObjects(resolvedBase, compareOverride),
    }
  }

  // ── 4. Resolve framing ────────────────────────────────────────────────────
  const resolvedFraming = resolveFraming(
    resolvedBase,
    normalizedUseCase.framing,
    dimension
  )

  // ── 5. Explore config ─────────────────────────────────────────────────────
  const exploreConfig = normalizedUseCase.explore?.enabled
    ? deepClone(normalizedUseCase.explore)
    : { enabled: false }

  // ── 6. Meta ───────────────────────────────────────────────────────────────
  const meta = {
    dimension,
    compareAvailable: !!resolvedCompare,
    exploreAvailable: exploreConfig.enabled,
    compareLabel: rawCompare?.label || null,
  }

  return {
    resolvedBase,
    resolvedCompare,
    resolvedFraming,
    exploreConfig,
    usecase: normalizedUseCase,
    meta,
  }
}

/**
 * resolveRegistry(registry)
 *
 * Laadt het actieve event uit de registry.
 * Ondersteunt zowel de nieuwe registry.json structuur als de
 * huidige eventConfig.json structuur (backwards compatible).
 *
 * @param {object} registry - registry.json of eventConfig.json
 * @returns {object} { event, usecases, activeEventId }
 */
export function resolveRegistry(registry) {
  // Nieuwe registry.json structuur
  if (registry.events) {
    const activeId = registry.activeEventId
    const event = registry.events.find(e => e.id === activeId)
      || registry.events[0]

    if (!event) throw new Error('resolveRegistry: geen event gevonden in registry')

    const usecases = event.usecases || event.scenarios || []

    return {
      event,
      usecases,
      activeEventId: event.id,
      allEvents: registry.events,
    }
  }

  // Huidige eventConfig.json structuur (backwards compatible)
  return {
    event: {
      ...registry.event,
      portfolio: registry.portfolio,
    },
    usecases: registry.scenarios || [],
    activeEventId: null,
    allEvents: null,
  }
}

/**
 * getLabel(i18nObj, lang)
 *
 * Hulpfunctie voor het ophalen van een gelokaliseerde string.
 * Valt terug op Engels als de gevraagde taal niet beschikbaar is.
 */
export function getLabel(i18nObj, lang = 'en') {
  if (!i18nObj) return ''
  if (typeof i18nObj === 'string') return i18nObj
  return i18nObj[lang] || i18nObj.en || Object.values(i18nObj)[0] || ''
}
