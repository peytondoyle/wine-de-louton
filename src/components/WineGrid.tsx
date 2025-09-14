import type { Wine } from '../types'
import { WineCard } from './WineCard'
import { Button } from './ui/Button'
import { Plus, Wine as WineIcon } from 'lucide-react'

interface WineGridProps {
  wines: Wine[]
  loading?: boolean
  onWineClick: (wine: Wine) => void
  onMarkDrunk: (id: string) => void
  onUndo: (id: string) => void
  onAddWine: () => void
  onWineUpdated?: (wine: Wine) => void
  density?: 'compact' | 'comfortable'
  winesWithUndo?: Set<string>
  gridViewMode?: boolean
}

export function WineGrid({ wines, loading, onWineClick, onMarkDrunk, onUndo, onAddWine, onWineUpdated, density = 'comfortable', winesWithUndo = new Set(), gridViewMode = false }: WineGridProps) {
  const gridClasses = density === 'compact' 
    ? "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3"
    : "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6"

  if (loading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${density === 'compact' ? 'h-[160px]' : 'h-[200px]'} animate-pulse rounded-lg bg-muted`} />
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
    <div className={gridClasses}>
      {wines.map((wine, index) => (
        <WineCard
          key={wine.id}
          wine={wine}
          onMarkDrunk={onMarkDrunk}
          onUndo={onUndo}
          onClick={onWineClick}
          onWineUpdated={onWineUpdated}
          density={density}
          showUndo={winesWithUndo.has(wine.id)}
          gridViewMode={gridViewMode}
          gridIndex={index}
        />
      ))}
    </div>
  )
}
