// ================================================================
// verify-submission — the server-authoritative verification core.
// Called DIRECTLY by the client (not a DB webhook) with the raw proof.
// It:
//   1. authenticates the caller,
//   2. validates the server-issued liveness code (single-use, unexpired),
//   3. sanity/plausibility-checks GPS (range + impossible-travel),
//   4. looks up EXP from the server `quests` catalog (never trusts the
//      client's claimed amount),
//   5. sets status server-side (verified=full, pending=½, flagged=0),
//   6. applies EXP / trait_exp / trust / streak to profiles via the
//      service role, and writes an immutable submission row.
// Deploy: `supabase functions deploy verify-submission`.
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

// ---- leveling (ported from src/data/leveling.ts) ----
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
const clampTrust = (n: number) => Math.max(0, Math.min(100, Math.round(n)))

function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

interface Body {
  quest_id?: string
  method?: string
  label?: string
  liveness_code?: string
  captured_at?: string
  gps?: { lat: number; lng: number; accuracy?: number } | null
  image_path?: string | null
  scene_label?: string | null
  scene_prob?: number | null
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

  const body = (await req.json().catch(() => ({}))) as Body
  if (!body.quest_id) return json({ error: 'quest_id required' }, 400)

  const admin = createClient(url, service)

  // --- 1. quest catalog (server EXP source of truth) ---
  const { data: quest } = await admin
    .from('quests')
    .select('id, trait_id, base_exp, scope')
    .eq('id', body.quest_id)
    .maybeSingle()
  if (!quest) return json({ error: 'unknown quest' }, 400)

  const flags: string[] = []

  // --- 2. liveness code (server-issued, single-use, unexpired) ---
  let livenessOk = false
  if (body.liveness_code) {
    const { data: lc } = await admin
      .from('liveness_codes')
      .select('code, expires_at, consumed_at')
      .eq('code', body.liveness_code)
      .eq('user_id', user.id)
      .maybeSingle()
    if (lc && !lc.consumed_at && new Date(lc.expires_at) > new Date()) {
      livenessOk = true
      await admin.from('liveness_codes').update({ consumed_at: new Date().toISOString() }).eq('code', lc.code)
    }
  }
  if (!livenessOk) flags.push('Liveness code missing/invalid/expired')

  // --- 3. GPS range + impossible-travel ---
  let gpsOk = true
  if (body.gps) {
    const { lat, lng } = body.gps
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      gpsOk = false
      flags.push('GPS out of range')
    } else {
      const { data: last } = await admin
        .from('submissions')
        .select('gps, created_at')
        .eq('user_id', user.id)
        .not('gps', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (last?.gps) {
        const km = haversineKm(body.gps, last.gps as { lat: number; lng: number })
        const hrs = (Date.now() - new Date(last.created_at).getTime()) / 3.6e6
        if (hrs > 0 && km / hrs > 900) {
          gpsOk = false
          flags.push('Impossible travel since last capture')
        }
      }
    }
  }

  // --- 4. status (server-decided) ---
  // flagged: faked liveness or impossible GPS. pending: weak signal. verified: clean.
  // daily dedupe — one verified daily per quest per user per UTC day
  let dupe = false
  if (quest.scope === 'daily') {
    const dayStart = new Date()
    dayStart.setUTCHours(0, 0, 0, 0)
    const { data: already } = await admin
      .from('submissions')
      .select('id')
      .eq('user_id', user.id)
      .eq('quest_id', quest.id)
      .eq('status', 'verified')
      .gte('created_at', dayStart.toISOString())
      .limit(1)
      .maybeSingle()
    if (already) {
      dupe = true
      flags.push('Already completed today')
    }
  }

  let status: 'verified' | 'pending' | 'flagged'
  if (!livenessOk || !gpsOk || dupe) status = 'flagged'
  else if (body.scene_label === '__mismatch__') status = 'flagged'
  else status = 'verified'
  // (scene re-run server-side is a later hardening; client scene recorded only)

  const mult = status === 'verified' ? 1 : status === 'pending' ? 0.5 : 0

  // --- 5. EXP from catalog (main quests step in 4) ---
  let expBase = quest.base_exp
  let mainDone = false
  if (quest.scope === 'main') {
    const { data: qp } = await admin
      .from('quest_progress')
      .select('count, done')
      .eq('user_id', user.id)
      .eq('quest_id', quest.id)
      .maybeSingle()
    const prevCount = qp?.count ?? 0
    if (qp?.done) {
      expBase = 0 // already finished
    } else {
      expBase = Math.round(quest.base_exp / 4)
      if (status !== 'flagged') {
        const nextCount = Math.min(4, prevCount + 1)
        mainDone = nextCount >= 4
        await admin.from('quest_progress').upsert({
          user_id: user.id,
          quest_id: quest.id,
          count: nextCount,
          done: mainDone,
          updated_at: new Date().toISOString(),
        })
      }
    }
  }
  const expAwarded = Math.round(expBase * mult)
  const trustDelta = status === 'verified' ? 1 : status === 'pending' ? 0 : -8

  // --- optional image hash (step 4) ---
  let imageHash: string | null = null
  if (body.image_path) {
    try {
      const { data: blob } = await admin.storage.from('proof').download(body.image_path)
      if (blob) {
        const buf = await blob.arrayBuffer()
        const digest = await crypto.subtle.digest('SHA-256', buf)
        imageHash = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
      }
    } catch {
      /* hashing is best-effort; never blocks verification */
    }
  }

  // --- 6. apply to profiles (service role; the only writer) ---
  const { data: prof } = await admin
    .from('profiles')
    .select('total_exp, trust, streak, quests_this_month, trait_exp, traits, last_active')
    .eq('id', user.id)
    .maybeSingle()

  const traitExp: Record<string, number> = { ...(prof?.trait_exp ?? {}) }
  if (quest.trait_id && expAwarded > 0) {
    traitExp[quest.trait_id] = (traitExp[quest.trait_id] ?? 0) + expAwarded
  }
  const traits = Object.entries(traitExp).map(([id, exp]) => ({ id, level: levelFromTotalExp(exp) }))

  // streak (server-owned, date-based)
  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  let streak = prof?.streak ?? 0
  if (status !== 'flagged' && prof?.last_active !== today) {
    streak = prof?.last_active === yesterday ? streak + 1 : 1
  }

  await admin
    .from('profiles')
    .update({
      total_exp: (prof?.total_exp ?? 0) + expAwarded,
      trust: clampTrust((prof?.trust ?? 100) + trustDelta),
      streak,
      quests_this_month: (prof?.quests_this_month ?? 0) + (status !== 'flagged' ? 1 : 0),
      trait_exp: traitExp,
      traits,
      last_active: status !== 'flagged' ? today : prof?.last_active ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  // immutable submission record
  await admin.from('submissions').insert({
    user_id: user.id,
    quest_id: quest.id,
    method: body.method ?? null,
    label: body.label ?? null,
    status,
    liveness_code: body.liveness_code ?? null,
    captured_at: body.captured_at ?? null,
    gps: body.gps ?? null,
    image_path: body.image_path ?? null,
    image_hash: imageHash,
    scene_label: body.scene_label ?? null,
    scene_prob: body.scene_prob ?? null,
    exp_awarded: expAwarded,
    trust_delta: trustDelta,
    note: flags.length ? flags.join('; ') : `Verified (${quest.scope}).`,
  })

  return json({
    status,
    exp_awarded: expAwarded,
    trust_delta: trustDelta,
    main_done: mainDone,
    flags,
  })
})
