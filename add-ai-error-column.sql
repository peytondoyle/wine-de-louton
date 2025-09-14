-- Add ai_last_error column to wines table
ALTER TABLE wines ADD COLUMN ai_last_error TEXT;

-- Update the RLS policies to include the new column
-- (No changes needed as the policies are already permissive)
