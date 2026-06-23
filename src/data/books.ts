import { TRAITS } from './traits'

// ================================================================
// BOOKS - where to buy, borrow free, or read free (public domain).
// We don't host any copyrighted text; we link out to legitimate
// sources: retailers to buy, Open Library to borrow, and Project
// Gutenberg / Standard Ebooks for public-domain titles.
// ================================================================

export interface BookLinkSet {
  title: string
  author?: string
  amazon: string
  bookshop: string
  openLibrary: string
  free: { label: string; url: string } | null
}

// Public-domain titles we can link to a free, legal full text.
const PUBLIC_DOMAIN: { match: string; label: string; url: string }[] = [
  { match: 'Meditations', label: 'Read free · Gutenberg', url: 'https://www.gutenberg.org/ebooks/2680' },
  { match: 'As a Man Thinketh', label: 'Read free · Gutenberg', url: 'https://www.gutenberg.org/ebooks/4507' },
  { match: 'The Art of War', label: 'Read free · Gutenberg', url: 'https://www.gutenberg.org/ebooks/132' },
  { match: 'Think and Grow Rich', label: 'Read free · Archive', url: 'https://archive.org/details/thinkgrowrich00hill' },
]

// "Title - Author" → parts
export function parseBook(book: string): { title: string; author?: string } {
  const [title, author] = book.split(' - ')
  return { title: title?.trim() ?? book, author: author?.trim() }
}

export function bookLinks(book: string): BookLinkSet {
  const { title, author } = parseBook(book)
  const q = encodeURIComponent(`${title} ${author ?? ''}`.trim())
  const pd = PUBLIC_DOMAIN.find((p) => title.toLowerCase().includes(p.match.toLowerCase()))
  return {
    title,
    author,
    amazon: `https://www.amazon.com/s?k=${q}&i=stripbooks`,
    bookshop: `https://bookshop.org/search?keywords=${q}`,
    openLibrary: `https://openlibrary.org/search?q=${q}`,
    free: pd ? { label: pd.label, url: pd.url } : null,
  }
}

// The curated catalog = every main-quest book in the trait library (deduped).
export const BOOK_CATALOG: string[] = Array.from(
  new Set(TRAITS.map((t) => t.mainQuest.book).filter((b): b is string => Boolean(b))),
).sort()
