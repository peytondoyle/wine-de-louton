import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Wine, AIEnrichment } from '../../../../types'
import { WineStatus, BottleSize } from '../../../../types'

// Mock supabase before importing the module
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('../../../../lib/supabase', () => ({
  supabase: mockSupabase
}))

// Import after mocking
import { 
  applyDrinkWindow, 
  applyTastingNotes, 
  applyCriticScores, 
  dismissAIField, 
  dismissAllAI 
} from '../wines'

describe('Wines Patch Helpers - Additional Edge Cases', () => {
  const mockWine: Wine = {
    id: 'test-wine-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    household_id: 'test-household',
    producer: 'Test Producer',
    varietals: ['Cabernet Sauvignon'],
    bottle_size: BottleSize.STANDARD_750ML,
    status: WineStatus.CELLARED,
    companions: [],
    ai_enrichment: {
      drink_window: { from: 2024, to: 2030, source: ['test'] },
      tasting_notes: { text: 'Test tasting notes', source: ['test'] },
      critic_scores: { wine_spectator: 95, james_suckling: 92, source: ['test'] },
      food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
    },
    ai_confidence: 0.85
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('applyDrinkWindow - Edge Cases', () => {
    it('should handle undefined drink window values', async () => {
      const wineWithUndefinedValues = {
        ...mockWine,
        ai_enrichment: {
          drink_window: { from: undefined, to: undefined, source: ['test'] }
        }
      }

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithUndefinedValues, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...wineWithUndefinedValues, drink_window_from: undefined, drink_window_to: undefined }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyDrinkWindow('test-wine-id', { from: undefined, to: undefined })

      expect(result.drink_window_from).toBeUndefined()
      expect(result.drink_window_to).toBeUndefined()
    })

    it('should handle wine with no AI enrichment', async () => {
      const wineWithoutAI = { ...mockWine, ai_enrichment: null }

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithoutAI, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...wineWithoutAI, drink_window_from: 2024, drink_window_to: 2030 }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyDrinkWindow('test-wine-id', { from: 2024, to: 2030 })

      expect(result.drink_window_from).toBe(2024)
      expect(result.drink_window_to).toBe(2030)
      expect(result.ai_enrichment).toBeNull()
    })
  })

  describe('applyTastingNotes - Edge Cases', () => {
    it('should handle empty tasting notes', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, peyton_notes: '' }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyTastingNotes('test-wine-id', '')

      expect(result.peyton_notes).toBe('')
    })

    it('should handle very long tasting notes', async () => {
      const longNotes = 'A'.repeat(10000)
      
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, peyton_notes: longNotes }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyTastingNotes('test-wine-id', longNotes)

      expect(result.peyton_notes).toBe(longNotes)
    })
  })

  describe('applyCriticScores - Edge Cases', () => {
    it('should handle zero scores', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, score_wine_spectator: 0, score_james_suckling: 0 }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyCriticScores('test-wine-id', { 
        wine_spectator: 0, 
        james_suckling: 0 
      })

      expect(result.score_wine_spectator).toBe(0)
      expect(result.score_james_suckling).toBe(0)
    })

    it('should handle very high scores', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, score_wine_spectator: 100, score_james_suckling: 100 }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyCriticScores('test-wine-id', { 
        wine_spectator: 100, 
        james_suckling: 100 
      })

      expect(result.score_wine_spectator).toBe(100)
      expect(result.score_james_suckling).toBe(100)
    })

    it('should handle only one score being provided', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, score_wine_spectator: 95 }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyCriticScores('test-wine-id', { 
        wine_spectator: 95 
      })

      expect(result.score_wine_spectator).toBe(95)
      expect(result.score_james_suckling).toBeUndefined()
    })
  })

  describe('dismissAIField - Edge Cases', () => {
    it('should handle dismissing non-existent field', async () => {
      const wineWithPartialAI = {
        ...mockWine,
        ai_enrichment: { drink_window: { from: 2024, to: 2030, source: ['test'] } }
      }

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithPartialAI, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: wineWithPartialAI, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await dismissAIField('test-wine-id', 'tasting_notes')

      expect(result.ai_enrichment).toEqual(wineWithPartialAI.ai_enrichment)
    })

    it('should handle dismissing field from empty enrichment object', async () => {
      const wineWithEmptyAI = {
        ...mockWine,
        ai_enrichment: {}
      }

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithEmptyAI, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...wineWithEmptyAI, ai_enrichment: null }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await dismissAIField('test-wine-id', 'drink_window')

      expect(result.ai_enrichment).toBeNull()
    })
  })

  describe('dismissAllAI - Edge Cases', () => {
    it('should handle wine with no AI data', async () => {
      const wineWithoutAI = { ...mockWine, ai_enrichment: null, ai_confidence: null }

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: wineWithoutAI, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      })

      const result = await dismissAllAI('test-wine-id')

      expect(result.ai_enrichment).toBeNull()
      expect(result.ai_confidence).toBeNull()
    })

    it('should handle wine with only confidence data', async () => {
      const wineWithOnlyConfidence = { 
        ...mockWine, 
        ai_enrichment: null, 
        ai_confidence: 0.8 
      }

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...wineWithOnlyConfidence, ai_confidence: null }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      })

      const result = await dismissAllAI('test-wine-id')

      expect(result.ai_enrichment).toBeNull()
      expect(result.ai_confidence).toBeNull()
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors in applyDrinkWindow', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(applyDrinkWindow('test-wine-id', { from: 2024, to: 2030 }))
        .rejects.toThrow('Failed to fetch wine: Database error')
    })

    it('should handle update errors in applyTastingNotes', async () => {
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: null, 
              error: { message: 'Update failed' } 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      await expect(applyTastingNotes('test-wine-id', 'New notes'))
        .rejects.toThrow('Update failed: Update failed')
    })
  })
})
