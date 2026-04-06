export default function OperatorPanel({
  scenarios,
  activeIndex,
  onSelectScenario,
  showComparison,
  onToggleComparison,
  activeDimension,
  onSelectDimension,
  activeScenario,
  lang,
  onEnterExplore,
  allEvents,
  activeEventId,
  onSelectEvent,
  showPerformanceView,
  onTogglePerformanceView,
  idleMode,
  onToggleIdle,
  exploreActive,
  onOpenConfig,
}) {
  const isLive = !idleMode

  const eventName =
    allEvents?.find(e => e.id === activeEventId)?.name || 'Portfolio Day'

  const policyQuestion =
    activeScenario?.framing?.policyQuestion?.[lang] ||
    activeScenario?.framing?.policyQuestion?.en ||
    activeScenario?.speaker?.[lang] ||
    activeScenario?.speaker?.en ||
    activeScenario?.title?.[lang] ||
    activeScenario?.title?.en ||
    ''

  const hasComparison = !!activeScenario?.comparison
  const hasPerfView = !!(activeScenario?.performanceView?.base?.length)
  const hasMultipleEvents = allEvents?.length > 1

  return (
    <div style={s.panel}>

      {/* Rode lijn — splitsing tussen scherm en panel */}
      <div style={s.redLine} />

      {/* Hoofdrij */}
      <div style={s.mainRow}>

        {/* ── Event selector (alleen als meerdere events) ── */}
        {hasMultipleEvents && (
          <>
            <div style={s.eventSection}>
              <div style={s.microLabel}>Event</div>
              <select
                value={activeEventId || ''}
                onChange={e => onSelectEvent(e.target.value)}
                style={s.eventSelect}
              >
                {allEvents.map(e => (
                  <option key={e.id} value={e.id}>{e.name || e.id}</option>
                ))}
              </select>
            </div>
            <div style={s.vDivider} />
          </>
        )}

        {/* ── Beleidsvraag ── */}
        <div style={s.questionSection}>
          <div style={s.microLabel}>{eventName}</div>
          <div style={s.question}>{policyQuestion || '\u00A0'}</div>
        </div>

        <div style={s.vDivider} />

        {/* ── Navigatie ── */}
        <div style={s.navSection}>
          <div style={s.microLabel}>Use case</div>
          <div style={s.navRow}>
            <button
              style={s.arrowBtn}
              onClick={() =>
                onSelectScenario((activeIndex - 1 + scenarios.length) % scenarios.length)
              }
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={s.navCounter}>{activeIndex + 1} / {scenarios.length}</div>
            <button
              style={s.arrowBtn}
              onClick={() =>
                onSelectScenario((activeIndex + 1) % scenarios.length)
              }
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div style={s.progressTrack}>
            <div style={{
              ...s.progressFill,
              width: ((activeIndex + 1) / scenarios.length) * 100 + '%',
            }} />
          </div>
        </div>

        <div style={s.vDivider} />

        {/* ── START / IDLE ── */}
        <button
          style={{
            ...s.btn,
            background: isLive ? '#E01B41' : 'rgba(255,255,255,0.04)',
            borderColor: isLive ? '#E01B41' : 'rgba(255,255,255,0.1)',
          }}
          onClick={onToggleIdle}
        >
          {isLive ? (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <polygon points="13,9 24,16 13,23" fill="white" />
            </svg>
          ) : (
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="13" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
              <rect x="10" y="10" width="4" height="12" rx="1.5" fill="rgba(255,255,255,0.35)" />
              <rect x="18" y="10" width="4" height="12" rx="1.5" fill="rgba(255,255,255,0.35)" />
            </svg>
          )}
          <span style={{ ...s.btnLabel, color: isLive ? '#fff' : 'rgba(255,255,255,0.3)' }}>
            {isLive ? 'Live' : 'Idle'}
          </span>
        </button>

        {/* ── COMPARE ── */}
        <button
          style={{
            ...s.btn,
            background: showComparison ? 'rgba(251,199,37,0.12)' : 'rgba(255,255,255,0.04)',
            borderColor: showComparison ? 'rgba(251,199,37,0.4)' : 'rgba(255,255,255,0.1)',
            opacity: hasComparison ? 1 : 0.28,
            pointerEvents: hasComparison ? 'auto' : 'none',
          }}
          onClick={onToggleComparison}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="3" y="8" width="11" height="16" rx="2.5"
              fill={showComparison ? 'rgba(251,199,37,0.45)' : 'rgba(255,255,255,0.2)'} />
            <rect x="18" y="8" width="11" height="16" rx="2.5"
              fill={showComparison ? 'rgba(251,199,37,0.18)' : 'rgba(255,255,255,0.1)'} />
            <line x1="6" y1="14" x2="11" y2="14" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.45)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="17" x2="11" y2="17" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.45)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6" y1="20" x2="11" y2="20" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.3)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="14" x2="26" y2="14" stroke={showComparison ? 'rgba(251,199,37,0.6)' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="21" y1="17" x2="26" y2="17" stroke={showComparison ? 'rgba(251,199,37,0.6)' : 'rgba(255,255,255,0.25)'} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ ...s.btnLabel, color: showComparison ? '#FBC725' : 'rgba(255,255,255,0.3)' }}>
            Compare
          </span>
        </button>

        {/* ── PERFORMANCE ── */}
        <button
          style={{
            ...s.btn,
            background: showPerformanceView ? 'rgba(224,27,65,0.1)' : 'rgba(255,255,255,0.04)',
            borderColor: showPerformanceView ? 'rgba(224,27,65,0.35)' : 'rgba(255,255,255,0.1)',
            opacity: hasPerfView ? 1 : 0.28,
            pointerEvents: hasPerfView ? 'auto' : 'none',
          }}
          onClick={onTogglePerformanceView}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <line x1="3" y1="26" x2="29" y2="26" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <polygon points="3,22 9,15 15,18 21,9 29,5 29,26 3,26"
              fill={showPerformanceView ? 'rgba(224,27,65,0.1)' : 'rgba(255,255,255,0.05)'} />
            <polyline points="3,22 9,15 15,18 21,9 29,5"
              stroke={showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.4)'}
              strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="29" cy="5" r="2"
              fill={showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.4)'} />
          </svg>
          <span style={{ ...s.btnLabel, color: showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.3)' }}>
            Performance
          </span>
        </button>

        {/* ── EXPLORE ── */}
        <button
          style={{
            ...s.btn,
            background: exploreActive ? 'rgba(78,213,150,0.1)' : 'rgba(255,255,255,0.04)',
            borderColor: exploreActive ? 'rgba(78,213,150,0.32)' : 'rgba(255,255,255,0.1)',
          }}
          onClick={onEnterExplore}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="12"
              stroke={exploreActive ? '#4ED596' : 'rgba(255,255,255,0.25)'}
              strokeWidth="1.5" />
            <line x1="16" y1="4" x2="16" y2="28" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <line x1="4" y1="16" x2="28" y2="16" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <ellipse cx="16" cy="16" rx="6" ry="12"
              stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="2.5 2" fill="none" />
            <circle cx="16" cy="16" r="2.5"
              fill={exploreActive ? '#4ED596' : 'rgba(255,255,255,0.4)'} />
            <polygon points="16,5 14,10 18,10"
              fill={exploreActive ? 'rgba(78,213,150,0.8)' : 'rgba(255,255,255,0.35)'} />
          </svg>
          <span style={{ ...s.btnLabel, color: exploreActive ? '#4ED596' : 'rgba(255,255,255,0.3)' }}>
            Explore
          </span>
        </button>

        {/* ── Configurator-knop rechtsonder ── */}
        <div style={s.vDivider} />
        <button style={s.configBtn} onClick={onOpenConfig} title="Open configurator">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={s.configLabel}>Configure</span>
        </button>

      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}

