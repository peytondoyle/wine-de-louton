-- Add ai_refreshed_at column to wines table
ALTER TABLE wines ADD COLUMN ai_refreshed_at timestamptz;
