import React from 'react'

// ---- Pixel wordmark (matches the deck's title treatment) ----
export function PixelTitle({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={`font-pixel tracking-[0.18em] ${className}`}>{children}</span>
  )
}

// ---- EXP bar ----
export function ExpBar({
  pct,
  label,
  height = 'h-3',
  showText = true,
}: {
  pct: number
  label?: string
  height?: string
  showText?: boolean
}) {
  return (
    <div className="w-full">
      {label && (
        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          <span>{label}</span>
          {showText && <span>{pct}%</span>}
        </div>
      )}
      <div
        className={`relative w-full ${height} overflow-hidden rounded-full border border-white/10 bg-black/40`}
      >
        <div
          className="exp-fill h-full rounded-full transition-all duration-500"
          style={{ width: `${Math.max(2, pct)}%` }}
        />
      </div>
    </div>
  )
}

// ---- Generic panel ----
export function Panel({
  children,
  className = '',
  hud = false,
}: {
  children: React.ReactNode
  className?: string
  hud?: boolean
}) {
  return (
    <div className={`panel ${hud ? 'hud-corner' : ''} ${className}`}>{children}</div>
  )
}

// ---- Section heading with pixel accent ----
export function SectionTitle({
  children,
  sub,
}: {
  children: React.ReactNode
  sub?: string
}) {
  return (
    <div className="mb-5">
      <h2 className="font-pixel text-base text-[var(--accent)] glow-text sm:text-lg">
        {children}
      </h2>
      {sub && <p className="mt-2 max-w-2xl text-sm text-[var(--muted)]">{sub}</p>}
    </div>
  )
}

// ---- Modal ----
export function Modal({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
}) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="panel hud-corner relative z-10 w-full max-w-lg animate-popIn p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <h3 className="mb-4 font-pixel text-sm text-[var(--accent)] glow-text">
            {title}
          </h3>
        )}
        {children}
      </div>
    </div>
  )
}

// ---- Toast / floating notification ----
export function Toast({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="panel animate-levelup border-[var(--accent)] px-6 py-3 text-center shadow-glow">
        <span className="font-display font-bold uppercase tracking-wider text-[var(--accent)]">
          {message}
        </span>
      </div>
    </div>
  )
}

export function Pill({
  children,
  tone = 'default',
}: {
  children: React.ReactNode
  tone?: 'default' | 'gold' | 'exp' | 'violet' | 'amber' | 'red'
}) {
  const tones: Record<string, string> = {
    default: 'border-white/15 text-[var(--muted)]',
    gold: 'border-cosmos-gold/50 text-cosmos-gold',
    exp: 'border-exp/50 text-exp',
    violet: 'border-cosmos-violet/50 text-cosmos-violet',
    amber: 'border-amber-400/50 text-amber-300',
    red: 'border-red-500/50 text-red-400',
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${tones[tone]}`}
    >
      {children}
    </span>
  )
}
