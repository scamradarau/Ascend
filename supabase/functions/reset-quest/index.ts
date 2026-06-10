// ================================================================
// reset-quest — lets a player reset an UNFINISHED main quest's progress
// (e.g. after changing the commitment for a 2-week challenge).
//
// Safe by construction: it refuses to reset a completed quest, and because
// main quests only pay EXP on completion (see verify-submission), an
// unfinished quest has paid out nothing — so resetting can never farm EXP.
// Deploy: `supabase functions deploy reset-quest`  (Verify JWT OFF)
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

  const { quest_id } = (await req.json().catch(() => ({}))) as { quest_id?: string }
  if (!quest_id) return json({ error: 'quest_id required' }, 400)

  const admin = createClient(url, service)

  // refuse to reset a completed quest (would let EXP be re-earned)
  const { data: qp } = await admin
    .from('quest_progress')
    .select('done')
    .eq('user_id', user.id)
    .eq('quest_id', quest_id)
    .maybeSingle()
  if (qp?.done) return json({ ok: false, error: 'Quest already complete — cannot reset.' }, 409)

  await admin.from('quest_progress').delete().eq('user_id', user.id).eq('quest_id', quest_id)
  return json({ ok: true })
})
