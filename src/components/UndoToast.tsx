import React from 'react'
import { Undo, X } from 'lucide-react'
import { Button } from './ui/Button'
import { getFieldDisplayName, formatValueForDisplay } from '../types/undo'

interface UndoToastProps {
  field: string
  fromValue: any
  toValue: any
  onUndo: () => void
  onDismiss: () => void
  className?: string
}

export function UndoToast({ 
  field, 
  fromValue, 
  toValue, 
  onUndo, 
  onDismiss, 
  className = '' 
}: UndoToastProps) {
  const fieldName = getFieldDisplayName(field)
  const fromDisplay = formatValueForDisplay(fromValue)
  const toDisplay = formatValueForDisplay(toValue)

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Undo className="h-4 w-4 text-blue-600" />
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-900 mb-1">
            {fieldName} updated
          </div>
          <div className="text-xs text-gray-600 mb-2">
            Changed from "{fromDisplay}" to "{toDisplay}"
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={onUndo}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1"
            >
              <Undo className="h-3 w-3 mr-1" />
              Undo
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onDismiss}
              className="text-gray-600 hover:text-gray-700 text-xs px-3 py-1"
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
