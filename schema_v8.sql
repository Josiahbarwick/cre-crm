-- NAI Pfefferle CRM — schema update 8
-- Commission splits: co-broke and house/agent split, per deal.
alter table deals add column if not exists co_broke_pct numeric not null default 0;
alter table deals add column if not exists co_broke_name text;
alter table deals add column if not exists agent_split_pct numeric not null default 100;
