import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { OnboardingAnswers } from '../data/onboarding'
import { computeOnboarding } from '../data/onboarding'
import { traitById } from '../data/traits'
import { levelFromTotalExp } from '../data/leveling'
import type { VerificationResult, VerificationMethodId } from '../data/verification'
import { DEFAULT_AVATAR, type AvatarConfig, type CosmeticSlot } from '../data/cosmetics'
import { challengeById, periodKeyFor } from '../data/challenges'

// ----------------------------------------------------------------
// Persistent game state
// ----------------------------------------------------------------

export interface ActiveTrait {
  id: string
  exp: number
  mainQuestProgress: number
  mainQuestDone: boolean
}

export interface DailyLog {
  [taskKey: string]: string
}

export interface CompletedQuest {
  traitId: string
  title: string
  at: string
}

export interface Submission {
  id: string
  traitId: string
  taskId: string
  kind: 'daily' | 'main'
  label: string
  method: VerificationMethodId
  status: 'verified' | 'pending' | 'flagged'
  note: string
  meta: VerificationResult['meta']
  thumb?: string
  at: string
  reviewedBy?: 'owner'
  reviewNote?: string
}

export interface Profile {
  handle: string
  age: number | ''
  region: string
  occupation: string
  answers: OnboardingAnswers
}

const STARTING_TRUST = 100

export interface GameState {
  onboarded: boolean
  acceptedTerms: boolean
  theme: 'cosmos' | 'rune' | 'olympus'
  reduceMotion: boolean
  profile: Profile | null

  // progression
  totalExp: number
  seasonXp: number
  aether: number
  trust: number // integrity score 0..100
  activeTraits: ActiveTrait[]
  dailyLog: DailyLog
  completedQuests: CompletedQuest[]
  questsThisMonth: number
  streak: number
  lastActiveDate: string | null
  submissions: Submission[]
  earnedBadges: string[]

  // cosmetics
  avatar: AvatarConfig
  purchasedCosmetics: string[]

  // owner
  ownerMode: boolean

  // sleep-window scratch (night check-in waiting for morning)
  pendingSleep: { at: string } | null

  // weekly / monthly challenge progress (resets per period)
  challenges: Record<string, { count: number; period: string; done: boolean }>;

  // social — friends are other accounts' ids
  friends: string[]

  // ---- actions ----
  setTheme: (t: 'cosmos' | 'rune' | 'olympus') => void
  toggleReduceMotion: () => void
  acceptTerms: () => void
  completeOnboarding: (answers: OnboardingAnswers) => void
  addTrait: (traitId: string) => boolean
  dropTrait: (traitId: string) => void
  completeDailyTask: (
    traitId: string,
    taskId: string,
    payload: { exp: number; label: string },
    result: VerificationResult,
  ) => void
  advanceMainQuest: (
    traitId: string,
    payload: { label: string; steps: number },
    result: VerificationResult,
  ) => void
  reviewSubmission: (id: string, decision: 'approve' | 'reject', note?: string) => void
  setAvatar: (slot: CosmeticSlot, id: string) => void
  purchaseCosmetic: (id: string, cost: number) => boolean
  toggleOwnerMode: () => void
  setPendingSleep: (v: { at: string } | null) => void
  logChallenge: (id: string, result: VerificationResult) => { completed: boolean; exp: number }
  addFriend: (id: string) => void
  removeFriend: (id: string) => void
  resetAll: () => void
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const clampTrust = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

// Account-namespaced storage: the active save is keyed by the logged-in
// account id (from the auth session). When no one is logged in, reads
// return null and writes are no-ops, so anon state never leaks between
// accounts. See store/auth.ts for the login/logout rehydrate dance.
const accountStorage: StateStorage = {
  getItem: () => {
    const id = localStorage.getItem('ascend-session')
    return id ? localStorage.getItem(`ascend-save-${id}`) : null
  },
  setItem: (_name, value) => {
    const id = localStorage.getItem('ascend-session')
    if (id) localStorage.setItem(`ascend-save-${id}`, value)
  },
  removeItem: () => {
    const id = localStorage.getItem('ascend-session')
    if (id) localStorage.removeItem(`ascend-save-${id}`)
  },
}

function applyResultEconomy(
  state: GameState,
  expBase: number,
  result: VerificationResult,
): { expGain: number; aetherGain: number; trust: number } {
  // verified pays full; pending pays half and waits on review; flagged pays nothing
  const mult = result.status === 'verified' ? 1 : result.status === 'pending' ? 0.5 : 0
  const expGain = Math.round(expBase * mult)
  const aetherGain = Math.round((expBase / 4) * mult)
  const trust = clampTrust(state.trust + result.trustDelta)
  return { expGain, aetherGain, trust }
}

export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      acceptedTerms: false,
      theme: 'cosmos',
      reduceMotion: false,
      profile: null,
      totalExp: 0,
      seasonXp: 0,
      aether: 0,
      trust: STARTING_TRUST,
      activeTraits: [],
      dailyLog: {},
      completedQuests: [],
      questsThisMonth: 0,
      streak: 0,
      lastActiveDate: null,
      submissions: [],
      earnedBadges: [],
      avatar: { ...DEFAULT_AVATAR },
      purchasedCosmetics: [],
      ownerMode: false,
      pendingSleep: null,
      challenges: {},
      friends: [],

