-- Enable RLS on wines table
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "anon can select wines" ON wines;
DROP POLICY IF EXISTS "anon can insert wines" ON wines;
DROP POLICY IF EXISTS "anon can update wines" ON wines;
DROP POLICY IF EXISTS "anon can delete wines" ON wines;
DROP POLICY IF EXISTS "household_select_wines" ON wines;
DROP POLICY IF EXISTS "household_insert_wines" ON wines;
DROP POLICY IF EXISTS "household_update_wines" ON wines;
DROP POLICY IF EXISTS "household_delete_wines" ON wines;

-- Create secure RLS policies based on household_id
-- Only allow access to wines from the same household
CREATE POLICY "household_select_wines" ON wines
  FOR SELECT USING (household_id = 'default_household');

CREATE POLICY "household_insert_wines" ON wines
  FOR INSERT WITH CHECK (household_id = 'default_household');

CREATE POLICY "household_update_wines" ON wines
  FOR UPDATE USING (household_id = 'default_household');

CREATE POLICY "household_delete_wines" ON wines
  FOR DELETE USING (household_id = 'default_household');

-- Enable RLS on fridge_layout table
ALTER TABLE fridge_layout ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "household_select_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_insert_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_update_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_delete_fridge_layout" ON fridge_layout;

-- Create secure RLS policies for fridge_layout
CREATE POLICY "household_select_fridge_layout" ON fridge_layout
  FOR SELECT USING (household_id = 'default_household');

CREATE POLICY "household_insert_fridge_layout" ON fridge_layout
  FOR INSERT WITH CHECK (household_id = 'default_household');

CREATE POLICY "household_update_fridge_layout" ON fridge_layout
  FOR UPDATE USING (household_id = 'default_household');

CREATE POLICY "household_delete_fridge_layout" ON fridge_layout
  FOR DELETE USING (household_id = 'default_household');

-- Enable RLS on cellar_slots table
ALTER TABLE cellar_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "household_select_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_insert_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_update_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_delete_cellar_slots" ON cellar_slots;

-- Create secure RLS policies for cellar_slots
CREATE POLICY "household_select_cellar_slots" ON cellar_slots
  FOR SELECT USING (household_id = 'default_household');

CREATE POLICY "household_insert_cellar_slots" ON cellar_slots
  FOR INSERT WITH CHECK (household_id = 'default_household');

CREATE POLICY "household_update_cellar_slots" ON cellar_slots
  FOR UPDATE USING (household_id = 'default_household');

CREATE POLICY "household_delete_cellar_slots" ON cellar_slots
  FOR DELETE USING (household_id = 'default_household');
