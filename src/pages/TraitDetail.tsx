import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useGame, traitLevel, isTaskDoneToday } from '../store/useGame'
import { traitById } from '../data/traits'
import { attributeById } from '../data/attributes'
import { levelFromTotalExp } from '../data/leveling'
import { VerificationModal } from '../components/VerificationModal'
import BookLinks from '../components/BookLinks'
import {
  methodForTask,
  VERIFICATION_METHODS,
  type VerificationResult,
  type VerificationMethodId,
} from '../data/verification'
import { ExpBar, PixelTitle, Pill, Toast } from '../components/ui'

// Generic mastery milestones shown on every trait.
const MASTERY = [
  { level: 1, title: 'Initiate', perk: 'Trait added to your stats. Daily tasks unlocked.' },
  { level: 3, title: 'Apprentice', perk: 'Habit forming — bonus Aether on this trait’s quests.' },
  { level: 5, title: 'Adept', perk: 'Momentum tier — counts toward attribute mastery.' },
  { level: 10, title: 'Expert', perk: 'Counts toward mastery badges (Scholar, Iron Will…).' },
  { level: 15, title: 'Master', perk: 'Unlocks a prestige cosmetic flair on your avatar.' },
  { level: 20, title: 'Grandmaster', perk: 'Trait mastered — permanent passive to your overall level.' },
]

