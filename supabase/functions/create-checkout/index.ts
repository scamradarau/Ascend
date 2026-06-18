// ================================================================
// create-checkout — builds a Stripe Checkout session for Ascend Plus.
//
// Calls the Stripe REST API directly (no SDK import → robust to deploy).
// Drop-in: until the Stripe secrets are set it returns a clear
// "not configured" error and the Plus page shows a waitlist state.
//
// Required function secrets (set when Stripe is ready):
//   STRIPE_SECRET_KEY        sk_live_… (or sk_test_…)
//   STRIPE_PRICE_MONTHLY     price_…  (A$7.99 / month, recurring)
//   STRIPE_PRICE_ANNUAL      price_…  (A$49.99 / year, recurring)
//   STRIPE_PRICE_LIFETIME    price_…  (A$59 one-off)
// Optional:
//   SITE_URL                 https://your-domain  (success/cancel return)
//
// Deploy: dashboard → new function "create-checkout" (Verify JWT OFF —
// we verify the user manually below).
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } })

type Plan = 'monthly' | 'annual' | 'lifetime'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeKey) {
    // Diagnostic (names only — never values): shows which Stripe/Site secrets
    // this function can actually see, so a typo or missing secret is obvious
    // in the Edge Function logs.
    try {
      const seen = Object.keys(Deno.env.toObject()).filter(
        (k) => k.startsWith('STRIPE') || k === 'SITE_URL',
      )
      console.log('create-checkout: STRIPE_SECRET_KEY not found. Secrets visible to this function:', seen)
    } catch (_e) {
      console.log('create-checkout: STRIPE_SECRET_KEY not found (could not enumerate env).')
    }
    // Drop-in state: payments aren't switched on yet.
    return json({ ok: false, error: 'Payments are not open yet. Join the founders list and we’ll let you know.' }, 200)
  }

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!

  // who is buying
  const asUser = createClient(url, anon, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  })
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return json({ error: 'unauthorized' }, 401)

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: Plan }
  const priceEnv: Record<Plan, string> = {
    monthly: 'STRIPE_PRICE_MONTHLY',
    annual: 'STRIPE_PRICE_ANNUAL',
    lifetime: 'STRIPE_PRICE_LIFETIME',
  }
  if (!plan || !priceEnv[plan]) return json({ error: 'unknown plan' }, 400)
  const price = Deno.env.get(priceEnv[plan])
  if (!price) return json({ ok: false, error: `Plan "${plan}" isn’t configured yet.` }, 200)

  const site = (Deno.env.get('SITE_URL') ?? req.headers.get('origin') ?? 'https://playascend.com.au').replace(/\/$/, '')
  const mode = plan === 'lifetime' ? 'payment' : 'subscription'

  // Stripe wants application/x-www-form-urlencoded
  const form = new URLSearchParams()
  form.set('mode', mode)
  form.set('line_items[0][price]', price)
  form.set('line_items[0][quantity]', '1')
  form.set('success_url', `${site}/#/app/plus?success=1`)
  form.set('cancel_url', `${site}/#/app/plus?canceled=1`)
  form.set('client_reference_id', user.id)
  if (user.email) form.set('customer_email', user.email)
  form.set('metadata[user_id]', user.id)
  form.set('metadata[plan]', plan)
  // carry the user id onto the subscription too, so renewal/cancel events map back
  if (mode === 'subscription') {
    form.set('subscription_data[metadata][user_id]', user.id)
    // 7-day free trial — the card is collected now, first charge is in 7 days.
    form.set('subscription_data[trial_period_days]', '7')
  }
  if (mode === 'payment') form.set('payment_intent_data[metadata][user_id]', user.id)

  const resp = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  const data = await resp.json().catch(() => ({}))
  if (!resp.ok) {
    const msg = (data as { error?: { message?: string } })?.error?.message ?? 'Stripe error'
    return json({ ok: false, error: msg }, 200)
  }
  return json({ ok: true, url: (data as { url?: string }).url })
})
