import { useState } from 'react'
import { useGame, type Submission } from '../store/useGame'
import { BADGES } from '../data/badges'
import { badgeProgress } from '../data/badgeEngine'
import { VERIFICATION_METHODS } from '../data/verification'
import { ExpBar, PixelTitle, Pill, Modal } from '../components/ui'

const TABS = ['Badges', 'Items', 'Proof Log'] as const
type Tab = (typeof TABS)[number]

function Meta({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2">
      <div className="text-[9px] uppercase tracking-widest text-[var(--muted)]">{k}</div>
      <div className="text-slate-200">{children}</div>
    </div>
  )
}

const STATUS_TONE: Record<string, string> = {
  verified: 'text-exp',
  pending: 'text-amber-300',
  flagged: 'text-cosmos-magenta',
}

// Cosmetic items you can earn (deck: "Items ... cool effects"). Locked until
// the listed feat is achieved - nothing is owned at the start.
const ITEMS = [
  { name: 'Ember of Focus', icon: '🔥', rarity: 'Rare', effect: 'Earn by deep-working 2h a day, 7 days straight. Glowing aura on your avatar.', owned: false },
  { name: 'Iron Crown', icon: '👑', rarity: 'Epic', effect: 'Reach rank 1 on any leaderboard. Animated crown cosmetic.', owned: false },
  { name: 'Scholar’s Tome', icon: '📕', rarity: 'Uncommon', effect: 'Finish a main-quest book. Floating tome companion.', owned: false },
  { name: 'Titan Plate', icon: '🛡️', rarity: 'Epic', effect: 'Complete the 8-week physique quest. Armoured avatar skin.', owned: false },
  { name: 'Phoenix Sigil', icon: '🪶', rarity: 'Legendary', effect: '30-day unbroken streak. Rebirth flame VFX.', owned: false },
  { name: 'Void Lantern', icon: '🏮', rarity: 'Rare', effect: 'Meditate 20 days in a month. Calming particle effect.', owned: false },
]

const RARITY_TONE: Record<string, string> = {
  Uncommon: 'text-exp border-exp/40',
  Rare: 'text-cosmos-cyan border-cosmos-cyan/40',
  Epic: 'text-cosmos-violet border-cosmos-violet/40',
  Legendary: 'text-cosmos-gold border-cosmos-gold/50',
}

const REWARD_TONE = { LOW: 'exp', MID: 'default', HIGH: 'gold' } as const
// Aether granted when a badge is earned (must match the store's syncBadges).
const BADGE_AETHER = { LOW: 150, MID: 350, HIGH: 750 } as const

