import { useState, useEffect } from 'react'
import { Plus, Wine as WineIcon, X, Grid3X3, Grid2X2, LayoutGrid } from 'lucide-react'
import type { Wine, ControlsState, BottleSize, WineSortField, WineSortDirection } from './types'
import { WineStatus } from './types'
import { listWines, getWine, markDrunk, updateWine } from './data/wines'
import { pingWines } from './data/_smoke'
import { ControlsBar } from './components/ControlsBar'
import { WineGrid } from './components/WineGrid'
import { WineSheet } from './components/WineSheet'
import { WineDetailDrawer } from './components/WineDetailDrawer'
import { CsvImportButton } from './components/CsvImportButton'
import { Button } from './components/ui/Button'
import { ToastHost } from './components/ToastHost'
import { QAChecklistOverlay } from './components/QAChecklistOverlay'
import { toast } from './lib/toast'
import { toastDrunk, toastError } from './utils/toastMessages'

function App() {
  const [wines, setWines] = useState<Wine[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedWine, setSelectedWine] = useState<Wine | null>(null)
  const [showAddSheet, setShowAddSheet] = useState(false)
  const [showEditSheet, setShowEditSheet] = useState(false)
  const [editingWine, setEditingWine] = useState<Wine | null>(null)
  const [showEmptyStateTip, setShowEmptyStateTip] = useState(true)
  const [winesWithUndo, setWinesWithUndo] = useState<Set<string>>(new Set())
  const [gridDensity, setGridDensity] = useState<'compact' | 'comfortable'>(() => {
    const saved = localStorage.getItem('wine-grid-density')
    return (saved === 'compact' || saved === 'comfortable') ? saved : 'comfortable'
  })
  const [gridViewMode, setGridViewMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wine-grid-view-mode')
    return saved === 'true'
  })

  // Controls state with URL persistence
  const [controls, setControls] = useState<ControlsState>(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      search: params.get('search') || '',
      status: (params.get('status') as WineStatus | 'All') || 'All',
      country_code: params.get('country_code') || '',
      region: params.get('region') || '',
      bottle_size: (params.get('bottle_size') as BottleSize | 'All') || 'All',
      vintageMin: params.get('vintageMin') || '',
      vintageMax: params.get('vintageMax') || '',
      sort: {
        field: (params.get('sortField') as WineSortField) || 'created_at',
        direction: (params.get('sortDirection') as WineSortDirection) || 'desc'
      }
    }
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
      console.log('Supabase smoke test:', result)
    })
  }, [])

  // Load wines when controls change
  useEffect(() => {
    loadWines()
  }, [controls])

  const loadWines = async () => {
    setLoading(true)
    try {
      const filters = {
        status: controls.status === 'All' ? undefined : controls.status,
        country_code: controls.country_code || undefined,
        region: controls.region || undefined,
        bottle_size: controls.bottle_size === 'All' ? undefined : controls.bottle_size,
        vintageMin: controls.vintageMin ? parseInt(controls.vintageMin) : undefined,
        vintageMax: controls.vintageMax ? parseInt(controls.vintageMax) : undefined,
        search: controls.search || undefined,
        sort: controls.sort
      }

      const winesData = await listWines(filters)
      setWines(winesData)
    } catch (error) {
      console.error('Error loading wines:', error)
      toast.error('Load failed')
    } finally {
      setLoading(false)
    }
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
    // Store original state for potential rollback
    const originalWines = [...wines]
    const originalWine = wines.find(w => w.id === id)
    
    if (!originalWine) return
    
    // Determine new status and optimistic update
    const newStatus = originalWine.status === WineStatus.DRUNK ? WineStatus.CELLARED : WineStatus.DRUNK
    const today = new Date().toISOString().split('T')[0]
    
    setWines(prev => prev.map(wine => 
      wine.id === id 
        ? { 
            ...wine, 
            status: newStatus, 
            drank_on: newStatus === WineStatus.DRUNK ? today : undefined 
          }
        : wine
    ))
    
    // Add to undo set
    setWinesWithUndo(prev => new Set(prev).add(id))
    
    try {
      if (newStatus === WineStatus.DRUNK) {
        await markDrunk(id)
        // Visual feedback: wine moves to "Drunk" section
      } else {
        await updateWine(id, { status: WineStatus.CELLARED, drank_on: undefined })
        // Visual feedback: wine moves to "Cellared" section
      }
    } catch (error) {
      // Revert on error
      setWines(originalWines)
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
    // Store original state for potential rollback
    const originalWines = [...wines]
    const originalWine = wines.find(w => w.id === id)
    
    if (!originalWine) return
    
    // Determine new status and optimistic update
    const newStatus = originalWine.status === WineStatus.DRUNK ? WineStatus.CELLARED : WineStatus.DRUNK
    const today = new Date().toISOString().split('T')[0]
    
    setWines(prev => prev.map(wine => 
      wine.id === id 
        ? { 
            ...wine, 
            status: newStatus, 
            drank_on: newStatus === WineStatus.DRUNK ? today : undefined 
          }
        : wine
    ))
    
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
    } catch (error) {
      // Revert on error
      setWines(originalWines)
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

  const handleWineSaved = (wine: Wine) => {
    loadWines() // Refresh the list
    setShowAddSheet(false)
    setShowEditSheet(false)
    setEditingWine(null)
  }

  const handleWineUpdated = (wine: Wine) => {
    // Update the wine in the list
    setWines(prev => prev.map(w => w.id === wine.id ? wine : w))
    // Only update selectedWine if it's the same wine being viewed
    if (selectedWine && selectedWine.id === wine.id) {
      setSelectedWine(wine)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-b">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold tracking-tight">Wines de Louton</h1>
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
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
        {/* Controls */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:gap-4">
          <ControlsBar value={controls} onChange={setControls} />
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
                      <p className="text-sm text-blue-700">
                        You only need to enter the <strong>producer</strong> to add a wine. 
                        AI will automatically suggest drink windows, scores, and tasting notes!
                      </p>
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
          density={gridDensity}
          winesWithUndo={winesWithUndo}
          gridViewMode={gridViewMode}
        />
        )}
      </div>

      {/* Modals */}
      {showAddSheet && (
        <WineSheet
          mode="add"
          onClose={() => setShowAddSheet(false)}
          onSaved={handleWineSaved}
        />
      )}

      {showEditSheet && editingWine && (
        <WineSheet
          mode="edit"
          initial={editingWine}
          onClose={() => {
            setShowEditSheet(false)
            setEditingWine(null)
          }}
          onSaved={handleWineSaved}
        />
      )}

      {selectedWine && (
        <WineDetailDrawer
          wine={selectedWine}
          onClose={() => setSelectedWine(null)}
          onEdit={handleEditWine}
          onWineUpdated={handleWineUpdated}
        />
      )}

      {/* Toast Host */}
      <ToastHost />

      {/* QA Checklist Overlay - Dev Only */}
      <QAChecklistOverlay />
    </div>
  )
}

export default App