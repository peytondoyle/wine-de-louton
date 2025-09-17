-- RPC functions for fridge layout and occupancy
-- These functions provide a clean API for accessing fridge configuration and wine placement data

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





