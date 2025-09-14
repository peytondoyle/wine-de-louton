import React from 'react'
import { cn } from '../../lib/utils'

interface FieldProps {
  label: string
  helperText?: string
  error?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function Field({ label, helperText, error, required, children, className }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="block text-[13px] font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </span>
      {children}
      {error && (
        <span className="mt-1 block text-[12px] text-red-600">{error}</span>
      )}
      {helperText && !error && (
        <span className="mt-1 block text-[12px] text-neutral-500">{helperText}</span>
      )}
    </label>
  )
}
