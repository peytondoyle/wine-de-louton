import React, { useState } from 'react'
import { cn } from '../../lib/utils'
import { DepthPosition } from '../../types'

export interface PlacementValue {
  shelf: number
  column_position: number
  depth: DepthPosition
}

interface CellarPlacementPickerProps {
  shelves: number
  columns: number
  value?: PlacementValue | null
  onChange: (value: PlacementValue | null) => void
  occupied: Set<string>
}

export function CellarPlacementPicker({
  shelves,
  columns,
  value,
  onChange,
  occupied
}: CellarPlacementPickerProps) {
  const [depth, setDepth] = useState<DepthPosition>(DepthPosition.FRONT)

  const handleSlotClick = (shelf: number, column: number) => {
    const key = `${shelf}:${column}:${depth}`
    
    // If this slot is occupied, don't allow selection
    if (occupied.has(key)) {
      return
    }

    const newValue: PlacementValue = {
      shelf,
      column_position: column,
      depth
    }

    // If clicking the same slot, deselect it
    if (value && 
        value.shelf === shelf && 
        value.column_position === column && 
        value.depth === depth) {
      onChange(null)
    } else {
      onChange(newValue)
    }
  }

  const isSlotSelected = (shelf: number, column: number) => {
    return value?.shelf === shelf && 
           value?.column_position === column && 
           value?.depth === depth
  }

  const isSlotOccupied = (shelf: number, column: number) => {
    const key = `${shelf}:${column}:${depth}`
    return occupied.has(key)
  }

  return (
    <div className="space-y-4">
      {/* Depth Toggle */}
      <div className="flex items-center justify-center">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            onClick={() => setDepth(DepthPosition.FRONT)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              depth === DepthPosition.FRONT
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Front
          </button>
          <button
            onClick={() => setDepth(DepthPosition.BACK)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-md transition-colors min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px]',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
              depth === DepthPosition.BACK
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            )}
          >
            Back
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: shelves }, (_, shelfIndex) => 
          Array.from({ length: columns }, (_, columnIndex) => {
            const shelf = shelfIndex + 1
            const column = columnIndex + 1
            const isSelected = isSlotSelected(shelf, column)
            const isOccupied = isSlotOccupied(shelf, column)
            
            return (
              <button
                key={`${shelf}:${column}`}
                onClick={() => handleSlotClick(shelf, column)}
                disabled={isOccupied}
                className={cn(
                  'aspect-square min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] rounded-md border text-xs font-medium transition-colors',
                  'hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  isSelected && 'bg-blue-100 border-blue-500 text-blue-900 ring-2 ring-blue-500',
                  !isSelected && !isOccupied && 'border-gray-200 text-gray-700 hover:border-gray-300',
                  isOccupied && 'border-red-200 bg-red-50 text-red-500 cursor-not-allowed'
                )}
                aria-label={`Shelf ${shelf}, Column ${column}, ${depth} - ${isOccupied ? 'Occupied' : isSelected ? 'Selected' : 'Available'}`}
              >
                <div className="flex flex-col items-center justify-center h-full">
                  <span className="text-xs font-medium">{shelf}</span>
                  <span className="text-xs opacity-75">{column}</span>
                </div>
              </button>
            )
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border border-gray-200 bg-white"></div>
          <span>Available</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border border-blue-500 bg-blue-100"></div>
          <span>Selected</span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 rounded border border-red-200 bg-red-50"></div>
          <span>Occupied</span>
        </div>
      </div>

      {/* Current Selection Display */}
      {value && (
        <div className="text-center text-sm text-gray-600">
          Selected: Shelf {value.shelf}, Column {value.column_position}, {value.depth}
        </div>
      )}
    </div>
  )
}