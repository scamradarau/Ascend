import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// ================================================================
// Supabase client — the cloud backend for cross-device accounts,
// saves and leaderboards.
//
// It activates ONLY when both env vars are present:
//   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
// Without them, `isCloud` is false and the app runs in the existing
// local (per-device) mode — so nothing breaks before the project is set up.
//
// Set the vars in `app/.env.local` for local dev and in Netlify →
// Site configuration → Environment variables for production.
// ================================================================

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isCloud = Boolean(url && anonKey)

// Owner gating — only this email sees Owner Mode / the admin dashboard.
// Set VITE_OWNER_EMAIL (locally in .env.local, in prod in Netlify env vars).
export const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.toLowerCase()
export function isOwnerEmail(email?: string | null): boolean {
  return Boolean(OWNER_EMAIL && email && email.toLowerCase() === OWNER_EMAIL)
}

export const supabase: SupabaseClient | null = isCloud
  ? createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null

// ---------------------------------------------------------------
// Public profile row (drives leaderboards & player profiles)
// ---------------------------------------------------------------
export interface CloudProfile {
  id: string
  handle: string
  region: string
  age: number | null
  total_exp: number
  trust: number
  streak: number
  quests_this_month: number
  avatar: unknown
  earned_badges: string[]
  traits: { id: string; level: number }[]
  trait_exp?: Record<string, number>
  updated_at?: string
}

// Server-owned earned progress (Step 1 reads this back as the source of truth).
export type EarnedProgress = Pick<
  CloudProfile,
  'total_exp' | 'trust' | 'streak' | 'quests_this_month' | 'earned_badges' | 'trait_exp'
>

export async function fetchEarnedProgress(userId: string): Promise<EarnedProgress | null> {
  if (!supabase) return null
  const { data } = await supabase
    .from('profiles')
    .select('total_exp,trust,streak,quests_this_month,earned_badges,trait_exp')
    .eq('id', userId)
    .maybeSingle()
  return (data as EarnedProgress) ?? null
}

// ---- auth ----
export async function cloudSignUp(email: string, password: string, handle: string, dob?: string) {
  if (!supabase) return { error: 'Cloud not configured' as const }
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { handle, dob } },
  })
  return { data, error: error?.message }
}

export async function cloudSignIn(email: string, password: string) {
  if (!supabase) return { error: 'Cloud not configured' as const }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error: error?.message }
}

export async function cloudSignOut() {
  await supabase?.auth.signOut()
}

export async function cloudCurrentUser() {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user
}

// ---- save blob (private, per-user) ----
export async function loadCloudSave(userId: string): Promise<unknown | null> {
  if (!supabase) return null
  const { data } = await supabase.from('saves').select('data').eq('user_id', userId).maybeSingle()
  return data?.data ?? null
}

export async function saveCloudSave(userId: string, data: unknown) {
  if (!supabase) return
  await supabase.from('saves').upsert({ user_id: userId, data, updated_at: new Date().toISOString() })
}

// ---- public profile (leaderboard) ----
export async function upsertCloudProfile(p: Partial<CloudProfile> & { id: string }) {
  if (!supabase) return
  await supabase.from('profiles').upsert({ ...p, updated_at: new Date().toISOString() })
}

export async function fetchLeaderboard(): Promise<CloudProfile[]> {
  if (!supabase) return []
  const { data } = await supabase.from('profiles').select('*').limit(500)
  return (data as CloudProfile[]) ?? []
}

export async function fetchProfile(id: string): Promise<CloudProfile | null> {
  if (!supabase) return null
  const { data } = await supabase.from('profiles').select('*').eq('id', id).maybeSingle()
  return (data as CloudProfile) ?? null
}

// ---- proof photo storage ----
export async function uploadProof(userId: string, blob: Blob): Promise<string | null> {
  if (!supabase) return null
  const path = `${userId}/${Date.now()}.jpg`
  const { error } = await supabase.storage.from('proof').upload(path, blob, { contentType: 'image/jpeg' })
  if (error) return null
  const { data } = supabase.storage.from('proof').getPublicUrl(path)
  return data.publicUrl
}
