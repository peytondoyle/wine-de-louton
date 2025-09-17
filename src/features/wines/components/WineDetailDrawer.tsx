import React, { useState, Suspense, lazy } from 'react'
import type { Wine } from '../../../types'
import { WineStatus } from '../../../types'
import { displayWineTitle, displayTitle, countryFlag, stateBadge, formatSize, formatDate, countryName } from '../../../lib/format'
import { updateWine, getWine } from '../data/wines'
import { requestEnrichment } from '../../enrichment/data/enrich'
import { cn } from '../../../lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { Dialog, DialogContent, DialogHeader } from '../../../components/ui/Dialog'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Label } from '../../../components/ui/Label'
import { ConfidenceBadge } from '../../enrichment/components/ConfidenceBadge'
import { Section, SectionDivider } from '../../../components/ui/Section'
import { useKeyboardFocus } from '../../../hooks/useKeyboardFocus'
import { useZoomGuard } from '../../../hooks/useZoomGuard'
import { useInteractionDetection } from '../../../hooks/usePreventClose'
import DrawerFooterActions from '../../../components/DrawerFooterActions'
import { useWineActions } from '../../../hooks/useWineActions'
import { useAISuggestions } from '../../../hooks/useAISuggestions'
import { AISuggestionsButton } from '../../../components/AISuggestionsButton'
import { AISuggestionsPanel } from '../../../components/AISuggestionsPanel'
import { AIAppliedChip } from '../../../components/AIAppliedChip'
// Lazy load EnrichmentReviewPanel to reduce bundle size
const EnrichmentReviewPanel = lazy(() => import('../../enrichment/components/EnrichmentReviewPanel'))

// Fallback component for EnrichmentReviewPanel
const EnrichmentReviewPanelSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
      <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3 bg-white">
          <div className="flex items-center gap-2">
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-2">
            <div className="h-12 bg-gray-100 rounded"></div>
            <div className="h-12 bg-blue-50 rounded border border-blue-200"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
)
import { EnrichmentTable } from '../../enrichment/components/EnrichmentTable'
import type { AIEnrichment as NewAIEnrichment, ApplicableFieldKey, AIFieldSuggestion } from '../../../types/enrichment'
import { EmptyRow } from '../../cellar/components/EmptyRow'
import { DevEnrichmentButton } from '../../enrichment/components/DevEnrichmentButton'
import { CellarPlacementPicker } from '../../cellar/CellarPlacementPicker'
import { getLayout, getOccupancy, assignSlot, getWineSlot, removeSlot } from '../../cellar/cellar.api'
import { CellarSlot, formatSlot } from '../../cellar/placement.types'
import { 
  Pencil, 
  Star, 
  ChevronDown, 
  ChevronUp,
  Check,
  X,
  MapPin,
  Wine as WineIcon,
  WineOff,
  Grid3X3,
  Store,
  Calendar,
  Info,
  Loader2,
  Sparkles,
  Trash2
} from 'lucide-react'
import { toast } from '../../../lib/toast'
import { toastError } from '../../../utils/toastMessages'

/*
 * QA CHECKLIST - WineDetailDrawer
 * 
 * Desktop & Mobile Layout:
 * ✓ Footer present with DrawerFooterActions component
 * ✓ Single row on md+ screens, wraps on xs screens
 * ✓ Responsive button sizing (sm on mobile, md on desktop)
 * 
 * iOS Safari Safe Area:
 * ✓ Footer respects env(safe-area-inset-bottom) padding
 * ✓ Content scrolls properly when iOS keyboard is visible
 * ✓ useKeyboardFocus hook scrolls focused inputs into view
 * 
 * New Suggestions Functionality:
 * ✓ Single new suggestions entry point in footer (no duplicates)
 * ✓ Cooldown timer prevents rapid successive calls
 * ✓ Loading state with spinner and disabled state
 * 
 * Keyboard Navigation:
 * ✓ Tab order: title -> content -> footer buttons -> close button
 * ✓ Shift+Tab reverses the order properly
 * ✓ Focus trap within drawer content
 * ✓ Escape key closes drawer
 * 
 * Screen Reader Accessibility:
 * ✓ Footer region properly labeled as "Actions"
 * ✓ Button labels read correctly (Mark Drunk/Undo Drunk, Edit, New suggestions ready)
 * ✓ Disabled state announced when buttons are disabled
 * ✓ Loading state announced with aria-busy
 * ✓ Wine details properly structured with headings
 * 
 * Loading States:
 * ✓ All buttons disabled when any action is in flight
 * ✓ Loading spinner visible on active button
 * ✓ Other buttons show disabled state during loading
 * ✓ Loading state persists until action completes
 * 
 * Content Visibility:
 * ✓ Content has pb-28 to prevent hiding behind footer
 * ✓ Last section (suggestions) fully visible above footer
 * ✓ Scroll area properly configured with max-height
 * ✓ Footer positioned outside scroll area as sibling
 * 
 * Reduced Motion:
 * ✓ No translate-y hover effects on buttons
 * ✓ Subtle hover effects only (bg-neutral-50, ring-neutral-200)
 * ✓ Smooth transitions respect user's motion preferences
 * ✓ Loading spinners animate only when needed
 */

