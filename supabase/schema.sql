-- ================================================================
-- Ascend — Supabase schema. Paste into the Supabase SQL Editor and Run.
-- Creates tables, row-level security, and the proof storage bucket.
-- ================================================================

-- ---------- PROFILES (public-readable summary; powers leaderboards) ----------
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  region text default 'OCE',
  age int,
  total_exp int default 0,
  trust int default 100,
  streak int default 0,
  quests_this_month int default 0,
  avatar jsonb default '{}'::jsonb,
  earned_badges text[] default '{}',
  traits jsonb default '[]'::jsonb,           -- [{id, level}]
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ---------- SAVES (full game blob, private to the owner) ----------
create table if not exists saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- ---------- SUBMISSIONS (proof log / owner review queue) ----------
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  label text,
  method text,
  status text,                                -- verified | pending | flagged
  note text,
  meta jsonb,
  photo_url text,
  created_at timestamptz default now()
);

-- ---------- FRIENDS (directional; mutual = two rows) ----------
create table if not exists friends (
  user_id uuid references auth.users on delete cascade,
  friend_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

-- ================================================================
-- Row-Level Security
-- ================================================================
alter table profiles    enable row level security;
alter table saves       enable row level security;
alter table submissions enable row level security;
alter table friends     enable row level security;

-- profiles: world-readable, owner-writable
drop policy if exists "profiles_read"  on profiles;
drop policy if exists "profiles_write" on profiles;
create policy "profiles_read"  on profiles for select using (true);
create policy "profiles_write" on profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

-- saves: strictly private to the owner
drop policy if exists "saves_owner" on saves;
create policy "saves_owner" on saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- submissions: owner-only (add a reviewer role later for moderation)
drop policy if exists "subs_owner" on submissions;
create policy "subs_owner" on submissions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friends: owner manages own list
drop policy if exists "friends_owner" on friends;
create policy "friends_owner" on friends for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ================================================================
-- Auto-create a profile row when a new auth user signs up
-- ================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, handle)
  values (new.id, coalesce(new.raw_user_meta_data->>'handle', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ================================================================
-- Storage bucket for accountability photos (private)
-- ================================================================
insert into storage.buckets (id, name, public)
values ('proof', 'proof', true)
on conflict (id) do nothing;

-- a user can upload to their own folder: proof/<uid>/...
drop policy if exists "proof_upload_own" on storage.objects;
create policy "proof_upload_own" on storage.objects for insert
  with check (bucket_id = 'proof' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "proof_read" on storage.objects;
create policy "proof_read" on storage.objects for select
  using (bucket_id = 'proof');

-- ================================================================
-- FRIEND REQUESTS — friendships require acceptance.
-- A friendship exists when a row reaches status 'accepted'.
-- ================================================================
create table if not exists friend_requests (
  id uuid primary key default gen_random_uuid(),
  from_user uuid references auth.users on delete cascade,
  to_user   uuid references auth.users on delete cascade,
  status    text default 'pending',        -- pending | accepted | declined
  created_at timestamptz default now(),
  unique (from_user, to_user)
);
alter table friend_requests enable row level security;

drop policy if exists "fr_read"   on friend_requests;
drop policy if exists "fr_insert" on friend_requests;
drop policy if exists "fr_update" on friend_requests;
drop policy if exists "fr_delete" on friend_requests;
-- either party can see the request
create policy "fr_read" on friend_requests for select
  using (auth.uid() = from_user or auth.uid() = to_user);
-- only the sender can create it (for themselves)
create policy "fr_insert" on friend_requests for insert
  with check (auth.uid() = from_user);
-- only the recipient can accept/decline
create policy "fr_update" on friend_requests for update
  using (auth.uid() = to_user) with check (auth.uid() = to_user);
-- either party can remove it (cancel / unfriend)
create policy "fr_delete" on friend_requests for delete
  using (auth.uid() = from_user or auth.uid() = to_user);

-- ================================================================
-- MESSAGES — private 1:1 direct messages between users.
-- ================================================================
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender    uuid references auth.users on delete cascade,
  recipient uuid references auth.users on delete cascade,
  body      text not null,
  created_at timestamptz default now(),
  read_at   timestamptz
);
alter table messages enable row level security;
create index if not exists messages_pair_idx on messages (sender, recipient, created_at);

drop policy if exists "msg_read"   on messages;
drop policy if exists "msg_insert" on messages;
drop policy if exists "msg_update" on messages;
-- sender or recipient can read
create policy "msg_read" on messages for select
  using (auth.uid() = sender or auth.uid() = recipient);
-- only the sender can send
create policy "msg_insert" on messages for insert
  with check (auth.uid() = sender);
-- only the recipient can mark read
create policy "msg_update" on messages for update
  using (auth.uid() = recipient) with check (auth.uid() = recipient);
