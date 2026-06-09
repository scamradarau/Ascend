-- ================================================================
-- PHASE 3 / STEP 3 — human review queue for photo quests.
-- Photo submissions land as status='pending'; an admin approves
-- (grants EXP, server-side) or rejects (no EXP, user redoes).
-- Run this in the SQL Editor, then seed yourself as an admin.
-- ================================================================

-- store a small proof thumbnail on the submission so reviewers can see it
alter table submissions add column if not exists thumb text;

-- who is allowed to review submissions
create table if not exists admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table admins enable row level security;
drop policy if exists "admins_read" on admins;
create policy "admins_read" on admins for select using (auth.uid() = user_id);
revoke insert, update, delete on admins from authenticated, anon;

-- let admins SELECT every submission (for the cross-user review queue).
-- (Normal users still only see their own via subs_select_own.)
drop policy if exists "subs_admin_read" on submissions;
create policy "subs_admin_read" on submissions for select
  using (auth.uid() in (select user_id from admins));

-- ----------------------------------------------------------------
-- SEED YOURSELF AS AN ADMIN — run this once, with your owner email:
--   insert into admins (user_id)
--   select id from auth.users where email = 'YOUR_OWNER_EMAIL'
--   on conflict do nothing;
-- ----------------------------------------------------------------
