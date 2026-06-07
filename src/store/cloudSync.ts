import { useGame, type GameState } from './useGame'
import { useAuth } from './auth'
import { levelFromTotalExp } from '../data/leveling'
import { traitById } from '../data/traits'
import {
  isCloud,
  saveCloudSave,
  loadCloudSave,
  upsertCloudProfile,
  type CloudProfile,
} from '../lib/supabase'

// ================================================================
// Cloud sync — when the Supabase backend is configured, mirror each
// player's save to Postgres and keep a public profile row up to date
// (which powers the cross-device leaderboard). Local mode is untouched.
// ================================================================

const saveKey = (id: string) => `ascend-save-${id}`

// the public, leaderboard-facing summary derived from full state
export function profileSummary(id: string, handle: string, s: GameState): Partial<CloudProfile> & { id: string } {
  return {
    id,
    handle,
    region: s.profile?.region || 'OCE',
    age: typeof s.profile?.age === 'number' ? s.profile.age : null,
    total_exp: s.totalExp,
    trust: s.trust,
    streak: s.streak,
    quests_this_month: s.questsThisMonth,
    avatar: s.avatar,
    earned_badges: s.earnedBadges,
    traits: s.activeTraits.map((t) => ({ id: t.id, level: levelFromTotalExp(t.exp || 0).level })),
  }
}

// Pull the cloud save into the local cache + rehydrate the store.
export async function hydrateFromCloud(userId: string): Promise<boolean> {
  if (!isCloud) return false
  const data = await loadCloudSave(userId)
  if (data) {
    localStorage.setItem(saveKey(userId), JSON.stringify({ state: data, version: 3 }))
    await useGame.persist.rehydrate()
    return true
  }
  return false
}

let timer: number | null = null
let started = false

function pushNow() {
  if (!isCloud) return
  const user = useAuth.getState().user
  const s = useGame.getState()
  if (!user || !s.onboarded) return
  // serialize the same way the persist layer does (functions dropped)
  const plain = JSON.parse(JSON.stringify(s)) as GameState
  void saveCloudSave(user.id, plain)
  void upsertCloudProfile(profileSummary(user.id, user.username, s))
}

// Start a debounced subscriber that mirrors every change to the cloud.
export function startCloudSync() {
  if (!isCloud || started) return
  started = true
  useGame.subscribe(() => {
    if (timer) clearTimeout(timer)
    timer = window.setTimeout(pushNow, 1500)
  })
}

// Force an immediate push (e.g. right after onboarding completes).
export function flushCloud() {
  if (timer) clearTimeout(timer)
  pushNow()
}
