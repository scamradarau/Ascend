import { useGame, type GameState } from './useGame'
import { useAuth } from './auth'
import { levelFromTotalExp } from '../data/leveling'
import { traitById } from '../data/traits'
import {
  isCloud,
  saveCloudSave,
  loadCloudSave,
  upsertCloudProfile,
  fetchEarnedProgress,
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
    // server-owned source of trait progression (Step 2 will compute this server-side)
    trait_exp: Object.fromEntries(s.activeTraits.map((t) => [t.id, t.exp || 0])),
  }
}

// Pull the cloud save into the local cache + rehydrate the store.
export async function hydrateFromCloud(userId: string): Promise<boolean> {
  if (!isCloud) return false
  const data = await loadCloudSave(userId)
  if (!data) return false
  localStorage.setItem(saveKey(userId), JSON.stringify({ state: data, version: 3 }))
  await useGame.persist.rehydrate()

  // Overlay server-owned earned values so `profiles` is the source of truth
  // for EXP/trust/streak/trait levels (Step 2 makes the server the only writer).
  // Guarded so an empty/absent server value never zeroes local progress.
  const prog = await fetchEarnedProgress(userId)
  if (prog) {
    useGame.setState((s) => ({
      totalExp: typeof prog.total_exp === 'number' ? prog.total_exp : s.totalExp,
      trust: typeof prog.trust === 'number' ? prog.trust : s.trust,
      streak: typeof prog.streak === 'number' ? prog.streak : s.streak,
      questsThisMonth:
        typeof prog.quests_this_month === 'number' ? prog.quests_this_month : s.questsThisMonth,
      earnedBadges: Array.isArray(prog.earned_badges) ? prog.earned_badges : s.earnedBadges,
      activeTraits:
        prog.trait_exp && Object.keys(prog.trait_exp).length
          ? s.activeTraits.map((t) =>
              prog.trait_exp![t.id] != null ? { ...t, exp: prog.trait_exp![t.id] } : t,
            )
          : s.activeTraits,
    }))
  }
  return true
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
