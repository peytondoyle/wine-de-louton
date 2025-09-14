import React, { useState } from 'react'
import type { Wine } from '../types'
import { WineStatus } from '../types'
import { displayWineTitle, countryFlag, stateBadge, formatSize, countryName } from '../lib/format'
import { updateWine, getWine } from '../data/wines'
import { retryEnrichment, requestEnrichment } from '../data/enrich'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Label } from './ui/Label'
import { 
  Edit, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Check,
  X,
  Award,
  AlertCircle,
  MoreVertical
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Field component for consistent field display
function Field({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value || value === '' || value === null || value === undefined) return null
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className="text-sm text-neutral-700">{value}</div>
    </div>
  )
}

// StatusPill component for status display
function StatusPill({ status }: { status: WineStatus }) {
  return (
    <Badge 
      variant={status === WineStatus.DRUNK ? "secondary" : "default"}
      className="rounded-full px-2.5 py-0.5 text-xs"
    >
      {status === WineStatus.DRUNK ? 'Drunk' : 'Cellared'}
    </Badge>
  )
}

// ConfidenceBadge component for AI confidence display
function ConfidenceBadge({ confidence }: { confidence?: number }) {
  if (confidence === null || confidence === undefined) {
    return (
      <Badge variant="outline" className="bg-neutral-100 text-neutral-600 border-neutral-300">
        Unknown
      </Badge>
    )
  }
  
  const percentage = Math.round(confidence * 100)
  
  if (confidence >= 0.75) {
    return (
      <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
        High ({percentage}%)
      </Badge>
    )
  } else if (confidence >= 0.5) {
    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300">
        Medium ({percentage}%)
      </Badge>
    )
  } else {
    return (
      <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
        Low ({percentage}%)
      </Badge>
    )
  }
}

interface WineDetailDrawerProps {
  wine: Wine | null
  onClose: () => void
  onEdit: (wine: Wine) => void
  onWineUpdated: (wine: Wine) => void
}

