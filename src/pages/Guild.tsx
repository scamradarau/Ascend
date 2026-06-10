import { useEffect, useMemo, useRef, useState } from 'react'
import { useGame, usePlayerLevel } from '../store/useGame'
import { useAuth } from '../store/auth'
import { isCloud, isOwnerEmail, uploadProof, type CloudProfile } from '../lib/supabase'
import {
  fetchGuildMessages,
  sendGuildMessage,
  fetchChannelActivity,
  type GuildMessageRow,
} from '../lib/guild'
import { fetchProfilesByIds, fetchPlayerCount, submitReport } from '../lib/social'
import { socialUnlocked, COMMUNITY_MIN } from '../lib/community'
import { rankForLevel } from '../data/ranks'
import { levelFromTotalExp } from '../data/leveling'
import { DEFAULT_AVATAR, type AvatarConfig } from '../data/cosmetics'
import ClassAvatar from '../components/ClassAvatar'
import { PixelTitle, Pill, Toast } from '../components/ui'

const CHANNELS = [
  { id: 'general', name: 'general', icon: '💬' },
  { id: 'wins', name: 'daily-wins', icon: '🏅' },
  { id: 'accountability', name: 'accountability', icon: '🤝' },
  { id: 'gym', name: 'iron-temple', icon: '🏋️' },
  { id: 'books', name: 'the-library', icon: '📚' },
  { id: 'mindset', name: 'mindset', icon: '🧘' },
]

// a unified shape the message row renders from
interface ViewMsg {
  id: string
  senderId?: string
  who: string
  level: number
  avatar: AvatarConfig
  text: string
  image?: string
  at: string // ISO timestamp
}

