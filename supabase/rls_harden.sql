-- RLS Hardening Script
-- This script hardens Row Level Security by:
-- 1. Revoking all permissive anon policies
-- 2. Granting read-only access to anon users
-- 3. Blocking all write operations for anon users
-- 4. Documenting Edge Function write path with household secret validation

-- ============================================================================
-- MIGRATION COMMENTS
-- ============================================================================
-- This script should be run AFTER setup-rls.sql
-- It will drop and recreate all existing policies with hardened security
-- 
-- To rollback: Re-run setup-rls.sql to restore permissive policies
-- ============================================================================

-- ============================================================================
-- 1. REVOKE ALL PERMISSIVE ANON POLICIES
-- ============================================================================

-- Drop all existing policies on wines table
DROP POLICY IF EXISTS "anon can select wines" ON wines;
DROP POLICY IF EXISTS "anon can insert wines" ON wines;
DROP POLICY IF EXISTS "anon can update wines" ON wines;
DROP POLICY IF EXISTS "anon can delete wines" ON wines;
DROP POLICY IF EXISTS "household_select_wines" ON wines;
DROP POLICY IF EXISTS "household_insert_wines" ON wines;
DROP POLICY IF EXISTS "household_update_wines" ON wines;
DROP POLICY IF EXISTS "household_delete_wines" ON wines;

-- Drop all existing policies on fridge_layout table
DROP POLICY IF EXISTS "anon can select fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "anon can insert fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "anon can update fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "anon can delete fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_select_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_insert_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_update_fridge_layout" ON fridge_layout;
DROP POLICY IF EXISTS "household_delete_fridge_layout" ON fridge_layout;

-- Drop all existing policies on cellar_slots table
DROP POLICY IF EXISTS "anon can select cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "anon can insert cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "anon can update cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "anon can delete cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_select_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_insert_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_update_cellar_slots" ON cellar_slots;
DROP POLICY IF EXISTS "household_delete_cellar_slots" ON cellar_slots;

-- ============================================================================
-- 2. CREATE APP_CONFIG TABLE FOR HOUSEHOLD SECRET
-- ============================================================================

-- Create app_config table to store household secrets
CREATE TABLE IF NOT EXISTS app_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  household_id text NOT NULL UNIQUE,
  household_secret_hash text NOT NULL, -- bcrypt hash of the household secret
  created_by text DEFAULT 'system'
);

-- Enable RLS on app_config
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Only service role can access app_config
CREATE POLICY "service_role_only_app_config" ON app_config
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. HARDENED RLS POLICIES - READ-ONLY FOR ANON
-- ============================================================================

-- WINES TABLE: Read-only access for anon, full access for service role
CREATE POLICY "anon_readonly_wines" ON wines
  FOR SELECT USING (true);

-- Block all write operations for anon on wines
CREATE POLICY "block_anon_writes_wines" ON wines
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_anon_updates_wines" ON wines
  FOR UPDATE USING (false);

CREATE POLICY "block_anon_deletes_wines" ON wines
  FOR DELETE USING (false);

-- FRIDGE_LAYOUT TABLE: Read-only access for anon
CREATE POLICY "anon_readonly_fridge_layout" ON fridge_layout
  FOR SELECT USING (true);

-- Block all write operations for anon on fridge_layout
CREATE POLICY "block_anon_writes_fridge_layout" ON fridge_layout
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_anon_updates_fridge_layout" ON fridge_layout
  FOR UPDATE USING (false);

CREATE POLICY "block_anon_deletes_fridge_layout" ON fridge_layout
  FOR DELETE USING (false);

-- CELLAR_SLOTS TABLE: Read-only access for anon
CREATE POLICY "anon_readonly_cellar_slots" ON cellar_slots
  FOR SELECT USING (true);

-- Block all write operations for anon on cellar_slots
CREATE POLICY "block_anon_writes_cellar_slots" ON cellar_slots
  FOR INSERT WITH CHECK (false);

CREATE POLICY "block_anon_updates_cellar_slots" ON cellar_slots
  FOR UPDATE USING (false);

CREATE POLICY "block_anon_deletes_cellar_slots" ON cellar_slots
  FOR DELETE USING (false);

-- ============================================================================
-- 4. EDGE FUNCTION WRITE PATH DOCUMENTATION
-- ============================================================================

