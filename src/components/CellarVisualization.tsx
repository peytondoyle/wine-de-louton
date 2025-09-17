import React, { useState, useEffect, memo, useMemo } from 'react'
import { FridgeOccupancy, OccupancySlot, DepthPosition } from '../types'
import { LocationChip } from './LocationChip'
import { Card } from './ui/Card'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { DepthToggle } from './DepthToggle'
import { SlotDepthIndicator } from './SlotDepthIndicator'
import { getFridgeOccupancy } from '../features/cellar/data/cellar'
import { useLongPress } from '../hooks/useLongPress'
import { useGridNavigation } from '../hooks/useGridNavigation'
import { PlacementBanner } from './PlacementBanner'
import { VirtualizedGrid } from './VirtualizedGrid'

// Generate stable key for grid cells based on position and occupancy state
const generateCellKey = (shelf: number, column: number, occupancy: { frontOccupied: boolean; backOccupied: boolean }): string => {
  const occupancyKey = `${occupancy.frontOccupied ? 'F' : 'E'}${occupancy.backOccupied ? 'B' : 'E'}`
  return `${shelf}-${column}-${occupancyKey}`
}

interface GridCellProps {
  shelf: number
  column: number
  occupancy: { frontOccupied: boolean; backOccupied: boolean }
  isSelected: boolean
  onLongPress: (shelf: number, column: number) => void
  onShortClick: (shelf: number, column: number) => void
  onActivate?: (shelf: number, column: number) => void
}

const GridCell = memo(function GridCell({ 
  shelf, 
  column, 
  occupancy, 
  isSelected, 
  onLongPress, 
  onShortClick,
  onActivate
}: GridCellProps) {
  const longPressHandlers = useLongPress({
    onLongPress: () => onLongPress(shelf, column),
    onClick: () => onShortClick(shelf, column),
    delay: 300,
    preventDefault: true
  })

  // Generate screen reader label
  const getScreenReaderLabel = () => {
    const frontStatus = occupancy.frontOccupied ? 'Front occupied' : 'Front empty'
    const backStatus = occupancy.backOccupied ? 'Back occupied' : 'Back empty'
    return `Row ${shelf}, Column ${column}, ${frontStatus}, ${backStatus}`
  }

  // Handle Enter key activation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onActivate?.(shelf, column)
    }
  }

  // Determine visual state based on occupancy
  const getCellStyling = () => {
    if (isSelected) {
      return 'bg-blue-50 border-blue-400 ring-1 ring-blue-200'
    }
    
    const { frontOccupied, backOccupied } = occupancy
    
    if (frontOccupied && backOccupied) {
      // Both occupied - darker green with stronger border
      return 'bg-green-100 border-green-400 ring-1 ring-green-200'
    } else if (frontOccupied || backOccupied) {
      // One occupied - lighter green with subtle border
      return 'bg-green-50 border-green-300'
    } else {
      // Empty - neutral gray
      return 'bg-gray-50 border-gray-200'
    }
  }

  return (
    <div
      className={`w-16 h-16 min-w-[44px] min-h-[44px] sm:min-w-[40px] sm:min-h-[40px] border rounded text-xs flex items-center justify-center cursor-pointer hover:opacity-80 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:outline-none relative transition-all duration-150 ${getCellStyling()}`}
      tabIndex={-1}
      data-grid-cell={`${shelf}-${column}`}
      role="gridcell"
      aria-label={getScreenReaderLabel()}
      aria-selected={isSelected}
      aria-rowindex={shelf}
      aria-colindex={column}
      onKeyDown={handleKeyDown}
      {...longPressHandlers}
    >
      {/* Depth indicator - bottom right corner */}
      <SlotDepthIndicator 
        frontOccupied={occupancy.frontOccupied}
        backOccupied={occupancy.backOccupied}
        className="absolute bottom-1 right-1"
      />
      
      {/* Slot content */}
      <div className="text-center truncate px-1 text-gray-700">
        {occupancy.frontOccupied || occupancy.backOccupied ? 'Wine' : 'Empty'}
      </div>
    </div>
  )
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  return (
    prevProps.shelf === nextProps.shelf &&
    prevProps.column === nextProps.column &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.occupancy.frontOccupied === nextProps.occupancy.frontOccupied &&
    prevProps.occupancy.backOccupied === nextProps.occupancy.backOccupied &&
    prevProps.onLongPress === nextProps.onLongPress &&
    prevProps.onShortClick === nextProps.onShortClick &&
    prevProps.onActivate === nextProps.onActivate
  )
})

