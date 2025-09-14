import React from 'react'
import { cn } from '../../lib/utils'

interface SectionProps {
  title: string
  children: React.ReactNode
  className?: string
  showBorder?: boolean
  spacing?: 'sm' | 'md' | 'lg'
}

export function Section({ 
  title, 
  children, 
  className, 
  showBorder = true,
  spacing = 'md' 
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-3',
    md: 'py-4 sm:py-5',
    lg: 'py-5 sm:py-6'
  }

  return (
    <section className={cn(
      "relative",
      spacingClasses[spacing],
      showBorder && "border-t border-neutral-200",
      className
    )}>
      <h3 className="text-sm font-medium sm:font-semibold uppercase tracking-wide text-neutral-500 mb-3 sm:mb-4">
        {title}
      </h3>
      <div>{children}</div>
    </section>
  )
}

// Helper component for consistent dividers
export function SectionDivider({ className }: { className?: string }) {
  return <div className={cn("border-t border-neutral-200", className)} />
}
