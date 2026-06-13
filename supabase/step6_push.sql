-- ================================================================
-- STEP 6 — Push notifications: subscription registry.
-- Stores each device's Web Push subscription so the backend can send
-- daily streak reminders. RLS: a user only ever sees/edits their own
-- rows; the service role (Edge Functions) can read all to send.
-- Run in the Supabase SQL editor. Safe to re-run.
-- ================================================================

create table if not exists push_subscriptions (
  endpoint text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  p256dh text not null,
  auth text not null,
  reminders_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx on push_subscriptions (user_id);

alter table push_subscriptions enable row level security;

drop policy if exists "push - select own" on push_subscriptions;
create policy "push - select own" on push_subscriptions
  for select using (auth.uid() = user_id);

drop policy if exists "push - insert own" on push_subscriptions;
create policy "push - insert own" on push_subscriptions
  for insert with check (auth.uid() = user_id);

drop policy if exists "push - update own" on push_subscriptions;
create policy "push - update own" on push_subscriptions
  for update using (auth.uid() = user_id);

drop policy if exists "push - delete own" on push_subscriptions;
create policy "push - delete own" on push_subscriptions
  for delete using (auth.uid() = user_id);
