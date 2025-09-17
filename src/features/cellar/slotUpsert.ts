import { supabase } from '../../lib/supabase'
import { CellarSlot, DepthPosition } from '../../types'
import { toast } from '../../lib/toast'

export interface SlotUpsertOptions {
  stackingEnabled?: boolean
  optimisticUpdate?: boolean
  showToast?: boolean
}

export interface SlotUpsertResult {
  success: boolean
  slot?: CellarSlot
  error?: string
  rollbackData?: {
    previousSlot?: CellarSlot
    action: 'place' | 'move' | 'remove'
  }
}

/**
 * Enhanced slot upsert handler with optimistic updates and rollback support
 */
export class SlotUpsertHandler {
  private rollbackStack: Array<{
    wineId: string
    action: 'place' | 'move' | 'remove'
    previousSlot?: CellarSlot
    timestamp: number
  }> = []

  /**
   * Place a wine in a slot with collision checking and stacking support
   */
  async placeWine(
    wineId: string,
    slot: { shelf: number; column: number; depth: DepthPosition },
    options: SlotUpsertOptions = {}
  ): Promise<SlotUpsertResult> {
    const {
      stackingEnabled = false,
      optimisticUpdate = true,
      showToast = true
    } = options

    const toastId = showToast ? toast.loading('Placing wine...', `place-${wineId}`) : undefined

    try {
      // Check for collisions
      const collisionResult = await this.checkCollision(
        slot.shelf,
        slot.column,
        slot.depth,
        wineId,
        stackingEnabled
      )

      if (collisionResult.hasCollision) {
        const errorMessage = collisionResult.message
        if (showToast && toastId) {
          toast.update(toastId, { variant: 'error', message: errorMessage })
        }
        return {
          success: false,
          error: errorMessage
        }
      }

      // Get current slot for rollback
      const currentSlot = await this.getCurrentSlot(wineId)
      
      // Store rollback data
      this.rollbackStack.push({
        wineId,
        action: 'place',
        previousSlot: currentSlot || undefined,
        timestamp: Date.now()
      })

      // Perform the upsert
      const slotData = {
        wine_id: wineId,
        shelf: slot.shelf,
        column_position: slot.column,
        depth: slot.depth,
        household_id: 'default_household',
        fridge_id: 'default_fridge'
      }

      const { data, error } = await supabase
        .from('cellar_slots')
        .upsert(slotData, { onConflict: 'wine_id' })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (showToast && toastId) {
        toast.update(toastId, { variant: 'success', message: 'Wine placed successfully' })
      }

      return {
        success: true,
        slot: data,
        rollbackData: {
          previousSlot: currentSlot || undefined,
          action: 'place'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place wine'
      
      if (showToast && toastId) {
        toast.update(toastId, { variant: 'error', message: errorMessage })
      }

      return {
        success: false,
        error: errorMessage,
        rollbackData: {
          previousSlot: (await this.getCurrentSlot(wineId)) || undefined,
          action: 'place'
        }
      }
    }
  }

  /**
   * Move a wine from one slot to another
   */
  async moveWine(
    wineId: string,
    fromSlot: { shelf: number; column: number; depth: DepthPosition },
    toSlot: { shelf: number; column: number; depth: DepthPosition },
    options: SlotUpsertOptions = {}
  ): Promise<SlotUpsertResult> {
    const {
      stackingEnabled = false,
      optimisticUpdate = true,
      showToast = true
    } = options

    const toastId = showToast ? toast.loading('Moving wine...', `move-${wineId}`) : undefined

    try {
      // Check for collisions at destination
      const collisionResult = await this.checkCollision(
        toSlot.shelf,
        toSlot.column,
        toSlot.depth,
        wineId,
        stackingEnabled
      )

      if (collisionResult.hasCollision) {
        const errorMessage = collisionResult.message
        if (showToast && toastId) {
          toast.update(toastId, { variant: 'error', message: errorMessage })
        }
        return {
          success: false,
          error: errorMessage
        }
      }

      // Get current slot for rollback
      const currentSlot = await this.getCurrentSlot(wineId)
      
      // Store rollback data
      this.rollbackStack.push({
        wineId,
        action: 'move',
        previousSlot: currentSlot || undefined,
        timestamp: Date.now()
      })

      // Perform the move (upsert to new slot)
      const slotData = {
        wine_id: wineId,
        shelf: toSlot.shelf,
        column_position: toSlot.column,
        depth: toSlot.depth,
        household_id: 'default_household',
        fridge_id: 'default_fridge'
      }

      const { data, error } = await supabase
        .from('cellar_slots')
        .upsert(slotData, { onConflict: 'wine_id' })
        .select()
        .single()

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (showToast && toastId) {
        toast.update(toastId, { variant: 'success', message: 'Wine moved successfully' })
      }

      return {
        success: true,
        slot: data,
        rollbackData: {
          previousSlot: currentSlot || undefined,
          action: 'move'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move wine'
      
      if (showToast && toastId) {
        toast.update(toastId, { variant: 'error', message: errorMessage })
      }

      return {
        success: false,
        error: errorMessage,
        rollbackData: {
          previousSlot: (await this.getCurrentSlot(wineId)) || undefined,
          action: 'move'
        }
      }
    }
  }

  /**
   * Remove a wine from its current slot
   */
  async removeWine(
    wineId: string,
    options: SlotUpsertOptions = {}
  ): Promise<SlotUpsertResult> {
    const { showToast = true } = options

    const toastId = showToast ? toast.loading('Removing wine...', `remove-${wineId}`) : undefined

    try {
      // Get current slot for rollback
      const currentSlot = await this.getCurrentSlot(wineId)
      
      if (!currentSlot) {
        const errorMessage = 'Wine is not currently placed in any slot'
        if (showToast && toastId) {
          toast.update(toastId, { variant: 'error', message: errorMessage })
        }
        return {
          success: false,
          error: errorMessage
        }
      }

      // Store rollback data
      this.rollbackStack.push({
        wineId,
        action: 'remove',
        previousSlot: currentSlot,
        timestamp: Date.now()
      })

      // Remove the wine
      const { error } = await supabase
        .from('cellar_slots')
        .delete()
        .eq('wine_id', wineId)

      if (error) {
        throw new Error(`Database error: ${error.message}`)
      }

      if (showToast && toastId) {
        toast.update(toastId, { variant: 'success', message: 'Wine removed successfully' })
      }

      return {
        success: true,
        rollbackData: {
          previousSlot: currentSlot,
          action: 'remove'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove wine'
      
      if (showToast && toastId) {
        toast.update(toastId, { variant: 'error', message: errorMessage })
      }

      return {
        success: false,
        error: errorMessage,
        rollbackData: {
          previousSlot: (await this.getCurrentSlot(wineId)) || undefined,
          action: 'remove'
        }
      }
    }
  }

  /**
   * Rollback the last operation
   */
  async rollbackLastOperation(): Promise<boolean> {
    const lastOperation = this.rollbackStack.pop()
    if (!lastOperation) {
      return false
    }

    try {
      const { wineId, action, previousSlot } = lastOperation

      if (action === 'remove' && previousSlot) {
        // Restore the wine to its previous slot
        await this.placeWine(wineId, {
          shelf: previousSlot.shelf,
          column: previousSlot.column_position,
          depth: previousSlot.depth
        }, { showToast: false })
      } else if (action === 'place' && previousSlot) {
        // Remove the wine (it was placed but should be removed)
        await this.removeWine(wineId, { showToast: false })
      } else if (action === 'move' && previousSlot) {
        // Move the wine back to its previous slot
        await this.moveWine(wineId, {
          shelf: previousSlot.shelf,
          column: previousSlot.column_position,
          depth: previousSlot.depth
        }, {
          shelf: previousSlot.shelf,
          column: previousSlot.column_position,
          depth: previousSlot.depth
        }, { showToast: false })
      }

      toast.success('Operation rolled back successfully')
      return true
    } catch (error) {
      console.error('Failed to rollback operation:', error)
      toast.error('Failed to rollback operation')
      return false
    }
  }

  /**
   * Clear rollback stack
   */
  clearRollbackStack(): void {
    this.rollbackStack = []
  }

  /**
   * Check for slot collisions
   */
  private async checkCollision(
    shelf: number,
    column: number,
    depth: DepthPosition,
    excludeWineId: string,
    stackingEnabled: boolean
  ): Promise<{ hasCollision: boolean; message?: string }> {
    try {
      // Check for exact slot collision
      const { data: exactCollision, error: exactError } = await supabase
        .from('cellar_slots')
        .select('wine_id')
        .eq('shelf', shelf)
        .eq('column_position', column)
        .eq('depth', depth)
        .neq('wine_id', excludeWineId)
        .single()

      if (exactError && exactError.code !== 'PGRST116') {
        throw new Error(`Failed to check collision: ${exactError.message}`)
      }

      if (exactCollision) {
        const depthText = depth === 1 ? 'Front' : 'Back'
        return {
          hasCollision: true,
          message: `Slot S${shelf} · C${column} · ${depthText} is already occupied`
        }
      }

      // If stacking is disabled, check for any wine in the same (shelf, column)
      if (!stackingEnabled) {
        const { data: columnCollision, error: columnError } = await supabase
          .from('cellar_slots')
          .select('wine_id, depth')
          .eq('shelf', shelf)
          .eq('column_position', column)
          .neq('wine_id', excludeWineId)
          .limit(1)

        if (columnError) {
          throw new Error(`Failed to check column collision: ${columnError.message}`)
        }

        if (columnCollision && columnCollision.length > 0) {
          const existingDepth = columnCollision[0].depth
          const existingDepthText = existingDepth === 1 ? 'Front' : 'Back'
          const newDepthText = depth === 1 ? 'Front' : 'Back'
          return {
            hasCollision: true,
            message: `Slot S${shelf} · C${column} is already occupied (${existingDepthText}). Enable stacking to place wines in different depths.`
          }
        }
      }

      return { hasCollision: false }
    } catch (error) {
      console.error('Error checking collision:', error)
      return {
        hasCollision: true,
        message: 'Failed to check slot availability'
      }
    }
  }

  /**
   * Get the current slot for a wine
   */
  private async getCurrentSlot(wineId: string): Promise<CellarSlot | null> {
    try {
      const { data, error } = await supabase
        .from('cellar_slots')
        .select('*')
        .eq('wine_id', wineId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No slot found
        }
        throw new Error(`Failed to get current slot: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Error getting current slot:', error)
      return null
    }
  }
}

// Export a singleton instance
export const slotUpsertHandler = new SlotUpsertHandler()
