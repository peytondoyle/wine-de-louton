import { useState, useCallback, useRef } from 'react'
import { toast } from '../lib/toast'

interface ConfirmationState {
  field: string | null
  isVisible: boolean
  appliedFields: Set<string>
}

export function useEnrichmentConfirmations() {
  const [confirmations, setConfirmations] = useState<ConfirmationState>({
    field: null,
    isVisible: false,
    appliedFields: new Set()
  })
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const toastIdRef = useRef<string | null>(null)

  const showConfirmation = useCallback((field: string) => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Add field to applied fields
    setConfirmations(prev => ({
      field,
      isVisible: true,
      appliedFields: new Set([...prev.appliedFields, field])
    }))

    // Hide confirmation after 1200ms
    timeoutRef.current = setTimeout(() => {
      setConfirmations(prev => ({
        ...prev,
        field: null,
        isVisible: false
      }))
    }, 1200)

    // Show deduped toast message
    const appliedCount = confirmations.appliedFields.size + 1
    const message = `Applied ${appliedCount} field${appliedCount === 1 ? '' : 's'}`
    
    // Dismiss previous toast if it exists
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }
    
    // Show new toast
    toastIdRef.current = toast.success(message, 2000)
  }, [confirmations.appliedFields])

  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }
    setConfirmations({
      field: null,
      isVisible: false,
      appliedFields: new Set()
    })
  }, [])

  return {
    confirmations,
    showConfirmation,
    reset
  }
}
