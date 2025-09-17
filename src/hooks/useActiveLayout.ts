import { useState, useEffect, useCallback } from 'react'
import { useLocalStorage } from './useLocalStorage'
import { LayoutConfig, FridgeLayout } from '../types'
import { 
  getFridgeLayouts, 
  createFridgeLayout, 
  updateFridgeLayoutById, 
  deleteFridgeLayout,
  getFridgeLayout 
} from '../features/cellar/data/cellar'

const ACTIVE_LAYOUT_KEY = 'activeLayoutId'
const DEFAULT_LAYOUT: LayoutConfig = {
  shelves: 6,
  columns: 5,
  name: 'Default Layout'
}

export interface UseActiveLayoutReturn {
  // State
  activeLayout: FridgeLayout | null
  availableLayouts: FridgeLayout[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setActiveLayoutId: (id: string) => void
  createLayout: (config: LayoutConfig) => Promise<FridgeLayout | null>
  updateLayout: (id: string, config: Partial<LayoutConfig>) => Promise<FridgeLayout | null>
  deleteLayout: (id: string) => Promise<boolean>
  refreshLayouts: () => Promise<void>
  clearError: () => void
}

export function useActiveLayout(): UseActiveLayoutReturn {
  const [activeLayoutId, setActiveLayoutId] = useLocalStorage<string | null>(
    ACTIVE_LAYOUT_KEY,
    null
  )
  
  const [activeLayout, setActiveLayout] = useState<FridgeLayout | null>(null)
  const [availableLayouts, setAvailableLayouts] = useState<FridgeLayout[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((err: unknown) => {
    const message = err instanceof Error ? err.message : 'An error occurred'
    setError(message)
    console.error('Layout operation error:', err)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Load all available layouts
  const loadLayouts = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const layouts = await getFridgeLayouts()
      setAvailableLayouts(layouts)
      
      // If no active layout is set, use the first available layout
      if (!activeLayoutId && layouts.length > 0) {
        setActiveLayoutId(layouts[0].id)
        setActiveLayout(layouts[0])
      }
    } catch (err) {
      handleError(err)
    } finally {
      setIsLoading(false)
    }
  }, [activeLayoutId, setActiveLayoutId, handleError])

  // Load the active layout
  const loadActiveLayout = useCallback(async (layoutId: string) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const layout = await getFridgeLayout(layoutId)
      if (layout) {
        setActiveLayout(layout)
      } else {
        // If the active layout doesn't exist, clear it
        setActiveLayoutId(null)
        setActiveLayout(null)
      }
    } catch (err) {
      handleError(err)
      // If there's an error loading the layout, clear it
      setActiveLayoutId(null)
      setActiveLayout(null)
    } finally {
      setIsLoading(false)
    }
  }, [setActiveLayoutId, handleError])

  // Create a new layout
  const createLayout = useCallback(async (config: LayoutConfig): Promise<FridgeLayout | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const newLayout = await createFridgeLayout({
        ...config,
        fridge_id: `fridge_${Date.now()}` // Generate unique fridge_id
      })
      
      // Refresh layouts list
      await loadLayouts()
      
      return newLayout
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [loadLayouts, handleError])

  // Update an existing layout
  const updateLayout = useCallback(async (
    id: string, 
    config: Partial<LayoutConfig>
  ): Promise<FridgeLayout | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const updatedLayout = await updateFridgeLayoutById(id, config)
      
      // Update the active layout if it's the one being updated
      if (activeLayoutId === id) {
        setActiveLayout(updatedLayout)
      }
      
      // Refresh layouts list
      await loadLayouts()
      
      return updatedLayout
    } catch (err) {
      handleError(err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [activeLayoutId, loadLayouts, handleError])

  // Delete a layout
  const deleteLayout = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsLoading(true)
      setError(null)
      
      await deleteFridgeLayout(id)
      
      // If the deleted layout was active, clear the active layout
      if (activeLayoutId === id) {
        setActiveLayoutId(null)
        setActiveLayout(null)
      }
      
      // Refresh layouts list
      await loadLayouts()
      
      return true
    } catch (err) {
      handleError(err)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [activeLayoutId, setActiveLayoutId, loadLayouts, handleError])

  // Refresh layouts
  const refreshLayouts = useCallback(async () => {
    await loadLayouts()
  }, [loadLayouts])

  // Load layouts on mount
  useEffect(() => {
    loadLayouts()
  }, [loadLayouts])

  // Load active layout when activeLayoutId changes
  useEffect(() => {
    if (activeLayoutId) {
      loadActiveLayout(activeLayoutId)
    } else {
      setActiveLayout(null)
    }
  }, [activeLayoutId, loadActiveLayout])

  // Create default layout if none exist
  useEffect(() => {
    if (!isLoading && availableLayouts.length === 0 && !activeLayoutId) {
      createLayout(DEFAULT_LAYOUT)
    }
  }, [isLoading, availableLayouts.length, activeLayoutId, createLayout])

  return {
    // State
    activeLayout,
    availableLayouts,
    isLoading,
    error,
    
    // Actions
    setActiveLayoutId,
    createLayout,
    updateLayout,
    deleteLayout,
    refreshLayouts,
    clearError
  }
}
