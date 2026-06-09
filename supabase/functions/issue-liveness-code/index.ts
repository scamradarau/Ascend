// ================================================================
// issue-liveness-code — mints a short-lived, single-use liveness code
// server-side. The browser can no longer generate its own valid code;
// verify-submission consumes it. Deploy: `supabase functions deploy
// issue-liveness-code`.
// ================================================================
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

// unambiguous alphabet (no O/0/I/1), 6 chars
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function makeCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return [...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join('')
}

const TTL_MS = 5 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'method' }, 405)

  const url = Deno.env.get('SUPABASE_URL')!
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const authHeader = req.headers.get('Authorization') ?? ''

  // identify caller from their JWT
  const asUser = createClient(url, anon, { global: { headers: { Authorization: authHeader } } })
  const { data: { user } } = await asUser.auth.getUser()
  if (!user) return json({ error: 'unauthorized' }, 401)

  let body: { quest_id?: string } = {}
  try {
    body = await req.json()
  } catch {
    /* empty body ok */
  }

  const admin = createClient(url, service)
  const code = makeCode()
  const expires_at = new Date(Date.now() + TTL_MS).toISOString()
  const { error } = await admin.from('liveness_codes').insert({
    code,
    user_id: user.id,
    quest_id: body.quest_id ?? null,
    expires_at,
  })
  if (error) return json({ error: error.message }, 500)

  return json({ code, expires_at })
})
