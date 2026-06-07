import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { VERIFICATION_METHODS } from '../data/verification'
import { PixelTitle, Pill } from '../components/ui'

// ---- mocked platform-wide analytics (owner view) ----
const KPIS = [
  { label: 'Total Players', value: '48,212', delta: '+3.4%', good: true },
  { label: 'Daily Active', value: '12,408', delta: '+1.9%', good: true },
  { label: 'D7 Retention', value: '41%', delta: '+2.1pp', good: true },
  { label: 'Quests Verified / 24h', value: '38,940', delta: '+5.2%', good: true },
  { label: 'Verification Pass Rate', value: '92.6%', delta: '-0.4pp', good: false },
  { label: 'Flagged for Review', value: '212', delta: '+18', good: false },
  { label: 'Avg Integrity', value: '94 / 100', delta: '+0.3', good: true },
  { label: 'MRR', value: '$214,330', delta: '+6.8%', good: true },
]

const WEEKLY = [62, 70, 58, 81, 90, 76, 88] // engagement index
const FLAG_REASONS = [
  ['Photo-of-a-photo (AI screen detect)', 38],
  ['GPS / location mismatch', 27],
  ['Pasted / AI-written summary', 19],
  ['Impossible travel between captures', 9],
  ['Timer foreground violations', 7],
]

const SUBSCRIPTIONS = [
  ['Free', 31200, '$0'],
  ['Ascend+ (monthly)', 14800, '$9.99'],
  ['Ascend+ (annual)', 1900, '$79'],
  ['Guild Elite', 312, '$24.99'],
]

const REWARD_POOL = [
  ['Café Coupons', 'Local Sponsors', 5000, true],
  ['$25 Gift Cards', 'RewardCo', 800, true],
  ['Gym Memberships', 'IronFit', 250, true],
  ['Trending Tech', 'TechDrop', 40, false],
  ['IRL Cash', 'Treasury', 20, true],
]

// Review queue from other players. Empty until real users submit proof;
// it then populates from the backend. The current player's own pending/
// flagged submissions always appear (see ownQueue below).
interface SeedItem {
  id: string
  handle: string
  label: string
  method: keyof typeof VERIFICATION_METHODS
  status: 'flagged' | 'pending'
  reasons: string[]
}
const SEED_QUEUE: SeedItem[] = []

