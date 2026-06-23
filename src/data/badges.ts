import type { Badge } from './types'

// Badges & Achievements. Every requirement maps to a METRIC that is computed
// live from game state (see data/badgeEngine.ts) - so progress actually fills
// and badges award themselves. Criteria are all things the game can verify;
// nothing relies on unprovable real-world claims.
//
// Metric keys:
//   bestStreak            - highest streak ever reached
//   lifetimeQuests        - total verified quests completed
//   completedMains        - main quests completed
//   playerLevel           - overall character level
//   traitLevel:<id>       - level of a specific trait
//   attrTraitLevel:<attr> - highest trait level within an attribute
//   rank1:<board>         - reached rank 1 on a leaderboard (legendary|quests|stat)
//   onboarded             - finished onboarding
export const BADGES: Badge[] = [
  {
    id: 'first-steps',
    name: 'First Steps',
    desc: 'Every legend started here.',
    icon: '🌱',
    reward: 'LOW',
    requirements: [
      { label: 'Complete onboarding', total: 1, metric: 'onboarded' },
      { label: 'Reach character level 2', total: 2, metric: 'playerLevel' },
      { label: 'Complete 5 verified quests', total: 5, metric: 'lifetimeQuests' },
    ],
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    desc: 'Forge unbreakable discipline through pure consistency.',
    icon: '⚙️',
    reward: 'MID',
    requirements: [
      { label: 'Reach a 30-day streak', total: 30, metric: 'bestStreak' },
      { label: 'Reach level 10 Self-Discipline', total: 10, metric: 'traitLevel:self-discipline' },
      { label: 'Complete 50 verified quests', total: 50, metric: 'lifetimeQuests' },
    ],
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    desc: 'Build relentless drive - the engine behind anything you’ll create.',
    icon: '💼',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach level 10 Diligence', total: 10, metric: 'traitLevel:diligence' },
      { label: 'Reach level 8 Initiative', total: 8, metric: 'traitLevel:initiative' },
      { label: 'Complete 3 main quests', total: 3, metric: 'completedMains' },
    ],
  },
  {
    id: 'scholar',
    name: 'Scholar',
    desc: 'Devour knowledge and prove you applied it.',
    icon: '📚',
    reward: 'MID',
    requirements: [
      { label: 'Complete 5 main quests', total: 5, metric: 'completedMains' },
      { label: 'Reach level 10 Focus', total: 10, metric: 'traitLevel:focus' },
    ],
  },
  {
    id: 'titan',
    name: 'Titan',
    desc: 'Build raw strength that carries the mission.',
    icon: '🦾',
    reward: 'MID',
    requirements: [
      { label: 'Reach level 10 Physique', total: 10, metric: 'traitLevel:physique' },
      { label: 'Reach level 8 Vitality', total: 8, metric: 'traitLevel:vitality' },
    ],
  },
  {
    id: 'athlete',
    name: 'Athlete',
    desc: 'Forge elite conditioning and an engine that doesn’t quit.',
    icon: '🏃',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach level 10 Endurance', total: 10, metric: 'traitLevel:endurance' },
      { label: 'Reach level 8 Mobility', total: 8, metric: 'traitLevel:mobility' },
      { label: 'Reach a 60-day streak', total: 60, metric: 'bestStreak' },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    desc: 'Master your inner world.',
    icon: '🧘',
    reward: 'MID',
    requirements: [
      { label: 'Reach level 10 Mindfulness', total: 10, metric: 'traitLevel:mindfulness' },
      { label: 'Reach level 10 Stoic Equanimity', total: 10, metric: 'traitLevel:stoicism' },
      { label: 'Reach level 8 Gratitude', total: 8, metric: 'traitLevel:gratitude' },
    ],
  },
  {
    id: 'connector',
    name: 'Connector',
    desc: 'Build a network and a magnetic presence.',
    icon: '🤝',
    reward: 'MID',
    requirements: [
      { label: 'Reach level 8 Networking', total: 8, metric: 'traitLevel:networking' },
      { label: 'Reach level 8 Communication', total: 8, metric: 'traitLevel:communication' },
      { label: 'Reach level 6 Confidence', total: 6, metric: 'traitLevel:confidence' },
    ],
  },
  {
    id: 'polymath',
    name: 'Polymath',
    desc: 'Level traits across all five attributes.',
    icon: '🌌',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach level 5 in a Mind trait', total: 5, metric: 'attrTraitLevel:mind' },
      { label: 'Reach level 5 in a Will trait', total: 5, metric: 'attrTraitLevel:will' },
      { label: 'Reach level 5 in a Heart trait', total: 5, metric: 'attrTraitLevel:heart' },
      { label: 'Reach level 5 in a Charisma trait', total: 5, metric: 'attrTraitLevel:charisma' },
      { label: 'Reach level 5 in a Body trait', total: 5, metric: 'attrTraitLevel:body' },
    ],
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    desc: 'Dominate the ladders. Prove you belong at the top.',
    icon: '🏆',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach rank 1 on the Legendary leaderboard', total: 1, metric: 'rank1:legendary' },
      { label: 'Reach rank 1 on the Quests leaderboard', total: 1, metric: 'rank1:quests' },
      { label: 'Reach rank 1 on the Stat leaderboard', total: 1, metric: 'rank1:stat' },
    ],
  },
]
