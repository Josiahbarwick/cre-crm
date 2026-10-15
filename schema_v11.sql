-- NAI Pfefferle CRM — schema update 11
-- Lead Finder: auto-discovered + manually-logged signals of people looking to
-- buy or lease commercial real estate in Wisconsin.

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'Manual',
  source_url text,
  title text not null,
  snippet text,
  author text,
  posted_at timestamptz,
  location_text text,
  signal_type text not null default 'Unclear',
  property_type_guess text,
  keywords_matched jsonb not null default '[]',
  confidence_score numeric not null default 0,
  status text not null default 'New',
  contact_id uuid references contacts(id) on delete set null,
  notes text,
  owner_email text,
  created_at timestamptz not null default now()
);

-- One row per URL so the finder script can upsert without creating dupes.
-- Manual entries (no URL) are exempt from this constraint.
create unique index if not exists leads_source_url_key on leads(source_url) where source_url is not null;
create index if not exists leads_status_idx on leads(status);
create index if not exists leads_created_at_idx on leads(created_at desc);

alter table leads enable row level security;

drop policy if exists "auth select leads" on leads;
drop policy if exists "auth insert leads" on leads;
drop policy if exists "auth update leads" on leads;
drop policy if exists "auth delete leads" on leads;
create policy "auth select leads" on leads for select using (auth.role() = 'authenticated');
create policy "auth insert leads" on leads for insert with check (auth.role() = 'authenticated');
create policy "auth update leads" on leads for update using (auth.role() = 'authenticated');
create policy "auth delete leads" on leads for delete using (auth.role() = 'authenticated');

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'leads'
  ) then
    alter publication supabase_realtime add table leads;
  end if;
end $$;
