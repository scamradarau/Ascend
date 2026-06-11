import type { Rank } from './types'

// Rank ladder — each bracket sets the life expectations for that tier.
// Modelled on the deck's "WARLORD (lv51)" expectations page.
export const RANKS: Rank[] = [
  {
    id: 'rookie',
    title: 'Rookie',
    minLevel: 1,
    maxLevel: 9,
    theme: 'The journey begins. You’ve shown up — that already puts you ahead.',
    expectations: [
      'Show up daily to your quests',
      'Basic routine forming',
      'Reading 10+ pages a week',
      'Moving your body 2×/week',
    ],
  },
  {
    id: 'apprentice',
    title: 'Apprentice',
    minLevel: 10,
    maxLevel: 19,
    theme: 'Habits are taking root. Momentum is real now.',
    expectations: [
      'A consistent morning routine',
      'Training 3×/week',
      'Finished your first main quest book',
      'Some savings set aside',
    ],
  },
  {
    id: 'adventurer',
    title: 'Adventurer',
    minLevel: 20,
    maxLevel: 29,
    theme: 'You’ve left the tutorial zone. Real skills are forming.',
    expectations: [
      'Stable income',
      'Visibly improving physique',
      'A skill you’re actively monetising or could',
      'Basic financial literacy',
    ],
  },
  {
    id: 'champion',
    title: 'Champion',
    minLevel: 30,
    maxLevel: 39,
    theme: 'Disciplined, capable, respected. You hold the line.',
    expectations: [
      'Athletic, healthy body',
      'Emergency fund (3–6 months)',
      'Leading a project or small team',
      'Investing consistently',
    ],
  },
  {
    id: 'sage',
    title: 'Sage',
    minLevel: 40,
    maxLevel: 49,
    theme: 'Mastery of craft. You bend systems to your will.',
    expectations: [
      'Intermediate financial knowledge',
      'A high-income skill mastered',
      'Side income stream running',
      'Strong, deep relationships',
    ],
  },
  {
    id: 'conqueror',
    title: 'Conqueror',
    minLevel: 50,
    maxLevel: 64,
    theme: 'You command your life. Income, body, and craft compound on your terms.',
    expectations: [
      'Own a business or 6-figure income',
      'Athletic, confident presence',
      'Intermediate business knowledge',
      'Property or serious assets building',
    ],
  },
  {
    id: 'legend',
    title: 'Legend',
    minLevel: 65,
    maxLevel: 79,
    theme: 'Few reach this tier. You build things that outlast you.',
    expectations: [
      'Multiple income streams',
      'A business that runs without you daily',
      'Mentoring others up the ladder',
      'Elite health & energy',
    ],
  },
  {
    id: 'ascendant',
    title: 'Ascendant',
    minLevel: 80,
    maxLevel: 999,
    theme: 'The endgame. Freedom of time, body, mind and money.',
    expectations: [
      'Financial freedom',
      'Peak physical condition',
      'Deep mastery & legacy',
      'Lifting others to the top of the ladder',
    ],
  },
]

export const rankForLevel = (level: number): Rank =>
  RANKS.find((r) => level >= r.minLevel && level <= r.maxLevel) ?? RANKS[RANKS.length - 1]

export const nextRank = (level: number): Rank | undefined => {
  const current = rankForLevel(level)
  const idx = RANKS.indexOf(current)
  return RANKS[idx + 1]
}
