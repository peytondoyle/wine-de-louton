import React, { useState, useEffect } from 'react'
import { FridgeLayout, OccupancySlot, DepthPosition } from '../types'
import { CellarVisualization } from './CellarVisualization'
import { CellarSlotDetail } from './CellarVisualization'
import { LocationChip } from './LocationChip'
import { Card } from './ui/Card'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { Badge } from './ui/Badge'
import { useCellar } from '../hooks/useCellar'
import { getFridgeLayouts } from '../features/cellar/data/cellar'
import { StepIndicator } from './StepIndicator'

interface CellarManagementProps {
  className?: string
  selectedWineId?: string | null
  onPlacementComplete?: (shelf: number, column: number, depth: number) => void
  showStepIndicator?: boolean
}

export function CellarManagement({ className = '', selectedWineId, onPlacementComplete, showStepIndicator = false }: CellarManagementProps) {
  const {
    loading,
    error,
    clearError,
    loadFridgeLayouts,
    loadFridgeOccupancy,
    loadUnassignedWines,
    loadWinesInFridge,
    assignWine,
    removeWine,
    formatLocation
  } = useCellar()

  const [fridgeLayouts, setFridgeLayouts] = useState<FridgeLayout[]>([])
  const [selectedFridgeId, setSelectedFridgeId] = useState<string>('')
  const [selectedSlot, setSelectedSlot] = useState<OccupancySlot | null>(null)
  const [unassignedWines, setUnassignedWines] = useState<any[]>([])
  const [winesInFridge, setWinesInFridge] = useState<any[]>([])

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      const layouts = await loadFridgeLayouts()
      setFridgeLayouts(layouts)
      if (layouts.length > 0) {
        setSelectedFridgeId(layouts[0].fridge_id)
      }
    }
    loadInitialData()
  }, [loadFridgeLayouts])

  // Load data when fridge selection changes
  useEffect(() => {
    if (selectedFridgeId) {
      loadUnassignedWines().then(setUnassignedWines)
      loadWinesInFridge(selectedFridgeId).then(setWinesInFridge)
    }
  }, [selectedFridgeId, loadUnassignedWines, loadWinesInFridge])

  const handleSlotClick = (slot: OccupancySlot) => {
    setSelectedSlot(slot)
  }

  const handleWineClick = (wineId: string) => {
    // Navigate to wine detail or open wine drawer
    console.log('Navigate to wine:', wineId)
  }

  const handleLongPress = (slot: OccupancySlot) => {
    if (selectedWineId) {
      // If a wine is selected, confirm placement immediately
      handleAssignWine(slot)
    } else {
      // If no wine is selected, open add/edit drawer with prefilled coordinates
      // For now, just select the slot and show a message
      setSelectedSlot(slot)
      console.log('Long press: Open add/edit drawer for slot', slot)
      // TODO: Open wine add/edit drawer with prefilled coordinates
    }
  }

  const handleAssignWine = async (slot: OccupancySlot) => {
    if (unassignedWines.length === 0) {
      alert('No unassigned wines available')
      return
    }

    // For now, assign the first unassigned wine
    // In a real implementation, you'd show a wine selection dialog
    const wine = unassignedWines[0]
    
    const result = await assignWine(
      wine.id,
      selectedFridgeId,
      slot.shelf,
      slot.column_position,
      slot.depth
    )

    if (result) {
      // Refresh data
      loadUnassignedWines().then(setUnassignedWines)
      loadWinesInFridge(selectedFridgeId).then(setWinesInFridge)
      setSelectedSlot(null)
    }
  }

  const handlePlaceBottle = async (shelf: number, column: number, depth: DepthPosition) => {
    if (unassignedWines.length === 0) {
      alert('No unassigned wines available')
      return
    }

    // For now, assign the first unassigned wine
    // In a real implementation, you'd show a wine selection dialog
    const wine = unassignedWines[0]
    
    const result = await assignWine(
      wine.id,
      selectedFridgeId,
      shelf,
      column,
      depth
    )

    if (result) {
      // Refresh data
      loadUnassignedWines().then(setUnassignedWines)
      loadWinesInFridge(selectedFridgeId).then(setWinesInFridge)
      setSelectedSlot(null)
      
      // Call placement complete callback
      onPlacementComplete?.(shelf, column, depth)
    }
  }

  const handleRemoveWine = async (slot: OccupancySlot) => {
    if (!slot.wine_id) return

    // Find the slot ID from the wines in fridge data
    const slotData = winesInFridge.find(w => w.wine_id === slot.wine_id)
    if (!slotData) return

    const success = await removeWine(slotData.id)
    if (success) {
      // Refresh data
      loadUnassignedWines().then(setUnassignedWines)
      loadWinesInFridge(selectedFridgeId).then(setWinesInFridge)
      setSelectedSlot(null)
    }
  }

  const selectedFridge = fridgeLayouts.find(f => f.fridge_id === selectedFridgeId)

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card className="p-6">
          <div className="text-center">
            <div className="text-red-600 mb-2">Error loading cellar data</div>
            <div className="text-sm text-gray-500 mb-4">{error}</div>
            <Button onClick={clearError}>Dismiss</Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Cellar Management</h2>
          <p className="text-gray-600">Manage wine storage and occupancy</p>
        </div>
        
        {/* Fridge Selection */}
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Fridge:</label>
          <div className="w-48">
            <Select
              value={selectedFridgeId}
              onValueChange={setSelectedFridgeId}
            >
            {fridgeLayouts.map(layout => (
              <option key={layout.fridge_id} value={layout.fridge_id}>
                {layout.name}
              </option>
            ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Stats */}
      {selectedFridge && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="text-sm text-gray-600">Total Capacity</div>
            <div className="text-2xl font-bold">
              {selectedFridge.shelves * selectedFridge.columns * 2}
            </div>
            <div className="text-xs text-gray-500">
              {selectedFridge.shelves} shelves × {selectedFridge.columns} columns × 2 depths
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600">Wines in Fridge</div>
            <div className="text-2xl font-bold">{winesInFridge.length}</div>
            <div className="text-xs text-gray-500">
              Currently stored
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="text-sm text-gray-600">Unassigned Wines</div>
            <div className="text-2xl font-bold">{unassignedWines.length}</div>
            <div className="text-xs text-gray-500">
              Available to assign
            </div>
          </Card>
        </div>
      )}

      {/* Step Indicator */}
      {showStepIndicator && (
        <div className="mb-6">
          <StepIndicator
            currentStep={2}
            totalSteps={2}
            title="Step 2 of 2: Choose location"
          />
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cellar Visualization */}
        <div className="lg:col-span-2">
          <CellarVisualization
            fridgeId={selectedFridgeId}
            onSlotClick={handleSlotClick}
            onWineClick={handleWineClick}
            onLongPress={handleLongPress}
            selectedWineId={selectedWineId}
            onPlaceBottle={handlePlaceBottle}
          />
        </div>

        {/* Slot Details & Actions */}
        <div className="space-y-4">
          {selectedSlot ? (
            <CellarSlotDetail
              slot={selectedSlot}
              onWineClick={handleWineClick}
              onAssignWine={handleAssignWine}
              onRemoveWine={handleRemoveWine}
            />
          ) : (
            <Card className="p-4">
              <div className="text-center text-gray-500">
                <div className="text-sm">Click on a slot to view details</div>
              </div>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Quick Actions</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // Show unassigned wines dialog
                  console.log('Show unassigned wines')
                }}
              >
                View Unassigned Wines ({unassignedWines.length})
              </Button>
              
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  // Show wines in fridge dialog
                  console.log('Show wines in fridge')
                }}
              >
                View All Wines in Fridge ({winesInFridge.length})
              </Button>
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-4">
            <h4 className="font-medium mb-3">Recent Activity</h4>
            <div className="space-y-2 text-sm">
              {winesInFridge.slice(0, 5).map((wine, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="truncate">
                    {wine.wines.producer}
                    {wine.wines.wine_name && ` - ${wine.wines.wine_name}`}
                  </div>
                  <LocationChip
                    shelf={wine.shelf}
                    column={wine.column_position}
                    depth={wine.depth}
                    variant="outline"
                  />
                </div>
              ))}
              {winesInFridge.length === 0 && (
                <div className="text-gray-500 text-center py-2">
                  No wines in fridge
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
