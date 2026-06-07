import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import {
  DEFAULT_ANSWERS,
  REGIONS,
  ATTRIBUTE_GOAL_OPTIONS,
  OUTCOME_OPTIONS,
  OBSTACLE_OPTIONS,
  DAILY_TIME_OPTIONS,
  MOTIVATION_OPTIONS,
  computeOnboarding,
  type OnboardingAnswers,
} from '../data/onboarding'
import { ATTRIBUTES } from '../data/attributes'
import { traitById } from '../data/traits'
import { rankForLevel } from '../data/ranks'
import type { AttributeId } from '../data/types'
import { PixelTitle, ExpBar } from '../components/ui'
import CosmosScenery from '../components/CosmosScenery'

const STEPS = ['Identity', 'Self-Assessment', 'Goals', 'Obstacles', 'Lifestyle', 'Commitment', 'Your Build']

// small option-button helper
function Choice({
  active,
  onClick,
  title,
  desc,
}: {
  active: boolean
  onClick: () => void
  title: string
  desc?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-cosmos-cyan bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] shadow-glow'
          : 'border-white/10 bg-white/[0.02] hover:border-white/25'
      }`}
    >
      <div className="font-display font-bold uppercase tracking-wide text-white">{title}</div>
      {desc && <div className="mt-0.5 text-xs text-slate-400">{desc}</div>}
    </button>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const completeOnboarding = useGame((s) => s.completeOnboarding)
  const [step, setStep] = useState(0)
  const [a, setA] = useState<OnboardingAnswers>({ ...DEFAULT_ANSWERS })

  const set = (patch: Partial<OnboardingAnswers>) => setA((prev) => ({ ...prev, ...patch }))

  const result = useMemo(() => computeOnboarding(a), [a])

  const canNext = useMemo(() => {
    if (step === 0) return a.handle.trim().length > 0 && a.age !== '' && Number(a.age) >= 13
    if (step === 2) return a.goals.length > 0 || a.outcomes.length > 0
    return true
  }, [step, a])

  const finish = () => {
    completeOnboarding(a)
    navigate('/app/character')
  }

  const toggleGoal = (id: AttributeId) =>
    set({
      goals: a.goals.includes(id) ? a.goals.filter((g) => g !== id) : [...a.goals, id],
    })
  const toggleIn = (key: 'outcomes' | 'obstacles', id: string) =>
    set({
      [key]: a[key].includes(id) ? a[key].filter((x) => x !== id) : [...a[key], id],
    } as Partial<OnboardingAnswers>)

  return (
    <div className="cosmos-bg relative min-h-screen px-4 py-10 sm:py-14">
      <CosmosScenery />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto max-w-2xl">
        {/* header */}
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-pixel text-sm text-cosmos-cyan glow-text">ASCEND</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-[var(--muted)]">
            Onboarding · Step {step + 1}/{STEPS.length}
          </span>
        </div>

        {/* progress steps */}
        <div className="mb-8 flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className="flex-1">
              <div
                className={`h-1.5 rounded-full transition-all ${
                  i <= step ? 'exp-fill' : 'bg-white/10'
                }`}
              />
              <div
                className={`mt-1.5 hidden text-[10px] uppercase tracking-wider sm:block ${
                  i === step ? 'text-cosmos-cyan' : 'text-slate-600'
                }`}
              >
                {s}
              </div>
            </div>
          ))}
        </div>

        <div className="panel hud-corner p-6 sm:p-8">
          {/* ---------- STEP 0: IDENTITY ---------- */}
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">CREATE YOUR CHARACTER</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">Who is logging in?</h2>
                <p className="mt-1 text-sm text-slate-400">
                  This tailors your level and the traits we suggest you build.
                </p>
              </div>

              <div>
                <label className="stat-label mb-1.5 block text-xs">Handle / Player name</label>
                <input
                  className="input"
                  placeholder="e.g. Alchy"
                  value={a.handle}
                  onChange={(e) => set({ handle: e.target.value })}
                  maxLength={20}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="stat-label mb-1.5 block text-xs">Age</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="22"
                    value={a.age}
                    min={13}
                    max={100}
                    onChange={(e) => set({ age: e.target.value === '' ? '' : Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="stat-label mb-1.5 block text-xs">Region</label>
                  <select
                    className="input"
                    value={a.region}
                    onChange={(e) => set({ region: e.target.value })}
                  >
                    {REGIONS.map((r) => (
                      <option key={r} value={r} className="bg-cosmos-panel">
                        {r}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="stat-label mb-1.5 block text-xs">Occupation / Status</label>
                <input
                  className="input"
                  placeholder="Student, Software Dev, Founder…"
                  value={a.occupation}
                  onChange={(e) => set({ occupation: e.target.value })}
                />
              </div>

              <div>
                <label className="stat-label mb-2 block text-xs">Choose your interface theme</label>
                <div className="grid grid-cols-2 gap-3">
                  <Choice
                    active={a.theme === 'cosmos'}
                    onClick={() => set({ theme: 'cosmos' })}
                    title="🌌 Cosmos"
                    desc="Futuristic cosmic / sci-fi"
                  />
                  <Choice
                    active={a.theme === 'rune'}
                    onClick={() => set({ theme: 'rune' })}
                    title="⚔️ Rune"
                    desc="Classic MMO / fantasy"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ---------- STEP 1: SELF ASSESSMENT ---------- */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">RATE YOUR STATS</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  Where are you right now?
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Be honest — this is the baseline we build from. 1 = weak, 5 = strong.
                </p>
              </div>

              {ATTRIBUTES.map((attr) => (
                <div key={attr.id}>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-2 font-display font-bold uppercase tracking-wide text-white">
                      <span>{attr.icon}</span> {attr.name}
                      <span className="text-xs font-normal text-slate-500">{attr.blurb}</span>
                    </span>
                    <span className="font-pixel text-xs text-cosmos-cyan">
                      {a.selfRating[attr.id]}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={a.selfRating[attr.id]}
                    onChange={(e) =>
                      set({ selfRating: { ...a.selfRating, [attr.id]: Number(e.target.value) } })
                    }
                    className="w-full accent-cosmos-cyan"
                    style={{ accentColor: attr.color }}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ---------- STEP 2: GOALS ---------- */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">CHOOSE YOUR PATH</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  What do you most want to build?
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Pick the areas that matter most — then the specific outcomes you’re chasing.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ATTRIBUTE_GOAL_OPTIONS.map((o) => (
                  <Choice
                    key={o.id}
                    active={a.goals.includes(o.id)}
                    onClick={() => toggleGoal(o.id)}
                    title={o.label}
                    desc={o.desc}
                  />
                ))}
              </div>

              <div>
                <div className="mb-2 mt-2 text-sm font-semibold text-slate-200">
                  Which outcomes are you chasing? <span className="text-slate-500">(select any)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {OUTCOME_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => toggleIn('outcomes', o.id)}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition ${
                        a.outcomes.includes(o.id)
                          ? 'border-cosmos-cyan bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-cosmos-cyan'
                          : 'border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <span className="text-base">{o.icon}</span> {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ---------- STEP 3: OBSTACLES ---------- */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">KNOW YOUR ENEMY</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  What’s been holding you back?
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  We’ll tune your daily tasks to attack these directly. (Select any that hit home.)
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {OBSTACLE_OPTIONS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => toggleIn('obstacles', o.id)}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-3 text-left text-xs font-semibold transition ${
                      a.obstacles.includes(o.id)
                        ? 'border-cosmos-magenta bg-cosmos-magenta/10 text-cosmos-magenta'
                        : 'border-white/10 text-slate-300 hover:border-white/25'
                    }`}
                  >
                    <span className="text-base">{o.icon}</span> {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---------- STEP 4: LIFESTYLE ---------- */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">LIFESTYLE SCAN</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">Your current habits</h2>
                <p className="mt-1 text-sm text-slate-400">
                  These calibrate your starting level. No judgment — just a baseline.
                </p>
              </div>

              {(
                [
                  ['sleep', 'How’s your sleep?', [['poor', 'Poor'], ['ok', 'Okay'], ['great', 'Great']]],
                  ['exercise', 'How often do you train?', [['none', 'Rarely'], ['sometimes', 'Sometimes'], ['regular', 'Regularly']]],
                  ['reading', 'How often do you read / learn?', [['never', 'Never'], ['sometimes', 'Sometimes'], ['daily', 'Daily']]],
                  ['finances', 'Your finances right now?', [['struggling', 'Struggling'], ['stable', 'Stable'], ['thriving', 'Thriving']]],
                  ['business', 'Do you run anything of your own?', [['none', 'No'], ['side', 'Side hustle'], ['owner', 'Business owner']]],
                  ['procrastination', 'Do you procrastinate?', [['chronic', 'Chronically'], ['sometimes', 'Sometimes'], ['rarely', 'Rarely']]],
                  ['screenTime', 'Daily phone / screen time?', [['high', 'High'], ['med', 'Medium'], ['low', 'Low']]],
                  ['diet', 'How clean is your diet?', [['poor', 'Poor'], ['ok', 'Okay'], ['clean', 'Clean']]],
                  ['social', 'Your social life right now?', [['isolated', 'Isolated'], ['ok', 'Okay'], ['thriving', 'Thriving']]],
                ] as [keyof OnboardingAnswers, string, [string, string][]][]
              ).map(([key, q, opts]) => (
                <div key={key as string}>
                  <div className="mb-2 text-sm font-semibold text-slate-200">{q}</div>
                  <div className="grid grid-cols-3 gap-2">
                    {opts.map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => set({ [key]: val } as Partial<OnboardingAnswers>)}
                        className={`rounded-lg border px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                          (a as any)[key] === val
                            ? 'border-cosmos-cyan bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-cosmos-cyan'
                            : 'border-white/10 text-slate-400 hover:border-white/25'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ---------- STEP 5: COMMITMENT / TIER ---------- */}
          {step === 5 && (
            <div className="space-y-5">
              <div>
                <PixelTitle className="text-xs text-cosmos-cyan">SET YOUR STAKES</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  How are you playing?
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Your time, your motivation, your stakes — we’ll size your routine to match.
                </p>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-200">
                  How much time can you commit daily?
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {DAILY_TIME_OPTIONS.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => set({ dailyTime: o.id })}
                      className={`rounded-lg border px-2 py-2.5 text-xs font-bold uppercase tracking-wide transition ${
                        a.dailyTime === o.id
                          ? 'border-cosmos-cyan bg-[color-mix(in_srgb,var(--accent)_16%,transparent)] text-cosmos-cyan'
                          : 'border-white/10 text-slate-400 hover:border-white/25'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="mb-2 text-sm font-semibold text-slate-200">What drives you most?</div>
                <div className="grid grid-cols-2 gap-2">
                  {MOTIVATION_OPTIONS.map((o) => (
                    <Choice
                      key={o.id}
                      active={a.motivation === o.id}
                      onClick={() => set({ motivation: o.id })}
                      title={o.label}
                      desc={o.desc}
                    />
                  ))}
                </div>
              </div>

              <div className="text-sm font-semibold text-slate-200">Choose your stakes / consent tier</div>
              <div className="space-y-3">
                <Choice
                  active={a.tier === 'low'}
                  onClick={() => set({ tier: 'low' })}
                  title="Low — Level cap 20"
                  desc="Foundations & habits. No sensitive questions."
                />
                <Choice
                  active={a.tier === 'mid'}
                  onClick={() => set({ tier: 'mid' })}
                  title="Mid — Level cap 40"
                  desc="Unlocks income & physique goals. Some proof required."
                />
                <Choice
                  active={a.tier === 'high'}
                  onClick={() => set({ tier: 'high' })}
                  title="High — Level cap 60"
                  desc="Business & monetary goals. All claims must be proven."
                />
              </div>

              {a.tier === 'high' && (
                <div className="space-y-4 rounded-xl border border-cosmos-violet/30 bg-cosmos-violet/5 p-4 animate-popIn">
                  <p className="text-xs uppercase tracking-widest text-cosmos-violet">
                    High-level questions (optional · provable later)
                  </p>
                  <div>
                    <label className="stat-label mb-1.5 block text-xs">Approx. annual income</label>
                    <input
                      className="input"
                      placeholder="e.g. $40k–$80k"
                      value={a.income ?? ''}
                      onChange={(e) => set({ income: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="stat-label mb-1.5 block text-xs">Physique goal</label>
                    <input
                      className="input"
                      placeholder="e.g. lose 8kg / build muscle"
                      value={a.physique ?? ''}
                      onChange={(e) => set({ physique: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---------- STEP 6: RESULTS / YOUR BUILD ---------- */}
          {step === 6 && (
            <div className="space-y-6">
              <div className="text-center">
                <PixelTitle className="text-xs text-cosmos-cyan">ONBOARDING COMPLETE</PixelTitle>
                <h2 className="mt-2 font-display text-2xl font-bold text-white">
                  Welcome, {a.handle || 'Ascender'}.
                </h2>
              </div>

              {/* level card */}
              <div className="rounded-2xl border border-cosmos-cyan/40 bg-black/40 p-5 text-center shadow-glow">
                <div className="text-xs uppercase tracking-widest text-slate-400">Starting Rank</div>
                <div className="mt-1 font-pixel text-2xl text-cosmos-cyan glow-text">
                  {rankForLevel(result.startingLevel).title}
                </div>
                <div className="mt-2 font-display text-5xl font-black text-white">
                  LV {result.startingLevel}
                </div>
                <div className="mx-auto mt-4 max-w-xs">
                  <ExpBar pct={0} label="EXP to Level 2" showText={false} />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  Everyone starts here. From now on, every level is earned through verified quests.
                </p>
              </div>

              {/* rationale */}
              <div className="space-y-2">
                {result.rationale.map((r, i) => (
                  <div key={i} className="flex gap-2 text-sm text-slate-300">
                    <span className="text-cosmos-cyan">▹</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              {/* suggested traits */}
              <div>
                <div className="mb-3 text-xs uppercase tracking-widest text-cosmos-cyan">
                  Your first 3 quests to work on
                </div>
                <div className="space-y-3">
                  {result.suggestedTraitIds.map((id) => {
                    const t = traitById(id)!
                    return (
                      <div
                        key={id}
                        className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-lg font-bold text-white">{t.name}</span>
                          <span className="chip border-white/15">{t.attribute}</span>
                        </div>
                        <p className="mt-1 text-sm text-slate-400">{t.tagline}</p>
                        <p className="mt-2 text-xs text-cosmos-cyan">
                          ▸ Main quest: {t.mainQuest.title}
                        </p>
                      </div>
                    )
                  })}
                </div>
                <p className="mt-3 text-center text-xs text-slate-500">
                  You can swap these any time from the Trait Matrix — but you can only build 3 at once.
                </p>
              </div>
            </div>
          )}

          {/* ---------- NAV BUTTONS ---------- */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => (step === 0 ? navigate('/disclaimers') : setStep((s) => s - 1))}
              className="btn btn-ghost"
            >
              ← Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn btn-primary"
              >
                Continue →
              </button>
            ) : (
              <button type="button" onClick={finish} className="btn btn-primary">
                ▶ Enter the platform
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
