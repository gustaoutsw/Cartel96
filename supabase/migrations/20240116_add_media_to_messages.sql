-- Add media support to messages
alter table messages 
add column if not exists media_url text,
add column if not exists type text default 'text' check (type in ('text', 'image'));

-- policies for storage (optional, assuming bucket 'chat-uploads' exists)
-- This is just a hint, users usually configure storage in dashboard.
