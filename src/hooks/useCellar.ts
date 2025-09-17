import { useState, useCallback } from 'react'
import { 
  FridgeLayout, 
  CellarSlot, 
  OccupancySlot, 
  FridgeOccupancy, 
  DepthPosition 
} from '../types'
import { 
  getFridgeLayouts,
  getFridgeLayout,
  getFridgeOccupancy,
  assignWineToSlot,
  removeWineFromSlot,
  moveWineToSlot,
  getUnassignedWines,
  getWinesInFridge
} from '../features/cellar/data/cellar'

export function useCellar() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An error occurred'
    setError(message)
    console.error('Cellar operation error:', err)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const executeOperation = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true)
      setError(null)
      const result = await operation()
      return result
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [handleError])

  // Fridge Layout operations
  const loadFridgeLayouts = useCallback(async (): Promise<FridgeLayout[]> => {
    const result = await executeOperation(() => getFridgeLayouts())
    return result || []
  }, [executeOperation])

  const loadFridgeLayout = useCallback(async (fridgeId: string): Promise<FridgeLayout | null> => {
    return await executeOperation(() => getFridgeLayout(fridgeId))
  }, [executeOperation])

  // Occupancy operations
  const loadFridgeOccupancy = useCallback(async (fridgeId: string): Promise<FridgeOccupancy | null> => {
    return await executeOperation(() => getFridgeOccupancy(fridgeId))
  }, [executeOperation])

  // Wine assignment operations
  const assignWine = useCallback(async (
    wineId: string,
    fridgeId: string,
    shelf: number,
    column: number,
    depth: DepthPosition
  ): Promise<CellarSlot | null> => {
    return await executeOperation(() => 
      assignWineToSlot(wineId, fridgeId, shelf, column, depth)
    )
  }, [executeOperation])

  const removeWine = useCallback(async (slotId: string): Promise<boolean> => {
    const result = await executeOperation(async () => {
      await removeWineFromSlot(slotId)
      return true
    })
    return result || false
  }, [executeOperation])

  const moveWine = useCallback(async (
    wineId: string,
    fromSlotId: string,
    toFridgeId: string,
    toShelf: number,
    toColumn: number,
    toDepth: DepthPosition
  ): Promise<CellarSlot | null> => {
    return await executeOperation(() => 
      moveWineToSlot(wineId, fromSlotId, toFridgeId, toShelf, toColumn, toDepth)
    )
  }, [executeOperation])

  // Wine queries
  const loadUnassignedWines = useCallback(async (): Promise<any[]> => {
    const result = await executeOperation(() => getUnassignedWines())
    return result || []
  }, [executeOperation])

  const loadWinesInFridge = useCallback(async (fridgeId: string): Promise<any[]> => {
    const result = await executeOperation(() => getWinesInFridge(fridgeId))
    return result || []
  }, [executeOperation])

  // Utility functions
  const formatLocation = useCallback((shelf: number, column: number, depth: DepthPosition): string => {
    const depthDisplay = depth === 1 ? 'Front' : 'Back'
    return `S${shelf} · C${column} · ${depthDisplay}`
  }, [])

  const parseLocation = useCallback((location: string): { shelf: number; column: number; depth: DepthPosition } | null => {
    const match = location.match(/S(\d+) · C(\d+) · (Front|Back)/i)
    if (!match) return null
    
    return {
      shelf: parseInt(match[1], 10),
      column: parseInt(match[2], 10),
      depth: match[3].toLowerCase() === 'front' ? 1 : 2
    }
  }, [])

  const getSlotKey = useCallback((shelf: number, column: number, depth: DepthPosition): string => {
    return `${shelf}-${column}-${depth}`
  }, [])

  const findSlotInOccupancy = useCallback((
    occupancy: FridgeOccupancy,
    shelf: number,
    column: number,
    depth: DepthPosition
  ): OccupancySlot | undefined => {
    return occupancy.slots.find(slot => 
      slot.shelf === shelf && 
      slot.column_position === column && 
      slot.depth === depth
    )
  }, [])

  return {
    // State
    loading,
    error,
    
    // Actions
    clearError,
    
    // Fridge Layout operations
    loadFridgeLayouts,
    loadFridgeLayout,
    
    // Occupancy operations
    loadFridgeOccupancy,
    
    // Wine assignment operations
    assignWine,
    removeWine,
    moveWine,
    
    // Wine queries
    loadUnassignedWines,
    loadWinesInFridge,
    
    // Utility functions
    formatLocation,
    parseLocation,
    getSlotKey,
    findSlotInOccupancy
  }
}
