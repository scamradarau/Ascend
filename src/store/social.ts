import { create } from 'zustand'
import { isCloud, type CloudProfile } from '../lib/supabase'
import { useAuth } from './auth'
import {
  fetchMyRequests,
  fetchMyMessages,
  fetchProfilesByIds,
  sendFriendRequest,
  respondFriendRequest,
  removeFriendship,
  sendMessage,
  markConversationRead,
  type FriendRequestRow,
  type MessageRow,
} from '../lib/social'

// ================================================================
// SOCIAL store — friend requests + DMs, kept fresh by light polling
// (every 15s) while signed into a cloud account.
// ================================================================

interface SocialState {
  meId: string | null
  requests: FriendRequestRow[]
  messages: MessageRow[]
  profiles: Record<string, CloudProfile>
  ready: boolean
  refresh: () => Promise<void>
  start: () => void
  sendRequest: (to: string) => Promise<void>
  respond: (id: string, accept: boolean) => Promise<void>
  unfriend: (other: string) => Promise<void>
  send: (to: string, body: string) => Promise<{ error?: string }>
  markRead: (other: string) => Promise<void>
}

let timer: ReturnType<typeof setInterval> | null = null

export const useSocial = create<SocialState>((set, get) => ({
  meId: null,
  requests: [],
  messages: [],
  profiles: {},
  ready: false,

  refresh: async () => {
    const me = useAuth.getState().user?.id ?? null
    if (!isCloud || !me) {
      set({ meId: me, requests: [], messages: [], ready: true })
      return
    }
    const [requests, messages] = await Promise.all([fetchMyRequests(me), fetchMyMessages(me)])
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
    set({ meId: me, requests, messages, profiles, ready: true })
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
