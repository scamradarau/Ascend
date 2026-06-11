-- ================================================================
-- STEP 5 — Challenge targets (server-authoritative completion payout)
-- Weekly/monthly challenges now pay their EXP only when the period's
-- target number of verified logs is reached (max 1 log per Sydney day).
-- This adds the per-challenge target to the server quest catalog.
-- Run in the Supabase SQL editor. Safe to re-run.
-- ================================================================

alter table quests add column if not exists target int;

update quests set target = 4  where id = 'w-gym4';
update quests set target = 5  where id = 'w-meditate5';
update quests set target = 5  where id = 'w-deep5';
update quests set target = 4  where id = 'w-read4';
update quests set target = 3  where id = 'w-connect3';
update quests set target = 4  where id = 'm-book';
update quests set target = 16 where id = 'm-gym16';
update quests set target = 20 where id = 'm-meditate20';
update quests set target = 20 where id = 'm-journal20';
