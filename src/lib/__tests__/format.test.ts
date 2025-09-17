import { describe, it, expect } from 'vitest'
import { displayWineTitle } from '../format'
import type { Wine } from '../../types'

describe('Wine Title Formatting', () => {
  const mockWine: Partial<Wine> = {
    producer: 'Domaine de la Côte',
    wine_name: 'Les Pierres',
    vintage: 2019,
    vineyard: 'Santa Rita Hills'
  }

  it('should format wine title with wine name', () => {
    const wine = { ...mockWine } as Wine
    const result = displayWineTitle(wine)
    expect(result).toBe('Domaine de la Côte • Les Pierres • 2019')
  })

  it('should format wine title without wine name', () => {
    const wine = { ...mockWine, wine_name: undefined } as Wine
    const result = displayWineTitle(wine)
    expect(result).toBe('Domaine de la Côte • 2019')
  })

  it('should format wine title with NV vintage', () => {
    const wine = { ...mockWine, vintage: undefined } as Wine
    const result = displayWineTitle(wine)
    expect(result).toBe('Domaine de la Côte • Les Pierres • NV')
  })

  it('should format wine title with empty wine name', () => {
    const wine = { ...mockWine, wine_name: '' } as Wine
    const result = displayWineTitle(wine)
    expect(result).toBe('Domaine de la Côte • 2019')
  })

  it('should handle missing producer', () => {
    const wine = { ...mockWine, producer: undefined } as unknown as Wine
    const result = displayWineTitle(wine)
    expect(result).toBe('undefined • Les Pierres • 2019')
  })
})
