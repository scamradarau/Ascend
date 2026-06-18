import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { OnboardingAnswers } from '../data/onboarding'
import { computeOnboarding } from '../data/onboarding'
import { traitById } from '../data/traits'
import { levelFromTotalExp, totalExpToReach } from '../data/leveling'
import type { VerificationResult, VerificationMethodId } from '../data/verification'
import { DEFAULT_AVATAR, type AvatarConfig, type CosmeticSlot } from '../data/cosmetics'
import { challengeById, periodKeyFor, monthKey } from '../data/challenges'
import { todayKey, weekKey } from '../lib/time'
import { setSfxMuted, playSfx } from '../lib/sfx'
import { earnedBadgeIds } from '../data/badgeEngine'
import { BADGES } from '../data/badges'
import { maxActiveTraits, freezeCap, PLUS_MONTHLY_AETHER } from '../data/plus'

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
  soundEnabled: boolean
  profile: Profile | null

  // progression
  totalExp: number
  seasonXp: number
  aether: number
  trust: number // integrity score 0..100
  plus: boolean // Ascend Plus membership (server-owned; synced from profiles.plus)
  plusAetherMonth: string | null // last month the Plus Aether stipend was granted
  activeTraits: ActiveTrait[]
  // progress of dropped traits, preserved so re-adding doesn't reset their level
  archivedTraits: Record<string, { exp: number; mainQuestProgress: number; mainQuestDone: boolean }>
  // anti-farm: cap how many traits you can ADD per Sydney day (swapping traits
  // to reach more dailies is the main EXP-farm vector).
  traitAddsToday: number
  traitAddDate: string
  dailyLog: DailyLog
  completedQuests: CompletedQuest[]
  questsThisMonth: number
  questMonth: string // month-key the counter belongs to; resets when it changes
  dailyQuestTarget: number // daily quest goal, sized by the onboarding time answer
  streak: number
  lastActiveDate: string | null
  // streak freeze — protects your streak across a missed day (loss-aversion
  // is the strongest retention hook; this softens it so one slip ≠ ruin)
  streakFreezes: number
  freezeWeek: string | null // ISO week of the last weekly free freeze
  freezeNotice: string | null // transient: "freeze used" banner
  // milestone celebrations (7/30/100-day moments)
  streakMilestone: number // highest milestone already celebrated
  celebrateStreak: number | null // a milestone pending its celebration modal
  submissions: Submission[]
  earnedBadges: string[]
  // badge tracking — fed to data/badgeEngine.ts to compute live progress
  bestStreak: number // highest streak ever reached
  lifetimeQuests: number // total verified quests completed (lifetime)
  peakBoards: string[] // leaderboard ids where you've hit rank 1 (sticky)

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
  recordVerifiedQuest: () => void // bump lifetimeQuests (a verified quest landed)
  recordPeakBoard: (board: string) => void // you hit rank 1 on a leaderboard
  syncBadges: () => void // award any badge whose requirements are now all met
  setTheme: (t: 'cosmos' | 'rune' | 'olympus') => void
  setMainVariant: (traitId: string, v: 'book' | 'practical') => void
  setCommitment: (traitId: string, text: string) => void
  resetMainQuestLocal: (traitId: string) => void
  toggleReduceMotion: () => void
  toggleSound: () => void
  // streak freeze + milestones
  tickStreak: () => void // run on app load: grant weekly freeze, bridge missed days, detect milestones
  buyStreakFreeze: () => boolean // spend Aether for an extra freeze
  registerCloudCheckIn: () => void // advance the (client-owned) streak after a verified cloud daily
  markStreakMilestone: (m: number) => void
  dismissCelebration: () => void
  clearFreezeNotice: () => void
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

