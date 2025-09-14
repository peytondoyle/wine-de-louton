import { describe, it, expect } from 'vitest'
import { 
  diffDrinkWindow, 
  diffTastingNotes, 
  diffCriticScores, 
  diffFoodPairings, 
  generateDiff 
} from '../diff'

describe('diffDrinkWindow', () => {
  it('should return no changes when values are identical', () => {
    const result = diffDrinkWindow('2024–2030', '2024–2030')
    expect(result.hasChanges).toBe(false)
    expect(result.html).toBe('2024–2030')
  })

  it('should highlight changed years', () => {
    const result = diffDrinkWindow('2024–2030', '2025–2031')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('2024')
    expect(result.html).toContain('2025')
    expect(result.html).toContain('2030')
    expect(result.html).toContain('2031')
  })

  it('should handle only "from" year change', () => {
    const result = diffDrinkWindow('2024–2030', '2025–2030')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('2024')
    expect(result.html).toContain('2025')
    expect(result.html).toContain('2030')
  })

  it('should handle only "to" year change', () => {
    const result = diffDrinkWindow('2024–2030', '2024–2031')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('2024')
    expect(result.html).toContain('2030')
    expect(result.html).toContain('2031')
  })

  it('should handle invalid format gracefully', () => {
    const result = diffDrinkWindow('invalid', '2024–2030')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toBe('2024–2030')
  })
})

describe('diffTastingNotes', () => {
  it('should return no changes when notes are identical', () => {
    const result = diffTastingNotes('Rich and complex', 'Rich and complex')
    expect(result.hasChanges).toBe(false)
    expect(result.html).toBe('Rich and complex')
  })

  it('should highlight word-level additions', () => {
    const result = diffTastingNotes('Rich and complex', 'Rich and complex wine')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('wine')
  })

  it('should handle case differences', () => {
    const result = diffTastingNotes('rich and complex', 'Rich and Complex')
    expect(result.hasChanges).toBe(true) // Case differences are treated as changes
    expect(result.html).toBe('Rich and Complex')
  })

  it('should handle multiple word additions', () => {
    const result = diffTastingNotes('Rich wine', 'Rich and complex wine')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('and')
    expect(result.html).toContain('complex')
  })

  it('should handle word removals', () => {
    const result = diffTastingNotes('Rich and complex wine', 'Rich wine')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('and')
    expect(result.html).toContain('complex')
  })
})

describe('diffCriticScores', () => {
  it('should return no changes when scores are identical', () => {
    const result = diffCriticScores('WS: 95, JS: 92', 'WS: 95, JS: 92')
    expect(result.hasChanges).toBe(false)
    expect(result.html).toBe('WS: 95, JS: 92')
  })

  it('should highlight changed scores', () => {
    const result = diffCriticScores('WS: 95, JS: 92', 'WS: 96, JS: 93')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('95')
    expect(result.html).toContain('96')
    expect(result.html).toContain('92')
    expect(result.html).toContain('93')
  })

  it('should handle new scores', () => {
    const result = diffCriticScores('WS: 95', 'WS: 95, JS: 92')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('JS: <span class="diff-added">92</span>')
  })

  it('should handle removed scores', () => {
    const result = diffCriticScores('WS: 95, JS: 92', 'WS: 95')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('JS: <span class="diff-removed">92</span>')
  })

  it('should handle only one critic change', () => {
    const result = diffCriticScores('WS: 95, JS: 92', 'WS: 96, JS: 92')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('95')
    expect(result.html).toContain('96')
  })
})

describe('diffFoodPairings', () => {
  it('should return no changes when pairings are identical', () => {
    const result = diffFoodPairings('beef, lamb', 'beef, lamb')
    expect(result.hasChanges).toBe(false)
    expect(result.html).toBe('beef, lamb')
  })

  it('should highlight new pairings', () => {
    const result = diffFoodPairings('beef', 'beef, lamb')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('lamb')
  })

  it('should highlight removed pairings', () => {
    const result = diffFoodPairings('beef, lamb', 'beef')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('lamb')
  })

  it('should handle multiple additions and removals', () => {
    const result = diffFoodPairings('beef, lamb', 'chicken, fish')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('beef')
    expect(result.html).toContain('lamb')
    expect(result.html).toContain('chicken')
    expect(result.html).toContain('fish')
  })

  it('should handle empty strings', () => {
    const result = diffFoodPairings('', 'beef, lamb')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
    expect(result.html).toContain('beef')
    expect(result.html).toContain('lamb')
  })

  it('should handle whitespace differences', () => {
    const result = diffFoodPairings('beef, lamb', 'beef,lamb')
    expect(result.hasChanges).toBe(true) // Whitespace differences are treated as changes
    expect(result.html).toBe('beef, lamb') // Returns the suggested value
  })
})

describe('generateDiff', () => {
  it('should route to correct diff function for drink_window', () => {
    const result = generateDiff('drink_window', '2024–2030', '2025–2031')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-removed')
    expect(result.html).toContain('diff-added')
  })

  it('should route to correct diff function for tasting_notes', () => {
    const result = generateDiff('tasting_notes', 'Rich wine', 'Rich and complex wine')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
  })

  it('should route to correct diff function for critic_scores', () => {
    const result = generateDiff('critic_scores', 'WS: 95', 'WS: 95, JS: 92')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
  })

  it('should route to correct diff function for food_pairings', () => {
    const result = generateDiff('food_pairings', 'beef', 'beef, lamb')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toContain('diff-added')
  })

  it('should handle unknown field types', () => {
    const result = generateDiff('unknown_field', 'old value', 'new value')
    expect(result.hasChanges).toBe(true)
    expect(result.html).toBe('new value')
  })

  it('should return no changes for identical values in unknown field', () => {
    const result = generateDiff('unknown_field', 'same value', 'same value')
    expect(result.hasChanges).toBe(false)
    expect(result.html).toBe('same value')
  })
})
