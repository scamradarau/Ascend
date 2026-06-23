import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  useSocial,
  selectFriendIds,
  conversationWith,
} from '../store/social'
import { isCloud } from '../lib/supabase'
import { submitReport } from '../lib/social'
import { levelFromTotalExp } from '../data/leveling'
import { DEFAULT_AVATAR, type AvatarConfig } from '../data/cosmetics'
import ClassAvatar from '../components/ClassAvatar'
import { PixelTitle, Toast } from '../components/ui'

export default function Messages() {
  const { id: activeId } = useParams()
  const navigate = useNavigate()
  const meId = useSocial((s) => s.meId)
  const friends = useSocial(selectFriendIds)
  const profiles = useSocial((s) => s.profiles)
  const messages = useSocial((s) => s.messages)
  const send = useSocial((s) => s.send)
  const markRead = useSocial((s) => s.markRead)
  const refresh = useSocial((s) => s.refresh)

  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  const reportUser = async () => {
    if (!activeId || !meId) return
    await submitReport(meId, activeId, 'dm', 'Reported from direct messages')
    setToast('Reported to the moderators. Thank you.')
    setTimeout(() => setToast(null), 2200)
  }

  useEffect(() => {
    refresh()
  }, [refresh])

  // mark the open conversation read
  useEffect(() => {
    if (activeId) markRead(activeId)
  }, [activeId, messages.length, markRead])

  const thread = useMemo(
    () => (activeId ? conversationWith(useSocial.getState(), activeId) : []),
    [activeId, messages],
  )

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [thread.length, activeId])

  const lvl = (uid: string) => levelFromTotalExp(profiles[uid]?.total_exp ?? 0).level
  const av = (uid: string): AvatarConfig => ({ ...DEFAULT_AVATAR, ...((profiles[uid]?.avatar as object) || {}) })
  const handle = (uid: string) => profiles[uid]?.handle ?? 'Ascender'

  const lastMsg = (uid: string) => {
    const conv = conversationWith(useSocial.getState(), uid)
    return conv[conv.length - 1]
  }
  const unreadFrom = (uid: string) =>
    messages.some((m) => m.sender === uid && m.recipient === meId && !m.read_at)

  // friends sorted by most-recent message
  const ordered = useMemo(() => {
    return [...friends].sort((a, b) => {
      const ta = lastMsg(a)?.created_at ?? ''
      const tb = lastMsg(b)?.created_at ?? ''
      return tb.localeCompare(ta)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, messages])

  const submit = async () => {
    if (!activeId || !draft.trim() || busy) return
    setBusy(true)
    await send(activeId, draft)
    setDraft('')
    setBusy(false)
  }

  if (!isCloud) {
    return (
      <div className="mx-auto max-w-2xl">
        <PixelTitle className="text-xs text-[var(--accent)]">MESSAGES</PixelTitle>
        <div className="panel mt-4 p-8 text-center text-sm text-[var(--muted)]">
          Private messages need a cloud account - they sync across devices.
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">MESSAGES</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Private messages</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Chat one-on-one with your friends.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        {/* conversation list */}
        <div className="panel p-2">
          {ordered.length === 0 && (
            <div className="p-5 text-center text-sm text-[var(--muted)]">
              No friends yet. Add some on the{' '}
              <button onClick={() => navigate('/app/friends')} className="text-[var(--accent)]">
                Friends
              </button>{' '}
              page.
            </div>
          )}
          {ordered.map((uid) => {
            const last = lastMsg(uid)
            const active = uid === activeId
            return (
              <button
                key={uid}
                onClick={() => navigate(`/app/messages/${uid}`)}
                className={`flex w-full items-center gap-3 rounded-lg p-2 text-left transition ${
                  active ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)]' : 'hover:bg-white/[0.04]'
                }`}
              >
                <div className="relative shrink-0">
                  <ClassAvatar level={lvl(uid)} config={av(uid)} size={42} animated={false} />
                  {unreadFrom(uid) && (
                    <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg)] bg-cosmos-magenta" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-bold text-white">{handle(uid)}</div>
                  <div className="truncate text-[11px] text-[var(--muted)]">
                    {last ? (last.sender === meId ? 'You: ' : '') + last.body : 'Say hello 👋'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* thread */}
        <div className="panel hud-corner flex h-[560px] flex-col">
          {!activeId ? (
            <div className="flex flex-1 items-center justify-center text-sm text-[var(--muted)]">
              Select a conversation to start chatting.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
                <ClassAvatar level={lvl(activeId)} config={av(activeId)} size={36} animated={false} />
                <button
                  onClick={() => navigate(`/app/player/${activeId}`)}
                  className="font-display font-bold text-white"
                >
                  {handle(activeId)}
                </button>
                <button
                  onClick={reportUser}
                  title="Report this user"
                  className="ml-auto text-[11px] uppercase tracking-widest text-[var(--muted)] transition hover:text-cosmos-magenta"
                >
                  ⚐ Report
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {thread.length === 0 && (
                  <div className="py-8 text-center text-sm text-[var(--muted)]">
                    No messages yet - send the first one.
                  </div>
                )}
                {thread.map((m) => {
                  const mine = m.sender === meId
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[78%] whitespace-pre-wrap break-words rounded-xl border px-3 py-2 text-sm ${
                          mine
                            ? 'border-[var(--edge)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-white'
                            : 'border-white/10 bg-white/[0.03] text-slate-200'
                        }`}
                      >
                        {m.body}
                        <div className="mt-1 text-right text-[9px] uppercase tracking-wide text-[var(--muted)]">
                          {new Date(m.created_at).toLocaleString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}
                <div ref={endRef} />
              </div>

              <div className="flex gap-2 border-t border-white/8 p-3">
                <input
                  className="input"
                  placeholder="Type a message…"
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && submit()}
                />
                <button onClick={submit} disabled={busy || !draft.trim()} className="btn btn-primary shrink-0">
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}
