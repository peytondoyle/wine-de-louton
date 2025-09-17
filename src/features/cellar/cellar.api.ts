import { supabase } from '../../lib/supabase'
import { DepthPosition } from '../../types'

export interface FridgeLayout {
  shelves: number
  columns: number
  name: string
}

export interface FridgeOccupancy {
  shelf: number
  column_position: number
  depth: string
  wine_id: string | null
  producer: string | null
  vintage: string | null
  wine_name: string | null
}

export interface SlotAssignment {
  shelf: number
  column_position: number
  depth: DepthPosition
}

/**
 * Get the current fridge layout configuration
 */
export async function getLayout(): Promise<FridgeLayout | null> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_fridge_layout')
    
    if (error) {
      console.error('Error fetching fridge layout:', error)
      return null
    }
    
    return data?.[0] || null
  } catch (error) {
    console.error('Error fetching fridge layout:', error)
    return null
  }
}

/**
 * Get the current wine occupancy in the fridge
 */
export async function getOccupancy(): Promise<FridgeOccupancy[]> {
  try {
    const { data, error } = await supabase.rpc('rpc_get_fridge_occupancy')
    
    if (error) {
      console.error('Error fetching fridge occupancy:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('Error fetching fridge occupancy:', error)
    return []
  }
}

/**
 * Assign a wine to a specific slot in the fridge
 * @param wineId - The ID of the wine to assign
 * @param slot - The slot coordinates (shelf, column_position, depth)
 */
export async function assignSlot(wineId: string, slot: SlotAssignment): Promise<boolean> {
  try {
    // Check for collisions first
    const { data: collisionData, error: collisionError } = await supabase.rpc('check_slot_collision', {
      p_fridge_id: '00000000-0000-0000-0000-000000000001', // Default fridge ID
      p_shelf: slot.shelf,
      p_column: slot.column_position,
      p_depth: slot.depth,
      p_exclude_wine_id: wineId // Exclude current wine if reassigning
    })

    if (collisionError) {
      console.error('Error checking slot collision:', collisionError)
      throw new Error(`Failed to check slot collision: ${collisionError.message}`)
    }

    if (collisionData) {
      throw new Error('SLOT_OCCUPIED')
    }

    const { error } = await supabase
      .from('cellar_slots')
      .upsert(
        {
          wine_id: wineId,
          shelf: slot.shelf,
          column_position: slot.column_position,
          depth: slot.depth
        },
        { onConflict: 'wine_id' }
      )
    
    if (error) {
      console.error('Error assigning wine to slot:', error)
      throw new Error(`Database error: ${error.message}`)
    }
    
    return true
  } catch (error) {
    // Re-throw SLOT_OCCUPIED errors, but log others
    if (error instanceof Error && error.message === 'SLOT_OCCUPIED') {
      throw error
    }
    console.error('Error assigning wine to slot:', error)
    throw error
  }
}

/**
 * Remove a wine from its current slot
 * @param wineId - The ID of the wine to remove
 */
export async function removeSlot(wineId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('cellar_slots')
      .delete()
      .eq('wine_id', wineId)
    
    if (error) {
      console.error('Error removing wine from slot:', error)
      return false
    }
    
    return true
  } catch (error) {
    console.error('Error removing wine from slot:', error)
    return false
  }
}

/**
 * Get the current slot assignment for a specific wine
 * @param wineId - The ID of the wine to check
 */
export async function getWineSlot(wineId: string): Promise<SlotAssignment | null> {
  try {
    const { data, error } = await supabase
      .from('cellar_slots')
      .select('shelf, column_position, depth')
      .eq('wine_id', wineId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - wine is not assigned to any slot
        return null
      }
      console.error('Error fetching wine slot:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error fetching wine slot:', error)
    return null
  }
}