// Animated cosmic backdrop for the Cosmos theme — nebula clouds, a ringed
// planet, a moon, layered twinkling stars, drifting shooting stars, a faint
// constellation and a horizon glow. Pure CSS/SVG, fixed behind the UI.
export default function CosmosScenery({ contained = false }: { contained?: boolean }) {
  return (
    <div
      className={`pointer-events-none ${contained ? 'absolute' : 'fixed'} inset-0 z-0 overflow-hidden`}
    >
      {/* deep space base */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1200px 800px at 50% -10%, #10183a 0%, transparent 60%), linear-gradient(180deg, #060a1a 0%, #04060f 100%)',
        }}
      />

      {/* nebula clouds */}
      <div
        className="absolute -left-32 top-[8%] h-[28rem] w-[28rem] rounded-full blur-3xl animate-pulseGlow"
        style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.30), transparent 65%)' }}
      />
      <div
        className="absolute -right-24 top-[28%] h-[26rem] w-[26rem] rounded-full blur-3xl animate-pulseGlow"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.26), transparent 65%)', animationDelay: '1.2s' }}
      />
      <div
        className="absolute bottom-[-6rem] left-[30%] h-[30rem] w-[30rem] rounded-full blur-3xl animate-pulseGlow"
        style={{ background: 'radial-gradient(circle, rgba(236,72,153,0.18), transparent 65%)', animationDelay: '2.4s' }}
      />

      {/* star layers */}
      <div className="starfield absolute inset-0" />

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1440 900">
        <defs>
          <radialGradient id="planetBody" cx="38%" cy="34%" r="75%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="42%" stopColor="#6d52c9" />
            <stop offset="100%" stopColor="#160c2e" />
          </radialGradient>
          <radialGradient id="planetShadow" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="transparent" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
          </radialGradient>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(124,252,0,0)" />
            <stop offset="50%" stopColor="rgba(124,252,0,0.55)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <radialGradient id="moon" cx="38%" cy="36%" r="70%">
            <stop offset="0%" stopColor="#dfe7ff" />
            <stop offset="100%" stopColor="#5a6790" />
          </radialGradient>
        </defs>

        {/* ringed planet, top-right, partly off screen */}
        <g transform="translate(1230 150)" opacity="0.55">
          <ellipse cx="0" cy="0" rx="200" ry="46" fill="none" stroke="url(#ring)" strokeWidth="10" transform="rotate(-22)" />
          <circle cx="0" cy="0" r="96" fill="url(#planetBody)" />
          <circle cx="0" cy="0" r="96" fill="url(#planetShadow)" />
          <ellipse cx="0" cy="0" rx="200" ry="46" fill="none" stroke="url(#ring)" strokeWidth="4" transform="rotate(-22)" opacity="0.6" />
        </g>

        {/* small moon, left */}
        <g opacity="0.5">
          <circle cx="170" cy="520" r="34" fill="url(#moon)" />
          <circle cx="158" cy="510" r="6" fill="rgba(0,0,0,0.15)" />
          <circle cx="182" cy="528" r="4" fill="rgba(0,0,0,0.15)" />
        </g>

        {/* faint constellation */}
        <g stroke="rgba(180,210,255,0.4)" strokeWidth="1" fill="#cfe5ff">
          <polyline points="300,180 360,150 420,200 500,170 560,230" fill="none" />
          {[
            [300, 180], [360, 150], [420, 200], [500, 170], [560, 230],
          ].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" className="animate-twinkle" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>

        {/* horizon glow */}
        <rect x="0" y="820" width="1440" height="80" fill="url(#planetBody)" opacity="0.06" />
      </svg>

      {/* shooting stars (CSS-driven divs for reliable cross-viewport motion) */}
      <div className="shooting-star ss1" />
      <div className="shooting-star ss2" />

      {/* vignette for legibility */}
      <div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(120% 90% at 50% 30%, transparent 55%, rgba(4,6,15,0.7) 100%)' }}
      />
    </div>
  )
}
