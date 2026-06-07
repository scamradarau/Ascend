// Medieval MMORPG backdrop for the Rune theme — distant castle, rolling
// plains, drifting clouds and a couple of banners. Pure SVG, fixed behind
// the UI. Only rendered when the Rune theme is active.
export default function RuneScenery() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* sky gradient */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #2a1c10 0%, #3b2613 30%, #5a3a1b 62%, #6b4a22 100%)',
        }}
      />
      {/* sun haze */}
      <div
        className="absolute left-1/2 top-[12%] h-72 w-72 -translate-x-1/2 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(255,210,120,0.35), transparent 60%)' }}
      />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1440 800">
        <defs>
          <linearGradient id="hillFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#4e6b3a" />
            <stop offset="1" stopColor="#3a5230" />
          </linearGradient>
          <linearGradient id="hillNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#3c5a2c" />
            <stop offset="1" stopColor="#26401c" />
          </linearGradient>
          <linearGradient id="castle" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a6a55" />
            <stop offset="1" stopColor="#4a3f33" />
          </linearGradient>
        </defs>

        {/* clouds */}
        <g fill="#f3e7c9" opacity="0.18">
          <ellipse cx="280" cy="150" rx="120" ry="34" />
          <ellipse cx="380" cy="135" rx="90" ry="28" />
          <ellipse cx="1100" cy="120" rx="140" ry="36" />
          <ellipse cx="1000" cy="140" rx="80" ry="24" />
        </g>

        {/* distant castle on a hill */}
        <g opacity="0.5">
          <path d="M560 470 Q720 360 880 470 L880 520 L560 520 Z" fill="url(#hillFar)" />
          <g fill="url(#castle)" stroke="#2c2419" strokeWidth="2">
            {/* keep + towers */}
            <rect x="675" y="378" width="90" height="92" />
            <rect x="640" y="360" width="30" height="110" />
            <rect x="770" y="360" width="30" height="110" />
            <rect x="700" y="345" width="42" height="40" />
            {/* battlements */}
            {[640, 652, 664, 700, 712, 724, 770, 782, 794].map((x, i) => (
              <rect key={i} x={x} y={i % 3 === 0 ? 352 : 370} width="10" height="10" />
            ))}
            {/* gate */}
            <path d="M705 470 L705 440 Q720 425 735 440 L735 470 Z" fill="#241d14" />
          </g>
          {/* flags */}
          <g fill="#b3402a">
            <path d="M655 360 L655 340 L675 348 L655 356 Z" />
            <path d="M785 360 L785 340 L805 348 L785 356 Z" />
          </g>
        </g>

        {/* rolling plains */}
        <path d="M0 560 Q360 480 720 540 T1440 520 L1440 800 L0 800 Z" fill="url(#hillFar)" />
        <path d="M0 640 Q420 560 840 620 T1440 600 L1440 800 L0 800 Z" fill="url(#hillNear)" />
        <path d="M0 720 Q500 670 980 710 T1440 700 L1440 800 L0 800 Z" fill="#1c3014" />

        {/* foreground banners */}
        <g stroke="#3a2a16" strokeWidth="4">
          <line x1="120" y1="800" x2="120" y2="600" />
          <path d="M120 605 L185 605 L172 640 L185 675 L120 675 Z" fill="#7a1f1f" stroke="#3a1010" strokeWidth="2" />
          <line x1="1320" y1="800" x2="1320" y2="600" />
          <path d="M1320 605 L1255 605 L1268 640 L1255 675 L1320 675 Z" fill="#1f3a5a" stroke="#10202f" strokeWidth="2" />
        </g>
      </svg>

      {/* darken bottom for legibility */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(20,13,7,0.1) 0%, rgba(20,13,7,0.55) 70%, rgba(16,10,5,0.85) 100%)' }}
      />
    </div>
  )
}