const s = {
  panel: {
    width: '100%',
    background: '#0C182E',
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    flexShrink: 0,
  },
  redLine: {
    height: '3px',
    background: '#E01B41',
    width: '100%',
  },
  mainRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 20px',
    height: '96px',
    gap: 0,
  },

  /* Event selector */
  eventSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
    flexShrink: 0,
    paddingRight: '16px',
  },
  eventSelect: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '11px',
    fontWeight: 700,
    color: '#ffffff',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
    appearance: 'none',
    maxWidth: '160px',
  },

  /* Beleidsvraag */
  questionSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '5px',
    flex: '1 1 0',
    minWidth: 0,
    paddingRight: '16px',
  },
  microLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '8px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: 'rgba(255,255,255,0.28)',
  },
  question: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    lineHeight: 1.35,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },

  /* Verticale divider */
  vDivider: {
    width: '1px',
    height: '56px',
    background: 'rgba(255,255,255,0.08)',
    flexShrink: 0,
    margin: '0 20px',
  },

  /* Navigatie */
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    width: '100px',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  arrowBtn: {
    width: '28px',
    height: '28px',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    padding: 0,
    flexShrink: 0,
  },
  navCounter: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.7)',
    minWidth: '30px',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: '2px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '1px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#E01B41',
    borderRadius: '1px',
    transition: 'width 0.3s ease',
  },

  /* Actieknoppen */
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    width: '84px',
    height: '72px',
    flexShrink: 0,
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    transition: 'background 0.18s, border-color 0.18s, opacity 0.15s',
    background: 'rgba(255,255,255,0.04)',
    marginLeft: '8px',
  },
  btnLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '8px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },

  /* Configurator-knop */
  configBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    width: '64px',
    height: '56px',
    flexShrink: 0,
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.08)',
    cursor: 'pointer',
    background: 'transparent',
    marginLeft: '4px',
    transition: 'background 0.15s',
  },
  configLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '7px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.3)',
  },

  /* Logo */
  logoArea: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.15,
    paddingLeft: '4px',
    flexShrink: 0,
  },
}
