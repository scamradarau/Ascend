// ================================================================
// SEASONS - a rotating "battle pass" of self-improvement.
// Earning EXP also earns Season XP; each tier grants Aether or a
// cosmetic. Resets periodically to keep the meta fresh and give
// everyone a fresh shot at the top (mirrors the deck's reward rotation).
// ================================================================

export interface SeasonTier {
  tier: number
  xp: number // cumulative season xp to reach this tier
  reward: string
  aether?: number
  cosmetic?: { slot: 'helmet' | 'aura' | 'frame' | 'skin'; id: string }
}

export interface Season {
  id: string
  name: string
  endsOn: string
  xpPerTier: number
  tiers: SeasonTier[]
}

export const CURRENT_SEASON: Season = {
  id: 's1',
  name: 'Season 1 · Ignition',
  endsOn: '2026-08-31',
  xpPerTier: 500,
  tiers: Array.from({ length: 20 }, (_, i) => {
    const tier = i + 1
    const base: SeasonTier = {
      tier,
      xp: tier * 500,
      reward: `${100 + tier * 20} Aether`,
      aether: 100 + tier * 20,
    }
    if (tier === 5) return { ...base, reward: 'Frost Aura', cosmetic: { slot: 'aura', id: 'frost' } }
    if (tier === 10) return { ...base, reward: 'Cyber Frame', cosmetic: { slot: 'frame', id: 'cyan' } }
    if (tier === 15) return { ...base, reward: 'Violet Core', cosmetic: { slot: 'skin', id: 'violet' } }
    if (tier === 20)
      return { ...base, reward: 'Void Aura', cosmetic: { slot: 'aura', id: 'void' } }
    return base
  }),
}

export function seasonProgress(seasonXp: number) {
  const tier = Math.min(
    CURRENT_SEASON.tiers.length,
    Math.floor(seasonXp / CURRENT_SEASON.xpPerTier),
  )
  const intoTier = seasonXp % CURRENT_SEASON.xpPerTier
  return {
    tier,
    intoTier,
    perTier: CURRENT_SEASON.xpPerTier,
    pct: Math.round((intoTier / CURRENT_SEASON.xpPerTier) * 100),
  }
}
