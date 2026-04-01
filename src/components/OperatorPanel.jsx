const DIMENSIONS = [
  { id: 'asset_class', label: 'Asset Class', icon: '◉' },
  { id: 'geography', label: 'Geography', icon: '⊕' },
  { id: 'esg', label: 'ESG', icon: '◈' },
  { id: 'implementation', label: 'Implementation', icon: '◧' },
  { id: 'performance', label: 'Performance', icon: '↗' },
]

export default function OperatorPanel({
  scenarios, activeIndex, onSelectScenario,
  showComparison, onToggleComparison,
  activeDimension, onSelectDimension,
  activeScenario, lang
}) {
  return (
    <div style={styles.panel}>
      <div style={styles.section}>
        <div style={styles.sectionLabel}>SCENARIOS</div>
        <div style={styles.row}>
          {scenarios.map((s, i) => {
            const isActive = i === activeIndex
            return (
              <button key={s.id} onClick={() => onSelectScenario(i)}
                style={{ ...styles.scenarioBtn, ...(isActive ? styles.scenarioBtnActive : {}) }}>
                <span style={{
                  ...styles.scenarioNum,
                  color: isActive ? '#E01B41' : '#8A8A82',
                }}>{i + 1}</span>
                <span style={{
                  ...styles.scenarioName,
                  color: isActive ? '#FFFFFF' : '#0C182E',
                }}>
                  {s.speaker?.[lang] || s.speaker?.en}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.vDivider} />

      <div style={styles.section}>
        <div style={styles.sectionLabel}>DIMENSION</div>
        <div style={styles.row}>
          {DIMENSIONS.map(d => {
            const isActive = activeDimension === d.id
            return (
              <button key={d.id} onClick={() => onSelectDimension(d.id)}
                style={{ ...styles.dimBtn, ...(isActive ? styles.dimBtnActive : {}) }}>
                <span style={styles.dimIcon}>{d.icon}</span>
                <span style={{
                  ...styles.dimLabel,
                  color: isActive ? '#FFFFFF' : '#0C182E',
                }}>{d.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div style={styles.vDivider} />

      <div style={styles.section}>
        <div style={styles.sectionLabel}>COMPARE</div>
        <div style={styles.row}>
          <button
            onClick={onToggleComparison}
            disabled={!activeScenario?.comparison}
            style={{
              ...styles.compareBtn,
              ...(showComparison ? styles.compareBtnActive : {}),
              ...(!activeScenario?.comparison ? styles.compareBtnDisabled : {}),
            }}>
            <span style={{
              ...styles.compareToggle,
              color: showComparison ? '#4ED596' : '#8A8A82',
            }}>
              {showComparison ? '● ON' : '○ OFF'}
            </span>
            <span style={styles.compareDesc}>
              {activeScenario?.comparison
                ? (activeScenario.comparison.label?.[lang] || activeScenario.comparison.label?.en)
                : 'No comparison available'}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  panel: {
    height: '100%',
    display: 'flex',
    alignItems: 'stretch',
    background: '#F8F8F7',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '8px',
    padding: '10px 20px',
    flexShrink: 0,
  },
  vDivider: {
    width: '1px',
    background: '#E0E0DC',
    margin: '14px 0',
    flexShrink: 0,
  },
  sectionLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.54rem',
    fontWeight: 800,
    color: '#8A8A82',
    letterSpacing: '0.12em',
  },
  row: {
    display: 'flex',
    gap: '6px',
  },
  scenarioBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '3px',
    padding: '7px 10px',
    background: '#FFFFFF',
    border: '1.5px solid #E0E0DC',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '80px',
    maxWidth: '96px',
    transition: 'all 0.15s ease',
  },
  scenarioBtnActive: {
    background: '#0C182E',
    borderColor: '#0C182E',
    boxShadow: '0 2px 10px rgba(12,24,46,0.2)',
  },
  scenarioNum: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.56rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
  },
  scenarioName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem',
    fontWeight: 600,
    textAlign: 'center',
    lineHeight: 1.3,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '76px',
  },
  dimBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '7px 12px',
    background: '#FFFFFF',
    border: '1.5px solid #E0E0DC',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '74px',
    transition: 'all 0.15s ease',
  },
  dimBtnActive: {
    background: '#E01B41',
    borderColor: '#E01B41',
    boxShadow: '0 2px 8px rgba(224,27,65,0.28)',
  },
  dimIcon: {
    fontSize: '0.88rem',
    lineHeight: 1,
  },
  dimLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.57rem',
    fontWeight: 700,
    textAlign: 'center',
  },
  compareBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '4px',
    padding: '9px 14px',
    background: '#FFFFFF',
    border: '1.5px solid #E0E0DC',
    borderRadius: '6px',
    cursor: 'pointer',
    minWidth: '175px',
    transition: 'all 0.15s ease',
    textAlign: 'left',
  },
  compareBtnActive: {
    background: 'rgba(78,213,150,0.07)',
    borderColor: '#4ED596',
  },
  compareBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  },
  compareToggle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem',
    fontWeight: 800,
  },
  compareDesc: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.6rem',
    color: '#8A8A82',
    lineHeight: 1.35,
  },
}
