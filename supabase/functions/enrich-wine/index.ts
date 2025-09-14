import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EnrichmentRequest {
  id: string
  producer: string
  vintage?: number
  wine_name?: string
  appellation?: string
  region?: string
  country_code?: string
}

interface AIEnrichment {
  drink_window?: { from?: number; to?: number; source?: string[] };
  tasting_notes?: { text: string; source?: string[] };
  critic_scores?: { wine_spectator?: number; james_suckling?: number; source?: string[] };
  food_pairings?: { items: string[]; source?: string[] };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get OpenAI API key from environment
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }

    // Parse request body
    const { id, producer, vintage, wine_name, appellation, region, country_code }: EnrichmentRequest = await req.json()

    if (!id || !producer) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: id and producer' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Build wine description for AI
    let wineDescription = `${producer}`
    if (wine_name) wineDescription += ` ${wine_name}`
    if (vintage) wineDescription += ` ${vintage}`
    if (appellation) wineDescription += ` from ${appellation}`
    if (region) wineDescription += `, ${region}`
    if (country_code) wineDescription += `, ${country_code}`

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a wine expert. Provide detailed information about wines in JSON format. 
            For each wine, provide:
            - drink_window: Object with from (number), to (number), and source (array of strings)
            - tasting_notes: Object with text (string) and source (array of strings)
            - critic_scores: Object with wine_spectator (number), james_suckling (number), and source (array of strings)
            - food_pairings: Object with items (array of strings) and source (array of strings)
            - confidence: Number between 0 and 1 indicating your confidence in the information
            
            All fields are optional. Only include fields you have confident information about.
            For scores, use 50-100 range. For drink_window years, use actual years (e.g., 2020, 2025).
            Include source information when available (e.g., ["Wine Spectator", "James Suckling"]).
            Be conservative with confidence scores - only provide high confidence (0.8+) for well-known wines.
            
            Return only valid JSON, no other text.`
          },
          {
            role: 'user',
            content: `Please provide detailed information about this wine: ${wineDescription}`
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      throw new Error(`OpenAI API error: ${openaiResponse.status}`)
    }

    const openaiData = await openaiResponse.json()
    const aiContent = openaiData.choices?.[0]?.message?.content

    if (!aiContent) {
      throw new Error('No content received from OpenAI')
    }

    // Parse AI response
    let rawResponse: any
    try {
      rawResponse = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent)
      throw new Error('Invalid JSON response from AI')
    }

    // Normalize the response to match AIEnrichment type
    const normalizeEnrichment = (raw: any): { enrichment: AIEnrichment; confidence: number } => {
      const enrichment: AIEnrichment = {}
      
      // Normalize drink_window
      if (raw.drink_window) {
        enrichment.drink_window = {
          from: raw.drink_window.from,
          to: raw.drink_window.to,
          source: raw.drink_window.source || ["OpenAI"]
        }
      }
      
      // Normalize tasting_notes
      if (raw.tasting_notes) {
        enrichment.tasting_notes = {
          text: raw.tasting_notes.text || raw.tasting_notes,
          source: raw.tasting_notes.source || ["OpenAI"]
        }
      }
      
      // Normalize critic_scores
      if (raw.critic_scores) {
        enrichment.critic_scores = {
          wine_spectator: raw.critic_scores.wine_spectator,
          james_suckling: raw.critic_scores.james_suckling,
          source: raw.critic_scores.source || ["OpenAI"]
        }
      }
      
      // Normalize food_pairings
      if (raw.food_pairings) {
        enrichment.food_pairings = {
          items: raw.food_pairings.items || raw.food_pairings,
          source: raw.food_pairings.source || ["OpenAI"]
        }
      }
      
      // Extract confidence
      const confidence = typeof raw.confidence === 'number' ? raw.confidence : 0.5
      
      return { enrichment, confidence }
    }

    const { enrichment, confidence } = normalizeEnrichment(rawResponse)

    // Return the normalized enrichment data with confidence
    return new Response(
      JSON.stringify({
        ...enrichment,
        confidence
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in enrich-wine function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})