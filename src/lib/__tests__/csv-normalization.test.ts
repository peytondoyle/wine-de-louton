import { describe, it, expect } from 'vitest'
import { 
  toTitleCase, 
  trimStringFields, 
  validateVintage, 
  validateUSState, 
  normalizeProducer, 
  normalizeCsvRow 
} from '../csv-normalization'

describe('CSV Normalization', () => {
  describe('toTitleCase', () => {
    it('should convert basic strings to title case', () => {
      expect(toTitleCase('domaine de la côte')).toBe('Domaine de la Côte')
      expect(toTitleCase('château margaux')).toBe('Château Margaux')
      expect(toTitleCase('ridge vineyards')).toBe('Ridge Vineyards')
    })

    it('should handle wine industry special cases', () => {
      expect(toTitleCase('domaine de la côte')).toBe('Domaine de la Côte')
      expect(toTitleCase('château d\'yquem')).toBe('Château d\'Yquem')
      expect(toTitleCase('cave cooperative')).toBe('Cave Cooperative')
      expect(toTitleCase('société civile')).toBe('Société Civile')
    })

    it('should handle company suffixes', () => {
      expect(toTitleCase('wine company inc')).toBe('Wine Company Inc.')
      expect(toTitleCase('vineyards llc')).toBe('Vineyards LLC')
      expect(toTitleCase('estate ltd')).toBe('Estate Ltd.')
      expect(toTitleCase('winery gmbh')).toBe('Winery GmbH')
    })

    it('should handle hyphenated names', () => {
      expect(toTitleCase('domaine de la côte')).toBe('Domaine de la Côte')
      expect(toTitleCase('château d\'yquem')).toBe('Château d\'Yquem')
    })

    it('should handle empty and whitespace strings', () => {
      expect(toTitleCase('')).toBe('')
      expect(toTitleCase('   ')).toBe('   ')
      expect(toTitleCase('  test  ')).toBe('  Test  ')
    })
  })

  describe('trimStringFields', () => {
    it('should trim all string fields in an object', () => {
      const input = {
        producer: '  Domaine de la Côte  ',
        vintage: '2019',
        region: '  Burgundy  ',
        country_code: 'FR',
        numeric: 123
      }

      const result = trimStringFields(input)

      expect(result.producer).toBe('Domaine de la Côte')
      expect(result.vintage).toBe('2019')
      expect(result.region).toBe('Burgundy')
      expect(result.country_code).toBe('FR')
      expect(result.numeric).toBe(123)
    })

    it('should handle undefined and null values', () => {
      const input = {
        producer: '  Test  ',
        vintage: undefined,
        region: null,
        country_code: 'US'
      }

      const result = trimStringFields(input)

      expect(result.producer).toBe('Test')
      expect(result.vintage).toBeUndefined()
      expect(result.region).toBeNull()
      expect(result.country_code).toBe('US')
    })
  })

  describe('validateVintage', () => {
    it('should validate valid vintages', () => {
      const currentYear = new Date().getFullYear()
      
      expect(validateVintage('2019')).toEqual({ value: 2019 })
      expect(validateVintage('1900')).toEqual({ value: 1900 })
      expect(validateVintage(currentYear.toString())).toEqual({ value: currentYear })
      expect(validateVintage((currentYear + 1).toString())).toEqual({ value: currentYear + 1 })
    })

    it('should handle invalid vintages', () => {
      expect(validateVintage('invalid')).toEqual({ 
        value: null, 
        warning: 'Invalid vintage "invalid" - not a number' 
      })
      expect(validateVintage('abc123')).toEqual({ 
        value: null, 
        warning: 'Invalid vintage "abc123" - not a number' 
      })
    })

    it('should handle out of range vintages', () => {
      const currentYear = new Date().getFullYear()
      
      expect(validateVintage('1899')).toEqual({ 
        value: 1899, 
        warning: `Vintage 1899 is outside valid range (1900-${currentYear + 1})` 
      })
      expect(validateVintage((currentYear + 2).toString())).toEqual({ 
        value: currentYear + 2, 
        warning: `Vintage ${currentYear + 2} is outside valid range (1900-${currentYear + 1})` 
      })
    })

    it('should handle empty and undefined vintages', () => {
      expect(validateVintage('')).toEqual({ value: null })
      expect(validateVintage(undefined)).toEqual({ value: null })
      expect(validateVintage('   ')).toEqual({ value: null })
    })
  })

  describe('validateUSState', () => {
    it('should validate valid US state codes', () => {
      expect(validateUSState('CA', 'US')).toEqual({ value: 'CA' })
      expect(validateUSState('ny', 'us')).toEqual({ value: 'NY' })
      expect(validateUSState('Tx', 'US')).toEqual({ value: 'TX' })
      expect(validateUSState('dc', 'US')).toEqual({ value: 'DC' })
    })

    it('should handle invalid US state codes', () => {
      expect(validateUSState('XX', 'US')).toEqual({ 
        value: null, 
        warning: 'Invalid US state code "XX" for country US' 
      })
      expect(validateUSState('invalid', 'US')).toEqual({ 
        value: null, 
        warning: 'Invalid US state code "invalid" for country US' 
      })
    })

    it('should return null for non-US countries', () => {
      expect(validateUSState('CA', 'FR')).toEqual({ value: null })
      expect(validateUSState('NY', 'DE')).toEqual({ value: null })
      expect(validateUSState('TX', undefined)).toEqual({ value: null })
    })

    it('should handle empty and undefined states', () => {
      expect(validateUSState('', 'US')).toEqual({ value: null })
      expect(validateUSState(undefined, 'US')).toEqual({ value: null })
      expect(validateUSState('   ', 'US')).toEqual({ value: null })
    })
  })

  describe('normalizeProducer', () => {
    it('should normalize producer names to title case', () => {
      expect(normalizeProducer('domaine de la côte')).toBe('Domaine de la Côte')
      expect(normalizeProducer('  château margaux  ')).toBe('Château Margaux')
      expect(normalizeProducer('ridge vineyards')).toBe('Ridge Vineyards')
    })

    it('should handle empty and undefined producers', () => {
      expect(normalizeProducer('')).toBe('')
      expect(normalizeProducer(undefined)).toBe('')
      expect(normalizeProducer('   ')).toBe('')
    })
  })

  describe('normalizeCsvRow', () => {
    it('should normalize all string fields and producer', () => {
      const input = {
        producer: '  domaine de la côte  ',
        vintage: '2019',
        region: '  burgundy  ',
        country_code: '  FR  ',
        us_state: '  ca  ',
        numeric: 123
      }

      const result = normalizeCsvRow(input)

      expect(result.producer).toBe('Domaine de la Côte')
      expect(result.vintage).toBe('2019')
      expect(result.region).toBe('burgundy')
      expect(result.country_code).toBe('FR')
      expect(result.us_state).toBe('ca')
      expect(result.numeric).toBe(123)
    })

    it('should handle objects without producer field', () => {
      const input = {
        vintage: '2019',
        region: '  burgundy  ',
        country_code: 'FR'
      }

      const result = normalizeCsvRow(input)

      expect(result.vintage).toBe('2019')
      expect(result.region).toBe('burgundy')
      expect(result.country_code).toBe('FR')
    })
  })
})
