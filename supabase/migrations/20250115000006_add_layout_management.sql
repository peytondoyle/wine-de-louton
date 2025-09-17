-- Add layout management fields to fridge_layout table
-- This migration adds the necessary fields for the layout management system

-- Add missing columns to fridge_layout table
alter table fridge_layout 
add column if not exists household_id text not null default 'default_household',
add column if not exists fridge_id text not null default 'default_fridge',
add column if not exists created_at timestamp with time zone default now(),
add column if not exists updated_at timestamp with time zone default now();

-- Add missing columns to cellar_slots table  
alter table cellar_slots
add column if not exists household_id text not null default 'default_household',
add column if not exists fridge_id text not null default 'default_fridge',
add column if not exists id uuid primary key default gen_random_uuid(),
add column if not exists created_at timestamp with time zone default now(),
add column if not exists updated_at timestamp with time zone default now();

-- Update the primary key constraint for cellar_slots
alter table cellar_slots drop constraint if exists cellar_slots_pkey;
alter table cellar_slots add constraint cellar_slots_pkey primary key (id);

-- Add unique constraint for wine_id (one wine per slot)
alter table cellar_slots add constraint cellar_slots_wine_id_unique unique (wine_id);

-- Add unique constraint for slot position (one wine per position)
alter table cellar_slots add constraint cellar_slots_position_unique unique (shelf, column_position, depth);

-- Create index for performance
create index if not exists idx_fridge_layout_household_id on fridge_layout(household_id);
create index if not exists idx_cellar_slots_household_id on cellar_slots(household_id);
create index if not exists idx_cellar_slots_fridge_id on cellar_slots(fridge_id);
