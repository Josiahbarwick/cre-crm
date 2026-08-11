-- NAI Pfefferle CRM — schema update 6
-- Shared SE Wisconsin market comps log (team-maintained, not an external feed).

create table if not exists market_comps (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  submarket text,
  property_type text,
  transaction_type text not null default 'Sale',
  price numeric,
  square_feet numeric,
  price_per_sf numeric,
  cap_rate numeric,
  transaction_date date,
  source text,
  notes text,
  owner_email text,
  created_at timestamptz not null default now()
);

alter table market_comps enable row level security;

drop policy if exists "auth select market_comps" on market_comps;
drop policy if exists "auth insert market_comps" on market_comps;
drop policy if exists "auth update market_comps" on market_comps;
drop policy if exists "auth delete market_comps" on market_comps;
create policy "auth select market_comps" on market_comps for select using (auth.role() = 'authenticated');
create policy "auth insert market_comps" on market_comps for insert with check (auth.role() = 'authenticated');
create policy "auth update market_comps" on market_comps for update using (auth.role() = 'authenticated');
create policy "auth delete market_comps" on market_comps for delete using (auth.role() = 'authenticated');

alter publication supabase_realtime add table market_comps;
