import { useEffect, useRef, useState } from 'react'
import type { VerificationResult, VerificationMethodId } from '../../data/verification'
import { assessText } from '../../data/textQuality'

// ================================================================
// TimerVerifier — foreground-locked sessions for Focus & Meditation.
//
// Anti-cheat:
//  • Counts REAL elapsed wall-clock time (Date.now deltas), so
//    changing the device clock or fast-forwarding does nothing.
//  • Page Visibility API: if you switch tab / background the app, the
//    session is interrupted. Too many interruptions voids it.
//  • Random "still here?" pings must be tapped within a window, proving
//    a human is actually present (not a timer left running).
//  • A short reflection gates completion (deters bots / walk-aways).
// ================================================================

interface Props {
  method: VerificationMethodId
  label: string
  minMinutes: number
  requireReflection?: boolean
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}

export default function TimerVerifier({
  method,
  label,
  minMinutes,
  requireReflection = true,
  onResult,
  onCancel,
}: Props) {
  const targetMs = minMinutes * 60 * 1000
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [interruptions, setInterruptions] = useState(0)
  const [done, setDone] = useState(false)
  const [reflection, setReflection] = useState('')
  const [pasteBlocked, setPasteBlocked] = useState(false)
  const [ping, setPing] = useState(false)
  const startRef = useRef<number>(0)
  const accRef = useRef<number>(0)
  const pingTimer = useRef<number | null>(null)
  const missedPing = useRef(false)

  // tick using real wall-clock deltas
  useEffect(() => {
    if (!running) return
    const iv = setInterval(() => {
      const total = accRef.current + (Date.now() - startRef.current)
      setElapsed(total)
      if (total >= targetMs) {
        setRunning(false)
        setDone(true)
      }
    }, 250)
    return () => clearInterval(iv)
  }, [running, targetMs])

  // foreground lock
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && running) {
        // pause + count an interruption
        accRef.current += Date.now() - startRef.current
        setRunning(false)
        setInterruptions((n) => n + 1)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [running])

  // random presence pings
  useEffect(() => {
    if (!running) return
    const schedule = () => {
      pingTimer.current = window.setTimeout(
        () => {
          setPing(true)
          missedPing.current = true
          // must acknowledge within 10s
          window.setTimeout(() => {
            if (missedPing.current) setInterruptions((n) => n + 1)
            setPing(false)
          }, 10000)
          schedule()
        },
        20000 + Math.random() * 25000,
      )
    }
    schedule()
    return () => {
      if (pingTimer.current) clearTimeout(pingTimer.current)
    }
  }, [running])

  const startResume = () => {
    startRef.current = Date.now()
    setRunning(true)
  }
  const pause = () => {
    accRef.current += Date.now() - startRef.current
    setRunning(false)
  }
  const ackPing = () => {
    missedPing.current = false
    setPing(false)
  }

  const mm = Math.floor(elapsed / 60000)
  const ss = Math.floor((elapsed % 60000) / 1000)
  const pct = Math.min(100, Math.round((elapsed / targetMs) * 100))

  const reflectionQuality = assessText(reflection)

  const submit = () => {
    const flags: string[] = []
    if (interruptions > 2) flags.push(`${interruptions} interruptions — focus broke repeatedly`)
    if (requireReflection && reflectionQuality.reasons.length) flags.push(...reflectionQuality.reasons)
    const gibberish = requireReflection && reflectionQuality.gibberish
    const status: VerificationResult['status'] =
      interruptions > 4 || gibberish ? 'flagged' : interruptions > 2 || reflectionQuality.spam ? 'pending' : 'verified'

    onResult({
      method,
      status,
      note: gibberish
        ? 'Auto-rejected: gibberish reflection.'
        : status === 'verified'
          ? `${minMinutes}-minute session held in foreground.`
          : `Session completed with ${interruptions} interruption(s).`,
      trustDelta: status === 'verified' ? 3 : status === 'pending' ? 0 : -5,
      meta: {
        capturedAt: new Date().toISOString(),
        dwellSec: Math.round(elapsed / 1000),
        interruptions,
        foregroundLocked: true,
        wordCount: reflection.trim() ? reflection.trim().split(/\s+/).length : undefined,
        pasteBlocked,
        flags: flags.length ? flags : undefined,
        entry: reflection.trim() || undefined,
      },
    })
  }

  const canSubmit =
    done &&
    (!requireReflection || (reflection.trim().split(/\s+/).length >= 5 && !reflectionQuality.gibberish))

  return (
    <div>
      <p className="mb-3 text-sm text-slate-300">{label}</p>

      {/* timer dial */}
      <div className="relative mx-auto flex h-44 w-44 items-center justify-center">
        <svg viewBox="0 0 120 120" className="h-44 w-44 -rotate-90">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="var(--exp)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - pct / 100)}`}
            style={{ transition: 'stroke-dashoffset 0.3s linear', filter: 'drop-shadow(0 0 6px var(--exp))' }}
          />
        </svg>
        <div className="absolute text-center">
          <div className="font-pixel text-2xl text-white">
            {String(mm).padStart(2, '0')}:{String(ss).padStart(2, '0')}
          </div>
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
            of {minMinutes}:00
          </div>
        </div>
      </div>

      {/* status row */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[11px] uppercase tracking-wider">
        <span className={running ? 'text-exp' : 'text-[var(--muted)]'}>
          {running ? '● Running (stay in-app)' : done ? '✓ Complete' : '⏸ Paused'}
        </span>
        <span className={interruptions > 2 ? 'text-cosmos-magenta' : 'text-[var(--muted)]'}>
          {interruptions} interruption{interruptions === 1 ? '' : 's'}
        </span>
      </div>

      {/* presence ping */}
      {ping && (
        <button
          onClick={ackPing}
          className="mt-3 w-full animate-pulseGlow rounded-lg border border-exp bg-exp/15 py-3 text-center font-bold uppercase tracking-wider text-exp"
        >
          👁️ Still focused? Tap to confirm
        </button>
      )}

      {/* reflection gate */}
      {done && requireReflection && (
        <div className="mt-4">
          <label className="stat-label mb-1 block text-xs">
            Quick reflection to finish (typed, not pasted)
          </label>
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="What came up during the session? How do you feel now?"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            onPaste={(e) => {
              e.preventDefault()
              setPasteBlocked(true)
            }}
          />
          {pasteBlocked && (
            <p className="mt-1 text-[11px] text-cosmos-magenta">
              Paste is disabled — type your own reflection.
            </p>
          )}
        </div>
      )}

      <div className="mt-5 flex items-center justify-between gap-2">
        <button onClick={onCancel} className="btn btn-ghost text-xs">
          Cancel
        </button>
        <div className="flex gap-2">
          {!done &&
            (running ? (
              <button onClick={pause} className="btn btn-ghost text-xs">
                ⏸ Pause
              </button>
            ) : (
              <button onClick={startResume} className="btn btn-primary text-xs">
                {elapsed > 0 ? '▶ Resume' : '▶ Start session'}
              </button>
            ))}
          {done && (
            <button onClick={submit} disabled={!canSubmit} className="btn btn-primary text-xs">
              ✅ Submit
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
