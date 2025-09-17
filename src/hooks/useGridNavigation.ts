import { useCallback, useRef, useEffect, useState } from 'react'

interface GridNavigationOptions {
  rows: number
  columns: number
  onCellFocus?: (row: number, column: number) => void
  onCellActivate?: (row: number, column: number) => void
}

/**
 * Hook for managing grid navigation with arrow keys
 * Implements roving tabindex pattern for accessibility
 */
export function useGridNavigation({
  rows,
  columns,
  onCellFocus,
  onCellActivate
}: GridNavigationOptions) {
  const [focusedCell, setFocusedCell] = useState<{ row: number; column: number } | null>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  // Get the next cell in the specified direction
  const getNextCell = useCallback((row: number, column: number, direction: 'up' | 'down' | 'left' | 'right') => {
    switch (direction) {
      case 'up':
        return row > 1 ? { row: row - 1, column } : null
      case 'down':
        return row < rows ? { row: row + 1, column } : null
      case 'left':
        return column > 1 ? { row, column: column - 1 } : null
      case 'right':
        return column < columns ? { row, column: column + 1 } : null
      default:
        return null
    }
  }, [rows, columns])

  // Focus a specific cell
  const focusCell = useCallback((row: number, column: number) => {
    const cellElement = gridRef.current?.querySelector(
      `[data-grid-cell="${row}-${column}"]`
    ) as HTMLElement

    if (cellElement) {
      // Remove tabindex from all cells
      const allCells = gridRef.current?.querySelectorAll('[data-grid-cell]')
      allCells?.forEach(cell => {
        (cell as HTMLElement).setAttribute('tabindex', '-1')
      })

      // Set tabindex to 0 for focused cell
      cellElement.setAttribute('tabindex', '0')
      cellElement.focus()

      setFocusedCell({ row, column })
      onCellFocus?.(row, column)
    } else {
      // In test environment or when DOM elements don't exist yet,
      // just update the focused cell reference
      setFocusedCell({ row, column })
      onCellFocus?.(row, column)
    }
  }, [onCellFocus])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!focusedCell) return

    const { row, column } = focusedCell
    let nextCell: { row: number; column: number } | null = null

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        nextCell = getNextCell(row, column, 'up')
        break
      case 'ArrowDown':
        event.preventDefault()
        nextCell = getNextCell(row, column, 'down')
        break
      case 'ArrowLeft':
        event.preventDefault()
        nextCell = getNextCell(row, column, 'left')
        break
      case 'ArrowRight':
        event.preventDefault()
        nextCell = getNextCell(row, column, 'right')
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onCellActivate?.(row, column)
        return
    }

    if (nextCell) {
      focusCell(nextCell.row, nextCell.column)
    }
  }, [getNextCell, focusCell, onCellActivate, focusedCell])

  // Set up keyboard event listener
  useEffect(() => {
    const gridElement = gridRef.current
    if (!gridElement) return

    gridElement.addEventListener('keydown', handleKeyDown)
    return () => gridElement.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Initialize focus on first cell when grid is first rendered
  useEffect(() => {
    if (rows > 0 && columns > 0 && !focusedCell) {
      focusCell(1, 1)
    }
  }, [rows, columns, focusCell, focusedCell])

  return {
    gridRef,
    focusCell,
    focusedCell
  }
}
