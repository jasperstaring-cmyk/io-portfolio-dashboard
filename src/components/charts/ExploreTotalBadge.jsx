/**
 * ExploreTotalBadge
 *
 * Toont het totaal van de slider-gewichten op het presentatiescherm
 * tijdens explore mode. Alleen zichtbaar als het totaal afwijkt van
 * de doelwaarde (standaard 100%).
 *
 * Gebruik:
 *   <ExploreTotalBadge total={rawSum} />
 *   <ExploreTotalBadge total={sfdrSum} target={100} label="SFDR" />
 *
 * De badge positioneert zichzelf absolute rechtsonder in de
 * dichtstbijzijnde position:relative container (de chart wrap).
 */

export default function ExploreTotalBadge({ total, target = 100, label = 'Total', exploreMode = false }) {
  if (!exploreMode) return null
  const rounded  = Math.round(total * 10) / 10
  const diff     = Math.abs(rounded - target)
  const onTarget = diff < 0.5
  const over     = rounded > target

  const color   = onTarget ? '#4ED596' : over ? '#E01B41' : '#F5A623'
  const bgColor = onTarget ? 'rgba(78,213,150,0.12)'  : over ? 'rgba(224,27,65,0.12)'  : 'rgba(245,166,35,0.12)'
  const border  = onTarget ? 'rgba(78,213,150,0.35)'  : over ? 'rgba(224,27,65,0.35)'  : 'rgba(245,166,35,0.35)'

  const sign    = over ? '+' : ''
  const diffStr = onTarget ? '✓' : `${sign}${(rounded - target).toFixed(1).replace('.0', '')}%`

  return (
    <div style={{
      position: 'absolute',
      bottom: 18,
      right: 18,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: 3,
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      {/* Hoofdbadge */}
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: 7,
        background: bgColor,
        border: `1px solid ${border}`,
        borderRadius: 8,
        padding: '7px 14px',
        backdropFilter: 'blur(4px)',
      }}>
        <span style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '0.52rem',
          fontWeight: 800,
          color: color,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'Merriweather', serif",
          fontSize: '1.8rem',
          fontWeight: 700,
          lineHeight: 1,
          color: color,
          letterSpacing: '-0.02em',
        }}>
          {rounded}%
        </span>
        <span style={{
          fontFamily: "'Merriweather Sans', sans-serif",
          fontSize: '0.78rem',
          fontWeight: 800,
          color: color,
          opacity: 0.75,
        }}>
          {diffStr}
        </span>
      </div>

      {/* Hint */}
      <span style={{
        fontFamily: "'Merriweather Sans', sans-serif",
        fontSize: '0.56rem',
        fontWeight: 600,
        color: 'rgba(255,255,255,0.30)',
        letterSpacing: '0.06em',
      }}>
        {onTarget ? 'allocation complete' : over ? 'reduce sliders to reach 100%' : 'increase sliders to reach 100%'}
      </span>
    </div>
  )
}
