import { supabase } from '../../../lib/supabase'
import type { 
  FridgeLayout, 
  CellarSlot, 
  OccupancySlot, 
  FridgeOccupancy, 
  DepthPosition 
} from '../../../types'
import { DepthPosition as DepthPositionEnum } from '../../../types'

/**
 * Gets all fridge layouts for the household
 */
export async function getFridgeLayouts(): Promise<FridgeLayout[]> {
  const { data, error } = await supabase
    .from('fridge_layout')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching fridge layouts:', error)
    throw new Error(`Failed to fetch fridge layouts: ${error.message}`)
  }

  return data || []
}

/**
 * Gets a specific fridge layout by fridge_id
 */
export async function getFridgeLayout(fridgeId: string): Promise<FridgeLayout | null> {
  const { data, error } = await supabase
    .from('fridge_layout')
    .select('*')
    .eq('fridge_id', fridgeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Layout not found
    }
    console.error('Error fetching fridge layout:', error)
    throw new Error(`Failed to fetch fridge layout: ${error.message}`)
  }

  return data
}

/**
 * Creates a new fridge layout
 */
export async function createFridgeLayout(layout: Omit<FridgeLayout, 'id' | 'created_at' | 'updated_at' | 'household_id'>): Promise<FridgeLayout> {
  const layoutWithHousehold = {
    ...layout,
    household_id: 'default_household'
  }
  
  const { data, error } = await supabase
    .from('fridge_layout')
    .insert([layoutWithHousehold])
    .select()
    .single()

  if (error) {
    console.error('Error creating fridge layout:', error)
    throw new Error(`Failed to create fridge layout: ${error.message}`)
  }

  return data
}

/**
 * Updates an existing fridge layout
 */
export async function updateFridgeLayout(fridgeId: string, updates: Partial<FridgeLayout>): Promise<FridgeLayout> {
  const { data, error } = await supabase
    .from('fridge_layout')
    .update(updates)
    .eq('fridge_id', fridgeId)
    .select()
    .single()

  if (error) {
    console.error('Error updating fridge layout:', error)
    throw new Error(`Failed to update fridge layout: ${error.message}`)
  }

  return data
}

/**
 * Gets all cellar slots for a specific fridge
 */
export async function getCellarSlots(fridgeId: string): Promise<CellarSlot[]> {
  const { data, error } = await supabase
    .from('cellar_slots')
    .select('*')
    .eq('fridge_id', fridgeId)
    .order('shelf', { ascending: true })
    .order('column_position', { ascending: true })
    .order('depth', { ascending: true })

  if (error) {
    console.error('Error fetching cellar slots:', error)
    throw new Error(`Failed to fetch cellar slots: ${error.message}`)
  }

  return data || []
}

/**
 * Gets occupancy data for a specific fridge
 */
export async function getFridgeOccupancy(fridgeId: string): Promise<FridgeOccupancy> {
  // Get the layout first
  const layout = await getFridgeLayout(fridgeId)
  if (!layout) {
    throw new Error(`Fridge layout not found for fridge_id: ${fridgeId}`)
  }

  // Get occupancy data using the database function
  const { data, error } = await supabase.rpc('get_fridge_occupancy', {
    p_fridge_id: fridgeId
  })

  if (error) {
    console.error('Error fetching fridge occupancy:', error)
    throw new Error(`Failed to fetch fridge occupancy: ${error.message}`)
  }

  const slots: OccupancySlot[] = data || []
  const occupied_slots = slots.filter(slot => slot.is_occupied).length
  const total_slots = slots.length
  const occupancy_percentage = total_slots > 0 ? Math.round((occupied_slots / total_slots) * 100) : 0

  return {
    layout,
    slots,
    total_slots,
    occupied_slots,
    occupancy_percentage
  }
}

/**
 * Assigns a wine to a specific cellar slot
 */
