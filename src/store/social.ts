import { create } from 'zustand'
import { isCloud, isOwnerEmail, fetchEarnedProgress, type CloudProfile } from '../lib/supabase'
import { useAuth } from './auth'
import { useGame } from './useGame'
import { challengeById, periodKeyFor } from '../data/challenges'
import {
  fetchMyRequests,
  fetchMyMessages,
  fetchMySubmissions,
  fetchProfilesByIds,
  fetchQuestProgress,
  sendFriendRequest,
  respondFriendRequest,
  removeFriendship,
  sendMessage,
  markConversationRead,
  type FriendRequestRow,
  type MessageRow,
  type SubmissionRow,
} from '../lib/social'

const SEEN_KEY = 'ascend-alerts-seen'
const loadSeen = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')
  } catch {
    return []
  }
}
const PHOTO_METHODS = new Set(['geo-photo', 'live-photo'])

// ================================================================
// SOCIAL store — friend requests + DMs, kept fresh by light polling
// (every 15s) while signed into a cloud account.
// ================================================================

interface SocialState {
  meId: string | null
  requests: FriendRequestRow[]
  messages: MessageRow[]
  submissions: SubmissionRow[]
  seenAlerts: string[]
  profiles: Record<string, CloudProfile>
  ready: boolean
  refresh: () => Promise<void>
  start: () => void
  sendRequest: (to: string) => Promise<void>
  respond: (id: string, accept: boolean) => Promise<void>
  unfriend: (other: string) => Promise<void>
  send: (to: string, body: string) => Promise<{ error?: string }>
  markRead: (other: string) => Promise<void>
  markAlertsSeen: () => void
}

let timer: ReturnType<typeof setInterval> | null = null

export const useSocial = create<SocialState>((set, get) => ({
  meId: null,
  requests: [],
  messages: [],
  submissions: [],
  seenAlerts: loadSeen(),
  profiles: {},
  ready: false,

  refresh: async () => {
    const me = useAuth.getState().user?.id ?? null
    if (!isCloud || !me) {
      set({ meId: me, requests: [], messages: [], submissions: [], ready: true })
      return
    }
    const [requests, messages, submissions] = await Promise.all([
      fetchMyRequests(me),
      fetchMyMessages(me),
      fetchMySubmissions(me),
    ])
    // gather the other-party ids we need profiles for
    const ids = new Set<string>()
    for (const r of requests) {
      ids.add(r.from_user)
      ids.add(r.to_user)
    }
    for (const m of messages) {
      ids.add(m.sender)
      ids.add(m.recipient)
    }
    ids.delete(me)
    const have = get().profiles
    const missing = [...ids].filter((id) => !have[id])
    let profiles = have
    if (missing.length) {
      const fetched = await fetchProfilesByIds(missing)
      profiles = { ...have }
      for (const p of fetched) profiles[p.id] = p
    }
    set({ meId: me, requests, messages, submissions, profiles, ready: true })

    // keep earned values in sync with the server (so an approved review's EXP
    // shows up here within one poll, without needing a reload).
    // Skipped in owner test-mode so "set level" experiments aren't rolled back.
    const ownerTesting =
      useGame.getState().ownerMode && isOwnerEmail(useAuth.getState().user?.email)
    if (ownerTesting) return

    const prog = await fetchEarnedProgress(me)
    if (prog) {
      useGame.setState((g) => {
        const newTotal = typeof prog.total_exp === 'number' ? prog.total_exp : g.totalExp
        // Aether shadows EXP at 1:4 — any server-granted EXP (incl. review
        // approvals) also grants Aether here, exactly once per delta.
        const delta = newTotal - g.totalExp
        return {
          totalExp: newTotal,
          aether: delta > 0 ? g.aether + Math.round(delta / 4) : g.aether,
          trust: typeof prog.trust === 'number' ? prog.trust : g.trust,
          // streak is client-owned (Streak Freeze) — never synced down from server
          questsThisMonth:
            typeof prog.quests_this_month === 'number' ? prog.quests_this_month : g.questsThisMonth,
          earnedBadges: Array.isArray(prog.earned_badges) ? prog.earned_badges : g.earnedBadges,
          activeTraits:
            prog.trait_exp && Object.keys(prog.trait_exp).length
              ? g.activeTraits.map((t) =>
                  prog.trait_exp![t.id] != null ? { ...t, exp: prog.trait_exp![t.id] } : t,
                )
              : g.activeTraits,
        }
      })
    }

    // sync server-owned quest progress → challenge bars + main-quest bars
    // (this is what moves the progress bar when a photo gets approved)
    const qps = await fetchQuestProgress(me)
    if (qps.length) {
      useGame.setState((g) => {
        const challenges = { ...g.challenges }
        let activeTraits = g.activeTraits
        for (const r of qps) {
          const at = r.quest_id.indexOf('@')
          if (at > 0) {
            // challenge row: "<challengeId>@<period>" — only adopt the CURRENT period
            const id = r.quest_id.slice(0, at)
            const period = r.quest_id.slice(at + 1)
            const c = challengeById(id)
            if (c && periodKeyFor(c.scope) === period) {
              challenges[id] = { count: r.count, period, done: r.done }
            }
          } else if (r.quest_id.startsWith('main:') || r.quest_id.startsWith('main-practical:')) {
            const practical = r.quest_id.startsWith('main-practical:')
            const traitId = r.quest_id.split(':')[1]
            if ((g.mainVariant[traitId] ?? 'book') !== (practical ? 'practical' : 'book')) continue
            const steps = practical ? 14 : 4
            activeTraits = activeTraits.map((t) =>
              t.id === traitId
                ? {
                    ...t,
                    mainQuestProgress: Math.min(1, r.count / steps),
                    mainQuestDone: r.done,
                  }
                : t,
            )
          }
        }
        return { challenges, activeTraits }
      })
    }
  },

  markAlertsSeen: () => {
    const ids = get().submissions.map((s) => s.id)
    const merged = [...new Set([...get().seenAlerts, ...ids])].slice(-500)
    localStorage.setItem(SEEN_KEY, JSON.stringify(merged))
    set({ seenAlerts: merged })
  },

  start: () => {
    if (timer) return
    get().refresh()
    timer = setInterval(() => get().refresh(), 15000)
  },

  sendRequest: async (to) => {
    const me = get().meId
    if (!me) return
    await sendFriendRequest(me, to)
    await get().refresh()
  },

  respond: async (id, accept) => {
    await respondFriendRequest(id, accept)
    await get().refresh()
  },

  unfriend: async (other) => {
    const me = get().meId
    if (!me) return
    await removeFriendship(me, other)
    await get().refresh()
  },

  send: async (to, body) => {
    const me = get().meId
    if (!me) return { error: 'not signed in' }
    const res = await sendMessage(me, to, body)
    await get().refresh()
    return res
  },

  markRead: async (other) => {
    const me = get().meId
    if (!me) return
    await markConversationRead(me, other)
    await get().refresh()
  },
}))