interface CellarVisualizationProps {
  fridgeId: string
  onSlotClick?: (slot: OccupancySlot) => void
  onWineClick?: (wineId: string) => void
  onLongPress?: (slot: OccupancySlot) => void
  selectedWineId?: string | null
  onPlaceBottle?: (shelf: number, column: number, depth: DepthPosition) => void
  className?: string
}

export function CellarVisualization({ 
  fridgeId, 
  onSlotClick, 
  onWineClick,
  onLongPress,
  selectedWineId,
  onPlaceBottle,
  className = ''
}: CellarVisualizationProps) {
  const [occupancy, setOccupancy] = useState<FridgeOccupancy | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ shelf: number; column: number } | null>(null)
  const [selectedDepth, setSelectedDepth] = useState<DepthPosition>(DepthPosition.FRONT)
  const [showPlacementBanner, setShowPlacementBanner] = useState(false)

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

  const handleSlotClick = (shelf: number, column: number) => {
    setSelectedSlot({ shelf, column })
    
    // Check if front is occupied, if so default to back
    const frontOccupied = slots.some(s => 
      s.shelf === shelf && 
      s.column_position === column && 
      s.depth === DepthPosition.FRONT && 
      s.is_occupied
    )
    
    if (frontOccupied) {
      setSelectedDepth(DepthPosition.BACK)
    } else {
      setSelectedDepth(DepthPosition.FRONT)
    }

    // Show placement banner if there's a selected wine and the slot has free space
    const backOccupied = slots.some(s => 
      s.shelf === shelf && 
      s.column_position === column && 
      s.depth === DepthPosition.BACK && 
      s.is_occupied
    )
    
    if (selectedWineId && (!frontOccupied || !backOccupied)) {
      setShowPlacementBanner(true)
    }
  }

  const handleDepthChange = (depth: DepthPosition) => {
    setSelectedDepth(depth)
    
    if (selectedSlot) {
      // Find the slot with the new depth
      const slot = slots.find(s => 
        s.shelf === selectedSlot.shelf && 
        s.column_position === selectedSlot.column && 
        s.depth === depth
      )
      
      if (slot) {
        onSlotClick?.(slot)
      }
    }
  }

  const getSlotOccupancy = (shelf: number, column: number) => {
    const frontSlot = slots.find(s => 
      s.shelf === shelf && 
      s.column_position === column && 
      s.depth === DepthPosition.FRONT
    )
    const backSlot = slots.find(s => 
      s.shelf === shelf && 
      s.column_position === column && 
      s.depth === DepthPosition.BACK
    )
    
    return {
      frontOccupied: frontSlot?.is_occupied || false,
      backOccupied: backSlot?.is_occupied || false
    }
  }

  const handleLongPress = (shelf: number, column: number) => {
    // Find the slot with the selected depth
    const slot = slots.find(s => 
      s.shelf === shelf && 
      s.column_position === column && 
      s.depth === selectedDepth
    )
    
    if (slot && onLongPress) {
      onLongPress(slot)
    }
  }

  const handleShortClick = (shelf: number, column: number) => {
    handleSlotClick(shelf, column)
  }

  const handleCellActivate = (shelf: number, column: number) => {
    // Same as short click - opens the cell's context
    handleSlotClick(shelf, column)
  }

  const handlePlacementConfirm = () => {
    if (selectedSlot && onPlaceBottle) {
      onPlaceBottle(selectedSlot.shelf, selectedSlot.column, selectedDepth)
      setShowPlacementBanner(false)
    }
  }

  const handlePlacementChange = () => {
    // Reopen depth picker by toggling the depth
    setSelectedDepth(selectedDepth === DepthPosition.FRONT ? DepthPosition.BACK : DepthPosition.FRONT)
  }

  const handlePlacementDismiss = () => {
    setShowPlacementBanner(false)
  }

  // Set up grid navigation
  const { gridRef, focusCell } = useGridNavigation({
    rows: layout.shelves,
    columns: layout.columns,
    onCellFocus: (row, column) => {
      // Optional: Update some state to show which cell is focused
    },
    onCellActivate: handleCellActivate
  })

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

      {/* Compact Legend Bar */}
      <div className="mb-4 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center text-xs text-gray-600">
          <span className="truncate" title={`Rows × Cols × Depth: R${layout.shelves} × C${layout.columns} × D2 • Free: ${total_slots - occupied_slots} • Taken: ${occupied_slots}`}>
            R{layout.shelves} × C{layout.columns} × D2 • Free: {total_slots - occupied_slots} • Taken: {occupied_slots}
          </span>
        </div>
      </div>

      {/* Occupancy Grid */}
      <div 
        ref={gridRef}
        className="space-y-4"
        role="grid"
        aria-label="Cellar grid"
        aria-rowcount={layout.shelves}
        aria-colcount={layout.columns}
      >
        {Array.from({ length: layout.shelves }, (_, shelfIndex) => {
          const shelf = shelfIndex + 1
          
          return (
            <div key={shelf} className="space-y-2" role="row" aria-rowindex={shelf}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">S{shelf}</span>
                <div className="flex gap-1" role="presentation">
                  {Array.from({ length: layout.columns }, (_, colIndex) => {
                    const column = colIndex + 1
                    const occupancy = getSlotOccupancy(shelf, column)
                    const isSelected = selectedSlot?.shelf === shelf && selectedSlot?.column === column
                    const cellKey = generateCellKey(shelf, column, occupancy)
                    
                    return (
                      <div key={cellKey} className="flex flex-col gap-1">
                        {/* Single slot with depth indicator */}
                        <GridCell
                          shelf={shelf}
                          column={column}
                          occupancy={occupancy}
                          isSelected={isSelected}
                          onLongPress={handleLongPress}
                          onShortClick={handleShortClick}
                          onActivate={handleCellActivate}
                        />
                        
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

      {/* Depth Toggle for Selected Slot */}
      {selectedSlot && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-700 mb-2">
                Shelf {selectedSlot.shelf}, Column {selectedSlot.column}
              </div>
              <DepthToggle
                value={selectedDepth}
                onChange={handleDepthChange}
                frontOccupied={getSlotOccupancy(selectedSlot.shelf, selectedSlot.column).frontOccupied}
                backOccupied={getSlotOccupancy(selectedSlot.shelf, selectedSlot.column).backOccupied}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span>Empty</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-500 rounded"></div>
            <span>Selected</span>
          </div>
          <div className="flex items-center gap-2">
            <SlotDepthIndicator frontOccupied={true} backOccupied={false} />
            <span>Depth indicator</span>
          </div>
        </div>
      </div>

      {/* Placement Banner */}
      {showPlacementBanner && selectedSlot && (
        <div className="mt-6">
          <PlacementBanner
            shelf={selectedSlot.shelf}
            column={selectedSlot.column}
            depth={selectedDepth}
            onConfirm={handlePlacementConfirm}
            onChange={handlePlacementChange}
            onDismiss={handlePlacementDismiss}
            className="md:max-w-sm md:ml-auto"
          />
        </div>
      )}
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
