import { useEffect, useState } from 'react'
import { listWines } from '../features/wines/data/wines'
import type { Wine } from '../types'

const CACHE_KEY = 'wine-cache-v1'

interface UseWineCacheReturn {
  wines: Wine[]
  isStale: boolean
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useWineCache(): UseWineCacheReturn {
  const [cached, setCached] = useState<Wine[] | null>(null)
  const [fresh, setFresh] = useState<Wine[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load cached data immediately on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setCached(parsed)
      }
    } catch (err) {
      console.warn('Failed to load cached wines:', err)
      // Clear corrupted cache
      localStorage.removeItem(CACHE_KEY)
    }
  }, [])

  // Fetch fresh data in background
  useEffect(() => {
    const fetchFresh = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const data = await listWines()
        setFresh(data)
        
        // Update cache with fresh data
        localStorage.setItem(CACHE_KEY, JSON.stringify(data))
      } catch (err) {
        console.error('Failed to fetch fresh wines:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch wines')
      } finally {
        setIsLoading(false)
      }
    }

    fetchFresh()
  }, [])

  // Manual refresh function
  const refresh = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const data = await listWines()
      setFresh(data)
      
      // Update cache with fresh data
      localStorage.setItem(CACHE_KEY, JSON.stringify(data))
    } catch (err) {
      console.error('Failed to refresh wines:', err)
      setError(err instanceof Error ? err.message : 'Failed to refresh wines')
    } finally {
      setIsLoading(false)
    }
  }

  return {
    wines: fresh ?? cached ?? [],
    isStale: !!cached && !fresh,
    isLoading,
    error,
    refresh
  } satisfies UseWineCacheReturn
}