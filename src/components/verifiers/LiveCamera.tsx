import { useEffect, useRef, useState } from 'react'
import { makeLivenessCode, type VerificationResult, type VerificationMethodId } from '../../data/verification'
import {
  categoryForQuest,
  classify,
  evaluate,
  type ActivityVerdict,
} from '../../data/activityRecognition'

// ================================================================
// LiveCamera — the anti-cheat cornerstone.
//
// Why this design beats gallery cheating:
//  • We NEVER render an <input type="file">. There is no file picker,
//    so importing an old/saved/screenshotted image is structurally
//    impossible — the only pixels we can read come from the live
//    MediaStream sensor via getUserMedia().
//  • At capture we burn a one-time liveness code + live timestamp
//    (+ GPS when required) directly into the image. A replayed or
//    "photo of a photo" won't carry TODAY's rotating code.
//  • Capture time + session nonce are bound to the submission; in
//    production these are issued/validated server-side and the frame
//    is checked by AI for screen/printout detection.
// ================================================================

interface Props {
  method: VerificationMethodId
  needGps: boolean
  label: string
  onResult: (r: VerificationResult) => void
  onCancel: () => void
}

type Phase = 'init' | 'ready' | 'denied' | 'unavailable' | 'captured'

function categoryLabel(c: string) {
  return c === 'gym' ? 'a gym/workout' : c === 'outdoors' ? 'the outdoors' : c === 'meal' ? 'a meal' : 'the activity'
}

