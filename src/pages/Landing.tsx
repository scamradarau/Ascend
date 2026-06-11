import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { PixelTitle } from '../components/ui'

const FEATURES = [
  {
    icon: '📊',
    title: 'Stats & Traits',
    body: 'Self-discipline, confidence, focus — real traits as RPG stats. Complete tasks to level them up.',
  },
  {
    icon: '🎚️',
    title: 'Levels',
    body: 'Your level sets the expectation for where you’re meant to be — income, physique, life experience.',
  },
  {
    icon: '🏆',
    title: 'Leaderboards',
    body: 'Overall level, consistency and trait ladders — every rank on the board was earned with verified work.',
  },
  {
    icon: '🗺️',
    title: 'The World Map',
    body: 'Five Paths, rendered as regions of a realm. They only light up where you’ve actually done the work.',
  },
  {
    icon: '👹',
    title: 'Boss Fights',
    body: 'Weekly and monthly challenges are bosses — every verified log is a strike, and the bounty lands on the kill.',
  },
  {
    icon: '🔁',
    title: 'Accountability',
    body: 'Live photos, focus timers, reading checks. Clear proof verifies instantly; the rest goes to human review.',
  },
]

export default function Landing() {
  const navigate = useNavigate()
  const user = useAuth((s) => s.user)
  const onboarded = useGame((s) => s.onboarded)
  const ctaTo = user ? (onboarded ? '/app/character' : '/onboarding') : '/signup'
  const ctaLabel = user
    ? onboarded
      ? '▶ Enter the platform'
      : '▶ Continue onboarding'
    : '▶ Let’s get started'

  return (
    <div className="relative min-h-screen bg-[#070a18] text-white">
      {/* fixed cosmos backdrop for the whole page */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/themes/cosmos.webp)' }}
      />
      {/* uniform readability scrim — flat, so brightness does NOT shift as you
          scroll over the fixed backdrop (no vignette / "filter" effect) */}
      <div className="fixed inset-0 z-0" style={{ background: 'rgba(4,7,18,0.55)' }} />
      {/* ---------------- HERO (brand-blue title slide) ---------------- */}
      <section className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* brand-blue title-slide wash over the SHARED fixed cosmos backdrop
            (fades to transparent so the same backdrop continues into the
            sections below — no background "change" on scroll) */}
        <div className="absolute inset-0 bg-gradient-to-b from-brand/45 via-brand-700/25 to-transparent" />
        <div className="grid-overlay absolute inset-0 opacity-15" />
        <div className="starfield absolute inset-0 opacity-40" />

        <div className="relative z-10 mx-auto max-w-4xl">
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="chip border-white/40 text-white/80">Self-improvement, gamified</span>
          </div>
          <h1 className="mb-6">
            <PixelTitle className="block text-5xl text-black drop-shadow-[0_4px_0_rgba(255,255,255,0.25)] sm:text-7xl md:text-8xl">
              ASCEND
            </PixelTitle>
          </h1>
          <p className="font-display text-lg font-bold uppercase tracking-[0.2em] text-white sm:text-2xl">
            Level up your real life
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-white/85 sm:text-lg">
            Pick the traits you want to build, complete quests you have to prove, and climb a leaderboard
            of real people doing the work. Progress you can actually prove.
          </p>

          <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={ctaTo} className="btn btn-primary text-base">
              {ctaLabel}
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-ghost text-base text-white">
                Log in
              </Link>
            )}
            <a href="/brochure.html" target="_blank" rel="noopener" className="btn btn-ghost text-base text-white">
              Learn more
            </a>
          </div>
        </div>

        <div className="absolute bottom-8 z-10 animate-floaty text-white/70">
          <span className="text-3xl">⌄</span>
        </div>
      </section>

      {/* ---------------- WHAT IS ASCEND ---------------- */}
      <section id="what" className="relative z-10 overflow-hidden bg-[#070a18]/45 px-6 py-24">
        <div className="relative z-10 mx-auto max-w-5xl">
          <PixelTitle className="text-sm text-cosmos-cyan">WHAT IS “ASCEND”?</PixelTitle>
          <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
            Self-mastery, with a <span className="text-cosmos-cyan">progression bar.</span>
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            Ascend turns becoming your best self into a game you can actually win. Choose the traits
            you want to build, get clear daily quests, and watch real EXP, levels and stats track every
            bit of progress — so growth stops being vague and starts being visible.
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-400">
            Games make getting stronger feel obvious: you see your level, you know the next quest, you
            put in the time. Real life is the same effort — it just never gave you the screen. Ascend is
            that screen. Same you, finally with a map.
          </p>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="panel hud-corner p-5">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="font-display text-lg font-bold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- WHY ---------------- */}
      <section className="relative z-10 overflow-hidden bg-[#070a18]/45 px-6 py-24">
        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <PixelTitle className="text-sm text-cosmos-violet">WHY “ASCEND”?</PixelTitle>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              You already know you’re meant for more.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              The gap is never desire — you want it badly enough. It’s the blank page: not knowing
              where to start, no way to see if today actually moved the needle, nothing to keep you
              honest when motivation fades.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              Ascend closes that gap. Every quest is verified, so the EXP you earn is real progress you
              proved — not a streak you tapped. Your stats can’t lie to you, which means you finally
              can’t lie to yourself.
            </p>
          </div>
          <div className="panel hud-corner p-8">
            <div className="space-y-4">
              {[
                ['Confidence', 62],
                ['Self-Discipline', 78],
                ['Focus', 45],
              ].map(([name, pct]) => (
                <div key={name as string}>
                  <div className="mb-1 flex justify-between text-sm font-semibold uppercase tracking-wide text-slate-300">
                    <span>{name}</span>
                    <span className="text-exp">Lv {Math.round((pct as number) / 8)}</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-black/40">
                    <div className="exp-fill h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs uppercase tracking-widest text-slate-500">
              A clearer vision of where you are — and where you’re going.
            </p>
          </div>
        </div>
      </section>

      {/* ---------------- TARGET / CTA ---------------- */}
      <section className="relative z-10 overflow-hidden bg-[#070a18]/45 px-6 py-24 text-center">
        <div className="relative z-10 mx-auto max-w-3xl">
          <PixelTitle className="text-sm text-cosmos-cyan">THE ENDGAME AWAITS</PixelTitle>
          <h2 className="mt-4 font-display text-4xl font-bold sm:text-5xl">
            Built for those who know they’re <span className="text-cosmos-cyan">more.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-300">
            A world-class build, real accountability, and a leaderboard of people actually doing the
            work — not posting about it. Your Level 1 starts the moment you do. Pick your traits, take
            your first quest, and ascend.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={ctaTo} className="btn btn-primary text-lg">
              {ctaLabel}
            </Link>
            {!user && (
              <Link to="/login" className="btn btn-ghost text-lg text-white">
                Log in
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
