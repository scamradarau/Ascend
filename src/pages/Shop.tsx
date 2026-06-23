import { useState } from 'react'
import { useGame, usePlayerLevel, REWARD_INTEGRITY_MIN } from '../store/useGame'
import {
  COSMETIC_GROUPS,
  RARITY_COLOR,
  type Cosmetic,
  type CosmeticSlot,
} from '../data/cosmetics'
import { PixelTitle, Pill, Toast } from '../components/ui'

// Low-cost, sustainable real rewards - mostly free digital perks to start.
const REWARDS = [
  { id: 'shoutout', name: 'Community Shout-out', icon: '📣', cost: 250, tier: 'LOW', reqLevel: 1 },
  { id: 'ebook', name: 'Free Ebook (self-help classic)', icon: '📚', cost: 500, tier: 'LOW', reqLevel: 3 },
  { id: 'meditation', name: 'Free Meditation App - 1 Month', icon: '🧘', cost: 800, tier: 'LOW', reqLevel: 5 },
  { id: 'habit', name: 'Free Habit-Tracker Premium - 1 Month', icon: '✅', cost: 1000, tier: 'MID', reqLevel: 8 },
  { id: 'fitness', name: 'Free Fitness App - 1 Month', icon: '🏃', cost: 1400, tier: 'MID', reqLevel: 12 },
  { id: 'discount', name: 'Partner Discount Code', icon: '🏷️', cost: 1800, tier: 'MID', reqLevel: 15 },
]

const TIER_TONE = { LOW: 'exp', MID: 'default', HIGH: 'gold' } as const

export default function Shop() {
  const aether = useGame((s) => s.aether)
  const purchased = useGame((s) => s.purchasedCosmetics)
  const purchaseCosmetic = useGame((s) => s.purchaseCosmetic)
  const setAvatar = useGame((s) => s.setAvatar)
  const trust = useGame((s) => s.trust)
  const rewardEligible = trust >= REWARD_INTEGRITY_MIN
  const { level } = usePlayerLevel()
  const [tab, setTab] = useState<'cosmetics' | 'rewards'>('cosmetics')
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  // all buyable cosmetics across slots
  const buyables: { slot: CosmeticSlot; c: Cosmetic }[] = []
  ;(Object.keys(COSMETIC_GROUPS) as CosmeticSlot[]).forEach((slot) => {
    COSMETIC_GROUPS[slot].forEach((c) => {
      if (c.unlock.buy !== undefined) buyables.push({ slot, c })
    })
  })

  const buy = (slot: CosmeticSlot, c: Cosmetic) => {
    const cost = c.unlock.buy!
    if (purchased.includes(c.id)) {
      setAvatar(slot, c.id)
      flash(`${c.name} equipped`)
      return
    }
    if (purchaseCosmetic(c.id, cost)) {
      setAvatar(slot, c.id)
      flash(`Unlocked & equipped ${c.name}!`)
    } else {
      flash('Not enough Aether')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">SHOP</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Spend your Aether</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Aether (◈) is earned by verified quests. Spend it on cosmetics now - sponsor-funded
            real-world rewards are coming as the community grows.
          </p>
        </div>
        <div className="rounded-xl border border-cosmos-gold/40 bg-cosmos-gold/5 px-4 py-2 text-center">
          <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Balance</div>
          <div className="font-pixel text-lg text-cosmos-gold">◈ {aether.toLocaleString()}</div>
        </div>
      </div>

      <div className="mb-5 flex gap-2">
        {(['cosmetics', 'rewards'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === t
                ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] shadow-glow'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            {t === 'cosmetics' ? 'Cosmetics' : 'Real Rewards'}
          </button>
        ))}
      </div>

      {tab === 'cosmetics' && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {buyables.map(({ slot, c }) => {
            const owned = purchased.includes(c.id)
            const color = RARITY_COLOR[c.rarity]
            const cost = c.unlock.buy!
            const afford = aether >= cost
            return (
              <div key={c.id} className="panel p-4" style={{ borderColor: `${color}44` }}>
                <div className="flex items-center justify-between">
                  <span className="font-display text-base font-bold text-white">{c.name}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{ color, border: `1px solid ${color}66` }}
                  >
                    {c.rarity}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{c.desc}</p>
                <div className="mt-1 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  {slot}
                </div>
                <button
                  onClick={() => buy(slot, c)}
                  disabled={!owned && !afford}
                  className={`mt-3 w-full text-xs ${owned ? 'btn btn-ghost' : 'btn btn-primary'}`}
                >
                  {owned ? 'Equip' : `Buy · ◈ ${cost}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'rewards' && (
        <div>
          <div className="mb-4 rounded-xl border border-cosmos-gold/30 bg-cosmos-gold/5 p-4 text-sm text-slate-200">
            <span className="font-semibold text-cosmos-gold">🚧 Real rewards are on the way.</span>{' '}
            We’re lining up sponsor-funded perks for launch. For now, your Aether is for cosmetics
            and bragging rights - these unlock as the community grows.{' '}
            <span className="text-[var(--muted)]">Nothing here spends your Aether yet.</span>
          </div>

          {/* integrity gate - rewards are only redeemable above the threshold,
              so cheating (which drops Integrity via flags) locks you out. */}
          <div
            className={`mb-4 flex items-start gap-2 rounded-xl border p-4 text-sm ${
              rewardEligible
                ? 'border-exp/30 bg-exp/5 text-slate-200'
                : 'border-cosmos-magenta/40 bg-cosmos-magenta/5 text-slate-200'
            }`}
          >
            <span className="mt-0.5 text-base">🛡</span>
            {rewardEligible ? (
              <span>
                <span className="font-semibold text-exp">Eligible · Integrity {trust}/100.</span>{' '}
                Real rewards require an Integrity score of <strong>{REWARD_INTEGRITY_MIN}+</strong>.
                Keep playing fair and you stay eligible.
              </span>
            ) : (
              <span>
                <span className="font-semibold text-cosmos-magenta">
                  Rewards locked · Integrity {trust}/100.
                </span>{' '}
                Real rewards require <strong>{REWARD_INTEGRITY_MIN}+</strong>. Integrity falls when
                submissions are flagged and recovers as you complete honest, verified quests.
              </span>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {REWARDS.map((r) => {
              const reached = level >= r.reqLevel
              return (
                <div key={r.id} className="panel p-5 text-center opacity-80">
                  <div className="text-4xl">{r.icon}</div>
                  <h3 className="mt-2 font-display text-base font-bold text-white">{r.name}</h3>
                  <Pill tone={TIER_TONE[r.tier as keyof typeof TIER_TONE]}>{r.tier} reward</Pill>
                  <div className="mt-3 font-pixel text-sm text-cosmos-gold">
                    ◈ {r.cost.toLocaleString()}
                  </div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    {reached ? 'Level unlocked' : `Unlocks at Lv ${r.reqLevel}`}
                  </div>
                  <button
                    disabled
                    className="btn btn-ghost mt-3 w-full cursor-not-allowed text-xs opacity-70"
                  >
                    {rewardEligible ? '🔜 Coming soon' : `🔒 Needs Integrity ${REWARD_INTEGRITY_MIN}+`}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
