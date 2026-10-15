-- NAI Pfefferle CRM — schema update 13
-- Buyer Criteria: structured buy-box profiles for business-acquisition
-- clients (e.g. an investor you're representing), matched against Lead
-- Finder signals.

create table if not exists buyer_profiles (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references contacts(id) on delete set null,
  label text not null,
  industries jsonb not null default '[]',
  min_price numeric,
  max_price numeric,
  min_revenue numeric,
  max_revenue numeric,
  min_cash_flow numeric,
  max_cash_flow numeric,
  locations text,
  real_estate_preference text not null default 'Any',
  status text not null default 'Active',
  notes text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists buyer_profiles_status_idx on buyer_profiles(status);

alter table buyer_profiles enable row level security;

drop policy if exists "auth select buyer_profiles" on buyer_profiles;
drop policy if exists "auth insert buyer_profiles" on buyer_profiles;
drop policy if exists "auth update buyer_profiles" on buyer_profiles;
drop policy if exists "auth delete buyer_profiles" on buyer_profiles;
create policy "auth select buyer_profiles" on buyer_profiles for select using (auth.role() = 'authenticated');
create policy "auth insert buyer_profiles" on buyer_profiles for insert with check (auth.role() = 'authenticated');
create policy "auth update buyer_profiles" on buyer_profiles for update using (auth.role() = 'authenticated');
create policy "auth delete buyer_profiles" on buyer_profiles for delete using (auth.role() = 'authenticated');

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'buyer_profiles'
  ) then
    alter publication supabase_realtime add table buyer_profiles;
  end if;
end $$;
