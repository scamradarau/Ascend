import type { DailyTask } from './types'

// ================================================================
// ANTI-CHEAT VERIFICATION ENGINE
// ----------------------------------------------------------------
// The core of Ascend is trust. Every quest type has a verification
// method designed around a simple question: "How would someone fake
// this?" — then we close that gap. Each method documents the cheat
// vectors it defends against and the layers it stacks.
// ================================================================

export type VerificationMethodId =
  | 'live-photo' // generic real-time selfie/photo, camera-only
  | 'geo-photo' // live photo + GPS (gym, run, outdoors)
  | 'focus-timer' // foreground-locked deep-work timer (tab-blur = void)
  | 'meditation-timer' // foreground-locked stillness timer
  | 'reading-check' // dwell time + summary + paste-block + comprehension
  | 'journal' // reflection, min words, paste-block
  | 'sleep-window' // time-boxed night + morning check-ins

export interface VerificationMethod {
  id: VerificationMethodId
  label: string
  icon: string
  /** short description shown to the player */
  blurb: string
  /** what a cheater would try */
  cheatVectors: string[]
  /** how we stop them */
  defenses: string[]
  /** integrity points awarded on a clean pass */
  trustReward: number
  /** does this method require the live camera (no file input ever) */
  camera: boolean
  /** does it attempt to capture GPS */
  gps: boolean
}

export const VERIFICATION_METHODS: Record<VerificationMethodId, VerificationMethod> = {
  'live-photo': {
    id: 'live-photo',
    label: 'Live Photo',
    icon: '📸',
    blurb: 'Capture a real-time photo in-app. No gallery, no uploads.',
    cheatVectors: [
      'Uploading an old photo from the camera roll',
      'Screenshotting a previous capture and re-submitting',
      'Taking a photo of a photo / a screen',
    ],
    defenses: [
      'Camera-only capture via the device sensor — there is NO file picker, so gallery upload is structurally impossible',
      'A one-time liveness code + live timestamp are burned into the frame at capture, so old/replayed images won’t carry today’s token',
      'On-device AI scene recognition checks the photo actually shows the activity (a gym photo can’t be a toilet)',
      'Capture metadata (exact time, session nonce) is bound to the submission',
      'AI screen-detection + human spot-checks flag "photo of a photo"',
    ],
    trustReward: 2,
    camera: true,
    gps: false,
  },
  'geo-photo': {
    id: 'geo-photo',
    label: 'Live Photo + Location',
    icon: '📍',
    blurb: 'Live photo with GPS — proves you’re actually there.',
    cheatVectors: [
      'Submitting a gym photo from home',
      'Re-using last week’s workout photo',
      'GPS spoofing apps',
    ],
    defenses: [
      'Live camera capture (no uploads) + burned-in liveness code & timestamp',
      'On-device AI scene recognition verifies the photo matches the activity (gym / outdoors), not a random room',
      'GPS coordinates + accuracy captured at the moment of capture and bound to the photo',
      'Location is cross-checked against the activity (e.g. is this a gym / outdoors?)',
      'Impossible-travel detection: two captures too far apart in too little time are flagged',
      'Mock-location / developer-mode flags surface for review',
    ],
    trustReward: 3,
    camera: true,
    gps: true,
  },
  'focus-timer': {
    id: 'focus-timer',
    label: 'Focus Session',
    icon: '⏱️',
    blurb: 'An in-app timer that voids if you leave the app.',
    cheatVectors: [
      'Starting the timer then scrolling TikTok',
      'Backgrounding the app and pretending to work',
      'Clock-fiddling to fast-forward the timer',
    ],
    defenses: [
      'Foreground lock: the Page Visibility API detects tab/app switches — leaving voids the session',
      'The timer counts real elapsed wall-clock time; it can’t be skipped by changing the device clock',
      'Periodic random "still here?" focus pings must be acknowledged',
      'Session length + interruption count are logged for review',
    ],
    trustReward: 3,
    camera: false,
    gps: false,
  },
  'meditation-timer': {
    id: 'meditation-timer',
    label: 'Stillness Session',
    icon: '🧘',
    blurb: 'A foreground-locked stillness timer with reflection.',
    cheatVectors: [
      'Starting a timer and walking away / doing something else',
      'Backgrounding the app',
    ],
    defenses: [
      'Foreground lock via Page Visibility — leaving the screen voids the session',
      'Real wall-clock timing (clock changes don’t help)',
      'A short post-session reflection (what came up) gates completion and deters bots',
    ],
    trustReward: 2,
    camera: false,
    gps: false,
  },
  'reading-check': {
    id: 'reading-check',
    label: 'Reading Proof',
    icon: '📖',
    blurb: 'Minimum reading time + your own summary + a comprehension check.',
    cheatVectors: [
      'Pasting a summary from Google / ChatGPT',
      'Copy-pasting the book’s back-cover blurb',
      'Skimming and writing two words',
      'Marking "read" in 5 seconds',
    ],
    defenses: [
      'A minimum on-task dwell timer must elapse before you can submit',
      'Paste is blocked in the summary field — you must type it yourself',
      'Minimum word count + low-effort/duplicate-text heuristics',
      'AI plagiarism + AI-generated-text detection on the summary',
      'A rotating comprehension question only an actual reader could answer',
    ],
    trustReward: 3,
    camera: false,
    gps: false,
  },
  journal: {
    id: 'journal',
    label: 'Reflection',
    icon: '✍️',
    blurb: 'A genuine written reflection — typed, not pasted.',
    cheatVectors: ['Pasting filler text', 'One-word entries', 'Copying a previous entry'],
    defenses: [
      'Paste blocked — typed entry only',
      'Minimum word count enforced',
      'Duplicate-of-previous-entry detection',
      'AI-generated-text flagging',
    ],
    trustReward: 1,
    camera: false,
    gps: false,
  },
  'sleep-window': {
    id: 'sleep-window',
    label: 'Sleep Window',
    icon: '🌙',
    blurb: 'Check in at night and again in the morning — within real windows.',
    cheatVectors: [
      'Logging "8 hours" at 3pm',
      'Backfilling yesterday’s sleep',
    ],
    defenses: [
      'Night check-in only accepted in an evening window; morning check-in only in a morning window',
      'The gap between the two must be a plausible sleep duration',
      'No backfilling — both check-ins are timestamped live, same calendar cycle',
    ],
    trustReward: 2,
    camera: false,
    gps: false,
  },
}

