# Phase 3 / Step 2 — deploy & test (server-authoritative verification)

These artifacts are **inert** until deployed and called. Deploying them does
**not** change the live client (which still computes progress itself for now).
After this is deployed and tested, the next step rewires the client to call
`verify-submission` and flips the RLS write-revokes.

## 1. SQL (Supabase → SQL Editor, run in order)
1. `step2_tables.sql` — creates `quests`, `liveness_codes`, `quest_progress`
   and adds `profiles.last_active`. Safe/additive.
2. `_quests_seed.sql` — populates the `quests` catalog (122 rows; EXP values
   generated from `src/data`). Idempotent (upsert). Regenerate if quest EXP
   changes (see note at top of that file).

## 2. Edge Functions (Supabase CLI)
You need the CLI logged in and linked to the project:
```
supabase login
supabase link --project-ref iejsdomfsosogdlpdcnw
supabase functions deploy issue-liveness-code
supabase functions deploy verify-submission
```
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are
injected into Edge Functions automatically — no manual secrets needed.

## 3. Smoke test (with a logged-in user's access token)
Grab a JWT from the app (DevTools → Application → Local Storage → the
`sb-...-auth-token` access_token), then:
```
# issue a code
curl -i -X POST "$SUPABASE_URL/functions/v1/issue-liveness-code" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -d '{"quest_id":"focus:focus-deep"}'
# -> { "code":"K7QFР3", "expires_at":"..." }

# verify a submission using that code
curl -i -X POST "$SUPABASE_URL/functions/v1/verify-submission" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" -H "Content-Type: application/json" \
  -d '{"quest_id":"focus:focus-deep","method":"focus-timer","liveness_code":"<CODE>","captured_at":"2026-06-09T00:00:00Z"}'
# -> { "status":"verified","exp_awarded":35,"trust_delta":1,... }
```
Verify in the DB: `profiles.total_exp` rose by 35, `trait_exp.focus` rose, a
`submissions` row exists with server-set `status`/`exp_awarded`, and reusing
the same code returns `status:"flagged"` (single-use).

## What's enforced once deployed + wired
- EXP comes from the `quests` catalog, never the client.
- Liveness code is server-issued + single-use + 5-min TTL.
- GPS range + impossible-travel (>900 km/h) checks.
- Image hashed (SHA-256) at submission when an `image_path` is provided.
- `status`, `exp_awarded`, `trust`, `streak`, `trait_exp` written only by the
  service role inside the function.

## Still pending after this deploys + tests green
- Client rewire: request code → burn it → upload frame → call
  `verify-submission` → reconcile from `profiles`.
- Flip the STEP 2 write-lockdown block in `schema.sql` (+ switch
  `upsertCloudProfile` to cosmetic-only). The signup trigger is already
  `security definer`, so new signups keep working after the profiles INSERT
  revoke.
