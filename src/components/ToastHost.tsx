import React, { useEffect, useState } from 'react'
import { useToastStore, type Toast, type ToastVariant } from '../lib/toast'
import { cn } from '../lib/utils'
import { Check, X, AlertCircle, Info, Loader2 } from 'lucide-react'

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleDismiss = () => {
    setIsLeaving(true)
    setTimeout(() => onDismiss(toast.id), 150) // Match animation duration
  }

  const getVariantStyles = (variant: ToastVariant) => {
    switch (variant) {
      case 'success':
        return {
          icon: Check,
          className: 'bg-green-50 border-green-200 text-green-800',
          iconClassName: 'text-green-500'
        }
      case 'error':
        return {
          icon: AlertCircle,
          className: 'bg-red-50 border-red-200 text-red-800',
          iconClassName: 'text-red-500'
        }
      case 'info':
        return {
          icon: Info,
          className: 'bg-blue-50 border-blue-200 text-blue-800',
          iconClassName: 'text-blue-500'
        }
      case 'loading':
        return {
          icon: Loader2,
          className: 'bg-gray-50 border-gray-200 text-gray-800',
          iconClassName: 'text-gray-500'
        }
    }
  }

  const variantStyles = getVariantStyles(toast.variant)
  const Icon = variantStyles.icon

  const isError = toast.variant === 'error'
  
  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-sm max-w-sm w-full',
        'motion-safe:transform motion-safe:transition-[box-shadow,transform,opacity] motion-safe:duration-150 motion-safe:ease-out motion-reduce:transition-none',
        isVisible && !isLeaving
          ? 'translate-y-0 opacity-100 scale-100'
          : 'translate-y-2 opacity-0 scale-95',
        variantStyles.className
      )}
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
    >
      <Icon 
        className={cn(
          'h-5 w-5 flex-shrink-0 mt-0.5',
          toast.variant === 'loading' && 'animate-spin',
          variantStyles.iconClassName
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">
          {toast.message}
        </p>
      </div>
      {toast.variant !== 'loading' && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

export function ToastHost() {
  const { toasts, dismissToast } = useToastStore()

  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      <div 
        className="fixed inset-0 pointer-events-none z-50"
        aria-label="Notifications"
      >
      {/* Desktop: top-right */}
      <div className="hidden sm:block absolute top-4 right-4 space-y-2">
        {toasts.map((toast: Toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
      
      {/* Mobile: bottom-center */}
      <div className="sm:hidden absolute bottom-4 left-4 right-4 flex flex-col-reverse space-y-reverse space-y-2">
        {toasts.map((toast: Toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onDismiss={dismissToast}
          />
        ))}
      </div>
      </div>
    </div>
  )
}
