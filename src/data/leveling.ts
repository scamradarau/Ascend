// ----------------------------------------------------------------
// EXP & level math (shared by player level and per-trait levels)
// ----------------------------------------------------------------

// EXP required to advance FROM `level` to `level + 1`.
export function expForLevel(level: number): number {
  return Math.round(100 + (level - 1) * 35)
}

// Cumulative EXP required to *reach* a given level from level 1.
export function totalExpToReach(level: number): number {
  let total = 0
  for (let l = 1; l < level; l++) total += expForLevel(l)
  return total
}

// Given total accumulated EXP, derive the current level + progress within it.
export function levelFromTotalExp(totalExp: number): {
  level: number
  intoLevel: number
  needed: number
  pct: number
} {
  let level = 1
  let remaining = totalExp
  while (remaining >= expForLevel(level)) {
    remaining -= expForLevel(level)
    level++
  }
  const needed = expForLevel(level)
  return {
    level,
    intoLevel: remaining,
    needed,
    pct: Math.min(100, Math.round((remaining / needed) * 100)),
  }
}
