import { useGame, usePlayerLevel } from '../store/useGame'
import { ATTRIBUTES } from '../data/attributes'
import { TRAITS, traitById } from '../data/traits'
import type { AttributeId } from '../data/types'
import Icon, { ATTR_ICON } from './Icon'
import ClassAvatar from './ClassAvatar'

// ================================================================
// QuestConstellation - the Main Quests map as a radial skill tree.
//   avatar core  ->  5 Path nodes  ->  (click) traits fan out  ->
//   (click a trait) opens its quest. Built with % polar positions and
//   an SVG line layer; animation kept light so it's smooth on phones.
// ================================================================
const R_PATH = 33 // path-node radius (% of half-size)
const R_TRAIT = 47 // trait-node radius

export default function QuestConstellation({
  expandedId,
  onPath,
  onTrait,
  onCollapse,
}: {
  expandedId: AttributeId | null
  onPath: (id: AttributeId) => void
  onTrait: (id: string) => void
  onCollapse: () => void
}) {
  const activeTraits = useGame((s) => s.activeTraits)
  const avatar = useGame((s) => s.avatar)
  const classId = useGame((s) => s.classId)
  const { level } = usePlayerLevel()
  const activeMap = new Map(activeTraits.map((t) => [t.id, t]))

  const polar = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180
    return { x: 50 + r * Math.cos(a), y: 50 + r * Math.sin(a) }
  }

  const PATHS = ATTRIBUTES.map((a, i) => {
    const deg = -90 + i * (360 / ATTRIBUTES.length)
    return { a, deg, ...polar(deg, R_PATH) }
  })
  const expanded = expandedId ? PATHS.find((p) => p.a.id === expandedId) ?? null : null

  const eTraits = expanded ? TRAITS.filter((t) => t.attribute === expanded.a.id) : []
  const span = Math.min(170, Math.max(50, eTraits.length * 20))
  const tNodes = eTraits.map((t, i) => {
    const deg = expanded!.deg + (eTraits.length > 1 ? -span / 2 + i * (span / (eTraits.length - 1)) : 0)
    return { t, ...polar(deg, R_TRAIT) }
  })

  const buildingIn = (id: AttributeId) =>
    activeTraits.filter((at) => traitById(at.id)?.attribute === id).length

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[660px] select-none">
      {/* connector lines */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
        {PATHS.map((p) => (
          <line
            key={p.a.id}
            x1="50"
            y1="50"
            x2={p.x}
            y2={p.y}
            stroke={expanded && expanded.a.id !== p.a.id ? 'rgba(255,255,255,0.05)' : `${p.a.color}55`}
            strokeWidth="0.4"
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {expanded &&
          tNodes.map((n) => (
            <line
              key={n.t.id}
              x1={expanded.x}
              y1={expanded.y}
              x2={n.x}
              y2={n.y}
              stroke={`${expanded.a.color}55`}
              strokeWidth="0.3"
              vectorEffect="non-scaling-stroke"
            />
          ))}
      </svg>

      {/* center: the player's avatar */}
      <button
        onClick={onCollapse}
        title={expanded ? 'Back to all paths' : 'Your character'}
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 transition hover:scale-105"
        style={{ width: 116, height: 116 }}
      >
        <ClassAvatar level={level} config={avatar} classId={classId} size={116} animated={false} />
      </button>

      {/* path nodes */}
      {PATHS.map((p) => {
        const dim = expanded && expanded.a.id !== p.a.id
        const isOpen = expanded?.a.id === p.a.id
        const building = buildingIn(p.a.id)
        return (
          <div
            key={p.a.id}
            className="absolute z-10 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
            style={{ left: `${p.x}%`, top: `${p.y}%`, opacity: dim ? 0.32 : 1 }}
          >
            <button
              onClick={() => onPath(p.a.id)}
              className="group flex flex-col items-center gap-1"
              title={p.a.path}
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-full border-2 bg-[#070a18]/80 backdrop-blur transition group-hover:scale-110"
                style={{
                  borderColor: p.a.color,
                  boxShadow: `0 0 ${isOpen ? 26 : 16}px ${p.a.color}${isOpen ? '99' : '66'}`,
                }}
              >
                <Icon name={ATTR_ICON[p.a.id]} size={30} />
              </span>
              <span className="font-display text-[10px] font-bold uppercase tracking-wide text-white">
                {p.a.name}
              </span>
              {building > 0 && (
                <span
                  className="rounded-full px-1.5 text-[9px] font-bold"
                  style={{ background: `${p.a.color}22`, color: p.a.color }}
                >
                  {building} building
                </span>
              )}
            </button>
          </div>
        )
      })}

      {/* trait nodes (only for the open path) */}
      {expanded &&
        tNodes.map((n, i) => {
          const at = activeMap.get(n.t.id)
          const done = at?.mainQuestDone
          const active = !!at
          const c = expanded.a.color
          return (
            <button
              key={n.t.id}
              onClick={() => onTrait(n.t.id)}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1 transition hover:scale-110"
              style={{ left: `${n.x}%`, top: `${n.y}%`, animation: 'fadeIn .3s ease backwards' }}
              title={n.t.name}
            >
              <span
                className="flex h-9 w-9 items-center justify-center rounded-full border text-[11px]"
                style={{
                  borderColor: active ? c : 'rgba(255,255,255,0.22)',
                  boxShadow: active ? `0 0 12px ${c}88` : `inset 0 0 9px ${c}26`,
                  background: `radial-gradient(circle at 50% 36%, ${c}26, #070a18 72%)`,
                  color: c,
                }}
              >
                {done ? (
                  '✓'
                ) : active ? (
                  '●'
                ) : (
                  <span
                    className="q-twinkle"
                    style={{
                      animationDelay: `${(i % 6) * 0.5}s`,
                      opacity: 0.75,
                      textShadow: `0 0 6px ${c}aa`,
                    }}
                  >
                    ✦
                  </span>
                )}
              </span>
              <span className="max-w-[84px] text-center text-[9px] font-semibold leading-tight text-white/90">
                {n.t.name}
              </span>
            </button>
          )
        })}
    </div>
  )
}
