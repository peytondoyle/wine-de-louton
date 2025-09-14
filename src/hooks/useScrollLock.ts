import { useEffect, useRef } from 'react'

/**
 * Hook to prevent body scroll when modals/drawers are open
 * Enhanced for mobile with overscroll prevention and touch action restrictions
 * @param isLocked - Whether scroll should be locked
 */
export function useScrollLock(isLocked: boolean) {
  const scrollPositionRef = useRef<number>(0)
  const originalStylesRef = useRef<{
    htmlOverflow: string
    bodyOverflow: string
    bodyPosition: string
    bodyTop: string
    bodyWidth: string
    bodyHeight: string
    bodyTouchAction: string
    bodyOverscrollBehavior: string
  } | null>(null)

  useEffect(() => {
    // Guard for server-side rendering
    if (typeof window === 'undefined') return

    if (isLocked) {
      // Store current scroll position
      scrollPositionRef.current = window.scrollY

      // Store original styles for restoration
      originalStylesRef.current = {
        htmlOverflow: document.documentElement.style.overflow,
        bodyOverflow: document.body.style.overflow,
        bodyPosition: document.body.style.position,
        bodyTop: document.body.style.top,
        bodyWidth: document.body.style.width,
        bodyHeight: document.body.style.height,
        bodyTouchAction: document.body.style.touchAction,
        bodyOverscrollBehavior: document.body.style.overscrollBehavior
      }

      // Prevent scrolling on html and body
      document.documentElement.style.overflow = 'hidden'
      document.body.style.overflow = 'hidden'

      // Fix body position to prevent scroll
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollPositionRef.current}px`
      document.body.style.width = '100%'
      document.body.style.height = '100%'

      // Mobile-specific scroll prevention
      document.body.style.touchAction = 'none'
      document.body.style.overscrollBehavior = 'none'

      // Prevent iOS bounce scrolling
      document.documentElement.style.overscrollBehavior = 'none'
    } else {
      // Restore original styles
      if (originalStylesRef.current) {
        document.documentElement.style.overflow = originalStylesRef.current.htmlOverflow
        document.body.style.overflow = originalStylesRef.current.bodyOverflow
        document.body.style.position = originalStylesRef.current.bodyPosition
        document.body.style.top = originalStylesRef.current.bodyTop
        document.body.style.width = originalStylesRef.current.bodyWidth
        document.body.style.height = originalStylesRef.current.bodyHeight
        document.body.style.touchAction = originalStylesRef.current.bodyTouchAction
        document.body.style.overscrollBehavior = originalStylesRef.current.bodyOverscrollBehavior
        document.documentElement.style.overscrollBehavior = ''
      }

      // Restore scroll position
      window.scrollTo(0, scrollPositionRef.current)
    }

    // Cleanup function
    return () => {
      if (typeof window === 'undefined') return
      
      // Ensure cleanup on unmount
      if (originalStylesRef.current) {
        document.documentElement.style.overflow = originalStylesRef.current.htmlOverflow
        document.body.style.overflow = originalStylesRef.current.bodyOverflow
        document.body.style.position = originalStylesRef.current.bodyPosition
        document.body.style.top = originalStylesRef.current.bodyTop
        document.body.style.width = originalStylesRef.current.bodyWidth
        document.body.style.height = originalStylesRef.current.bodyHeight
        document.body.style.touchAction = originalStylesRef.current.bodyTouchAction
        document.body.style.overscrollBehavior = originalStylesRef.current.bodyOverscrollBehavior
        document.documentElement.style.overscrollBehavior = ''
      }
    }
  }, [isLocked])
}
