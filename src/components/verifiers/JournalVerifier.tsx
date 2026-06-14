import { useState } from 'react'
import type { VerificationResult, VerificationMethodId } from '../../data/verification'
import { assessText } from '../../data/textQuality'

// Reflection / journal — typed only, minimum effort enforced.
interface Props {
  method: VerificationMethodId
  label: string
  minWords?: number
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}

export default function JournalVerifier({ method, label, minWords = 15, onResult, onCancel }: Props) {
  const [text, setText] = useState('')
  const [pasteBlocked, setPasteBlocked] = useState(false)
  const words = text.trim() ? text.trim().split(/\s+/).length : 0
  const quality = assessText(text)
  const ok = words >= minWords && !quality.gibberish

  const submit = () => {
    // text is judged on-device by the AI — no human review queue. Gibberish
    // or spam → flagged (no reward); a genuine entry → verified instantly.
    const status: VerificationResult['status'] =
      quality.gibberish || quality.spam ? 'flagged' : 'verified'
    onResult({
      method,
      status,
      note:
        status === 'flagged'
          ? 'Auto-rejected: gibberish/spam detected.'
          : `${words}-word reflection.`,
      trustDelta: status === 'verified' ? 1 : -4,
      meta: {
        capturedAt: new Date().toISOString(),
        wordCount: words,
        pasteBlocked,
        flags: quality.reasons.length ? quality.reasons : undefined,
        entry: text.trim(),
      },
    })
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-300">{label}</p>
      <label className="stat-label mb-1 block text-xs">
        Your reflection ({words}/{minWords} words · typed only)
      </label>
      <textarea
        className="input min-h-[130px] resize-none"
        placeholder="Be honest with yourself…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onPaste={(e) => {
          e.preventDefault()
          setPasteBlocked(true)
        }}
        autoFocus
      />
      {pasteBlocked && (
        <p className="mt-1 text-[11px] text-cosmos-magenta">Paste is disabled — type your own words.</p>
      )}
      {words >= minWords && quality.gibberish && (
        <p className="mt-1 text-[11px] text-cosmos-magenta">
          ⚠ This looks like gibberish/spam ({quality.reasons[0]}). Write a genuine reflection.
        </p>
      )}
      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onCancel} className="btn btn-ghost text-xs">
          Cancel
        </button>
        <button onClick={submit} disabled={!ok} className="btn btn-primary text-xs">
          ✅ Submit reflection
        </button>
      </div>
    </div>
  )
}
