import React from 'react'
import { AlertTriangle, X, Check } from 'lucide-react'
import { Button } from './ui/Button'
import { FridgeLayout } from '../types'

interface LayoutChangeBannerProps {
  currentLayout: FridgeLayout | null
  localStorageLayout: FridgeLayout | null
  onUseLayout: () => void
  onDismiss: () => void
  className?: string
}

export function LayoutChangeBanner({
  currentLayout,
  localStorageLayout,
  onUseLayout,
  onDismiss,
  className = ''
}: LayoutChangeBannerProps) {
  // Don't show banner if layouts match or if localStorage layout is null
  if (!currentLayout || !localStorageLayout || currentLayout.id === localStorageLayout.id) {
    return null
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-amber-800 mb-1">
            Layout Mismatch Detected
          </h3>
          <p className="text-sm text-amber-700 mb-3">
            The current layout ({currentLayout.name}) differs from your saved preference ({localStorageLayout.name}). 
            Would you like to use the current layout or keep your saved preference?
          </p>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onUseLayout}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Check className="h-3 w-3 mr-1" />
              Use Current Layout
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="text-amber-700 hover:text-amber-800"
            >
              <X className="h-3 w-3 mr-1" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
