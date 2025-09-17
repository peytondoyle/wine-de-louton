import React from 'react'
import { Wine, Grid3X3, MapPin, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { isUsingDefaultSupabaseCreds } from '../lib/supabase'

interface NavigationProps {
  currentView: 'wines' | 'cellar' | 'cellar-map'
  onViewChange: (view: 'wines' | 'cellar' | 'cellar-map') => void
  onOpenSettings?: () => void
  className?: string
}

export function Navigation({ currentView, onViewChange, onOpenSettings, className = '' }: NavigationProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Dev Banner - Show when using default Supabase credentials */}
      {import.meta.env.DEV && isUsingDefaultSupabaseCreds && (
        <div className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-md border border-amber-200 font-medium">
          DEV keys in use
        </div>
      )}
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
      
      {onOpenSettings && (
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenSettings}
          className="flex items-center gap-2"
          title="Cellar Settings"
        >
          <Settings className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
