import React, { useState } from 'react'
import { Button } from '../../../components/ui/Button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu'
import { Sparkles, ChevronDown } from 'lucide-react'
import { updateWine } from '../../wines/data/wines'
import { toast } from '../../../lib/toast'
import type { Wine, AIEnrichment } from '../../../types'

interface DevEnrichmentButtonProps {
  wine: Wine
  onWineUpdated: (wine: Wine) => void
}

// High confidence enrichment data
const HIGH_CONFIDENCE_ENRICHMENT: AIEnrichment = {
  drink_window: { from: 2025, to: 2030 },
  tasting_notes: { 
    text: "Rich and complex with notes of dark cherry, blackberry, and subtle oak. Full-bodied with firm tannins and a long, elegant finish. Perfect for aging or drinking now with decanting."
  },
  critic_scores: { wine_spectator: 94, james_suckling: 96 },
  food_pairings: { 
    items: ["Grilled steak", "Aged cheese", "Dark chocolate", "Mushroom risotto"]
  }
}

// Low confidence enrichment data
const LOW_CONFIDENCE_ENRICHMENT: AIEnrichment = {
  drink_window: { from: 2023, to: 2027 },
  tasting_notes: { 
    text: "Fruity and approachable with hints of red berries and light oak. Medium-bodied with soft tannins. Best consumed within the next few years."
  },
  critic_scores: { wine_spectator: 87, james_suckling: 89 },
  food_pairings: { 
    items: ["Pasta", "Pizza", "Light appetizers"]
  }
}

export function DevEnrichmentButton({ wine, onWineUpdated }: DevEnrichmentButtonProps) {
  const [loading, setLoading] = useState(false)

  const injectEnrichment = async (enrichment: AIEnrichment, confidence: number) => {
    setLoading(true)
    try {
      const updatedWine = await updateWine(wine.id, {
        ai_enrichment: enrichment,
        ai_confidence: confidence,
        ai_refreshed_at: new Date().toISOString()
      })
      
      onWineUpdated(updatedWine)
      toast.success(`Injected ${confidence > 0.7 ? 'high' : 'low'} confidence enrichment`)
    } catch (error) {
      console.error('Error injecting enrichment:', error)
      toast.error('Failed to inject enrichment')
    } finally {
      setLoading(false)
    }
  }

  const handleHighConfidence = () => {
    injectEnrichment(HIGH_CONFIDENCE_ENRICHMENT, 0.85)
  }

  const handleLowConfidence = () => {
    injectEnrichment(LOW_CONFIDENCE_ENRICHMENT, 0.45)
  }

  const clearEnrichment = async () => {
    setLoading(true)
    try {
      const updatedWine = await updateWine(wine.id, {
        ai_enrichment: null,
        ai_confidence: null,
        ai_refreshed_at: null
      })
      
      onWineUpdated(updatedWine)
      toast.success('Cleared enrichment data')
    } catch (error) {
      console.error('Error clearing enrichment:', error)
      toast.error('Failed to clear enrichment')
    } finally {
      setLoading(false)
    }
  }

  if (!import.meta.env.DEV) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={loading}
            className="text-xs"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Dev Enrich
            <ChevronDown className="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleHighConfidence} disabled={loading}>
            <div className="flex flex-col">
              <span className="font-medium">High Confidence</span>
              <span className="text-xs text-neutral-500">Score: 94-96, Drink: 2025-2030</span>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLowConfidence} disabled={loading}>
            <div className="flex flex-col">
              <span className="font-medium">Low Confidence</span>
              <span className="text-xs text-neutral-500">Score: 87-89, Drink: 2023-2027</span>
            </div>
          </DropdownMenuItem>
          {wine.ai_enrichment && (
            <DropdownMenuItem onClick={clearEnrichment} disabled={loading} className="text-red-600">
              Clear Enrichment
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
