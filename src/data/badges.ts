import type { Badge } from './types'

// Badges & Achievements — earned via levelling traits and completing
// quest milestones. Higher tiers unlock bigger real-world rewards.
export const BADGES: Badge[] = [
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    desc: 'Build something of your own and make it real.',
    icon: '💼',
    reward: 'HIGH',
    requirements: [
      { label: 'Own more than 1 business', done: 1, total: 2 },
      { label: 'Earn over $100k revenue in your business', done: 0, total: 1 },
      { label: 'Reach level 10 Diligence', done: 0, total: 1 },
    ],
  },
  {
    id: 'overachiever',
    name: 'Overachiever',
    desc: 'Dominate the ladders. Prove you belong at the top.',
    icon: '🏆',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach rank 1 on the Legendary leaderboard', done: 1, total: 1 },
      { label: 'Reach rank 1 on the Quests leaderboard', done: 1, total: 1 },
      { label: 'Reach rank 1 on the Stat leaderboard', done: 0, total: 2 },
    ],
  },
  {
    id: 'iron-will',
    name: 'Iron Will',
    desc: 'Forge unbreakable discipline through pure consistency.',
    icon: '⚙️',
    reward: 'MID',
    requirements: [
      { label: 'Maintain a 30-day streak', done: 12, total: 30 },
      { label: 'Reach level 10 Self-Discipline', done: 4, total: 10 },
      { label: 'Complete 50 daily quests', done: 20, total: 50 },
    ],
  },
  {
    id: 'scholar',
    name: 'Scholar',
    desc: 'Devour knowledge and prove you applied it.',
    icon: '📚',
    reward: 'MID',
    requirements: [
      { label: 'Finish 5 main-quest books', done: 1, total: 5 },
      { label: 'Reach level 10 Focus', done: 8, total: 10 },
    ],
  },
  {
    id: 'titan',
    name: 'Titan',
    desc: 'Build a body that turns heads and carries the mission.',
    icon: '🦾',
    reward: 'MID',
    requirements: [
      { label: 'Complete the 8-week Physique quest', done: 0, total: 1 },
      { label: '100 logged training sessions', done: 31, total: 100 },
    ],
  },
  {
    id: 'first-steps',
    name: 'First Steps',
    desc: 'Every legend started here.',
    icon: '🌱',
    reward: 'LOW',
    requirements: [
      { label: 'Complete onboarding', done: 1, total: 1 },
      { label: 'Pick your first 3 traits', done: 1, total: 1 },
      { label: 'Complete your first daily quest', done: 1, total: 1 },
    ],
  },
  {
    id: 'connector',
    name: 'Connector',
    desc: 'Build a network and a magnetic presence.',
    icon: '🤝',
    reward: 'MID',
    requirements: [
      { label: 'Reach level 8 Networking', done: 2, total: 8 },
      { label: 'Reach level 8 Communication', done: 1, total: 8 },
      { label: 'Post 20 times in the Guild', done: 4, total: 20 },
    ],
  },
  {
    id: 'sage',
    name: 'Sage',
    desc: 'Master your inner world.',
    icon: '🧘',
    reward: 'MID',
    requirements: [
      { label: 'Reach level 10 Mindfulness', done: 3, total: 10 },
      { label: 'Reach level 10 Stoic Equanimity', done: 0, total: 10 },
      { label: '300 minutes of verified meditation', done: 90, total: 300 },
    ],
  },
  {
    id: 'athlete',
    name: 'Athlete',
    desc: 'Forge an elite, capable body.',
    icon: '🏃',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach level 10 Physique', done: 2, total: 10 },
      { label: 'Complete a verified 5K', done: 0, total: 1 },
      { label: '90-day training streak', done: 12, total: 90 },
    ],
  },
  {
    id: 'polymath',
    name: 'Polymath',
    desc: 'Level traits across all five attributes.',
    icon: '🌌',
    reward: 'HIGH',
    requirements: [
      { label: 'Reach level 5 in a Mind trait', done: 1, total: 5 },
      { label: 'Reach level 5 in a Will trait', done: 1, total: 5 },
      { label: 'Reach level 5 in a Heart trait', done: 0, total: 5 },
      { label: 'Reach level 5 in a Charisma trait', done: 0, total: 5 },
      { label: 'Reach level 5 in a Body trait', done: 0, total: 5 },
    ],
  },
]
