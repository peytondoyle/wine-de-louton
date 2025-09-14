import React, { useState } from 'react'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'

interface VarietalsInputProps {
  value?: string[]
  onChange: (value: string[]) => void
}

export const VarietalsInput = ({ value = [], onChange }: VarietalsInputProps) => {
  const [draft, setDraft] = useState("")
  
  const add = () => {
    const t = draft.trim()
    if (!t) return
    onChange([...value, t])
    setDraft("")
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((v, i) => (
          <Badge key={i} variant="neutral" className="inline-flex items-center gap-1">
            {v}
            <button 
              type="button" 
              aria-label={`Remove ${v}`} 
              onClick={() => onChange(value.filter((x) => x !== v))} 
              className="text-neutral-500 hover:text-neutral-800"
            >
              ×
            </button>
          </Badge>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Input 
          value={draft} 
          onChange={(e) => setDraft(e.target.value)} 
          placeholder="Add varietal…" 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }} 
        />
        <Button type="button" size="sm" variant="outline" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  )
}