export default function Admin() {
  const ownerMode = useGame((s) => s.ownerMode)
  const submissions = useGame((s) => s.submissions)
  const reviewSubmission = useGame((s) => s.reviewSubmission)
  const profile = useGame((s) => s.profile)
  const [seedQueue, setSeedQueue] = useState(SEED_QUEUE)
  const [decided, setDecided] = useState<Record<string, 'approve' | 'reject'>>({})

  // own submissions needing review
  const ownQueue = useMemo(
    () => submissions.filter((s) => s.status === 'pending' || s.status === 'flagged'),
    [submissions],
  )

  if (!ownerMode) return <Navigate to="/app/settings" replace />

  const decideSeed = (id: string, d: 'approve' | 'reject') => {
    setSeedQueue((q) => q.filter((x) => x.id !== id))
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-cosmos-gold">OWNER DASHBOARD</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Command center</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Platform health, the anti-cheat review queue, rewards & revenue. (Analytics are
            illustrative; the review queue acts on real submissions.)
          </p>
        </div>
        <Pill tone="gold">OWNER</Pill>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {KPIS.map((k) => (
          <div key={k.label} className="panel p-4">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{k.label}</div>
            <div className="mt-1 font-display text-xl font-bold text-white">{k.value}</div>
            <div className={`mt-0.5 text-[11px] ${k.good ? 'text-exp' : 'text-cosmos-magenta'}`}>
              {k.good ? '▲' : '▼'} {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* ---------------- REVIEW QUEUE ---------------- */}
        <div className="panel hud-corner p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-cosmos-gold">VERIFICATION REVIEW QUEUE</span>
            <Pill tone="default">{ownQueue.length + seedQueue.length} open</Pill>
          </div>

          <div className="space-y-2.5">
            {/* the player's own flagged/pending items — real actions */}
            {ownQueue.map((s) => {
              const m = VERIFICATION_METHODS[s.method]
              const done = decided[s.id]
              return (
                <div
                  key={s.id}
                  className={`rounded-xl border p-3 ${
                    done ? 'border-white/8 opacity-50' : 'border-white/12 bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {s.thumb ? (
                      <img src={s.thumb} className="h-14 w-14 rounded-lg object-cover" alt="" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 text-2xl">
                        {m.icon}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white">{profile?.handle}</span>
                        <Pill tone="exp">you</Pill>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            s.status === 'flagged' ? 'text-cosmos-magenta' : 'text-amber-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {s.label} · {m.label}
                      </div>
                      <div className="mt-1 text-[11px] text-[var(--muted)]">
                        {s.meta.gps && `📍 ${s.meta.gps.lat.toFixed(3)}, ${s.meta.gps.lng.toFixed(3)} · `}
                        {s.meta.dwellSec && `⏱ ${Math.round(s.meta.dwellSec / 60)}m · `}
                        {s.meta.wordCount && `📝 ${s.meta.wordCount}w · `}
                        {s.meta.livenessCode && `🔑 ${s.meta.livenessCode}`}
                      </div>
                      {s.meta.flags?.map((f) => (
                        <div key={f} className="mt-1 text-[11px] text-cosmos-magenta">⚠ {f}</div>
                      ))}
                    </div>
                  </div>
                  {!done && (
                    <div className="mt-2 flex justify-end gap-2">
                      <button
                        onClick={() => {
                          reviewSubmission(s.id, 'reject')
                          setDecided((d) => ({ ...d, [s.id]: 'reject' }))
                        }}
                        className="btn btn-ghost border-cosmos-magenta/40 text-cosmos-magenta text-[11px]"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => {
                          reviewSubmission(s.id, 'approve')
                          setDecided((d) => ({ ...d, [s.id]: 'approve' }))
                        }}
                        className="btn btn-primary text-[11px]"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                  {done && (
                    <div className="mt-2 text-right text-[11px] uppercase tracking-wide text-[var(--muted)]">
                      {done === 'approve' ? '✓ Approved' : '✗ Rejected'}
                    </div>
                  )}
                </div>
              )
            })}

            {/* seeded items from other players */}
            {seedQueue.map((s) => {
              const m = VERIFICATION_METHODS[s.method]
              return (
                <div key={s.id} className="rounded-xl border border-white/12 bg-white/[0.02] p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 text-2xl">
                      {m.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-display font-bold text-white">{s.handle}</span>
                        <span
                          className={`text-[10px] uppercase tracking-wide ${
                            s.status === 'flagged' ? 'text-cosmos-magenta' : 'text-amber-300'
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {s.label} · {m.label}
                      </div>
                      {s.reasons.map((r) => (
                        <div key={r} className="mt-1 text-[11px] text-cosmos-magenta">⚠ {r}</div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-2 flex justify-end gap-2">
                    <button
                      onClick={() => decideSeed(s.id, 'reject')}
                      className="btn btn-ghost border-cosmos-magenta/40 text-cosmos-magenta text-[11px]"
                    >
                      Reject
                    </button>
                    <button onClick={() => decideSeed(s.id, 'approve')} className="btn btn-primary text-[11px]">
                      Approve
                    </button>
                  </div>
                </div>
              )
            })}

            {ownQueue.length === 0 && seedQueue.length === 0 && (
              <p className="py-6 text-center text-sm text-[var(--muted)]">
                Queue clear — no submissions awaiting review. 🎉
              </p>
            )}
          </div>
        </div>

        {/* ---------------- side column ---------------- */}
        <div className="space-y-5">
          {/* anti-cheat breakdown */}
          <div className="panel p-5">
            <span className="font-pixel text-xs text-cosmos-magenta">TOP FLAG REASONS</span>
            <ul className="mt-3 space-y-2">
              {FLAG_REASONS.map(([r, n]) => (
                <li key={r as string}>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300">{r}</span>
                    <span className="text-[var(--muted)]">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/8">
                    <div
                      className="h-full rounded-full bg-cosmos-magenta"
                      style={{ width: `${((n as number) / 38) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* engagement */}
          <div className="panel p-5">
            <span className="font-pixel text-xs text-[var(--accent)]">ENGAGEMENT (7d)</span>
            <div className="mt-4 flex h-28 items-end gap-2">
              {WEEKLY.map((v, i) => (
                <div key={i} className="flex flex-1 flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t exp-fill"
                    style={{ height: `${v}%` }}
                  />
                  <span className="text-[9px] text-[var(--muted)]">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              ))}
            </div>
          </div>

          {/* revenue */}
          <div className="panel p-5">
            <span className="font-pixel text-xs text-cosmos-gold">SUBSCRIPTIONS</span>
            <table className="mt-3 w-full text-xs">
              <tbody>
                {SUBSCRIPTIONS.map(([name, count, price]) => (
                  <tr key={name as string} className="border-b border-white/5">
                    <td className="py-1.5 text-slate-300">{name}</td>
                    <td className="py-1.5 text-right text-[var(--muted)]">{(count as number).toLocaleString()}</td>
                    <td className="py-1.5 text-right text-cosmos-gold">{price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* reward & sponsor management */}
      <div className="panel mt-5 p-5">
        <span className="font-pixel text-xs text-cosmos-gold">REWARD &amp; SPONSOR POOL</span>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                <th className="py-2 text-left">Reward</th>
                <th className="py-2 text-left">Sponsor</th>
                <th className="py-2 text-right">Stock</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {REWARD_POOL.map(([name, sponsor, stock, active]) => (
                <tr key={name as string} className="border-t border-white/5">
                  <td className="py-2 text-white">{name}</td>
                  <td className="py-2 text-[var(--muted)]">{sponsor}</td>
                  <td className="py-2 text-right text-slate-300">{(stock as number).toLocaleString()}</td>
                  <td className="py-2 text-right">
                    <Pill tone={active ? 'exp' : 'default'}>{active ? 'Active' : 'Paused'}</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
