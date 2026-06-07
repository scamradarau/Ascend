import { useState } from 'react'
import { PixelTitle, Pill, Toast } from '../components/ui'

const SUGGESTIONS = [
  { text: 'Add a “Public Speaking” trait under Charisma', votes: 342, status: 'Planned' },
  { text: 'Class/Job system — Knight, Mage, Fighter', votes: 289, status: 'In progress' },
  { text: 'Couples / duo accountability quests', votes: 201, status: 'Reviewing' },
  { text: 'Apple Health + Whoop integration for auto-proof', votes: 188, status: 'Reviewing' },
  { text: 'Seasonal events with limited-time items', votes: 156, status: 'Planned' },
]

const STATUS_TONE: Record<string, 'exp' | 'gold' | 'violet' | 'default'> = {
  Planned: 'violet',
  'In progress': 'exp',
  Reviewing: 'default',
}

export default function Feedback() {
  const [text, setText] = useState('')
  const [type, setType] = useState('Trait suggestion')
  const [toast, setToast] = useState<string | null>(null)
  const [list, setList] = useState(SUGGESTIONS)

  const submit = () => {
    if (text.trim().length < 4) return
    setList((p) => [{ text: text.trim(), votes: 1, status: 'Reviewing' }, ...p])
    setText('')
    setToast('Suggestion submitted — thank you!')
    setTimeout(() => setToast(null), 2200)
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">FEEDBACK &amp; SUGGESTIONS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Shape the platform</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          New traits are added based on your feedback. Suggest a trait, a quest, or a feature.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <div className="panel p-5">
          <span className="font-pixel text-xs text-[var(--accent)]">COMMUNITY ROADMAP</span>
          <ul className="mt-4 space-y-2.5">
            {list.map((s, i) => (
              <li
                key={i}
                className="flex items-center gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3"
              >
                <div className="flex flex-col items-center rounded-md border border-white/10 px-2 py-1 text-center">
                  <span className="text-[10px] text-[var(--muted)]">▲</span>
                  <span className="font-pixel text-[10px] text-[var(--accent)]">{s.votes}</span>
                </div>
                <span className="flex-1 text-sm text-slate-200">{s.text}</span>
                <Pill tone={STATUS_TONE[s.status] ?? 'default'}>{s.status}</Pill>
              </li>
            ))}
          </ul>
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
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}
