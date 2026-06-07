import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { useGame } from '../store/useGame'
import { PixelTitle } from '../components/ui'
import CosmosScenery from '../components/CosmosScenery'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const navigate = useNavigate()
  const signup = useAuth((s) => s.signup)
  const login = useAuth((s) => s.login)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const isSignup = mode === 'signup'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (isSignup && password !== confirm) {
      setError('Passwords don’t match.')
      return
    }
    setBusy(true)
    try {
      const res = isSignup
        ? await signup(username, email, password)
        : await login(username, password)
      if (!res.ok) {
        setError(res.error ?? 'Something went wrong.')
        return
      }
      if (isSignup) {
        navigate('/disclaimers')
      } else {
        navigate(useGame.getState().onboarded ? '/app/character' : '/disclaimers')
      }
    } catch (err) {
      setError('Couldn’t complete that — please try again.')
      // eslint-disable-next-line no-console
      console.error('[auth] submit failed', err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cosmos-bg relative flex min-h-screen items-center justify-center px-4 py-12">
      <CosmosScenery />
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center">
          <PixelTitle className="text-2xl text-cosmos-cyan glow-text">ASCEND</PixelTitle>
        </Link>

        <div className="panel hud-corner p-7">
          <h1 className="font-display text-2xl font-bold text-white">
            {isSignup ? 'Create your account' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {isSignup
              ? 'Sign up to start your ascent and claim your spot on the ladder.'
              : 'Log in to continue your ascent.'}
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div>
              <label className="stat-label mb-1.5 block text-xs">Username</label>
              <input
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your handle"
                autoComplete="username"
                autoFocus
              />
            </div>
            {isSignup && (
              <div>
                <label className="stat-label mb-1.5 block text-xs">Email</label>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            )}
            <div>
              <label className="stat-label mb-1.5 block text-xs">Password</label>
              <div className="relative">
                <input
                  className="input pr-16"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isSignup ? 'new-password' : 'current-password'}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] uppercase tracking-wider text-[var(--muted)]"
                >
                  {show ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {isSignup && (
              <div>
                <label className="stat-label mb-1.5 block text-xs">Confirm password</label>
                <input
                  className="input"
                  type={show ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-cosmos-magenta/40 bg-cosmos-magenta/10 px-3 py-2 text-sm text-cosmos-magenta">
                {error}
              </div>
            )}

            <button type="submit" disabled={busy} className="btn btn-primary w-full">
              {busy ? 'Please wait…' : isSignup ? 'Create account →' : 'Log in →'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-[var(--muted)]">
            {isSignup ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="text-[var(--accent)]">
                  Log in
                </Link>
              </>
            ) : (
              <>
                New here?{' '}
                <Link to="/signup" className="text-[var(--accent)]">
                  Create an account
                </Link>
              </>
            )}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-[var(--muted)]/70">
          🔒 Passwords are hashed (PBKDF2-SHA256) and stored locally on this device for this build.
          Your save is private to your account. See our{' '}
          <Link to="/privacy" className="text-[var(--accent)] underline">
            Privacy &amp; Confidentiality
          </Link>{' '}
          policy.
        </p>
      </div>
    </div>
  )
}
