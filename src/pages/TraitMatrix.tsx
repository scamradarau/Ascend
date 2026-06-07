import { useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { ATTRIBUTES } from '../data/attributes'
import { TRAITS } from '../data/traits'
import { PixelTitle, Pill } from '../components/ui'

export default function TraitMatrix() {
  const navigate = useNavigate()
  const activeTraits = useGame((s) => s.activeTraits)
  const activeIds = new Set(activeTraits.map((t) => t.id))
  const slotsLeft = 3 - activeTraits.length

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">TRAIT MATRIX</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Discover & choose traits</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            Browse the matrix and pick what to build. You can only build{' '}
            <span className="text-[var(--accent)]">3 traits at a time</span> — focus beats
            scatter. Once you start a main quest, you’re committed until it’s done.
          </p>
        </div>
        <Pill tone={slotsLeft > 0 ? 'exp' : 'gold'}>
          {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} open` : 'All slots full'}
        </Pill>
      </div>

      <div className="space-y-8">
        {ATTRIBUTES.map((attr) => {
          const traits = TRAITS.filter((t) => t.attribute === attr.id)
          return (
            <section key={attr.id}>
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
                  style={{ borderColor: attr.color, boxShadow: `0 0 16px ${attr.color}66` }}
                >
                  {attr.icon}
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold uppercase tracking-wide text-white">
                    {attr.name}{' '}
                    <span className="text-sm font-normal text-[var(--muted)]">/ {attr.short}</span>
                  </h2>
                  <p className="text-xs text-[var(--muted)]">{attr.blurb}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {traits.map((t) => {
                  const active = activeIds.has(t.id)
                  return (
                    <button
                      key={t.id}
                      onClick={() => navigate(`/app/traits/${t.id}`)}
                      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                        active
                          ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-glow'
                          : 'border-white/8 bg-white/[0.02] hover:border-white/25'
                      }`}
                    >
                      <div
                        className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-30 blur-xl"
                        style={{ background: attr.color }}
                      />
                      <div className="flex items-start justify-between">
                        <span className="font-display text-base font-bold text-white">{t.name}</span>
                        {active && <span className="text-xs text-[var(--accent)]">●</span>}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{t.tagline}</p>
                      <div className="mt-3 flex items-center gap-2">
                        <Pill tone={t.tier === 'low' ? 'exp' : t.tier === 'mid' ? 'default' : 'violet'}>
                          {t.tier}
                        </Pill>
                        {active && <Pill tone="gold">Building</Pill>}
                      </div>
                    </button>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
