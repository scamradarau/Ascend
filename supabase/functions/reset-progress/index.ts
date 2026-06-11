// ================================================================
// reset-progress — a player wipes THEIR OWN earned progress for a
// fresh start ("Reset all progress" in Settings). Server-side because
// profiles' earned columns are service-role-only: a local-only reset
// would be rolled back by the next earned-values sync.
//
// Resets: total_exp, trait_exp/traits, streak, quests_this_month,
// trust (back to 100), earned badges; deletes the player's
// quest_progress rows and their own submissions (so daily/period
// gates don't block the fresh start). Only ever touches the caller.
// Deploy: dashboard → new function "reset-progress" (Verify JWT OFF).
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  const asUser = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return json({ error: 'unauthorized' }, 401)

  const admin = createClient(url, service)

  await admin
    .from('profiles')
    .update({
      total_exp: 0,
      trait_exp: {},
      traits: [],
      streak: 0,
      quests_this_month: 0,
      trust: 100,
      earned_badges: [],
      last_active: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  await admin.from('quest_progress').delete().eq('user_id', user.id)
  await admin.from('submissions').delete().eq('user_id', user.id)
  await admin.from('liveness_codes').delete().eq('user_id', user.id)

  return json({ ok: true })
})
