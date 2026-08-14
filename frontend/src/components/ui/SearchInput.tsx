"use client"

import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchInput({ value, onChange, placeholder = "Search..." }: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="!pl-9 !pr-8"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => onChange("")}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
