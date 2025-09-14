import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Wine, WineFormData } from '../types'
import { BottleSize, WineStatus } from '../types'
import { insertWine, updateWine } from '../data/wines'
import { requestEnrichment } from '../data/enrich'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/Dialog'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { TextArea } from './ui/TextArea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select'
import { Label } from './ui/Label'
import { PillInput } from './ui/PillInput'
import { Field } from './ui/Field'
import { VarietalsInput } from './VarietalsInput'
import { ChevronDown } from 'lucide-react'
import { toast } from 'react-hot-toast'

const wineSchema = z.object({
  producer: z.string().min(1, 'Producer is required'),
  vintage: z.number().min(1800).max(new Date().getFullYear() + 10).optional(),
  vineyard: z.string().optional(),
  wine_name: z.string().optional(),
  appellation: z.string().optional(),
  region: z.string().optional(),
  country_code: z.string().length(2).optional(),
  us_state: z.string().optional(),
  varietals: z.array(z.string()).default([]),
  bottle_size: z.nativeEnum(BottleSize).default(BottleSize.STANDARD_750ML),
  purchase_date: z.string().optional(),
  purchase_place: z.string().optional(),
  location_row: z.string().optional(),
  location_position: z.number().min(0).optional(),
  status: z.nativeEnum(WineStatus).default(WineStatus.CELLARED),
  drank_on: z.string().optional(),
  peyton_rating: z.number().min(0).max(100).step(0.1).optional(),
  louis_rating: z.number().min(0).max(100).step(0.1).optional(),
  companions: z.array(z.string()).default([]),
  peyton_notes: z.string().optional(),
  louis_notes: z.string().optional(),
  score_wine_spectator: z.number().min(50).max(100).optional(),
  score_james_suckling: z.number().min(50).max(100).optional(),
  drink_window_from: z.number().min(1800).optional(),
  drink_window_to: z.number().min(1800).optional(),
  drink_now: z.boolean().optional(),
})

type WineFormValues = z.infer<typeof wineSchema>

interface WineSheetProps {
  mode: 'add' | 'edit'
  initial?: Partial<Wine>
  onClose: () => void
  onSaved: (wine: Wine) => void
}

const BOTTLE_SIZES = Object.values(BottleSize)
const WINE_STATUSES = Object.values(WineStatus)

// Country data with flags
const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', flag: '🇪🇸' },
  { code: 'US', name: 'United States', flag: '🇺🇸' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪' },
  { code: 'AU', name: 'Australia', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭' },
  { code: 'AT', name: 'Austria', flag: '🇦🇹' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦' },
]

// US States data
const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
]

// Pretty print validity for debugging HTML constraints
function validitySummary(el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  const v = (el as any).validity;
  if (!v) return {};
  return {
    value: (el as any).value,
    type: (el as any).type,
    required: (el as any).required,
    validationMessage: (el as any).validationMessage,
    badInput: v.badInput,
    patternMismatch: v.patternMismatch,
    rangeOverflow: v.rangeOverflow,
    rangeUnderflow: v.rangeUnderflow,
    stepMismatch: v.stepMismatch,
    tooLong: v.tooLong,
    tooShort: v.tooShort,
    typeMismatch: v.typeMismatch,
    valueMissing: v.valueMissing,
  };
}

function handleInvalid(e: React.FormEvent<Element>) {
  e.preventDefault(); // stop browser from hijacking focus
  const el = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
  console.warn('[AddWine] Browser validation blocked submit on:', el.name || el.id || (el as any).placeholder, validitySummary(el));
}

const toNull = (v: any) => (v === '' || v === undefined ? null : v);
const toNumber = (v: any) => (v === '' || v === undefined ? undefined : Number(v));
const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));

