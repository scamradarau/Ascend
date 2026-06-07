import { useState } from 'react'
import { useGame, usePlayerLevel } from '../store/useGame'
import {
  COSMETIC_GROUPS,
  RARITY_COLOR,
  type Cosmetic,
  type CosmeticSlot,
} from '../data/cosmetics'
import { PixelTitle, Pill, Toast } from '../components/ui'

// Real-world reward redemptions (deck: coupons, gift cards, tech, cash).
const REWARDS = [
  { id: 'coupon', name: 'Café Coupon', icon: '☕', cost: 400, tier: 'LOW', reqLevel: 1 },
  { id: 'book', name: 'Any Main-Quest Book', icon: '📚', cost: 1200, tier: 'MID', reqLevel: 10 },
  { id: 'giftcard', name: '$25 Gift Card', icon: '💳', cost: 2500, tier: 'MID', reqLevel: 20 },
  { id: 'membership', name: '1-Month Gym Membership', icon: '🏋️', cost: 4000, tier: 'HIGH', reqLevel: 25 },
  { id: 'tech', name: 'Trending Tech Drop', icon: '📱', cost: 9000, tier: 'HIGH', reqLevel: 40 },
  { id: 'cash', name: 'IRL Cash Reward', icon: '💵', cost: 15000, tier: 'HIGH', reqLevel: 50 },
]

const TIER_TONE = { LOW: 'exp', MID: 'default', HIGH: 'gold' } as const

export default function Shop() {
  const aether = useGame((s) => s.aether)
  const purchased = useGame((s) => s.purchasedCosmetics)
  const purchaseCosmetic = useGame((s) => s.purchaseCosmetic)
  const setAvatar = useGame((s) => s.setAvatar)
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
            Aether (◈) is earned by verified quests. Spend it on cosmetics or redeem real-world
            rewards funded by sponsors.
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {REWARDS.map((r) => {
            const locked = level < r.reqLevel
            const afford = aether >= r.cost
            return (
              <div key={r.id} className={`panel p-5 text-center ${locked ? 'opacity-60' : ''}`}>
                <div className="text-4xl">{r.icon}</div>
                <h3 className="mt-2 font-display text-base font-bold text-white">{r.name}</h3>
                <Pill tone={TIER_TONE[r.tier as keyof typeof TIER_TONE]}>{r.tier} reward</Pill>
                <div className="mt-3 font-pixel text-sm text-cosmos-gold">◈ {r.cost.toLocaleString()}</div>
                <button
                  disabled={locked || !afford}
                  onClick={() => flash(locked ? 'Level too low' : 'Redeemed — check your email!')}
                  className="btn btn-primary mt-3 w-full text-xs"
                >
                  {locked ? `🔒 Lv ${r.reqLevel}` : afford ? 'Redeem' : 'Not enough ◈'}
                </button>
              </div>
            )
          })}
          <p className="col-span-full mt-2 text-center text-[11px] text-[var(--muted)]">
            Rewards are sponsor-funded and rotate to keep the ladder fair. Redemptions are verified
            against your integrity score before fulfilment.
          </p>
        </div>
      )}

      <Toast message={toast} />
    </div>
  )
}
