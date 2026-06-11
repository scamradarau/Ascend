import type { VerifyMethod } from './types'

// ================================================================
// CHALLENGES — weekly & monthly quests. Longer, harder, and worth far
// more than dailies. They reset each period so there's always a fresh
// mountain to climb (and a fair shot at the reward).
// ================================================================

export interface Challenge {
  id: string
  scope: 'weekly' | 'monthly'
  title: string
  desc: string
  icon: string
  target: number
  unit: string
  verify: VerifyMethod
  exp: number
  aether: number
  /** optional: this challenge is a reading challenge (book picker shown) */
  reading?: boolean
}

export const CHALLENGES: Challenge[] = [
  // ---------------- WEEKLY ----------------
  {
    id: 'w-gym4',
    scope: 'weekly',
    title: 'Iron Week',
    desc: 'Complete 4 verified training sessions this week.',
    icon: '🏋️',
    target: 4,
    unit: 'sessions',
    verify: 'geo-photo',
    exp: 420,
    aether: 105,
  },
  {
    id: 'w-meditate5',
    scope: 'weekly',
    title: 'Still Mind',
    desc: 'Meditate on 5 days this week.',
    icon: '🧘',
    target: 5,
    unit: 'sessions',
    verify: 'meditation-timer',
    exp: 360,
    aether: 90,
  },
  {
    id: 'w-deep5',
    scope: 'weekly',
    title: 'Deep Worker',
    desc: 'Log 5 foreground-locked deep-work sprints this week.',
    icon: '⏱️',
    target: 5,
    unit: 'sprints',
    verify: 'focus-timer',
    exp: 420,
    aether: 105,
  },
  {
    id: 'w-read4',
    scope: 'weekly',
    title: 'Bookworm',
    desc: 'Complete 4 verified reading sessions this week.',
    icon: '📖',
    target: 4,
    unit: 'sessions',
    verify: 'reading-check',
    exp: 380,
    aether: 95,
    reading: true,
  },
  {
    id: 'w-connect3',
    scope: 'weekly',
    title: 'Outreach',
    desc: 'Reach out to or connect with 3 people this week.',
    icon: '🤝',
    target: 3,
    unit: 'connections',
    verify: 'journal',
    exp: 320,
    aether: 80,
  },

  // ---------------- MONTHLY ----------------
  {
    id: 'm-book',
    scope: 'monthly',
    title: 'Finish a Book',
    desc: 'Read & summarise across 4 sessions to finish a full book this month.',
    icon: '📚',
    target: 4,
    unit: 'sessions',
    verify: 'reading-check',
    exp: 1600,
    aether: 400,
    reading: true,
  },
  {
    id: 'm-gym16',
    scope: 'monthly',
    title: 'Forged in Iron',
    desc: '16 verified training sessions this month.',
    icon: '🦾',
    target: 16,
    unit: 'sessions',
    verify: 'geo-photo',
    exp: 1900,
    aether: 475,
  },
  {
    id: 'm-meditate20',
    scope: 'monthly',
    title: 'Monk Mode',
    desc: 'Meditate on 20 days this month.',
    icon: '🕉️',
    target: 20,
    unit: 'sessions',
    verify: 'meditation-timer',
    exp: 1500,
    aether: 375,
  },
  {
    id: 'm-journal20',
    scope: 'monthly',
    title: 'Examined Life',
    desc: 'Journal a genuine reflection on 20 days this month.',
    icon: '✍️',
    target: 20,
    unit: 'entries',
    verify: 'journal',
    exp: 1300,
    aether: 325,
  },
]

// ---- period keys (Sydney-anchored; see lib/time.ts) ----
// Re-exported from the shared time module so resets stay in lock-step
// with the on-screen countdown.
export { weekKey, monthKey, periodKeyFor } from '../lib/time'

export const challengeById = (id: string) => CHALLENGES.find((c) => c.id === id)
