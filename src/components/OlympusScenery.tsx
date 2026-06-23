// Olympus backdrop - a "Temple of Time" sky: luminous aurora, a great moon,
// floating marble temples with columns & pediments, and rolling clouds.
// Fixed behind the dark "marble glass" UI. Only rendered for the Olympus theme.

function Temple({ x, y, s = 1, op = 1 }: { x: number; y: number; s?: number; op?: number }) {
  // a small Greek temple: stylobate, columns, entablature, pediment
  const cols = [0, 18, 36, 54, 72, 90]
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={op}>
      {/* pediment (triangle) */}
      <path d="M-6 -8 L48 -34 L102 -8 Z" fill="url(#marble)" stroke="#9fb0c4" strokeWidth="1" />
      <path d="M2 -8 L48 -30 L94 -8 Z" fill="#eef3f9" opacity="0.5" />
      {/* entablature */}
      <rect x="-6" y="-8" width="108" height="12" fill="url(#marble)" stroke="#9fb0c4" strokeWidth="0.8" />
      {/* columns */}
      {cols.map((cx, i) => (
        <g key={i}>
          <rect x={cx} y="4" width="9" height="56" fill="url(#column)" />
          <rect x={cx - 1} y="4" width="11" height="4" fill="#e7eef6" />
          <rect x={cx - 1} y="58" width="11" height="4" fill="#cdd8e6" />
        </g>
      ))}
      {/* base */}
      <rect x="-10" y="60" width="116" height="8" fill="url(#marble)" stroke="#9fb0c4" strokeWidth="0.8" />
      <rect x="-16" y="68" width="128" height="6" fill="#c4d0e0" />
    </g>
  )
}

export default function OlympusScenery() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* sky - a richer, golden-hour aegean blue (dimmer than midday so the
          dark glass panels and white text stay readable over it) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #173f63 0%, #275f88 32%, #356f96 60%, #2c5e80 100%)',
        }}
      />

      {/* aurora ribbons (like the Temple of Time sky) */}
      <div className="absolute inset-0">
        {[
          { left: '6%', hue: 'rgba(120,230,180,0.45)', d: '0s' },
          { left: '14%', hue: 'rgba(120,210,230,0.40)', d: '1.5s' },
          { left: '22%', hue: 'rgba(170,235,200,0.35)', d: '0.8s' },
        ].map((a, i) => (
          <div
            key={i}
            className="absolute top-[-10%] h-[70%] w-24 animate-pulseGlow blur-2xl"
            style={{
              left: a.left,
              background: `linear-gradient(180deg, ${a.hue}, transparent)`,
              transform: 'skewX(-12deg)',
              animationDelay: a.d,
            }}
          />
        ))}
      </div>

      {/* great moon */}
      <div
        className="absolute right-[8%] top-[6%] h-56 w-56 rounded-full"
        style={{
          background: 'radial-gradient(circle at 38% 36%, #ffffff, #dbe9f2 55%, #b7cfe0 100%)',
          boxShadow: '0 0 120px rgba(255,255,255,0.55)',
          opacity: 0.85,
        }}
      />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1440 820">
        <defs>
          <linearGradient id="marble" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#cdd8e6" />
          </linearGradient>
          <linearGradient id="column" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#d7e0ec" />
            <stop offset="45%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#c4d0e0" />
          </linearGradient>
          <radialGradient id="cloudG" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe9a8" />
            <stop offset="100%" stopColor="#caa93a" />
          </linearGradient>
        </defs>

        {/* high clouds */}
        <g fill="url(#cloudG)">
          <ellipse cx="280" cy="150" rx="160" ry="46" />
          <ellipse cx="1080" cy="120" rx="180" ry="48" />
          <ellipse cx="720" cy="90" rx="130" ry="38" />
        </g>

        {/* floating temples */}
        <Temple x={120} y={420} s={1.1} op={0.96} />
        <Temple x={980} y={300} s={0.9} op={0.9} />
        <Temple x={560} y={250} s={0.7} op={0.8} />

        {/* small distant isles */}
        <g opacity="0.7">
          <ellipse cx="430" cy="500" rx="90" ry="20" fill="url(#marble)" />
          <ellipse cx="1180" cy="470" rx="70" ry="16" fill="url(#marble)" />
        </g>

        {/* low cloud sea */}
        <g>
          <path d="M0 560 Q240 520 480 555 T960 545 T1440 555 L1440 820 L0 820 Z" fill="#ffffff" opacity="0.85" />
          <path d="M0 620 Q300 585 620 615 T1200 605 T1440 615 L1440 820 L0 820 Z" fill="#eef6fb" />
          <path d="M0 690 Q360 660 760 690 T1440 685 L1440 820 L0 820 Z" fill="#dcecf5" />
        </g>

        {/* marble ledge (foreground platform) */}
        <rect x="0" y="752" width="1440" height="68" fill="url(#marble)" />
        <rect x="0" y="752" width="1440" height="8" fill="#ffffff" opacity="0.7" />
        {Array.from({ length: 36 }).map((_, i) => (
          <rect key={i} x={i * 40} y="760" width="2" height="60" fill="#b9c6d8" opacity="0.6" />
        ))}
      </svg>

      {/* dark veil so the dark-glass panels and white text read clearly while
          the temples, moon and aurora still show through */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(7,12,30,0.50) 0%, rgba(7,12,30,0.42) 45%, rgba(7,12,30,0.62) 100%)',
        }}
      />
    </div>
  )
}