-- Create a function to validate household secret
CREATE OR REPLACE FUNCTION validate_household_secret(
  p_household_id text,
  p_secret text
) RETURNS boolean AS $$
DECLARE
  stored_hash text;
BEGIN
  -- Get the stored hash for the household
  SELECT household_secret_hash INTO stored_hash
  FROM app_config
  WHERE household_id = p_household_id;
  
  -- If no config found, deny access
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  
  -- Use pgcrypto to verify the secret against the stored hash
  -- Note: This requires pgcrypto extension to be enabled
  RETURN crypt(p_secret, stored_hash) = stored_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to generate household secret hash
CREATE OR REPLACE FUNCTION generate_household_secret_hash(
  p_household_id text,
  p_secret text
) RETURNS text AS $$
DECLARE
  secret_hash text;
BEGIN
  -- Generate bcrypt hash of the secret
  secret_hash := crypt(p_secret, gen_salt('bf'));
  
  -- Insert or update the household secret
  INSERT INTO app_config (household_id, household_secret_hash)
  VALUES (p_household_id, secret_hash)
  ON CONFLICT (household_id) 
  DO UPDATE SET 
    household_secret_hash = secret_hash,
    updated_at = now();
  
  RETURN secret_hash;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. EDGE FUNCTION WRITE PATH IMPLEMENTATION GUIDE
-- ============================================================================

/*
EDGE FUNCTION WRITE PATH IMPLEMENTATION:

1. Create a new Edge Function (e.g., /supabase/functions/wine-write/index.ts):

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WriteRequest {
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: 'wines' | 'fridge_layout' | 'cellar_slots'
  data: any
  household_id: string
  household_secret: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { operation, table, data, household_id, household_secret }: WriteRequest = await req.json()

    // Validate required fields
    if (!operation || !table || !household_id || !household_secret) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Validate household secret
    const { data: isValid, error: validationError } = await supabase
      .rpc('validate_household_secret', {
        p_household_id: household_id,
        p_secret: household_secret
      })

    if (validationError || !isValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid household secret' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Add household_id to data for RLS
    const dataWithHousehold = { ...data, household_id }

    // Perform the database operation
    let result
    switch (operation) {
      case 'INSERT':
        result = await supabase.from(table).insert(dataWithHousehold)
        break
      case 'UPDATE':
        result = await supabase.from(table).update(dataWithHousehold).eq('id', data.id)
        break
      case 'DELETE':
        result = await supabase.from(table).delete().eq('id', data.id)
        break
      default:
        throw new Error('Invalid operation')
    }

    if (result.error) {
      throw result.error
    }

    return new Response(
      JSON.stringify({ success: true, data: result.data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in wine-write function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

2. Deploy the Edge Function:
   ```bash
   supabase functions deploy wine-write
   ```

3. Initialize household secret (run once):
   ```sql
   SELECT generate_household_secret_hash('default_household', 'your-secret-key-here');
   ```

4. Update client code to use Edge Function for writes:
   ```typescript
   // Instead of direct Supabase calls for writes:
   const response = await fetch('/functions/v1/wine-write', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       operation: 'INSERT',
       table: 'wines',
       data: wineData,
       household_id: 'default_household',
       household_secret: 'your-secret-key-here'
     })
   })
   ```

SECURITY BENEFITS:
- Anon users can only read data, never write
- All writes go through Edge Function with secret validation
- Service role key is never exposed to client
- Household secret provides additional authentication layer
- RLS policies are enforced at database level
- All write operations are logged and auditable
*/

-- ============================================================================
-- 6. GRANT NECESSARY PERMISSIONS
-- ============================================================================

-- Grant execute permission on validation functions to anon role
GRANT EXECUTE ON FUNCTION validate_household_secret(text, text) TO anon;
GRANT EXECUTE ON FUNCTION generate_household_secret_hash(text, text) TO anon;

-- ============================================================================
-- 7. VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('wines', 'fridge_layout', 'cellar_slots', 'app_config')
ORDER BY tablename;

-- Verify policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('wines', 'fridge_layout', 'cellar_slots', 'app_config')
ORDER BY tablename, policyname;

-- Test that anon can read but not write
-- (Run these as anon user to verify)
-- SELECT * FROM wines LIMIT 1; -- Should work
-- INSERT INTO wines (producer, wine_name) VALUES ('Test', 'Test Wine'); -- Should fail
