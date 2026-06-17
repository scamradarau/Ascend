import type { AttributeId } from './types'
import { TRAITS } from './traits'

// ----------------------------------------------------------------
// Onboarding questionnaire + recommendation engine
// The deck: "Very detailed questionnaire ... this will gauge level
// and tailor on traits to build." Tier caps: low 20, mid 40, high 60.
// ----------------------------------------------------------------

export interface OnboardingAnswers {
  // identity
  handle: string
  age: number | ''
  region: string
  occupation: string
  theme: 'cosmos' | 'rune' | 'olympus'
  // ambition / consent tier
  tier: 'low' | 'mid' | 'high'
  // self-assessment per attribute (1 = weak, 5 = strong)
  selfRating: Record<AttributeId, number>
  // which areas they most want to improve (attribute ids)
  goals: AttributeId[]
  // specific outcomes they want (bias trait suggestions)
  outcomes: string[]
  // what's holding them back (bias trait suggestions)
  obstacles: string[]
  // commitment & motivation
  dailyTime: '15' | '30' | '60' | '90'
  motivation: 'rewards' | 'mastery' | 'competition' | 'purpose'
  // lifestyle signals (each contributes to starting level)
  sleep: string // poor | ok | great
  exercise: string // none | sometimes | regular
  reading: string // never | sometimes | daily
  finances: string // struggling | stable | thriving
  business: string // none | side | owner
  procrastination: string // chronic | sometimes | rarely
  screenTime: string // high | med | low
  diet: string // poor | ok | clean
  social: string // isolated | ok | thriving
  // optional high-tier proof fields (consent-gated)
  income?: string
  physique?: string
}

export const DEFAULT_ANSWERS: OnboardingAnswers = {
  handle: '',
  age: '',
  region: 'OCE',
  occupation: '',
  theme: 'cosmos',
  tier: 'high',
  selfRating: { mind: 3, will: 3, heart: 3, charisma: 3, body: 3 },
  goals: [],
  outcomes: [],
  obstacles: [],
  dailyTime: '30',
  motivation: 'mastery',
  sleep: 'ok',
  exercise: 'sometimes',
  reading: 'sometimes',
  finances: 'stable',
  business: 'none',
  procrastination: 'sometimes',
  screenTime: 'med',
  diet: 'ok',
  social: 'ok',
}

export const REGIONS = ['OCE', 'NA', 'EU', 'ASIA', 'SA', 'AFRICA']

export const ATTRIBUTE_GOAL_OPTIONS: { id: AttributeId; label: string; desc: string }[] = [
  { id: 'mind', label: 'Sharper Mind', desc: 'Focus, learning, clear thinking' },
  { id: 'will', label: 'Iron Discipline', desc: 'Consistency, follow-through' },
  { id: 'heart', label: 'Inner Strength', desc: 'Resilience, confidence, calm' },
  { id: 'charisma', label: 'Magnetic Presence', desc: 'Communication, leadership' },
  { id: 'body', label: 'Elite Body', desc: 'Physique, energy, health' },
]

// Specific outcomes → which attributes they pull toward.
export const OUTCOME_OPTIONS: { id: string; label: string; icon: string; attrs: AttributeId[] }[] = [
  { id: 'fit', label: 'Get fit & strong', icon: '💪', attrs: ['body'] },
  { id: 'money', label: 'Make more money', icon: '💰', attrs: ['will', 'mind'] },
  { id: 'business', label: 'Build a business', icon: '🚀', attrs: ['will', 'charisma'] },
  { id: 'confident', label: 'Be more confident', icon: '🦁', attrs: ['charisma', 'heart'] },
  { id: 'skill', label: 'Master a skill', icon: '🎯', attrs: ['mind'] },
  { id: 'relationships', label: 'Better relationships', icon: '❤️', attrs: ['charisma', 'heart'] },
  { id: 'clarity', label: 'Mental clarity & calm', icon: '🧘', attrs: ['heart', 'mind'] },
  { id: 'energy', label: 'More energy & better sleep', icon: '⚡', attrs: ['body'] },
  { id: 'focus', label: 'Beat distraction', icon: '🎧', attrs: ['mind', 'will'] },
  { id: 'purpose', label: 'Find direction & purpose', icon: '🧭', attrs: ['heart'] },
]

