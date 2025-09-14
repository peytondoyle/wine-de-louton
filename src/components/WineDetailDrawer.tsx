import React, { useState } from 'react'
import type { Wine } from '../types'
import { WineStatus } from '../types'
import { displayWineTitle, displayTitle, countryFlag, stateBadge, formatSize, formatDate, countryName } from '../lib/format'
import { updateWine, getWine } from '../data/wines'
import { retryEnrichment, requestEnrichment } from '../data/enrich'
import { cn } from '../lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import { Label } from './ui/Label'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/DropdownMenu'
import { ConfidenceMeter } from './ConfidenceMeter'
import { 
  Edit, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Check,
  X,
  Award,
  AlertCircle,
  MoreVertical,
  MoreHorizontal,
  MapPin,
  Wine as WineIcon,
  WineOff,
  Grid3X3,
  Store,
  Calendar,
  Pencil,
  Info,
  Loader2
} from 'lucide-react'
import { toast } from 'react-hot-toast'

// Helper components
const Divider = () => <div className="-mx-5 border-t border-neutral-200/70" />;

function Section({ title, children, className }: React.PropsWithChildren<{ title: string; className?: string }>) {
  return (
    <section className={cn("py-3", className)}>
      <h4 className="text-[11px] font-medium tracking-wide uppercase text-neutral-500 mb-2">{title}</h4>
      <div>{children}</div>
    </section>
  );
}

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

// Chip component for displaying wine metadata
const Chip = ({ icon, children }: { icon?: string; children: React.ReactNode }) => {
  const IconComponent = icon ? getIconComponent(icon) : null
  
  return (
    <Badge variant="neutral" className="inline-flex items-center gap-1">
      {IconComponent && <IconComponent className="size-3.5 text-neutral-500" aria-hidden="true" />}
      <span>{children}</span>
    </Badge>
  )
}

// StatusPill component for status display
function StatusPill({ status }: { status: WineStatus }) {
  return (
    <Badge variant={status === WineStatus.DRUNK ? 'danger' : 'success'} className="inline-flex items-center gap-1">
      {status === WineStatus.DRUNK ? (
        <WineOff className="size-3.5" aria-hidden="true" />
      ) : (
        <Check className="size-3.5" aria-hidden="true" />
      )}
      {status === WineStatus.DRUNK ? "Drunk" : "Cellared"}
    </Badge>
  )
}

// Helper function to get icon components
function getIconComponent(iconName: string) {
  const iconMap: Record<string, any> = {
    'map-pin': MapPin,
    'wine': WineIcon,
    'grid-3x3': Grid3X3,
    'store': Store,
    'calendar': Calendar,
  }
  return iconMap[iconName] || null
}

// Empty state component
const Empty = ({ children, onAdd }: { children: React.ReactNode; onAdd?: () => void }) => (
  <div className="flex items-start gap-2 text-neutral-600">
    <Info className="mt-0.5 size-4 text-neutral-400" aria-hidden="true" />
    <div className="flex-1">
      <div className="text-[13px]">{children}</div>
      {onAdd && <Button variant="ghost" size="sm" className="mt-1 px-0 h-7" onClick={onAdd}>Add now</Button>}
    </div>
  </div>
)

