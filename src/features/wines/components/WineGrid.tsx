import type { Wine } from '../../../types'
import { WineCard } from './WineCard'
import { WineGridVirtual } from './WineGridVirtual'
import { Button } from '../../../components/ui/Button'
import { Plus, Wine as WineIcon } from 'lucide-react'
import { useMemo } from 'react'
import { useVirtualizedGridEnabled } from '../../../hooks/useVirtualizedGridEnabled'

interface WineGridProps {
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

export function WineGrid({ wines, loading, onWineClick, onMarkDrunk, onUndo, onAddWine, onWineUpdated, onOpenSuggestions, onPlaceInCellar, density = 'comfortable', winesWithUndo = new Set(), gridViewMode = false }: WineGridProps) {
  // Check if virtualized grid should be enabled
  const isVirtualizedEnabled = useVirtualizedGridEnabled()

  // Conditional render: choose between virtual and static grid
  if (isVirtualizedEnabled) {
    return (
      <WineGridVirtual
        wines={wines}
        loading={loading}
        onWineClick={onWineClick}
        onMarkDrunk={onMarkDrunk}
        onUndo={onUndo}
        onAddWine={onAddWine}
        onWineUpdated={onWineUpdated}
        onOpenSuggestions={onOpenSuggestions}
        onPlaceInCellar={onPlaceInCellar}
        density={density}
        winesWithUndo={winesWithUndo}
        gridViewMode={gridViewMode}
      />
    )
  }

  // Calculate grid dimensions based on density and screen size
  const gridConfig = useMemo(() => {
    const isCompact = density === 'compact'
    
    // Card dimensions (fixed to prevent layout shift)
    const cardHeight = isCompact ? 160 : 200
    const cardWidth = isCompact ? 200 : 280
    
    // Responsive columns based on screen size
    // These match the CSS grid breakpoints
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

  const gridClasses = density === 'compact' 
    ? "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
    : "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"

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

  // Use virtualization for large lists (120+ wines)
  if (wines.length > 120) {
    return (
      <WineGridVirtual
        wines={wines}
        onWineClick={onWineClick}
        onMarkDrunk={onMarkDrunk}
        onUndo={onUndo}
        onAddWine={onAddWine}
        onWineUpdated={onWineUpdated}
        onOpenSuggestions={onOpenSuggestions}
        onPlaceInCellar={onPlaceInCellar}
        density={density}
        winesWithUndo={winesWithUndo}
        gridViewMode={gridViewMode}
      />
    )
  }

  // Use regular DOM rendering for small lists
  return (
    <div className={gridClasses}>
      {wines.map((wine, index) => (
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
          gridIndex={index}
        />
      ))}
    </div>
  )
}
