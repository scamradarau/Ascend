import { useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { isOwnerEmail } from '../lib/supabase'
import { VERIFICATION_METHODS } from '../data/verification'
import { PixelTitle, Pill } from '../components/ui'

// Engagement index — empty at launch; wire to real analytics later.
const WEEKLY: number[] = []

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
  const authUser = useAuth((s) => s.user)
  const submissions = useGame((s) => s.submissions)
  const reviewSubmission = useGame((s) => s.reviewSubmission)
  const profile = useGame((s) => s.profile)
  const trust = useGame((s) => s.trust)
  const [seedQueue, setSeedQueue] = useState(SEED_QUEUE)
  const [decided, setDecided] = useState<Record<string, 'approve' | 'reject'>>({})

  // own submissions needing review
  const ownQueue = useMemo(
    () => submissions.filter((s) => s.status === 'pending' || s.status === 'flagged'),
    [submissions],
  )

  // hard gate: only the configured owner account, even if a copied save has ownerMode on
  if (!ownerMode || !isOwnerEmail(authUser?.email))
    return <Navigate to="/app/settings" replace />

  // Fresh-launch KPIs — real where we can read it locally, zero/— otherwise.
  // These populate for real once backend aggregate queries are wired.
  const flaggedCount = ownQueue.filter((s) => s.status === 'flagged').length
  const verifiedCount = submissions.filter((s) => s.status === 'verified').length
  const KPIS = [
    { label: 'Total Players', value: '—' },
    { label: 'Daily Active', value: '—' },
    { label: 'D7 Retention', value: '—' },
    { label: 'Quests Verified (you)', value: String(verifiedCount) },
    { label: 'Verification Pass Rate', value: '—' },
    { label: 'Flagged for Review', value: String(flaggedCount) },
    { label: 'Avg Integrity', value: profile ? `${trust} / 100` : '—' },
    { label: 'MRR', value: '$0' },
  ]

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
            Platform health, the anti-cheat review queue, rewards & revenue. Fresh launch —
            metrics fill in as players join; the review queue acts on real submissions.
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
            <p className="mt-3 py-4 text-center text-sm text-[var(--muted)]">
              No flags recorded yet. Reasons rank here as the anti-cheat engine catches them.
            </p>
          </div>

          {/* engagement */}
          <div className="panel p-5">
            <span className="font-pixel text-xs text-[var(--accent)]">ENGAGEMENT (7d)</span>
            {WEEKLY.length === 0 ? (
              <p className="mt-3 py-4 text-center text-sm text-[var(--muted)]">
                No engagement data yet — fills in once players are active.
              </p>
            ) : (
              <div className="mt-4 flex h-28 items-end gap-2">
                {WEEKLY.map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div className="w-full rounded-t exp-fill" style={{ height: `${v}%` }} />
                    <span className="text-[9px] text-[var(--muted)]">{['M','T','W','T','F','S','S'][i]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* revenue */}
          <div className="panel p-5">
            <span className="font-pixel text-xs text-cosmos-gold">SUBSCRIPTIONS</span>
            <p className="mt-3 py-4 text-center text-sm text-[var(--muted)]">
              No subscriptions yet. Everyone’s on the free plan during the test.
            </p>
          </div>
        </div>
      </div>

      {/* reward & sponsor management */}
      <div className="panel mt-5 p-5">
        <span className="font-pixel text-xs text-cosmos-gold">REWARD &amp; SPONSOR POOL</span>
        <p className="mt-3 py-4 text-center text-sm text-[var(--muted)]">
          No sponsors onboarded yet. Add rewards here as you secure partners — keep them cheap
          or free (memberships, ebooks) to start.
        </p>
      </div>
    </div>
  )
}
