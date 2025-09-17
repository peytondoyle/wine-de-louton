import { supabase } from '../../../lib/supabase'
import { safeParseWine, safeParseWineArray, validateCreateWine, validateUpdateWine } from '../../../lib/validation'
import type { Wine, WineSort, WineFormData, AIEnrichment } from '../../../types'
import { WineStatus } from '../../../types'
import type { UndoChange, UndoStack, UndoResult } from '../../../types/undo'

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

  // Validate API response at runtime
  if (!data) return []
  
  try {
    return safeParseWineArray(data) as Wine[]
  } catch (validationError) {
    console.error('Wine data validation failed:', validationError)
    throw new Error('Invalid wine data received from server')
  }
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

  // Validate API response at runtime
  if (!data) return null
  
  try {
    return safeParseWine(data) as Wine
  } catch (validationError) {
    console.error('Wine data validation failed:', validationError)
    throw new Error('Invalid wine data received from server')
  }
}

/**
 * Inserts a new wine
 */
export async function insertWine(wine: WineFormData): Promise<Wine> {
  // Validate input data at runtime
  const validatedWine = validateCreateWine({
    ...wine,
    household_id: 'default_household'
  })
  
  const { data, error } = await supabase
    .from('wines')
    .insert([validatedWine])
    .select()
    .single()

  if (error) {
    console.error('Error inserting wine:', error)
    throw new Error(`Failed to insert wine: ${error.message}`)
  }

  // Validate API response at runtime
  if (!data) {
    throw new Error('No data returned from wine insertion')
  }
  
  try {
    return safeParseWine(data) as Wine
  } catch (validationError) {
    console.error('Wine data validation failed:', validationError)
    throw new Error('Invalid wine data received from server')
  }
}

/**
 * Updates an existing wine
 */
export async function updateWine(id: string, patch: Partial<Wine>): Promise<Wine> {
  // Get current wine state for undo tracking
  const currentWine = await getWine(id);
  if (!currentWine) {
    throw new Error(`Wine with id ${id} not found`);
  }

  // Validate input data at runtime
  const validatedPatch = validateUpdateWine({ id, ...patch })
  
  const { data, error } = await supabase
    .from('wines')
    .update(validatedPatch)
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    // Bubble up PostgREST details for debugging
    throw new Error(`Update failed: ${error.message}`);
  }
  if (data) {
    try {
      const updatedWine = safeParseWine(data) as Wine;
      
      // Track changes for undo (only track fields that actually changed)
      Object.keys(validatedPatch).forEach(field => {
        if (field !== 'id' && field !== 'updated_at') {
          const oldValue = currentWine[field as keyof Wine];
          const newValue = (validatedPatch as any)[field];
          
          // Only track if the value actually changed
          if (oldValue !== newValue) {
            addUndoChange(id, field, oldValue, newValue);
          }
        }
      });
      
      return updatedWine;
    } catch (validationError) {
      console.error('Wine data validation failed:', validationError)
      throw new Error('Invalid wine data received from server')
    }
  }

  // Fallback (RLS or return=minimal cases)
  const { data: fetched, error: fetchErr } = await supabase
    .from('wines')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchErr) throw new Error(`Refetch after update failed: ${fetchErr.message}`);
  if (!fetched) throw new Error('Update succeeded but no row returned');
  
  try {
    const updatedWine = safeParseWine(fetched) as Wine;
    
    // Track changes for undo (only track fields that actually changed)
    Object.keys(validatedPatch).forEach(field => {
      if (field !== 'id' && field !== 'updated_at') {
        const oldValue = currentWine[field as keyof Wine];
        const newValue = (validatedPatch as any)[field];
        
        // Only track if the value actually changed
        if (oldValue !== newValue) {
          addUndoChange(id, field, oldValue, newValue);
        }
      }
    });
    
    return updatedWine;
  } catch (validationError) {
    console.error('Wine data validation failed:', validationError)
    throw new Error('Invalid wine data received from server')
  }
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

// ============================================================================
// AI Enrichment Patch Helpers
// ============================================================================

/**
 * Applies drink window from AI enrichment to the wine's real fields
 * and clears only the drink_window AI enrichment key
 */
export async function applyDrinkWindow(id: string, value: { from?: number; to?: number }): Promise<Wine> {
  // First get the current wine to access its AI enrichment
  const wine = await getWine(id)
  if (!wine) {
    throw new Error(`Wine with id ${id} not found`)
  }

  // Update the real drink window fields
  const wineUpdate: Partial<Wine> = {
    drink_window_from: value.from,
    drink_window_to: value.to
  }

  // Clear only the drink_window from AI enrichment, keep other AI data
  let updatedEnrichment: AIEnrichment | null = null
  if (wine.ai_enrichment) {
    const { drink_window, ...restEnrichment } = wine.ai_enrichment
    updatedEnrichment = Object.keys(restEnrichment).length > 0 ? restEnrichment : null
  }

  return updateWine(id, {
    ...wineUpdate,
    ai_enrichment: updatedEnrichment
  })
}

/**
 * Applies tasting notes from AI enrichment to the wine's real fields
 * and clears only the tasting_notes AI enrichment key
 */
