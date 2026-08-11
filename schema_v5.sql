-- NAI Pfefferle CRM — schema update 5
-- Adds personal to-do lists (private per user) and shared goal tracking.

create table if not exists todos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists goals (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  metric text not null default 'Custom',
  period text not null default 'Weekly',
  target numeric not null default 0,
  manual_progress numeric not null default 0,
  owner_email text,
  created_at timestamptz not null default now()
);

alter table todos enable row level security;
alter table goals enable row level security;

-- Todos are private: only the creating user can see or touch their own rows.
drop policy if exists "own todos select" on todos;
drop policy if exists "own todos insert" on todos;
drop policy if exists "own todos update" on todos;
drop policy if exists "own todos delete" on todos;
create policy "own todos select" on todos for select using (auth.uid() = user_id);
create policy "own todos insert" on todos for insert with check (auth.uid() = user_id);
create policy "own todos update" on todos for update using (auth.uid() = user_id);
create policy "own todos delete" on todos for delete using (auth.uid() = user_id);

-- Goals are shared team-wide, same as the rest of the app.
drop policy if exists "auth select goals" on goals;
drop policy if exists "auth insert goals" on goals;
drop policy if exists "auth update goals" on goals;
drop policy if exists "auth delete goals" on goals;
create policy "auth select goals" on goals for select using (auth.role() = 'authenticated');
create policy "auth insert goals" on goals for insert with check (auth.role() = 'authenticated');
create policy "auth update goals" on goals for update using (auth.role() = 'authenticated');
create policy "auth delete goals" on goals for delete using (auth.role() = 'authenticated');

alter publication supabase_realtime add table todos;
alter publication supabase_realtime add table goals;
