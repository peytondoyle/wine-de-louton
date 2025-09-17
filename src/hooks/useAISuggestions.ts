import { useState, useCallback, useMemo } from 'react'
import { updateWine } from '../features/wines/data/wines'
import { requestEnrichment } from '../features/enrichment/data/enrich'
import { 
  AISuggestionsState, 
  AIFieldSuggestion, 
  FieldKey, 
  FieldProvenance,
  getConfidenceLevel
} from '../types/enrichment'
import { Wine } from '../types'
import { toast } from '../lib/toast'
import { useUndo } from './useUndo'

export function useAISuggestions(wine: Wine) {
  const [state, setState] = useState<AISuggestionsState>({
    isOpen: false,
    suggestions: [],
    appliedFields: new Set(),
    skippedFields: new Set(),
    isLoading: false,
    error: null
  })

  // Undo functionality
  const { showUndoToast, refreshUndoState } = useUndo(wine.id)

  // Generate AI suggestions from wine data
  const generateSuggestions = useCallback(async (): Promise<AIFieldSuggestion[]> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // Request enrichment data
      const enrichmentData = await requestEnrichment({
        id: wine.id,
        producer: wine.producer,
        wine_name: wine.wine_name,
        vintage: wine.vintage,
        region: wine.region,
        country_code: wine.country_code
      })

      if (!enrichmentData) {
        throw new Error('No enrichment data received')
      }

      // Convert enrichment data to field suggestions
      const suggestions: AIFieldSuggestion[] = []

      // Drink window suggestions
      if (enrichmentData.drink_window?.from && wine.drink_window_from !== enrichmentData.drink_window.from) {
        if (wine.drink_window_from) {
          suggestions.push({
            kind: 'present' as const,
            key: 'drink_window_from',
            current: wine.drink_window_from,
            suggestion: enrichmentData.drink_window.from,
            confidence: 0.8,
            source: 'openai'
          })
        } else {
          suggestions.push({
            kind: 'missing' as const,
            key: 'drink_window_from',
            current: null,
            suggestion: enrichmentData.drink_window.from,
            confidence: 0.8,
            source: 'openai'
          })
        }
      }

      if (enrichmentData.drink_window?.to && wine.drink_window_to !== enrichmentData.drink_window.to) {
        if (wine.drink_window_to) {
          suggestions.push({
            kind: 'present' as const,
            key: 'drink_window_to',
            current: wine.drink_window_to,
            suggestion: enrichmentData.drink_window.to,
            confidence: 0.8,
            source: 'openai'
          })
        } else {
          suggestions.push({
            kind: 'missing' as const,
            key: 'drink_window_to',
            current: null,
            suggestion: enrichmentData.drink_window.to,
            confidence: 0.8,
            source: 'openai'
          })
        }
      }

      // Tasting notes suggestions
      if (enrichmentData.tasting_notes?.text && wine.peyton_notes !== enrichmentData.tasting_notes.text) {
        if (wine.peyton_notes) {
          suggestions.push({
            kind: 'present' as const,
            key: 'tasting_notes',
            current: wine.peyton_notes,
            suggestion: enrichmentData.tasting_notes.text,
            confidence: 0.7,
            source: 'openai'
          })
        } else {
          suggestions.push({
            kind: 'missing' as const,
            key: 'tasting_notes',
            current: null,
            suggestion: enrichmentData.tasting_notes.text,
            confidence: 0.7,
            source: 'openai'
          })
        }
      }

      // Wine Spectator score suggestions
      if (enrichmentData.critic_scores?.wine_spectator && wine.score_wine_spectator !== enrichmentData.critic_scores.wine_spectator) {
        if (wine.score_wine_spectator) {
          suggestions.push({
            kind: 'present' as const,
            key: 'score_wine_spectator',
            current: wine.score_wine_spectator,
            suggestion: enrichmentData.critic_scores.wine_spectator,
            confidence: 0.9,
            source: 'openai'
          })
        } else {
          suggestions.push({
            kind: 'missing' as const,
            key: 'score_wine_spectator',
            current: null,
            suggestion: enrichmentData.critic_scores.wine_spectator,
            confidence: 0.9,
            source: 'openai'
          })
        }
      }

      // James Suckling score suggestions
      if (enrichmentData.critic_scores?.james_suckling && wine.score_james_suckling !== enrichmentData.critic_scores.james_suckling) {
        if (wine.score_james_suckling) {
          suggestions.push({
            kind: 'present' as const,
            key: 'score_james_suckling',
            current: wine.score_james_suckling,
            suggestion: enrichmentData.critic_scores.james_suckling,
            confidence: 0.9,
            source: 'openai'
          })
        } else {
          suggestions.push({
            kind: 'missing' as const,
            key: 'score_james_suckling',
            current: null,
            suggestion: enrichmentData.critic_scores.james_suckling,
            confidence: 0.9,
            source: 'openai'
          })
        }
      }

      // Food pairings suggestions
      if (enrichmentData.food_pairings?.items && enrichmentData.food_pairings.items.length > 0) {
        const currentPairings = wine.ai_enrichment?.food_pairings?.items?.join(', ') || null
        const suggestedPairings = enrichmentData.food_pairings.items.join(', ')
        
        if (currentPairings !== suggestedPairings) {
          if (currentPairings) {
            suggestions.push({
              kind: 'present' as const,
              key: 'food_pairings',
              current: currentPairings,
              suggestion: suggestedPairings,
              confidence: 0.6,
              source: 'openai'
            })
          } else {
            suggestions.push({
              kind: 'missing' as const,
              key: 'food_pairings',
              current: null,
              suggestion: suggestedPairings,
              confidence: 0.6,
              source: 'openai'
            })
          }
        }
      }

      setState(prev => ({ 
        ...prev, 
        suggestions, 
        isLoading: false,
        error: null
      }))

      return suggestions
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate suggestions'
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }))
      throw error
    }
  }, [wine])

  // Helper function to get current value of a field
  const getCurrentValue = useCallback((fieldKey: FieldKey): string | number | null => {
    switch (fieldKey) {
      case 'drink_window_from': return wine.drink_window_from ?? null
      case 'drink_window_to': return wine.drink_window_to ?? null
      case 'tasting_notes': return wine.peyton_notes ?? null
      case 'score_wine_spectator': return wine.score_wine_spectator ?? null
      case 'score_james_suckling': return wine.score_james_suckling ?? null
      case 'food_pairings': return wine.ai_enrichment?.food_pairings?.items?.join(', ') || null
      default: return null
    }
  }, [wine])

  // Apply a single suggestion
  const applySuggestion = useCallback(async (fieldKey: FieldKey, suggestion: AIFieldSuggestion) => {
    try {
      // Skip if suggestion is not applicable
      if (suggestion.kind === 'skip') {
        return
      }

      const updateData: Partial<Wine> = {}
      
      switch (fieldKey) {
        case 'drink_window_from':
          updateData.drink_window_from = suggestion.suggestion as number
          break
        case 'drink_window_to':
          updateData.drink_window_to = suggestion.suggestion as number
          break
        case 'tasting_notes':
          updateData.peyton_notes = suggestion.suggestion as string
          break
        case 'score_wine_spectator':
          updateData.score_wine_spectator = suggestion.suggestion as number
          break
        case 'score_james_suckling':
          updateData.score_james_suckling = suggestion.suggestion as number
          break
        case 'food_pairings':
          // Update AI enrichment data
          updateData.ai_enrichment = {
            ...wine.ai_enrichment,
            food_pairings: {
              items: (suggestion.suggestion as string).split(', '),
              source: ['openai']
            }
          }
          break
      }

      // Get the old value for undo tracking
      const oldValue = getCurrentValue(fieldKey)
      
      await updateWine(wine.id, updateData)
      
      setState(prev => ({
        ...prev,
        appliedFields: new Set(prev.appliedFields).add(fieldKey)
      }))

      // Show undo toast
      showUndoToast(fieldKey, oldValue, suggestion.suggestion)
      
      // Refresh undo state
      refreshUndoState()
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
      toast.error(`Failed to update ${getFieldDisplayName(fieldKey)}`)
      throw error
    }
  }, [wine])

  // Apply all safe suggestions (confidence >= 0.75)
  const applyAllSafe = useCallback(async () => {
    const safeSuggestions = state.suggestions.filter(s => 
      s.kind !== 'skip' && s.confidence >= 0.75
    )

    if (safeSuggestions.length === 0) {
      toast.info('No safe suggestions to apply')
      return
    }

    try {
      const updateData: Partial<Wine> = {}
      let appliedCount = 0

      for (const suggestion of safeSuggestions) {
        // Skip if suggestion is not applicable
        if (suggestion.kind === 'skip') {
          continue
        }

        switch (suggestion.key) {
          case 'drink_window_from':
            updateData.drink_window_from = suggestion.suggestion as number
            appliedCount++
            break
          case 'drink_window_to':
            updateData.drink_window_to = suggestion.suggestion as number
            appliedCount++
            break
          case 'tasting_notes':
            updateData.peyton_notes = suggestion.suggestion as string
            appliedCount++
            break
          case 'score_wine_spectator':
            updateData.score_wine_spectator = suggestion.suggestion as number
            appliedCount++
            break
          case 'score_james_suckling':
            updateData.score_james_suckling = suggestion.suggestion as number
            appliedCount++
            break
          case 'food_pairings':
            updateData.ai_enrichment = {
              ...wine.ai_enrichment,
              food_pairings: {
                items: (suggestion.suggestion as string).split(', '),
                source: ['openai']
              }
            }
            appliedCount++
            break
        }
      }

      await updateWine(wine.id, updateData)
      
      setState(prev => ({
        ...prev,
        appliedFields: new Set([...prev.appliedFields, ...safeSuggestions.map(s => s.key)])
      }))

      // Show undo toast for the batch operation
      showUndoToast('multiple_fields', 'Previous values', `${appliedCount} fields updated`)
      
      // Refresh undo state
      refreshUndoState()
    } catch (error) {
      console.error('Failed to apply safe suggestions:', error)
      toast.error('Failed to apply some suggestions')
      throw error
    }
  }, [state.suggestions, wine])

  // Skip a suggestion
  const skipSuggestion = useCallback((fieldKey: FieldKey) => {
    setState(prev => ({
      ...prev,
      skippedFields: new Set(prev.skippedFields).add(fieldKey)
    }))
  }, [])

  // Open suggestions panel
  const openSuggestions = useCallback(async () => {
    setState(prev => ({ ...prev, isOpen: true }))
    try {
      await generateSuggestions()
    } catch (error) {
      // Error is already handled in generateSuggestions
    }
  }, [generateSuggestions])

  // Close suggestions panel
  const closeSuggestions = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      isOpen: false,
      appliedFields: new Set(),
      skippedFields: new Set()
    }))
  }, [])

  // Get field provenance (mock implementation - would come from database)
  const getFieldProvenance = useCallback((fieldKey: FieldKey): FieldProvenance => {
    // This would typically come from a database field tracking AI applications
    // For now, return mock data
    return {
      lastAppliedFromAI: false,
      appliedAt: new Date().toISOString()
    }
  }, [])

  // Count pending suggestions
  const pendingCount = useMemo(() => {
    return state.suggestions.filter(s => s.kind !== 'skip').length
  }, [state.suggestions])

  // Count safe suggestions
  const safeCount = useMemo(() => {
    return state.suggestions.filter(s => 
      s.kind !== 'skip' && s.confidence >= 0.75
    ).length
  }, [state.suggestions])

  return {
    ...state,
    pendingCount,
    safeCount,
    openSuggestions,
    closeSuggestions,
    applySuggestion,
    applyAllSafe,
    skipSuggestion,
    getFieldProvenance
  }
}

function getFieldDisplayName(key: FieldKey): string {
  const fieldNames: Record<FieldKey, string> = {
    producer: 'Producer',
    wineName: 'Wine Name',
    vintage: 'Vintage',
    region: 'Region',
    varietal: 'Varietal',
    sizeMl: 'Bottle Size',
    notes: 'Notes',
    drink_window_from: 'Drink Window From',
    drink_window_to: 'Drink Window To',
    tasting_notes: 'Tasting Notes',
    score_wine_spectator: 'Wine Spectator Score',
    score_james_suckling: 'James Suckling Score',
    food_pairings: 'Food Pairings'
  }
  return fieldNames[key] || key
}
