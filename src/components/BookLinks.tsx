import { bookLinks } from '../data/books'

// Renders "where to get it" links for a book: buy, borrow free, or
// (public domain) read free.
export default function BookLinks({ book, compact = false }: { book: string; compact?: boolean }) {
  const l = bookLinks(book)
  const A = ({ href, children, tone = 'ghost' }: { href: string; children: React.ReactNode; tone?: 'ghost' | 'free' }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
        tone === 'free'
          ? 'border-exp/50 text-exp hover:bg-exp/10'
          : 'border-[var(--edge-strong)] text-[var(--text)] hover:bg-[color-mix(in_srgb,var(--accent)_12%,transparent)]'
      }`}
    >
      {children}
    </a>
  )

  return (
    <div className={compact ? '' : 'rounded-xl border border-white/8 bg-white/[0.02] p-3'}>
      {!compact && (
        <div className="mb-2 text-xs uppercase tracking-widest text-[var(--muted)]">
          📚 Get the book
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {l.free && <A href={l.free.url} tone="free">📖 {l.free.label}</A>}
        <A href={l.openLibrary} tone="free">🏛️ Borrow free · Open Library</A>
        <A href={l.amazon}>🛒 Amazon</A>
        <A href={l.bookshop}>🛍️ Bookshop.org</A>
      </div>
    </div>
  )
}
