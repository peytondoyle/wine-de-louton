import { toast } from '../lib/toast'

/**
 * Toast message helpers for consistent user feedback across the application
 */

/**
 * Show success toast for adding a new wine
 */
export function toastAddSuccess(name?: string) {
  toast.success('Wine added.')
}

/**
 * Show success toast for saving/updating a wine
 */
export function toastSaveSuccess(name?: string) {
  toast.success('Saved.')
}

/**
 * Show success toast for marking wine as drunk or cellared
 */
export function toastDrunk(status: 'drunk' | 'cellared', name?: string) {
  const action = status === 'drunk' ? 'Marked as drunk.' : 'Moved to cellar.'
  toast.success(action)
}

/**
 * Show info toast for new suggestions queued
 */
export function toastReenrichQueued(name?: string) {
  toast.info('New suggestions queued.')
}

/**
 * Show error toast with consistent formatting
 */
export function toastError(action: string, error: unknown) {
  const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
  toast.error(errorMessage)
}
