import { useState, useEffect, useRef } from 'react'
import { UseFormReturn, FieldValues } from 'react-hook-form'

interface UseDirtyStateOptions<T extends FieldValues> {
  form: UseFormReturn<T>
  initialValues: Partial<T>
  isDirty?: (currentValues: T, initialValues: Partial<T>) => boolean
}

/**
 * Hook for tracking dirty state of a form
 * Compares current form values with initial values to determine if form is dirty
 */
export function useDirtyState<T extends FieldValues>({ 
  form, 
  initialValues, 
  isDirty: customIsDirty 
}: UseDirtyStateOptions<T>) {
  const [isDirty, setIsDirty] = useState(false)
  const initialValuesRef = useRef(initialValues)

  // Update initial values ref when they change
  useEffect(() => {
    initialValuesRef.current = initialValues
  }, [initialValues])

  // Watch form values and check if dirty
  useEffect(() => {
    const subscription = form.watch((currentValues) => {
      if (customIsDirty) {
        setIsDirty(customIsDirty(currentValues as T, initialValuesRef.current))
      } else {
        // Default dirty check: compare all form values with initial values
        const hasChanges = Object.keys(currentValues).some(key => {
          const currentValue = currentValues[key as keyof typeof currentValues]
          const initialValue = initialValuesRef.current[key as keyof T]
          
          // Handle arrays and objects
          if (Array.isArray(currentValue) && Array.isArray(initialValue)) {
            return JSON.stringify(currentValue) !== JSON.stringify(initialValue)
          }
          
          // Handle primitive values
          return currentValue !== initialValue
        })
        
        setIsDirty(hasChanges)
      }
    })

    return () => subscription.unsubscribe()
  }, [form, customIsDirty])

  return isDirty
}
