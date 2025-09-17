import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from './Dialog'

describe('Dialog Accessibility', () => {
  it('should have proper dialog role and accessible name', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine">
          <DialogTitle>Add Wine</DialogTitle>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    // Test dialog role with accessible name
    const dialog = screen.getByRole('dialog', { name: /add wine/i })
    expect(dialog).toBeInTheDocument()
  })

  it('should have proper dialog role for edit mode', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Edit Wine">
          <DialogTitle>Edit Wine</DialogTitle>
          <DialogDescription>Modify wine details</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    // Test dialog role with accessible name for edit
    const dialog = screen.getByRole('dialog', { name: /edit wine/i })
    expect(dialog).toBeInTheDocument()
  })

  it('should have aria-describedby pointing to description', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine">
          <DialogTitle>Add Wine</DialogTitle>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const dialog = screen.getByRole('dialog')
    const description = screen.getByText('Add a new wine to your collection')
    
    // Get the description element's ID
    const descriptionId = description.getAttribute('id')
    expect(descriptionId).toBeTruthy()
    
    // Check that dialog has aria-describedby pointing to the description
    expect(dialog).toHaveAttribute('aria-describedby', descriptionId!)
  })

  it('should close on escape key press', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine">
          <DialogTitle>Add Wine</DialogTitle>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    const dialog = screen.getByRole('dialog')
    
    // Press escape key
    fireEvent.keyDown(dialog, { key: 'Escape', code: 'Escape' })
    
    // Verify onOpenChange was called with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should close on escape key press from document', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine">
          <DialogTitle>Add Wine</DialogTitle>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    // Press escape key on document (simulating global escape handling)
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
    
    // Verify onOpenChange was called with false
    expect(mockOnOpenChange).toHaveBeenCalledWith(false)
  })

  it('should have proper focus management', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine">
          <DialogTitle>Add Wine</DialogTitle>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
          <button>Test Button</button>
        </DialogContent>
      </Dialog>
    )

    const dialog = screen.getByRole('dialog')
    const closeButton = screen.getByRole('button', { name: /close/i })
    
    // Dialog should be in the document
    expect(dialog).toBeInTheDocument()
    
    // Close button should be present
    expect(closeButton).toBeInTheDocument()
  })

  it('should handle hidden title visually', () => {
    const mockOnOpenChange = vi.fn()
    
    render(
      <Dialog open={true} onOpenChange={mockOnOpenChange}>
        <DialogContent title="Add Wine" hideTitleVisually={true}>
          <DialogDescription>Add a new wine to your collection</DialogDescription>
        </DialogContent>
      </Dialog>
    )

    // Dialog should still have proper role and accessible name
    const dialog = screen.getByRole('dialog', { name: /add wine/i })
    expect(dialog).toBeInTheDocument()
    
    // Title should be visually hidden but still accessible
    const title = screen.getByText('Add Wine')
    expect(title).toBeInTheDocument()
  })
})