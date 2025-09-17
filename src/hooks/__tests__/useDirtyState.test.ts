import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useForm } from 'react-hook-form'
import { useDirtyState } from '../useDirtyState'

describe('useDirtyState', () => {
  it('should detect dirty state when form values change', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { name: 'initial', age: 25 }
      })
      
      return {
        form,
        isDirty: useDirtyState({
          form,
          initialValues: { name: 'initial', age: 25 }
        })
      }
    })

    expect(result.current.isDirty).toBe(false)

    // Change a form value
    act(() => {
      result.current.form.setValue('name', 'changed')
    })

    expect(result.current.isDirty).toBe(true)
  })

  it('should not detect dirty state when form values match initial values', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { name: 'initial', age: 25 }
      })
      
      return {
        form,
        isDirty: useDirtyState({
          form,
          initialValues: { name: 'initial', age: 25 }
        })
      }
    })

    expect(result.current.isDirty).toBe(false)

    // Change and then change back
    act(() => {
      result.current.form.setValue('name', 'changed')
    })

    expect(result.current.isDirty).toBe(true)

    act(() => {
      result.current.form.setValue('name', 'initial')
    })

    expect(result.current.isDirty).toBe(false)
  })

  it('should handle array values correctly', () => {
    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { tags: ['tag1', 'tag2'] }
      })
      
      return {
        form,
        isDirty: useDirtyState({
          form,
          initialValues: { tags: ['tag1', 'tag2'] }
        })
      }
    })

    expect(result.current.isDirty).toBe(false)

    // Change array
    act(() => {
      result.current.form.setValue('tags', ['tag1', 'tag3'])
    })

    expect(result.current.isDirty).toBe(true)
  })

  it('should use custom isDirty function when provided', () => {
    const customIsDirty = vi.fn().mockReturnValue(true)

    const { result } = renderHook(() => {
      const form = useForm({
        defaultValues: { name: 'initial' }
      })
      
      return {
        form,
        isDirty: useDirtyState({
          form,
          initialValues: { name: 'initial' },
          isDirty: customIsDirty
        })
      }
    })

    // Trigger form change to call the custom function
    act(() => {
      result.current.form.setValue('name', 'changed')
    })

    expect(result.current.isDirty).toBe(true)
    expect(customIsDirty).toHaveBeenCalled()
  })

  it('should update when initial values change', () => {
    const { result, rerender } = renderHook(
      ({ initialValues }) => {
        const form = useForm({
          defaultValues: { name: 'initial' }
        })
        
        return {
          form,
          isDirty: useDirtyState({
            form,
            initialValues
          })
        }
      },
      {
        initialProps: { initialValues: { name: 'initial' } }
      }
    )

    expect(result.current.isDirty).toBe(false)

    // Change initial values
    rerender({ initialValues: { name: 'new initial' } })

    // Trigger a form change to see the effect of the new initial values
    act(() => {
      result.current.form.setValue('name', 'some value')
    })

    // Form should now be dirty because current value doesn't match new initial
    expect(result.current.isDirty).toBe(true)
  })
})
