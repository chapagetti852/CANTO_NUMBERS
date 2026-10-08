-- Run once (Supabase → SQL Editor → New query → Run).
-- Two new levels: Big numbers (5) and Decimals & % (6). "Mix it up" moves from 5 to 7.
alter table public.scores drop constraint if exists scores_level_check;
update public.scores set level = 7 where level = 5;
alter table public.scores add constraint scores_level_check check (level between 1 and 7);
