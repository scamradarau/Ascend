// ================================================================
// SFX — tiny chiptune-style sound engine, synthesised live with the
// Web Audio API. No audio files, no network, works offline, and the
// 8-bit blips fit the pixel/RPG aesthetic perfectly. Every sound is a
// short reward cue — the dopamine "ding" that makes finishing a quest
// feel good and keeps players coming back.
//
// Muting is read live from the game store (see useGame.soundEnabled).
// Audio only starts after a user gesture (browser policy) — every call
// site is a tap/click, so the context resumes cleanly.
// ================================================================

let ctx: AudioContext | null = null
let muted = false

/** Called by the store so the engine knows the current preference. */
export function setSfxMuted(m: boolean) {
  muted = m
}

let unlocked = false

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new AC()
    }
    return ctx
  } catch {
    return null
  }
}

// iOS/Android gate Web Audio behind a user gesture: the context starts
// "suspended" and a sound scheduled before it resumes is silently dropped.
// We resume + play a 1-sample silent buffer inside the FIRST touch so every
// later cue (including ones fired from async callbacks) is audible.
export function unlockAudio() {
  const ac = getCtx()
  if (!ac) return
  if (ac.state === 'suspended') void ac.resume()
  if (unlocked) return
  try {
    const buf = ac.createBuffer(1, 1, 22050)
    const src = ac.createBufferSource()
    src.buffer = buf
    src.connect(ac.destination)
    src.start(0)
    unlocked = true
  } catch {
    /* ignore */
  }
}

/** Attach one-time gesture listeners that unlock audio on mobile. */
export function initSfx() {
  if (typeof window === 'undefined') return
  const onGesture = () => unlockAudio()
  // not { once: true } — iOS can re-suspend; we re-resume on every gesture
  window.addEventListener('pointerdown', onGesture, { passive: true })
  window.addEventListener('touchend', onGesture, { passive: true })
  window.addEventListener('keydown', onGesture, { passive: true })
}

function audio(): AudioContext | null {
  if (muted) return null
  const ac = getCtx()
  if (!ac) return null
  if (ac.state === 'suspended') void ac.resume()
  return ac
}

interface ToneOpts {
  freq: number
  dur: number
  type?: OscillatorType
  /** start gain (0–1) */
  gain?: number
  /** glide to this frequency over the note */
  slideTo?: number
  /** delay before the note starts (s) */
  at?: number
}

function tone(ac: AudioContext, t0: number, o: ToneOpts) {
  const start = t0 + (o.at ?? 0)
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = o.type ?? 'square'
  osc.frequency.setValueAtTime(o.freq, start)
  if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, start + o.dur)
  const peak = o.gain ?? 0.12
  // quick attack, smooth decay → no clicks
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(peak, start + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, start + o.dur)
  osc.connect(g)
  g.connect(ac.destination)
  osc.start(start)
  osc.stop(start + o.dur + 0.02)
}

// note helpers (equal temperament, A4 = 440)
const N: Record<string, number> = {
  C4: 261.63, E4: 329.63, G4: 392.0, A4: 440.0,
  C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, C7: 2093.0,
}

// a single note layered with a soft bell harmonic — fuller, more "rewarding"
function note(
  ac: AudioContext,
  t0: number,
  freq: number,
  at: number,
  dur: number,
  gain = 0.1,
) {
  tone(ac, t0, { freq, dur, type: 'square', gain, at })
  tone(ac, t0, { freq, dur: dur * 1.3, type: 'triangle', gain: gain * 0.5, at }) // bell shimmer
}

// a quick high sparkle to cap a reward
function sparkle(ac: AudioContext, t0: number, at: number) {
  tone(ac, t0, { freq: N.C7, dur: 0.18, type: 'sine', gain: 0.05, at })
  tone(ac, t0, { freq: N.E6, dur: 0.22, type: 'triangle', gain: 0.04, at: at + 0.04 })
}

