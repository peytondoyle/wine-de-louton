import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://xzdnruzcaoxmmaxkjtsl.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6ZG5ydXpjYW94bW1heGtqdHNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTgxMTksImV4cCI6MjA3MzM3NDExOX0.YSu5eHg8W-LtHndkcrDx2P5emLXr07lC2Bz5Q7NVbfs";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
