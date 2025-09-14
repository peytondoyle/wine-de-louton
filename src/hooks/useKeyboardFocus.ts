import { useEffect, useRef } from 'react'

/**
 * Hook to handle iOS keyboard focus management for drawers/sheets
 * Ensures focused inputs are visible when keyboard appears
 */
export function useKeyboardFocus(isOpen: boolean) {
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !scrollAreaRef.current) return

    // Focus the first input when sheet opens
    const firstInput = scrollAreaRef.current.querySelector('input, textarea, select') as HTMLElement
    if (firstInput) {
      // Small delay to ensure the sheet is fully rendered
      setTimeout(() => {
        firstInput.focus()
        // Scroll the focused element into view
        firstInput.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        })
      }, 100)
    }
  }, [isOpen])

  // Handle focus events to keep focused elements visible
  useEffect(() => {
    if (!isOpen || !scrollAreaRef.current) return

    const handleFocus = (event: FocusEvent) => {
      const target = event.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        // Scroll the focused element into view with some padding
        target.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center',
          inline: 'nearest'
        })
      }
    }

    const scrollArea = scrollAreaRef.current
    scrollArea.addEventListener('focusin', handleFocus)

    return () => {
      scrollArea.removeEventListener('focusin', handleFocus)
    }
  }, [isOpen])

  return scrollAreaRef
}
