import React, { useState, useRef, useEffect, useMemo, useCallback, memo } from 'react'
import { Wine, AIEnrichment } from '../../../types'
import { applyDrinkWindow, applyTastingNotes, applyCriticScores, dismissAIField, dismissAllAI } from '../../wines/data/wines'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { Label } from '../../../components/ui/Label'
import { Check, Loader2, X, Info } from 'lucide-react'
import { ConfidenceBadge } from './ConfidenceBadge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/Tooltip'
import { generateDiff } from '../../../lib/diff'
import { track } from '../../../lib/analytics'
import { useEnrichmentConfirmations } from '../../../hooks/useEnrichmentConfirmations'
import { cn } from '../../../lib/utils'

interface EnrichmentReviewPanelProps {
  wine: Wine
  onApplied?: () => void
  onDismissed?: () => void
}

type LoadingState = {
  field: keyof AIEnrichment | 'all' | null
  action: 'apply' | 'dismiss' | null
}

type SuccessState = {
  field: keyof AIEnrichment | 'all' | null
  action: 'apply' | 'dismiss' | null
}

type ErrorState = {
  field: keyof AIEnrichment | 'all' | null
  action: 'apply' | 'dismiss' | null
  message: string
}

function EnrichmentReviewPanel({ wine, onApplied, onDismissed }: EnrichmentReviewPanelProps) {
  const [loading, setLoading] = useState<LoadingState>({ field: null, action: null })
  const [success, setSuccess] = useState<SuccessState>({ field: null, action: null })
  const [error, setError] = useState<ErrorState>({ field: null, action: null, message: '' })
  const [ariaLiveMessage, setAriaLiveMessage] = useState('')
  const [focusedField, setFocusedField] = useState<keyof AIEnrichment | null>(null)
  const fieldRefs = useRef<{ [key in keyof AIEnrichment]?: HTMLDivElement | null }>({})
  
  // Enhanced confirmation system
  const { confirmations, showConfirmation, reset } = useEnrichmentConfirmations()

  if (!wine.ai_enrichment) {
    return null
  }

  const enrichment = wine.ai_enrichment

  // Reset confirmations when wine changes
  useEffect(() => {
    reset()
    setFocusedField(null)
  }, [wine.id, reset])

  // Get available fields for keyboard navigation
  const availableFields = useMemo(() => {
    if (!enrichment) return []
    return (Object.keys(enrichment) as (keyof AIEnrichment)[]).filter(field => enrichment[field])
  }, [enrichment])

  // Auto-focus first field when panel loads
  useEffect(() => {
    if (availableFields.length > 0 && !focusedField) {
      setFocusedField(availableFields[0])
    }
  }, [availableFields, focusedField])

  // Move focus to next field after action
  const moveToNextField = useCallback(() => {
    if (!focusedField || availableFields.length <= 1) return
    
    const currentIndex = availableFields.indexOf(focusedField)
    const nextIndex = (currentIndex + 1) % availableFields.length
    setFocusedField(availableFields[nextIndex])
  }, [focusedField, availableFields])

  const handleApply = useCallback(async (field: keyof AIEnrichment, data: AIEnrichment[keyof AIEnrichment]) => {
    setLoading({ field, action: 'apply' })
    setError({ field: null, action: null, message: '' })
    try {
      switch (field) {
        case 'drink_window':
          const drinkWindow = data as AIEnrichment['drink_window']
          if (drinkWindow) {
            await applyDrinkWindow(wine.id, drinkWindow)
          }
          break
        case 'tasting_notes':
          const tastingNotes = data as AIEnrichment['tasting_notes']
          if (tastingNotes?.text) {
            await applyTastingNotes(wine.id, tastingNotes.text)
          }
          break
        case 'critic_scores':
          const criticScores = data as AIEnrichment['critic_scores']
          if (criticScores) {
            await applyCriticScores(wine.id, criticScores)
          }
          break
        case 'food_pairings':
          // Food pairings don't have a direct field to apply to, so we'll just dismiss
          await dismissAIField(wine.id, field)
          break
      }
      
      // Track successful apply action
      track('enrichment_apply', {
        wine_id: wine.id,
        field,
        confidence: wine.ai_confidence
      })
      
      setSuccess({ field, action: 'apply' })
      setAriaLiveMessage(`${field.replace('_', ' ')} applied`)
      
      // Show enhanced confirmation with checkmark and toast
      showConfirmation(field)
      
      // Move focus to next field after successful apply
      setTimeout(() => {
        moveToNextField()
      }, 100)
      
      // Clear success state after 2 seconds
      setTimeout(() => {
        setSuccess({ field: null, action: null })
        setAriaLiveMessage('')
      }, 2000)
      onApplied?.()
    } catch (error) {
      console.error(`Error applying ${field}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Apply failed'
      setError({ field, action: 'apply', message: errorMessage })
      setAriaLiveMessage(`Apply failed: ${errorMessage}`)
      setTimeout(() => {
        setError({ field: null, action: null, message: '' })
        setAriaLiveMessage('')
      }, 5000)
    } finally {
      setLoading({ field: null, action: null })
    }
  }, [wine.id, wine.ai_confidence, onApplied, showConfirmation, moveToNextField])

  const handleDismiss = useCallback(async (field: keyof AIEnrichment) => {
    setLoading({ field, action: 'dismiss' })
    setError({ field: null, action: null, message: '' })
    try {
      await dismissAIField(wine.id, field)
      
      // Track successful dismiss action
      track('enrichment_dismiss', {
        wine_id: wine.id,
        field,
        confidence: wine.ai_confidence
      })
      
      setSuccess({ field, action: 'dismiss' })
      setAriaLiveMessage(`${field.replace('_', ' ')} dismissed`)
      
      // Move focus to next field after successful dismiss
      setTimeout(() => {
        moveToNextField()
      }, 100)
      
      setTimeout(() => {
        setSuccess({ field: null, action: null })
        setAriaLiveMessage('')
      }, 2000)
      onDismissed?.()
    } catch (error) {
      console.error(`Error dismissing ${field}:`, error)
      const errorMessage = error instanceof Error ? error.message : 'Dismiss failed'
      setError({ field, action: 'dismiss', message: errorMessage })
      setAriaLiveMessage(`Dismiss failed: ${errorMessage}`)
      setTimeout(() => {
        setError({ field: null, action: null, message: '' })
        setAriaLiveMessage('')
      }, 5000)
    } finally {
      setLoading({ field: null, action: null })
    }
  }, [wine.id, wine.ai_confidence, onDismissed, moveToNextField])

  // Keyboard event handler for Enter/Esc shortcuts
  const handleKeyDown = useCallback((event: React.KeyboardEvent, field: keyof AIEnrichment, action: 'apply' | 'dismiss') => {
    if (event.key === 'Enter' && action === 'apply') {
      event.preventDefault()
      handleApply(field, enrichment[field])
    } else if (event.key === 'Escape' && action === 'dismiss') {
      event.preventDefault()
      handleDismiss(field)
    }
  }, [enrichment, handleApply, handleDismiss])

  // Global keyboard event handler for A/D shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      // Only handle A/D keys when the panel is focused or when no specific input is focused
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key.toLowerCase() === 'a' && focusedField) {
        event.preventDefault()
        handleApply(focusedField, enrichment[focusedField])
      } else if (event.key.toLowerCase() === 'd' && focusedField) {
        event.preventDefault()
        handleDismiss(focusedField)
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)
    return () => document.removeEventListener('keydown', handleGlobalKeyDown)
  }, [focusedField, enrichment, handleApply, handleDismiss])

  const handleDismissAll = useCallback(async () => {
    setLoading({ field: 'all', action: 'dismiss' })
    setError({ field: null, action: null, message: '' })
    try {
      await dismissAllAI(wine.id)
      
      // Track successful dismiss all action
      track('enrichment_dismiss_all', {
        wine_id: wine.id,
        confidence: wine.ai_confidence
      })
      
      setSuccess({ field: 'all', action: 'dismiss' })
      setAriaLiveMessage('All suggestions dismissed')
      setTimeout(() => {
        setSuccess({ field: null, action: null })
        setAriaLiveMessage('')
      }, 2000)
      onDismissed?.()
    } catch (error) {
      console.error('Error dismissing all AI:', error)
      const errorMessage = error instanceof Error ? error.message : 'Dismiss all failed'
      setError({ field: 'all', action: 'dismiss', message: errorMessage })
      setAriaLiveMessage(`Dismiss all failed: ${errorMessage}`)
      setTimeout(() => {
        setError({ field: null, action: null, message: '' })
        setAriaLiveMessage('')
      }, 5000)
    } finally {
      setLoading({ field: null, action: null })
    }
  }, [wine.id, wine.ai_confidence, onDismissed])

  const handleApplyAll = useCallback(async () => {
    setLoading({ field: 'all', action: 'apply' })
    setError({ field: null, action: null, message: '' })
    try {
      const fields = Object.keys(enrichment) as (keyof AIEnrichment)[]
      let appliedCount = 0
      
      for (const field of fields) {
        if (enrichment[field]) {
          try {
            switch (field) {
              case 'drink_window':
                await applyDrinkWindow(wine.id, enrichment[field])
                break
              case 'tasting_notes':
                const tastingNotes = enrichment[field] as AIEnrichment['tasting_notes']
                await applyTastingNotes(wine.id, tastingNotes?.text || '')
                break
              case 'critic_scores':
                await applyCriticScores(wine.id, enrichment[field])
                break
              case 'food_pairings':
                // Food pairings don't have a direct field to apply to, so we'll just dismiss
                await dismissAIField(wine.id, field)
                break
            }
            appliedCount++
          } catch (fieldError) {
            console.error(`Error applying ${field}:`, fieldError)
          }
        }
      }
      
      // Track successful apply all action
      track('enrichment_apply_all', {
        wine_id: wine.id,
        applied_count: appliedCount,
        confidence: wine.ai_confidence
      })
      
      setSuccess({ field: 'all', action: 'apply' })
      setAriaLiveMessage(`Applied ${appliedCount} suggestions`)
      setTimeout(() => {
        setSuccess({ field: null, action: null })
        setAriaLiveMessage('')
      }, 2000)
      onApplied?.()
    } catch (error) {
      console.error('Error applying all AI:', error)
      const errorMessage = error instanceof Error ? error.message : 'Apply all failed'
      setError({ field: 'all', action: 'apply', message: errorMessage })
      setAriaLiveMessage(`Apply all failed: ${errorMessage}`)
      setTimeout(() => {
        setError({ field: null, action: null, message: '' })
        setAriaLiveMessage('')
      }, 5000)
    } finally {
      setLoading({ field: null, action: null })
    }
  }, [wine.id, wine.ai_confidence, onApplied, enrichment])

  const getCurrentValue = useCallback((field: keyof AIEnrichment) => {
    switch (field) {
      case 'drink_window':
        return wine.drink_window_from && wine.drink_window_to 
          ? `${wine.drink_window_from}–${wine.drink_window_to}`
          : 'Not set'
      case 'tasting_notes':
        return wine.peyton_notes || 'Not set'
      case 'critic_scores':
        const scores = []
        if (wine.score_wine_spectator) scores.push(`WS: ${wine.score_wine_spectator}`)
        if (wine.score_james_suckling) scores.push(`JS: ${wine.score_james_suckling}`)
        return scores.length > 0 ? scores.join(', ') : 'Not set'
      case 'food_pairings':
        return 'No direct field' // Food pairings don't map to a specific field
      default:
        return 'Not set'
    }
  }, [wine.drink_window_from, wine.drink_window_to, wine.peyton_notes, wine.score_wine_spectator, wine.score_james_suckling])

  const getSuggestedValue = useCallback((field: keyof AIEnrichment) => {
    const data = enrichment[field]
    if (!data) return null

    switch (field) {
      case 'drink_window':
        const drinkWindow = data as AIEnrichment['drink_window']
        return drinkWindow ? `${drinkWindow.from}–${drinkWindow.to}` : null
      case 'tasting_notes':
        const tastingNotes = data as AIEnrichment['tasting_notes']
        return tastingNotes?.text || null
      case 'critic_scores':
        const criticScores = data as AIEnrichment['critic_scores']
        const scores = []
        if (criticScores?.wine_spectator) scores.push(`WS: ${criticScores.wine_spectator}`)
        if (criticScores?.james_suckling) scores.push(`JS: ${criticScores.james_suckling}`)
        return scores.length > 0 ? scores.join(', ') : null
      case 'food_pairings':
        const foodPairings = data as AIEnrichment['food_pairings']
        return foodPairings?.items.join(', ') || null
      default:
        return null
    }
  }, [enrichment])

  const getSources = (field: keyof AIEnrichment): string[] => {
    const data = enrichment[field]
    if (!data) return []
    
    switch (field) {
      case 'drink_window':
        return (data as AIEnrichment['drink_window'])?.source || []
      case 'tasting_notes':
        return (data as AIEnrichment['tasting_notes'])?.source || []
      case 'critic_scores':
        return (data as AIEnrichment['critic_scores'])?.source || []
      case 'food_pairings':
        return (data as AIEnrichment['food_pairings'])?.source || []
      default:
        return []
    }
  }

  const formatSources = (sources: string[]) => {
    if (sources.length === 0) return 'No sources available'
    if (sources.length === 1) return `Source: ${sources[0]}`
    return `Sources: ${sources.join(', ')}`
  }

  const getDiff = useCallback((field: keyof AIEnrichment) => {
    const currentValue = getCurrentValue(field)
    const suggestedValue = getSuggestedValue(field)
    
    if (!suggestedValue) return null
    
    return generateDiff(field, currentValue, suggestedValue)
  }, [getCurrentValue, getSuggestedValue])

  const isFieldLoading = (field: keyof AIEnrichment) => 
    loading.field === field && loading.action !== null

  const isFieldSuccess = (field: keyof AIEnrichment | 'all') => 
    success.field === field && success.action !== null

  const isFieldError = (field: keyof AIEnrichment | 'all') => 
    error.field === field && error.action !== null

  // Memoize field values to avoid recomputing on every render
  const fieldValues = useMemo(() => ({
    drink_window: {
      current: getCurrentValue('drink_window'),
      suggested: getSuggestedValue('drink_window')
    },
    tasting_notes: {
      current: getCurrentValue('tasting_notes'),
      suggested: getSuggestedValue('tasting_notes')
    },
    critic_scores: {
      current: getCurrentValue('critic_scores'),
      suggested: getSuggestedValue('critic_scores')
    },
    food_pairings: {
      current: getCurrentValue('food_pairings'),
      suggested: getSuggestedValue('food_pairings')
    }
  }), [getCurrentValue, getSuggestedValue])

  const SourceTooltip = ({ field }: { field: keyof AIEnrichment }) => {
    const sources = getSources(field)
    if (sources.length === 0) return null

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-4 h-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label={`View sources for ${field}: ${formatSources(sources)}`}
          >
            <Info className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-xs">{formatSources(sources)}</p>
        </TooltipContent>
      </Tooltip>
    )
  }

  const FieldCard = ({ field, title, currentValue, suggestedValue }: {
    field: keyof AIEnrichment
    title: string
    currentValue: string
    suggestedValue: string | null
  }) => {
    if (!suggestedValue) return null

    const isShowingConfirmation = confirmations.field === field && confirmations.isVisible
    const isFocused = focusedField === field

    const handleCardClick = () => {
      setFocusedField(field)
    }

    return (
      <div 
        ref={(el) => { fieldRefs.current[field] = el }}
        className={cn(
          "border rounded-lg p-4 space-y-3 bg-white motion-safe:transition-[box-shadow,transform] motion-safe:duration-300 motion-reduce:transition-none cursor-pointer",
          isShowingConfirmation 
            ? "border-green-300 bg-green-50 shadow-md" 
            : isFocused
            ? "border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200"
            : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
        )}
        role="region"
        aria-labelledby={`${field}-title`}
        onClick={handleCardClick}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setFocusedField(field)
          }
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Label id={`${field}-title`} className="text-sm font-medium text-neutral-900">{title}</Label>
              <SourceTooltip field={field} />
              {isFocused && (
                <div className="flex items-center gap-1 text-blue-600 text-xs font-medium">
                  <span>Press A to accept, D to dismiss</span>
                </div>
              )}
              {isShowingConfirmation && (
                <div className="flex items-center gap-1 text-green-600 animate-in fade-in-0 zoom-in-95 duration-200">
                  <Check className="h-4 w-4" />
                  <span className="text-xs font-medium">Applied</span>
                </div>
              )}
            </div>
            
            {/* Current → Suggested format */}
            <div className="space-y-2">
              {/* Current value - only show if different from suggested */}
              {currentValue !== suggestedValue && currentValue && (
                <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded border">
                  <span className="font-medium text-neutral-700">Current:</span> {currentValue}
                </div>
              )}
              
              {/* Arrow indicator */}
              {currentValue !== suggestedValue && currentValue && (
                <div className="flex items-center justify-center text-neutral-400">
                  <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center">
                    <span className="text-xs">→</span>
                  </div>
                </div>
              )}
              
              {/* Suggested value with diff highlighting */}
              <div className="text-sm text-neutral-900 bg-blue-50 p-3 rounded border border-blue-200">
                <span className="font-medium text-blue-700">Suggested:</span>{' '}
                <span dangerouslySetInnerHTML={{ __html: getDiff(field)?.html || suggestedValue }} />
              </div>
            </div>
            
            {isFieldError(field) && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded mt-2">
                {error.message}
              </div>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex flex-col gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleApply(field, enrichment[field])}
              onKeyDown={(e) => handleKeyDown(e, field, 'apply')}
              disabled={isFieldLoading(field)}
              className={isFieldError(field) && error.action === 'apply' ? 'border-red-300 text-red-600' : ''}
              aria-label={`Apply ${title} suggestion`}
            >
              {isFieldLoading(field) && loading.action === 'apply' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isFieldSuccess(field) && success.action === 'apply' ? (
                <Check className="h-3 w-3" />
              ) : isFieldError(field) && error.action === 'apply' ? (
                <X className="h-3 w-3" />
              ) : (
                'Apply'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDismiss(field)}
              onKeyDown={(e) => handleKeyDown(e, field, 'dismiss')}
              disabled={isFieldLoading(field)}
              className={isFieldError(field) && error.action === 'dismiss' ? 'text-red-600' : ''}
              aria-label={`Dismiss ${title} suggestion`}
            >
              {isFieldLoading(field) && loading.action === 'dismiss' ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : isFieldSuccess(field) && success.action === 'dismiss' ? (
                <Check className="h-3 w-3" />
              ) : isFieldError(field) && error.action === 'dismiss' ? (
                <X className="h-3 w-3" />
              ) : (
                'Dismiss'
              )}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Aria-live region for screen reader announcements */}
        <div 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        >
          {ariaLiveMessage}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="primary"
              onClick={handleApplyAll}
              disabled={loading.field === 'all'}
              className={isFieldError('all') && error.action === 'apply' ? 'border-red-300 text-red-600' : ''}
            >
              {loading.field === 'all' && loading.action === 'apply' ? (
                <Loader2 className="h-3 w-3 animate-spin mr-2" />
              ) : isFieldSuccess('all') && success.action === 'apply' ? (
                <Check className="h-3 w-3 text-green-600 mr-2" />
              ) : isFieldError('all') && error.action === 'apply' ? (
                <X className="h-3 w-3 text-red-600 mr-2" />
              ) : null}
              Apply All
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDismissAll}
            disabled={loading.field === 'all'}
            className={isFieldError('all') && error.action === 'dismiss' ? 'border-red-300 text-red-600' : ''}
          >
            {loading.field === 'all' && loading.action === 'dismiss' ? (
              <Loader2 className="h-3 w-3 animate-spin mr-2" />
            ) : isFieldSuccess('all') && success.action === 'dismiss' ? (
              <Check className="h-3 w-3 text-green-600 mr-2" />
            ) : isFieldError('all') && error.action === 'dismiss' ? (
              <X className="h-3 w-3 text-red-600 mr-2" />
            ) : null}
            Dismiss All
          </Button>
        </div>

        {isFieldError('all') && (
          <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
            {error.message}
          </div>
        )}

        <div className="space-y-3">
          <FieldCard
            field="drink_window"
            title="Drink Window"
            currentValue={fieldValues.drink_window.current}
            suggestedValue={fieldValues.drink_window.suggested}
          />

          <FieldCard
            field="tasting_notes"
            title="Tasting Notes"
            currentValue={fieldValues.tasting_notes.current}
            suggestedValue={fieldValues.tasting_notes.suggested}
          />

          <FieldCard
            field="critic_scores"
            title="Critic Scores"
            currentValue={fieldValues.critic_scores.current}
            suggestedValue={fieldValues.critic_scores.suggested}
          />

          <FieldCard
            field="food_pairings"
            title="Food Pairings"
            currentValue={fieldValues.food_pairings.current}
            suggestedValue={fieldValues.food_pairings.suggested}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}

export default memo(EnrichmentReviewPanel)
