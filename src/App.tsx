import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useGame } from './store/useGame'
import { useAuth } from './store/auth'
import { useSocial } from './store/social'
import { startCloudSync } from './store/cloudSync'
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
import Admin from './pages/Admin'
import Codex from './pages/Codex'
import Friends from './pages/Friends'
import Notifications from './pages/Notifications'
import Messages from './pages/Messages'
import PlayerProfile from './pages/PlayerProfile'
import Privacy from './pages/Privacy'
import Stoic from './pages/Stoic'
import Journal from './pages/Journal'

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

  if (!ready) {
    return (
      <div className="cosmos-bg flex min-h-screen items-center justify-center">
        <span className="font-pixel text-sm text-cosmos-cyan glow-text">ASCEND…</span>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth mode="login" />} />
      <Route path="/signup" element={<Auth mode="signup" />} />
      <Route path="/privacy" element={<Privacy />} />
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
        <Route path="level" element={<LevelExpectations />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="leaderboards" element={<Leaderboards />} />
        <Route path="shop" element={<Shop />} />
        <Route path="admin" element={<Admin />} />
        <Route path="guide" element={<Codex />} />
        <Route path="stoic" element={<Stoic />} />
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

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
