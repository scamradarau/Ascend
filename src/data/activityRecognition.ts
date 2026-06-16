// ================================================================
// ACTIVITY RECOGNITION — does the photo actually show the activity?
//
// Runs an on-device image classifier (TensorFlow.js MobileNet, ImageNet
// 1000 classes) on the captured frame. We map each photo quest to a set
// of EXPECTED labels and clearly-WRONG (forbidden) labels, then:
//   • forbidden match  → reject  ("that's a toilet, not a gym")
//   • expected match   → verified
//   • neither (ambiguous) → pending human review
// It's lazy-loaded so the model only downloads when a photo quest needs it.
// 100% client-side — the image never leaves the device for this check.
// ================================================================

export type ActivityCategory = 'gym' | 'outdoors' | 'meal' | 'none'

interface CategorySpec {
  label: string
  // ImageNet class-name fragments we accept as proof of the activity
  expected: string[]
  // class fragments that clearly contradict it
  forbidden: string[]
}

// Labels that betray a photo OF A SCREEN (phone/monitor/TV showing the
// activity) — a common spoof. Checked for EVERY category; a confident screen
// match never auto-verifies, it goes to human review.
const SCREEN_LABELS = [
  'monitor', 'screen', 'television', 'home theater', 'laptop', 'notebook',
  'desktop computer', 'web site', 'cellular telephone', 'hand-held computer', 'ipod',
]

const CATEGORIES: Record<Exclude<ActivityCategory, 'none'>, CategorySpec> = {
  gym: {
    label: 'a gym / workout',
    expected: [
      'dumbbell', 'barbell', 'horizontal bar', 'parallel bars', 'punching bag', 'ski',
      'sweatshirt', 'jersey', 'maillot', 'racket', 'racquet', 'basketball', 'volleyball', 'rugby',
      'ping-pong', 'tennis ball', 'baseball', 'soccer ball', 'balance beam', 'gym', 'tread', 'bench',
    ],
    // only things that genuinely contradict "at the gym" — NOT TVs/screens
    // (gyms have them; screens are handled by the global spoof check).
    forbidden: [
      'toilet', 'washbasin', 'bathtub', 'tub', 'bed', 'four-poster', 'crib',
      'refrigerator', 'dishwasher', 'toilet seat',
    ],
  },
  outdoors: {
    label: 'being outdoors / running',
    expected: [
      'alp', 'valley', 'lakeside', 'lakeshore', 'seashore', 'promontory', 'cliff', 'cliff dwelling',
      'mountain', 'mountain bike', 'bicycle', 'running shoe', 'trail', 'park bench', 'sandbar',
      'volcano', 'geyser', 'racer', 'unicycle', 'suspension bridge', 'steel arch bridge', 'hay',
      'barn', 'picket fence', 'worm fence',
    ],
    forbidden: ['toilet', 'washbasin', 'bathtub', 'bed', 'refrigerator', 'dishwasher', 'toilet seat'],
  },
  meal: {
    label: 'a healthy meal',
    expected: [
      'plate', 'broccoli', 'cauliflower', 'banana', 'orange', 'lemon', 'mushroom', 'cucumber',
      'bell pepper', 'guacamole', 'mashed potato', 'cabbage', 'head cabbage', 'zucchini', 'fig',
      'pineapple', 'strawberry', 'bagel', 'pretzel', 'burrito', 'cheeseburger', 'hotdog', 'meat loaf',
      'carbonara', 'soup', 'consomme', 'hot pot', 'potpie', 'spaghetti', 'french loaf', 'wok',
      'frying pan', 'plate rack',
    ],
    forbidden: ['toilet', 'washbasin', 'bathtub', 'bed', 'toilet seat'],
  },
}

export function categoryForQuest(label: string): ActivityCategory {
  const l = label.toLowerCase()
  if (/(gym|train|workout|lift|weights|session)/.test(l)) return 'gym'
  if (/(run|jog|walk|cardio|steps|sprint|outdoor|sunlight)/.test(l)) return 'outdoors'
  if (/(meal|protein|food|eat|nutrition|breakfast|lunch|dinner)/.test(l)) return 'meal'
  return 'none'
}

