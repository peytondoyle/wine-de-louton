import React, { useState, useEffect } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import CellarMap from './CellarMap'
import { useCellar } from '../../hooks/useCellar'
import { listWines } from '../wines/data/wines'
import type { Wine } from '../../types'
import type { RawSlot } from '../../types/cellarMap'

interface CellarViewProps {
  onBack: () => void
  onWineClick: (wine: Wine) => void
}

export default function CellarView({ onBack, onWineClick }: CellarViewProps) {
  const { loadFridgeLayouts, loadWinesInFridge, loading: cellarLoading } = useCellar()
  const [wines, setWines] = useState<Wine[]>([])
  const [fridgeLayout, setFridgeLayout] = useState<{ shelves: number; columns: number }>({ shelves: 12, columns: 7 })
  const [cellarSlots, setCellarSlots] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load wines for display labels
        const wineList = await listWines()
        setWines(wineList)
        
        // Load fridge layouts (use first one or default)
        const layouts = await loadFridgeLayouts()
        if (layouts.length > 0) {
          setFridgeLayout({ shelves: layouts[0].shelves, columns: layouts[0].columns })
        }
        
        // Load wines in fridge (this gives us the slot data)
        if (layouts.length > 0) {
          const winesInFridge = await loadWinesInFridge(layouts[0].id)
          setCellarSlots(winesInFridge)
        }
        
      } catch (error) {
        console.error('Failed to load cellar data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadData()
  }, [loadFridgeLayouts, loadWinesInFridge])

  if (cellarLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading cellar map...</p>
        </div>
      </div>
    )
  }

  const config = { 
    rows: fridgeLayout.shelves, 
    cols: fridgeLayout.columns 
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

  const handlePlace = (slotId: string) => {
    // Parse slot ID: "row-col-depth"
    const [row, col, depth] = slotId.split('-')
    const depthPosition = depth === "F" ? 1 : 2 // Convert back to enum
    
    console.log(`Place wine at row ${row}, col ${col}, depth ${depth}`)
    // TODO: Implement actual placement logic
    // This would call your existing placement function
  }

  const handleWineClick = (wineId: string) => {
    const wine = wines.find(w => w.id === wineId)
    if (wine) {
      onWineClick(wine)
    }
  }

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

      {/* Map */}
      <CellarMap
        rawSlots={rawSlots}
        config={config}
        onPlace={handlePlace}
        onWineClick={handleWineClick}
      />
    </div>
  )
}
