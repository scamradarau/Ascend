import { useEffect } from 'react'
import { useGame, milestoneCrossed } from '../store/useGame'
import { playSfx } from '../lib/sfx'

// ================================================================
// STREAK WATCHER — mounted once in the app shell. It (1) ticks the
// streak on load (weekly freeze grant + bridge missed days), (2) fires
// a big celebration when you cross a streak milestone, and (3) shows a
// "Streak Freeze used" banner when a freeze just saved your chain.
// All client-side; the streak is client-owned so freezes never get
// stomped by the server sync.
// ================================================================

const MILESTONE_COPY: Record<number, { title: string; sub: string }> = {
  3: { title: 'Chain started', sub: 'Three days in. This is where habits take root.' },
  7: { title: 'One week strong', sub: 'A full week of showing up. You’re not playing anymore.' },
  14: { title: 'Two weeks deep', sub: 'Most people quit by now. You didn’t.' },
  30: { title: 'Thirty days', sub: 'A month of proof. This is who you are now.' },
  60: { title: 'Sixty days', sub: 'Two months. The work is becoming automatic.' },
  100: { title: '100 days', sub: 'Triple digits. Elite consistency — genuinely rare air.' },
  180: { title: 'Half a year', sub: '180 days of earned progress. Unstoppable.' },
  365: { title: 'One full year', sub: '365 days. You are a different person than when you started.' },
}

export default function StreakWatcher() {
  const streak = useGame((s) => s.streak)
  const streakMilestone = useGame((s) => s.streakMilestone)
  const celebrateStreak = useGame((s) => s.celebrateStreak)
  const freezeNotice = useGame((s) => s.freezeNotice)
  const reduceMotion = useGame((s) => s.reduceMotion)
  const tickStreak = useGame((s) => s.tickStreak)
  const markStreakMilestone = useGame((s) => s.markStreakMilestone)
  const dismissCelebration = useGame((s) => s.dismissCelebration)
  const clearFreezeNotice = useGame((s) => s.clearFreezeNotice)

  // tick once on mount (grant weekly freeze, bridge a missed day)
  useEffect(() => {
    tickStreak()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // celebrate when the streak crosses a milestone (any source — local or cloud)
  useEffect(() => {
    const m = milestoneCrossed(streak, streakMilestone)
    if (m) markStreakMilestone(m)
  }, [streak, streakMilestone, markStreakMilestone])

  // sound + auto-dismiss for the celebration
  useEffect(() => {
    if (celebrateStreak == null) return
    playSfx('levelUp')
  }, [celebrateStreak])

  // auto-clear the freeze banner
  useEffect(() => {
    if (!freezeNotice) return
    playSfx('aether')
    const t = setTimeout(() => clearFreezeNotice(), 6000)
    return () => clearTimeout(t)
  }, [freezeNotice, clearFreezeNotice])

  const copy = celebrateStreak != null ? MILESTONE_COPY[celebrateStreak] : null

  return (
    <>
      {/* freeze-used banner */}
      {freezeNotice && (
        <div className="fixed left-1/2 top-20 z-50 -translate-x-1/2 px-3">
          <button
            onClick={clearFreezeNotice}
            className="flex items-center gap-2 rounded-full border border-cosmos-cyan/40 bg-[var(--bg)]/95 px-4 py-2 text-sm text-white shadow-xl backdrop-blur"
          >
            {freezeNotice}
          </button>
        </div>
      )}

      {/* milestone celebration */}
      {celebrateStreak != null && copy && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismissCelebration} />
          {!reduceMotion && <Confetti />}
          <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-cosmos-gold/50 bg-[var(--bg)]/95 p-7 text-center shadow-2xl">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-cosmos-gold/25 blur-3xl" />
            <div className="relative">
              <div className="font-pixel text-[11px] uppercase tracking-[0.2em] text-cosmos-gold">
                Streak milestone
              </div>
              <div className="mt-3 text-6xl">🔥</div>
              <div className="mt-2 font-display text-5xl font-black text-white">{celebrateStreak}</div>
              <div className="text-xs uppercase tracking-widest text-[var(--muted)]">day streak</div>
              <h2 className="mt-4 font-display text-xl font-bold text-white">{copy.title}</h2>
              <p className="mt-1 text-sm text-slate-300">{copy.sub}</p>
              <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-cosmos-gold/40 bg-cosmos-gold/10 px-3 py-1 text-sm font-bold text-cosmos-gold">
                ◈ +{celebrateStreak * 5} Aether bonus
              </div>
              <button onClick={dismissCelebration} className="btn btn-primary mt-6 w-full">
                Keep the chain alive →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// lightweight CSS confetti — no library, respects reduce-motion (gated by caller)
function Confetti() {
  const colors = ['#ffcf5c', '#38e1ff', '#ff5ccf', '#9a7bff', '#5cff9d']
  const bits = Array.from({ length: 36 })
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <style>{`
        @keyframes confFall { 0% { transform: translateY(-10vh) rotate(0deg); opacity:1 }
          100% { transform: translateY(110vh) rotate(720deg); opacity:.9 } }
      `}</style>
      {bits.map((_, i) => {
        const left = (i * 97) % 100
        const delay = (i % 10) * 0.12
        const dur = 2.4 + ((i * 13) % 18) / 10
        const size = 6 + (i % 4) * 2
        return (
          <span
            key={i}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: 0,
              width: size,
              height: size * 1.6,
              background: colors[i % colors.length],
              borderRadius: 1,
              animation: `confFall ${dur}s linear ${delay}s infinite`,
            }}
          />
        )
      })}
    </div>
  )
}
