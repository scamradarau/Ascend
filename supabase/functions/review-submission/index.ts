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

// ---- Sydney time (resets anchored to Australia/Sydney, like the client) ----
const SYD = 'Australia/Sydney'
const sydDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: SYD, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
const sydWall = (d: Date) => new Date(d.toLocaleString('en-US', { timeZone: SYD }))
function sydMonthKey(d = new Date()): string {
  const w = sydWall(d)
  return `${w.getFullYear()}-${w.getMonth() + 1}`
}
function sydWeekKey(d = new Date()): string {
  const w = sydWall(d)
  const date = new Date(Date.UTC(w.getFullYear(), w.getMonth(), w.getDate()))
  const dayNum = (date.getUTCDay() + 6) % 7
  date.setUTCDate(date.getUTCDate() - dayNum + 3)
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4))
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7,
    )
  return `${date.getUTCFullYear()}-W${week}`
}

// is there already a VERIFIED submission for this quest on the same Sydney
// day as `atIso` (excluding this submission)? → that day's slot is used.
// deno-lint-ignore no-explicit-any
async function verifiedSameSydDay(
  admin: any,
  userId: string,
  questId: string,
  atIso: string,
  excludeId: string,
): Promise<boolean> {
  const at = new Date(atIso)
  const lo = new Date(at.getTime() - 48 * 3600 * 1000).toISOString()
  const hi = new Date(at.getTime() + 48 * 3600 * 1000).toISOString()
  const { data } = await admin
    .from('submissions')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('quest_id', questId)
    .eq('status', 'verified')
    .gte('created_at', lo)
    .lte('created_at', hi)
  const day = sydDay(at)
  return ((data ?? []) as { id: string; created_at: string }[]).some(
    (r) => r.id !== excludeId && sydDay(new Date(r.created_at)) === day,
  )
}

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
    .select('id, user_id, quest_id, status, exp_awarded, created_at')
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
    .select('id, trait_id, base_exp, scope, target')
    .eq('id', sub.quest_id)
    .maybeSingle()
  if (!quest) return json({ error: 'unknown quest' }, 400)

  // Multi-step quests (mains + weekly/monthly challenges) pay ONLY on
  // completion; each verified log advances progress by 1, max one per Sydney
  // day (approving extra same-day photos marks them verified but adds no
  // progress and no EXP).
  const isPracticalMain = quest.scope === 'main' && String(quest.id).startsWith('main-practical:')
  const subAt: string = (sub as { created_at?: string }).created_at ?? new Date().toISOString()
  let expAwarded = quest.base_exp
  let mainDone = false
  let dayUsed = false
  if (quest.scope !== 'main' && quest.scope !== 'weekly' && quest.scope !== 'monthly') {
    // daily: the day's slot may already be used by another approval
    if (await verifiedSameSydDay(admin, sub.user_id, quest.id, subAt, sub.id)) {
      expAwarded = 0
      dayUsed = true
    }
  } else {
    // progress row: mains use the quest id; challenges use "<quest>@<period>"
    const steps = quest.scope === 'main' ? (isPracticalMain ? 14 : 4) : (quest.target ?? 4)
    const rowId =
      quest.scope === 'main'
        ? quest.id
        : `${quest.id}@${quest.scope === 'weekly' ? sydWeekKey(new Date(subAt)) : sydMonthKey(new Date(subAt))}`
    expAwarded = 0
    const gated =
      (quest.scope !== 'main' || isPracticalMain) &&
      (await verifiedSameSydDay(admin, sub.user_id, quest.id, subAt, sub.id))
    if (gated) {
      dayUsed = true
    } else {
      const { data: qp } = await admin
        .from('quest_progress').select('count, done').eq('user_id', sub.user_id).eq('quest_id', rowId).maybeSingle()
      const prev = qp?.count ?? 0
      if (!qp?.done) {
        const next = Math.min(steps, prev + 1)
        mainDone = next >= steps
        expAwarded = mainDone ? quest.base_exp : 0 // full reward on completion only
        await admin.from('quest_progress').upsert({
          user_id: sub.user_id, quest_id: rowId, count: next, done: mainDone, updated_at: new Date().toISOString(),
        })
      }
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
    status: 'verified', exp_awarded: expAwarded, trust_delta: trustDelta,
    note: dayUsed ? 'Review: approved (extra log for that day — no additional progress).' : 'Review: approved.',
  }).eq('id', sub.id)

  return json({ status: 'verified', exp_awarded: expAwarded, main_done: mainDone, day_used: dayUsed })
})
