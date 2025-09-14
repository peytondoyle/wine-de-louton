import React from 'react'
import { cn } from '../lib/utils'

interface ConfidenceBadgeProps {
  confidence: number
  className?: string
}

export function ConfidenceBadge({ confidence, className }: ConfidenceBadgeProps) {
  // Clamp confidence to 0-1 range
  const clampedConfidence = Math.max(0, Math.min(1, confidence))
  
  // Determine label based on confidence thresholds
  const getLabel = (conf: number): string => {
    if (conf < 0.3) return 'Low'
    if (conf < 0.7) return 'Medium'
    return 'High'
  }
  
  // Calculate how many blocks should be filled (0-5)
  const filledBlocks = Math.round(clampedConfidence * 5)
  
  // Generate block elements
  const blocks = Array.from({ length: 5 }, (_, index) => {
    const isFilled = index < filledBlocks
    return (
      <div
        key={index}
        className={cn(
          'h-2 w-2 rounded-sm transition-colors duration-200',
          isFilled
            ? 'bg-green-500'
            : 'bg-neutral-200'
        )}
      />
    )
  })
  
  const label = getLabel(clampedConfidence)
  const percentage = Math.round(clampedConfidence * 100)
  
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-2 px-2 py-1 rounded-md bg-neutral-50 border border-neutral-200',
        className
      )}
      role="img"
      aria-label={`Confidence level: ${label} (${percentage}%)`}
    >
      <div className="flex gap-0.5">
        {blocks}
      </div>
      <span className="text-xs font-medium text-neutral-700">
        {label}
      </span>
    </div>
  )
}
