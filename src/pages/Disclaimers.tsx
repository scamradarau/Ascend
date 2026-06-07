import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../store/useGame'
import { PixelTitle } from '../components/ui'

const CONSENTS = [
  {
    id: 'entertainment',
    label:
      'I understand the expectations set in this game are for entertainment and motivation — not to be taken as literal life advice.',
  },
  {
    id: 'photos',
    label:
      'I consent to taking and uploading real-time photos as proof of completing tasks (gym, schedules, physique, etc.).',
  },
  {
    id: 'docs',
    label:
      'I consent to uploading personal / business documents where needed to verify high-level claims (income, business, physique).',
  },
  {
    id: 'terms',
    label: 'I accept the Terms & Conditions and Community Guidelines.',
  },
]

export default function Disclaimers() {
  const navigate = useNavigate()
  const acceptTerms = useGame((s) => s.acceptTerms)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const all = CONSENTS.every((c) => checked[c.id])

  const proceed = () => {
    if (!all) return
    acceptTerms()
    navigate('/onboarding')
  }

  return (
    <div className="cosmos-bg starfield relative min-h-screen px-6 py-16">
      <div className="grid-overlay pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative z-10 mx-auto max-w-2xl">
        <Link to="/" className="text-xs uppercase tracking-widest text-[var(--muted)] hover:text-white">
          ← Back
        </Link>
        <div className="mt-4">
          <PixelTitle className="text-sm text-cosmos-cyan">DISCLAIMERS</PixelTitle>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">
            Before you enter the game
          </h1>
          <p className="mt-3 text-[var(--muted)]">
            Accountability is the core of Ascend. A few consents keep the game honest and your progress
            real.
          </p>
        </div>

        <div className="panel mt-8 divide-y divide-white/5">
          {CONSENTS.map((c) => (
            <label
              key={c.id}
              className="flex cursor-pointer items-start gap-4 p-5 transition hover:bg-white/[0.03]"
            >
              <input
                type="checkbox"
                checked={!!checked[c.id]}
                onChange={(e) => setChecked((p) => ({ ...p, [c.id]: e.target.checked }))}
                className="mt-1 h-5 w-5 shrink-0 accent-cosmos-cyan"
              />
              <span className="text-sm leading-relaxed text-slate-300">{c.label}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-black/30 p-4 text-xs leading-relaxed text-slate-500">
          <strong className="text-slate-400">Note:</strong> Accountability is regulated through
          real-time photos, written summaries of reading, and human + AI review of badge completions.
          High-level questions (business, monetary, physique) must be proven. Starting caps: Low 20 ·
          Mid 40 · High 60.
        </div>

        <div className="mt-8 flex items-center justify-between gap-4">
          <span className="text-xs uppercase tracking-widest text-[var(--muted)]">
            {CONSENTS.filter((c) => checked[c.id]).length}/{CONSENTS.length} accepted
          </span>
          <button onClick={proceed} disabled={!all} className="btn btn-primary">
            I agree — continue →
          </button>
        </div>
      </div>
    </div>
  )
}
