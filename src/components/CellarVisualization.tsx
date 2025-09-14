import React, { useState, useEffect } from 'react'
import { FridgeOccupancy, OccupancySlot, DepthPosition } from '../types'
import { LocationChip } from './LocationChip'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { getFridgeOccupancy } from '../features/cellar/data/cellar'

interface CellarVisualizationProps {
  fridgeId: string
  onSlotClick?: (slot: OccupancySlot) => void
  onWineClick?: (wineId: string) => void
  className?: string
}

export function CellarVisualization({ 
  fridgeId, 
  onSlotClick, 
  onWineClick,
  className = ''
}: CellarVisualizationProps) {
  const [occupancy, setOccupancy] = useState<FridgeOccupancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOccupancy = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFridgeOccupancy(fridgeId)
      setOccupancy(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load cellar data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOccupancy()
  }, [fridgeId])

  if (loading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-gray-500">Loading cellar...</div>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="text-sm text-red-600 mb-2">Error loading cellar</div>
          <div className="text-xs text-gray-500 mb-4">{error}</div>
          <Button onClick={loadOccupancy} size="sm">
            Retry
          </Button>
        </div>
      </Card>
    )
  }

  if (!occupancy) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className="text-center text-sm text-gray-500">
          No cellar data available
        </div>
      </Card>
    )
  }

  const { layout, slots, total_slots, occupied_slots, occupancy_percentage } = occupancy

  // Group slots by shelf for display
  const slotsByShelf = slots.reduce((acc, slot) => {
    if (!acc[slot.shelf]) {
      acc[slot.shelf] = []
    }
    acc[slot.shelf].push(slot)
    return acc
  }, {} as Record<number, OccupancySlot[]>)

  const getSlotColor = (slot: OccupancySlot) => {
    if (slot.is_occupied) {
      return 'bg-green-100 border-green-300 text-green-800'
    }
    return 'bg-gray-50 border-gray-200 text-gray-500'
  }

  const getSlotText = (slot: OccupancySlot) => {
    if (slot.is_occupied && slot.wine_producer) {
      const vintage = slot.wine_vintage ? `'${slot.wine_vintage.toString().slice(-2)}` : ''
      const name = slot.wine_name || slot.wine_producer
      return `${name} ${vintage}`.trim()
    }
    return 'Empty'
  }

  return (
    <Card className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{layout.name}</h3>
          <div className="text-sm text-gray-500">
            {layout.shelves} shelves × {layout.columns} columns
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium">
            {occupied_slots} / {total_slots} occupied
          </div>
          <div className="text-xs text-gray-500">
            {occupancy_percentage}% full
          </div>
        </div>
      </div>

      {/* Occupancy Grid */}
      <div className="space-y-4">
        {Array.from({ length: layout.shelves }, (_, shelfIndex) => {
          const shelf = shelfIndex + 1
          const shelfSlots = slotsByShelf[shelf] || []
          
          return (
            <div key={shelf} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">S{shelf}</span>
                <div className="flex gap-1">
                  {Array.from({ length: layout.columns }, (_, colIndex) => {
                    const column = colIndex + 1
                    const frontSlot = shelfSlots.find(s => s.column_position === column && s.depth === 'front')
                    const backSlot = shelfSlots.find(s => s.column_position === column && s.depth === 'back')
                    
                    return (
                      <div key={column} className="flex flex-col gap-1">
                        {/* Front slot */}
                        <div
                          className={`w-16 h-8 border rounded text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${getSlotColor(frontSlot || { shelf, column_position: column, depth: 'front' as DepthPosition, is_occupied: false })}`}
                          onClick={() => frontSlot && onSlotClick?.(frontSlot)}
                        >
                          <div className="text-center truncate px-1">
                            {frontSlot ? getSlotText(frontSlot) : 'Empty'}
                          </div>
                        </div>
                        
                        {/* Back slot */}
                        <div
                          className={`w-16 h-8 border rounded text-xs flex items-center justify-center cursor-pointer hover:opacity-80 ${getSlotColor(backSlot || { shelf, column_position: column, depth: 'back' as DepthPosition, is_occupied: false })}`}
                          onClick={() => backSlot && onSlotClick?.(backSlot)}
                        >
                          <div className="text-center truncate px-1">
                            {backSlot ? getSlotText(backSlot) : 'Empty'}
                          </div>
                        </div>
                        
                        {/* Column label */}
                        <div className="text-xs text-center text-gray-400">
                          C{column}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span>Empty</span>
          </div>
        </div>
      </div>
    </Card>
  )
}

interface CellarSlotDetailProps {
  slot: OccupancySlot
  onWineClick?: (wineId: string) => void
  onAssignWine?: (slot: OccupancySlot) => void
  onRemoveWine?: (slot: OccupancySlot) => void
}

export function CellarSlotDetail({ 
  slot, 
  onWineClick, 
  onAssignWine, 
  onRemoveWine 
}: CellarSlotDetailProps) {
  if (!slot.is_occupied) {
    return (
      <div className="p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <LocationChip 
            shelf={slot.shelf} 
            column={slot.column_position} 
            depth={slot.depth}
            variant="outline"
          />
          <span className="text-sm text-gray-500">Empty</span>
        </div>
        {onAssignWine && (
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => onAssignWine(slot)}
          >
            Assign Wine
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="p-4 border rounded-lg bg-green-50 border-green-200">
      <div className="flex items-center justify-between mb-2">
        <LocationChip 
          shelf={slot.shelf} 
          column={slot.column_position} 
          depth={slot.depth}
          variant="default"
        />
        <Badge variant="secondary">Occupied</Badge>
      </div>
      
      {slot.wine_id && (
        <div className="space-y-2">
          <div 
            className="cursor-pointer hover:underline"
            onClick={() => onWineClick?.(slot.wine_id!)}
          >
            <div className="font-medium">
              {slot.wine_producer}
              {slot.wine_name && ` - ${slot.wine_name}`}
            </div>
            {slot.wine_vintage && (
              <div className="text-sm text-gray-600">
                Vintage {slot.wine_vintage}
              </div>
            )}
          </div>
          
          {onRemoveWine && (
            <Button 
              size="sm" 
              variant="destructive"
              onClick={() => onRemoveWine(slot)}
            >
              Remove Wine
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
