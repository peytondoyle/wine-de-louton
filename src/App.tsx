import { useState, useEffect, useMemo, Suspense, lazy } from 'react'
import { Plus, Wine as WineIcon, X, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react'
import type { Wine, ControlsState, BottleSize, WineSortField, WineSortDirection } from './types'
import { WineStatus } from './types'
import { listWines, getWine, markDrunk, updateWine } from './features/wines/data/wines'
import { pingWines } from './data/_smoke'
import { ControlsBar } from './components/ControlsBar'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useWineCache } from './hooks/useWineCache'
import { WineGrid } from './features/wines/components/WineGrid'

// Lazy load heavy components
const WineSheet = lazy(() => import('./features/wines/components/WineSheet').then(module => ({ default: module.WineSheet })))
const WineDetailDrawer = lazy(() => import('./features/wines/components/WineDetailDrawer').then(module => ({ default: module.WineDetailDrawer })))
import { CsvImportButton } from './components/CsvImportButton'
import { Button } from './components/ui/Button'
import { ToastHost } from './components/ToastHost'
import { QAChecklistOverlay } from './components/QAChecklistOverlay'
import { Navigation } from './components/Navigation'
import { CellarManagement } from './components/CellarManagement'
import CellarView from './features/cellar/CellarView'
import { toast } from './lib/toast'
import { toastDrunk, toastError } from './utils/toastMessages'

