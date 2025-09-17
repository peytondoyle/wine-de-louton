alter table fridge_layout enable row level security;
alter table cellar_slots enable row level security;

drop policy if exists p_fridge_layout_ro on fridge_layout;
create policy p_fridge_layout_ro on fridge_layout
for select using (true);

drop policy if exists p_cellar_slots_ro on cellar_slots;
create policy p_cellar_slots_ro on cellar_slots
for select using (true);

-- BLOCK anon writes by default
drop policy if exists p_cellar_slots_insert on cellar_slots;
drop policy if exists p_cellar_slots_update on cellar_slots;
drop policy if exists p_cellar_slots_delete on cellar_slots;
