import { create } from 'zustand'
import { useGame } from './useGame'
import {
  isCloud,
  supabase,
  cloudSignUp,
  cloudSignIn,
  cloudSignOut,
  loadCloudSave,
} from '../lib/supabase'
import { validateHandle } from '../lib/handles'

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
  dob?: string
  salt: string
  hash: string
  createdAt: string
}

export interface PublicUser {
  id: string
  username: string
  email: string
  dob?: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// whole years from an ISO date (yyyy-mm-dd) to today
export function ageFromDob(dob?: string): number | null {
  if (!dob) return null
  const d = new Date(dob)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const m = now.getMonth() - d.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--
  return age
}

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
  init: () => void | Promise<void>
  signup: (
    username: string,
    email: string,
    password: string,
    dob?: string,
  ) => Promise<{ ok: boolean; error?: string }>
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

// Load this account's save: pull from cloud if present, else fall back to
// whatever is cached locally, else fresh.
async function loadSaveFor(userId: string) {
  setSessionId(null)
  useGame.getState().resetAll()
  setSessionId(userId)
  if (isCloud) {
    const data = await loadCloudSave(userId)
    if (data) {
      localStorage.setItem(`ascend-save-${userId}`, JSON.stringify({ state: data, version: 3 }))
    }
  }
  await useGame.persist.rehydrate()
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  ready: false,

  init: async () => {
    if (isCloud && supabase) {
      const { data } = await supabase.auth.getUser()
      const u = data.user
      if (u) {
        const handle = (u.user_metadata?.handle as string) || (u.email?.split('@')[0] ?? 'Ascender')
        await loadSaveFor(u.id)
        set({
          user: { id: u.id, username: handle, email: u.email ?? '', dob: u.user_metadata?.dob as string | undefined },
          ready: true,
        })
      } else {
        set({ user: null, ready: true })
      }
      return
    }
    const id = getSessionId()
    const acc = getAccounts().find((a) => a.id === id)
    set({
      user: acc ? { id: acc.id, username: acc.username, email: acc.email ?? '', dob: acc.dob } : null,
      ready: true,
    })
  },

  signup: async (username, email, password, dob) => {
    username = username.trim()
    email = email.trim()
    const handleErr = validateHandle(username)
    if (handleErr) return { ok: false, error: handleErr }
    if (!EMAIL_RE.test(email)) return { ok: false, error: 'Please enter a valid email address.' }
    if (password.length < 6) return { ok: false, error: 'Password must be at least 6 characters.' }
    const age = ageFromDob(dob)
    if (age === null) return { ok: false, error: 'Please enter your date of birth.' }
    if (age < 13) return { ok: false, error: 'You must be at least 13 to sign up.' }
    if (age > 120) return { ok: false, error: 'Please enter a valid date of birth.' }

    // ----- cloud signup -----
    if (isCloud && supabase) {
      // handle must be unique (profiles.handle); check before creating the user
      const { data: taken } = await supabase
        .from('profiles')
        .select('id')
        .ilike('handle', username)
        .maybeSingle()
      if (taken) return { ok: false, error: 'That username is taken.' }

      const res = await cloudSignUp(email, password, username, dob)
      if (res.error) return { ok: false, error: res.error }
      // ensure a session (if "confirm email" is off, signUp returns one)
      let user = res.data?.user ?? null
      if (!res.data?.session) {
        const si = await cloudSignIn(email, password)
        if (si.error)
          return { ok: false, error: 'Account created — please confirm your email, then log in.' }
        user = si.data?.user ?? user
      }
      if (!user) return { ok: false, error: 'Sign-up failed. Try again.' }
      await loadSaveFor(user.id)
      set({ user: { id: user.id, username, email, dob } })
      return { ok: true }
    }

    // ----- local signup -----
    const accounts = getAccounts()
    if (accounts.some((a) => a.username.toLowerCase() === username.toLowerCase()))
      return { ok: false, error: 'That username is taken.' }
    if (accounts.some((a) => (a.email ?? '').toLowerCase() === email.toLowerCase()))
      return { ok: false, error: 'An account with that email already exists.' }

    const salt = randomSalt()
    const hash = await hashPassword(password, salt)
    const id = uuid()
    saveAccounts([
      ...accounts,
      { id, username, email, dob, salt, hash, createdAt: new Date().toISOString() },
    ])
    setSessionId(id)
    useGame.getState().resetAll()
    await useGame.persist.rehydrate()
    set({ user: { id, username, email, dob } })
    return { ok: true }
  },

  // `identifier` is an email in cloud mode, a username in local mode
  login: async (identifier, password) => {
    identifier = identifier.trim()

    // ----- cloud login -----
    if (isCloud) {
      const res = await cloudSignIn(identifier, password)
      if (res.error || !res.data?.user)
        return { ok: false, error: res.error || 'Incorrect email or password.' }
      const u = res.data.user
      const handle = (u.user_metadata?.handle as string) || (u.email?.split('@')[0] ?? 'Ascender')
      await loadSaveFor(u.id)
      set({ user: { id: u.id, username: handle, email: u.email ?? '', dob: u.user_metadata?.dob as string | undefined } })
      return { ok: true }
    }

    // ----- local login -----
    const account = getAccounts().find((a) => a.username.toLowerCase() === identifier.toLowerCase())
    if (!account) return { ok: false, error: 'No account with that username.' }
    const hash = await hashPassword(password, account.salt)
    if (hash !== account.hash) return { ok: false, error: 'Incorrect password.' }
    setSessionId(null)
    useGame.getState().resetAll()
    setSessionId(account.id)
    await useGame.persist.rehydrate()
    set({ user: { id: account.id, username: account.username, email: account.email ?? '', dob: account.dob } })
    return { ok: true }
  },

  logout: () => {
    if (isCloud) void cloudSignOut()
    setSessionId(null)
    useGame.getState().resetAll()
    set({ user: null })
  },
}))
