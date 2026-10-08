-- Leaderboard table. Paste into Supabase → SQL Editor → New query → Run.
-- Anyone with the game can read scores and add one; nobody can edit or delete.
create table if not exists public.scores (
  id bigint generated always as identity primary key,
  name text not null check (char_length(name) between 1 and 16),
  mode text not null check (mode in ('listen', 'read')),
  level int not null check (level between 1 and 7),
  score int not null check (score between 1 and 10000),
  correct int not null default 0 check (correct between 0 and 500),
  created_at timestamptz not null default now()
);

create index if not exists scores_board on public.scores (mode, level, score desc);

alter table public.scores enable row level security;

drop policy if exists "read scores" on public.scores;
create policy "read scores" on public.scores for select to anon using (true);

drop policy if exists "add a score" on public.scores;
create policy "add a score" on public.scores for insert to anon with check (true);

grant select, insert on public.scores to anon;
