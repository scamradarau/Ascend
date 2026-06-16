import { useEffect, useRef } from 'react'
import { useGame } from '../store/useGame'
import { playSfx } from '../lib/sfx'

// Mounted once in the app shell: recomputes badge awards whenever anything
// that feeds a badge requirement changes (trait levels, streak, quests,
// leaderboard peaks…), and chimes when a new badge is earned. The heavy
// lifting is in the store's syncBadges() + data/badgeEngine.ts.
export default function BadgeWatcher() {
  const totalExp = useGame((s) => s.totalExp)
  const bestStreak = useGame((s) => s.bestStreak)
  const lifetimeQuests = useGame((s) => s.lifetimeQuests)
  const peakBoards = useGame((s) => s.peakBoards)
  const completedCount = useGame((s) => s.completedQuests.length)
  const activeTraits = useGame((s) => s.activeTraits)
  const onboarded = useGame((s) => s.onboarded)
  const earnedCount = useGame((s) => s.earnedBadges.length)
  const syncBadges = useGame((s) => s.syncBadges)

  useEffect(() => {
    syncBadges()
  }, [totalExp, bestStreak, lifetimeQuests, peakBoards, completedCount, activeTraits, onboarded, syncBadges])

  // chime on a newly earned badge (not on the initial mount count)
  const prev = useRef(earnedCount)
  useEffect(() => {
    if (earnedCount > prev.current) playSfx('levelUp')
    prev.current = earnedCount
  }, [earnedCount])

  return null
}
