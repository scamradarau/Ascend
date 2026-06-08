import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { useAuth } from '../store/auth'
import { rankForLevel } from '../data/ranks'
import { resolveClass } from '../data/classes'
import { useSocial, selectPendingCount, selectUnreadCount } from '../store/social'
import { isOwnerEmail } from '../lib/supabase'
import { PixelTitle } from './ui'
import ThemeBackground from './ThemeBackground'

const NAV = [
  { to: '/app/character', label: 'Character', icon: '🧬' },
  { to: '/app/traits', label: 'Traits', icon: '🧠' },
  { to: '/app/quests', label: 'Quests', icon: '📜' },
  { to: '/app/journal', label: 'Journal', icon: '📓' },
  { to: '/app/leaderboards', label: 'Leaderboard', icon: '🏆' },
  { to: '/app/inventory', label: 'Inventory', icon: '🎒' },
  { to: '/app/shop', label: 'Shop', icon: '🛒' },
  { to: '/app/guild', label: 'Guild', icon: '🛡️' },
  { to: '/app/friends', label: 'Friends', icon: '👥' },
  { to: '/app/notifications', label: 'Alerts', icon: '🔔' },
  { to: '/app/messages', label: 'Messages', icon: '✉️' },
  { to: '/app/stoic', label: 'The Stoic', icon: '🏛️' },
  { to: '/app/guide', label: 'Codex', icon: '📖' },
  { to: '/app/feedback', label: 'Feedback', icon: '💬' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
]

export default function PlatformLayout() {
  const theme = useGame((s) => s.theme)
  const profile = useGame((s) => s.profile)
  const streak = useGame((s) => s.streak)
  const aether = useGame((s) => s.aether)
  const trust = useGame((s) => s.trust)
  const ownerMode = useGame((s) => s.ownerMode)
  const logout = useAuth((s) => s.logout)
  const authUser = useAuth((s) => s.user)
  const classId = useGame((s) => s.classId)
  const pendingReqs = useSocial(selectPendingCount)
  const unreadMsgs = useSocial(selectUnreadCount)
  const badgeFor = (to: string) =>
    to === '/app/notifications' ? pendingReqs : to === '/app/messages' ? unreadMsgs : 0
  const { level } = usePlayerLevel()
  const rank = rankForLevel(level)
  const navigate = useNavigate()
  const showOwner = ownerMode && isOwnerEmail(authUser?.email)
  const cls = resolveClass(level, classId, showOwner)
  const nav = showOwner
    ? [
        ...NAV.slice(0, NAV.length - 1),
        { to: '/app/admin', label: 'Owner', icon: '🛠️' },
        NAV[NAV.length - 1],
      ]
    : NAV

  const bgClass = theme === 'cosmos' ? 'cosmos-bg' : theme === 'rune' ? 'rune-bg' : 'olympus-bg'

  return (
    <div className={`relative min-h-screen ${bgClass}`}>
      <ThemeBackground theme={theme} />
      <div
        className={`grid-overlay pointer-events-none fixed inset-0 z-0 ${
          theme === 'cosmos' ? 'opacity-60' : 'opacity-10'
        }`}
      />

      {/* top navigation bar */}
      <header className="sticky top-0 z-40 border-b border-[var(--edge)] bg-[var(--bg)]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/app/character')}
            className="group flex items-center gap-2"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--edge-strong)] bg-black/40 shadow-glow">
              <span className="font-pixel text-[var(--accent)]">A</span>
            </div>
            <PixelTitle className="hidden text-sm text-[var(--text)] sm:inline">
              ASCEND
            </PixelTitle>
          </button>

          {/* nav links — icons always; the ACTIVE item shows its label so it
              never overflows / clips, even with many tabs. Tooltips aid the rest. */}
          <nav className="no-scrollbar -mx-1 flex flex-1 items-center gap-0.5 overflow-x-auto px-1">
            {nav.map((n) => (
              <NavLink
                key={n.to}
                to={n.to}
                title={n.label}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    isActive
                      ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] shadow-glow'
                      : 'text-[var(--muted)] hover:text-[var(--text)] hover:bg-white/[0.04]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span aria-hidden className="relative text-base leading-none">
                      {n.icon}
                      {badgeFor(n.to) > 0 && (
                        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-cosmos-magenta px-1 text-[9px] font-bold text-white">
                          {badgeFor(n.to) > 9 ? '9+' : badgeFor(n.to)}
                        </span>
                      )}
                    </span>
                    {isActive && <span className="hidden sm:inline">{n.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* aether + integrity */}
          <button
            onClick={() => navigate('/app/shop')}
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-2.5 py-1.5 font-pixel text-[10px] text-cosmos-gold sm:flex"
            title="Aether — spend in the Shop"
          >
            ◈ {aether}
          </button>
          <div
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5 text-[10px] lg:flex"
            title="Integrity score — your anti-cheat trust rating"
          >
            <span className="uppercase tracking-wider text-[var(--muted)]">Integrity</span>
            <span className={trust >= 80 ? 'text-exp' : trust >= 50 ? 'text-amber-300' : 'text-cosmos-magenta'}>
              {trust}
            </span>
          </div>

          {/* player chip */}
          <button
            onClick={() => navigate('/app/level')}
            className="flex shrink-0 items-center gap-2 rounded-lg border border-[var(--edge)] bg-black/30 px-3 py-1.5"
          >
            <span className="hidden text-right sm:block">
              <span className="block text-xs font-bold uppercase tracking-wide text-[var(--text)]">
                {profile?.handle ?? 'Ascender'}
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[var(--accent)]">
                {rank.title} · Lv {level}
              </span>
            </span>
            <div className="relative h-9 w-9 shrink-0">
              <div
                className="h-9 w-9 overflow-hidden rounded-full border-2 bg-black/60"
                style={{ borderColor: cls.color }}
              >
                <img
                  src={cls.img}
                  alt={cls.name}
                  className="h-full w-full object-cover"
                  style={{ objectPosition: 'center 20%' }}
                />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-[var(--edge-strong)] bg-black px-1 font-pixel text-[8px] text-[var(--accent)]">
                {level}
              </span>
            </div>
          </button>

          {/* logout */}
          <button
            onClick={() => {
              logout()
              navigate('/')
            }}
            title="Log out"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-sm text-[var(--muted)] transition hover:border-cosmos-magenta/50 hover:text-cosmos-magenta"
          >
            ⏻
          </button>
        </div>
        {streak > 0 && (
          <div className="border-t border-[var(--edge)] bg-black/20 px-4 py-1 text-center text-[11px] font-semibold uppercase tracking-widest text-exp">
            🔥 {streak}-day streak — keep the chain alive
          </div>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="relative z-10 border-t border-[var(--edge)] py-6 text-center text-xs text-[var(--muted)]">
        ASCEND — Treating self improvement as game progression. ·{' '}
        <span className="text-[var(--accent)]">Let’s get you to the endgame.</span>
        <div className="mt-2">
          <NavLink to="/app/guide" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Codex
          </NavLink>{' '}
          ·{' '}
          <a href="#/privacy" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Privacy &amp; Confidentiality
          </a>
        </div>
      </footer>
    </div>
  )
}
