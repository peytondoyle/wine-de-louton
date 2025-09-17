import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StepIndicator } from '../StepIndicator'

describe('StepIndicator', () => {
  it('should render with correct step numbers and title', () => {
    render(
      <StepIndicator
        currentStep={2}
        totalSteps={3}
        title="Step 2 of 3: Choose location"
      />
    )

    expect(screen.getByText('Step 2 of 3: Choose location')).toBeInTheDocument()
    // Step 1 is completed (checkmark), step 2 is current, step 3 is future
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should show completed steps with checkmarks', () => {
    render(
      <StepIndicator
        currentStep={3}
        totalSteps={3}
        title="Step 3 of 3: Complete"
      />
    )

    // First two steps should be completed (checkmarks)
    const checkmarks = screen.getAllByTestId('check-icon')
    expect(checkmarks).toHaveLength(2) // Two checkmarks for completed steps
    
    // Current step should show number
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should highlight current step', () => {
    render(
      <StepIndicator
        currentStep={2}
        totalSteps={3}
        title="Step 2 of 3: Choose location"
      />
    )

    // Current step should have the number 2
    const currentStep = screen.getByText('2')
    expect(currentStep).toBeInTheDocument()
    expect(currentStep.closest('div')).toHaveClass('bg-blue-600', 'text-white')
  })

  it('should show future steps as inactive', () => {
    render(
      <StepIndicator
        currentStep={1}
        totalSteps={3}
        title="Step 1 of 3: Start"
      />
    )

    // Future steps should show numbers but be inactive
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    const { container } = render(
      <StepIndicator
        currentStep={1}
        totalSteps={2}
        title="Test"
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('should render with single step', () => {
    render(
      <StepIndicator
        currentStep={1}
        totalSteps={1}
        title="Single step"
      />
    )

    expect(screen.getByText('Single step')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    // Should not have any checkmarks for single step
    const checkmarks = screen.queryAllByRole('img', { hidden: true })
    expect(checkmarks).toHaveLength(0)
  })
})
