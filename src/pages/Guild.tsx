import { useRef, useState } from 'react'
import { useGame, usePlayerLevel } from '../store/useGame'
import { rankForLevel } from '../data/ranks'
import { PixelTitle, Pill } from '../components/ui'

const CHANNELS = [
  { id: 'general', name: 'general', icon: '💬' },
  { id: 'wins', name: 'daily-wins', icon: '🏅' },
  { id: 'accountability', name: 'accountability', icon: '🤝' },
  { id: 'gym', name: 'iron-temple', icon: '🏋️' },
  { id: 'books', name: 'the-library', icon: '📚' },
  { id: 'mindset', name: 'mindset', icon: '🧘' },
]

interface Msg {
  who: string
  rank: string
  text: string
  when: string
  image?: string // data URL (local, session-only in this build)
}

export default function Guild() {
  const profile = useGame((s) => s.profile)
  const { level } = usePlayerLevel()
  const myRank = rankForLevel(level).title.toUpperCase()
  const [channel, setChannel] = useState('general')
  const [draft, setDraft] = useState('')
  // messages are per-channel, start empty (community is brand new at launch)
  const [byChannel, setByChannel] = useState<Record<string, Msg[]>>({})
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const messages = byChannel[channel] ?? []

  const pickImage = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 4 * 1024 * 1024) {
      alert('Image too large (max 4MB).')
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPendingImage(reader.result as string)
    reader.readAsDataURL(file)
  }

  const send = () => {
    if (draft.trim().length === 0 && !pendingImage) return
    const msg: Msg = {
      who: profile?.handle ?? 'You',
      rank: myRank,
      text: draft.trim(),
      when: 'now',
      image: pendingImage ?? undefined,
    }
    setByChannel((prev) => ({ ...prev, [channel]: [...(prev[channel] ?? []), msg] }))
    setDraft('')
    setPendingImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">THE GUILD</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">One server. Everyone climbing.</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          A huge community of like-minded people — all working toward the endgame together.
        </p>
      </div>

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
            </button>
          ))}
          <div className="mt-3 rounded-lg border border-white/8 bg-black/30 p-3 text-center">
            <div className="font-pixel text-sm text-exp">1</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              ascender online
            </div>
          </div>
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
              messages.map((m, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/40 font-pixel text-[10px] text-[var(--accent)]">
                    {m.who.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-white">{m.who}</span>
                      <span className="rounded border border-white/10 px-1.5 text-[9px] uppercase tracking-wide text-[var(--muted)]">
                        {m.rank}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">{m.when}</span>
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
          </div>

          {/* composer */}
          <div className="border-t border-white/8 p-4">
            {pendingImage && (
              <div className="mb-2 flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 p-2">
                <img src={pendingImage} alt="preview" className="h-12 w-12 rounded object-cover" />
                <span className="flex-1 text-xs text-[var(--muted)]">Image attached</span>
                <button
                  onClick={() => {
                    setPendingImage(null)
                    if (fileRef.current) fileRef.current.value = ''
                  }}
                  className="text-xs text-cosmos-magenta"
                >
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
              <button onClick={send} className="btn btn-primary shrink-0">
                Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
