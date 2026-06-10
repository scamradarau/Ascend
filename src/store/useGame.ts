import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { OnboardingAnswers } from '../data/onboarding'
import { computeOnboarding } from '../data/onboarding'
import { traitById } from '../data/traits'
import { levelFromTotalExp, totalExpToReach } from '../data/leveling'
import type { VerificationResult, VerificationMethodId } from '../data/verification'
import { DEFAULT_AVATAR, type AvatarConfig, type CosmeticSlot } from '../data/cosmetics'
import { challengeById, periodKeyFor, monthKey } from '../data/challenges'
import { todayKey } from '../lib/time'

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
  // progress of dropped traits, preserved so re-adding doesn't reset their level
  archivedTraits: Record<string, { exp: number; mainQuestProgress: number; mainQuestDone: boolean }>
  dailyLog: DailyLog
  completedQuests: CompletedQuest[]
  questsThisMonth: number
  questMonth: string // month-key the counter belongs to; resets when it changes
  streak: number
  lastActiveDate: string | null
  submissions: Submission[]
  earnedBadges: string[]

  // cosmetics
  avatar: AvatarConfig
  purchasedCosmetics: string[]
  // chosen class id (null = auto: highest class unlocked by level)
  classId: string | null

  // owner
  ownerMode: boolean

  // sleep-window scratch (night check-in waiting for morning)
  pendingSleep: { at: string } | null

  // weekly / monthly challenge progress (resets per period)
  challenges: Record<string, { count: number; period: string; done: boolean }>;

  // social — friends are other accounts' ids
  friends: string[]

  // chosen main-quest path per trait: 'book' (read) or 'practical' (2-week challenge)
  mainVariant: Record<string, 'book' | 'practical'>
  // locked-in commitment text for a practical main quest, keyed by traitId
  mainCommitment: Record<string, string>

  // ---- actions ----
  setTheme: (t: 'cosmos' | 'rune' | 'olympus') => void
  setMainVariant: (traitId: string, v: 'book' | 'practical') => void
  setCommitment: (traitId: string, text: string) => void
  resetMainQuestLocal: (traitId: string) => void
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
  setClassId: (id: string | null) => void
  purchaseCosmetic: (id: string, cost: number) => boolean
  toggleOwnerMode: () => void
  /** owner-only dev helper: jump to any level by setting total EXP */
  setDevLevel: (level: number) => void
  setPendingSleep: (v: { at: string } | null) => void
  logChallenge: (id: string, result: VerificationResult) => { completed: boolean; exp: number }
  addFriend: (id: string) => void
  removeFriend: (id: string) => void
  resetAll: () => void
}