      setTheme: (t) => set({ theme: t }),
      toggleReduceMotion: () => set({ reduceMotion: !get().reduceMotion }),
      acceptTerms: () => set({ acceptedTerms: true }),

      completeOnboarding: (answers) => {
        const result = computeOnboarding(answers)
        const active: ActiveTrait[] = result.suggestedTraitIds.map((id) => ({
          id,
          exp: 0,
          mainQuestProgress: 0,
          mainQuestDone: false,
        }))
        set({
          onboarded: true,
          theme: answers.theme,
          profile: {
            handle: answers.handle || 'Ascender',
            age: answers.age,
            region: answers.region,
            occupation: answers.occupation,
            answers,
          },
          totalExp: result.startingExp,
          seasonXp: 0,
          aether: 250,
          trust: STARTING_TRUST,
          activeTraits: active,
          dailyLog: {},
          completedQuests: [],
          questsThisMonth: 0,
          streak: 0,
          lastActiveDate: null,
          submissions: [],
          earnedBadges: [],
          avatar: { ...DEFAULT_AVATAR },
          purchasedCosmetics: [],
          pendingSleep: null,
          challenges: {},
          friends: [],
        })
      },

      addTrait: (traitId) => {
        const { activeTraits } = get()
        if (activeTraits.length >= 3) return false
        if (activeTraits.some((t) => t.id === traitId)) return false
        set({
          activeTraits: [
            ...activeTraits,
            { id: traitId, exp: 0, mainQuestProgress: 0, mainQuestDone: false },
          ],
        })
        return true
      },

      dropTrait: (traitId) => {
        const t = get().activeTraits.find((x) => x.id === traitId)
        if (t && (t.mainQuestProgress > 0 || t.mainQuestDone)) return
        set({ activeTraits: get().activeTraits.filter((x) => x.id !== traitId) })
      },

      completeDailyTask: (traitId, taskId, payload, result) => {
        const state = get()
        const key = `${traitId}:${taskId}:${todayStr()}`
        if (state.dailyLog[key]) return // one per day — no backfilling, no double-claims

        const today = todayStr()
        let streak = state.streak
        if (state.lastActiveDate !== today) {
          const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
          streak = state.lastActiveDate === yesterday ? streak + 1 : 1
        }

        const { expGain, aetherGain, trust } = applyResultEconomy(state, payload.exp, result)

        const submission: Submission = {
          id: key,
          traitId,
          taskId,
          kind: 'daily',
          label: payload.label,
          method: result.method,
          status: result.status,
          note: result.note,
          meta: result.meta,
          thumb: result.thumb,
          at: new Date().toISOString(),
        }

        set({
          dailyLog: { ...state.dailyLog, [key]: new Date().toISOString() },
          totalExp: state.totalExp + expGain,
          seasonXp: state.seasonXp + expGain,
          aether: state.aether + aetherGain,
          trust,
          questsThisMonth: state.questsThisMonth + (result.status !== 'flagged' ? 1 : 0),
          streak,
          lastActiveDate: today,
          activeTraits: state.activeTraits.map((t) =>
            t.id === traitId ? { ...t, exp: t.exp + expGain } : t,
          ),
          submissions: [submission, ...state.submissions].slice(0, 120),
        })
      },

      advanceMainQuest: (traitId, payload, result) => {
        const state = get()
        const trait = traitById(traitId)
        if (!trait) return
        const at = state.activeTraits.find((t) => t.id === traitId)
        if (!at || at.mainQuestDone) return
        const mkSub = (status: Submission['status']): Submission => ({
          id: `${traitId}:mq:${Date.now()}`,
          traitId,
          taskId: 'main',
          kind: 'main',
          label: payload.label,
          method: result.method,
          status,
          note: result.note,
          meta: result.meta,
          thumb: result.thumb,
          at: new Date().toISOString(),
        })

        if (result.status === 'flagged') {
          // log the flagged attempt but grant nothing
          set({
            trust: clampTrust(state.trust + result.trustDelta),
            submissions: [mkSub('flagged'), ...state.submissions].slice(0, 120),
          })
          return
        }

        const step = 1 / Math.max(1, payload.steps)
        const progress = Math.min(1, at.mainQuestProgress + step)
        const done = progress >= 0.999
        const expBase = done ? trait.mainQuest.exp : Math.round(trait.mainQuest.exp / payload.steps)
        const { expGain, aetherGain, trust } = applyResultEconomy(state, expBase, result)

        const completed = done
          ? [
              { traitId, title: trait.mainQuest.title, at: new Date().toISOString() },
              ...state.completedQuests,
            ]
          : state.completedQuests

        set({
          totalExp: state.totalExp + expGain,
          seasonXp: state.seasonXp + expGain,
          aether: state.aether + aetherGain,
          trust,
          activeTraits: state.activeTraits.map((t) =>
            t.id === traitId
              ? { ...t, mainQuestProgress: progress, mainQuestDone: done, exp: t.exp + expGain }
              : t,
          ),
          completedQuests: completed,
          questsThisMonth: done ? state.questsThisMonth + 1 : state.questsThisMonth,
          submissions: [mkSub(result.status), ...state.submissions].slice(0, 120),
        })
      },

