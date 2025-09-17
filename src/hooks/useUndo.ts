import { useState, useCallback, useEffect } from 'react'
import { undoLastChange, getLastChange, hasUndoableChanges } from '../features/wines/data/wines'
import { toast } from '../lib/toast'
import type { UndoChange, UndoResult } from '../types/undo'

export function useUndo(wineId: string) {
  const [lastChange, setLastChange] = useState<UndoChange | null>(null)
  const [canUndo, setCanUndo] = useState(false)

  // Check for undoable changes
  const checkUndoable = useCallback(() => {
    const hasChanges = hasUndoableChanges(wineId)
    const change = getLastChange(wineId)
    setCanUndo(hasChanges)
    setLastChange(change)
  }, [wineId])

  // Check on mount and when wineId changes
  useEffect(() => {
    checkUndoable()
  }, [checkUndoable])

  // Undo the last change
  const undo = useCallback(async (): Promise<boolean> => {
    try {
      const result: UndoResult = await undoLastChange(wineId)
      
      if (result.success) {
        toast.success(`Restored ${result.restoredField} to previous value`)
        checkUndoable() // Refresh undo state
        return true
      } else {
        toast.error(result.error || 'Failed to undo change')
        return false
      }
    } catch (error) {
      console.error('Undo failed:', error)
      toast.error('Failed to undo change')
      return false
    }
  }, [wineId, checkUndoable])

  // Show undo toast after a change
  const showUndoToast = useCallback((field: string, fromValue: any, toValue: any) => {
    const fieldName = getFieldDisplayName(field)
    const fromDisplay = formatValueForDisplay(fromValue)
    const toDisplay = formatValueForDisplay(toValue)
    
    const toastId = toast.success(
      `${fieldName} updated from "${fromDisplay}" to "${toDisplay}"`,
      {
        duration: 5000
      }
    )
    
    // Update undo state
    checkUndoable()
    
    return toastId
  }, [undo, checkUndoable])

  return {
    canUndo,
    lastChange,
    undo,
    showUndoToast,
    refreshUndoState: checkUndoable
  }
}

// Helper functions
function getFieldDisplayName(field: string): string {
  const fieldNames: Record<string, string> = {
    producer: 'Producer',
    wine_name: 'Wine Name',
    vintage: 'Vintage',
    region: 'Region',
    varietals: 'Varietals',
    bottle_size: 'Bottle Size',
    peyton_notes: 'Notes',
    drink_window_from: 'Drink Window From',
    drink_window_to: 'Drink Window To',
    score_wine_spectator: 'Wine Spectator Score',
    score_james_suckling: 'James Suckling Score',
    ai_enrichment: 'AI Enrichment'
  }
  return fieldNames[field] || field
}

function formatValueForDisplay(value: any): string {
  if (value === null || value === undefined) {
    return 'Not set'
  }
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    return value.toString()
  }
  return value
}