export type SfxName =
  | 'tap'        // generic UI tap
  | 'submit'     // sending a quest for verification
  | 'verified'   // quest passed — reward chime
  | 'levelUp'    // hit a new level — triumphant arpeggio
  | 'aether'     // currency pickup blip
  | 'flagged'    // didn't pass — gentle negative
  | 'boss'       // landed a strike / slew a challenge boss
  | 'open'       // opening a panel (e.g. Lumi)

const PLAYERS: Record<SfxName, (ac: AudioContext, t: number) => void> = {
  tap: (ac, t) => tone(ac, t, { freq: N.A4, dur: 0.05, type: 'square', gain: 0.05 }),

  open: (ac, t) => {
    tone(ac, t, { freq: N.C5, dur: 0.08, type: 'triangle', gain: 0.08 })
    tone(ac, t, { freq: N.G5, dur: 0.1, type: 'triangle', gain: 0.07, at: 0.06 })
  },

  submit: (ac, t) => {
    // affirming "sent" chirp — you did the work and shipped the proof
    note(ac, t, N.G4, 0, 0.1, 0.08)
    note(ac, t, N.C5, 0.07, 0.13, 0.09)
    tone(ac, t, { freq: N.E5, dur: 0.14, type: 'sine', gain: 0.05, at: 0.15 })
  },

  verified: (ac, t) => {
    // rewarding rising major arpeggio with bell harmony + a sparkle cap
    const seq = [N.C5, N.E5, N.G5, N.C6]
    seq.forEach((f, i) => note(ac, t, f, i * 0.07, 0.16, 0.1))
    sparkle(ac, t, 0.3)
  },

  levelUp: (ac, t) => {
    // the grand fanfare — a full ascending run, a held triad, and sparkle
    const run = [N.C5, N.E5, N.G5, N.C6, N.E6]
    run.forEach((f, i) => note(ac, t, f, i * 0.085, 0.16, 0.11))
    // triumphant sustained chord stab
    const chord = [N.C5, N.E5, N.G5]
    chord.forEach((f) => note(ac, t, f, 0.5, 0.42, 0.08))
    sparkle(ac, t, 0.52)
    sparkle(ac, t, 0.72)
  },

  aether: (ac, t) => {
    // classic coin "blip-bloop"
    tone(ac, t, { freq: N.A5, dur: 0.06, type: 'square', gain: 0.09 })
    tone(ac, t, { freq: N.C6, dur: 0.12, type: 'square', gain: 0.09, at: 0.05 })
  },

  flagged: (ac, t) => {
    // gentle descending two-note "not quite"
    tone(ac, t, { freq: N.E4, dur: 0.14, type: 'sawtooth', gain: 0.07, slideTo: N.C4 })
    tone(ac, t, { freq: N.C4, dur: 0.16, type: 'sawtooth', gain: 0.06, at: 0.12 })
  },

  boss: (ac, t) => {
    // punchy hit
    tone(ac, t, { freq: N.G4, dur: 0.1, type: 'sawtooth', gain: 0.12, slideTo: N.C4 })
    tone(ac, t, { freq: N.C5, dur: 0.12, type: 'square', gain: 0.08, at: 0.04 })
  },
}

/** Play a named sound effect (no-op if muted or audio unavailable). */
export function playSfx(name: SfxName) {
  const ac = audio()
  if (!ac) return
  try {
    PLAYERS[name](ac, ac.currentTime)
  } catch {
    /* ignore — audio is best-effort */
  }
}

/**
 * Reward cue for a quest outcome, shared by every submit handler:
 * flagged → soft "nope"; pending → "sent" whoosh; verified → chime,
 * upgraded to the triumphant arpeggio when it levelled you up or
 * completed a quest/challenge.
 */
export function playQuestResult(
  status: 'verified' | 'pending' | 'flagged',
  big = false,
) {
  if (status === 'flagged') playSfx('flagged')
  else if (status === 'pending') playSfx('submit')
  else playSfx(big ? 'levelUp' : 'verified')
}
