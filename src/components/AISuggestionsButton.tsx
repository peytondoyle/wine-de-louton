import React from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { AIFieldSuggestion } from '../types/enrichment'

interface AISuggestionsButtonProps {
  suggestions: AIFieldSuggestion[]
  isLoading?: boolean
  onClick: () => void
  className?: string
}

export function AISuggestionsButton({ 
  suggestions, 
  isLoading = false, 
  onClick, 
  className = '' 
}: AISuggestionsButtonProps) {
  // Count pending suggestions (not skipped)
  const pendingCount = suggestions.filter(s => s.kind !== 'skip').length
  
  // Count high-confidence suggestions for "Apply All (safe)"
  const safeCount = suggestions.filter(s => 
    s.kind !== 'skip' && s.confidence >= 0.75
  ).length

  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={isLoading || pendingCount === 0}
      className={`relative ${className}`}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4 mr-2" />
      )}
      AI Suggestions
      
      {pendingCount > 0 && (
        <Badge 
          variant="secondary" 
          className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-200"
        >
          {pendingCount}
        </Badge>
      )}
      
      {safeCount > 0 && (
        <Badge 
          variant="outline" 
          className="ml-1 bg-green-50 text-green-700 border-green-200"
          title={`${safeCount} high-confidence suggestions available`}
        >
          {safeCount} safe
        </Badge>
      )}
    </Button>
  )
}
