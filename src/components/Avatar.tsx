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
        <linearGradient id={`iron-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5b6378" />
          <stop offset="55%" stopColor="#363c4d" />
          <stop offset="100%" stopColor="#181c27" />
        </linearGradient>
        <linearGradient id={`bronze-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e8b878" />
          <stop offset="45%" stopColor="#c08a3e" />
          <stop offset="100%" stopColor="#7a4f1c" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* aura — a glowing halo ring + orbiting motes that bloom OUTSIDE the
          bust (which is otherwise opaque and would hide a centred glow) */}
      {hasAura && (
        <g>
          {/* soft outer field */}
          <circle cx="100" cy="100" r="99" fill={`url(#aura-${uid})`} className={animated ? 'animate-pulseGlow' : ''} />
          {/* bright halo ring that blooms past the frame */}
          <circle
            cx="100"
            cy="100"
            r="95"
            fill="none"
            stroke={aura}
            strokeWidth="5"
            opacity="0.6"
            filter={`url(#glow-${uid})`}
            className={animated ? 'animate-pulseGlow' : ''}
          />
          {/* orbiting motes for every aura */}
          {[...Array(14)].map((_, i) => {
            const a = (i / 14) * Math.PI * 2
            return (
              <circle
                key={i}
                cx={100 + Math.cos(a) * 96}
                cy={100 + Math.sin(a) * 96}
                r={i % 3 === 0 ? 2.8 : 1.8}
                fill={aura}
                opacity={0.85}
                filter={`url(#glow-${uid})`}
                className={animated ? 'animate-twinkle' : ''}
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            )
          })}
        </g>
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
  const iron = `url(#iron-${uid})`
  const gold = `url(#gold-${uid})`
  const bronze = `url(#bronze-${uid})`
  const pulse = animated ? 'animate-pulseGlow' : ''

  // Glowing eyes that read THROUGH a helmet's slot/openings. Drawn on top of
  // the (face-covering) helmet so the gaze still glows. Positions match the
  // head's eyes below (≈x90/110, y80).
  const SlotEyes = ({ y = 80, lx = 89, rx = 111 }: { y?: number; lx?: number; rx?: number }) => (
    <g>
      <circle cx={lx} cy={y} r="5.2" fill={c1} opacity="0.4" className={pulse} />
      <circle cx={rx} cy={y} r="5.2" fill={c1} opacity="0.4" className={pulse} />
      <circle cx={lx} cy={y} r="2.5" fill="#ffffff" />
      <circle cx={rx} cy={y} r="2.5" fill="#ffffff" />
    </g>
  )

  switch (id) {
    // ---- Initiate Hood: cloth cowl that frames & shadows the face ----
    case 'hood':
      return (
        <g>
          {/* outer hood draping down both sides of the face */}
          <path d="M58 112 Q50 44 100 36 Q150 44 142 112 Q138 96 130 92 L130 70 Q116 58 100 58 Q84 58 70 70 L70 92 Q62 96 58 112 Z" fill="#3a2f55" stroke="#1c1630" strokeWidth="2" />
          {/* inner shadow over the upper face */}
          <path d="M72 70 Q100 56 128 70 Q126 86 100 90 Q74 86 72 70 Z" fill="#0c0a18" opacity="0.85" />
          <path d="M70 68 Q100 50 130 68" fill="none" stroke="#5a4b86" strokeWidth="2" />
          <SlotEyes y={78} />
        </g>
      )
    // ---- Focus Circlet: light band, face stays open ----
    case 'circlet':
      return (
        <g>
          <path d="M70 62 Q100 50 130 62" fill="none" stroke="#cbb56b" strokeWidth="4" strokeLinecap="round" />
          <path d="M74 60 Q100 50 126 60" fill="none" stroke="#fff0c0" strokeWidth="1.2" />
          <circle cx="100" cy="55" r="4.5" fill="#22d3ee" className={pulse} />
        </g>
      )
    // ---- Knight: fully-closed great-helm with vision slit ----
    case 'knight':
      return (
        <g stroke="#2a3556" strokeWidth="2">
          {/* bucket helm covering the whole head */}
          <path d="M66 60 Q64 36 100 34 Q136 36 134 60 L134 100 Q134 112 120 114 L80 114 Q66 112 66 100 Z" fill={metal} />
          {/* crown band + rivets */}
          <path d="M66 60 Q100 50 134 60" fill="none" stroke="#dfe7ff" strokeWidth="1.5" />
          {[72, 86, 100, 114, 128].map((x, i) => (
            <circle key={i} cx={x} cy={58} r="1.6" fill="#dfe7ff" stroke="none" />
          ))}
          {/* central reinforcement rib */}
          <rect x="96" y="44" width="8" height="68" rx="3" fill="#0b1020" stroke="none" opacity="0.7" />
          {/* vision slit */}
          <rect x="72" y="76" width="56" height="8" rx="3" fill="#04060d" stroke="none" />
          {/* breath holes */}
          {[84, 92, 108, 116].map((x, i) => (
            <circle key={i} cx={x} cy={98} r="1.8" fill="#04060d" stroke="none" />
          ))}
          {/* small comb on top */}
          <path d="M92 40 Q100 30 108 40 L108 48 L92 48 Z" fill={metal} />
          <SlotEyes y={80} />
        </g>
      )
    // ---- Ranger: open visor + cheek guards + side wings ----
    case 'ranger':
      return (
        <g stroke="#173a2c" strokeWidth="2">
          {/* skull cap */}
          <path d="M66 66 Q64 40 100 38 Q136 40 134 66 Q100 56 66 66 Z" fill="#2f6f52" />
          {/* brow visor over the eyes */}
          <path d="M66 66 Q100 60 134 66 L132 82 Q100 74 68 82 Z" fill="#24503c" />
          <rect x="78" y="76" width="44" height="6" rx="3" fill="#04060d" stroke="none" />
          {/* cheek guards down the sides of the face */}
          <path d="M70 82 L73 106 Q80 110 85 102 L83 84 Z" fill="#2f6f52" />
          <path d="M130 82 L127 106 Q120 110 115 102 L117 84 Z" fill="#2f6f52" />
          {/* swept wings */}
          <path d="M66 64 L48 56 L64 70 Z M134 64 L152 56 L136 70 Z" fill="#3f8f6a" stroke="none" />
          <SlotEyes y={86} />
        </g>
      )
    // ---- Samurai: kabuto bowl + kuwagata horns + menpō face mask ----
    case 'samurai':
      return (
        <g stroke="#15171f" strokeWidth="2">
          {/* shikoro neck flares */}
          <path d="M62 82 L48 106 Q62 112 74 100 L72 84 Z" fill="#5a1717" />
          <path d="M138 82 L152 106 Q138 112 126 100 L128 84 Z" fill="#5a1717" />
          {/* hachi (bowl) */}
          <path d="M66 64 Q64 38 100 36 Q136 38 134 64 Q100 54 66 64 Z" fill={iron} />
          <path d="M100 38 L100 60 M83 40 L80 62 M117 40 L120 62" stroke="#15171f" strokeWidth="1.2" fill="none" />
          {/* mabisashi (brow peak) */}
          <path d="M66 62 Q100 56 134 62 L130 72 Q100 62 70 72 Z" fill={iron} />
          {/* kuwagata horns */}
          <path d="M86 46 Q72 8 54 14 Q74 24 80 52 Z" fill={gold} stroke="#7a5314" />
          <path d="M114 46 Q128 8 146 14 Q126 24 120 52 Z" fill={gold} stroke="#7a5314" />
          {/* maedate centre crest */}
          <path d="M94 50 Q100 36 106 50 Q100 46 94 50 Z" fill={gold} stroke="#7a5314" />
          {/* menpō mask over the lower face */}
          <path d="M74 82 Q76 104 100 113 Q124 104 126 82 Q100 90 74 82 Z" fill={iron} />
          {/* fierce scowl + fangs */}
          <path d="M86 95 Q100 103 114 95" fill="none" stroke="#04060d" strokeWidth="3" />
          <path d="M90 96 L93 101 L96 96 Z M104 96 L107 101 L110 96 Z" fill="#e7ecff" stroke="none" />
          {/* nose ridge */}
          <path d="M95 82 Q100 88 105 82" fill="none" stroke="#04060d" strokeWidth="2" />
          <SlotEyes y={78} />
        </g>
      )
    // ---- Archmage Cowl: deep hood drowning the face in shadow ----
    case 'mage':
      return (
        <g>
          <path d="M58 112 Q48 30 100 22 Q152 30 142 112 Q138 92 128 88 L128 64 Q114 50 100 50 Q86 50 72 64 L72 88 Q62 92 58 112 Z" fill="#2b2150" stroke="#150f2c" strokeWidth="2" />
          {/* deep shadow */}
          <path d="M72 64 Q100 48 128 64 Q126 88 100 94 Q74 88 72 64 Z" fill="#070512" opacity="0.92" />
          {/* arcane gem on the brow */}
          <circle cx="100" cy="40" r="5" fill="#a855f7" className={pulse} />
          <path d="M100 24 Q96 34 100 44" stroke="#a855f7" strokeWidth="2" fill="none" />
          {/* eyes glow from within the shadow */}
          <g>
            <circle cx="89" cy="78" r="5.2" fill="#c084fc" opacity="0.5" className={pulse} />
            <circle cx="111" cy="78" r="5.2" fill="#c084fc" opacity="0.5" className={pulse} />
            <circle cx="89" cy="78" r="2.3" fill="#fff" />
            <circle cx="111" cy="78" r="2.3" fill="#fff" />
          </g>
        </g>
      )
    // ---- Warlord Crown: bronze Corinthian helm + crimson plume ----
    case 'warlord':
      return (
        <g stroke="#7a4f1c" strokeWidth="2">
          {/* crimson plume crest */}
          <path d="M90 42 Q88 8 100 6 Q112 8 110 42 Z" fill="#b3001b" stroke="#6a0010" />
          {[94, 98, 102, 106].map((x, i) => (
            <line key={i} x1={x} y1={12} x2={x} y2={40} stroke="#e23" strokeWidth="1" />
          ))}
          {/* plume mount */}
          <rect x="92" y="40" width="16" height="6" rx="2" fill={bronze} />
          {/* Corinthian shell with cheek plates + central chin gap */}
          <path d="M66 72 Q62 36 100 34 Q138 36 134 72 L134 98 Q134 108 124 110 L114 110 L114 78 Q108 72 100 72 Q92 72 86 78 L86 110 L76 110 Q66 108 66 98 Z" fill={bronze} />
          {/* almond eye openings either side of the nose bar */}
          <path d="M76 80 Q86 73 96 80 Q86 86 76 80 Z" fill="#04060d" />
          <path d="M104 80 Q114 73 124 80 Q114 86 104 80 Z" fill="#04060d" />
          {/* nose bar highlight */}
          <rect x="97" y="72" width="6" height="30" rx="2" fill={bronze} stroke="#7a4f1c" strokeWidth="1" />
          {/* brow ridge */}
          <path d="M70 70 Q100 60 130 70" fill="none" stroke="#ffe9a8" strokeWidth="1.5" />
          <SlotEyes y={80} lx={86} rx={114} />
        </g>
      )
    // ---- Ascendant Halo: ring of light above (transcended, face open) ----
    case 'ascendant':
      return (
        <g>
          <ellipse cx="100" cy="38" rx="34" ry="9" fill="none" stroke="#fff6c8" strokeWidth="3" className={pulse} />
          <ellipse cx="100" cy="38" rx="34" ry="9" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
          {[...Array(8)].map((_, i) => {
            const a = (i / 8) * Math.PI * 2
            return <circle key={i} cx={100 + Math.cos(a) * 34} cy={38 + Math.sin(a) * 9} r="1.8" fill="#fff" />
          })}
        </g>
      )
    // ---- Phoenix Crest: fiery full helm + flame plume ----
    case 'phoenix':
      return (
        <g stroke="#160603" strokeWidth="2">
          {/* flame crest */}
          <path d="M100 46 Q86 18 100 4 Q114 18 100 46" fill="#ff7a18" className={pulse} />
          <path d="M80 50 Q66 28 60 36 Q72 44 80 56 M120 50 Q134 28 140 36 Q128 44 120 56" fill="#ff4d1c" />
          {/* dark ember helm covering the face */}
          <path d="M66 66 Q62 40 100 38 Q138 40 134 66 L134 98 Q134 108 122 110 L114 110 L114 80 Q108 76 100 76 Q92 76 86 80 L86 110 L78 110 Q66 108 66 98 Z" fill="#2a0d06" />
          {/* glowing eye slits */}
          <path d="M76 80 Q86 74 95 80 Q86 86 76 80 Z" fill="#ff7a18" opacity="0.85" />
          <path d="M105 80 Q114 74 124 80 Q114 86 105 80 Z" fill="#ff7a18" opacity="0.85" />
          {/* nose bar + ember line */}
          <rect x="97" y="74" width="6" height="30" rx="2" fill="#3a1206" />
          <circle cx="100" cy="28" r="3" fill="#ffd166" />
          <g>
            <circle cx="86" cy="80" r="2.4" fill="#fff3d6" />
            <circle cx="114" cy="80" r="2.4" fill="#fff3d6" />
          </g>
        </g>
      )
    case 'none':
    default:
      // bare — a subtle energy band, face fully visible
      return <path d="M74 62 Q100 56 126 62" fill="none" stroke={c1} strokeWidth="2" opacity="0.4" />
  }
}
