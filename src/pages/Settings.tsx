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
import Avatar from '../components/Avatar'
import InviteButton, { BROCHURE_URL } from '../components/InviteButton'
import { PixelTitle, Pill } from '../components/ui'

const SLOTS: { slot: CosmeticSlot; label: string; icon: string }[] = [
  { slot: 'helmet', label: 'Helmet', icon: '⛑️' },
  { slot: 'aura', label: 'Aura', icon: '✨' },
  { slot: 'frame', label: 'Frame', icon: '🔆' },
  { slot: 'skin', label: 'Energy Core', icon: '🔷' },
]

export default function Settings() {
  const navigate = useNavigate()
  const theme = useGame((s) => s.theme)
  const setTheme = useGame((s) => s.setTheme)
  const profile = useGame((s) => s.profile)
  const resetAll = useGame((s) => s.resetAll)
  const avatar = useGame((s) => s.avatar)
  const setAvatar = useGame((s) => s.setAvatar)
  const streak = useGame((s) => s.streak)
  const earnedBadges = useGame((s) => s.earnedBadges)
  const purchased = useGame((s) => s.purchasedCosmetics)
  const ownerMode = useGame((s) => s.ownerMode)
  const toggleOwnerMode = useGame((s) => s.toggleOwnerMode)
  const reduceMotion = useGame((s) => s.reduceMotion)
  const toggleReduceMotion = useGame((s) => s.toggleReduceMotion)
  const authUser = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const { level } = usePlayerLevel()

  const [slot, setSlot] = useState<CosmeticSlot>('helmet')
  const [sound, setSound] = useState(true)
  const [soundtrack, setSoundtrack] = useState<'mmo' | 'scifi'>('scifi')
  const [confirmReset, setConfirmReset] = useState(false)

  // Owner test account unlocks every cosmetic for testing.
  const isOwner = ownerMode && isOwnerEmail(authUser?.email)
  const ctx = { level, streak, badges: earnedBadges, purchased, owner: isOwner }

  const doReset = () => {
    resetAll()
    navigate('/')
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <PixelTitle className="text-xs text-[var(--accent)]">SETTINGS</PixelTitle>
        <h1 className="mt-2 font-display text-2xl font-bold text-white">Customise your experience</h1>
      </div>

      {/* ---------------- AVATAR FORGE ---------------- */}
      <div className="panel hud-corner p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">AVATAR FORGE</span>
        <p className="mt-1 text-xs text-[var(--muted)]">
          Your look evolves with achievement. Helmets upgrade as you rank up; auras, frames and cores
          unlock via levels, badges, streaks or the Shop. Cycle back any time.
        </p>

        <div className="mt-5 grid gap-6 md:grid-cols-[280px_1fr]">
          {/* live preview */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--edge)] bg-black/40 p-4">
            <Avatar config={avatar} size={240} />
            <div className="mt-2 text-center text-xs uppercase tracking-widest text-[var(--muted)]">
              {profile?.handle} · Lv {level}
            </div>
          </div>

          {/* slot picker */}
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

      {/* ---------------- ACCESSIBILITY ---------------- */}
      <div className="panel mt-5 p-6">
        <span className="font-pixel text-xs text-[var(--accent)]">ACCESSIBILITY</span>
        <div className="mt-4 flex items-center justify-between gap-4">
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
