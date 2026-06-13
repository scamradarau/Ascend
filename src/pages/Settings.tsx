import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { useAuth } from '../store/auth'
import {
  COSMETIC_GROUPS,
  RARITY_COLOR,
  isUnlocked,
  unlockLabel,
  type CosmeticSlot,
} from '../data/cosmetics'
import { isOwnerEmail } from '../lib/supabase'
import { serverResetProgress } from '../store/serverVerify'
import { CLASSES, resolveClass, isClassUnlocked, nextClass } from '../data/classes'
import ClassAvatar from '../components/ClassAvatar'
import InviteButton, { BROCHURE_URL } from '../components/InviteButton'
import { PixelTitle, Pill } from '../components/ui'

// Helmet & skin are now driven by your CLASS (which evolves with rank), so the
// only equippable cosmetics here are auras and frames.
const SLOTS: { slot: CosmeticSlot; label: string; icon: string }[] = [
  { slot: 'aura', label: 'Aura', icon: '✨' },
  { slot: 'frame', label: 'Frame', icon: '🔆' },
]

export default function Settings() {
  const navigate = useNavigate()
  const theme = useGame((s) => s.theme)
  const setTheme = useGame((s) => s.setTheme)
  const profile = useGame((s) => s.profile)
  const resetAll = useGame((s) => s.resetAll)
  const avatar = useGame((s) => s.avatar)
  const setAvatar = useGame((s) => s.setAvatar)
  const classId = useGame((s) => s.classId)
  const setClassId = useGame((s) => s.setClassId)
  const setDevLevel = useGame((s) => s.setDevLevel)
  const streak = useGame((s) => s.streak)
  const earnedBadges = useGame((s) => s.earnedBadges)
  const purchased = useGame((s) => s.purchasedCosmetics)
  const ownerMode = useGame((s) => s.ownerMode)
  const toggleOwnerMode = useGame((s) => s.toggleOwnerMode)
  const reduceMotion = useGame((s) => s.reduceMotion)
  const toggleReduceMotion = useGame((s) => s.toggleReduceMotion)
  const soundEnabled = useGame((s) => s.soundEnabled)
  const toggleSound = useGame((s) => s.toggleSound)
  const authUser = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const { level } = usePlayerLevel()

  const [slot, setSlot] = useState<CosmeticSlot>('aura')
  const [sound, setSound] = useState(true)
  const [soundtrack, setSoundtrack] = useState<'mmo' | 'scifi'>('scifi')
  const [confirmReset, setConfirmReset] = useState(false)

  // Owner test account unlocks every cosmetic + class for testing.
  const isOwner = ownerMode && isOwnerEmail(authUser?.email)
  const ctx = { level, streak, badges: earnedBadges, purchased, owner: isOwner }
  const cls = resolveClass(level, classId, isOwner)
  const next = nextClass(level)

  const doReset = async () => {
    // server first — earned values live in profiles and would otherwise be
    // synced right back within one poll
    const r = await serverResetProgress()
    if (!r.ok) {
      alert(`Couldn’t reset on the server: ${r.error ?? 'unknown error'}. Nothing was changed.`)
      return
    }
    resetAll()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">SETTINGS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Customise your experience</h1>
      </div>

      {/* ---------------- CLASS & COSMETICS ---------------- */}
      <div className="panel hud-corner p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">CLASS &amp; COSMETICS</span>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Climb the ranks to unlock new classes, then wear whichever unlocked class you like. Auras
          and frames are yours to equip — unlock more via levels, badges, streaks or the Shop.
        </p>

        {/* class ladder — swap between any unlocked class */}
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {CLASSES.map((c) => {
            const unlocked = isClassUnlocked(c, level, isOwner)
            const active = cls.id === c.id
            return (
              <button
                key={c.id}
                disabled={!unlocked}
                onClick={() => unlocked && setClassId(c.id)}
                title={unlocked ? c.name : `Unlocks at Lv ${c.minLevel}`}
                className={`group relative rounded-xl border p-2 text-center transition ${
                  active ? 'shadow-glow' : unlocked ? 'hover:border-white/30' : 'opacity-45'
                }`}
                style={{ borderColor: active ? c.color : 'rgba(255,255,255,0.1)' }}
              >
                <div
                  className="mx-auto h-14 w-14 overflow-hidden rounded-full border bg-black/50"
                  style={{ borderColor: c.color }}
                >
                  <img
                    src={c.img}
                    alt={c.name}
                    className={`h-full w-full object-cover ${unlocked ? '' : 'grayscale'}`}
                    style={{ objectPosition: 'center 20%' }}
                  />
                </div>
                <div className="mt-1 truncate text-[10px] font-bold uppercase tracking-wide text-white">
                  {c.name}
                </div>
                <div className="text-[9px] uppercase tracking-wide text-[var(--muted)]">
                  {active ? '● Worn' : unlocked ? 'Tap to wear' : `🔒 Lv ${c.minLevel}`}
                </div>
              </button>
            )
          })}
        </div>

        {/* owner-only: jump to any level to test the ladder */}
        {isOwner && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-3 py-2">
            <span className="font-pixel text-[10px] text-cosmos-gold">OWNER · SET LEVEL</span>
            {[1, 15, 30, 45, 60, 80].map((lv) => (
              <button
                key={lv}
                onClick={() => setDevLevel(lv)}
                className={`rounded-md border px-2 py-1 text-[11px] font-bold transition ${
                  level === lv
                    ? 'border-cosmos-gold text-cosmos-gold'
                    : 'border-white/15 text-[var(--muted)] hover:border-cosmos-gold/60'
                }`}
              >
                Lv {lv}
              </button>
            ))}
            <input
              type="number"
              min={1}
              max={999}
              defaultValue={level}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setDevLevel(Number((e.target as HTMLInputElement).value) || 1)
              }}
              className="input ml-auto w-20 py-1 text-center text-xs"
              title="Type a level and press Enter"
            />
          </div>
        )}

        <div className="mt-5 grid gap-6 md:grid-cols-[280px_1fr]">
          {/* live preview + class info */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--edge)] bg-black/40 p-4 text-center">
            <ClassAvatar level={level} config={avatar} size={240} classId={classId} owner={isOwner} />
            <div className="mt-3 font-display text-lg font-bold" style={{ color: cls.color }}>
              {cls.name}
            </div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">
              {profile?.handle} · Lv {level}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[var(--muted)]">{cls.blurb}</p>
            {next ? (
              <div className="mt-3 w-full rounded-lg border border-[var(--edge)] bg-black/30 px-3 py-2 text-[11px] text-[var(--muted)]">
                Next class:{' '}
                <span className="font-bold" style={{ color: next.color }}>
                  {next.name}
                </span>{' '}
                at <span className="text-white">Lv {next.minLevel}</span>
              </div>
            ) : (
              <div className="mt-3 text-[11px] font-bold uppercase tracking-wider text-cosmos-gold">
                ★ Apex class reached
              </div>
            )}
          </div>

          {/* aura / frame picker */}
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s.slot}
                  onClick={() => setSlot(s.slot)}
                  className={`rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wide transition ${
                    slot === s.slot
                      ? 'border-[var(--accent)] text-[var(--accent)] shadow-glow'
                      : 'border-white/10 text-[var(--muted)] hover:border-white/25'
                  }`}
                >
                  {s.icon} {s.label}
                </button>
              ))}
            </div>

            <div className="grid max-h-[300px] gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
              {COSMETIC_GROUPS[slot].map((c) => {
                const unlocked = isUnlocked(c, ctx)
                const equipped = avatar[slot] === c.id
                const color = RARITY_COLOR[c.rarity]
                return (
                  <button
                    key={c.id}
                    disabled={!unlocked}
                    onClick={() => unlocked && setAvatar(slot, c.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      equipped
                        ? 'shadow-glow'
                        : unlocked
                          ? 'hover:border-white/30'
                          : 'opacity-55'
                    }`}
                    style={{ borderColor: equipped ? color : 'rgba(255,255,255,0.1)' }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-white">{c.name}</span>
                      <span
                        className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ color, border: `1px solid ${color}66` }}
                      >
                        {c.rarity}
                      </span>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--muted)]">{c.desc}</p>
                    <div className="mt-2 text-[10px] uppercase tracking-wide">
                      {equipped ? (
                        <span className="text-exp">● Equipped</span>
                      ) : unlocked ? (
                        <span className="text-[var(--accent)]">Tap to equip</span>
                      ) : (
                        <span className="text-[var(--muted)]">🔒 {unlockLabel(c)}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
            <button onClick={() => navigate('/app/shop')} className="btn btn-ghost mt-3 text-xs">
              🛒 Unlock more in the Shop →
            </button>
          </div>
        </div>
      </div>

      {/* ---------------- INVITE FRIENDS ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-cosmos-gold">INVITE FRIENDS</span>
        <p className="mt-1 text-xs text-[var(--muted)]">
          ASCEND is better with rivals. Share the link — they’ll land on a quick overview, then
          can create their own character and join the leaderboard.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <InviteButton />
          <a href={BROCHURE_URL} target="_blank" rel="noopener" className="btn btn-ghost text-xs">
            👀 Preview what they’ll see →
          </a>
        </div>
      </div>

      {/* ---------------- THEME ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">INTERFACE THEME</span>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              { id: 'cosmos', icon: '🌌', name: 'Cosmos', desc: 'Sci-fi / cosmic' },
              { id: 'rune', icon: '🌿', name: 'Rune', desc: 'Mystic fantasy realm' },
              { id: 'olympus', icon: '🏛️', name: 'Olympus', desc: 'Ancient Greece' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={`rounded-xl border p-5 text-left transition ${
                theme === t.id ? 'border-[var(--accent)] shadow-glow' : 'border-white/10 hover:border-white/25'
              }`}
            >
              <div className="text-2xl">{t.icon}</div>
              <div className="mt-2 font-display font-bold uppercase tracking-wide text-white">
                {t.name}
              </div>
              <div className="text-xs text-[var(--muted)]">{t.desc}</div>
              {theme === t.id && (
                <div className="mt-1">
                  <Pill tone="exp">Active</Pill>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- SOUND ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">SOUNDTRACK</span>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-200">Ambient sound</span>
          <button
            onClick={() => setSound((s) => !s)}
            className={`relative h-6 w-12 rounded-full transition ${sound ? 'bg-[var(--accent)]' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${sound ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {(['scifi', 'mmo'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSoundtrack(s)}
              className={`rounded-lg border p-3 text-sm transition ${
                soundtrack === s ? 'border-[var(--accent)] text-[var(--accent)]' : 'border-white/10 text-[var(--muted)]'
              }`}
            >
              {s === 'scifi' ? '🛸 Sci-Fi / Futuristic' : '🏰 MMO / Fantasy'}
            </button>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-[var(--muted)]">
          Audio packs are placeholders in this build — wire your own loops to enable playback.
        </p>
      </div>

      {/* ---------------- OWNER MODE (owner account only) ---------------- */}
      {isOwnerEmail(authUser?.email) && (
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-cosmos-gold">OWNER MODE</span>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-300">
            Unlock the owner dashboard — analytics, the verification review queue, and reward
            controls. (In production this is gated to admin accounts.)
          </span>
          <button
            onClick={toggleOwnerMode}
            className={`relative h-6 w-12 shrink-0 rounded-full transition ${ownerMode ? 'bg-cosmos-gold' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${ownerMode ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        {ownerMode && (
          <button onClick={() => navigate('/app/admin')} className="btn btn-primary mt-4 text-xs">
            Open Owner Dashboard →
          </button>
        )}
      </div>
      )}

      {/* ---------------- FEEDBACK ---------------- */}
      <div className="panel mt-5 flex flex-wrap items-center justify-between gap-4 p-6">
        <div>
          <span className="font-pixel text-xs text-[var(--accent)]">FEEDBACK</span>
          <p className="mt-1 text-sm text-slate-300">
            Found a bug or have an idea? We read everything — early players shape the game.
          </p>
        </div>
        <button onClick={() => navigate('/app/feedback')} className="btn btn-ghost shrink-0 text-xs">
          💬 Send feedback →
        </button>
      </div>

      {/* ---------------- ACCESSIBILITY ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">SOUND &amp; ACCESSIBILITY</span>
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">Sound effects</span> — chiptune cues when you
            submit and complete quests, level up and slay challenge bosses.
          </span>
          <button
            onClick={toggleSound}
            aria-label="Toggle sound effects"
            className={`relative h-6 w-12 shrink-0 rounded-full transition ${soundEnabled ? 'bg-[var(--accent)]' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${soundEnabled ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between gap-4 border-t border-white/5 pt-4">
          <span className="text-sm text-slate-300">
            <span className="font-semibold text-white">Reduce motion</span> — turn off animated
            backgrounds, glows and transitions. (Your device’s system setting is always respected
            automatically.)
          </span>
          <button
            onClick={toggleReduceMotion}
            className={`relative h-6 w-12 shrink-0 rounded-full transition ${reduceMotion ? 'bg-[var(--accent)]' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${reduceMotion ? 'left-6' : 'left-0.5'}`} />
          </button>
        </div>
      </div>

      {/* ---------------- PROFILE / DATA ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">PROFILE &amp; DATA</span>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          {[
            ['Handle', profile?.handle ?? '—'],
            ['Age', String(profile?.age || '—')],
            ['Region', profile?.region ?? '—'],
            ['Level', String(level)],
          ].map(([k, v]) => (
            <div key={k} className="rounded-lg border border-white/8 bg-white/[0.02] p-3">
              <div className="text-[10px] uppercase tracking-widest text-[var(--muted)]">{k}</div>
              <div className="font-bold text-white">{v}</div>
            </div>
          ))}
        </div>
        {authUser && (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/8 bg-white/[0.02] p-3">
            <div className="text-sm">
              <span className="text-[var(--muted)]">Signed in as </span>
              <span className="font-bold text-white">{authUser.username}</span>
            </div>
            <button
              onClick={() => {
                logout()
                navigate('/')
              }}
              className="btn btn-ghost text-xs"
            >
              Log out
            </button>
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button onClick={() => navigate('/onboarding')} className="btn btn-ghost">
            ↻ Re-run onboarding
          </button>
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="btn btn-ghost border-cosmos-magenta/50 text-cosmos-magenta"
            >
              ⚠ Reset all progress
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-cosmos-magenta">This wipes your save. Sure?</span>
              <button onClick={doReset} className="btn btn-primary text-xs">
                Yes, reset
              </button>
              <button onClick={() => setConfirmReset(false)} className="btn btn-ghost text-xs">
                Cancel
              </button>
            </div>
          )}
        </div>
        <p className="mt-3 text-[10px] text-[var(--muted)]">
          Your save lives locally in this browser (localStorage). No account required for this build.
        </p>
      </div>
    </div>
  )
}
