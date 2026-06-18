import { useId } from 'react'
import type { AvatarConfig } from '../data/cosmetics'
import { HELMET_ICONS, HELMET_ICON_VB } from '../data/helmetArt'

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

export const AURA_COLORS: Record<string, string> = {
  none: 'transparent',
  spark: '#9ad8ff',
  tide: '#38bdf8',
  ember: '#ff7a18',
  frost: '#7dd3fc',
  bloom: '#4ade80',
  starlight: '#c4b5fd',
  void: '#7c3aed',
  tempest: '#818cf8',
  inferno: '#f97316',
  solar: '#fbbf24',
  radiant: '#fde047',
  phoenix: '#ff4d1c',
  prismatic: '#e879f9',
  aether: '#a855f7',
}

export const FRAME_COLORS: Record<string, string> = {
  basic: '#3a4a78',
  bronze: '#b08d57',
  silver: '#cbd5e1',
  verdant: '#4ade80',
  cyan: '#22d3ee',
  neon: '#f472b6',
  'ember-frame': '#fb923c',
  obsidian: '#a78bfa',
  gold: '#fbbf24',
  royal: '#facc15',
  prism: 'url(#prismFrame)',
  celestial: '#67e8f9',
  founder: '#fbbf24',
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
  // Ascend Plus exclusives get bespoke, matched treatments
  const isAetherAura = config.aura === 'aether'
  const isFounderFrame = config.frame === 'founder'

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
        {/* Ascend Plus set — the Aether aura + Founders frame share this
            violet↔gold identity so they read as one premium pairing */}
        <radialGradient id={`plusAura-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c084fc" stopOpacity="0.6" />
          <stop offset="45%" stopColor="#a855f7" stopOpacity="0.22" />
          <stop offset="72%" stopColor="#fbbf24" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`plusRing-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde08a" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="65%" stopColor="#d8a0ff" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
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
        <linearGradient id={`jade-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8f3e6" />
          <stop offset="50%" stopColor="#52b487" />
          <stop offset="100%" stopColor="#235c43" />
        </linearGradient>
        <linearGradient id={`violet-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e2c9ff" />
          <stop offset="50%" stopColor="#a86bf5" />
          <stop offset="100%" stopColor="#5a2aa8" />
        </linearGradient>
        <linearGradient id={`fire-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="45%" stopColor="#ff8a2b" />
          <stop offset="100%" stopColor="#e0341c" />
        </linearGradient>
        <linearGradient id={`cloth-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b9aee6" />
          <stop offset="55%" stopColor="#6a5b9e" />
          <stop offset="100%" stopColor="#352b54" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Aether (Ascend Plus) — a violet→gold dual-tone field with twin halos
          and alternating gold/violet motes; matches the Founders frame */}
      {isAetherAura && (
        <g>
          <circle
            cx="100"
            cy="100"
            r="99"
            fill={`url(#plusAura-${uid})`}
            className={animated ? 'animate-pulseGlow' : ''}
          />
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="3"
            opacity="0.55"
            filter={`url(#glow-${uid})`}
            className={animated ? 'animate-pulseGlow' : ''}
          />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke="#c084fc"
            strokeWidth="2"
            opacity="0.5"
            filter={`url(#glow-${uid})`}
          />
          {[...Array(20)].map((_, i) => {
            const a = (i / 20) * Math.PI * 2
            const gold = i % 2 === 0
            const dist = i % 3 === 0 ? 90 : 96
            return (
              <circle
                key={i}
                cx={100 + Math.cos(a) * dist}
                cy={100 + Math.sin(a) * dist}
                r={i % 4 === 0 ? 3.2 : 1.8}
                fill={gold ? '#ffd76a' : '#c879ff'}
                opacity={0.9}
                filter={`url(#glow-${uid})`}
                className={animated ? 'animate-twinkle' : ''}
                style={{ animationDelay: `${i * 0.12}s` }}
              />
            )
          })}
        </g>
      )}

      {/* aura — a glowing halo ring + orbiting motes that bloom OUTSIDE the
          bust (which is otherwise opaque and would hide a centred glow) */}
      {hasAura && !isAetherAura && (
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

      {/* Founders frame (Ascend Plus) — a violet→gold gradient ring with gold
          + violet rails, fine bi-colour ticks and four cardinal gem accents;
          the deliberate partner to the Aether aura */}
      {isFounderFrame ? (
        <g>
          <circle cx="100" cy="100" r="94" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.45" />
          <circle cx="100" cy="100" r="90" fill="none" stroke={`url(#plusRing-${uid})`} strokeWidth="4.5" />
          <circle cx="100" cy="100" r="84" fill="none" stroke="#a855f7" strokeWidth="1" opacity="0.5" />
          {[...Array(36)].map((_, i) => {
            const a = (i / 36) * Math.PI * 2
            return (
              <line
                key={i}
                x1={100 + Math.cos(a) * 88}
                y1={100 + Math.sin(a) * 88}
                x2={100 + Math.cos(a) * 92}
                y2={100 + Math.sin(a) * 92}
                stroke={i % 3 === 0 ? '#fbbf24' : '#c084fc'}
                strokeWidth="1.3"
                opacity="0.6"
              />
            )
          })}
          {[0, 90, 180, 270].map((deg, i) => {
            const a = (deg * Math.PI) / 180
            return (
              <g key={deg} transform={`translate(${100 + Math.cos(a) * 90} ${100 + Math.sin(a) * 90}) rotate(45)`}>
                <rect
                  x="-3.2"
                  y="-3.2"
                  width="6.4"
                  height="6.4"
                  fill={i % 2 === 0 ? '#ffd76a' : '#c879ff'}
                  filter={`url(#glow-${uid})`}
                  className={animated ? 'animate-pulseGlow' : ''}
                />
              </g>
            )
          })}
        </g>
      ) : (
        <>
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
          {['cyan', 'gold', 'prism', 'neon', 'obsidian', 'royal', 'celestial', 'silver'].includes(
            config.frame,
          ) &&
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
        </>
      )}

      {/* clip the bust inside the ring */}
      <clipPath id={`clip-${uid}`}>
        <circle cx="100" cy="100" r="82" />
      </clipPath>
      <g clipPath={`url(#clip-${uid})`}>
        <rect x="18" y="18" width="164" height="164" fill="#05070f" />

        {/* bust — one bold, clean silhouette to match the icon helmets */}
        <path
          d="M32 184 Q34 138 72 130 Q86 127 100 127 Q114 127 128 130 Q166 138 168 184 Z"
          fill={`url(#body-${uid})`}
        />
        {/* soft rim light along the shoulders */}
        <path
          d="M32 184 Q34 138 72 130 Q86 127 100 127 Q114 127 128 130 Q166 138 168 184"
          fill="none"
          stroke={c1}
          strokeOpacity="0.4"
          strokeWidth="1.5"
        />

        {/* neck */}
        <path d="M88 110 Q88 126 100 129 Q112 126 112 110 Z" fill={`url(#body-${uid})`} />

        {/* head */}
        <ellipse cx="100" cy="78" rx="28" ry="32" fill={`url(#body-${uid})`} />
        <ellipse cx="100" cy="78" rx="28" ry="32" fill="none" stroke={c1} strokeOpacity="0.4" strokeWidth="1.5" />

        {/* glowing eyes */}
        <circle cx="90" cy="80" r="5.5" fill={c1} opacity="0.3" className={animated ? 'animate-pulseGlow' : ''} />
        <circle cx="110" cy="80" r="5.5" fill={c1} opacity="0.3" className={animated ? 'animate-pulseGlow' : ''} />
        <circle cx="90" cy="80" r="3" fill="#ffffff" />
        <circle cx="110" cy="80" r="3" fill="#ffffff" />
      </g>

      {/* helmet on top */}
      <Helmet id={config.helmet} uid={uid} c1={c1} animated={animated} />
    </svg>
  )
}

// Each helmet maps to a professionally-drawn game-icons silhouette (see
// data/helmetArt.ts), tinted with one of the avatar's metal/colour gradients
// and positioned over the head. Tweak `w`/`dy` per helmet to seat it nicely.
interface HelmetArt {
  icon: keyof typeof HELMET_ICONS
  fill: 'cloth' | 'gold' | 'metal' | 'jade' | 'iron' | 'violet' | 'bronze' | 'fire'
  w: number // helmet width in the 200-unit viewBox
  dy: number // top offset (y of the helmet's top edge)
}

const HELMET_ART: Record<string, HelmetArt> = {
  hood: { icon: 'hood', fill: 'cloth', w: 120, dy: 22 },
  circlet: { icon: 'laurel-crown', fill: 'gold', w: 116, dy: 30 },
  knight: { icon: 'visored-helm', fill: 'metal', w: 110, dy: 22 },
  ranger: { icon: 'barbute', fill: 'jade', w: 104, dy: 22 },
  samurai: { icon: 'samurai-helmet', fill: 'iron', w: 126, dy: 14 },
  mage: { icon: 'warlock-hood', fill: 'violet', w: 124, dy: 14 },
  warlord: { icon: 'spartan-helmet', fill: 'bronze', w: 112, dy: 20 },
  ascendant: { icon: 'spiked-halo', fill: 'gold', w: 104, dy: 8 },
  phoenix: { icon: 'crested-helmet', fill: 'fire', w: 118, dy: 12 },
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
  const art = HELMET_ART[id]

  // bare (or unknown) — a subtle energy band, face fully visible
  if (!art) {
    return <path d="M74 62 Q100 56 126 62" fill="none" stroke={c1} strokeWidth="2" opacity="0.4" />
  }

  const fillUrl = `url(#${art.fill}-${uid})`
  const s = art.w / HELMET_ICON_VB
  const tx = 100 - art.w / 2
  const body = HELMET_ICONS[art.icon]
  const glow = art.fill === 'fire' || art.fill === 'violet'

  return (
    <g
      className={glow && animated ? 'animate-pulseGlow' : ''}
      filter={glow ? `url(#glow-${uid})` : undefined}
    >
      <g transform={`translate(${tx} ${art.dy}) scale(${s})`} fill={fillUrl}>
        <g dangerouslySetInnerHTML={{ __html: body }} />
      </g>
    </g>
  )
}
