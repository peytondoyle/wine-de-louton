import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  title: string
  className?: string
}

export function StepIndicator({ 
  currentStep, 
  totalSteps, 
  title, 
  className = '' 
}: StepIndicatorProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg",
      className
    )}>
      {/* Step circles */}
      <div className="flex items-center gap-2">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isCompleted = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep
          
          return (
            <div key={stepNumber} className="flex items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors",
                  isCompleted && "bg-blue-600 text-white",
                  isCurrent && "bg-blue-600 text-white ring-2 ring-blue-200",
                  !isCompleted && !isCurrent && "bg-gray-200 text-gray-600"
                )}
              >
                {isCompleted ? (
                  <Check className="w-3 h-3" data-testid="check-icon" />
                ) : (
                  stepNumber
                )}
              </div>
              {stepNumber < totalSteps && (
                <div
                  className={cn(
                    "w-4 h-0.5 mx-1 transition-colors",
                    isCompleted ? "bg-blue-600" : "bg-gray-200"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
      
      {/* Title */}
      <div className="text-sm font-medium text-blue-900">
        {title}
      </div>
    </div>
  )
}
