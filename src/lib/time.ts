// ================================================================
// TIME — all quest reset boundaries are anchored to SYDNEY local time
// (Australia/Sydney), so dailies/weeklies/monthlies roll over at
// Sydney midnight regardless of the player's device timezone. DST
// (AEST ↔ AEDT) is handled automatically via the Intl APIs.
//
// The period-key functions (todayKey/weekKey/monthKey) and the
// next-reset timestamps are computed from the SAME Sydney wall clock,
// so the on-screen countdown hits zero exactly when progress resets.
// ================================================================

const TZ = 'Australia/Sydney'

// (Sydney wall-clock − UTC) in ms at the given instant — the classic,
// DST-correct offset trick using locale round-tripping.
function tzOffsetMs(date: Date): number {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const syd = new Date(date.toLocaleString('en-US', { timeZone: TZ }))
  return syd.getTime() - utc.getTime()
}

// A Date whose LOCAL getFullYear/getMonth/getDate/getDay/getHours read
// the Sydney wall-clock values for `now`.
function sydWall(now = new Date()): Date {
  return new Date(now.toLocaleString('en-US', { timeZone: TZ }))
}

// Epoch ms for a given Sydney wall-clock moment (month is 0-indexed;
// day/month overflow rolls over naturally via Date.UTC).
function sydToEpoch(y: number, monthIndex: number, day: number, h = 0, m = 0, s = 0): number {
  const guess = Date.UTC(y, monthIndex, day, h, m, s)
  const offset = tzOffsetMs(new Date(guess))
  // refine once near the true instant so DST transitions stay accurate
  const refined = tzOffsetMs(new Date(guess - offset))
  return guess - refined
}

// ---- period keys (drive the resets) ----

/** Sydney calendar date as yyyy-mm-dd. */
export function todayKey(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

/** Sydney year-month, e.g. "2026-6". */
export function monthKey(now = new Date()): string {
  const w = sydWall(now)
  return `${w.getFullYear()}-${w.getMonth() + 1}`
}

/** ISO-week label rolling over at Sydney Monday 00:00. */
export function weekKey(now = new Date()): string {
  const w = sydWall(now)
  const date = new Date(Date.UTC(w.getFullYear(), w.getMonth(), w.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    )
  return `${date.getUTCFullYear()}-W${week}`
}

export function periodKeyFor(scope: 'weekly' | 'monthly'): string {
  return scope === 'weekly' ? weekKey() : monthKey()
}

// ---- next reset instants (drive the countdown) ----

export function nextDailyReset(now = new Date()): number {
  const w = sydWall(now)
  return sydToEpoch(w.getFullYear(), w.getMonth(), w.getDate() + 1)
}

export function nextWeeklyReset(now = new Date()): number {
  const w = sydWall(now)
  const day = w.getDay() // Sun=0 .. Sat=6 (Sydney)
  let untilMonday = (1 - day + 7) % 7
  if (untilMonday === 0) untilMonday = 7 // it's Monday → next Monday
  return sydToEpoch(w.getFullYear(), w.getMonth(), w.getDate() + untilMonday)
}

export function nextMonthlyReset(now = new Date()): number {
  const w = sydWall(now)
  return sydToEpoch(w.getFullYear(), w.getMonth() + 1, 1)
}
