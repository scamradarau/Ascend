import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { ATTRIBUTES, attributeById } from '../data/attributes'
import { traitById } from '../data/traits'
import { levelFromTotalExp } from '../data/leveling'
import { freezeCap } from '../data/plus'
import { todayKey } from '../lib/time'
import { PixelTitle, Pill, ExpBar } from '../components/ui'
import Icon, { ATTR_ICON } from '../components/Icon'

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY = 86400000

// ================================================================
// ADVANCED STATS (Ascend Plus) - a coach's read on your progress:
// consistency, momentum, focus/balance, effort quality, cadence and a
// forward projection. Everything is derived from real, verified activity.
// ================================================================
export default function Stats() {
  const plus = useGame((s) => s.plus)
  const submissions = useGame((s) => s.submissions)
  const activeTraits = useGame((s) => s.activeTraits)
  const trust = useGame((s) => s.trust)
  const streak = useGame((s) => s.streak)
  const bestStreak = useGame((s) => s.bestStreak)
  const lifetimeQuests = useGame((s) => s.lifetimeQuests)
  const questsThisMonth = useGame((s) => s.questsThisMonth)
  const totalExp = useGame((s) => s.totalExp)
  const freezes = useGame((s) => s.streakFreezes)
  const { level } = usePlayerLevel()

  const s = useMemo(() => {
    const verified = submissions.filter((x) => x.status === 'verified')
    const flagged = submissions.filter((x) => x.status === 'flagged')
    const keyOf = (iso: string) => todayKey(new Date(iso))

    // per-day verified counts
    const byDay: Record<string, number> = {}
    verified.forEach((x) => {
      const k = keyOf(x.at)
      byDay[k] = (byDay[k] || 0) + 1
    })
    const axis14 = [...Array(14)].map((_, i) => todayKey(new Date(Date.now() - (13 - i) * DAY)))
    const heat = axis14.map((k) => ({ k, n: byDay[k] || 0 }))
    const last7keys = axis14.slice(7)
    const prev7keys = axis14.slice(0, 7)
    const sum = (keys: string[]) => keys.reduce((a, k) => a + (byDay[k] || 0), 0)
    const last7 = sum(last7keys)
    const prev7 = sum(prev7keys)
    const activeDays7 = last7keys.filter((k) => (byDay[k] || 0) > 0).length
    const axis30 = [...Array(30)].map((_, i) => todayKey(new Date(Date.now() - i * DAY)))
    const activeDays30 = axis30.filter((k) => (byDay[k] || 0) > 0).length

    // weekday rhythm
    const dow = Array(7).fill(0)
    verified.forEach((x) => dow[new Date(x.at).getDay()]++)
    const bestDow = dow.some((n) => n > 0) ? dow.indexOf(Math.max(...dow)) : null

    // effort quality
    const reviewed = verified.length + flagged.length
    const verifyRate = reviewed > 0 ? Math.round((verified.length / reviewed) * 100) : 100

    // momentum (this 7d vs prior 7d)
    const momentum = prev7 === 0 ? (last7 > 0 ? 100 : 0) : Math.round(((last7 - prev7) / prev7) * 100)

    // recency
    const lastAt = verified[0]?.at ?? null
    const daysSince = lastAt ? Math.floor((Date.now() - new Date(lastAt).getTime()) / DAY) : null

    // trait distribution
    const traitRows = activeTraits
      .map((t) => {
        const def = traitById(t.id)
        return {
          id: t.id,
          name: def?.name ?? t.id,
          attr: def?.attribute ?? 'mind',
          exp: t.exp || 0,
          level: levelFromTotalExp(t.exp || 0).level,
        }
      })
      .sort((a, b) => b.exp - a.exp)
    const maxTraitExp = Math.max(1, ...traitRows.map((r) => r.exp))

    // Path (attribute) balance
    const attrExp: Record<string, number> = {}
    ATTRIBUTES.forEach((a) => (attrExp[a.id] = 0))
    traitRows.forEach((r) => (attrExp[r.attr] += r.exp))
    const attrVals = ATTRIBUTES.map((a) => ({ ...a, exp: attrExp[a.id] || 0 }))
    const totalAttr = attrVals.reduce((acc, a) => acc + a.exp, 0)
    const maxAttr = Math.max(1, ...attrVals.map((a) => a.exp))
    // evenness: 100 = spread evenly across all 5 Paths, 0 = all in one
    const topShare = totalAttr > 0 ? Math.max(...attrVals.map((a) => a.exp)) / totalAttr : 0
    const balance = totalAttr > 0 ? Math.round(((1 - topShare) / (1 - 1 / ATTRIBUTES.length)) * 100) : 0
    const strongestPath = [...attrVals].sort((a, b) => b.exp - a.exp)[0]
    const neglectedPath = [...attrVals].sort((a, b) => a.exp - b.exp)[0]

    // projection
    const lf = levelFromTotalExp(totalExp)
    const expToNext = lf.needed - lf.intoLevel
    const projected30 = Math.round((last7 / 7) * 30)
    const avgPerActiveDay = activeDays30 > 0 ? (sum(axis30) / activeDays30).toFixed(1) : '0'

    return {
      verifiedCount: verified.length,
      flaggedCount: flagged.length,
      verifyRate,
      heat,
      last7,
      prev7,
      momentum,
      activeDays7,
      activeDays30,
      dow,
      bestDow,
      daysSince,
      traitRows,
      maxTraitExp,
      attrVals,
      maxAttr,
      balance,
      strongestPath,
      neglectedPath,
      expToNext,
      intoLevel: lf.intoLevel,
      needed: lf.needed,
      projected30,
      avgPerActiveDay,
    }
  }, [submissions, activeTraits, totalExp])

  // ---- locked teaser for non-Plus ----
  if (!plus) {
    return (
      <div className="mx-auto max-w-2xl">
        <PixelTitle>ADVANCED STATS</PixelTitle>
        <p className="mt-2 text-sm text-[var(--muted)]">
          A coach’s-eye read on your progress - consistency, momentum, Path balance, effort quality and
          a forward projection.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {['Consistency & streak history', 'Momentum (7-day trend)', 'Focus & Path balance', 'Effort quality / verification rate', 'Weekly rhythm', 'Level projection'].map(
            (t) => (
              <div key={t} className="rounded-xl border border-white/8 bg-white/[0.02] p-4 blur-[1.5px]">
                <div className="text-sm font-semibold text-white">{t}</div>
                <div className="mt-2 h-10 rounded bg-gradient-to-r from-cosmos-violet/20 to-cosmos-gold/20" />
              </div>
            ),
          )}
        </div>
        <Link
          to="/app/plus"
          className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-cosmos-gold/40 bg-gradient-to-r from-cosmos-gold/10 to-cosmos-violet/10 p-4 text-sm font-bold uppercase tracking-wider text-cosmos-gold transition hover:border-cosmos-gold/70"
        >
          ✦ Unlock Advanced Stats with Ascend Plus
        </Link>
      </div>
    )
  }

  const maxHeat = Math.max(1, ...s.heat.map((d) => d.n))
  const maxDow = Math.max(1, ...s.dow)

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <PixelTitle>ADVANCED STATS</PixelTitle>
        <div className="mt-2 flex items-center gap-2">
          <Pill tone="gold">✦ Ascend Plus</Pill>
          <span className="text-xs text-[var(--muted)]">Read on your last 14–30 days of verified effort.</span>
        </div>
      </div>

      {/* headline tiles */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile label="Current streak" value={`${streak}d`} sub={`best ${bestStreak}d`} />
        <Tile label="Active days / 30" value={`${s.activeDays30}`} sub={`${Math.round((s.activeDays30 / 30) * 100)}% of days`} />
        <Tile label="Verify rate" value={`${s.verifyRate}%`} sub={`${s.verifiedCount} verified · ${s.flaggedCount} flagged`} />
        <Tile label="Integrity" value={`${trust}`} sub={trust >= 80 ? 'rewards unlocked' : 'below 80'} tone={trust >= 80 ? 'good' : 'warn'} />
      </div>

      {/* consistency - 14-day heat strip */}
      <section className="panel p-5">
        <PixelTitle className="text-xs text-[var(--accent)]">CONSISTENCY · LAST 14 DAYS</PixelTitle>
        <div className="mt-4 flex items-end gap-1.5">
          {s.heat.map((d, i) => {
            const h = 8 + Math.round((d.n / maxHeat) * 40)
            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-sm"
                  style={{
                    height: h,
                    background:
                      d.n === 0 ? 'rgba(255,255,255,0.06)' : 'linear-gradient(to top,#a855f7,#22d3ee)',
                  }}
                  title={`${d.k}: ${d.n} verified`}
                />
              </div>
            )
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--muted)]">
          <span>This week: <strong className="text-white">{s.activeDays7}/7</strong> active days</span>
          <span>
            Momentum:{' '}
            <strong className={s.momentum >= 0 ? 'text-exp' : 'text-cosmos-magenta'}>
              {s.momentum >= 0 ? '▲' : '▼'} {Math.abs(s.momentum)}%
            </strong>{' '}
            ({s.last7} vs {s.prev7} last week)
          </span>
          {s.daysSince !== null && (
            <span>Last verified: <strong className="text-white">{s.daysSince === 0 ? 'today' : `${s.daysSince}d ago`}</strong></span>
          )}
        </div>
      </section>

      {/* focus & balance */}
      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <PixelTitle className="text-xs text-[var(--accent)]">FOCUS & PATH BALANCE</PixelTitle>
          <Pill tone={s.balance >= 60 ? 'exp' : 'amber'}>{s.balance}/100 balance</Pill>
        </div>
        <p className="mt-2 text-xs text-[var(--muted)]">
          {s.balance >= 60
            ? 'Well-rounded - you’re developing several Paths together.'
            : 'Specialised - most of your growth is in one Path. That’s fine for a sprint, but a neglected Path is where life quietly breaks.'}
        </p>
        <div className="mt-4 space-y-2">
          {s.attrVals.map((a) => (
            <div key={a.id} className="flex items-center gap-3">
              <span className="w-28 shrink-0 truncate text-xs" style={{ color: a.color }}>
                <Icon name={ATTR_ICON[a.id]} size={14} /> {a.path.replace('Path ', '')}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round((a.exp / s.maxAttr) * 100)}%`, background: a.color }}
                />
              </div>
              <span className="w-10 shrink-0 text-right font-pixel text-[10px] text-[var(--muted)]">{a.exp}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Strongest Path</div>
            <div className="flex items-center gap-1 font-semibold" style={{ color: s.strongestPath.color }}><Icon name={ATTR_ICON[s.strongestPath.id]} size={14} /> {s.strongestPath.name}</div>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/[0.02] p-2.5">
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">Most neglected</div>
            <div className="flex items-center gap-1 font-semibold" style={{ color: s.neglectedPath.color }}><Icon name={ATTR_ICON[s.neglectedPath.id]} size={14} /> {s.neglectedPath.name}</div>
          </div>
        </div>
      </section>

      {/* trait development */}
      <section className="panel p-5">
        <PixelTitle className="text-xs text-[var(--accent)]">TRAIT DEVELOPMENT</PixelTitle>
        <div className="mt-4 space-y-3">
          {s.traitRows.length === 0 && <p className="text-sm text-[var(--muted)]">No active traits yet.</p>}
          {s.traitRows.map((t) => {
            const attr = attributeById(t.attr as any)
            return (
              <div key={t.id}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white">
                    <Icon name={ATTR_ICON[attr.id]} size={14} /> {t.name}
                  </span>
                  <span className="font-pixel text-[10px] text-[var(--accent)]">Lv {t.level} · {t.exp} EXP</span>
                </div>
                <ExpBar pct={Math.round((t.exp / s.maxTraitExp) * 100)} height="h-2" showText={false} />
              </div>
            )
          })}
        </div>
      </section>

      {/* weekly rhythm */}
      <section className="panel p-5">
        <PixelTitle className="text-xs text-[var(--accent)]">WEEKLY RHYTHM</PixelTitle>
        <div className="mt-4 flex items-end justify-between gap-2">
          {s.dow.map((n, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
              <div className="flex h-24 w-full items-end">
                <div
                  className={`w-full rounded-t ${i === s.bestDow ? 'bg-cosmos-gold' : 'bg-cosmos-cyan/50'}`}
                  style={{ height: `${8 + Math.round((n / maxDow) * 90)}%` }}
                  title={`${n} verified on ${DOW[i]}`}
                />
              </div>
              <span className={`text-[10px] ${i === s.bestDow ? 'font-bold text-cosmos-gold' : 'text-[var(--muted)]'}`}>{DOW[i]}</span>
            </div>
          ))}
        </div>
        {s.bestDow !== null && (
          <p className="mt-3 text-xs text-[var(--muted)]">
            Your most productive day is <strong className="text-cosmos-gold">{DOW[s.bestDow]}</strong>. Avg{' '}
            <strong className="text-white">{s.avgPerActiveDay}</strong> quests per active day.
          </p>
        )}
      </section>

      {/* projection */}
      <section className="panel p-5">
        <PixelTitle className="text-xs text-[var(--accent)]">PROJECTION</PixelTitle>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Tile label="Level" value={`${level}`} sub={`${s.intoLevel}/${s.needed} EXP`} />
          <Tile label="To next level" value={`${s.expToNext}`} sub="EXP to go" />
          <Tile label="Next 30 days" value={`~${s.projected30}`} sub="quests at current pace" />
          <Tile label="Lifetime quests" value={`${lifetimeQuests}`} sub={`${questsThisMonth} this month`} />
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-lg border border-cosmos-cyan/20 bg-cosmos-cyan/5 p-3 text-xs text-[var(--muted)]">
          🧊 <span>You have <strong className="text-cosmos-cyan">{freezes}/{freezeCap(plus)}</strong> Streak Freezes banked - Plus lets you hold up to {freezeCap(true)}.</span>
        </div>
      </section>
    </div>
  )
}

function Tile({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone?: 'good' | 'warn'
}) {
  const color = tone === 'good' ? 'text-exp' : tone === 'warn' ? 'text-amber-300' : 'text-[var(--accent)]'
  return (
    <div className="panel p-3 text-center">
      <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{label}</div>
      <div className={`mt-1 font-pixel text-lg ${color}`}>{value}</div>
      {sub && <div className="text-[10px] text-[var(--muted)]">{sub}</div>}
    </div>
  )
}
