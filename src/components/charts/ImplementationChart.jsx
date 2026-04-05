import { T } from './chartTokens'
import { useState, useEffect, useRef } from 'react'
import ExploreTotalBadge from './ExploreTotalBadge'

// ImplementationChart — v1.1
// Leest implementation.categories[] uit de portfolio (v1.1 formaat).
// Kleurlogica:
// Groen (#4ED596) = stijging (delta > 0)
// Rood  (#E01B41) = daling  (delta < 0)
// Categoriekleuren komen uit de config — geen statusoordeel

const PORTFOLIO_SIZE = 1_000_000

const MIN_PCT_FOR_SUBLABEL  = 18
const MIN_PCT_FOR_NAMELABEL = 10

const FALLBACK_COLORS = {
  active:     '#E01B41',
  passive:    '#5B8DEF',
  individual: '#F5A623',
}

function getCategories(implementation) {
  if (!implementation) return []
  if (Array.isArray(implementation.categories)) return implementation.categories
  const LEGACY_LABELS = {
    active:     { label: { en: 'Active Management'    }, sub: { en: 'Alpha-seeking, manager discretion' }, color: '#E01B41' },
    passive:    { label: { en: 'Passive / ETF'         }, sub: { en: 'Index-tracking, market beta'       }, color: '#5B8DEF' },
    individual: { label: { en: 'Individual Securities' }, sub: { en: 'Direct stock & bond holdings'      }, color: '#F5A623' },
  }
  return Object.entries(implementation)
    .filter(([key]) => typeof implementation[key] === 'number')
    .map(([id, weight]) => ({
      id, weight,
      ...(LEGACY_LABELS[id] || { label: { en: id }, sub: { en: '' }, color: '#8A8A82' }),
    }))
}

function getLabel(val, lang = 'en') {
  if (!val) return ''
  if (typeof val === 'string') return val
  return val[lang] || val.en || Object.values(val)[0] || ''
}

