import { insertWine } from '../features/wines/data/wines'
import { requestEnrichment } from '../features/enrichment/data/enrich'
import type { WineFormData } from '../types'
import { BottleSize, WineStatus } from '../types'
import { normalizeCsvRow, validateVintage, validateUSState } from '../lib/csv-normalization'

interface CsvWineRow {
  producer: string
  vintage?: string
  wine_name?: string
  vineyard?: string
  appellation?: string
  region?: string
  country_code?: string
  us_state?: string
  varietals?: string
  bottle_size?: string
  purchase_date?: string
  purchase_place?: string
  location_row?: string
  location_position?: string
  status?: string
  peyton_rating?: string
  louis_rating?: string
  companions?: string
  peyton_notes?: string
  louis_notes?: string
  score_wine_spectator?: string
  score_james_suckling?: string
  drink_window_from?: string
  drink_window_to?: string
  drink_now?: string
}

/**
 * Parses CSV content and returns array of wine objects
 */
export function parseCsvContent(csvContent: string): CsvWineRow[] {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const row: any = {}
    
    headers.forEach((header, index) => {
      const value = values[index] || ''
      row[header] = value === '' ? undefined : value
    })
    
    return row as CsvWineRow
  })
}

/**
 * Converts CSV row to WineFormData with validation and warnings
 */
function csvRowToWine(row: CsvWineRow): { wineData: WineFormData; warnings: string[] } {
  const warnings: string[] = []
  
  // Normalize the row first
  const normalizedRow = normalizeCsvRow(row)
  
  // Validate vintage
  const vintageResult = validateVintage(normalizedRow.vintage)
  if (vintageResult.warning) {
    warnings.push(vintageResult.warning)
  }
  
  // Validate US state
  const stateResult = validateUSState(normalizedRow.us_state, normalizedRow.country_code)
  if (stateResult.warning) {
    warnings.push(stateResult.warning)
  }
  
  const wineData: WineFormData = {
    producer: normalizedRow.producer,
    vintage: vintageResult.value || undefined,
    wine_name: normalizedRow.wine_name,
    vineyard: normalizedRow.vineyard,
    appellation: normalizedRow.appellation,
    region: normalizedRow.region,
    country_code: normalizedRow.country_code?.toUpperCase(),
    us_state: stateResult.value || undefined,
    varietals: normalizedRow.varietals ? normalizedRow.varietals.split(';').map(v => v.trim()).filter(Boolean) : [],
    bottle_size: (normalizedRow.bottle_size as BottleSize) || BottleSize.STANDARD_750ML,
    purchase_date: normalizedRow.purchase_date,
    purchase_place: normalizedRow.purchase_place,
    location_row: normalizedRow.location_row,
    location_position: normalizedRow.location_position ? parseInt(normalizedRow.location_position) : undefined,
    status: (normalizedRow.status as WineStatus) || WineStatus.CELLARED,
    peyton_rating: normalizedRow.peyton_rating ? parseFloat(normalizedRow.peyton_rating) : undefined,
    louis_rating: normalizedRow.louis_rating ? parseFloat(normalizedRow.louis_rating) : undefined,
    companions: normalizedRow.companions ? normalizedRow.companions.split(';').map(c => c.trim()).filter(Boolean) : [],
    peyton_notes: normalizedRow.peyton_notes,
    louis_notes: normalizedRow.louis_notes,
    score_wine_spectator: normalizedRow.score_wine_spectator ? parseInt(normalizedRow.score_wine_spectator) : undefined,
    score_james_suckling: normalizedRow.score_james_suckling ? parseInt(normalizedRow.score_james_suckling) : undefined,
    drink_window_from: normalizedRow.drink_window_from ? parseInt(normalizedRow.drink_window_from) : undefined,
    drink_window_to: normalizedRow.drink_window_to ? parseInt(normalizedRow.drink_window_to) : undefined,
    drink_now: normalizedRow.drink_now === 'true' || normalizedRow.drink_now === '1',
  }
  
  return { wineData, warnings }
}

/**
 * Imports wines from CSV content
 */
export async function importWinesFromCsv(csvContent: string): Promise<{ success: number; errors: string[]; warnings: string[] }> {
  const rows = parseCsvContent(csvContent)
  const errors: string[] = []
  const warnings: string[] = []
  let success = 0

  for (const row of rows) {
    try {
      if (!row.producer) {
        errors.push(`Row ${success + errors.length + 1}: Missing producer`)
        continue
      }

      const { wineData, warnings: rowWarnings } = csvRowToWine(row)
      
      // Add row warnings to the warnings array
      if (rowWarnings.length > 0) {
        warnings.push(`Row ${success + errors.length + 1}: ${rowWarnings.join('; ')}`)
      }
      
      const createdWine = await insertWine(wineData)
      success++

      // Trigger AI enrichment for wines with minimal data
      if (!wineData.vintage && !wineData.wine_name && !wineData.region) {
        const minimal = {
          id: createdWine.id,
          producer: createdWine.producer,
          vintage: createdWine.vintage ?? undefined,
          wine_name: createdWine.wine_name ?? undefined,
          appellation: createdWine.appellation ?? undefined,
          region: createdWine.region ?? undefined,
          country_code: createdWine.country_code ?? undefined,
        }
        
        // Fire-and-forget enrichment
        requestEnrichment(minimal).catch(err => {
          console.warn(`AI enrichment failed for wine ${createdWine.id}:`, err)
        })
      }
    } catch (error) {
      errors.push(`Row ${success + errors.length + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return { success, errors, warnings }
}

/**
 * Generates sample CSV content for testing
 */
export function generateSampleCsv(): string {
  return `producer,vintage,wine_name,region,country_code,us_state,varietals,bottle_size,status
"domaine de la côte",2019,"Les Pierres","santa rita hills","us","ca","Pinot Noir",750ml,Cellared
"château margaux",2018,"","bordeaux","fr","","Cabernet Sauvignon;Merlot",750ml,Cellared
"ridge vineyards",2020,"Monte Bello","santa cruz mountains","us","ca","Cabernet Sauvignon;Merlot;Petit Verdot",750ml,Cellared
"domaine leflaive",2019,"Puligny-Montrachet","burgundy","fr","","Chardonnay",750ml,Cellared
"krug",2015,"Grande Cuvée","champagne","fr","","Chardonnay;Pinot Noir;Pinot Meunier",750ml,Cellared
"opus one",2017,"","napa valley","us","ca","Cabernet Sauvignon;Merlot;Cabernet Franc",750ml,Cellared
"dom pérignon",2015,"","champagne","fr","","Chardonnay;Pinot Noir",750ml,Cellared
"château d'yquem",2018,"","sauternes","fr","","Sémillon;Sauvignon Blanc",750ml,Cellared
"penfolds",2019,"Grange","south australia","au","","Shiraz",750ml,Cellared
"vega sicilia",2016,"Unico","ribera del duero","es","","Tempranillo;Cabernet Sauvignon",750ml,Cellared`
}