// Helper functions to determine if sections have content
const hasRatings = (wine: Wine) => !!(wine.peyton_rating || wine.louis_rating || wine.average_rating)
const hasNotes = (wine: Wine) => !!(wine.peyton_notes || wine.louis_notes)
const hasCritics = (wine: Wine) => !!(wine.score_wine_spectator || wine.score_james_suckling)



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
  const [reenriching, setReenriching] = useState(false)
  const [lastAi, setLastAi] = useState<any>(null)
  const [lastConfidence, setLastConfidence] = useState<number | null>(null)
  const [undoTimer, setUndoTimer] = useState<NodeJS.Timeout | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(0)
  const [showTastingNotes, setShowTastingNotes] = useState(false)
  const [compact, setCompact] = useState(false)
  
  // Re-enrich cooldown state
  const COOLDOWN_S = 20
  const [cooldown, setCooldown] = useState<number>(0)
  const [reenrichError, setReenrichError] = useState<string | null>(null)
  const heroRef = React.useRef<HTMLDivElement>(null)
  const titleId = React.useId()
  const descId = React.useId()

  // Early return if wine is null
  if (!wine) return null

  // Copy title to clipboard
  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(displayTitle(wine))
      toast.success('Copied bottle title')
    } catch (err) {
      toast.error('Failed to copy')
    }
  }

  // Handle double-click to edit
  const handleTitleDoubleClick = () => {
    onEdit(wine)
  }

  // Toggle wine status
  const handleToggleStatus = async () => {
    try {
      const newStatus = wine.status === WineStatus.DRUNK ? WineStatus.CELLARED : WineStatus.DRUNK
      const updatedWine = await updateWine(wine.id, { status: newStatus })
      onWineUpdated(updatedWine)
      toast.success(newStatus === WineStatus.DRUNK ? 'Marked as drunk' : 'Marked as cellared')
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

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
      // Reset cooldown when switching wines
      setCooldown(0)
      // Clear re-enrich error when switching wines
      setReenrichError(null)
    }
  }, [wine?.id, undoTimer])


  // Cleanup undo timer on unmount
  React.useEffect(() => {
    return () => {
      if (undoTimer) {
        clearTimeout(undoTimer)
      }
    }
  }, [undoTimer])

  // Cooldown timer
  React.useEffect(() => {
    if (cooldown <= 0) return
    const t = setInterval(() => setCooldown((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [cooldown])

  // Scroll observer for sticky header
  React.useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setCompact(!entry.isIntersecting)
      },
      { threshold: 0, rootMargin: '-24px 0px 0px 0px' }
    )

    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

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
        
        // Apply the patch first
        await updateWine(wine.id, patch)
        
        // Clear AI fields so suggestions no longer exist
        await updateWine(wine.id, { ai_enrichment: null, ai_confidence: null })
        
        // Get updated wine data
        const updatedWine = await getWine(wine.id)
        if (updatedWine) {
          onWineUpdated(updatedWine)
        }
        
        // Show success toast
        toast.success('Suggestions applied')
        
        // Hide suggestions panel AFTER successful update
        setHideSuggestions(true)
        
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

  const handleReenrich = async () => {
    if (reenriching) return
    
    setReenriching(true)
    setReenrichError(null) // Clear any previous error
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
      const res = await requestEnrichment(min)
      if (!res) {
        setReenrichError('No suggestions returned. Check your connection and try again.')
        return
      }
      await updateWine(wine.id, {
        ai_enrichment: res,
        ai_confidence: res.confidence ?? null,
        ai_refreshed_at: new Date().toISOString()
      })
      setHideSuggestions(false)
      const updatedWine = await getWine(wine.id)
      if (updatedWine) {
        onWineUpdated(updatedWine)
      }
      toast.success('New suggestions ready.')
      
      // Start cooldown after successful re-enrich
      setCooldown(COOLDOWN_S)
    } catch (e) {
      console.error('[AI] reenrich:error', e)
      setReenrichError('Couldn\'t refresh suggestions. Check your connection and try again.')
    } finally {
      setReenriching(false)
    }
  }


  const showSuggestions = !hideSuggestions && wine.ai_enrichment
  const showError = wine.ai_last_error && !wine.ai_enrichment && !hideSuggestions

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="surface w-[min(720px,92vw)] fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50"
      >
        <p id={descId} className="sr-only">
          Detail view for this wine. Sections include Overview, Drinking Guidance, Ratings and Critic Scores.
        </p>

        <div className="max-h-[78vh] flex flex-col" style={{ isolation: 'isolate' }}>
          {/* Sticky micro-header */}
          <div className={`sticky top-0 z-10 -mx-5 -mt-3 px-5 py-3 bg-white/95 backdrop-blur-sm border-b border-neutral-200/80 shadow-sm transition-all duration-200 ${
            compact ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
          }`} style={{ isolation: 'isolate' }}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {countryFlag(wine.country_code)}
                <span className="truncate font-medium text-neutral-900">{displayTitle(wine)}</span>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="text-xs" aria-label="More options">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={async () => await handleReenrich()}
                      disabled={reenriching || cooldown > 0}
                    >
                      {reenriching ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Refreshing…
                        </>
                      ) : cooldown > 0 ? (
                        `Re-enrich in ${cooldown}s`
                      ) : (
                        'Re-enrich Suggestions'
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="min-h-0 overflow-auto px-5 pb-3">

        <div className="px-5 py-0">
          {/* Hero header */}
          <header className="mb-3" ref={heroRef}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle id={titleId} className="flex items-center gap-2 text-xl sm:text-2xl font-semibold">
                  <span aria-label={`Country ${countryName(wine.country_code)}`}>{countryFlag(wine.country_code)}</span>
                  <span className="truncate">{displayTitle(wine)}</span>
                </DialogTitle>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] leading-5 text-neutral-700">
                  {wine.region && <Chip icon="map-pin">{wine.region}</Chip>}
                  {wine.bottle_size && <Chip icon="wine">{formatSize(wine.bottle_size)}</Chip>}
                  <StatusPill status={wine.status} />
                </div>
              </div>

              {/* Optional: keep kebab menu in top-right */}
              <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" aria-label="More actions">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={async () => await handleReenrich()}
                      disabled={reenriching || cooldown > 0}
                    >
                      {reenriching ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Refreshing…
                        </>
                      ) : cooldown > 0 ? (
                        `Re-enrich in ${cooldown}s`
                      ) : (
                        'Re-enrich Suggestions'
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          <Divider />

          {/* Loading state for re-enrichment */}
          {reenriching && (
            <div className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Suggested Enrichment</h3>
                  <p className="muted">Unverified — review before applying.</p>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceMeter value={wine.ai_confidence ?? undefined} />
                  <span className="rounded-full border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 text-[12px] text-neutral-600">
                    <Loader2 className="mr-1 size-3 animate-spin inline" /> Refreshing…
                  </span>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-3 w-1/3 rounded bg-neutral-200/60" />
                <div className="h-3 w-2/3 rounded bg-neutral-200/50" />
                <div className="h-3 w-1/2 rounded bg-neutral-200/50" />
              </div>
              <p className="mt-2 text-[12px] text-neutral-500">
                AI enrichment from OpenAI. Review before applying.
              </p>
            </div>
          )}

          {/* AI Suggestions Panel */}
          {showSuggestions && !reenriching && (
            <div className="py-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Suggested Enrichment</h3>
                  <p className="muted">Unverified — review before applying.</p>
                </div>
                <div className="flex items-center gap-2">
                  <ConfidenceMeter value={wine.ai_confidence ?? undefined} />
                  {wine.ai_refreshed_at && (
                    <span className="rounded-full border border-neutral-200/80 bg-neutral-50 px-2 py-0.5 text-[12px] text-neutral-600">
                      Updated {formatDistanceToNow(new Date(wine.ai_refreshed_at))} ago
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {/* Tasting Notes - Collapsible */}
                {wine.ai_enrichment?.tasting_notes && (
                  <div>
                    <Button
                      variant="ghost"
                      className="justify-start p-0 h-auto hover:bg-transparent hover:text-inherit"
                      onClick={() => setShowTastingNotes(!showTastingNotes)}
                      aria-label={showTastingNotes ? "Hide tasting notes" : "Show tasting notes"}
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
                  disabled={applying || reenriching}
                  aria-busy={applying}
                  className="sm:w-auto w-full"
                >
                  {applying ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Applying…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
                <Button 
                  onClick={dismissSuggestions} 
                  variant="outline" 
                  disabled={dismissing || reenriching}
                  aria-busy={dismissing}
                  className="sm:w-auto w-full"
                >
                  {dismissing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Dismissing…
                    </>
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-2" />
                      Dismiss
                    </>
                  )}
                </Button>
              </div>
              
              {/* Re-enrich Error Display */}
              {reenrichError && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                  {reenrichError}
                  <div>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="px-0" 
                      disabled={reenriching}
                      onClick={() => { setReenrichError(null); handleReenrich(); }}
                    >
                      {reenriching ? 'Retrying…' : 'Retry'}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* AI Enrichment Footnote */}
              <p className="mt-2 text-[12px] text-neutral-500">
                AI enrichment from OpenAI. Review before applying.
              </p>
            </div>
          )}

          {/* AI Error Panel */}
          {showError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-red-900">AI Suggestions</h3>
                  <p className="text-sm text-red-600">Couldn't fetch suggestions (tap to retry).</p>
                </div>
                <Badge variant="danger">
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

          <Divider />
          <Section title="Overview">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm leading-6">
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Producer</div>
                <div className="font-medium">{wine.producer}</div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Vintage</div>
                <div className="font-medium">{wine.vintage ?? 'NV'}</div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Region</div>
                <div className="font-medium">{wine.region}</div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Bottle Size</div>
                <div className="font-medium">{formatSize(wine.bottle_size)}</div>
              </div>
              <div className="col-span-2">
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Status</div>
                <StatusPill status={wine.status} />
              </div>
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
          </Section>
          <Divider />
          <Section title="Drinking Guidance">
            <div className="text-sm">
              {(wine.drink_window_from || wine.drink_window_to) ? (
                <div className="flex items-center gap-2">
                  <span>{wine.drink_window_from ?? '—'}–{wine.drink_window_to ?? '—'}</span>
                  {wine.drink_now && <Badge className="ml-2">Drink now</Badge>}
                </div>
              ) : (
                <Empty>No drinking guidance yet.</Empty>
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
          </Section>
          <Divider />
          <Section title="Ratings & Notes">
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
              
              {!hasRatings(wine) && (
                <Empty onAdd={() => onEdit(wine)}>No ratings yet.</Empty>
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
              
              {!hasNotes(wine) && (
                <Empty onAdd={() => onEdit(wine)}>No tasting notes yet.</Empty>
              )}
            </div>
          </Section>
          <Divider />
          <Section title="Critic Scores">
            <div className="flex flex-wrap gap-2">
              {wine.score_wine_spectator && (
                <Badge variant="outline" className={`text-xs px-3 py-1 ${
                  wine.score_wine_spectator >= 95 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : wine.score_wine_spectator >= 90
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  Wine Spectator: {wine.score_wine_spectator}
                </Badge>
              )}
              {wine.score_james_suckling && (
                <Badge variant="outline" className={`text-xs px-3 py-1 ${
                  wine.score_james_suckling >= 95 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : wine.score_james_suckling >= 90
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}>
                  James Suckling: {wine.score_james_suckling}
                </Badge>
              )}
              {!hasCritics(wine) && (
                <Empty>No critic scores yet.</Empty>
              )}
            </div>
          </Section>
          </div>
          </div>

          {/* Sticky footer action bar */}
          <div className="border-t border-neutral-200/70 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80 px-5 py-3">
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(wine)} disabled={reenriching}>Edit</Button>
              <Button variant="primary" size="sm" onClick={handleToggleStatus} disabled={reenriching}>
                {wine.status === WineStatus.DRUNK ? 'Mark Cellared' : 'Mark Drunk'}
              </Button>
              <Button variant="ghost" size="sm" onClick={handleReenrich} disabled={reenriching || cooldown > 0}>
                {reenriching ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Refreshing…
                  </>
                ) : cooldown > 0 ? (
                  `Re-enrich in ${cooldown}s`
                ) : (
                  'Re-enrich'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
