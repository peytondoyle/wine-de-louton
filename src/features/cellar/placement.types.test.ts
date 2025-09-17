import { describe, it, expect } from 'vitest'
import { slotKey, formatSlot } from './placement.types'
import { DepthPosition } from '../../types'

describe('Placement Types', () => {
  it('should format slot key correctly', () => {
    const s = { shelf: 3, column_position: 5, depth: DepthPosition.FRONT }
    expect(slotKey(s)).toBe('3:5:1')
  })

  it('should format slot display correctly', () => {
    const s = { shelf: 3, column_position: 5, depth: DepthPosition.FRONT }
    expect(formatSlot(s)).toBe('S3 · C5 · Front')
  })
})
