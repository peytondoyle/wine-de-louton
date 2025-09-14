import type { Wine } from '../types'
import { WineStatus } from '../types'
import { displayWineTitle, countryFlag, stateBadge, formatSize, countryName } from '../lib/format'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'

interface WineCardProps {
  wine: Wine
  onMarkDrunk: (id: string) => void
  onClick: (wine: Wine) => void
  density?: 'compact' | 'comfortable'
}

export function WineCard({ wine, onMarkDrunk, onClick, density = 'comfortable' }: WineCardProps) {
  const handleMarkDrunk = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkDrunk(wine.id)
  }

  const handleCardClick = () => {
    onClick(wine)
  }
  
  return (
    <article
      className="h-full surface transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="h-full grid grid-rows-[auto_1fr_auto] section gap-2">
        {/* Header row: flag + title */}
        <div className="flex items-start gap-2">
          <span aria-label={`Country ${countryName(wine.country_code)}`}>
            {countryFlag(wine.country_code)}
          </span>
          <h3 className="text-[15px] leading-5 font-semibold line-clamp-2">
            {displayWineTitle(wine)}
          </h3>
        </div>

        {/* Meta row: region, vintage, size */}
        <div className="mt-1 space-y-1.5 text-sm text-neutral-700">
          {wine.region && <div>{wine.region}</div>}
          <div className="flex items-center gap-3">
            {wine.vintage && (
              <div className="flex items-center gap-1">🗓 {wine.vintage}</div>
            )}
            {wine.bottle_size && (
              <div className="flex items-center gap-1">🍷 {formatSize(wine.bottle_size)}</div>
            )}
          </div>
        </div>

        {/* Footer row: status + button */}
        <div className="mt-3 flex items-center justify-between">
          <Badge 
            variant={wine.status === WineStatus.DRUNK ? "secondary" : "default"}
            className="rounded-full px-2.5 py-0.5 text-xs"
          >
            {wine.status === WineStatus.DRUNK ? 'Drunk' : 'Cellared'}
          </Badge>
          <Button 
            size="sm" 
            onClick={handleMarkDrunk}
          >
            {wine.status === WineStatus.DRUNK ? 'Undo Drunk' : 'Mark Drunk'}
          </Button>
        </div>
      </div>
    </article>
  )
}

