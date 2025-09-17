import { useMemo, useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import type { Wine } from '../../../types'
import { WineCard } from './WineCard'
import { Button } from '../../../components/ui/Button'
import { Plus, Wine as WineIcon } from 'lucide-react'

interface WineGridVirtualProps {
  wines: Wine[]
  loading?: boolean
  onWineClick: (wine: Wine) => void
  onMarkDrunk: (id: string) => void
  onUndo: (id: string) => void
  onAddWine: () => void
  onWineUpdated?: (wine: Wine) => void
  onOpenSuggestions?: (wine: Wine) => void
  onPlaceInCellar?: (wine: Wine) => void
  density?: 'compact' | 'comfortable'
  winesWithUndo?: Set<string>
  gridViewMode?: boolean
}

export function WineGridVirtual({ 
  wines, 
  loading,
  onWineClick, 
  onMarkDrunk, 
  onUndo, 
  onAddWine,
  onWineUpdated, 
  onOpenSuggestions, 
  onPlaceInCellar, 
  density = 'comfortable', 
  winesWithUndo = new Set(), 
  gridViewMode = false 
}: WineGridVirtualProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  // Calculate grid configuration
  const gridConfig = useMemo(() => {
    const isCompact = density === 'compact'
    
    // Card dimensions (fixed to prevent layout shift)
    const cardHeight = isCompact ? 160 : 200
    const cardWidth = isCompact ? 200 : 280
    
    // Calculate columns based on container width
    // These match the CSS grid breakpoints from the original WineGrid
    const getColumnsPerRow = (containerWidth: number) => {
      if (containerWidth < 640) return 1 // sm
      if (containerWidth < 1024) return 2 // lg
      if (isCompact) {
        if (containerWidth < 1280) return 3 // xl
        return 5 // 2xl
      } else {
        return 3 // lg and above for comfortable
      }
    }
    
    // Default to 3 columns for SSR and initial render
    const columnsPerRow = 3
    const rows = Math.ceil(wines.length / columnsPerRow)
    
    return {
      cardHeight,
      cardWidth,
      columnsPerRow,
      rows,
      isCompact
    }
  }, [density, wines.length])

  // Create virtualizer
  const virtualizer = useVirtualizer({
    count: gridConfig.rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => gridConfig.cardHeight + (density === 'compact' ? 12 : 16), // card height + gap
    overscan: 5, // Render 5 extra rows for smooth scrolling
  })

  // Calculate grid classes to match original styling
  const gridClasses = density === 'compact' 
    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
    : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${gridConfig.cardHeight}px`} />
        ))}
      </div>
    )
  }

  if (wines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <WineIcon className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No wines found</h3>
        <p className="text-muted-foreground mb-6 max-w-sm">
          Start building your wine collection by adding your first bottle.
        </p>
        <Button onClick={onAddWine} className="min-w-[44px] min-h-[44px]">
          <Plus className="h-4 w-4 mr-2" />
          Add Your First Bottle
        </Button>
      </div>
    )
  }

  return (
    <div className="mt-6">
      <div
        ref={parentRef}
        className="h-[600px] overflow-auto" // Fixed height container for virtualization
        style={{
          // Custom scrollbar styling to match the app
          scrollbarWidth: 'thin',
          scrollbarColor: '#d1d5db transparent',
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const startIndex = virtualRow.index * gridConfig.columnsPerRow
            const endIndex = Math.min(startIndex + gridConfig.columnsPerRow, wines.length)
            const rowWines = wines.slice(startIndex, endIndex)
            
            return (
              <div
                key={virtualRow.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className={gridClasses}>
                  {rowWines.map((wine, index) => (
                    <WineCard
                      key={wine.id}
                      wine={wine}
                      onMarkDrunk={onMarkDrunk}
                      onUndo={onUndo}
                      onClick={onWineClick}
                      onWineUpdated={onWineUpdated}
                      onOpenSuggestions={onOpenSuggestions}
                      onPlaceInCellar={onPlaceInCellar}
                      density={density}
                      showUndo={winesWithUndo.has(wine.id)}
                      gridViewMode={gridViewMode}
                      gridIndex={startIndex + index}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}