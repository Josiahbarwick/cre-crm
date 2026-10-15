-- NAI Pfefferle CRM — schema update 12
-- Lead Finder: best-effort contact enrichment (phone/website), looked up
-- automatically for leads that name a specific business.

alter table leads add column if not exists contact_phone text;
alter table leads add column if not exists contact_website text;
