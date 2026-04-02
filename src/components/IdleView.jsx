/**
 * IdleView — startscherm dat in beeld is wanneer het dashboard niet actief ingezet wordt.
 * Toont een abstracte impressie van een beleggingsportefeuille als rustpunt tijdens het event.
 * De eventnaam wordt dynamisch geladen uit event.name (via eventConfig).
 */

export default function IdleView({ event }) {
  const eventName = event?.name || 'Portfolio Dashboard'

  return (
    <div style={s.container}>
      {/* Subtiel dotgrid — zelfde als PresentationView */}
      <div style={s.grid} />

      {/* HEADER */}
      <div style={s.header}>
        <div style={s.logoWrap}>
          <img
            src="/io_horizontal_white@10x.png"
            alt="Investment Officer"
            style={s.logo}
            onError={e => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'flex'
            }}
          />
          {/* Fallback als logo niet laadt */}
          <div style={{ display: 'none', alignItems: 'center', gap: 8 }}>
            <span style={s.fallbackIo}>io</span>
            <span style={s.fallbackSep} />
            <span style={s.fallbackText}>investment officer</span>
          </div>
        </div>
        <div style={s.dashboardTitle}>Portfolio Dashboard</div>
      </div>

      {/* Rode streep — exact conform PresentationView */}
      <div style={s.redLine} />

      {/* BODY — 3×2 grid met abstracte grafiekelemenenten */}
      <div style={s.body}>

        {/* Kolom 1, rijen 1+2: Donut */}
        <div style={{ ...s.cell, gridColumn: 1, gridRow: '1 / 3' }}>
          <svg viewBox="0 0 280 360" style={s.svg}>
            <g transform="translate(140,180)">
              {/* Buitenste ring — langzaam roterend */}
              <g style={sa.outerRing}>
                <circle r="136" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                {/* Segmenten: asset classes — grootte suggereert gewicht */}
                <path d="M 0,-124 A 124,124 0 0,1 114,-50"  fill="none" stroke="rgba(224,27,65,0.52)"  strokeWidth="22" strokeLinecap="butt" />
                <path d="M 116,-48 A 124,124 0 0,1 89,86"   fill="none" stroke="rgba(255,255,255,0.17)" strokeWidth="22" strokeLinecap="butt" />
                <path d="M 87,88 A 124,124 0 0,1 -50,113"   fill="none" stroke="rgba(78,213,150,0.32)"  strokeWidth="22" strokeLinecap="butt" />
                <path d="M -52,112 A 124,124 0 0,1 -116,49" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="22" strokeLinecap="butt" />
                <path d="M -117,47 A 124,124 0 0,1 -4,-124" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="22" strokeLinecap="butt" />
              </g>
              {/* Binnenste ring — statisch */}
              <circle r="84" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
              <path d="M 0,-76 A 76,76 0 0,1 66,-38"  fill="none" stroke="rgba(78,213,150,0.30)"  strokeWidth="10" strokeLinecap="butt" />
              <path d="M 67,-36 A 76,76 0 0,1 53,55"  fill="none" stroke="rgba(255,255,255,0.11)" strokeWidth="10" strokeLinecap="butt" />
              <path d="M 51,57 A 76,76 0 0,1 -76,3"   fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="butt" />
              <path d="M -76,1 A 76,76 0 0,1 -3,-76"  fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" strokeLinecap="butt" />
              {/* Centerveld */}
              <circle r="42" fill="rgba(12,24,46,0.95)" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              {/* Pulserende centerstip */}
              <circle cx="0" cy="0" r="5" fill="#E01B41" opacity="0.9" style={sa.centerDot}>
                <animate attributeName="r"       values="5;6.5;5"     dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.85;1;0.85" dur="6s" repeatCount="indefinite" />
              </circle>
              <circle r="15" fill="none" stroke="#E01B41" strokeWidth="0.8" opacity="0.12">
                <animate attributeName="r"       values="15;21;15"       dur="6s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.12;0.04;0.12" dur="6s" repeatCount="indefinite" />
              </circle>
            </g>
          </svg>
        </div>

        {/* Kolom 2, rij 1: Barchart (asset allocatie) */}
        <div style={{ ...s.cell, gridColumn: 2, gridRow: 1, ...sa.hb0 }}>
          <svg viewBox="0 0 240 160" style={s.svg}>
            {/* Bars */}
            <rect x="18"  y="35"  width="28" height="100" rx="2" fill="rgba(224,27,65,0.62)">
              <animate attributeName="opacity" values="0.7;1;0.7" dur="9s" begin="0s"   repeatCount="indefinite" />
            </rect>
            <rect x="60"  y="52"  width="28" height="83"  rx="2" fill="rgba(255,255,255,0.22)">
              <animate attributeName="opacity" values="0.6;1;0.6" dur="9s" begin="1.5s" repeatCount="indefinite" />
            </rect>
            <rect x="102" y="80"  width="28" height="55"  rx="2" fill="rgba(78,213,150,0.38)">
              <animate attributeName="opacity" values="0.65;1;0.65" dur="9s" begin="3s" repeatCount="indefinite" />
            </rect>
            <rect x="144" y="95"  width="28" height="40"  rx="2" fill="rgba(255,255,255,0.18)">
              <animate attributeName="opacity" values="0.55;0.9;0.55" dur="9s" begin="4.5s" repeatCount="indefinite" />
            </rect>
            <rect x="186" y="114" width="28" height="21"  rx="2" fill="rgba(255,255,255,0.13)">
              <animate attributeName="opacity" values="0.5;0.88;0.5" dur="9s" begin="6s" repeatCount="indefinite" />
            </rect>
            {/* Target ticks boven elke bar */}
            <rect x="16"  y="30"  width="32" height="2" rx="1" fill="rgba(224,27,65,0.55)" />
            <rect x="58"  y="46"  width="32" height="2" rx="1" fill="rgba(255,255,255,0.28)" />
            <rect x="100" y="74"  width="32" height="2" rx="1" fill="rgba(78,213,150,0.40)" />
            <rect x="142" y="89"  width="32" height="2" rx="1" fill="rgba(255,255,255,0.22)" />
            <rect x="184" y="108" width="32" height="2" rx="1" fill="rgba(255,255,255,0.17)" />
          </svg>
        </div>

        {/* Kolom 3, rij 1: Lijngrafiek (performance) */}
        <div style={{ ...s.cell, gridColumn: 3, gridRow: 1, ...sa.hb1 }}>
          <svg viewBox="0 0 240 160" style={s.svg}>
            {/* Benchmark — statische stippellijn */}
            <polyline
              points="10,138 50,128 90,120 120,124 155,110 185,103 220,99"
              fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1.2"
              strokeLinejoin="round" strokeDasharray="5 5"
            />
            {/* Portfolio — tekent langzaam in over 14s, blijft staan */}
            <polyline
              points="10,142 50,124 90,108 120,116 155,82 185,60 220,44"
              fill="none" stroke="rgba(78,213,150,0.60)" strokeWidth="2"
              strokeLinejoin="round"
              strokeDasharray="900" strokeDashoffset="900"
              style={sa.lineDraw}
            />
            {/* Einddot verschijnt na tekenen */}
            <circle cx="220" cy="44" r="3.5" fill="rgba(78,213,150,0.85)">
              <animate attributeName="opacity" values="0;0;0.8;0.8" dur="14s" fill="freeze" />
              <animate attributeName="r"       values="3.5;4.5;3.5" dur="5s"  begin="14s" repeatCount="indefinite" />
            </circle>
          </svg>
        </div>

        {/* Kolom 2, rij 2: Currency exposure */}
        <div style={{ ...s.cell, gridColumn: 2, gridRow: 2, ...sa.hb2 }}>
          <svg viewBox="0 0 240 160" style={s.svg}>
            {/* Tracks */}
            <rect x="20" y="30"  width="190" height="9" rx="3" fill="rgba(255,255,255,0.05)" />
            <rect x="20" y="62"  width="190" height="9" rx="3" fill="rgba(255,255,255,0.05)" />
            <rect x="20" y="94"  width="190" height="9" rx="3" fill="rgba(255,255,255,0.05)" />
            <rect x="20" y="126" width="190" height="9" rx="3" fill="rgba(255,255,255,0.05)" />
            {/* Fills — elk met eigen ritme */}
            <rect x="20" y="30"  width="130" height="9" rx="3" fill="rgba(78,213,150,0.48)">
              <animate attributeName="opacity" values="0.65;1;0.65" dur="8s" begin="0s"   repeatCount="indefinite" />
            </rect>
            <rect x="20" y="62"  width="90"  height="9" rx="3" fill="rgba(224,27,65,0.50)">
              <animate attributeName="opacity" values="0.60;1;0.60" dur="8s" begin="2s"   repeatCount="indefinite" />
            </rect>
            <rect x="20" y="94"  width="52"  height="9" rx="3" fill="rgba(255,255,255,0.22)">
              <animate attributeName="opacity" values="0.55;0.90;0.55" dur="8s" begin="4s" repeatCount="indefinite" />
            </rect>
            <rect x="20" y="126" width="28"  height="9" rx="3" fill="rgba(255,255,255,0.14)">
              <animate attributeName="opacity" values="0.50;0.85;0.50" dur="8s" begin="6s" repeatCount="indefinite" />
            </rect>
          </svg>
        </div>

        {/* Kolom 3, rij 2: Top holdings */}
        <div style={{ ...s.cell, gridColumn: 3, gridRow: 2, ...sa.hb3 }}>
          <svg viewBox="0 0 240 160" style={s.svg}>
            {[
              { cy: 22,  dotOpacity: 0.85, barW: 118, valW: 62,  valFill: 'rgba(78,213,150,0.42)',  delay: '0s'   },
              { cy: 44,  dotOpacity: 0.45, barW: 100, valW: 50,  valFill: 'rgba(255,255,255,0.22)', delay: '1.4s' },
              { cy: 66,  dotOpacity: 0.32, barW: 110, valW: 42,  valFill: 'rgba(255,255,255,0.17)', delay: '2.8s' },
              { cy: 88,  dotOpacity: 0.22, barW: 88,  valW: 36,  valFill: 'rgba(255,255,255,0.14)', delay: '4.2s' },
              { cy: 110, dotOpacity: 0.15, barW: 102, valW: 30,  valFill: 'rgba(255,255,255,0.11)', delay: '5.6s' },
              { cy: 132, dotOpacity: 0.10, barW: 76,  valW: 24,  valFill: 'rgba(255,255,255,0.08)', delay: '7.0s' },
            ].map((row, i) => (
              <g key={i}>
                <circle cx="14" cy={row.cy} r="2.5" fill={`rgba(224,27,65,${row.dotOpacity})`}>
                  <animate attributeName="opacity" values={`${row.dotOpacity * 0.7};${row.dotOpacity};${row.dotOpacity * 0.7}`} dur="10s" begin={row.delay} repeatCount="indefinite" />
                </circle>
                <rect x="26" y={row.cy - 6} width={row.barW} height="8" rx="2" fill={`rgba(255,255,255,${row.dotOpacity * 0.55})`}>
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="10s" begin={row.delay} repeatCount="indefinite" />
                </rect>
                <rect x="158" y={row.cy - 6} width={row.valW} height="8" rx="2" fill={row.valFill}>
                  <animate attributeName="opacity" values="0.5;0.9;0.5" dur="10s" begin={row.delay} repeatCount="indefinite" />
                </rect>
                {i < 5 && (
                  <line x1="14" y1={row.cy + 10} x2="224" y2={row.cy + 10} stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
                )}
              </g>
            ))}
          </svg>
        </div>

      </div>
    </div>
  )
}

