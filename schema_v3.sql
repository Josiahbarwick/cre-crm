-- NAI Pfefferle CRM — schema update 3
-- Adds a separate "Client" contact link on listings (distinct from the property owner).
alter table listings add column if not exists client_contact_id uuid references contacts(id) on delete set null;