// Obstacles → which attributes need the most work.
export const OBSTACLE_OPTIONS: { id: string; label: string; icon: string; attrs: AttributeId[] }[] = [
  { id: 'procrastination', label: 'Procrastination', icon: '🐸', attrs: ['will'] },
  { id: 'phone', label: 'Phone / screen addiction', icon: '📱', attrs: ['mind'] },
  { id: 'inconsistency', label: 'Can’t stay consistent', icon: '🔁', attrs: ['will'] },
  { id: 'lowconfidence', label: 'Low confidence', icon: '😟', attrs: ['charisma', 'heart'] },
  { id: 'overwhelm', label: 'Overwhelm / no plan', icon: '🌪️', attrs: ['mind'] },
  { id: 'health', label: 'Poor health / low energy', icon: '🥱', attrs: ['body'] },
  { id: 'negativity', label: 'Negative self-talk', icon: '🌧️', attrs: ['heart'] },
  { id: 'lonely', label: 'Isolation / few connections', icon: '🫥', attrs: ['charisma'] },
]

export const DAILY_TIME_OPTIONS: { id: OnboardingAnswers['dailyTime']; label: string }[] = [
  { id: '15', label: '~15 min' },
  { id: '30', label: '~30 min' },
  { id: '60', label: '~1 hour' },
  { id: '90', label: '90 min+' },
]

export const MOTIVATION_OPTIONS: { id: OnboardingAnswers['motivation']; label: string; desc: string }[] = [
  { id: 'rewards', label: 'Rewards', desc: 'Points, items & real prizes' },
  { id: 'mastery', label: 'Mastery', desc: 'Becoming genuinely great' },
  { id: 'competition', label: 'Competition', desc: 'Climbing the leaderboards' },
  { id: 'purpose', label: 'Purpose', desc: 'Living by my values' },
]

// scoring maps for lifestyle → starting EXP points
const SCORE: Record<string, Record<string, number>> = {
  sleep: { poor: 0, ok: 4, great: 8 },
  exercise: { none: 0, sometimes: 5, regular: 11 },
  reading: { never: 0, sometimes: 5, daily: 10 },
  finances: { struggling: 0, stable: 7, thriving: 14 },
  business: { none: 0, side: 8, owner: 16 },
  procrastination: { chronic: 0, sometimes: 5, rarely: 12 },
  screenTime: { high: 0, med: 4, low: 8 },
  diet: { poor: 0, ok: 4, clean: 9 },
  social: { isolated: 0, ok: 5, thriving: 10 },
}

export interface OnboardingResult {
  startingLevel: number
  startingExp: number
  rationale: string[]
  suggestedTraitIds: string[]
  // how many daily quests we suggest you aim for, sized to your time answer
  dailyQuestTarget: number
}

