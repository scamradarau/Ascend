import { useGame, usePlayerLevel } from '../store/useGame'
import { RANKS, rankForLevel, nextRank } from '../data/ranks'
import { totalExpToReach } from '../data/leveling'
import { ExpBar, PixelTitle, Pill } from '../components/ui'

export default function LevelExpectations() {
  const profile = useGame((s) => s.profile)
  const { level, pct, intoLevel, needed } = usePlayerLevel()
  const rank = rankForLevel(level)
  const next = nextRank(level)
  const expToNextRank = next ? totalExpToReach(next.minLevel) : 0

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">LEVEL &amp; EXPECTATIONS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          Where you’re expected to be
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
          Your rank sets the bar for income, physique and life experience. This is for motivation &
          entertainment — anything more or less, request a rank change.
        </p>
      </div>

      {/* current rank hero */}
      <div className="panel hud-corner relative overflow-hidden p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">
              {profile?.handle} · current rank
            </div>
            <div className="mt-1 font-pixel text-3xl text-[var(--accent)] glow-text">{rank.title}</div>
            <div className="mt-2 font-display text-6xl font-black text-white">LV {level}</div>
          </div>
          <div className="w-full max-w-sm">
            <ExpBar pct={pct} label="EXP this level" />
            <div className="mt-1 text-xs text-[var(--muted)]">
              {intoLevel}/{needed} EXP
            </div>
            {next && (
              <div className="mt-3 rounded-lg border border-white/8 bg-black/30 p-3 text-xs text-[var(--muted)]">
                Next rank <span className="text-[var(--accent)]">{next.title}</span> at Lv{' '}
                {next.minLevel} · ~{Math.max(0, expToNextRank - (totalExpToReach(level) + intoLevel))}{' '}
                EXP to go
              </div>
            )}
          </div>
        </div>
        <p className="relative mt-5 max-w-2xl rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm italic text-slate-300">
          “{rank.theme}”
        </p>
      </div>

      {/* current expectations */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)] glow-text">
          {rank.title.toUpperCase()} — LIFE EXPECTATIONS
        </span>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rank.expectations.map((e) => (
            <div
              key={e}
              className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-sm text-slate-200"
            >
              <span className="text-[var(--accent)]">◆</span> {e}
            </div>
          ))}
        </div>
      </div>

      {/* full ladder */}
      <div className="mt-8">
        <span className="font-pixel text-xs text-[var(--muted)]">THE FULL LADDER</span>
        <div className="mt-4 space-y-3">
          {RANKS.map((r) => {
            const isCurrent = r.id === rank.id
            const reached = level >= r.minLevel
            return (
              <div
                key={r.id}
                className={`panel flex flex-wrap items-center gap-4 p-4 transition ${
                  isCurrent ? 'border-[var(--accent)] shadow-glow' : reached ? '' : 'opacity-60'
                }`}
              >
                <div className="flex w-40 shrink-0 items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg border font-pixel text-[10px] ${
                      reached
                        ? 'border-[var(--accent)] text-[var(--accent)]'
                        : 'border-white/15 text-[var(--muted)]'
                    }`}
                  >
                    {r.minLevel}
                  </div>
                  <div>
                    <div className="font-display font-bold uppercase tracking-wide text-white">
                      {r.title}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">
                      Lv {r.minLevel}–{r.maxLevel === 999 ? '∞' : r.maxLevel}
                    </div>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap gap-1.5">
                  {r.expectations.slice(0, 4).map((e) => (
                    <Pill key={e}>{e}</Pill>
                  ))}
                </div>
                {isCurrent && <Pill tone="exp">You are here</Pill>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