// ----------------------------------------------------------------
// Resolver — map a task to its verification method.
// Explicit `task.verify` wins; otherwise we infer from the label +
// legacy `evidence` field so existing trait data keeps working.
// ----------------------------------------------------------------
export function methodForTask(task: DailyTask): VerificationMethodId {
  if (task.verify) return task.verify
  const l = task.label.toLowerCase()

  if (/(gym|train|workout|lift|run|jog|walk|steps|cardio|sprint)/.test(l)) return 'geo-photo'
  if (/(meditat|breath|stillness|mindful)/.test(l)) return 'meditation-timer'
  if (/(read|pages|book|chapter)/.test(l)) return 'reading-check'
  if (/(deep work|focus|2 hours|priority|study|ship)/.test(l)) return 'focus-timer'
  if (/(sleep|hours of sleep|bed)/.test(l)) return 'sleep-window'

  // fall back from the legacy evidence type
  switch (task.evidence) {
    case 'photo':
      return 'live-photo'
    case 'summary':
      return 'reading-check'
    case 'schedule':
      return 'geo-photo'
    case 'reflection':
    default:
      return 'journal'
  }
}

export interface VerificationResult {
  method: VerificationMethodId
  status: 'verified' | 'pending' | 'flagged'
  note: string
  trustDelta: number
  meta: {
    capturedAt: string
    livenessCode?: string
    gps?: { lat: number; lng: number; accuracy: number } | null
    dwellSec?: number
    interruptions?: number
    wordCount?: number
    pasteBlocked?: boolean
    foregroundLocked?: boolean
    flags?: string[]
  }
  thumb?: string // tiny data-url preview from the camera, if any
}

// Generate the rotating liveness token a player must have visible / present.
export function makeLivenessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 4; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}
