import { useState } from 'react'
import { useGame } from '../store/useGame'
import { PixelTitle, Pill } from '../components/ui'

const CHANNELS = [
  { id: 'general', name: 'general', icon: '💬' },
  { id: 'wins', name: 'daily-wins', icon: '🏅' },
  { id: 'accountability', name: 'accountability', icon: '🤝' },
  { id: 'gym', name: 'iron-temple', icon: '🏋️' },
  { id: 'books', name: 'the-library', icon: '📚' },
  { id: 'mindset', name: 'mindset', icon: '🧘' },
]

const SEED: Record<string, { who: string; rank: string; text: string; when: string }[]> = {
  general: [
    { who: 'ALCHY', rank: 'WARLORD', text: 'Hit Lv51 today. The endgame is real — keep grinding, rookies. 🔥', when: '2h' },
    { who: 'DOANIE', rank: 'WIZARD', text: 'Anyone else doing the Eat That Frog quest? The first chapter rewired my mornings.', when: '4h' },
    { who: 'NELANA', rank: 'ARCHER', text: 'Confidence trait just hit Lv13. Did the comfort-zone challenges and asked for a raise. Got it.', when: '6h' },
  ],
  wins: [
    { who: 'PHUOCIE', rank: 'SWORDSMAN', text: '7-day gym streak locked in. Ember of Focus unlocked ✨', when: '1h' },
    { who: 'RAWRBERT', rank: 'ROGUE', text: 'Finished my first main quest book. Scholar badge incoming.', when: '3h' },
  ],
  accountability: [
    { who: 'INTERNUDE', rank: 'KNIGHT', text: 'Posting my schedule for the week. Hold me to it. 🗓️', when: '30m' },
    { who: 'PHAMELI', rank: 'THIEF', text: 'Missed yesterday. Not missing twice. Back on the chain today.', when: '5h' },
  ],
  gym: [{ who: 'ALCHY', rank: 'WARLORD', text: 'Push day done. Real-time proof posted. Who’s next?', when: '2h' }],
  books: [{ who: 'DOANIE', rank: 'WIZARD', text: 'Atomic Habits > motivation. Systems win. Summary posted in proof log.', when: '8h' }],
  mindset: [{ who: 'REAMIC', rank: 'CLERIC', text: '10 min meditation daily for 3 weeks. The calm is unreal.', when: '12h' }],
}

export default function Guild() {
  const profile = useGame((s) => s.profile)
  const [channel, setChannel] = useState('general')
  const [draft, setDraft] = useState('')
  const [extra, setExtra] = useState<typeof SEED[string]>([])

  const messages = [...(SEED[channel] ?? []), ...extra]

  const send = () => {
    if (draft.trim().length === 0) return
    setExtra((p) => [
      ...p,
      { who: profile?.handle ?? 'You', rank: 'YOU', text: draft.trim(), when: 'now' },
    ])
    setDraft('')
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
            <div className="font-pixel text-sm text-exp">12,408</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              ascenders online
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
            {messages.map((m, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/40 font-pixel text-[10px] text-[var(--accent)]">
                  {m.who.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-bold text-white">{m.who}</span>
                    <span className="rounded border border-white/10 px-1.5 text-[9px] uppercase tracking-wide text-[var(--muted)]">
                      {m.rank}
                    </span>
                    <span className="text-[10px] text-[var(--muted)]">{m.when}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-slate-200">{m.text}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-white/8 p-4">
            <input
              className="input"
              placeholder={`Message #${CHANNELS.find((c) => c.id === channel)?.name}`}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
            />
            <button onClick={send} className="btn btn-primary">
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