export default function TraitDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const t = id ? traitById(id) : undefined

  const activeTraits = useGame((s) => s.activeTraits)
  const totalExp = useGame((s) => s.totalExp)
  const dailyLog = useGame((s) => s.dailyLog)
  const addTrait = useGame((s) => s.addTrait)
  const dropTrait = useGame((s) => s.dropTrait)
  const completeDailyTask = useGame((s) => s.completeDailyTask)
  const advanceMainQuest = useGame((s) => s.advanceMainQuest)

  const [pending, setPending] = useState<{ kind: 'daily' | 'main'; taskId?: string } | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  if (!t) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-[var(--muted)]">Trait not found.</p>
        <button onClick={() => navigate('/app/traits')} className="btn btn-ghost mt-4">
          ← Back to matrix
        </button>
      </div>
    )
  }

  const attr = attributeById(t.attribute)
  const active = activeTraits.find((x) => x.id === t.id)
  const isActive = !!active
  const tl = active ? traitLevel(active.exp) : { level: 0, pct: 0, intoLevel: 0, needed: 0 }
  const slotsFull = activeTraits.length >= 3
  const mqProgress = active ? Math.round(active.mainQuestProgress * 100) : 0
  const mqDone = active?.mainQuestDone

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2400)
  }

  const onAccept = () => {
    if (addTrait(t.id)) flash(`${t.name} added to your stats!`)
  }

  const submit = (result: VerificationResult) => {
    if (!pending) return
    if (pending.kind === 'daily' && pending.taskId) {
      const task = t.dailyTasks.find((x) => x.id === pending.taskId)!
      const before = levelFromTotalExp(totalExp).level
      completeDailyTask(t.id, task.id, { exp: task.exp, label: task.label }, result)
      if (result.status === 'flagged') flash('⚠ Flagged — no EXP')
      else if (result.status === 'pending') flash('⏳ Sent for review')
      else {
        const after = levelFromTotalExp(totalExp + task.exp).level
        flash(after > before ? `LEVEL UP → Lv ${after}` : `+${task.exp} EXP`)
      }
    } else {
      advanceMainQuest(t.id, { label: `Main quest check-in · ${t.mainQuest.title}`, steps: 4 }, result)
      flash(result.status === 'flagged' ? '⚠ Flagged' : 'Main quest progress logged!')
    }
  }

  // resolve verification method for the active pending item
  const mainMethod: VerificationMethodId =
    t.mainQuest.checkIn === 'photo'
      ? 'live-photo'
      : t.mainQuest.checkIn === 'summary'
        ? 'reading-check'
        : t.mainQuest.checkIn === 'schedule'
          ? 'geo-photo'
          : 'journal'
  const pendingTask =
    pending?.kind === 'daily' ? t.dailyTasks.find((x) => x.id === pending.taskId) : undefined
  const pendingMethod: VerificationMethodId | null = pending
    ? pending.kind === 'main'
      ? mainMethod
      : pendingTask
        ? methodForTask(pendingTask)
        : 'journal'
    : null

  return (
    <div>
      {/* hero */}
      <button
        onClick={() => navigate('/app/traits')}
        className="mb-4 text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white"
      >
        ← Trait Matrix
      </button>

      <div className="panel hud-corner relative overflow-hidden p-6 sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: attr.color }}
        />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-2xl" style={{ color: attr.color }}>
                {attr.icon}
              </span>
              <Pill>{attr.name}</Pill>
              <Pill tone={t.tier === 'low' ? 'exp' : t.tier === 'mid' ? 'default' : 'violet'}>
                {t.tier} tier
              </Pill>
            </div>
            <PixelTitle className="text-sm text-[var(--accent)] glow-text">{t.name}</PixelTitle>
            <p className="mt-3 text-lg font-semibold text-white">{t.tagline}</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{t.description}</p>
          </div>

          {/* level / action card */}
          <div className="w-full max-w-[220px] shrink-0 rounded-xl border border-[var(--edge)] bg-black/40 p-4">
            {isActive ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="stat-label text-xs">Trait level</span>
                  <span className="font-pixel text-lg text-[var(--accent)] glow-text">{tl.level}</span>
                </div>
                <div className="mt-2">
                  <ExpBar pct={tl.pct} height="h-2.5" showText={false} />
                </div>
                <div className="mt-1 text-[10px] text-[var(--muted)]">
                  {tl.intoLevel}/{tl.needed} EXP
                </div>
                <button
                  onClick={() => !mqProgress && !mqDone && dropTrait(t.id)}
                  disabled={!!mqProgress || mqDone}
                  className="btn btn-ghost mt-4 w-full text-[11px]"
                  title={mqProgress || mqDone ? 'Locked — main quest in progress' : 'Drop trait'}
                >
                  {mqProgress || mqDone ? '🔒 Committed' : 'Drop trait'}
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-[var(--muted)]">
                  {slotsFull
                    ? 'All 3 trait slots are full. Finish or drop one to add this.'
                    : 'Add this trait to your stats and start levelling it.'}
                </p>
                <button
                  onClick={onAccept}
                  disabled={slotsFull}
                  className="btn btn-primary mt-3 w-full text-xs"
                >
                  ✦ Accept trait
                </button>
              </>
            )}
          </div>
        </div>

        <div className="relative mt-6 rounded-xl border border-white/8 bg-white/[0.02] p-4">
          <span className="stat-label text-xs">Why build it</span>
          <p className="mt-1 text-sm text-slate-300">{t.benefit}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        {/* HOW TO LEVEL + DAILY TASKS */}
        <div className="space-y-5">
          <div className="panel p-5">
            <span className="font-pixel text-xs text-[var(--accent)] glow-text">HOW TO LEVEL UP</span>
            <ul className="mt-3 space-y-2">
              {t.howToLevel.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="text-[var(--accent)]">▹</span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-pixel text-xs text-[var(--accent)] glow-text">DAILY TASKS</span>
              {!isActive && <Pill>Accept trait to log</Pill>}
            </div>
            <div className="space-y-2.5">
              {t.dailyTasks.map((task) => {
                const done = isTaskDoneToday(dailyLog, t.id, task.id)
                return (
                  <button
                    key={task.id}
                    disabled={!isActive || done}
                    onClick={() => setPending({ kind: 'daily', taskId: task.id })}
                    className={`flex w-full items-start gap-3 rounded-lg border p-3 text-left transition ${
                      done
                        ? 'border-exp/30 bg-exp/5'
                        : isActive
                          ? 'border-white/8 bg-white/[0.02] hover:border-[var(--edge-strong)]'
                          : 'border-white/5 opacity-50'
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
                      <span className={`block text-sm font-semibold ${done ? 'text-exp' : 'text-white'}`}>
                        {task.label}
                      </span>
                      <span className="text-[11px] text-[var(--muted)]">
                        +{task.exp} EXP · {VERIFICATION_METHODS[methodForTask(task)].icon}{' '}
                        {VERIFICATION_METHODS[methodForTask(task)].label}
                        {task.hint ? ` · ${task.hint}` : ''}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* MAIN QUEST + HOT TIPS */}
        <div className="space-y-5">
          <div className="panel hud-corner relative overflow-hidden p-5">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-[var(--accent)]/10 blur-3xl" />
            <span className="font-pixel text-xs text-[var(--accent)] glow-text">MAIN QUEST</span>
            <h3 className="mt-3 font-display text-lg font-bold text-white">{t.mainQuest.title}</h3>
            {t.mainQuest.book && (
              <>
                <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-3 py-1.5 text-xs text-cosmos-gold">
                  📚 {t.mainQuest.book}
                </div>
                <div className="mt-2">
                  <BookLinks book={t.mainQuest.book} compact />
                </div>
              </>
            )}
            <div className="mt-4">
              <span className="stat-label text-xs">Why?</span>
              <p className="mt-1 text-sm leading-relaxed text-slate-300">{t.mainQuest.why}</p>
            </div>

            {isActive && (
              <div className="mt-5">
                <ExpBar pct={mqProgress} label="Quest progress" />
                <button
                  disabled={mqDone}
                  onClick={() => setPending({ kind: 'main' })}
                  className="btn btn-primary mt-3 w-full text-xs"
                >
                  {mqDone ? '✓ Quest complete' : `Check in (+${t.mainQuest.exp} EXP on completion)`}
                </button>
              </div>
            )}
          </div>

          <div className="panel p-5">
            <span className="font-pixel text-xs text-cosmos-gold">🔥 HOT TIPS</span>
            <ol className="mt-3 space-y-2">
              {t.hotTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="font-pixel text-[10px] text-cosmos-gold">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* MASTERY TRACK */}
      <div className="panel mt-5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-pixel text-xs text-[var(--accent)] glow-text">MASTERY TRACK</span>
          <Pill tone={isActive ? 'exp' : 'default'}>
            {isActive ? `Current: Lv ${tl.level}` : 'Not started'}
          </Pill>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MASTERY.map((m) => {
            const reached = isActive && tl.level >= m.level
            return (
              <div
                key={m.level}
                className={`rounded-xl border p-3 ${
                  reached ? 'border-[var(--accent)]/50 bg-[color-mix(in_srgb,var(--accent)_8%,transparent)]' : 'border-white/8 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-display font-bold text-white">{m.title}</span>
                  <span className={`font-pixel text-[11px] ${reached ? 'text-exp' : 'text-[var(--muted)]'}`}>
                    {reached ? '✓' : `Lv${m.level}`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--muted)]">{m.perk}</p>
              </div>
            )
          })}
        </div>
      </div>

      {pending && pendingMethod && (
        <VerificationModal
          open={!!pending}
          onClose={() => setPending(null)}
          method={pendingMethod}
          label={pending.kind === 'main' ? t.mainQuest.title : pendingTask?.label ?? ''}
          minMinutes={pendingTask?.minMinutes}
          book={pending.kind === 'main' ? t.mainQuest.book : undefined}
          onResult={submit}
        />
      )}
      <Toast message={toast} />
    </div>
  )
}
