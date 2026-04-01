// ── Configurator shared styles ────────────────────────────────────────────
// Single source of truth for all configurator sub-components

export const c = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    background: 'rgba(12,24,46,0.88)',
    display: 'flex',
  },
  panel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    background: '#F8F8F7', overflow: 'hidden',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 24px',
    background: '#0C182E',
    borderBottom: '2px solid #E01B41',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.95rem', fontWeight: 800, color: '#FFFFFF',
  },
  headerSub: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: 'rgba(255,255,255,0.42)', marginTop: 2,
  },
  tabs: {
    display: 'flex',
    background: '#FFFFFF',
    borderBottom: '1px solid #E0E0DC',
    padding: '0 24px',
    flexShrink: 0,
  },
  tab: {
    padding: '11px 18px', background: 'none', border: 'none',
    borderBottom: '2px solid transparent',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 600,
    color: '#8A8A82', cursor: 'pointer', marginBottom: -1,
    transition: 'color 0.15s',
  },
  tabActive: {
    borderBottomColor: '#E01B41', color: '#0C182E',
  },
  content: {
    flex: 1, overflow: 'auto', padding: '20px 24px',
  },
  grid2: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20,
    alignItems: 'start',
  },
  grid2mini: {
    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
  },
  section: {
    marginBottom: 16, background: '#FFFFFF',
    border: '1px solid #E0E0DC', borderRadius: 8,
    padding: '14px 16px',
  },
  sectionTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 800, color: '#0C182E',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid #EFEFED',
  },
  sectionTitleRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid #EFEFED',
  },
  subLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800, color: '#8A8A82',
    letterSpacing: '0.1em', textTransform: 'uppercase',
    marginBottom: 6,
  },
  langTab: {
    display: 'flex', gap: 4, marginBottom: 12,
  },
  langTabBtn: {
    padding: '4px 10px',
    background: 'none',
    border: '1.5px solid #E0E0DC',
    borderRadius: 4,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700,
    color: '#8A8A82', cursor: 'pointer',
    letterSpacing: '0.06em', textTransform: 'uppercase',
    transition: 'all 0.12s',
  },
  langTabBtnActive: {
    background: '#E01B41', borderColor: '#E01B41', color: '#FFFFFF',
  },
  field: { marginBottom: 8 },
  label: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700, color: '#8A8A82',
    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3,
  },
  input: {
    display: 'block',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', color: '#0C182E',
    background: '#F8F8F7',
    border: '1.5px solid #E0E0DC',
    borderRadius: 5, padding: '6px 9px',
    outline: 'none', width: '100%',
  },
  textarea: {
    display: 'block', width: '100%',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.8rem', color: '#0C182E',
    background: '#F8F8F7',
    border: '1.5px solid #E0E0DC',
    borderRadius: 5, padding: '6px 9px',
    resize: 'vertical', outline: 'none',
  },
  tableHead: {
    display: 'flex', gap: 6, alignItems: 'center',
    paddingBottom: 5, marginBottom: 4,
    borderBottom: '1px solid #EFEFED',
  },
  th: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800, color: '#8A8A82',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    width: 64, textAlign: 'center',
  },
  tableRow: {
    display: 'flex', gap: 6, alignItems: 'center',
    paddingTop: 5, paddingBottom: 5,
    borderBottom: '1px solid #FAFAF8',
  },
  rowLabel: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', color: '#0C182E',
  },
  helpText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: '#8A8A82',
  },
  unit: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', color: '#8A8A82',
  },
  // Totals badge
  totalBadge: {
    display: 'inline-flex', alignItems: 'center',
    padding: '2px 8px', borderRadius: 4,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 800,
  },
  totalOk: {
    background: 'rgba(78,213,150,0.12)', color: '#1a7a50',
    border: '1px solid rgba(78,213,150,0.3)',
  },
  totalWarn: {
    background: 'rgba(224,27,65,0.08)', color: '#E01B41',
    border: '1px solid rgba(224,27,65,0.22)',
  },
  // Scenario list
  scenLayout: {
    display: 'flex', gap: 20, alignItems: 'flex-start',
  },
  scenList: {
    width: 200, flexShrink: 0,
    background: '#FFFFFF', border: '1px solid #E0E0DC',
    borderRadius: 8, overflow: 'hidden',
  },
  scenItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    width: '100%', padding: '9px 12px',
    background: 'none', border: 'none',
    borderBottom: '1px solid #EFEFED',
    cursor: 'pointer', textAlign: 'left',
    transition: 'background 0.15s',
  },
  scenNum: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.58rem', fontWeight: 800,
    width: 14, flexShrink: 0,
  },
  scenName: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 600,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    flex: 1,
  },
  addBtn: {
    width: '100%', padding: '9px 12px',
    background: 'none', border: 'none',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.7rem', fontWeight: 700,
    color: '#E01B41', cursor: 'pointer', textAlign: 'left',
  },
  scenEditor: { flex: 1 },
  // Buttons
  btnSave: {
    padding: '8px 18px',
    background: '#4ED596', border: 'none',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 700, color: '#0C182E',
  },
  btnSaveStay: {
    padding: '8px 18px',
    background: 'rgba(78,213,150,0.12)',
    border: '1.5px solid rgba(78,213,150,0.4)',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 700, color: '#1a7a50',
  },
  btnCancel: {
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.78rem', fontWeight: 600, color: '#FFFFFF',
  },
  btnDanger: {
    padding: '5px 12px',
    background: 'rgba(224,27,65,0.07)',
    border: '1px solid rgba(224,27,65,0.22)',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.68rem', fontWeight: 600, color: '#E01B41',
  },
  toggleBtn: {
    padding: '7px 14px',
    background: '#FFFFFF', border: '1.5px solid #E0E0DC',
    borderRadius: 5, cursor: 'pointer',
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', fontWeight: 700, color: '#8A8A82',
  },
  toggleBtnOn: {
    background: 'rgba(78,213,150,0.08)',
    borderColor: '#4ED596', color: '#0C182E',
  },
  // Dimension badge in scenario list
  dimBadge: {
    padding: '1px 6px', borderRadius: 3,
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.54rem', fontWeight: 700,
    background: 'rgba(224,27,65,0.08)', color: '#E01B41',
    letterSpacing: '0.04em', textTransform: 'uppercase',
    flexShrink: 0,
  },
  compDot: {
    width: 6, height: 6, borderRadius: '50%',
    background: '#4ED596', flexShrink: 0,
  },
  // Compare delta display
  deltaRow: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '5px 0', borderBottom: '1px solid #FAFAF8',
  },
  deltaFrom: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', color: '#8A8A82', width: 36, textAlign: 'right',
  },
  deltaArrow: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', color: '#C0C0BB',
  },
  deltaTo: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.72rem', fontWeight: 700, color: '#0C182E', width: 36,
  },
  deltaDiff: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.62rem', fontWeight: 700,
    width: 40, textAlign: 'right',
  },
}
