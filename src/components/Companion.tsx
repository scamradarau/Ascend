import { useEffect, useRef, useState } from 'react'
import { counsel, STARTER_PROMPTS } from '../data/stoic'
import { useGame } from '../store/useGame'
import { playSfx } from '../lib/sfx'

// ================================================================
// LUMI — a little luminous guide-wisp that floats at the bottom-right
// of every page (think Yui from SAO). Tap her to open a chat; ask
// anything about self-improvement and she answers, drawing on the same
// distilled wisdom engine that powered The Stoic. She is the one
// constant companion of your climb — warm, brief, always there.
// ================================================================

interface ChatMsg {
  from: 'you' | 'lumi'
  text: string
}

const GREETING =
  'Hey — I’m Lumi, your guide on the climb. ✦\n\nStuck on something? Ask me anything — discipline, focus, fear, motivation, purpose, a setback you can’t shake. I’ll give it to you straight.'

// the little astral sprite — a glowing four-point star with a soft halo
function LumiSprite({ size = 34, still = false }: { size?: number; still?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      className={still ? '' : 'lumi-bob'}
      aria-hidden
    >
      <defs>
        <radialGradient id="lumi-core" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor="var(--accent)" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
        </radialGradient>
      </defs>
      {/* halo */}
      <circle cx="20" cy="20" r="13" fill="var(--accent)" opacity="0.18" className={still ? '' : 'lumi-pulse'} />
      {/* four-point star body */}
      <path
        d="M20 5 C21.5 14 26 18.5 35 20 C26 21.5 21.5 26 20 35 C18.5 26 14 21.5 5 20 C14 18.5 18.5 14 20 5 Z"
        fill="url(#lumi-core)"
      />
      {/* tiny friendly eyes */}
      <circle cx="16.5" cy="19" r="1.5" fill="#0b1020" />
      <circle cx="23.5" cy="19" r="1.5" fill="#0b1020" />
      {/* orbiting spark */}
      {!still && (
        <circle r="1.6" fill="#fff" className="lumi-orbit">
          <animateMotion dur="6s" repeatCount="indefinite" path="M20,20 m-15,0 a15,15 0 1,0 30,0 a15,15 0 1,0 -30,0" />
        </circle>
      )}
    </svg>
  )
}

