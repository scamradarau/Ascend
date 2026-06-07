import { useState } from 'react'
import { Modal } from './ui'
import {
  VERIFICATION_METHODS,
  type VerificationMethodId,
  type VerificationResult,
} from '../data/verification'
import LiveCamera from './verifiers/LiveCamera'
import TimerVerifier from './verifiers/TimerVerifier'
import ReadingVerifier from './verifiers/ReadingVerifier'
import JournalVerifier from './verifiers/JournalVerifier'
import SleepVerifier from './verifiers/SleepVerifier'
import CheckInVerifier from './verifiers/CheckInVerifier'

interface Props {
  open: boolean
  onClose: () => void
  method: VerificationMethodId
  label: string
  minMinutes?: number
  book?: string
  onResult: (r: VerificationResult) => void
}

export function VerificationModal({ open, onClose, method, label, minMinutes, book, onResult }: Props) {
  const [showHow, setShowHow] = useState(false)
  if (!open) return null
  const m = VERIFICATION_METHODS[method] ?? VERIFICATION_METHODS['journal']

  const handle = (r: VerificationResult) => {
    onResult(r)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={`${m.icon} ${m.label}`}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-[var(--muted)]">{m.blurb}</p>
        <button
          onClick={() => setShowHow((s) => !s)}
          className="shrink-0 text-[11px] uppercase tracking-wider text-[var(--accent)]"
        >
          {showHow ? 'hide' : '🛡️ anti-cheat'}
        </button>
      </div>

      {showHow && (
        <div className="mb-4 space-y-2 rounded-lg border border-white/10 bg-black/30 p-3 text-[11px]">
          <div>
            <div className="font-semibold uppercase tracking-wide text-cosmos-magenta">
              Cheats this blocks
            </div>
            <ul className="mt-1 space-y-0.5 text-slate-400">
              {m.cheatVectors.map((c) => (
                <li key={c}>✗ {c}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold uppercase tracking-wide text-exp">How</div>
            <ul className="mt-1 space-y-0.5 text-slate-300">
              {m.defenses.map((d) => (
                <li key={d}>✓ {d}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {(method === 'live-photo' || method === 'geo-photo') && (
        <LiveCamera
          method={method}
          needGps={method === 'geo-photo'}
          label={label}
          onResult={handle}
          onCancel={onClose}
        />
      )}
      {(method === 'focus-timer' || method === 'meditation-timer') && (
        <TimerVerifier
          method={method}
          label={label}
          minMinutes={minMinutes ?? (method === 'meditation-timer' ? 10 : 25)}
          requireReflection={method === 'meditation-timer'}
          onResult={handle}
          onCancel={onClose}
        />
      )}
      {method === 'reading-check' && (
        <ReadingVerifier
          method={method}
          label={label}
          minMinutes={minMinutes ?? 8}
          book={book}
          onResult={handle}
          onCancel={onClose}
        />
      )}
      {method === 'journal' && (
        <JournalVerifier method={method} label={label} onResult={handle} onCancel={onClose} />
      )}
      {method === 'sleep-window' && (
        <SleepVerifier method={method} label={label} onResult={handle} onCancel={onClose} />
      )}
      {method === 'check-in' && (
        <CheckInVerifier method={method} label={label} onResult={handle} onCancel={onClose} />
      )}
    </Modal>
  )
}
