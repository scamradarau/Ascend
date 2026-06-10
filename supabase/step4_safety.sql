-- ================================================================
-- STEP 4 — Trust & Safety
--   • reports table (players report profiles / chat / DMs)
--   • admin read/resolve on reports
--   • admin "rename hammer": admins may update any profile row
-- Run this in the Supabase SQL editor AFTER step3_review.sql
-- (it relies on the `admins` table created there).
-- ================================================================

-- ---- reports ----
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid references auth.users(id) on delete set null,
  target_user uuid references auth.users(id) on delete cascade,
  context     text,                       -- 'profile' | 'guild' | 'dm'
  reason      text,
  detail      text,
  created_at  timestamptz default now(),
  resolved    boolean default false
);

alter table public.reports enable row level security;

-- any signed-in user may file a report (as themselves)
drop policy if exists reports_insert on public.reports;
create policy reports_insert on public.reports
  for insert to authenticated
  with check (auth.uid() = reporter);

-- only admins may read the queue
drop policy if exists reports_admin_read on public.reports;
create policy reports_admin_read on public.reports
  for select to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- only admins may resolve/update reports
drop policy if exists reports_admin_update on public.reports;
create policy reports_admin_update on public.reports
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

-- ---- rename hammer: admins can update any profile (e.g. an offensive handle) ----
-- Note: column-level grants still apply, so this only lets admins change the
-- columns authenticated users may already write (handle/avatar/theme), never
-- the service-role-only earned columns (total_exp, trust, …).
drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
