// ================================================================
// review-submission — an ADMIN approves or rejects a pending photo
// submission. Approve grants the quest's EXP (server-side, service
// role) and marks it verified; reject marks it flagged (0 EXP). The
// submitter sees the outcome as an alert (derived from the resolved
// submission on the client). Deploy: `supabase functions deploy
// review-submission --no-verify-jwt`.
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

const expForLevel = (lvl: number) => Math.round(100 + (lvl - 1) * 35)
function levelFromTotalExp(total: number): number {
  let level = 1, rem = total
  while (rem >= expForLevel(level)) { rem -= expForLevel(level); level++ }
  return level
}
const clampTrust = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

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

  // caller must be an admin
  const { data: isAdmin } = await admin.from('admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (!isAdmin) return json({ error: 'forbidden' }, 403)

  const body = (await req.json().catch(() => ({}))) as { submission_id?: string; decision?: 'approve' | 'reject' }
  if (!body.submission_id || !body.decision) return json({ error: 'submission_id + decision required' }, 400)

  const { data: sub } = await admin
    .from('submissions')
    .select('id, user_id, quest_id, status, exp_awarded')
    .eq('id', body.submission_id)
    .maybeSingle()
  if (!sub) return json({ error: 'not found' }, 404)
  if (sub.status !== 'pending') return json({ error: 'already reviewed', status: sub.status }, 409)

  // ----- REJECT -----
  if (body.decision === 'reject') {
    await admin
      .from('submissions')
      .update({ status: 'flagged', exp_awarded: 0, trust_delta: -2, note: 'Review: did not pass.' })
      .eq('id', sub.id)
    return json({ status: 'flagged', exp_awarded: 0 })
  }

  // ----- APPROVE -----
  const { data: quest } = await admin
    .from('quests')
    .select('id, trait_id, base_exp, scope')
    .eq('id', sub.quest_id)
    .maybeSingle()
  if (!quest) return json({ error: 'unknown quest' }, 400)

  // main quests step in 4; others award the full catalog amount
  let expAwarded = quest.base_exp
  let mainDone = false
  if (quest.scope === 'main') {
    const { data: qp } = await admin
      .from('quest_progress').select('count, done').eq('user_id', sub.user_id).eq('quest_id', quest.id).maybeSingle()
    const prev = qp?.count ?? 0
    if (qp?.done) expAwarded = 0
    else {
      expAwarded = Math.round(quest.base_exp / 4)
      const next = Math.min(4, prev + 1)
      mainDone = next >= 4
      await admin.from('quest_progress').upsert({
        user_id: sub.user_id, quest_id: quest.id, count: next, done: mainDone, updated_at: new Date().toISOString(),
      })
    }
  }
  const trustDelta = 2

  const { data: prof } = await admin
    .from('profiles')
    .select('total_exp, trust, streak, quests_this_month, trait_exp, last_active')
    .eq('id', sub.user_id)
    .maybeSingle()

  const traitExp: Record<string, number> = { ...(prof?.trait_exp ?? {}) }
  if (quest.trait_id && expAwarded > 0) traitExp[quest.trait_id] = (traitExp[quest.trait_id] ?? 0) + expAwarded
  const traits = Object.entries(traitExp).map(([id, exp]) => ({ id, level: levelFromTotalExp(exp as number) }))

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let streak = prof?.streak ?? 0
  if (prof?.last_active !== today) streak = prof?.last_active === yesterday ? streak + 1 : 1

  await admin.from('profiles').update({
    total_exp: (prof?.total_exp ?? 0) + expAwarded,
    trust: clampTrust((prof?.trust ?? 100) + trustDelta),
    streak,
    quests_this_month: (prof?.quests_this_month ?? 0) + 1,
    trait_exp: traitExp, traits,
    last_active: today,
    updated_at: new Date().toISOString(),
  }).eq('id', sub.user_id)

  await admin.from('submissions').update({
    status: 'verified', exp_awarded: expAwarded, trust_delta: trustDelta, note: 'Review: approved.',
  }).eq('id', sub.id)

  return json({ status: 'verified', exp_awarded: expAwarded, main_done: mainDone })
})
