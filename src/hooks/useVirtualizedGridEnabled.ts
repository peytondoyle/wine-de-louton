import { useState, useEffect, useRef } from 'react'

/**
 * Hook to determine if virtualized grid should be enabled
 * Checks VITE_VIRTUAL_GRID environment variable and localStorage.virtualGrid override
 */
export function useVirtualizedGridEnabled(): boolean {
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const hasLogged = useRef<boolean>(false)

  useEffect(() => {
    // Check environment variable first
    const envValue = import.meta.env.VITE_VIRTUAL_GRID
    const envEnabled = envValue === 'true' || envValue === '1'

    // Check localStorage override
    const localStorageValue = localStorage.getItem('virtualGrid')
    const localStorageEnabled = localStorageValue === 'true' || localStorageValue === '1'

    // Environment variable takes precedence, then localStorage
    const enabled = envEnabled || localStorageEnabled

    setIsEnabled(enabled)

    // Log one-time info when virtualization is enabled
    if (enabled && !hasLogged.current) {
      console.info('🍷 Virtualized grid enabled', {
        source: envEnabled ? 'environment' : 'localStorage',
        envValue,
        localStorageValue
      })
      hasLogged.current = true
    }
  }, [])

  return isEnabled
}

/**
 * Utility function to set the virtual grid flag in localStorage
 * Useful for debugging or user preferences
 */
export function setVirtualGridEnabled(enabled: boolean): void {
  localStorage.setItem('virtualGrid', enabled.toString())
}

/**
 * Utility function to get the current virtual grid setting
 * Useful for debugging or checking current state
 */
export function getVirtualGridEnabled(): boolean {
  const envValue = import.meta.env.VITE_VIRTUAL_GRID
  const envEnabled = envValue === 'true' || envValue === '1'
  
  const localStorageValue = localStorage.getItem('virtualGrid')
  const localStorageEnabled = localStorageValue === 'true' || localStorageValue === '1'
  
  return envEnabled || localStorageEnabled
}