export default function Inventory() {
  const [tab, setTab] = useState<Tab>('Badges')
  const submissions = useGame((s) => s.submissions)
  const [view, setView] = useState<Submission | null>(null)

  // live badge snapshot (computed from real stats, not hand-set values)
  const snap = {
    streak: useGame((s) => s.streak),
    bestStreak: useGame((s) => s.bestStreak),
    lifetimeQuests: useGame((s) => s.lifetimeQuests),
    completedQuests: useGame((s) => s.completedQuests),
    totalExp: useGame((s) => s.totalExp),
    activeTraits: useGame((s) => s.activeTraits),
    archivedTraits: useGame((s) => s.archivedTraits),
    peakBoards: useGame((s) => s.peakBoards),
    onboarded: useGame((s) => s.onboarded),
  }

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">INVENTORY</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">
          Badges · Achievements · Items
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Earned by levelling traits and completing quests. Higher tiers unlock bigger real-world
          rewards - verified by humans monthly.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition ${
              tab === t
                ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] shadow-glow'
                : 'text-[var(--muted)] hover:text-white'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Badges' && (
        <div className="grid gap-4 md:grid-cols-2">
          {BADGES.map((b) => {
            const prog = badgeProgress(b, snap)
            const pct = prog.pct
            const complete = prog.earned
            return (
              <div
                key={b.id}
                className={`panel hud-corner p-5 ${complete ? 'border-cosmos-gold/50 shadow-glow-gold' : ''}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-3xl ${
                      complete ? 'border-cosmos-gold shadow-glow-gold' : 'border-white/10 grayscale'
                    }`}
                  >
                    {b.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-lg font-bold text-white">{b.name}</h3>
                      <Pill tone={REWARD_TONE[b.reward]}>
                        {complete ? '✓ earned' : `◈ ${BADGE_AETHER[b.reward]}`}
                      </Pill>
                    </div>
                    <p className="text-xs text-[var(--muted)]">{b.desc}</p>
                  </div>
                </div>

                <div className="mt-4">
                  <ExpBar pct={pct} label="Badge progress" />
                </div>

                <ul className="mt-4 space-y-1.5">
                  {prog.reqs.map((r) => (
                    <li key={r.label} className="flex items-center gap-2 text-sm">
                      <span className={r.met ? 'text-exp' : 'text-[var(--muted)]'}>
                        {r.met ? '✓' : '○'}
                      </span>
                      <span className={r.met ? 'text-slate-200' : 'text-[var(--muted)]'}>
                        {r.label}
                      </span>
                      <span className="ml-auto font-pixel text-[10px] text-[var(--muted)]">
                        {r.done}/{r.total}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'Items' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map((it) => (
            <div
              key={it.name}
              className={`panel p-5 text-center ${it.owned ? '' : 'opacity-60'}`}
            >
              <div
                className={`mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border text-4xl ${
                  it.owned ? RARITY_TONE[it.rarity] : 'border-white/10 grayscale'
                } ${it.owned ? 'shadow-glow' : ''}`}
              >
                {it.icon}
              </div>
              <h3 className="mt-3 font-display text-base font-bold text-white">{it.name}</h3>
              <span
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${RARITY_TONE[it.rarity]}`}
              >
                {it.rarity}
              </span>
              <p className="mt-2 text-xs text-[var(--muted)]">{it.effect}</p>
              {!it.owned && (
                <div className="mt-2 text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  🔒 Locked
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'Proof Log' && (
        <div className="panel p-5">
          <span className="font-pixel text-xs text-[var(--accent)]">PROOF LOG</span>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Every verified check-in, with its anti-cheat metadata. Reviewed by AI + humans to keep
            the ladder honest.
          </p>
          {submissions.length === 0 ? (
            <p className="mt-6 text-center text-sm text-[var(--muted)]">
              No proof logged yet - complete a daily quest to start your proof log.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {submissions.map((e) => (
                <li key={e.id}>
                  <button
                    onClick={() => setView(e)}
                    className="flex w-full gap-3 rounded-lg border border-white/8 bg-white/[0.02] p-3 text-left text-sm transition hover:border-[var(--edge-strong)]"
                  >
                    {e.thumb ? (
                      <img src={e.thumb} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 text-xl">
                        {VERIFICATION_METHODS[e.method]?.icon ?? '✓'}
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-white">{e.label}</span>
                        <span className={`text-[10px] uppercase tracking-wide ${STATUS_TONE[e.status]}`}>
                          ● {e.status}
                        </span>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-[var(--muted)]">
                        {e.meta.entry || e.note}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 text-[10px] text-[var(--muted)]/80">
                        <span>{new Date(e.at).toLocaleString()}</span>
                        {e.meta.gps && (
                          <span>📍 {e.meta.gps.lat.toFixed(3)}, {e.meta.gps.lng.toFixed(3)}</span>
                        )}
                        {e.meta.dwellSec !== undefined && <span>⏱ {Math.round(e.meta.dwellSec / 60)}m</span>}
                        {e.meta.wordCount !== undefined && <span>📝 {e.meta.wordCount}w</span>}
                        <span className="text-[var(--accent)]">View →</span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* full submission viewer */}
      <Modal open={!!view} onClose={() => setView(null)} title="Submission detail">
        {view && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-white">{view.label}</span>
              <span className={`text-xs uppercase tracking-wide ${STATUS_TONE[view.status]}`}>
                ● {view.status}
              </span>
            </div>
            <div className="text-xs text-[var(--muted)]">
              {VERIFICATION_METHODS[view.method]?.label} · {new Date(view.at).toLocaleString()}
            </div>

            {view.thumb && (
              <img src={view.thumb} alt="proof" className="max-h-72 w-full rounded-lg object-contain" />
            )}

            {view.meta.entry ? (
              <div>
                <div className="stat-label mb-1 text-[10px]">What you submitted</div>
                <div className="max-h-56 overflow-y-auto whitespace-pre-line rounded-lg border border-white/10 bg-black/30 p-3 text-slate-200">
                  {view.meta.entry}
                </div>
              </div>
            ) : (
              <p className="text-[var(--muted)]">{view.note}</p>
            )}

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {view.meta.gps && (
                <Meta k="Location">
                  {view.meta.gps.lat.toFixed(4)}, {view.meta.gps.lng.toFixed(4)} ±
                  {Math.round(view.meta.gps.accuracy)}m
                </Meta>
              )}
              {view.meta.livenessCode && <Meta k="Liveness code">{view.meta.livenessCode}</Meta>}
              {view.meta.dwellSec !== undefined && (
                <Meta k="Time on task">{Math.round(view.meta.dwellSec / 60)} min</Meta>
              )}
              {view.meta.interruptions !== undefined && (
                <Meta k="Interruptions">{view.meta.interruptions}</Meta>
              )}
              {view.meta.wordCount !== undefined && <Meta k="Word count">{view.meta.wordCount}</Meta>}
              {view.meta.pasteBlocked && <Meta k="Paste">Blocked</Meta>}
            </div>

            {view.meta.flags && view.meta.flags.length > 0 && (
              <div className="rounded-lg border border-cosmos-magenta/30 bg-cosmos-magenta/5 p-2">
                {view.meta.flags.map((f) => (
                  <div key={f} className="text-[11px] text-cosmos-magenta">⚠ {f}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
