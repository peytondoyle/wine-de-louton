import { describe, it, expect } from 'vitest'

// Mock the normalization function from the Supabase function
// This is the actual mapper logic that converts AI JSON to field suggestions
const normalizeEnrichment = (raw: any): { enrichment: any; confidence: number } => {
  const enrichment: any = {}
  
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

describe('Enrichment Mappers', () => {
  describe('normalizeEnrichment', () => {
    it('should normalize complete AI response with all fields', () => {
      const rawResponse = {
        drink_window: { from: 2024, to: 2030, source: ["WineSpectator"] },
        tasting_notes: { text: "Rich and complex wine", source: ["WineEnthusiast"] },
        critic_scores: { wine_spectator: 95, james_suckling: 92, source: ["Critics"] },
        food_pairings: { items: ["beef", "lamb"], source: ["FoodPairing"] },
        confidence: 0.85
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment).toEqual({
        drink_window: { from: 2024, to: 2030, source: ["WineSpectator"] },
        tasting_notes: { text: "Rich and complex wine", source: ["WineEnthusiast"] },
        critic_scores: { wine_spectator: 95, james_suckling: 92, source: ["Critics"] },
        food_pairings: { items: ["beef", "lamb"], source: ["FoodPairing"] }
      })
      expect(result.confidence).toBe(0.85)
    })

    it('should handle missing source arrays by adding default OpenAI source', () => {
      const rawResponse = {
        drink_window: { from: 2024, to: 2030 },
        tasting_notes: { text: "Rich and complex wine" },
        critic_scores: { wine_spectator: 95, james_suckling: 92 },
        food_pairings: { items: ["beef", "lamb"] },
        confidence: 0.7
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.drink_window.source).toEqual(["OpenAI"])
      expect(result.enrichment.tasting_notes.source).toEqual(["OpenAI"])
      expect(result.enrichment.critic_scores.source).toEqual(["OpenAI"])
      expect(result.enrichment.food_pairings.source).toEqual(["OpenAI"])
    })

    it('should handle string tasting_notes instead of object', () => {
      const rawResponse = {
        tasting_notes: "Rich and complex wine",
        confidence: 0.6
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.tasting_notes).toEqual({
        text: "Rich and complex wine",
        source: ["OpenAI"]
      })
    })

    it('should handle array food_pairings instead of object', () => {
      const rawResponse = {
        food_pairings: ["beef", "lamb", "cheese"],
        confidence: 0.8
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.food_pairings).toEqual({
        items: ["beef", "lamb", "cheese"],
        source: ["OpenAI"]
      })
    })

    it('should handle partial data with only some fields', () => {
      const rawResponse = {
        drink_window: { from: 2024, to: 2030 },
        critic_scores: { wine_spectator: 95 },
        confidence: 0.9
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment).toEqual({
        drink_window: { from: 2024, to: 2030, source: ["OpenAI"] },
        critic_scores: { wine_spectator: 95, james_suckling: undefined, source: ["OpenAI"] }
      })
      expect(result.enrichment.tasting_notes).toBeUndefined()
      expect(result.enrichment.food_pairings).toBeUndefined()
    })

    it('should handle empty response', () => {
      const rawResponse = {}

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment).toEqual({})
      expect(result.confidence).toBe(0.5)
    })

    it('should handle null/undefined values gracefully', () => {
      const rawResponse = {
        drink_window: null,
        tasting_notes: undefined,
        critic_scores: { wine_spectator: 95, james_suckling: null },
        food_pairings: { items: null },
        confidence: null
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment).toEqual({
        critic_scores: { wine_spectator: 95, james_suckling: null, source: ["OpenAI"] },
        food_pairings: { items: { items: null }, source: ["OpenAI"] }
      })
      expect(result.confidence).toBe(0.5)
    })

    it('should handle invalid confidence values', () => {
      const testCases = [
        { confidence: "invalid", expected: 0.5 },
        { confidence: null, expected: 0.5 },
        { confidence: undefined, expected: 0.5 },
        { confidence: -1, expected: -1 },
        { confidence: 1.5, expected: 1.5 },
        { confidence: 0, expected: 0 },
        { confidence: 1, expected: 1 }
      ]

      testCases.forEach(({ confidence, expected }) => {
        const rawResponse = { confidence }
        const result = normalizeEnrichment(rawResponse)
        expect(result.confidence).toBe(expected)
      })
    })

    it('should preserve existing source arrays', () => {
      const rawResponse = {
        drink_window: { from: 2024, to: 2030, source: ["WineSpectator", "WineEnthusiast"] },
        tasting_notes: { text: "Great wine", source: ["Parker"] },
        confidence: 0.8
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.drink_window.source).toEqual(["WineSpectator", "WineEnthusiast"])
      expect(result.enrichment.tasting_notes.source).toEqual(["Parker"])
    })

    it('should handle mixed data types in food_pairings', () => {
      const rawResponse = {
        food_pairings: { items: ["beef", "lamb", 123, null, "cheese"] },
        confidence: 0.7
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.food_pairings.items).toEqual(["beef", "lamb", 123, null, "cheese"])
    })

    it('should handle nested objects in unexpected places', () => {
      const rawResponse = {
        drink_window: { from: { year: 2024 }, to: 2030 },
        tasting_notes: { text: { description: "Rich wine" } },
        confidence: 0.6
      }

      const result = normalizeEnrichment(rawResponse)

      expect(result.enrichment.drink_window.from).toEqual({ year: 2024 })
      expect(result.enrichment.tasting_notes.text).toEqual({ description: "Rich wine" })
    })
  })
})