export default function LiveCamera({ method, needGps, label, onResult, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [phase, setPhase] = useState<Phase>('init')
  const [code] = useState(makeLivenessCode)
  const [now, setNow] = useState(() => new Date())
  const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null)
  const [gpsState, setGpsState] = useState<'idle' | 'getting' | 'ok' | 'fail'>('idle')
  const [thumb, setThumb] = useState<string | null>(null)
  const [facing, setFacing] = useState<'user' | 'environment'>('environment')
  // activity recognition
  const expectedCategory = categoryForQuest(label)
  const [detecting, setDetecting] = useState(false)
  const [verdict, setVerdict] = useState<ActivityVerdict | null>(null)

  // live clock so the player sees the timestamp ticking (proves "now")
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  async function start(facingMode: 'user' | 'environment') {
    stop()
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('unavailable')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play().catch(() => {})
      }
      setPhase('ready')
    } catch (e: any) {
      setPhase(e?.name === 'NotAllowedError' ? 'denied' : 'unavailable')
    }
  }

  function stop() {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  useEffect(() => {
    start(facing)
    if (needGps) {
      setGpsState('getting')
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
          setGpsState('ok')
        },
        () => setGpsState('fail'),
        { enableHighAccuracy: true, timeout: 8000 },
      )
    }
    return stop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const flip = () => {
    const next = facing === 'user' ? 'environment' : 'user'
    setFacing(next)
    start(next)
  }

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    const w = video.videoWidth || 640
    const h = video.videoHeight || 480
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(video, 0, 0, w, h)

    // burn liveness overlay into the pixels (so it can't be a stale image)
    const ts = new Date()
    const pad = Math.round(w * 0.02)
    const barH = Math.round(h * 0.12)
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, h - barH, w, barH)
    ctx.fillStyle = '#7CFC00'
    ctx.font = `bold ${Math.round(barH * 0.34)}px monospace`
    ctx.textBaseline = 'middle'
    ctx.fillText(`ASCEND • LIVE ${code}`, pad, h - barH + barH * 0.32)
    ctx.fillStyle = '#fff'
    ctx.font = `${Math.round(barH * 0.26)}px monospace`
    ctx.fillText(ts.toLocaleString(), pad, h - barH + barH * 0.72)
    if (gps) {
      const geo = `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)} ±${Math.round(gps.accuracy)}m`
      ctx.textAlign = 'right'
      ctx.fillText(geo, w - pad, h - barH + barH * 0.72)
      ctx.textAlign = 'left'
    }

    const full = canvas.toDataURL('image/jpeg', 0.6)
    // tiny thumbnail for the proof log
    const tc = document.createElement('canvas')
    tc.width = 160
    tc.height = Math.round((160 * h) / w)
    tc.getContext('2d')!.drawImage(canvas, 0, 0, tc.width, tc.height)
    setThumb(tc.toDataURL('image/jpeg', 0.5))
    setPhase('captured')
    stop()
    void full

    // ---- activity recognition (on the clean thumbnail) ----
    if (expectedCategory !== 'none') {
      setVerdict(null)
      setDetecting(true)
      const probe = new Image()
      probe.onload = async () => {
        try {
          const preds = await classify(probe)
          setVerdict(evaluate(expectedCategory, preds))
        } catch {
          // model/network failure — don't block, mark unknown
          setVerdict({
            verdict: 'pending',
            topLabel: 'unknown',
            topProb: 0,
            expectedLabel: expectedCategory,
            reason: 'Scene check unavailable — sent for review.',
          })
        } finally {
          setDetecting(false)
        }
      }
      probe.src = tc.toDataURL('image/jpeg', 0.8)
    }
  }

  function submit(demo: boolean) {
    const flags: string[] = []
    if (needGps && !gps) flags.push('No GPS fix — location unverified')
    if (demo) flags.push('Camera unavailable — demo capture, needs review')
    if (verdict && verdict.verdict !== 'verified') flags.push(verdict.reason)

    // activity verdict influences final status
    let status: VerificationResult['status'] = demo
      ? 'pending'
      : flags.length > 0
        ? 'pending'
        : 'verified'
    if (verdict?.verdict === 'reject') status = 'flagged'

    onResult({
      method,
      status,
      note: demo
        ? 'Demo capture (no camera on this device).'
        : verdict && expectedCategory !== 'none'
          ? `Live capture (code ${code}). Scene: ${verdict.reason}`
          : `Live capture verified with code ${code}.`,
      trustDelta: status === 'verified' ? 3 : 0,
      meta: {
        capturedAt: new Date().toISOString(),
        livenessCode: code,
        gps,
        flags: flags.length ? flags : undefined,
        sceneChecked: expectedCategory !== 'none',
        sceneVerdict: verdict?.verdict,
      },
      thumb: thumb ?? undefined,
    })
  }

  return (
    <div>
      <p className="mb-2 text-sm text-slate-300">{label}</p>

      {/* liveness instruction */}
      <div className="mb-3 flex items-center justify-between rounded-lg border border-exp/30 bg-exp/5 px-3 py-2 text-xs">
        <span className="text-slate-300">
          Make sure your shot clearly shows the activity. Code below is burned into the photo.
        </span>
        <span className="ml-3 shrink-0 font-pixel text-exp">{code}</span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-[var(--edge-strong)] bg-black">
        {/* the ONLY image source is the live sensor — no file input exists */}
        {phase !== 'captured' ? (
          <video ref={videoRef} playsInline muted className="h-64 w-full object-cover" />
        ) : (
          thumb && <img src={thumb} alt="capture" className="h-64 w-full object-cover" />
        )}

        {/* live HUD overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-2 text-[11px] font-mono text-white">
          <span className="text-exp">● LIVE {code}</span>
          <span>{now.toLocaleTimeString()}</span>
          {needGps && (
            <span className={gpsState === 'ok' ? 'text-exp' : 'text-amber-300'}>
              {gpsState === 'ok'
                ? `📍 ${gps?.lat.toFixed(3)}, ${gps?.lng.toFixed(3)}`
                : gpsState === 'getting'
                  ? '📍 locating…'
                  : '📍 no fix'}
            </span>
          )}
        </div>

        {phase === 'init' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-slate-300">
            Requesting camera…
          </div>
        )}
        {(phase === 'denied' || phase === 'unavailable') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/80 p-4 text-center text-sm">
            <span className="text-3xl">🚫</span>
            <span className="font-semibold text-white">
              {phase === 'denied' ? 'Camera permission denied' : 'No camera available'}
            </span>
            <span className="text-xs text-slate-400">
              Live capture is required to verify this quest. In production, completion is blocked
              without it. For this demo you may log a review-pending entry.
            </span>
          </div>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* activity scene check */}
      {phase === 'captured' && expectedCategory !== 'none' && (
        <div className="mt-3">
          {detecting ? (
            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-[var(--muted)]">
              <span className="h-3 w-3 animate-pulseGlow rounded-full bg-[var(--accent)]" />
              🔍 Checking the photo really shows {categoryLabel(expectedCategory)}…
            </div>
          ) : (
            verdict && (
              <div
                className={`rounded-lg border px-3 py-2 text-xs ${
                  verdict.verdict === 'verified'
                    ? 'border-exp/40 bg-exp/5 text-exp'
                    : verdict.verdict === 'reject'
                      ? 'border-cosmos-magenta/50 bg-cosmos-magenta/10 text-cosmos-magenta'
                      : 'border-amber-400/40 bg-amber-400/5 text-amber-300'
                }`}
              >
                {verdict.verdict === 'verified' ? '✓ ' : verdict.verdict === 'reject' ? '✗ ' : '⏳ '}
                {verdict.reason}
              </div>
            )
          )}
        </div>
      )}

      {/* controls */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <button onClick={() => { stop(); onCancel() }} className="btn btn-ghost text-xs">
          Cancel
        </button>
        <div className="flex gap-2">
          {phase === 'ready' && (
            <>
              <button onClick={flip} className="btn btn-ghost text-xs">
                🔄 Flip
              </button>
              <button onClick={capture} className="btn btn-primary text-xs">
                ◉ Capture
              </button>
            </>
          )}
          {phase === 'captured' && (
            <>
              <button onClick={() => start(facing)} className="btn btn-ghost text-xs">
                Retake
              </button>
              {verdict?.verdict === 'reject' ? (
                <button disabled className="btn btn-primary text-xs" title={verdict.reason}>
                  ✗ Wrong scene — retake
                </button>
              ) : (
                <button
                  onClick={() => submit(false)}
                  disabled={detecting}
                  className="btn btn-primary text-xs"
                >
                  {detecting ? 'Checking…' : '✅ Submit proof'}
                </button>
              )}
            </>
          )}
          {(phase === 'denied' || phase === 'unavailable') && (
            <button onClick={() => submit(true)} className="btn btn-ghost text-xs">
              Log demo capture
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
