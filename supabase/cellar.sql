-- Cellar schema for wine storage management
-- This file creates the necessary tables and views for managing wine cellar layouts and slot assignments

-- Create fridge_layout table to store different cellar configurations
CREATE TABLE fridge_layout (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelves INTEGER NOT NULL CHECK (shelves > 0),
    columns INTEGER NOT NULL CHECK (columns > 0),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create cellar_slots table to track wine placement in cellar
CREATE TABLE cellar_slots (
    wine_id UUID NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
    shelf INTEGER NOT NULL CHECK (shelf > 0),
    column_position INTEGER NOT NULL CHECK (column_position > 0),
    depth TEXT NOT NULL DEFAULT 'front' CHECK (depth IN ('front', 'back')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(shelf, column_position, depth)
);

-- Add indexes for performance optimization
CREATE INDEX idx_cellar_slots_shelf_column_depth ON cellar_slots(shelf, column_position, depth);
CREATE INDEX idx_cellar_slots_wine_id ON cellar_slots(wine_id);
CREATE INDEX idx_fridge_layout_name ON fridge_layout(name);

-- Create view for quick cellar occupancy lookups
CREATE VIEW cellar_occupancy AS
SELECT 
    cs.shelf,
    cs.column_position,
    cs.depth,
    cs.wine_id,
    w.name as wine_name,
    w.vintage,
    w.varietal,
    w.producer,
    w.region,
    w.country,
    w.price,
    w.quantity,
    w.created_at as wine_created_at,
    cs.created_at as slot_created_at
FROM cellar_slots cs
LEFT JOIN wines w ON cs.wine_id = w.id
ORDER BY cs.shelf, cs.column_position, cs.depth;

-- Create fridge_occupancy view for quick fridge status lookups
CREATE VIEW fridge_occupancy AS
SELECT
    s.shelf,
    s.column_position,
    s.depth,
    s.wine_id,
    w.producer,
    w.vintage,
    w.wine_name
FROM cellar_slots s
LEFT JOIN wines w ON w.id = s.wine_id;

-- Add RLS policies for security
ALTER TABLE fridge_layout ENABLE ROW LEVEL SECURITY;
ALTER TABLE cellar_slots ENABLE ROW LEVEL SECURITY;

-- RLS policies for fridge_layout (assuming users can read all layouts but only modify their own)
CREATE POLICY "Users can view all fridge layouts" ON fridge_layout
    FOR SELECT USING (true);

CREATE POLICY "Users can insert fridge layouts" ON fridge_layout
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update fridge layouts" ON fridge_layout
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete fridge layouts" ON fridge_layout
    FOR DELETE USING (true);

-- RLS policies for cellar_slots (assuming users can manage their own wine slots)
CREATE POLICY "Users can view all cellar slots" ON cellar_slots
    FOR SELECT USING (true);

CREATE POLICY "Users can insert cellar slots" ON cellar_slots
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update cellar slots" ON cellar_slots
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete cellar slots" ON cellar_slots
    FOR DELETE USING (true);

-- Grant permissions on the views
GRANT SELECT ON cellar_occupancy TO authenticated;
GRANT SELECT ON fridge_occupancy TO authenticated;
