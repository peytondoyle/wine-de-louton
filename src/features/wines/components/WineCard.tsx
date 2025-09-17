import { useState, useEffect } from 'react'
import type { Wine } from '../../../types'
import { WineStatus } from '../../../types'
import { displayWineTitle, countryFlag, stateBadge, formatSize, countryName } from '../../../lib/format'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { MapPin, Wine as WineIcon, WineOff, Check, Undo2, Sparkles, MapPin as PlaceIcon } from 'lucide-react'
import { cn } from '../../../lib/utils'

interface WineCardProps {
  wine: Wine
  onMarkDrunk: (id: string) => void
  onUndo: (id: string) => void
  onClick: (wine: Wine) => void
  onWineUpdated?: (wine: Wine) => void
  onOpenSuggestions?: (wine: Wine) => void
  onPlaceInCellar?: (wine: Wine) => void
  density?: 'compact' | 'comfortable'
  showUndo?: boolean
  gridViewMode?: boolean
  gridIndex?: number
}

const StatusPill = ({ status }: { status: 'cellared' | 'drunk' }) => (
  <Badge variant={status === 'drunk' ? 'danger' : 'success'} className="inline-flex items-center gap-1 shrink-0">
    {status === 'drunk' ? (
      <WineOff className="size-3.5" aria-hidden="true" />
    ) : (
      <Check className="size-3.5" aria-hidden="true" />
    )}
    {status === 'drunk' ? 'Drunk' : 'Cellared'}
  </Badge>
)

export function WineCard({ wine, onMarkDrunk, onUndo, onClick, onWineUpdated, onOpenSuggestions, onPlaceInCellar, density = 'comfortable', showUndo = false, gridViewMode = false, gridIndex = 0 }: WineCardProps) {
  const [showUndoChip, setShowUndoChip] = useState(false)

  const handleMarkDrunk = (e: React.MouseEvent) => {
    e.stopPropagation()
    onMarkDrunk(wine.id)
    setShowUndoChip(true)
  }

  const handleUndo = (e: React.MouseEvent) => {
    e.stopPropagation()
    onUndo(wine.id)
    setShowUndoChip(false)
  }

  const handleOpenSuggestions = (e: React.MouseEvent) => {
    e.stopPropagation()
    onOpenSuggestions?.(wine)
  }

  const handlePlaceInCellar = (e: React.MouseEvent) => {
    e.stopPropagation()
    onPlaceInCellar?.(wine)
  }

  const handleCardClick = () => {
    if (gridViewMode) {
      // In grid view mode, clicking opens placement editor
      // For now, just show an alert - this will be replaced with actual placement editor
      alert(`Placement Editor for ${wine.producer} — ${wine.vintage}\nRow: ${placement?.row}, Col: ${placement?.col}, Side: ${placement?.side}`)
    } else {
      // Normal mode - open wine details
      onClick(wine)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleCardClick()
    }
  }

  // Auto-hide undo chip after 5 seconds
  useEffect(() => {
    if (showUndoChip) {
      const timer = setTimeout(() => {
        setShowUndoChip(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [showUndoChip])

  // Calculate placement for grid view mode
  const getPlacementInfo = () => {
    if (!gridViewMode) return null
    
    // Calculate row and column based on grid index
    // This is a simplified calculation - in a real implementation, 
    // you'd want to consider the actual grid layout and responsive breakpoints
    const colsPerRow = density === 'compact' ? 5 : 3 // Approximate columns per row
    const row = Math.floor(gridIndex / colsPerRow) + 1
    const col = (gridIndex % colsPerRow) + 1
    const side = Math.random() > 0.5 ? 'L' : 'R' // Random side for now
    
    return { row, col, side }
  }

  const placement = getPlacementInfo()
  
  return (
    <article 
      className={cn("group h-full p-4 max-w-full w-full rounded-xl border border-neutral-200/70 bg-white shadow-sm hover:shadow-card hover:translate-y-[1px] hover:border-neutral-200 active:translate-y-0 motion-safe:transition-[box-shadow,transform] motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none cursor-pointer relative", {
        // Fixed heights for virtualization to prevent layout shift
        'min-h-[160px] max-h-[160px]': density === 'compact',
        'min-h-[200px] max-h-[200px]': density === 'comfortable'
      })}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Placement badges for grid view mode */}
      {placement && (
        <div className="absolute top-2 right-2 flex gap-1">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
            R{placement.row}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
            C{placement.col}
          </Badge>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5">
            {placement.side}
          </Badge>
        </div>
      )}
      <div className="grid grid-rows-[auto_auto_1fr] h-full gap-1">
        {/* Top: title/flag */}
        <header className="flex items-start gap-2 text-[15px] font-semibold min-w-0">
          <span aria-label={`Country ${countryName(wine.country_code)}`} className="shrink-0 mt-0.5">
            {countryFlag(wine.country_code)}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="line-clamp-1 min-w-0">
              {displayWineTitle(wine)}
            </h3>
            {wine.vineyard && (
              <div className="mt-1">
                <Badge variant="secondary" className="text-xs px-2 py-0.5">
                  {wine.vineyard}
                </Badge>
              </div>
            )}
          </div>
        </header>
        
        {/* Middle: meta (region, size) */}
        <div className="flex items-center gap-3 text-[13px] text-neutral-700 min-w-0">
          {wine.region && (
            <span className="inline-flex items-center gap-1 truncate min-w-0">
              <MapPin className="size-3.5" aria-hidden="true" />
              <span className="truncate">{wine.region}</span>
            </span>
          )}
          {wine.bottle_size && (
            <span className="inline-flex items-center gap-1 truncate min-w-0">
              <WineIcon className="size-3.5" aria-hidden="true" />
              <span className="truncate">{formatSize(wine.bottle_size)}</span>
            </span>
          )}
        </div>
        
        {/* Bottom: status + action button */}
        <footer className="flex items-center justify-between gap-2">
          <StatusPill status={wine.status === WineStatus.DRUNK ? 'drunk' : 'cellared'} />
          <div className="flex items-center gap-2">
            {showUndoChip && (
              <Button
                size="responsive"
                variant="outline"
                onClick={handleUndo}
                className="w-auto whitespace-nowrap text-xs px-2 py-1 h-7"
              >
                <Undo2 className="h-3 w-3 mr-1" />
                Undo
              </Button>
            )}
            {!wine.ai_enrichment && onOpenSuggestions && (
              <Button
                size="responsive"
                variant="outline"
                onClick={handleOpenSuggestions}
                className="w-auto whitespace-nowrap text-xs px-2 py-1 h-7"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Suggestions
              </Button>
            )}
            {onPlaceInCellar && wine.status === WineStatus.CELLARED && (
              <Button
                size="responsive"
                variant="outline"
                onClick={handlePlaceInCellar}
                className="w-auto whitespace-nowrap text-xs px-2 py-1 h-7"
              >
                <PlaceIcon className="h-3 w-3 mr-1" />
                Place in Cellar
              </Button>
            )}
            <Button 
              size="responsive" 
              variant="primary" 
              onClick={handleMarkDrunk} 
              className="w-auto whitespace-nowrap"
              aria-pressed={wine.status === WineStatus.DRUNK}
            >
              {wine.status === WineStatus.DRUNK ? (
                <>
                  <WineIcon className="h-4 w-4 mr-1" />
                  Undo Drunk
                </>
              ) : (
                <>
                  <WineOff className="h-4 w-4 mr-1" />
                  Mark Drunk
                </>
              )}
            </Button>
          </div>
        </footer>
      </div>
    </article>
  )
}

