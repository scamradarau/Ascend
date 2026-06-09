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
    body: 'Overall level, consistency and trait ladders. Climb the ranks and earn real rewards.',
  },
  {
    icon: '🎖️',
    title: 'Badges & Items',
    body: 'Earn achievements and items by levelling traits and crushing quests. Build respect in the guild.',
  },
  {
    icon: '🛡️',
    title: 'The Guild',
    body: 'One massive community of like-minded people, all climbing toward the endgame together.',
  },
  {
    icon: '🔁',
    title: 'Accountability',
    body: 'Real-time photos, written summaries, check-ins. Progress you can actually prove.',
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
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 20%, transparent 40%, rgba(3,5,12,0.65) 100%), linear-gradient(to bottom, rgba(3,5,12,0.3), rgba(3,5,12,0.55))',
        }}
      />
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
            Pick the traits you want to build, complete quests you can’t fake, and climb a leaderboard
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
            Ascend is a platform dedicated to helping people self-improve — with a twist. EXP bars,
            traits, levels and more make self-mastery easier by giving you a visual guide of where you
            are and how to improve each trait with absolute specificity.
          </p>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-slate-400">
            Think about progression in games. There are heaps of guides on how to improve your
            character — it’s straightforward, it just takes time. You can <em>see</em> what level you’re
            at, so you naturally know how to get stronger and what quest to complete next. What if we
            could simplify progression in real life, just as games do?
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
      <section className="relative z-10 overflow-hidden bg-[#0a0f24]/55 px-6 py-24">
        <div className="relative z-10 mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2">
          <div>
            <PixelTitle className="text-sm text-cosmos-violet">WHY “ASCEND”?</PixelTitle>
            <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
              You already know you’re meant for more.
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              How many times a day do you think “I wish I had X” or “I wish I was better at X”? You
              think it often — but you don’t take action. Why? Because you don’t know where to start.
            </p>
            <p className="mt-4 text-lg leading-relaxed text-slate-400">
              With life as a game, we give you a clear vision and a precise understanding of how to get
              there — no matter the goal.
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
            Never-seen-before concepts, beautiful visuals, real accountability, and successful people
            on the platform for inspiration. Pick your traits. Take your first quest. Ascend.
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
