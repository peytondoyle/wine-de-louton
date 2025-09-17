-- Fix cellar setup - handle existing state
-- This migration safely sets up the cellar functionality regardless of current state

-- 1. Ensure fridge_layout table exists with correct structure
create table if not exists fridge_layout (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'EuroCave Pure L',
  shelves int not null default 6,
  columns int not null default 10
);

-- 2. Ensure cellar_slots table exists with correct structure
create table if not exists cellar_slots (
  wine_id uuid references wines(id) on delete cascade,
  shelf int not null,
  column_position int not null,
  depth text not null check (depth in ('front','back')),
  inserted_at timestamp with time zone default now(),
  primary key (wine_id)
);

-- 3. Handle column rename if needed
do $$
begin
  -- Check if old 'column' column exists and rename it
  if exists (
    select 1 from information_schema.columns
    where table_name='cellar_slots' and column_name='column'
  ) then
    alter table cellar_slots rename column "column" to column_position;
  end if;
end$$;

-- 4. Drop and recreate unique constraint to ensure it's correct
alter table cellar_slots drop constraint if exists cellar_slots_shelf_column_depth_key;
alter table cellar_slots drop constraint if exists cellar_slots_shelf_colpos_depth_key;
alter table cellar_slots add constraint cellar_slots_shelf_colpos_depth_key unique (shelf, column_position, depth);

-- 5. Seed fridge layout if empty
insert into fridge_layout (name, shelves, columns)
select 'EuroCave Pure L', 6, 10
where not exists (select 1 from fridge_layout);

-- 6. Create or replace the occupancy view
drop view if exists fridge_occupancy cascade;
create view fridge_occupancy as
select
  s.shelf,
  s.column_position,
  s.depth,
  s.wine_id,
  w.producer,
  w.vintage,
  w.wine_name
from cellar_slots s
left join wines w on w.id = s.wine_id;

-- 7. Create or replace RPC functions
create or replace function rpc_get_fridge_layout()
returns table (shelves int, columns int, name text)
language sql stable as $$
  select shelves, columns, name from fridge_layout limit 1
$$;

create or replace function rpc_get_fridge_occupancy()
returns setof fridge_occupancy
language sql stable as $$
  select * from fridge_occupancy
$$;

-- 8. Set up RLS policies
alter table fridge_layout enable row level security;
alter table cellar_slots enable row level security;

-- Drop existing policies if they exist
drop policy if exists p_fridge_layout_ro on fridge_layout;
drop policy if exists p_cellar_slots_ro on cellar_slots;
drop policy if exists p_cellar_slots_insert on cellar_slots;
drop policy if exists p_cellar_slots_update on cellar_slots;
drop policy if exists p_cellar_slots_delete on cellar_slots;

-- Create new policies
create policy p_fridge_layout_ro on fridge_layout
for select using (true);

create policy p_cellar_slots_ro on cellar_slots
for select using (true);
