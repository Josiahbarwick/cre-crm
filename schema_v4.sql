-- NAI Pfefferle CRM — schema update 4
-- Adds a list of listing brokers (supports co-listings with multiple brokers).
alter table listings add column if not exists broker_emails text[] default '{}';
