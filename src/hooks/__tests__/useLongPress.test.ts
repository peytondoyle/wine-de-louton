import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLongPress } from '../useLongPress'

describe('useLongPress', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should trigger onLongPress after delay', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    
    const { result } = renderHook(() => 
      useLongPress({
        onLongPress,
        onClick,
        delay: 300
      })
    )

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        preventDefault: vi.fn(),
        target: document.createElement('div')
      } as any)
    })

    // Fast-forward time by 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onLongPress).toHaveBeenCalledTimes(1)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should trigger onClick on short press', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    
    const { result } = renderHook(() => 
      useLongPress({
        onLongPress,
        onClick,
        delay: 300
      })
    )

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        preventDefault: vi.fn(),
        target: document.createElement('div')
      } as any)
    })

    // Simulate touch end before delay
    act(() => {
      result.current.onTouchEnd({
        preventDefault: vi.fn(),
        target: document.createElement('div')
      } as any)
    })

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onLongPress).not.toHaveBeenCalled()
  })

  it('should clear timeout on touch cancel', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    
    const { result } = renderHook(() => 
      useLongPress({
        onLongPress,
        onClick,
        delay: 300
      })
    )

    // Simulate touch start
    act(() => {
      result.current.onTouchStart({
        preventDefault: vi.fn(),
        target: document.createElement('div')
      } as any)
    })

    // Simulate touch cancel
    act(() => {
      result.current.onTouchCancel()
    })

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(onLongPress).not.toHaveBeenCalled()
    expect(onClick).not.toHaveBeenCalled()
  })

  it('should prevent context menu', () => {
    const onLongPress = vi.fn()
    const onClick = vi.fn()
    const preventDefault = vi.fn()
    
    const { result } = renderHook(() => 
      useLongPress({
        onLongPress,
        onClick,
        delay: 300
      })
    )

    // Simulate context menu event
    act(() => {
      result.current.onContextMenu({
        preventDefault
      } as any)
    })

    expect(preventDefault).toHaveBeenCalledTimes(1)
  })
})
