import React, { useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { DepthPosition } from '../types'

interface VirtualizedGridProps {
  shelves: number
  columns: number
  cellSize: number
  getSlotOccupancy: (shelf: number, column: number) => { frontOccupied: boolean; backOccupied: boolean }
  selectedSlot?: { shelf: number; column: number } | null
  onLongPress: (shelf: number, column: number) => void
  onShortClick: (shelf: number, column: number) => void
  onActivate?: (shelf: number, column: number) => void
  generateCellKey: (shelf: number, column: number, occupancy: { frontOccupied: boolean; backOccupied: boolean }) => string
  GridCell: React.ComponentType<{
    shelf: number
    column: number
    occupancy: { frontOccupied: boolean; backOccupied: boolean }
    isSelected: boolean
    onLongPress: (shelf: number, column: number) => void
    onShortClick: (shelf: number, column: number) => void
    onActivate?: (shelf: number, column: number) => void
  }>
  className?: string
}

export function VirtualizedGrid({
  shelves,
  columns,
  cellSize,
  getSlotOccupancy,
  selectedSlot,
  onLongPress,
  onShortClick,
  onActivate,
  generateCellKey,
  GridCell,
  className = ''
}: VirtualizedGridProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate total cells and determine if we need virtualization
  const totalCells = shelves * columns
  const shouldVirtualize = totalCells > 500

  // Create virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: shelves,
    getScrollElement: () => parentRef.current,
    estimateSize: () => cellSize + 32, // cell height + gap + label
    overscan: 2, // Render 2 extra rows outside viewport
    enabled: shouldVirtualize
  })

  // Memoize the grid rows to prevent unnecessary re-renders
  const gridRows = useMemo(() => {
    if (!shouldVirtualize) {
      // Return all rows for small grids
      return Array.from({ length: shelves }, (_, shelfIndex) => {
        const shelf = shelfIndex + 1
        return {
          index: shelfIndex,
          shelf,
          start: shelfIndex * (cellSize + 32),
          size: cellSize + 32
        }
      })
    }

    // Return only virtualized rows
    return rowVirtualizer.getVirtualItems()
  }, [shouldVirtualize, shelves, cellSize, rowVirtualizer])

  if (!shouldVirtualize) {
    // Render normal grid for small datasets
    return (
      <div className={`space-y-4 ${className}`} role="grid" aria-label="Cellar grid">
        {Array.from({ length: shelves }, (_, shelfIndex) => {
          const shelf = shelfIndex + 1
          
          return (
            <div key={shelf} className="space-y-2" role="row" aria-rowindex={shelf}>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium w-8">S{shelf}</span>
                <div className="flex gap-1" role="presentation">
                  {Array.from({ length: columns }, (_, colIndex) => {
                    const column = colIndex + 1
                    const occupancy = getSlotOccupancy(shelf, column)
                    const isSelected = selectedSlot?.shelf === shelf && selectedSlot?.column === column
                    const cellKey = generateCellKey(shelf, column, occupancy)
                    
                    return (
                      <div key={cellKey} className="flex flex-col gap-1">
                        <GridCell
                          shelf={shelf}
                          column={column}
                          occupancy={occupancy}
                          isSelected={isSelected}
                          onLongPress={onLongPress}
                          onShortClick={onShortClick}
                          onActivate={onActivate}
                        />
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
    )
  }

  // Render virtualized grid for large datasets
  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={{ height: '600px' }} // Fixed height for virtualization
      role="grid"
      aria-label="Cellar grid"
      aria-rowcount={shelves}
      aria-colcount={columns}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          position: 'relative'
        }}
      >
        {gridRows.map((virtualRow) => {
          const shelf = virtualRow.index + 1
          
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              role="row"
              aria-rowindex={shelf}
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium w-8">S{shelf}</span>
                  <div className="flex gap-1" role="presentation">
                    {Array.from({ length: columns }, (_, colIndex) => {
                      const column = colIndex + 1
                      const occupancy = getSlotOccupancy(shelf, column)
                      const isSelected = selectedSlot?.shelf === shelf && selectedSlot?.column === column
                      const cellKey = generateCellKey(shelf, column, occupancy)
                      
                      return (
                        <div key={cellKey} className="flex flex-col gap-1">
                          <GridCell
                            shelf={shelf}
                            column={column}
                            occupancy={occupancy}
                            isSelected={isSelected}
                            onLongPress={onLongPress}
                            onShortClick={onShortClick}
                            onActivate={onActivate}
                          />
                          <div className="text-xs text-center text-gray-400">
                            C{column}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
