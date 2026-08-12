-- NAI Pfefferle CRM — schema update 10
-- Office pool table leaderboard. Supports any number of players per game.

create table if not exists pool_games (
  id uuid primary key default gen_random_uuid(),
  players jsonb not null default '[]',
  winner_name text,
  played_at timestamptz not null default now(),
  logged_by text
);

alter table pool_games enable row level security;

drop policy if exists "auth select pool_games" on pool_games;
drop policy if exists "auth insert pool_games" on pool_games;
drop policy if exists "auth delete pool_games" on pool_games;
create policy "auth select pool_games" on pool_games for select using (auth.role() = 'authenticated');
create policy "auth insert pool_games" on pool_games for insert with check (auth.role() = 'authenticated');
create policy "auth delete pool_games" on pool_games for delete using (auth.role() = 'authenticated');

alter publication supabase_realtime add table pool_games;
