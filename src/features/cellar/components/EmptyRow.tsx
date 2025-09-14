import React from 'react'
import { Info, Star, FileText, Award } from 'lucide-react'
import { Button } from '../../../components/ui/Button'

export type EmptyRowType = 'ratings' | 'tasting-notes' | 'critic-scores' | 'general'

interface EmptyRowProps {
  type?: EmptyRowType
  message?: string
  onAdd?: () => void
  actionText?: string
  className?: string
}

const getIconForType = (type: EmptyRowType) => {
  switch (type) {
    case 'ratings':
      return Star
    case 'tasting-notes':
      return FileText
    case 'critic-scores':
      return Award
    default:
      return Info
  }
}

const getDefaultMessage = (type: EmptyRowType) => {
  switch (type) {
    case 'ratings':
      return 'No ratings yet.'
    case 'tasting-notes':
      return 'No tasting notes yet.'
    case 'critic-scores':
      return 'No critic scores yet.'
    default:
      return 'No data available.'
  }
}

const getDefaultActionText = (type: EmptyRowType) => {
  switch (type) {
    case 'ratings':
    case 'tasting-notes':
    case 'critic-scores':
      return 'Add now'
    default:
      return 'Add now'
  }
}

export function EmptyRow({ 
  type = 'general', 
  message, 
  onAdd, 
  actionText,
  className = ''
}: EmptyRowProps) {
  const IconComponent = getIconForType(type)
  const displayMessage = message || getDefaultMessage(type)
  const displayActionText = actionText || getDefaultActionText(type)

  return (
    <div className={`flex items-start gap-2 text-neutral-600 ${className}`}>
      <IconComponent className="mt-0.5 size-4 text-neutral-400" aria-hidden="true" />
      <div className="flex-1">
        <div className="text-[13px]">{displayMessage}</div>
        {onAdd && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-1 px-0 h-7" 
            onClick={onAdd} 
            aria-pressed={false}
          >
            {displayActionText}
          </Button>
        )}
      </div>
    </div>
  )
}
