-- Enable RLS on wines table
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
