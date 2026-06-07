// ================================================================
// COSMETICS — avatar progression that ties to achievement.
// Helmets upgrade as you rank up (deck: "Basic Knight helmet → Samurai
// Helmet"). Auras, frames and skins are unlocked by level, badges,
// streaks or bought with Aether — and you can cycle back any time.
// ================================================================

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'

export const RARITY_COLOR: Record<Rarity, string> = {
  common: '#9aa7c7',
  uncommon: '#7cfc00',
  rare: '#22d3ee',
  epic: '#a855f7',
  legendary: '#fbbf24',
  mythic: '#ff4d6d',
}

export interface UnlockRule {
  level?: number
  badge?: string
  streak?: number
  buy?: number // Aether cost
  default?: boolean
}

export interface Cosmetic {
  id: string
  name: string
  rarity: Rarity
  unlock: UnlockRule
  desc: string
}

// ---- HELMETS (10 tiers, level-gated, cosmetic crown of progression) ----
export const HELMETS: Cosmetic[] = [
  { id: 'none', name: 'Bare', rarity: 'common', unlock: { default: true }, desc: 'No helmet. The raw you.' },
  { id: 'hood', name: 'Initiate Hood', rarity: 'common', unlock: { level: 3 }, desc: 'A humble cloth hood — the journey begins.' },
  { id: 'circlet', name: 'Focus Circlet', rarity: 'uncommon', unlock: { level: 8 }, desc: 'A thin band that sharpens the mind.' },
  { id: 'knight', name: 'Knight Helm', rarity: 'uncommon', unlock: { level: 15 }, desc: 'Steel plate. Disciplined and unshakeable.' },
  { id: 'ranger', name: 'Ranger Visor', rarity: 'rare', unlock: { level: 22 }, desc: 'Swift, precise, always scanning the horizon.' },
  { id: 'samurai', name: 'Samurai Kabuto', rarity: 'rare', unlock: { level: 30 }, desc: 'Honour forged in iron. The classic upgrade.' },
  { id: 'mage', name: 'Archmage Cowl', rarity: 'epic', unlock: { level: 40 }, desc: 'Crackling with arcane focus.' },
  { id: 'warlord', name: 'Warlord Crown', rarity: 'legendary', unlock: { level: 50 }, desc: 'Worn only by those who command their own life.' },
  { id: 'ascendant', name: 'Ascendant Halo', rarity: 'mythic', unlock: { level: 65 }, desc: 'A ring of pure light. You’ve transcended.' },
  { id: 'phoenix', name: 'Phoenix Crest', rarity: 'mythic', unlock: { streak: 30 }, desc: 'Reborn from a 30-day unbroken streak.' },
]

// ---- AURAS (glow/particles around the avatar) ----
export const AURAS: Cosmetic[] = [
  { id: 'none', name: 'None', rarity: 'common', unlock: { default: true }, desc: 'No aura.' },
  { id: 'spark', name: 'Spark', rarity: 'uncommon', unlock: { level: 5 }, desc: 'A faint energetic shimmer.' },
  { id: 'ember', name: 'Ember', rarity: 'rare', unlock: { badge: 'scholar' }, desc: 'Smouldering focus. Earned by finishing a book.' },
  { id: 'frost', name: 'Frost', rarity: 'rare', unlock: { buy: 800 }, desc: 'Cool, calm, collected.' },
  { id: 'void', name: 'Void', rarity: 'epic', unlock: { buy: 1800 }, desc: 'Deep cosmic pull.' },
  { id: 'solar', name: 'Solar Flare', rarity: 'legendary', unlock: { badge: 'overachiever' }, desc: 'Radiance of a ladder-topper.' },
  { id: 'phoenix', name: 'Phoenix Flame', rarity: 'mythic', unlock: { streak: 30 }, desc: 'Living fire of relentless consistency.' },
]

// ---- FRAMES (rank ring around the avatar portrait) ----
export const FRAMES: Cosmetic[] = [
  { id: 'basic', name: 'Basic Ring', rarity: 'common', unlock: { default: true }, desc: 'Standard issue.' },
  { id: 'bronze', name: 'Bronze Sigil', rarity: 'uncommon', unlock: { level: 10 }, desc: 'First milestone frame.' },
  { id: 'cyan', name: 'Cyber Frame', rarity: 'rare', unlock: { level: 25 }, desc: 'Angular HUD frame.' },
  { id: 'gold', name: 'Gilded Frame', rarity: 'legendary', unlock: { level: 50 }, desc: 'For the warlords.' },
  { id: 'prism', name: 'Prism Frame', rarity: 'mythic', unlock: { buy: 3000 }, desc: 'Refracts every colour.' },
]

// ---- SKINS (avatar body energy colour) ----
export const SKINS: Cosmetic[] = [
  { id: 'cyan', name: 'Cyan Core', rarity: 'common', unlock: { default: true }, desc: 'Default energy signature.' },
  { id: 'violet', name: 'Violet Core', rarity: 'uncommon', unlock: { level: 12 }, desc: 'Arcane hue.' },
  { id: 'emerald', name: 'Emerald Core', rarity: 'rare', unlock: { buy: 600 }, desc: 'Growth incarnate.' },
  { id: 'crimson', name: 'Crimson Core', rarity: 'epic', unlock: { buy: 1500 }, desc: 'Burning drive.' },
  { id: 'aurora', name: 'Aurora Core', rarity: 'mythic', unlock: { badge: 'iron-will' }, desc: 'Shifting northern lights.' },
]

export interface AvatarConfig {
  helmet: string
  aura: string
  frame: string
  skin: string
}

export const DEFAULT_AVATAR: AvatarConfig = {
  helmet: 'none',
  aura: 'none',
  frame: 'basic',
  skin: 'cyan',
}

export const COSMETIC_GROUPS = { helmet: HELMETS, aura: AURAS, frame: FRAMES, skin: SKINS } as const
export type CosmeticSlot = keyof typeof COSMETIC_GROUPS

// Is a cosmetic unlocked given the player's state?
export function isUnlocked(
  c: Cosmetic,
  ctx: { level: number; streak: number; badges: string[]; purchased: string[] },
): boolean {
  if (c.unlock.default) return true
  if (c.unlock.buy !== undefined) return ctx.purchased.includes(c.id)
  if (c.unlock.level !== undefined) return ctx.level >= c.unlock.level
  if (c.unlock.streak !== undefined) return ctx.streak >= c.unlock.streak
  if (c.unlock.badge !== undefined) return ctx.badges.includes(c.unlock.badge)
  return false
}

export function unlockLabel(c: Cosmetic): string {
  if (c.unlock.default) return 'Default'
  if (c.unlock.level !== undefined) return `Reach Lv ${c.unlock.level}`
  if (c.unlock.streak !== undefined) return `${c.unlock.streak}-day streak`
  if (c.unlock.badge !== undefined) return `Earn the ${c.unlock.badge} badge`
  if (c.unlock.buy !== undefined) return `Buy · ${c.unlock.buy} ◈`
  return 'Locked'
}

export function findCosmetic(slot: CosmeticSlot, id: string): Cosmetic {
  return COSMETIC_GROUPS[slot].find((c) => c.id === id) ?? COSMETIC_GROUPS[slot][0]
}
