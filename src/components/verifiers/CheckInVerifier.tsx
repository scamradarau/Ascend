import type { VerificationResult, VerificationMethodId } from '../../data/verification'

// A simple, honest tap-to-confirm — for trivial daily habits where heavy
// proof would be overkill (e.g. "maintain your streak today").
export default function CheckInVerifier({
  method,
  label,
  onResult,
  onCancel,
}: {
  method: VerificationMethodId
  label: string
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}) {
  const confirm = () => {
    onResult({
      method,
      status: 'verified',
      note: 'Checked in.',
      trustDelta: 1,
      meta: { capturedAt: new Date().toISOString() },
    })
  }

  return (
    <div>
      <p className="mb-4 text-sm text-slate-300">{label}</p>
      <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-center">
        <div className="text-3xl">✅</div>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Done it today? Tap to confirm — on your honour. (One check-in per day.)
        </p>
      </div>
      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onCancel} className="btn btn-ghost text-xs">
          Cancel
        </button>
        <button onClick={confirm} className="btn btn-primary text-xs">
          ✅ Yes, done today
        </button>
      </div>
    </div>
  )
}
