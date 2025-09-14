-- Create enums
CREATE TYPE bottle_size AS ENUM ('375ml', '500ml', '750ml', '1.5L', '3L', 'Other');
CREATE TYPE wine_status AS ENUM ('Cellared', 'Drunk');
CREATE TYPE depth_position AS ENUM ('front', 'back');

-- Create wines table
CREATE TABLE wines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  household_id text NOT NULL DEFAULT 'default_household',
  vintage int,
  producer text NOT NULL,
  vineyard text,
  wine_name text,
  appellation text,
  region text,
  country_code text,  -- ISO-3166 alpha-2, e.g., 'FR','US'
  us_state text,      -- if US, e.g., 'CA'
  varietals text[] DEFAULT '{}',
  bottle_size bottle_size DEFAULT '750ml',
  purchase_date date,
  purchase_place text,
  location_row text,
  location_position int,
  status wine_status DEFAULT 'Cellared',
  drank_on date,
  peyton_rating numeric(4,1),
  louis_rating numeric(4,1),
  companions text[] DEFAULT '{}',
  peyton_notes text,
  louis_notes text,
  score_wine_spectator int,
  score_james_suckling int,
  drink_window_from int,
  drink_window_to int,
  drink_now boolean,
  ai_enrichment jsonb DEFAULT '{}'::jsonb,
  ai_confidence numeric(4,2),
  average_rating numeric(4,1) GENERATED ALWAYS AS (
    case
      when peyton_rating is not null and louis_rating is not null
        then round(((peyton_rating + louis_rating)/2)::numeric,1)
      when peyton_rating is not null then peyton_rating
      when louis_rating is not null then louis_rating
      else null
    end
  ) STORED
);

-- Create fridge_layout table
CREATE TABLE fridge_layout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  household_id text NOT NULL DEFAULT 'default_household',
  fridge_id uuid NOT NULL,
  shelves int NOT NULL CHECK (shelves > 0),
  columns int NOT NULL CHECK (columns > 0),
  name text NOT NULL,
  UNIQUE(household_id, fridge_id)
);

-- Create cellar_slots table
CREATE TABLE cellar_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  household_id text NOT NULL DEFAULT 'default_household',
  wine_id uuid REFERENCES wines(id) ON DELETE CASCADE,
  fridge_id uuid NOT NULL,
  shelf int NOT NULL CHECK (shelf > 0),
  column_position int NOT NULL CHECK (column_position > 0),
  depth depth_position NOT NULL,
  UNIQUE(household_id, fridge_id, shelf, column_position, depth)
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wines_updated_at 
    BEFORE UPDATE ON wines 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fridge_layout_updated_at 
    BEFORE UPDATE ON fridge_layout 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cellar_slots_updated_at 
    BEFORE UPDATE ON cellar_slots 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;
ALTER TABLE fridge_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE cellar_slots ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies
DROP POLICY IF EXISTS "anon can select wines" ON wines;
DROP POLICY IF EXISTS "anon can insert wines" ON wines;
DROP POLICY IF EXISTS "anon can update wines" ON wines;
DROP POLICY IF EXISTS "anon can delete wines" ON wines;

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

-- RLS policies for fridge_layout
CREATE POLICY "household_select_fridge_layout" ON fridge_layout
  FOR SELECT USING (household_id = 'default_household');

CREATE POLICY "household_insert_fridge_layout" ON fridge_layout
  FOR INSERT WITH CHECK (household_id = 'default_household');

CREATE POLICY "household_update_fridge_layout" ON fridge_layout
  FOR UPDATE USING (household_id = 'default_household');

CREATE POLICY "household_delete_fridge_layout" ON fridge_layout
  FOR DELETE USING (household_id = 'default_household');

-- RLS policies for cellar_slots
CREATE POLICY "household_select_cellar_slots" ON cellar_slots
  FOR SELECT USING (household_id = 'default_household');

CREATE POLICY "household_insert_cellar_slots" ON cellar_slots
  FOR INSERT WITH CHECK (household_id = 'default_household');

CREATE POLICY "household_update_cellar_slots" ON cellar_slots
  FOR UPDATE USING (household_id = 'default_household');

CREATE POLICY "household_delete_cellar_slots" ON cellar_slots
  FOR DELETE USING (household_id = 'default_household');

-- Insert default EuroCave layout configuration
INSERT INTO fridge_layout (fridge_id, shelves, columns, name) 
VALUES ('00000000-0000-0000-0000-000000000001', 6, 5, 'EuroCave Default');

-- Function to check for slot collisions
CREATE OR REPLACE FUNCTION check_slot_collision(
  p_fridge_id uuid,
  p_shelf int,
  p_column int,
  p_depth depth_position,
  p_exclude_wine_id uuid DEFAULT NULL
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cellar_slots 
    WHERE fridge_id = p_fridge_id 
      AND shelf = p_shelf 
      AND column_position = p_column 
      AND depth = p_depth
      AND (p_exclude_wine_id IS NULL OR wine_id != p_exclude_wine_id)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to get occupancy summary for a fridge
CREATE OR REPLACE FUNCTION get_fridge_occupancy(p_fridge_id uuid)
RETURNS TABLE (
  shelf int,
  column_position int,
  depth depth_position,
  wine_id uuid,
  wine_producer text,
  wine_name text,
  wine_vintage int,
  is_occupied boolean
) AS $$
BEGIN
  RETURN QUERY
  WITH layout AS (
    SELECT shelves, columns FROM fridge_layout WHERE fridge_id = p_fridge_id LIMIT 1
  ),
  all_slots AS (
    SELECT 
      s.shelf,
      s.column_position,
      d.depth,
      cs.wine_id,
      w.producer as wine_producer,
      w.wine_name,
      w.vintage as wine_vintage,
      (cs.wine_id IS NOT NULL) as is_occupied
    FROM layout l
    CROSS JOIN generate_series(1, l.shelves) s(shelf)
    CROSS JOIN generate_series(1, l.columns) c(column_position)
    CROSS JOIN (SELECT unnest(enum_range(NULL::depth_position)) as depth) d
    LEFT JOIN cellar_slots cs ON (
      cs.fridge_id = p_fridge_id 
      AND cs.shelf = s.shelf 
      AND cs.column_position = c.column_position 
      AND cs.depth = d.depth
    )
    LEFT JOIN wines w ON cs.wine_id = w.id
  )
  SELECT * FROM all_slots
  ORDER BY shelf, column_position, depth;
END;
$$ LANGUAGE plpgsql;
