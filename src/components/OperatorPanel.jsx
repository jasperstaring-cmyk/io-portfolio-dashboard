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

  const screenName =
    activeScenario?.screenName?.[lang] ||
    activeScenario?.screenName?.en ||
    activeScenario?.screenName ||
    ''

  const hasComparison = !!activeScenario?.comparison
  const hasPerfView = !!(activeScenario?.performanceView?.base?.length)
  const hasMultipleEvents = allEvents?.length > 1

  return (
    <div style={s.panel}>
      <div style={s.redLine} />
      <div style={s.mainRow}>

        {/* ── Configure — links, subtiel ── */}
        <button style={s.configBtn} onClick={onOpenConfig} title="Open configurator">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
            <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
              stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={s.configLabel}>Configure</span>
        </button>

        <div style={s.vDivider} />

        {/* ── Event selector ── */}
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

        {/* ── Screenname ── */}
        <div style={s.screenNameSection}>
          <div style={s.screenNameText}>{screenName || '\u00A0'}</div>
        </div>

        <div style={s.vDivider} />

        {/* ── Navigatie ── */}
        <div style={s.navSection}>
          <div style={s.microLabel}>Use case</div>
          <div style={s.navRow}>
            <button
              style={s.arrowBtn}
              onClick={() => onSelectScenario((activeIndex - 1 + scenarios.length) % scenarios.length)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div style={s.navCounter}>{activeIndex + 1} / {scenarios.length}</div>
            <button
              style={s.arrowBtn}
              onClick={() => onSelectScenario((activeIndex + 1) % scenarios.length)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="rgba(255,255,255,0.8)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div style={s.progressTrack}>
            <div style={{ ...s.progressFill, width: ((activeIndex + 1) / scenarios.length) * 100 + '%' }} />
          </div>
        </div>

        <div style={s.vDivider} />

        {/* ── START / PAUSE — toont actie, niet huidige staat ── */}
        <button
          style={{
            ...s.btn,
            background: isLive ? 'rgba(255,255,255,0.07)' : '#E01B41',
            borderColor: isLive ? 'rgba(255,255,255,0.25)' : '#E01B41',
          }}
          onClick={onToggleIdle}
        >
          {isLive ? (
            // Dashboard is live → toon Pause (klik = stoppen)
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <rect x="11" y="11" width="5" height="14" rx="1.5" fill="rgba(255,255,255,0.8)" />
              <rect x="20" y="11" width="5" height="14" rx="1.5" fill="rgba(255,255,255,0.8)" />
            </svg>
          ) : (
            // Dashboard is idle → toon Start (klik = beginnen)
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="15" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
              <polygon points="15,10 27,18 15,26" fill="white" />
            </svg>
          )}
          <span style={{ ...s.btnLabel, color: isLive ? 'rgba(255,255,255,0.7)' : '#ffffff' }}>
            {isLive ? 'Pause' : 'Start'}
          </span>
        </button>

        {/* ── COMPARE ── */}
        <button
          style={{
            ...s.btn,
            background: showComparison ? 'rgba(251,199,37,0.15)' : 'rgba(255,255,255,0.07)',
            borderColor: showComparison ? 'rgba(251,199,37,0.7)' : 'rgba(255,255,255,0.25)',
            opacity: hasComparison ? 1 : 0.25,
            pointerEvents: hasComparison ? 'auto' : 'none',
          }}
          onClick={onToggleComparison}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect x="3" y="8" width="13" height="20" rx="2.5"
              fill={showComparison ? 'rgba(251,199,37,0.5)' : 'rgba(255,255,255,0.25)'}
              stroke={showComparison ? 'rgba(251,199,37,0.8)' : 'rgba(255,255,255,0.4)'} strokeWidth="1" />
            <rect x="20" y="8" width="13" height="20" rx="2.5"
              fill={showComparison ? 'rgba(251,199,37,0.2)' : 'rgba(255,255,255,0.1)'}
              stroke={showComparison ? 'rgba(251,199,37,0.5)' : 'rgba(255,255,255,0.25)'} strokeWidth="1" />
            <line x1="6.5" y1="15" x2="12.5" y2="15" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.6)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6.5" y1="19" x2="12.5" y2="19" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.6)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="6.5" y1="23" x2="12.5" y2="23" stroke={showComparison ? '#FBC725' : 'rgba(255,255,255,0.4)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="23.5" y1="15" x2="29.5" y2="15" stroke={showComparison ? 'rgba(251,199,37,0.7)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
            <line x1="23.5" y1="19" x2="29.5" y2="19" stroke={showComparison ? 'rgba(251,199,37,0.7)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span style={{ ...s.btnLabel, color: showComparison ? '#FBC725' : 'rgba(255,255,255,0.65)' }}>Compare</span>
        </button>

        {/* ── PERFORMANCE ── */}
        <button
          style={{
            ...s.btn,
            background: showPerformanceView ? 'rgba(224,27,65,0.15)' : 'rgba(255,255,255,0.07)',
            borderColor: showPerformanceView ? 'rgba(224,27,65,0.7)' : 'rgba(255,255,255,0.25)',
            opacity: hasPerfView ? 1 : 0.25,
            pointerEvents: hasPerfView ? 'auto' : 'none',
          }}
          onClick={onTogglePerformanceView}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <line x1="3" y1="30" x2="33" y2="30" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <polygon points="3,25 10,17 17,21 24,11 33,6 33,30 3,30"
              fill={showPerformanceView ? 'rgba(224,27,65,0.15)' : 'rgba(255,255,255,0.08)'} />
            <polyline points="3,25 10,17 17,21 24,11 33,6"
              stroke={showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.6)'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <circle cx="33" cy="6" r="2.5" fill={showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.6)'} />
          </svg>
          <span style={{ ...s.btnLabel, color: showPerformanceView ? '#E01B41' : 'rgba(255,255,255,0.65)' }}>Performance</span>
        </button>

        {/* ── EXPLORE ── */}
        <button
          style={{
            ...s.btn,
            background: exploreActive ? 'rgba(78,213,150,0.15)' : 'rgba(255,255,255,0.07)',
            borderColor: exploreActive ? 'rgba(78,213,150,0.7)' : 'rgba(255,255,255,0.25)',
          }}
          onClick={onEnterExplore}
        >
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="14"
              stroke={exploreActive ? '#4ED596' : 'rgba(255,255,255,0.5)'} strokeWidth="1.5" />
            <line x1="18" y1="4" x2="18" y2="32" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <line x1="4" y1="18" x2="32" y2="18" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <ellipse cx="18" cy="18" rx="7" ry="14"
              stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" fill="none" />
            <circle cx="18" cy="18" r="3" fill={exploreActive ? '#4ED596' : 'rgba(255,255,255,0.6)'} />
            <polygon points="18,5 15.5,12 20.5,12" fill={exploreActive ? '#4ED596' : 'rgba(255,255,255,0.5)'} />
          </svg>
          <span style={{ ...s.btnLabel, color: exploreActive ? '#4ED596' : 'rgba(255,255,255,0.65)' }}>Explore</span>
        </button>

      </div>
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
  redLine: { height: '3px', background: '#E01B41', width: '100%' },
  mainRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    padding: '0 24px',
    height: '100px',
    gap: 0,
  },

  /* Configure — helemaal links, subtiel */
  configBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '5px',
    width: '56px',
    height: '56px',
    flexShrink: 0,
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.12)',
    cursor: 'pointer',
    background: 'rgba(255,255,255,0.03)',
    transition: 'background 0.15s, border-color 0.15s',
    marginRight: '4px',
  },
  configLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '7px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: 'rgba(255,255,255,0.4)',
  },

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
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '6px',
    padding: '5px 10px',
    cursor: 'pointer',
    appearance: 'none',
    maxWidth: '160px',
  },
  screenNameSection: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: '1 1 0',
    minWidth: 0,
    paddingRight: '16px',
  },
  screenNameText: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '13px',
    fontWeight: 700,
    color: '#ffffff',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  microLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '8px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.16em',
    color: 'rgba(255,255,255,0.35)',
  },
  vDivider: {
    width: '1px',
    height: '60px',
    background: 'rgba(255,255,255,0.1)',
    flexShrink: 0,
    margin: '0 20px',
  },
  navSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
    width: '120px',
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  arrowBtn: {
    width: '30px',
    height: '30px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.22)',
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
    fontSize: '14px',
    fontWeight: 700,
    color: 'rgba(255,255,255,0.9)',
    minWidth: '52px',
    textAlign: 'center',
  },
  progressTrack: {
    width: '100%',
    height: '2px',
    background: 'rgba(255,255,255,0.12)',
    borderRadius: '1px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: '#E01B41',
    borderRadius: '1px',
    transition: 'width 0.3s ease',
  },
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '7px',
    width: '90px',
    height: '76px',
    flexShrink: 0,
    borderRadius: '10px',
    border: '1px solid rgba(255,255,255,0.25)',
    cursor: 'pointer',
    transition: 'background 0.18s, border-color 0.18s, opacity 0.15s',
    background: 'rgba(255,255,255,0.07)',
    marginLeft: '8px',
  },
  btnLabel: {
    fontFamily: "'Merriweather Sans', system-ui, sans-serif",
    fontSize: '9px',
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
}
