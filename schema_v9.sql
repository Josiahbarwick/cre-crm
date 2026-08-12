-- NAI Pfefferle CRM — schema update 9
-- Broker(s) assigned to each deal (supports co-listing brokers, same as listings).
alter table deals add column if not exists broker_emails text[] default '{}';
