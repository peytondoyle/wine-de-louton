import { supabase } from '../lib/supabase';

export async function pingWines() {
  const { data, error } = await supabase.from('wines').select('id').limit(1);
  return { ok: !error, error };
}
