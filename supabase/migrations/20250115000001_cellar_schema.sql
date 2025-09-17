create table if not exists fridge_layout (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'EuroCave Pure L',
  shelves int not null default 6,
  columns int not null default 10
);

create table if not exists cellar_slots (
  wine_id uuid references wines(id) on delete cascade,
  shelf int not null,
  column_position int not null,
  depth text not null check (depth in ('front','back')),
  inserted_at timestamp with time zone default now(),
  primary key (wine_id),
  unique (shelf, column_position, depth)
);

-- seed a single layout row if table empty
insert into fridge_layout (name, shelves, columns)
select 'EuroCave Pure L', 6, 10
where not exists (select 1 from fridge_layout);
