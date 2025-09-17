import React from 'react'
import { cn } from '../lib/utils'
import { DepthPosition } from '../types'

interface DepthToggleProps {
  value: DepthPosition
  onChange: (value: DepthPosition) => void
  frontOccupied?: boolean
  backOccupied?: boolean
  className?: string
}

export function DepthToggle({ 
  value, 
  onChange, 
  frontOccupied = false, 
  backOccupied = false,
  className = '' 
}: DepthToggleProps) {
  return (
    <div className={cn("inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50", className)}>
      <button
        onClick={() => onChange(DepthPosition.FRONT)}
        disabled={frontOccupied}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          value === DepthPosition.FRONT
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
          frontOccupied && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={`Front position${frontOccupied ? ' (occupied)' : ''}`}
      >
        Front
      </button>
      <button
        onClick={() => onChange(DepthPosition.BACK)}
        disabled={backOccupied}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-w-[44px] min-h-[40px] sm:min-w-[40px] sm:min-h-[40px]',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
          value === DepthPosition.BACK
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700',
          backOccupied && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={`Back position${backOccupied ? ' (occupied)' : ''}`}
      >
        Back
      </button>
    </div>
  )
}
