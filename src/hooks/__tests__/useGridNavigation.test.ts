import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGridNavigation } from '../useGridNavigation'

describe('useGridNavigation', () => {
  it('should provide focusCell function that updates focused cell', () => {
    const onCellFocus = vi.fn()
    const onCellActivate = vi.fn()

    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 3,
        columns: 3,
        onCellFocus,
        onCellActivate
      })
    )

    // The hook automatically focuses the first cell (1, 1) on initialization
    expect(result.current.focusedCell).toEqual({ row: 1, column: 1 })
    expect(onCellFocus).toHaveBeenCalledWith(1, 1)

    // Focus a different cell manually
    act(() => {
      result.current.focusCell(2, 2)
    })

    expect(result.current.focusedCell).toEqual({ row: 2, column: 2 })
    expect(onCellFocus).toHaveBeenCalledWith(2, 2)
  })

  it('should provide focusCell function', () => {
    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 3,
        columns: 3
      })
    )

    expect(typeof result.current.focusCell).toBe('function')
  })

  it('should provide gridRef', () => {
    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 3,
        columns: 3
      })
    )

    expect(result.current.gridRef).toBeDefined()
  })

  it('should handle navigation within bounds', () => {
    const onCellFocus = vi.fn()
    
    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 2,
        columns: 2,
        onCellFocus
      })
    )

    // Focus cell (1, 1)
    act(() => {
      result.current.focusCell(1, 1)
    })

    expect(onCellFocus).toHaveBeenCalledWith(1, 1)

    // Focus cell (2, 2)
    act(() => {
      result.current.focusCell(2, 2)
    })

    expect(onCellFocus).toHaveBeenCalledWith(2, 2)
  })

  it('should handle single row/column grids', () => {
    const onCellFocus = vi.fn()
    
    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 1,
        columns: 1,
        onCellFocus
      })
    )

    // Focus the single cell
    act(() => {
      result.current.focusCell(1, 1)
    })

    expect(result.current.focusedCell).toEqual({ row: 1, column: 1 })
    expect(onCellFocus).toHaveBeenCalledWith(1, 1)
  })

  it('should handle zero-sized grids gracefully', () => {
    const { result } = renderHook(() => 
      useGridNavigation({
        rows: 0,
        columns: 0
      })
    )

    expect(result.current.focusedCell).toBeNull()
  })
})
