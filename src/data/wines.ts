import { supabase } from '../lib/supabase'
import type { Wine, WineSort, WineFormData } from '../types'
import { WineStatus } from '../types'

/**
 * Lists wines with optional filtering and sorting
 */
export async function listWines(options: {
  status?: WineStatus | 'All'
  country_code?: string
  region?: string
  bottle_size?: string
  vintageMin?: number
  vintageMax?: number
  search?: string
  sort?: WineSort
} = {}): Promise<Wine[]> {
  let query = supabase
    .from('wines')
    .select('*')

  // Apply filters
  if (options.status && options.status !== 'All') {
    query = query.eq('status', options.status)
  }

  if (options.country_code) {
    query = query.eq('country_code', options.country_code)
  }

  if (options.region) {
    query = query.ilike('region', `%${options.region}%`)
  }

  if (options.bottle_size && options.bottle_size !== 'All') {
    query = query.eq('bottle_size', options.bottle_size)
  }

  if (options.vintageMin !== undefined) {
    query = query.gte('vintage', options.vintageMin)
  }

  if (options.vintageMax !== undefined) {
    query = query.lte('vintage', options.vintageMax)
  }

  if (options.search) {
    query = query.or(`producer.ilike.%${options.search}%,wine_name.ilike.%${options.search}%,appellation.ilike.%${options.search}%,region.ilike.%${options.search}%`)
  }

  // Apply sorting
  const sortField = options.sort?.field || 'created_at'
  const sortDirection = options.sort?.direction || 'desc'
  query = query.order(sortField, { ascending: sortDirection === 'asc' })

  const { data, error } = await query

  if (error) {
    console.error('Error fetching wines:', error)
    throw new Error(`Failed to fetch wines: ${error.message}`)
  }

  return data || []
}

/**
 * Gets a single wine by ID
 */
export async function getWine(id: string): Promise<Wine | null> {
  const { data, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Wine not found
    }
    console.error('Error fetching wine:', error)
    throw new Error(`Failed to fetch wine: ${error.message}`)
  }

  return data
}

/**
 * Inserts a new wine
 */
export async function insertWine(wine: WineFormData): Promise<Wine> {
  const { data, error } = await supabase
    .from('wines')
    .insert([wine])
    .select()
    .single()

  if (error) {
    console.error('Error inserting wine:', error)
    throw new Error(`Failed to insert wine: ${error.message}`)
  }

  return data
}

/**
 * Updates an existing wine
 */
export async function updateWine(id: string, patch: Partial<Wine>): Promise<Wine> {
  const { data, error } = await supabase
    .from('wines')
    .update(patch)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    // Bubble up PostgREST details for debugging
    throw new Error(`Update failed: ${error.message}`);
  }
  if (data) return data as Wine;

  // Fallback (RLS or return=minimal cases)
  const { data: fetched, error: fetchErr } = await supabase
    .from('wines')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw new Error(`Refetch after update failed: ${fetchErr.message}`);
  if (!fetched) throw new Error('Update succeeded but no row returned');
  return fetched as Wine;
}

/**
 * Marks a wine as drunk
 */
export async function markDrunk(id: string, date: string = new Date().toISOString().split('T')[0]): Promise<Wine> {
  return updateWine(id, {
    status: WineStatus.DRUNK,
    drank_on: date
  })
}

/**
 * Deletes a wine
 */
export async function deleteWine(id: string): Promise<void> {
  const { error } = await supabase
    .from('wines')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting wine:', error)
    throw new Error(`Failed to delete wine: ${error.message}`)
  }
}
