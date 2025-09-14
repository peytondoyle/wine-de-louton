import { useState } from 'react'
import { toast } from '../lib/toast'
import type { Wine } from '../types'
import { WineStatus } from '../types'
import { updateWine, deleteWine } from '../data/wines'
import { requestEnrichment } from '../data/enrich'
import { toastDrunk, toastReenrichQueued, toastError } from '../utils/toastMessages'

interface UseWineActionsOptions {
  onWineUpdated?: (wine: Wine) => void
  onWineDeleted?: (wineId: string) => void
  onEditWine?: (wine: Wine) => void
  onReEnrichSuccess?: () => void
}

/**
 * Custom hook that provides wine-related actions for use in drawer footers and other UI components.
 * Centralizes wine operations with consistent loading states and toast notifications.
 */
export function useWineActions(
  wine?: Wine,
  options: UseWineActionsOptions = {}
) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})

  const setLoading = (action: string, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [action]: loading }))
  }

  /**
   * Opens the edit sheet for the wine
   */
  const edit = () => {
    if (!wine) {
      console.warn('No wine provided to edit action')
      return
    }
    options.onEditWine?.(wine)
  }

  /**
   * Marks a wine as drunk with the current date
   */
  const markDrunk = async () => {
    if (!wine) {
      console.warn('No wine provided to markDrunk action')
      return
    }

    setLoading('markDrunk', true)
    try {
      const updatedWine = await updateWine(wine.id, {
        status: WineStatus.DRUNK,
        drank_on: new Date().toISOString().split('T')[0]
      })
      
      options.onWineUpdated?.(updatedWine)
      // Visual feedback: wine data updates in drawer
    } catch (error) {
      console.error('Error marking wine as drunk:', error)
      toastError('mark wine as drunk', error)
    } finally {
      setLoading('markDrunk', false)
    }
  }

  /**
   * Gets new AI suggestions for a wine
   */
  const reEnrich = async () => {
    if (!wine) {
      console.warn('No wine provided to reEnrich action')
      return
    }

    setLoading('reEnrich', true)
    try {
      const enrichment = await requestEnrichment({
        id: wine.id,
        producer: wine.producer,
        vintage: wine.vintage ?? undefined,
        wine_name: wine.wine_name ?? undefined,
        appellation: wine.appellation ?? undefined,
        region: wine.region ?? undefined,
        country_code: wine.country_code ?? undefined,
      })

      if (enrichment) {
        // The requestEnrichment function already updates the wine in the database
        // We need to fetch the updated wine to get the latest data
        const updatedWine = await updateWine(wine.id, {
          ai_enrichment: enrichment,
          ai_confidence: 0.5,
          ai_refreshed_at: new Date().toISOString()
        })
        
        options.onWineUpdated?.(updatedWine)
        options.onReEnrichSuccess?.()
        // Visual feedback: AI suggestions appear in drawer
      } else {
        toastError('fetch AI suggestions', new Error('No enrichment data returned'))
      }
    } catch (error) {
      console.error('Error getting new suggestions:', error)
      toastError('refresh AI suggestions', error)
    } finally {
      setLoading('reEnrich', false)
    }
  }

  /**
   * Deletes a wine after confirmation
   */
  const deleteWineAction = async () => {
    if (!wine) {
      console.warn('No wine provided to deleteWine action')
      return
    }

    // Show confirmation dialog
    const confirmed = window.confirm(
      `Are you sure you want to delete "${wine.producer} ${wine.wine_name || ''}"? This action cannot be undone.`
    )

    if (!confirmed) return

    setLoading('deleteWine', true)
    try {
      await deleteWine(wine.id)
      options.onWineDeleted?.(wine.id)
      // Visual feedback: wine disappears from list
    } catch (error) {
      console.error('Error deleting wine:', error)
      toastError('delete wine', error)
    } finally {
      setLoading('deleteWine', false)
    }
  }

  return {
    edit,
    markDrunk,
    reEnrich,
    deleteWine: deleteWineAction,
    loading: {
      markDrunk: loadingStates.markDrunk || false,
      reEnrich: loadingStates.reEnrich || false,
      deleteWine: loadingStates.deleteWine || false,
    }
  }
}
