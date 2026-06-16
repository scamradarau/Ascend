import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useGame,
  usePlayerLevel,
  traitLevel,
  isTaskDoneToday,
} from '../store/useGame'
import { useSocial } from '../store/social'
import { isCloud } from '../lib/supabase'
import { serverSubmitQuest } from '../store/serverVerify'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { BADGES } from '../data/badges'
import { rankForLevel, nextRank } from '../data/ranks'
import { levelFromTotalExp } from '../data/leveling'
import { playQuestResult, playSfx } from '../lib/sfx'
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
  const earnedBadges = useGame((s) => s.earnedBadges)
  const streakFreezes = useGame((s) => s.streakFreezes)
  const buyStreakFreeze = useGame((s) => s.buyStreakFreeze)
  const serverVerify = isCloud
  const subs = useSocial((s) => s.submissions)
  const reviewStatusOf = (questId: string): 'verified' | 'pending' | 'flagged' | null => {
    const today = (iso: string) => new Date(iso).toDateString() === new Date().toDateString()
    const m = subs
      .filter((x) => x.quest_id === questId && today(x.created_at))
      .sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
    return m?.status ?? null
  }
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

  const doneCount = dailyQuests.filter(
    (q) =>
      isTaskDoneToday(dailyLog, q.traitId, q.task.id) ||
      (serverVerify && reviewStatusOf(`${q.traitId}:${q.task.id}`) === 'verified'),
  ).length

  const onBuyFreeze = () => {
    if (streakFreezes >= 2) {
      setToast('🧊 You’re already stocked up — max 2 freezes.')
    } else if (buyStreakFreeze()) {
      playSfx('aether')
      setToast('🧊 Streak Freeze purchased — your chain is protected.')
    } else {
      setToast('Not enough Aether — a freeze costs ◈250.')
    }
    setTimeout(() => setToast(null), 2600)
  }

  const submitCheckIn = (result: VerificationResult) => {
    if (!pending) return
    const task = pending.task

    if (serverVerify) {
      setToast('⏳ Verifying…')
      const lvlBefore = levelFromTotalExp(totalExp).level
      serverSubmitQuest({
        questId: `${pending.traitId}:${task.id}`,
        method: result.method,
        label: task.label,
        kind: 'daily',
        traitId: pending.traitId,
        taskId: task.id,
        result,
      }).then((r) => {
        playQuestResult(r.status, levelFromTotalExp(useGame.getState().totalExp).level > lvlBefore)
        setToast(
          r.status === 'flagged'
            ? '⚠ Flagged — no EXP'
            : r.status === 'pending'
              ? '📸 Sent for review — pass it and you’ll earn the EXP; if not, no EXP and you can retry.'
              : `+${r.exp} EXP · ${task.label}`,
        )
        setTimeout(() => setToast(null), 3400)
      })
      return
    }

    // local (offline) fallback
    const before = levelFromTotalExp(totalExp).level
    completeDailyTask(pending.traitId, task.id, { exp: task.exp, label: task.label }, result)
    playQuestResult(result.status, levelFromTotalExp(totalExp + task.exp).level > before)
    setToast(
      result.status === 'flagged'
        ? '⚠ Submission flagged — no EXP'
        : result.status === 'pending'
          ? '⏳ Sent for review — no EXP unless it passes.'
          : levelFromTotalExp(totalExp + task.exp).level > before
            ? `LEVEL UP! → Lv ${levelFromTotalExp(totalExp + task.exp).level}`
            : `+${task.exp} EXP · ${task.label}`,
    )
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
        <div className="flex shrink-0 items-stretch gap-2">
          <div className="rounded-lg border border-exp/30 bg-exp/5 px-3 py-2 text-center">
            <div className="font-pixel text-sm text-exp">🔥 {streak}d</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {nextStreakMilestone > streak ? `${nextStreakMilestone - streak}d to reward` : 'milestone!'}
            </div>
          </div>
          {/* streak freeze — protects the chain across a missed day */}
          <button
            onClick={onBuyFreeze}
            title="Streak Freeze protects your streak across one missed day. You get one free each week; buy more with Aether."
            className="rounded-lg border border-cosmos-cyan/30 bg-cosmos-cyan/5 px-3 py-2 text-center transition hover:border-cosmos-cyan/60"
          >
            <div className="font-pixel text-sm text-cosmos-cyan">🧊 {streakFreezes}</div>
            <div className="text-[10px] uppercase tracking-wider text-[var(--muted)]">
              {streakFreezes >= 2 ? 'freezes' : `buy · ◈250`}
            </div>
          </button>
        </div>
      </div>

      {/* earned badges — your trophy shelf */}
      {earnedBadges.length > 0 && (
        <div className="panel mb-5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-pixel text-xs text-cosmos-gold">🏅 BADGES EARNED</span>
            <button
              onClick={() => navigate('/app/inventory')}
              className="text-[10px] uppercase tracking-wider text-[var(--muted)] transition hover:text-white"
            >
              View all →
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {BADGES.filter((b) => earnedBadges.includes(b.id)).map((b) => (
              <div
                key={b.id}
                title={b.desc}
                className="flex items-center gap-2 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-3 py-1.5"
              >
                <span className="text-lg">{b.icon}</span>
                <span className="text-sm font-semibold text-white">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* first-run guide — visible until the first EXP lands, then gone forever */}
      {totalExp === 0 && (
        <div className="panel hud-corner mb-5 border-cosmos-cyan/40 p-5">
          <span className="font-pixel text-xs text-cosmos-cyan glow-text">⚡ FIRST STEPS</span>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {[
              ['1', 'Complete a daily quest', 'Start with a quick check-in or timer quest — your first EXP is 2 minutes away.'],
              ['2', 'Prove it', 'Photo quests verify instantly when the shot is clear; otherwise a human reviews it (yellow = under review).'],
              ['3', 'Come back tomorrow', 'Your streak is the real engine. Day 2 is where most people quit — don’t be most people.'],
            ].map(([n, title, body]) => (
              <div key={n} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="font-pixel text-sm text-cosmos-cyan">{n}</div>
                <div className="mt-1 font-display text-sm font-bold text-white">{title}</div>
                <div className="mt-1 text-xs text-[var(--muted)]">{body}</div>
              </div>
            ))}
          </div>
          <button onClick={() => navigate('/app/quests')} className="btn btn-primary mt-4 text-xs">
            ⚔ Take your first quest →
          </button>
        </div>
      )}

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
              const sub = serverVerify ? reviewStatusOf(`${q.traitId}:${q.task.id}`) : null
              const done = isTaskDoneToday(dailyLog, q.traitId, q.task.id) || sub === 'verified'
              const underReview = !done && sub === 'pending'
              const t = traitById(q.traitId)!
              return (
                <button
                  key={`${q.traitId}:${q.task.id}`}
                  disabled={done || underReview}
                  onClick={() => setPending(q)}
                  className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                    done
                      ? 'border-exp/30 bg-exp/5'
                      : underReview
                        ? 'border-amber-400/40 bg-amber-400/5'
                        : 'border-white/8 bg-white/[0.02] hover:border-[var(--edge-strong)]'
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border text-[10px] ${
                      done
                        ? 'border-exp bg-exp text-black'
                        : underReview
                          ? 'border-amber-400 text-amber-300'
                          : 'border-white/30'
                    }`}
                  >
                    {done ? '✓' : underReview ? '⏳' : ''}
                  </span>
                  <span className="flex-1">
                    <span
                      className={`block text-sm font-semibold ${
                        done ? 'text-exp line-through' : underReview ? 'text-amber-300' : 'text-white'
                      }`}
                    >
                      {q.task.label}
                      {underReview && <span className="ml-2 text-[10px] uppercase tracking-wide">· under review</span>}
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
