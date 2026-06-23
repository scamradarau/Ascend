import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useGame, usePlayerLevel } from '../store/useGame'
import { useAuth } from '../store/auth'
import { rankForLevel } from '../data/ranks'
import { resolveClass } from '../data/classes'
import { useSocial, selectPendingCount, selectUnreadCount, unreadAlertCount } from '../store/social'
import { isOwnerEmail } from '../lib/supabase'
import { PixelTitle } from './ui'
import Icon, { type IconName } from './Icon'
import ThemeBackground from './ThemeBackground'
import Companion from './Companion'
import StreakWatcher from './StreakWatcher'
import BadgeWatcher from './BadgeWatcher'

// Grouped nav - the daily loop first, everything else clustered so the
// drawer reads in seconds. Alerts & Messages live as header icons (badges
// belong in sight, not in a drawer); Feedback lives inside Settings.
const NAV_SECTIONS: { heading: string; items: { to: string; label: string; icon: IconName }[] }[] = [
  {
    heading: 'PLAY',
    items: [
      { to: '/app/character', label: 'Character', icon: 'character' },
      { to: '/app/quests', label: 'Quests', icon: 'quest' },
      { to: '/app/world', label: 'World Map', icon: 'world' },
      { to: '/app/traits', label: 'Main Quests', icon: 'mainquest' },
    ],
  },
  {
    heading: 'PROGRESS',
    items: [
      { to: '/app/leaderboards', label: 'Leaderboard', icon: 'leaderboard' },
      { to: '/app/stats', label: 'Advanced Stats', icon: 'stats' },
      { to: '/app/journal', label: 'Journal', icon: 'journal' },
    ],
  },
  {
    heading: 'SOCIAL',
    items: [
      { to: '/app/guild', label: 'Guild', icon: 'guild' },
      { to: '/app/friends', label: 'Friends', icon: 'friends' },
    ],
  },
  {
    heading: 'REWARDS',
    items: [
      { to: '/app/plus', label: 'Ascend Plus', icon: 'plus' },
      { to: '/app/shop', label: 'Shop', icon: 'shop' },
      { to: '/app/inventory', label: 'Inventory', icon: 'inventory' },
    ],
  },
  {
    heading: 'GUIDANCE',
    items: [{ to: '/app/guide', label: 'Codex', icon: 'codex' }],
  },
]

