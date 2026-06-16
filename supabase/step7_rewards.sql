-- ================================================================
-- STEP 7 — Reward redemptions.
-- A redemption is a request to claim a real reward; the owner fulfils it.
-- Eligibility (Integrity 80+, level) is enforced server-side in the
-- `redeem-reward` Edge Function (service role inserts here). Players can
-- only read their own; admins read/fulfil all.
-- Run in the Supabase SQL editor. Safe to re-run.
-- ================================================================

create table if not exists reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  reward_id text not null,
  reward_name text not null,
  cost int not null default 0,
  status text not null default 'pending', -- pending | fulfilled | rejected
  created_at timestamptz not null default now(),
  fulfilled_at timestamptz
);

create index if not exists reward_redemptions_user_idx on reward_redemptions (user_id);
create index if not exists reward_redemptions_status_idx on reward_redemptions (status);

alter table reward_redemptions enable row level security;

-- players read their own redemptions
drop policy if exists "redemptions - select own" on reward_redemptions;
create policy "redemptions - select own" on reward_redemptions
  for select using (auth.uid() = user_id);

-- admins read every redemption (fulfilment queue)
drop policy if exists "redemptions - admin read" on reward_redemptions;
create policy "redemptions - admin read" on reward_redemptions
  for select using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- admins update status (fulfil / reject)
drop policy if exists "redemptions - admin update" on reward_redemptions;
create policy "redemptions - admin update" on reward_redemptions
  for update using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- only the service role (the Edge Function) may INSERT — never clients directly
revoke insert on reward_redemptions from authenticated, anon;
