import { describe, it, expect, vi, beforeEach } from 'vitest'
import { listWines, updateWine, markDrunk } from '../src/features/wines/data/wines'
import { WineStatus, BottleSize } from '../src/types'
import type { Wine } from '../src/types'

// Mock the Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      ilike: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      gte: vi.fn(() => ({
        lte: vi.fn(() => ({
          or: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({ data: [], error: null }))
          }))
        }))
      })),
      order: vi.fn(() => Promise.resolve({ data: [], error: null }))
    })),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: null, error: null }))
      }))
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      }))
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null }))
    }))
  }))
}

// Mock the supabase module
vi.mock('../src/lib/supabase', () => ({
  supabase: mockSupabase
}))

// Mock validation functions
vi.mock('../src/lib/validation', () => ({
  safeParseWine: vi.fn((data) => data),
  safeParseWineArray: vi.fn((data) => data),
  validateCreateWine: vi.fn((data) => data),
  validateUpdateWine: vi.fn((data) => data)
}))

describe('Wines Data Smoke Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('listWines', () => {
    it('should fetch wines with default parameters', async () => {
      const mockWines: Wine[] = [
        {
          id: '1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          household_id: 'test-household',
          producer: 'Test Producer',
          varietals: ['Chardonnay'],
          bottle_size: BottleSize.STANDARD_750ML,
          status: WineStatus.CELLARED,
          companions: []
        }
      ]

      // Mock successful response
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: mockWines, error: null }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await listWines()

      expect(result).toEqual(mockWines)
      expect(mockSupabase.from).toHaveBeenCalledWith('wines')
    })

    it('should handle empty results', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockQuery)

      const result = await listWines()

      expect(result).toEqual([])
    })

    it('should apply filters correctly', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            ilike: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockQuery)

      await listWines({
        status: WineStatus.CELLARED,
        country_code: 'US',
        region: 'Napa',
        search: 'test'
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', WineStatus.CELLARED)
      expect(mockQuery.eq).toHaveBeenCalledWith('country_code', 'US')
    })

    it('should handle errors gracefully', async () => {
      const mockQuery = {
        select: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Database error' } }))
        }))
      }
      
      mockSupabase.from.mockReturnValue(mockQuery)

      await expect(listWines()).rejects.toThrow('Failed to fetch wines: Database error')
    })
  })

  describe('updateWine', () => {
    it('should update wine with valid data', async () => {
      const mockWine: Wine = {
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        household_id: 'test-household',
        producer: 'Updated Producer',
        varietals: ['Chardonnay'],
        bottle_size: BottleSize.STANDARD_750ML,
        status: WineStatus.CELLARED,
        companions: []
      }

      // Mock getWine call (for current wine state)
      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, producer: 'Original Producer' }, 
              error: null 
            }))
          }))
        }))
      }

      // Mock update call
      const updateQuery = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
            }))
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(getWineQuery) // getWine call
        .mockReturnValueOnce(updateQuery)  // update call

      const result = await updateWine('1', { producer: 'Updated Producer' })

      expect(result).toEqual(mockWine)
      expect(updateQuery.update).toHaveBeenCalledWith({ producer: 'Updated Producer' })
    })

    it('should handle wine not found', async () => {
      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(getWineQuery)

      await expect(updateWine('nonexistent', { producer: 'Test' }))
        .rejects.toThrow('Wine with id nonexistent not found')
    })

    it('should handle update errors', async () => {
      const mockWine: Wine = {
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        household_id: 'test-household',
        producer: 'Test Producer',
        varietals: ['Chardonnay'],
        bottle_size: BottleSize.STANDARD_750ML,
        status: WineStatus.CELLARED,
        companions: []
      }

      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
          }))
        }))
      }

      const updateQuery = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: null, error: { message: 'Update failed' } }))
            }))
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(getWineQuery)
        .mockReturnValueOnce(updateQuery)

      await expect(updateWine('1', { producer: 'Updated' }))
        .rejects.toThrow('Update failed: Update failed')
    })
  })

  describe('markDrunk', () => {
    it('should mark wine as drunk with current date', async () => {
      const mockWine: Wine = {
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        household_id: 'test-household',
        producer: 'Test Producer',
        varietals: ['Chardonnay'],
        bottle_size: BottleSize.STANDARD_750ML,
        status: WineStatus.DRUNK,
        drank_on: '2024-01-15',
        companions: []
      }

      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, status: WineStatus.CELLARED, drank_on: undefined }, 
              error: null 
            }))
          }))
        }))
      }

      const updateQuery = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
            }))
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(getWineQuery)
        .mockReturnValueOnce(updateQuery)

      const result = await markDrunk('1')

      expect(result).toEqual(mockWine)
      expect(updateQuery.update).toHaveBeenCalledWith({
        status: WineStatus.DRUNK,
        drank_on: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/) // YYYY-MM-DD format
      })
    })

    it('should mark wine as drunk with custom date', async () => {
      const customDate = '2024-01-20'
      const mockWine: Wine = {
        id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        household_id: 'test-household',
        producer: 'Test Producer',
        varietals: ['Chardonnay'],
        bottle_size: BottleSize.STANDARD_750ML,
        status: WineStatus.DRUNK,
        drank_on: customDate,
        companions: []
      }

      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { ...mockWine, status: WineStatus.CELLARED, drank_on: undefined }, 
              error: null 
            }))
          }))
        }))
      }

      const updateQuery = {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn(() => Promise.resolve({ data: mockWine, error: null }))
            }))
          }))
        }))
      }

      mockSupabase.from
        .mockReturnValueOnce(getWineQuery)
        .mockReturnValueOnce(updateQuery)

      const result = await markDrunk('1', customDate)

      expect(result).toEqual(mockWine)
      expect(updateQuery.update).toHaveBeenCalledWith({
        status: WineStatus.DRUNK,
        drank_on: customDate
      })
    })

    it('should handle markDrunk errors', async () => {
      const getWineQuery = {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }

      mockSupabase.from.mockReturnValue(getWineQuery)

      await expect(markDrunk('nonexistent'))
        .rejects.toThrow('Wine with id nonexistent not found')
    })
  })
})
