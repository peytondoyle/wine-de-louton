import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'
import { Filter, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/Select'
import { Label } from './ui/Label'
import type { ControlsState, WineSortField, WineSortDirection } from '../types'
import { WineStatus, BottleSize } from '../types'

interface ControlsBarProps {
  value: ControlsState
  onChange: (value: ControlsState) => void
}

const BOTTLE_SIZES: { value: BottleSize | 'All'; label: string }[] = [
  { value: 'All', label: 'All Sizes' },
  { value: BottleSize.SMALL_375ML, label: '375 mL' },
  { value: BottleSize.MEDIUM_500ML, label: '500 mL' },
  { value: BottleSize.STANDARD_750ML, label: '750 mL' },
  { value: BottleSize.MAGNUM_1_5L, label: '1.5 L' },
  { value: BottleSize.DOUBLE_MAGNUM_3L, label: '3 L' },
  { value: BottleSize.OTHER, label: 'Other' },
]

const STATUS_OPTIONS: { value: WineStatus | 'All'; label: string }[] = [
  { value: 'All', label: 'All Status' },
  { value: WineStatus.CELLARED, label: 'Cellared' },
  { value: WineStatus.DRUNK, label: 'Drunk' },
]

const SORT_OPTIONS: { value: WineSortField; direction: WineSortDirection; label: string }[] = [
  { value: 'created_at', direction: 'desc', label: 'Newest First' },
  { value: 'created_at', direction: 'asc', label: 'Oldest First' },
  { value: 'vintage', direction: 'desc', label: 'Vintage (Newest)' },
  { value: 'vintage', direction: 'asc', label: 'Vintage (Oldest)' },
  { value: 'average_rating', direction: 'desc', label: 'Rating (Highest)' },
  { value: 'average_rating', direction: 'asc', label: 'Rating (Lowest)' },
]

export function ControlsBar({ value, onChange }: ControlsBarProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [debouncedSearch] = useDebounce(value.search, 300)

  // Update search when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== value.search) {
      onChange({ ...value, search: debouncedSearch })
    }
  }, [debouncedSearch, value, onChange])

  const handleSearchChange = (search: string) => {
    onChange({ ...value, search })
  }

  const handleFilterChange = (key: keyof ControlsState, filterValue: string) => {
    onChange({ ...value, [key]: filterValue })
  }

  const handleSortChange = (sortValue: string) => {
    const [field, direction] = sortValue.split('-') as [WineSortField, WineSortDirection]
    onChange({ ...value, sort: { field, direction } })
  }

  const clearFilters = () => {
    onChange({
      search: '',
      status: 'All',
      country_code: '',
      region: '',
      bottle_size: 'All',
      vintageMin: '',
      vintageMax: '',
      sort: { field: 'created_at', direction: 'desc' }
    })
  }

  const hasActiveFilters = value.status !== 'All' || 
    value.country_code || 
    value.region || 
    value.bottle_size !== 'All' || 
    value.vintageMin || 
    value.vintageMax

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            placeholder="Find bottles..."
            value={value.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="rounded-xl border px-3 py-2"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="min-w-[44px] rounded-xl border px-3 py-2"
        >
          <Filter className="h-4 w-4" />
        </Button>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={clearFilters}
            className="min-w-[44px] rounded-xl border px-3 py-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="grid grid-cols-1 gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={value.status}
              onValueChange={(val) => handleFilterChange('status', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Country Code Filter */}
          <div className="space-y-2">
            <Label htmlFor="country_code">Country</Label>
            <Input
              id="country_code"
              placeholder="e.g., FR, US"
              value={value.country_code}
              onChange={(e) => handleFilterChange('country_code', e.target.value)}
              className="rounded-xl border px-3 py-2"
            />
          </div>

          {/* Region Filter */}
          <div className="space-y-2">
            <Label htmlFor="region">Region</Label>
            <Input
              id="region"
              placeholder="e.g., Bordeaux"
              value={value.region}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="rounded-xl border px-3 py-2"
            />
          </div>

          {/* Bottle Size Filter */}
          <div className="space-y-2">
            <Label htmlFor="bottle_size">Bottle Size</Label>
            <Select
              value={value.bottle_size}
              onValueChange={(val) => handleFilterChange('bottle_size', val)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOTTLE_SIZES.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Vintage Min Filter */}
          <div className="space-y-2">
            <Label htmlFor="vintageMin">Vintage Min</Label>
            <Input
              id="vintageMin"
              type="number"
              placeholder="e.g., 1990"
              value={value.vintageMin}
              onChange={(e) => handleFilterChange('vintageMin', e.target.value)}
              className="rounded-xl border px-3 py-2"
            />
          </div>

          {/* Vintage Max Filter */}
          <div className="space-y-2">
            <Label htmlFor="vintageMax">Vintage Max</Label>
            <Input
              id="vintageMax"
              type="number"
              placeholder="e.g., 2020"
              value={value.vintageMax}
              onChange={(e) => handleFilterChange('vintageMax', e.target.value)}
              className="rounded-xl border px-3 py-2"
            />
          </div>

          {/* Sort Filter */}
          <div className="space-y-2">
            <Label htmlFor="sort">Sort By</Label>
            <Select
              value={`${value.sort.field}-${value.sort.direction}`}
              onValueChange={handleSortChange}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem 
                    key={`${option.value}-${option.direction}`} 
                    value={`${option.value}-${option.direction}`}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Hide Drunk Toggle */}
          <div className="space-y-2">
            <Label htmlFor="hideDrunk" className="flex items-center space-x-2">
              <input
                id="hideDrunk"
                type="checkbox"
                checked={value.status === WineStatus.CELLARED}
                onChange={(e) => handleFilterChange('status', e.target.checked ? WineStatus.CELLARED : 'All')}
                className="rounded border-gray-300"
              />
              <span>Hide drunk bottles</span>
            </Label>
          </div>
        </div>
      )}
    </div>
  )
}
