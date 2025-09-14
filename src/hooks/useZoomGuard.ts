import { useEffect, useRef } from 'react'

/**
 * Hook to prevent zooming when modals/drawers are open
 * Only disables user-scalable when a modal is active, preserving accessibility
 * @param isModalOpen - Whether a modal/drawer is open
 */
export function useZoomGuard(isModalOpen: boolean) {
  const originalViewportRef = useRef<string>('')

  useEffect(() => {
    // Guard for server-side rendering
    if (typeof window === 'undefined') return

    if (isModalOpen) {
      // Store original viewport content
      const viewportMeta = document.querySelector('meta[name="viewport"]')
      if (viewportMeta) {
        originalViewportRef.current = viewportMeta.getAttribute('content') || ''
        
        // Disable zooming by adding user-scalable=no
        const newContent = originalViewportRef.current.includes('user-scalable=no')
          ? originalViewportRef.current
          : `${originalViewportRef.current}, user-scalable=no`
        
        viewportMeta.setAttribute('content', newContent)
      }
    } else {
      // Restore original viewport content
      const viewportMeta = document.querySelector('meta[name="viewport"]')
      if (viewportMeta && originalViewportRef.current) {
        viewportMeta.setAttribute('content', originalViewportRef.current)
      }
    }

    // Cleanup function
    return () => {
      if (typeof window === 'undefined') return
      
      // Ensure cleanup on unmount
      const viewportMeta = document.querySelector('meta[name="viewport"]')
      if (viewportMeta && originalViewportRef.current) {
        viewportMeta.setAttribute('content', originalViewportRef.current)
      }
    }
  }, [isModalOpen])
}