/* ── Statische stijlen ────────────────────────────────────────────────────── */

const s = {
  container: {
    width: '100%', height: '100%',
    background: '#0C182E',
    display: 'flex', flexDirection: 'column',
    padding: '20px 40px 14px',
    position: 'relative', overflow: 'hidden',
  },
  grid: {
    position: 'absolute', inset: 0,
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)
    `,
    backgroundSize: '72px 72px',
    pointerEvents: 'none', zIndex: 0,
  },
  header: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    position: 'relative', zIndex: 1, flexShrink: 0,
  },
  logoWrap: {
    display: 'flex', alignItems: 'center',
    minWidth: '220px',
  },
  logo: {
    height: '44px',
    width: 'auto', objectFit: 'contain',
  },
  fallbackIo: {
    fontFamily: "'Merriweather', serif",
    fontSize: '2.2rem', fontWeight: 700,
    color: '#fff', letterSpacing: '-0.05em',
  },
  fallbackSep: {
    display: 'inline-block',
    width: '1px', height: '22px',
    background: 'rgba(255,255,255,0.28)',
    margin: '0 8px',
  },
  fallbackText: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '0.75rem', color: 'rgba(255,255,255,0.55)',
  },
  dashboardTitle: {
    fontFamily: "'Merriweather Sans', sans-serif",
    fontSize: '1.05rem', fontWeight: 800,
    color: '#FFFFFF',
    letterSpacing: '0.04em',
    textAlign: 'right',
  },
  redLine: {
    height: '2px',
    background: 'linear-gradient(90deg, #E01B41 0%, rgba(224,27,65,0.22) 65%, transparent 100%)',
    marginBottom: '16px',
    flexShrink: 0, position: 'relative', zIndex: 1,
    animation: 'idleRedPulse 6s ease-in-out infinite',
  },
  body: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '20px',
    minHeight: 0,
    position: 'relative', zIndex: 1,
  },
  cell: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: 0, minWidth: 0,
  },
  svg: {
    display: 'block', width: '100%', height: '100%',
    overflow: 'visible',
  },
}

/* ── Animatiestijlen (inline, via style-attribuut) ────────────────────────── */

const sa = {
  outerRing: {
    animation: 'idleOuterRing 120s linear infinite',
    transformOrigin: '0 0',
  },
  centerDot: {
    // puls via SVG animate-elementen, geen CSS nodig
  },
  lineDraw: {
    animation: 'idleLineDraw 14s ease-in-out forwards',
  },
  // Hartslag per cel — staggered
  hb0: { animation: 'idleHb 9s ease-in-out infinite 0s'   },
  hb1: { animation: 'idleHb 9s ease-in-out infinite 2s'   },
  hb2: { animation: 'idleHb 9s ease-in-out infinite 4s'   },
  hb3: { animation: 'idleHb 9s ease-in-out infinite 6s'   },
}
