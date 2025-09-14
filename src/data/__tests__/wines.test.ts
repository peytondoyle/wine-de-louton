import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Wine, AIEnrichment } from '../../types'
import { WineStatus, BottleSize } from '../../types'

// Mock supabase before importing the module
const mockSupabase = vi.hoisted(() => ({
  from: vi.fn()
}))

vi.mock('../../lib/supabase', () => ({
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

describe('AI Enrichment Patch Helpers', () => {
  const mockWine: Wine = {
    id: 'test-wine-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
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

  describe('applyDrinkWindow', () => {
    it('should apply drink window and clear only drink_window from AI enrichment', async () => {
      const updatedWine = { ...mockWine, drink_window_from: 2024, drink_window_to: 2030 }
      const expectedEnrichment = {
        tasting_notes: { text: 'Test tasting notes', source: ['test'] },
        critic_scores: { wine_spectator: 95, james_suckling: 92, source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: expectedEnrichment }, 
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

      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
      expect(result.drink_window_from).toBe(2024)
      expect(result.drink_window_to).toBe(2030)
      expect(result.ai_enrichment).toEqual(expectedEnrichment)
    })

    it('should set ai_enrichment to null when only drink_window exists', async () => {
      const wineWithOnlyDrinkWindow = {
        ...mockWine,
        ai_enrichment: { drink_window: { from: 2024, to: 2030, source: ['test'] } }
      }
      const updatedWine = { ...wineWithOnlyDrinkWindow, drink_window_from: 2024, drink_window_to: 2030 }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithOnlyDrinkWindow, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: null }, 
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

      expect(result.ai_enrichment).toBeNull()
    })

    it('should throw error when wine not found', async () => {
      // Mock getWine call to return null
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(applyDrinkWindow('nonexistent-id', { from: 2024, to: 2030 }))
        .rejects.toThrow('Wine with id nonexistent-id not found')
    })
  })

  describe('applyTastingNotes', () => {
    it('should apply tasting notes to peyton_notes and clear only tasting_notes from AI enrichment', async () => {
      const updatedWine = { ...mockWine, peyton_notes: 'New tasting notes' }
      const expectedEnrichment = {
        drink_window: { from: 2024, to: 2030, source: ['test'] },
        critic_scores: { wine_spectator: 95, james_suckling: 92, source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: expectedEnrichment }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyTastingNotes('test-wine-id', 'New tasting notes')

      expect(result.peyton_notes).toBe('New tasting notes')
      expect(result.ai_enrichment).toEqual(expectedEnrichment)
    })

    it('should set ai_enrichment to null when only tasting_notes exists', async () => {
      const wineWithOnlyTastingNotes = {
        ...mockWine,
        ai_enrichment: { tasting_notes: { text: 'Test notes', source: ['test'] } }
      }
      const updatedWine = { ...wineWithOnlyTastingNotes, peyton_notes: 'New tasting notes' }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithOnlyTastingNotes, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: null }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyTastingNotes('test-wine-id', 'New tasting notes')

      expect(result.ai_enrichment).toBeNull()
    })

    it('should throw error when wine not found', async () => {
      // Mock getWine call to return null
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(applyTastingNotes('nonexistent-id', 'New notes'))
        .rejects.toThrow('Wine with id nonexistent-id not found')
    })
  })

  describe('applyCriticScores', () => {
    it('should apply both wine_spectator and james_suckling scores', async () => {
      const updatedWine = { 
        ...mockWine, 
        score_wine_spectator: 95, 
        score_james_suckling: 92 
      }
      const expectedEnrichment = {
        drink_window: { from: 2024, to: 2030, source: ['test'] },
        tasting_notes: { text: 'Test tasting notes', source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: expectedEnrichment }, 
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
        wine_spectator: 95, 
        james_suckling: 92 
      })

      expect(result.score_wine_spectator).toBe(95)
      expect(result.score_james_suckling).toBe(92)
    })

    it('should apply only wine_spectator score when james_suckling is undefined', async () => {
      const updatedWine = { ...mockWine, score_wine_spectator: 95 }
      const expectedEnrichment = {
        drink_window: { from: 2024, to: 2030, source: ['test'] },
        tasting_notes: { text: 'Test tasting notes', source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: expectedEnrichment }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyCriticScores('test-wine-id', { wine_spectator: 95 })

      expect(result.score_wine_spectator).toBe(95)
      expect(result.score_james_suckling).toBeUndefined()
    })

    it('should apply only james_suckling score when wine_spectator is undefined', async () => {
      const updatedWine = { ...mockWine, score_james_suckling: 92 }
      const expectedEnrichment = {
        drink_window: { from: 2024, to: 2030, source: ['test'] },
        tasting_notes: { text: 'Test tasting notes', source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: expectedEnrichment }, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect,
        update: mockUpdate
      })

      const result = await applyCriticScores('test-wine-id', { james_suckling: 92 })

      expect(result.score_wine_spectator).toBeUndefined()
      expect(result.score_james_suckling).toBe(92)
    })

    it('should set ai_enrichment to null when only critic_scores exists', async () => {
      const wineWithOnlyCriticScores = {
        ...mockWine,
        ai_enrichment: { critic_scores: { wine_spectator: 95, james_suckling: 92, source: ['test'] } }
      }
      const updatedWine = { 
        ...wineWithOnlyCriticScores, 
        score_wine_spectator: 95, 
        score_james_suckling: 92 
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithOnlyCriticScores, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...updatedWine, ai_enrichment: null }, 
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
        wine_spectator: 95, 
        james_suckling: 92 
      })

      expect(result.ai_enrichment).toBeNull()
    })

    it('should throw error when wine not found', async () => {
      // Mock getWine call to return null
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(applyCriticScores('nonexistent-id', { wine_spectator: 95 }))
        .rejects.toThrow('Wine with id nonexistent-id not found')
    })
  })

  describe('dismissAIField', () => {
    it('should dismiss specific field and keep other AI enrichment data', async () => {
      const expectedEnrichment = {
        drink_window: { from: 2024, to: 2030, source: ['test'] },
        critic_scores: { wine_spectator: 95, james_suckling: 92, source: ['test'] },
        food_pairings: { items: ['beef', 'lamb'], source: ['test'] }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, ai_enrichment: expectedEnrichment }, 
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

      expect(result.ai_enrichment).toEqual(expectedEnrichment)
    })

    it('should set ai_enrichment to null when dismissing the only field', async () => {
      const wineWithOnlyTastingNotes = {
        ...mockWine,
        ai_enrichment: { tasting_notes: { text: 'Test notes', source: ['test'] } }
      }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithOnlyTastingNotes, error: null }))
        }))
      }))

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: { ...wineWithOnlyTastingNotes, ai_enrichment: null }, 
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

      expect(result.ai_enrichment).toBeNull()
    })

    it('should handle wine with no AI enrichment', async () => {
      const wineWithoutAI = { ...mockWine, ai_enrichment: null }

      // Mock getWine call
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: wineWithoutAI, error: null }))
        }))
      }))

      // Mock updateWine call
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
        select: mockSelect,
        update: mockUpdate
      })

      const result = await dismissAIField('test-wine-id', 'tasting_notes')

      expect(result.ai_enrichment).toBeNull()
    })

    it('should throw error when wine not found', async () => {
      // Mock getWine call to return null
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      await expect(dismissAIField('nonexistent-id', 'tasting_notes'))
        .rejects.toThrow('Wine with id nonexistent-id not found')
    })
  })

  describe('dismissAllAI', () => {
    it('should clear all AI enrichment and confidence data', async () => {
      const updatedWine = { 
        ...mockWine, 
        ai_enrichment: null, 
        ai_confidence: null 
      }

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: updatedWine, 
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

    it('should not call getWine (unlike other functions)', async () => {
      const updatedWine = { 
        ...mockWine, 
        ai_enrichment: null, 
        ai_confidence: null 
      }

      // Mock updateWine call
      const mockUpdate = vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            maybeSingle: vi.fn(() => Promise.resolve({ 
              data: updatedWine, 
              error: null 
            }))
          }))
        }))
      }))

      mockSupabase.from.mockReturnValue({
        update: mockUpdate
      })

      await dismissAllAI('test-wine-id')

      // Verify that only update was called, not select
      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
      expect(mockSupabase.from).toHaveBeenCalledTimes(1)
    })
  })
})