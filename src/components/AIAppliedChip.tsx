import React from 'react'
import { Sparkles, Clock } from 'lucide-react'
import { Badge } from './ui/Badge'
import { FieldProvenance } from '../types/enrichment'
import { formatDistanceToNow } from 'date-fns'

interface AIAppliedChipProps {
  provenance: FieldProvenance
  className?: string
}

export function AIAppliedChip({ provenance, className = '' }: AIAppliedChipProps) {
  if (!provenance.lastAppliedFromAI) {
    return null
  }

  const appliedAt = new Date(provenance.appliedAt)
  const timeAgo = formatDistanceToNow(appliedAt, { addSuffix: true })

  return (
    <Badge 
      variant="outline" 
      className={`text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 ${className}`}
      title={`Applied from AI ${timeAgo}${provenance.appliedConfidence ? ` (${Math.round(provenance.appliedConfidence * 100)}% confidence)` : ''}`}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      AI-applied
      <Clock className="h-3 w-3 ml-1" />
    </Badge>
  )
}
