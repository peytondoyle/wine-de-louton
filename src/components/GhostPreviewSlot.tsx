import React from 'react'
import { Check, X, Move } from 'lucide-react'
import { Button } from './ui/Button'
import { DepthPosition } from '../types'

interface GhostPreviewSlotProps {
  wineId: string
  wineName: string
  slot: { shelf: number; column: number; depth: DepthPosition }
  onConfirm: () => void
  onCancel: () => void
  isVisible: boolean
  className?: string
}

export function GhostPreviewSlot({
  wineId,
  wineName,
  slot,
  onConfirm,
  onCancel,
  isVisible,
  className = ''
}: GhostPreviewSlotProps) {
  if (!isVisible) return null

  const depthText = slot.depth === 1 ? 'Front' : 'Back'
  const slotLabel = `S${slot.shelf} · C${slot.column} · ${depthText}`

  return (
    <div className={`absolute inset-0 z-20 ${className}`}>
      {/* Ghost overlay */}
      <div className="absolute inset-0 bg-blue-100/80 border-2 border-blue-400 border-dashed rounded-lg flex items-center justify-center">
        <div className="text-center">
          <Move className="h-6 w-6 text-blue-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-blue-800 mb-1">
            {wineName}
          </p>
          <p className="text-xs text-blue-600 mb-3">
            {slotLabel}
          </p>
          
          {/* Action buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              onClick={onConfirm}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
            >
              <Check className="h-3 w-3 mr-1" />
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onCancel}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1"
            >
              <X className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
