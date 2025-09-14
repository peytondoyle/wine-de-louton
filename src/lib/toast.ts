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
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => void
  dismissToast: (id: string) => void
  dismissAll: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? (toast.variant === 'loading' ? 0 : 5000)
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
  success: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ variant: 'success', message, duration }),
    
  error: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ variant: 'error', message, duration }),
    
  info: (message: string, duration?: number) => 
    useToastStore.getState().addToast({ variant: 'info', message, duration }),
    
  loading: (message: string) => 
    useToastStore.getState().addToast({ variant: 'loading', message, duration: 0 }),
    
  update: (id: string, updates: Partial<Omit<Toast, 'id' | 'createdAt'>>) => 
    useToastStore.getState().updateToast(id, updates),
    
  dismiss: (id: string) => 
    useToastStore.getState().dismissToast(id),
    
  dismissAll: () => 
    useToastStore.getState().dismissAll()
}
