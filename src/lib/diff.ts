/**
 * Micro-diff utilities for highlighting changes between current and suggested values
 */

export interface DiffResult {
  hasChanges: boolean
  html: string
}

/**
 * Generate a diff for drink window values
 * Highlights changed numbers with green (additions) and red (removals)
 */
export function diffDrinkWindow(current: string, suggested: string): DiffResult {
  if (current === suggested) {
    return { hasChanges: false, html: suggested }
  }

  // Parse current and suggested values
  const currentMatch = current.match(/(\d{4})–(\d{4})/)
  const suggestedMatch = suggested.match(/(\d{4})–(\d{4})/)
  
  if (!currentMatch || !suggestedMatch) {
    // If parsing fails, just show the suggested value
    return { hasChanges: true, html: suggested }
  }

  const [, currentFrom, currentTo] = currentMatch
  const [, suggestedFrom, suggestedTo] = suggestedMatch

  let html = ''
  
  // Compare "from" years
  if (currentFrom === suggestedFrom) {
    html += suggestedFrom
  } else {
    html += `<span class="diff-removed">${currentFrom}</span><span class="diff-added">${suggestedFrom}</span>`
  }
  
  html += '–'
  
  // Compare "to" years
  if (currentTo === suggestedTo) {
    html += suggestedTo
  } else {
    html += `<span class="diff-removed">${currentTo}</span><span class="diff-added">${suggestedTo}</span>`
  }

  return { hasChanges: true, html }
}

/**
 * Generate a word-level diff for tasting notes
 * Highlights additions in green
 */
export function diffTastingNotes(current: string, suggested: string): DiffResult {
  if (current === suggested) {
    return { hasChanges: false, html: suggested }
  }

  // Simple word-level diff
  const currentWords = current.split(/\s+/)
  const suggestedWords = suggested.split(/\s+/)
  
  const result: string[] = []
  let i = 0
  let j = 0

  while (i < currentWords.length || j < suggestedWords.length) {
    if (i >= currentWords.length) {
      // Only suggested words left - these are additions
      result.push(`<span class="diff-added">${suggestedWords[j]}</span>`)
      j++
    } else if (j >= suggestedWords.length) {
      // Only current words left - these are removals
      result.push(`<span class="diff-removed">${currentWords[i]}</span>`)
      i++
    } else if (currentWords[i] === suggestedWords[j]) {
      // Words match - no highlighting
      result.push(currentWords[i])
      i++
      j++
    } else {
      // Words don't match - check if it's an addition or removal
      const currentWord = currentWords[i].toLowerCase()
      const suggestedWord = suggestedWords[j].toLowerCase()
      
      if (currentWord === suggestedWord) {
        // Case difference only
        result.push(suggestedWords[j])
        i++
        j++
      } else {
        // Different words - treat as addition
        result.push(`<span class="diff-added">${suggestedWords[j]}</span>`)
        j++
      }
    }
  }

  return { hasChanges: true, html: result.join(' ') }
}

/**
 * Generate a diff for critic scores
 * Highlights changed scores with green/red
 */
export function diffCriticScores(current: string, suggested: string): DiffResult {
  if (current === suggested) {
    return { hasChanges: false, html: suggested }
  }

  // Parse scores from both strings
  const parseScores = (str: string) => {
    const scores: { [key: string]: string } = {}
    const matches = str.match(/(WS|JS):\s*(\d+)/g)
    if (matches) {
      matches.forEach(match => {
        const [, critic, score] = match.match(/(WS|JS):\s*(\d+)/) || []
        if (critic && score) {
          scores[critic] = score
        }
      })
    }
    return scores
  }

  const currentScores = parseScores(current)
  const suggestedScores = parseScores(suggested)

  const result: string[] = []
  const allCritics = new Set([...Object.keys(currentScores), ...Object.keys(suggestedScores)])

  for (const critic of allCritics) {
    const currentScore = currentScores[critic]
    const suggestedScore = suggestedScores[critic]

    if (currentScore && suggestedScore) {
      if (currentScore === suggestedScore) {
        result.push(`${critic}: ${suggestedScore}`)
      } else {
        result.push(`${critic}: <span class="diff-removed">${currentScore}</span><span class="diff-added">${suggestedScore}</span>`)
      }
    } else if (suggestedScore) {
      result.push(`${critic}: <span class="diff-added">${suggestedScore}</span>`)
    } else if (currentScore) {
      result.push(`${critic}: <span class="diff-removed">${currentScore}</span>`)
    }
  }

  return { hasChanges: true, html: result.join(', ') }
}

/**
 * Generate a diff for food pairings
 * Highlights additions in green
 */
export function diffFoodPairings(current: string, suggested: string): DiffResult {
  if (current === suggested) {
    return { hasChanges: false, html: suggested }
  }

  // Parse items from both strings
  const currentItems = current.split(',').map(item => item.trim()).filter(Boolean)
  const suggestedItems = suggested.split(',').map(item => item.trim()).filter(Boolean)

  const result: string[] = []
  const allItems = new Set([...currentItems, ...suggestedItems])

  for (const item of allItems) {
    const inCurrent = currentItems.includes(item)
    const inSuggested = suggestedItems.includes(item)

    if (inCurrent && inSuggested) {
      result.push(item)
    } else if (inSuggested) {
      result.push(`<span class="diff-added">${item}</span>`)
    } else if (inCurrent) {
      result.push(`<span class="diff-removed">${item}</span>`)
    }
  }

  return { hasChanges: true, html: result.join(', ') }
}

/**
 * Generic diff function that routes to the appropriate diff type
 */
export function generateDiff(field: string, current: string, suggested: string): DiffResult {
  switch (field) {
    case 'drink_window':
      return diffDrinkWindow(current, suggested)
    case 'tasting_notes':
      return diffTastingNotes(current, suggested)
    case 'critic_scores':
      return diffCriticScores(current, suggested)
    case 'food_pairings':
      return diffFoodPairings(current, suggested)
    default:
      return { hasChanges: current !== suggested, html: suggested }
  }
}
