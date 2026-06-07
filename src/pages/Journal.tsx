import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { traitById } from '../data/traits'
import { VERIFICATION_METHODS } from '../data/verification'
import { PixelTitle, Pill } from '../components/ui'

type Entry =
  | { at: string; kind: 'quest'; title: string; trait?: string }
  | {
      at: string
      kind: 'checkin'
      label: string
      method: string
      status: string
      note: string
      thumb?: string
    }

const STATUS_TONE: Record<string, string> = {
  verified: 'text-exp',
  pending: 'text-amber-300',
  flagged: 'text-cosmos-magenta',
}

export default function Journal() {
  const completedQuests = useGame((s) => s.completedQuests)
  const submissions = useGame((s) => s.submissions)
  const streak = useGame((s) => s.streak)
  const { level } = usePlayerLevel()

  const { groups, verifiedCount } = useMemo(() => {
    const entries: Entry[] = []
    completedQuests.forEach((q) =>
      entries.push({ at: q.at, kind: 'quest', title: q.title, trait: traitById(q.traitId)?.name }),
    )
    submissions.forEach((s) =>
      entries.push({
        at: s.at,
        kind: 'checkin',
        label: s.label,
        method: s.method,
        status: s.status,
        note: s.note,
        thumb: s.thumb,
      }),
    )
    entries.sort((a, b) => +new Date(b.at) - +new Date(a.at))

    const byDay: Record<string, Entry[]> = {}
    entries.forEach((e) => {
      const day = new Date(e.at).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      ;(byDay[day] ??= []).push(e)
    })
    const verified = submissions.filter((s) => s.status === 'verified').length
    return { groups: Object.entries(byDay), verifiedCount: verified }
  }, [completedQuests, submissions])

  const empty = groups.length === 0

  return (
    <div>
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">JOURNAL</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Your chronicle</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Every quest you’ve finished and every check‑in you’ve logged — your story of becoming.
        </p>
      </div>

      {/* summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Level', level],
          ['Quests completed', completedQuests.length],
          ['Verified check‑ins', verifiedCount],
          ['Current streak', `${streak}d`],
        ].map(([k, v]) => (
          <div key={k as string} className="panel p-4 text-center">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{k}</div>
            <div className="mt-1 font-pixel text-lg text-[var(--accent)]">{v}</div>
          </div>
        ))}
      </div>

      {empty ? (
        <div className="panel p-10 text-center">
          <div className="text-4xl">📓</div>
          <p className="mt-3 font-display text-lg font-bold text-white">Your journal is blank</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--muted)]">
            Complete a quest or log a daily check‑in and it will appear here, dated and kept forever.
          </p>
          <Link to="/app/character" className="btn btn-primary mt-4">
            ▶ Go quest
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map(([day, entries]) => (
            <div key={day}>
              <div className="mb-3 flex items-center gap-3">
                <span className="font-display text-sm font-bold uppercase tracking-wide text-white">
                  {day}
                </span>
                <span className="h-px flex-1 bg-white/8" />
                <span className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </span>
              </div>

              <div className="relative space-y-3 border-l border-white/10 pl-5">
                {entries.map((e, i) => (
                  <div key={i} className="relative">
                    <span className="absolute -left-[1.46rem] top-2 h-2.5 w-2.5 rounded-full border-2 border-[var(--accent)] bg-[var(--bg)]" />
                    {e.kind === 'quest' ? (
                      <div className="panel p-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🗡️</span>
                          <span className="font-display font-bold text-white">
                            Main quest complete
                          </span>
                          <Pill tone="gold">+ milestone</Pill>
                        </div>
                        <p className="mt-1 text-sm text-slate-300">{e.title}</p>
                        {e.trait && (
                          <p className="mt-0.5 text-[11px] uppercase tracking-wide text-[var(--muted)]">
                            {e.trait}
                          </p>
                        )}
                        <span className="mt-1 block text-[10px] text-[var(--muted)]/70">
                          {new Date(e.at).toLocaleTimeString()}
                        </span>
                      </div>
                    ) : (
                      <div className="panel flex gap-3 p-4">
                        {e.thumb ? (
                          <img src={e.thumb} alt="" className="h-12 w-12 shrink-0 rounded-md object-cover" />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-white/10 text-xl">
                            {VERIFICATION_METHODS[e.method as keyof typeof VERIFICATION_METHODS]?.icon ?? '✓'}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-semibold text-white">{e.label}</span>
                            <span className={`text-[10px] uppercase tracking-wide ${STATUS_TONE[e.status]}`}>
                              ● {e.status}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-[var(--muted)]">{e.note}</p>
                          <span className="mt-1 block text-[10px] text-[var(--muted)]/70">
                            {new Date(e.at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
