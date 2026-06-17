-- ================================================================
-- STEP 8 — Ascend Plus membership.
-- Plus is an entitlement flipped ONLY by Stripe (via the stripe-webhook
-- Edge Function, service role). Clients can READ it (it's part of the
-- public profile, so the leaderboard can show a ✦ mark) but never WRITE
-- it — same lockdown pattern as the earned columns.
-- Run in the Supabase SQL editor. Safe to re-run.
-- ================================================================

-- 1. membership columns on profiles
alter table profiles add column if not exists plus boolean not null default false;
alter table profiles add column if not exists plus_since timestamptz;
alter table profiles add column if not exists plus_plan text;          -- monthly | annual | lifetime
alter table profiles add column if not exists stripe_customer_id text;
alter table profiles add column if not exists stripe_subscription_id text;

-- 2. lockdown — authenticated/anon may not write membership columns.
-- (The webhook uses the service role, which bypasses RLS + column grants.)
revoke update (plus, plus_since, plus_plan, stripe_customer_id, stripe_subscription_id)
  on profiles from authenticated, anon;

-- 3. Stripe webhook idempotency — every processed event id is recorded so a
-- re-delivered event is a no-op. Service-role only.
create table if not exists stripe_events (
  id text primary key,                 -- Stripe event id (evt_...)
  type text,
  created_at timestamptz not null default now()
);
alter table stripe_events enable row level security;
-- no policies → only the service role can touch it