// Skeleton fallback components
const DrawerSkeleton = () => (
  <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
    <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-50">
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

const SheetSkeleton = () => (
  <div className="fixed inset-0 z-40 bg-black/50 flex items-end sm:items-center justify-center p-4">
    <div className="bg-white rounded-t-xl sm:rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col z-50">
      <div className="p-4 sm:p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

function App() {
  // Use wine cache for instant loading
  const { wines: allWines, isStale, isLoading: cacheLoading, error, refresh } = useWineCache()
  const [otherLoading, setOtherLoading] = useState(false) // Keep for other loading states
  
  // Use cache loading state for initial load
  const loading = cacheLoading && allWines.length === 0
  
  // Default controls state
  const defaultControls = {
    search: '',
    status: 'All' as const,
    country_code: '',
    region: '',
    bottle_size: 'All' as const,
    vintageMin: '',
    vintageMax: '',
    sort: {
      field: 'created_at' as const,
      direction: 'desc' as const
    }
  } satisfies ControlsState

  // Controls state with localStorage persistence
  const [controls, setControls, clearControls] = useLocalStorage<ControlsState>(
    'wdl:filters:v1',
    defaultControls
  )
  
  // Apply filters to cached wines
  const wines = useMemo(() => {
    if (!allWines.length) return []
    
    return allWines.filter(wine => {
      // Status filter
      if (controls.status !== 'All' && wine.status !== controls.status) {
        return false
      }
      
      // Country filter
      if (controls.country_code && wine.country_code !== controls.country_code) {
        return false
      }
      
      // Region filter
      if (controls.region && wine.region !== controls.region) {
        return false
      }
      
      // Bottle size filter
      if (controls.bottle_size !== 'All' && wine.bottle_size !== controls.bottle_size) {
        return false
      }
      
      // Vintage range filter
      if (controls.vintageMin && wine.vintage && wine.vintage < parseInt(controls.vintageMin)) {
        return false
      }
      if (controls.vintageMax && wine.vintage && wine.vintage > parseInt(controls.vintageMax)) {
        return false
      }
      
      // Search filter
      if (controls.search) {
        const searchLower = controls.search.toLowerCase()
        const searchableText = [
          wine.producer,
          wine.wine_name,
          wine.region,
          wine.appellation,
          wine.vineyard,
          wine.varietals?.join(' ')
        ].filter(Boolean).join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) {
          return false
        }
      }
      
      return true
    }).sort((a, b) => {
      // Apply sorting
      switch (controls.sort.field) {
        case 'created_at':
          return controls.sort.direction === 'asc' 
            ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            : new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'vintage':
          return controls.sort.direction === 'asc'
            ? (a.vintage || 0) - (b.vintage || 0)
            : (b.vintage || 0) - (a.vintage || 0)
        case 'average_rating':
          return controls.sort.direction === 'asc'
            ? (a.average_rating || 0) - (b.average_rating || 0)
            : (b.average_rating || 0) - (a.average_rating || 0)
        default:
          return 0
      }
    })
  }, [allWines, controls])
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [focusOnSuggestions, setFocusOnSuggestions] = useState(false)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editingWine, setEditingWine] = useState<Wine | null>(null)
  const [showEmptyStateTip, setShowEmptyStateTip] = useState(true)
  const [winesWithUndo, setWinesWithUndo] = useState<Set<string>>(new Set())
  const [currentView, setCurrentView] = useState<'wines' | 'cellar' | 'cellar-map'>(() => {
    const saved = localStorage.getItem('wine-app-view')
    return (saved === 'wines' || saved === 'cellar' || saved === 'cellar-map') ? saved : 'wines'
  })
  const [placementWine, setPlacementWine] = useState<Wine | null>(null)
  const [showStepIndicator, setShowStepIndicator] = useState(false)
  const [gridDensity, setGridDensity] = useState<'compact' | 'comfortable'>(() => {
    const saved = localStorage.getItem('wine-grid-density')
    return (saved === 'compact' || saved === 'comfortable') ? saved : 'comfortable'
  })
  const [gridViewMode, setGridViewMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wine-grid-view-mode')
    return saved === 'true'
  })

  // Update URL when controls change
  useEffect(() => {
    const params = new URLSearchParams()
    if (controls.search) params.set('search', controls.search)
    if (controls.status !== 'All') params.set('status', controls.status)
    if (controls.country_code) params.set('country_code', controls.country_code)
    if (controls.region) params.set('region', controls.region)
    if (controls.bottle_size !== 'All') params.set('bottle_size', controls.bottle_size)
    if (controls.vintageMin) params.set('vintageMin', controls.vintageMin)
    if (controls.vintageMax) params.set('vintageMax', controls.vintageMax)
    if (controls.sort.field !== 'created_at') params.set('sortField', controls.sort.field)
    if (controls.sort.direction !== 'desc') params.set('sortDirection', controls.sort.direction)

    const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
    window.history.replaceState({}, '', newUrl)
  }, [controls])

  // Save grid density to localStorage
  useEffect(() => {
    localStorage.setItem('wine-grid-density', gridDensity)
  }, [gridDensity])

  // Save grid view mode to localStorage
  useEffect(() => {
    localStorage.setItem('wine-grid-view-mode', gridViewMode.toString())
  }, [gridViewMode])

  // Save current view to localStorage
  useEffect(() => {
    localStorage.setItem('wine-app-view', currentView)
  }, [currentView])

  // Auto-remove wines from undo set after 5 seconds
  useEffect(() => {
    if (winesWithUndo.size > 0) {
      const timer = setTimeout(() => {
        setWinesWithUndo(new Set())
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [winesWithUndo])

  // Smoke test on mount
  useEffect(() => {
    pingWines().then(result => {
      if (import.meta.env.DEV) {
        console.log('Supabase smoke test:', result)
      }
    })
  }, [])

  // No need to reload when controls change - we filter client-side
  // useEffect(() => {
  //   loadWines()
  // }, [controls])

  const loadWines = async () => {
    // Refresh cache when explicitly requested
    await refresh()
  }

  const handleWineClick = async (wine: Wine) => {
    try {
      // Fetch the latest wine data before showing details
      const freshWine = await getWine(wine.id)
      if (freshWine) {
        setSelectedWine(freshWine)
      }
    } catch (error) {
      console.error('Error fetching wine details:', error)
      toast.error('Load failed')
    }
  }

  const handleMarkDrunk = async (id: string) => {
    const originalWine = wines.find(w => w.id === id)
    
    if (!originalWine) return
    
    // Determine new status
    const newStatus = originalWine.status === WineStatus.DRUNK ? WineStatus.CELLARED : WineStatus.DRUNK
    const today = new Date().toISOString().split('T')[0]
    
    // Add to undo set for visual feedback
    setWinesWithUndo(prev => new Set(prev).add(id))
    
    try {
      if (newStatus === WineStatus.DRUNK) {
        await markDrunk(id)
        // Visual feedback: wine moves to "Drunk" section
      } else {
        await updateWine(id, { status: WineStatus.CELLARED, drank_on: undefined })
        // Visual feedback: wine moves to "Cellared" section
      }
      
      // Refresh cache to get updated data
      await refresh()
    } catch (error) {
      // Remove from undo set on error
      setWinesWithUndo(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
      console.error('Error updating wine status:', error)
      toast.error('Update failed')
    }
  }

  const handleUndo = async (id: string) => {
    const originalWine = wines.find(w => w.id === id)
    
    if (!originalWine) return
    
    // Determine new status
    const newStatus = originalWine.status === WineStatus.DRUNK ? WineStatus.CELLARED : WineStatus.DRUNK
    const today = new Date().toISOString().split('T')[0]
    
    // Remove from undo set
    setWinesWithUndo(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    
    try {
      if (newStatus === WineStatus.DRUNK) {
        await markDrunk(id)
        // Visual feedback: wine moves to "Drunk" section
      } else {
        await updateWine(id, { status: WineStatus.CELLARED, drank_on: undefined })
        // Visual feedback: wine moves to "Cellared" section
      }
      
      // Refresh cache to get updated data
      await refresh()
    } catch (error) {
      // Add back to undo set on error
      setWinesWithUndo(prev => new Set(prev).add(id))
      console.error('Error updating wine status:', error)
      toast.error('Update failed')
    }
  }

  const handleAddWine = () => {
    setShowAddSheet(true)
  }

  const handleEditWine = (wine: Wine) => {
    setEditingWine(wine)
    setShowEditSheet(true)
    setSelectedWine(null) // Close detail drawer
  }

  const handleOpenSuggestions = async (wine: Wine) => {
    try {
      // Fetch the latest wine data before showing details
      const freshWine = await getWine(wine.id)
      if (freshWine) {
        setSelectedWine(freshWine)
        setFocusOnSuggestions(true)
      }
    } catch (error) {
      console.error('Error fetching wine details:', error)
      toast.error('Load failed')
    }
  }

  const handleWineSaved = (wine: Wine) => {
    loadWines() // Refresh the list
    setShowAddSheet(false)
    setShowEditSheet(false)
    setEditingWine(null)
  }

  const handleWineUpdated = async (wine: Wine) => {
    // Update selectedWine if it's the same wine being viewed
    if (selectedWine && selectedWine.id === wine.id) {
      setSelectedWine(wine)
    }
    
    // Refresh cache to get updated data
    await refresh()
  }

  const handlePlaceInCellar = (wine: Wine) => {
    setPlacementWine(wine)
    setCurrentView('cellar')
    setShowStepIndicator(true)
  }

  const handlePlacementComplete = (shelf: number, column: number, depth: number) => {
    const depthText = depth === 1 ? 'Front' : 'Back'
    toast.success(`Placed in R${shelf}C${column} (${depthText}).`)
    setPlacementWine(null)
    setShowStepIndicator(false)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Wines de Louton</h1>
              <Navigation currentView={currentView} onViewChange={setCurrentView} />
            </div>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              {currentView === 'wines' && (
                <>
                  {import.meta.env.DEV && (
                    <CsvImportButton onImportComplete={loadWines} />
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setGridDensity(gridDensity === 'compact' ? 'comfortable' : 'compact')}
                    className="min-w-[44px]"
                    title={`Switch to ${gridDensity === 'compact' ? 'comfortable' : 'compact'} view`}
                  >
                    {gridDensity === 'compact' ? (
                      <Grid2X2 className="h-4 w-4" />
                    ) : (
                      <Grid3X3 className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant={gridViewMode ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setGridViewMode(!gridViewMode)}
                    className="min-w-[44px]"
                    title={gridViewMode ? "Exit placement mode" : "Enter placement mode"}
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button onClick={handleAddWine} className="bg-accent text-white hover:brightness-110 rounded-xl px-4 py-2">
                <Plus className="h-4 w-4 mr-2" />
                Add Bottle
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {currentView === 'wines' ? (
          <>
            {/* Controls */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
              <ControlsBar 
                value={controls} 
                onChange={setControls} 
                onReset={clearControls}
                isStale={isStale}
                onRefresh={refresh}
              />
            </div>

            {/* Wine Grid */}
            {loading ? (
              <div className="flex justify-center py-12">
                <p className="text-muted-foreground text-lg">Loading…</p>
              </div>
            ) : wines.length === 0 ? (
              <div className="text-center py-16">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">No wines found</h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  {controls.search || controls.status !== 'All' || controls.country_code || controls.region || controls.bottle_size !== 'All' || controls.vintageMin || controls.vintageMax
                    ? "No wines match your current filters. Try adjusting your search criteria."
                    : "Start building your wine collection by adding your first bottle."
                  }
                </p>
                
                {/* Empty State Tip */}
                {!controls.search && controls.status === 'All' && !controls.country_code && !controls.region && controls.bottle_size === 'All' && !controls.vintageMin && !controls.vintageMax && showEmptyStateTip && (
                  <div className="mb-8 max-w-lg mx-auto">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-left">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-blue-900 mb-1">💡 Quick Start Tip</h3>
                          <p className="text-sm text-blue-700 mb-3">
                            You only need to enter the <strong>producer</strong> to add a wine. 
                            AI will automatically suggest drink windows, scores, and tasting notes!
                          </p>
                          <Button 
                            size="sm" 
                            onClick={() => setShowAddSheet(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Quick Add Wine
                          </Button>
                        </div>
                        <button
                          onClick={() => setShowEmptyStateTip(false)}
                          className="ml-2 text-blue-400 hover:text-blue-600"
                          aria-label="Dismiss tip"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                <Button onClick={handleAddWine} className="bg-accent hover:bg-accent/90 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Bottle
                </Button>
              </div>
            ) : (
            <WineGrid
              wines={wines}
              loading={loading}
              onWineClick={handleWineClick}
              onMarkDrunk={handleMarkDrunk}
              onUndo={handleUndo}
              onAddWine={handleAddWine}
              onWineUpdated={handleWineUpdated}
              onOpenSuggestions={handleOpenSuggestions}
              onPlaceInCellar={handlePlaceInCellar}
              density={gridDensity}
              winesWithUndo={winesWithUndo}
              gridViewMode={gridViewMode}
            />
            )}
          </>
        ) : currentView === 'cellar' ? (
          <CellarManagement 
            className="mt-4" 
            selectedWineId={placementWine?.id || null}
            onPlacementComplete={handlePlacementComplete}
            showStepIndicator={showStepIndicator}
          />
        ) : (
          <CellarView 
            onBack={() => setCurrentView('wines')}
            onWineClick={handleWineClick}
          />
        )}
      </div>

      {/* Modals */}
      {showAddSheet && (
        <Suspense fallback={<SheetSkeleton />}>
          <WineSheet
            mode="add"
            onClose={() => setShowAddSheet(false)}
            onSaved={handleWineSaved}
          />
        </Suspense>
      )}

      {showEditSheet && editingWine && (
        <Suspense fallback={<SheetSkeleton />}>
          <WineSheet
            mode="edit"
            initial={editingWine}
            onClose={() => {
              setShowEditSheet(false)
              setEditingWine(null)
            }}
            onSaved={handleWineSaved}
          />
        </Suspense>
      )}

      {selectedWine && (
        <Suspense fallback={<DrawerSkeleton />}>
          <WineDetailDrawer
            wine={selectedWine}
            onClose={() => {
              setSelectedWine(null)
              setFocusOnSuggestions(false)
            }}
            onEdit={handleEditWine}
            onWineUpdated={handleWineUpdated}
            focusOnSuggestions={focusOnSuggestions}
          />
        </Suspense>
      )}

      {/* Toast Host */}
      <ToastHost />

      {/* QA Checklist Overlay - Dev Only */}
      <QAChecklistOverlay />
    </div>
  )
}

export default App