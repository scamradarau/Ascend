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

const CATEGORIES: Record<Exclude<ActivityCategory, 'none'>, CategorySpec> = {
  gym: {
    label: 'a gym / workout',
    expected: [
      'dumbbell', 'barbell', 'horizontal bar', 'parallel bars', 'punching bag', 'ski',
      'sweatshirt', 'jersey', 'maillot', 'racket', 'basketball', 'volleyball', 'rugby',
      'ping-pong', 'balance beam', 'gym', 'tread', 'bench',
    ],
    forbidden: [
      'toilet', 'washbasin', 'bathtub', 'tub', 'bed', 'four-poster', 'crib', 'studio couch',
      'refrigerator', 'microwave', 'dining table', 'plate', 'restaurant', 'desk', 'monitor',
      'television', 'laptop', 'toilet seat',
    ],
  },
  outdoors: {
    label: 'being outdoors / running',
    expected: [
      'alp', 'valley', 'lakeside', 'seashore', 'promontory', 'cliff', 'mountain', 'bicycle',
      'mountain bike', 'running shoe', 'trail', 'park bench', 'maze', 'sandbar', 'volcano',
      'racer', 'unicycle', 'sky', 'pole',
    ],
    forbidden: [
      'toilet', 'washbasin', 'bathtub', 'bed', 'refrigerator', 'microwave', 'television',
      'laptop', 'monitor', 'desktop computer', 'toilet seat',
    ],
  },
  meal: {
    label: 'a healthy meal',
    expected: [
      'plate', 'broccoli', 'cauliflower', 'banana', 'orange', 'lemon', 'mushroom', 'cucumber',
      'bell pepper', 'meat', 'guacamole', 'mashed potato', 'cabbage', 'zucchini', 'fig',
      'pineapple', 'strawberry', 'bagel', 'pretzel', 'burrito', 'plate rack', 'soup', 'spaghetti',
    ],
    forbidden: ['toilet', 'washbasin', 'bathtub', 'bed', 'laptop', 'monitor', 'toilet seat'],
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
  const has = (frags: string[], minP: number) =>
    preds.find((p) => p.probability >= minP && frags.some((f) => p.className.toLowerCase().includes(f)))

  const bad = has(spec.forbidden, 0.25)
  if (bad) {
    return {
      verdict: 'reject',
      topLabel: bad.className,
      topProb: bad.probability,
      expectedLabel: spec.label,
      reason: `That looks like “${bad.className.split(',')[0]}” — not ${spec.label}. Capture the activity itself.`,
    }
  }
  const good = has(spec.expected, 0.12)
  if (good) {
    return {
      verdict: 'verified',
      topLabel: good.className,
      topProb: good.probability,
      expectedLabel: spec.label,
      reason: `Detected “${good.className.split(',')[0]}” — consistent with ${spec.label}.`,
    }
  }
  return {
    verdict: 'pending',
    topLabel: top.className,
    topProb: top.probability,
    expectedLabel: spec.label,
    reason: `Couldn’t clearly confirm ${spec.label} (saw “${top.className.split(',')[0]}”). Sent for review.`,
  }
}
