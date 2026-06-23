import { useEffect, useState } from 'react'
import { nextDailyReset, nextWeeklyReset, nextMonthlyReset } from '../lib/time'

// ================================================================
// RESET COUNTDOWN - live "time until reset" for daily / weekly /
// monthly quests. Targets come from lib/time.ts, which anchors every
// reset to SYDNEY midnight (DST-aware) - the same wall clock the quest
// period keys use - so the countdown hits 0 the instant progress rolls
// over.
// ================================================================

function fmt(ms: number): string {
  if (ms < 0) ms = 0
  const total = Math.floor(ms / 1000)
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m`
  return `${pad(hours)}h ${pad(mins)}m ${pad(secs)}s`
}

const TARGET = {
  daily: nextDailyReset,
  weekly: nextWeeklyReset,
  monthly: nextMonthlyReset,
} as const

/**
 * Renders a live-ticking "resets in Xh Ym Zs" string. Pure inline text so it
 * can sit inside a Pill, a sentence, or a header. Ticks once per second.
 */
export default function ResetCountdown({
  scope,
  prefix = 'Resets in',
  className,
}: {
  scope: 'daily' | 'weekly' | 'monthly'
  prefix?: string
  className?: string
}) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  const remaining = TARGET[scope](new Date(now)) - now
  return (
    <span className={className} title={`Time until ${scope} quests reset`}>
      ⏳ {prefix} {fmt(remaining)}
    </span>
  )
}