export default function PlatformLayout() {
  const theme = useGame((s) => s.theme)
  const profile = useGame((s) => s.profile)
  const streak = useGame((s) => s.streak)
  const freezes = useGame((s) => s.streakFreezes)
  const aether = useGame((s) => s.aether)
  const trust = useGame((s) => s.trust)
  const ownerMode = useGame((s) => s.ownerMode)
  const logout = useAuth((s) => s.logout)
  const authUser = useAuth((s) => s.user)
  const classId = useGame((s) => s.classId)
  const pendingReqs = useSocial(selectPendingCount)
  const unreadMsgs = useSocial(selectUnreadCount)
  const unreadAlerts = useSocial(unreadAlertCount)
  const alertBadge = pendingReqs + unreadAlerts
  const { level } = usePlayerLevel()
  const rank = rankForLevel(level)
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const showOwner = ownerMode && isOwnerEmail(authUser?.email)
  const cls = resolveClass(level, classId, showOwner)
  const sections = [
    ...NAV_SECTIONS,
    {
      heading: 'SYSTEM',
      items: [
        ...(showOwner ? [{ to: '/app/admin', label: 'Owner', icon: 'owner' as IconName }] : []),
        { to: '/app/settings', label: 'Settings', icon: 'settings' as IconName },
      ],
    },
  ]

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
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3 sm:gap-3">
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

          {/* menu toggle - opens the slide-out nav drawer (keeps the bar uncluttered) */}
          <button
            onClick={() => setMenuOpen(true)}
            title="Menu"
            aria-label="Open menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-lg text-[var(--text)] transition hover:border-[var(--accent)]/60 hover:text-[var(--accent)]"
          >
            ☰
          </button>

          <div className="flex-1" />

          {/* alerts + messages - always in sight, never buried in the drawer */}
          <button
            onClick={() => navigate('/app/notifications')}
            title="Alerts - quest reviews & friend requests"
            aria-label="Alerts"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-sm transition hover:border-[var(--accent)]/60"
          >
            <Icon name="bell" size={18} />
            {alertBadge > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cosmos-magenta px-1 text-[9px] font-bold text-white">
                {alertBadge > 9 ? '9+' : alertBadge}
              </span>
            )}
          </button>
          <button
            onClick={() => navigate('/app/messages')}
            title="Messages"
            aria-label="Messages"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-sm transition hover:border-[var(--accent)]/60"
          >
            <Icon name="messages" size={18} />
            {unreadMsgs > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-cosmos-magenta px-1 text-[9px] font-bold text-white">
                {unreadMsgs > 9 ? '9+' : unreadMsgs}
              </span>
            )}
          </button>

          {/* aether + integrity */}
          <button
            onClick={() => navigate('/app/shop')}
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-cosmos-gold/40 bg-cosmos-gold/5 px-2.5 py-1.5 font-pixel text-[10px] text-cosmos-gold sm:flex"
            title="Aether - spend in the Shop"
          >
            <Icon name="aether" /> {aether}
          </button>
          <div
            className="hidden shrink-0 items-center gap-1 rounded-lg border border-[var(--edge)] bg-black/30 px-2.5 py-1.5 text-[10px] lg:flex"
            title="Integrity score - your anti-cheat trust rating"
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
          <div className="flex items-center justify-center gap-3 border-t border-[var(--edge)] bg-black/20 px-4 py-1 text-[11px] font-semibold uppercase tracking-widest text-exp">
            <span className="inline-flex items-center gap-1.5">
              <Icon name="streak" /> {streak}-day streak - keep the chain alive
            </span>
            {freezes > 0 && (
              <span className="inline-flex items-center gap-1 text-cosmos-cyan" title={`${freezes} Streak Freeze${freezes > 1 ? 's' : ''} - protects your streak across a missed day`}>
                <Icon name="freeze" /> {freezes}
              </span>
            )}
          </div>
        )}
      </header>

      {/* slide-out navigation drawer */}
      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <nav className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[82vw] flex-col overflow-y-auto border-r border-[var(--edge-strong)] bg-[var(--bg)]/95 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-[var(--edge)] px-4 py-3">
              <PixelTitle className="text-sm text-[var(--accent)]">ASCEND</PixelTitle>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--edge)] bg-black/30 text-[var(--muted)] transition hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 p-3">
              {sections.map((sec) => (
                <div key={sec.heading} className="mb-2">
                  <div className="px-3 pb-1 pt-2 text-[9px] font-bold uppercase tracking-[0.2em] text-[var(--muted)]/60">
                    {sec.heading}
                  </div>
                  <div className="space-y-0.5">
                    {sec.items.map((n) => (
                      <NavLink
                        key={n.to}
                        to={n.to}
                        onClick={() => setMenuOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold uppercase tracking-wider transition ${
                            isActive
                              ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent)] shadow-glow'
                              : 'text-[var(--muted)] hover:bg-white/[0.04] hover:text-[var(--text)]'
                          }`
                        }
                      >
                        <Icon name={n.icon} size={20} />

                        <span className="flex-1">{n.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>
        </>
      )}

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Lumi - the floating guide, present on every page */}
      <Companion />

      {/* streak freeze + milestone celebrations */}
      <StreakWatcher />

      {/* live badge progress + auto-award */}
      <BadgeWatcher />

      <footer className="relative z-10 border-t border-[var(--edge)] py-6 text-center text-xs text-[var(--muted)]">
        ASCEND - Treating self improvement as game progression. ·{' '}
        <span className="text-[var(--accent)]">Let’s get you to the endgame.</span>
        <div className="mt-2">
          <NavLink to="/app/guide" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Codex
          </NavLink>{' '}
          ·{' '}
          <NavLink to="/app/feedback" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Feedback
          </NavLink>{' '}
          ·{' '}
          <a href="#/terms" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Terms
          </a>{' '}
          ·{' '}
          <a href="#/privacy" className="text-[var(--muted)] hover:text-[var(--accent)]">
            Privacy &amp; Confidentiality
          </a>
        </div>
      </footer>
    </div>
  )
}
