import { Link } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { PLUS_TRAIT_CAP, FREE_TRAIT_CAP } from '../data/plus'

// A compact, premium-feeling upsell. Renders ONLY for non-Plus players, so it
// can be dropped at any friction point (e.g. when trait slots are full) without
// nagging members. Links straight to the Plus page.
export default function PlusUpsell({ message, className }: { message?: string; className?: string }) {
  const plus = useGame((s) => s.plus)
  if (plus) return null
  return (
    <Link
      to="/app/plus"
      className={`flex items-center gap-3 rounded-xl border border-cosmos-gold/40 bg-gradient-to-r from-cosmos-gold/10 to-cosmos-violet/10 p-3 transition hover:border-cosmos-gold/70 ${className ?? ''}`}
    >
      <span className="text-2xl text-cosmos-gold">✦</span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white">
          Unlock {PLUS_TRAIT_CAP - FREE_TRAIT_CAP} more trait slots with Ascend Plus
        </div>
        <div className="text-xs text-[var(--muted)]">
          {message ?? `Build ${PLUS_TRAIT_CAP} traits at once instead of ${FREE_TRAIT_CAP} — plus exclusive cosmetics & more streak freezes.`}
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold uppercase tracking-wider text-cosmos-gold">
        Go Plus →
      </span>
    </Link>
  )
}
