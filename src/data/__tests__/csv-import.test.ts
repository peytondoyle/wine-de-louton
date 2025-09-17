import { describe, it, expect, vi, beforeEach } from 'vitest'
import { importWinesFromCsv, parseCsvContent } from '../csv-import'
import { insertWine } from '../../features/wines/data/wines'
import { requestEnrichment } from '../../features/enrichment/data/enrich'
import { BottleSize, WineStatus } from '../../types'

// Mock the dependencies
vi.mock('../../features/wines/data/wines', () => ({
  insertWine: vi.fn()
}))

vi.mock('../../features/enrichment/data/enrich', () => ({
  requestEnrichment: vi.fn()
}))

describe('CSV Import', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('parseCsvContent', () => {
    it('should parse CSV content correctly', () => {
      const csvContent = `producer,vintage,region,country_code
"Domaine de la Côte",2019,"Santa Rita Hills","US"
"Château Margaux",2018,"Bordeaux","FR"`

      const result = parseCsvContent(csvContent)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        producer: 'Domaine de la Côte',
        vintage: '2019',
        region: 'Santa Rita Hills',
        country_code: 'US'
      })
      expect(result[1]).toEqual({
        producer: 'Château Margaux',
        vintage: '2018',
        region: 'Bordeaux',
        country_code: 'FR'
      })
    })

    it('should handle empty values', () => {
      const csvContent = `producer,vintage,region,country_code
"Domaine de la Côte",,,"US"
"Château Margaux",2018,,"FR"`

      const result = parseCsvContent(csvContent)

      expect(result[0].vintage).toBeUndefined()
      expect(result[0].region).toBeUndefined()
      expect(result[1].region).toBeUndefined()
    })
  })

  describe('importWinesFromCsv', () => {
    it('should import wines successfully with normalization', async () => {
      const mockWine = {
        id: 'wine-1',
        producer: 'Domaine de la Côte',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        household_id: 'household-1',
        varietals: [],
        companions: [],
        status: WineStatus.CELLARED,
        bottle_size: BottleSize.STANDARD_750ML
      }
      vi.mocked(insertWine).mockResolvedValue(mockWine)

      const csvContent = `producer,vintage,region,country_code,us_state
"domaine de la côte",2019,"santa rita hills","us","ca"
"château margaux",2018,"bordeaux","fr",""`

      const result = await importWinesFromCsv(csvContent)

      expect(result.success).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(0)

      // Check that insertWine was called with normalized data
      expect(vi.mocked(insertWine)).toHaveBeenCalledTimes(2)
      expect(vi.mocked(insertWine)).toHaveBeenNthCalledWith(1, expect.objectContaining({
        producer: 'Domaine de la Côte',
        vintage: 2019,
        region: 'santa rita hills',
        country_code: 'US',
        us_state: 'CA'
      }))
      expect(vi.mocked(insertWine)).toHaveBeenNthCalledWith(2, expect.objectContaining({
        producer: 'Château Margaux',
        vintage: 2018,
        region: 'bordeaux',
        country_code: 'FR',
        us_state: undefined
      }))
    })

    it('should handle validation warnings', async () => {
      const mockWine = {
        id: 'wine-1',
        producer: 'Test Producer',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        household_id: 'household-1',
        varietals: [],
        companions: [],
        status: WineStatus.CELLARED,
        bottle_size: BottleSize.STANDARD_750ML
      }
      vi.mocked(insertWine).mockResolvedValue(mockWine)

      const csvContent = `producer,vintage,region,country_code,us_state
"test producer",2027,"california","us","xx"
"another producer",1800,"france","fr",""`

      const result = await importWinesFromCsv(csvContent)

      expect(result.success).toBe(2)
      expect(result.errors).toHaveLength(0)
      expect(result.warnings).toHaveLength(2)
      // First row has both vintage and state warnings combined
      expect(result.warnings[0]).toContain('Vintage 2027 is outside valid range')
      expect(result.warnings[0]).toContain('Invalid US state code "xx" for country US')
      // Second row has only vintage warning
      expect(result.warnings[1]).toContain('Vintage 1800 is outside valid range')
    })

    it('should handle missing producer errors', async () => {
      const csvContent = `producer,vintage,region,country_code
"",2019,"california","us"
"valid producer",2018,"france","fr"`

      const mockWine = {
        id: 'wine-1',
        producer: 'Valid Producer',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        household_id: 'household-1',
        varietals: [],
        companions: [],
        status: WineStatus.CELLARED,
        bottle_size: BottleSize.STANDARD_750ML
      }
      vi.mocked(insertWine).mockResolvedValue(mockWine)

      const result = await importWinesFromCsv(csvContent)

      expect(result.success).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Missing producer')
    })

    it('should handle database errors', async () => {
      vi.mocked(insertWine).mockRejectedValue(new Error('Database error'))

      const csvContent = `producer,vintage,region,country_code
"test producer",2019,"california","us"`

      const result = await importWinesFromCsv(csvContent)

      expect(result.success).toBe(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('Database error')
    })

    it('should trigger AI enrichment for minimal data wines', async () => {
      const mockWine = {
        id: 'wine-1',
        producer: 'Test Producer',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        household_id: 'household-1',
        varietals: [],
        companions: [],
        status: WineStatus.CELLARED,
        bottle_size: BottleSize.STANDARD_750ML
      }
      vi.mocked(insertWine).mockResolvedValue(mockWine)
      vi.mocked(requestEnrichment).mockResolvedValue(null)

      const csvContent = `producer,vintage,wine_name,region
"test producer",,,""`

      await importWinesFromCsv(csvContent)

      expect(vi.mocked(requestEnrichment)).toHaveBeenCalledWith({
        id: 'wine-1',
        producer: 'Test Producer',
        vintage: undefined,
        wine_name: undefined,
        appellation: undefined,
        region: undefined,
        country_code: undefined
      })
    })

    it('should not trigger AI enrichment for wines with sufficient data', async () => {
      const mockWine = {
        id: 'wine-1',
        producer: 'Test Producer',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        household_id: 'household-1',
        varietals: [],
        companions: [],
        status: WineStatus.CELLARED,
        bottle_size: BottleSize.STANDARD_750ML
      }
      vi.mocked(insertWine).mockResolvedValue(mockWine)

      const csvContent = `producer,vintage,wine_name,region
"test producer",2019,"Test Wine","California"`

      await importWinesFromCsv(csvContent)

      expect(vi.mocked(requestEnrichment)).not.toHaveBeenCalled()
    })
  })
})
