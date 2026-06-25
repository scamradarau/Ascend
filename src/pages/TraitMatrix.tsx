import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { ATTRIBUTES, attributeById } from '../data/attributes'
import { traitById } from '../data/traits'
import type { AttributeId } from '../data/types'
import { PixelTitle, Pill, Modal } from '../components/ui'
import { maxActiveTraits } from '../data/plus'
import PlusUpsell from '../components/PlusUpsell'
import Icon, { ATTR_ICON } from '../components/Icon'
import QuestConstellation from '../components/QuestConstellation'

// ================================================================
// MAIN QUESTS - decluttered: first you choose a Path (5 cards), then
// you see only that Path's quests. Deep-linkable via ?path=<attr> so
// the World Map regions land straight on their own quest list.
// ================================================================

export default function TraitMatrix() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const activeTraits = useGame((s) => s.activeTraits)
  const plus = useGame((s) => s.plus)
  const dropTrait = useGame((s) => s.dropTrait)
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
              : `Five great paths, each with quests to master. You can walk ${traitCap} quests at a time - focus beats scatter.`}
          </p>
        </div>
        <Pill tone={slotsLeft > 0 ? 'exp' : 'gold'}>
          {slotsLeft > 0 ? `${slotsLeft} slot${slotsLeft > 1 ? 's' : ''} open` : 'All slots full'}
        </Pill>
      </div>

      {/* your current build - always visible, wherever you are */}
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
                    <Icon name={ATTR_ICON[a.id]} size={16} /> {t.name}
                    {at.mainQuestDone && <span className="text-exp">✓</span>}
                  </button>
                  <button
                    onClick={() => !locked && setConfirmDrop(at.id)}
                    disabled={locked}
                    title={
                      locked
                        ? 'Committed - finish or reset the main quest before dropping'
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

      {/* hit the cap? offer more slots (non-Plus only) */}
      {slotsLeft <= 0 && <PlusUpsell className="mb-6" />}

      {/* drop confirmation */}
      {dropping && (
        <Modal open onClose={() => setConfirmDrop(null)} title="Drop this trait?">
          <p className="text-sm leading-relaxed text-slate-300">
            Drop <span className="font-bold text-white">{dropping.name}</span>? This frees a build
            slot. Your earned trait EXP is <span className="text-exp">kept</span> - re-add it any
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

      <p className="mb-2 text-center text-[11px] text-[var(--muted)]">
        {attr
          ? 'Tap a quest to begin it · tap your character to zoom out'
          : 'Tap a Path to reveal its quests'}
      </p>
      <QuestConstellation
        expandedId={pathParam}
        onPath={(id) => setParams({ path: id })}
        onTrait={(id) => navigate(`/app/traits/${id}`)}
        onCollapse={() => setParams({})}
      />
    </div>
  )
}
