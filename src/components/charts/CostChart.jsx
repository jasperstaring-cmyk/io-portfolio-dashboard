import { useState, useEffect } from 'react'

// Kleurlogica is statusgebaseerd — bewuste uitzondering op categorieregel:
// Groen = lage TER  < 0.25%
// Amber = midden    0.25–0.60%
// Rood  = hoge TER  > 0.60%

function terTier(ter) {
  if (ter < 0.25) return { color: '#4ED596', label: 'Low' }
  if (ter < 0.60) return { color: '#F5A623', label: 'Mid' }
  return { color: '#E01B41', label: 'High' }
}

function resolveLabel(label, lang = 'en') {
  if (!label) return ''
  if (typeof label === 'string') return label
  return label[lang] || label.en || Object.values(label)[0] || ''
}

const MAX_TER = 1.2
const PORTFOLIO_SIZE = 1_000_000

export default function CostChart({ portfolio, scenario, showComparison, lang = 'en' }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const costs        = portfolio?.costs ?? {}
  const compCosts    = showComparison ? scenario?.comparison?.costs : null
  const activeCosts  = compCosts || costs

  const baseBreakdown = costs?.breakdown || []
  const breakdown     = activeCosts?.breakdown || baseBreakdown

  const weightedTer  = activeCosts?.weightedTer ?? 0
  const baseTer      = costs?.weightedTer ?? 0
  const saving       = compCosts ? baseTer - compCosts.weightedTer : 0
  const marketAvg    = costs?.marketAvg ?? 0.68

  const tier     = terTier(weightedTer)
  const baseTier = terTier(baseTer)

  // ── Gauge SVG berekeningen ────────────────────────────────────────────
  // CY = 210 geeft de arc voldoende ruimte boven het hoogste punt (CY - R = 55)
  // zodat MKT AVG label en arc-top nooit worden afgekapt
  const CX = 200, CY = 210, R = 155

  function arcPoint(ratio, radius) {
    const r2 = radius ?? R
    const angle = Math.PI + ratio * Math.PI   // 180°→360° = links→rechts
    return {
      x: CX + r2 * Math.cos(angle),
      y: CY + r2 * Math.sin(angle),
    }
  }

  function arcPath(fromRatio, toRatio, radius) {
    const r2   = radius ?? R
    const start = arcPoint(fromRatio, r2)
    const end   = arcPoint(toRatio,   r2)
    const large = (toRatio - fromRatio) > 0.5 ? 1 : 0
    return `M ${start.x} ${start.y} A ${r2} ${r2} 0 ${large} 1 ${end.x} ${end.y}`
  }

  const gaugeRatio = Math.min(weightedTer / MAX_TER, 1)
  const baseRatio  = Math.min(baseTer     / MAX_TER, 1)
  const mktRatio   = Math.min(marketAvg   / MAX_TER, 1)

  const mktPt    = arcPoint(mktRatio)
  const needlePt = arcPoint(gaugeRatio)

  // Euro-indicatoren
  const activeEur = Math.round(weightedTer / 100 * PORTFOLIO_SIZE)
  const baseEur   = Math.round(baseTer     / 100 * PORTFOLIO_SIZE)
  const saveEur   = Math.round(Math.abs(saving) / 100 * PORTFOLIO_SIZE)

  return (
    <div style={s.wrap}>

      {/* ══════════════════════════════════════════════════════════════════
          LINKS — Gauge + KPI's + Saving card
      ══════════════════════════════════════════════════════════════════ */}
      <div style={s.leftCol}>

        <div style={s.sectionLabel}>PORTFOLIO COST (TER)</div>

        {/* ── Gauge ── */}
        <div style={s.gaugeWrap}>
          <svg
            viewBox="0 0 400 250"
            preserveAspectRatio="xMidYMid meet"
            style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}
          >

            {/* Track */}
            <path
              d={arcPath(0, 1)}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="22"
              strokeLinecap="round"
            />

            {/* Marktgemiddelde zone */}
            <path
              d={arcPath(Math.max(mktRatio - 0.015, 0), Math.min(mktRatio + 0.015, 1))}
              fill="none"
              stroke="#F5A623"
              strokeWidth="22"
              strokeLinecap="round"
              opacity="0.20"
            />

            {/* Ghost arc — base bij compare */}
            {compCosts && (
              <path
                d={arcPath(0, baseRatio)}
                fill="none"
                stroke={baseTier.color}
                strokeWidth="22"
                strokeLinecap="round"
                opacity="0.15"
              />
            )}

            {/* Actieve arc */}
            <path
              d={arcPath(0, gaugeRatio)}
              fill="none"
              stroke={tier.color}
              strokeWidth="22"
              strokeLinecap="round"
              style={{
                opacity: animated ? 0.90 : 0,
                transition: 'opacity 0.65s ease',
              }}
            />

            {/* Marktgemiddelde — dot + label */}
            <circle cx={mktPt.x} cy={mktPt.y} r={7}
              fill="#F5A623" opacity="0.85" />
            <text
              x={mktPt.x} y={mktPt.y - 15}
              textAnchor="middle"
              fill="#F5A623" fontSize="11"
              fontFamily="'Merriweather Sans', sans-serif"
              fontWeight="700" opacity="0.75"
            >MKT AVG</text>
            <text
              x={mktPt.x} y={mktPt.y - 3}
              textAnchor="middle"
              fill="#F5A623" fontSize="9"
              fontFamily="'Merriweather Sans', sans-serif"
              opacity="0.55"
            >{marketAvg.toFixed(2)}%</text>

            {/* Naald */}
            <g style={{
              opacity: animated ? 1 : 0,
              transition: 'opacity 0.55s ease 0.1s',
            }}>
              <circle cx={needlePt.x} cy={needlePt.y} r={13}
                fill={tier.color} opacity="0.12" />
              <line
                x1={CX} y1={CY}
                x2={needlePt.x} y2={needlePt.y}
                stroke={tier.color} strokeWidth="2.5"
                strokeLinecap="round" opacity="0.9"
              />
              <circle cx={CX} cy={CY} r={9}
                fill={tier.color} opacity="0.95" />
              <circle cx={CX} cy={CY} r={16}
                fill="none" stroke={tier.color}
                strokeWidth="1" opacity="0.2" />
            </g>

            {/* Schaallabels */}
            <text x="35" y={CY + 26}
              fill="rgba(255,255,255,0.28)" fontSize="11"
              fontFamily="'Merriweather Sans', sans-serif">0%</text>
            <text x="365" y={CY + 26}
              textAnchor="end"
              fill="rgba(255,255,255,0.28)" fontSize="11"
              fontFamily="'Merriweather Sans', sans-serif">1.2%</text>

            {/* TER readout */}
            <text
              x={CX} y={CY - 16}
              textAnchor="middle"
              fill={tier.color} fontSize="52"
              fontFamily="'Merriweather', serif" fontWeight="700"
              style={{ transition: 'fill 0.5s ease' }}
            >{weightedTer.toFixed(2)}%</text>
            <text
              x={CX} y={CY + 8}
              textAnchor="middle"
              fill="rgba(255,255,255,0.30)" fontSize="10"
              fontFamily="'Merriweather Sans', sans-serif"
              letterSpacing="1.5"
            >WEIGHTED AVG TER</text>

            {/* Tier badge */}
            <rect x={CX - 26} y={CY + 18} width={52} height={18}
              rx={4} fill={tier.color} opacity="0.15" />
            <text
              x={CX} y={CY + 31}
              textAnchor="middle"
              fill={tier.color} fontSize="9"
              fontFamily="'Merriweather Sans', sans-serif"
              fontWeight="800" letterSpacing="1"
            >{tier.label.toUpperCase()}</text>
          </svg>
        </div>

        {/* ── KPI's ── */}
        <div style={{
          ...s.kpiRow,
          opacity:   animated ? 1 : 0,
          transform: animated ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s',
        }}>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>Annual cost on €1M</div>
            <div style={{ ...s.kpiVal, color: tier.color, transition: 'color 0.5s ease' }}>
              ~€{activeEur.toLocaleString('nl-NL')}
            </div>
            {compCosts && (
              <div style={{ ...s.kpiSub, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
                was €{baseEur.toLocaleString('nl-NL')}
              </div>
            )}
          </div>

          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>vs Market avg ({marketAvg.toFixed(2)}%)</div>
            <div style={{
              ...s.kpiVal,
              color: weightedTer < marketAvg ? '#4ED596' : '#E01B41',
            }}>
              {weightedTer < marketAvg ? '↓' : '↑'}{' '}
              {Math.abs(weightedTer - marketAvg).toFixed(2)}%
            </div>
            <div style={s.kpiSub}>
              {weightedTer < marketAvg ? 'below average' : 'above average'}
            </div>
          </div>
        </div>

        {/* ── Saving card ── */}
        {compCosts && saving !== 0 && (
          <div style={{
            ...s.savingCard,
            borderColor: saving > 0 ? 'rgba(78,213,150,0.45)' : 'rgba(224,27,65,0.45)',
            background:  saving > 0 ? 'rgba(78,213,150,0.07)' : 'rgba(224,27,65,0.06)',
            opacity:   animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(10px)',
            transition: 'opacity 0.55s ease 0.2s, transform 0.55s ease 0.2s',
          }}>
            <div style={{ ...s.savingLabel, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
              {saving > 0 ? '↓ Annual saving' : '↑ Extra cost'}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 3 }}>
              <div style={{ ...s.savingAmount, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
                {Math.abs(saving).toFixed(2)}% p.a.
              </div>
              <div style={s.savingEur}>
                ~€{saveEur.toLocaleString('nl-NL')} per €1M
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RECHTS — Per asset class TER bars
      ══════════════════════════════════════════════════════════════════ */}
      <div style={s.rightCol}>
        <div style={s.sectionLabel}>COST BY ASSET CLASS</div>

        <div style={s.barList}>
          {breakdown.map((item, idx) => {
            const baseTerItem  = baseBreakdown[idx]?.ter ?? item.ter
            const curr         = item.ter
            const delta        = curr - baseTerItem
            const itemTier     = terTier(curr)
            const baseTierItem = terTier(baseTerItem)
            const barPct       = Math.min(curr        / MAX_TER * 100, 100)
            const basePct      = Math.min(baseTerItem / MAX_TER * 100, 100)
            const mktLinePct   = Math.min(marketAvg   / MAX_TER * 100, 100)
            const hasDelta     = showComparison && Math.abs(delta) > 0.001
            const barColor     = hasDelta
              ? (delta < 0 ? '#4ED596' : '#E01B41')
              : itemTier.color

            return (
              <div key={item.id} style={{
                ...s.barRow,
                opacity:   animated ? 1 : 0,
                transform: animated ? 'translateY(0)' : 'translateY(6px)',
                transition: `opacity 0.45s ease ${0.05 + idx * 0.06}s, transform 0.45s ease ${0.05 + idx * 0.06}s`,
              }}>
                {/* Meta */}
                <div style={s.barMeta}>
                  <div style={s.barLabelGroup}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: item.color, display: 'inline-block', flexShrink: 0,
                      boxShadow: `0 0 5px ${item.color}55`,
                    }} />
                    <span style={s.barLabel}>{resolveLabel(item.label, lang)}</span>
                    <span style={{
                      ...s.tierBadge,
                      color:       itemTier.color,
                      borderColor: `${itemTier.color}44`,
                      background:  `${itemTier.color}12`,
                    }}>{itemTier.label}</span>
                    <span style={s.weightTag}>{item.weight}%</span>
                  </div>

                  <div style={s.barValueGroup}>
                    <span style={{
                      ...s.barValue,
                      color: hasDelta
                        ? (delta < 0 ? '#4ED596' : '#E01B41')
                        : '#FFFFFF',
                      transition: 'color 0.5s ease',
                    }}>{curr.toFixed(2)}%</span>
                    {hasDelta && (
                      <span style={{
                        ...s.barDelta,
                        color:      delta < 0 ? '#4ED596' : '#E01B41',
                        background: delta < 0 ? 'rgba(78,213,150,0.10)' : 'rgba(224,27,65,0.10)',
                      }}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</span>
                    )}
                    <span style={s.contribVal}>
                      {(curr * item.weight / 100).toFixed(3)}%
                    </span>
                  </div>
                </div>

                {/* Balk */}
                <div style={s.barTrack}>
                  {/* Ghost */}
                  {hasDelta && (
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: 0,
                      borderRadius: 4,
                      background: baseTierItem.color,
                      opacity: 0.15,
                      width: `${basePct}%`,
                    }} />
                  )}
                  {/* Actief */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 0,
                    borderRadius: 4,
                    background: barColor, opacity: 0.82,
                    width: animated ? `${barPct}%` : '0%',
                    transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                  }} />
                  {/* Marktgemiddelde lijn */}
                  <div style={{
                    position: 'absolute', top: -3, bottom: -3,
                    left: `${mktLinePct}%`,
                    width: 1.5,
                    background: 'rgba(245,166,35,0.50)',
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Legenda */}
        <div style={s.legend}>
          <span style={s.legendDot('#F5A623')} />
          <span style={s.legendText}>Market avg ({marketAvg.toFixed(2)}%)</span>
          <span style={{ ...s.legendSwatch, background: '#4ED596' }} />
          <span style={s.legendText}>Low (&lt;0.25%)</span>
          <span style={{ ...s.legendSwatch, background: '#F5A623' }} />
          <span style={s.legendText}>Mid (0.25–0.60%)</span>
          <span style={{ ...s.legendSwatch, background: '#E01B41' }} />
          <span style={s.legendText}>High (&gt;0.60%)</span>
        </div>
      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
  wrap: {
    display: 'flex', flexDirection: 'row',
    width: '100%', height: '100%',
    gap: 32, alignItems: 'stretch', minHeight: 0,
  },
  leftCol: {
    width: '42%', flexShrink: 0,
    display: 'flex', flexDirection: 'column',
    gap: 10, minHeight: 0, overflow: 'visible',
  },
  gaugeWrap: {
    // Neemt beschikbare ruimte maar schaalt niet onbeperkt mee
    flex: 1, minHeight: 0, maxHeight: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'visible',
  },
  rightCol: {
    flex: 1, minWidth: 0, minHeight: 0,
    display: 'flex', flexDirection: 'column', gap: 10,
    overflow: 'hidden',
  },
  sectionLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.32)',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    flexShrink: 0,
  },
  kpiRow: { display: 'flex', gap: 10, flexShrink: 0 },
  kpiCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 2,
    flexShrink: 0,
  },
  kpiLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.32)', letterSpacing: '0.04em',
  },
  kpiVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.25rem', fontWeight: 700,
    color: '#FFFFFF', lineHeight: 1.1,
  },
  kpiSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.55rem', color: 'rgba(255,255,255,0.28)',
  },
  savingCard: {
    border: '1px solid', borderRadius: 6,
    padding: '12px 16px', flexShrink: 0,
  },
  savingLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  savingAmount: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.6rem', fontWeight: 700, lineHeight: 1,
  },
  savingEur: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', color: 'rgba(255,255,255,0.38)',
  },
  barList: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 0, minHeight: 0, justifyContent: 'space-around',
  },
  barRow: { display: 'flex', flexDirection: 'column', gap: 6 },
  barMeta: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  barLabelGroup: { display: 'flex', alignItems: 'center', gap: 7 },
  barLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255,255,255,0.82)',
  },
  tierBadge: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.5rem', fontWeight: 800,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '1px 5px', borderRadius: 3, border: '1px solid',
  },
  weightTag: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.28)',
  },
  barValueGroup: { display: 'flex', alignItems: 'center', gap: 7 },
  barValue: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', fontWeight: 700, color: '#FFFFFF',
  },
  barDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 700,
    padding: '1px 5px', borderRadius: 3,
  },
  contribVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem', fontWeight: 500,
    color: 'rgba(255,255,255,0.28)',
  },
  barTrack: {
    position: 'relative', height: 22, borderRadius: 4,
    background: 'rgba(255,255,255,0.05)', overflow: 'visible',
  },
  legend: {
    display: 'flex', alignItems: 'center',
    gap: 7, flexShrink: 0, marginTop: 2, flexWrap: 'wrap',
  },
  legendDot: (color) => ({
    display: 'inline-block', width: 8, height: 8,
    borderRadius: '50%', background: color, flexShrink: 0,
  }),
  legendSwatch: {
    display: 'inline-block', width: 18, height: 6,
    borderRadius: 2, flexShrink: 0, opacity: 0.75,
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.54rem', color: 'rgba(255,255,255,0.28)', marginRight: 3,
  },
}
