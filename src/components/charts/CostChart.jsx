import { useState, useEffect } from 'react'

// Colour-tier thresholds for TER (%)
function terTier(ter) {
  if (ter < 0.25) return { color: '#4ED596', label: 'Low' }
  if (ter < 0.60) return { color: '#F5A623', label: 'Mid' }
  return { color: '#E01B41', label: 'High' }
}

export default function CostChart({ portfolio, scenario, showComparison }) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    setAnimated(false)
    const t = setTimeout(() => setAnimated(true), 60)
    return () => clearTimeout(t)
  }, [showComparison])

  const costs = portfolio.costs
  const compCosts = showComparison ? scenario?.comparison?.costs : null
  const activeCosts = compCosts || costs

  // Per-asset-class TER breakdown (from costs.breakdown or synthesised from portfolio)
  const breakdown = activeCosts?.breakdown || costs?.breakdown || []
  const compBreakdown = compCosts?.breakdown || null
  const baseBreakdown = costs?.breakdown || []

  const weightedTer = activeCosts?.weightedTer ?? costs?.weightedTer ?? 0
  const baseTer = costs?.weightedTer ?? 0
  const saving = compCosts ? baseTer - compCosts.weightedTer : 0

  // Market benchmark reference
  const marketAvg = costs?.marketAvg ?? 0.68

  // Scale: max bar = 1.2% TER
  const MAX_TER = 1.2

  return (
    <div style={s.wrap}>

      {/* ── LEFT: KPI hero + gauge ── */}
      <div style={s.leftCol}>
        <div style={s.sectionLabel}>PORTFOLIO COST (TER)</div>

        {/* Radial gauge SVG */}
        <div style={s.gaugeSvgWrap}>
          <svg viewBox="0 0 260 180" preserveAspectRatio="xMidYMid meet" style={s.gaugeSvg}>
            {/* Track arc — 180° semicircle */}
            <path
              d="M 30 150 A 100 100 0 0 1 230 150"
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Market avg marker */}
            {(() => {
              const ratio = Math.min(marketAvg / MAX_TER, 1)
              const angle = -180 + ratio * 180  // -180° to 0°
              const rad = (angle * Math.PI) / 180
              const cx = 130, cy = 150, r = 100
              const x = cx + r * Math.cos(rad)
              const y = cy + r * Math.sin(rad)
              return (
                <g>
                  <circle cx={x} cy={y} r={5} fill="#F5A623" opacity={0.7} />
                  <text
                    x={x} y={y - 10}
                    textAnchor="middle"
                    fill="#F5A623"
                    fontSize="8"
                    fontFamily="'Merriweather Sans', sans-serif"
                    fontWeight="700"
                    opacity={0.8}
                  >MKT AVG</text>
                </g>
              )
            })()}
            {/* Filled arc — current TER */}
            {(() => {
              const ratio = Math.min(weightedTer / MAX_TER, 1)
              // arc from 30,150 (leftmost) sweeping ratio*180°
              const cx = 130, cy = 150, r = 100
              const startAngle = -180
              const endAngle = -180 + ratio * 180
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180
              const x1 = cx + r * Math.cos(startRad)
              const y1 = cy + r * Math.sin(startRad)
              const x2 = cx + r * Math.cos(endRad)
              const y2 = cy + r * Math.sin(endRad)
              const largeArc = ratio > 0.5 ? 1 : 0
              const tier = terTier(weightedTer)
              return (
                <path
                  d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
                  fill="none"
                  stroke={tier.color}
                  strokeWidth="18"
                  strokeLinecap="round"
                  style={{
                    opacity: animated ? 1 : 0,
                    transition: 'opacity 0.6s ease',
                  }}
                />
              )
            })()}
            {/* Needle */}
            {(() => {
              const ratio = Math.min(weightedTer / MAX_TER, 1)
              const cx = 130, cy = 150
              const angle = -180 + ratio * 180
              const rad = (angle * Math.PI) / 180
              const r = 100
              const nx = cx + r * Math.cos(rad)
              const ny = cy + r * Math.sin(rad)
              const tier = terTier(weightedTer)
              return (
                <g style={{
                  opacity: animated ? 1 : 0,
                  transition: 'opacity 0.55s ease 0.1s',
                }}>
                  <line x1={cx} y1={cy} x2={nx} y2={ny}
                    stroke={tier.color} strokeWidth="2.5" strokeLinecap="round" opacity={0.85} />
                  <circle cx={cx} cy={cy} r={6} fill={tier.color} opacity={0.9} />
                </g>
              )
            })()}
            {/* Scale labels */}
            <text x="24" y="165" fill="rgba(255,255,255,0.3)" fontSize="9"
              fontFamily="'Merriweather Sans', sans-serif">0%</text>
            <text x="218" y="165" fill="rgba(255,255,255,0.3)" fontSize="9"
              fontFamily="'Merriweather Sans', sans-serif">1.2%</text>
            <text x="118" y="110" fill="rgba(255,255,255,0.2)" fontSize="8"
              fontFamily="'Merriweather Sans', sans-serif">0.6%</text>

            {/* Centre TER readout */}
            <text x="130" y="148"
              textAnchor="middle"
              fill={terTier(weightedTer).color}
              fontSize="32"
              fontFamily="'Merriweather', serif"
              fontWeight="700"
              style={{ transition: 'fill 0.5s ease' }}
            >
              {weightedTer.toFixed(2)}%
            </text>
            <text x="130" y="164"
              textAnchor="middle"
              fill="rgba(255,255,255,0.4)"
              fontSize="9"
              fontFamily="'Merriweather Sans', sans-serif"
              letterSpacing="1"
            >
              WEIGHTED AVG TER
            </text>
          </svg>
        </div>

        {/* KPI cards row */}
        <div style={s.kpiRow}>
          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>On €1M portfolio</div>
            <div style={{
              ...s.kpiVal,
              color: terTier(weightedTer).color,
              transition: 'color 0.5s ease',
            }}>
              ~€{Math.round(weightedTer / 100 * 1_000_000).toLocaleString('nl-NL')}
            </div>
            <div style={s.kpiSub}>per year</div>
          </div>

          <div style={s.kpiCard}>
            <div style={s.kpiLabel}>vs Market avg ({marketAvg.toFixed(2)}%)</div>
            <div style={{
              ...s.kpiVal,
              color: weightedTer < marketAvg ? '#4ED596' : '#E01B41',
            }}>
              {weightedTer < marketAvg ? '↓' : '↑'} {Math.abs(weightedTer - marketAvg).toFixed(2)}%
            </div>
            <div style={s.kpiSub}>{weightedTer < marketAvg ? 'below average' : 'above average'}</div>
          </div>
        </div>

        {/* Comparison saving/cost card */}
        {compCosts && saving !== 0 && (
          <div style={{
            ...s.savingCard,
            borderColor: saving > 0 ? 'rgba(78,213,150,0.4)' : 'rgba(224,27,65,0.4)',
            background: saving > 0 ? 'rgba(78,213,150,0.07)' : 'rgba(224,27,65,0.06)',
            opacity: animated ? 1 : 0,
            transform: animated ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.55s ease, transform 0.55s ease, border-color 0.4s ease, background 0.4s ease',
          }}>
            <span style={{ ...s.savingLabel, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
              {saving > 0 ? '↓ Annual saving' : '↑ Extra cost'}
            </span>
            <span style={{ ...s.savingAmount, color: saving > 0 ? '#4ED596' : '#E01B41' }}>
              {Math.abs(saving).toFixed(2)}% p.a.
            </span>
            <span style={s.savingEur}>
              ~€{Math.abs(Math.round(saving / 100 * 1_000_000)).toLocaleString('nl-NL')} per €1M
            </span>
          </div>
        )}
      </div>

      {/* ── RIGHT: Per-asset-class TER bars ── */}
      <div style={s.rightCol}>
        <div style={s.sectionLabel}>COST BY ASSET CLASS</div>

        <div style={s.barList}>
          {breakdown.map((item, idx) => {
            const base = baseBreakdown[idx]?.ter ?? item.ter
            const curr = item.ter
            const delta = curr - base
            const tier = terTier(curr)
            const barPct = Math.min(curr / MAX_TER * 100, 100)
            const basePct = Math.min(base / MAX_TER * 100, 100)

            return (
              <div key={item.id} style={s.barRow}>
                <div style={s.barMeta}>
                  <div style={s.barLabelGroup}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: item.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={s.barLabel}>{item.label}</span>
                    <span style={{
                      ...s.tierBadge,
                      color: tier.color,
                      borderColor: tier.color + '55',
                      background: tier.color + '12',
                    }}>{tier.label}</span>
                  </div>
                  <div style={s.barValueGroup}>
                    <span style={{ ...s.barValue, color: showComparison && delta !== 0 ? tier.color : '#FFFFFF', transition: 'color 0.5s ease' }}>
                      {curr.toFixed(2)}%
                    </span>
                    {showComparison && Math.abs(delta) > 0.001 && (
                      <span style={{
                        ...s.barDelta,
                        color: delta < 0 ? '#4ED596' : '#E01B41',
                        background: delta < 0 ? 'rgba(78,213,150,0.1)' : 'rgba(224,27,65,0.1)',
                      }}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Track */}
                <div style={s.barTrack}>
                  {/* Weight label (allocation %) */}
                  <span style={s.allocLabel}>{item.weight}%</span>

                  {/* Base ghost bar */}
                  {showComparison && (
                    <div style={{
                      position: 'absolute', top: 0, bottom: 0, left: 36,
                      borderRadius: 4,
                      background: item.color,
                      opacity: 0.15,
                      width: `calc(${basePct}% - 36px)`,
                    }} />
                  )}
                  {/* Active bar */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, left: 36,
                    borderRadius: 4,
                    background: showComparison && Math.abs(delta) > 0.001
                      ? (delta < 0 ? '#4ED596' : '#E01B41')
                      : tier.color,
                    opacity: 0.75,
                    width: animated ? `calc(${barPct}% - 36px)` : '0%',
                    transition: 'width 0.85s cubic-bezier(0.4,0,0.2,1), background 0.5s ease',
                  }} />

                  {/* Market avg reference line */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0,
                    left: `calc(36px + ${Math.min(marketAvg / MAX_TER * 100, 100)}% - 36px * ${Math.min(marketAvg / MAX_TER * 100, 100) / 100})`,
                    width: 1.5,
                    background: 'rgba(245,166,35,0.45)',
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* Weight contribution */}
                <div style={s.contribution}>
                  <span style={s.contribLabel}>Contribution</span>
                  <span style={s.contribVal}>{(curr * item.weight / 100).toFixed(3)}%</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div style={s.legend}>
          <span style={s.legendDot('#F5A623')} />
          <span style={s.legendText}>Market average ({marketAvg.toFixed(2)}%)</span>
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

const s = {
  wrap: {
    display: 'flex', flexDirection: 'row',
    width: '100%', height: '100%',
    gap: 28,
    alignItems: 'stretch',
    minHeight: 0,
  },
  leftCol: {
    display: 'flex', flexDirection: 'column',
    width: '36%', flexShrink: 0,
    gap: 10,
  },
  rightCol: {
    flex: 1,
    display: 'flex', flexDirection: 'column',
    minWidth: 0, gap: 10,
  },
  sectionLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.12em', textTransform: 'uppercase',
    flexShrink: 0,
  },
  gaugeSvgWrap: {
    width: '100%',
    flexShrink: 0,
  },
  gaugeSvg: {
    width: '100%',
    height: 'auto',
    maxHeight: 160,
    display: 'block',
  },
  kpiRow: {
    display: 'flex', gap: 10, flexShrink: 0,
  },
  kpiCard: {
    flex: 1,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  kpiLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: '0.05em',
  },
  kpiVal: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.3rem', fontWeight: 700,
    color: '#FFFFFF',
    lineHeight: 1.1,
  },
  kpiSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.55rem', color: 'rgba(255,255,255,0.28)',
  },
  savingCard: {
    border: '1px solid',
    borderRadius: 6,
    padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 4,
    flexShrink: 0,
  },
  savingLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 800,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  },
  savingAmount: {
    fontFamily: "'Merriweather', serif",
    fontSize: '1.5rem', fontWeight: 700,
    lineHeight: 1,
  },
  savingEur: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)',
  },
  barList: {
    flex: 1, display: 'flex', flexDirection: 'column',
    gap: 11, minHeight: 0,
    justifyContent: 'space-around',
  },
  barRow: {
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  barMeta: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
  },
  barLabelGroup: {
    display: 'flex', alignItems: 'center', gap: 7,
  },
  barLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.8)',
  },
  tierBadge: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.5rem', fontWeight: 800,
    letterSpacing: '0.1em', textTransform: 'uppercase',
    padding: '1px 5px', borderRadius: 3,
    border: '1px solid',
  },
  barValueGroup: {
    display: 'flex', alignItems: 'center', gap: 6,
  },
  barValue: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 700,
    color: '#FFFFFF',
  },
  barDelta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 700,
    padding: '1px 5px', borderRadius: 3,
  },
  barTrack: {
    position: 'relative',
    height: 20, borderRadius: 4,
    background: 'rgba(255,255,255,0.05)',
    overflow: 'visible',
  },
  allocLabel: {
    position: 'absolute', left: 4, top: '50%',
    transform: 'translateY(-50%)',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.54rem', fontWeight: 700,
    color: 'rgba(255,255,255,0.35)',
    zIndex: 1, lineHeight: 1,
  },
  contribution: {
    display: 'flex', justifyContent: 'flex-end',
    alignItems: 'center', gap: 5,
  },
  contribLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.52rem', color: 'rgba(255,255,255,0.25)',
  },
  contribVal: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 600,
    color: 'rgba(255,255,255,0.4)',
  },
  legend: {
    display: 'flex', alignItems: 'center', gap: 8,
    flexShrink: 0, marginTop: 4,
    flexWrap: 'wrap',
  },
  legendDot: (color) => ({
    display: 'inline-block',
    width: 8, height: 8, borderRadius: '50%',
    background: color, flexShrink: 0,
  }),
  legendSwatch: {
    display: 'inline-block',
    width: 20, height: 7, borderRadius: 2,
    flexShrink: 0, opacity: 0.75,
  },
  legendText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)',
    marginRight: 4,
  },
}
