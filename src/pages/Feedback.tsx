import { useState } from 'react'
import { PixelTitle, Pill, Toast } from '../components/ui'

interface Suggestion {
  text: string
  type: string
  votes: number
  status: string
  voted: boolean
}

const STATUS_TONE: Record<string, 'exp' | 'gold' | 'violet' | 'default'> = {
  Planned: 'violet',
  'In progress': 'exp',
  Reviewing: 'default',
}

export default function Feedback() {
  const [text, setText] = useState('')
  const [type, setType] = useState('Trait suggestion')
  const [toast, setToast] = useState<string | null>(null)
  const [list, setList] = useState<Suggestion[]>([])

  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  const submit = () => {
    if (text.trim().length < 4) return
    setList((p) => [{ text: text.trim(), type, votes: 1, status: 'Reviewing', voted: true }, ...p])
    setText('')
    flash('Suggestion submitted — thank you!')
  }

  const upvote = (i: number) =>
    setList((p) =>
      p.map((s, idx) =>
        idx === i ? { ...s, votes: s.voted ? s.votes - 1 : s.votes + 1, voted: !s.voted } : s,
      ),
    )

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">FEEDBACK &amp; SUGGESTIONS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Shape the platform</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          New traits and features are added based on your feedback. Suggest a trait, a quest, or a
          feature — and upvote others’ ideas.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="panel p-5">
          <span className="font-pixel text-xs text-[var(--accent)]">COMMUNITY ROADMAP</span>
          {list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-sm text-[var(--muted)]">
              <span className="mb-2 text-3xl">💡</span>
              No suggestions yet — be the first. Your idea could become the next trait or feature.
            </div>
          ) : (
            <ul className="mt-4 space-y-2.5">
              {list.map((s, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3"
                >
                  <button
                    onClick={() => upvote(i)}
                    className={`flex flex-col items-center rounded-md border px-2 py-1 text-center transition ${
                      s.voted ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-white/10 text-[var(--muted)] hover:border-white/25'
                    }`}
                  >
                    <span className="text-[10px]">▲</span>
                    <span className="font-pixel text-[10px]">{s.votes}</span>
                  </button>
                  <div className="flex-1">
                    <span className="block text-sm text-slate-200">{s.text}</span>
                    <span className="text-[10px] uppercase tracking-wide text-[var(--muted)]">{s.type}</span>
                  </div>
                  <Pill tone={STATUS_TONE[s.status] ?? 'default'}>{s.status}</Pill>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="panel hud-corner h-fit p-5">
          <span className="font-pixel text-xs text-[var(--accent)]">SUBMIT</span>
          <div className="mt-4 space-y-3">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {['Trait suggestion', 'Quest idea', 'Feature request', 'Bug report'].map((o) => (
                <option key={o} className="bg-cosmos-panel">
                  {o}
                </option>
              ))}
            </select>
            <textarea
              className="input min-h-[120px] resize-none"
              placeholder="Describe your idea…"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button onClick={submit} disabled={text.trim().length < 4} className="btn btn-primary w-full">
              Submit suggestion
            </button>
          </div>
          <p className="mt-3 text-[10px] text-[var(--muted)]">
            Suggestions are per‑device for now; a shared community roadmap arrives with the backend.
          </p>
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}
