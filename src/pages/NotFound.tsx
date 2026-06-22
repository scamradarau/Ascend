import { Link } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { PixelTitle } from '../components/ui'

// A bespoke "off the map" 404 — in-world, Lumi-voiced, themed. Generic 404s
// (or silent redirects) are a dead giveaway of a template.
export default function NotFound() {
  const user = useAuth((s) => s.user)
  return (
    <div className="cosmos-bg relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      <div className="starfield absolute inset-0 opacity-40" />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-15" />

      <div className="relative z-10 max-w-md">
        <PixelTitle className="text-6xl text-white [text-shadow:0_2px_28px_rgba(34,211,238,0.3)] sm:text-7xl">
          404
        </PixelTitle>
        <h1 className="mt-5 font-display text-2xl font-bold uppercase tracking-wide text-white">
          You’ve wandered off the map
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          This region of the realm doesn’t exist — yet. Even the best explorers take a wrong turn now
          and then. Let’s get you back to solid ground.
        </p>

        {/* Lumi line */}
        <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent)]/5 px-4 py-2 text-sm text-slate-200">
          <span className="text-[var(--accent)]">✦</span>
          <span>“Lost? Happens to everyone. Come on — this way.” — Lumi</span>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link to={user ? '/app/character' : '/'} className="btn btn-primary">
            ▶ {user ? 'Back to the platform' : 'Back to the start'}
          </Link>
        </div>
      </div>
    </div>
  )
}
