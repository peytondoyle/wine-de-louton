import React, { useState, useMemo } from 'react'
import { X, Check, XCircle, Sparkles, Loader2, AlertTriangle } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Card } from './ui/Card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Label } from './ui/Label'
import { 
  AISuggestionsPanelProps, 
  FieldComparison, 
  getConfidenceLevel, 
  getConfidenceColor,
  AIFieldSuggestion,
  FieldKey
} from '../types/enrichment'

export function AISuggestionsPanel({
  wine,
  suggestions,
  onApply,
  onSkip,
  onApplyAllSafe,
  onClose,
  isLoading = false,
  error = null
}: AISuggestionsPanelProps) {
  const [appliedFields, setAppliedFields] = useState<Set<FieldKey>>(new Set())
  const [skippedFields, setSkippedFields] = useState<Set<FieldKey>>(new Set())
  const [isApplying, setIsApplying] = useState<Set<FieldKey>>(new Set())
  const [isApplyingAll, setIsApplyingAll] = useState(false)

  // Convert suggestions to field comparisons
  const fieldComparisons = useMemo((): FieldComparison[] => {
    return suggestions
      .filter((suggestion): suggestion is Extract<AIFieldSuggestion, { kind: 'present' | 'missing' }> => 
        suggestion.kind !== 'skip'
      )
      .map(suggestion => ({
        key: suggestion.key,
        currentValue: suggestion.current,
        suggestedValue: suggestion.suggestion,
        confidence: suggestion.confidence,
        source: suggestion.source,
        isApplied: appliedFields.has(suggestion.key),
        isSkipped: skippedFields.has(suggestion.key),
        canApply: !appliedFields.has(suggestion.key) && !skippedFields.has(suggestion.key)
      }))
  }, [suggestions, appliedFields, skippedFields])

  // Count safe suggestions (confidence >= 0.75)
  const safeSuggestions = fieldComparisons.filter(fc => fc.confidence >= 0.75 && fc.canApply)
  const hasSafeSuggestions = safeSuggestions.length > 0

  const handleApply = async (fieldKey: FieldKey, suggestion: AIFieldSuggestion) => {
    setIsApplying(prev => new Set(prev).add(fieldKey))
    try {
      await onApply(fieldKey, suggestion)
      setAppliedFields(prev => new Set(prev).add(fieldKey))
    } catch (error) {
      console.error('Failed to apply suggestion:', error)
    } finally {
      setIsApplying(prev => {
        const newSet = new Set(prev)
        newSet.delete(fieldKey)
        return newSet
      })
    }
  }

  const handleSkip = (fieldKey: FieldKey) => {
    setSkippedFields(prev => new Set(prev).add(fieldKey))
    onSkip(fieldKey)
  }

  const handleApplyAllSafe = async () => {
    setIsApplyingAll(true)
    try {
      await onApplyAllSafe()
      // Mark all safe suggestions as applied
      const safeFieldKeys = safeSuggestions.map(fc => fc.key)
      setAppliedFields(prev => new Set([...prev, ...safeFieldKeys]))
    } catch (error) {
      console.error('Failed to apply all safe suggestions:', error)
    } finally {
      setIsApplyingAll(false)
    }
  }

  const getFieldDisplayName = (key: FieldKey): string => {
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

  const formatValue = (value: string | number | null): string => {
    if (value === null) return 'Not set'
    if (typeof value === 'number') return value.toString()
    return value
  }

  const getCurrentValue = (key: FieldKey): string | number | null => {
    switch (key) {
      case 'producer': return wine.producer
      case 'wineName': return wine.wine_name || null
      case 'vintage': return wine.vintage || null
      case 'region': return wine.region || null
      case 'varietal': return wine.varietals?.join(', ') || null
      case 'sizeMl': return wine.bottle_size || null
      case 'notes': return wine.peyton_notes || null
      case 'drink_window_from': return wine.drink_window_from || null
      case 'drink_window_to': return wine.drink_window_to || null
      case 'tasting_notes': return wine.ai_enrichment?.tasting_notes?.text || null
      case 'score_wine_spectator': return wine.score_wine_spectator || null
      case 'score_james_suckling': return wine.score_james_suckling || null
      case 'food_pairings': return wine.ai_enrichment?.food_pairings?.items?.join(', ') || null
      default: return null
    }
  }

  if (isLoading) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-muted-foreground">Analyzing wine data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (error) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-4 text-red-500" />
              <p className="text-red-600 mb-2">Failed to load suggestions</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (fieldComparisons.length === 0) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Sparkles className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No suggestions available</p>
              <p className="text-sm text-muted-foreground">All fields appear to be complete or no AI data is available.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AI Suggestions
              <Badge variant="secondary" className="ml-2">
                {fieldComparisons.length}
              </Badge>
            </div>
            {hasSafeSuggestions && (
              <Button
                onClick={handleApplyAllSafe}
                disabled={isApplyingAll}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isApplyingAll ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                Apply All Safe ({safeSuggestions.length})
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto space-y-4 pr-2">
          {fieldComparisons.map((comparison) => {
            const confidenceLevel = getConfidenceLevel(comparison.confidence)
            const confidenceColor = getConfidenceColor(confidenceLevel)
            const currentValue = getCurrentValue(comparison.key)
            const isCurrentlyApplying = isApplying.has(comparison.key)

            return (
              <Card key={comparison.key} className="p-4">
                <div className="space-y-4">
                  {/* Field Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-lg">
                      {getFieldDisplayName(comparison.key)}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Badge className={confidenceColor}>
                        {Math.round(comparison.confidence * 100)}% confidence
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {comparison.source}
                      </Badge>
                    </div>
                  </div>

                  {/* Current vs Suggested Values */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Current Value */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                        Current Value
                      </Label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <p className="text-sm">
                          {formatValue(currentValue)}
                        </p>
                      </div>
                    </div>

                    {/* Suggested Value */}
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground mb-2 block">
                        AI Suggestion
                      </Label>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm font-medium text-blue-900">
                          {formatValue(comparison.suggestedValue)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {comparison.isApplied ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        Applied
                      </Badge>
                    ) : comparison.isSkipped ? (
                      <Badge className="bg-gray-100 text-gray-700 border-gray-200">
                        <XCircle className="h-3 w-3 mr-1" />
                        Skipped
                      </Badge>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApply(comparison.key, suggestions.find(s => s.key === comparison.key)!)}
                          disabled={isCurrentlyApplying}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isCurrentlyApplying ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Check className="h-3 w-3 mr-1" />
                          )}
                          Apply
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSkip(comparison.key)}
                          className="text-gray-600 hover:text-gray-700"
                        >
                          <X className="h-3 w-3 mr-1" />
                          Skip
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}
