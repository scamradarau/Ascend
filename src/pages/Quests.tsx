import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, isTaskDoneToday, traitLevel } from '../store/useGame'
import { useSocial } from '../store/social'
import { useAuth } from '../store/auth'
import { isCloud, isOwnerEmail } from '../lib/supabase'
import Icon, { ATTR_ICON } from '../components/Icon'
import { serverSubmitQuest } from '../store/serverVerify'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { VerificationModal } from '../components/VerificationModal'
import MainQuestCard from '../components/MainQuestCard'
import { methodForTask, type VerificationResult, type VerificationMethodId } from '../data/verification'
import { CHALLENGES, periodKeyFor, type Challenge } from '../data/challenges'
import { todayKey } from '../lib/time'
import { levelFromTotalExp } from '../data/leveling'
import { playQuestResult } from '../lib/sfx'
import { ExpBar, PixelTitle, Pill, Toast } from '../components/ui'
import ResetCountdown from '../components/ResetCountdown'
import type { DailyTask } from '../data/types'

export default function Quests() {
  const navigate = useNavigate()
  // Move 2: every cloud account routes completions through the
  // server-authoritative Edge Functions (local mode keeps the offline path).
  const serverVerify = isCloud
  const subs = useSocial((s) => s.submissions)
  // latest review status for a quest (dailies scoped to today)
  const reviewStatusOf = (questId: string, daily: boolean): 'verified' | 'pending' | 'flagged' | null => {
    const today = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()
    const m = subs
      .filter((x) => x.quest_id === questId && (!daily || today(x.created_at)))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return m?.status ?? null
  }
  const activeTraits = useGame((s) => s.activeTraits)
  const dailyLog = useGame((s) => s.dailyLog)
  const totalExp = useGame((s) => s.totalExp)
  const completedQuests = useGame((s) => s.completedQuests)
  const questsThisMonth = useGame((s) => s.questsThisMonth)
  const completeDailyTask = useGame((s) => s.completeDailyTask)
  const challenges = useGame((s) => s.challenges)
  const logChallenge = useGame((s) => s.logChallenge)
  const [challengePending, setChallengePending] = useState<Challenge | null>(null)

  // main quests now live in <MainQuestCard/>; this page only handles dailies
  const [pending, setPending] = useState<{ traitId: string; task: DailyTask } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
  }

  // owner-only: force-complete any quest for testing (reflects on the server
  // too, via cloudSync's owner push). Bypasses the camera/verification.
  const authUser = useAuth((s) => s.user)
  const isOwner = useGame((s) => s.ownerMode) && isOwnerEmail(authUser?.email)
  const ownerResult: VerificationResult = {
    method: 'check-in',
    status: 'verified',
    note: 'Owner force-complete',
    trustDelta: 0,
    meta: { capturedAt: new Date().toISOString() },
  }
  const ownerCompleteDaily = (traitId: string, task: DailyTask) => {
    completeDailyTask(traitId, task.id, { exp: task.exp, label: task.label }, ownerResult)
    flash(`⚡ Owner: completed “${task.label}”`)
  }
  const ownerCompleteChallenge = (c: Challenge) => {
    for (let i = 0; i < c.target; i++) logChallenge(c.id, ownerResult)
    flash(`⚡ Owner: completed “${c.title}”`)
  }

  const dailyTotal = useMemo(
    () => activeTraits.reduce((n, at) => n + (traitById(at.id)?.dailyTasks.length ?? 0), 0),
    [activeTraits],
  )
  const dailyDone = useMemo(
    () =>
      activeTraits.reduce(
        (n, at) =>
          n +
          (traitById(at.id)?.dailyTasks.filter((t) => isTaskDoneToday(dailyLog, at.id, t.id))
            .length ?? 0),
        0,
      ),
    [activeTraits, dailyLog],
  )

  // daily goal - sized by your onboarding time answer, capped at what's available
  const dailyQuestTarget = useGame((s) => s.dailyQuestTarget)
  const dailyGoal = Math.max(1, Math.min(dailyQuestTarget || 2, dailyTotal || 1))

  const submit = (result: VerificationResult) => {
    if (!pending) return
    const task = pending.task
    const lvlBefore = levelFromTotalExp(useGame.getState().totalExp).level

    if (serverVerify) {
      flash('⏳ Verifying…')
      serverSubmitQuest({
        questId: `${pending.traitId}:${task.id}`,
        method: result.method,
        label: task.label,
        kind: 'daily',
        traitId: pending.traitId,
        taskId: task.id,
        result,
      }).then((r) => {
        const status = r.error ? 'flagged' : r.status
        const leveled = levelFromTotalExp(useGame.getState().totalExp).level > lvlBefore
        playQuestResult(status, leveled)
        flash(
          r.error
            ? `⚠ ${r.error}`
            : r.status === 'flagged'
              ? '⚠ Flagged - no EXP'
              : r.status === 'pending'
                ? '📸 Sent for review - pass it and you’ll earn the EXP; if it doesn’t pass, no EXP and you can retry.'
                : `+${r.exp} EXP`,
        )
      })
      return
    }

    completeDailyTask(pending.traitId, task.id, { exp: task.exp, label: task.label }, result)
    const leveled = levelFromTotalExp(useGame.getState().totalExp).level > lvlBefore
    playQuestResult(result.status, leveled)
    flash(
      result.status === 'flagged'
        ? '⚠ Flagged - no EXP'
        : result.status === 'pending'
          ? '⏳ Sent for review'
          : `+${task.exp} EXP`,
    )
  }

  // resolve the verification method for the current pending daily task
  const pendingMethod: VerificationMethodId | null = pending ? methodForTask(pending.task) : null

  const submitChallenge = (result: VerificationResult) => {
    if (!challengePending) return
    if (serverVerify) {
      flash('⏳ Verifying…')
      serverSubmitQuest({
        questId: challengePending.id,
        method: result.method,
        label: challengePending.title,
        kind: 'challenge',
        result,
      }).then((r) => {
        const status = r.error ? 'flagged' : r.status
        playQuestResult(status, Boolean(r.mainDone))
        flash(
          r.error
            ? `⚠ ${r.error}`
            : r.status === 'flagged'
              ? '⚠ Flagged - no progress'
              : r.status === 'pending'
                ? '📸 Sent for review - approved logs move the bar; the EXP lands when you hit the target.'
                : r.mainDone
                  ? `🏆 Challenge complete! +${r.exp} EXP`
                  : '✓ Log verified - progress +1. Full EXP lands when you hit the target.',
        )
      })
      return
    }
    const res = logChallenge(challengePending.id, result)
    playQuestResult(result.status, res.completed)
    flash(
      result.status === 'flagged'
        ? '⚠ Flagged - no progress'
        : res.completed
          ? `🏆 Challenge complete! +${res.exp} EXP`
          : `Progress logged · ${challengePending.title}`,
    )
  }

  // Low-friction on-ramp: for brand-new (0-EXP) players, find the easiest
  // not-yet-done daily so their FIRST win doesn't have to be a live photo.
  // (Lower number = less friction; photos are last.)
  const firstWin = useMemo(() => {
    if (totalExp > 0) return null
    const FRICTION: Record<string, number> = {
      'check-in': 1,
      journal: 2,
      'focus-timer': 3,
      'meditation-timer': 3,
      'sleep-window': 3,
      'reading-check': 4,
      'geo-photo': 5,
      'live-photo': 5,
    }
    let best: { traitId: string; task: DailyTask; friction: number } | null = null
    for (const at of activeTraits) {
      const t = traitById(at.id)
      if (!t) continue
      for (const task of t.dailyTasks) {
        if (isTaskDoneToday(dailyLog, at.id, task.id)) continue
        const friction = FRICTION[methodForTask(task)] ?? 3
        if (!best || friction < best.friction) best = { traitId: at.id, task, friction }
      }
    }
    return best
  }, [totalExp, activeTraits, dailyLog])

  const challengeState = (c: Challenge) => {
    const st = challenges[c.id]
    const period = periodKeyFor(c.scope)
    if (!st || st.period !== period) return { count: 0, done: false }
    return { count: st.count, done: st.done }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">QUESTS</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">In-progress quests</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Your committed traits, their main quests and today’s dailies.
          </p>
        </div>
        <div className="flex gap-2">
          <Pill tone={dailyDone >= dailyGoal ? 'gold' : 'exp'}>
            🎯 {dailyDone}/{dailyGoal} daily target{dailyDone >= dailyGoal ? ' ✓' : ''}
          </Pill>
          <Pill tone="exp">
            {dailyDone}/{dailyTotal} done today
          </Pill>
          <Pill tone="violet">
            <ResetCountdown scope="daily" prefix="Dailies reset in" />
          </Pill>
          <Pill tone="gold">{questsThisMonth} this month</Pill>
        </div>
      </div>

      {/* first-win on-ramp - gentle, no-camera start for brand-new players */}
      {firstWin && (
        <div className="panel hud-corner mb-5 border-cosmos-cyan/40 p-5">
          <span className="font-pixel text-xs text-cosmos-cyan glow-text">⚡ START HERE</span>
          <h3 className="mt-2 font-display text-lg font-bold text-white">
            Your first win{firstWin.friction < 5 ? ' - no camera needed' : ''}
          </h3>
          <p className="mt-1 max-w-xl text-sm text-[var(--muted)]">
            {firstWin.friction < 5
              ? 'Get your first EXP with one simple check-in. Photo-verified quests come later - start here and feel how the loop works.'
              : 'Get your first EXP with one quick verified check-in to start the loop.'}
          </p>
          <button
            onClick={() => setPending({ traitId: firstWin.traitId, task: firstWin.task })}
            className="btn btn-primary mt-3 text-sm"
          >
            ⚡ {firstWin.task.label} →
          </button>
        </div>
      )}

      {activeTraits.length === 0 && (
        <div className="panel p-10 text-center">
          <p className="text-[var(--muted)]">No active quests yet.</p>
          <button onClick={() => navigate('/app/traits')} className="btn btn-primary mt-4">
            Choose traits →
          </button>
        </div>
      )}

      <div className="space-y-5">
        {activeTraits.map((at) => {
          const t = traitById(at.id)!
          const attr = attributeById(t.attribute)
          const tl = traitLevel(at.exp)
          return (
            <div key={at.id} className="panel hud-corner p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => navigate(`/app/traits/${at.id}`)}
                  className="flex items-center gap-3 text-left"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-xl border text-xl"
                    style={{ borderColor: attr.color, boxShadow: `0 0 14px ${attr.color}55` }}
                  >
                    <Icon name={ATTR_ICON[attr.id]} size={22} />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold text-white">{t.name}</span>
                    <span className="text-xs text-[var(--muted)]">Trait Lv {tl.level} · {attr.name}</span>
                  </span>
                </button>
                <div className="w-40">
                  <ExpBar pct={tl.pct} height="h-2" label="Trait EXP" showText={false} />
                </div>
              </div>

              {/* main quest - book path or 2-week practical challenge */}
              <div className="mt-4">
                <MainQuestCard traitId={at.id} onFlash={flash} />
              </div>

              {/* dailies */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {t.dailyTasks.map((task) => {
                  const sub = reviewStatusOf(`${at.id}:${task.id}`, true)
                  const done = isTaskDoneToday(dailyLog, at.id, task.id) || sub === 'verified'
                  const underReview = !done && sub === 'pending'
                  return (
                    <div key={task.id} className="relative">
                      <button
                        disabled={done || underReview}
                        onClick={() => setPending({ traitId: at.id, task })}
                        className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition ${
                          done
                            ? 'border-exp/30 bg-exp/5 text-exp'
                            : underReview
                              ? 'border-amber-400/40 bg-amber-400/5 text-amber-300'
                              : 'border-white/8 bg-white/[0.02] text-white hover:border-[var(--edge-strong)]'
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                            done
                              ? 'border-exp bg-exp text-black'
                              : underReview
                                ? 'border-amber-400 text-amber-300'
                                : 'border-white/30'
                          }`}
                        >
                          {done ? '✓' : underReview ? '⏳' : ''}
                        </span>
                        <span className="flex-1">{task.label}</span>
                        <span className="text-[10px] text-[var(--muted)]">
                          {underReview ? 'Under review' : `+${task.exp}`}
                        </span>
                      </button>
                      {isOwner && !done && (
                        <button
                          onClick={() => ownerCompleteDaily(at.id, task)}
                          title="Owner: force-complete"
                          className="absolute right-1 top-1 rounded border border-cosmos-gold/50 bg-black/60 px-1 text-[10px] text-cosmos-gold"
                        >
                          ⚡
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------------- WEEKLY & MONTHLY CHALLENGES ---------------- */}
      {(['weekly', 'monthly'] as const).map((scope) => (
        <div key={scope} className="mt-8">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-pixel text-xs text-cosmos-gold glow-text">
              {scope === 'weekly' ? '📅 WEEKLY CHALLENGES' : '🗓️ MONTHLY CHALLENGES'}
            </span>
            <Pill tone="gold">
              <ResetCountdown scope={scope} /> · big rewards
            </Pill>
          </div>
          <p className="mb-3 text-[11px] text-[var(--muted)]">
            One verified log per day. Each approved log moves the bar - the full EXP + Aether pays
            out in one hit when you complete every session before the {scope} reset.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.filter((c) => c.scope === scope).map((c) => {
              const st = challengeState(c)
              const pct = Math.round((st.count / c.target) * 100)
              // one verified log per Sydney day; pending review also blocks
              const loggedToday = subs.some(
                (x) =>
                  x.quest_id === c.id &&
                  x.status === 'verified' &&
                  todayKey(new Date(x.created_at)) === todayKey(),
              )
              const reviewPending = subs.some(
                (x) =>
                  x.quest_id === c.id &&
                  x.status === 'pending' &&
                  todayKey(new Date(x.created_at)) === todayKey(),
              )
              return (
                <div
                  key={c.id}
                  className={`panel p-4 ${st.done ? 'border-cosmos-gold/50 shadow-glow-gold' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 text-2xl">
                      {c.icon}
                    </div>
                    <div className="flex-1">
                      <div className="font-display font-bold text-white">{c.title}</div>
                      <div className="text-[11px] text-[var(--muted)]">{c.desc}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ExpBar pct={pct} label={`${st.count}/${c.target} ${c.unit}`} showText={false} />
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[11px] text-cosmos-gold">
                      +{c.exp} EXP · ◈ {c.aether}
                    </span>
                    <button
                      disabled={st.done || loggedToday || reviewPending}
                      onClick={() => setChallengePending(c)}
                      className="btn btn-ghost text-[11px]"
                      title={loggedToday ? 'One log per day - next at midnight (Sydney)' : undefined}
                    >
                      {st.done
                        ? '✓ Complete'
                        : loggedToday
                          ? '✓ Logged today'
                          : reviewPending
                            ? '⏳ Under review'
                            : 'Log progress'}
                    </button>
                    {isOwner && !st.done && (
                      <button
                        onClick={() => ownerCompleteChallenge(c)}
                        title="Owner: force-complete"
                        className="ml-2 rounded border border-cosmos-gold/50 bg-black/40 px-1.5 text-[11px] text-cosmos-gold"
                      >
                        ⚡
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* completed */}
      {completedQuests.length > 0 && (
        <div className="panel mt-6 p-5">
          <span className="font-pixel text-xs text-cosmos-gold">QUESTS COMPLETED</span>
          <ul className="mt-3 space-y-2">
            {completedQuests.map((q, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-exp">✓</span>
                {q.title}
                <span className="ml-auto text-[11px] text-[var(--muted)]">
                  {new Date(q.at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {pending && pendingMethod && (
        <VerificationModal
          open={!!pending}
          onClose={() => setPending(null)}
          method={pendingMethod}
          label={pending.task.label}
          minMinutes={pending.task.minMinutes}
          onResult={submit}
        />
      )}

      {challengePending && (
        <VerificationModal
          open={!!challengePending}
          onClose={() => setChallengePending(null)}
          method={challengePending.verify}
          label={`${challengePending.title} - log one ${challengePending.unit.replace(/s$/, '')}`}
          book={challengePending.reading ? '' : undefined}
          onResult={submitChallenge}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}
