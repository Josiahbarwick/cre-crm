-- NAI Pfefferle CRM — schema update 2
-- Adds: lease/sale tracking on contacts, active listings, and potential-clients per listing.
-- Run this once in Supabase SQL Editor (safe to run even if partially applied before).

alter table contacts add column if not exists transaction_type text;

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  listing_type text not null default 'Lease',
  property_type text,
  status text not null default 'Active',
  price numeric,
  square_feet numeric,
  price_per_sf numeric,
  commission_pct numeric,
  expiration_date date,
  owner_contact_id uuid references contacts(id) on delete set null,
  notes text,
  owner_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists listing_interests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  notes text,
  created_at timestamptz not null default now(),
  unique(listing_id, contact_id)
);

alter table listings enable row level security;
alter table listing_interests enable row level security;

drop policy if exists "auth select listings" on listings;
drop policy if exists "auth insert listings" on listings;
drop policy if exists "auth update listings" on listings;
drop policy if exists "auth delete listings" on listings;
create policy "auth select listings" on listings for select using (auth.role() = 'authenticated');
create policy "auth insert listings" on listings for insert with check (auth.role() = 'authenticated');
create policy "auth update listings" on listings for update using (auth.role() = 'authenticated');
create policy "auth delete listings" on listings for delete using (auth.role() = 'authenticated');

drop policy if exists "auth select listing_interests" on listing_interests;
drop policy if exists "auth insert listing_interests" on listing_interests;
drop policy if exists "auth delete listing_interests" on listing_interests;
create policy "auth select listing_interests" on listing_interests for select using (auth.role() = 'authenticated');
create policy "auth insert listing_interests" on listing_interests for insert with check (auth.role() = 'authenticated');
create policy "auth delete listing_interests" on listing_interests for delete using (auth.role() = 'authenticated');

alter publication supabase_realtime add table listings;
alter publication supabase_realtime add table listing_interests;
