import { useState, useCallback, useRef, useReducer } from 'react'
import { CellarSlot, OccupancySlot, DepthPosition, Wine } from '../types'
import { assignSlot, removeSlot } from '../features/cellar/cellar.api'
import { toast } from '../lib/toast'

export interface SlotPlacementState {
  // Current placement state
  slots: Map<string, CellarSlot> // key: "shelf-column-depth"
  occupiedSlots: Set<string> // key: "shelf-column-depth"
  
  // Ghost preview state
  ghostPreview: {
    wineId: string | null
    slot: { shelf: number; column: number; depth: DepthPosition } | null
    isVisible: boolean
  }
  
  // Stacking controls
  stackingEnabled: boolean
  
  // Loading states
  isPlacing: boolean
  isMoving: boolean
}

export interface SlotPlacementActions {
  // Core placement actions
  placeWine: (wineId: string, slot: { shelf: number; column: number; depth: DepthPosition }) => Promise<boolean>
  moveWine: (wineId: string, fromSlot: string, toSlot: { shelf: number; column: number; depth: DepthPosition }) => Promise<boolean>
  removeWine: (wineId: string) => Promise<boolean>
  
  // Ghost preview actions
  startGhostPreview: (wineId: string, slot: { shelf: number; column: number; depth: DepthPosition }) => void
  updateGhostPreview: (slot: { shelf: number; column: number; depth: DepthPosition }) => void
  confirmGhostPreview: () => Promise<boolean>
  cancelGhostPreview: () => void
  
  // Stacking controls
  setStackingEnabled: (enabled: boolean) => void
  
  // State management
  initializeSlots: (slots: CellarSlot[]) => void
  refreshSlots: () => Promise<void>
}

export type SlotPlacementReducer = (
  state: SlotPlacementState,
  action: SlotPlacementAction
) => SlotPlacementState

export type SlotPlacementAction =
  | { type: 'INITIALIZE_SLOTS'; payload: CellarSlot[] }
  | { type: 'SET_STACKING_ENABLED'; payload: boolean }
  | { type: 'START_GHOST_PREVIEW'; payload: { wineId: string; slot: { shelf: number; column: number; depth: DepthPosition } } }
  | { type: 'UPDATE_GHOST_PREVIEW'; payload: { shelf: number; column: number; depth: DepthPosition } }
  | { type: 'CANCEL_GHOST_PREVIEW' }
  | { type: 'PLACE_WINE_START'; payload: { wineId: string; slot: { shelf: number; column: number; depth: DepthPosition } } }
  | { type: 'PLACE_WINE_SUCCESS'; payload: { wineId: string; slot: CellarSlot } }
  | { type: 'PLACE_WINE_ERROR'; payload: { wineId: string; error: string } }
  | { type: 'MOVE_WINE_START'; payload: { wineId: string; fromSlot: string; toSlot: { shelf: number; column: number; depth: DepthPosition } } }
  | { type: 'MOVE_WINE_SUCCESS'; payload: { wineId: string; fromSlot: string; toSlot: CellarSlot } }
  | { type: 'MOVE_WINE_ERROR'; payload: { wineId: string; error: string } }
  | { type: 'REMOVE_WINE_START'; payload: { wineId: string } }
  | { type: 'REMOVE_WINE_SUCCESS'; payload: { wineId: string } }
  | { type: 'REMOVE_WINE_ERROR'; payload: { wineId: string; error: string } }

const initialState: SlotPlacementState = {
  slots: new Map(),
  occupiedSlots: new Set(),
  ghostPreview: {
    wineId: null,
    slot: null,
    isVisible: false
  },
  stackingEnabled: false,
  isPlacing: false,
  isMoving: false
}

// Reducer function
function slotPlacementReducer(state: SlotPlacementState, action: SlotPlacementAction): SlotPlacementState {
  switch (action.type) {
    case 'PLACE_WINE_START':
      return { ...state, isPlacing: true }
    
    case 'PLACE_WINE_SUCCESS':
      return { ...state, isPlacing: false }
    
    case 'PLACE_WINE_ERROR':
      return { ...state, isPlacing: false }
    
    case 'MOVE_WINE_START':
      return { ...state, isMoving: true }
    
    case 'MOVE_WINE_SUCCESS':
      return { ...state, isMoving: false }
    
    case 'MOVE_WINE_ERROR':
      return { ...state, isMoving: false }
    
    case 'REMOVE_WINE_START':
      return { ...state, isPlacing: true }
    
    case 'REMOVE_WINE_SUCCESS':
      return { ...state, isPlacing: false }
    
    case 'REMOVE_WINE_ERROR':
      return { ...state, isPlacing: false }
    
    case 'START_GHOST_PREVIEW':
      return {
        ...state,
        ghostPreview: {
          wineId: action.payload.wineId,
          slot: action.payload.slot,
          isVisible: true
        }
      }
    
    case 'UPDATE_GHOST_PREVIEW':
      return {
        ...state,
        ghostPreview: {
          ...state.ghostPreview,
          slot: action.payload
        }
      }
    
    case 'CANCEL_GHOST_PREVIEW':
      return {
        ...state,
        ghostPreview: {
          wineId: null,
          slot: null,
          isVisible: false
        }
      }
    
    case 'SET_STACKING_ENABLED':
      return { ...state, stackingEnabled: action.payload }
    
    case 'INITIALIZE_SLOTS':
      const newSlots = new Map<string, CellarSlot>()
      const newOccupiedSlots = new Set<string>()
      
      action.payload.forEach(slot => {
        const key = `${slot.shelf}-${slot.column_position}-${slot.depth === 1 ? 'F' : 'B'}`
        newSlots.set(key, slot)
        if (slot.wine_id) {
          newOccupiedSlots.add(key)
        }
      })
      
      return {
        ...state,
        slots: newSlots,
        occupiedSlots: newOccupiedSlots
      }
    
    default:
      return state
  }
}


