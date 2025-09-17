import { toast, dedupeToast } from '../lib/toast'

/**
 * Toast message helpers for consistent user feedback across the application
 */

/**
 * Show success toast for marking wine as drunk
 */
export function toastDrunk(id: string, name?: string) {
  const message = name ? `Marked ${name} as drunk` : 'Marked as drunk'
  dedupeToast(`drunk:${id}`, () => toast.success(message))
}

/**
 * Show success toast for undoing drunk status
 */
export function toastUndo(id: string, name?: string) {
  const message = name ? `Moved ${name} to cellar` : 'Moved to cellar'
  dedupeToast(`undo:${id}`, () => toast.success(message))
}

/**
 * Show success toast for saving/updating a wine
 */
export function toastSaved(name?: string) {
  const message = name ? `Saved ${name}` : 'Saved'
  dedupeToast(`save:${name || 'general'}`, () => toast.success(message))
}

/**
 * Show error toast with consistent formatting
 */
export function toastError(errLike: unknown) {
  const errorMessage = errLike instanceof Error ? errLike.message : 'An unexpected error occurred'
  dedupeToast(`error:${Date.now()}`, () => toast.error(errorMessage))
}
