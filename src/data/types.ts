// ----------------------------------------------------------------
// Core domain types for Ascend
// ----------------------------------------------------------------

export type AttributeId = 'mind' | 'heart' | 'will' | 'charisma' | 'body'

export interface Attribute {
  id: AttributeId
  name: string
  short: string // RPG-style short stat (INT, etc.)
  blurb: string
  color: string // hex for theming the node
  icon: string // emoji glyph used as a lightweight icon
}

export type CheckInType =
  | 'photo' // real-time photo evidence
  | 'summary' // written summary of reading
  | 'reflection' // free written reflection
  | 'schedule' // upload a schedule + daily photos

// kept as a string literal union to avoid an import cycle with verification.ts
export type VerifyMethod =
  | 'live-photo'
  | 'geo-photo'
  | 'focus-timer'
  | 'meditation-timer'
  | 'reading-check'
  | 'journal'
  | 'sleep-window'

export interface DailyTask {
  id: string
  label: string
  evidence: CheckInType
  /** explicit verification method; falls back to inference if omitted */
  verify?: VerifyMethod
  hint?: string
  exp: number
  /** minimum minutes for timer-based methods */
  minMinutes?: number
}

export interface MainQuest {
  title: string
  book?: string // recommended product / book
  why: string
  checkIn: CheckInType
  exp: number
}

export interface Trait {
  id: string
  name: string
  attribute: AttributeId
  tagline: string
  description: string
  benefit: string
  howToLevel: string[]
  dailyTasks: DailyTask[]
  mainQuest: MainQuest
  hotTips: string[]
  // difficulty gate: minimum suggested player level
  tier: 'low' | 'mid' | 'high'
}

export interface Rank {
  id: string
  title: string
  minLevel: number
  maxLevel: number
  theme: string
  // life expectations set by the rank (slide 20)
  expectations: string[]
}

export interface Badge {
  id: string
  name: string
  desc: string
  icon: string
  reward: 'LOW' | 'MID' | 'HIGH'
  // sub-requirements with progress fraction [done, total]
  requirements: { label: string; done: number; total: number }[]
}

export interface LeaderboardEntry {
  handle: string
  className: string
  level: number
  region: string
  value?: number // quests this month / stat score depending on board
}
