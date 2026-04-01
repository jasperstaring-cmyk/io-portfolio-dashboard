import { useState } from 'react'
import { c } from './configuratorStyles'

// ── Section wrapper ────────────────────────────────────────────────────────

export function Section({ title, titleRight, children }) {
  return (
    <div style={c.section}>
      {titleRight ? (
        <div style={c.sectionTitleRow}>
          <span style={{ ...c.sectionTitle, marginBottom: 0, paddingBottom: 0, borderBottom: 'none' }}>
            {title}
          </span>
          {titleRight}
        </div>
      ) : (
        <div style={c.sectionTitle}>{title}</div>
      )}
      {children}
    </div>
  )
}

// ── Field wrapper ──────────────────────────────────────────────────────────

export function Field({ label, children, row }) {
  return (
    <div style={row
      ? { ...c.field, display: 'flex', alignItems: 'center', gap: 8 }
      : c.field
    }>
      <label style={c.label}>{label}</label>
      {children}
    </div>
  )
}

// ── Text input ─────────────────────────────────────────────────────────────

export function TextInput({ value, onChange, placeholder, wide }) {
  return (
    <input
      style={wide ? { ...c.input, width: '100%' } : c.input}
      type="text"
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
    />
  )
}

// ── Number input ───────────────────────────────────────────────────────────

export function NumInput({ value, onChange, min = 0, max = 100, step = 1, small }) {
  return (
    <input
      style={small ? { ...c.input, width: 64 } : { ...c.input, width: 80 }}
      type="number"
      value={value ?? ''}
      min={min} max={max} step={step}
      onChange={e => onChange(Number(e.target.value))}
    />
  )
}

// ── Textarea ───────────────────────────────────────────────────────────────

export function Textarea({ value, onChange, placeholder, rows = 2 }) {
  return (
    <textarea
      style={c.textarea}
      value={value || ''}
      rows={rows}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
    />
  )
}

// ── Language tab switcher ──────────────────────────────────────────────────

export const LANGUAGES = ['en', 'nl', 'fr', 'de']
export const LANG_LABELS = { en: 'EN', nl: 'NL', fr: 'FR', de: 'DE' }
export const LANG_FULL = { en: 'English', nl: 'Nederlands', fr: 'Français', de: 'Deutsch' }

export function LangTabs({ active, onChange }) {
  return (
    <div style={c.langTab}>
      {LANGUAGES.map(lang => (
        <button
          key={lang}
          style={{
            ...c.langTabBtn,
            ...(active === lang ? c.langTabBtnActive : {}),
          }}
          onClick={() => onChange(lang)}
        >
          {LANG_LABELS[lang]}
        </button>
      ))}
    </div>
  )
}

// ── Total badge (shows sum with ok/warn state) ─────────────────────────────

export function TotalBadge({ values, target = 100, label = 'Total' }) {
  const total = values.reduce((s, v) => s + (Number(v) || 0), 0)
  const ok = Math.abs(total - target) < 0.5
  return (
    <span style={{ ...c.totalBadge, ...(ok ? c.totalOk : c.totalWarn) }}>
      {label}: {total}% {ok ? '✓' : `(${total > target ? '+' : ''}${(total - target).toFixed(1)})`}
    </span>
  )
}

// ── Sub-section label ──────────────────────────────────────────────────────

export function SubLabel({ children }) {
  return <div style={c.subLabel}>{children}</div>
}
