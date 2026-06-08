import { useState } from 'react'
import type { AvatarConfig } from '../data/cosmetics'
import { classForLevel } from '../data/classes'
import Avatar, { AURA_COLORS, FRAME_COLORS } from './Avatar'

// ================================================================
// ClassAvatar — renders the player's rank CLASS portrait inside the
// avatar frame, with the equipped aura glowing behind and the frame
// ring on top. The class is derived from `level`.
//
// If the portrait PNG is missing (e.g. a class not yet uploaded, or a
// load error), it falls back to the procedural SVG <Avatar/> so the app
// always shows something.
// ================================================================

export default function ClassAvatar({
  level,
  config,
  size = 260,
  animated = true,
}: {
  level: number
  config: AvatarConfig
  size?: number
  animated?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const cls = classForLevel(level)

  // missing/failed image → procedural SVG avatar (keeps everything working)
  if (failed) return <Avatar config={config} size={size} animated={animated} />

  const aura = config.aura !== 'none' ? AURA_COLORS[config.aura] : null
  const frame =
    config.frame === 'prism' ? '#c9a3ff' : FRAME_COLORS[config.frame] ?? '#3a4a78'
  const ring = Math.max(2, Math.round(size * 0.02))

  return (
    <div style={{ width: size, height: size, maxWidth: '100%', position: 'relative', borderRadius: '50%' }}>
      {/* aura glow behind the portrait */}
      {aura && (
        <div
          className={animated ? 'animate-pulseGlow' : ''}
          style={{
            position: 'absolute',
            inset: -Math.round(size * 0.04),
            borderRadius: '50%',
            boxShadow: `0 0 ${Math.round(size * 0.16)}px ${aura}, 0 0 ${Math.round(size * 0.06)}px ${aura}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* portrait disc */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 32%, #1b2440, #05070f 78%)',
        }}
      >
        <img
          src={cls.img}
          alt={cls.name}
          draggable={false}
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 22%' }}
        />
      </div>

      {/* frame ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${ring}px solid ${frame}`,
          boxShadow: `0 0 10px ${frame}55, inset 0 0 14px rgba(0,0,0,0.65)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
