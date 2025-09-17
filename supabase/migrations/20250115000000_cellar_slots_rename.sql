-- Rename if the table already exists with "column"
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name='cellar_slots' and column_name='column'
  ) then
    alter table cellar_slots rename column "column" to column_position;
  end if;
end$$;

-- Ensure unique constraint uses the new name
do $$
begin
  if exists (
    select 1 from pg_indexes where indexname = 'cellar_slots_shelf_column_depth_key'
  ) then
    alter table cellar_slots drop constraint if exists cellar_slots_shelf_column_depth_key;
  end if;
  if not exists (
    select 1 from pg_indexes where indexname = 'cellar_slots_shelf_colpos_depth_key'
  ) then
    alter table cellar_slots
      add constraint cellar_slots_shelf_colpos_depth_key unique (shelf, column_position, depth);
  end if;
end$$;
