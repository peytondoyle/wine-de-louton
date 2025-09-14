import { insertWine } from '../features/wines/data/wines'
import { requestEnrichment } from '../features/enrichment/data/enrich'
import type { WineFormData } from '../types'
import { BottleSize, WineStatus } from '../types'

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
 * Converts CSV row to WineFormData
 */
function csvRowToWine(row: CsvWineRow): WineFormData {
  return {
    producer: row.producer,
    vintage: row.vintage ? parseInt(row.vintage) : undefined,
    wine_name: row.wine_name,
    vineyard: row.vineyard,
    appellation: row.appellation,
    region: row.region,
    country_code: row.country_code?.toUpperCase(),
    us_state: row.us_state?.toUpperCase(),
    varietals: row.varietals ? row.varietals.split(';').map(v => v.trim()).filter(Boolean) : [],
    bottle_size: (row.bottle_size as BottleSize) || BottleSize.STANDARD_750ML,
    purchase_date: row.purchase_date,
    purchase_place: row.purchase_place,
    location_row: row.location_row,
    location_position: row.location_position ? parseInt(row.location_position) : undefined,
    status: (row.status as WineStatus) || WineStatus.CELLARED,
    peyton_rating: row.peyton_rating ? parseFloat(row.peyton_rating) : undefined,
    louis_rating: row.louis_rating ? parseFloat(row.louis_rating) : undefined,
    companions: row.companions ? row.companions.split(';').map(c => c.trim()).filter(Boolean) : [],
    peyton_notes: row.peyton_notes,
    louis_notes: row.louis_notes,
    score_wine_spectator: row.score_wine_spectator ? parseInt(row.score_wine_spectator) : undefined,
    score_james_suckling: row.score_james_suckling ? parseInt(row.score_james_suckling) : undefined,
    drink_window_from: row.drink_window_from ? parseInt(row.drink_window_from) : undefined,
    drink_window_to: row.drink_window_to ? parseInt(row.drink_window_to) : undefined,
    drink_now: row.drink_now === 'true' || row.drink_now === '1',
  }
}

/**
 * Imports wines from CSV content
 */
export async function importWinesFromCsv(csvContent: string): Promise<{ success: number; errors: string[] }> {
  const rows = parseCsvContent(csvContent)
  const errors: string[] = []
  let success = 0

  for (const row of rows) {
    try {
      if (!row.producer) {
        errors.push(`Row ${success + errors.length + 1}: Missing producer`)
        continue
      }

      const wineData = csvRowToWine(row)
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

  return { success, errors }
}

/**
 * Generates sample CSV content for testing
 */
export function generateSampleCsv(): string {
  return `producer,vintage,wine_name,region,country_code,varietals,bottle_size,status
"Domaine de la Côte",2019,"Les Pierres","Santa Rita Hills","US","Pinot Noir",750ml,Cellared
"Château Margaux",2018,"","Bordeaux","FR","Cabernet Sauvignon;Merlot",750ml,Cellared
"Ridge Vineyards",2020,"Monte Bello","Santa Cruz Mountains","US","Cabernet Sauvignon;Merlot;Petit Verdot",750ml,Cellared
"Domaine Leflaive",2019,"Puligny-Montrachet","Burgundy","FR","Chardonnay",750ml,Cellared
"Krug",2015,"Grande Cuvée","Champagne","FR","Chardonnay;Pinot Noir;Pinot Meunier",750ml,Cellared
"Opus One",2017,"","Napa Valley","US","Cabernet Sauvignon;Merlot;Cabernet Franc",750ml,Cellared
"Dom Pérignon",2015,"","Champagne","FR","Chardonnay;Pinot Noir",750ml,Cellared
"Château d'Yquem",2018,"","Sauternes","FR","Sémillon;Sauvignon Blanc",750ml,Cellared
"Penfolds",2019,"Grange","South Australia","AU","Shiraz",750ml,Cellared
"Vega Sicilia",2016,"Unico","Ribera del Duero","ES","Tempranillo;Cabernet Sauvignon",750ml,Cellared`
}
