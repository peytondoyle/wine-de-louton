/**
 * Hook to check if the app is running in development mode
 */
export function useIsDev(): boolean {
  return import.meta.env.DEV
}
