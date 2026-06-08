import { useEffect, useState } from 'react'
import {
  useRive,
  useStateMachineInput,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas'
import type { AvatarConfig } from '../data/cosmetics'
import { COSMETIC_GROUPS, type CosmeticSlot } from '../data/cosmetics'
import Avatar from './Avatar'

// ================================================================
// RiveAvatarInner — the actual Rive runtime. Loaded LAZILY by
// RiveAvatar.tsx so the ~180KB Rive engine is only fetched when a
// hero avatar mounts (and ideally only once a .riv file exists).
//
// It loads public/avatar.riv and drives it from the player's
// AvatarConfig; if the file is missing or fails to load, it renders
// the procedural SVG <Avatar/> instead.
//
// See docs/RIVE_AVATAR.md for the authoring contract (artboard, the
// "Avatar" state machine, and the helmet/aura/frame/skin inputs).
// ================================================================

const RIVE_SRC = '/avatar.riv'
const STATE_MACHINE = 'Avatar'

// id -> 0-based index within its slot, matching data/cosmetics.ts order
function slotIndex(slot: CosmeticSlot, id: string): number {
  const i = COSMETIC_GROUPS[slot].findIndex((c) => c.id === id)
  return i < 0 ? 0 : i
}

// How many options each slot has, in order (handy for the Rive author).
export const RIVE_INPUT_RANGES = {
  helmet: COSMETIC_GROUPS.helmet.map((c) => c.id),
  aura: COSMETIC_GROUPS.aura.map((c) => c.id),
  frame: COSMETIC_GROUPS.frame.map((c) => c.id),
  skin: COSMETIC_GROUPS.skin.map((c) => c.id),
}

export default function RiveAvatarInner({
  config,
  size = 260,
  animated = true,
}: {
  config: AvatarConfig
  size?: number
  animated?: boolean
}) {
  const [failed, setFailed] = useState(false)

  const { rive, RiveComponent } = useRive({
    src: RIVE_SRC,
    stateMachines: STATE_MACHINE,
    autoplay: animated,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => setFailed(true),
  })

  const helmet = useStateMachineInput(rive, STATE_MACHINE, 'helmet')
  const aura = useStateMachineInput(rive, STATE_MACHINE, 'aura')
  const frame = useStateMachineInput(rive, STATE_MACHINE, 'frame')
  const skin = useStateMachineInput(rive, STATE_MACHINE, 'skin')

  useEffect(() => {
    if (helmet) helmet.value = slotIndex('helmet', config.helmet)
  }, [helmet, config.helmet])
  useEffect(() => {
    if (aura) aura.value = slotIndex('aura', config.aura)
  }, [aura, config.aura])
  useEffect(() => {
    if (frame) frame.value = slotIndex('frame', config.frame)
  }, [frame, config.frame])
  useEffect(() => {
    if (skin) skin.value = slotIndex('skin', config.skin)
  }, [skin, config.skin])

  // No Rive file (or load error) → use the procedural SVG avatar.
  if (failed) return <Avatar config={config} size={size} animated={animated} />

  return (
    <div style={{ width: size, height: size, maxWidth: '100%' }}>
      <RiveComponent />
    </div>
  )
}
