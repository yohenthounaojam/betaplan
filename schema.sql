-- BetaPlan Database Schema
-- Paste this into Supabase SQL Editor and click Run

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- TRIPS table
create table trips (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  sport text not null,
  start_date date not null,
  end_date date not null,
  creator_name text not null,
  invite_token text unique not null default substr(md5(random()::text), 1, 8),
  expires_at timestamptz not null default now() + interval '1 year',
  created_at timestamptz not null default now()
);

-- RESPONDENTS table
create table respondents (
  id uuid primary key default uuid_generate_v4(),
  trip_id uuid not null references trips(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique(trip_id, name)
);

-- AVAILABILITY table
create table availability (
  id uuid primary key default uuid_generate_v4(),
  respondent_id uuid not null references respondents(id) on delete cascade,
  trip_id uuid not null references trips(id) on delete cascade,
  date date not null,
  status text not null check (status in ('avail', 'maybe', 'busy')),
  unique(respondent_id, date)
);

-- INDEXES for fast lookups
create index idx_trips_invite_token on trips(invite_token);
create index idx_trips_expires_at on trips(expires_at);
create index idx_respondents_trip_id on respondents(trip_id);
create index idx_availability_trip_id on availability(trip_id);
create index idx_availability_respondent_id on availability(respondent_id);

-- AUTO CLEANUP: delete expired trips (run via Supabase cron or pg_cron)
-- Trips older than 1 year are automatically removed
create or replace function delete_expired_trips()
returns void as $$
  delete from trips where expires_at < now();
$$ language sql;

-- ROW LEVEL SECURITY
alter table trips enable row level security;
alter table respondents enable row level security;
alter table availability enable row level security;

-- POLICIES: fully public read/write (no auth required for MVP)
-- Anyone with the invite token can read and write
create policy "Public read trips" on trips for select using (true);
create policy "Public insert trips" on trips for insert with check (true);

create policy "Public read respondents" on respondents for select using (true);
create policy "Public insert respondents" on respondents for insert with check (true);
create policy "Public update respondents" on respondents for update using (true);

create policy "Public read availability" on availability for select using (true);
create policy "Public insert availability" on availability for insert with check (true);
create policy "Public update availability" on availability for update using (true);
create policy "Public delete availability" on availability for delete using (true);


-- SOFT DELETE SUPPORT (run this if you already set up the schema)
alter table trips add column if not exists deleted_at timestamptz default null;
create index if not exists idx_trips_deleted_at on trips(deleted_at);

-- Update cleanup function to also purge soft-deleted trips after 7 days
create or replace function delete_expired_trips()
returns void as $$
  delete from trips where expires_at < now();
  delete from trips where deleted_at is not null and deleted_at < now() - interval '7 days';
$$ language sql;

-- Allow soft delete update
create policy "Public soft delete trips" on trips for update using (true) with check (true);
