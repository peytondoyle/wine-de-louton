import React from 'react'
import { DepthPosition } from '../types'
import { Badge } from './ui/Badge'

interface LocationChipProps {
  shelf: number
  column: number
  depth: DepthPosition
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

/**
 * Displays a location in the format "S3 · C5 · Front"
 * Used consistently throughout the cellar visualization
 */
export function LocationChip({ 
  shelf, 
  column, 
  depth, 
  className = '',
  variant = 'default'
}: LocationChipProps) {
  const depthDisplay = depth === 1 ? 'Front' : 'Back'
  
  return (
    <Badge 
      variant={variant}
      className={`font-mono text-xs ${className}`}
    >
      S{shelf} · C{column} · {depthDisplay}
    </Badge>
  )
}

interface LocationChipListProps {
  locations: Array<{
    shelf: number
    column: number
    depth: DepthPosition
  }>
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
}

/**
 * Displays multiple location chips in a flex container
 */
export function LocationChipList({ 
  locations, 
  className = '',
  variant = 'default'
}: LocationChipListProps) {
  if (locations.length === 0) {
    return null
  }

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {locations.map((location, index) => (
        <LocationChip
          key={`${location.shelf}-${location.column}-${location.depth}-${index}`}
          shelf={location.shelf}
          column={location.column}
          depth={location.depth}
          variant={variant}
        />
      ))}
    </div>
  )
}
