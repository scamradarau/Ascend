import { create } from 'zustand'
import { useGame } from './useGame'

// ================================================================
// AUTH — accounts, sessions & per-account saves.
//
// ⚠️ PRODUCTION NOTE: real multi-device login needs a backend (an API
// + database that stores password hashes and issues session tokens).
// This module is a *complete, working* client-side stand-in: accounts
// live in localStorage, passwords are hashed with the Web Crypto API
// (PBKDF2-SHA256 + per-user salt), and each account gets its own game
// save. It is deliberately isolated so you can swap the four functions
// (signup / login / logout / hydrate) for real `fetch()` calls to your
// server without touching the rest of the app.
// ================================================================

const ACCOUNTS_KEY = 'ascend-accounts'
const SESSION_KEY = 'ascend-session'
export const saveKeyFor = (id: string) => `ascend-save-${id}`

export interface StoredAccount {
  id: string
  username: string
  email: string
  salt: string
  hash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  username: string
  email: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ---- password hashing ----
function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

function randomSalt(): string {
  const a = new Uint8Array(16)
  crypto.getRandomValues(a)
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// crypto.randomUUID is only defined in secure contexts — provide a fallback.
function uuid(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID()
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 0x0f) | 0x40
  b[8] = (b[8] & 0x3f) | 0x80
  const h = [...b].map((x) => x.toString(16).padStart(2, '0'))
  return `${h.slice(0, 4).join('')}-${h.slice(4, 6).join('')}-${h.slice(6, 8).join('')}-${h
    .slice(8, 10)
    .join('')}-${h.slice(10, 16).join('')}`
}

// Iterative salted JS hash — used only when the Web Crypto SubtleCrypto API
// is unavailable (i.e. an insecure context like a plain-http LAN address).
// On HTTPS / localhost we use real PBKDF2-SHA256 below.
function fallbackHash(password: string, salt: string): string {
  let str = `${salt}:${password}`
  let h1 = 0xdeadbeef ^ salt.length
  let h2 = 0x41c6ce57 ^ password.length
  for (let iter = 0; iter < 3000; iter++) {
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    str = ((h1 >>> 0).toString(16) + (h2 >>> 0).toString(16) + salt)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 'fb' + (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(16, '0')
}

async function hashPassword(password: string, salt: string): Promise<string> {
  // Prefer real PBKDF2 when available (HTTPS / localhost).
  if (crypto?.subtle?.deriveBits) {
    try {
      const enc = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits'],
      )
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: enc.encode(salt), iterations: 120000, hash: 'SHA-256' },
        keyMaterial,
        256,
      )
      return toHex(bits)
    } catch {
      // fall through to the JS fallback
    }
  }
  return fallbackHash(password, salt)
}

// ---- account registry (localStorage) ----
export function getAccounts(): StoredAccount[] {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]')
  } catch {
    return []
  }
}
function saveAccounts(list: StoredAccount[]) {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list))
}

export function getSessionId(): string | null {
  return localStorage.getItem(SESSION_KEY)
}
function setSessionId(id: string | null) {
  if (id) localStorage.setItem(SESSION_KEY, id)
  else localStorage.removeItem(SESSION_KEY)
}

// ---- the reactive auth store ----
interface AuthState {
  user: PublicUser | null
  ready: boolean
  init: () => void
  signup: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{ ok: boolean; error?: string }>
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  init: () => {
    const id = getSessionId()
    const acc = getAccounts().find((a) => a.id === id)
    set({
      user: acc ? { id: acc.id, username: acc.username, email: acc.email ?? '' } : null,
      ready: true,
    })
  },

  signup: async (username, email, password) => {
    username = username.trim()
    email = email.trim()
    if (username.length < 3) return { ok: false, error: 'Username must be at least 3 characters.' }
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    const accounts = getAccounts()
    if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase()))
      return { ok: false, error: 'That username is taken.' }
    if (accounts.some((a) => (a.email ?? '').toLowerCase() === email.toLowerCase()))
      return { ok: false, error: 'An account with that email already exists.' }

    const salt = randomSalt()
    const hash = await hashPassword(password, salt)
    const id = uuid()
    const account: StoredAccount = {
      id,
      username,
      email,
      salt,
      hash,
      createdAt: new Date().toISOString(),
    }
    saveAccounts([...accounts, account])

    // start a fresh save for this account
    setSessionId(id)
    useGame.getState().resetAll()
    await useGame.persist.rehydrate()
    set({ user: { id, username, email } })
    return { ok: true }
  },

  login: async (username, password) => {
    username = username.trim()
    const account = getAccounts().find((a) => a.username.toLowerCase() === username.toLowerCase())
    if (!account) return { ok: false, error: 'No account with that username.' }
    const hash = await hashPassword(password, account.salt)
    if (hash !== account.hash) return { ok: false, error: 'Incorrect password.' }

    // switch saves: clear session so reset doesn't clobber the other account,
    // reset to defaults, point at this account, then rehydrate its save.
    setSessionId(null)
    useGame.getState().resetAll()
    setSessionId(account.id)
    await useGame.persist.rehydrate()
    set({ user: { id: account.id, username: account.username, email: account.email ?? '' } })
    return { ok: true }
  },

  logout: () => {
    // clear session FIRST so the reset write goes nowhere
    setSessionId(null)
    useGame.getState().resetAll()
    set({ user: null })
  },
}))
