import { useRef, useCallback } from 'react'

/**
 * Hook to manage modal close prevention during user interactions
 * Prevents accidental closes during textarea scrolling, slider dragging, etc.
 */
export function usePreventClose() {
  const shouldPreventCloseRef = useRef(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Prevent close during interaction
  const preventClose = useCallback(() => {
    shouldPreventCloseRef.current = true
    
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Allow close again after 100ms of no interaction
    timeoutRef.current = setTimeout(() => {
      shouldPreventCloseRef.current = false
    }, 100)
  }, [])

  // Check if close should be prevented
  const shouldPreventClose = useCallback(() => {
    return shouldPreventCloseRef.current
  }, [])

  // Cleanup timeout on unmount
  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  return {
    preventClose,
    shouldPreventClose,
    cleanup
  }
}

/**
 * Hook to detect user interactions that should prevent modal close
 * Attaches event listeners to textareas, sliders, and other interactive elements
 */
export function useInteractionDetection(containerRef: React.RefObject<HTMLElement | null>) {
  const { preventClose, cleanup } = usePreventClose()

  const attachInteractionListeners = useCallback(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    // Events that should prevent close
    const preventCloseEvents = [
      'mousedown',
      'mousemove',
      'touchstart',
      'touchmove',
      'pointerdown',
      'pointermove',
      'wheel',
      'scroll'
    ]

    // Elements that should trigger prevent close
    const interactiveSelectors = [
      'textarea',
      'input[type="range"]', // sliders
      'input[type="number"]',
      'input[type="text"]',
      'input[type="email"]',
      'input[type="password"]',
      'input[type="search"]',
      'input[type="tel"]',
      'input[type="url"]',
      'select',
      '[contenteditable="true"]',
      '[role="slider"]',
      '[role="spinbutton"]',
      '[role="textbox"]'
    ]

    const handleInteraction = (event: Event) => {
      const target = event.target as HTMLElement
      if (!target) return

      // Check if the interaction is on an interactive element
      const isInteractiveElement = interactiveSelectors.some(selector => 
        target.matches(selector) || target.closest(selector)
      )

      if (isInteractiveElement) {
        preventClose()
      }
    }

    // Attach listeners to the container
    preventCloseEvents.forEach(eventType => {
      container.addEventListener(eventType, handleInteraction, { passive: true })
    })

    // Cleanup function
    return () => {
      preventCloseEvents.forEach(eventType => {
        container.removeEventListener(eventType, handleInteraction)
      })
    }
  }, [containerRef, preventClose])

  return {
    attachInteractionListeners,
    cleanup
  }
}