export default function ImplementationChart({ portfolio, comparisonPortfolio, showComparison, framing, lang = 'en', exploreMode = false }) {
  const [animated, setAnimated] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const prevCompare = useRef(showComparison)

  useEffect(() => {
    setAnimated(false)
    if (prevCompare.current !== showComparison) {
      prevCompare.current = showComparison
      setSelectedId(null)
    }
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const baseCategories = getCategories(portfolio.implementation)
  const compImpl = showComparison ? comparisonPortfolio?.implementation : null
  const compCategories = compImpl ? getCategories(compImpl) : null

  const baseTotal = baseCategories.reduce((s, c) => s + (c.weight || 0), 0) || 100

  const segments = baseCategories.map(cat => {
    const compCat = compCategories?.find(c => c.id === cat.id)
    const compWeight = compCat?.weight ?? cat.weight
    const activeWeight = showComparison ? compWeight : cat.weight
    const compTotal = compCategories
      ? compCategories.reduce((s, c) => s + (c.weight || 0), 0) || 100
      : baseTotal

    const catFraming = framing?.[cat.id]
    const labelVal = catFraming?.label ?? cat.label
    const subVal   = catFraming?.sub   ?? cat.sub

    return {
      id:       cat.id,
      label:    getLabel(labelVal, lang),
      sub:      getLabel(subVal,   lang),
      color:    cat.color || FALLBACK_COLORS[cat.id] || '#8A8A82',
      baseVal:  Math.round((cat.weight / baseTotal) * 100),
      val:      Math.round((activeWeight / compTotal) * 100),
      rawVal:   activeWeight,
      delta:    showComparison ? compWeight - cat.weight : 0,
    }
  })

  const rawSum = baseCategories.reduce((s, c) => s + (c.weight || 0), 0)
  const hasSelection = !!selectedId

  function handleSegmentClick(id) {
    setSelectedId(prev => prev === id ? null : id)
  }
  const gapPct = Math.max(0, 100 - rawSum)
  const showGap = gapPct > 0 && gapPct < 100 && !showComparison

  if (!showGap) {
    const scaledTotal = segments.reduce((a, s) => a + s.val, 0)
    if (scaledTotal !== 100 && segments.length > 0) {
      segments[0].val += 100 - scaledTotal
    }
  }

  return (
    <div style={{ ...s.wrap, position: 'relative' }}>
      <ExploreTotalBadge total={rawSum} label="Implementation" exploreMode={exploreMode} />

      {/* Sublabel */}
      <div style={s.sublabel}>
        PORTFOLIO CONSTRUCTION
        {hasSelection && (
          <span style={{marginLeft:10, fontSize: T.micro, color: T.faint, fontWeight:600, letterSpacing:'0.06em'}}>
            CLICK AGAIN TO CLOSE
          </span>
        )}
      </div>

      {/* Segment-labels boven de balk */}
      <div style={{
        ...s.labelsRow,
        opacity:   animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 0.5s ease 0.05s, transform 0.5s ease 0.05s',
      }}>
        {segments.map((seg, i) => {
          const hasChange  = showComparison && seg.delta !== 0
          const isSelected = selectedId === seg.id
          const isDimmed   = hasSelection && !isSelected
          const showName   = seg.val >= MIN_PCT_FOR_NAMELABEL
          const showSub    = seg.val >= MIN_PCT_FOR_SUBLABEL

          return (
            <div key={seg.id}
              onClick={() => handleSegmentClick(seg.id)}
              style={{
                ...s.labelCol,
                width: `${seg.val}%`,
                transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
                paddingRight: i < segments.length - 1 ? 14 : 0,
                opacity: isDimmed ? 0.32 : 1,
                cursor: 'pointer',
              }}>
              <div style={{
                ...s.labelPct,
                color: hasChange
                  ? seg.delta < 0 ? '#E01B41' : '#4ED596'
                  : seg.color,
                transition: 'color 0.5s ease',
              }}>
                {seg.rawVal}%
              </div>
              {showName && <div style={s.labelName}>{seg.label}</div>}
              {(showSub || isSelected) && seg.sub && (
                <div style={{
                  ...s.labelSub,
                  color: isSelected ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.32)',
                  transition: 'color 0.3s ease',
                  whiteSpace: isSelected ? 'normal' : 'nowrap',
                }}>
                  {seg.sub}
                </div>
              )}
              {hasChange && (
                <div style={{
                  ...s.labelDelta,
                  color: seg.delta < 0 ? '#E01B41' : '#4ED596',
                }}>
                  {seg.delta > 0 ? '+' : ''}{seg.delta}%
                </div>
              )}
            </div>
          )
        })}

        {/* Gap label — alleen in explore mode */}
        {showGap && (
          <div style={{
            ...s.labelCol,
            width: `${gapPct}%`,
            transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
            paddingLeft: 14,
          }}>
            <div style={{ ...s.labelPct, color: 'rgba(255,255,255,0.22)' }}>
              {Math.round(gapPct)}%
            </div>
            <div style={{ ...s.labelName, color: 'rgba(255,255,255,0.22)' }}>
              Unallocated
            </div>
          </div>
        )}
      </div>

      {/* Balk */}
      <div style={s.trackWrap}>

        {/* Ghost — base bij compare */}
        {showComparison && (
          <div style={s.ghostTrack}>
            {segments.map(seg => (
              <div key={seg.id} style={{
                width: `${seg.baseVal}%`,
                background: seg.color,
                transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
              }} />
            ))}
          </div>
        )}

        {/* Actieve balk */}
        <div style={s.activeTrack}>
          {segments.map(seg => {
            const hasChange  = showComparison && seg.delta !== 0
            const isSelected = selectedId === seg.id
            const isDimmed   = hasSelection && !isSelected
            const barColor   = hasChange
              ? (seg.delta < 0 ? '#E01B41' : '#4ED596')
              : seg.color

            return (
              <div
                key={seg.id}
                onClick={() => handleSegmentClick(seg.id)}
                style={{
                  width: `${seg.val}%`,
                  background: barColor,
                  opacity: isDimmed ? 0.35 : showComparison ? 0.82 : 0.88,
                  transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease, background 0.5s ease',
                  cursor: 'pointer',
                  outline: selectedId === seg.id ? `2px solid ${seg.color}` : 'none',
                  outlineOffset: -2,
                }} />
            )
          })}

          {/* Gap segment — lichtgrijs, gestreept, alleen in explore */}
          {showGap && (
            <div style={{
              width: `${gapPct}%`,
              background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, rgba(255,255,255,0.09) 4px, rgba(255,255,255,0.09) 8px)',
              borderLeft: '2px solid rgba(255,255,255,0.10)',
              transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {gapPct >= 8 && (
                <span style={{
                  fontFamily: "'Merriweather Sans', sans-serif",
                  fontSize: T.small, fontWeight: T.wMedium,
                  color: T.faint,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}>
                  ← adjust sliders
                </span>
              )}
            </div>
          )}
        </div>
      </div>

    </div>
  )
}

const s = {
  wrap: {
    display: 'flex', flexDirection: 'column',
    height: '100%', width: '100%',
    justifyContent: 'center',
    paddingTop: 8, paddingBottom: 8,
  },
  sublabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.micro, fontWeight: T.wMicro,
    color: T.faint, letterSpacing: '0.1em',
    marginBottom: 18,
  },
  labelsRow: {
    display: 'flex', width: '100%',
    marginBottom: 10, alignItems: 'flex-end',
  },
  labelCol: {
    overflow: 'hidden', flexShrink: 0,
    display: 'flex', flexDirection: 'column', gap: 2,
    minWidth: 0,
  },
  labelPct: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.display, fontWeight: T.wHeavy, lineHeight: 1,
  },
  labelName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.body, fontWeight: T.wBody,
    color: 'rgba(255,255,255,0.72)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  labelSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.small, fontWeight: 400,
    color: 'rgba(255,255,255,0.32)',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
  },
  labelDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: T.body, fontWeight: T.wHeavy,
    marginTop: 2,
  },
  trackWrap: {
    width: '100%', borderRadius: 10,
    overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.25)',
    marginBottom: 14,
  },
  ghostTrack: {
    display: 'flex', height: 5,
    opacity: 0.38,
  },
  activeTrack: {
    display: 'flex', height: 72,
  },
}
