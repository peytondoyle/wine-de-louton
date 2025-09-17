import React from 'react'
import { toCellarMapSlots, getOccupancyStats } from '../../lib/cellarMapAdapter'
import { type CellarMapConfig, type RawSlot } from '../../types/cellarMap'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Wine as WineIcon, MapPin } from 'lucide-react'

interface CellarMapProps {
  rawSlots: RawSlot[]
  config: CellarMapConfig
  onPlace: (slotId: string) => void
  onWineClick?: (wineId: string) => void
}

export default function CellarMap({
  rawSlots,
  config,
  onPlace,
  onWineClick
}: CellarMapProps) {
  const slots = toCellarMapSlots(rawSlots, config)
  const stats = getOccupancyStats(slots)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <MapPin className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-semibold">Cellar Map</h2>
            <p className="text-sm text-muted-foreground">
              {config.rows} rows × {config.cols} columns
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-sm">
          {stats.percentage}% occupied
        </Badge>
      </div>

      {/* Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.occupied}</div>
            <div className="text-muted-foreground">Total</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-green-600">{stats.front}</div>
            <div className="text-muted-foreground">Front</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-blue-600">{stats.back}</div>
            <div className="text-muted-foreground">Back</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{stats.total - stats.occupied}</div>
            <div className="text-muted-foreground">Empty</div>
          </div>
        </div>
      </Card>

      {/* Grid */}
      <Card className="p-6">
        <div 
          className="grid gap-2" 
          style={{ gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: config.rows }).map((_, rIdx) => (
            <div key={rIdx} className="contents">
              {Array.from({ length: config.cols }).map((_, cIdx) => {
                const front = slots.find(s => s.row === rIdx + 1 && s.col === cIdx + 1 && s.depth === "F")!
                const back = slots.find(s => s.row === rIdx + 1 && s.col === cIdx + 1 && s.depth === "B")!
                
                const hasAnyWine = front.occupied || back.occupied
                const nextAvailableSlot = front.occupied ? back : front
                
                return (
                  <button
                    key={`${rIdx}-${cIdx}`}
                    className={`
                      rounded-xl border-2 p-3 text-left transition-all
                      hover:ring-2 hover:ring-primary/20 focus:ring-2 focus:ring-primary/40
                      ${hasAnyWine 
                        ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' 
                        : 'border-dashed border-muted hover:border-primary/40 hover:bg-muted/50'
                      }
                    `}
                    aria-label={`Row ${rIdx + 1} Col ${cIdx + 1} - ${hasAnyWine ? 'Occupied' : 'Empty'}`}
                    onClick={() => onPlace(nextAvailableSlot.id)}
                  >
                    {/* Row/Col indicator */}
                    <div className="flex items-center justify-between text-xs font-medium text-muted-foreground mb-2">
                      <span>R{rIdx + 1}C{cIdx + 1}</span>
                      <div className="flex gap-1">
                        <div 
                          className={`h-2 w-2 rounded-full ${
                            front.occupied ? "bg-green-500" : "bg-gray-300"
                          }`} 
                          title="Front position"
                        />
                        <div 
                          className={`h-2 w-2 rounded-full ${
                            back.occupied ? "bg-blue-500" : "bg-gray-300"
                          }`} 
                          title="Back position"
                        />
                      </div>
                    </div>
                    
                    {/* Wine info */}
                    <div className="space-y-1">
                      {front.occupied && (
                        <div 
                          className="flex items-center gap-1 text-xs text-green-700 cursor-pointer hover:text-green-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            onWineClick?.(front.wineId!)
                          }}
                        >
                          <WineIcon className="h-3 w-3" />
                          <span className="truncate">{front.label || 'Wine'}</span>
                        </div>
                      )}
                      {back.occupied && (
                        <div 
                          className="flex items-center gap-1 text-xs text-blue-700 cursor-pointer hover:text-blue-800"
                          onClick={(e) => {
                            e.stopPropagation()
                            onWineClick?.(back.wineId!)
                          }}
                        >
                          <WineIcon className="h-3 w-3" />
                          <span className="truncate">{back.label || 'Wine'}</span>
                        </div>
                      )}
                      {!hasAnyWine && (
                        <div className="text-xs text-muted-foreground/60">
                          Tap to place wine
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* Legend */}
      <Card className="p-4">
        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Front position</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Back position</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded border-2 border-dashed border-muted" />
            <span>Empty slot</span>
          </div>
        </div>
      </Card>
    </div>
  )
}
