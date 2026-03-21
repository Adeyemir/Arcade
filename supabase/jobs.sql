-- Run this in your Supabase SQL editor at:
-- https://your-project.supabase.co

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

-- Allow anyone to insert (client creates the job after hiring on-chain)
create policy "anyone can insert jobs"
  on jobs for select using (true);

create policy "anyone can create jobs"
  on jobs for insert with check (true);

create policy "anyone can update jobs"
  on jobs for update using (true);
