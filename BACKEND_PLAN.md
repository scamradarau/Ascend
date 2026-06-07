# Ascend — Cross-Device Backend Plan (Supabase)

Today Ascend is a static SPA: accounts, saves and leaderboards live in each
device's `localStorage`. To make accounts and leaderboards **sync across
devices**, we add a hosted backend. The cleanest fit for a static Netlify SPA
is **Supabase** — it gives us, with no server to run:

- **Auth** (email + password, email verification, password reset) → replaces the local PBKDF2 auth
- **Postgres** (profiles, progress, submissions, friends) → replaces local saves + powers real leaderboards
- **Storage** (verification photos) → real, reviewable proof instead of local thumbnails
- **Row-Level Security (RLS)** so each user can only read/write their own data, while public profile/leaderboard fields stay readable

Free tier is enough to launch. The whole app stays on Netlify; the browser talks
to Supabase directly via `@supabase/supabase-js`.

---

## What changes vs. what stays

**Stays the same** (≈90% of the app):
- All game logic, the trait library, verification UI, MobileNet scene-check,
  themes, avatar, challenges, Codex — untouched.

**Changes** (isolated to the data layer):
- `src/store/auth.ts` → calls `supabase.auth` instead of localStorage.
- `src/store/useGame.ts` persistence → reads/writes the player's row in Postgres
  (debounced), instead of the localStorage `persist` storage.
- `src/store/leaderboard.ts` → queries a Postgres view instead of scanning local keys.
- Camera proof → uploads the JPEG to Supabase Storage; the row stores the URL.

---

## Schema (run in Supabase SQL editor)

```sql
-- profile: one row per auth user, public-readable summary fields
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  handle text unique not null,
  region text default 'OCE',
  age int,
  total_exp int default 0,
  season_xp int default 0,
  aether int default 250,
  trust int default 100,
  streak int default 0,
  avatar jsonb default '{}'::jsonb,
  earned_badges text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- full game save blob (private to the owner) for everything not on the board
create table saves (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz default now()
);

-- active trait levels (drives the Stat leaderboard)
create table trait_progress (
  user_id uuid references auth.users on delete cascade,
  trait_id text not null,
  exp int default 0,
  main_quest_progress real default 0,
  main_quest_done bool default false,
  primary key (user_id, trait_id)
);

-- verification submissions (proof log + owner review queue)
create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade,
  label text, method text, status text,         -- verified | pending | flagged
  note text, meta jsonb, photo_url text,
  created_at timestamptz default now()
);

-- friends (directional; mutual = two rows)
create table friends (
  user_id uuid references auth.users on delete cascade,
  friend_id uuid references auth.users on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, friend_id)
);

-- public leaderboard view
create view leaderboard as
  select id, handle, region, total_exp, trust, streak, avatar
  from profiles;
```

### RLS policies
```sql
alter table profiles enable row level security;
alter table saves enable row level security;
alter table trait_progress enable row level security;
alter table submissions enable row level security;
alter table friends enable row level security;

-- profiles: anyone can read (leaderboard/public profile); only owner can write
create policy "profiles read"  on profiles for select using (true);
create policy "profiles write" on profiles for all using (auth.uid() = id) with check (auth.uid() = id);

-- saves: strictly private
create policy "saves owner" on saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- trait_progress: public read (Stat board), owner write
create policy "tp read"  on trait_progress for select using (true);
create policy "tp write" on trait_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- submissions: owner read/write (+ a reviewer role later)
create policy "subs owner" on submissions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- friends: owner manages own list; read own
create policy "friends owner" on friends for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Storage: create a bucket `proof` (private), with a policy allowing a user to
upload to `proof/<their-uid>/...` and read their own; reviewers read all.

---

## Setup steps (≈15 min, then I wire the code)

1. Create a free project at **supabase.com** → note the **Project URL** and **anon key**.
2. In the SQL editor, paste the schema + RLS above; create the `proof` storage bucket.
3. In **Netlify → Site config → Environment variables**, add:
   - `VITE_SUPABASE_URL = <your project url>`
   - `VITE_SUPABASE_ANON_KEY = <your anon key>`
4. Tell me it's done — I'll add `@supabase/supabase-js`, write `src/lib/supabase.ts`,
   and swap the three data-layer modules to use it (with the current localStorage
   path kept as an offline fallback when the env vars are absent).
5. `git push` → Netlify redeploys → accounts & leaderboards now sync across devices.

---

## Effort & notes
- Implementation once the project exists: roughly a focused half-day.
- Auth emails (verification/reset) are handled by Supabase out of the box.
- Photo review: the existing Owner dashboard queue points at the `submissions`
  table; add a `reviewer` role + policy to let admins read all and update status.
- Cost: free tier covers early usage; storage/egress scale cheaply.
