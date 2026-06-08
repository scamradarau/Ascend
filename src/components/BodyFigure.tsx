import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { isOwnerEmail } from '../lib/supabase'
import { resolveClass } from '../data/classes'
import ClassAvatar from './ClassAvatar'

// The centrepiece of the character page: the player's evolving class
// portrait, with the brain node (→ Trait Matrix) and level badge (→ Level page).
export default function BodyFigure({ level }: { level: number }) {
  const navigate = useNavigate()
  const avatar = useGame((s) => s.avatar)
  const classId = useGame((s) => s.classId)
  const ownerMode = useGame((s) => s.ownerMode)
  const authUser = useAuth((s) => s.user)
  const owner = ownerMode && isOwnerEmail(authUser?.email)
  const cls = resolveClass(level, classId, owner)

  return (
    <div className="relative flex h-full min-h-[440px] w-full items-center justify-center">
      {/* scan line */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
        <div className="h-24 w-full bg-[linear-gradient(180deg,transparent,color-mix(in_srgb,var(--accent)_16%,transparent),transparent)] animate-scan" />
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* avatar with concentric aura rings centred on the portrait itself */}
        <div className="relative">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_color-mix(in_srgb,var(--accent)_14%,transparent),_transparent_62%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--edge)] opacity-30 animate-pulseGlow"
          />
          <ClassAvatar level={level} config={avatar} size={300} classId={classId} owner={owner} />
        </div>
        <div className="mt-1 rounded-full border border-[var(--edge)] bg-black/50 px-3 py-1 text-[11px] uppercase tracking-wider text-[var(--accent)]">
          {cls.name}
        </div>
      </div>

      {/* brain button (zoom into traits) */}
      <button
        onClick={() => navigate('/app/traits')}
        className="group absolute right-3 top-3 z-20"
        title="Discover traits"
      >
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--accent)] bg-black/60 text-2xl shadow-glow transition-transform group-hover:scale-110">
            🧠
          </div>
          <span className="mt-1 rounded-full border border-[var(--edge)] bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[var(--accent)]">
            Traits
          </span>
        </div>
      </button>

      {/* customize button */}
      <button
        onClick={() => navigate('/app/settings')}
        className="absolute left-3 top-3 z-20 flex h-11 w-11 items-center justify-center rounded-full border border-[var(--edge)] bg-black/60 text-lg transition hover:shadow-glow"
        title="Customise avatar"
      >
        🎨
      </button>

      {/* level badge */}
      <button
        onClick={() => navigate('/app/level')}
        className="absolute bottom-2 left-1/2 z-20 -translate-x-1/2 rounded-lg border border-[var(--edge-strong)] bg-black/70 px-4 py-1.5 text-center transition hover:shadow-glow"
      >
        <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Level</div>
        <div className="font-pixel text-lg text-[var(--accent)] glow-text">{level}</div>
      </button>
    </div>
  )
}