export function useSlotPlacement(): SlotPlacementState & SlotPlacementActions {
  const [state, setState] = useState<SlotPlacementState>(initialState)
  const toastIdRef = useRef<string | null>(null)

  const createSlotKey = useCallback((shelf: number, column: number, depth: DepthPosition): string => {
    return `${shelf}-${column}-${depth}`
  }, [])

  const checkCollision = useCallback((shelf: number, column: number, depth: DepthPosition, excludeWineId?: string): boolean => {
    const key = createSlotKey(shelf, column, depth)
    const slot = state.slots.get(key)
    
    if (!slot) return false
    
    // If stacking is enabled, allow multiple wines in same (shelf, column) but different depths
    if (state.stackingEnabled) {
      return slot.depth === depth && slot.wine_id !== excludeWineId
    }
    
    // If stacking is disabled, check for any wine in the same (shelf, column)
    return slot.wine_id !== excludeWineId
  }, [state.slots, state.stackingEnabled, createSlotKey])

  const placeWine = useCallback(async (
    wineId: string, 
    slot: { shelf: number; column: number; depth: DepthPosition }
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isPlacing: true }))
      
      // Check for collisions
      if (checkCollision(slot.shelf, slot.column, slot.depth, wineId)) {
        const depthText = slot.depth === 1 ? 'Front' : 'Back'
        const message = state.stackingEnabled 
          ? `Slot S${slot.shelf} · C${slot.column} · ${depthText} is already occupied`
          : `Slot S${slot.shelf} · C${slot.column} is already occupied (disable stacking to allow multiple wines)`
        
        toast.error(message)
        setState(prev => ({ ...prev, isPlacing: false }))
        return false
      }

      // Show loading toast
      toastIdRef.current = toast.loading('Placing wine...', `place-${wineId}`)

      // Perform the placement
      const success = await assignSlot(wineId, {
        shelf: slot.shelf,
        column_position: slot.column,
        depth: slot.depth
      })

      if (success) {
        // Create a mock slot for the reducer (the actual slot will be fetched on refresh)
        const mockSlot: CellarSlot = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          household_id: 'default_household',
          wine_id: wineId,
          fridge_id: 'default_fridge',
          shelf: slot.shelf,
          column_position: slot.column,
          depth: slot.depth
        }

        setState(prev => ({ ...prev, isPlacing: false }))
        
        // Update toast to success
        if (toastIdRef.current) {
          toast.update(toastIdRef.current, { variant: 'success', message: 'Wine placed successfully' })
        }
        
        return true
      } else {
        throw new Error('Failed to place wine')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to place wine'
      
      // Update toast to error
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, { variant: 'error', message: errorMessage })
      }
      
      setState(prev => ({ ...prev, isPlacing: false }))
      return false
    }
  }, [checkCollision, createSlotKey])

  const moveWine = useCallback(async (
    wineId: string,
    fromSlot: string,
    toSlot: { shelf: number; column: number; depth: DepthPosition }
  ): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isMoving: true }))
      
      // Check for collisions at destination
      if (checkCollision(toSlot.shelf, toSlot.column, toSlot.depth, wineId)) {
        const depthText = toSlot.depth === 1 ? 'Front' : 'Back'
        const message = state.stackingEnabled 
          ? `Slot S${toSlot.shelf} · C${toSlot.column} · ${depthText} is already occupied`
          : `Slot S${toSlot.shelf} · C${toSlot.column} is already occupied (disable stacking to allow multiple wines)`
        
        toast.error(message)
        setState(prev => ({ ...prev, isMoving: false }))
        return false
      }

      // Show loading toast
      toastIdRef.current = toast.loading('Moving wine...', `move-${wineId}`)

      // Remove from old slot
      const removeSuccess = await removeSlot(wineId)
      if (!removeSuccess) {
        throw new Error('Failed to remove wine from old slot')
      }

      // Place in new slot
      const placeSuccess = await assignSlot(wineId, {
        shelf: toSlot.shelf,
        column_position: toSlot.column,
        depth: toSlot.depth
      })

      if (placeSuccess) {
        // Create a mock slot for the reducer
        const mockSlot: CellarSlot = {
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          household_id: 'default_household',
          wine_id: wineId,
          fridge_id: 'default_fridge',
          shelf: toSlot.shelf,
          column_position: toSlot.column,
          depth: toSlot.depth
        }

        setState(prev => ({ ...prev, isMoving: false }))
        
        // Update toast to success
        if (toastIdRef.current) {
          toast.update(toastIdRef.current, { variant: 'success', message: 'Wine moved successfully' })
        }
        
        return true
      } else {
        throw new Error('Failed to place wine in new slot')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move wine'
      
      // Update toast to error
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, { variant: 'error', message: errorMessage })
      }
      
      setState(prev => ({ ...prev, isMoving: false }))
      return false
    }
  }, [checkCollision, createSlotKey])

  const removeWine = useCallback(async (wineId: string): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isPlacing: true }))
      
      // Show loading toast
      toastIdRef.current = toast.loading('Removing wine...', `remove-${wineId}`)

      const success = await removeSlot(wineId)
      
      if (success) {
        setState(prev => ({ ...prev, isPlacing: false }))
        
        // Update toast to success
        if (toastIdRef.current) {
          toast.update(toastIdRef.current, { variant: 'success', message: 'Wine removed successfully' })
        }
        
        return true
      } else {
        throw new Error('Failed to remove wine')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove wine'
      
      // Update toast to error
      if (toastIdRef.current) {
        toast.update(toastIdRef.current, { variant: 'error', message: errorMessage })
      }
      
      setState(prev => ({ ...prev, isPlacing: false }))
      return false
    }
  }, [])

  const startGhostPreview = useCallback((wineId: string, slot: { shelf: number; column: number; depth: DepthPosition }) => {
    setState(prev => ({
      ...prev,
      ghostPreview: {
        wineId,
        slot,
        isVisible: true
      }
    }))
  }, [])

  const updateGhostPreview = useCallback((slot: { shelf: number; column: number; depth: DepthPosition }) => {
    setState(prev => ({
      ...prev,
      ghostPreview: {
        ...prev.ghostPreview,
        slot
      }
    }))
  }, [])

  const confirmGhostPreview = useCallback(async (): Promise<boolean> => {
    if (!state.ghostPreview.wineId || !state.ghostPreview.slot) {
      return false
    }

    // Find the current slot for this wine
    let currentSlot: string | null = null
    for (const [key, slot] of state.slots.entries()) {
      if (slot.wine_id === state.ghostPreview.wineId) {
        currentSlot = key
        break
      }
    }

    if (currentSlot) {
      // Moving existing wine
      return await moveWine(state.ghostPreview.wineId, currentSlot, state.ghostPreview.slot)
    } else {
      // Placing new wine
      return await placeWine(state.ghostPreview.wineId, state.ghostPreview.slot)
    }
  }, [state.ghostPreview, placeWine, moveWine])

  const cancelGhostPreview = useCallback(() => {
    setState(prev => ({
      ...prev,
      ghostPreview: {
        wineId: null,
        slot: null,
        isVisible: false
      }
    }))
  }, [])

  const setStackingEnabled = useCallback((enabled: boolean) => {
    setState(prev => ({ ...prev, stackingEnabled: enabled }))
  }, [])

  const initializeSlots = useCallback((slots: CellarSlot[]) => {
    const newSlots = new Map<string, CellarSlot>()
    const newOccupiedSlots = new Set<string>()
    
    slots.forEach(slot => {
      const key = `${slot.shelf}-${slot.column_position}-${slot.depth === 1 ? 'F' : 'B'}`
      newSlots.set(key, slot)
      if (slot.wine_id) {
        newOccupiedSlots.add(key)
      }
    })
    
    setState(prev => ({
      ...prev,
      slots: newSlots,
      occupiedSlots: newOccupiedSlots
    }))
  }, [])

  const refreshSlots = useCallback(async (): Promise<void> => {
    // This would typically fetch fresh data from the server
    // For now, we'll just clear any loading states
    setState(prev => ({
      ...prev,
      ghostPreview: {
        wineId: null,
        slot: null,
        isVisible: false
      }
    }))
  }, [])

  return {
    ...state,
    placeWine,
    moveWine,
    removeWine,
    startGhostPreview,
    updateGhostPreview,
    confirmGhostPreview,
    cancelGhostPreview,
    setStackingEnabled,
    initializeSlots,
    refreshSlots
  }
}
