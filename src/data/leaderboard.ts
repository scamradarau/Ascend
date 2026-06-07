// Reward info per leaderboard (deck slide 24). The boards themselves are
// built live from registered accounts — see store/leaderboard.ts.

// Monthly quest reward info per board (slide 24)
export const REWARD_INFO = {
  quests: {
    title: 'MONTHLY QUEST REWARDS',
    body: 'Rewarded to the top 5 players on the Quests leaderboard, rotated monthly so every player has a fair shot at the top. Rewards include Books, Courses, Memberships & more!',
    rotation: 'Monthly',
  },
  stat: {
    title: 'STAT REWARDS',
    body: 'Rewarded to the top 5 players in each Stat category, rotated every 3 months. Rewards include Gift Cards, Memberships, Fitness Gear & more!',
    rotation: 'Every 3 months',
  },
  legendary: {
    title: 'LEGENDARY REWARDS',
    body: 'Rewarded to the top 5 on the Legendary leaderboard, rotated every 6 months. The most prized rewards — IRL Cash, Memberships, Technology & more!',
    rotation: 'Every 6 months',
  },
}
