"use client"

import { Search, X } from "lucide-react"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder }: SearchInputProps) {
  return (
    <div className="input-group input-group--search ml-auto">
      <span className="input-group__text">
        <Search className="h-4 w-4" />
      </span>
      <input
        className="input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="mr-1.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-gray-100 hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
