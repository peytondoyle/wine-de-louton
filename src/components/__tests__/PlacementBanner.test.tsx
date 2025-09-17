import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlacementBanner } from '../PlacementBanner'
import { DepthPosition } from '../../types'

describe('PlacementBanner', () => {
  it('should render with correct text and actions', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <PlacementBanner
        shelf={2}
        column={3}
        depth={DepthPosition.FRONT}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText('Place selected bottle in R2C3 (Front)')).toBeInTheDocument()
    expect(screen.getByText('Confirm')).toBeInTheDocument()
    expect(screen.getByText('Change')).toBeInTheDocument()
  })

  it('should show Back when depth is BACK', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <PlacementBanner
        shelf={1}
        column={5}
        depth={DepthPosition.BACK}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
      />
    )

    expect(screen.getByText('Place selected bottle in R1C5 (Back)')).toBeInTheDocument()
  })

  it('should call onConfirm when Confirm button is clicked', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <PlacementBanner
        shelf={2}
        column={3}
        depth={DepthPosition.FRONT}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByText('Confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('should call onChange when Change button is clicked', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <PlacementBanner
        shelf={2}
        column={3}
        depth={DepthPosition.FRONT}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByText('Change'))
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('should call onDismiss when X button is clicked', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    render(
      <PlacementBanner
        shelf={2}
        column={3}
        depth={DepthPosition.FRONT}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: '' })) // X button
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('should apply custom className', () => {
    const onConfirm = vi.fn()
    const onChange = vi.fn()
    const onDismiss = vi.fn()

    const { container } = render(
      <PlacementBanner
        shelf={2}
        column={3}
        depth={DepthPosition.FRONT}
        onConfirm={onConfirm}
        onChange={onChange}
        onDismiss={onDismiss}
        className="custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
