import React, { useState, useEffect } from 'react'
import { X, Plus, Trash2, Settings } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Card } from './ui/Card'
import { useActiveLayout } from '../hooks/useActiveLayout'
import { LayoutFormData, LayoutValidation } from '../types'

interface CellarSettingsProps {
  isOpen: boolean
  onClose: () => void
  className?: string
}

const LAYOUT_VALIDATION: LayoutValidation = {
  shelves: { min: 6, max: 14 },
  columns: { min: 5, max: 10 }
}

export function CellarSettings({ isOpen, onClose, className = '' }: CellarSettingsProps) {
  const {
    activeLayout,
    availableLayouts,
    isLoading,
    error,
    setActiveLayoutId,
    createLayout,
    updateLayout,
    deleteLayout,
    clearError
  } = useActiveLayout()

  const [formData, setFormData] = useState<LayoutFormData>({
    shelves: 6,
    columns: 5,
    name: ''
  })
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formErrors, setFormErrors] = useState<Partial<LayoutFormData>>({})

  // Initialize form when active layout changes
  useEffect(() => {
    if (activeLayout) {
      setFormData({
        shelves: activeLayout.shelves,
        columns: activeLayout.columns,
        name: activeLayout.name
      })
    }
  }, [activeLayout])

  const validateForm = (data: LayoutFormData): Record<string, string> => {
    const errors: Record<string, string> = {}

    if (!data.name.trim()) {
      errors.name = 'Name is required'
    }

    if (data.shelves < LAYOUT_VALIDATION.shelves.min || data.shelves > LAYOUT_VALIDATION.shelves.max) {
      errors.shelves = `Shelves must be between ${LAYOUT_VALIDATION.shelves.min} and ${LAYOUT_VALIDATION.shelves.max}`
    }

    if (data.columns < LAYOUT_VALIDATION.columns.min || data.columns > LAYOUT_VALIDATION.columns.max) {
      errors.columns = `Columns must be between ${LAYOUT_VALIDATION.columns.min} and ${LAYOUT_VALIDATION.columns.max}`
    }

    return errors
  }

  const handleInputChange = (field: keyof LayoutFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleCreateLayout = async () => {
    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const newLayout = await createLayout(formData)
    if (newLayout) {
      setActiveLayoutId(newLayout.id)
      resetForm()
    }
  }

  const handleUpdateLayout = async () => {
    if (!editingId) return

    const errors = validateForm(formData)
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    const updatedLayout = await updateLayout(editingId, formData)
    if (updatedLayout) {
      setActiveLayoutId(updatedLayout.id)
      resetForm()
    }
  }

  const handleDeleteLayout = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this layout? This action cannot be undone.')) {
      await deleteLayout(id)
    }
  }

  const handleEditLayout = (layout: typeof availableLayouts[0]) => {
    setFormData({
      shelves: layout.shelves,
      columns: layout.columns,
      name: layout.name
    })
    setIsEditing(true)
    setEditingId(layout.id)
    setFormErrors({})
  }

  const resetForm = () => {
    setFormData({
      shelves: 6,
      columns: 5,
      name: ''
    })
    setIsEditing(false)
    setEditingId(null)
    setFormErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isEditing) {
      handleUpdateLayout()
    } else {
      handleCreateLayout()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold">Cellar Settings</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="mt-2 text-red-600 hover:text-red-700"
              >
                Dismiss
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">
                {isEditing ? 'Edit Layout' : 'Create New Layout'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Layout Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., EuroCave Pure L"
                    className={formErrors.name ? 'border-red-300' : ''}
                  />
                  {formErrors.name && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="shelves">Shelves</Label>
                    <Input
                      id="shelves"
                      type="number"
                      min={LAYOUT_VALIDATION.shelves.min}
                      max={LAYOUT_VALIDATION.shelves.max}
                      value={formData.shelves}
                      onChange={(e) => handleInputChange('shelves', parseInt(e.target.value) || 0)}
                      className={formErrors.shelves ? 'border-red-300' : ''}
                    />
                    {formErrors.shelves && (
                      <p className="text-sm text-red-600 mt-1">{formErrors.shelves}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {LAYOUT_VALIDATION.shelves.min}-{LAYOUT_VALIDATION.shelves.max} shelves
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="columns">Columns</Label>
                    <Input
                      id="columns"
                      type="number"
                      min={LAYOUT_VALIDATION.columns.min}
                      max={LAYOUT_VALIDATION.columns.max}
                      value={formData.columns}
                      onChange={(e) => handleInputChange('columns', parseInt(e.target.value) || 0)}
                      className={formErrors.columns ? 'border-red-300' : ''}
                    />
                    {formErrors.columns && (
                      <p className="text-sm text-red-600 mt-1">{formErrors.columns}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {LAYOUT_VALIDATION.columns.min}-{LAYOUT_VALIDATION.columns.max} columns
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? 'Saving...' : (isEditing ? 'Update Layout' : 'Create Layout')}
                  </Button>
                  
                  {isEditing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </form>
            </div>

            {/* Layouts List Section */}
            <div>
              <h3 className="text-lg font-medium mb-4">Available Layouts</h3>
              
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {availableLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`p-3 border rounded-lg flex items-center justify-between ${
                      activeLayout?.id === layout.id
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{layout.name}</h4>
                        {activeLayout?.id === layout.id && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {layout.shelves} shelves × {layout.columns} columns
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {activeLayout?.id !== layout.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveLayoutId(layout.id)}
                          disabled={isLoading}
                        >
                          Use
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditLayout(layout)}
                        disabled={isLoading}
                      >
                        Edit
                      </Button>
                      
                      {availableLayouts.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteLayout(layout.id)}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
