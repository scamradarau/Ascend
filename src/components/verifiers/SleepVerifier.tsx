import { useState } from 'react'
import { useGame } from '../../store/useGame'
import type { VerificationResult, VerificationMethodId } from '../../data/verification'

// ================================================================
// SleepVerifier - two live, time-boxed check-ins.
//
// Anti-cheat:
//  • "Going to bed" is only accepted in an evening window (20:00–04:00).
//  • "Woke up" is only accepted in a morning window (04:00–12:00).
//  • The two timestamps are live (no backfilling) and the gap must be a
//    plausible sleep duration (3–14h).
// ================================================================

interface Props {
  method: VerificationMethodId
  label: string
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}

function hour() {
  return new Date().getHours()
}

export default function SleepVerifier({ method, label, onResult, onCancel }: Props) {
  const pendingSleep = useGame((s) => s.pendingSleep)
  const setPendingSleep = useGame((s) => s.setPendingSleep)
  const [msg, setMsg] = useState<string | null>(null)

  const h = hour()
  const inNightWindow = h >= 20 || h < 4
  const inMorningWindow = h >= 4 && h < 12

  const logBed = () => {
    if (!inNightWindow) {
      setMsg('Night check-in is only accepted between 20:00 and 04:00.')
      return
    }
    setPendingSleep({ at: new Date().toISOString() })
    setMsg('Bedtime logged. Come back in the morning to confirm wake-up. 🌙')
  }

  const logWake = () => {
    if (!pendingSleep) {
      setMsg('No bedtime check-in found. Log "Going to bed" first tonight.')
      return
    }
    if (!inMorningWindow) {
      setMsg('Morning check-in is only accepted between 04:00 and 12:00.')
      return
    }
    const sleptMs = Date.now() - new Date(pendingSleep.at).getTime()
    const hours = sleptMs / 3600000
    if (hours < 3 || hours > 14) {
      onResult({
        method,
        status: 'flagged',
        note: `Implausible sleep gap (${hours.toFixed(1)}h).`,
        trustDelta: -4,
        meta: { capturedAt: new Date().toISOString(), flags: ['Implausible sleep duration'] },
      })
      setPendingSleep(null)
      return
    }
    setPendingSleep(null)
    onResult({
      method,
      status: 'verified',
      note: `Slept ~${hours.toFixed(1)}h - bed & wake check-ins verified live.`,
      trustDelta: 2,
      meta: { capturedAt: new Date().toISOString(), dwellSec: Math.round(sleptMs / 1000) },
    })
  }

  return (
    <div>
      <p className="mb-3 text-sm text-slate-300">{label}</p>

      <div className="space-y-3">
        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">🌙 Going to bed</span>
            <span className={`text-[11px] ${inNightWindow ? 'text-exp' : 'text-[var(--muted)]'}`}>
              window 20:00–04:00
            </span>
          </div>
          <button
            onClick={logBed}
            disabled={!!pendingSleep}
            className="btn btn-ghost mt-2 w-full text-xs"
          >
            {pendingSleep ? '✓ Bedtime logged' : 'Log bedtime now'}
          </button>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/30 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white">☀️ Woke up</span>
            <span className={`text-[11px] ${inMorningWindow ? 'text-exp' : 'text-[var(--muted)]'}`}>
              window 04:00–12:00
            </span>
          </div>
          <button
            onClick={logWake}
            disabled={!pendingSleep}
            className="btn btn-primary mt-2 w-full text-xs"
          >
            Confirm wake-up & submit
          </button>
        </div>
      </div>

      {msg && <p className="mt-3 text-xs text-amber-300">{msg}</p>}

      <div className="mt-5 flex justify-start">
        <button onClick={onCancel} className="btn btn-ghost text-xs">
          Close
        </button>
      </div>
    </div>
  )
}
