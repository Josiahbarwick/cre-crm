-- NAI Pfefferle CRM — schema update 7
-- Shared team meetings, for weekly accountability on the Dashboard.

create table if not exists meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  meeting_time text,
  notes text,
  owner_email text,
  created_at timestamptz not null default now()
);

alter table meetings enable row level security;

drop policy if exists "auth select meetings" on meetings;
drop policy if exists "auth insert meetings" on meetings;
drop policy if exists "auth update meetings" on meetings;
drop policy if exists "auth delete meetings" on meetings;
create policy "auth select meetings" on meetings for select using (auth.role() = 'authenticated');
create policy "auth insert meetings" on meetings for insert with check (auth.role() = 'authenticated');
create policy "auth update meetings" on meetings for update using (auth.role() = 'authenticated');
create policy "auth delete meetings" on meetings for delete using (auth.role() = 'authenticated');

alter publication supabase_realtime add table meetings;
