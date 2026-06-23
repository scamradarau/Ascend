import { useEffect, useState } from 'react'
import type { VerificationResult, VerificationMethodId } from '../../data/verification'
import { BOOK_CATALOG } from '../../data/books'
import { assessText } from '../../data/textQuality'
import BookLinks from '../BookLinks'

// ================================================================
// ReadingVerifier - proves you actually read, not Googled a summary.
//
// Anti-cheat:
//  • A minimum on-task dwell timer must elapse before "Submit" unlocks
//    (you can't mark 20 pages read in 5 seconds).
//  • Paste is blocked in the summary box - you must type it.
//  • Minimum word count + a low-effort/duplicate heuristic.
//  • A free-text comprehension prompt only a real reader can answer.
//  • (Production) the summary runs through AI plagiarism + AI-written
//    detection; this client enforces the structural gates.
// ================================================================

const COMPREHENSION_PROMPTS = [
  'In one sentence, what was the single most important idea in what you read?',
  'What is one thing the author claims that you disagree with or want to test?',
  'Name a specific example or story the text used to make its point.',
  'How would you explain this section to a 12-year-old?',
  'What will you do differently tomorrow because of this reading?',
]

interface Props {
  method: VerificationMethodId
  label: string
  minMinutes?: number
  book?: string
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}

const OWN = '__own__'

export default function ReadingVerifier({ method, label, minMinutes = 8, book, onResult, onCancel }: Props) {
  const [secondsLeft, setSecondsLeft] = useState(minMinutes * 60)
  const [summary, setSummary] = useState('')
  const [answer, setAnswer] = useState('')
  const [pasteBlocked, setPasteBlocked] = useState(false)
  const [prompt] = useState(() => COMPREHENSION_PROMPTS[Math.floor(Math.random() * COMPREHENSION_PROMPTS.length)])

  // book choice - default to the quest's recommended book if provided
  const [choice, setChoice] = useState<string>(book ?? BOOK_CATALOG[0])
  const [ownTitle, setOwnTitle] = useState('')
  const chosenBook = choice === OWN ? ownTitle.trim() : choice
  const options = book && !BOOK_CATALOG.includes(book) ? [book, ...BOOK_CATALOG] : BOOK_CATALOG

  useEffect(() => {
    const iv = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(iv)
  }, [])

  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0
  const ansWords = answer.trim() ? answer.trim().split(/\s+/).length : 0
  const dwellMet = secondsLeft === 0
  const wordsMet = words >= 40
  const ansMet = ansWords >= 6

  // gibberish/spam check across summary + comprehension answer
  const quality = assessText(`${summary} ${answer}`)
  const canSubmit = dwellMet && wordsMet && ansMet && chosenBook.length > 1 && !quality.gibberish

  const submit = () => {
    // on-device AI verdict only - no manual review for written work.
    const status: VerificationResult['status'] =
      quality.gibberish || quality.spam ? 'flagged' : 'verified'
    onResult({
      method,
      status,
      note:
        status === 'flagged'
          ? `Auto-rejected: gibberish/spam in summary.`
          : `“${chosenBook}” · read ${minMinutes}+ min · ${words}-word summary · comprehension answered.`,
      trustDelta: status === 'verified' ? 3 : -4,
      meta: {
        capturedAt: new Date().toISOString(),
        dwellSec: minMinutes * 60,
        wordCount: words,
        pasteBlocked,
        flags: quality.reasons.length ? quality.reasons : undefined,
        entry: `📖 ${chosenBook}\n\nSummary:\n${summary.trim()}\n\nComprehension:\n${answer.trim()}`,
      },
    })
  }

  const mm = Math.floor(secondsLeft / 60)
  const ss = secondsLeft % 60

  return (
    <div>
      <p className="mb-3 text-sm text-slate-300">{label}</p>

      {/* book chooser */}
      <div className="mb-3 rounded-lg border border-white/10 bg-black/30 p-3">
        <label className="stat-label mb-1.5 block text-xs">Which book are you reading?</label>
        <select className="input" value={choice} onChange={(e) => setChoice(e.target.value)}>
          {options.map((b) => (
            <option key={b} value={b} className="bg-cosmos-panel">
              {b}
            </option>
          ))}
          <option value={OWN} className="bg-cosmos-panel">
            ✎ Other / my own book…
          </option>
        </select>
        {choice === OWN && (
          <input
            className="input mt-2"
            placeholder="Title - Author"
            value={ownTitle}
            onChange={(e) => setOwnTitle(e.target.value)}
          />
        )}
        {chosenBook.length > 1 && (
          <div className="mt-2">
            <BookLinks book={chosenBook} compact />
          </div>
        )}
      </div>

      <div className="mb-3 flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">
        <span className="text-slate-300">Minimum reading time</span>
        <span className={`font-pixel ${dwellMet ? 'text-exp' : 'text-amber-300'}`}>
          {dwellMet ? 'READY ✓' : `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`}
        </span>
      </div>

      <label className="stat-label mb-1 block text-xs">
        Summarise what you read & how you’ll apply it ({words}/40 words)
      </label>
      <textarea
        className="input min-h-[110px] resize-none"
        placeholder="In your own words - paste is disabled…"
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          setPasteBlocked(true)
        }}
      />

      <label className="stat-label mb-1 mt-3 block text-xs">Comprehension check</label>
      <div className="mb-1 rounded-lg border border-cosmos-cyan/30 bg-cosmos-cyan/5 px-3 py-2 text-xs text-cosmos-cyan">
        {prompt}
      </div>
      <textarea
        className="input min-h-[64px] resize-none"
        placeholder="Your answer (typed)…"
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          setPasteBlocked(true)
        }}
      />

      {pasteBlocked && (
        <p className="mt-1 text-[11px] text-cosmos-magenta">
          Paste is disabled - write it yourself. (AI plagiarism checks run server-side.)
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <Gate ok={dwellMet}>Read {minMinutes}m</Gate>
        <Gate ok={wordsMet}>40+ words</Gate>
        <Gate ok={ansMet}>Comprehension</Gate>
      </div>

      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onCancel} className="btn btn-ghost text-xs">
          Cancel
        </button>
        <button onClick={submit} disabled={!canSubmit} className="btn btn-primary text-xs">
          ✅ Submit summary
        </button>
      </div>
    </div>
  )
}

function Gate({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 ${
        ok ? 'border-exp/50 text-exp' : 'border-white/15 text-[var(--muted)]'
      }`}
    >
      {ok ? '✓' : '○'} {children}
    </span>
  )
}
