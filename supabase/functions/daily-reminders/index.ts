// ================================================================
// daily-reminders — the re-engagement blast. Finds players who have a
// reminder subscription but HAVEN'T checked in today, and pushes them a
// nudge to keep their streak alive. Meant to be invoked by a scheduler
// (Supabase cron / pg_cron) once a day at the time you choose.
//
// Auth: protected by a shared CRON_SECRET (sent as ?secret= or the
// x-cron-secret header) so only your scheduler can trigger the blast.
// Secrets: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT, CRON_SECRET
// Deploy: dashboard → new function "daily-reminders" (Verify JWT OFF).
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' }
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const url = Deno.env.get('SUPABASE_URL')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY')
  const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY')
  const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:hello@ascend.game'
  const CRON_SECRET = Deno.env.get('CRON_SECRET')
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'VAPID keys not configured' }, 500)

  // only the scheduler may trigger this
  const provided = new URL(req.url).searchParams.get('secret') ?? req.headers.get('x-cron-secret')
  if (CRON_SECRET && provided !== CRON_SECRET) return json({ error: 'forbidden' }, 403)

  const admin = createClient(url, service)
  const today = new Date().toISOString().slice(0, 10)

  // who has reminders on?
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth, user_id')
    .eq('reminders_enabled', true)
  if (!subs || subs.length === 0) return json({ ok: true, sent: 0, reason: 'no subscriptions' })

  // who hasn't been active today? (last_active is written on each verified quest)
  const ids = [...new Set(subs.map((s) => s.user_id))]
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, handle, streak, last_active')
    .in('id', ids)
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]))

  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)

  let sent = 0
  for (const s of subs) {
    const p = byId.get(s.user_id)
    if (!p) continue
    if (p.last_active === today) continue // already showed up today — leave them be

    const streak = p.streak ?? 0
    const body =
      streak > 0
        ? `🔥 Your ${streak}-day streak is on the line. One quest keeps the chain alive.`
        : 'A two-minute quest is all it takes to move today. Your character is waiting.'
    const payload = JSON.stringify({
      title: streak > 0 ? `Don’t break the chain, ${p.handle ?? 'Ascender'}` : 'Time to ascend',
      body,
      url: '/#/app/quests',
      tag: 'ascend-daily',
    })
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload)
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
    }
  }
  return json({ ok: true, sent })
})
