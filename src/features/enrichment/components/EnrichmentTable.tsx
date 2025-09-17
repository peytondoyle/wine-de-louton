import React, { useState } from 'react'
import { Check, X, Loader2, Sparkles, Brain } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import type { AIEnrichment, AIFieldSuggestion, ApplicableFieldKey } from '../../../types/enrichment'

interface EnrichmentTableProps {
  data: AIEnrichment
  onApply: (key: ApplicableFieldKey, value: string | number) => Promise<void>
  onApplyAll?: () => Promise<void>
  loading?: boolean
}

// Helper to get field display name
function getFieldDisplayName(key: ApplicableFieldKey): string {
  const names: Record<ApplicableFieldKey, string> = {
    producer: 'Producer',
    wineName: 'Wine Name',
    vintage: 'Vintage',
    region: 'Region',
    varietal: 'Varietal',
    sizeMl: 'Size (mL)',
    notes: 'Notes',
    drink_window_from: 'Drink Window From',
    drink_window_to: 'Drink Window To',
    tasting_notes: 'Tasting Notes',
    score_wine_spectator: 'Wine Spectator Score',
    score_james_suckling: 'James Suckling Score',
    food_pairings: 'Food Pairings'
  }
  return names[key]
}

// Helper to get source icon
function getSourceIcon(source: 'openai' | 'heuristic') {
  return source === 'openai' ? <Sparkles className="h-3 w-3" /> : <Brain className="h-3 w-3" />
}

// Helper to get confidence color
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-100 text-green-800 border-green-200'
  if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

export function EnrichmentTable({
  data,
  onApply,
  onApplyAll,
  loading = false
}: EnrichmentTableProps) {
  const [applyingFields, setApplyingFields] = useState<Set<ApplicableFieldKey>>(new Set())
  const [applyingAll, setApplyingAll] = useState(false)

  // Filter out skipped fields
  const applicableFields = data.fields.filter(
    (field): field is Extract<AIFieldSuggestion, { kind: 'present' | 'missing' }> => 
      field.kind !== 'skip'
  )

  const handleApply = async (key: ApplicableFieldKey, value: string | number) => {
    setApplyingFields(prev => new Set(prev).add(key))
    try {
      await onApply(key, value)
    } finally {
      setApplyingFields(prev => {
        const newSet = new Set(prev)
        newSet.delete(key)
        return newSet
      })
    }
  }

  const handleApplyAll = async () => {
    if (!onApplyAll) return
    
    setApplyingAll(true)
    try {
      await onApplyAll()
    } finally {
      setApplyingAll(false)
    }
  }

  if (applicableFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-muted p-6 text-center">
        <Sparkles className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">No AI suggestions available</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">AI Suggestions</h3>
          <Badge variant="outline" className="text-xs">
            {applicableFields.length} suggestions
          </Badge>
        </div>
        
        {onApplyAll && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyAll}
            disabled={applyingAll || loading}
            className="text-xs"
          >
            {applyingAll ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Applying...
              </>
            ) : (
              'Apply All'
            )}
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-3">Field</div>
            <div className="col-span-3">Current</div>
            <div className="col-span-3">Suggestion</div>
            <div className="col-span-2">Confidence</div>
            <div className="col-span-1">Action</div>
          </div>
        </div>
        
        <div className="divide-y">
          {applicableFields.map((field, idx) => {
            const isApplying = applyingFields.has(field.key)
            const isDisabled = isApplying || loading
            
            return (
              <div key={idx} className="px-4 py-3 text-sm">
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Field Name */}
                  <div className="col-span-3">
                    <div className="font-medium">
                      {getFieldDisplayName(field.key)}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      {getSourceIcon(field.source)}
                      <span className="text-xs text-muted-foreground">
                        {field.source === 'openai' ? 'AI' : 'Heuristic'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Current Value */}
                  <div className="col-span-3">
                    <div className="text-muted-foreground">
                      {field.current === null ? (
                        <span className="italic text-muted-foreground/60">Missing</span>
                      ) : (
                        String(field.current)
                      )}
                    </div>
                  </div>
                  
                  {/* Suggestion */}
                  <div className="col-span-3">
                    <div className="font-medium">
                      {String(field.suggestion)}
                    </div>
                  </div>
                  
                  {/* Confidence */}
                  <div className="col-span-2">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getConfidenceColor(field.confidence)}`}
                    >
                      {Math.round(field.confidence * 100)}%
                    </Badge>
                  </div>
                  
                  {/* Action Button */}
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApply(field.key, field.suggestion)}
                      disabled={isDisabled}
                      className="h-8 w-16 text-xs"
                      aria-label={`Apply ${getFieldDisplayName(field.key)} suggestion`}
                    >
                      {isApplying ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Check className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="text-xs text-muted-foreground">
        {applicableFields.filter(f => f.kind === 'missing').length} missing fields, {' '}
        {applicableFields.filter(f => f.kind === 'present').length} improvements available
      </div>
    </div>
  )
}
