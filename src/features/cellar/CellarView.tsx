import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, RefreshCw, Plus, MapPin, Settings } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import CellarMap from './CellarMap'
import EnhancedCellarMap from './EnhancedCellarMap'
import { useCellar } from '../../hooks/useCellar'
import { useActiveLayout } from '../../hooks/useActiveLayout'
import { useSlotPlacement } from '../../hooks/useSlotPlacement'
import { listWines } from '../wines/data/wines'
import { getLayout, getOccupancy } from './cellar.api'
import { toastError } from '../../utils/toastMessages'
import { CellarSettings } from '../../components/CellarSettings'
import { LayoutChangeBanner } from '../../components/LayoutChangeBanner'
import { slotUpsertHandler } from './slotUpsert'
import type { Wine, DepthPosition } from '../../types'
import type { RawSlot } from '../../types/cellarMap'

interface CellarViewProps {
  onBack: () => void
  onWineClick: (wine: Wine) => void
}

export default function CellarView({ onBack, onWineClick }: CellarViewProps) {
  const { loadFridgeLayouts, loadWinesInFridge, loading: cellarLoading } = useCellar()
  const { 
    activeLayout, 
    availableLayouts, 
    isLoading: layoutLoading, 
    error: layoutError,
    setActiveLayoutId,
    refreshLayouts 
  } = useActiveLayout()
  
  const {
    slots,
    occupiedSlots,
    ghostPreview,
    stackingEnabled,
    isPlacing,
    isMoving,
    placeWine,
    moveWine,
    removeWine,
    startGhostPreview,
    updateGhostPreview,
    confirmGhostPreview,
    cancelGhostPreview,
    setStackingEnabled,
    initializeSlots,
    refreshSlots
  } = useSlotPlacement()
  
  const [wines, setWines] = useState<Wine[]>([])
  const [cellarSlots, setCellarSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null)

  // Hardened data loading function with parallel fetching
  const loadCellarData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Parallel fetch all required data
      const [wineList, occupancyData] = await Promise.all([
        listWines().catch(err => {
          console.error('Failed to load wines:', err)
          return []
        }),
        getOccupancy().catch(err => {
          console.error('Failed to load occupancy:', err)
          return []
        })
      ])

      // Batch state updates for better performance
      React.startTransition(() => {
        setWines(wineList)
        setCellarSlots(occupancyData)
        
        // Initialize slot placement state
        const slotData = occupancyData.map((slot: any) => ({
          id: `slot-${slot.shelf}-${slot.column_position}-${slot.depth}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          household_id: 'default_household',
          wine_id: slot.wine_id,
          fridge_id: 'default_fridge',
          shelf: slot.shelf,
          column_position: slot.column_position,
          depth: slot.depth === 'front' ? 1 : 2
        }))
        initializeSlots(slotData)
      })
      
    } catch (error) {
      console.error('Failed to load cellar data:', error)
      setError('Failed to load cellar data')
      toastError(error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load data on mount and retry
  useEffect(() => {
    loadCellarData()
  }, [loadCellarData, retryCount])

  // Check for layout changes when active layout changes
  useEffect(() => {
    if (activeLayout) {
      const savedLayoutId = localStorage.getItem('activeLayoutId')
      if (savedLayoutId && savedLayoutId !== activeLayout.id) {
        setBannerDismissed(false)
      }
    }
  }, [activeLayout])

  // Handle layout change banner actions
  const handleUseCurrentLayout = () => {
    if (activeLayout) {
      setActiveLayoutId(activeLayout.id)
      setBannerDismissed(true)
    }
  }

  const handleDismissBanner = () => {
    setBannerDismissed(true)
  }

  // Get localStorage layout for comparison
  const getLocalStorageLayout = () => {
    const savedLayoutId = localStorage.getItem('activeLayoutId')
    if (savedLayoutId) {
      return availableLayouts.find(layout => layout.id === savedLayoutId) || null
    }
    return null
  }

  // Enhanced placement handlers
  const handlePlace = useCallback(async (slotId: string) => {
    if (!selectedWineId) {
      // If no wine is selected, show wine selection or use first available
      const firstWine = wines.find(w => w.status === 'Cellared')
      if (firstWine) {
        setSelectedWineId(firstWine.id)
        // Parse slot ID and place wine
        const [shelf, column, depth] = slotId.split('-')
        const success = await placeWine(firstWine.id, {
          shelf: parseInt(shelf),
          column: parseInt(column),
          depth: depth === 'F' ? 1 : 2
        })
        if (success) {
          setSelectedWineId(null)
          await loadCellarData() // Refresh data
        }
      }
    } else {
      // Place selected wine
      const [shelf, column, depth] = slotId.split('-')
      const success = await placeWine(selectedWineId, {
        shelf: parseInt(shelf),
        column: parseInt(column),
        depth: depth === 'F' ? 1 : 2
      })
      if (success) {
        setSelectedWineId(null)
        await loadCellarData() // Refresh data
      }
    }
  }, [selectedWineId, wines, placeWine, loadCellarData])

  const handleWineMove = useCallback((wineId: string, slot: { shelf: number; column: number; depth: DepthPosition }) => {
    const wine = wines.find(w => w.id === wineId)
    if (wine) {
      startGhostPreview(wineId, slot)
    }
  }, [wines, startGhostPreview])

  const handleConfirmGhostPreview = useCallback(async () => {
    const success = await confirmGhostPreview()
    if (success) {
      await loadCellarData() // Refresh data
    }
  }, [confirmGhostPreview, loadCellarData])

  const handleCancelGhostPreview = useCallback(() => {
    cancelGhostPreview()
  }, [cancelGhostPreview])

  const handleWineClick = useCallback((wineId: string) => {
    const wine = wines.find(w => w.id === wineId)
    if (wine) {
      onWineClick(wine)
    }
  }, [wines, onWineClick])

  const getWineName = useCallback((wineId: string) => {
    const wine = wines.find(w => w.id === wineId)
    return wine ? `${wine.vintage || ''} ${wine.producer}`.trim() : 'Wine'
  }, [wines])

  // Retry function
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1)
  }, [])

  // Loading skeleton
  if (cellarLoading || loading || layoutLoading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 84 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded border animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  // Error state with retry
  if (error || layoutError) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cellar Map</h1>
            <p className="text-muted-foreground">
              Visual overview of your wine storage
            </p>
          </div>
        </div>

        {/* Error state */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-red-500 mb-4">
              <RefreshCw className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Failed to load cellar data</h3>
            <p className="text-muted-foreground mb-4">
              There was an error loading your cellar information. {error || layoutError}
            </p>
            <Button onClick={handleRetry} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No layout state
  if (!activeLayout) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cellar Map</h1>
            <p className="text-muted-foreground">
              Visual overview of your wine storage
            </p>
          </div>
        </div>

        {/* No layout empty state */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No cellar layout found</h3>
            <p className="text-muted-foreground mb-4">
              Create a layout to start organizing your wine collection.
            </p>
            <Button onClick={() => setShowSettings(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Layout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // No slots state
  if (cellarSlots.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cellar Map</h1>
            <p className="text-muted-foreground">
              {activeLayout.name} • {activeLayout.shelves}×{activeLayout.columns}
            </p>
          </div>
        </div>

        {/* No slots empty state */}
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-muted-foreground mb-4">
              <MapPin className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Start placing bottles</h3>
            <p className="text-muted-foreground mb-4">
              Your cellar is empty. Add wines to see them on the map.
            </p>
            <Button onClick={onBack} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Wines
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const config = { 
    rows: activeLayout.shelves, 
    cols: activeLayout.columns 
  }

  // Map existing slot data to raw slots
  const rawSlots: RawSlot[] = cellarSlots.map((slot: any) => {
    const wine = wines.find(w => w.id === slot.wine_id)
    const depth = slot.depth === 1 ? "F" : "B" // Convert enum to string
    
    return {
      row: slot.shelf,
      col: slot.column_position,
      depth: depth as "F" | "B",
      wineId: slot.wine_id,
      label: wine ? `${wine.vintage || ''} ${wine.producer || ''}`.trim() : undefined
    }
  })


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Cellar Map</h1>
            <p className="text-muted-foreground">
              {activeLayout.name} • {activeLayout.shelves}×{activeLayout.columns} • {cellarSlots.length} bottles
            </p>
          </div>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(true)}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>
      </div>

      {/* Layout Change Banner */}
      {!bannerDismissed && (
        <LayoutChangeBanner
          currentLayout={activeLayout}
          localStorageLayout={getLocalStorageLayout()}
          onUseLayout={handleUseCurrentLayout}
          onDismiss={handleDismissBanner}
        />
      )}

      {/* Enhanced Map */}
      <EnhancedCellarMap
        rawSlots={rawSlots}
        config={config}
        onPlace={handlePlace}
        onWineClick={handleWineClick}
        onWineMove={handleWineMove}
        ghostPreview={ghostPreview.isVisible ? {
          wineId: ghostPreview.wineId!,
          wineName: getWineName(ghostPreview.wineId!),
          slot: ghostPreview.slot!,
          isVisible: true
        } : undefined}
        onConfirmGhostPreview={handleConfirmGhostPreview}
        onCancelGhostPreview={handleCancelGhostPreview}
        stackingEnabled={stackingEnabled}
        onToggleStacking={setStackingEnabled}
        wines={wines.map(w => ({
          id: w.id,
          name: w.wine_name || w.producer,
          producer: w.producer,
          vintage: w.vintage
        }))}
      />

      {/* Settings Modal */}
      <CellarSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}
