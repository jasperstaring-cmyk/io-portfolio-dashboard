import { useState, useRef, useCallback } from 'react'

// ── useTooltip hook ────────────────────────────────────────────────────────
// Returns tooltip state + event handlers to attach to hoverable elements.
// Usage:
//   const { tooltip, showTooltip, hideTooltip } = useTooltip()
//   <div onMouseEnter={e => showTooltip(e, { label: 'Equities', value: '48%' })} onMouseLeave={hideTooltip}>

export function useTooltip() {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, content: null })

  const showTooltip = useCallback((e, content) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      content,
    })
  }, [])

  const hideTooltip = useCallback(() => {
    setTooltip(t => ({ ...t, visible: false }))
  }, [])

  return { tooltip, showTooltip, hideTooltip }
}

// ── Tooltip component ──────────────────────────────────────────────────────
// Renders as a portal-style fixed overlay above everything.

export default function ChartTooltip({ tooltip }) {
  if (!tooltip.visible || !tooltip.content) return null

  const { x, y, content } = tooltip

  return (
    <div style={{
      position: 'fixed',
      left: x,
      top: y,
      transform: 'translate(-50%, -100%)',
      zIndex: 9000,
      pointerEvents: 'none',
      animation: 'tooltip-in 0.12s ease both',
    }}>
      <div style={s.box}>
        {content.label && (
          <div style={s.label}>{content.label}</div>
        )}
        {content.value && (
          <div style={{ ...s.value, color: content.color || '#FFFFFF' }}>
            {content.value}
          </div>
        )}
        {content.sub && (
          <div style={s.sub}>{content.sub}</div>
        )}
        {content.delta && (
          <div style={{
            ...s.delta,
            color: content.delta.startsWith('+') ? '#4ED596' : '#E01B41',
          }}>
            {content.delta}
          </div>
        )}
      </div>
      <div style={s.arrow} />
    </div>
  )
}

const s = {
  box: {
    background: '#0C182E',
    border: '1px solid rgba(255,255,255,0.14)',
    borderRadius: 7,
    padding: '8px 12px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
    minWidth: 100,
    textAlign: 'center',
    backdropFilter: 'blur(8px)',
  },
  label: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem', fontWeight: 800,
    color: 'rgba(255,255,255,0.4)',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1rem', fontWeight: 800,
    lineHeight: 1.1,
  },
  sub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem',
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  delta: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 700,
    marginTop: 3,
  },
  arrow: {
    width: 0, height: 0,
    borderLeft: '6px solid transparent',
    borderRight: '6px solid transparent',
    borderTop: '6px solid #0C182E',
    margin: '0 auto',
    filter: 'drop-shadow(0 1px 0 rgba(255,255,255,0.1))',
  },
}
