import { useEffect, useRef, useCallback } from 'react'

/**
 * Hook to trap focus within a modal/drawer
 * Manages focus restoration and keyboard navigation
 */
export function useFocusTrap(isOpen: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLElement>(null)
  const previousActiveElementRef = useRef<HTMLElement | null>(null)

  // Store the element that was focused before the modal opened
  useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement
    }
  }, [isOpen])

  // Focus management
  const focusFirstElement = useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [])

  const focusLastElement = useCallback(() => {
    if (!containerRef.current) return

    const focusableElements = getFocusableElements(containerRef.current)
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus()
    }
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen || !containerRef.current) return

    if (event.key === 'Escape' && onClose) {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key === 'Tab') {
      const focusableElements = getFocusableElements(containerRef.current)
      if (focusableElements.length === 0) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]
      const activeElement = document.activeElement as HTMLElement

      if (event.shiftKey) {
        // Shift + Tab: move backwards
        if (activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab: move forwards
        if (activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }
  }, [isOpen, onClose])

  // Set up focus trap
  useEffect(() => {
    if (!isOpen) return

    // Focus first element when modal opens
    const timeoutId = setTimeout(focusFirstElement, 100)

    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      clearTimeout(timeoutId)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, focusFirstElement, handleKeyDown])

  // Restore focus when modal closes
  useEffect(() => {
    if (!isOpen && previousActiveElementRef.current) {
      // Small delay to ensure modal is fully closed
      const timeoutId = setTimeout(() => {
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus()
          previousActiveElementRef.current = null
        }
      }, 100)

      return () => clearTimeout(timeoutId)
    }
  }, [isOpen])

  return containerRef
}

/**
 * Get all focusable elements within a container
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'a[href]',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]'
  ].join(', ')

  return Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[]
}
