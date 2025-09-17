import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Body lock management with reference counting
let lockCount = 0
let originalStyles: {
  htmlOverflow: string
  bodyOverflow: string
  bodyPosition: string
  bodyTop: string
  bodyWidth: string
  bodyHeight: string
  bodyTouchAction: string
  bodyOverscrollBehavior: string
} | null = null

/**
 * Lock body scroll with reference counting
 * Multiple modals can be open simultaneously
 */
export function lockBody() {
  if (typeof window === 'undefined') return

  lockCount++
  
  if (lockCount === 1) {
    // Store original styles on first lock
    originalStyles = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyWidth: document.body.style.width,
      bodyHeight: document.body.style.height,
      bodyTouchAction: document.body.style.touchAction,
      bodyOverscrollBehavior: document.body.style.overscrollBehavior
    }

    // Store current scroll position
    const scrollY = window.scrollY

    // Apply lock styles
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.touchAction = 'none'
    document.body.style.overscrollBehavior = 'none'
    document.documentElement.style.overscrollBehavior = 'none'
  }
}

/**
 * Unlock body scroll with reference counting
 * Only unlocks when all modals are closed
 */
export function unlockBody() {
  if (typeof window === 'undefined') return

  lockCount = Math.max(0, lockCount - 1)
  
  if (lockCount === 0 && originalStyles) {
    // Restore original styles
    document.documentElement.style.overflow = originalStyles.htmlOverflow
    document.body.style.overflow = originalStyles.bodyOverflow
    document.body.style.position = originalStyles.bodyPosition
    document.body.style.top = originalStyles.bodyTop
    document.body.style.width = originalStyles.bodyWidth
    document.body.style.height = originalStyles.bodyHeight
    document.body.style.touchAction = originalStyles.bodyTouchAction
    document.body.style.overscrollBehavior = originalStyles.bodyOverscrollBehavior
    document.documentElement.style.overscrollBehavior = ''

    // Restore scroll position
    const scrollY = Math.abs(parseInt(document.body.style.top || '0', 10))
    window.scrollTo(0, scrollY)

    originalStyles = null
  }
}

/**
 * Get current lock count (for debugging)
 */
export function getBodyLockCount() {
  return lockCount
}
