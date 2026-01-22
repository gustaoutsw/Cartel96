-- Create tickets table
create table tickets (
  id uuid default gen_random_uuid() primary key,
  customer_name text not null,
  customer_phone text not null,
  status text check (status in ('open', 'closed', 'pending')) default 'open',
  professional_id uuid references auth.users(id),
  last_message_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  ticket_id uuid references tickets(id) on delete cascade not null,
  content text not null,
  sender_type text check (sender_type in ('customer', 'agent', 'system')) not null,
  created_at timestamptz default now(),
  read_at timestamptz
);

-- Enable RLS
alter table tickets enable row level security;
alter table messages enable row level security;

-- Policies (Simple open access for authenticated users for now)
create policy "Enable all access for authenticated users on tickets"
on tickets for all
to authenticated
using (true)
with check (true);

create policy "Enable all access for authenticated users on messages"
on messages for all
to authenticated
using (true)
with check (true);
