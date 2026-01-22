-- Create clients table
create table if not exists clients (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null unique,
  email text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table clients enable row level security;

-- Policies
create policy "Enable all access for authenticated users on clients"
on clients for all
to authenticated
using (true)
with check (true);

-- Index for lookup
create index if not exists clients_phone_idx on clients(phone);