// streak-freeze + milestone tuning
export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365]
export const TRAIT_ADD_CAP = 2 // most traits you can add per Sydney day (anti-farm)
// minimum Integrity (trust) score to redeem real rewards — makes cheating for
// rewards self-defeating, since flagged submissions drop Integrity below this.
export const REWARD_INTEGRITY_MIN = 80
const FREEZE_COST = 250 // Aether to buy one
/** whole calendar days between two yyyy-mm-dd keys (b − a). */
const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000)
/** the highest milestone strictly above `since` and at or below `streak`, else 0. */
export const milestoneCrossed = (streak: number, since: number) => {
  const hit = STREAK_MILESTONES.filter((m) => m > since && m <= streak)
  return hit.length ? Math.max(...hit) : 0
}
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
      soundEnabled: true,
      profile: null,
      totalExp: 0,
      seasonXp: 0,
      aether: 0,
      trust: STARTING_TRUST,
      activeTraits: [],
      archivedTraits: {},
      traitAddsToday: 0,
      traitAddDate: '',
      dailyLog: {},
      completedQuests: [],
      questsThisMonth: 0,
      questMonth: '',
      dailyQuestTarget: 2,
      streak: 0,
      lastActiveDate: null,
      streakFreezes: 1, // everyone starts with one freeze in their pocket
      freezeWeek: null,
      freezeNotice: null,
      streakMilestone: 0,
      celebrateStreak: null,
      submissions: [],
      earnedBadges: [],
      plus: false,
      plusAetherMonth: null,
      bestStreak: 0,
      lifetimeQuests: 0,
      peakBoards: [],
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
      toggleSound: () => {
        const next = !get().soundEnabled
        setSfxMuted(!next)
        set({ soundEnabled: next })
        if (next) playSfx('verified') // preview the sound when turning it on
      },

      tickStreak: () => {
        const s = get()
        const updates: Partial<GameState> = {}
        // 1. grant the weekly free freeze (banked up to the cap)
        const wk = weekKey()
        if (s.freezeWeek !== wk) {
          updates.freezeWeek = wk
          updates.streakFreezes = Math.min(freezeCap(s.plus), s.streakFreezes + 1)
        }
        // 1b. Ascend Plus monthly Aether stipend (cosmetic currency only)
        if (s.plus) {
          const mk = monthKey()
          if (s.plusAetherMonth !== mk) {
            updates.plusAetherMonth = mk
            updates.aether = (updates.aether ?? s.aether) + PLUS_MONTHLY_AETHER
            updates.freezeNotice = `✦ Ascend Plus — +${PLUS_MONTHLY_AETHER} Aether monthly bonus!`
          }
        }
        // 2. bridge missed days with freezes, or let the streak lapse
        const today = todayStr()
        const last = s.lastActiveDate
        if (last && s.streak > 0 && last !== today) {
          const yesterday = todayKey(new Date(Date.now() - 86400000))
          if (last !== yesterday) {
            const missed = daysBetween(last, today) - 1 // full days with zero activity
            const have = updates.streakFreezes ?? s.streakFreezes
            if (missed >= 1 && have >= missed) {
              updates.streakFreezes = have - missed
              updates.lastActiveDate = yesterday // bridged → streak continues at next check-in
              updates.freezeNotice = `🧊 Streak Freeze used — your ${s.streak}-day streak is safe!`
            } else {
              updates.streak = 0 // beyond protection — the chain breaks
            }
          }
        }
        if (Object.keys(updates).length) set(updates)
      },

      buyStreakFreeze: () => {
        const s = get()
        if (s.streakFreezes >= freezeCap(s.plus) || s.aether < FREEZE_COST) return false
        set({ aether: s.aether - FREEZE_COST, streakFreezes: s.streakFreezes + 1 })
        return true
      },

      // cloud check-ins go through the server, but the STREAK is client-owned
      // (so Streak Freeze works without a backend round-trip) — advance it here.
      registerCloudCheckIn: () => {
        const s = get()
        const today = todayStr()
        if (s.lastActiveDate === today) return // already counted today
        const yesterday = todayKey(new Date(Date.now() - 86400000))
        const streak = s.lastActiveDate === yesterday ? s.streak + 1 : 1
        set({ streak, lastActiveDate: today, bestStreak: Math.max(s.bestStreak, streak) })
      },

      recordVerifiedQuest: () => set((s) => ({ lifetimeQuests: s.lifetimeQuests + 1 })),
      recordPeakBoard: (board) =>
        set((s) => (s.peakBoards.includes(board) ? s : { peakBoards: [...s.peakBoards, board] })),
      syncBadges: () => {
        const s = get()
        const earned = earnedBadgeIds({
          streak: s.streak,
          bestStreak: s.bestStreak,
          lifetimeQuests: s.lifetimeQuests,
          completedQuests: s.completedQuests,
          totalExp: s.totalExp,
          activeTraits: s.activeTraits,
          archivedTraits: s.archivedTraits,
          peakBoards: s.peakBoards,
          onboarded: s.onboarded,
        })
        const newly = earned.filter((id) => !s.earnedBadges.includes(id))
        if (newly.length) {
          // Aether reward on earning a badge, scaled by its tier.
          const BADGE_AETHER: Record<string, number> = { LOW: 150, MID: 350, HIGH: 750 }
          const bonus = newly.reduce(
            (sum, id) => sum + (BADGE_AETHER[BADGES.find((b) => b.id === id)?.reward ?? 'LOW'] ?? 150),
            0,
          )
          set({ earnedBadges: [...s.earnedBadges, ...newly], aether: s.aether + bonus })
        }
      },

      markStreakMilestone: (m) => {
        if (m <= get().streakMilestone) return
        set((s) => ({ streakMilestone: m, celebrateStreak: m, aether: s.aether + m * 5 }))
      },
      dismissCelebration: () => set({ celebrateStreak: null }),
      clearFreezeNotice: () => set({ freezeNotice: null }),

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
          dailyQuestTarget: result.dailyQuestTarget,
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
          bestStreak: 0,
          lifetimeQuests: 0,
          peakBoards: [],
          plusAetherMonth: null,
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
        if (activeTraits.length >= maxActiveTraits(get().plus)) return false
        if (activeTraits.some((t) => t.id === traitId)) return false
        // anti-farm: at most TRAIT_ADD_CAP additions per Sydney day
        const today = todayStr()
        const addsToday = get().traitAddDate === today ? get().traitAddsToday : 0
        if (addsToday >= TRAIT_ADD_CAP) return false
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
          traitAddsToday: addsToday + 1,
          traitAddDate: today,
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
          bestStreak: Math.max(state.bestStreak, streak),
          lifetimeQuests: state.lifetimeQuests + (result.status === 'verified' ? 1 : 0),
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
          dailyQuestTarget: 2,
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
          bestStreak: 0,
          lifetimeQuests: 0,
          peakBoards: [],
          plus: false, // entitlement is re-established from the server / owner-check on load — never carried across accounts
          plusAetherMonth: null,
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
      onRehydrateStorage: () => (state) => {
        // keep the sfx engine in sync with the saved preference
        setSfxMuted(!(state?.soundEnabled ?? true))
      },
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