export async function applyTastingNotes(id: string, text: string): Promise<Wine> {
  // First get the current wine to access its AI enrichment
  const wine = await getWine(id)
  if (!wine) {
    throw new Error(`Wine with id ${id} not found`)
  }

  // Update the real tasting notes field (assuming we store it in peyton_notes or louis_notes)
  // For now, we'll use peyton_notes as the default field for AI-suggested tasting notes
  const wineUpdate: Partial<Wine> = {
    peyton_notes: text
  }

  // Clear only the tasting_notes from AI enrichment, keep other AI data
  let updatedEnrichment: AIEnrichment | null = null
  if (wine.ai_enrichment) {
    const { tasting_notes, ...restEnrichment } = wine.ai_enrichment
    updatedEnrichment = Object.keys(restEnrichment).length > 0 ? restEnrichment : null
  }

  return updateWine(id, {
    ...wineUpdate,
    ai_enrichment: updatedEnrichment
  })
}

/**
 * Applies critic scores from AI enrichment to the wine's real fields
 * and clears only the critic_scores AI enrichment key
 */
export async function applyCriticScores(id: string, scores: { wine_spectator?: number; james_suckling?: number }): Promise<Wine> {
  // First get the current wine to access its AI enrichment
  const wine = await getWine(id)
  if (!wine) {
    throw new Error(`Wine with id ${id} not found`)
  }

  // Update the real critic score fields
  const wineUpdate: Partial<Wine> = {}
  if (scores.wine_spectator !== undefined) {
    wineUpdate.score_wine_spectator = scores.wine_spectator
  }
  if (scores.james_suckling !== undefined) {
    wineUpdate.score_james_suckling = scores.james_suckling
  }

  // Clear only the critic_scores from AI enrichment, keep other AI data
  let updatedEnrichment: AIEnrichment | null = null
  if (wine.ai_enrichment) {
    const { critic_scores, ...restEnrichment } = wine.ai_enrichment
    updatedEnrichment = Object.keys(restEnrichment).length > 0 ? restEnrichment : null
  }

  return updateWine(id, {
    ...wineUpdate,
    ai_enrichment: updatedEnrichment
  })
}

/**
 * Dismisses a specific AI enrichment field without applying it to real fields
 */

// ============================================================================
// Undo System
// ============================================================================

// In-memory storage for undo stacks, keyed by wine ID
const undoStacks = new Map<string, UndoStack>();

// Default configuration
const DEFAULT_MAX_STACK_SIZE = 10;

/**
 * Gets or creates an undo stack for a wine
 */
function getUndoStack(wineId: string): UndoStack {
  if (!undoStacks.has(wineId)) {
    undoStacks.set(wineId, {
      changes: [],
      maxSize: DEFAULT_MAX_STACK_SIZE
    });
  }
  return undoStacks.get(wineId)!;
}

/**
 * Adds a change to the undo stack for a wine
 */
export function addUndoChange(wineId: string, field: string, from: any, to: any): void {
  const stack = getUndoStack(wineId);
  
  const change: UndoChange = {
    field,
    from,
    to,
    timestamp: new Date().toISOString(),
    changeId: `${wineId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  };
  
  // Add to the beginning of the array (most recent first)
  stack.changes.unshift(change);
  
  // Trim to max size
  if (stack.changes.length > stack.maxSize) {
    stack.changes = stack.changes.slice(0, stack.maxSize);
  }
}

/**
 * Undoes the last change for a wine
 */
export async function undoLastChange(wineId: string): Promise<UndoResult> {
  try {
    const stack = getUndoStack(wineId);
    
    if (stack.changes.length === 0) {
      return {
        success: false,
        error: 'No changes to undo'
      };
    }
    
    // Get the most recent change
    const lastChange = stack.changes[0];
    
    // Prepare the update to restore the previous value
    const updateData: Partial<Wine> = {};
    updateData[lastChange.field as keyof Wine] = lastChange.from;
    
    // Apply the undo update
    const updatedWine = await updateWine(wineId, updateData);
    
    // Remove the undone change from the stack
    stack.changes.shift();
    
    return {
      success: true,
      restoredField: lastChange.field,
      restoredValue: lastChange.from
    };
  } catch (error) {
    console.error('Failed to undo last change:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Gets the undo history for a wine
 */
export function getUndoHistory(wineId: string): UndoChange[] {
  const stack = getUndoStack(wineId);
  return [...stack.changes]; // Return a copy to prevent external mutation
}

/**
 * Clears the undo history for a wine
 */
export function clearUndoHistory(wineId: string): void {
  const stack = getUndoStack(wineId);
  stack.changes = [];
}

/**
 * Checks if a wine has any undoable changes
 */
export function hasUndoableChanges(wineId: string): boolean {
  const stack = getUndoStack(wineId);
  return stack.changes.length > 0;
}

/**
 * Gets the last change for a wine (for display purposes)
 */
export function getLastChange(wineId: string): UndoChange | null {
  const stack = getUndoStack(wineId);
  return stack.changes.length > 0 ? stack.changes[0] : null;
}
export async function dismissAIField(id: string, field: keyof AIEnrichment): Promise<Wine> {
  // First get the current wine to access its AI enrichment
  const wine = await getWine(id)
  if (!wine) {
    throw new Error(`Wine with id ${id} not found`)
  }

  // Clear only the specified field from AI enrichment, keep other AI data
  let updatedEnrichment: AIEnrichment | null = null
  if (wine.ai_enrichment) {
    const { [field]: _, ...restEnrichment } = wine.ai_enrichment
    updatedEnrichment = Object.keys(restEnrichment).length > 0 ? restEnrichment : null
  }

  return updateWine(id, {
    ai_enrichment: updatedEnrichment
  })
}

/**
 * Dismisses all AI enrichment data without applying any of it to real fields
 */
export async function dismissAllAI(id: string): Promise<Wine> {
  return updateWine(id, {
    ai_enrichment: null,
    ai_confidence: null
  })
}
