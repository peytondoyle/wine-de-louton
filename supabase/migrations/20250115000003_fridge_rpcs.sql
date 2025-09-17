-- get layout
create or replace function rpc_get_fridge_layout()
returns table (shelves int, columns int, name text)
language sql stable as $$
  select shelves, columns, name from fridge_layout limit 1
$$;

-- get occupancy
create or replace function rpc_get_fridge_occupancy()
returns setof fridge_occupancy
language sql stable as $$
  select * from fridge_occupancy
$$;