// Everyone starts at Level 1. The questionnaire no longer sets your level —
// the ladder is climbed purely through verified in-game progress. Instead it
// tailors WHICH 3 traits/quests we recommend you start with.
export function computeOnboarding(a: OnboardingAnswers): OnboardingResult {
  const rationale: string[] = []

  // fair start: everyone begins at Level 1, zero EXP.
  const startingLevel = 1
  const startingExp = 0

  rationale.push(
    'Everyone starts at Level 1 — the ladder is earned purely through verified progress. No head starts.',
  )

  // ---- trait recommendations ----
  // priority = goals + weakness + chosen outcomes + obstacles to overcome
  const attrScore: Record<AttributeId, number> = { mind: 0, will: 0, heart: 0, charisma: 0, body: 0 }
  ;(Object.keys(attrScore) as AttributeId[]).forEach((id) => {
    const wantBonus = a.goals.includes(id) ? 6 : 0
    const weakBonus = 5 - (a.selfRating[id] ?? 3)
    attrScore[id] = wantBonus + weakBonus
  })
  // outcomes pull their attributes up
  a.outcomes.forEach((oid) => {
    OUTCOME_OPTIONS.find((o) => o.id === oid)?.attrs.forEach((at) => (attrScore[at] += 4))
  })
  // obstacles signal where the most work is needed (slightly stronger)
  a.obstacles.forEach((oid) => {
    OBSTACLE_OPTIONS.find((o) => o.id === oid)?.attrs.forEach((at) => (attrScore[at] += 5))
  })
  // motivation nudges WHICH traits we lead with (a light bias — your goals
  // still dominate). Rewards → visible, trackable wins; Mastery → depth of
  // mind; Competition → measurable, leaderboard-climbing discipline; Purpose
  // → values and inner strength.
  const MOTIVATION_BIAS: Record<OnboardingAnswers['motivation'], Partial<Record<AttributeId, number>>> = {
    rewards: { body: 2, will: 1 },
    mastery: { mind: 2, will: 1 },
    competition: { will: 2, body: 1 },
    purpose: { heart: 2, mind: 1 },
  }
  Object.entries(MOTIVATION_BIAS[a.motivation]).forEach(([at, bonus]) => {
    attrScore[at as AttributeId] += bonus ?? 0
  })

  // difficulty gate based on chosen ambition tier (everyone starts at Lv1,
  // so we gate suggestions by ambition, not by level). Beginners get
  // foundational traits; higher ambition can be handed harder ones.
  const allowedTiers: Record<string, boolean> = {
    low: true,
    mid: a.tier !== 'low',
    high: a.tier === 'high',
  }

  const ranked = [...TRAITS]
    .filter((t) => allowedTiers[t.tier])
    .map((t) => {
      const base = attrScore[t.attribute]
      // small boost for foundational low-tier traits so beginners get wins
      const tierBoost = t.tier === 'low' ? 1.5 : t.tier === 'mid' ? 0.5 : 0
      return { t, score: base + tierBoost + Math.random() * 0.3 }
    })
    .sort((x, y) => y.score - x.score)

  // pick top 3 but ensure they aren't all the same attribute (variety)
  const picked: string[] = []
  const usedAttrs = new Set<string>()
  for (const { t } of ranked) {
    if (picked.length >= 3) break
    if (usedAttrs.has(t.attribute) && picked.length < 2) continue
    picked.push(t.id)
    usedAttrs.add(t.attribute)
  }
  // top up if needed
  for (const { t } of ranked) {
    if (picked.length >= 3) break
    if (!picked.includes(t.id)) picked.push(t.id)
  }

  const topAttr = (Object.keys(attrScore) as AttributeId[]).sort(
    (x, y) => attrScore[y] - attrScore[x],
  )[0]
  const goalNames: Record<AttributeId, string> = {
    mind: 'a sharper mind',
    will: 'iron discipline',
    heart: 'inner strength',
    charisma: 'a magnetic presence',
    body: 'an elite body',
  }
  rationale.push(
    `We focused your first 3 quests on ${goalNames[topAttr]} — the area where your goals and current gaps line up most.`,
  )
  if (a.obstacles.length) {
    const obsName = OBSTACLE_OPTIONS.find((o) => o.id === a.obstacles[0])?.label.toLowerCase()
    if (obsName) rationale.push(`Your daily tasks are tuned to help you beat ${obsName}.`)
  }
  // motivation note — speak to what actually drives them
  const motivationNote: Record<OnboardingAnswers['motivation'], string> = {
    rewards: 'You’re here for the rewards — every verified quest earns Aether and pushes you toward unlocks.',
    mastery: 'You want real mastery, so we leaned your path toward depth over box-ticking.',
    competition: 'You came to compete — these are traits that climb the leaderboard fastest.',
    purpose: 'You’re driven by purpose — we weighted your path toward the values you want to live by.',
  }
  rationale.push(motivationNote[a.motivation])

  // daily quest target — sized to the time you said you can commit. This is a
  // goal (how many of your dailies to aim for), not a cap.
  const TARGET: Record<OnboardingAnswers['dailyTime'], number> = { '15': 1, '30': 2, '60': 3, '90': 4 }
  const dailyQuestTarget = TARGET[a.dailyTime]
  const timeNote: Record<OnboardingAnswers['dailyTime'], string> = {
    '15': 'We kept it light — quick wins you can do in ~15 minutes.',
    '30': 'A balanced ~30-minute daily load to build momentum.',
    '60': 'A solid ~1-hour daily routine to accelerate.',
    '90': 'An intense 90-minute+ regimen — you came to ascend fast.',
  }
  rationale.push(
    `${timeNote[a.dailyTime]} Your daily target: ${dailyQuestTarget} quest${dailyQuestTarget > 1 ? 's' : ''} a day — enough to move without burning out.`,
  )

  return { startingLevel, startingExp, rationale, suggestedTraitIds: picked.slice(0, 3), dailyQuestTarget }
}
