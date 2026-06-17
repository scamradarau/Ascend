// ================================================================
// stripe-webhook — the ONLY writer of profiles.plus.
// Verifies the Stripe signature with Web Crypto (no SDK), then flips the
// membership flag on the matching profile:
//   • checkout.session.completed        → plus = true
//   • customer.subscription.deleted     → plus = false
//   • customer.subscription.updated     → plus = (status active/trialing)
// Idempotent: each event id is recorded in stripe_events; re-deliveries no-op.
//
// Required function secrets:
//   STRIPE_SECRET_KEY        (unused here but kept for parity)
//   STRIPE_WEBHOOK_SECRET    whsec_…  (from the Stripe webhook endpoint)
//
// Deploy: dashboard → new function "stripe-webhook" (Verify JWT OFF —
// Stripe does not send a Supabase JWT; we verify its signature instead).
// In Stripe → Developers → Webhooks, add this function's URL and subscribe
// to: checkout.session.completed, customer.subscription.deleted,
// customer.subscription.updated.
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const enc = new TextEncoder()

async function hmacHex(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(msg))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// constant-time-ish compare
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let out = 0
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return out === 0
}

async function verify(raw: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false
  const parts = Object.fromEntries(header.split(',').map((p) => p.split('=') as [string, string]))
  const t = parts['t']
  const v1 = parts['v1']
  if (!t || !v1) return false
  // reject events older than 5 minutes (replay protection)
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false
  const expected = await hmacHex(secret, `${t}.${raw}`)
  return safeEqual(expected, v1)
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('method', { status: 405 })

  const whSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
  if (!whSecret) return new Response('not configured', { status: 200 })

  const raw = await req.text()
  const ok = await verify(raw, req.headers.get('stripe-signature'), whSecret)
  if (!ok) return new Response('bad signature', { status: 400 })

  const event = JSON.parse(raw) as { id: string; type: string; data: { object: Record<string, unknown> } }

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  // idempotency — record the event; if it already exists, we've handled it.
  const { error: dupErr } = await admin.from('stripe_events').insert({ id: event.id, type: event.type })
  if (dupErr) return new Response('ok (dup)', { status: 200 })

  const obj = event.data.object
  const meta = (obj.metadata ?? {}) as Record<string, string>

  // resolve the user this event belongs to
  async function resolveUserId(): Promise<string | null> {
    if (meta.user_id) return meta.user_id
    if (obj.client_reference_id) return obj.client_reference_id as string
    const sub = obj.id as string | undefined
    const cust = obj.customer as string | undefined
    if (cust) {
      const { data } = await admin.from('profiles').select('id').eq('stripe_customer_id', cust).maybeSingle()
      if (data?.id) return data.id
    }
    if (sub) {
      const { data } = await admin.from('profiles').select('id').eq('stripe_subscription_id', sub).maybeSingle()
      if (data?.id) return data.id
    }
    return null
  }

  const userId = await resolveUserId()
  if (!userId) return new Response('ok (no user)', { status: 200 })

  const setPlus = async (plus: boolean, extra: Record<string, unknown> = {}) => {
    await admin
      .from('profiles')
      .update({ plus, ...extra, updated_at: new Date().toISOString() })
      .eq('id', userId)
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await setPlus(true, {
        plus_since: new Date().toISOString(),
        plus_plan: meta.plan ?? null,
        stripe_customer_id: (obj.customer as string) ?? null,
        stripe_subscription_id: (obj.subscription as string) ?? null,
      })
      break
    case 'customer.subscription.updated': {
      const status = obj.status as string
      const active = status === 'active' || status === 'trialing'
      await setPlus(active)
      break
    }
    case 'customer.subscription.deleted':
      await setPlus(false)
      break
    default:
      break
  }

  return new Response('ok', { status: 200 })
})
