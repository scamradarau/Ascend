import { useEffect, useState } from 'react'

// ================================================================
// RESET COUNTDOWN — live "time until reset" for daily / weekly /
// monthly quests. The targets below mirror EXACTLY how the quest
// period keys are computed (see store/useGame.ts + data/challenges.ts):
//   • daily   → keyed by UTC date  → next UTC midnight
//   • weekly  → ISO week (UTC, Mon) → next Monday 00:00 UTC
//   • monthly → local year-month   → local midnight on the 1st
// Keeping these in lock-step means the countdown hits 0 the instant
// the underlying progress actually rolls over.
// ================================================================

export function nextDailyReset(now = new Date()): number {
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1)
}

export function nextWeeklyReset(now = new Date()): number {
  const day = now.getUTCDay() // Sun=0 .. Sat=6
  let untilMonday = (1 - day + 7) % 7
  if (untilMonday === 0) untilMonday = 7 // it's Monday → next Monday
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + untilMonday)
}

export function nextMonthlyReset(now = new Date()): number {
  return new Date(now.getFullYear(), now.getMonth() + 1, 1).getTime()
}

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
