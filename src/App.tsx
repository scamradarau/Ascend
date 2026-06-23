import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useGame } from './store/useGame'
import { useAuth } from './store/auth'
import { useSocial } from './store/social'
import { startCloudSync } from './store/cloudSync'
import { isCloud, isOwnerEmail, fetchEarnedProgress } from './lib/supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Disclaimers from './pages/Disclaimers'
import Onboarding from './pages/Onboarding'
import PlatformLayout from './components/PlatformLayout'
import Character from './pages/Character'
import TraitMatrix from './pages/TraitMatrix'
import TraitDetail from './pages/TraitDetail'
import Quests from './pages/Quests'
import LevelExpectations from './pages/LevelExpectations'
import Inventory from './pages/Inventory'
import Leaderboards from './pages/Leaderboards'
import Guild from './pages/Guild'
import Feedback from './pages/Feedback'
import Settings from './pages/Settings'
import Shop from './pages/Shop'
import Plus from './pages/Plus'
import Stats from './pages/Stats'
import Admin from './pages/Admin'
import Codex from './pages/Codex'
import Friends from './pages/Friends'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import PlayerProfile from './pages/PlayerProfile'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Journal from './pages/Journal'
import WorldMap from './pages/WorldMap'
import NotFound from './pages/NotFound'

function RequireAuth({ children }: { children: JSX.Element }) {
  const user = useAuth((s) => s.user)
  if (!user) return <Navigate to="/login" replace />
  return children
}

function RequireOnboarding({ children }: { children: JSX.Element }) {
  const onboarded = useGame((s) => s.onboarded)
  if (!onboarded) return <Navigate to="/onboarding" replace />
  return children
}

export default function App() {
  const theme = useGame((s) => s.theme)
  const reduceMotion = useGame((s) => s.reduceMotion)
  const init = useAuth((s) => s.init)
  const ready = useAuth((s) => s.ready)
  const user = useAuth((s) => s.user)
  const { pathname } = useLocation()

  // restore session on boot + start cloud mirroring (no-op in local mode)
  useEffect(() => {
    init()
    startCloudSync()
    useSocial.getState().start()
  }, [init])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reduceMotion)
  }, [reduceMotion])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  // Resolve Ascend Plus authoritatively whenever the signed-in user changes.
  // Owner = always Plus. Everyone else = whatever the server says - this is the
  // source of truth and self-heals any stale local `plus` flag (so Plus can
  // never leak from one account to the next).
  useEffect(() => {
    if (!user) return
    if (isOwnerEmail(user.email)) {
      useGame.setState({ plus: true })
      return
    }
    if (isCloud) {
      fetchEarnedProgress(user.id)
        .then((p) => {
          if (p) useGame.setState({ plus: !!p.plus })
        })
        .catch(() => {})
    }
  }, [user])

  if (!ready) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-3 overflow-hidden bg-[var(--bg)]">
        <div className="starfield absolute inset-0 opacity-30" />
        <span className="relative z-10 font-pixel text-base text-white [text-shadow:0_2px_24px_rgba(34,211,238,0.35)] animate-pulse">
          ASCEND
        </span>
        <span className="relative z-10 text-[10px] uppercase tracking-[0.3em] text-cosmos-cyan/80">
          Entering the realm…
        </span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/disclaimers"
        element={
          <RequireAuth>
            <Disclaimers />
          </RequireAuth>
        }
      />
      <Route
        path="/onboarding"
        element={
          <RequireAuth>
            <Onboarding />
          </RequireAuth>
        }
      />

      <Route
        path="/app"
        element={
          <RequireAuth>
            <RequireOnboarding>
              <PlatformLayout />
            </RequireOnboarding>
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/app/character" replace />} />
        <Route path="character" element={<Character />} />
        <Route path="traits" element={<TraitMatrix />} />
        <Route path="traits/:id" element={<TraitDetail />} />
        <Route path="quests" element={<Quests />} />
        <Route path="world" element={<WorldMap />} />
        <Route path="level" element={<LevelExpectations />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="leaderboards" element={<Leaderboards />} />
        <Route path="shop" element={<Shop />} />
        <Route path="plus" element={<Plus />} />
        <Route path="stats" element={<Stats />} />
        <Route path="admin" element={<Admin />} />
        <Route path="guide" element={<Codex />} />
        {/* Lumi replaced the standalone Stoic page; redirect any old links */}
        <Route path="stoic" element={<Navigate to="/app/character" replace />} />
        <Route path="journal" element={<Journal />} />
        <Route path="guild" element={<Guild />} />
        <Route path="friends" element={<Friends />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:id" element={<Messages />} />
        <Route path="player/:id" element={<PlayerProfile />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
