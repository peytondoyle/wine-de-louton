import * as React from "react"
import { X } from "lucide-react"
import { cn } from "../../lib/utils"

export interface PillInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

const PillInput = React.forwardRef<HTMLDivElement, PillInputProps>(
  ({ value, onChange, placeholder = "Add items...", className }, ref) => {
    const [inputValue, setInputValue] = React.useState("")

    const canonicalize = (item: string): string => {
      return item.trim().replace(/\s+/g, ' ')
    }

    const addItem = (item: string) => {
      const canonicalized = canonicalize(item)
      if (canonicalized) {
        // Case-insensitive deduplication
        const exists = value.some(existing => 
          existing.toLowerCase() === canonicalized.toLowerCase()
        )
        if (!exists) {
          onChange([...value, canonicalized])
        }
      }
    }

    const removeItem = (index: number) => {
      onChange(value.filter((_, i) => i !== index))
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" || e.key === ",") {
        e.preventDefault()
        addItem(inputValue)
        setInputValue("")
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        removeItem(value.length - 1)
      }
    }

    const handleBlur = () => {
      if (inputValue.trim()) {
        addItem(inputValue)
        setInputValue("")
      }
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex min-h-10 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          className
        )}
      >
        {value.map((item, index) => (
          <div
            key={index}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs"
          >
            <span>{item}</span>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="ml-1 rounded-full hover:bg-secondary-foreground/20"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
    )
  }
)
PillInput.displayName = "PillInput"

export { PillInput }
