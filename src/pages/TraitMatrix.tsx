import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { ATTRIBUTES, attributeById } from '../data/attributes'
import { TRAITS, traitById } from '../data/traits'
import type { AttributeId } from '../data/types'
import { PixelTitle, Pill, Modal } from '../components/ui'
import { maxActiveTraits } from '../data/plus'

// ================================================================
// MAIN QUESTS — decluttered: first you choose a Path (5 cards), then
// you see only that Path's quests. Deep-linkable via ?path=<attr> so
// the World Map regions land straight on their own quest list.
// ================================================================

export default function TraitMatrix() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const activeTraits = useGame((s) => s.activeTraits)
  const plus = useGame((s) => s.plus)
  const dropTrait = useGame((s) => s.dropTrait)
  const activeIds = new Set(activeTraits.map((t) => t.id))
  const traitCap = maxActiveTraits(plus)
  const slotsLeft = traitCap - activeTraits.length
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null)
  const dropping = confirmDrop ? traitById(confirmDrop) : null

  const pathParam = params.get('path') as AttributeId | null
  const attr = pathParam ? ATTRIBUTES.find((a) => a.id === pathParam) : undefined

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <PixelTitle className="text-xs text-[var(--accent)]">MAIN QUESTS</PixelTitle>
          <h1 className="mt-2 font-display text-2xl font-bold text-white">
            {attr ? attr.path : 'Choose your path'}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--muted)]">
            {attr
              ? attr.blurb
              : `Five great paths, each with quests to master. You can walk ${traitCap} quests at a time — focus beats scatter.`}
          </p>
        </div>
        <Pill tone={slotsLeft > 0 ? 'exp' : 'gold'}>
          {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} open` : 'All slots full'}
        </Pill>
      </div>

      {/* your current build — always visible, wherever you are */}
      {activeTraits.length > 0 && (
        <div className="panel mb-6 p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]">
              Building now
            </span>
            <span className="text-[10px] text-[var(--muted)]">tap ✕ to drop · EXP is kept</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {activeTraits.map((at) => {
              const t = traitById(at.id)
              if (!t) return null
              const a = attributeById(t.attribute)
              const locked = at.mainQuestProgress > 0 || at.mainQuestDone
              return (
                <div
                  key={at.id}
                  className="flex items-center gap-1 rounded-lg border pl-3 pr-1.5 transition hover:-translate-y-0.5"
                  style={{ borderColor: `${a.color}66` }}
                >
                  <button
                    onClick={() => navigate(`/app/traits/${at.id}`)}
                    className="flex items-center gap-2 py-1.5 text-sm font-semibold text-white"
                  >
                    <span>{a.icon}</span> {t.name}
                    {at.mainQuestDone && <span className="text-exp">✓</span>}
                  </button>
                  <button
                    onClick={() => !locked && setConfirmDrop(at.id)}
                    disabled={locked}
                    title={
                      locked
                        ? 'Committed — finish or reset the main quest before dropping'
                        : `Drop ${t.name}`
                    }
                    aria-label={locked ? 'Trait committed' : `Drop ${t.name}`}
                    className={`flex h-6 w-6 items-center justify-center rounded text-xs ${
                      locked
                        ? 'cursor-not-allowed text-[var(--muted)]/60'
                        : 'text-[var(--muted)] hover:bg-cosmos-magenta/15 hover:text-cosmos-magenta'
                    }`}
                  >
                    {locked ? '🔒' : '✕'}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* drop confirmation */}
      {dropping && (
        <Modal open onClose={() => setConfirmDrop(null)} title="Drop this trait?">
          <p className="text-sm leading-relaxed text-slate-300">
            Drop <span className="font-bold text-white">{dropping.name}</span>? This frees a build
            slot. Your earned trait EXP is <span className="text-exp">kept</span> — re-add it any
            time and it picks up exactly where it left off.
          </p>
          <div className="mt-5 flex gap-2">
            <button onClick={() => setConfirmDrop(null)} className="btn btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                if (confirmDrop) dropTrait(confirmDrop)
                setConfirmDrop(null)
              }}
              className="btn flex-1 border border-cosmos-magenta/50 bg-cosmos-magenta/15 text-cosmos-magenta hover:bg-cosmos-magenta/25"
            >
              Drop trait
            </button>
          </div>
        </Modal>
      )}

      {!attr ? (
        /* ---------------- PATH PICKER (uncluttered home view) ---------------- */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ATTRIBUTES.map((a) => {
            const pathTraits = TRAITS.filter((t) => t.attribute === a.id)
            const buildingHere = pathTraits.filter((t) => activeIds.has(t.id)).length
            return (
              <button
                key={a.id}
                onClick={() => setParams({ path: a.id })}
                className="group relative overflow-hidden rounded-2xl border border-white/8 bg-white/[0.02] p-6 text-left transition-all hover:-translate-y-1 hover:border-white/25"
              >
                <div
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-2xl transition-opacity group-hover:opacity-40"
                  style={{ background: a.color }}
                />
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border text-2xl"
                  style={{ borderColor: a.color, boxShadow: `0 0 16px ${a.color}55` }}
                >
                  {a.icon}
                </div>
                <h2 className="mt-4 font-display text-lg font-bold uppercase tracking-wide text-white">
                  {a.path}
                </h2>
                <p className="mt-1 text-xs text-[var(--muted)]">{a.blurb}</p>
                <div className="mt-4 flex items-center gap-2 text-[11px]">
                  <span className="rounded-full border border-white/15 px-2 py-0.5 text-[var(--muted)]">
                    {pathTraits.length} quests
                  </span>
                  {buildingHere > 0 && (
                    <span
                      className="rounded-full border px-2 py-0.5 font-semibold"
                      style={{ borderColor: `${a.color}66`, color: a.color }}
                    >
                      {buildingHere} building
                    </span>
                  )}
                  <span className="ml-auto text-[var(--accent)] opacity-0 transition-opacity group-hover:opacity-100">
                    Enter →
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      ) : (
        /* ---------------- ONE PATH'S QUESTS ---------------- */
        <div>
          <button
            onClick={() => setParams({})}
            className="mb-4 text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white"
          >
            ← All paths
          </button>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {TRAITS.filter((t) => t.attribute === attr.id).map((t) => {
              const active = activeIds.has(t.id)
              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/app/traits/${t.id}`)}
                  className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 ${
                    active
                      ? 'border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_10%,transparent)] shadow-glow'
                      : 'border-white/8 bg-white/[0.02] hover:border-white/25'
                  }`}
                >
                  <div
                    className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-30 blur-xl"
                    style={{ background: attr.color }}
                  />
                  <div className="flex items-start justify-between">
                    <span className="font-display text-base font-bold text-white">{t.name}</span>
                    {active && <span className="text-xs text-[var(--accent)]">●</span>}
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-[var(--muted)]">{t.tagline}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <Pill tone={t.tier === 'low' ? 'exp' : t.tier === 'mid' ? 'default' : 'violet'}>
                      {t.tier}
                    </Pill>
                    {active && <Pill tone="gold">Building</Pill>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
