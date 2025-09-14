import React from 'react'
import { Loader2, Pencil, X, Trash2 } from 'lucide-react'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'

interface ActionButton {
  label: string
  onClick: () => Promise<void> | void
  icon?: React.ReactNode
  disabled?: boolean
  loading?: boolean
  testId?: string
}

interface DrawerFooterActionsProps {
  primary?: ActionButton
  secondary?: ActionButton
  tertiary?: ActionButton
  danger?: ActionButton
  leftSlot?: React.ReactNode
  className?: string
}

export default function DrawerFooterActions({
  primary,
  secondary,
  tertiary,
  danger,
  leftSlot,
  className
}: DrawerFooterActionsProps) {
  // Check if any button is loading to disable others
  const anyLoading = primary?.loading || secondary?.loading || tertiary?.loading || danger?.loading

  const renderButton = (action: ActionButton, variant: 'primary' | 'outline' | 'ghost' | 'destructive') => {
    const { label, onClick, icon, disabled, loading, testId } = action
    
    return (
      <Button
        key={label}
        variant={variant}
        size="responsive"
        onClick={onClick}
        disabled={disabled || (anyLoading && !loading)}
        aria-busy={loading}
        aria-pressed={false}
        data-testid={testId}
        className="sm:w-auto w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            {label}
          </>
        ) : (
          <>
            {icon && <span className="mr-2">{icon}</span>}
            {label}
          </>
        )}
      </Button>
    )
  }

  // Collect all buttons in order of priority
  const buttons = []
  if (primary) buttons.push(renderButton(primary, 'primary'))
  if (secondary) buttons.push(renderButton(secondary, 'outline'))
  if (tertiary) buttons.push(renderButton(tertiary, 'ghost'))
  if (danger) buttons.push(renderButton(danger, 'destructive'))

  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 bg-white/95 border-t",
        "p-3 sm:p-4 pb-[max(theme(spacing.3),env(safe-area-inset-bottom))] sm:pb-[max(theme(spacing.4),env(safe-area-inset-bottom))]",
        "rounded-b-2xl",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left slot for hints or status */}
        {leftSlot && (
          <div className="flex-1 min-w-0">
            {leftSlot}
          </div>
        )}
        
        {/* Buttons - right aligned with responsive wrapping */}
        <div className="flex flex-wrap justify-end gap-2 sm:flex-nowrap">
          {buttons}
        </div>
      </div>
    </div>
  )
}

/*
Storybook-style playground for reference:

<DrawerFooterActions
  leftSlot={<span className="text-sm text-neutral-600">3 changes pending</span>}
  primary={{
    label: "Save Changes",
    onClick: () => console.log("Save"),
    icon: <Pencil className="h-4 w-4" />,
    testId: "save-button"
  }}
  secondary={{
    label: "Cancel",
    onClick: () => console.log("Cancel"),
    icon: <X className="h-4 w-4" />,
    testId: "cancel-button"
  }}
  danger={{
    label: "Delete",
    onClick: () => console.log("Delete"),
    icon: <Trash2 className="h-4 w-4" />,
    testId: "delete-button"
  }}
/>

<DrawerFooterActions
  primary={{
    label: "Processing...",
    onClick: () => {},
    loading: true,
    testId: "processing-button"
  }}
  secondary={{
    label: "Cancel",
    onClick: () => console.log("Cancel"),
    disabled: true,
    testId: "cancel-button"
  }}
/>

<DrawerFooterActions
  leftSlot={
    <div className="flex items-center gap-2">
      <div className="h-2 w-2 rounded-full bg-green-500" />
      <span className="text-sm text-neutral-600">Auto-saved</span>
    </div>
  }
  tertiary={{
    label: "Close",
    onClick: () => console.log("Close"),
    testId: "close-button"
  }}
/>
*/
