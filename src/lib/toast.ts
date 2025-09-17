import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info' | 'loading'

export interface Toast {
  id: string
  variant: ToastVariant
  message: string
  duration?: number
  createdAt: number
}

interface ToastStore {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'> & { id?: string }) => string
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => void
  dismissToast: (id: string) => void
  dismissAll: () => void
}

// In-memory Map for rate limiting by toast ID
const lastShown = new Map<string, number>()

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'> & { id?: string }): string => {
    const now = Date.now()
    const RATE_LIMIT_MS = 2000 // 2 seconds rate limiting
    
    // If an ID is provided, check rate limiting
    if (toast.id) {
      const lastShownTime = lastShown.get(toast.id)
      if (lastShownTime && (now - lastShownTime) < RATE_LIMIT_MS) {
        // Rate limited - drop this toast
        return toast.id
      }
      lastShown.set(toast.id, now)
    }
    
    const id = toast.id || Math.random().toString(36).substr(2, 9)
    
    // Set default durations based on variant
    const getDefaultDuration = (variant: ToastVariant): number => {
      switch (variant) {
        case 'success':
        case 'info':
          return 2000
        case 'error':
          return 4000
        case 'loading':
          return 0
        default:
          return 2000
      }
    }
    
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: now,
      duration: toast.duration ?? getDefaultDuration(toast.variant)
    }
    
    set((state) => ({
      toasts: [...state.toasts, newToast]
    }))
    
    // Auto-dismiss non-loading toasts
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      }, newToast.duration)
    }
    
    return id
  },
  
  updateToast: (id, updates) => {
    set((state) => ({
      toasts: state.toasts.map(toast => 
        toast.id === id 
          ? { ...toast, ...updates }
          : toast
      )
    }))
  },
  
  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(toast => toast.id !== id)
    }))
  },
  
  dismissAll: () => {
    set({ toasts: [] })
  }
}))

// Public API
export const toast = {
  success: (message: string, options?: { duration?: number; id?: string }) => 
    useToastStore.getState().addToast({ 
      variant: 'success', 
      message, 
      duration: options?.duration,
      id: options?.id
    }),
    
  error: (message: string, options?: { duration?: number; id?: string }) => 
    useToastStore.getState().addToast({ 
      variant: 'error', 
      message, 
      duration: options?.duration,
      id: options?.id
    }),
    
  info: (message: string, options?: { duration?: number; id?: string }) => 
    useToastStore.getState().addToast({ 
      variant: 'info', 
      message, 
      duration: options?.duration,
      id: options?.id
    }),
    
  loading: (message: string, id?: string) => 
    useToastStore.getState().addToast({ 
      variant: 'loading', 
      message, 
      duration: 0,
      id
    }),
    
  update: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => 
    useToastStore.getState().updateToast(id, updates),
    
  dismiss: (id: string) => 
    useToastStore.getState().dismissToast(id),
    
  dismissAll: () => 
    useToastStore.getState().dismissAll(),
    
  // Batch operations for collapsing multiple events
  batchSuccess: (count: number, action: string, id?: string) => {
    const message = count === 1 ? `${action} applied` : `${action} applied to ${count} items`
    return useToastStore.getState().addToast({ variant: 'success', message, id })
  },
  
  batchError: (count: number, action: string, id?: string) => {
    const message = count === 1 ? `Failed to ${action}` : `Failed to ${action} ${count} items`
    return useToastStore.getState().addToast({ variant: 'error', message, id })
  }
}
