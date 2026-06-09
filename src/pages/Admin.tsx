import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { isOwnerEmail, isCloud, type CloudProfile } from '../lib/supabase'
import { fetchPendingReview, reviewSubmission, fetchProfilesByIds, type SubmissionRow } from '../lib/social'
import { PixelTitle, Pill, Toast } from '../components/ui'

// Engagement index — empty at launch; wire to real analytics later.
const WEEKLY: number[] = []

export default function Admin() {
  const ownerMode = useGame((s) => s.ownerMode)
  const authUser = useAuth((s) => s.user)
  const submissions = useGame((s) => s.submissions)
  const profile = useGame((s) => s.profile)
  const trust = useGame((s) => s.trust)
  const [reviewMsg, setReviewMsg] = useState<string | null>(null)

  // live cross-user photo review queue (from the DB; admins see everyone's)
  const [pendingReview, setPendingReview] = useState<SubmissionRow[]>([])
  const [revProfiles, setRevProfiles] = useState<Record<string, CloudProfile>>({})
  const [busyId, setBusyId] = useState<string | null>(null)

  const loadPending = async () => {
    if (!isCloud) return
    const rows = await fetchPendingReview()
    setPendingReview(rows)
    const ids = [...new Set(rows.map((r) => r.user_id))].filter((id) => !revProfiles[id])
    if (ids.length) {
      const ps = await fetchProfilesByIds(ids)
      setRevProfiles((p) => {
        const n = { ...p }
        for (const x of ps) n[x.id] = x
        return n
      })
    }
  }
  useEffect(() => {
    loadPending()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const decideReview = async (id: string, decision: 'approve' | 'reject') => {
    setBusyId(id)
    const { data, error } = await reviewSubmission(id, decision)
    setBusyId(null)
    if (error) {
      setReviewMsg(`Review failed: ${error}`)
      return
    }
    const r = data as { status?: string; exp_awarded?: number } | null
    setReviewMsg(
      decision === 'approve'
        ? `✓ Approved — granted ${r?.exp_awarded ?? 0} EXP`
        : '✗ Rejected — no EXP',
    )
    setPendingReview((p) => p.filter((x) => x.id !== id))
    setTimeout(() => setReviewMsg(null), 3000)
  }

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

      {/* live photo review queue (cross-user, from the DB) */}
      <div className="panel hud-corner mb-5 p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-pixel text-xs text-cosmos-gold">PHOTO REVIEW QUEUE</span>
          <div className="flex items-center gap-2">
            <Pill tone="gold">{pendingReview.length} pending</Pill>
            <button onClick={loadPending} className="btn btn-ghost text-[11px]">⟳ Refresh</button>
          </div>
        </div>
        {!isCloud ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">Cloud only.</p>
        ) : pendingReview.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--muted)]">
            No photos awaiting review. 🎉
          </p>
        ) : (
          <div className="space-y-2">
            {pendingReview.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3"
              >
                {r.thumb ? (
                  <img src={r.thumb} alt="proof" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-white/10 text-2xl">
                    📷
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-display font-bold text-white">
                    {revProfiles[r.user_id]?.handle ?? 'Ascender'}
                  </div>
                  <div className="truncate text-xs text-[var(--muted)]">
                    {r.label || r.quest_id} · {new Date(r.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  disabled={busyId === r.id}
                  onClick={() => decideReview(r.id, 'reject')}
                  className="btn btn-ghost border-cosmos-magenta/40 text-[11px] text-cosmos-magenta"
                >
                  Reject
                </button>
                <button
                  disabled={busyId === r.id}
                  onClick={() => decideReview(r.id, 'approve')}
                  className="btn btn-primary text-[11px]"
                >
                  {busyId === r.id ? '…' : 'Approve'}
                </button>
              </div>
            ))}
          </div>
        )}
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

      <div className="mt-5 grid gap-5 md:grid-cols-3">
        {/* analytics (illustrative until backend aggregates are wired) */}
        <div className="contents">
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

      <Toast message={reviewMsg} />
    </div>
  )
}
