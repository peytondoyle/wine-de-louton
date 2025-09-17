// Runtime validation schemas using Zod
// These provide runtime type safety at API boundaries without mocks

import { z } from 'zod'

// Wine validation schemas
export const WineStatusSchema = z.enum(['Cellared', 'Drunk'])
export const BottleSizeSchema = z.enum(['375ml', '500ml', '750ml', '1.5L', '3L', 'Other'])
export const DepthPositionSchema = z.union([z.literal(1), z.literal(2)]) // Front = 1, Back = 2

// Core Wine schema for API validation
export const WineSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  household_id: z.string().uuid(),
  vintage: z.number().int().min(1800).max(new Date().getFullYear() + 10).optional(),
  producer: z.string().min(1).max(200),
  vineyard: z.string().max(200).optional(),
  wine_name: z.string().max(200).optional(),
  appellation: z.string().max(200).optional(),
  region: z.string().max(200).optional(),
  country_code: z.string().length(2).optional(),
  us_state: z.string().max(50).optional(),
  varietals: z.array(z.string().max(100)).default([]),
  companions: z.array(z.string().max(100)).default([]),
  bottle_size: BottleSizeSchema,
  purchase_date: z.string().date().optional(),
  purchase_place: z.string().max(200).optional(),
  location_row: z.string().max(100).optional(),
  location_position: z.number().int().min(0).optional(),
  status: WineStatusSchema,
  drank_on: z.string().date().optional(),
  score_wine_spectator: z.number().min(0).max(100).optional(),
  score_james_suckling: z.number().min(0).max(100).optional(),
  drink_window_from: z.number().int().min(1800).optional(),
  drink_window_to: z.number().int().min(1800).optional(),
  drink_now: z.boolean().optional(),
  ai_enrichment: z.record(z.string(), z.any()).nullable().optional(),
  ai_confidence: z.number().min(0).max(1).optional(),
  ai_last_error: z.string().optional(),
  ai_refreshed_at: z.string().datetime().optional(),
  average_rating: z.number().min(0).max(5).optional()
})

// Wine creation schema (without generated fields)
export const CreateWineSchema = WineSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
  household_id: true,
  average_rating: true
})

// Wine update schema (all fields optional except id)
export const UpdateWineSchema = WineSchema.partial().required({ id: true })

// Cellar slot validation
export const CellarSlotSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  household_id: z.string().uuid(),
  wine_id: z.string().uuid(),
  fridge_id: z.string().uuid(),
  shelf: z.number().int().min(1),
  column_position: z.number().int().min(1),
  depth: DepthPositionSchema
})

// Fridge layout validation
export const FridgeLayoutSchema = z.object({
  id: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  household_id: z.string().uuid(),
  fridge_id: z.string().uuid(),
  shelves: z.number().int().min(1).max(50),
  columns: z.number().int().min(1).max(50),
  name: z.string().min(1).max(100)
})

// Enrichment validation schemas
export const FieldKeySchema = z.enum([
  'producer',
  'wineName', 
  'vintage',
  'region',
  'varietal',
  'sizeMl',
  'notes'
])

export const AISourceSchema = z.enum(['openai', 'heuristic'])

export const AIFieldSuggestionSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('present'),
    key: FieldKeySchema,
    current: z.union([z.string(), z.number()]).nullable(),
    suggestion: z.union([z.string(), z.number()]),
    confidence: z.number().min(0).max(1),
    source: AISourceSchema
  }),
  z.object({
    kind: z.literal('missing'),
    key: FieldKeySchema,
    current: z.literal(null),
    suggestion: z.union([z.string(), z.number()]),
    confidence: z.number().min(0).max(1),
    source: AISourceSchema
  }),
  z.object({
    kind: z.literal('skip'),
    key: FieldKeySchema,
    reason: z.string().min(1)
  })
])

export const AIEnrichmentSchema = z.object({
  wineId: z.string().uuid(),
  fields: z.array(AIFieldSuggestionSchema)
})

// API response validation helpers
export function validateWine(data: unknown) {
  return WineSchema.parse(data)
}

export function validateWineArray(data: unknown) {
  return z.array(WineSchema).parse(data)
}

export function validateCellarSlot(data: unknown) {
  return CellarSlotSchema.parse(data)
}

export function validateCellarSlotArray(data: unknown) {
  return z.array(CellarSlotSchema).parse(data)
}

export function validateAIEnrichment(data: unknown) {
  return AIEnrichmentSchema.parse(data)
}

// Safe parsing with error handling
export function safeParseWine(data: unknown) {
  const result = WineSchema.safeParse(data)
  if (!result.success) {
    console.error('Wine validation failed:', result.error.issues)
    throw new Error(`Invalid wine data: ${result.error.issues.map(i => i.message).join(', ')}`)
  }
  return result.data
}

export function safeParseWineArray(data: unknown) {
  const result = z.array(WineSchema).safeParse(data)
  if (!result.success) {
    console.error('Wine array validation failed:', result.error.issues)
    throw new Error(`Invalid wine array data: ${result.error.issues.map(i => i.message).join(', ')}`)
  }
  return result.data
}

// Validation helpers for API functions
export function validateCreateWine(data: unknown) {
  return CreateWineSchema.parse(data)
}

export function validateUpdateWine(data: unknown) {
  return UpdateWineSchema.parse(data)
}

// Type inference from schemas
export type ValidatedWine = z.infer<typeof WineSchema>
export type ValidatedCreateWine = z.infer<typeof CreateWineSchema>
export type ValidatedUpdateWine = z.infer<typeof UpdateWineSchema>
export type ValidatedCellarSlot = z.infer<typeof CellarSlotSchema>
export type ValidatedFridgeLayout = z.infer<typeof FridgeLayoutSchema>
export type ValidatedAIEnrichment = z.infer<typeof AIEnrichmentSchema>
export type ValidatedAIFieldSuggestion = z.infer<typeof AIFieldSuggestionSchema>
