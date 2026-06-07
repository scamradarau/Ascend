import { useId } from 'react'
import type { AvatarConfig } from '../data/cosmetics'

// ================================================================
// Avatar — a layered, procedural SVG bust.
//   frame ring  ←  aura/particles  ←  energy body  ←  helmet
// Helmets, auras, frames and skins all come from the player's
// AvatarConfig and evolve with achievement.
// ================================================================

const SKIN_COLORS: Record<string, [string, string]> = {
  cyan: ['#22d3ee', '#0ea5b7'],
  violet: ['#a855f7', '#7c3aed'],
  emerald: ['#34d399', '#059669'],
  crimson: ['#fb7185', '#e11d48'],
  aurora: ['#22d3ee', '#a855f7'],
}

const AURA_COLORS: Record<string, string> = {
  none: 'transparent',
  spark: '#9ad8ff',
  ember: '#ff7a18',
  frost: '#7dd3fc',
  void: '#7c3aed',
  solar: '#fbbf24',
  phoenix: '#ff4d1c',
}

const FRAME_COLORS: Record<string, string> = {
  basic: '#3a4a78',
  bronze: '#b08d57',
  cyan: '#22d3ee',
  gold: '#fbbf24',
  prism: 'url(#prismFrame)',
}

export default function Avatar({
  config,
  size = 260,
  animated = true,
}: {
  config: AvatarConfig
  size?: number
  animated?: boolean
}) {
  const uid = useId().replace(/:/g, '')
  const [c1, c2] = SKIN_COLORS[config.skin] ?? SKIN_COLORS.cyan
  const aura = AURA_COLORS[config.aura] ?? 'transparent'
  const frame = FRAME_COLORS[config.frame] ?? FRAME_COLORS.basic
  const hasAura = config.aura !== 'none'

  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      style={{ maxWidth: '100%', height: 'auto' }}
      className="select-none"
    >
      <defs>
        <radialGradient id={`body-${uid}`} cx="50%" cy="38%" r="70%">
          <stop offset="0%" stopColor={c1} stopOpacity="0.95" />
          <stop offset="60%" stopColor={c2} stopOpacity="0.7" />
          <stop offset="100%" stopColor="#05070f" stopOpacity="0.9" />
        </radialGradient>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={aura} stopOpacity="0.55" />
          <stop offset="70%" stopColor={aura} stopOpacity="0.12" />
          <stop offset="100%" stopColor={aura} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="prismFrame" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>
        <linearGradient id={`metal-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7ecff" />
          <stop offset="45%" stopColor="#9fb0d8" />
          <stop offset="100%" stopColor="#4a5b86" />
        </linearGradient>
        <linearGradient id={`gold-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#f4c542" />
          <stop offset="100%" stopColor="#b07e1a" />
        </linearGradient>
      </defs>

      {/* aura */}
      {hasAura && (
        <>
          <circle cx="100" cy="100" r="92" fill={`url(#aura-${uid})`} className={animated ? 'animate-pulseGlow' : ''} />
          {(config.aura === 'phoenix' || config.aura === 'solar' || config.aura === 'void') &&
            [...Array(10)].map((_, i) => {
              const a = (i / 10) * Math.PI * 2
              return (
                <circle
                  key={i}
                  cx={100 + Math.cos(a) * 78}
                  cy={100 + Math.sin(a) * 78}
                  r={2.4}
                  fill={aura}
                  opacity={0.8}
                  className={animated ? 'animate-twinkle' : ''}
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              )
            })}
        </>
      )}

      {/* frame ring */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke={frame}
        strokeWidth={config.frame === 'basic' ? 2 : 4}
        opacity={0.85}
      />
      {config.frame !== 'basic' && (
        <circle cx="100" cy="100" r="84" fill="none" stroke={frame} strokeWidth="1" opacity={0.4} />
      )}
      {/* frame ticks for fancier frames */}
      {(config.frame === 'cyan' || config.frame === 'gold' || config.frame === 'prism') &&
        [...Array(24)].map((_, i) => {
          const a = (i / 24) * Math.PI * 2
          return (
            <line
              key={i}
              x1={100 + Math.cos(a) * 88}
              y1={100 + Math.sin(a) * 88}
              x2={100 + Math.cos(a) * 92}
              y2={100 + Math.sin(a) * 92}
              stroke={frame}
              strokeWidth="1.5"
              opacity="0.6"
            />
          )
        })}

      {/* clip the bust inside the ring */}
      <clipPath id={`clip-${uid}`}>
        <circle cx="100" cy="100" r="82" />
      </clipPath>
      <g clipPath={`url(#clip-${uid})`}>
        <rect x="18" y="18" width="164" height="164" fill="#05070f" />

        {/* torso / armoured chest */}
        <path d="M48 188 Q100 128 152 188 Z" fill={`url(#body-${uid})`} opacity="0.95" />
        <path d="M48 188 Q100 128 152 188 Z" fill="none" stroke={c1} strokeOpacity="0.5" strokeWidth="1.5" />
        {/* chest armour plate seams */}
        <path d="M100 126 L100 188 M76 150 Q100 162 124 150 M70 172 Q100 186 130 172" fill="none" stroke={c1} strokeOpacity="0.4" strokeWidth="1.5" />

        {/* pauldrons (shoulder armour) */}
        <path d="M40 176 Q44 138 78 140 Q70 158 70 180 Z" fill={`url(#body-${uid})`} stroke={c1} strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M160 176 Q156 138 122 140 Q130 158 130 180 Z" fill={`url(#body-${uid})`} stroke={c1} strokeOpacity="0.55" strokeWidth="1.5" />
        <path d="M46 168 Q52 150 70 150 M154 168 Q148 150 130 150" fill="none" stroke={c1} strokeOpacity="0.35" strokeWidth="1.2" />

        {/* neck + collar */}
        <rect x="89" y="98" width="22" height="24" rx="8" fill={`url(#body-${uid})`} />
        <path d="M78 124 Q100 116 122 124" fill="none" stroke={c1} strokeOpacity="0.5" strokeWidth="2" />

        {/* head */}
        <ellipse cx="100" cy="78" rx="29" ry="33" fill={`url(#body-${uid})`} stroke={c1} strokeOpacity="0.55" strokeWidth="1.5" />
        {/* cheek/jaw contour */}
        <path d="M76 84 Q82 104 100 108 Q118 104 124 84" fill="none" stroke={c1} strokeOpacity="0.3" strokeWidth="1.2" />
        {/* glowing eyes */}
        <circle cx="90" cy="80" r="3.2" fill="#ffffff" />
        <circle cx="110" cy="80" r="3.2" fill="#ffffff" />
        <circle cx="90" cy="80" r="5.5" fill={c1} opacity="0.35" />
        <circle cx="110" cy="80" r="5.5" fill={c1} opacity="0.35" />

        {/* chest core emblem (rank gem) */}
        <g>
          <circle cx="100" cy="150" r="8" fill="#05070f" stroke={c1} strokeOpacity="0.6" strokeWidth="1.5" />
          <circle cx="100" cy="150" r="4.5" fill="#7CFC00" className={animated ? 'animate-pulseGlow' : ''} />
        </g>
      </g>

      {/* helmet on top */}
      <Helmet id={config.helmet} uid={uid} c1={c1} animated={animated} />
    </svg>
  )
}

function Helmet({
  id,
  uid,
  c1,
  animated,
}: {
  id: string
  uid: string
  c1: string
  animated: boolean
}) {
  const metal = `url(#metal-${uid})`
  switch (id) {
    case 'hood':
      return (
        <g>
          <path d="M62 78 Q66 40 100 38 Q134 40 138 78 Q120 58 100 58 Q80 58 62 78 Z" fill="#3a2f55" stroke="#1c1630" strokeWidth="2" />
          <path d="M70 70 Q100 50 130 70" fill="none" stroke="#5a4b86" strokeWidth="2" />
        </g>
      )
    case 'circlet':
      return (
        <g>
          <path d="M70 64 Q100 54 130 64" fill="none" stroke="#cbb56b" strokeWidth="4" strokeLinecap="round" />
          <circle cx="100" cy="58" r="4.5" fill="#22d3ee" className={animated ? 'animate-pulseGlow' : ''} />
        </g>
      )
    case 'knight':
      return (
        <g stroke="#2a3556" strokeWidth="2">
          <path d="M64 70 Q64 40 100 38 Q136 40 136 70 L132 86 Q100 78 68 86 Z" fill={metal} />
          <rect x="84" y="60" width="32" height="6" rx="3" fill="#0b1020" stroke="none" />
          <rect x="96" y="44" width="8" height="40" rx="3" fill="#0b1020" stroke="none" />
          <path d="M64 70 Q100 60 136 70" fill="none" stroke="#dfe7ff" strokeWidth="1" />
        </g>
      )
    case 'ranger':
      return (
        <g stroke="#1f3a2f" strokeWidth="2">
          <path d="M66 66 Q100 44 134 66 L138 74 L126 78 Q100 66 74 78 L62 74 Z" fill="#2f6f52" />
          <rect x="80" y="66" width="40" height="7" rx="3.5" fill="#0b1020" stroke="none" />
          <path d="M62 74 L48 64 M138 74 L152 64" stroke="#3f8f6a" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case 'samurai':
      return (
        <g stroke="#2a1a1a" strokeWidth="2">
          <path d="M62 76 Q62 42 100 40 Q138 42 138 76 Q100 64 62 76 Z" fill="#6b1f1f" />
          <path d="M62 76 L52 96 Q60 100 70 92 M138 76 L148 96 Q140 100 130 92" fill="#4a1414" />
          {/* maedate crest */}
          <path d="M86 44 Q100 18 114 44 Q100 36 86 44 Z" fill={`url(#gold-${uid})`} stroke="#7a5314" />
          <rect x="84" y="62" width="32" height="6" rx="3" fill="#1a0c0c" stroke="none" />
        </g>
      )
    case 'mage':
      return (
        <g>
          <path d="M64 74 Q70 26 100 22 Q130 26 136 74 Q100 60 64 74 Z" fill="#2b2150" stroke="#150f2c" strokeWidth="2" />
          <path d="M100 22 Q96 46 100 60" stroke="#a855f7" strokeWidth="2" fill="none" />
          <circle cx="100" cy="40" r="5" fill="#a855f7" className={animated ? 'animate-pulseGlow' : ''} />
        </g>
      )
    case 'warlord':
      return (
        <g stroke="#5a3a0a" strokeWidth="2">
          <path d="M62 74 Q62 44 100 42 Q138 44 138 74 Q100 62 62 74 Z" fill={`url(#gold-${uid})`} />
          {/* crown spikes */}
          <path d="M64 50 L58 26 L74 44 L84 22 L94 44 L100 18 L106 44 L116 22 L126 44 L142 26 L136 50 Z" fill={`url(#gold-${uid})`} />
          {[58, 84, 100, 116, 142].map((x, i) => (
            <circle key={i} cx={x} cy={i % 2 ? 30 : 26} r="3" fill="#ff4d6d" />
          ))}
          <rect x="84" y="60" width="32" height="6" rx="3" fill="#3a2606" stroke="none" />
        </g>
      )
    case 'ascendant':
      return (
        <g>
          <ellipse cx="100" cy="40" rx="34" ry="9" fill="none" stroke="#fff6c8" strokeWidth="3" className={animated ? 'animate-pulseGlow' : ''} />
          <ellipse cx="100" cy="40" rx="34" ry="9" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <circle key={i} cx={100 + Math.cos(a) * 34} cy={40 + Math.sin(a) * 9} r="1.8" fill="#fff" />
          })}
        </g>
      )
    case 'phoenix':
      return (
        <g>
          <path d="M62 74 Q62 46 100 44 Q138 46 138 74 Q100 62 62 74 Z" fill="#2a0d06" stroke="#160603" strokeWidth="2" />
          <path d="M100 44 Q88 20 100 8 Q112 20 100 44" fill="#ff7a18" className={animated ? 'animate-pulseGlow' : ''} />
          <path d="M78 50 Q66 30 60 38 Q70 44 78 56 M122 50 Q134 30 140 38 Q130 44 122 56" fill="#ff4d1c" />
          <circle cx="100" cy="30" r="3" fill="#ffd166" />
        </g>
      )
    case 'none':
    default:
      // bare — a subtle energy band
      return <path d="M74 62 Q100 56 126 62" fill="none" stroke={c1} strokeWidth="2" opacity="0.4" />
  }
}
