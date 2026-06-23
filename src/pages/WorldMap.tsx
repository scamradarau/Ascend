import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { ATTRIBUTES } from '../data/attributes'
import { TRAITS, traitById } from '../data/traits'
import { CHALLENGES, periodKeyFor } from '../data/challenges'
import { levelFromTotalExp } from '../data/leveling'
import type { AttributeId } from '../data/types'
import ClassAvatar from '../components/ClassAvatar'
import ResetCountdown from '../components/ResetCountdown'
import { PixelTitle, Pill, ExpBar } from '../components/ui'
import Icon, { ATTR_ICON } from '../components/Icon'

// ================================================================
// THE WORLD - your ascent, made visible. The five Paths are literal
// regions of the realm; each region's light grows with the REAL trait
// EXP you've verified inside it. Monthly challenges are the region
// bosses; weeklies are roaming mini-bosses. Nothing here is play-
// pretend: every glow on this map was earned through proof.
// ================================================================

// deterministic organic blob (no randomness - stable between renders)
function blobPath(cx: number, cy: number, r: number, mult: number[]): string {
  const pts = mult.map((m, i) => {
    const a = (i / mult.length) * Math.PI * 2 - Math.PI / 2
    return [cx + Math.cos(a) * r * m, cy + Math.sin(a) * r * m] as const
  })
  let d = `M ${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length; i++) {
    const p1 = pts[(i + 1) % pts.length]
    const p0 = pts[i]
    const mx = (p0[0] + p1[0]) / 2
    const my = (p0[1] + p1[1]) / 2
    d += ` Q ${p0[0]} ${p0[1]} ${mx} ${my}`
  }
  return d + ' Z'
}

const REGIONS: Record<AttributeId, { cx: number; cy: number; r: number; mult: number[] }> = {
  mind:     { cx: 230, cy: 140, r: 110, mult: [1, 0.82, 1.08, 0.9, 1.05, 0.8, 1.1, 0.92] },
  will:     { cx: 760, cy: 130, r: 115, mult: [0.9, 1.1, 0.85, 1.05, 0.95, 1.12, 0.8, 1] },
  heart:    { cx: 495, cy: 300, r: 100, mult: [1.05, 0.85, 1.1, 0.95, 1.08, 0.82, 1, 0.9] },
  charisma: { cx: 215, cy: 450, r: 105, mult: [0.88, 1.08, 0.92, 1.1, 0.85, 1.02, 0.95, 1.06] },
  body:     { cx: 770, cy: 460, r: 118, mult: [1.1, 0.9, 1.04, 0.84, 1.08, 0.95, 1.06, 0.86] },
}

// dotted travel routes between neighbouring regions
const ROUTES: [AttributeId, AttributeId][] = [
  ['mind', 'will'],
  ['mind', 'heart'],
  ['will', 'heart'],
  ['heart', 'charisma'],
  ['heart', 'body'],
  ['charisma', 'body'],
]

export default function WorldMap() {
  const navigate = useNavigate()
  const activeTraits = useGame((s) => s.activeTraits)
  const archivedTraits = useGame((s) => s.archivedTraits)
  const completedQuests = useGame((s) => s.completedQuests)
  const challenges = useGame((s) => s.challenges)
  const avatar = useGame((s) => s.avatar)
  const classId = useGame((s) => s.classId)
  const { level } = usePlayerLevel()

  // real, verified EXP per attribute → region levels
  const regionStats = useMemo(() => {
    const exp: Record<AttributeId, number> = { mind: 0, will: 0, heart: 0, charisma: 0, body: 0 }
    for (const at of activeTraits) {
      const t = traitById(at.id)
      if (t) exp[t.attribute] += at.exp
    }
    for (const [id, saved] of Object.entries(archivedTraits)) {
      const t = traitById(id)
      if (t) exp[t.attribute] += saved.exp
    }
    const conquered: Record<AttributeId, number> = { mind: 0, will: 0, heart: 0, charisma: 0, body: 0 }
    for (const q of completedQuests) {
      const t = traitById(q.traitId)
      if (t) conquered[t.attribute] += 1
    }
    return ATTRIBUTES.map((a) => {
      const lv = levelFromTotalExp(exp[a.id])
      const questsInRegion = TRAITS.filter((t) => t.attribute === a.id).length
      return {
        attr: a,
        exp: exp[a.id],
        level: lv.level,
        pct: lv.pct,
        conquered: conquered[a.id],
        questsInRegion,
        explored: exp[a.id] > 0,
      }
    })
  }, [activeTraits, archivedTraits, completedQuests])

  // you stand in the region you've pushed furthest
  const hereId = useMemo(() => {
    const best = [...regionStats].sort((x, y) => y.exp - x.exp)[0]
    return best && best.exp > 0 ? best.attr.id : 'mind'
  }, [regionStats])

  const bossState = (id: string, scope: 'weekly' | 'monthly', target: number) => {
    const st = challenges[id]
    const count = st && st.period === periodKeyFor(scope) ? st.count : 0
    const done = Boolean(st && st.period === periodKeyFor(scope) && st.done)
    return { count, done, hpPct: Math.max(0, Math.round((1 - count / target) * 100)) }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">THE WORLD</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">Your ascent, made visible</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            The five Paths are regions of the realm. Every glow you see here was earned with
            verified quests - the map only lights up where you’ve actually done the work.
          </p>
        </div>
        <Pill tone="gold">Lv {level} · standing in {ATTRIBUTES.find((a) => a.id === hereId)?.path}</Pill>
      </div>

      {/* ---------------- THE MAP ---------------- */}
      <div className="panel hud-corner relative overflow-hidden p-2">
        <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
        <svg viewBox="0 0 1000 600" className="w-full" role="img" aria-label="World map of the five Paths">
          <defs>
            {regionStats.map(({ attr }) => (
              <radialGradient key={attr.id} id={`glow-${attr.id}`} cx="50%" cy="50%" r="65%">
                <stop offset="0%" stopColor={attr.color} stopOpacity="0.5" />
                <stop offset="70%" stopColor={attr.color} stopOpacity="0.16" />
                <stop offset="100%" stopColor={attr.color} stopOpacity="0.04" />
              </radialGradient>
            ))}
          </defs>

          {/* travel routes */}
          {ROUTES.map(([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={REGIONS[a].cx}
              y1={REGIONS[a].cy}
              x2={REGIONS[b].cx}
              y2={REGIONS[b].cy}
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="1.5"
              strokeDasharray="3 7"
            />
          ))}

          {/* regions */}
          {regionStats.map(({ attr, level: rl, explored, conquered, questsInRegion }) => {
            const g = REGIONS[attr.id]
            const isHere = attr.id === hereId
            return (
              <g
                key={attr.id}
                className="cursor-pointer transition-opacity hover:opacity-100"
                opacity={explored ? 1 : 0.45}
                onClick={() => navigate(`/app/traits?path=${attr.id}`)}
              >
                <path
                  d={blobPath(g.cx, g.cy, g.r, g.mult)}
                  fill={`url(#glow-${attr.id})`}
                  stroke={attr.color}
                  strokeOpacity={explored ? 0.8 : 0.3}
                  strokeWidth={isHere ? 2.5 : 1.5}
                />
                {/* region label */}
                <text
                  x={g.cx}
                  y={g.cy - 14}
                  textAnchor="middle"
                  className="font-display"
                  fill="#fff"
                  fontSize="19"
                  fontWeight="800"
                  style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
                >
                  {attr.path}
                </text>
                <text x={g.cx} y={g.cy + 10} textAnchor="middle" fill={attr.color} fontSize="13" fontWeight="700">
                  {explored ? `Region Lv ${rl}` : 'Unexplored'}
                </text>
                <text x={g.cx} y={g.cy + 30} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="11">
                  {conquered}/{questsInRegion} quests conquered
                </text>
                <image
                  href={`/icons/${ATTR_ICON[attr.id]}.png`}
                  x={g.cx - 14}
                  y={g.cy + 40}
                  width="28"
                  height="28"
                />
              </g>
            )
          })}

          {/* "you are here" beacon */}
          <g pointerEvents="none">
            <circle
              cx={REGIONS[hereId].cx}
              cy={REGIONS[hereId].cy - 64}
              r="7"
              fill="var(--accent)"
              opacity="0.9"
            >
              <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.9;0.4;0.9" dur="2.4s" repeatCount="indefinite" />
            </circle>
          </g>
        </svg>

        {/* avatar chip pinned over the map */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl border border-[var(--edge)] bg-black/60 px-3 py-2 backdrop-blur">
          <ClassAvatar level={level} config={avatar} size={36} classId={classId} animated={false} />
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">You are here</div>
            <div className="font-display text-sm font-bold text-white">
              {ATTRIBUTES.find((a) => a.id === hereId)?.path}
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- REGION LEDGER ---------------- */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {regionStats.map(({ attr, level: rl, pct, explored }) => (
          <button
            key={attr.id}
            onClick={() => navigate(`/app/traits?path=${attr.id}`)}
            className="panel p-4 text-left transition hover:-translate-y-0.5"
            style={{ borderColor: explored ? `${attr.color}55` : undefined }}
          >
            <div className="flex items-center gap-2">
              <Icon name={ATTR_ICON[attr.id]} size={18} />
              <span className="text-[11px] font-bold uppercase tracking-wide text-white">{attr.path}</span>
            </div>
            <div className="mt-2">
              <ExpBar pct={explored ? pct : 0} height="h-1.5" showText={false} />
            </div>
            <div className="mt-1.5 text-[10px] uppercase tracking-widest" style={{ color: attr.color }}>
              {explored ? `Region Lv ${rl}` : 'Unexplored'}
            </div>
          </button>
        ))}
      </div>

      {/* ---------------- BOSS FIGHTS ---------------- */}
      {(
        [
          ['monthly', '👹 REGION BOSSES', 'Slay one per month - every verified log is a strike. Land the final blow before the reset to claim the full bounty.'],
          ['weekly', '🐺 ROAMING MINI-BOSSES', 'Fresh prey every week. Same rules: one strike per day, bounty on the kill.'],
        ] as const
      ).map(([scope, heading, blurb]) => (
        <div key={scope} className="mt-8">
          <div className="mb-1 flex items-center justify-between">
            <span className="font-pixel text-xs text-cosmos-gold glow-text">{heading}</span>
            <Pill tone="gold">
              <ResetCountdown scope={scope} />
            </Pill>
          </div>
          <p className="mb-3 text-[11px] text-[var(--muted)]">{blurb}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CHALLENGES.filter((c) => c.scope === scope).map((c) => {
              const b = bossState(c.id, scope, c.target)
              return (
                <div
                  key={c.id}
                  className={`panel relative overflow-hidden p-4 ${b.done ? 'border-cosmos-gold/50 shadow-glow-gold' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/40 text-2xl">
                      {b.done ? '💀' : c.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-bold text-white">{c.title}</div>
                      <div className="text-[11px] text-[var(--muted)]">{c.desc}</div>
                    </div>
                  </div>
                  {/* boss HP bar - drains as your verified logs land */}
                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest">
                      <span className="text-cosmos-magenta">Boss HP</span>
                      <span className="text-[var(--muted)]">
                        {b.done ? 'SLAIN' : `${c.target - b.count}/${c.target} strikes left`}
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-red-600 to-cosmos-magenta transition-all"
                        style={{ width: `${b.hpPct}%` }}
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[11px] text-cosmos-gold">
                      Bounty: +{c.exp} EXP · ◈ {c.aether}
                    </span>
                    <button
                      onClick={() => navigate('/app/quests')}
                      disabled={b.done}
                      className="btn btn-ghost text-[11px]"
                    >
                      {b.done ? '✓ Slain' : '⚔ Engage'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
