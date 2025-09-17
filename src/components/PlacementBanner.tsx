import React from 'react'
import { Button } from './ui/Button'
import { X, Check, RotateCcw } from 'lucide-react'
import { cn } from '../lib/utils'
import { DepthPosition } from '../types'

interface PlacementBannerProps {
  shelf: number
  column: number
  depth: DepthPosition
  onConfirm: () => void
  onChange: () => void
  onDismiss: () => void
  className?: string
}

export function PlacementBanner({
  shelf,
  column,
  depth,
  onConfirm,
  onChange,
  onDismiss,
  className = ''
}: PlacementBannerProps) {
  const depthText = depth === DepthPosition.FRONT ? 'Front' : 'Back'

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg shadow-lg p-4",
      "flex items-center justify-between gap-3",
      "animate-in slide-in-from-bottom-2 duration-200",
      className
    )}>
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          Place selected bottle in R{shelf}C{column} ({depthText})
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={onChange}
          className="h-8 px-3 text-xs"
        >
          <RotateCcw className="h-3 w-3 mr-1" />
          Change
        </Button>
        
        <Button
          size="sm"
          onClick={onConfirm}
          className="h-8 px-3 text-xs"
        >
          <Check className="h-3 w-3 mr-1" />
          Confirm
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={onDismiss}
          className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}