export function WineDetailDrawer({ wine, onClose, onEdit, onWineUpdated }: WineDetailDrawerProps) {
  const [applying, setApplying] = useState(false)
  const [dismissing, setDismissing] = useState(false)
  const [hideSuggestions, setHideSuggestions] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [showKebabMenu, setShowKebabMenu] = useState(false)
  const [lastAi, setLastAi] = useState<any>(null)
  const [lastConfidence, setLastConfidence] = useState<number | null>(null)
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [showTastingNotes, setShowTastingNotes] = useState(false)
  const descriptionId = React.useId()

  // Reset state when wine changes (different wine selected)
  React.useEffect(() => {
    if (wine) {
      setHideSuggestions(false)
      // Clear any existing undo state when switching wines
      setLastAi(null)
      setLastConfidence(null)
      if (undoTimer) {
        clearTimeout(undoTimer)
        setUndoTimer(null)
      }
    }
  }, [wine?.id, undoTimer])

  // Close kebab menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showKebabMenu) {
        setShowKebabMenu(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showKebabMenu])

  // Cleanup undo timer on unmount
  React.useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer)
      }
    }
  }, [undoTimer])

  if (!wine) return null

  const applySuggestions = async () => {
    if (!wine.ai_enrichment) return

    // Guard duplicate clicks
    if (applying) return

    // Guard on low confidence
    const confidence = wine.ai_confidence || wine.ai_enrichment.confidence
    if (confidence && confidence < 0.75) {
      const percentage = Math.round(confidence * 100)
      if (window.confirm(`Confidence is only ${percentage}%. Apply anyway?`) === false) {
        return
      }
    }

    setApplying(true)
    try {
      // Build patch from ai_enrichment
      const patch: Partial<Wine> = {}
      
      if (wine.ai_enrichment.drink_window) {
        patch.drink_window_from = wine.ai_enrichment.drink_window.from_year
        patch.drink_window_to = wine.ai_enrichment.drink_window.to_year
        patch.drink_now = !!wine.ai_enrichment.drink_window.drink_now
      }
      
      if (wine.ai_enrichment.possible_scores?.wine_spectator?.score != null && (wine.score_wine_spectator == null)) {
        patch.score_wine_spectator = wine.ai_enrichment.possible_scores.wine_spectator.score
      }
      
      if (wine.ai_enrichment.possible_scores?.james_suckling?.score != null && (wine.score_james_suckling == null)) {
        patch.score_james_suckling = wine.ai_enrichment.possible_scores.james_suckling.score
      }

      if (Object.keys(patch).length > 0) {
        // Save AI data for undo before clearing
        setLastAi(wine.ai_enrichment)
        setLastConfidence(wine.ai_confidence ?? null)
        
        await updateWine(wine.id, patch)
        
        // Clear AI fields so suggestions no longer exist
        await updateWine(wine.id, { ai_enrichment: null, ai_confidence: null })
        
        setHideSuggestions(true)
        const updatedWine = await getWine(wine.id)
        if (updatedWine) {
          onWineUpdated(updatedWine)
        }
        
        // Show undo toast
        toast.success('Applied suggestions', {
          duration: 6000
        })
        
        // Set timer to clear undo state after 6 seconds
        const timer = setTimeout(() => {
          setLastAi(null)
          setLastConfidence(null)
          setUndoTimer(null)
        }, 6000)
        setUndoTimer(timer)
      } else {
        toast('No suggestions to apply (manual fields already filled)')
      }
    } catch (error) {
      console.error('Error applying suggestions:', error)
      toast.error(`Failed to apply suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setApplying(false)
    }
  }

  const dismissSuggestions = async () => {
    // Guard duplicate clicks
    if (dismissing) return
    
    setDismissing(true)
    try {
      // Save AI data for undo before clearing
      setLastAi(wine.ai_enrichment)
      setLastConfidence(wine.ai_confidence ?? null)
      
      await updateWine(wine.id, { ai_enrichment: null, ai_confidence: null })
      setHideSuggestions(true)
      const updatedWine = await getWine(wine.id)
      if (updatedWine) {
        onWineUpdated(updatedWine)
      }
      
      // Show undo toast
      toast('Suggestions dismissed', {
        duration: 6000
      })
      
      // Set timer to clear undo state after 6 seconds
      const timer = setTimeout(() => {
        setLastAi(null)
        setLastConfidence(null)
        setUndoTimer(null)
      }, 6000)
      setUndoTimer(timer)
    } catch (error) {
      console.error('Error dismissing suggestions:', error)
      toast.error('Failed to dismiss suggestions')
    } finally {
      setDismissing(false)
    }
  }

  const handleRetryEnrichment = async () => {
    setRetrying(true)
    try {
      const result = await retryEnrichment(wine.id)
      if (result) {
        // Refresh the wine data to get the updated enrichment
        const updatedWine = await getWine(wine.id)
        if (updatedWine) {
          onWineUpdated(updatedWine)
          toast.success('AI suggestions refreshed')
        }
      } else {
        toast.error('Failed to fetch suggestions')
      }
    } catch (error) {
      console.error('Error retrying enrichment:', error)
      toast.error('Failed to retry enrichment')
    } finally {
      setRetrying(false)
    }
  }

  const handleUndo = async () => {
    if (!lastAi) return
    
    try {
      await updateWine(wine.id, {
        ai_enrichment: lastAi,
        ai_confidence: lastConfidence,
      })
      setHideSuggestions(false)
      const updatedWine = await getWine(wine.id)
      if (updatedWine) {
        onWineUpdated(updatedWine)
      }
      toast.success('Suggestions restored')
      
      // Clear undo state
      setLastAi(null)
      setLastConfidence(null)
      if (undoTimer) {
        clearTimeout(undoTimer)
        setUndoTimer(null)
      }
    } catch (error) {
      console.error('Error undoing:', error)
      toast.error('Failed to restore suggestions')
    }
  }

  const handleReEnrich = async () => {
    // Check cooldown
    if (Date.now() < cooldownUntil) {
      toast('Please wait before re-enriching again')
      return
    }
    
    try {
      const min = {
        id: wine.id,
        producer: wine.producer,
        vintage: wine.vintage ?? undefined,
        wine_name: wine.wine_name ?? undefined,
        appellation: wine.appellation ?? undefined,
        region: wine.region ?? undefined,
        country_code: wine.country_code ?? undefined,
      }
      const result = await requestEnrichment(min)
      if (!result) {
        toast('No suggestions returned')
        return
      }
      await updateWine(wine.id, {
        ai_enrichment: result,
        ai_confidence: result.confidence ?? 0,
      })
      setHideSuggestions(false)
      const updatedWine = await getWine(wine.id)
      if (updatedWine) {
        onWineUpdated(updatedWine)
      }
      toast.success('New suggestions ready')
      
      // Set cooldown
      setCooldownUntil(Date.now() + 15000)
    } catch (error) {
      console.error('Error re-enriching:', error)
      toast.error('Re-enrich failed')
    }
  }


  const showSuggestions = !hideSuggestions && wine.ai_enrichment
  const showError = wine.ai_last_error && !wine.ai_enrichment && !hideSuggestions

  const titleId = React.useId()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="surface w-[min(720px,92vw)] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <DialogHeader>
          <DialogTitle id={titleId} className="flex items-center gap-2">
            <span className="text-2xl" aria-label={`Country ${countryName(wine.country_code)}`}>
              {countryFlag(wine.country_code)}
            </span>
            {displayWineTitle(wine)}
          </DialogTitle>
          <p id={descriptionId} className="sr-only">
            Details for the selected wine bottle including identity, logistics, ratings, critic scores, and AI suggestions.
          </p>
        </DialogHeader>
        
        <div className="section space-y-4">
          {/* Header row: actions on right */}
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => onEdit(wine)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKebabMenu(!showKebabMenu)}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              {showKebabMenu && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
                  <button
                    onClick={async () => {
                      setShowKebabMenu(false)
                      await handleReEnrich()
                    }}
                    disabled={Date.now() < cooldownUntil}
                    className={`w-full px-4 py-2 text-left text-sm first:rounded-t-md last:rounded-b-md ${
                      Date.now() < cooldownUntil
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-neutral-700 hover:bg-neutral-50'
                    }`}
                  >
                    Re-enrich Suggestions
                    {Date.now() < cooldownUntil && (
                      <span className="ml-2 text-xs text-neutral-400">
                        (cooldown)
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* AI Suggestions Panel */}
          {showSuggestions && (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Suggested Enrichment</h3>
                  <p className="muted">Unverified — review before applying.</p>
                </div>
                <ConfidenceBadge confidence={wine.ai_confidence} />
              </div>

              <div className="mt-4 space-y-3">
                {/* Tasting Notes - Collapsible */}
                {wine.ai_enrichment?.tasting_notes && (
                  <div>
                    <Button
                      variant="ghost"
                      className="justify-start p-0 h-auto hover:bg-transparent hover:text-inherit"
                      onClick={() => setShowTastingNotes(!showTastingNotes)}
                    >
                      <Label className="text-sm font-medium text-neutral-900 cursor-pointer">
                        Tasting Notes
                        {showTastingNotes ? (
                          <ChevronUp className="h-4 w-4 ml-2 inline" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-2 inline" />
                        )}
                      </Label>
                    </Button>
                    {showTastingNotes && (
                      <p className="text-sm text-neutral-600 mt-2">
                        {wine.ai_enrichment.tasting_notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Drink Window - Single Line */}
                {wine.ai_enrichment?.drink_window && (
                  <div className="text-sm text-neutral-700">
                    {wine.ai_enrichment.drink_window.from_year}–{wine.ai_enrichment.drink_window.to_year}
                    {wine.ai_enrichment.drink_window.drink_now && ' • Drink now'}
                  </div>
                )}

                {/* Sources */}
                {wine.ai_enrichment?.possible_scores && (
                  <div className="text-sm text-neutral-600">
                    Sources: {[
                      wine.ai_enrichment.possible_scores.wine_spectator && 'Wine Spectator',
                      wine.ai_enrichment.possible_scores.james_suckling && 'James Suckling'
                    ].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>

              {/* Commit Actions */}
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={applySuggestions} 
                  disabled={applying}
                  aria-busy={applying}
                  className="sm:w-auto w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {applying ? 'Applying…' : 'Apply'}
                </Button>
                <Button 
                  onClick={dismissSuggestions} 
                  variant="outline" 
                  disabled={dismissing}
                  aria-busy={dismissing}
                  className="sm:w-auto w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  {dismissing ? 'Dismissing…' : 'Dismiss'}
                </Button>
              </div>
            </div>
          )}

          {/* AI Error Panel */}
          {showError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-red-900">AI Suggestions</h3>
                  <p className="text-sm text-red-600">Couldn't fetch suggestions (tap to retry).</p>
                </div>
                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                  Error
                </Badge>
              </div>
              
              <div className="mt-3 flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleRetryEnrichment}
                  disabled={retrying}
                  aria-busy={retrying}
                  className="sm:w-auto w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  {retrying ? 'Retrying…' : 'Retry'}
                </Button>
                <Button
                  onClick={dismissSuggestions}
                  variant="outline"
                  disabled={dismissing}
                  aria-busy={dismissing}
                  className="sm:w-auto w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  {dismissing ? 'Dismissing…' : 'Dismiss'}
                </Button>
              </div>
            </div>
          )}

          {/* Overview Section */}
          <section>
            <h4 className="eyebrow mb-2">Overview</h4>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <Field label="Producer" value={wine.producer} />
              <Field label="Vintage" value={wine.vintage ?? 'NV'} />
              <Field label="Region" value={wine.region} />
              <Field label="Bottle Size" value={formatSize(wine.bottle_size)} />
              <Field label="Status" value={<StatusPill status={wine.status} />} />
              {wine.wine_name && <Field label="Wine Name" value={wine.wine_name} />}
              {wine.vineyard && <Field label="Vineyard" value={wine.vineyard} />}
              {wine.appellation && <Field label="Appellation" value={wine.appellation} />}
              {wine.purchase_date && <Field label="Purchase Date" value={wine.purchase_date} />}
              {wine.purchase_place && <Field label="Purchase Place" value={wine.purchase_place} />}
              {wine.location_row && (
                <Field 
                  label="Location" 
                  value={`Row ${wine.location_row}${wine.location_position ? `, Position ${wine.location_position}` : ''}`} 
                />
              )}
              {wine.drank_on && <Field label="Drank On" value={wine.drank_on} />}
            </div>
            {wine.varietals && wine.varietals.length > 0 && (
              <div className="mt-3">
                <div className="eyebrow mb-2">Varietals</div>
                <div className="flex flex-wrap gap-1">
                  {wine.varietals.map((varietal, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {varietal}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>
          <div className="divider my-4" />

          {/* Drinking Guidance Section */}
          <section>
            <h4 className="eyebrow mb-2">Drinking Guidance</h4>
            <div className="text-sm">
              {(wine.drink_window_from || wine.drink_window_to) ? (
                <div className="flex items-center gap-2">
                  <span>{wine.drink_window_from ?? '—'}–{wine.drink_window_to ?? '—'}</span>
                  {wine.drink_now && <Badge className="ml-2">Drink now</Badge>}
                </div>
              ) : (
                <span className="muted">No drinking guidance yet.</span>
              )}
            </div>
            {wine.companions && wine.companions.length > 0 && (
              <div className="mt-3">
                <div className="eyebrow mb-2">Food Pairings</div>
                <div className="flex flex-wrap gap-1">
                  {wine.companions.map((companion, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {companion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </section>
          <div className="divider my-4" />

          {/* Ratings & Notes Section */}
          <section>
            <h4 className="eyebrow mb-2">Ratings & Notes</h4>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {wine.peyton_rating && (
                  <div>
                    <div className="eyebrow">Peyton Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-neutral-700">{wine.peyton_rating}</span>
                    </div>
                  </div>
                )}
                {wine.louis_rating && (
                  <div>
                    <div className="eyebrow">Louis Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-neutral-700">{wine.louis_rating}</span>
                    </div>
                  </div>
                )}
                {wine.average_rating && (
                  <div>
                    <div className="eyebrow">Average Rating</div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-neutral-700">{wine.average_rating}</span>
                    </div>
                  </div>
                )}
              </div>
              
              {!wine.peyton_rating && !wine.louis_rating && !wine.average_rating && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 italic">
                  <AlertCircle className="h-4 w-4" />
                  No ratings available
                </div>
              )}
              
              {wine.peyton_notes && (
                <div>
                  <div className="eyebrow mb-1">Peyton Notes</div>
                  <p className="text-sm text-neutral-700">{wine.peyton_notes}</p>
                </div>
              )}
              
              {wine.louis_notes && (
                <div>
                  <div className="eyebrow mb-1">Louis Notes</div>
                  <p className="text-sm text-neutral-700">{wine.louis_notes}</p>
                </div>
              )}
              
              {!wine.peyton_notes && !wine.louis_notes && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 italic">
                  <AlertCircle className="h-4 w-4" />
                  No tasting notes available
                </div>
              )}
            </div>
          </section>
          <div className="divider my-4" />

          {/* Critic Scores Section */}
          <section>
            <h4 className="eyebrow mb-2">Critic Scores</h4>
            <div className="flex flex-wrap gap-2">
              {wine.score_wine_spectator && (
                <Badge variant="outline" className="text-xs px-3 py-1 bg-blue-50 text-blue-700 border-blue-200">
                  Wine Spectator: {wine.score_wine_spectator}
                </Badge>
              )}
              {wine.score_james_suckling && (
                <Badge variant="outline" className="text-xs px-3 py-1 bg-purple-50 text-purple-700 border-purple-200">
                  James Suckling: {wine.score_james_suckling}
                </Badge>
              )}
              {!wine.score_wine_spectator && !wine.score_james_suckling && (
                <div className="flex items-center gap-2 text-sm text-neutral-400 italic">
                  <AlertCircle className="h-4 w-4" />
                  No critic scores available
                </div>
              )}
            </div>
          </section>

          {/* Sticky Action Bar */}
          <div className="sticky bottom-0 -mx-5 -mb-4 bg-white/90 backdrop-blur border-t px-5 py-3 flex items-center justify-end gap-2">
            {!showSuggestions && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(wine)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                {wine.status === WineStatus.CELLARED && (
                  <Button
                    size="sm"
                    onClick={() => {
                      // Handle mark drunk logic here
                      console.log('Mark drunk')
                    }}
                  >
                    Mark Drunk
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReEnrich}
                  disabled={Date.now() < cooldownUntil}
                >
                  Re-enrich
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