// ---- selectors (derive from the snapshot) ----
export const selectIncoming = (s: SocialState) =>
  s.requests.filter((r) => r.to_user === s.meId && r.status === 'pending')

export const selectOutgoing = (s: SocialState) =>
  s.requests.filter((r) => r.from_user === s.meId && r.status === 'pending')

export const selectFriendIds = (s: SocialState): string[] => {
  const out: string[] = []
  for (const r of s.requests) {
    if (r.status !== 'accepted') continue
    out.push(r.from_user === s.meId ? r.to_user : r.from_user)
  }
  return [...new Set(out)]
}

export const selectUnreadCount = (s: SocialState) =>
  s.messages.filter((m) => m.recipient === s.meId && !m.read_at).length

export const selectPendingCount = (s: SocialState) => selectIncoming(s).length

// messages between me and `other`, oldest first
export const conversationWith = (s: SocialState, other: string): MessageRow[] =>
  s.messages
    .filter(
      (m) =>
        (m.sender === s.meId && m.recipient === other) ||
        (m.sender === other && m.recipient === s.meId),
    )
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

// ---- quest review state (from my submissions) ----
const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()

// latest status for a quest. Dailies are scoped to today; main/challenge use
// the most recent submission overall.
export function questReviewStatus(
  s: SocialState,
  questId: string,
  daily: boolean,
): 'verified' | 'pending' | 'flagged' | null {
  const subs = s.submissions
    .filter((m) => m.quest_id === questId && (!daily || isToday(m.created_at)))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  return subs[0]?.status ?? null
}

// resolved photo reviews → result alerts; unread = not yet seen
export function reviewAlerts(s: SocialState): SubmissionRow[] {
  return s.submissions.filter(
    (m) =>
      PHOTO_METHODS.has(m.method ?? '') && (m.status === 'verified' || m.status === 'flagged'),
  )
}
export const unreadAlertCount = (s: SocialState) =>
  reviewAlerts(s).filter((a) => !s.seenAlerts.includes(a.id)).length