export function WineSheet({ mode, initial, onClose, onSaved }: WineSheetProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [devMsg, setDevMsg] = useState<string>('idle')

  const form = useForm<WineFormValues>({
    resolver: zodResolver(wineSchema) as any,
    defaultValues: {
      producer: initial?.producer || '',
      vintage: initial?.vintage,
      vineyard: initial?.vineyard || '',
      wine_name: initial?.wine_name || '',
      appellation: initial?.appellation || '',
      region: initial?.region || '',
      country_code: initial?.country_code || '',
      us_state: initial?.us_state || '',
      varietals: initial?.varietals || [],
      bottle_size: initial?.bottle_size || BottleSize.STANDARD_750ML,
      purchase_date: initial?.purchase_date || '',
      purchase_place: initial?.purchase_place || '',
      location_row: initial?.location_row || '',
      location_position: initial?.location_position,
      status: initial?.status || WineStatus.CELLARED,
      drank_on: initial?.drank_on || '',
      peyton_rating: initial?.peyton_rating,
      louis_rating: initial?.louis_rating,
      companions: initial?.companions || [],
      peyton_notes: initial?.peyton_notes || '',
      louis_notes: initial?.louis_notes || '',
      score_wine_spectator: initial?.score_wine_spectator,
      score_james_suckling: initial?.score_james_suckling,
      drink_window_from: initial?.drink_window_from,
      drink_window_to: initial?.drink_window_to,
      drink_now: initial?.drink_now,
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.info('[AddWine] submit:start');
    setDevMsg('submit:start');

    // Read current form state variables
    const formData = form.getValues();
    const producer = formData.producer?.trim();
    const vintage = formData.vintage;
    const wine_name = formData.wine_name;
    const vineyard = formData.vineyard;
    const appellation = formData.appellation;
    const region = formData.region;
    const country_code = formData.country_code;
    const us_state = formData.us_state;
    const varietals = formData.varietals;
    const bottle_size = formData.bottle_size;
    const purchase_date = formData.purchase_date;
    const purchase_place = formData.purchase_place;
    const location_row = formData.location_row;
    const location_position = formData.location_position;
    const peyton_rating = formData.peyton_rating;
    const louis_rating = formData.louis_rating;
    const companions = formData.companions;
    const peyton_notes = formData.peyton_notes;
    const louis_notes = formData.louis_notes;
    const score_wine_spectator = formData.score_wine_spectator;
    const score_james_suckling = formData.score_james_suckling;

    // Ensure ONLY producer is required
    if (!producer) {
      console.error('[AddWine] validation: missing producer');
      setDevMsg('validation: missing producer');
      toast.error('Producer is required');
      return;
    }

    const partial: Partial<Wine> = {
      producer: producer,
      vintage: toNumber(vintage),
      wine_name: toNull(wine_name)?.trim(),
      vineyard: toNull(vineyard)?.trim(),
      appellation: toNull(appellation)?.trim(),
      region: toNull(region)?.trim(),
      country_code: toNull(country_code)?.toUpperCase(),
      us_state: toNull(us_state)?.toUpperCase(),
      varietals: Array.isArray(varietals) ? varietals.map(s=>s.trim()).filter(Boolean) : undefined,
      bottle_size: toNull(bottle_size),
      purchase_date: toNull(purchase_date),
      purchase_place: toNull(purchase_place)?.trim(),
      location_row: toNull(location_row)?.trim(),
      location_position: toNumber(location_position),
      peyton_rating: toNumber(peyton_rating),
      louis_rating: toNumber(louis_rating),
      companions: Array.isArray(companions) ? companions.map(s=>s.trim()).filter(Boolean) : undefined,
      peyton_notes: toNull(peyton_notes),
      louis_notes: toNull(louis_notes),
      score_wine_spectator: toNumber(score_wine_spectator),
      score_james_suckling: toNumber(score_james_suckling),
      drink_window_from: toNumber(formData.drink_window_from),
      drink_window_to: toNumber(formData.drink_window_to),
      drink_now: formData.drink_now,
      status: formData.status,
      drank_on: toNull(formData.drank_on),
    };

    if (partial.peyton_rating != null)
      partial.peyton_rating = Number(clamp(partial.peyton_rating,0,100).toFixed(1));
    if (partial.louis_rating != null)
      partial.louis_rating = Number(clamp(partial.louis_rating,0,100).toFixed(1));

    console.debug('[AddWine] submit:payload', partial);

    try {
      setIsSubmitting(true);
      
      if (mode === 'add') {
        const created = await insertWine(partial as WineFormData);
        console.info('[AddWine] insert:ok', { id: created.id });
        setDevMsg('insert:ok');

        // Close sheet + inform parent
        onSaved?.(created);
        onClose();

        // Fire-and-forget enrichment
        const min = {
          id: created.id,
          producer: created.producer,
          vintage: created.vintage ?? undefined,
          wine_name: created.wine_name ?? undefined,
          appellation: created.appellation ?? undefined,
          region: created.region ?? undefined,
          country_code: created.country_code ?? undefined,
        };
        console.debug('[AI] request:start', min);

        requestEnrichment(min)
          .then((ai) => {
            if (!ai) {
              console.warn('[AI] request:returned null');
              setDevMsg('ai:null');
              return;
            }
            console.debug('[AI] request:ok', ai);
            setDevMsg('ai:ok');
            return updateWine(created.id, { ai_enrichment: ai, ai_confidence: ai.confidence ?? 0 });
          })
          .then(() => {
            console.info('[AI] persist:ok');
            setDevMsg('ai:persist:ok');
          })
          .catch((err) => {
            console.error('[AI] request/persist:error', err);
            setDevMsg('ai:error');
          })
          .finally(() => {
            console.debug('[AI] request:done');
          });

        // Optional toast (non-blocking)
        toast.success('Wine added! Fetching AI suggestions…');
      } else {
        const updated = await updateWine(initial!.id!, partial as WineFormData);
        console.info('[AddWine] update:ok', { id: updated.id });
        setDevMsg('update:ok');
        toast.success('Wine updated!');
        onSaved(updated);
        onClose();
      }
    } catch (err: any) {
      console.error('[AddWine] insert:error', { message: err?.message, details: err });
      setDevMsg('insert:error');
      toast.error(err?.message || 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  const titleId = React.useId()
  const descId = React.useId()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent 
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="
          fixed left-1/2 top-1/2 z-50 w-[min(720px,92vw)] -translate-x-1/2 -translate-y-1/2
          rounded-2xl border border-neutral-200/70
          bg-white supports-[backdrop-filter]:bg-white/95
          shadow-xl outline-none max-h-[90vh] overflow-y-auto
          data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95
          data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95
        "
      >
        <DialogHeader>
          <DialogTitle id={titleId}>
            {mode === 'add' ? 'Add New Wine' : 'Edit Wine'}
          </DialogTitle>
          <DialogDescription id={descId}>
            {mode === 'add' 
              ? 'Fill in the details below to add a new wine to your collection.' 
              : 'Update the wine details below.'}
          </DialogDescription>
        </DialogHeader>

        {import.meta.env.DEV && <div className="mb-3 text-xs text-neutral-500">DEV: {devMsg}</div>}

        <form noValidate onInvalid={handleInvalid} onSubmit={handleSubmit} className="space-y-6 text-gray-900">
          {/* Identity Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Identity</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Core always-visible fields */}
              <Field
                label="Producer"
                required
                helperText="Enter the producer's name (required)."
                error={form.formState.errors.producer?.message}
              >
                <Input
                  id="producer"
                  required
                  {...form.register('producer')}
                  placeholder="Domaine de la Côte"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </Field>

              <Field
                label="Vintage"
                helperText="Year the wine was produced (optional)."
              >
                <Input
                  id="vintage"
                  type="number"
                  value={form.watch('vintage') ?? ''}
                  onChange={(e) => form.setValue('vintage', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="2019"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </Field>

              <Field
                label="Region"
                helperText="Geographic region where the wine was produced (optional)."
              >
                <Input
                  id="region"
                  {...form.register('region')}
                  placeholder="California"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </Field>

              <Field
                label="Bottle Size"
                helperText="Standard bottle size for this wine."
              >
                <Select
                  value={form.watch('bottle_size')}
                  onValueChange={(value) => form.setValue('bottle_size', value as BottleSize)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {BOTTLE_SIZES.map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            {/* Advanced fields disclosure */}
            <details className="group mt-3">
              <summary className="flex cursor-pointer select-none items-center gap-2 text-[13px] text-neutral-700">
                <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
                Advanced fields
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Wine Name"
                  helperText="Specific name of the wine (optional)."
                >
                  <Input
                    id="wine_name"
                    {...form.register('wine_name')}
                    placeholder="Les Pierres"
                    className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                  />
                </Field>

                <Field
                  label="Appellation"
                  helperText="Official wine region designation (optional)."
                >
                  <Input
                    id="appellation"
                    {...form.register('appellation')}
                    placeholder="Santa Rita Hills"
                    className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                  />
                </Field>

                <Field
                  label="Vineyard"
                  helperText="Specific vineyard where grapes were grown (optional)."
                >
                  <Input
                    id="vineyard"
                    {...form.register('vineyard')}
                    placeholder="Les Pierres Vineyard"
                    className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                  />
                </Field>

                <Field
                  label="Country"
                  helperText="Country where the wine was produced (optional)."
                >
                  <Select
                    value={form.watch('country_code')}
                    onValueChange={(value) => form.setValue('country_code', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                {form.watch('country_code') === 'US' && (
                  <Field
                    label="US State"
                    helperText="State where the wine was produced (US only)."
                  >
                    <Select
                      value={form.watch('us_state')}
                      onValueChange={(value) => form.setValue('us_state', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {US_STATES.map((state) => (
                          <SelectItem key={state.code} value={state.code}>
                            {state.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                )}

                <Field
                  label="Varietals"
                  helperText="Grape varieties used in this wine (optional)."
                  className="sm:col-span-2"
                >
                  <VarietalsInput
                    value={form.watch('varietals')}
                    onChange={(varietals) => form.setValue('varietals', varietals)}
                  />
                </Field>
              </div>
            </details>
          </div>

          {/* Logistics Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Logistics</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              <div className="space-y-2">
                <Label htmlFor="purchase_date">Purchase Date</Label>
                <Input
                  id="purchase_date"
                  type="date"
                  {...form.register('purchase_date')}
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_place">Purchase Place</Label>
                <Input
                  id="purchase_place"
                  {...form.register('purchase_place')}
                  placeholder="e.g., Wine.com"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_row">Location Row</Label>
                <Input
                  id="location_row"
                  {...form.register('location_row')}
                  placeholder="e.g., A, 1"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_position">Location Position</Label>
                <Input
                  id="location_position"
                  type="number"
                  min="0"
                  value={form.watch('location_position') ?? ''}
                  onChange={(e) => form.setValue('location_position', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 5"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.watch('status')}
                  onValueChange={(value) => form.setValue('status', value as WineStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WINE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {form.watch('status') === WineStatus.DRUNK && (
                <div className="space-y-2">
                  <Label htmlFor="drank_on">Drank On</Label>
                <Input
                  id="drank_on"
                  type="date"
                  {...form.register('drank_on')}
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
                </div>
              )}
            </div>
          </div>

          {/* Ratings & Notes Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Ratings & Notes</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="peyton_rating">Peyton Rating (0-100)</Label>
                <Input
                  id="peyton_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.watch('peyton_rating') ?? ''}
                  onChange={(e) => form.setValue('peyton_rating', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 92.5"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="louis_rating">Louis Rating (0-100)</Label>
                <Input
                  id="louis_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={form.watch('louis_rating') ?? ''}
                  onChange={(e) => form.setValue('louis_rating', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 89.0"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="peyton_notes">Peyton Notes</Label>
                <TextArea
                  id="peyton_notes"
                  {...form.register('peyton_notes')}
                  placeholder="Tasting notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="louis_notes">Louis Notes</Label>
                <TextArea
                  id="louis_notes"
                  {...form.register('louis_notes')}
                  placeholder="Tasting notes..."
                  rows={3}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="companions">Companions</Label>
                <PillInput
                  value={form.watch('companions')}
                  onChange={(companions) => form.setValue('companions', companions)}
                  placeholder="Add companions..."
                />
              </div>
            </div>
          </div>

          {/* Critic Scores Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Critic Scores</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="score_wine_spectator">Wine Spectator (50-100)</Label>
                <Input
                  id="score_wine_spectator"
                  type="number"
                  min="50"
                  max="100"
                  value={form.watch('score_wine_spectator') ?? ''}
                  onChange={(e) => form.setValue('score_wine_spectator', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 94"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="score_james_suckling">James Suckling (50-100)</Label>
                <Input
                  id="score_james_suckling"
                  type="number"
                  min="50"
                  max="100"
                  value={form.watch('score_james_suckling') ?? ''}
                  onChange={(e) => form.setValue('score_james_suckling', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 96"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drink_window_from">Drink Window From</Label>
                <Input
                  id="drink_window_from"
                  type="number"
                  min="1800"
                  value={form.watch('drink_window_from') ?? ''}
                  onChange={(e) => form.setValue('drink_window_from', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 2025"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="drink_window_to">Drink Window To</Label>
                <Input
                  id="drink_window_to"
                  type="number"
                  min="1800"
                  value={form.watch('drink_window_to') ?? ''}
                  onChange={(e) => form.setValue('drink_window_to', e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 2035"
                  className="rounded-xl border px-3 py-2 text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    id="drink_now"
                    type="checkbox"
                    {...form.register('drink_now')}
                    className="rounded border-input"
                  />
                  <Label htmlFor="drink_now">Drink Now</Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add Wine' : 'Update Wine'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