export async function assignWineToSlot(
  wineId: string, 
  fridgeId: string, 
  shelf: number, 
  column_position: number, 
  depth: DepthPosition
): Promise<CellarSlot> {
  // Check for collisions first
  const { data: collisionData, error: collisionError } = await supabase.rpc('check_slot_collision', {
    p_fridge_id: fridgeId,
    p_shelf: shelf,
    p_column: column_position,
    p_depth: depth,
    p_exclude_wine_id: null
  })

  if (collisionError) {
    console.error('Error checking slot collision:', collisionError)
    throw new Error(`Failed to check slot collision: ${collisionError.message}`)
  }

  if (collisionData) {
    throw new Error(`Slot S${shelf} · C${column_position} · ${depth === 1 ? 'Front' : 'Back'} is already occupied`)
  }

  // Create the slot assignment
  const slotData = {
    wine_id: wineId,
    fridge_id: fridgeId,
    shelf,
    column_position: column_position,
    depth,
    household_id: 'default_household'
  }

  const { data, error } = await supabase
    .from('cellar_slots')
    .insert([slotData])
    .select()
    .single()

  if (error) {
    console.error('Error assigning wine to slot:', error)
    throw new Error(`Failed to assign wine to slot: ${error.message}`)
  }

  return data
}

/**
 * Removes a wine from a cellar slot
 */
export async function removeWineFromSlot(slotId: string): Promise<void> {
  const { error } = await supabase
    .from('cellar_slots')
    .delete()
    .eq('id', slotId)

  if (error) {
    console.error('Error removing wine from slot:', error)
    throw new Error(`Failed to remove wine from slot: ${error.message}`)
  }
}

/**
 * Moves a wine from one slot to another
 */
export async function moveWineToSlot(
  wineId: string,
  fromSlotId: string,
  toFridgeId: string,
  toShelf: number,
  toColumn_position: number,
  toDepth: DepthPosition
): Promise<CellarSlot> {
  // Check for collisions at the destination
  const { data: collisionData, error: collisionError } = await supabase.rpc('check_slot_collision', {
    p_fridge_id: toFridgeId,
    p_shelf: toShelf,
    p_column: toColumn_position,
    p_depth: toDepth,
    p_exclude_wine_id: wineId
  })

  if (collisionError) {
    console.error('Error checking slot collision:', collisionError)
    throw new Error(`Failed to check slot collision: ${collisionError.message}`)
  }

  if (collisionData) {
    throw new Error(`Destination slot S${toShelf} · C${toColumn_position} · ${toDepth === 1 ? 'Front' : 'Back'} is already occupied`)
  }

  // Remove from old slot
  await removeWineFromSlot(fromSlotId)

  // Assign to new slot
  return assignWineToSlot(wineId, toFridgeId, toShelf, toColumn_position, toDepth)
}

/**
 * Gets all wines that are not currently assigned to any cellar slot
 */
export async function getUnassignedWines(): Promise<any[]> {
  const { data, error } = await supabase
    .from('wines')
    .select(`
      *,
      cellar_slots!left(id)
    `)
    .eq('status', 'Cellared')
    .is('cellar_slots.id', null)

  if (error) {
    console.error('Error fetching unassigned wines:', error)
    throw new Error(`Failed to fetch unassigned wines: ${error.message}`)
  }

  return data || []
}

/**
 * Gets all wines assigned to a specific fridge
 */
export async function getWinesInFridge(fridgeId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('cellar_slots')
    .select(`
      *,
      wines!inner(*)
    `)
    .eq('fridge_id', fridgeId)

  if (error) {
    console.error('Error fetching wines in fridge:', error)
    throw new Error(`Failed to fetch wines in fridge: ${error.message}`)
  }

  return data || []
}

/**
 * Checks if a specific slot is occupied
 */
export function checkSlotCollision(
  shelf: number, 
  column: number, 
  depth: DepthPosition, 
  cellarSlots: CellarSlot[]
): boolean {
  return cellarSlots.some(slot => 
    slot.shelf === shelf && 
    slot.column_position === column && 
    slot.depth === depth
  )
}

/**
 * Gets all available slots in the fridge
 */
export function getAvailableSlots(
  fridgeLayout: FridgeLayout, 
  cellarSlots: CellarSlot[]
): Array<{ shelf: number; column: number; depth_position: DepthPosition }> {
  const available: Array<{ shelf: number; column: number; depth_position: DepthPosition }> = []
  
  for (let shelf = 1; shelf <= fridgeLayout.shelves; shelf++) {
    for (let column = 1; column <= fridgeLayout.columns; column++) {
      for (const depth of [DepthPositionEnum.FRONT, DepthPositionEnum.BACK]) {
        if (!checkSlotCollision(shelf, column, depth, cellarSlots)) {
          available.push({ shelf, column, depth_position: depth })
        }
      }
    }
  }
  
  return available
}
