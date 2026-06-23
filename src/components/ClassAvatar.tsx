import { useState } from 'react'
import type { AvatarConfig } from '../data/cosmetics'
import { resolveClass } from '../data/classes'
import Avatar, { AURA_COLORS } from './Avatar'
import CosmeticRings from './CosmeticRings'

// ================================================================
// ClassAvatar - renders the player's rank CLASS portrait inside the
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
  classId = null,
  owner = false,
}: {
  level: number
  config: AvatarConfig
  size?: number
  animated?: boolean
  /** the current player's chosen class (own avatar); omit for other players */
  classId?: string | null
  /** owner test account - all classes selectable */
  owner?: boolean
}) {
  const [failed, setFailed] = useState(false)
  const cls = resolveClass(level, classId, owner)

  // missing/failed image → procedural SVG avatar (keeps everything working)
  if (failed) return <Avatar config={config} size={size} animated={animated} />

  const aura = config.aura !== 'none' ? AURA_COLORS[config.aura] : null
  // the portrait sits at ~80% so the animated frame hugs the rim and the
  // aura blooms in the ring of space around it
  const inset = Math.round(size * 0.1)

  return (
    <div style={{ width: size, height: size, maxWidth: '100%', position: 'relative', borderRadius: '50%' }}>
      {/* soft aura bloom behind the portrait */}
      {aura && (
        <div
          className={animated ? 'animate-pulseGlow' : ''}
          style={{
            position: 'absolute',
            inset: Math.round(size * 0.06),
            borderRadius: '50%',
            boxShadow: `0 0 ${Math.round(size * 0.14)}px ${aura}, 0 0 ${Math.round(size * 0.05)}px ${aura}`,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* portrait disc */}
      <div
        style={{
          position: 'absolute',
          inset,
          borderRadius: '50%',
          overflow: 'hidden',
          background: 'radial-gradient(circle at 50% 32%, #1b2440, #05070f 78%)',
          boxShadow: 'inset 0 0 14px rgba(0,0,0,0.65)',
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

      {/* animated aura + frame overlay */}
      <CosmeticRings config={config} animated={animated} />
    </div>
  )
}
