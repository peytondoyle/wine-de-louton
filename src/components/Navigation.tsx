import React from 'react'
import { Wine, Grid3X3, MapPin } from 'lucide-react'
import { Button } from './ui/Button'

interface NavigationProps {
  currentView: 'wines' | 'cellar' | 'cellar-map'
  onViewChange: (view: 'wines' | 'cellar' | 'cellar-map') => void
  className?: string
}

export function Navigation({ currentView, onViewChange, className = '' }: NavigationProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        variant={currentView === 'wines' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('wines')}
        className="flex items-center gap-2"
      >
        <Wine className="h-4 w-4" />
        Collection
      </Button>
      
      <Button
        variant={currentView === 'cellar' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('cellar')}
        className="flex items-center gap-2"
      >
        <Grid3X3 className="h-4 w-4" />
        Cellar
      </Button>
      
      <Button
        variant={currentView === 'cellar-map' ? 'primary' : 'outline'}
        size="sm"
        onClick={() => onViewChange('cellar-map')}
        className="flex items-center gap-2"
      >
        <MapPin className="h-4 w-4" />
        Map
      </Button>
    </div>
  )
}
