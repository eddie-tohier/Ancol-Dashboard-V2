interface FilterSelectProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  label?: string
}

export default function FilterSelect({ value, onChange, options, label }: FilterSelectProps) {
  return (
    <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
      {label && <span className="hidden md:inline">{label}</span>}
      <select className="compact-input h-8" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}
