// Rotating daily wisdom - one quote per calendar day (deterministic).
export const WISDOM: { quote: string; by: string }[] = [
  { quote: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.', by: 'Aristotle' },
  { quote: 'Discipline equals freedom.', by: 'Jocko Willink' },
  { quote: 'You do not rise to the level of your goals. You fall to the level of your systems.', by: 'James Clear' },
  { quote: 'The successful warrior is the average man, with laser-like focus.', by: 'Bruce Lee' },
  { quote: 'It is not that we have a short time to live, but that we waste a lot of it.', by: 'Seneca' },
  { quote: 'The mind is everything. What you think you become.', by: 'Buddha' },
  { quote: 'Hard choices, easy life. Easy choices, hard life.', by: 'Jerzy Gregorek' },
  { quote: 'What stands in the way becomes the way.', by: 'Marcus Aurelius' },
  { quote: 'The best time to plant a tree was 20 years ago. The second best time is now.', by: 'Proverb' },
  { quote: 'Motivation gets you going, but discipline keeps you growing.', by: 'John C. Maxwell' },
  { quote: 'You will never always be motivated. You have to learn to be disciplined.', by: 'Unknown' },
  { quote: 'A year from now you may wish you had started today.', by: 'Karen Lamb' },
  { quote: 'Suffer the pain of discipline or suffer the pain of regret.', by: 'Jim Rohn' },
  { quote: 'Comparison is the thief of joy.', by: 'Theodore Roosevelt' },
  { quote: 'The obstacle is the path.', by: 'Zen Proverb' },
  { quote: 'Small disciplines repeated with consistency lead to great achievements.', by: 'John C. Maxwell' },
  { quote: 'Don’t count the days, make the days count.', by: 'Muhammad Ali' },
  { quote: 'He who has a why to live can bear almost any how.', by: 'Friedrich Nietzsche' },
  { quote: 'Action is the foundational key to all success.', by: 'Pablo Picasso' },
  { quote: 'Fall seven times, stand up eight.', by: 'Japanese Proverb' },
  { quote: 'The man who moves a mountain begins by carrying away small stones.', by: 'Confucius' },
  { quote: 'Energy and persistence conquer all things.', by: 'Benjamin Franklin' },
  { quote: 'Do something today that your future self will thank you for.', by: 'Sean Patrick Flanery' },
  { quote: 'We suffer more in imagination than in reality.', by: 'Seneca' },
  { quote: 'The cave you fear to enter holds the treasure you seek.', by: 'Joseph Campbell' },
  { quote: 'Either you run the day or the day runs you.', by: 'Jim Rohn' },
  { quote: 'What you stay focused on will grow.', by: 'Roy T. Bennett' },
  { quote: 'Be so good they can’t ignore you.', by: 'Steve Martin' },
  { quote: 'The only way out is through.', by: 'Robert Frost' },
  { quote: 'Today’s accomplishments were yesterday’s impossibilities.', by: 'Robert H. Schuller' },
]

export function dailyWisdom() {
  const start = new Date(new Date().getFullYear(), 0, 0)
  const diff = Date.now() - start.getTime()
  const day = Math.floor(diff / 86400000)
  return WISDOM[day % WISDOM.length]
}
