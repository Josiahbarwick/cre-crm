-- Brokerage CRM — Supabase schema
-- Run this once in your Supabase project: SQL Editor -> New query -> paste -> Run

create extension if not exists pgcrypto;

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company text,
  phone text,
  email text,
  property_type text,
  status text not null default 'Cold',
  source text,
  address text,
  notes text,
  next_follow_up date,
  last_contacted_at timestamptz,
  owner_email text,
  created_at timestamptz not null default now()
);

create table if not exists deals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  property_address text,
  value numeric default 0,
  commission_pct numeric default 0,
  stage text not null default 'New Lead',
  close_date date,
  contact_id uuid references contacts(id) on delete set null,
  notes text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists calls (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  outcome text,
  notes text,
  logged_by text
);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  type text,
  description text,
  contact_id uuid references contacts(id) on delete set null,
  deal_id uuid references deals(id) on delete set null,
  "timestamp" timestamptz not null default now()
);

alter table contacts enable row level security;
alter table deals enable row level security;
alter table calls enable row level security;
alter table activities enable row level security;

drop policy if exists "auth select contacts" on contacts;
drop policy if exists "auth insert contacts" on contacts;
drop policy if exists "auth update contacts" on contacts;
drop policy if exists "auth delete contacts" on contacts;
create policy "auth select contacts" on contacts for select using (auth.role() = 'authenticated');
create policy "auth insert contacts" on contacts for insert with check (auth.role() = 'authenticated');
create policy "auth update contacts" on contacts for update using (auth.role() = 'authenticated');
create policy "auth delete contacts" on contacts for delete using (auth.role() = 'authenticated');

drop policy if exists "auth select deals" on deals;
drop policy if exists "auth insert deals" on deals;
drop policy if exists "auth update deals" on deals;
drop policy if exists "auth delete deals" on deals;
create policy "auth select deals" on deals for select using (auth.role() = 'authenticated');
create policy "auth insert deals" on deals for insert with check (auth.role() = 'authenticated');
create policy "auth update deals" on deals for update using (auth.role() = 'authenticated');
create policy "auth delete deals" on deals for delete using (auth.role() = 'authenticated');

drop policy if exists "auth select calls" on calls;
drop policy if exists "auth insert calls" on calls;
drop policy if exists "auth update calls" on calls;
drop policy if exists "auth delete calls" on calls;
create policy "auth select calls" on calls for select using (auth.role() = 'authenticated');
create policy "auth insert calls" on calls for insert with check (auth.role() = 'authenticated');
create policy "auth update calls" on calls for update using (auth.role() = 'authenticated');
create policy "auth delete calls" on calls for delete using (auth.role() = 'authenticated');

drop policy if exists "auth select activities" on activities;
drop policy if exists "auth insert activities" on activities;
drop policy if exists "auth delete activities" on activities;
create policy "auth select activities" on activities for select using (auth.role() = 'authenticated');
create policy "auth insert activities" on activities for insert with check (auth.role() = 'authenticated');
create policy "auth delete activities" on activities for delete using (auth.role() = 'authenticated');

-- Enable realtime so partners see each other's changes live
alter publication supabase_realtime add table contacts;
alter publication supabase_realtime add table deals;
alter publication supabase_realtime add table calls;
alter publication supabase_realtime add table activities;