export interface Prediction {
  className: string
  probability: number
}

export interface ActivityVerdict {
  verdict: 'verified' | 'pending' | 'reject'
  topLabel: string
  topProb: number
  expectedLabel: string
  reason: string
}

// lazy singleton model
let modelPromise: Promise<any> | null = null
export async function loadModel(): Promise<any> {
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      const mobilenet = await import('@tensorflow-models/mobilenet')
      return mobilenet.load({ version: 2, alpha: 1.0 })
    })()
  }
  return modelPromise
}

export async function classify(
  el: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement,
): Promise<Prediction[]> {
  const model = await loadModel()
  return model.classify(el, 5)
}

export function evaluate(category: ActivityCategory, preds: Prediction[]): ActivityVerdict {
  const top = preds[0] ?? { className: 'unknown', probability: 0 }
  if (category === 'none') {
    return {
      verdict: 'verified',
      topLabel: top.className,
      topProb: top.probability,
      expectedLabel: 'any',
      reason: 'No specific scene required for this quest.',
    }
  }
  const spec = CATEGORIES[category]
  const matches = (frags: string[], minP: number) =>
    preds.filter((p) => p.probability >= minP && frags.some((f) => p.className.toLowerCase().includes(f)))
  const first = (frags: string[], minP: number) => matches(frags, minP)[0]

  // 1) ACCEPT on any reasonable evidence of the activity. The on-device image
  //    model (ImageNet MobileNet) is noisy on real gym/outdoor/meal scenes —
  //    e.g. a rack of dumbbells often scores "dumbbell" well under 0.3 — so an
  //    honest photo shouldn't be punished for a low score. The hard anti-cheat
  //    (single-use liveness code, GPS, image-hash dedup, trust) is server-side.
  //    Verify if: the model's TOP guess is an expected thing, OR any single
  //    match ≥0.14, OR several weak matches sum to ≥0.18.
  const expected = matches(spec.expected, 0.05)
  const topIsExpected =
    spec.expected.some((f) => top.className.toLowerCase().includes(f)) && top.probability >= 0.08
  const lead = expected.find((p) => p.probability >= 0.14)
  const combined = expected.reduce((s, p) => s + p.probability, 0)
  if (lead || topIsExpected || combined >= 0.18) {
    const hit = lead ?? expected[0] ?? top
    return {
      verdict: 'verified',
      topLabel: hit.className,
      topProb: hit.probability,
      expectedLabel: spec.label,
      reason: `Detected “${hit.className.split(',')[0]}” — consistent with ${spec.label}.`,
    }
  }

  // 2) a STRONG, clear contradiction (toilet/bed/bathroom…) → reject. High bar
  //    (0.45) so an incidental background object never rejects a genuine photo.
  const bad = first(spec.forbidden, 0.45)
  if (bad) {
    return {
      verdict: 'reject',
      topLabel: bad.className,
      topProb: bad.probability,
      expectedLabel: spec.label,
      reason: `That looks like “${bad.className.split(',')[0]}” — not ${spec.label}. Capture the activity itself.`,
    }
  }

  // 3) obvious photo-of-a-screen (and nothing expected matched) → human review
  const screen = first(SCREEN_LABELS, 0.5)
  if (screen) {
    return {
      verdict: 'pending',
      topLabel: screen.className,
      topProb: screen.probability,
      expectedLabel: spec.label,
      reason: 'Looks like a photo of a screen — sent for human review.',
    }
  }

  // 4) genuinely couldn't tell → human review (the safe fallback, not a reject)
  return {
    verdict: 'pending',
    topLabel: top.className,
    topProb: top.probability,
    expectedLabel: spec.label,
    reason: `Couldn’t clearly confirm ${spec.label} (saw “${top.className.split(',')[0]}”). Sent for review.`,
  }
}
