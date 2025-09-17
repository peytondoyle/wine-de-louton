import { createClient } from '@supabase/supabase-js'

// Safe defaults for private app - can be overridden by environment variables
const url = import.meta.env.VITE_SUPABASE_URL ?? "https://YOUR-REAL-URL.supabase.co";
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "YOUR-ANON-KEY";

// Warn if using defaults (for development awareness)
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('Using hardcoded Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for production.');
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
