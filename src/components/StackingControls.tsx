import React from 'react'
import { Layers, Layers3 } from 'lucide-react'
import { Button } from './ui/Button'

interface StackingControlsProps {
  stackingEnabled: boolean
  onToggleStacking: (enabled: boolean) => void
  className?: string
}

export function StackingControls({ 
  stackingEnabled, 
  onToggleStacking, 
  className = '' 
}: StackingControlsProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="text-sm text-gray-600">Stacking:</span>
      <Button
        variant={stackingEnabled ? "primary" : "outline"}
        size="sm"
        onClick={() => onToggleStacking(!stackingEnabled)}
        className="flex items-center gap-2"
        title={stackingEnabled ? "Disable stacking" : "Enable stacking"}
      >
        {stackingEnabled ? (
          <Layers3 className="h-4 w-4" />
        ) : (
          <Layers className="h-4 w-4" />
        )}
        {stackingEnabled ? 'Enabled' : 'Disabled'}
      </Button>
      
      <div className="text-xs text-gray-500">
        {stackingEnabled 
          ? 'Multiple wines per slot allowed' 
          : 'One wine per slot only'
        }
      </div>
    </div>
  )
}
