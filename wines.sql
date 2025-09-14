-- Create enums
CREATE TYPE bottle_size AS ENUM ('375ml', '500ml', '750ml', '1.5L', '3L', 'Other');
CREATE TYPE wine_status AS ENUM ('Cellared', 'Drunk');

-- Create wines table
CREATE TABLE wines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
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

-- Enable RLS
ALTER TABLE wines ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (anon can select/insert/update/delete on wines)
CREATE POLICY "anon can select wines" ON wines
  FOR SELECT USING (true);

CREATE POLICY "anon can insert wines" ON wines
  FOR INSERT WITH CHECK (true);

CREATE POLICY "anon can update wines" ON wines
  FOR UPDATE USING (true);

CREATE POLICY "anon can delete wines" ON wines
  FOR DELETE USING (true);