      reviewSubmission: (id, decision, note) => {
        const state = get()
        set({
          submissions: state.submissions.map((s) =>
            s.id === id
              ? {
                  ...s,
                  status: decision === 'approve' ? 'verified' : 'flagged',
                  reviewedBy: 'owner',
                  reviewNote: note,
                }
              : s,
          ),
          // approving a flagged item restores a little trust; rejecting docks it
          trust: clampTrust(state.trust + (decision === 'approve' ? 3 : -8)),
        })
      },

      setAvatar: (slot, id) =>
        set({ avatar: { ...get().avatar, [slot]: id } }),

      purchaseCosmetic: (id, cost) => {
        const state = get()
        if (state.purchasedCosmetics.includes(id)) return true
        if (state.aether < cost) return false
        set({ aether: state.aether - cost, purchasedCosmetics: [...state.purchasedCosmetics, id] })
        return true
      },

      toggleOwnerMode: () => set({ ownerMode: !get().ownerMode }),
      setPendingSleep: (v) => set({ pendingSleep: v }),

      addFriend: (id) => {
        const f = get().friends
        if (!id || f.includes(id)) return
        set({ friends: [...f, id] })
      },
      removeFriend: (id) => set({ friends: get().friends.filter((x) => x !== id) }),

      logChallenge: (id, result) => {
        const ch = challengeById(id)
        if (!ch || result.status === 'flagged') return { completed: false, exp: 0 }
        const state = get()
        const period = periodKeyFor(ch.scope)
        const prev = state.challenges[id]
        const base = !prev || prev.period !== period ? { count: 0, period, done: false } : prev
        if (base.done) return { completed: false, exp: 0 }

        const count = base.count + 1
        const completed = count >= ch.target
        const expGain = completed ? ch.exp : 0
        const aetherGain = completed ? ch.aether : 0

        // log the check-in as a submission too (keeps the proof log honest)
        const submission: Submission = {
          id: `${id}:${Date.now()}`,
          traitId: id,
          taskId: ch.scope,
          kind: 'main',
          label: `${ch.scope === 'weekly' ? 'Weekly' : 'Monthly'} · ${ch.title}`,
          method: result.method,
          status: result.status,
          note: result.note,
          meta: result.meta,
          thumb: result.thumb,
          at: new Date().toISOString(),
        }

        set({
          challenges: { ...state.challenges, [id]: { count, period, done: completed } },
          totalExp: state.totalExp + expGain,
          seasonXp: state.seasonXp + expGain,
          aether: state.aether + aetherGain,
          submissions: [submission, ...state.submissions].slice(0, 120),
        })
        return { completed, exp: expGain }
      },

      resetAll: () =>
        set({
          onboarded: false,
          acceptedTerms: false,
          theme: 'cosmos',
          profile: null,
          totalExp: 0,
          seasonXp: 0,
          aether: 0,
          trust: STARTING_TRUST,
          activeTraits: [],
          dailyLog: {},
          completedQuests: [],
          questsThisMonth: 0,
          streak: 0,
          lastActiveDate: null,
          submissions: [],
          earnedBadges: [],
          avatar: { ...DEFAULT_AVATAR },
          purchasedCosmetics: [],
          ownerMode: false,
          pendingSleep: null,
          challenges: {},
          friends: [],
        }),
    }),
    {
      name: 'ascend-save',
      version: 3,
      storage: createJSONStorage(() => accountStorage),
    },
  ),
)

// ---- selectors / derived helpers ----
export const usePlayerLevel = () => {
  const totalExp = useGame((s) => s.totalExp)
  return levelFromTotalExp(totalExp)
}

export function traitLevel(exp: number) {
  return levelFromTotalExp(exp)
}

export function isTaskDoneToday(dailyLog: DailyLog, traitId: string, taskId: string) {
  const key = `${traitId}:${taskId}:${todayStr()}`
  return Boolean(dailyLog[key])
}
