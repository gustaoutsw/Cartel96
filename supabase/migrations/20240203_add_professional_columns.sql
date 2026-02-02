alter table services 
add column if not exists professional text;

-- Optional: Index for performance
create index if not exists services_professional_idx on services (professional);
