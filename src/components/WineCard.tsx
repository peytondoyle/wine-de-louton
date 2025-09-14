import type { Wine } from '../types'
import { WineStatus } from '../types'
import { displayWineTitle, countryFlag, stateBadge, formatSize, countryName } from '../lib/format'
import { Badge } from './ui/Badge'
import { Button } from './ui/Button'
import { quietCard } from './ui/tokens'
import { MapPin, Wine as WineIcon, WineOff, Check } from 'lucide-react'
import { cn } from '../lib/utils'

interface WineCardProps {
  wine: Wine
  onMarkDrunk: (id: string) => void
  onClick: (wine: Wine) => void
  density?: 'compact' | 'comfortable'
}

const StatusPill = ({ status }: { status: 'cellared' | 'drunk' }) => (
  <Badge variant={status === 'drunk' ? 'danger' : 'success'} className="inline-flex items-center gap-1">
    {status === 'drunk' ? (
      <WineOff className="size-3.5" aria-hidden="true" />
    ) : (
      <Check className="size-3.5" aria-hidden="true" />
    )}
    {status === 'drunk' ? 'Drunk' : 'Cellared'}
  </Badge>
)

export function WineCard({ wine, onMarkDrunk, onClick, density = 'comfortable' }: WineCardProps) {
  const handleMarkDrunk = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkDrunk(wine.id)
  }

  const handleCardClick = () => {
    onClick(wine)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick(wine)
    }
  }
  
  return (
    <article 
      className={cn("group h-full p-4", quietCard, "cursor-pointer")}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <header className="mb-1 flex items-center gap-2 text-[15px] font-semibold">
        <span aria-label={`Country ${countryName(wine.country_code)}`}>
          {countryFlag(wine.country_code)}
        </span>
        <h3 className="truncate">
          {wine.producer ?? 'Unknown'} — {wine.vintage ?? 'NV'}
        </h3>
      </header>
      
      <div className="mb-3 flex items-center gap-4 text-[13px] text-neutral-700">
        {wine.region && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden="true" />
            {wine.region}
          </span>
        )}
        {wine.bottle_size && (
          <span className="inline-flex items-center gap-1">
            <WineIcon className="size-3.5" aria-hidden="true" />
            {formatSize(wine.bottle_size)}
          </span>
        )}
      </div>
      
      <footer className="mt-auto flex items-center justify-between">
        <StatusPill status={wine.status === WineStatus.DRUNK ? 'drunk' : 'cellared'} />
        <Button size="sm" variant="primary" onClick={handleMarkDrunk}>
          {wine.status === WineStatus.DRUNK ? 'Undo Drunk' : 'Mark Drunk'}
        </Button>
      </footer>
    </article>
  )
}

