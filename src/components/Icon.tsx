import type { CSSProperties } from 'react'

// ================================================================
// Icon — ASCEND's own bespoke icon set (warm-white glyphs with a soft
// golden glow), replacing stock emoji. PNG assets live in /public/icons.
// Drop-in: <Icon name="streak" /> sits anywhere an emoji used to.
// ================================================================
export type IconName =
  | 'streak'
  | 'integrity'
  | 'aether'
  | 'plus'
  | 'freeze'
  | 'level'
  | 'quest'
  | 'mind'
  | 'will'
  | 'heart'
  | 'charisma'
  | 'body'

// the 5 attribute/Path ids map straight onto the path icons
export const ATTR_ICON: Record<string, IconName> = {
  mind: 'mind',
  will: 'will',
  heart: 'heart',
  charisma: 'charisma',
  body: 'body',
}

export default function Icon({
  name,
  size = '1em',
  className,
  title,
  style,
}: {
  name: IconName
  size?: number | string
  className?: string
  title?: string
  style?: CSSProperties
}) {
  return (
    <img
      src={`/icons/${name}.png`}
      alt={title ?? ''}
      aria-hidden={title ? undefined : true}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        display: 'inline-block',
        verticalAlign: '-0.18em',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
