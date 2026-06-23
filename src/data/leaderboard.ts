// Reward info per leaderboard (deck slide 24). The boards themselves are
// built live from registered accounts - see store/leaderboard.ts.

// Monthly quest reward info per board (slide 24)
export const REWARD_INFO = {
  quests: {
    title: 'MONTHLY QUEST REWARDS',
    body: 'Rewarded to the top 5 players on the Quests leaderboard, rotated monthly so everyone gets a fair shot. Low-cost, high-value perks: free app memberships (meditation, fitness & habit apps), ebooks and discount codes.',
    rotation: 'Monthly',
  },
  stat: {
    title: 'STAT REWARDS',
    body: 'Rewarded to the top 5 in each Stat category, rotated every 3 months. Free trial memberships, ebooks, exclusive avatar cosmetics and a community shout-out.',
    rotation: 'Every 3 months',
  },
  legendary: {
    title: 'LEGENDARY REWARDS',
    body: 'Rewarded to the top 5 on the Legendary leaderboard, rotated every 6 months. Free premium memberships, a featured spotlight, and limited-edition cosmetic items.',
    rotation: 'Every 6 months',
  },
}
