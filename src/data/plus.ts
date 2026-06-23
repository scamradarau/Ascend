// ================================================================
// ASCEND PLUS - the paid membership.
//
// GUARDRAIL (non-negotiable): Plus sells convenience, capacity,
// cosmetics and insight - NEVER progression. No paid EXP, levels,
// ranks, badges or leaderboard standing. The whole moat is "verified,
// earned, can't be faked", and a pay-to-win tier would destroy it.
//
// Billing is via Stripe Checkout (web → no App Store 30% cut). The
// `create-checkout` Edge Function builds the session; `stripe-webhook`
// flips profiles.plus. Until Stripe keys are set as function secrets
// the checkout call returns a clear "not configured yet" error and the
// Plus page shows a waitlist state - so nothing breaks before setup.
// ================================================================

export type PlusPlan = 'monthly' | 'annual' | 'lifetime'

export interface PlusPlanInfo {
  id: PlusPlan
  name: string
  price: string // display, AUD
  cadence: string
  blurb: string
  badge?: string // ribbon, e.g. "Best value"
  mode: 'subscription' | 'payment'
}

// Prices confirmed with the founder (AUD). Stripe Price IDs are mapped
// server-side from these plan ids via function secrets.
export const PLUS_PLANS: PlusPlanInfo[] = [
  {
    id: 'monthly',
    name: 'Monthly',
    price: 'A$7.99',
    cadence: 'per month',
    blurb: '7-day free trial, then A$7.99/mo. Cancel anytime.',
    mode: 'subscription',
  },
  {
    id: 'annual',
    name: 'Annual',
    price: 'A$49.99',
    cadence: 'per year',
    blurb: '7-day free trial, then ~A$4.17/mo - nearly half off.',
    badge: 'Best value',
    mode: 'subscription',
  },
  {
    id: 'lifetime',
    name: 'Founders Lifetime',
    price: 'A$59',
    cadence: 'once',
    blurb: 'Pay once, Plus forever. Beta only - first 100 founders.',
    badge: 'Founders',
    mode: 'payment',
  },
]

export function planById(id: string): PlusPlanInfo | undefined {
  return PLUS_PLANS.find((p) => p.id === id)
}

// ---- what Plus unlocks (everything here is convenience/capacity/cosmetic) ----
export interface PlusBenefit {
  icon: string
  title: string
  detail: string
}

export const PLUS_BENEFITS: PlusBenefit[] = [
  {
    icon: '🌿',
    title: '5 active traits',
    detail: 'Pursue five paths at once instead of three - put more of your life in play.',
  },
  {
    icon: '◈',
    title: 'Monthly Aether bonus',
    detail: '500 Aether every month, on the house - spend it on cosmetics, streak freezes or rewards.',
  },
  {
    icon: '🧊',
    title: 'More Streak Freezes',
    detail: 'Bank up to 4 freezes (free players cap at 2). Miss a day without losing your streak.',
  },
  {
    icon: '✦',
    title: 'Exclusive cosmetics',
    detail: 'The Aether aura and Founders frame - Plus-only, and a visible ✦ mark on the leaderboard.',
  },
  {
    icon: '📊',
    title: 'Advanced stats',
    detail: 'Deeper progress insight across your traits and quests (rolling out through beta).',
  },
  {
    icon: '🤝',
    title: 'Back the build',
    detail: "You're funding a solo-built, ad-free app. Plus keeps ASCEND independent.",
  },
]

// Plus NEVER touches these - stated plainly for trust.
export const PLUS_NEVER =
  'Plus never sells EXP, levels, ranks, badges or leaderboard position. Every place you climb is earned and verified.'

// ---- capacity gates (the functional benefits) ----
export const FREE_TRAIT_CAP = 3
export const PLUS_TRAIT_CAP = 5
export function maxActiveTraits(plus: boolean): number {
  return plus ? PLUS_TRAIT_CAP : FREE_TRAIT_CAP
}

export const FREE_FREEZE_CAP = 2
export const PLUS_FREEZE_CAP = 4
export function freezeCap(plus: boolean): number {
  return plus ? PLUS_FREEZE_CAP : FREE_FREEZE_CAP
}

// Plus members get a free Aether stipend each month (cosmetic currency -
// never progression). Granted client-side in useGame.tickStreak.
export const PLUS_MONTHLY_AETHER = 500
export const PLUS_TRIAL_DAYS = 7