const todayStr = () => todayKey()
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
  // Only a VERIFIED pass pays. Pending (awaiting/uncertain review) and flagged
  // pay nothing — so you can't farm EXP by spamming photos "for review".
  const mult = result.status === 'verified' ? 1 : 0
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
      archivedTraits: {},
      dailyLog: {},
      completedQuests: [],
      questsThisMonth: 0,
      questMonth: '',
      streak: 0,
      lastActiveDate: null,
      submissions: [],
      earnedBadges: [],
      avatar: { ...DEFAULT_AVATAR },
      purchasedCosmetics: [],
      classId: null,
      ownerMode: false,
      pendingSleep: null,
      challenges: {},
      friends: [],
      mainVariant: {},
      mainCommitment: {},

      setTheme: (t) => set({ theme: t }),
      setMainVariant: (traitId, v) =>
        set({ mainVariant: { ...get().mainVariant, [traitId]: v } }),
      setCommitment: (traitId, text) =>
        set({ mainCommitment: { ...get().mainCommitment, [traitId]: text } }),
      resetMainQuestLocal: (traitId) =>
        set((s) => {
          const mc = { ...s.mainCommitment }
          delete mc[traitId]
          return {
            mainCommitment: mc,
            activeTraits: s.activeTraits.map((t) =>
              t.id === traitId ? { ...t, mainQuestProgress: 0, mainQuestDone: false } : t,
            ),
          }
        }),
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
          aether: 0,
          trust: STARTING_TRUST,
          activeTraits: active,
          archivedTraits: {},
          dailyLog: {},
          completedQuests: [],
          questsThisMonth: 0,
          questMonth: '',
          streak: 0,
          lastActiveDate: null,
          submissions: [],
          earnedBadges: [],
          avatar: { ...DEFAULT_AVATAR },
          purchasedCosmetics: [],
          classId: null,
          pendingSleep: null,
          challenges: {},
          friends: [],
        })
      },

      addTrait: (traitId) => {
        const { activeTraits, archivedTraits } = get()
        if (activeTraits.length >= 3) return false
        if (activeTraits.some((t) => t.id === traitId)) return false
        // restore prior progress if this trait was dropped before
        const saved = archivedTraits[traitId]
        const rest = { ...archivedTraits }
        delete rest[traitId]
        set({
          activeTraits: [
            ...activeTraits,
            {
              id: traitId,
              exp: saved?.exp ?? 0,
              mainQuestProgress: saved?.mainQuestProgress ?? 0,
              mainQuestDone: saved?.mainQuestDone ?? false,
            },
          ],
          archivedTraits: rest,
        })
        return true
      },

      dropTrait: (traitId) => {
        const t = get().activeTraits.find((x) => x.id === traitId)
        if (t && (t.mainQuestProgress > 0 || t.mainQuestDone)) return
        // keep the trait's progress so re-adding it later does NOT reset its level
        const archived = t
          ? {
              ...get().archivedTraits,
              [traitId]: { exp: t.exp, mainQuestProgress: t.mainQuestProgress, mainQuestDone: t.mainQuestDone },
            }
          : get().archivedTraits
        set({
          activeTraits: get().activeTraits.filter((x) => x.id !== traitId),
          archivedTraits: archived,
        })
      },

      completeDailyTask: (traitId, taskId, payload, result) => {
        const state = get()
        const key = `${traitId}:${taskId}:${todayStr()}`
        if (state.dailyLog[key]) return // one per day — no backfilling, no double-claims

        const today = todayStr()
        let streak = state.streak
        if (state.lastActiveDate !== today) {
          const yesterday = todayKey(new Date(Date.now() - 86400000))
          streak = state.lastActiveDate === yesterday ? streak + 1 : 1
        }

        const { expGain, aetherGain, trust } = applyResultEconomy(state, payload.exp, result)

        // monthly reset for the "quests this month" counter
        const mk = monthKey()
        const baseQ = state.questMonth === mk ? state.questsThisMonth : 0

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
          questsThisMonth: baseQ + (result.status !== 'flagged' ? 1 : 0),
          questMonth: mk,
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
          questsThisMonth:
            (state.questMonth === monthKey() ? state.questsThisMonth : 0) + (done ? 1 : 0),
          questMonth: monthKey(),
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

      setClassId: (id) => set({ classId: id }),

      purchaseCosmetic: (id, cost) => {
        const state = get()
        if (state.purchasedCosmetics.includes(id)) return true
        if (state.aether < cost) return false
        set({ aether: state.aether - cost, purchasedCosmetics: [...state.purchasedCosmetics, id] })
        return true
      },

      toggleOwnerMode: () => set({ ownerMode: !get().ownerMode }),
      setPendingSleep: (v) => set({ pendingSleep: v }),

      // owner-only: jump to any level by setting cumulative EXP to that level's threshold
      setDevLevel: (level) =>
        set({ totalExp: totalExpToReach(Math.max(1, Math.min(999, Math.round(level)))) }),

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
          archivedTraits: {},
          dailyLog: {},
          completedQuests: [],
          questsThisMonth: 0,
          questMonth: '',
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
          mainVariant: {},
          mainCommitment: {},
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
