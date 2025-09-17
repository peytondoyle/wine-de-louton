import { useRef, useCallback } from 'react'

interface UseLongPressOptions {
  onLongPress: () => void
  onClick?: () => void
  delay?: number
  preventDefault?: boolean
}

export function useLongPress({
  onLongPress,
  onClick,
  delay = 300,
  preventDefault = true
}: UseLongPressOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const targetRef = useRef<EventTarget | null>(null)

  const start = useCallback((event: React.TouchEvent | React.MouseEvent) => {
    if (preventDefault) {
      event.preventDefault()
    }
    
    targetRef.current = event.target
    
    timeoutRef.current = setTimeout(() => {
      onLongPress()
    }, delay)
  }, [onLongPress, delay, preventDefault])

  const clear = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    start(event)
  }, [start])

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    clear()
    
    // If it was a short press, trigger onClick
    if (onClick) {
      onClick()
    }
  }, [clear, onClick])

  const handleTouchCancel = useCallback(() => {
    clear()
  }, [clear])

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    // Only handle mouse events on desktop
    if (window.innerWidth >= 768) {
      start(event)
    }
  }, [start])

  const handleMouseUp = useCallback((event: React.MouseEvent) => {
    clear()
    
    // If it was a short press, trigger onClick
    if (onClick) {
      onClick()
    }
  }, [clear, onClick])

  const handleMouseLeave = useCallback(() => {
    clear()
  }, [clear])

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    // Prevent context menu on long press
    event.preventDefault()
  }, [])

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onContextMenu: handleContextMenu
  }
}
