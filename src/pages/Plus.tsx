import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { useAuth } from '../store/auth'
import { isCloud, startPlusCheckout, fetchEarnedProgress } from '../lib/supabase'
import { PLUS_PLANS, PLUS_BENEFITS, PLUS_NEVER, type PlusPlan } from '../data/plus'
import { PixelTitle, Pill, Toast } from '../components/ui'

export default function Plus() {
  const plus = useGame((s) => s.plus)
  const user = useAuth((s) => s.user)
  const [params] = useSearchParams()
  const [busy, setBusy] = useState<PlusPlan | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const flash = (m: string) => {
    setToast(m)
    setTimeout(() => setToast(null), 3000)
  }

  const justPaid = params.get('success') === '1'

  // After returning from Stripe, the webhook flips `plus` server-side; pull the
  // fresh value down so the UI reflects it (with a gentle retry for webhook lag).
  const refresh = async () => {
    if (!user) return
    const prog = await fetchEarnedProgress(user.id)
    if (prog && typeof prog.plus === 'boolean') {
      useGame.setState({ plus: prog.plus })
      // newly-active member: grant the first monthly Aether stipend right away
      if (prog.plus) useGame.getState().tickStreak()
      return prog.plus
    }
    return undefined
  }

  useEffect(() => {
    if (!justPaid) return
    let tries = 0
    const tick = async () => {
      const ok = await refresh()
      tries++
      if (!ok && tries < 5) setTimeout(tick, 2000)
    }
    tick()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [justPaid])

  const go = async (plan: PlusPlan) => {
    if (!isCloud) {
      flash('Sign in to the cloud to upgrade.')
      return
    }
    setBusy(plan)
    const { url, error } = await startPlusCheckout(plan)
    setBusy(null)
    if (url) {
      window.location.href = url
      return
    }
    flash(error ?? 'Could not start checkout.')
  }

  // ---- already a member ----
  if (plus) {
    return (
      <div className="mx-auto max-w-2xl">
        <PixelTitle>ASCEND PLUS</PixelTitle>
        <div className="mt-4 rounded-2xl border border-cosmos-gold/40 bg-gradient-to-br from-cosmos-gold/10 to-cosmos-violet/10 p-6 text-center">
          <div className="text-4xl">✦</div>
          <h2 className="mt-2 font-display text-xl font-bold text-white">You're a Plus member</h2>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Thank you for backing ASCEND. Your support keeps it independent and ad-free.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link to="/app/settings" className="btn btn-primary text-sm">
              Equip your Plus cosmetics
            </Link>
            <Link to="/app/traits" className="btn btn-ghost text-sm">
              Add a 4th & 5th trait
            </Link>
          </div>
        </div>
        <ul className="mt-6 space-y-3">
          {PLUS_BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
              <span className="text-xl">{b.icon}</span>
              <div>
                <div className="text-sm font-semibold text-white">{b.title}</div>
                <div className="text-xs text-[var(--muted)]">{b.detail}</div>
              </div>
            </li>
          ))}
        </ul>
        <Toast message={toast} />
      </div>
    )
  }

  // ---- upgrade screen ----
  return (
    <div className="mx-auto max-w-3xl">
      <PixelTitle>ASCEND PLUS</PixelTitle>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Go further, fund the build, and wear it. Free forever to play — Plus adds capacity, cosmetics
        and insight.
      </p>

      {justPaid && (
        <div className="mt-4 rounded-xl border border-cosmos-cyan/40 bg-cosmos-cyan/5 p-3 text-sm text-cosmos-cyan">
          ✅ Payment received — activating your membership. This can take a few seconds.{' '}
          <button onClick={refresh} className="underline">
            Refresh
          </button>
        </div>
      )}

      {/* plans */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {PLUS_PLANS.map((p) => (
          <div
            key={p.id}
            className={`relative flex flex-col rounded-2xl border p-4 ${
              p.id === 'annual'
                ? 'border-cosmos-cyan/60 bg-cosmos-cyan/5'
                : p.id === 'lifetime'
                  ? 'border-cosmos-gold/50 bg-cosmos-gold/5'
                  : 'border-white/10 bg-white/[0.02]'
            }`}
          >
            {p.badge && (
              <span className="absolute -top-2 right-3">
                <Pill tone={p.id === 'lifetime' ? 'gold' : 'exp'}>{p.badge}</Pill>
              </span>
            )}
            <div className="text-sm font-semibold text-white">{p.name}</div>
            <div className="mt-1 font-display text-2xl font-bold text-white">{p.price}</div>
            <div className="text-[11px] uppercase tracking-wide text-[var(--muted)]">{p.cadence}</div>
            <p className="mt-2 flex-1 text-xs text-[var(--muted)]">{p.blurb}</p>
            <button
              onClick={() => go(p.id)}
              disabled={busy !== null}
              className="btn btn-primary mt-3 text-sm"
            >
              {busy === p.id ? 'Opening…' : p.id === 'lifetime' ? 'Become a Founder' : 'Start free trial'}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-xs text-cosmos-cyan">
        ✦ Subscriptions start with a <strong>7-day free trial</strong> — you won’t be charged until day 8,
        and you can cancel anytime before then.
      </p>

      {/* benefits */}
      <h3 className="mt-8 stat-label text-xs">What you get</h3>
      <ul className="mt-2 space-y-3">
        {PLUS_BENEFITS.map((b) => (
          <li key={b.title} className="flex gap-3 rounded-xl border border-white/8 bg-white/[0.02] p-3">
            <span className="text-xl">{b.icon}</span>
            <div>
              <div className="text-sm font-semibold text-white">{b.title}</div>
              <div className="text-xs text-[var(--muted)]">{b.detail}</div>
            </div>
          </li>
        ))}
      </ul>

      {/* the trust guardrail */}
      <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-3 text-xs text-[var(--muted)]">
        🛡️ {PLUS_NEVER}
      </div>

      <p className="mt-4 text-center text-[11px] text-[var(--muted)]">
        Billed securely via Stripe. Cancel a subscription anytime from your Stripe receipt. Prices in AUD.
      </p>

      <Toast message={toast} />
    </div>
  )
}
