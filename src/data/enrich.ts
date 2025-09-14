import { supabase } from '../lib/supabase'
import type { AIEnrichment } from '../types'
import { updateWine } from './wines'

interface EnrichmentRequest {
  id: string
  producer: string
  vintage?: number
  wine_name?: string
  appellation?: string
  region?: string
  country_code?: string
}

/**
 * Requests AI enrichment for a wine
 */
/**
 * Retries AI enrichment for a wine
 */
export async function retryEnrichment(wineId: string): Promise<AIEnrichment | null> {
  // First, get the wine data to retry enrichment
  const { data: wine, error } = await supabase
    .from('wines')
    .select('*')
    .eq('id', wineId)
    .single()

  if (error || !wine) {
    console.error('Error fetching wine for retry:', error)
    return null
  }

  const minimal: EnrichmentRequest = {
    id: wine.id,
    producer: wine.producer,
    vintage: wine.vintage ?? undefined,
    wine_name: wine.wine_name ?? undefined,
    appellation: wine.appellation ?? undefined,
    region: wine.region ?? undefined,
    country_code: wine.country_code ?? undefined,
  }

  return requestEnrichment(minimal)
}

export async function requestEnrichment(minimal: EnrichmentRequest): Promise<AIEnrichment | null> {
  try {
    const { data, error } = await supabase.functions.invoke('enrich-wine', {
      body: minimal
    })

    if (error) {
      console.error('Error calling enrich-wine function:', error)
      // Store the error in the wine record (if column exists)
      try {
        await updateWine(minimal.id, {
          ai_last_error: `Enrichment failed: ${error.message}`,
          ai_enrichment: null,
          ai_confidence: null
        })
      } catch (updateError) {
        console.warn('Could not update ai_last_error (column may not exist):', updateError)
        // Fallback: just clear enrichment data
        await updateWine(minimal.id, {
          ai_enrichment: null,
          ai_confidence: null
        })
      }
      return null
    }

    if (!data) {
      console.warn('No enrichment data returned')
      // Store the error in the wine record (if column exists)
      try {
        await updateWine(minimal.id, {
          ai_last_error: 'No enrichment data returned',
          ai_enrichment: null,
          ai_confidence: null
        })
      } catch (updateError) {
        console.warn('Could not update ai_last_error (column may not exist):', updateError)
        // Fallback: just clear enrichment data
        await updateWine(minimal.id, {
          ai_enrichment: null,
          ai_confidence: null
        })
      }
      return null
    }

    // Extract confidence and enrichment data from response
    const { confidence, ...enrichmentData } = data
    const confidenceValue = typeof confidence === 'number' ? confidence : 0.5

    // Update the wine with the enrichment data and clear any previous errors
    await updateWine(minimal.id, {
      ai_enrichment: enrichmentData,
      ai_confidence: confidenceValue,
      ai_last_error: null
    })

    return enrichmentData
  } catch (error) {
    console.error('Error requesting enrichment:', error)
    // Store the error in the wine record (if column exists)
    try {
      await updateWine(minimal.id, {
        ai_last_error: `Enrichment error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ai_enrichment: null,
        ai_confidence: null
      })
    } catch (updateError) {
      console.warn('Could not update ai_last_error (column may not exist):', updateError)
      // Fallback: just clear enrichment data
      await updateWine(minimal.id, {
        ai_enrichment: null,
        ai_confidence: null
      })
    }
    return null
  }
}
