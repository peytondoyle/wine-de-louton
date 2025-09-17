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
