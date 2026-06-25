import { DEFAULT_AVATAR } from './cosmetics'
import { TRAITS } from './traits'
import type { PlayerRow, TraitStat } from '../store/leaderboard'

// ================================================================
// Seed bots — synthetic players so the leaderboard / friends list don't
// look dead at launch. Generated DETERMINISTICALLY from a fixed seed so
// the roster is identical on every load and every device (no reshuffle).
// They resolve to a real profile when clicked. Replace/remove once there's
// an organic player base.
// ================================================================

// mulberry32 — tiny deterministic PRNG
function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const NAMES = [
  'Zephyr', 'Kairo', 'Nyx', 'Vortex', 'Ronin', 'Sable', 'Onyx', 'Kestrel', 'Vale', 'Drake',
  'Lyra', 'Cipher', 'Atlas', 'Koda', 'Mira', 'Vega', 'Talon', 'Echo', 'Wren', 'Ezra',
  'Nova', 'Kade', 'Soren', 'Jett', 'Orin', 'Sol', 'Lux', 'Iris',
]
const REGIONS = ['OCE', 'NA', 'EU', 'ASIA', 'SA']
const HELMETS = ['none', 'hood', 'circlet', 'knight', 'ranger', 'samurai', 'mage']
const AURAS = ['none', 'none', 'spark', 'tide', 'frost', 'bloom']
const FRAMES = ['basic', 'basic', 'bronze', 'silver', 'cyan']
const SKINS = ['cyan', 'violet', 'emerald', 'crimson']
const pick = <T>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)]

export const BOTS: PlayerRow[] = (() => {
  const r = rng(20260624)
  const out: PlayerRow[] = []
  for (let i = 0; i < 22; i++) {
    const roll = r()
    // weighted toward low-mid levels, with a few high climbers
    const level = roll < 0.55 ? 2 + Math.floor(r() * 14) : roll < 0.85 ? 16 + Math.floor(r() * 18) : 34 + Math.floor(r() * 13)
    const statLevel = Math.max(1, Math.floor(level * (0.5 + r() * 0.45)))
    const sr = r()
    const streak = sr < 0.5 ? Math.floor(r() * 7) : sr < 0.85 ? 7 + Math.floor(r() * 20) : 27 + Math.floor(r() * 30)
    const handle = NAMES[i % NAMES.length] + (r() < 0.4 ? String(10 + Math.floor(r() * 89)) : '')
    const tcount = 1 + Math.floor(r() * 3)
    const traits: TraitStat[] = []
    for (let t = 0; t < tcount; t++) {
      const def = TRAITS[Math.floor(r() * TRAITS.length)]
      traits.push({ id: def.id, name: def.name, attribute: def.attribute, level: Math.max(1, Math.floor(statLevel * (0.4 + r() * 0.6))) })
    }
    out.push({
      id: `bot-${i + 1}`,
      username: handle,
      handle,
      level,
      statLevel,
      quests: Math.floor(level * (1 + r() * 3)),
      trust: r() < 0.85 ? 80 + Math.floor(r() * 21) : 58 + Math.floor(r() * 22),
      region: pick(r, REGIONS),
      age: 16 + Math.floor(r() * 19),
      streak,
      avatar: {
        ...DEFAULT_AVATAR,
        helmet: level >= 15 ? pick(r, HELMETS) : 'none',
        aura: pick(r, AURAS),
        frame: pick(r, FRAMES),
        skin: pick(r, SKINS),
      },
      traits,
      badges: [],
      plus: r() < 0.18,
      memberSince: new Date(Date.now() - Math.floor(r() * 60) * 86400000).toISOString(),
    })
  }
  return out
})()

export function botById(id: string): PlayerRow | null {
  return BOTS.find((b) => b.id === id) ?? null
}