function fmtStamp(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Today ${time}`
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ` ${time}`
}

const SEEN_KEY = 'ascend-guild-seen'
const loadSeen = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function Guild() {
  const profile = useGame((s) => s.profile)
  const avatar = useGame((s) => s.avatar)
  const ownerMode = useGame((s) => s.ownerMode)
  const { level } = usePlayerLevel()
  const authUser = useAuth((s) => s.user)
  const me = authUser?.id ?? null
  const owner = ownerMode && isOwnerEmail(authUser?.email)

  // community soft-gate: hide the chat until there's real density
  const [playerCount, setPlayerCount] = useState(0)
  useEffect(() => {
    if (isCloud) fetchPlayerCount().then(setPlayerCount).catch(() => setPlayerCount(0))
  }, [])
  const unlocked = !isCloud || socialUnlocked(playerCount, owner)

  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2000)
  }
  const report = async (senderId: string | undefined, text: string) => {
    if (!me || !senderId || senderId === me) return
    await submitReport(me, senderId, 'guild', 'Inappropriate guild message', text.slice(0, 300))
    flash('Reported to the moderators. Thank you.')
  }

  const [channel, setChannel] = useState('general')
  const [draft, setDraft] = useState('')
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)

  // cloud state
  const [rows, setRows] = useState<GuildMessageRow[]>([])
  const [profiles, setProfiles] = useState<Record<string, CloudProfile>>({})
  const [seen, setSeen] = useState<Record<string, string>>(loadSeen)
  const [activity, setActivity] = useState<Record<string, string>>({})
  // local fallback state (session-only)
  const [byChannel, setByChannel] = useState<Record<string, ViewMsg[]>>({})

  const markSeen = (ch: string) => {
    const next = { ...loadSeen(), [ch]: new Date().toISOString() }
    localStorage.setItem(SEEN_KEY, JSON.stringify(next))
    setSeen(next)
  }

  // load + poll the active channel from the backend (and mark it read)
  useEffect(() => {
    if (!isCloud) return
    let alive = true
    const load = async () => {
      const msgs = await fetchGuildMessages(channel, 200)
      if (!alive) return
      setRows(msgs)
      markSeen(channel)
      const ids = [...new Set(msgs.map((m) => m.sender))].filter((id) => !profiles[id])
      if (ids.length) {
        const fetched = await fetchProfilesByIds(ids)
        if (!alive) return
        setProfiles((prev) => {
          const next = { ...prev }
          for (const p of fetched) next[p.id] = p
          return next
        })
      }
    }
    load()
    const t = setInterval(load, 6000)
    return () => {
      alive = false
      clearInterval(t)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel])

  // poll per-channel activity for unread dots
  useEffect(() => {
    if (!isCloud) return
    let alive = true
    const load = () => fetchChannelActivity().then((a) => alive && setActivity(a))
    load()
    const t = setInterval(load, 8000)
    return () => {
      alive = false
      clearInterval(t)
    }
  }, [])

  const hasUnread = (ch: string) =>
    ch !== channel && !!activity[ch] && (!seen[ch] || activity[ch] > seen[ch])

  const messages: ViewMsg[] = useMemo(() => {
    if (!isCloud) return byChannel[channel] ?? []
    return rows.map((r) => {
      const p = profiles[r.sender]
      return {
        id: r.id,
        senderId: r.sender,
        who: p?.handle ?? (r.sender === me ? profile?.handle ?? 'You' : 'Ascender'),
        level: levelFromTotalExp(p?.total_exp ?? 0).level,
        avatar: { ...DEFAULT_AVATAR, ...((p?.avatar as object) || (r.sender === me ? avatar : {})) },
        text: r.body ?? '',
        image: r.image_url ?? undefined,
        at: r.created_at,
      }
    })
  }, [isCloud, rows, profiles, byChannel, channel, me, profile, avatar])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, channel])

  // distinct posters in the last 15 min ≈ "online"
  const online = useMemo(() => {
    if (!isCloud) return 1
    const cutoff = Date.now() - 15 * 60 * 1000
    const recent = new Set(
      rows.filter((r) => new Date(r.created_at).getTime() > cutoff).map((r) => r.sender),
    )
    recent.add(me ?? 'me')
    return recent.size
  }, [isCloud, rows, me])

  const pickImage = (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large (max 4MB).')
      return
    }
    setPendingFile(file)
    const reader = new FileReader()
    reader.onload = () => setPendingImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const clearImage = () => {
    setPendingImage(null)
    setPendingFile(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const send = async () => {
    if ((draft.trim().length === 0 && !pendingImage) || busy) return
    if (isCloud && me) {
      setBusy(true)
      let imageUrl: string | null = null
      if (pendingFile) imageUrl = await uploadProof(me, pendingFile)
      await sendGuildMessage(me, channel, draft, imageUrl)
      setDraft('')
      clearImage()
      const msgs = await fetchGuildMessages(channel)
      setRows(msgs)
      setBusy(false)
      return
    }
    // local fallback (session-only)
    const msg: ViewMsg = {
      id: `${Date.now()}`,
      who: profile?.handle ?? 'You',
      level,
      avatar,
      text: draft.trim(),
      image: pendingImage ?? undefined,
      at: new Date().toISOString(),
    }
    setByChannel((prev) => ({ ...prev, [channel]: [...(prev[channel] ?? []), msg] }))
    setDraft('')
    clearImage()
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">THE GUILD</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">One server. Everyone climbing.</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A growing community of people doing the real work — together.
        </p>
      </div>

      {!unlocked && (
        <div className="panel hud-corner p-10 text-center">
          <div className="mb-3 text-4xl">🏛️</div>
          <h2 className="font-display text-xl font-bold text-white">The Guild opens soon</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--muted)]">
            We’re onboarding the founding members now. The guild halls unlock once enough
            ascenders have joined — so when you walk in, it’s already alive. Invite people you
            want climbing beside you.
          </p>
          {owner && (
            <p className="mt-4 text-[11px] uppercase tracking-widest text-cosmos-gold">
              Owner preview · {playerCount} players joined · unlocks at {COMMUNITY_MIN}
            </p>
          )}
        </div>
      )}

      {unlocked && (
      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* channels */}
        <div className="panel h-fit p-3">
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
            Channels
          </div>
          {CHANNELS.map((c) => (
            <button
              key={c.id}
              onClick={() => setChannel(c.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition ${
                channel === c.id
                  ? 'bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-[var(--accent)]'
                  : 'text-[var(--muted)] hover:text-white'
              }`}
            >
              <span>{c.icon}</span># {c.name}
              {hasUnread(c.id) && (
                <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-cosmos-magenta" />
              )}
            </button>
          ))}
          {online > 1 && (
            <div className="mt-3 rounded-lg border border-white/8 bg-black/30 p-3 text-center">
              <div className="font-pixel text-sm text-exp">{online}</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                ascenders online
              </div>
            </div>
          )}
        </div>

        {/* chat */}
        <div className="panel flex h-[560px] flex-col">
          <div className="flex items-center gap-2 border-b border-white/8 px-5 py-3">
            <span className="font-display font-bold text-white">
              # {CHANNELS.find((c) => c.id === channel)?.name}
            </span>
            <Pill tone="exp">live</Pill>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-[var(--muted)]">
                <span className="mb-2 text-3xl">{CHANNELS.find((c) => c.id === channel)?.icon}</span>
                No messages in #{CHANNELS.find((c) => c.id === channel)?.name} yet.
                <br />
                Be the first to post — share a win or some proof.
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="flex gap-3">
                  <div className="shrink-0">
                    <ClassAvatar level={m.level} config={m.avatar} size={38} animated={false} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white">{m.who}</span>
                      <span className="rounded border border-white/10 px-1.5 text-[9px] uppercase tracking-wide text-[var(--muted)]">
                        {rankForLevel(m.level).title}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]" title={new Date(m.at).toLocaleString()}>
                        {fmtStamp(m.at)}
                      </span>
                      {m.senderId && m.senderId !== me && (
                        <button
                          onClick={() => report(m.senderId, m.text)}
                          title="Report this message"
                          className="text-[10px] text-[var(--muted)] opacity-60 transition hover:text-cosmos-magenta hover:opacity-100"
                        >
                          ⚐ Report
                        </button>
                      )}
                    </div>
                    {m.text && <p className="mt-0.5 text-sm text-slate-200">{m.text}</p>}
                    {m.image && (
                      <img
                        src={m.image}
                        alt="upload"
                        className="mt-2 max-h-64 rounded-lg border border-white/10"
                      />
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* composer */}
          <div className="border-t border-white/8 p-4">
            {pendingImage && (
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-2">
                <img src={pendingImage} alt="preview" className="h-12 w-12 rounded object-cover" />
                <span className="flex-1 text-xs text-[var(--muted)]">Image attached</span>
                <button onClick={clearImage} className="text-xs text-cosmos-magenta">
                  Remove
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickImage(e.target.files?.[0])}
              />
              <button
                onClick={() => fileRef.current?.click()}
                title="Attach image"
                className="btn btn-ghost shrink-0 px-3"
              >
                📎
              </button>
              <input
                className="input"
                placeholder={`Message #${CHANNELS.find((c) => c.id === channel)?.name}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
              />
              <button onClick={send} disabled={busy} className="btn btn-primary shrink-0">
                {busy ? '…' : 'Send'}
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
      <Toast message={toast} />
    </div>
  )
}
