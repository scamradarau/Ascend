import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, isTaskDoneToday, traitLevel } from '../store/useGame'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { VerificationModal } from '../components/VerificationModal'
import { methodForTask, type VerificationResult, type VerificationMethodId } from '../data/verification'
import { CHALLENGES, periodKeyFor, type Challenge } from '../data/challenges'
import { ExpBar, PixelTitle, Pill, Toast } from '../components/ui'
import ResetCountdown from '../components/ResetCountdown'
import type { DailyTask } from '../data/types'

export default function Quests() {
  const navigate = useNavigate()
  const activeTraits = useGame((s) => s.activeTraits)
  const dailyLog = useGame((s) => s.dailyLog)
  const completedQuests = useGame((s) => s.completedQuests)
  const questsThisMonth = useGame((s) => s.questsThisMonth)
  const completeDailyTask = useGame((s) => s.completeDailyTask)
  const advanceMainQuest = useGame((s) => s.advanceMainQuest)
  const challenges = useGame((s) => s.challenges)
  const logChallenge = useGame((s) => s.logChallenge)
  const [challengePending, setChallengePending] = useState<Challenge | null>(null)

  const [pending, setPending] = useState<{
    traitId: string
    kind: 'daily' | 'main'
    task?: DailyTask
  } | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 2200)
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

  const submit = (result: VerificationResult) => {
    if (!pending) return
    const t = traitById(pending.traitId)!
    if (pending.kind === 'daily' && pending.task) {
      completeDailyTask(pending.traitId, pending.task.id, { exp: pending.task.exp, label: pending.task.label }, result)
      flash(
        result.status === 'flagged'
          ? '⚠ Flagged — no EXP'
          : result.status === 'pending'
            ? '⏳ Sent for review'
            : `+${pending.task.exp} EXP`,
      )
    } else {
      advanceMainQuest(pending.traitId, { label: `Main quest · ${t.mainQuest.title}`, steps: 4 }, result)
      flash(result.status === 'flagged' ? '⚠ Flagged' : 'Main quest progress logged!')
    }
  }

  // resolve the verification method for the current pending item
  const pendingMethod: VerificationMethodId | null = pending
    ? pending.kind === 'main'
      ? mainQuestMethod(pending.traitId)
      : methodForTask(pending.task!)
    : null

  const submitChallenge = (result: VerificationResult) => {
    if (!challengePending) return
    const res = logChallenge(challengePending.id, result)
    flash(
      result.status === 'flagged'
        ? '⚠ Flagged — no progress'
        : res.completed
          ? `🏆 Challenge complete! +${res.exp} EXP`
          : `Progress logged · ${challengePending.title}`,
    )
  }

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
          <Pill tone="exp">
            {dailyDone}/{dailyTotal} dailies today
          </Pill>
          <Pill tone="violet">
            <ResetCountdown scope="daily" prefix="Dailies reset in" />
          </Pill>
          <Pill tone="gold">{questsThisMonth} this month</Pill>
        </div>
      </div>

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
          const mqPct = Math.round(at.mainQuestProgress * 100)
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
                    {attr.icon}
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

              {/* main quest */}
              <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white">
                    🗡️ {t.mainQuest.title}
                  </span>
                  <button
                    disabled={at.mainQuestDone}
                    onClick={() => setPending({ traitId: at.id, kind: 'main' })}
                    className="btn btn-ghost text-[11px]"
                  >
                    {at.mainQuestDone ? '✓ Complete' : 'Check in'}
                  </button>
                </div>
                <div className="mt-2">
                  <ExpBar pct={mqPct} height="h-2" />
                </div>
              </div>

              {/* dailies */}
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {t.dailyTasks.map((task) => {
                  const done = isTaskDoneToday(dailyLog, at.id, task.id)
                  return (
                    <button
                      key={task.id}
                      disabled={done}
                      onClick={() => setPending({ traitId: at.id, kind: 'daily', task })}
                      className={`flex items-center gap-2.5 rounded-lg border p-2.5 text-left text-sm transition ${
                        done
                          ? 'border-exp/30 bg-exp/5 text-exp'
                          : 'border-white/8 bg-white/[0.02] text-white hover:border-[var(--edge-strong)]'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                          done ? 'border-exp bg-exp text-black' : 'border-white/30'
                        }`}
                      >
                        {done && '✓'}
                      </span>
                      <span className="flex-1">{task.label}</span>
                      <span className="text-[10px] text-[var(--muted)]">+{task.exp}</span>
                    </button>
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
          <div className="mb-3 flex items-center justify-between">
            <span className="font-pixel text-xs text-cosmos-gold glow-text">
              {scope === 'weekly' ? '📅 WEEKLY CHALLENGES' : '🗓️ MONTHLY CHALLENGES'}
            </span>
            <Pill tone="gold">
              <ResetCountdown scope={scope} /> · big rewards
            </Pill>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.filter((c) => c.scope === scope).map((c) => {
              const st = challengeState(c)
              const pct = Math.round((st.count / c.target) * 100)
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
                      disabled={st.done}
                      onClick={() => setChallengePending(c)}
                      className="btn btn-ghost text-[11px]"
                    >
                      {st.done ? '✓ Complete' : 'Log progress'}
                    </button>
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
          label={
            pending.kind === 'main'
              ? traitById(pending.traitId)?.mainQuest.title ?? ''
              : pending.task?.label ?? ''
          }
          minMinutes={pending.kind === 'daily' ? pending.task?.minMinutes : undefined}
          book={pending.kind === 'main' ? traitById(pending.traitId)?.mainQuest.book : undefined}
          onResult={submit}
        />
      )}

      {challengePending && (
        <VerificationModal
          open={!!challengePending}
          onClose={() => setChallengePending(null)}
          method={challengePending.verify}
          label={`${challengePending.title} — log one ${challengePending.unit.replace(/s$/, '')}`}
          book={challengePending.reading ? '' : undefined}
          onResult={submitChallenge}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}

// Map a trait's main-quest check-in type to a verification method.
function mainQuestMethod(traitId: string): VerificationMethodId {
  const ci = traitById(traitId)?.mainQuest.checkIn
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