export default function Companion() {
  const reduceMotion = useGame((s) => s.reduceMotion)
  const [open, setOpen] = useState(false)
  const [greetingSeen, setGreetingSeen] = useState<boolean>(
    () => localStorage.getItem('lumi-greeted') === '1',
  )
  const [messages, setMessages] = useState<ChatMsg[]>([{ from: 'lumi', text: GREETING }])
  const [draft, setDraft] = useState('')
  const [thinking, setThinking] = useState(false)
  const endRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, thinking, open])

  // auto-tease the greeting bubble once, shortly after first load
  const [tease, setTease] = useState(false)
  useEffect(() => {
    if (greetingSeen) return
    const t = setTimeout(() => setTease(true), 3500)
    return () => clearTimeout(t)
  }, [greetingSeen])

  const openChat = () => {
    setOpen(true)
    setTease(false)
    playSfx('open')
    if (!greetingSeen) {
      localStorage.setItem('lumi-greeted', '1')
      setGreetingSeen(true)
    }
    setTimeout(() => inputRef.current?.focus(), 150)
  }

  const ask = (q: string) => {
    const question = q.trim()
    if (!question || thinking) return
    setMessages((m) => [...m, { from: 'you', text: question }])
    setDraft('')
    setThinking(true)
    window.setTimeout(() => {
      const reply = counsel(question)
      setMessages((m) => [...m, { from: 'lumi', text: reply.text }])
      setThinking(false)
    }, 600)
  }

  return (
    <>
      <style>{`
        @keyframes lumiBob { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-3px) } }
        @keyframes lumiPulse { 0%,100% { opacity:.18; transform:scale(1) } 50% { opacity:.32; transform:scale(1.12) } }
        @keyframes lumiRise { from { opacity:0; transform: translateY(12px) scale(.98) } to { opacity:1; transform: translateY(0) scale(1) } }
        .lumi-bob { animation: lumiBob 3.2s ease-in-out infinite; transform-origin:center }
        .lumi-pulse { animation: lumiPulse 3.2s ease-in-out infinite; transform-origin:center }
        .lumi-rise { animation: lumiRise .22s ease-out both }
      `}</style>

      {/* ---------------- LAUNCHER (collapsed) ---------------- */}
      {!open && (
        <div className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2">
          {tease && (
            <button
              onClick={openChat}
              className="lumi-rise max-w-[220px] rounded-2xl rounded-br-sm border border-[var(--edge-strong)] bg-[var(--bg)]/95 px-3 py-2 text-left text-xs text-slate-200 shadow-xl backdrop-blur"
            >
              Need a push? Ask me anything about the climb. ✦
            </button>
          )}
          <button
            onClick={openChat}
            aria-label="Open Lumi, your guide"
            title="Ask Lumi"
            className="group relative flex h-14 w-14 items-center justify-center rounded-full border border-[var(--edge-strong)] bg-[var(--bg)]/90 shadow-glow backdrop-blur transition hover:scale-105"
          >
            <span className="pointer-events-none absolute inset-0 rounded-full bg-[var(--accent)]/15 blur-md" />
            <LumiSprite size={36} still={reduceMotion} />
          </button>
        </div>
      )}

      {/* ---------------- CHAT PANEL (expanded) ---------------- */}
      {open && (
        <div
          className={`fixed bottom-4 right-4 z-40 flex w-[370px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-[var(--edge-strong)] bg-[var(--bg)]/95 shadow-2xl backdrop-blur-xl ${
            reduceMotion ? '' : 'lumi-rise'
          }`}
          style={{ height: 'min(70vh, 540px)' }}
        >
          {/* header */}
          <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--edge-strong)] bg-black/40">
              <LumiSprite size={30} still={reduceMotion} />
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-white">Lumi</div>
              <div className="text-[10px] uppercase tracking-widest text-[var(--accent)]">
                ✦ Your ascension guide
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Minimise Lumi"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-[var(--muted)] transition hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* messages */}
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.from === 'you' ? 'flex-row-reverse' : ''}`}>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center">
                  {m.from === 'lumi' ? (
                    <LumiSprite size={24} still />
                  ) : (
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-[var(--edge)] bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] font-pixel text-[9px] text-[var(--accent)]">
                      YOU
                    </span>
                  )}
                </div>
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-2xl border p-3 text-sm leading-relaxed ${
                    m.from === 'lumi'
                      ? 'rounded-tl-sm border-white/10 bg-white/[0.03] text-slate-200'
                      : 'rounded-tr-sm border-[var(--edge)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] text-white'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {thinking && (
              <div className="flex gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center">
                  <LumiSprite size={24} still={reduceMotion} />
                </div>
                <div className="rounded-2xl rounded-tl-sm border border-white/10 bg-white/[0.03] px-4 py-3">
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

          {/* starter chips (only before the first question) */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-1.5 border-t border-white/8 px-3 pt-2.5">
              {STARTER_PROMPTS.slice(0, 4).map((p) => (
                <button
                  key={p}
                  onClick={() => ask(p)}
                  className="rounded-full border border-[var(--edge)] px-2.5 py-1 text-[11px] text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* composer */}
          <div className="flex gap-2 border-t border-white/8 p-3">
            <input
              ref={inputRef}
              className="input text-sm"
              placeholder="Ask Lumi anything…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && ask(draft)}
            />
            <button onClick={() => ask(draft)} disabled={thinking} className="btn btn-primary shrink-0 text-sm">
              Ask
            </button>
          </div>
        </div>
      )}
    </>
  )
}
