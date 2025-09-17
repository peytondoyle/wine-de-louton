/**
 * Utility functions for CSV import normalization and validation
 */

// US State codes for validation
const US_STATE_CODES = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC'
])

/**
 * Converts a string to Title Case
 * Handles common wine industry terms and special cases
 */
export function toTitleCase(str: string): string {
  if (!str) return str
  
  // Special cases for wine industry terms
  const specialCases: Record<string, string> = {
    'de': 'de',
    'du': 'du',
    'des': 'des',
    'la': 'la',
    'le': 'le',
    'les': 'les',
    'et': 'et',
    'en': 'en',
    'sur': 'sur',
    'sous': 'sous',
    'd\'': 'd\'',
    'l\'': 'l\'',
    'd\'yquem': 'd\'Yquem',
    'château': 'Château',
    'domaine': 'Domaine',
    'cave': 'Cave',
    'caves': 'Caves',
    'vignobles': 'Vignobles',
    'vignoble': 'Vignoble',
    'winery': 'Winery',
    'wines': 'Wines',
    'vineyards': 'Vineyards',
    'vineyard': 'Vineyard',
    'estate': 'Estate',
    'cellars': 'Cellars',
    'cellar': 'Cellar',
    'cooperative': 'Cooperative',
    'coopérative': 'Coopérative',
    'société': 'Société',
    'societe': 'Société',
    'sarl': 'SARL',
    'sas': 'SAS',
    's.a.': 'S.A.',
    'sa': 'SA',
    'gmbh': 'GmbH',
    'kg': 'KG',
    'ag': 'AG',
    'inc': 'Inc.',
    'inc.': 'Inc.',
    'llc': 'LLC',
    'ltd': 'Ltd.',
    'ltd.': 'Ltd.',
    'corp': 'Corp.',
    'corp.': 'Corp.',
    'co': 'Co.',
    'co.': 'Co.',
    '&': '&',
    'and': 'and',
    'of': 'of',
    'the': 'the',
    'at': 'at',
    'in': 'in',
    'on': 'on',
    'for': 'for',
    'with': 'with',
    'by': 'by',
    'from': 'from',
    'to': 'to',
    'a': 'a',
    'an': 'an',
    'as': 'as',
    'is': 'is',
    'are': 'are',
    'was': 'was',
    'were': 'were',
    'be': 'be',
    'been': 'been',
    'being': 'being',
    'have': 'have',
    'has': 'has',
    'had': 'had',
    'do': 'do',
    'does': 'does',
    'did': 'did',
    'will': 'will',
    'would': 'would',
    'could': 'could',
    'should': 'should',
    'may': 'may',
    'might': 'might',
    'must': 'must',
    'can': 'can',
    'shall': 'shall'
  }

  // Split by common delimiters while preserving them
  const words = str.split(/(\s+|[-\/&]+)/)
  
  return words.map(word => {
    const trimmed = word.trim()
    if (!trimmed) return word
    
    // Check if it's a delimiter
    if (/^[\s\-\/&]+$/.test(trimmed)) return word
    
    // Check special cases first
    const lowerWord = trimmed.toLowerCase()
    if (specialCases[lowerWord]) {
      return specialCases[lowerWord]
    }
    
    // Handle words with apostrophes
    if (trimmed.includes("'")) {
      return trimmed.split(/(?=')/).map(part => {
        if (part === "'") return part
        const lowerPart = part.toLowerCase()
        if (specialCases[lowerPart]) {
          return specialCases[lowerPart]
        }
        // For parts after apostrophe, check if it's a special case
        if (part.startsWith("'")) {
          const afterApostrophe = part.slice(1).toLowerCase()
          if (specialCases[afterApostrophe]) {
            return "'" + specialCases[afterApostrophe]
          }
        }
        return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }).join('')
    }
    
    // Handle hyphenated words
    if (trimmed.includes('-')) {
      return trimmed.split('-').map(part => {
        const lowerPart = part.toLowerCase()
        return specialCases[lowerPart] || part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
      }).join('-')
    }
    
    // Default title case
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase()
  }).join('')
}

/**
 * Trims whitespace from all string fields in an object
 */
export function trimStringFields<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj }
  
  for (const key in result) {
    if (typeof result[key] === 'string') {
      result[key] = result[key].trim()
    }
  }
  
  return result
}

/**
 * Validates and coerces vintage to integer
 * Returns null if invalid, otherwise returns the integer
 */
export function validateVintage(vintage: string | undefined): { value: number | null; warning?: string } {
  if (!vintage || vintage.trim() === '') {
    return { value: null }
  }
  
  const trimmed = vintage.trim()
  const parsed = parseInt(trimmed, 10)
  
  if (isNaN(parsed)) {
    return { 
      value: null, 
      warning: `Invalid vintage "${trimmed}" - not a number` 
    }
  }
  
  const currentYear = new Date().getFullYear()
  const minYear = 1900
  const maxYear = currentYear + 1
  
  if (parsed < minYear || parsed > maxYear) {
    return { 
      value: parsed, 
      warning: `Vintage ${parsed} is outside valid range (${minYear}-${maxYear})` 
    }
  }
  
  return { value: parsed }
}

/**
 * Validates US state code
 * Returns the validated state code or null if invalid
 */
export function validateUSState(state: string | undefined, countryCode: string | undefined): { value: string | null; warning?: string } {
  if (!state || state.trim() === '') {
    return { value: null }
  }
  
  if (countryCode?.toUpperCase() !== 'US') {
    return { value: null }
  }
  
  const trimmed = state.trim().toUpperCase()
  
  if (!US_STATE_CODES.has(trimmed)) {
    return { 
      value: null, 
      warning: `Invalid US state code "${state}" for country US` 
    }
  }
  
  return { value: trimmed }
}

/**
 * Normalizes producer name to Title Case
 */
export function normalizeProducer(producer: string | undefined): string {
  if (!producer) return ''
  return toTitleCase(producer.trim())
}

/**
 * Normalizes all string fields in a CSV row
 */
export function normalizeCsvRow<T extends Record<string, any>>(row: T): T {
  const normalized = trimStringFields(row)
  
  // Normalize producer to Title Case
  if ('producer' in normalized && normalized.producer && typeof normalized.producer === 'string') {
    (normalized as any).producer = normalizeProducer(normalized.producer as string)
  }
  
  return normalized
}

/**
 * Normalizes an array of CSV data rows
 */
export function normalizeCsvData<T extends Record<string, any>>(data: T[]): T[] {
  return data.map(row => normalizeCsvRow(row))
}
