// ================================================================
// Icon — ASCEND's own glyph set, replacing stock emoji. Each icon uses
// `currentColor`, so it inherits the text colour exactly where an emoji
// used to sit: <Icon name="streak" /> in an amber span renders amber.
// Add new glyphs to GLYPHS and use them anywhere via <Icon name=… />.
// ================================================================
import type { CSSProperties } from 'react'

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

// Each glyph is the inner SVG content for a 0 0 24 24 viewBox.
const GLYPHS: Record<IconName, JSX.Element> = {
  // flame — streaks
  streak: (
    <path
      fill="currentColor"
      d="M13 2c.4 3-1.7 4.6-3 6.2C8.6 10 8 11.4 8 13a6 6 0 0 0 12 0c0-2.4-1.2-4.3-2.4-5.8-.5 1-1.3 1.6-2.3 1.8.8-2.6.3-5.4-2.3-7Z"
    />
  ),
  // shield with a tick — integrity / anti-cheat trust
  integrity: (
    <path
      fill="currentColor"
      d="M12 2 4 5v6.2c0 5 3.4 8.4 8 9.8 4.6-1.4 8-4.8 8-9.8V5l-8-3Zm-1.2 13.2L7.5 12l1.4-1.4 1.9 1.9 4-4L16.2 10l-5.4 5.2Z"
    />
  ),
  // faceted gem — Aether
  aether: (
    <path
      fill="currentColor"
      d="M7 3h10l4 6-9 12L3 9l4-6Zm.3 2L5 8.6h4.2L11 5H7.3Zm5.7 0L14.8 8.6H19L16.7 5H13ZM5.6 10.6 11 17.7v-7.1H5.6Zm7.4 0v7.1l5.4-7.1H13Z"
    />
  ),
  // four-point sparkle — Ascend Plus
  plus: (
    <path
      fill="currentColor"
      d="M12 1.5c.7 4.6 2.4 6.3 7 7-4.6.7-6.3 2.4-7 7-.7-4.6-2.4-6.3-7-7 4.6-.7 6.3-2.4 7-7Z"
    />
  ),
  // snowflake — streak freeze
  freeze: (
    <g stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <path d="M12 2v20M3.3 7l17.4 10M20.7 7 3.3 17" />
      <path d="M12 6.5 9.6 4.6M12 6.5l2.4-1.9M12 17.5l-2.4 1.9M12 17.5l2.4 1.9M5.6 9.2 3 9M5.6 14.8 3 15M18.4 9.2 21 9M18.4 14.8 21 15" />
    </g>
  ),
  // upward chevrons — level / EXP
  level: (
    <path
      fill="currentColor"
      d="m12 3 8 8h-5v3H9v-3H4l8-8Zm-3 14h6v2H9v-2Zm0 3h6v1.5H9V20Z"
    />
  ),
  // quest log — a document with lines
  quest: (
    <path
      fill="currentColor"
      d="M7 2h7l5 5v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm6 1.6V8h4.4L13 3.6ZM8 11h8v1.6H8V11Zm0 3.5h8v1.6H8v-1.6Z"
    />
  ),
  // brain-ish — Path to Enlightenment (mind)
  mind: (
    <path
      fill="currentColor"
      d="M9 3a4 4 0 0 0-4 4 3.5 3.5 0 0 0-1 6.6V17a3 3 0 0 0 5 2v-2a1 1 0 1 0-2 0 1 1 0 0 1-1-1v-2H7a1.5 1.5 0 0 1 0-3h1V7a2 2 0 0 1 4 0v12a1 1 0 0 0 2 0V3.6A3.9 3.9 0 0 0 9 3Z"
    />
  ),
  // crossed swords — Path of Iron (will)
  will: (
    <path
      fill="currentColor"
      d="M3 3h3l8 8-2.5 2.5L3.5 5.5 3 3Zm18 0-.5 2.5-3 3L15 6l3-3h3ZM6 21l-3-3 6-6 1.5 1.5L6 21Zm12 0-4.5-4.5L15 15l6 6-3 0Z"
    />
  ),
  // heart — Path of the Lionheart (heart)
  heart: (
    <path
      fill="currentColor"
      d="M12 21S3.5 14.7 3.5 8.9A4.9 4.9 0 0 1 12 5.6a4.9 4.9 0 0 1 8.5 3.3C20.5 14.7 12 21 12 21Z"
    />
  ),
  // radiant presence — Path of Influence (charisma)
  charisma: (
    <path
      fill="currentColor"
      d="M12 2c.6 3.4 1.7 4.5 5 5-3.3.6-4.4 1.6-5 5-.6-3.4-1.7-4.5-5-5 3.3-.6 4.4-1.6 5-5Zm6 11c.4 1.7.9 2.2 2.5 2.5-1.6.4-2.1.9-2.5 2.5-.4-1.7-.9-2.2-2.5-2.5 1.6-.4 2.1-.9 2.5-2.5ZM6.5 14c.4 1.7.9 2.2 2.5 2.5-1.6.4-2.1.9-2.5 2.5C6.1 17.3 5.6 16.8 4 16.5c1.6-.4 2.1-.9 2.5-2.5Z"
    />
  ),
  // flexed strength — Path of the Titan (body)
  body: (
    <path
      fill="currentColor"
      d="M4 9h6a4 4 0 0 1 4 4v1h2a2 2 0 0 0 2-2V7h3v5a5 5 0 0 1-5 5h-2a4 4 0 0 1-4 4H6v-3h4a1 1 0 0 0 1-1 1 1 0 0 0-1-1H4V9Z"
    />
  ),
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
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      style={{ display: 'inline-block', verticalAlign: '-0.125em', flexShrink: 0, ...style }}
    >
      {title && <title>{title}</title>}
      {GLYPHS[name]}
    </svg>
  )
}