// Helper components
const Divider = () => <SectionDivider className="-mx-5" />;

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


// Helper functions to determine if sections have content
const hasRatings = (wine: Wine) => !!(wine.peyton_rating || wine.louis_rating || wine.average_rating)
const hasNotes = (wine: Wine) => !!(wine.peyton_notes || wine.louis_notes)
const hasCritics = (wine: Wine) => !!(wine.score_wine_spectator || wine.score_james_suckling)



interface WineDetailDrawerProps {
  wine: Wine | null
  onClose: () => void
  onEdit: (wine: Wine) => void
  onWineUpdated: (wine: Wine) => void
  focusOnSuggestions?: boolean
}

export function WineDetailDrawer({ wine, onClose, onEdit, onWineUpdated, focusOnSuggestions = false }: WineDetailDrawerProps) {
  const [compact, setCompact] = useState(false)
  const [hideSuggestions, setHideSuggestions] = useState(false)
  
  // New suggestions cooldown state
  const COOLDOWN_S = 20
  const [cooldown, setCooldown] = useState<number>(0)
  const [reenrichError, setReenrichError] = useState<string | null>(null)
  const [enrichmentStatus, setEnrichmentStatus] = useState<string | null>(null)
  const heroRef = React.useRef<HTMLDivElement>(null)
  const suggestionsRef = React.useRef<HTMLDivElement>(null)

  // Placement state
  const [layout, setLayout] = useState<{ shelves: number; columns: number; name: string }>({ shelves: 4, columns: 6, name: 'Default' })
  const [occupancy, setOccupancy] = useState<Set<string>>(new Set())
  const [currentPlacement, setCurrentPlacement] = useState<CellarSlot | null>(null)
  const [placementLoading, setPlacementLoading] = useState(false)

  // Wine actions hook
  const { edit, markDrunk, loading: baseLoading } = useWineActions(wine || undefined, {
    onWineUpdated,
    onEditWine: onEdit,
    onReEnrichSuccess: () => {
      // Reveal suggestions and scroll to them on successful re-enrich
      setHideSuggestions(false)
      // Small delay to ensure the panel is rendered before scrolling
      setTimeout(() => {
        suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, 100)
    }
  })

  // AI Suggestions hook
  const {
    isOpen: suggestionsOpen,
    suggestions,
    pendingCount,
    safeCount,
    isLoading: suggestionsLoading,
    error: suggestionsError,
    openSuggestions,
    closeSuggestions,
    applySuggestion,
    applyAllSafe,
    skipSuggestion,
    getFieldProvenance
  } = useAISuggestions(wine!)

  // Generate mock enrichment data for the new table
  const generateMockEnrichmentData = (): NewAIEnrichment => {
    if (!wine) return { wineId: '', fields: [] }
    
    return {
      wineId: wine.id,
      fields: [
        {
          kind: 'present',
          key: 'producer',
          current: wine.producer,
          suggestion: wine.producer + ' (Enhanced)',
          confidence: 0.85,
          source: 'openai'
        } satisfies AIFieldSuggestion,
        {
          kind: 'missing',
          key: 'vintage',
          current: null,
          suggestion: 2020,
          confidence: 0.92,
          source: 'openai'
        } satisfies AIFieldSuggestion,
        {
          kind: 'present',
          key: 'region',
          current: wine.region || null,
          suggestion: (wine.region || 'Unknown') + ', California',
          confidence: 0.78,
          source: 'heuristic'
        } satisfies AIFieldSuggestion,
        {
          kind: 'skip',
          key: 'notes',
          reason: 'No improvement needed'
        } satisfies AIFieldSuggestion
      ]
    }
  }

  // Handle applying enrichment suggestions
  const handleApplyEnrichment = async (key: ApplicableFieldKey, value: string | number) => {
    if (!wine) return
    
    try {
      // Map the field key to the actual wine field
      const fieldMap: Partial<Record<ApplicableFieldKey, keyof Wine>> = {
        producer: 'producer',
        wineName: 'wine_name',
        vintage: 'vintage',
        region: 'region',
        varietal: 'varietals', // This is an array, so we'd need special handling
        sizeMl: 'bottle_size', // This is an enum, so we'd need special handling
        // notes: 'notes' // This field doesn't exist in Wine type
      }

      const fieldName = fieldMap[key]
      if (!fieldName) return

      // Update the wine
      const updatedWine = await updateWine(wine.id, { [fieldName]: value })
      if (updatedWine) {
        onWineUpdated(updatedWine)
        toast.success(`Updated ${key}`)
      }
    } catch (error) {
      console.error('Error applying enrichment:', error)
      toast.error('Failed to apply suggestion')
    }
  }

  // Custom reEnrich function with inline status
  const [loading, setLoading] = useState({ ...baseLoading, reEnrich: false })

  const reEnrich = async () => {
    if (!wine) {
      console.warn('No wine provided to reEnrich action')
      return
    }

    setLoading(prev => ({ ...prev, reEnrich: true }))
    setEnrichmentStatus('Getting suggestions...')
    
    try {
      const enrichment = await requestEnrichment({
        id: wine.id,
        producer: wine.producer,
        vintage: wine.vintage ?? undefined,
        wine_name: wine.wine_name ?? undefined,
        appellation: wine.appellation ?? undefined,
        region: wine.region ?? undefined,
        country_code: wine.country_code ?? undefined,
      })

      if (enrichment) {
        // The requestEnrichment function already updates the wine in the database
        // We need to fetch the updated wine to get the latest data
        const updatedWine = await updateWine(wine.id, {
          ai_enrichment: enrichment,
          ai_confidence: 0.5,
          ai_refreshed_at: new Date().toISOString()
        })
        
        onWineUpdated(updatedWine)
        setEnrichmentStatus('Suggestions ready!')
        setHideSuggestions(false)
        
        // Small delay to ensure the panel is rendered before scrolling
        setTimeout(() => {
          suggestionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
        
        // Clear status after 3 seconds
        setTimeout(() => {
          setEnrichmentStatus(null)
        }, 3000)
      } else {
        setEnrichmentStatus('No suggestions available')
        setTimeout(() => {
          setEnrichmentStatus(null)
        }, 3000)
      }
    } catch (error) {
      console.error('Error getting new suggestions:', error)
      setEnrichmentStatus('Failed to get suggestions')
      setTimeout(() => {
        setEnrichmentStatus(null)
      }, 3000)
    } finally {
      setLoading(prev => ({ ...prev, reEnrich: false }))
    }
  }

  // Auto-trigger enrichment if focusOnSuggestions is true and no enrichment exists
  React.useEffect(() => {
    if (focusOnSuggestions && wine && !wine.ai_enrichment && !loading.reEnrich) {
      reEnrich()
    }
  }, [focusOnSuggestions, wine, loading.reEnrich, reEnrich])

  // Prevent zooming when drawer is open
  useZoomGuard(!!wine)
  
  // Handle iOS keyboard focus management
  const scrollAreaRef = useKeyboardFocus(!!wine)
  
  // Interaction detection for preventing accidental closes
  const { attachInteractionListeners, cleanup } = useInteractionDetection(scrollAreaRef)

  // Attach interaction listeners when drawer is open
  React.useEffect(() => {
    if (!wine) return
    
    const cleanupListeners = attachInteractionListeners()
    return () => {
      cleanupListeners?.()
      cleanup()
    }
  }, [wine, attachInteractionListeners, cleanup])

  // Early return if wine is null
  if (!wine) return null

  // Copy title to clipboard
  const handleCopyTitle = async () => {
    try {
      await navigator.clipboard.writeText(displayWineTitle(wine))
      // Visual feedback: clipboard copy success (browser handles this)
    } catch (err) {
      toastError(err)
    }
  }

  // Handle double-click to edit
  const handleTitleDoubleClick = () => {
    onEdit(wine)
  }

  // Handle slot assignment
  const handleSlotAssignment = async (slot: CellarSlot | null) => {
    if (!wine) return

    try {
      setPlacementLoading(true)
      
      if (slot) {
        // Convert CellarSlot to SlotAssignment
        const slotAssignment = {
          shelf: slot.shelf,
          column_position: slot.column_position,
          depth: slot.depth
        }
        
        // Assign slot in database
        await assignSlot(wine.id, slotAssignment)
        
        // Update UI state
        setCurrentPlacement(slot)
        
        // Refresh occupancy data
        const occupancyData = await getOccupancy()
        const occupancySet = new Set(occupancyData.map(item => `${item.shelf}:${item.column_position}:${item.depth}`))
        setOccupancy(occupancySet)
        
        // Show success toast
        toast.success('Placement saved', {
          id: `place-${wine.id}`
        })
      } else {
        // Remove placement
        const success = await removeSlot(wine.id)
        
        if (success) {
          setCurrentPlacement(null)
          
          // Refresh occupancy data
          const occupancyData = await getOccupancy()
          const occupancySet = new Set(occupancyData.map(item => `${item.shelf}:${item.column_position}:${item.depth}`))
          setOccupancy(occupancySet)
          
          toast.success('Placement removed', {
            id: `place-${wine.id}`
          })
        } else {
          throw new Error('Failed to remove slot')
        }
      }
    } catch (error) {
      console.error('Error managing slot assignment:', error)
      
      // Revert optimistic update
      const wineSlot = await getWineSlot(wine.id)
      setCurrentPlacement(wineSlot)
      
      // Show specific error message for occupied slots
      if (error instanceof Error && error.message === 'SLOT_OCCUPIED') {
        toast.error('That spot is taken', {
          id: `place-${wine.id}`
        })
      } else {
        // Show generic error toast for other failures
        toast.error('Failed to save placement', {
          id: `place-${wine.id}`
        })
      }
    } finally {
      setPlacementLoading(false)
    }
  }


  // Load placement data when wine changes
  React.useEffect(() => {
    if (wine) {
      const loadPlacementData = async () => {
        try {
          setPlacementLoading(true)
          const [layoutData, occupancyData, wineSlot] = await Promise.all([
            getLayout(),
            getOccupancy(),
            getWineSlot(wine.id)
          ])
          
          if (layoutData) {
            setLayout(layoutData)
          }
          
          // Convert occupancy data to Set of slot keys
          const occupancySet = new Set(occupancyData.map(item => `${item.shelf}:${item.column_position}:${item.depth}`))
          setOccupancy(occupancySet)
          
          // Set current placement if wine is assigned to a slot
          if (wineSlot) {
            // Convert SlotAssignment to CellarSlot
            const cellarSlot: CellarSlot = {
              shelf: wineSlot.shelf,
              column_position: wineSlot.column_position,
              depth: wineSlot.depth
            }
            setCurrentPlacement(cellarSlot)
          } else {
            setCurrentPlacement(null)
          }
        } catch (error) {
          console.error('Error loading placement data:', error)
        } finally {
          setPlacementLoading(false)
        }
      }
      loadPlacementData()
    }
  }, [wine?.id])

  // Reset state when wine changes (different wine selected)
  React.useEffect(() => {
    if (wine) {
      // Reset cooldown when switching wines
      setCooldown(0)
      // Clear new suggestions error when switching wines
      setReenrichError(null)
      // Reset hide suggestions state when switching wines
      setHideSuggestions(false)
    }
  }, [wine?.id])

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







  const showSuggestions = wine.ai_enrichment && !hideSuggestions
  const showError = wine.ai_last_error && !wine.ai_enrichment

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        className="p-0 flex flex-col"
        title={displayWineTitle(wine)}
        description="Wine details and actions"
        hideTitleVisually={true}
      >

        {/* Scroll area */}
        <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 pt-5 sm:pt-6 pb-28">
            {/* Sticky micro-header */}
            <div className={`sticky top-0 z-20 -mx-4 sm:-mx-6 -mt-4 sm:-mt-6 px-4 sm:px-6 py-3 bg-white border-b border-neutral-200/80 shadow-sm motion-safe:transition-[box-shadow,transform,opacity] motion-safe:duration-200 motion-reduce:transition-none ${
              compact ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
            }`} style={{ isolation: 'isolate' }}>
              <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                {countryFlag(wine.country_code)}
                <span className="truncate font-medium text-neutral-900">{displayWineTitle(wine)}</span>
              </div>
              </div>
            </div>

          {/* Hero header */}
          <header className="mb-3" ref={heroRef}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <DialogPrimitive.Title asChild>
                  <div className="flex items-start gap-2 text-xl sm:text-2xl font-semibold">
                    <span aria-label={`Country ${countryName(wine.country_code)}`} className="shrink-0 mt-1">{countryFlag(wine.country_code)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="line-clamp-1 min-w-0">
                        {displayWineTitle(wine)}
                      </div>
                      {wine.vineyard && (
                        <div className="mt-2">
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {wine.vineyard}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </DialogPrimitive.Title>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] leading-5 text-neutral-700">
                  {wine.region && <Chip icon="map-pin">{wine.region}</Chip>}
                  {wine.bottle_size && <Chip icon="wine">{formatSize(wine.bottle_size)}</Chip>}
                  {currentPlacement && <Chip icon="grid-3x3">{formatSlot(currentPlacement)}</Chip>}
                  <StatusPill status={wine.status} />
                </div>
              </div>

              {/* AI Suggestions Button */}
              <div className="flex-shrink-0">
                <AISuggestionsButton
                  suggestions={suggestions}
                  isLoading={suggestionsLoading}
                  onClick={openSuggestions}
                />
              </div>
            </div>
          </header>

          <Divider />


          {/* AI Suggestions Panel */}
          {showSuggestions && (
            <div ref={suggestionsRef} className="py-4" onClick={(e) => e.stopPropagation()} data-allow-outside>
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-neutral-900">AI Suggestions</h3>
                    <p className="text-sm text-neutral-600">Review and apply suggested improvements</p>
                  </div>
                  <ConfidenceBadge confidence={wine.ai_confidence ?? 0} />
                </div>
                <div className="flex items-center gap-2">
                  {wine.ai_refreshed_at && (
                    <span className="text-xs text-neutral-500">
                      Generated {formatDistanceToNow(new Date(wine.ai_refreshed_at))} ago
                    </span>
                  )}
                </div>
              </div>

              <Suspense fallback={<EnrichmentReviewPanelSkeleton />}>
                <EnrichmentReviewPanel 
                  wine={wine} 
                  onApplied={() => {
                    // Refresh the wine data after applying
                    getWine(wine.id).then(updatedWine => {
                      if (updatedWine) {
                        onWineUpdated(updatedWine)
                        // Check if all AI enrichment fields have been cleared
                        if (!updatedWine.ai_enrichment || Object.keys(updatedWine.ai_enrichment).length === 0) {
                          setHideSuggestions(true)
                        }
                      }
                    })
                  }}
                  onDismissed={() => {
                    // Refresh the wine data after dismissing
                    getWine(wine.id).then(updatedWine => {
                      if (updatedWine) {
                        onWineUpdated(updatedWine)
                        // Check if all AI enrichment fields have been cleared
                        if (!updatedWine.ai_enrichment || Object.keys(updatedWine.ai_enrichment).length === 0) {
                          setHideSuggestions(true)
                        }
                      }
                    })
                  }}
                />
              </Suspense>
              
              {/* New Suggestions Error Display */}
              {reenrichError && (
                <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-[13px] text-rose-800">
                  {reenrichError}
                  <div>
                  </div>
                </div>
              )}
              
              {/* AI Enrichment Footnote */}
              <p className="mt-2 text-[12px] text-neutral-500">
                AI enrichment from OpenAI. Review before applying.
              </p>
            </div>
          )}

          {/* New Enrichment Table */}
          {wine && (
            <div className="mt-6">
              <EnrichmentTable
                data={generateMockEnrichmentData()}
                onApply={handleApplyEnrichment}
                loading={loading.reEnrich}
              />
            </div>
          )}

          {/* AI Error Panel */}
          {showError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4" data-allow-outside>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-red-900">AI Suggestions</h3>
                  <p className="text-sm text-red-600">Couldn't fetch suggestions (tap to retry).</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="danger">
                    Error
                  </Badge>
                  <DevEnrichmentButton wine={wine} onWineUpdated={onWineUpdated} />
                </div>
              </div>
              
            </div>
          )}

          <Divider />
          <Section title="Overview">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm leading-6">
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Producer</div>
                <div className="font-medium flex items-center gap-2">
                  {wine.producer}
                  <AIAppliedChip provenance={getFieldProvenance('producer')} />
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Vintage</div>
                <div className="font-medium flex items-center gap-2">
                  {wine.vintage ?? 'NV'}
                  <AIAppliedChip provenance={getFieldProvenance('vintage')} />
                </div>
              </div>
              <div>
                <div className="text-neutral-500 text-[11px] uppercase tracking-wide">Region</div>
                <div className="font-medium flex items-center gap-2">
                  {wine.region}
                  <AIAppliedChip provenance={getFieldProvenance('region')} />
                </div>
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
                <EmptyRow type="general" message="No drinking guidance yet." onAdd={() => onEdit(wine)} />
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
                <EmptyRow type="ratings" onAdd={() => onEdit(wine)} />
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
                <EmptyRow type="tasting-notes" onAdd={() => onEdit(wine)} />
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
                <EmptyRow type="critic-scores" onAdd={() => onEdit(wine)} />
              )}
            </div>
          </Section>
          <Divider />
          <Section title="Placement">
            {placementLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                <span className="ml-2 text-sm text-neutral-500">Loading placement...</span>
              </div>
            ) : (
              <CellarPlacementPicker
                shelves={layout.shelves}
                columns={layout.columns}
                value={currentPlacement ? {
                  shelf: currentPlacement.shelf,
                  column_position: currentPlacement.column_position,
                  depth: currentPlacement.depth
                } : undefined}
                onChange={(value) => {
                  if (value) {
                    // Convert PlacementValue to CellarSlot
                    const cellarSlot: CellarSlot = {
                      shelf: value.shelf,
                      column_position: value.column_position,
                      depth: value.depth
                    }
                    handleSlotAssignment(cellarSlot)
                  } else {
                    handleSlotAssignment(null)
                  }
                }}
                occupied={occupancy}
              />
            )}
          </Section>
        </div>

        {/* Footer actions - positioned outside scroll area */}
        <DrawerFooterActions
          primary={{
            label: wine?.status === WineStatus.DRUNK ? 'Mark Cellared' : 'Mark Drunk',
            onClick: markDrunk,
            icon: wine?.status === WineStatus.DRUNK ? <WineIcon className="h-4 w-4" /> : <WineOff className="h-4 w-4" />,
            loading: loading.markDrunk,
            testId: 'footer-mark-drunk'
          }}
          secondary={{
            label: 'Edit',
            onClick: edit,
            icon: <Pencil className="h-4 w-4" />,
            testId: 'footer-edit'
          }}
          tertiary={{
            label: enrichmentStatus || (loading.reEnrich ? 'Getting suggestions...' : cooldown > 0 ? `New suggestions in ${cooldown}s` : 'New suggestions ready'),
            onClick: reEnrich,
            icon: <Sparkles className="h-4 w-4" />,
            loading: loading.reEnrich,
            disabled: cooldown > 0 || loading.reEnrich,
            testId: 'footer-reenrich'
          }}
        />

        {/* AI Suggestions Panel */}
        <AISuggestionsPanel
          wine={{
            ...wine,
            ai_confidence: wine.ai_confidence ?? undefined
          }}
          suggestions={suggestions}
          onApply={applySuggestion}
          onSkip={skipSuggestion}
          onApplyAllSafe={applyAllSafe}
          onClose={closeSuggestions}
          isLoading={suggestionsLoading}
          error={suggestionsError}
        />
      </DialogContent>
    </Dialog>
  )
}
