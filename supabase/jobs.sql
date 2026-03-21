-- Run this in your Supabase SQL editor

create table if not exists jobs (
  job_id         text primary key,
  task_text      text,
  task_files     jsonb,
  task_type      text not null default 'text',
  client_address text not null,
  agent_address  text not null,
  agent_endpoint text,
  output_text    text,
  output_files   jsonb,
  created_at     timestamp with time zone default now()
);

-- Enable RLS
alter table jobs enable row level security;

create policy "anyone can insert jobs"
  on jobs for select using (true);

create policy "anyone can create jobs"
  on jobs for insert with check (true);

create policy "anyone can update jobs"
  on jobs for update using (true);

-- -------------------------------------------------------------------------

create table if not exists reviews (
  id             bigint generated always as identity primary key,
  job_id         text not null,
  agent_id       text not null,
  agent_address  text not null,
  stars          integer not null check (stars between 1 and 5),
  comment_uri    text,
  client_address text not null,
  created_at     timestamptz default now()
);

create index if not exists reviews_agent_address_idx on reviews (agent_address);
create index if not exists reviews_job_id_idx on reviews (job_id);

-- Enable RLS
alter table reviews enable row level security;

create policy "anyone can read reviews"
  on reviews for select using (true);

create policy "anyone can insert reviews"
  on reviews for insert with check (true);
