-- ================================================================
-- PHASE 3 / STEP 2 — server-side tables (safe to run now; additive)
-- These support the verify-submission + issue-liveness-code Edge
-- Functions. They do NOT lock anything down on their own.
-- Run this, then run _quests_seed.sql to populate the catalog.
-- ================================================================

-- server-owned streak anchor (date of last non-flagged verified activity)
alter table profiles add column if not exists last_active date;

-- ---------- QUEST CATALOG (server source of truth for EXP) ----------
create table if not exists quests (
  id        text primary key,          -- e.g. 'focus:focus-med', 'main:focus', 'w-gym4'
  trait_id  text,                       -- null for global challenges
  base_exp  int not null default 0,
  method    text,                       -- expected verification method
  scope     text not null               -- daily | main | weekly | monthly
);
alter table quests enable row level security;
drop policy if exists "quests_read" on quests;
-- catalog is readable by signed-in users (UI can show rewards); only
-- service_role writes it (no insert/update/delete granted to authenticated).
create policy "quests_read" on quests for select using (auth.uid() is not null);
revoke insert, update, delete on quests from authenticated, anon;

-- ---------- LIVENESS CODES (server-issued nonces) ----------
create table if not exists liveness_codes (
  code        text primary key,
  user_id     uuid references auth.users on delete cascade,
  quest_id    text,
  issued_at   timestamptz default now(),
  expires_at  timestamptz not null,
  consumed_at timestamptz
);
alter table liveness_codes enable row level security;
-- no policies for authenticated/anon => only service_role (Edge Functions)
-- can read/write. The browser can never mint or inspect a valid code.
revoke all on liveness_codes from authenticated, anon;

-- ---------- QUEST PROGRESS (server-owned main-quest stepping) ----------
create table if not exists quest_progress (
  user_id   uuid references auth.users on delete cascade,
  quest_id  text,
  count     int default 0,             -- verified check-ins so far
  done      boolean default false,
  updated_at timestamptz default now(),
  primary key (user_id, quest_id)
);
alter table quest_progress enable row level security;
drop policy if exists "qp_read_own" on quest_progress;
-- owner may read their progress; only service_role writes it
create policy "qp_read_own" on quest_progress for select using (auth.uid() = user_id);
revoke insert, update, delete on quest_progress from authenticated, anon;
