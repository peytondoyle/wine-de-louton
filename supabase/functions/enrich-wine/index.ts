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

interface AiEnrichment {
  tasting_notes?: string
  drink_window?: {
    from_year: number
    to_year: number
    drink_now: boolean
  }
  possible_scores?: {
    wine_spectator?: {
      score: number
      source_url?: string
    }
    james_suckling?: {
      score: number
      source_url?: string
    }
  }
  sources?: string[]
  confidence: number
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
            - tasting_notes: Detailed tasting notes (string)
            - drink_window: Object with from_year, to_year (numbers), and drink_now (boolean)
            - possible_scores: Object with wine_spectator and james_suckling scores (50-100) and optional source_url
            - sources: Array of source names (strings)
            - confidence: Confidence score between 0 and 1 (number)
            
            Be conservative with confidence scores. Only provide high confidence (0.8+) for well-known wines.
            For lesser-known wines, provide lower confidence scores (0.3-0.7).
            If you're not confident about the wine, set confidence below 0.75.
            
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
    let aiEnrichment: AiEnrichment
    try {
      aiEnrichment = JSON.parse(aiContent)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent)
      throw new Error('Invalid JSON response from AI')
    }

    // Validate and set default confidence if missing
    if (typeof aiEnrichment.confidence !== 'number') {
      aiEnrichment.confidence = 0.5
    }

    // Ensure confidence is between 0 and 1
    aiEnrichment.confidence = Math.max(0, Math.min(1, aiEnrichment.confidence))

    // Return the enrichment data
    return new Response(
      JSON.stringify(aiEnrichment),
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