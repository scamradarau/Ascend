// Rune backdrop - a lush mystic-jade vista: misty cliffs, a ruined temple
// with columns and a broken arch, waterfalls, cherry-blossom & autumn foliage,
// layered fog and drifting blue spirit-lights. Fixed behind the dark glass UI.

export default function RuneScenery() {
  // deterministic-ish spirit motes
  const motes = [
    { l: '14%', t: '62%', d: '0s', s: 6 },
    { l: '22%', t: '74%', d: '1.1s', s: 4 },
    { l: '30%', t: '55%', d: '2.2s', s: 5 },
    { l: '44%', t: '70%', d: '0.6s', s: 7 },
    { l: '52%', t: '60%', d: '1.7s', s: 4 },
    { l: '63%', t: '76%', d: '2.6s', s: 6 },
    { l: '71%', t: '58%', d: '0.9s', s: 5 },
    { l: '83%', t: '70%', d: '1.9s', s: 7 },
    { l: '38%', t: '48%', d: '3s', s: 3 },
    { l: '58%', t: '46%', d: '2.1s', s: 3 },
  ]

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* hazy sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 520px at 58% 2%, rgba(236,226,206,0.35), transparent 60%), linear-gradient(180deg, #3a4042 0%, #2c3a38 45%, #182422 100%)',
        }}
      />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMax slice" viewBox="0 0 1440 820">
        <defs>
          <linearGradient id="rMountFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a5d5a" />
            <stop offset="100%" stopColor="#344744" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="rCliff" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a4a44" />
            <stop offset="100%" stopColor="#16201d" />
          </linearGradient>
          <linearGradient id="rStone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#cdd6d2" />
            <stop offset="100%" stopColor="#6b7a76" />
          </linearGradient>
          <linearGradient id="rFall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(220,240,238,0.0)" />
            <stop offset="30%" stopColor="rgba(220,240,238,0.7)" />
            <stop offset="100%" stopColor="rgba(220,240,238,0.15)" />
          </linearGradient>
          <radialGradient id="rSun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,236,214,0.55)" />
            <stop offset="100%" stopColor="rgba(245,236,214,0)" />
          </radialGradient>
        </defs>

        {/* soft sun bloom */}
        <ellipse cx="840" cy="60" rx="360" ry="200" fill="url(#rSun)" />

        {/* distant hazy mountains */}
        <path d="M0 360 Q300 250 560 330 T1080 300 T1440 340 L1440 520 L0 520 Z" fill="url(#rMountFar)" opacity="0.5" />
        <path d="M0 430 Q360 330 760 400 T1440 380 L1440 560 L0 560 Z" fill="url(#rMountFar)" opacity="0.35" />

        {/* central cliff with ruined temple */}
        <g>
          {/* cliff mass */}
          <path d="M520 300 L900 300 L940 560 Q730 600 540 560 Z" fill="url(#rCliff)" />
          {/* broken arch */}
          <path d="M610 300 Q620 232 690 230 Q760 232 770 300 L752 300 Q744 252 690 250 Q636 252 628 300 Z" fill="url(#rStone)" stroke="#5a6864" strokeWidth="1.5" />
          {/* standing columns */}
          {[800, 832, 864].map((x, i) => (
            <g key={i}>
              <rect x={x} y="206" width="14" height="96" fill="url(#rStone)" />
              <rect x={x - 2} y="200" width="18" height="7" fill="#e6ece9" />
            </g>
          ))}
          <rect x="794" y="196" width="84" height="8" fill="url(#rStone)" />
          {/* waterfalls off the cliff */}
          <rect x="560" y="300" width="26" height="260" fill="url(#rFall)" />
          <rect x="890" y="300" width="30" height="270" fill="url(#rFall)" />
        </g>

        {/* foreground cliffs with foliage */}
        <path d="M0 470 Q150 420 300 470 L320 820 L0 820 Z" fill="url(#rCliff)" />
        <path d="M1180 430 Q1320 400 1440 460 L1440 820 L1140 820 Z" fill="url(#rCliff)" />
        {/* autumn + blossom foliage clumps */}
        {[
          ['#c66a3a', 120, 452], ['#d98a3a', 200, 470], ['#e891b0', 250, 448],
          ['#5a7d52', 60, 480], ['#e891b0', 1240, 430], ['#c66a3a', 1320, 452],
          ['#5a7d52', 1390, 470], ['#d98a3a', 1190, 460],
        ].map(([c, x, y], i) => (
          <ellipse key={i} cx={x as number} cy={y as number} rx="40" ry="22" fill={c as string} opacity="0.7" />
        ))}

        {/* mist bands for depth */}
        <path d="M0 540 Q360 510 760 540 T1440 535 L1440 600 L0 600 Z" fill="#dfeae8" opacity="0.16" />
        <path d="M0 640 Q420 605 860 640 T1440 632 L1440 720 L0 720 Z" fill="#dfeae8" opacity="0.22" />
        <path d="M0 730 Q380 700 820 732 T1440 726 L1440 820 L0 820 Z" fill="#cfdedb" opacity="0.3" />
      </svg>

      {/* drifting spirit-lights */}
      {motes.map((m, i) => (
        <div
          key={i}
          className="absolute animate-floaty rounded-full"
          style={{
            left: m.l,
            top: m.t,
            width: m.s,
            height: m.s,
            background: 'radial-gradient(circle, #d6fbff, #5fd3e0)',
            boxShadow: '0 0 10px 2px rgba(95,211,224,0.7)',
            animationDelay: m.d,
            opacity: 0.85,
          }}
        />
      ))}

      {/* gentle veil so the dark glass panels & white text read clearly */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(10,20,20,0.42) 0%, rgba(10,20,20,0.34) 45%, rgba(10,20,20,0.56) 100%)',
        }}
      />
    </div>
  )
}
