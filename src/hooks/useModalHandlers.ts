import { useCallback, useRef } from 'react'

/**
 * Hook for modal event handlers
 * Provides backdrop click and escape key handling
 */
export function useModalHandlers(onClose?: () => void, shouldPreventClose?: () => boolean) {
  const backdropRef = useRef<HTMLDivElement>(null)

  // Handle backdrop click - only close if clicking the backdrop itself and not prevented
  const handleBackdropClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (onClose && event.target === event.currentTarget) {
      // Check if close should be prevented due to ongoing interactions
      if (shouldPreventClose && shouldPreventClose()) {
        return
      }
      onClose()
    }
  }, [onClose, shouldPreventClose])

  // Handle escape key - also check prevent close
  const handleEscapeKey = useCallback((event: any) => {
    if (onClose && event.key === 'Escape') {
      // Check if close should be prevented due to ongoing interactions
      if (shouldPreventClose && shouldPreventClose()) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      onClose()
    }
  }, [onClose, shouldPreventClose])

  // Handle pointer down outside - prevent closing on scrollbar interactions
  const handlePointerDownOutside = useCallback((event: any) => {
    // Allow overlay click to close; but don't treat scrollbar/thumb drags as outside
    if (event.target === event.currentTarget) {
      // This is a direct click on the backdrop
      return
    }
    
    // Prevent closing if clicking inside modal content
    const target = event.target as HTMLElement
    if (target?.closest('[data-modal-content]')) {
      event.preventDefault()
    }
  }, [])

  // Handle interact outside - more robust than pointer down
  const handleInteractOutside = useCallback((event: Event) => {
    const target = event.target as HTMLElement
    if (!target) return

    // If click started within the modal content, do not close
    if (target.closest('[data-modal-content]')) {
      event.preventDefault()
    }
  }, [])

  return {
    backdropRef,
    handleBackdropClick,
    handleEscapeKey,
    handlePointerDownOutside,
    handleInteractOutside
  }
}
