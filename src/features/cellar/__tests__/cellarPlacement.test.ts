import { describe, it, expect, vi, beforeEach } from 'vitest'
import { assignSlot } from '../cellar.api'
import { supabase } from '../../../lib/supabase'
import { DepthPosition } from '../../../types'

// Mock Supabase
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    from: vi.fn(() => ({
      upsert: vi.fn()
    }))
  }
}))

describe('Cellar Placement Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('assignSlot', () => {
    it('should throw SLOT_OCCUPIED error when slot is already taken', async () => {
      // Mock collision check returning true (slot is occupied)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: true, // Slot is occupied
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      })

      const slotAssignment = {
        shelf: 1,
        column_position: 2,
        depth: DepthPosition.FRONT
      }

      await expect(assignSlot('wine-123', slotAssignment)).rejects.toThrow('SLOT_OCCUPIED')
      
      // Verify collision check was called
      expect(supabase.rpc).toHaveBeenCalledWith('check_slot_collision', {
        p_fridge_id: '00000000-0000-0000-0000-000000000001',
        p_shelf: 1,
        p_column: 2,
        p_depth: DepthPosition.FRONT,
        p_exclude_wine_id: 'wine-123'
      })

      // Verify upsert was not called
      expect(supabase.from).not.toHaveBeenCalled()
    })

    it('should successfully assign wine when slot is available', async () => {
      // Mock collision check returning false (slot is available)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false, // Slot is available
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      })

      // Mock successful upsert
      const mockUpsert = vi.fn().mockResolvedValueOnce({ error: null })
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: mockUpsert
      } as any)

      const slotAssignment = {
        shelf: 1,
        column_position: 2,
        depth: DepthPosition.BACK
      }

      const result = await assignSlot('wine-123', slotAssignment)
      
      expect(result).toBe(true)
      
      // Verify collision check was called
      expect(supabase.rpc).toHaveBeenCalledWith('check_slot_collision', {
        p_fridge_id: '00000000-0000-0000-0000-000000000001',
        p_shelf: 1,
        p_column: 2,
        p_depth: DepthPosition.BACK,
        p_exclude_wine_id: 'wine-123'
      })

      // Verify upsert was called with correct data
      expect(mockUpsert).toHaveBeenCalledWith(
        {
          wine_id: 'wine-123',
          shelf: 1,
          column_position: 2,
          depth: DepthPosition.BACK
        },
        { onConflict: 'wine_id' }
      )
    })

    it('should throw error when collision check fails', async () => {
      // Mock collision check error
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: null,
        error: { 
          message: 'Database connection failed',
          details: '',
          hint: '',
          code: 'CONNECTION_ERROR',
          name: 'PostgrestError'
        },
        count: null,
        status: 500,
        statusText: 'Internal Server Error'
      })

      const slotAssignment = {
        shelf: 1,
        column_position: 2,
        depth: DepthPosition.FRONT
      }

      await expect(assignSlot('wine-123', slotAssignment)).rejects.toThrow('Failed to check slot collision: Database connection failed')
    })

    it('should throw error when database upsert fails', async () => {
      // Mock collision check returning false (slot is available)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      })

      // Mock failed upsert
      const mockUpsert = vi.fn().mockResolvedValueOnce({ 
        error: { message: 'Constraint violation' } 
      })
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: mockUpsert
      } as any)

      const slotAssignment = {
        shelf: 1,
        column_position: 2,
        depth: DepthPosition.FRONT
      }

      await expect(assignSlot('wine-123', slotAssignment)).rejects.toThrow('Database error: Constraint violation')
    })

    it('should exclude current wine when checking for collisions', async () => {
      // Mock collision check returning false (slot is available for reassignment)
      vi.mocked(supabase.rpc).mockResolvedValueOnce({
        data: false,
        error: null,
        count: null,
        status: 200,
        statusText: 'OK'
      })

      // Mock successful upsert
      const mockUpsert = vi.fn().mockResolvedValueOnce({ error: null })
      vi.mocked(supabase.from).mockReturnValueOnce({
        upsert: mockUpsert
      } as any)

      const slotAssignment = {
        shelf: 1,
        column_position: 2,
        depth: DepthPosition.FRONT
      }

      await assignSlot('wine-123', slotAssignment)
      
      // Verify collision check excludes the current wine
      expect(supabase.rpc).toHaveBeenCalledWith('check_slot_collision', {
        p_fridge_id: '00000000-0000-0000-0000-000000000001',
        p_shelf: 1,
        p_column: 2,
        p_depth: DepthPosition.FRONT,
        p_exclude_wine_id: 'wine-123'
      })
    })
  })
})
