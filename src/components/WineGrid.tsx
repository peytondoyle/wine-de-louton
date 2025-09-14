import type { Wine } from '../types'
import { WineCard } from './WineCard'
import { Button } from './ui/Button'
import { Plus, Wine as WineIcon } from 'lucide-react'

interface WineGridProps {
  wines: Wine[]
  loading?: boolean
  onWineClick: (wine: Wine) => void
  onMarkDrunk: (id: string) => void
  onAddWine: () => void
  density?: 'compact' | 'comfortable'
}

export function WineGrid({ wines, loading, onWineClick, onMarkDrunk, onAddWine, density = 'comfortable' }: WineGridProps) {
  const gridClasses = density === 'compact' 
    ? "mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
    : "mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"

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
      {wines.map((wine) => (
        <WineCard
          key={wine.id}
          wine={wine}
          onMarkDrunk={onMarkDrunk}
          onClick={onWineClick}
          density={density}
        />
      ))}
    </div>
  )
}
