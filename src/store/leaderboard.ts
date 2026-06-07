import { getAccounts, saveKeyFor } from './auth'
import { levelFromTotalExp } from '../data/leveling'
import { DEFAULT_AVATAR, type AvatarConfig } from '../data/cosmetics'
import { traitById } from '../data/traits'
import { fetchLeaderboard, fetchProfile, type CloudProfile } from '../lib/supabase'

// Aggregate live leaderboard rows from every registered account's save.
// Empty at launch; fills in as real users sign up and make progress.
// (Cross-device boards need a server — this reads all accounts on THIS
// device, which is the honest client-only equivalent.)

export interface TraitStat {
  id: string
  name: string
  attribute: string
  level: number
}

export interface PlayerRow {
  id: string
  username: string
  handle: string
  level: number
  statLevel: number
  quests: number
  trust: number
  region: string
  age: number | ''
  streak: number
  avatar: AvatarConfig
  traits: TraitStat[]
  badges: string[]
  memberSince?: string
}

function rowFromSave(accId: string, username: string, createdAt?: string): PlayerRow | null {
  try {
    const raw = localStorage.getItem(saveKeyFor(accId))
    if (!raw) return null
    const state = JSON.parse(raw)?.state
    if (!state?.onboarded || !state?.profile) return null
    const traits: TraitStat[] = (state.activeTraits || []).map((t: { id: string; exp?: number }) => {
      const def = traitById(t.id)
      return {
        id: t.id,
        name: def?.name ?? t.id,
        attribute: def?.attribute ?? 'mind',
        level: levelFromTotalExp(t.exp || 0).level,
      }
    })
    return {
      id: accId,
      username,
      handle: state.profile.handle || username,
      level: levelFromTotalExp(state.totalExp || 0).level,
      statLevel: traits.reduce((m, t) => Math.max(m, t.level), 0),
      quests: state.questsThisMonth || 0,
      trust: state.trust ?? 100,
      region: state.profile.region || '—',
      age: state.profile.age ?? '',
      streak: state.streak || 0,
      avatar: { ...DEFAULT_AVATAR, ...(state.avatar || {}) },
      traits,
      badges: state.earnedBadges || [],
      memberSince: createdAt,
    }
  } catch {
    return null
  }
}

export function getAllPlayers(): PlayerRow[] {
  const rows: PlayerRow[] = []
  for (const acc of getAccounts()) {
    const r = rowFromSave(acc.id, acc.username, acc.createdAt)
    if (r) rows.push(r)
  }
  return rows
}

export function getPlayer(id: string): PlayerRow | null {
  const acc = getAccounts().find((a) => a.id === id)
  if (!acc) return null
  return rowFromSave(acc.id, acc.username, acc.createdAt)
}

// ---------------------------------------------------------------
// Cloud variants — read from Supabase `profiles` (cross-device)
// ---------------------------------------------------------------
function cloudToRow(p: CloudProfile): PlayerRow {
  const traits: TraitStat[] = (p.traits || []).map((t) => {
    const def = traitById(t.id)
    return { id: t.id, name: def?.name ?? t.id, attribute: def?.attribute ?? 'mind', level: t.level }
  })
  return {
    id: p.id,
    username: p.handle,
    handle: p.handle,
    level: levelFromTotalExp(p.total_exp || 0).level,
    statLevel: traits.reduce((m, t) => Math.max(m, t.level), 0),
    quests: p.quests_this_month || 0,
    trust: p.trust ?? 100,
    region: p.region || '—',
    age: p.age ?? '',
    streak: p.streak || 0,
    avatar: { ...DEFAULT_AVATAR, ...((p.avatar as object) || {}) },
    traits,
    badges: p.earned_badges || [],
    memberSince: p.updated_at,
  }
}

export async function getAllPlayersCloud(): Promise<PlayerRow[]> {
  const rows = await fetchLeaderboard()
  return rows.map(cloudToRow)
}

export async function getPlayerCloud(id: string): Promise<PlayerRow | null> {
  const p = await fetchProfile(id)
  return p ? cloudToRow(p) : null
}
