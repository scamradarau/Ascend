import { useState } from 'react'
import { useGame } from '../store/useGame'
import { useSocial } from '../store/social'
import { isCloud, isOwnerEmail } from '../lib/supabase'
import { useAuth } from '../store/auth'
import { serverSubmitQuest, resetQuestProgress } from '../store/serverVerify'
import { traitById } from '../data/traits'
import { practicalQuestFor, practicalQuestId } from '../data/practicalQuests'
import type { CheckInType } from '../data/types'
import type { VerificationResult, VerificationMethodId } from '../data/verification'
import { VerificationModal } from './VerificationModal'
import BookLinks from './BookLinks'
import { ExpBar } from './ui'
import { playQuestResult, playSfx } from '../lib/sfx'

function methodFor(ci: CheckInType): VerificationMethodId {
  switch (ci) {
    case 'photo':
      return 'live-photo'
    case 'summary':
      return 'reading-check'
    case 'schedule':
      return 'geo-photo'
    case 'reflection':
    default:
      return 'journal'
  }
}

// The trait's main quest: a path chooser (read a book OR a 2-week practical
// challenge), commitment lock-in for practical paths, progress + check-in.
// Shared by the Quests page and the Trait Matrix detail page.
export default function MainQuestCard({
  traitId,
  onFlash,
}: {
  traitId: string
  onFlash?: (msg: string) => void
}) {
  const t = traitById(traitId)
  const active = useGame((s) => s.activeTraits.find((x) => x.id === traitId))
  const mainVariant = useGame((s) => s.mainVariant)
  const setMainVariant = useGame((s) => s.setMainVariant)
  const mainCommitment = useGame((s) => s.mainCommitment)
  const setCommitment = useGame((s) => s.setCommitment)
  const resetMainQuestLocal = useGame((s) => s.resetMainQuestLocal)
  const advanceMainQuest = useGame((s) => s.advanceMainQuest)
  const subs = useSocial((s) => s.submissions)

  const [pending, setPending] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)

  if (!t) return null

  const serverVerify = isCloud
  const authUser = useAuth((s) => s.user)
  const isOwner = useGame((s) => s.ownerMode) && isOwnerEmail(authUser?.email)
  const variant = mainVariant[traitId] ?? 'book'
  const mq = variant === 'practical' ? practicalQuestFor(t) : t.mainQuest
  const questId = variant === 'practical' ? practicalQuestId(traitId) : `main:${traitId}`

  // The "Read a book" path is ALWAYS a reading check-in (or a written
  // reflection) - never a photo, whatever the quest's authored checkIn says.
  // Only the practical 2-week challenge uses photo/geo proof.
  const checkInMethod: VerificationMethodId =
    variant === 'practical'
      ? methodFor(mq.checkIn)
      : mq.checkIn === 'reflection'
        ? 'journal'
        : 'reading-check'

  const isActive = !!active
  const steps = variant === 'practical' ? 14 : 4
  const mqPct = active ? Math.round(active.mainQuestProgress * 100) : 0
  const stepCount = active ? Math.round(active.mainQuestProgress * steps) : 0
  const mqDone = !!active?.mainQuestDone
  const inProgress = (active?.mainQuestProgress ?? 0) > 0 || mqDone

  const committed = Boolean(mainCommitment[traitId])
  const needsCommitment = variant === 'practical' && !!mq.commitmentPrompt
  const readyToCheckIn = isActive && (!needsCommitment || committed)

  const latest = subs
    .filter((x) => x.quest_id === questId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
  const underReview = !mqDone && latest?.status === 'pending'

  const lockIn = () => {
    const text = draft.trim()
    if (text.length < 3) return
    setCommitment(traitId, text)
    setDraft('')
    playSfx('boss')
    onFlash?.('Commitment locked in. Now prove it across the next two weeks.')
  }

  const reset = async () => {
    if (busy) return
    setBusy(true)
    if (serverVerify) {
      const r = await resetQuestProgress(questId)
      if (!r.ok) {
        setBusy(false)
        onFlash?.(r.error ?? 'Could not reset.')
        return
      }
    }
    resetMainQuestLocal(traitId)
    setBusy(false)
    onFlash?.('Commitment reset - challenge progress cleared.')
  }

  const submit = async (result: VerificationResult) => {
    setPending(false)
    const commit = mainCommitment[traitId]
    const label =
      variant === 'practical' && commit
        ? `Main quest · ${mq.title} - “${commit}”`
        : `Main quest · ${mq.title}`
    if (serverVerify) {
      onFlash?.('⏳ Verifying…')
      const r = await serverSubmitQuest({ questId, method: result.method, label, kind: 'main', traitId, result })
      playQuestResult(r.error ? 'flagged' : r.status, Boolean(r.mainDone))
      onFlash?.(
        r.error
          ? `⚠ ${r.error}`
          : r.status === 'flagged'
            ? '⚠ Flagged - no EXP'
            : r.status === 'pending'
              ? '📸 Sent for review - pass it to keep your streak; the EXP lands when the challenge is complete.'
              : r.mainDone
                ? `🏆 Quest complete! +${r.exp} EXP`
                : 'Check-in verified - progress logged.',
      )
      return
    }
    advanceMainQuest(traitId, { label, steps }, result)
    playQuestResult(result.status, Boolean(active?.mainQuestDone))
    onFlash?.(result.status === 'flagged' ? '⚠ Flagged' : 'Main quest progress logged!')
  }

  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      {/* path chooser */}
      <div className="mb-3 flex flex-wrap items-center gap-1.5">
        {(['book', 'practical'] as const).map((v) => (
          <button
            key={v}
            disabled={inProgress && variant !== v}
            onClick={() => setMainVariant(traitId, v)}
            className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
              variant === v
                ? 'border-cosmos-cyan bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-cosmos-cyan'
                : 'border-white/10 text-[var(--muted)] hover:border-white/25 disabled:opacity-40'
            }`}
          >
            {v === 'book' ? '📖 Read a book' : '💪 2-week challenge'}
          </button>
        ))}
        {inProgress && (
          <span className="ml-1 text-[10px] text-[var(--muted)]">path locked while in progress</span>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-white">🗡️ {mq.title}</span>
        {isActive && (
          <button
            disabled={mqDone || underReview || !readyToCheckIn}
            onClick={() => setPending(true)}
            className="btn btn-ghost text-[11px]"
            title={!readyToCheckIn ? 'Lock in your commitment first' : undefined}
          >
            {mqDone ? '✓ Complete' : underReview ? '⏳ Under review' : 'Check in'}
          </button>
        )}
        {isOwner && isActive && !mqDone && (
          <button
            onClick={() => {
              const r: VerificationResult = {
                method: 'check-in',
                status: 'verified',
                note: 'Owner force-complete',
                trustDelta: 0,
                meta: { capturedAt: new Date().toISOString() },
              }
              for (let i = 0; i < steps; i++) advanceMainQuest(traitId, { label: mq.title, steps }, r)
              onFlash?.(`⚡ Owner: completed “${mq.title}”`)
            }}
            title="Owner: force-complete"
            className="ml-2 rounded border border-cosmos-gold/50 bg-black/40 px-1.5 text-[11px] text-cosmos-gold"
          >
            ⚡
          </button>
        )}
      </div>

      <p className="mt-1 text-xs text-[var(--muted)]">{mq.why}</p>

      {/* book path: reading links */}
      {variant === 'book' && mq.book && (
        <div className="mt-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-3 py-1.5 text-xs text-cosmos-gold">
            📚 {mq.book}
          </div>
          <div className="mt-2">
            <BookLinks book={mq.book} compact />
          </div>
        </div>
      )}

      {/* practical path: commitment lock-in */}
      {needsCommitment && isActive && (
        <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3">
          {committed ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  Your commitment 🔒
                </div>
                <div className="truncate font-display font-bold text-white">
                  {mainCommitment[traitId]}
                </div>
              </div>
              {!mqDone && (
                <button
                  onClick={reset}
                  disabled={busy}
                  className="btn btn-ghost text-[11px] text-cosmos-magenta"
                  title="Resetting clears this challenge's progress"
                >
                  Reset
                </button>
              )}
            </div>
          ) : (
            <>
              <label className="stat-label mb-1.5 block text-xs">{mq.commitmentPrompt}</label>
              <div className="flex gap-2">
                <input
                  className="input text-sm"
                  placeholder="Type your commitment…"
                  value={draft}
                  maxLength={80}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && lockIn()}
                />
                <button
                  onClick={lockIn}
                  disabled={draft.trim().length < 3}
                  className="btn btn-primary shrink-0 text-[11px]"
                >
                  🔒 Lock in
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                Once locked, photograph it each check-in. You can reset it, but that clears your progress.
              </p>
            </>
          )}
        </div>
      )}

      {isActive && (
        <div className="mt-3">
          <ExpBar
            pct={mqPct}
            height="h-2"
            label={`${stepCount}/${steps} check-ins${variant === 'practical' ? ' (1 per day)' : ''} · +${mq.exp} EXP on completion`}
            showText={false}
          />
        </div>
      )}

      {!isActive && (
        <p className="mt-3 text-[11px] text-[var(--muted)]">Accept this trait to start the main quest.</p>
      )}

      {pending && (
        <VerificationModal
          open={pending}
          onClose={() => setPending(false)}
          method={checkInMethod}
          label={
            variant === 'practical' && mainCommitment[traitId]
              ? `${mq.title} - ${mainCommitment[traitId]}`
              : mq.title
          }
          book={variant === 'book' ? mq.book : undefined}
          onResult={submit}
        />
      )}
    </div>
  )
}
