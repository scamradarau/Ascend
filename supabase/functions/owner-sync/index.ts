// ================================================================
// owner-sync — lets the OWNER account push its (normally server-owned)
// earned columns to its own profile, so owner-mode edits (set level,
// force-complete a quest) become server-authoritative and survive a
// reload / show on the leaderboard. Owner-gated by the OWNER_EMAIL secret.
// Deploy: dashboard → new function "owner-sync" (Verify JWT OFF).
// Requires the OWNER_EMAIL function secret (same value as VITE_OWNER_EMAIL).
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })
const clampTrust = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ownerEmail = Deno.env.get('OWNER_EMAIL')?.toLowerCase()
  if (!ownerEmail) return json({ error: 'OWNER_EMAIL not configured' }, 500)

  const asUser = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return json({ error: 'unauthorized' }, 401)
  if (user.email?.toLowerCase() !== ownerEmail) return json({ error: 'owner only' }, 403)

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const upd: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof b.total_exp === 'number') upd.total_exp = Math.max(0, Math.round(b.total_exp))
  if (typeof b.trust === 'number') upd.trust = clampTrust(b.trust)
  if (typeof b.streak === 'number') upd.streak = Math.max(0, Math.round(b.streak))
  if (typeof b.quests_this_month === 'number')
    upd.quests_this_month = Math.max(0, Math.round(b.quests_this_month))
  if (b.trait_exp && typeof b.trait_exp === 'object') upd.trait_exp = b.trait_exp
  if (Array.isArray(b.traits)) upd.traits = b.traits
  if (Array.isArray(b.earned_badges)) upd.earned_badges = b.earned_badges
  // the owner account always has Ascend Plus (so the ✦ shows to everyone)
  upd.plus = true

  const admin = createClient(url, service)
  const { error } = await admin.from('profiles').update(upd).eq('id', user.id)
  if (error) return json({ ok: false, error: error.message }, 500)
  return json({ ok: true })
})
