import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useLocalStorage } from '../useLocalStorage'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('useLocalStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should return initial value when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(localStorageMock.getItem).toHaveBeenCalledWith('test-key')
  })

  it('should return stored value when localStorage has data', () => {
    localStorageMock.getItem.mockReturnValue('"stored-value"')
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('stored-value')
  })

  it('should update localStorage when value changes', () => {
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(result.current[0]).toBe('new-value')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', '"new-value"')
  })

  it('should clear localStorage when clearValue is called', () => {
    localStorageMock.getItem.mockReturnValue('"stored-value"')
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[2]() // clearValue
    })
    
    expect(result.current[0]).toBe('initial')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('test-key')
  })

  it('should handle JSON parse errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json')
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    expect(result.current[0]).toBe('initial')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error reading localStorage key "test-key":',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should handle localStorage setItem errors gracefully', () => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    const { result } = renderHook(() => useLocalStorage('test-key', 'initial'))
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(result.current[0]).toBe('new-value')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error setting localStorage key "test-key":',
      expect.any(Error)
    )
    
    consoleSpy.mockRestore()
  })

  it('should work with custom serializer', () => {
    localStorageMock.getItem.mockReturnValue('custom-format')
    
    const serializer = {
      serialize: (value: string) => `custom-${value}`,
      deserialize: (value: string) => value.replace('custom-', '')
    }
    
    const { result } = renderHook(() => 
      useLocalStorage('test-key', 'initial', serializer)
    )
    
    expect(result.current[0]).toBe('format')
    
    act(() => {
      result.current[1]('new-value')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith('test-key', 'custom-new-value')
  })
})
