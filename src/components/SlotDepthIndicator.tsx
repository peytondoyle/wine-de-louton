import React from 'react'
import { cn } from '../lib/utils'
import { DepthPosition } from '../types'

interface SlotDepthIndicatorProps {
  frontOccupied: boolean
  backOccupied: boolean
  className?: string
}

export function SlotDepthIndicator({ 
  frontOccupied, 
  backOccupied, 
  className = '' 
}: SlotDepthIndicatorProps) {
  return (
    <div className={cn("flex gap-0.5 items-center", className)}>
      {/* Front dot (left) */}
      <div 
        className={cn(
          "w-1.5 h-1.5 rounded-full transition-colors border",
          frontOccupied 
            ? "bg-green-600 border-green-700" 
            : "bg-gray-200 border-gray-300"
        )}
        aria-label={frontOccupied ? "Front occupied" : "Front available"}
        title={frontOccupied ? "Front occupied" : "Front available"}
      />
      {/* Back dot (right) */}
      <div 
        className={cn(
          "w-1.5 h-1.5 rounded-full transition-colors border",
          backOccupied 
            ? "bg-green-600 border-green-700" 
            : "bg-gray-200 border-gray-300"
        )}
        aria-label={backOccupied ? "Back occupied" : "Back available"}
        title={backOccupied ? "Back occupied" : "Back available"}
      />
    </div>
  )
}
