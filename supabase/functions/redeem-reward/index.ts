// ================================================================
// redeem-reward — claim a real reward. Enforces eligibility SERVER-SIDE
// (this is the part a client gate can't be trusted for, and rewards are
// the biggest cheat-for-value risk):
//   • Integrity (trust) >= 80
//   • character level >= the reward's required level
//   • not already requested (one pending/fulfilled per reward per user)
// On success it records a `pending` redemption for the owner to fulfil.
//
// Aether is EXP-derived (and EXP is server-authoritative via verified
// quests), so the balance can't be inflated without doing real work; the
// client deducts the Aether cost on success.
// Deploy: dashboard → new function "redeem-reward" (Verify JWT OFF).
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

// server-side reward catalog (must match the client Shop list)
const REWARDS: Record<string, { name: string; cost: number; reqLevel: number }> = {
  shoutout: { name: 'Community Shout-out', cost: 250, reqLevel: 1 },
  ebook: { name: 'Free Ebook (self-help classic)', cost: 500, reqLevel: 3 },
  meditation: { name: 'Free Meditation App — 1 Month', cost: 800, reqLevel: 5 },
  habit: { name: 'Free Habit-Tracker Premium — 1 Month', cost: 1000, reqLevel: 8 },
  fitness: { name: 'Free Fitness App — 1 Month', cost: 1400, reqLevel: 12 },
  discount: { name: 'Partner Discount Code', cost: 1800, reqLevel: 15 },
}

const REWARD_INTEGRITY_MIN = 80

const expForLevel = (lvl: number) => Math.round(100 + (lvl - 1) * 35)
function levelFromTotalExp(total: number): number {
  let level = 1
  let rem = total
  while (rem >= expForLevel(level)) {
    rem -= expForLevel(level)
    level++
  }
  return level
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

  const { reward_id } = (await req.json().catch(() => ({}))) as { reward_id?: string }
  if (!reward_id || !REWARDS[reward_id]) return json({ error: 'unknown reward' }, 400)
  const reward = REWARDS[reward_id]

  const admin = createClient(url, service)

  const { data: prof } = await admin
    .from('profiles')
    .select('total_exp, trust')
    .eq('id', user.id)
    .maybeSingle()
  if (!prof) return json({ error: 'no profile' }, 404)

  const trust = prof.trust ?? 100
  const level = levelFromTotalExp(prof.total_exp ?? 0)

  // ---- eligibility gates (server-enforced) ----
  if (trust < REWARD_INTEGRITY_MIN) {
    return json(
      { ok: false, error: `Integrity ${trust} is below ${REWARD_INTEGRITY_MIN} — rewards are locked.` },
      403,
    )
  }
  if (level < reward.reqLevel) {
    return json({ ok: false, error: `Reach level ${reward.reqLevel} to redeem this.` }, 403)
  }

  // one outstanding/fulfilled claim per reward per user
  const { data: existing } = await admin
    .from('reward_redemptions')
    .select('id, status')
    .eq('user_id', user.id)
    .eq('reward_id', reward_id)
    .in('status', ['pending', 'fulfilled'])
    .maybeSingle()
  if (existing) {
    return json({ ok: false, error: 'You’ve already claimed this reward.' }, 409)
  }

  const { data: row, error } = await admin
    .from('reward_redemptions')
    .insert({ user_id: user.id, reward_id, reward_name: reward.name, cost: reward.cost })
    .select('id')
    .maybeSingle()
  if (error) return json({ ok: false, error: 'Could not record redemption.' }, 500)

  return json({
    ok: true,
    redemption_id: row?.id,
    cost: reward.cost,
    message: `Claimed “${reward.name}” — we’ll be in touch to fulfil it.`,
  })
})
