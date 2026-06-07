import { useEffect, useRef, useState } from 'react'
import { counsel, STARTER_PROMPTS } from '../data/stoic'
import { PixelTitle, Pill } from '../components/ui'

interface ChatMsg {
  from: 'you' | 'stoic'
  text: string
}

export default function Stoic() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      from: 'stoic',
      text:
        'We are the Stoa — Marcus, Seneca, and Epictetus, speaking as one. Bring us your struggle: discipline, fear, anger, purpose, the hard road of becoming better. Ask, and we will counsel you.',
    },
  ])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking])

  const ask = (q: string) => {
    const question = q.trim()
    if (!question || thinking) return
    setMessages((m) => [...m, { from: 'you', text: question }])
    setDraft('')
    setThinking(true)
    // brief delay for a considered, oracle-like feel
    window.setTimeout(() => {
      const reply = counsel(question)
      setMessages((m) => [...m, { from: 'stoic', text: reply.text }])
      setThinking(false)
    }, 650)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">THE STOIC</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Counsel of the Stoa</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          One voice, three minds — Marcus Aurelius, Seneca &amp; Epictetus. Ask anything about
          self‑mastery and living well.
        </p>
      </div>

      <div className="panel hud-corner flex h-[600px] flex-col">
        {/* header */}
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--edge-strong)] bg-black/50 text-xl shadow-glow">
            🏛️
          </div>
          <div className="flex-1">
            <div className="font-display font-bold text-white">The Stoic</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              Marcus · Seneca · Epictetus
            </div>
          </div>
          <Pill tone="exp">online</Pill>
        </div>

        {/* messages */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.from === 'you' ? 'flex-row-reverse' : ''}`}>
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border text-sm ${
                  m.from === 'stoic'
                    ? 'border-[var(--edge-strong)] bg-black/50'
                    : 'border-[var(--edge)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] font-pixel text-[10px] text-[var(--accent)]'
                }`}
              >
                {m.from === 'stoic' ? '🏛️' : 'YOU'}
              </div>
              <div
                className={`max-w-[80%] whitespace-pre-line rounded-xl border p-3 text-sm leading-relaxed ${
                  m.from === 'stoic'
                    ? 'border-white/10 bg-white/[0.03] text-slate-200'
                    : 'border-[var(--edge)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-white'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}

          {thinking && (
            <div className="flex gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--edge-strong)] bg-black/50 text-sm">
                🏛️
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <span className="inline-flex gap-1">
                  <span className="h-2 w-2 animate-pulseGlow rounded-full bg-[var(--accent)]" />
                  <span className="h-2 w-2 animate-pulseGlow rounded-full bg-[var(--accent)]" style={{ animationDelay: '0.2s' }} />
                  <span className="h-2 w-2 animate-pulseGlow rounded-full bg-[var(--accent)]" style={{ animationDelay: '0.4s' }} />
                </span>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* starters */}
        {messages.length <= 1 && (
          <div className="flex flex-wrap gap-2 border-t border-white/8 px-4 pt-3">
            {STARTER_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => ask(p)}
                className="rounded-full border border-[var(--edge)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* composer */}
        <div className="flex gap-2 border-t border-white/8 p-4">
          <input
            className="input"
            placeholder="Ask the Stoa…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && ask(draft)}
          />
          <button onClick={() => ask(draft)} disabled={thinking} className="btn btn-primary shrink-0">
            Ask
          </button>
        </div>
      </div>

      <p className="mt-3 text-center text-[11px] text-[var(--muted)]">
        Guidance drawn from the writings of the Stoics, for reflection only — not a substitute for
        professional help. The Stoic answers self‑improvement questions and politely declines the rest.
      </p>
    </div>
  )
}
