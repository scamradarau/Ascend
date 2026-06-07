import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGame,
  usePlayerLevel,
  traitLevel,
  isTaskDoneToday,
} from '../store/useGame'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { rankForLevel, nextRank } from '../data/ranks'
import { levelFromTotalExp } from '../data/leveling'
import { methodForTask, VERIFICATION_METHODS, type VerificationResult } from '../data/verification'
import { dailyWisdom } from '../data/wisdom'
import type { DailyTask } from '../data/types'

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100]
import BodyFigure from '../components/BodyFigure'
import { VerificationModal } from '../components/VerificationModal'
import { ExpBar, PixelTitle, Pill, Toast } from '../components/ui'

interface PendingTask {
  traitId: string
  task: DailyTask
}

export default function Character() {
  const navigate = useNavigate()
  const profile = useGame((s) => s.profile)
  const activeTraits = useGame((s) => s.activeTraits)
  const dailyLog = useGame((s) => s.dailyLog)
  const totalExp = useGame((s) => s.totalExp)
  const completeDailyTask = useGame((s) => s.completeDailyTask)
  const streak = useGame((s) => s.streak)
  const { level, pct, intoLevel, needed } = usePlayerLevel()
  const rank = rankForLevel(level)
  const next = nextRank(level)
  const wisdom = dailyWisdom()
  const nextStreakMilestone = STREAK_MILESTONES.find((m) => m > streak) ?? streak

  const [pending, setPending] = useState<PendingTask | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // aggregate today's daily quests from active traits
  const dailyQuests = useMemo(() => {
    const out: PendingTask[] = []
    activeTraits.forEach((at) => {
      const t = traitById(at.id)
      if (!t) return
      t.dailyTasks.forEach((task) => out.push({ traitId: at.id, task }))
    })
    return out
  }, [activeTraits])

  const doneCount = dailyQuests.filter((q) =>
    isTaskDoneToday(dailyLog, q.traitId, q.task.id),
  ).length

  const submitCheckIn = (result: VerificationResult) => {
    if (!pending) return
    const task = pending.task
    const before = levelFromTotalExp(totalExp).level
    completeDailyTask(pending.traitId, task.id, { exp: task.exp, label: task.label }, result)
    if (result.status === 'flagged') {
      setToast('⚠ Submission flagged — no EXP awarded')
    } else if (result.status === 'pending') {
      setToast('⏳ Sent for review · partial EXP')
    } else {
      const after = levelFromTotalExp(totalExp + task.exp).level
      setToast(after > before ? `LEVEL UP! → Lv ${after}` : `+${task.exp} EXP · ${task.label}`)
    }
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <div>
      {/* page header */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">CHARACTER</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">
            {profile?.handle} <span className="text-[var(--muted)]">· {rank.title}</span>
          </h1>
        </div>
        <Pill tone="exp">
          {doneCount}/{dailyQuests.length} daily quests done
        </Pill>
      </div>

      {/* daily wisdom + streak strip */}
      <div className="panel mb-5 flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm italic text-slate-200">“{wisdom.quote}”</p>
            <p className="mt-0.5 text-[11px] uppercase tracking-widest text-[var(--muted)]">
              — {wisdom.by}
            </p>
          </div>
        </div>
        <div className="shrink-0 rounded-lg border border-exp/30 bg-exp/5 px-3 py-2 text-center">
          <div className="font-pixel text-sm text-exp">🔥 {streak}d</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
            {nextStreakMilestone > streak ? `${nextStreakMilestone - streak}d to reward` : 'milestone!'}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[300px_1fr_340px]">
        {/* ----------------- LEFT: STATS ----------------- */}
        <div className="panel hud-corner p-5">
          <div className="border-b border-white/5 pb-4">
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="stat-label text-xs">Name</span>
              <span className="text-right font-bold text-white">{profile?.handle}</span>
              <span className="stat-label text-xs">Age</span>
              <span className="text-right font-bold text-white">{profile?.age || '—'}</span>
              <span className="stat-label text-xs">Region</span>
              <span className="text-right font-bold text-white">{profile?.region}</span>
            </div>
            <button
              onClick={() => navigate('/app/level')}
              className="mt-4 w-full rounded-lg border border-[var(--edge-strong)] bg-black/40 p-3 text-left transition hover:shadow-glow"
            >
              <div className="flex items-center justify-between">
                <span className="stat-label text-xs">Level</span>
                <span className="font-pixel text-lg text-[var(--accent)] glow-text">{level}</span>
              </div>
              <div className="mt-2">
                <ExpBar pct={pct} height="h-2.5" showText={false} />
              </div>
              <div className="mt-1 text-[10px] text-[var(--muted)]">
                {intoLevel}/{needed} EXP · {next ? `${next.title} at Lv ${next.minLevel}` : 'Max rank'}
              </div>
            </button>
          </div>

          <div className="mt-4">
            <div className="mb-3 stat-label text-xs">Stats — traits in progress</div>
            <div className="space-y-3">
              {activeTraits.map((at) => {
                const t = traitById(at.id)!
                const tl = traitLevel(at.exp)
                const attr = attributeById(t.attribute)
                return (
                  <button
                    key={at.id}
                    onClick={() => navigate(`/app/traits/${at.id}`)}
                    className="group w-full rounded-lg border border-white/8 bg-white/[0.02] p-3 text-left transition hover:border-[var(--edge-strong)]"
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-display text-sm font-bold uppercase tracking-wide text-white">
                        <span style={{ color: attr.color }}>{attr.icon}</span>
                        {t.name}
                      </span>
                      <span className="font-pixel text-[11px] text-[var(--accent)]">
                        Lv{tl.level}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ExpBar pct={tl.pct} height="h-2" showText={false} />
                    </div>
                  </button>
                )
              })}
              {activeTraits.length < 3 && (
                <button
                  onClick={() => navigate('/app/traits')}
                  className="w-full rounded-lg border border-dashed border-white/15 p-3 text-xs uppercase tracking-wider text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
                >
                  + Add trait ({3 - activeTraits.length} slot
                  {3 - activeTraits.length > 1 ? 's' : ''} open)
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ----------------- MIDDLE: BODY ----------------- */}
        <div className="panel relative overflow-hidden p-2">
          <div className="grid-overlay pointer-events-none absolute inset-0 opacity-50" />
          <BodyFigure level={level} />
        </div>

        {/* ----------------- RIGHT: DAILY QUESTS ----------------- */}
        <div className="panel hud-corner flex flex-col p-5">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-pixel text-xs text-[var(--accent)] glow-text">DAILY QUESTS</span>
            <Pill tone="gold">resets 00:00</Pill>
          </div>
          <p className="mb-4 text-xs text-[var(--muted)]">
            Check a quest to log it — you’ll be prompted to provide evidence of completion.
          </p>

          <div className="-mr-2 max-h-[460px] space-y-2.5 overflow-y-auto pr-2">
            {dailyQuests.map((q) => {
              const done = isTaskDoneToday(dailyLog, q.traitId, q.task.id)
              const t = traitById(q.traitId)!
              return (
                <button
                  key={`${q.traitId}:${q.task.id}`}
                  disabled={done}
                  onClick={() => setPending(q)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                    done
                      ? 'border-exp/30 bg-exp/5'
                      : 'border-white/8 bg-white/[0.02] hover:border-[var(--edge-strong)]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                      done ? 'border-exp bg-exp text-black' : 'border-white/30'
                    }`}
                  >
                    {done && '✓'}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        done ? 'text-exp line-through' : 'text-white'
                      }`}
                    >
                      {q.task.label}
                    </span>
                    <span className="mt-0.5 flex items-center gap-2 text-[11px] text-[var(--muted)]">
                      <span className="uppercase tracking-wide">{t.name}</span>
                      <span>· +{q.task.exp} EXP</span>
                      <span className="opacity-70">· {VERIFICATION_METHODS[methodForTask(q.task)].icon} {VERIFICATION_METHODS[methodForTask(q.task)].label}</span>
                    </span>
                    {q.task.hint && !done && (
                      <span className="mt-0.5 block text-[11px] italic text-[var(--muted)]/80">
                        {q.task.hint}
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
          </div>

          <button
            onClick={() => navigate('/app/quests')}
            className="btn btn-ghost mt-4 w-full text-xs"
          >
            View all quests →
          </button>
        </div>
      </div>

      {pending && (
        <VerificationModal
          open={!!pending}
          onClose={() => setPending(null)}
          method={methodForTask(pending.task)}
          label={pending.task.label}
          minMinutes={pending.task.minMinutes}
          onResult={submitCheckIn}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}
